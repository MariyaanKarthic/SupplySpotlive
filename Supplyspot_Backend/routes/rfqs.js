const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { authenticate, authorize } = require('../middleware/auth');
const { db } = require('../config/database');
const logger = require('../config/logger');
const {
  RFQ_STATUSES, PENDING_QUOTATION_STATUSES, parseJson, nowTs, today, historyEntry, nextNumber,
  normalizeRfqItems, rfqItemsProblem, clearCaches, rfqFromPurchaseRequest, enrichRFQs, enrichQuotations, buildComparison,
} = require('../services/sourcing');

const router = express.Router();

// Lifecycle: draft → sent → quotations_received → under_review → awarded → closed.
// Quotations are decided under /quotations; accepting one awards the RFQ and creates a draft PO.
const READ_ROLES = ['admin', 'procurement_manager', 'finance_manager', 'ap_clerk', 'viewer'];
const WRITE_ROLES = ['admin', 'procurement_manager'];

const handle = (label, fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    logger.error(`${label} error:`, error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const validationFailed = (req, res) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return false;
  res.status(400).json({ success: false, error: errors.array()[0].msg, details: errors.array() });
  return true;
};

async function loadRFQ(req, res) {
  const rfq = await db('rfqs').where('id', req.params.id).first();
  if (!rfq) res.status(404).json({ success: false, error: 'RFQ not found' });
  return rfq;
}

async function respondWithRFQ(res, id, status = 200) {
  const rfq = await db('rfqs').where('id', id).first();
  const [enriched] = await enrichRFQs([rfq], { withQuotations: true });
  return res.status(status).json({ success: true, data: enriched });
}

async function checkVendors(vendorIds) {
  if (!Array.isArray(vendorIds)) return 'Vendors must be a list';
  const unique = [...new Set(vendorIds)];
  if (!unique.length) return null;
  const found = await db('vendors').whereIn('id', unique).select('id', 'status');
  if (found.length !== unique.length) return 'One or more vendors were not found';
  if (found.some((v) => ['suspended', 'inactive'].includes(v.status))) return 'Suspended or inactive vendors cannot be invited';
  return null;
}

// GET /rfqs — filters: status (one or comma-separated), purchase_request_id, vendor_id (invited or quoted), search
router.get('/', [
  authenticate,
  authorize(...READ_ROLES),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
  query('status').optional().custom((v) => String(v).split(',').every((s) => RFQ_STATUSES.includes(s))).withMessage('Unknown status'),
  query('purchase_request_id').optional().isString(),
  query('vendor_id').optional().isString(),
], handle('Get RFQs', async (req, res) => {
  if (validationFailed(req, res)) return;

  const { page = 1, limit = 20, search, status, purchase_request_id: prId, vendor_id: vendorId } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let q = db('rfqs');
  if (status) q = q.whereIn('status', String(status).split(','));
  if (prId) q = q.where('purchase_request_id', prId);
  if (vendorId) {
    q = q.where((b) => b
      .where('vendor_ids', 'like', `%${vendorId}%`)
      .orWhereIn('id', db('quotations').select('rfq_id').where('vendor_id', vendorId)));
  }
  if (search) {
    const term = `%${search.toLowerCase()}%`;
    q = q.where((b) => b
      .whereRaw('lower(rfq_number) like ?', [term])
      .orWhereRaw('lower(title) like ?', [term])
      .orWhereIn('purchase_request_id', db('purchase_requests').select('id').whereRaw('lower(pr_number) like ?', [term])));
  }

  const total = await q.clone().count('id as count').first();
  const rfqs = await q.orderBy('created_at', 'desc').limit(parseInt(limit)).offset(offset);
  const enriched = await enrichRFQs(rfqs);

  res.json({
    success: true,
    data: {
      rfqs: enriched,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: Number(total.count), totalPages: Math.ceil(Number(total.count) / parseInt(limit)) },
    },
  });
}));

// GET /rfqs/:id — the RFQ with all of its quotations
router.get('/:id', [authenticate, authorize(...READ_ROLES)], handle('Get RFQ', async (req, res) => {
  const rfq = await loadRFQ(req, res);
  if (!rfq) return;
  return respondWithRFQ(res, rfq.id);
}));

