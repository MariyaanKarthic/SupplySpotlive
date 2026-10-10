const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { authenticate, authorize } = require('../middleware/auth');
const { db } = require('../config/database');
const { cacheResponse, getCachedResponse, delByPrefix } = require('../config/redis');
const logger = require('../config/logger');

const router = express.Router();

const STATUSES = ['new', 'pending_approval', 'approved', 'sent', 'acknowledged', 'partially_received', 'received', 'closed', 'cancelled'];
const EDITABLE_STATUSES = ['new', 'pending_approval'];
const READ_ROLES = ['admin', 'procurement_manager', 'finance_manager', 'ap_clerk', 'viewer'];
const WRITE_ROLES = ['admin', 'procurement_manager'];

const parseJson = (value) => (typeof value === 'string' ? JSON.parse(value || '[]') : (value || []));
const round2 = (n) => Math.round(Number(n) * 100) / 100;
const today = () => new Date().toISOString().split('T')[0];
const clearListCache = () => delByPrefix('purchase_orders:');

// Accepts both the stored shape ({ description, totalAmount }) and older UI shapes ({ item, total }).
function normalizeLineItems(items) {
  return (items || [])
    .map((li) => {
      const quantity = Number(li.quantity) || 0;
      const unitPrice = Number(li.unitPrice ?? li.unit_price) || 0;
      return {
        description: String(li.description ?? li.item ?? '').trim(),
        quantity,
        unitPrice,
        totalAmount: round2(quantity * unitPrice),
        deliveryDate: li.deliveryDate || null,
        receivedQuantity: Number(li.receivedQuantity) || 0,
      };
    })
    .filter((li) => li.description);
}

const sumLineItems = (items) => round2(items.reduce((acc, li) => acc + li.totalAmount, 0));

async function enrichPOs(pos) {
  if (!pos.length) return pos;
  const vendorIds = [...new Set(pos.map(p => p.vendor_id))];
  const rfqIds = [...new Set(pos.map(p => p.rfq_id).filter(Boolean))];
  const vendors = await db('vendors').whereIn('id', vendorIds).select('id', 'name', 'contact_info');
  const rfqs = rfqIds.length ? await db('rfqs').whereIn('id', rfqIds).select('id', 'rfq_number') : [];
  const vendorMap = Object.fromEntries(vendors.map(v => [v.id, v]));
  const rfqMap = Object.fromEntries(rfqs.map(r => [r.id, r.rfq_number]));
  return pos.map(po => {
    const vendor = vendorMap[po.vendor_id];
    let contact = {};
    try { contact = vendor ? parseJson(vendor.contact_info) : {}; } catch { contact = {}; }
    return {
      ...po,
      vendor_name: vendor?.name || 'Unknown',
      vendor_email: contact?.email || null,
      rfq_number: po.rfq_id ? (rfqMap[po.rfq_id] || null) : null,
      line_items: parseJson(po.line_items),
      attachments: parseJson(po.attachments),
    };
  });
}

async function nextPoNumber() {
  const prefix = `PO-${new Date().getFullYear()}-`;
  const rows = await db('purchase_orders').where('po_number', 'like', `${prefix}%`).select('po_number');
  const max = rows.reduce((acc, r) => Math.max(acc, parseInt(r.po_number.slice(prefix.length), 10) || 0), 0);
  return `${prefix}${String(max + 1).padStart(4, '0')}`;
}

// Moves a PO from one of `from` statuses to `to`; responds 409 when the PO is in any other state.
async function transition(req, res, { from, to, extra = {}, audit }) {
  const po = await db('purchase_orders').where('id', req.params.id).first();
  if (!po) return res.status(404).json({ success: false, error: 'Purchase order not found' });
  if (!from.includes(po.status)) {
    return res.status(409).json({ success: false, error: `Cannot change a PO from "${po.status}" to "${to}"` });
  }
  const [updated] = await db('purchase_orders').where('id', po.id)
    .update({ status: to, ...extra, updated_by: req.user.id, updated_at: new Date() }).returning('*');
  await clearListCache();
  logger.logAudit(audit, req.user.id, { poId: po.id, from: po.status, to });
  const [enriched] = await enrichPOs([updated]);
  return res.json({ success: true, data: enriched });
}

