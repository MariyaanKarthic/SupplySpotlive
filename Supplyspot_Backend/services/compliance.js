// Vendor compliance: certification status, certificate expiry, audits and compliance-related disputes.
const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/database');
const { del, delByPrefix } = require('../config/redis');
const { parseJson, today, toDate, toIso, daysBetween } = require('./shipments');

// Admins and compliance managers see every vendor; procurement managers see vendors they have bought from or
// asked for quotes; everyone else gets the summary (KPIs and charts) without vendor-level lists.
const FULL_VIEW_ROLES = ['admin', 'compliance_manager'];
const VENDOR_VIEW_ROLES = ['procurement_manager'];
const WRITE_ROLES = ['admin', 'compliance_manager'];
const DISPUTE_ACTION_ROLES = ['admin', 'compliance_manager', 'procurement_manager'];

const CERTIFICATION_STATUSES = ['certified', 'pending', 'non_compliant'];
const CERT_RECORD_STATUSES = ['verified', 'pending_verification', 'rejected'];
const AUDIT_TYPES = ['routine', 'certification', 'follow_up', 'surprise'];
const AUDIT_RESULTS = ['passed', 'passed_with_observations', 'failed'];

const EXPIRING_WITHIN_DAYS = 30;
const AUDIT_INTERVAL_DAYS = 365;

// A dispute counts as a compliance issue when its category is a compliance one, or it is high / critical priority.
const COMPLIANCE_CATEGORIES = ['quality', 'documentation', 'regulatory', 'compliance', 'safety', 'environmental'];
const ISSUE_PRIORITIES = ['high', 'critical'];
const CLOSED_DISPUTE_STATUSES = ['resolved', 'closed'];
const CATEGORY_LABELS = {
  quality: 'Quality',
  delivery: 'Delivery',
  documentation: 'Documentation',
  regulatory: 'Regulatory',
  payment: 'Payment',
  compliance: 'Compliance',
  safety: 'Safety',
  environmental: 'Environmental',
  invoice_discrepancy: 'Invoice discrepancy',
};
const categoryLabel = (c) => CATEGORY_LABELS[c] || String(c || 'Other').replace(/[_-]/g, ' ').replace(/^\w/, (s) => s.toUpperCase());

const isComplianceIssue = (q) => q.where((b) => b.whereIn('disputes.category', COMPLIANCE_CATEGORIES).orWhereIn('disputes.priority', ISSUE_PRIORITIES));
const isOpen = (q) => q.whereNotIn('disputes.status', CLOSED_DISPUTE_STATUSES);

function access(user) {
  if (FULL_VIEW_ROLES.includes(user.role)) return { level: 'all', label: 'All vendors' };
  if (VENDOR_VIEW_ROLES.includes(user.role)) return { level: 'vendors', label: 'Vendors you have bought from or requested quotes from' };
  return { level: 'summary', label: 'Company-wide summary' };
}

/** Vendor ids the user may see in lists: null for all, otherwise an array (procurement managers). */
async function visibleVendorIds(user) {
  const { level } = access(user);
  if (level === 'all') return null;
  if (level === 'summary') return [];
  const [pos, quotes, awards] = await Promise.all([
    db('purchase_orders').distinct('vendor_id').where('created_by', user.id).whereNotNull('vendor_id'),
    db('quotations').distinct('quotations.vendor_id')
      .join('rfqs', 'rfqs.id', 'quotations.rfq_id')
      .where('rfqs.created_by', user.id)
      .whereNotNull('quotations.vendor_id'),
    db('rfqs').distinct('awarded_vendor_id as vendor_id').where('created_by', user.id).whereNotNull('awarded_vendor_id'),
  ]);
  return [...new Set([...pos, ...quotes, ...awards].map((r) => r.vendor_id))];
}

const scopeVendors = (q, ids, column = 'vendors.id') => (ids ? q.whereIn(column, ids) : q);

// ---------- Certificates ----------

/** Expiry as of today: expired, expiring (within 30 days), valid, or no_expiry. */
function expiryOf(expiryDate, asOf = today()) {
  const date = toDate(expiryDate);
  if (!date) return { expiryDate: null, daysToExpiry: null, expiryState: 'no_expiry' };
  const days = daysBetween(asOf, date);
  let state = 'valid';
  if (days < 0) state = 'expired';
  else if (days <= EXPIRING_WITHIN_DAYS) state = 'expiring';
  return { expiryDate: date, daysToExpiry: days, expiryState: state };
}

