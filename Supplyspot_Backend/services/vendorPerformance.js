// Vendor performance, scoring, insights and recommended actions.
// Everything is derived from what is already in the database: the vendor row itself
// (rating, spend, contracts, compliance_info) plus purchase orders, invoices, quotations
// and disputes linked to the vendor. When a vendor has no transactional records yet,
// KPIs fall back to the vendor's rating and say so in their `basis` text.

const { db } = require('../config/database');

const SCORECARD_WEIGHTS = {
  delivery: 25,
  quality: 30,
  cost: 20,
  compliance: 15,
  responsiveness: 10
};

const KPI_LABELS = {
  delivery: 'On-Time Delivery',
  quality: 'Quality',
  cost: 'Cost Compliance',
  compliance: 'Compliance',
  responsiveness: 'Responsiveness'
};

const DAY_MS = 24 * 60 * 60 * 1000;
const RECEIVED_PO = ['received', 'closed'];
const CLOSED_PO = ['received', 'closed', 'cancelled'];
const ACK_PO = ['acknowledged', 'partially_received', 'received', 'closed'];
const SENT_PO = ['sent', ...ACK_PO];
const OPEN_DISPUTE = ['submitted', 'assigned', 'investigating', 'pending_supplier', 'pending_internal', 'escalated'];

const parseJson = (value) => {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return {}; }
};

const toDate = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const d = typeof value === 'number' ? new Date(value) : new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

const isoDay = (value) => {
  const d = toDate(value);
  return d ? d.toISOString().split('T')[0] : null;
};

const round = (n, digits = 1) => {
  if (n === null || n === undefined || isNaN(n)) return null;
  const f = Math.pow(10, digits);
  return Math.round(n * f) / f;
};

const pct = (num, den) => (den > 0 ? round((num / den) * 100) : null);
const clamp = (n) => Math.max(0, Math.min(100, n));
const sum = (rows, key) => rows.reduce((s, r) => s + (Number(r[key]) || 0), 0);

const monthKey = (d) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;

function lastMonths(count, now) {
  const months = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    months.push(monthKey(d));
  }
  return months;
}

// ── Data loading ────────────────────────────────────────────────────────────

async function loadTransactions(vendorIds) {
  const scoped = (table) => {
    const q = db(table).select('*');
    if (vendorIds) q.whereIn('vendor_id', vendorIds);
    return q;
  };
  const [purchaseOrders, invoices, quotations, rfqs, disputes] = await Promise.all([
    scoped('purchase_orders'),
    scoped('invoices'),
    scoped('quotations'),
    db('rfqs').select('id', 'rfq_number', 'title', 'budget', 'status', 'awarded_vendor_id', 'awarded_amount'),
    db('disputes').select('*')
  ]);
  return { purchaseOrders, invoices, quotations, rfqs, disputes };
}

function groupBy(rows, key) {
  const map = new Map();
  for (const row of rows) {
    const k = row[key];
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(row);
  }
  return map;
}

// Disputes have no vendor_id column; the vendor is referenced inside submitted_by / assigned_to JSON.
function disputesForVendor(disputes, vendorId) {
  return disputes.filter((d) => {
    const text = `${typeof d.submitted_by === 'string' ? d.submitted_by : JSON.stringify(d.submitted_by || {})}` +
      `${typeof d.assigned_to === 'string' ? d.assigned_to : JSON.stringify(d.assigned_to || {})}` +
      `${typeof d.related_documents === 'string' ? d.related_documents : JSON.stringify(d.related_documents || {})}`;
    return text.includes(vendorId);
  });
}

// ── Per-vendor computation ──────────────────────────────────────────────────

function complianceChecks(info, now) {
  const auditDate = toDate(info.lastAuditDate);
  const auditAgeDays = auditDate ? Math.floor((now - auditDate) / DAY_MS) : null;
  return [
    { key: 'gstVerified', label: 'GST verified', weight: 30, passed: !!info.gstVerified },
    { key: 'panVerified', label: 'PAN verified', weight: 25, passed: !!info.panVerified },
    { key: 'iso9001', label: 'ISO 9001 certified', weight: 20, passed: !!info.iso9001 },
    { key: 'recentAudit', label: 'Audited in last 12 months', weight: 15, passed: auditAgeDays !== null && auditAgeDays <= 365, detail: auditDate ? `Last audit ${isoDay(auditDate)}` : 'No audit on record' },
    { key: 'msmeRegistered', label: 'MSME registered', weight: 10, passed: !!info.msmeRegistered }
  ];
}

