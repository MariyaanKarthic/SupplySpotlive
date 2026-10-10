const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { authenticate, authorize } = require('../middleware/auth');
const { db } = require('../config/database');
const { cacheResponse, getCachedResponse, delByPrefix } = require('../config/redis');
const logger = require('../config/logger');

const router = express.Router();

// Lifecycle: draft → submitted → approved | rejected. A rejected request can be revised back into a draft,
// and an approved one can be turned into an RFQ once.
const STATUSES = ['draft', 'submitted', 'approved', 'rejected'];
const PRIORITIES = ['low', 'medium', 'high'];
const READ_ROLES = ['admin', 'procurement_manager', 'finance_manager', 'ap_clerk', 'viewer'];
const REQUEST_ROLES = ['admin', 'procurement_manager', 'finance_manager', 'ap_clerk'];
const APPROVER_ROLES = ['admin', 'procurement_manager'];

const parseJson = (value) => (typeof value === 'string' ? JSON.parse(value || '[]') : (value || []));
const round2 = (n) => Math.round(Number(n) * 100) / 100;
const clearListCache = () => delByPrefix('purchase_requests:');

function normalizeItems(items) {
  return (items || [])
    .map((it) => ({
      description: String(it.description ?? '').trim(),
      quantity: Number(it.quantity) || 0,
      unit: String(it.unit ?? '').trim() || 'pcs',
      budget: round2(Number(it.budget) || 0),
      category: String(it.category ?? '').trim() || 'Other',
    }))
    .filter((it) => it.description);
}

function itemsProblem(items) {
  if (!items.length) return 'Add at least one item';
  if (items.some((it) => !(it.quantity > 0))) return 'Each item needs a quantity above 0';
  if (items.some((it) => it.budget < 0)) return 'Item budgets cannot be negative';
  return null;
}

const sumBudget = (items) => round2(items.reduce((acc, it) => acc + it.budget, 0));

const historyEntry = (user, action, comment) => ({
  action,
  userId: user.id,
  userName: user.name,
  at: new Date().toISOString(),
  ...(comment ? { comment } : {}),
});

async function enrichPRs(prs) {
  if (!prs.length) return prs;
  const userIds = [...new Set(prs.flatMap((p) => [p.requester_id, p.approver_id]).filter(Boolean))];
  const rfqIds = [...new Set(prs.map((p) => p.rfq_id).filter(Boolean))];
  const users = userIds.length ? await db('users').whereIn('id', userIds).select('id', 'name', 'email') : [];
  const rfqs = rfqIds.length ? await db('rfqs').whereIn('id', rfqIds).select('id', 'rfq_number', 'status') : [];
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
  const rfqMap = Object.fromEntries(rfqs.map((r) => [r.id, r]));
  return prs.map((pr) => ({
    ...pr,
    requester_name: userMap[pr.requester_id]?.name || 'Unknown',
    requester_email: userMap[pr.requester_id]?.email || null,
    approver_name: pr.approver_id ? (userMap[pr.approver_id]?.name || 'Unknown') : null,
    rfq_number: pr.rfq_id ? (rfqMap[pr.rfq_id]?.rfq_number || null) : null,
    rfq_status: pr.rfq_id ? (rfqMap[pr.rfq_id]?.status || null) : null,
    items: parseJson(pr.items),
    history: parseJson(pr.history),
  }));
}

async function nextNumber(table, column, prefixBase) {
  const prefix = `${prefixBase}-${new Date().getFullYear()}-`;
  const rows = await db(table).where(column, 'like', `${prefix}%`).select(column);
  const max = rows.reduce((acc, r) => Math.max(acc, parseInt(r[column].slice(prefix.length), 10) || 0), 0);
  return `${prefix}${String(max + 1).padStart(4, '0')}`;
}

const isOwnerOrAdmin = (req, pr) => pr.requester_id === req.user.id || req.user.role === 'admin';

async function loadPR(req, res) {
  const pr = await db('purchase_requests').where('id', req.params.id).first();
  if (!pr) res.status(404).json({ success: false, error: 'Purchase request not found' });
  return pr;
}