const handle = (label, fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    logger.error(`${label} error:`, error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// GET /purchase-orders
router.get('/', [
  authenticate,
  authorize(...READ_ROLES),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
  query('status').optional().isIn(STATUSES),
  query('vendorId').optional().isUUID(),
], handle('Get POs', async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });

  const { page = 1, limit = 20, search, status, vendorId } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const cacheKey = `purchase_orders:${JSON.stringify(req.query)}`;
  const cached = await getCachedResponse(cacheKey, 60);
  if (cached) return res.json({ success: true, data: cached });

  let q = db('purchase_orders');
  if (status) q = q.where('status', status);
  if (vendorId) q = q.where('vendor_id', vendorId);
  if (search) {
    const term = `%${search.toLowerCase()}%`;
    q = q.where(b => b
      .whereRaw('lower(po_number) like ?', [term])
      .orWhereIn('vendor_id', db('vendors').select('id').whereRaw('lower(name) like ?', [term])));
  }

  const total = await q.clone().count('id as count').first();
  const pos = await q.orderBy('created_at', 'desc').limit(parseInt(limit)).offset(offset);
  const enriched = await enrichPOs(pos);

  const result = {
    purchaseOrders: enriched,
    pagination: { page: parseInt(page), limit: parseInt(limit), total: Number(total.count), totalPages: Math.ceil(Number(total.count) / parseInt(limit)) }
  };

  await cacheResponse(cacheKey, result, 60);
  res.json({ success: true, data: result });
}));

// GET /purchase-orders/:id
router.get('/:id', [authenticate, authorize(...READ_ROLES)], handle('Get PO', async (req, res) => {
  const po = await db('purchase_orders').where('id', req.params.id).first();
  if (!po) return res.status(404).json({ success: false, error: 'Purchase order not found' });
  const [enriched] = await enrichPOs([po]);
  res.json({ success: true, data: enriched });
}));

// POST /purchase-orders
router.post('/', [
  authenticate,
  authorize(...WRITE_ROLES),
  body('vendorId').isUUID().withMessage('Choose a vendor'),
  body('issueDate').isDate().withMessage('Issue date is required'),
  body('expectedDeliveryDate').isDate().withMessage('Expected delivery date is required'),
  body('lineItems').optional().isArray(),
  body('totalAmount').optional().isFloat({ min: 0 }),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('submitForApproval').optional().isBoolean(),
], handle('Create PO', async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array()[0].msg, details: errors.array() });

  const vendor = await db('vendors').where('id', req.body.vendorId).first();
  if (!vendor) return res.status(400).json({ success: false, error: 'Vendor not found' });
  if (req.body.expectedDeliveryDate < req.body.issueDate) {
    return res.status(400).json({ success: false, error: 'Expected delivery must be on or after the issue date' });
  }

  const lineItems = normalizeLineItems(req.body.lineItems);
  const totalAmount = lineItems.length ? sumLineItems(lineItems) : Number(req.body.totalAmount || 0);
  if (!(totalAmount > 0)) return res.status(400).json({ success: false, error: 'Add at least one line item with a quantity and price' });

  const data = {
    id: uuidv4(),
    po_number: await nextPoNumber(),
    vendor_id: req.body.vendorId,
    rfq_id: req.body.rfqId || null,
    total_amount: totalAmount,
    currency: req.body.currency || 'USD',
    status: req.body.submitForApproval ? 'pending_approval' : 'new',
    priority: req.body.priority || 'medium',
    acknowledgment_status: 'pending',
    issue_date: req.body.issueDate,
    expected_delivery_date: req.body.expectedDeliveryDate,
    delivery_address: req.body.deliveryAddress,
    terms: req.body.terms,
    notes: req.body.notes,
    line_items: JSON.stringify(lineItems),
    attachments: JSON.stringify([]),
    created_by: req.user.id,
    updated_by: req.user.id,
  };

  const [po] = await db('purchase_orders').insert(data).returning('*');
  await clearListCache();
  logger.logAudit('PO_CREATED', req.user.id, { poId: po.id, poNumber: po.po_number });
  const [enriched] = await enrichPOs([po]);
  res.status(201).json({ success: true, data: enriched });
}));

// PUT /purchase-orders/:id — only drafts and POs awaiting approval can be edited
const UPDATABLE_FIELDS = {
  vendorId: 'vendor_id',
  rfqId: 'rfq_id',
  currency: 'currency',
  priority: 'priority',
  issueDate: 'issue_date',
  expectedDeliveryDate: 'expected_delivery_date',
  deliveryAddress: 'delivery_address',
  terms: 'terms',
  notes: 'notes',
};

