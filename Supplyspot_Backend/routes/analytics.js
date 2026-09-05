const express = require('express');
const { query } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const { db } = require('../config/database');
const { cacheResponse, getCachedResponse } = require('../config/redis');
const logger = require('../config/logger');

const router = express.Router();

// GET /analytics/dashboard — aggregated KPIs
router.get('/dashboard', [authenticate, authorize('admin', 'procurement_manager', 'finance_manager', 'ap_clerk', 'viewer')], async (req, res) => {
  try {
    const cacheKey = 'analytics:dashboard';
    const cached = await getCachedResponse(cacheKey, 120);
    if (cached) return res.json({ success: true, data: cached });

    const [
      vendorStats,
      invoiceStats,
      poStats,
      disputeStats,
      rfqStats,
    ] = await Promise.all([
      // Vendor stats
      db('vendors').select(
        db.raw('COUNT(*) as total'),
        db.raw("SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active"),
        db.raw("SUM(CASE WHEN status = 'under_review' THEN 1 ELSE 0 END) as under_review"),
        db.raw('COALESCE(SUM(total_spend), 0) as total_spend'),
        db.raw('COALESCE(AVG(rating), 0) as avg_rating'),
      ).first(),

      // Invoice stats
      db('invoices').select(
        db.raw('COUNT(*) as total'),
        db.raw("SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid"),
        db.raw("SUM(CASE WHEN status = 'pending_approval' THEN 1 ELSE 0 END) as pending"),
        db.raw("SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue"),
        db.raw('COALESCE(SUM(amount), 0) as total_amount'),
        db.raw("COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as paid_amount"),
      ).first(),

      // PO stats
      db('purchase_orders').select(
        db.raw('COUNT(*) as total'),
        db.raw("SUM(CASE WHEN status = 'received' THEN 1 ELSE 0 END) as received"),
        db.raw("SUM(CASE WHEN status IN ('new', 'pending_approval') THEN 1 ELSE 0 END) as pending"),
        db.raw('COALESCE(SUM(total_amount), 0) as total_amount'),
      ).first(),

      // Dispute stats
      db('disputes').select(
        db.raw('COUNT(*) as total'),
        db.raw("SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved"),
        db.raw("SUM(CASE WHEN status IN ('submitted', 'assigned') THEN 1 ELSE 0 END) as open"),
        db.raw("SUM(CASE WHEN priority = 'critical' THEN 1 ELSE 0 END) as critical"),
      ).first(),

      // RFQ stats
      db('rfqs').select(
        db.raw('COUNT(*) as total'),
        db.raw("SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open"),
        db.raw("SUM(CASE WHEN status = 'awarded' THEN 1 ELSE 0 END) as awarded"),
      ).first(),
    ]);

    // Recent invoices for activity feed
    const recentInvoices = await db('invoices')
      .orderBy('created_at', 'desc')
      .limit(5)
      .select('id', 'invoice_number', 'amount', 'status', 'created_at', 'vendor_id');

    const vendorIds = [...new Set(recentInvoices.map(i => i.vendor_id))];
    const vendors = vendorIds.length ? await db('vendors').whereIn('id', vendorIds).select('id', 'name') : [];
    const vendorMap = Object.fromEntries(vendors.map(v => [v.id, v.name]));
    const recentActivity = recentInvoices.map(inv => ({
      type: 'invoice',
      id: inv.invoice_number,
      label: `Invoice ${inv.invoice_number}`,
      vendor: vendorMap[inv.vendor_id] || 'Unknown',
      amount: inv.amount,
      status: inv.status,
      date: inv.created_at,
    }));

    // Spending by category (from invoices)
    const spendingByCategory = await db('invoices')
      .where('status', 'paid')
      .groupBy('category')
      .select('category', db.raw('SUM(amount) as total'))
      .orderBy('total', 'desc')
      .limit(6);

    // Monthly invoice volumes (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyInvoices = await db('invoices')
      .where('created_at', '>=', sixMonthsAgo)
      .select(db.raw("strftime('%Y-%m', created_at) as month"), db.raw('COUNT(*) as count'), db.raw('SUM(amount) as total'))
      .groupBy('month')
      .orderBy('month', 'asc');

    const data = {
      vendors: {
        total: Number(vendorStats.total),
        active: Number(vendorStats.active),
        underReview: Number(vendorStats.under_review),
        totalSpend: Number(vendorStats.total_spend),
        avgRating: Number(vendorStats.avg_rating).toFixed(1),
      },
      invoices: {
        total: Number(invoiceStats.total),
        paid: Number(invoiceStats.paid),
        pending: Number(invoiceStats.pending),
        overdue: Number(invoiceStats.overdue),
        totalAmount: Number(invoiceStats.total_amount),
        paidAmount: Number(invoiceStats.paid_amount),
      },
      purchaseOrders: {
        total: Number(poStats.total),
        received: Number(poStats.received),
        pending: Number(poStats.pending),
        totalAmount: Number(poStats.total_amount),
      },
      disputes: {
        total: Number(disputeStats.total),
        resolved: Number(disputeStats.resolved),
        open: Number(disputeStats.open),
        critical: Number(disputeStats.critical),
      },
      rfqs: {
        total: Number(rfqStats.total),
        open: Number(rfqStats.open),
        awarded: Number(rfqStats.awarded),
      },
      recentActivity,
      spendingByCategory: spendingByCategory.map(s => ({ category: s.category || 'Other', total: Number(s.total) })),
      monthlyInvoices: monthlyInvoices.map(m => ({ month: m.month, count: Number(m.count), total: Number(m.total) })),
    };

    await cacheResponse(cacheKey, data, 120);
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Dashboard analytics error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /analytics/vendors
router.get('/vendors', [authenticate, authorize('admin', 'procurement_manager', 'finance_manager', 'viewer')], async (req, res) => {
  try {
    const vendors = await db('vendors')
      .select('id', 'name', 'category', 'status', 'total_spend', 'rating', 'contracts_count')
      .orderBy('total_spend', 'desc')
      .limit(20);
    res.json({ success: true, data: vendors });
  } catch (error) {
    logger.error('Vendor analytics error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /analytics/invoices
router.get('/invoices', [authenticate, authorize('admin', 'finance_manager', 'ap_clerk', 'viewer')], async (req, res) => {
  try {
    const byStatus = await db('invoices').groupBy('status').select('status', db.raw('COUNT(*) as count'), db.raw('SUM(amount) as total'));
    const byMonth = await db('invoices')
      .select(db.raw("strftime('%Y-%m', created_at) as month"), db.raw('COUNT(*) as count'), db.raw('SUM(amount) as total'))
      .groupBy('month').orderBy('month', 'asc').limit(12);
    res.json({ success: true, data: { byStatus: byStatus.map(s => ({ ...s, count: Number(s.count), total: Number(s.total) })), byMonth } });
  } catch (error) {
    logger.error('Invoice analytics error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /analytics/spending
router.get('/spending', [authenticate, authorize('admin', 'finance_manager', 'viewer')], async (req, res) => {
  try {
    const byCategory = await db('invoices').where('status', 'paid').groupBy('category').select('category', db.raw('SUM(amount) as total')).orderBy('total', 'desc');
    const byVendor = await db('vendors').orderBy('total_spend', 'desc').limit(10).select('name', 'total_spend as total', 'category');
    res.json({ success: true, data: { byCategory, byVendor } });
  } catch (error) {
    logger.error('Spending analytics error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /analytics/disputes
router.get('/disputes', [authenticate, authorize('admin', 'procurement_manager', 'finance_manager', 'viewer')], async (req, res) => {
  try {
    const byStatus = await db('disputes').groupBy('status').select('status', db.raw('COUNT(*) as count'));
    const byCategory = await db('disputes').groupBy('category').select('category', db.raw('COUNT(*) as count'));
    const byPriority = await db('disputes').groupBy('priority').select('priority', db.raw('COUNT(*) as count'));
    res.json({ success: true, data: { byStatus, byCategory, byPriority } });
  } catch (error) {
    logger.error('Dispute analytics error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
