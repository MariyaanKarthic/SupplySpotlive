const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { authenticate, authorize } = require('../middleware/auth');
const { db } = require('../config/database');
const logger = require('../config/logger');

const router = express.Router();

// Payments are derived from invoices that have a payment_date set
// GET /payments
router.get('/', [
  authenticate,
  authorize('admin', 'finance_manager', 'ap_clerk', 'viewer'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
  query('status').optional().isIn(['scheduled', 'processing', 'processed', 'failed', 'cancelled']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });

    const { page = 1, limit = 20, search, status, dateFrom, dateTo } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Payments = invoices with status 'paid' or that have a payment_date
    let q = db('invoices')
      .whereIn('status', ['paid', 'approved'])
      .select(
        'id', 'invoice_number', 'vendor_id', 'amount', 'net_amount',
        'payment_date', 'status', 'po_number', 'created_at', 'updated_at', 'created_by'
      );

    if (search) q = q.where('invoice_number', 'like', `%${search}%`);
    if (dateFrom) q = q.where('payment_date', '>=', dateFrom);
    if (dateTo) q = q.where('payment_date', '<=', dateTo);

    const total = await q.clone().count('id as count').first();
    const invoices = await q.orderBy('created_at', 'desc').limit(parseInt(limit)).offset(offset);

    // Enrich with vendor names
    const vendorIds = [...new Set(invoices.map(i => i.vendor_id))];
    const vendors = vendorIds.length ? await db('vendors').whereIn('id', vendorIds).select('id', 'name') : [];
    const vendorMap = Object.fromEntries(vendors.map(v => [v.id, v.name]));

    const payments = invoices.map((inv, idx) => ({
      id: inv.id,
      payment_number: `PAY-${new Date().getFullYear()}-${String(idx + 1).padStart(4, '0')}`,
      invoice_id: inv.id,
      invoice_number: inv.invoice_number,
      vendor_id: inv.vendor_id,
      vendor_name: vendorMap[inv.vendor_id] || 'Unknown',
      amount: inv.amount,
      net_amount: inv.net_amount,
      status: inv.status === 'paid' ? 'processed' : 'scheduled',
      payment_date: inv.payment_date,
      method: 'ach',
      currency: 'USD',
      created_at: inv.created_at,
    }));

    res.json({
      success: true,
      data: {
        payments,
        pagination: { page: parseInt(page), limit: parseInt(limit), total: Number(total.count), totalPages: Math.ceil(Number(total.count) / parseInt(limit)) }
      }
    });
  } catch (error) {
    logger.error('Get payments error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /payments/:id
router.get('/:id', [authenticate, authorize('admin', 'finance_manager', 'ap_clerk', 'viewer')], async (req, res) => {
  try {
    const invoice = await db('invoices').where('id', req.params.id).first();
    if (!invoice) return res.status(404).json({ success: false, error: 'Payment not found' });
    const vendor = await db('vendors').where('id', invoice.vendor_id).select('name').first();
    res.json({ success: true, data: { ...invoice, vendor_name: vendor?.name || 'Unknown' } });
  } catch (error) {
    logger.error('Get payment error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /payments/process — mark invoices as paid
router.post('/process', [
  authenticate,
  authorize('admin', 'finance_manager'),
  body('invoiceIds').isArray({ min: 1 }),
  body('method').isIn(['ach', 'wire', 'check', 'credit_card', 'other']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });

    const { invoiceIds, method, scheduledDate } = req.body;
    const paymentDate = scheduledDate ? new Date(scheduledDate) : new Date();

    await db('invoices').whereIn('id', invoiceIds).update({
      status: 'paid',
      payment_date: paymentDate,
      updated_by: req.user.id,
      updated_at: new Date(),
    });

    const updatedInvoices = await db('invoices').whereIn('id', invoiceIds).select('id', 'invoice_number', 'amount', 'status');
    logger.logAudit('PAYMENTS_PROCESSED', req.user.id, { invoiceIds, method, paymentDate });
    res.json({ success: true, data: { processed: updatedInvoices.length, invoices: updatedInvoices, method, paymentDate } });
  } catch (error) {
    logger.error('Process payment error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /payments/schedule
router.post('/schedule', [
  authenticate,
  authorize('admin', 'finance_manager'),
  body('invoiceId').isUUID(),
  body('amount').isFloat({ min: 0 }),
  body('scheduledDate').isDate(),
  body('method').isIn(['ach', 'wire', 'check', 'credit_card', 'other']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });

    const [invoice] = await db('invoices').where('id', req.body.invoiceId)
      .update({ payment_date: new Date(req.body.scheduledDate), updated_by: req.user.id, updated_at: new Date() })
      .returning('*');
    if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });
    logger.logAudit('PAYMENT_SCHEDULED', req.user.id, { invoiceId: req.body.invoiceId, scheduledDate: req.body.scheduledDate });
    res.json({ success: true, data: { invoiceId: req.body.invoiceId, scheduledDate: req.body.scheduledDate, method: req.body.method, amount: req.body.amount } });
  } catch (error) {
    logger.error('Schedule payment error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /payments/invoice/:invoiceId
router.get('/invoice/:invoiceId', [authenticate, authorize('admin', 'finance_manager', 'ap_clerk', 'viewer')], async (req, res) => {
  try {
    const invoice = await db('invoices').where('id', req.params.invoiceId).first();
    if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (error) {
    logger.error('Get payment history error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /payments/:id — cancel (revert to approved)
router.delete('/:id', [authenticate, authorize('admin', 'finance_manager')], async (req, res) => {
  try {
    const [invoice] = await db('invoices').where('id', req.params.id)
      .update({ status: 'approved', payment_date: null, updated_by: req.user.id, updated_at: new Date() })
      .returning('*');
    if (!invoice) return res.status(404).json({ success: false, error: 'Payment not found' });
    res.json({ success: true, message: 'Payment cancelled successfully' });
  } catch (error) {
    logger.error('Cancel payment error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
