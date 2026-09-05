const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { authenticate, authorize } = require('../middleware/auth');
const { db } = require('../config/database');
const { cacheResponse, getCachedResponse, del } = require('../config/redis');
const logger = require('../config/logger');

const router = express.Router();

async function enrichRFQs(rfqs) {
  if (!rfqs.length) return rfqs;
  // Attach response counts
  const rfqIds = rfqs.map(r => r.id);
  const quotationCounts = await db('quotations')
    .whereIn('rfq_id', rfqIds)
    .groupBy('rfq_id')
    .select('rfq_id')
    .count('id as response_count');
  const countMap = Object.fromEntries(quotationCounts.map(q => [q.rfq_id, Number(q.response_count)]));

  return rfqs.map(rfq => ({
    ...rfq,
    response_count: countMap[rfq.id] || 0,
    attachments: typeof rfq.attachments === 'string' ? JSON.parse(rfq.attachments || '[]') : (rfq.attachments || []),
  }));
}

// GET /rfqs
router.get('/', [
  authenticate,
  authorize('admin', 'procurement_manager', 'finance_manager', 'ap_clerk', 'viewer'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
  query('status').optional().isIn(['open', 'closed', 'awarded', 'cancelled', 'draft']),
  query('category').optional().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });

    const { page = 1, limit = 20, search, status, category } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const cacheKey = `rfqs:${JSON.stringify(req.query)}`;
    const cached = await getCachedResponse(cacheKey, 60);
    if (cached) return res.json({ success: true, data: cached });

    let q = db('rfqs');
    if (status) q = q.where('status', status);
    if (category) q = q.where('category', category);
    if (search) q = q.where(function() { this.where('title', 'like', `%${search}%`).orWhere('rfq_number', 'like', `%${search}%`); });

    const total = await q.clone().count('id as count').first();
    const rfqs = await q.orderBy('created_at', 'desc').limit(parseInt(limit)).offset(offset);
    const enriched = await enrichRFQs(rfqs);

    const result = {
      rfqs: enriched,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: Number(total.count), totalPages: Math.ceil(Number(total.count) / parseInt(limit)) }
    };

    await cacheResponse(cacheKey, result, 60);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Get RFQs error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /rfqs/:id
router.get('/:id', [authenticate, authorize('admin', 'procurement_manager', 'finance_manager', 'ap_clerk', 'viewer')], async (req, res) => {
  try {
    const rfq = await db('rfqs').where('id', req.params.id).first();
    if (!rfq) return res.status(404).json({ success: false, error: 'RFQ not found' });
    const [enriched] = await enrichRFQs([rfq]);
    res.json({ success: true, data: enriched });
  } catch (error) {
    logger.error('Get RFQ error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /rfqs
router.post('/', [
  authenticate,
  authorize('admin', 'procurement_manager'),
  body('title').trim().notEmpty(),
  body('dueDate').isDate(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });

    const year = new Date().getFullYear();
    const count = await db('rfqs').count('id as c').first();
    const rfqNumber = `RFQ-${year}-${String(Number(count.c) + 1).padStart(4, '0')}`;

    const data = {
      id: uuidv4(),
      rfq_number: rfqNumber,
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      budget: req.body.budget,
      currency: req.body.currency || 'USD',
      issued_date: new Date(),
      due_date: req.body.dueDate,
      status: 'open',
      priority: req.body.priority || 'medium',
      attachments: JSON.stringify([]),
      created_by: req.user.id,
      updated_by: req.user.id,
    };

    const [rfq] = await db('rfqs').insert(data).returning('*');
    logger.logAudit('RFQ_CREATED', req.user.id, { rfqId: rfq.id });
    res.status(201).json({ success: true, data: rfq });
  } catch (error) {
    logger.error('Create RFQ error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /rfqs/:id
router.put('/:id', [authenticate, authorize('admin', 'procurement_manager')], async (req, res) => {
  try {
    const updateData = { ...req.body, updated_by: req.user.id, updated_at: new Date() };
    const [rfq] = await db('rfqs').where('id', req.params.id).update(updateData).returning('*');
    if (!rfq) return res.status(404).json({ success: false, error: 'RFQ not found' });
    await del(`rfq:${req.params.id}`);
    res.json({ success: true, data: rfq });
  } catch (error) {
    logger.error('Update RFQ error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /rfqs/:id/publish
router.post('/:id/publish', [authenticate, authorize('admin', 'procurement_manager')], async (req, res) => {
  try {
    const [rfq] = await db('rfqs').where('id', req.params.id)
      .update({ status: 'open', issued_date: new Date(), updated_by: req.user.id, updated_at: new Date() }).returning('*');
    if (!rfq) return res.status(404).json({ success: false, error: 'RFQ not found' });
    res.json({ success: true, data: rfq });
  } catch (error) {
    logger.error('Publish RFQ error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /rfqs/:id/responses
router.get('/:id/responses', [authenticate, authorize('admin', 'procurement_manager', 'finance_manager', 'viewer')], async (req, res) => {
  try {
    const responses = await db('quotations').where('rfq_id', req.params.id).orderBy('created_at', 'desc');
    const vendorIds = [...new Set(responses.map(r => r.vendor_id).filter(Boolean))];
    const vendors = vendorIds.length ? await db('vendors').whereIn('id', vendorIds).select('id', 'name') : [];
    const vendorMap = Object.fromEntries(vendors.map(v => [v.id, v.name]));
    const enriched = responses.map(r => ({ ...r, vendor_name: vendorMap[r.vendor_id] || 'Unknown' }));
    res.json({ success: true, data: enriched });
  } catch (error) {
    logger.error('Get RFQ responses error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /rfqs/:id/responses
router.post('/:id/responses', [authenticate, body('totalAmount').isFloat({ min: 0 })], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });

    const data = {
      id: uuidv4(),
      rfq_id: req.params.id,
      vendor_id: req.body.vendorId,
      total_amount: req.body.totalAmount,
      currency: req.body.currency || 'USD',
      status: 'submitted',
      notes: req.body.notes,
      created_by: req.user.id,
      updated_by: req.user.id,
    };

    // Check if quotations table has these columns
    const [response] = await db('quotations').insert(data).returning('*');
    res.status(201).json({ success: true, data: response });
  } catch (error) {
    logger.error('Submit RFQ response error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /rfqs/:id/award
router.post('/:id/award', [authenticate, authorize('admin', 'procurement_manager'), body('responseId').notEmpty()], async (req, res) => {
  try {
    const response = await db('quotations').where('id', req.body.responseId).first();
    if (!response) return res.status(404).json({ success: false, error: 'Response not found' });

    const [rfq] = await db('rfqs').where('id', req.params.id)
      .update({ status: 'awarded', awarded_vendor_id: response.vendor_id, awarded_amount: response.total_amount, updated_by: req.user.id, updated_at: new Date() })
      .returning('*');
    if (!rfq) return res.status(404).json({ success: false, error: 'RFQ not found' });
    logger.logAudit('RFQ_AWARDED', req.user.id, { rfqId: req.params.id, vendorId: response.vendor_id });
    res.json({ success: true, data: rfq });
  } catch (error) {
    logger.error('Award RFQ error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
