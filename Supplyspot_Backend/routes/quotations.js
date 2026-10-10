const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { authenticate, authorize } = require('../middleware/auth');
const { db } = require('../config/database');
const logger = require('../config/logger');
const {
  OPEN_RFQ_STATUSES, QUOTATION_STATUSES, PENDING_QUOTATION_STATUSES, parseJson, round2, nowTs, today, toDateOnly, historyEntry,
  nextNumber, clearCaches, enrichQuotations,
} = require('../services/sourcing');

const router = express.Router();

// Quotation statuses: submitted → reviewed → accepted | rejected. Rejected quotations can be archived out of the way.
// Accepting a quotation awards its RFQ, declines the other pending quotations and creates a draft purchase order.
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

async function loadQuotation(req, res) {
  const quotation = await db('quotations').where('id', req.params.id).first();
  if (!quotation) {
    res.status(404).json({ success: false, error: 'Quotation not found' });
    return {};
  }
  const rfq = quotation.rfq_id ? await db('rfqs').where('id', quotation.rfq_id).first() : null;
  return { quotation, rfq };
}

async function respondWithQuotation(res, id, status = 200) {
  const quotation = await db('quotations').where('id', id).first();
  const [enriched] = await enrichQuotations([quotation]);
  return res.status(status).json({ success: true, data: enriched });
}

const appendRfqHistory = (rfq, user, action, comment) =>
  JSON.stringify([...parseJson(rfq.history), historyEntry(user, action, comment)]);

// Quotation lines: { rfqItemIndex?, description?, quantity, unitPrice, unit? }. A line tied to an RFQ item
// takes that item's description and unit when none is given.
function normalizeQuoteItems(items, rfqItems) {
  return (items || [])
    .map((li, position) => {
      const index = li.rfqItemIndex === null || li.rfqItemIndex === undefined || li.rfqItemIndex === '' ? null : Number(li.rfqItemIndex);
      const rfqItem = index !== null && rfqItems[index] ? rfqItems[index] : null;
      const quantity = Number(li.quantity ?? rfqItem?.quantity) || 0;
      const unitPrice = Number(li.unitPrice ?? li.unit_price) || 0;
      return {
        rfq_item_index: rfqItem ? index : null,
        position,
        description: String(li.description ?? rfqItem?.description ?? '').trim(),
        quantity,
        unit: String(li.unit ?? rfqItem?.unit ?? '').trim() || 'pcs',
        unit_price: round2(unitPrice),
        total_price: round2(quantity * unitPrice),
      };
    })
    .filter((li) => li.description);
}