// Saves a status change plus a history entry; responds with the enriched request.
async function saveTransition(req, res, pr, { to, extra = {}, action, comment, audit }) {
  const history = [...parseJson(pr.history), historyEntry(req.user, action, comment)];
  const [updated] = await db('purchase_requests').where('id', pr.id)
    .update({ status: to, ...extra, history: JSON.stringify(history), updated_by: req.user.id, updated_at: new Date() })
    .returning('*');
  await clearListCache();
  logger.logAudit(audit, req.user.id, { prId: pr.id, from: pr.status, to });
  const [enriched] = await enrichPRs([updated]);
  return res.json({ success: true, data: enriched });
}

const conflict = (res, pr, to) =>
  res.status(409).json({ success: false, error: `Cannot change a purchase request from "${pr.status}" to "${to}"` });

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

// GET /purchase-requests
router.get('/', [
  authenticate,
  authorize(...READ_ROLES),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
  query('status').optional().isIn(STATUSES),
  query('priority').optional().isIn(PRIORITIES),
  query('department').optional().trim(),
  query('mine').optional().isBoolean(),
], handle('Get PRs', async (req, res) => {
  if (validationFailed(req, res)) return;

  const { page = 1, limit = 20, search, status, priority, department, mine } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const cacheKey = `purchase_requests:${req.user.id}:${JSON.stringify(req.query)}`;
  const cached = await getCachedResponse(cacheKey, 60);
  if (cached) return res.json({ success: true, data: cached });

  let q = db('purchase_requests');
  if (status) q = q.where('status', status);
  if (priority) q = q.where('priority', priority);
  if (department) q = q.where('department', department);
  if (mine === 'true') q = q.where('requester_id', req.user.id);
  if (search) {
    const term = `%${search.toLowerCase()}%`;
    q = q.where((b) => b.whereRaw('lower(pr_number) like ?', [term]).orWhereRaw('lower(title) like ?', [term]));
  }

  const total = await q.clone().count('id as count').first();
  const prs = await q.orderBy('created_at', 'desc').limit(parseInt(limit)).offset(offset);
  const enriched = await enrichPRs(prs);

  const result = {
    purchaseRequests: enriched,
    pagination: { page: parseInt(page), limit: parseInt(limit), total: Number(total.count), totalPages: Math.ceil(Number(total.count) / parseInt(limit)) },
  };

  await cacheResponse(cacheKey, result, 60);
  res.json({ success: true, data: result });
}));

// GET /purchase-requests/:id
router.get('/:id', [authenticate, authorize(...READ_ROLES)], handle('Get PR', async (req, res) => {
  const pr = await loadPR(req, res);
  if (!pr) return;
  const [enriched] = await enrichPRs([pr]);
  res.json({ success: true, data: enriched });
}));

const itemValidators = [
  body('items').optional().isArray().withMessage('Items must be a list'),
  body('priority').optional().isIn(PRIORITIES).withMessage('Priority must be low, medium or high'),
  body('requestedDate').optional({ values: 'falsy' }).isDate().withMessage('Needed-by date is not a valid date'),
];

// POST /purchase-requests — always starts as a draft unless submit is true
router.post('/', [
  authenticate,
  authorize(...REQUEST_ROLES),
  body('title').trim().notEmpty().withMessage('Give the request a title'),
  body('department').trim().notEmpty().withMessage('Choose a department'),
  body('submit').optional().isBoolean(),
  ...itemValidators,
], handle('Create PR', async (req, res) => {
  if (validationFailed(req, res)) return;

  const items = normalizeItems(req.body.items);
  const problem = itemsProblem(items);
  if (problem) return res.status(400).json({ success: false, error: problem });

  const submit = req.body.submit === true;
  const history = [historyEntry(req.user, 'created')];
  if (submit) history.push(historyEntry(req.user, 'submitted'));

  const data = {
    id: uuidv4(),
    pr_number: await nextNumber('purchase_requests', 'pr_number', 'PR'),
    title: req.body.title,
    status: submit ? 'submitted' : 'draft',
    requester_id: req.user.id,
    department: req.body.department,
    requested_date: req.body.requestedDate || null,
    priority: req.body.priority || 'medium',
    currency: req.body.currency || 'INR',
    budget_total: sumBudget(items),
    items: JSON.stringify(items),
    notes: req.body.notes || null,
    submitted_at: submit ? new Date() : null,
    history: JSON.stringify(history),
    updated_by: req.user.id,
  };

  const [pr] = await db('purchase_requests').insert(data).returning('*');
  await clearListCache();
  logger.logAudit('PR_CREATED', req.user.id, { prId: pr.id, prNumber: pr.pr_number });
  const [enriched] = await enrichPRs([pr]);
  res.status(201).json({ success: true, data: enriched });
}));