function computeVendor(vendor, txn, context) {
  const now = context.now;
  const rating = Number(vendor.rating) || 0;
  const totalSpend = Number(vendor.total_spend) || 0;
  const contracts = Number(vendor.contracts_count) || 0;
  const compliance = parseJson(vendor.compliance_info);
  const onboard = toDate(vendor.onboard_date);
  const tenureMonths = onboard ? Math.max(0, Math.floor((now - onboard) / (30.44 * DAY_MS))) : null;
  const ratingScore = rating > 0 ? round(clamp((rating / 5) * 100)) : null;
  const ratingBasis = rating > 0 ? `Based on vendor rating ${rating}/5` : 'No rating yet';

  const pos = txn.purchaseOrders;
  const invoices = txn.invoices;
  const quotes = txn.quotations;
  const disputes = txn.disputes;

  // Purchase orders / delivery
  const receivedPOs = pos.filter((p) => RECEIVED_PO.includes(p.status));
  const onTimePOs = receivedPOs.filter((p) => {
    const expected = toDate(p.expected_delivery_date);
    const done = toDate(p.updated_at);
    return expected && done ? done.getTime() <= expected.getTime() + DAY_MS : true;
  });
  const overduePOs = pos.filter((p) => {
    const expected = toDate(p.expected_delivery_date);
    return expected && expected < now && !CLOSED_PO.includes(p.status);
  });
  const sentPOs = pos.filter((p) => SENT_PO.includes(p.status));
  const ackPOs = pos.filter((p) => ACK_PO.includes(p.status) || p.acknowledgment_status === 'acknowledged');
  const openPOs = pos.filter((p) => !CLOSED_PO.includes(p.status));
  const cancelledPOs = pos.filter((p) => p.status === 'cancelled');
  const deliveryBase = receivedPOs.length + overduePOs.length;

  // Invoices
  const paidInvoices = invoices.filter((i) => i.status === 'paid');
  const overdueInvoices = invoices.filter((i) => i.status === 'overdue' ||
    (!['paid', 'rejected'].includes(i.status) && toDate(i.due_date) && toDate(i.due_date) < now));
  const matchChecked = invoices.filter((i) => i.matching_status);
  const matchedInvoices = matchChecked.filter((i) => ['matched', 'full_match', 'three_way_matched', 'auto_matched'].includes(String(i.matching_status).toLowerCase()));
  const rejectedInvoices = invoices.filter((i) => i.status === 'rejected');
  const paymentDays = paidInvoices
    .map((i) => {
      const issued = toDate(i.issue_date);
      const paid = toDate(i.payment_date);
      return issued && paid ? (paid - issued) / DAY_MS : null;
    })
    .filter((d) => d !== null);

  // Quotations vs RFQs
  const rfqById = context.rfqById;
  const quotesWithBudget = quotes.filter((q) => q.rfq_id && rfqById.get(q.rfq_id) && Number(rfqById.get(q.rfq_id).budget) > 0);
  const quotesWithinBudget = quotesWithBudget.filter((q) => Number(q.total_amount) <= Number(rfqById.get(q.rfq_id).budget));
  const quoteVsBudget = quotesWithBudget.length
    ? round(quotesWithBudget.reduce((s, q) => s + (Number(q.total_amount) / Number(rfqById.get(q.rfq_id).budget)) * 100, 0) / quotesWithBudget.length)
    : null;
  const awardedRfqs = context.rfqs.filter((r) => r.awarded_vendor_id === vendor.id);

  // Disputes
  const openDisputes = disputes.filter((d) => OPEN_DISPUTE.includes(d.status));
  const resolvedDisputes = disputes.filter((d) => ['resolved', 'closed'].includes(d.status));
  const transactionCount = pos.length + invoices.length;
  const disputeRate = transactionCount > 0 ? pct(disputes.length, transactionCount) : null;

  // ── KPI scores (0-100) ──
  const kpis = {};

  kpis.delivery = deliveryBase > 0
    ? { score: pct(onTimePOs.length, deliveryBase), basis: `${onTimePOs.length} of ${deliveryBase} due purchase orders delivered on time`, dataPoints: deliveryBase }
    : { score: ratingScore, basis: `${ratingBasis} (no delivered purchase orders yet)`, dataPoints: 0 };

  if (transactionCount > 0 || disputes.length > 0) {
    const disputeScore = clamp(100 - (disputeRate || 0) * 2);
    const score = ratingScore !== null ? round(disputeScore * 0.5 + ratingScore * 0.5) : round(disputeScore);
    kpis.quality = { score, basis: `${disputes.length} dispute(s) across ${transactionCount} orders/invoices${ratingScore !== null ? `, blended with rating ${rating}/5` : ''}`, dataPoints: transactionCount };
  } else {
    kpis.quality = { score: ratingScore, basis: `${ratingBasis} (no orders or disputes yet)`, dataPoints: 0 };
  }

  const costSignals = [];
  if (matchChecked.length) costSignals.push({ score: pct(matchedInvoices.length, matchChecked.length), n: matchChecked.length, text: `${matchedInvoices.length}/${matchChecked.length} invoices matched to PO` });
  if (quotesWithBudget.length) costSignals.push({ score: pct(quotesWithinBudget.length, quotesWithBudget.length), n: quotesWithBudget.length, text: `${quotesWithinBudget.length}/${quotesWithBudget.length} quotes within RFQ budget` });
  kpis.cost = costSignals.length
    ? { score: round(costSignals.reduce((s, c) => s + c.score, 0) / costSignals.length), basis: costSignals.map((c) => c.text).join('; '), dataPoints: costSignals.reduce((s, c) => s + c.n, 0) }
    : { score: ratingScore, basis: `${ratingBasis} (no invoices or quotations yet)`, dataPoints: 0 };

  const checks = complianceChecks(compliance, now);
  const complianceScore = checks.reduce((s, c) => s + (c.passed ? c.weight : 0), 0);
  kpis.compliance = { score: complianceScore, basis: `${checks.filter((c) => c.passed).length} of ${checks.length} compliance checks passed`, dataPoints: checks.length };

  kpis.responsiveness = sentPOs.length > 0
    ? { score: pct(ackPOs.length, sentPOs.length), basis: `${ackPOs.length} of ${sentPOs.length} sent purchase orders acknowledged`, dataPoints: sentPOs.length }
    : { score: ratingScore, basis: `${ratingBasis} (no purchase orders sent yet)`, dataPoints: 0 };

  // Compliance alone is not enough to score a vendor: require a rating or transaction-backed KPI.
  const hasPerformanceSignal = Object.keys(kpis).some((key) => key !== 'compliance' && kpis[key].score !== null);
  let weighted = 0;
  let totalWeight = 0;
  const kpiList = Object.keys(SCORECARD_WEIGHTS).map((key) => {
    const k = kpis[key];
    if (k.score !== null) {
      weighted += k.score * SCORECARD_WEIGHTS[key];
      totalWeight += SCORECARD_WEIGHTS[key];
    }
    return { key, label: KPI_LABELS[key], weight: SCORECARD_WEIGHTS[key], score: k.score, basis: k.basis, dataPoints: k.dataPoints, source: key === 'compliance' ? 'compliance' : k.dataPoints > 0 ? 'transactions' : 'rating' };
  });
  const overall = hasPerformanceSignal && totalWeight > 0 ? round(weighted / totalWeight) : null;
  const grade = overall === null ? 'Not Rated' : overall >= 85 ? 'Excellent' : overall >= 70 ? 'Satisfactory' : 'Needs Improvement';

  const complianceStatus = complianceScore >= 85 ? 'Compliant' : complianceScore >= 55 ? 'Partially Compliant' : 'Non-Compliant';

  // ── Risk ──
  const riskReasons = [];
  if (['suspended', 'rejected'].includes(vendor.status)) riskReasons.push(`Vendor is ${vendor.status}`);
  if (overall !== null && overall < 60) riskReasons.push(`Overall score ${overall} is below 60`);
  if (!compliance.gstVerified) riskReasons.push('GST not verified');
  if (!compliance.panVerified) riskReasons.push('PAN not verified');
  if (overduePOs.length) riskReasons.push(`${overduePOs.length} overdue purchase order(s)`);
  if (openDisputes.length) riskReasons.push(`${openDisputes.length} open dispute(s)`);
  if (rating > 0 && rating < 3) riskReasons.push(`Low rating ${rating}/5`);
  const mediumReasons = [];
  if (overall !== null && overall >= 60 && overall < 75) mediumReasons.push(`Overall score ${overall} is below 75`);
  if (!checks.find((c) => c.key === 'recentAudit').passed) mediumReasons.push('No compliance audit in the last 12 months');
  if (rating >= 3 && rating < 3.5) mediumReasons.push(`Rating ${rating}/5 is below target`);
  if (overdueInvoices.length) mediumReasons.push(`${overdueInvoices.length} overdue invoice(s)`);
  const riskLevel = riskReasons.length ? 'High' : mediumReasons.length ? 'Medium' : 'Low';

  // ── Analytics ──
  const months = lastMonths(6, now);
  const monthly = months.map((m) => ({ month: m, orders: 0, orderValue: 0, invoices: 0, invoiceValue: 0 }));
  const monthIdx = new Map(months.map((m, i) => [m, i]));
  for (const p of pos) {
    const d = toDate(p.issue_date) || toDate(p.created_at);
    const i = d ? monthIdx.get(monthKey(d)) : undefined;
    if (i !== undefined) { monthly[i].orders += 1; monthly[i].orderValue += Number(p.total_amount) || 0; }
  }
  for (const inv of invoices) {
    const d = toDate(inv.issue_date) || toDate(inv.created_at);
    const i = d ? monthIdx.get(monthKey(d)) : undefined;
    if (i !== undefined) { monthly[i].invoices += 1; monthly[i].invoiceValue += Number(inv.net_amount || inv.amount) || 0; }
  }

  const peers = context.categoryStats.get(vendor.category) || { count: 1, totalSpend: totalSpend, avgRating: rating, rank: new Map() };
  const analytics = {
    orders: {
      total: pos.length,
      open: openPOs.length,
      received: receivedPOs.length,
      cancelled: cancelledPOs.length,
      overdue: overduePOs.length,
      totalValue: round(sum(pos, 'total_amount'), 2),
      averageValue: pos.length ? round(sum(pos, 'total_amount') / pos.length, 2) : null
    },
    delivery: {
      onTimeRate: pct(onTimePOs.length, deliveryBase),
      onTime: onTimePOs.length,
      late: receivedPOs.length - onTimePOs.length,
      overdue: overduePOs.length,
      acknowledgementRate: pct(ackPOs.length, sentPOs.length)
    },
    quality: {
      rating,
      disputes: disputes.length,
      openDisputes: openDisputes.length,
      resolvedDisputes: resolvedDisputes.length,
      disputeRate,
      rejectedInvoices: rejectedInvoices.length
    },
    cost: {
      totalSpend,
      contracts,
      averageContractValue: contracts ? round(totalSpend / contracts, 2) : null,
      categorySpendShare: peers.totalSpend > 0 ? pct(totalSpend, peers.totalSpend) : null,
      categoryAverageSpend: round(peers.totalSpend / peers.count, 2),
      categorySpendRank: peers.rank.get(vendor.id) || null,
      categoryVendorCount: peers.count,
      categoryAverageRating: round(peers.avgRating, 2),
      invoicedTotal: round(sum(invoices, 'net_amount'), 2),
      paidTotal: round(sum(paidInvoices, 'net_amount'), 2),
      averagePaymentDays: paymentDays.length ? round(paymentDays.reduce((a, b) => a + b, 0) / paymentDays.length) : null,
      invoiceMatchRate: pct(matchedInvoices.length, matchChecked.length),
      quotations: quotes.length,
      quotesWithinBudgetRate: pct(quotesWithinBudget.length, quotesWithBudget.length),
      averageQuoteVsBudget: quoteVsBudget,
      rfqsWon: awardedRfqs.length,
      rfqWinRate: quotes.length ? pct(awardedRfqs.length, quotes.length) : null
    },
    invoices: {
      total: invoices.length,
      paid: paidInvoices.length,
      overdue: overdueInvoices.length,
      pending: invoices.filter((i) => ['submitted', 'pending_approval', 'approved'].includes(i.status)).length
    },
    monthlyTrend: monthly.map((m) => ({ ...m, orderValue: round(m.orderValue, 2), invoiceValue: round(m.invoiceValue, 2) })),
    hasTransactions: transactionCount + quotes.length + disputes.length > 0
  };

  // ── Insights ──
  const strengths = [];
  const improvements = [];
  if (rating >= 4.5) strengths.push(`Excellent rating of ${rating}/5`);
  else if (rating >= 4) strengths.push(`Strong rating of ${rating}/5`);
  if (rating > 0 && rating < 3.5) improvements.push(`Rating ${rating}/5 is below the 3.5 target`);
  if (rating === 0) improvements.push('Vendor has not been rated yet');
  if (complianceScore === 100) strengths.push('Passes every compliance check');
  else checks.filter((c) => !c.passed).forEach((c) => improvements.push(c.key === 'recentAudit' ? `${c.label}: ${c.detail}` : `${c.label}: not on file`));
  if (compliance.iso9001) strengths.push('ISO 9001 certified quality system');
  if (peers.rank.get(vendor.id) === 1 && peers.count > 1) strengths.push(`Highest spend in ${vendor.category} (${peers.count} vendors)`);
  else if (peers.rank.get(vendor.id) && peers.rank.get(vendor.id) <= 3 && peers.count > 3) strengths.push(`Top 3 by spend in ${vendor.category}`);
  if (contracts >= 10) strengths.push(`${contracts} contracts awarded`);
  if (tenureMonths !== null && tenureMonths >= 36) strengths.push(`Long-standing relationship (${Math.floor(tenureMonths / 12)} years)`);
  if (rating > 0 && peers.count > 1 && rating > peers.avgRating + 0.3) strengths.push(`Rated above the ${vendor.category} average of ${round(peers.avgRating, 2)}`);
  if (rating > 0 && peers.count > 1 && rating < peers.avgRating - 0.3) improvements.push(`Rated below the ${vendor.category} average of ${round(peers.avgRating, 2)}`);
  if (kpis.delivery.dataPoints > 0 && kpis.delivery.score >= 90) strengths.push(`On-time delivery at ${kpis.delivery.score}%`);
  if (kpis.delivery.dataPoints > 0 && kpis.delivery.score < 80) improvements.push(`On-time delivery at ${kpis.delivery.score}%`);
  if (overduePOs.length) improvements.push(`${overduePOs.length} purchase order(s) past expected delivery`);
  if (openDisputes.length) improvements.push(`${openDisputes.length} open dispute(s)`);
  if (overdueInvoices.length) improvements.push(`${overdueInvoices.length} overdue invoice(s)`);
  if (vendor.status === 'under_review') improvements.push('Registration is still under review');

  const summaryParts = [];
  summaryParts.push(overall !== null ? `${vendor.name} scores ${overall}/100 (${grade}) with ${riskLevel.toLowerCase()} risk.` : `${vendor.name} has no score yet.`);
  if (!analytics.hasTransactions) summaryParts.push('No purchase orders, invoices or disputes are recorded yet, so delivery, quality, cost and responsiveness use the vendor rating until transactions come in.');
  const insights = {
    summary: summaryParts.join(' '),
    strengths,
    improvements,
    riskLevel,
    riskReasons: [...riskReasons, ...mediumReasons]
  };

  // ── Recommended actions ──
  const actions = [];
  const add = (title, priority, category, reason) => actions.push({ title, priority, category, reason });
  if (vendor.status === 'under_review') add('Complete registration review', 'High', 'Onboarding', 'Vendor is still under review');
  if (!compliance.gstVerified) add('Verify GST registration', 'High', 'Compliance', 'GST verification is missing');
  if (!compliance.panVerified) add('Verify PAN details', 'High', 'Compliance', 'PAN verification is missing');
  if (!checks.find((c) => c.key === 'recentAudit').passed) add('Schedule compliance audit', 'Medium', 'Compliance', checks.find((c) => c.key === 'recentAudit').detail);
  if (!compliance.iso9001 && ['manufacturing', 'materials'].includes(vendor.category)) add('Request ISO 9001 certification plan', 'Medium', 'Quality', 'No ISO 9001 certificate on file for a production supplier');
  if (overduePOs.length) add('Expedite overdue purchase orders', 'High', 'Logistics', `${overduePOs.length} PO(s) past expected delivery`);
  if (openDisputes.length) add('Resolve open disputes', 'High', 'Quality', `${openDisputes.length} dispute(s) still open`);
  if (overdueInvoices.length) add('Clear overdue invoices', 'Medium', 'Finance', `${overdueInvoices.length} invoice(s) overdue`);
  if (rating > 0 && rating < 3.5) add('Hold performance review meeting', rating < 3 ? 'High' : 'Medium', 'Performance', `Rating ${rating}/5 is below target`);
  if (grade === 'Excellent' && contracts >= 5) add('Consider for strategic partnership', 'Low', 'Contracts', `Score ${overall} with ${contracts} contracts`);
  if (!analytics.hasTransactions && vendor.status === 'active') add('Record purchase orders and invoices', 'Low', 'Data', 'Scores will reflect actual delivery and cost data once transactions are recorded');

  // ── Activity history (from real records, newest first) ──
  const history = [];
  const push = (date, type, description) => { const d = isoDay(date); if (d) history.push({ date: d, type, description }); };
  push(vendor.onboard_date, 'Onboarding', 'Vendor onboarded');
  push(vendor.created_at, 'Registration', 'Vendor record created');
  push(compliance.lastAuditDate, 'Compliance', 'Compliance audit completed');
  pos.forEach((p) => push(p.issue_date || p.created_at, 'Purchase Order', `PO ${p.po_number} issued (${p.status})`));
  invoices.forEach((i) => push(i.issue_date || i.created_at, 'Invoice', `Invoice ${i.invoice_number} received (${i.status})`));
  invoices.filter((i) => i.payment_date).forEach((i) => push(i.payment_date, 'Payment', `Invoice ${i.invoice_number} paid`));
  quotes.forEach((q) => push(q.submitted_date || q.created_at, 'Quotation', `Quotation ${q.quotation_number} submitted (${q.status})`));
  disputes.forEach((d) => push(d.created_at, 'Dispute', `Dispute ${d.dispute_number} raised: ${d.title}`));
  disputes.filter((d) => d.resolved_at).forEach((d) => push(d.resolved_at, 'Dispute', `Dispute ${d.dispute_number} resolved`));
  history.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  return {
    vendorId: vendor.id,
    name: vendor.name,
    category: vendor.category,
    status: vendor.status,
    performance: {
      totalSpend,
      contracts,
      rating,
      averageContractValue: analytics.cost.averageContractValue,
      onboardDate: isoDay(vendor.onboard_date),
      tenureMonths,
      complianceStatus,
      complianceScore,
      complianceChecks: checks
    },
    analytics,
    scoring: { weights: SCORECARD_WEIGHTS, kpis: kpiList, overall, grade, riskLevel },
    insights,
    actions: { recommended: actions, history }
  };
}