const mapCertification = (c, vendorName) => ({
  id: c.id,
  vendorId: c.vendor_id,
  vendorName: vendorName ?? c.vendor_name ?? null,
  type: c.cert_type,
  certificateNumber: c.certificate_number || null,
  issuingBody: c.issuing_body || null,
  issueDate: toDate(c.issue_date),
  ...expiryOf(c.expiry_date),
  status: c.status,
  verifiedBy: c.verified_by || null,
  verifiedAt: toIso(c.verified_at),
  notes: c.notes || null,
  updatedAt: toIso(c.updated_at),
});

// A certificate only counts as current when it is verified and not past its expiry date.
const isCurrent = (c) => c.status === 'verified' && c.expiryState !== 'expired';

// Expired certificates that have been replaced by a current certificate of the same type no longer count against the vendor.
function lapsedCertificates(certs) {
  return certs.filter((c) => c.expiryState === 'expired'
    && !certs.some((o) => o !== c && o.type === c.type && o.expiryState !== 'expired'));
}

// ---------- Vendors ----------

const mapAudit = (a, vendorName) => ({
  id: a.id,
  vendorId: a.vendor_id,
  vendorName: vendorName ?? a.vendor_name ?? null,
  auditDate: toDate(a.audit_date),
  auditType: a.audit_type,
  auditor: a.auditor || null,
  result: a.result,
  score: a.score === null || a.score === undefined ? null : Number(a.score),
  findings: a.findings || null,
  nextAuditDue: toDate(a.next_audit_due),
  createdAt: toIso(a.created_at),
});

/**
 * Green / yellow / red for one vendor, with the reasons behind it.
 * Red: marked non-compliant, a lapsed certificate, or the latest audit failed.
 * Yellow: certification pending, a certificate expiring within 30 days, audit due, an open compliance issue,
 * or documents incomplete. Green otherwise.
 */
function complianceLevel(v) {
  const red = [];
  const yellow = [];
  if (v.certificationStatus === 'non_compliant') red.push('Marked non-compliant');
  v.lapsed.forEach((c) => red.push(`${c.type} expired ${-c.daysToExpiry} day${c.daysToExpiry === -1 ? '' : 's'} ago`));
  if (v.latestAudit && v.latestAudit.result === 'failed') red.push(`Failed audit on ${v.latestAudit.auditDate}`);

  if (v.certificationStatus === 'pending') yellow.push('Certification pending');
  v.certifications.filter((c) => c.expiryState === 'expiring')
    .forEach((c) => yellow.push(`${c.type} expires in ${c.daysToExpiry} day${c.daysToExpiry === 1 ? '' : 's'}`));
  if (v.auditDue) yellow.push(v.lastAuditDate ? `Audit due (last ${v.daysSinceAudit} days ago)` : 'Never audited');
  if (v.openIssues) yellow.push(`${v.openIssues} open compliance issue${v.openIssues === 1 ? '' : 's'}`);
  if (!v.documentation.complete) yellow.push(`Missing: ${v.documentation.missing.join(', ')}`);

  if (red.length) return { level: 'red', label: 'Non-compliant', reasons: [...red, ...yellow] };
  if (yellow.length) return { level: 'yellow', label: 'Warning', reasons: yellow };
  return { level: 'green', label: 'Compliant', reasons: [] };
}

/**
 * Loads vendors with everything compliance needs: certifications, latest audit, open issues, documents and level.
 * ids: null for all vendors, or an array to limit to.
 */
