// Reports dashboard: six reports (spend, supplier performance, delivery, PR & approval, invoice & payment,
// compliance) built from existing purchase orders, shipments, purchase requests, invoices and vendors,
// plus a flat export layout of each report for CSV and PDF downloads.
const { db } = require('../config/database');
const { today, toDate, daysBetween, parseJson } = require('./shipments');
const { enrichInvoices, round2 } = require('./invoices');
const { COMMITTED_PO_STATUSES, BASE_CURRENCY } = require('./finance');

const REPORT_TYPES = ['spend', 'suppliers', 'delivery', 'pr-approval', 'invoice-payment', 'compliance'];
// Same as the finance dashboard: admins and finance managers see the whole company.
const FULL_VIEW_ROLES = ['admin', 'finance_manager'];
const APPROVER_ROLES = ['admin', 'procurement_manager'];
const SENT_PO = ['sent', 'acknowledged', 'partially_received', 'received', 'closed'];
const ACK_PO = ['acknowledged', 'partially_received', 'received', 'closed'];

const round1 = (n) => Math.round((Number(n) || 0) * 10) / 10;
const pct = (num, den) => (den > 0 ? round1((num / den) * 100) : null);
const avg = (list) => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : null);
const inRangeDay = (day, { from, to }) => !!day && (!from || day >= from) && (!to || day <= to);
const isBase = (currency) => !currency || currency === BASE_CURRENCY;