router.put('/:id', [
  authenticate,
  authorize(...WRITE_ROLES),
  body('vendorId').optional().isUUID(),
  body('issueDate').optional().isDate(),
  body('expectedDeliveryDate').optional().isDate(),
  body('lineItems').optional().isArray(),
  body('priority').optional().isIn(['low', 'medium', 'high']),
], handle('Update PO', async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array()[0].msg, details: errors.array() });

  const po = await db('purchase_orders').where('id', req.params.id).first();
  if (!po) return res.status(404).json({ success: false, error: 'Purchase order not found' });
  if (!EDITABLE_STATUSES.includes(po.status)) {
    return res.status(409).json({ success: false, error: 'Only draft or pending-approval POs can be edited' });
  }

  const updateData = { updated_by: req.user.id, updated_at: new Date() };
  for (const [key, column] of Object.entries(UPDATABLE_FIELDS)) {
    if (req.body[key] !== undefined) updateData[column] = req.body[key];
  }
  if (updateData.vendor_id && !(await db('vendors').where('id', updateData.vendor_id).first())) {
    return res.status(400).json({ success: false, error: 'Vendor not found' });
  }
  if (req.body.lineItems) {
    const lineItems = normalizeLineItems(req.body.lineItems);
    if (!lineItems.length) return res.status(400).json({ success: false, error: 'Add at least one line item' });
    updateData.line_items = JSON.stringify(lineItems);
    updateData.total_amount = sumLineItems(lineItems);
  }

  const [updated] = await db('purchase_orders').where('id', po.id).update(updateData).returning('*');
  await clearListCache();
  logger.logAudit('PO_UPDATED', req.user.id, { poId: po.id });
  const [enriched] = await enrichPOs([updated]);
  res.json({ success: true, data: enriched });
}));

// POST /purchase-orders/:id/submit
router.post('/:id/submit', [authenticate, authorize(...WRITE_ROLES)], handle('Submit PO', (req, res) =>
  transition(req, res, { from: ['new'], to: 'pending_approval', audit: 'PO_SUBMITTED' })));

// POST /purchase-orders/:id/approve
router.post('/:id/approve', [authenticate, authorize(...WRITE_ROLES)], handle('Approve PO', (req, res) =>
  transition(req, res, { from: ['new', 'pending_approval'], to: 'approved', audit: 'PO_APPROVED' })));

// POST /purchase-orders/:id/send
router.post('/:id/send', [authenticate, authorize(...WRITE_ROLES)], handle('Send PO', (req, res) =>
  transition(req, res, { from: ['approved'], to: 'sent', audit: 'PO_SENT' })));

// POST /purchase-orders/:id/acknowledge — records the vendor's confirmation
router.post('/:id/acknowledge', [authenticate, authorize(...WRITE_ROLES)], handle('Acknowledge PO', (req, res) =>
  transition(req, res, {
    from: ['sent'],
    to: 'acknowledged',
    extra: { acknowledgment_status: 'acknowledged', acknowledgment_date: today() },
    audit: 'PO_ACKNOWLEDGED',
  })));

// POST /purchase-orders/:id/receive-goods
// Body: { items?: [{ index, receivedQuantity }] } — cumulative received quantity per line; omit to receive everything.
router.post('/:id/receive-goods', [
  authenticate,
  authorize('admin', 'procurement_manager', 'ap_clerk'),
  body('items').optional().isArray(),
], handle('Receive goods', async (req, res) => {
  const po = await db('purchase_orders').where('id', req.params.id).first();
  if (!po) return res.status(404).json({ success: false, error: 'Purchase order not found' });
  if (!['sent', 'acknowledged', 'partially_received'].includes(po.status)) {
    return res.status(409).json({ success: false, error: `Cannot receive goods on a PO that is "${po.status}"` });
  }

  const lineItems = normalizeLineItems(parseJson(po.line_items));
  const received = req.body.items;
  lineItems.forEach((li, index) => {
    const entry = Array.isArray(received) ? received.find(r => Number(r.index) === index) : null;
    const qty = Array.isArray(received) ? (entry ? Number(entry.receivedQuantity) || 0 : li.receivedQuantity) : li.quantity;
    li.receivedQuantity = Math.max(0, Math.min(li.quantity, qty));
  });
  const allReceived = lineItems.length === 0 || lineItems.every(li => li.receivedQuantity >= li.quantity);
  const anyReceived = lineItems.some(li => li.receivedQuantity > 0);
  const status = allReceived ? 'received' : anyReceived ? 'partially_received' : po.status;

  const [updated] = await db('purchase_orders').where('id', po.id)
    .update({ status, line_items: JSON.stringify(lineItems), updated_by: req.user.id, updated_at: new Date() }).returning('*');
  await clearListCache();
  logger.logAudit('GOODS_RECEIVED', req.user.id, { poId: po.id, status });
  const [enriched] = await enrichPOs([updated]);
  res.json({ success: true, data: enriched });
}));

// POST /purchase-orders/:id/close
router.post('/:id/close', [authenticate, authorize(...WRITE_ROLES)], handle('Close PO', (req, res) =>
  transition(req, res, { from: ['received', 'partially_received'], to: 'closed', audit: 'PO_CLOSED' })));

// POST /purchase-orders/:id/cancel
router.post('/:id/cancel', [authenticate, authorize(...WRITE_ROLES)], handle('Cancel PO', (req, res) =>
  transition(req, res, { from: ['new', 'pending_approval', 'approved', 'sent', 'acknowledged'], to: 'cancelled', audit: 'PO_CANCELLED' })));

module.exports = router;