async function loadVendors(ids) {
  const asOf = today();
  const vendors = await scopeVendors(
    db('vendors').select('id', 'name', 'category', 'status', 'is_active', 'compliance_info', 'certification_status', 'last_audit_date', 'audit_notes'),
    ids,
  ).orderBy('name');
  if (!vendors.length) return [];
  const vendorIds = vendors.map((v) => v.id);

  const [certRows, auditRows, issueRows] = await Promise.all([
    db('vendor_certifications').whereIn('vendor_id', vendorIds).orderBy('expiry_date'),
    db('vendor_audits').whereIn('vendor_id', vendorIds).orderBy('audit_date', 'desc').orderBy('created_at', 'desc'),
    isComplianceIssue(isOpen(db('disputes'))).whereIn('vendor_id', vendorIds).groupBy('vendor_id').select('vendor_id').count('id as count'),
  ]);
  const certsBy = new Map();
  certRows.forEach((c) => {
    if (!certsBy.has(c.vendor_id)) certsBy.set(c.vendor_id, []);
    certsBy.get(c.vendor_id).push(mapCertification(c));
  });
  const latestAudit = new Map();
  auditRows.forEach((a) => { if (!latestAudit.has(a.vendor_id)) latestAudit.set(a.vendor_id, mapAudit(a)); });
  const issues = new Map(issueRows.map((r) => [r.vendor_id, Number(r.count) || 0]));

  return vendors.map((row) => {
    const info = parseJson(row.compliance_info, {});
    const certifications = (certsBy.get(row.id) || []).map((c) => ({ ...c, vendorName: row.name }));
    const lastAuditDate = toDate(row.last_audit_date) || toDate(info.lastAuditDate);
    const daysSinceAudit = lastAuditDate ? daysBetween(lastAuditDate, asOf) : null;
    const missing = [];
    if (!info.gstVerified) missing.push('GST verification');
    if (!info.panVerified) missing.push('PAN verification');
    if (!certifications.some(isCurrent)) missing.push('a current verified certificate');
    const v = {
      id: row.id,
      name: row.name,
      category: row.category,
      status: row.status,
      isActive: row.is_active === undefined ? true : !!row.is_active,
      certificationStatus: CERTIFICATION_STATUSES.includes(row.certification_status) ? row.certification_status : 'pending',
      lastAuditDate,
      daysSinceAudit,
      auditDue: daysSinceAudit === null || daysSinceAudit > AUDIT_INTERVAL_DAYS,
      auditNotes: row.audit_notes || null,
      latestAudit: latestAudit.get(row.id) || null,
      certifications,
      lapsed: lapsedCertificates(certifications),
      openIssues: issues.get(row.id) || 0,
      documentation: { gstVerified: !!info.gstVerified, panVerified: !!info.panVerified, complete: missing.length === 0, missing },
    };
    const { lapsed, ...rest } = v;
    return { ...rest, compliance: complianceLevel(v) };
  });
}

// ---------- Dashboard ----------

// For date-only columns (audit_date), which are always stored as YYYY-MM-DD.
const inRange = (q, column, { from, to }) => {
  if (from) q.where(column, '>=', from);
  if (to) q.where(column, '<=', to);
  return q;
};
const withinRange = (date, { from, to }) => !!date && (!from || date >= from) && (!to || date <= to);

/**
 * KPIs and charts. KPIs and the status chart are as of today; the issues-by-category chart and the audit count use the
 * date range ({ from, to }, either may be empty). Summary-only users get the company-wide figures.
 */
async function buildDashboard(user, range) {
  const scope = access(user);
  const ids = scope.level === 'vendors' ? await visibleVendorIds(user) : null;
  const vendors = await loadVendors(ids);
  const asOf = today();

  const total = vendors.length;
  const count = (fn) => vendors.filter(fn).length;
  const certified = count((v) => v.certificationStatus === 'certified');
  const docsComplete = count((v) => v.documentation.complete);
  const allCerts = vendors.flatMap((v) => v.certifications);

  const vendorIdsForIssues = ids;
  const openIssues = await scopeVendors(isComplianceIssue(isOpen(db('disputes'))), vendorIdsForIssues, 'disputes.vendor_id')
    .select('priority').count('id as count').groupBy('priority');
  const openIssueCount = openIssues.reduce((a, r) => a + Number(r.count), 0);
  const urgentIssues = openIssues.filter((r) => r.priority === 'critical').reduce((a, r) => a + Number(r.count), 0);

  // Timestamps may be stored as text or epoch ms depending on how the row was written, so the range is applied here.
  const issueRows = await scopeVendors(isComplianceIssue(db('disputes')), vendorIdsForIssues, 'disputes.vendor_id')
    .select('category', 'status', 'created_at');
  const byCategory = new Map();
  issueRows.filter((d) => withinRange(toDate(d.created_at), range)).forEach((d) => {
    const row = byCategory.get(d.category) || { category: d.category, label: categoryLabel(d.category), total: 0, open: 0 };
    row.total += 1;
    if (!CLOSED_DISPUTE_STATUSES.includes(d.status)) row.open += 1;
    byCategory.set(d.category, row);
  });

  const auditsInRange = await inRange(scopeVendors(db('vendor_audits'), ids, 'vendor_audits.vendor_id'), 'audit_date', range)
    .select('result').count('id as count').groupBy('result');

  return {
    range: { from: range.from || null, to: range.to || null, asOf },
    scope,
    rules: { expiringWithinDays: EXPIRING_WITHIN_DAYS, auditIntervalDays: AUDIT_INTERVAL_DAYS, issueCategories: COMPLIANCE_CATEGORIES, issuePriorities: ISSUE_PRIORITIES },
    kpis: {
      certified: { count: certified, total },
      issues: { count: openIssueCount, critical: urgentIssues },
      auditsDue: { count: count((v) => v.auditDue), neverAudited: count((v) => !v.lastAuditDate), total },
      documentation: { complete: docsComplete, total, percent: total ? Math.round((docsComplete / total) * 100) : 0 },
    },
    certificationStatus: CERTIFICATION_STATUSES.map((s) => ({ status: s, count: count((v) => v.certificationStatus === s) })),
    complianceLevels: ['green', 'yellow', 'red'].map((l) => ({ level: l, count: count((v) => v.compliance.level === l) })),
    certificates: {
      total: allCerts.length,
      expired: allCerts.filter((c) => c.expiryState === 'expired').length,
      expiring: allCerts.filter((c) => c.expiryState === 'expiring').length,
    },
    issuesByCategory: [...byCategory.values()].sort((a, b) => b.total - a.total),
    audits: {
      count: auditsInRange.reduce((a, r) => a + Number(r.count), 0),
      byResult: AUDIT_RESULTS.map((r) => ({ result: r, count: Number(auditsInRange.find((x) => x.result === r)?.count || 0) })),
    },
  };
}

