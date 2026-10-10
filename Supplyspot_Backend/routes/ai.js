const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../config/logger');
const claude = require('../services/claudeService');
const { recommendVendors, reviewInvoice, summarizeFinance } = require('../services/ai');
const { isIsoDate } = require('../services/finance');

const router = express.Router();

const READ_ROLES = ['admin', 'procurement_manager', 'finance_manager', 'ap_clerk', 'viewer'];
// Same roles that can create and send RFQs.
const SOURCING_ROLES = ['admin', 'procurement_manager'];

const handle = (label, fn) => async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array()[0].msg });
  try {
    res.json({ success: true, data: await fn(req) });
  } catch (error) {
    if (error && error.status && error.message) return res.status(error.status).json({ success: false, error: error.message });
    logger.error(`${label} error:`, error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * GET /ai/status — whether Claude is configured, so the UI can hide or explain the AI buttons.
 */
router.get('/status', authenticate, (req, res) => {
  res.json({ success: true, data: { enabled: claude.isConfigured(), model: claude.model } });
});

/**
 * POST /ai/rfq-vendor-recommendations { rfqId } or { purchaseRequestId }
 * Shortlist of vendors to invite, with a reason for each.
 */
router.post('/rfq-vendor-recommendations', [
  authenticate,
  authorize(...SOURCING_ROLES),
  body('rfqId').optional({ values: 'falsy' }).isString(),
  body('purchaseRequestId').optional({ values: 'falsy' }).isString(),
  body().custom((b) => !!(b.rfqId || b.purchaseRequestId)).withMessage('Send an rfqId or a purchaseRequestId'),
], handle('AI vendor recommendations', (req) => recommendVendors({
  rfqId: req.body.rfqId || null,
  purchaseRequestId: req.body.purchaseRequestId || null,
})));

/**
 * POST /ai/invoices/:id/review — anomaly check on one invoice (duplicates, unusual amounts, PO/GRN mismatches).
 */
router.post('/invoices/:id/review', [
  authenticate,
  authorize(...READ_ROLES),
  param('id').isString(),
], handle('AI invoice review', (req) => reviewInvoice(req.user, req.params.id)));

/**
 * POST /ai/finance-summary { from?, to? } — plain-language briefing on the finance dashboard for the range.
 */
router.post('/finance-summary', [
  authenticate,
  body('from').optional({ values: 'falsy' }).custom(isIsoDate).withMessage('Dates must be in YYYY-MM-DD format'),
  body('to').optional({ values: 'falsy' }).custom(isIsoDate).withMessage('Dates must be in YYYY-MM-DD format'),
], handle('AI finance summary', (req) => summarizeFinance(req.user, { from: req.body.from || '', to: req.body.to || '' })));

module.exports = router;