// GET /rfqs/:id/comparison — side-by-side comparison of the RFQ's quotations
router.get('/:id/comparison', [authenticate, authorize(...READ_ROLES)], handle('Compare quotations', async (req, res) => {
  const rfq = await loadRFQ(req, res);
  if (!rfq) return;
  const [enriched] = await enrichRFQs([rfq], { withQuotations: true });
  res.json({ success: true, data: buildComparison(enriched, enriched.quotations) });
}));

// POST /rfqs — body: { purchaseRequestId, dueDate, title?, description?, notes?, vendorIds?, send? }
// Without a purchase request: { title, dueDate, items, currency?, budget?, ... }.
router.post('/', [
  authenticate,
  authorize(...WRITE_ROLES),
  body('purchaseRequestId').optional({ values: 'falsy' }).isString().withMessage('Purchase request not found'),
  body('dueDate').isDate().withMessage('Choose a quotation due date'),
  body('title').optional().trim(),
  body('vendorIds').optional().isArray().withMessage('Vendors must be a list'),
  body('items').optional().isArray().withMessage('Items must be a list'),
  body('send').optional().isBoolean(),
], handle('Create RFQ', async (req, res) => {
  if (validationFailed(req, res)) return;
  if (req.body.dueDate < today()) return res.status(400).json({ success: false, error: 'The due date is in the past' });

  const vendorIds = [...new Set(req.body.vendorIds || [])];
  const vendorProblem = await checkVendors(vendorIds);
  if (vendorProblem) return res.status(400).json({ success: false, error: vendorProblem });
  const send = req.body.send === true;
  if (send && !vendorIds.length) return res.status(400).json({ success: false, error: 'Choose at least one vendor to send the RFQ to' });

  let rfq;
  let pr = null;
  if (req.body.purchaseRequestId) {
    pr = await db('purchase_requests').where('id', req.body.purchaseRequestId).first();
    if (!pr) return res.status(404).json({ success: false, error: 'Purchase request not found' });
    if (pr.status !== 'approved') return res.status(409).json({ success: false, error: 'Only approved purchase requests can be sent out for quotation' });
    if (pr.rfq_id) return res.status(409).json({ success: false, error: 'An RFQ already exists for this purchase request' });
    rfq = await rfqFromPurchaseRequest(pr, req.user, {
      dueDate: req.body.dueDate, title: req.body.title, description: req.body.description, notes: req.body.notes, vendorIds,
    });
  } else {
    if (!req.body.title) return res.status(400).json({ success: false, error: 'Give the RFQ a title' });
    const items = normalizeRfqItems(req.body.items);
    const problem = rfqItemsProblem(items);
    if (problem) return res.status(400).json({ success: false, error: problem });
    rfq = {
      id: uuidv4(),
      rfq_number: await nextNumber('rfqs', 'rfq_number', 'RFQ'),
      title: req.body.title,
      description: req.body.description || null,
      category: items[0].category,
      budget: req.body.budget ?? items.reduce((acc, it) => acc + it.budget, 0),
      currency: req.body.currency || 'INR',
      due_date: req.body.dueDate,
      status: 'draft',
      priority: req.body.priority || 'medium',
      items: JSON.stringify(items),
      vendor_ids: JSON.stringify(vendorIds),
      notes: req.body.notes || null,
      attachments: JSON.stringify([]),
      history: JSON.stringify([historyEntry(req.user, 'created')]),
      created_by: req.user.id,
      updated_by: req.user.id,
      created_at: nowTs(),
      updated_at: nowTs(),
    };
  }

  if (send) {
    const history = [...parseJson(rfq.history), historyEntry(req.user, 'sent', `${vendorIds.length} vendor${vendorIds.length === 1 ? '' : 's'}`)];
    Object.assign(rfq, { status: 'sent', sent_at: nowTs(), issued_date: today(), history: JSON.stringify(history) });
  }

  await db.transaction(async (trx) => {
    await trx('rfqs').insert(rfq);
    if (pr) {
      const prHistory = [...parseJson(pr.history), historyEntry(req.user, 'rfq_created', rfq.rfq_number)];
      await trx('purchase_requests').where('id', pr.id)
        .update({ rfq_id: rfq.id, history: JSON.stringify(prHistory), updated_by: req.user.id, updated_at: new Date() });
    }
  });
  await clearCaches();
  logger.logAudit('RFQ_CREATED', req.user.id, { rfqId: rfq.id, rfqNumber: rfq.rfq_number, prId: pr?.id || null, sent: send });
  return respondWithRFQ(res, rfq.id, 201);
}));