// ---------- Lists ----------

async function listCertifications(ids, { state, vendorId } = {}) {
  const rows = await scopeVendors(
    db('vendor_certifications').join('vendors', 'vendors.id', 'vendor_certifications.vendor_id')
      .select('vendor_certifications.*', 'vendors.name as vendor_name'),
    ids,
  ).modify((q) => { if (vendorId) q.where('vendor_certifications.vendor_id', vendorId); });
  const order = { expired: 0, expiring: 1, valid: 2, no_expiry: 3 };
  return rows.map((c) => mapCertification(c))
    .filter((c) => !state || c.expiryState === state)
    .sort((a, b) => order[a.expiryState] - order[b.expiryState] || (a.daysToExpiry ?? 1e9) - (b.daysToExpiry ?? 1e9));
}

async function listAudits(ids, { from, to, vendorId } = {}) {
  const q = scopeVendors(
    db('vendor_audits').join('vendors', 'vendors.id', 'vendor_audits.vendor_id').select('vendor_audits.*', 'vendors.name as vendor_name'),
    ids,
  );
  if (from) q.where('vendor_audits.audit_date', '>=', from);
  if (to) q.where('vendor_audits.audit_date', '<=', to);
  if (vendorId) q.where('vendor_audits.vendor_id', vendorId);
  const rows = await q.orderBy('vendor_audits.audit_date', 'desc').orderBy('vendor_audits.created_at', 'desc');
  return rows.map((a) => mapAudit(a));
}

/** Compliance-related disputes; open ones only unless includeClosed. Range filters on when the dispute was raised. */
async function listDisputes(ids, { from, to, includeClosed = false, category } = {}) {
  let q = isComplianceIssue(db('disputes').leftJoin('vendors', 'vendors.id', 'disputes.vendor_id')
    .select('disputes.*', 'vendors.name as vendor_name'));
  if (ids) q = q.whereIn('disputes.vendor_id', ids);
  if (!includeClosed) q = isOpen(q);
  if (category) q = q.where('disputes.category', category);
  const asOf = today();
  const rank = { critical: 0, high: 1, medium: 2, low: 3 };
  const rows = (await q).filter((d) => withinRange(toDate(d.created_at), { from, to }));
  return rows.map((d) => {
    const raised = toDate(d.created_at);
    const submitter = parseJson(d.submitted_by, {});
    return {
      id: d.id,
      disputeNumber: d.dispute_number,
      title: d.title,
      description: d.description,
      category: d.category,
      categoryLabel: categoryLabel(d.category),
      priority: d.priority,
      status: d.status,
      vendorId: d.vendor_id || null,
      vendorName: d.vendor_name || submitter.company || submitter.name || null,
      raisedAt: toIso(d.created_at),
      daysOpen: raised ? daysBetween(raised, toDate(d.resolved_at) || asOf) : null,
      resolvedAt: toIso(d.resolved_at),
      resolution: d.resolution_details || null,
    };
  }).sort((a, b) => (rank[a.priority] ?? 9) - (rank[b.priority] ?? 9) || (b.daysOpen ?? 0) - (a.daysOpen ?? 0));
}

// ---------- Writes ----------