function buildContext(vendors, rfqs, now) {
  const categoryStats = new Map();
  for (const v of vendors) {
    const s = categoryStats.get(v.category) || { count: 0, totalSpend: 0, ratingSum: 0, rated: 0, members: [] };
    s.count += 1;
    s.totalSpend += Number(v.total_spend) || 0;
    if (Number(v.rating) > 0) { s.ratingSum += Number(v.rating); s.rated += 1; }
    s.members.push(v);
    categoryStats.set(v.category, s);
  }
  for (const s of categoryStats.values()) {
    s.avgRating = s.rated ? s.ratingSum / s.rated : 0;
    s.rank = new Map(
      [...s.members].sort((a, b) => (Number(b.total_spend) || 0) - (Number(a.total_spend) || 0)).map((v, i) => [v.id, i + 1])
    );
    delete s.members;
  }
  return { now, rfqs, rfqById: new Map(rfqs.map((r) => [r.id, r])), categoryStats };
}

async function getVendorPerformance(vendorId) {
  const vendor = await db('vendors').where({ id: vendorId }).first();
  if (!vendor) return null;
  const allVendors = await db('vendors').select('id', 'category', 'total_spend', 'rating');
  const t = await loadTransactions([vendorId]);
  const context = buildContext(allVendors, t.rfqs, new Date());
  return computeVendor(vendor, {
    purchaseOrders: t.purchaseOrders,
    invoices: t.invoices,
    quotations: t.quotations,
    disputes: disputesForVendor(t.disputes, vendorId)
  }, context);
}