// PUT /rfqs/:id — drafts only
const UPDATABLE_FIELDS = { title: 'title', description: 'description', dueDate: 'due_date', notes: 'notes', priority: 'priority' };

router.put('/:id', [
  authenticate,
  authorize(...WRITE_ROLES),
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('dueDate').optional().isDate().withMessage('Due date is not a valid date'),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('vendorIds').optional().isArray().withMessage('Vendors must be a list'),
  body('items').optional().isArray().withMessage('Items must be a list'),
], handle('Update RFQ', async (req, res) => {
  if (validationFailed(req, res)) return;
  const rfq = await loadRFQ(req, res);
  if (!rfq) return;
  if (rfq.status !== 'draft') return res.status(409).json({ success: false, error: 'Only draft RFQs can be edited' });
  if (req.body.dueDate && req.body.dueDate < today()) return res.status(400).json({ success: false, error: 'The due date is in the past' });

  const updateData = { updated_by: req.user.id, updated_at: nowTs() };
  for (const [key, column] of Object.entries(UPDATABLE_FIELDS)) {
    if (req.body[key] !== undefined) updateData[column] = req.body[key] === '' ? null : req.body[key];
  }
  if (req.body.vendorIds) {
    const vendorIds = [...new Set(req.body.vendorIds)];
    const problem = await checkVendors(vendorIds);
    if (problem) return res.status(400).json({ success: false, error: problem });
    updateData.vendor_ids = JSON.stringify(vendorIds);
  }
  if (req.body.items) {
    const items = normalizeRfqItems(req.body.items);
    const problem = rfqItemsProblem(items);
    if (problem) return res.status(400).json({ success: false, error: problem });
    updateData.items = JSON.stringify(items);
  }

  await db('rfqs').where('id', rfq.id).update(updateData);
  await clearCaches();
  logger.logAudit('RFQ_UPDATED', req.user.id, { rfqId: rfq.id });
  return respondWithRFQ(res, rfq.id);
}));

// DELETE /rfqs/:id — drafts only; the purchase request becomes ready for a new RFQ
router.delete('/:id', [authenticate, authorize(...WRITE_ROLES)], handle('Delete RFQ', async (req, res) => {
  const rfq = await loadRFQ(req, res);
  if (!rfq) return;
  if (rfq.status !== 'draft') return res.status(409).json({ success: false, error: 'Only draft RFQs can be deleted' });
  await db.transaction(async (trx) => {
    await trx('purchase_requests').where('rfq_id', rfq.id).update({ rfq_id: null, updated_at: new Date() });
    await trx('rfqs').where('id', rfq.id).del();
  });
  await clearCaches();
  logger.logAudit('RFQ_DELETED', req.user.id, { rfqId: rfq.id, rfqNumber: rfq.rfq_number });
  res.json({ success: true, data: { id: rfq.id } });
}));

// POST /rfqs/:id/send — body: { vendorIds? } (replaces the invited list when given)
router.post('/:id/send', [
  authenticate,
  authorize(...WRITE_ROLES),
  body('vendorIds').optional().isArray().withMessage('Vendors must be a list'),
], handle('Send RFQ', async (req, res) => {
  if (validationFailed(req, res)) return;
  const rfq = await loadRFQ(req, res);
  if (!rfq) return;
  if (rfq.status !== 'draft') return res.status(409).json({ success: false, error: 'This RFQ has already been sent' });

  const vendorIds = req.body.vendorIds ? [...new Set(req.body.vendorIds)] : parseJson(rfq.vendor_ids);
  const vendorProblem = await checkVendors(vendorIds);
  if (vendorProblem) return res.status(400).json({ success: false, error: vendorProblem });
  if (!vendorIds.length) return res.status(400).json({ success: false, error: 'Choose at least one vendor to send the RFQ to' });
  const itemProblem = rfqItemsProblem(normalizeRfqItems(parseJson(rfq.items)));
  if (itemProblem) return res.status(400).json({ success: false, error: itemProblem });
  const dueDate = String(rfq.due_date || '').slice(0, 10);
  if (!dueDate || dueDate < today()) return res.status(400).json({ success: false, error: 'Set a due date in the future before sending' });

  const history = [...parseJson(rfq.history), historyEntry(req.user, 'sent', `${vendorIds.length} vendor${vendorIds.length === 1 ? '' : 's'}`)];
  await db('rfqs').where('id', rfq.id).update({
    status: 'sent', vendor_ids: JSON.stringify(vendorIds), sent_at: nowTs(), issued_date: today(),
    history: JSON.stringify(history), updated_by: req.user.id, updated_at: nowTs(),
  });
  await clearCaches();
  logger.logAudit('RFQ_SENT', req.user.id, { rfqId: rfq.id, vendors: vendorIds.length });
  return respondWithRFQ(res, rfq.id);
}));

