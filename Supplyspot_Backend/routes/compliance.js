const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const { db } = require('../config/database');
const logger = require('../config/logger');
const compliance = require('../services/compliance');

const router = express.Router();

const isoDate = (v) => !v || compliance.isIsoDate(v);
const rangeChecks = [
  query('from').optional({ values: 'falsy' }).custom(isoDate).withMessage('Dates must be in YYYY-MM-DD format'),
  query('to').optional({ values: 'falsy' }).custom(isoDate).withMessage('Dates must be in YYYY-MM-DD format'),
  query('to').optional({ values: 'falsy' }).custom((to, { req }) => !req.query.from || req.query.from <= to)
    .withMessage('The start date must be on or before the end date'),
];

function invalid(req, res) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return false;
  res.status(400).json({ success: false, error: errors.array()[0].msg, details: errors.array() });
  return true;
}

// Vendor-level lists are for admins, compliance managers (all vendors) and procurement managers (their vendors).
async function listScope(req, res) {
  if (compliance.access(req.user).level === 'summary') {
    res.status(403).json({ success: false, error: 'Your role can see the compliance summary only' });
    return undefined;
  }
  return compliance.visibleVendorIds(req.user);
}

const handle = (label, fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    logger.error(`Compliance ${label} error:`, error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * GET /compliance/dashboard?from&to
 * KPIs (as of today), certification status and compliance levels, and issues by category for disputes raised in the range.
 */
router.get('/dashboard', authenticate, rangeChecks, handle('dashboard', async (req, res) => {
  if (invalid(req, res)) return;
  const { from = '', to = '' } = req.query;
  res.json({ success: true, data: await compliance.buildDashboard(req.user, { from, to }) });
}));

/** GET /compliance/vendors?level=green|yellow|red&certification_status=&search= */
router.get('/vendors', authenticate, handle('vendors', async (req, res) => {
  const ids = await listScope(req, res);
  if (ids === undefined) return;
  const { level, certification_status: certStatus, search } = req.query;
  let vendors = await compliance.loadVendors(ids);
  if (level) vendors = vendors.filter((v) => v.compliance.level === level);
  if (certStatus) vendors = vendors.filter((v) => v.certificationStatus === certStatus);
  if (search) {
    const s = String(search).toLowerCase();
    vendors = vendors.filter((v) => v.name.toLowerCase().includes(s));
  }
  res.json({ success: true, data: { vendors, scope: compliance.access(req.user) } });
}));

/** GET /compliance/certifications?state=expired|expiring|valid|no_expiry&vendor_id= */
router.get('/certifications', authenticate, handle('certifications', async (req, res) => {
  const ids = await listScope(req, res);
  if (ids === undefined) return;
  const certifications = await compliance.listCertifications(ids, { state: req.query.state, vendorId: req.query.vendor_id });
  res.json({ success: true, data: { certifications } });
}));

/** GET /compliance/audits?from&to&vendor_id= (audit history, newest first) */
router.get('/audits', authenticate, rangeChecks, handle('audits', async (req, res) => {
  if (invalid(req, res)) return;
  const ids = await listScope(req, res);
  if (ids === undefined) return;
  const audits = await compliance.listAudits(ids, { from: req.query.from, to: req.query.to, vendorId: req.query.vendor_id });
  res.json({ success: true, data: { audits } });
}));

/** GET /compliance/disputes?from&to&category&include_closed=true — compliance-related disputes, open only by default */
router.get('/disputes', authenticate, rangeChecks, handle('disputes', async (req, res) => {
  if (invalid(req, res)) return;
  const ids = await listScope(req, res);
  if (ids === undefined) return;
  const disputes = await compliance.listDisputes(ids, {
    from: req.query.from,
    to: req.query.to,
    category: req.query.category,
    includeClosed: req.query.include_closed === 'true',
  });
  res.json({ success: true, data: { disputes } });
}));

/** POST /compliance/audits/:vendorId — record an audit; optionally set the vendor's certification status */
router.post('/audits/:vendorId', [
  authenticate,
  authorize(...compliance.WRITE_ROLES),
  param('vendorId').notEmpty(),
  body('audit_date').custom((v) => compliance.isIsoDate(v || '')).withMessage('Audit date must be in YYYY-MM-DD format'),
  body('audit_date').custom((v) => v <= new Date().toISOString().split('T')[0]).withMessage('Audit date cannot be in the future'),
  body('result').isIn(compliance.AUDIT_RESULTS).withMessage(`Result must be one of ${compliance.AUDIT_RESULTS.join(', ')}`),
  body('audit_type').optional({ values: 'falsy' }).isIn(compliance.AUDIT_TYPES),
  body('score').optional({ values: 'null' }).custom((v) => v === '' || (Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) <= 100))
    .withMessage('Score must be a whole number from 0 to 100'),
  body('next_audit_due').optional({ values: 'falsy' }).custom((v) => compliance.isIsoDate(v)).withMessage('Next audit date must be in YYYY-MM-DD format'),
  body('certification_status').optional({ values: 'falsy' }).isIn(compliance.CERTIFICATION_STATUSES),
  body('auditor').optional().isString().trim().isLength({ max: 200 }),
  body('findings').optional().isString().isLength({ max: 5000 }),
], handle('record audit', async (req, res) => {
  if (invalid(req, res)) return;
  const audit = await compliance.recordAudit(req.user, req.params.vendorId, req.body);
  if (!audit) return res.status(404).json({ success: false, error: 'Vendor not found' });
  res.status(201).json({ success: true, data: audit });
}));

/** PUT /compliance/certifications/:certId — edit dates, number or verification status */
router.put('/certifications/:certId', [
  authenticate,
  authorize(...compliance.WRITE_ROLES),
  body('type').optional().isString().trim().notEmpty().isLength({ max: 120 }),
  body('certificate_number').optional({ values: 'null' }).isString().isLength({ max: 120 }),
  body('issuing_body').optional({ values: 'null' }).isString().isLength({ max: 200 }),
  body('issue_date').optional({ values: 'null' }).custom(isoDate).withMessage('Issue date must be in YYYY-MM-DD format'),
  body('expiry_date').optional({ values: 'null' }).custom(isoDate).withMessage('Expiry date must be in YYYY-MM-DD format'),
  body('expiry_date').optional({ values: 'falsy' }).custom((to, { req }) => !req.body.issue_date || req.body.issue_date <= to)
    .withMessage('The expiry date must be after the issue date'),
  body('status').optional().isIn(compliance.CERT_RECORD_STATUSES),
  body('notes').optional({ values: 'null' }).isString().isLength({ max: 2000 }),
], handle('update certification', async (req, res) => {
  if (invalid(req, res)) return;
  const cert = await compliance.updateCertification(req.user, req.params.certId, req.body);
  if (!cert) return res.status(404).json({ success: false, error: 'Certification not found' });
  res.json({ success: true, data: cert });
}));

/** POST /compliance/disputes/:id/resolve and /close — settle a compliance dispute from the dashboard */
['resolve', 'close'].forEach((action) => {
  router.post(`/disputes/:id/${action}`, [
    authenticate,
    authorize(...compliance.DISPUTE_ACTION_ROLES),
    body('resolution').optional().isString().isLength({ max: 2000 }),
  ], handle(`${action} dispute`, async (req, res) => {
    if (invalid(req, res)) return;
    const ids = await compliance.visibleVendorIds(req.user);
    if (ids) {
      const dispute = await db('disputes').where('id', req.params.id).first();
      if (dispute && !ids.includes(dispute.vendor_id) && dispute.created_by !== req.user.id) {
        return res.status(403).json({ success: false, error: 'This dispute is not about one of your vendors' });
      }
    }
    const dispute = await compliance.settleDispute(req.user, req.params.id, action, req.body.resolution);
    if (!dispute) return res.status(404).json({ success: false, error: 'Dispute not found' });
    res.json({ success: true, data: { id: dispute.id, status: dispute.status } });
  }));
});

module.exports = router;