// PUT /purchase-requests/:id — drafts only, by the requester or an admin
const UPDATABLE_FIELDS = {
  title: 'title',
  department: 'department',
  requestedDate: 'requested_date',
  priority: 'priority',
  currency: 'currency',
  notes: 'notes',
};

router.put('/:id', [
  authenticate,
  authorize(...REQUEST_ROLES),
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('department').optional().trim().notEmpty().withMessage('Department cannot be empty'),
  ...itemValidators,
], handle('Update PR', async (req, res) => {
  if (validationFailed(req, res)) return;

  const pr = await loadPR(req, res);
  if (!pr) return;
  if (pr.status !== 'draft') return res.status(409).json({ success: false, error: 'Only draft requests can be edited' });
  if (!isOwnerOrAdmin(req, pr)) return res.status(403).json({ success: false, error: 'Only the requester can edit this request' });

  const updateData = { updated_by: req.user.id, updated_at: new Date() };
  for (const [key, column] of Object.entries(UPDATABLE_FIELDS)) {
    if (req.body[key] !== undefined) updateData[column] = req.body[key] === '' ? null : req.body[key];
  }
  if (req.body.items) {
    const items = normalizeItems(req.body.items);
    const problem = itemsProblem(items);
    if (problem) return res.status(400).json({ success: false, error: problem });
    updateData.items = JSON.stringify(items);
    updateData.budget_total = sumBudget(items);
  }

  const [updated] = await db('purchase_requests').where('id', pr.id).update(updateData).returning('*');
  await clearListCache();
  logger.logAudit('PR_UPDATED', req.user.id, { prId: pr.id });
  const [enriched] = await enrichPRs([updated]);
  res.json({ success: true, data: enriched });
}));

// DELETE /purchase-requests/:id — drafts only
router.delete('/:id', [authenticate, authorize(...REQUEST_ROLES)], handle('Delete PR', async (req, res) => {
  const pr = await loadPR(req, res);
  if (!pr) return;
  if (pr.status !== 'draft') return res.status(409).json({ success: false, error: 'Only draft requests can be deleted' });
  if (!isOwnerOrAdmin(req, pr)) return res.status(403).json({ success: false, error: 'Only the requester can delete this request' });
  await db('purchase_requests').where('id', pr.id).del();
  await clearListCache();
  logger.logAudit('PR_DELETED', req.user.id, { prId: pr.id, prNumber: pr.pr_number });
  res.json({ success: true, data: { id: pr.id } });
}));

// POST /purchase-requests/:id/submit
router.post('/:id/submit', [authenticate, authorize(...REQUEST_ROLES)], handle('Submit PR', async (req, res) => {
  const pr = await loadPR(req, res);
  if (!pr) return;
  if (pr.status !== 'draft') return conflict(res, pr, 'submitted');
  if (!isOwnerOrAdmin(req, pr)) return res.status(403).json({ success: false, error: 'Only the requester can submit this request' });
  const problem = itemsProblem(normalizeItems(parseJson(pr.items)));
  if (problem) return res.status(400).json({ success: false, error: problem });
  return saveTransition(req, res, pr, {
    to: 'submitted', action: 'submitted', audit: 'PR_SUBMITTED',
    extra: { submitted_at: new Date(), approver_id: null, approval_date: null, rejection_reason: null },
  });
}));

// POST /purchase-requests/:id/approve — body: { comment? }
router.post('/:id/approve', [
  authenticate,
  authorize(...APPROVER_ROLES),
  body('comment').optional().trim(),
], handle('Approve PR', async (req, res) => {
  const pr = await loadPR(req, res);
  if (!pr) return;
  if (pr.status !== 'submitted') return conflict(res, pr, 'approved');
  if (pr.requester_id === req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'You cannot approve your own request' });
  }
  return saveTransition(req, res, pr, {
    to: 'approved', action: 'approved', comment: req.body.comment, audit: 'PR_APPROVED',
    extra: { approver_id: req.user.id, approval_date: new Date(), rejection_reason: null },
  });
}));