/** Records an audit, moves the vendor's last audit date forward if it is newer, and optionally sets its certification status. */
async function recordAudit(user, vendorId, input) {
  return db.transaction(async (trx) => {
    const vendor = await trx('vendors').where('id', vendorId).first();
    if (!vendor) return null;
    const id = uuidv4();
    const row = {
      id,
      vendor_id: vendorId,
      audit_date: input.audit_date,
      audit_type: input.audit_type || 'routine',
      auditor: input.auditor || user.name || user.email,
      result: input.result,
      score: input.score === undefined || input.score === null || input.score === '' ? null : Number(input.score),
      findings: input.findings || null,
      next_audit_due: input.next_audit_due || null,
      created_by: user.id,
    };
    await trx('vendor_audits').insert(row);

    const patch = { updated_at: new Date(), updated_by: user.id };
    const current = toDate(vendor.last_audit_date);
    if (!current || input.audit_date >= current) {
      const info = parseJson(vendor.compliance_info, {});
      patch.last_audit_date = input.audit_date;
      patch.audit_notes = input.findings || null;
      // Vendor performance and the vendor drawer read the audit date from compliance_info.
      patch.compliance_info = JSON.stringify({ ...info, lastAuditDate: input.audit_date });
    }
    if (input.certification_status) patch.certification_status = input.certification_status;
    await trx('vendors').where('id', vendorId).update(patch);

    return mapAudit(await trx('vendor_audits').where('id', id).first(), vendor.name);
  }).then(async (audit) => {
    if (audit) await Promise.all([delByPrefix('vendors:'), del(`vendor:${vendorId}`)]);
    return audit;
  });
}

const CERT_FIELDS = {
  type: 'cert_type',
  certificate_number: 'certificate_number',
  issuing_body: 'issuing_body',
  issue_date: 'issue_date',
  expiry_date: 'expiry_date',
  status: 'status',
  notes: 'notes',
};

/** Updates a certificate; marking it verified records who verified it and when. */
async function updateCertification(user, certId, input) {
  const cert = await db('vendor_certifications').where('id', certId).first();
  if (!cert) return null;
  const patch = { updated_at: new Date(), updated_by: user.id };
  Object.entries(CERT_FIELDS).forEach(([key, column]) => {
    if (input[key] !== undefined) patch[column] = input[key] === '' ? null : input[key];
  });
  // Verifying, or changing the dates of a verified certificate (a renewal), records who checked it and when.
  const datesChanged = ['issue_date', 'expiry_date'].some((k) => k in patch && patch[k] !== toDate(cert[k]));
  const finalStatus = patch.status || cert.status;
  if (finalStatus === 'verified' && (cert.status !== 'verified' || datesChanged)) {
    patch.verified_by = user.name || user.email;
    patch.verified_at = new Date();
  }
  if (patch.status && patch.status !== 'verified') {
    patch.verified_by = null;
    patch.verified_at = null;
  }
  await db('vendor_certifications').where('id', certId).update(patch);
  const saved = await db('vendor_certifications').join('vendors', 'vendors.id', 'vendor_certifications.vendor_id')
    .select('vendor_certifications.*', 'vendors.name as vendor_name').where('vendor_certifications.id', certId).first();
  return mapCertification(saved);
}

/** Resolves or closes a dispute from the dashboard. */
async function settleDispute(user, disputeId, action, resolution) {
  const dispute = await db('disputes').where('id', disputeId).first();
  if (!dispute) return null;
  const status = action === 'close' ? 'closed' : 'resolved';
  await db('disputes').where('id', disputeId).update({
    status,
    resolution_details: resolution || dispute.resolution_details || (status === 'closed' ? 'Closed' : 'Resolved'),
    resolved_at: dispute.resolved_at || new Date(),
    updated_by: user.id,
    updated_at: new Date(),
  });
  await Promise.all([delByPrefix('disputes:'), del(`dispute:${disputeId}`)]);
  return db('disputes').where('id', disputeId).first();
}

const isIsoDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(`${s}T00:00:00Z`).getTime());

module.exports = {
  FULL_VIEW_ROLES,
  WRITE_ROLES,
  DISPUTE_ACTION_ROLES,
  CERTIFICATION_STATUSES,
  CERT_RECORD_STATUSES,
  AUDIT_TYPES,
  AUDIT_RESULTS,
  access,
  visibleVendorIds,
  loadVendors,
  buildDashboard,
  listCertifications,
  listAudits,
  listDisputes,
  recordAudit,
  updateCertification,
  settleDispute,
  isIsoDate,
};