async function getPerformanceOverview() {
  const vendors = await db('vendors').select('*');
  const t = await loadTransactions(null);
  const context = buildContext(vendors, t.rfqs, new Date());
  const poBy = groupBy(t.purchaseOrders, 'vendor_id');
  const invBy = groupBy(t.invoices, 'vendor_id');
  const quoteBy = groupBy(t.quotations, 'vendor_id');

  const results = vendors.map((v) => computeVendor(v, {
    purchaseOrders: poBy.get(v.id) || [],
    invoices: invBy.get(v.id) || [],
    quotations: quoteBy.get(v.id) || [],
    disputes: disputesForVendor(t.disputes, v.id)
  }, context));

  const avgOf = (fn) => {
    const vals = results.map(fn).filter((x) => x !== null && x !== undefined);
    return vals.length ? round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  };
  const kpiAvg = (key) => avgOf((r) => r.scoring.kpis.find((k) => k.key === key).score);
  const rated = results.filter((r) => r.performance.rating > 0);

  const vendorRows = results
    .map((r) => ({
      vendorId: r.vendorId,
      name: r.name,
      category: r.category,
      status: r.status,
      totalSpend: r.performance.totalSpend,
      contracts: r.performance.contracts,
      rating: r.performance.rating,
      complianceStatus: r.performance.complianceStatus,
      complianceScore: r.performance.complianceScore,
      kpis: Object.fromEntries(r.scoring.kpis.map((k) => [k.key, k.score])),
      overall: r.scoring.overall,
      grade: r.scoring.grade,
      riskLevel: r.scoring.riskLevel,
      riskReasons: r.insights.riskReasons,
      topAction: r.actions.recommended[0] || null,
      recommendedActions: r.actions.recommended
    }))
    .sort((a, b) => (b.overall ?? -1) - (a.overall ?? -1));

  return {
    generatedAt: new Date().toISOString(),
    weights: SCORECARD_WEIGHTS,
    summary: {
      totalVendors: results.length,
      activeVendors: results.filter((r) => r.status === 'active').length,
      totalSpend: round(results.reduce((s, r) => s + r.performance.totalSpend, 0), 2),
      totalContracts: results.reduce((s, r) => s + r.performance.contracts, 0),
      averageRating: rated.length ? round(rated.reduce((s, r) => s + r.performance.rating, 0) / rated.length, 2) : null,
      averageOverall: avgOf((r) => r.scoring.overall),
      averageKpis: Object.fromEntries(Object.keys(SCORECARD_WEIGHTS).map((k) => [k, kpiAvg(k)])),
      compliantVendors: results.filter((r) => r.performance.complianceStatus === 'Compliant').length,
      gradeCounts: {
        Excellent: results.filter((r) => r.scoring.grade === 'Excellent').length,
        Satisfactory: results.filter((r) => r.scoring.grade === 'Satisfactory').length,
        'Needs Improvement': results.filter((r) => r.scoring.grade === 'Needs Improvement').length
      },
      riskCounts: {
        High: results.filter((r) => r.scoring.riskLevel === 'High').length,
        Medium: results.filter((r) => r.scoring.riskLevel === 'Medium').length,
        Low: results.filter((r) => r.scoring.riskLevel === 'Low').length
      },
      transactions: {
        purchaseOrders: t.purchaseOrders.length,
        invoices: t.invoices.length,
        quotations: t.quotations.length,
        disputes: t.disputes.length
      }
    },
    vendors: vendorRows
  };
}

module.exports = { getVendorPerformance, getPerformanceOverview, SCORECARD_WEIGHTS };
