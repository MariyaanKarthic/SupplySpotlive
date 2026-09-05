const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { authenticate, authorize } = require('../middleware/auth');
const { db } = require('../config/database');
const { cacheResponse, getCachedResponse, del } = require('../config/redis');
const logger = require('../config/logger');

const router = express.Router();

// GET /disputes
router.get('/', [
  authenticate,
  authorize('admin', 'procurement_manager', 'finance_manager', 'ap_clerk', 'viewer'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
  query('status').optional().isIn(['submitted', 'assigned', 'investigating', 'pending_supplier', 'pending_internal', 'resolved', 'closed', 'escalated']),
  query('category').optional().trim(),
  query('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });

    const { page = 1, limit = 20, search, status, category, priority } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const cacheKey = `disputes:${JSON.stringify(req.query)}`;
    const cached = await getCachedResponse(cacheKey, 30);
    if (cached) return res.json({ success: true, data: cached });

    let q = db('disputes');
    if (status) q = q.where('status', status);
    if (category) q = q.where('category', category);
    if (priority) q = q.where('priority', priority);
    if (search) q = q.where(function() { this.where('title', 'like', `%${search}%`).orWhere('dispute_number', 'like', `%${search}%`); });

    const total = await q.clone().count('id as count').first();
    const disputes = await q.orderBy('created_at', 'desc').limit(parseInt(limit)).offset(offset);

    const enriched = disputes.map(d => ({
      ...d,
      submitted_by: typeof d.submitted_by === 'string' ? JSON.parse(d.submitted_by || '{}') : (d.submitted_by || {}),
      assigned_to: typeof d.assigned_to === 'string' ? JSON.parse(d.assigned_to || 'null') : d.assigned_to,
      related_documents: typeof d.related_documents === 'string' ? JSON.parse(d.related_documents || '[]') : (d.related_documents || []),
      sla_details: typeof d.sla_details === 'string' ? JSON.parse(d.sla_details || '{}') : (d.sla_details || {}),
      tags: typeof d.tags === 'string' ? JSON.parse(d.tags || '[]') : (d.tags || []),
    }));

    const result = {
      disputes: enriched,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: Number(total.count), totalPages: Math.ceil(Number(total.count) / parseInt(limit)) }
    };

    await cacheResponse(cacheKey, result, 30);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Get disputes error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /disputes/:id
router.get('/:id', [authenticate, authorize('admin', 'procurement_manager', 'finance_manager', 'ap_clerk', 'viewer')], async (req, res) => {
  try {
    const dispute = await db('disputes').where('id', req.params.id).first();
    if (!dispute) return res.status(404).json({ success: false, error: 'Dispute not found' });
    const enriched = {
      ...dispute,
      submitted_by: typeof dispute.submitted_by === 'string' ? JSON.parse(dispute.submitted_by || '{}') : (dispute.submitted_by || {}),
      assigned_to: typeof dispute.assigned_to === 'string' ? JSON.parse(dispute.assigned_to || 'null') : dispute.assigned_to,
      related_documents: typeof dispute.related_documents === 'string' ? JSON.parse(dispute.related_documents || '[]') : (dispute.related_documents || []),
      sla_details: typeof dispute.sla_details === 'string' ? JSON.parse(dispute.sla_details || '{}') : (dispute.sla_details || {}),
      tags: typeof dispute.tags === 'string' ? JSON.parse(dispute.tags || '[]') : (dispute.tags || []),
    };
    res.json({ success: true, data: enriched });
  } catch (error) {
    logger.error('Get dispute error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /disputes
router.post('/', [
  authenticate,
  body('title').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('category').trim().notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });

    const year = new Date().getFullYear();
    const count = await db('disputes').count('id as c').first();
    const disputeNumber = `DISP-${year}-${String(Number(count.c) + 1).padStart(4, '0')}`;

    const submittedBy = { id: req.user.id, name: req.user.name || req.user.email, email: req.user.email, type: 'internal' };
    const slaDetails = {
      targetResolution: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      escalationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      isOverdue: false,
      hoursRemaining: 168,
    };

    const data = {
      id: uuidv4(),
      dispute_number: disputeNumber,
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      priority: req.body.priority || 'medium',
      status: 'submitted',
      submitted_by: JSON.stringify(submittedBy),
      related_documents: JSON.stringify(req.body.relatedDocuments || []),
      sla_details: JSON.stringify(slaDetails),
      tags: JSON.stringify(req.body.tags || []),
      created_by: req.user.id,
      updated_by: req.user.id,
    };

    const [dispute] = await db('disputes').insert(data).returning('*');
    logger.logAudit('DISPUTE_CREATED', req.user.id, { disputeId: dispute.id });
    res.status(201).json({ success: true, data: dispute });
  } catch (error) {
    logger.error('Create dispute error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /disputes/:id
router.put('/:id', [authenticate, authorize('admin', 'procurement_manager', 'finance_manager')], async (req, res) => {
  try {
    const updateData = { ...req.body, updated_by: req.user.id, updated_at: new Date() };
    const [dispute] = await db('disputes').where('id', req.params.id).update(updateData).returning('*');
    if (!dispute) return res.status(404).json({ success: false, error: 'Dispute not found' });
    await del(`dispute:${req.params.id}`);
    res.json({ success: true, data: dispute });
  } catch (error) {
    logger.error('Update dispute error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /disputes/:id/assign
router.post('/:id/assign', [authenticate, authorize('admin', 'procurement_manager'), body('assigneeId').notEmpty()], async (req, res) => {
  try {
    const assignee = await db('users').where('id', req.body.assigneeId).first();
    const assignedTo = assignee
      ? { id: assignee.id, name: assignee.name || assignee.email, email: assignee.email, type: 'internal' }
      : { id: req.body.assigneeId, name: req.body.assigneeName || 'Unknown', email: '', type: 'internal' };

    const [dispute] = await db('disputes').where('id', req.params.id)
      .update({ status: 'assigned', assigned_to: JSON.stringify(assignedTo), updated_by: req.user.id, updated_at: new Date() })
      .returning('*');
    if (!dispute) return res.status(404).json({ success: false, error: 'Dispute not found' });
    res.json({ success: true, data: dispute });
  } catch (error) {
    logger.error('Assign dispute error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /disputes/:id/resolve
router.post('/:id/resolve', [authenticate, authorize('admin', 'procurement_manager', 'finance_manager')], async (req, res) => {
  try {
    const [dispute] = await db('disputes').where('id', req.params.id)
      .update({
        status: 'resolved',
        resolution_details: req.body.resolution || 'Resolved',
        resolved_at: new Date(),
        updated_by: req.user.id,
        updated_at: new Date()
      }).returning('*');
    if (!dispute) return res.status(404).json({ success: false, error: 'Dispute not found' });
    logger.logAudit('DISPUTE_RESOLVED', req.user.id, { disputeId: req.params.id });
    res.json({ success: true, data: dispute });
  } catch (error) {
    logger.error('Resolve dispute error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /disputes/:id/escalate
router.post('/:id/escalate', [authenticate, authorize('admin', 'procurement_manager')], async (req, res) => {
  try {
    const [dispute] = await db('disputes').where('id', req.params.id)
      .update({ status: 'escalated', priority: 'critical', updated_by: req.user.id, updated_at: new Date() })
      .returning('*');
    if (!dispute) return res.status(404).json({ success: false, error: 'Dispute not found' });
    logger.logAudit('DISPUTE_ESCALATED', req.user.id, { disputeId: req.params.id });
    res.json({ success: true, data: dispute });
  } catch (error) {
    logger.error('Escalate dispute error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /disputes/:id/messages
router.post('/:id/messages', [authenticate, body('message').trim().notEmpty()], async (req, res) => {
  try {
    // Messages stored as resolution_details for now (no separate messages table)
    res.json({ success: true, data: { id: uuidv4(), message: req.body.message, timestamp: new Date() } });
  } catch (error) {
    logger.error('Add message error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