// POST /rfqs/:id/start-review — moves an RFQ with quotations into review
router.post('/:id/start-review', [authenticate, authorize(...WRITE_ROLES)], handle('Start RFQ review', async (req, res) => {
  const rfq = await loadRFQ(req, res);
  if (!rfq) return;
  if (!['sent', 'quotations_received'].includes(rfq.status)) {
    return res.status(409).json({ success: false, error: `Cannot start a review on an RFQ that is "${rfq.status}"` });
  }
  const count = await db('quotations').where('rfq_id', rfq.id).whereIn('status', PENDING_QUOTATION_STATUSES).count('id as c').first();
  if (!Number(count.c)) return res.status(409).json({ success: false, error: 'There are no quotations to review yet' });
  const history = [...parseJson(rfq.history), historyEntry(req.user, 'review_started')];
  await db('rfqs').where('id', rfq.id).update({ status: 'under_review', history: JSON.stringify(history), updated_by: req.user.id, updated_at: nowTs() });
  await clearCaches();
  logger.logAudit('RFQ_REVIEW_STARTED', req.user.id, { rfqId: rfq.id });
  return respondWithRFQ(res, rfq.id);
}));

// POST /rfqs/:id/close — body: { reason? }. Ends an RFQ; pending quotations are declined.
router.post('/:id/close', [
  authenticate,
  authorize(...WRITE_ROLES),
  body('reason').optional().trim(),
], handle('Close RFQ', async (req, res) => {
  const rfq = await loadRFQ(req, res);
  if (!rfq) return;
  if (rfq.status === 'closed') return res.status(409).json({ success: false, error: 'This RFQ is already closed' });
  if (rfq.status === 'draft') return res.status(409).json({ success: false, error: 'Delete the draft instead of closing it' });
  const reason = req.body.reason || null;
  if (rfq.status !== 'awarded' && !reason) {
    return res.status(400).json({ success: false, error: 'Give a reason for closing without an award' });
  }

  const history = [...parseJson(rfq.history), historyEntry(req.user, 'closed', reason)];
  await db.transaction(async (trx) => {
    await trx('quotations').where('rfq_id', rfq.id).whereIn('status', PENDING_QUOTATION_STATUSES).update({
      status: 'rejected', rejection_reason: `RFQ closed${reason ? `: ${reason}` : ''}`, decided_at: nowTs(), updated_by: req.user.id, updated_at: nowTs(),
    });
    await trx('rfqs').where('id', rfq.id).update({
      status: 'closed', closed_at: nowTs(), close_reason: reason, history: JSON.stringify(history), updated_by: req.user.id, updated_at: nowTs(),
    });
  });
  await clearCaches();
  logger.logAudit('RFQ_CLOSED', req.user.id, { rfqId: rfq.id, from: rfq.status });
  return respondWithRFQ(res, rfq.id);
}));

// GET /rfqs/:id/quotations — kept for callers that list an RFQ's quotations on their own
router.get('/:id/quotations', [authenticate, authorize(...READ_ROLES)], handle('Get RFQ quotations', async (req, res) => {
  const rfq = await loadRFQ(req, res);
  if (!rfq) return;
  const quotations = await db('quotations').where('rfq_id', rfq.id).orderBy('total_amount', 'asc');
  res.json({ success: true, data: await enrichQuotations(quotations) });
}));

module.exports = router;
