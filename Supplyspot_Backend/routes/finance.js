const express = require('express');
const { authenticate } = require('../middleware/auth');
const logger = require('../config/logger');
const { buildDashboard, isIsoDate } = require('../services/finance');

const router = express.Router();

/**
 * GET /finance/dashboard?from=YYYY-MM-DD&to=YYYY-MM-DD
 * KPIs, spending by vendor, invoice status, recent invoices and aging for the range (both ends optional).
 * Admins and finance managers see everything; other users see their own POs and their department's requests.
 */
router.get('/dashboard', authenticate, async (req, res) => {
  const { from = '', to = '' } = req.query;
  if ((from && !isIsoDate(from)) || (to && !isIsoDate(to))) {
    return res.status(400).json({ success: false, error: 'Dates must be in YYYY-MM-DD format' });
  }
  if (from && to && from > to) {
    return res.status(400).json({ success: false, error: 'The start date must be on or before the end date' });
  }
  try {
    const data = await buildDashboard(req.user, { from, to });
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Finance dashboard error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