// Timestamps arrive as "YYYY-MM-DD HH:MM:SS" (UTC), ISO strings or epoch ms depending on how the row was written.
function toMs(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return value;
  if (/^\d+$/.test(String(value))) return Number(value);
  const s = String(value);
  const d = new Date(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s) ? `${s.replace(' ', 'T')}Z` : s);
  return isNaN(d.getTime()) ? null : d.getTime();
}
const dayOf = (value) => {
  const ms = toMs(value);
  return ms === null ? toDate(value) : new Date(ms).toISOString().split('T')[0];
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthLabel = (key) => `${MONTH_NAMES[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`;

// Month keys (YYYY-MM) covering the range. Open ends are filled from the data, then capped to 24 months.
// Future months are left off (a year-to-date chart stops at this month) unless keepFuture is set.
function monthsFor(range, days, { keepFuture = false } = {}) {
  const known = days.filter(Boolean).sort();
  let start = (range.from || known[0] || today()).slice(0, 7);
  let end = (range.to || known[known.length - 1] || today()).slice(0, 7);
  if (!range.to && end < today().slice(0, 7) && known.length) end = known[known.length - 1].slice(0, 7);
  const thisMonth = today().slice(0, 7);
  if (!keepFuture && end > thisMonth) end = thisMonth > start ? thisMonth : start;
  if (start > end) [start, end] = [end, start];
  const out = [];
  let [y, m] = start.split('-').map(Number);
  while (out.length < 120) {
    const key = `${y}-${String(m).padStart(2, '0')}`;
    out.push(key);
    if (key >= end) break;
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return out.slice(-24);
}

// ---------- Scope ----------

/**
 * Who sees what. Admins and finance managers see everything and may narrow to one department.
 * Everyone else sees POs they created plus POs sourced from purchase requests they raised or that
 * belong to their department (the same rule as the finance dashboard), and their own and their
 * department's purchase requests.
 */
function scopeFor(user, department) {
  const all = FULL_VIEW_ROLES.includes(user.role);
  const dept = all ? (department && department !== 'all' ? department : null) : (user.department || null);
  let label;
  if (all) label = dept ? `${dept} department` : 'All departments';
  else label = dept ? `Your purchases and ${dept} department requests` : 'Purchases and requests you raised';
  return { all, dept, user, label };
}

// Subquery of PO ids in scope, or null for "every PO".
function scopedPoIds(scope) {
  if (scope.all && !scope.dept) return null;
  const prRfqs = () => db('purchase_requests').select('rfq_id').whereNotNull('rfq_id');
  if (scope.all) {
    return db('purchase_orders').select('purchase_orders.id').where((b) => b
      .whereIn('purchase_orders.rfq_id', prRfqs().where('department', scope.dept))
      .orWhereIn('purchase_orders.created_by', db('users').select('id').where('department', scope.dept)));
  }
  return db('purchase_orders').select('purchase_orders.id').where((b) => b
    .where('purchase_orders.created_by', scope.user.id)
    .orWhereIn('purchase_orders.rfq_id', prRfqs().where((p) => {
      p.where('requester_id', scope.user.id);
      if (scope.dept) p.orWhere('department', scope.dept);
    })));
}
const scopePos = (q, poIds) => (poIds ? q.whereIn('purchase_orders.id', poIds) : q);

function scopePrs(q, scope) {
  if (scope.all) return scope.dept ? q.where('purchase_requests.department', scope.dept) : q;
  return q.where((b) => {
    b.where('purchase_requests.requester_id', scope.user.id);
    if (scope.dept) b.orWhere('purchase_requests.department', scope.dept);
  });
}

async function departments() {
  const [prDepts, userDepts] = await Promise.all([
    db('purchase_requests').distinct('department').whereNotNull('department'),
    db('users').distinct('department').whereNotNull('department'),
  ]);
  return [...new Set([...prDepts, ...userDepts].map((r) => r.department).filter(Boolean))].sort();
}

async function userNames(ids) {
  const list = [...new Set(ids.filter(Boolean))];
  if (!list.length) return {};
  const rows = await db('users').whereIn('id', list).select('id', 'name', 'email');
  return Object.fromEntries(rows.map((u) => [u.id, u.name || u.email]));
}

// Committed POs (approved onwards) issued in the range, with vendor name and category.
function committedPos(range, poIds) {
  const q = scopePos(db('purchase_orders'), poIds)
    .leftJoin('vendors', 'vendors.id', 'purchase_orders.vendor_id')
    .whereIn('purchase_orders.status', COMMITTED_PO_STATUSES)
    .select('purchase_orders.*', 'vendors.name as vendor_name', 'vendors.category as vendor_category', 'vendors.rating as vendor_rating');
  if (range.from) q.where('purchase_orders.issue_date', '>=', range.from);
  if (range.to) q.where('purchase_orders.issue_date', '<=', range.to);
  return q.orderBy('purchase_orders.issue_date', 'desc');
}

function currencySplit(rows, amountOf) {
  const base = { amount: 0, count: 0 };
  const others = {};
  for (const r of rows) {
    const amount = Number(amountOf(r)) || 0;
    if (isBase(r.currency)) { base.amount += amount; base.count += 1; } else {
      const o = others[r.currency] || (others[r.currency] = { currency: r.currency, amount: 0, count: 0 });
      o.amount += amount;
      o.count += 1;
    }
  }
  return { amount: round2(base.amount), count: base.count, others: Object.values(others).map((o) => ({ ...o, amount: round2(o.amount) })) };
}

// ---------- 1. Spend analysis ----------

async function buildSpend(scope, range) {
  const poIds = scopedPoIds(scope);
  const pos = (await committedPos(range, poIds)).map((p) => ({ ...p, issue_date: toDate(p.issue_date), total_amount: Number(p.total_amount) || 0 }));
  const base = pos.filter((p) => isBase(p.currency));
  const total = currencySplit(pos, (p) => p.total_amount);
  const largest = base.reduce((m, p) => (!m || p.total_amount > m.total_amount ? p : m), null);

  const byVendorMap = new Map();
  for (const p of base) {
    const v = byVendorMap.get(p.vendor_id) || { vendorId: p.vendor_id, vendorName: p.vendor_name || 'Unknown vendor', category: p.vendor_category || 'other', amount: 0, poCount: 0 };
    v.amount += p.total_amount;
    v.poCount += 1;
    byVendorMap.set(p.vendor_id, v);
  }
  const vendors = [...byVendorMap.values()].sort((a, b) => b.amount - a.amount);

  // Invoices raised against these POs (not drafts), counted per vendor.
  const invoiceCounts = pos.length
    ? await db('invoices').whereIn('po_id', pos.map((p) => p.id)).whereNot('status', 'draft')
      .select('vendor_id').count({ count: '*' }).groupBy('vendor_id')
    : [];
  const invoiceByVendor = Object.fromEntries(invoiceCounts.map((r) => [r.vendor_id, Number(r.count) || 0]));

  const top3 = vendors.slice(0, 3);
  const top3Amount = top3.reduce((a, v) => a + v.amount, 0);

  const months = monthsFor(range, pos.map((p) => p.issue_date));
  const byMonth = months.map((key) => {
    const list = base.filter((p) => p.issue_date && p.issue_date.startsWith(key));
    return { month: key, label: monthLabel(key), amount: round2(list.reduce((a, p) => a + p.total_amount, 0)), count: list.length };
  });

  const group = (rows, keyOf, amountOf = (p) => p.total_amount) => {
    const m = new Map();
    rows.forEach((p) => {
      const k = keyOf(p);
      const g = m.get(k) || { name: k, amount: 0, count: 0 };
      g.amount += amountOf(p);
      g.count += 1;
      m.set(k, g);
    });
    return [...m.values()].map((g) => ({ ...g, amount: round2(g.amount) })).sort((a, b) => b.amount - a.amount);
  };

  return {
    kpis: {
      totalSpend: total,
      avgOrderValue: { amount: base.length ? round2(total.amount / base.length) : 0, count: base.length },
      largestOrder: largest
        ? { amount: largest.total_amount, poId: largest.id, poNumber: largest.po_number, vendorId: largest.vendor_id, vendorName: largest.vendor_name }
        : null,
      supplierConcentration: { pct: pct(top3Amount, total.amount), amount: round2(top3Amount), vendors: top3.map((v) => v.vendorName), vendorCount: vendors.length },
    },
    byMonth,
    byCategory: group(base, (p) => p.vendor_category || 'other'),
    byVendor: vendors.slice(0, 10).map((v) => ({ ...v, amount: round2(v.amount) })),
    byPaymentTerms: group(base, (p) => (p.terms || '').trim() || 'Not set'),
    // Amounts per currency are in that currency; the chart compares PO counts.
    byCurrency: group(pos, (p) => p.currency || BASE_CURRENCY),
    topVendors: vendors.map((v) => ({
      vendorId: v.vendorId,
      vendorName: v.vendorName,
      category: v.category,
      totalPoValue: round2(v.amount),
      poCount: v.poCount,
      invoiceCount: invoiceByVendor[v.vendorId] || 0,
      avgPoSize: round2(v.amount / v.poCount),
      sharePct: pct(v.amount, total.amount),
    })),
    orders: pos.map((p) => ({
      poId: p.id, poNumber: p.po_number, vendorId: p.vendor_id, vendorName: p.vendor_name, category: p.vendor_category,
      issueDate: p.issue_date, status: p.status, currency: p.currency || BASE_CURRENCY, amount: p.total_amount, terms: p.terms || '',
    })),
  };
}

// ---------- Shipments shared by supplier and delivery reports ----------

const DELAY_REASONS = [
  { id: 'weather', label: 'Weather', words: ['weather', 'rain', 'storm', 'flood', 'fog', 'cyclone', 'snow'] },
  { id: 'documents', label: 'Document issues', words: ['document', 'paperwork', 'customs', 'e-way', 'eway', 'permit', 'invoice missing', 'clearance'] },
  { id: 'vendor', label: 'Vendor stock or production', words: ['stock', 'back-order', 'backorder', 'back order', 'production', 'shortage', 'not ready'] },
  { id: 'transit', label: 'Delayed in transit', words: ['transit', 'truck', 'breakdown', 'vehicle', 'road', 'traffic', 'hub', 'closure', 'carrier', 'route', 'held', 'port', 'strike'] },
];
function delayReason(text) {
  if (!text) return { id: 'unrecorded', label: 'No reason recorded' };
  const t = text.toLowerCase();
  const hit = DELAY_REASONS.find((r) => r.words.some((w) => t.includes(w)));
  return hit ? { id: hit.id, label: hit.label } : { id: 'other', label: 'Other' };
}

/**
 * Shipments (not cancelled) on in-scope POs, each with its delivery outcome:
 * on_time / late (arrived after the expected date, or still open past it) / open (not due yet).
 * Arrival is the shipment's actual delivery date, else its first goods receipt, else a "delivered" tracking event.
 */
async function loadShipments(poIds, { range = null, poIdList = null } = {}) {
  const q = db('shipments')
    .leftJoin('purchase_orders', 'purchase_orders.id', 'shipments.po_id')
    .leftJoin('vendors', 'vendors.id', 'shipments.vendor_id')
    .whereNot('shipments.status', 'cancelled')
    .select('shipments.*', 'purchase_orders.po_number', 'purchase_orders.issue_date as po_issue_date', 'vendors.name as vendor_name');
  if (poIds) q.whereIn('shipments.po_id', poIds);
  if (poIdList) q.whereIn('shipments.po_id', poIdList);
  if (range?.from) q.where('shipments.expected_delivery_date', '>=', range.from);
  if (range?.to) q.where('shipments.expected_delivery_date', '<=', range.to);
  const rows = await q;
  if (!rows.length) return [];
  const ids = rows.map((s) => s.id);
  const [receipts, events] = await Promise.all([
    db('shipment_receipts').whereIn('shipment_id', ids).select('shipment_id', 'received_date'),
    db('delivery_tracking').whereIn('shipment_id', ids).whereIn('status_event', ['delivered', 'exception']).select('shipment_id', 'status_event', 'event_date', 'notes'),
  ]);
  const asOf = today();
  return rows.map((s) => {
    const firstGrn = receipts.filter((r) => r.shipment_id === s.id).map((r) => toDate(r.received_date)).filter(Boolean).sort()[0] || null;
    const evs = events.filter((e) => e.shipment_id === s.id).sort((a, b) => String(a.event_date).localeCompare(String(b.event_date)));
    const deliveredEvent = evs.find((e) => e.status_event === 'delivered');
    const exceptions = evs.filter((e) => e.status_event === 'exception');
    const expected = toDate(s.expected_delivery_date);
    const arrived = toDate(s.actual_delivery_date) || firstGrn || (deliveredEvent ? dayOf(deliveredEvent.event_date) : null);
    let outcome = 'open';
    let delayDays = 0;
    if (arrived && expected) {
      delayDays = Math.max(0, daysBetween(expected, arrived));
      outcome = delayDays > 0 ? 'late' : 'on_time';
    } else if (!arrived && expected && expected < asOf) {
      delayDays = daysBetween(expected, asOf);
      outcome = 'late';
    } else if (arrived && !expected) {
      outcome = 'on_time';
    }
    const lastException = exceptions[exceptions.length - 1];
    const reasonText = lastException?.notes || (outcome === 'late' ? s.notes : null) || null;
    return {
      id: s.id,
      shipmentNumber: s.shipment_number,
      poId: s.po_id,
      poNumber: s.po_number,
      poIssueDate: toDate(s.po_issue_date),
      vendorId: s.vendor_id,
      vendorName: s.vendor_name || 'Unknown vendor',
      status: s.status,
      expected,
      arrived,
      stillOpen: !arrived,
      outcome,
      delayDays,
      hasException: exceptions.length > 0,
      reason: outcome === 'late' ? { ...delayReason(reasonText), text: reasonText } : null,
      leadTimeDays: arrived && toDate(s.po_issue_date) ? Math.max(0, daysBetween(toDate(s.po_issue_date), arrived)) : null,
    };
  });
}

// ---------- 2. Supplier performance ----------

const LEAD_BUCKETS = [
  { label: '0–7 days', min: 0, max: 7 },
  { label: '8–14 days', min: 8, max: 14 },
  { label: '15–21 days', min: 15, max: 21 },
  { label: '22–30 days', min: 22, max: 30 },
  { label: '31+ days', min: 31, max: Infinity },
];

async function buildSuppliers(scope, range) {
  const poIds = scopedPoIds(scope);
  const pos = await committedPos(range, poIds);
  const vendorIds = [...new Set(pos.map((p) => p.vendor_id).filter(Boolean))];
  const shipments = pos.length ? await loadShipments(null, { poIdList: pos.map((p) => p.id) }) : [];

  // Price competitiveness: on RFQs with two or more quotes, how close each vendor's quote was to the lowest.
  const quotes = vendorIds.length
    ? await db('quotations').whereNotNull('rfq_id').whereIn('rfq_id', db('quotations').select('rfq_id').whereIn('vendor_id', vendorIds))
      .whereNot('status', 'archived').select('id', 'rfq_id', 'vendor_id', 'total_amount', 'currency')
    : [];
  const byRfq = new Map();
  quotes.forEach((q) => { const l = byRfq.get(q.rfq_id) || []; l.push(q); byRfq.set(q.rfq_id, l); });
  const priceScores = new Map();
  for (const list of byRfq.values()) {
    const valid = list.filter((q) => Number(q.total_amount) > 0);
    if (valid.length < 2) continue;
    const low = Math.min(...valid.map((q) => Number(q.total_amount)));
    valid.forEach((q) => {
      const l = priceScores.get(q.vendor_id) || [];
      l.push((low / Number(q.total_amount)) * 100);
      priceScores.set(q.vendor_id, l);
    });
  }

  const vendorRows = vendorIds.length ? await db('vendors').whereIn('id', vendorIds).select('id', 'name', 'category', 'rating') : [];
  const scorecard = vendorRows.map((v) => {
    const vPos = pos.filter((p) => p.vendor_id === v.id);
    const vShip = shipments.filter((s) => s.vendorId === v.id);
    const onTime = vShip.filter((s) => s.outcome === 'on_time').length;
    const late = vShip.filter((s) => s.outcome === 'late').length;
    const leads = vShip.map((s) => s.leadTimeDays).filter((d) => d !== null);
    const sent = vPos.filter((p) => SENT_PO.includes(p.status));
    const acked = sent.filter((p) => ACK_PO.includes(p.status) || p.acknowledgment_status === 'acknowledged');
    const rating = Number(v.rating) || 0;
    const spend = vPos.filter((p) => isBase(p.currency)).reduce((a, p) => a + (Number(p.total_amount) || 0), 0);
    const nonInrPos = vPos.filter((p) => !isBase(p.currency)).length;
    const price = priceScores.get(v.id);
    const scores = {
      delivery: pct(onTime, onTime + late),
      quality: rating > 0 ? round1(rating * 20) : null,
      price: price ? round1(avg(price)) : null,
      communication: pct(acked.length, sent.length),
    };
    const known = Object.values(scores).filter((s) => s !== null);
    return {
      vendorId: v.id,
      vendorName: v.name,
      category: v.category,
      poCount: vPos.length,
      spend: round2(spend),
      nonInrPos,
      shipments: vShip.length,
      onTime,
      late,
      deliveryRate: scores.delivery,
      avgLeadTimeDays: leads.length ? round1(avg(leads)) : null,
      rating: rating || null,
      qualityScore: scores.quality,
      priceScore: scores.price,
      quotesCompared: price ? price.length : 0,
      communicationScore: scores.communication,
      overallScore: known.length ? round1(avg(known)) : null,
    };
  }).sort((a, b) => b.spend - a.spend);

  const allOnTime = shipments.filter((s) => s.outcome === 'on_time').length;
  const allLate = shipments.filter((s) => s.outcome === 'late').length;
  const leads = shipments.map((s) => s.leadTimeDays).filter((d) => d !== null);
  const rated = scorecard.filter((v) => v.rating);
  const repeat = scorecard.filter((v) => v.poCount >= 2).length;

  return {
    kpis: {
      onTimeRate: { pct: pct(allOnTime, allOnTime + allLate), onTime: allOnTime, late: allLate },
      avgLeadTime: { days: leads.length ? round1(avg(leads)) : null, count: leads.length },
      qualityScore: { rating: rated.length ? round2(avg(rated.map((v) => v.rating))) : null, vendorCount: rated.length },
      repeatVendors: { pct: pct(repeat, scorecard.length), repeat, total: scorecard.length },
    },
    onTimeByVendor: scorecard.filter((v) => v.deliveryRate !== null)
      .sort((a, b) => (b.onTime + b.late) - (a.onTime + a.late) || b.spend - a.spend)
      .slice(0, 10)
      .map((v) => ({ vendorId: v.vendorId, vendorName: v.vendorName, rate: v.deliveryRate, onTime: v.onTime, late: v.late })),
    leadTimeHistogram: LEAD_BUCKETS.map((b) => ({ label: b.label, count: leads.filter((d) => d >= b.min && d <= b.max).length })),
    bubbles: scorecard.filter((v) => v.rating && v.spend > 0).map((v) => ({
      vendorId: v.vendorId, vendorName: v.vendorName, spend: v.spend, rating: v.rating, poCount: v.poCount, deliveryRate: v.deliveryRate,
    })),
    scorecard,
  };
}

// ---------- 3. Delivery performance ----------

async function buildDelivery(scope, range) {
  const poIds = scopedPoIds(scope);
  const shipments = await loadShipments(poIds, { range });
  const onTime = shipments.filter((s) => s.outcome === 'on_time');
  const late = shipments.filter((s) => s.outcome === 'late');
  const exceptions = shipments.filter((s) => s.hasException);

  const months = monthsFor(range, shipments.map((s) => s.expected), { keepFuture: true });
  const trend = months.map((key) => {
    const list = shipments.filter((s) => s.expected && s.expected.startsWith(key));
    const ot = list.filter((s) => s.outcome === 'on_time').length;
    const lt = list.filter((s) => s.outcome === 'late').length;
    return { month: key, label: monthLabel(key), onTime: ot, late: lt, open: list.length - ot - lt, rate: pct(ot, ot + lt) };
  });

  const reasonMap = new Map();
  late.forEach((s) => {
    const r = reasonMap.get(s.reason.id) || { id: s.reason.id, name: s.reason.label, count: 0 };
    r.count += 1;
    reasonMap.set(s.reason.id, r);
  });

  const vendorMap = new Map();
  shipments.forEach((s) => {
    const v = vendorMap.get(s.vendorId) || { vendorId: s.vendorId, vendorName: s.vendorName, onTime: 0, late: 0, open: 0, total: 0 };
    v.total += 1;
    if (s.outcome === 'on_time') v.onTime += 1; else if (s.outcome === 'late') v.late += 1; else v.open += 1;
    vendorMap.set(s.vendorId, v);
  });

  return {
    kpis: {
      onTimeRate: { pct: pct(onTime.length, onTime.length + late.length), onTime: onTime.length, late: late.length, due: onTime.length + late.length },
      avgDelay: { days: late.length ? round1(avg(late.map((s) => s.delayDays))) : null, count: late.length, stillOpen: late.filter((s) => s.stillOpen).length },
      exceptionRate: { pct: pct(exceptions.length, shipments.length), count: exceptions.length, total: shipments.length },
    },
    trend,
    delayReasons: [...reasonMap.values()].sort((a, b) => b.count - a.count),
    byVendor: [...vendorMap.values()]
      .map((v) => ({ ...v, rate: pct(v.onTime, v.onTime + v.late) }))
      .sort((a, b) => b.total - a.total),
    shipments: [...shipments].sort((a, b) => String(b.expected).localeCompare(String(a.expected))),
  };
}

// ---------- 4. Purchase requests and approvals ----------

const REJECTION_CATEGORIES = [
  { id: 'budget', label: 'Budget', words: ['budget', 'cost', 'expensive', 'fund', 'afford', 'price'] },
  { id: 'existing', label: 'Existing contract or stock', words: ['existing', 'contract', 'duplicate', 'already', 'in stock', 'stock'] },
  { id: 'quotes', label: 'Needs more quotes', words: ['quote', 'estimate', 'compare', 'competitive'] },
  { id: 'details', label: 'Missing details or justification', words: ['spec', 'detail', 'justif', 'information', 'unclear', 'clarify'] },
];
function rejectionCategory(reason) {
  const t = String(reason || '').toLowerCase();
  if (!t) return { id: 'none', label: 'No reason given' };
  const hit = REJECTION_CATEGORIES.find((c) => c.words.some((w) => t.includes(w)));
  return hit ? { id: hit.id, label: hit.label } : { id: 'other', label: 'Other' };
}

async function buildPrApproval(scope, range) {
  const rows = await scopePrs(db('purchase_requests'), scope).select('*');
  // A request belongs to the period it was submitted in (drafts: when they were created).
  const prs = rows
    .map((pr) => ({ ...pr, periodDay: dayOf(pr.submitted_at) || dayOf(pr.created_at) }))
    .filter((pr) => inRangeDay(pr.periodDay, range));
  const names = await userNames([...prs.map((p) => p.requester_id), ...prs.map((p) => p.approver_id)]);
  const approverUsers = await db('users').whereIn('role', APPROVER_ROLES).where('is_active', true).select('name', 'email');
  const approverLabel = approverUsers.length ? approverUsers.map((u) => u.name || u.email).join(', ') : 'Admin or procurement manager';

  const now = Date.now();
  const decided = prs
    .filter((p) => ['approved', 'rejected'].includes(p.status) && toMs(p.submitted_at) && toMs(p.approval_date))
    .map((p) => ({ ...p, hours: Math.max(0, (toMs(p.approval_date) - toMs(p.submitted_at)) / 3600000) }));
  const approved = prs.filter((p) => p.status === 'approved').length;
  const rejectedList = prs.filter((p) => p.status === 'rejected');

  const approverStats = new Map();
  decided.forEach((p) => {
    const a = approverStats.get(p.approver_id) || { approverId: p.approver_id, name: names[p.approver_id] || 'Unknown', hours: [], count: 0 };
    a.hours.push(p.hours);
    a.count += 1;
    approverStats.set(p.approver_id, a);
  });
  const approvers = [...approverStats.values()].map((a) => ({ approverId: a.approverId, name: a.name, decisions: a.count, avgDays: round1(avg(a.hours) / 24), avgHours: round1(avg(a.hours)) }))
    .sort((a, b) => b.avgHours - a.avgHours);

  const deptMap = new Map();
  prs.forEach((p) => {
    const k = p.department || 'Unassigned';
    const d = deptMap.get(k) || { department: k, total: 0, decidedHours: [], approved: 0, rejected: 0, pending: 0, budget: 0 };
    d.total += 1;
    d.budget += Number(p.budget_total) || 0;
    if (p.status === 'approved') d.approved += 1;
    if (p.status === 'rejected') d.rejected += 1;
    if (p.status === 'submitted') d.pending += 1;
    deptMap.set(k, d);
  });
  decided.forEach((p) => deptMap.get(p.department || 'Unassigned').decidedHours.push(p.hours));

  const reasonMap = new Map();
  rejectedList.forEach((p) => {
    const c = rejectionCategory(p.rejection_reason);
    const r = reasonMap.get(c.id) || { id: c.id, name: c.label, count: 0, examples: [] };
    r.count += 1;
    r.examples.push({ prId: p.id, prNumber: p.pr_number, reason: p.rejection_reason || null });
    reasonMap.set(c.id, r);
  });

  const pending = prs.filter((p) => p.status === 'submitted').map((p) => ({
    prId: p.id,
    prNumber: p.pr_number,
    title: p.title,
    requester: names[p.requester_id] || 'Unknown',
    department: p.department || 'Unassigned',
    submittedAt: dayOf(p.submitted_at),
    daysPending: toMs(p.submitted_at) ? Math.floor((now - toMs(p.submitted_at)) / 86400000) : null,
    approver: approverLabel,
    budget: Number(p.budget_total) || 0,
    currency: p.currency || BASE_CURRENCY,
    priority: p.priority,
  })).sort((a, b) => (b.daysPending || 0) - (a.daysPending || 0));

  const STATUS_LABELS = { draft: 'Draft', submitted: 'Pending approval', approved: 'Approved', rejected: 'Rejected' };
  return {
    kpis: {
      totalPrs: { count: prs.length, budget: round2(prs.reduce((a, p) => a + (Number(p.budget_total) || 0), 0)) },
      avgApprovalTime: { days: decided.length ? round1(avg(decided.map((p) => p.hours)) / 24) : null, hours: decided.length ? round1(avg(decided.map((p) => p.hours))) : null, count: decided.length },
      rejectionRate: { pct: pct(rejectedList.length, approved + rejectedList.length), rejected: rejectedList.length, decided: approved + rejectedList.length },
      bottleneck: approvers[0] || null,
      pendingCount: pending.length,
    },
    statusDistribution: Object.entries(STATUS_LABELS).map(([status, label]) => ({ status, name: label, count: prs.filter((p) => p.status === status).length })),
    approvalTimeByDept: [...deptMap.values()].map((d) => ({
      department: d.department, total: d.total, approved: d.approved, rejected: d.rejected, pending: d.pending,
      budget: round2(d.budget), avgDays: d.decidedHours.length ? round1(avg(d.decidedHours) / 24) : null,
      avgHours: d.decidedHours.length ? round1(avg(d.decidedHours)) : null,
    })).sort((a, b) => b.total - a.total),
    rejectionReasons: [...reasonMap.values()].sort((a, b) => b.count - a.count),
    approvers,
    pending,
    requests: prs.sort((a, b) => String(b.periodDay).localeCompare(String(a.periodDay))).map((p) => ({
      prId: p.id, prNumber: p.pr_number, title: p.title, status: p.status, department: p.department || 'Unassigned',
      requester: names[p.requester_id] || 'Unknown', submittedAt: dayOf(p.submitted_at), decidedAt: dayOf(p.approval_date),
      approver: names[p.approver_id] || null, budget: Number(p.budget_total) || 0, currency: p.currency || BASE_CURRENCY,
      rejectionReason: p.rejection_reason || null,
    })),
  };
}

// ---------- 5. Invoices and payments ----------

const AGING = [
  { id: 'current', label: 'Not yet due', min: -Infinity, max: 0 },
  { id: '0_30', label: '1–30 days overdue', min: 1, max: 30 },
  { id: '31_60', label: '31–60 days overdue', min: 31, max: 60 },
  { id: '60_plus', label: '60+ days overdue', min: 61, max: Infinity },
];

async function buildInvoicePayment(scope, range) {
  const poIds = scopedPoIds(scope);
  const q = db('invoices').whereNot('invoices.status', 'draft').select('invoices.*');
  if (poIds) q.where((b) => b.whereIn('invoices.po_id', poIds).orWhere('invoices.created_by', scope.user.id));
  if (range.from) q.where('invoices.issue_date', '>=', range.from);
  if (range.to) q.where('invoices.issue_date', '<=', range.to);
  const invoices = await enrichInvoices(await q);
  const payments = invoices.length
    ? await db('invoice_payments').whereIn('invoice_id', invoices.map((i) => i.id)).select('invoice_id', 'amount', 'payment_date')
    : [];
  const asOf = today();

  const rows = invoices.map((inv) => {
    const pays = payments.filter((p) => p.invoice_id === inv.id).map((p) => toDate(p.payment_date)).filter(Boolean).sort();
    const paidOn = inv.status === 'paid' ? (pays[pays.length - 1] || dayOf(inv.paid_at) || inv.payment_date) : null;
    const lateBy = paidOn && inv.due_date ? daysBetween(inv.due_date, paidOn) : null;
    const pastDue = inv.status !== 'paid' && inv.due_date ? daysBetween(inv.due_date, asOf) : null;
    const state = inv.status === 'paid' ? 'paid' : inv.is_overdue ? 'overdue' : 'pending';
    return { ...inv, paidOn, lateBy, pastDue, state, daysToPay: paidOn && inv.issue_date ? daysBetween(inv.issue_date, paidOn) : null };
  });
  const base = rows.filter((i) => isBase(i.currency));
  const paid = rows.filter((i) => i.paidOn);
  const paidOnTime = paid.filter((i) => i.lateBy !== null && i.lateBy <= 0);
  const lateDays = paid.map((i) => i.lateBy).filter((d) => d !== null);
  const outstandingBase = base.reduce((a, i) => a + i.outstanding, 0);
  const invoicedBase = base.reduce((a, i) => a + i.total_amount, 0);
  // DSO counts days from the later of the range start and the first invoice, so a year-to-date view
  // with invoices only in recent months is not diluted by empty months.
  const firstInvoice = rows.map((i) => i.issue_date).filter(Boolean).sort()[0] || asOf;
  const firstDay = range.from && range.from > firstInvoice ? range.from : firstInvoice;
  const lastDay = range.to && range.to < asOf ? range.to : asOf;
  const periodDays = Math.max(1, daysBetween(firstDay, lastDay) + 1);

  const months = monthsFor(range, rows.map((i) => i.issue_date));
  const statusOverTime = months.map((key) => {
    const list = base.filter((i) => i.issue_date && i.issue_date.startsWith(key));
    const sumOf = (state) => round2(list.filter((i) => i.state === state).reduce((a, i) => a + (state === 'paid' ? i.total_amount : i.outstanding), 0));
    // Part payments on open invoices count as paid; what is left stays pending or overdue.
    const partPaid = round2(list.filter((i) => i.state !== 'paid').reduce((a, i) => a + i.amount_paid, 0));
    return { month: key, label: monthLabel(key), paid: round2(sumOf('paid') + partPaid), overdue: sumOf('overdue'), pending: sumOf('pending'), count: list.length };
  });

  const vendorMap = new Map();
  rows.forEach((i) => {
    const v = vendorMap.get(i.vendor_id) || { vendorId: i.vendor_id, vendorName: i.vendor_name, invoices: 0, invoiced: 0, paidAmount: 0, outstanding: 0, paidCount: 0, onTimeCount: 0, overdueCount: 0, daysToPay: [], others: 0 };
    v.invoices += 1;
    if (isBase(i.currency)) {
      v.invoiced += i.total_amount;
      v.paidAmount += i.amount_paid;
      v.outstanding += i.outstanding;
    } else v.others += 1;
    if (i.paidOn) { v.paidCount += 1; if (i.lateBy <= 0) v.onTimeCount += 1; if (i.daysToPay !== null) v.daysToPay.push(i.daysToPay); }
    if (i.state === 'overdue') v.overdueCount += 1;
    vendorMap.set(i.vendor_id, v);
  });
  const byVendor = [...vendorMap.values()].map((v) => ({
    vendorId: v.vendorId, vendorName: v.vendorName, invoices: v.invoices, invoiced: round2(v.invoiced), paid: round2(v.paidAmount),
    outstanding: round2(v.outstanding), paidCount: v.paidCount, onTimeCount: v.onTimeCount, overdueCount: v.overdueCount,
    onTimePct: pct(v.onTimeCount, v.paidCount), avgDaysToPay: v.daysToPay.length ? round1(avg(v.daysToPay)) : null,
    otherCurrencyInvoices: v.others,
  })).sort((a, b) => b.invoiced - a.invoiced);

  const open = rows.filter((i) => i.outstanding > 0 && i.state !== 'paid');
  const aging = AGING.map((b) => {
    const list = open.filter((i) => { const d = i.pastDue ?? 0; return d >= b.min && d <= b.max; });
    return { id: b.id, label: b.label, count: list.length, amount: round2(list.filter((i) => isBase(i.currency)).reduce((a, i) => a + i.outstanding, 0)) };
  });

  const mapInvoice = (i) => ({
    invoiceId: i.id, invoiceNumber: i.invoice_number, vendorId: i.vendor_id, vendorName: i.vendor_name, poId: i.po_id, poNumber: i.po_number,
    status: i.status, state: i.state, currency: i.currency, total: i.total_amount, paid: i.amount_paid, outstanding: i.outstanding,
    issueDate: i.issue_date, dueDate: i.due_date, paidOn: i.paidOn, daysOverdue: i.state === 'overdue' ? i.pastDue : 0, lateBy: i.lateBy,
  });

  return {
    kpis: {
      totalInvoiced: { ...currencySplit(rows, (i) => i.total_amount) },
      paidOnTime: { pct: pct(paidOnTime.length, paid.length), onTime: paidOnTime.length, paid: paid.length },
      avgPaymentDelay: { days: lateDays.length ? round1(avg(lateDays)) : null, count: lateDays.length },
      dso: { days: invoicedBase > 0 ? round1((outstandingBase / invoicedBase) * periodDays) : null, outstanding: round2(outstandingBase), periodDays },
    },
    statusOverTime,
    byVendor,
    aging,
    largestUnpaid: open.filter((i) => isBase(i.currency)).sort((a, b) => b.outstanding - a.outstanding).slice(0, 10).map(mapInvoice),
    otherCurrencyUnpaid: open.filter((i) => !isBase(i.currency)).map(mapInvoice),
    invoices: rows.map(mapInvoice),
  };
}

// ---------- 6. Compliance ----------

// Uses the compliance module's rules and data (certification status, certificates, audits, compliance issues)
// and its access rule: admins and compliance managers see every vendor, procurement managers the vendors they
// buy from, and everyone else only the company-wide figures.
const EXPIRY_WINDOW_DAYS = 90;
const AUDIT_INTERVAL_DAYS = 365;
const addDaysIso = (date, days) => new Date(new Date(`${date}T00:00:00Z`).getTime() + days * 86400000).toISOString().split('T')[0];

async function buildCompliance(scope, range) {
  const compliance = require('./compliance');
  const asOf = today();
  const windowEnd = addDaysIso(asOf, EXPIRY_WINDOW_DAYS);
  const access = compliance.access(scope.user);
  const ids = access.level === 'vendors' ? await compliance.visibleVendorIds(scope.user) : null;
  const vendors = await compliance.loadVendors(ids);
  const showVendors = access.level !== 'summary';

  const audits = await db('vendor_audits').modify((q) => { if (ids) q.whereIn('vendor_id', ids); })
    .select('vendor_id', 'audit_date', 'next_audit_due', 'result');
  const nextDueBy = new Map();
  audits.forEach((a) => {
    const due = toDate(a.next_audit_due);
    if (due && (!nextDueBy.has(a.vendor_id) || due > nextDueBy.get(a.vendor_id))) nextDueBy.set(a.vendor_id, due);
  });
  const auditsInPeriod = audits.filter((a) => inRangeDay(toDate(a.audit_date), range));

  const rows = vendors.map((v) => {
    const nextAuditDue = nextDueBy.get(v.id) || (v.lastAuditDate ? addDaysIso(v.lastAuditDate, AUDIT_INTERVAL_DAYS) : null);
    const upcoming = v.certifications.filter((c) => c.expiryDate && c.expiryDate >= asOf)
      .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
    return {
      vendorId: v.id,
      vendorName: v.name,
      category: v.category,
      vendorStatus: v.status,
      status: v.certificationStatus,
      level: v.compliance.level,
      levelLabel: v.compliance.label,
      gstVerified: v.documentation.gstVerified,
      panVerified: v.documentation.panVerified,
      certificates: v.certifications.map((c) => ({ id: c.id, type: c.type, expiryDate: c.expiryDate, expiryState: c.expiryState, status: c.status })),
      lastAudit: v.lastAuditDate,
      lastAuditResult: v.latestAudit ? v.latestAudit.result : null,
      nextAuditDue,
      auditDue: v.auditDue,
      nextExpiry: upcoming[0] ? { name: upcoming[0].type, date: upcoming[0].expiryDate } : null,
      openIssues: v.openIssues,
      issues: v.compliance.reasons,
    };
  });

  const counts = { certified: 0, pending: 0, non_compliant: 0 };
  rows.forEach((r) => { counts[r.status] = (counts[r.status] || 0) + 1; });
  const auditsDueSoon = rows.filter((r) => !r.auditDue && r.nextAuditDue && r.nextAuditDue <= windowEnd).length;
  const expiring = vendors.flatMap((v) => v.certifications
    .filter((c) => c.expiryDate && c.expiryDate >= asOf && c.expiryDate <= windowEnd)
    .map((c) => ({ certId: c.id, vendorId: v.id, vendorName: v.name, name: c.type, date: c.expiryDate, daysLeft: c.daysToExpiry, verified: c.status === 'verified' })))
    .sort((a, b) => a.date.localeCompare(b.date));
  const expired = vendors.reduce((a, v) => a + v.certifications.filter((c) => c.expiryState === 'expired').length, 0);

  const ORDER = { red: 0, yellow: 1, green: 2 };
  return {
    source: 'compliance_records',
    access: { level: access.level, label: access.label },
    kpis: {
      coverage: { pct: pct(counts.certified, rows.length), certified: counts.certified, total: rows.length },
      auditsDue: { count: rows.filter((r) => r.auditDue).length, neverAudited: rows.filter((r) => !r.lastAudit).length, dueSoon: auditsDueSoon },
      openIssues: { count: rows.reduce((a, r) => a + r.openIssues, 0), vendors: rows.filter((r) => r.openIssues).length },
      auditsInPeriod: { count: auditsInPeriod.length, failed: auditsInPeriod.filter((a) => a.result === 'failed').length },
      certificates: { expired, expiringSoon: expiring.length },
    },
    statusDistribution: [
      { status: 'certified', name: 'Certified', count: counts.certified },
      { status: 'pending', name: 'Pending', count: counts.pending },
      { status: 'non_compliant', name: 'Non-compliant', count: counts.non_compliant },
    ],
    expiringSoon: showVendors ? expiring : [],
    vendors: showVendors
      ? rows.sort((a, b) => ORDER[a.level] - ORDER[b.level] || b.issues.length - a.issues.length || a.vendorName.localeCompare(b.vendorName))
      : [],
  };
}

// ---------- Entry point ----------

const BUILDERS = {
  spend: buildSpend,
  suppliers: buildSuppliers,
  delivery: buildDelivery,
  'pr-approval': buildPrApproval,
  'invoice-payment': buildInvoicePayment,
  compliance: buildCompliance,
};

async function buildReport(type, user, { from = '', to = '', department = '' } = {}) {
  const scope = scopeFor(user, department);
  const range = { from, to };
  const data = await BUILDERS[type](scope, range);
  return {
    report: type,
    range: { from: from || null, to: to || null, asOf: today() },
    currency: BASE_CURRENCY,
    scope: { all: scope.all, department: scope.dept, label: scope.label, canChooseDepartment: scope.all },
    ...data,
  };
}

module.exports = { REPORT_TYPES, buildReport, departments, scopeFor, monthLabel };