// GET /quotations — filters: rfq_id, vendor_id, status, include_archived
router.get('/', [
  authenticate,
  authorize(...READ_ROLES),
  query('rfq_id').optional().isString(),
  query('vendor_id').optional().isString(),
  query('status').optional().isIn(QUOTATION_STATUSES),
  query('include_archived').optional().isBoolean(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
], handle('Get quotations', async (req, res) => {
  if (validationFailed(req, res)) return;
  const { rfq_id: rfqId, vendor_id: vendorId, status, include_archived: includeArchived, page = 1, limit = 50 } = req.query;
  let q = db('quotations');
  if (rfqId) q = q.where('rfq_id', rfqId);
  if (vendorId) q = q.where('vendor_id', vendorId);
  if (status) q = q.where('status', status);
  if (includeArchived !== 'true') q = q.whereNull('archived_at');
  const total = await q.clone().count('id as count').first();
  const rows = await q.orderBy('created_at', 'desc').limit(parseInt(limit)).offset((parseInt(page) - 1) * parseInt(limit));
  res.json({
    success: true,
    data: {
      quotations: await enrichQuotations(rows),
      pagination: { page: parseInt(page), limit: parseInt(limit), total: Number(total.count), totalPages: Math.ceil(Number(total.count) / parseInt(limit)) },
    },
  });
}));

// GET /quotations/:id
router.get('/:id', [authenticate, authorize(...READ_ROLES)], handle('Get quotation', async (req, res) => {
  const { quotation } = await loadQuotation(req, res);
  if (!quotation) return;
  return respondWithQuotation(res, quotation.id);
}));

// POST /quotations — records a vendor's quotation against an RFQ that has been sent.
// Body: { rfqId, vendorId, items: [{ rfqItemIndex?, description?, quantity?, unitPrice, unit? }], deliveryDate, paymentTerms?, validUntil?, notes?, currency? }
// There is no supplier portal yet, so buyers enter quotations they receive by email or on paper.
router.post('/', [
  authenticate,
  authorize(...WRITE_ROLES),
  body('rfqId').isString().notEmpty().withMessage('Choose the RFQ this quotation answers'),
  body('vendorId').isString().notEmpty().withMessage('Choose the vendor'),
  body('items').isArray({ min: 1 }).withMessage('Price at least one item'),
  body('deliveryDate').isDate().withMessage('Add the promised delivery date'),
  body('validUntil').optional({ values: 'falsy' }).isDate().withMessage('Valid-until is not a valid date'),
  body('paymentTerms').optional().trim(),
  body('notes').optional().trim(),
], handle('Submit quotation', async (req, res) => {
  if (validationFailed(req, res)) return;
  const rfq = await db('rfqs').where('id', req.body.rfqId).first();
  if (!rfq) return res.status(404).json({ success: false, error: 'RFQ not found' });
  if (!OPEN_RFQ_STATUSES.includes(rfq.status)) {
    const why = rfq.status === 'draft' ? 'has not been sent yet' : `is ${rfq.status.replace('_', ' ')}`;
    return res.status(409).json({ success: false, error: `This RFQ ${why}, so it cannot take quotations` });
  }
  const vendorIds = parseJson(rfq.vendor_ids);
  if (!vendorIds.includes(req.body.vendorId)) {
    return res.status(400).json({ success: false, error: 'This vendor was not invited to the RFQ' });
  }
  const existing = await db('quotations').where({ rfq_id: rfq.id, vendor_id: req.body.vendorId }).whereIn('status', PENDING_QUOTATION_STATUSES).first();
  if (existing) {
    return res.status(409).json({ success: false, error: `This vendor already has an open quotation (${existing.quotation_number}). Reject it first to record a revised one.` });
  }

  const rfqItems = parseJson(rfq.items);
  const lines = normalizeQuoteItems(req.body.items, rfqItems);
  if (!lines.length) return res.status(400).json({ success: false, error: 'Price at least one item' });
  if (lines.some((li) => !(li.quantity > 0))) return res.status(400).json({ success: false, error: 'Each line needs a quantity above 0' });
  if (lines.some((li) => li.unit_price < 0)) return res.status(400).json({ success: false, error: 'Prices cannot be negative' });
  const total = round2(lines.reduce((acc, li) => acc + li.total_price, 0));
  if (!(total > 0)) return res.status(400).json({ success: false, error: 'The quotation total must be above 0' });

  const quotation = {
    id: uuidv4(),
    quotation_number: await nextNumber('quotations', 'quotation_number', 'QT'),
    rfq_id: rfq.id,
    vendor_id: req.body.vendorId,
    total_amount: total,
    currency: req.body.currency || rfq.currency || 'INR',
    submitted_date: today(),
    submitted_at: nowTs(),
    valid_until: req.body.validUntil || null,
    delivery_date: req.body.deliveryDate,
    payment_terms: req.body.paymentTerms || null,
    status: 'submitted',
    notes: req.body.notes || null,
    attachments: JSON.stringify([]),
    created_by: req.user.id,
    updated_by: req.user.id,
    created_at: nowTs(),
    updated_at: nowTs(),
  };

  const vendor = await db('vendors').where('id', req.body.vendorId).select('name').first();
  await db.transaction(async (trx) => {
    await trx('quotations').insert(quotation);
    await trx('quotation_items').insert(lines.map((li) => ({ id: uuidv4(), quotation_id: quotation.id, ...li })));
    const update = { history: appendRfqHistory(rfq, req.user, 'quotation_received', `${vendor?.name || 'Vendor'} · ${quotation.quotation_number}`), updated_at: nowTs() };
    if (rfq.status === 'sent') update.status = 'quotations_received';
    await trx('rfqs').where('id', rfq.id).update(update);
  });
  await clearCaches();
  logger.logAudit('QUOTATION_SUBMITTED', req.user.id, { quotationId: quotation.id, rfqId: rfq.id, vendorId: quotation.vendor_id });
  return respondWithQuotation(res, quotation.id, 201);
}));

// POST /quotations/:id/review — marks a quotation as reviewed and moves its RFQ into review
router.post('/:id/review', [authenticate, authorize(...WRITE_ROLES)], handle('Review quotation', async (req, res) => {
  const { quotation, rfq } = await loadQuotation(req, res);
  if (!quotation) return;
  if (quotation.status !== 'submitted') return res.status(409).json({ success: false, error: `This quotation is already ${quotation.status}` });
  if (!rfq || !OPEN_RFQ_STATUSES.includes(rfq.status)) return res.status(409).json({ success: false, error: 'The RFQ is no longer open' });
  await db.transaction(async (trx) => {
    await trx('quotations').where('id', quotation.id).update({ status: 'reviewed', reviewed_at: nowTs(), updated_by: req.user.id, updated_at: nowTs() });
    if (rfq.status !== 'under_review') {
      await trx('rfqs').where('id', rfq.id).update({ status: 'under_review', history: appendRfqHistory(rfq, req.user, 'review_started'), updated_at: nowTs() });
    }
  });
  await clearCaches();
  logger.logAudit('QUOTATION_REVIEWED', req.user.id, { quotationId: quotation.id });
  return respondWithQuotation(res, quotation.id);
}));

// POST /quotations/:id/accept — body: { notes? }. Awards the RFQ and creates a draft purchase order from the quotation.
router.post('/:id/accept', [
  authenticate,
  authorize(...WRITE_ROLES),
  body('notes').optional().trim(),
], handle('Accept quotation', async (req, res) => {
  const { quotation, rfq } = await loadQuotation(req, res);
  if (!quotation) return;
  if (!PENDING_QUOTATION_STATUSES.includes(quotation.status)) {
    return res.status(409).json({ success: false, error: `This quotation is already ${quotation.status}` });
  }
  if (!rfq || !OPEN_RFQ_STATUSES.includes(rfq.status)) {
    return res.status(409).json({ success: false, error: rfq?.status === 'awarded' ? 'This RFQ has already been awarded' : 'The RFQ is no longer open' });
  }
  const validUntil = toDateOnly(quotation.valid_until);
  if (validUntil && validUntil < today()) {
    return res.status(409).json({ success: false, error: `This quotation expired on ${validUntil}. Ask the vendor to confirm the price and record a revised quotation.` });
  }

  const vendor = await db('vendors').where('id', quotation.vendor_id).first();
  const items = await db('quotation_items').where('quotation_id', quotation.id).orderBy('position', 'asc');
  const deliveryDate = toDateOnly(quotation.delivery_date);
  const lineItems = items.map((it) => ({
    description: it.description,
    quantity: Number(it.quantity) || 0,
    unitPrice: Number(it.unit_price) || 0,
    totalAmount: Number(it.total_price) || 0,
    deliveryDate,
    receivedQuantity: 0,
  }));
  const pr = rfq.purchase_request_id ? await db('purchase_requests').where('id', rfq.purchase_request_id).select('pr_number').first() : null;
  const source = [`Awarded from ${rfq.rfq_number} (${quotation.quotation_number})`, pr ? `for ${pr.pr_number}` : null].filter(Boolean).join(' ');

  let po;
  await db.transaction(async (trx) => {
    po = {
      id: uuidv4(),
      po_number: await nextNumber('purchase_orders', 'po_number', 'PO', trx),
      rfq_id: rfq.id,
      vendor_id: quotation.vendor_id,
      total_amount: Number(quotation.total_amount),
      currency: quotation.currency || rfq.currency || 'INR',
      status: 'new',
      priority: rfq.priority || 'medium',
      acknowledgment_status: 'pending',
      issue_date: today(),
      expected_delivery_date: deliveryDate && deliveryDate >= today() ? deliveryDate : today(),
      terms: quotation.payment_terms || null,
      notes: [`${source}.`, req.body.notes].filter(Boolean).join('\n\n'),
      line_items: JSON.stringify(lineItems),
      attachments: JSON.stringify([]),
      created_by: req.user.id,
      updated_by: req.user.id,
    };
    await trx('purchase_orders').insert(po);
    await trx('quotations').where('id', quotation.id).update({
      status: 'accepted', decided_at: nowTs(), purchase_order_id: po.id, updated_by: req.user.id, updated_at: nowTs(),
    });
    await trx('quotations').where('rfq_id', rfq.id).whereNot('id', quotation.id).whereIn('status', PENDING_QUOTATION_STATUSES).update({
      status: 'rejected', rejection_reason: `Not selected. ${rfq.rfq_number} was awarded to ${vendor?.name || 'another vendor'}.`,
      decided_at: nowTs(), updated_by: req.user.id, updated_at: nowTs(),
    });
    const history = [...parseJson(rfq.history),
      historyEntry(req.user, 'awarded', `${vendor?.name || 'Vendor'} · ${quotation.quotation_number}`),
      historyEntry(req.user, 'po_created', po.po_number)];
    await trx('rfqs').where('id', rfq.id).update({
      status: 'awarded', awarded_vendor_id: quotation.vendor_id, awarded_amount: Number(quotation.total_amount),
      awarded_quotation_id: quotation.id, awarded_at: nowTs(), history: JSON.stringify(history), updated_by: req.user.id, updated_at: nowTs(),
    });
  });
  await clearCaches();
  logger.logAudit('QUOTATION_ACCEPTED', req.user.id, { quotationId: quotation.id, rfqId: rfq.id, poId: po.id, poNumber: po.po_number });

  const [enriched] = await enrichQuotations([await db('quotations').where('id', quotation.id).first()]);
  res.json({ success: true, data: { ...enriched, purchase_order: { id: po.id, po_number: po.po_number, status: po.status } } });
}));

// POST /quotations/:id/reject — body: { reason }
router.post('/:id/reject', [
  authenticate,
  authorize(...WRITE_ROLES),
  body('reason').trim().notEmpty().withMessage('Give a reason for rejecting'),
], handle('Reject quotation', async (req, res) => {
  if (validationFailed(req, res)) return;
  const { quotation, rfq } = await loadQuotation(req, res);
  if (!quotation) return;
  if (!PENDING_QUOTATION_STATUSES.includes(quotation.status)) {
    return res.status(409).json({ success: false, error: `This quotation is already ${quotation.status}` });
  }
  if (!rfq || !OPEN_RFQ_STATUSES.includes(rfq.status)) return res.status(409).json({ success: false, error: 'The RFQ is no longer open' });
  const vendor = await db('vendors').where('id', quotation.vendor_id).select('name').first();
  await db.transaction(async (trx) => {
    await trx('quotations').where('id', quotation.id).update({
      status: 'rejected', rejection_reason: req.body.reason, decided_at: nowTs(), updated_by: req.user.id, updated_at: nowTs(),
    });
    const update = { history: appendRfqHistory(rfq, req.user, 'quotation_rejected', `${vendor?.name || 'Vendor'} · ${quotation.quotation_number}: ${req.body.reason}`), updated_at: nowTs() };
    if (rfq.status === 'quotations_received') update.status = 'under_review';
    await trx('rfqs').where('id', rfq.id).update(update);
  });
  await clearCaches();
  logger.logAudit('QUOTATION_REJECTED', req.user.id, { quotationId: quotation.id });
  return respondWithQuotation(res, quotation.id);
}));

// POST /quotations/:id/archive and /unarchive — hides a rejected quotation from the RFQ and the comparison
router.post('/:id/archive', [authenticate, authorize(...WRITE_ROLES)], handle('Archive quotation', async (req, res) => {
  const { quotation } = await loadQuotation(req, res);
  if (!quotation) return;
  if (quotation.status !== 'rejected') return res.status(409).json({ success: false, error: 'Only rejected quotations can be archived' });
  if (quotation.archived_at) return res.status(409).json({ success: false, error: 'This quotation is already archived' });
  await db('quotations').where('id', quotation.id).update({ archived_at: nowTs(), updated_by: req.user.id, updated_at: nowTs() });
  await clearCaches();
  logger.logAudit('QUOTATION_ARCHIVED', req.user.id, { quotationId: quotation.id });
  return respondWithQuotation(res, quotation.id);
}));

router.post('/:id/unarchive', [authenticate, authorize(...WRITE_ROLES)], handle('Unarchive quotation', async (req, res) => {
  const { quotation } = await loadQuotation(req, res);
  if (!quotation) return;
  if (!quotation.archived_at) return res.status(409).json({ success: false, error: 'This quotation is not archived' });
  await db('quotations').where('id', quotation.id).update({ archived_at: null, updated_by: req.user.id, updated_at: nowTs() });
  await clearCaches();
  return respondWithQuotation(res, quotation.id);
}));

module.exports = router;
