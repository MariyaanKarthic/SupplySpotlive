const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { authenticate, authorize } = require('../middleware/auth');
const { db } = require('../config/database');
const { cacheResponse, getCachedResponse, del } = require('../config/redis');
const logger = require('../config/logger');

const router = express.Router();

async function enrichPOs(pos) {
  if (!pos.length) return pos;
  const vendorIds = [...new Set(pos.map(p => p.vendor_id))];
  const vendors = await db('vendors').whereIn('id', vendorIds).select('id', 'name');
  const vendorMap = Object.fromEntries(vendors.map(v => [v.id, v.name]));
  return pos.map(po => ({
    ...po,
    vendor_name: vendorMap[po.vendor_id] || 'Unknown',
    line_items: typeof po.line_items === 'string' ? JSON.parse(po.line_items || '[]') : (po.line_items || []),
    attachments: typeof po.attachments === 'string' ? JSON.parse(po.attachments || '[]') : (po.attachments || []),
  }));
}

// GET /purchase-orders
router.get('/', [
  authenticate,
  authorize('admin', 'procurement_manager', 'finance_manager', 'ap_clerk', 'viewer'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
  query('status').optional().isIn(['new', 'pending_approval', 'approved', 'sent', 'acknowledged', 'partially_received', 'received', 'closed', 'cancelled']),
  query('vendorId').optional().isUUID(),
], async (req, res) => {
  try {
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
    if (search) q = q.where('po_number', 'like', `%${search}%`);

    const total = await q.clone().count('id as count').first();
    const pos = await q.orderBy('created_at', 'desc').limit(parseInt(limit)).offset(offset);
    const enriched = await enrichPOs(pos);

    const result = {
      purchaseOrders: enriched,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: Number(total.count), totalPages: Math.ceil(Number(total.count) / parseInt(limit)) }
    };

    await cacheResponse(cacheKey, result, 60);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Get POs error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /purchase-orders/:id
router.get('/:id', [authenticate, authorize('admin', 'procurement_manager', 'finance_manager', 'ap_clerk', 'viewer')], async (req, res) => {
  try {
    const po = await db('purchase_orders').where('id', req.params.id).first();
    if (!po) return res.status(404).json({ success: false, error: 'Purchase order not found' });
    const [enriched] = await enrichPOs([po]);
    res.json({ success: true, data: enriched });
  } catch (error) {
    logger.error('Get PO error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /purchase-orders
router.post('/', [
  authenticate,
  authorize('admin', 'procurement_manager'),
  body('vendorId').isUUID(),
  body('totalAmount').isFloat({ min: 0 }),
  body('issueDate').isDate(),
  body('expectedDeliveryDate').isDate(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });

    const year = new Date().getFullYear();
    const count = await db('purchase_orders').count('id as c').first();
    const poNumber = `PO-${year}-${String(Number(count.c) + 1).padStart(4, '0')}`;

    const data = {
      id: uuidv4(),
      po_number: poNumber,
      vendor_id: req.body.vendorId,
      rfq_id: req.body.rfqId || null,
      total_amount: req.body.totalAmount,
      currency: req.body.currency || 'USD',
      status: 'new',
      priority: req.body.priority || 'medium',
      acknowledgment_status: 'pending',
      issue_date: req.body.issueDate,
      expected_delivery_date: req.body.expectedDeliveryDate,
      delivery_address: req.body.deliveryAddress,
      terms: req.body.terms,
      notes: req.body.notes,
      line_items: JSON.stringify(req.body.lineItems || []),
      attachments: JSON.stringify([]),
      created_by: req.user.id,
      updated_by: req.user.id,
    };

    const [po] = await db('purchase_orders').insert(data).returning('*');
    logger.logAudit('PO_CREATED', req.user.id, { poId: po.id, poNumber: po.po_number });
    res.status(201).json({ success: true, data: po });
  } catch (error) {
    logger.error('Create PO error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /purchase-orders/:id
router.put('/:id', [authenticate, authorize('admin', 'procurement_manager')], async (req, res) => {
  try {
    const updateData = { ...req.body, updated_by: req.user.id, updated_at: new Date() };
    if (updateData.lineItems) { updateData.line_items = JSON.stringify(updateData.lineItems); delete updateData.lineItems; }
    const [po] = await db('purchase_orders').where('id', req.params.id).update(updateData).returning('*');
    if (!po) return res.status(404).json({ success: false, error: 'Purchase order not found' });
    await del(`po:${req.params.id}`);
    res.json({ success: true, data: po });
  } catch (error) {
    logger.error('Update PO error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /purchase-orders/:id/send
router.post('/:id/send', [authenticate, authorize('admin', 'procurement_manager')], async (req, res) => {
  try {
    const [po] = await db('purchase_orders').where('id', req.params.id)
      .update({ status: 'sent', updated_by: req.user.id, updated_at: new Date() }).returning('*');
    if (!po) return res.status(404).json({ success: false, error: 'Purchase order not found' });
    logger.logAudit('PO_SENT', req.user.id, { poId: req.params.id });
    res.json({ success: true, data: po });
  } catch (error) {
    logger.error('Send PO error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /purchase-orders/:id/approve
router.post('/:id/approve', [authenticate, authorize('admin', 'procurement_manager')], async (req, res) => {
  try {
    const [po] = await db('purchase_orders').where('id', req.params.id)
      .update({ status: 'approved', updated_by: req.user.id, updated_at: new Date() }).returning('*');
    if (!po) return res.status(404).json({ success: false, error: 'Purchase order not found' });
    logger.logAudit('PO_APPROVED', req.user.id, { poId: req.params.id });
    res.json({ success: true, data: po });
  } catch (error) {
    logger.error('Approve PO error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /purchase-orders/:id/receive-goods
router.post('/:id/receive-goods', [authenticate, authorize('admin', 'procurement_manager', 'ap_clerk')], async (req, res) => {
  try {
    const [po] = await db('purchase_orders').where('id', req.params.id)
      .update({ status: 'received', updated_by: req.user.id, updated_at: new Date() }).returning('*');
    if (!po) return res.status(404).json({ success: false, error: 'Purchase order not found' });
    logger.logAudit('GOODS_RECEIVED', req.user.id, { poId: req.params.id });
    res.json({ success: true, data: po });
  } catch (error) {
    logger.error('Receive goods error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