// POST /purchase-requests/:id/reject — body: { reason }
router.post('/:id/reject', [
  authenticate,
  authorize(...APPROVER_ROLES),
  body('reason').trim().notEmpty().withMessage('Give a reason for rejecting'),
], handle('Reject PR', async (req, res) => {
  if (validationFailed(req, res)) return;
  const pr = await loadPR(req, res);
  if (!pr) return;
  if (pr.status !== 'submitted') return conflict(res, pr, 'rejected');
  if (pr.requester_id === req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'You cannot reject your own request' });
  }
  return saveTransition(req, res, pr, {
    to: 'rejected', action: 'rejected', comment: req.body.reason, audit: 'PR_REJECTED',
    extra: { approver_id: req.user.id, approval_date: new Date(), rejection_reason: req.body.reason },
  });
}));

// POST /purchase-requests/:id/revise — reopens a rejected request as a draft so the requester can fix it
router.post('/:id/revise', [authenticate, authorize(...REQUEST_ROLES)], handle('Revise PR', async (req, res) => {
  const pr = await loadPR(req, res);
  if (!pr) return;
  if (pr.status !== 'rejected') return conflict(res, pr, 'draft');
  if (!isOwnerOrAdmin(req, pr)) return res.status(403).json({ success: false, error: 'Only the requester can revise this request' });
  return saveTransition(req, res, pr, { to: 'draft', action: 'revised', audit: 'PR_REVISED' });
}));

// POST /purchase-requests/:id/create-rfq — body: { dueDate, title?, description? }
// Turns an approved request into a draft RFQ, once.
router.post('/:id/create-rfq', [
  authenticate,
  authorize(...APPROVER_ROLES),
  body('dueDate').isDate().withMessage('Choose a quotation due date'),
  body('title').optional().trim(),
  body('description').optional().trim(),
], handle('Create RFQ from PR', async (req, res) => {
  if (validationFailed(req, res)) return;
  const pr = await loadPR(req, res);
  if (!pr) return;
  if (pr.status !== 'approved') return res.status(409).json({ success: false, error: 'Only approved requests can be sent out for quotation' });
  if (pr.rfq_id) return res.status(409).json({ success: false, error: 'An RFQ already exists for this request' });

  const items = parseJson(pr.items);
  const categoryCounts = items.reduce((acc, it) => ({ ...acc, [it.category]: (acc[it.category] || 0) + 1 }), {});
  const category = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const itemLines = items.map((it) => `- ${it.description}: ${it.quantity} ${it.unit || ''}`.trimEnd()).join('\n');
  const description = req.body.description
    || `Created from ${pr.pr_number} (${pr.department}).\n\nItems:\n${itemLines}${pr.notes ? `\n\nNotes: ${pr.notes}` : ''}`;

  const rfq = {
    id: uuidv4(),
    rfq_number: await nextNumber('rfqs', 'rfq_number', 'RFQ'),
    title: req.body.title || pr.title,
    description,
    category,
    budget: pr.budget_total,
    currency: pr.currency || 'INR',
    issued_date: null,
    due_date: req.body.dueDate,
    status: 'draft',
    priority: pr.priority || 'medium',
    attachments: JSON.stringify([]),
    created_by: req.user.id,
    updated_by: req.user.id,
  };

  await db.transaction(async (trx) => {
    await trx('rfqs').insert(rfq);
    const history = [...parseJson(pr.history), historyEntry(req.user, 'rfq_created', rfq.rfq_number)];
    await trx('purchase_requests').where('id', pr.id)
      .update({ rfq_id: rfq.id, history: JSON.stringify(history), updated_by: req.user.id, updated_at: new Date() });
  });
  await clearListCache();
  await delByPrefix('rfqs:');
  logger.logAudit('PR_RFQ_CREATED', req.user.id, { prId: pr.id, rfqId: rfq.id });

  const updated = await db('purchase_requests').where('id', pr.id).first();
  const [enriched] = await enrichPRs([updated]);
  res.status(201).json({ success: true, data: enriched });
}));

module.exports = router;
