const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('../middleware/auth');
const { db } = require('../config/database');
const logger = require('../config/logger');
const { isIsoDate } = require('../services/finance');
const { REPORT_TYPES, buildReport, departments, scopeFor } = require('../services/reports');
const { toCsv, toPdf, fileName } = require('../services/reportExport');

const router = express.Router();

// Reads ?from&to&department (or date_from/date_to in an export body); returns an error message or the filters.
function readFilters(src) {
  const from = src.from || src.date_from || '';
  const to = src.to || src.date_to || '';
  const department = src.department || '';
  if ((from && !isIsoDate(from)) || (to && !isIsoDate(to))) return { error: 'Dates must be in YYYY-MM-DD format' };
  if (from && to && from > to) return { error: 'The start date must be on or before the end date' };
  if (typeof department !== 'string' || department.length > 100) return { error: 'Invalid department' };
  return { from, to, department };
}

const send = (type) => async (req, res) => {
  const filters = readFilters(req.query);
  if (filters.error) return res.status(400).json({ success: false, error: filters.error });
  try {
    res.json({ success: true, data: await buildReport(type, req.user, filters) });
  } catch (error) {
    logger.error(`Report ${type} error:`, error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * Reports. Every report takes ?from=YYYY-MM-DD&to=YYYY-MM-DD (both optional) and ?department=<name>.
 * Admins and finance managers see all departments and may pick one; other users always see their own
 * purchases plus their department's requests, and the department parameter is ignored for them.
 */
router.get('/meta', authenticate, async (req, res) => {
  try {
    const scope = scopeFor(req.user, '');
    res.json({
      success: true,
      data: {
        reports: REPORT_TYPES,
        canChooseDepartment: scope.all,
        departments: scope.all ? await departments() : (req.user.department ? [req.user.department] : []),
        scopeLabel: scope.label,
      },
    });
  } catch (error) {
    logger.error('Report meta error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/spend', authenticate, send('spend'));
router.get('/suppliers/performance', authenticate, send('suppliers'));
router.get('/delivery/performance', authenticate, send('delivery'));
router.get('/pr-approval', authenticate, send('pr-approval'));
router.get('/invoice-payment', authenticate, send('invoice-payment'));
router.get('/compliance', authenticate, send('compliance'));

/**
 * POST /reports/export { report_type, format: "csv" | "pdf", date_from, date_to, department }
 * Returns the file as a download.
 */
router.post('/export', authenticate, async (req, res) => {
  const { report_type: type, format = 'csv' } = req.body || {};
  if (!REPORT_TYPES.includes(type)) return res.status(400).json({ success: false, error: `report_type must be one of ${REPORT_TYPES.join(', ')}` });
  if (!['csv', 'pdf'].includes(format)) return res.status(400).json({ success: false, error: 'format must be csv or pdf' });
  const filters = readFilters(req.body || {});
  if (filters.error) return res.status(400).json({ success: false, error: filters.error });
  try {
    const report = await buildReport(type, req.user, filters);
    const name = fileName(type, report, format);
    res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    if (format === 'csv') {
      res.type('text/csv; charset=utf-8').send(toCsv(type, report));
    } else {
      res.type('application/pdf').send(toPdf(type, report));
    }
  } catch (error) {
    logger.error(`Report export ${type} error:`, error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ---------- Email schedules (stored preference only; nothing is emailed yet) ----------

const FREQUENCIES = ['weekly', 'monthly'];
const mapSchedule = (s) => ({
  reportType: s.report_type,
  frequency: s.frequency,
  format: s.format,
  email: s.email,
  filters: typeof s.filters === 'string' ? JSON.parse(s.filters || '{}') : (s.filters || {}),
  updatedAt: s.updated_at,
});

router.get('/schedules', authenticate, async (req, res) => {
  try {
    const rows = await db('report_schedules').where('user_id', req.user.id);
    res.json({ success: true, data: rows.map(mapSchedule) });
  } catch (error) {
    logger.error('Report schedules error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/schedules/:type', authenticate, async (req, res) => {
  const type = req.params.type;
  const { frequency = 'weekly', format = 'pdf', email = req.user.email, filters = {} } = req.body || {};
  if (!REPORT_TYPES.includes(type)) return res.status(400).json({ success: false, error: 'Unknown report' });
  if (!FREQUENCIES.includes(frequency)) return res.status(400).json({ success: false, error: 'frequency must be weekly or monthly' });
  if (!['csv', 'pdf'].includes(format)) return res.status(400).json({ success: false, error: 'format must be csv or pdf' });
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ success: false, error: 'A valid email is required' });
  const cleanFilters = { period: String(filters.period || '').slice(0, 40), department: String(filters.department || '').slice(0, 100) };
  try {
    const existing = await db('report_schedules').where({ user_id: req.user.id, report_type: type }).first();
    const row = { frequency, format, email, filters: JSON.stringify(cleanFilters), updated_at: new Date().toISOString() };
    if (existing) await db('report_schedules').where('id', existing.id).update(row);
    else await db('report_schedules').insert({ id: uuidv4(), user_id: req.user.id, report_type: type, ...row, created_at: new Date().toISOString() });
    const saved = await db('report_schedules').where({ user_id: req.user.id, report_type: type }).first();
    res.json({ success: true, data: mapSchedule(saved) });
  } catch (error) {
    logger.error('Report schedule save error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/schedules/:type', authenticate, async (req, res) => {
  try {
    await db('report_schedules').where({ user_id: req.user.id, report_type: req.params.type }).del();
    res.json({ success: true });
  } catch (error) {
    logger.error('Report schedule delete error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
