// Finance dashboard figures: spending from purchase orders, invoice status and aging, and payments, for one date range.
const { db } = require('../config/database');
const { today, toDate, daysBetween } = require('./shipments');
const { FULL_VIEW_ROLES, enrichInvoices, round2 } = require('./invoices');

// Spending counts POs once they are approved; drafts, POs awaiting approval and cancelled POs are not committed spend.
const COMMITTED_PO_STATUSES = ['approved', 'sent', 'acknowledged', 'partially_received', 'received', 'closed'];
const INVOICE_STATUSES = ['draft', 'submitted', 'approved', 'paid', 'disputed'];
// Figures are reported in the base currency; amounts in other currencies are listed separately, not converted.
const BASE_CURRENCY = 'INR';
const AGING_BUCKETS = [
  { id: 'current', label: 'Not yet due', min: null, max: 0 },
  { id: '0_30', label: '1–30 days', min: 1, max: 30 },
  { id: '31_60', label: '31–60 days', min: 31, max: 60 },
  { id: '60_plus', label: 'Over 60 days', min: 61, max: null },
];

/**
 * Which POs a user's dashboard covers. Admins and finance managers see everything; everyone else sees POs they
 * created plus POs sourced from purchase requests they raised or that belong to their department.
 * Returns null for "everything", otherwise a subquery of PO ids.
 */
function scopedPoIds(user) {
  if (FULL_VIEW_ROLES.includes(user.role)) return null;
  return db('purchase_orders')
    .select('purchase_orders.id')
    .where('purchase_orders.created_by', user.id)
    .orWhereIn('purchase_orders.rfq_id', db('purchase_requests').select('rfq_id').whereNotNull('rfq_id').where((b) => {
      b.where('requester_id', user.id);
      if (user.department) b.orWhere('department', user.department);
    }));
}

function scopeLabel(user) {
  if (FULL_VIEW_ROLES.includes(user.role)) return { all: true, label: 'All company spending and invoices' };
  return {
    all: false,
    label: user.department
      ? `Your purchase orders and ${user.department} department requests`
      : 'Purchase orders and requests you raised',
  };
}

const scopePos = (q, poIds) => (poIds ? q.whereIn('purchase_orders.id', poIds) : q);
// Invoices on the user's POs, plus any they raised themselves (matches the invoice list's visibility).
const scopeInvoices = (q, poIds, user) => (poIds
  ? q.where((b) => b.whereIn('invoices.po_id', poIds).orWhere('invoices.created_by', user.id))
  : q);

const inRange = (q, column, { from, to }) => {
  if (from) q.where(column, '>=', from);
  if (to) q.where(column, '<=', to);
  return q;
};

// Totals per currency → { base, others: [{ currency, amount, count }] }.
function splitCurrency(rows) {
  const out = { base: 0, baseCount: 0, others: [] };
  for (const r of rows) {
    const currency = r.currency || BASE_CURRENCY;
    const amount = round2(r.amount);
    const count = Number(r.count) || 0;
    if (currency === BASE_CURRENCY) {
      out.base = round2(out.base + amount);
      out.baseCount += count;
    } else {
      out.others.push({ currency, amount, count });
    }
  }
  return out;
}

/**
 * Builds the whole dashboard for one user and date range ({ from, to } as YYYY-MM-DD, either may be empty).
 * - Spending and the vendor chart use PO issue dates.
 * - Invoice status, recent invoices, outstanding, overdue and aging use invoices issued in the range,
 *   with outstanding and overdue worked out as of today.
 * - Paid uses payment dates.
 */
async function buildDashboard(user, range) {
  const poIds = scopedPoIds(user);
  const asOf = today();

  // Spending: committed PO totals per currency, and the top vendors in the base currency.
  const poBase = () => inRange(scopePos(db('purchase_orders'), poIds), 'purchase_orders.issue_date', range)
    .whereIn('purchase_orders.status', COMMITTED_PO_STATUSES);
  const [spendRows, vendorRows] = await Promise.all([
    poBase().select('currency').sum({ amount: 'total_amount' }).count({ count: '*' }).groupBy('currency'),
    poBase()
      .where((b) => b.where('purchase_orders.currency', BASE_CURRENCY).orWhereNull('purchase_orders.currency'))
      .join('vendors', 'vendors.id', 'purchase_orders.vendor_id')
      .select('purchase_orders.vendor_id', 'vendors.name')
      .sum({ amount: 'purchase_orders.total_amount' })
      .count({ count: '*' })
      .groupBy('purchase_orders.vendor_id', 'vendors.name')
      .orderBy('amount', 'desc'),
  ]);
  const spending = splitCurrency(spendRows);
  const topVendors = vendorRows.slice(0, 5).map((r) => ({
    vendorId: r.vendor_id,
    vendorName: r.name,
    amount: round2(r.amount),
    poCount: Number(r.count) || 0,
  }));
  const restAmount = round2(vendorRows.slice(5).reduce((a, r) => a + Number(r.amount || 0), 0));

  // Invoices issued in the range, enriched with outstanding / overdue as of today.
  const rawInvoices = await inRange(scopeInvoices(db('invoices'), poIds, user), 'invoices.issue_date', range)
    .select('invoices.*')
    .orderBy('invoices.issue_date', 'desc')
    .orderBy('invoices.created_at', 'desc');
  const invoices = await enrichInvoices(rawInvoices);

  const statusBreakdown = INVOICE_STATUSES.map((status) => {
    const list = invoices.filter((i) => i.status === status);
    const base = list.filter((i) => i.currency === BASE_CURRENCY);
    return { status, count: list.length, amount: round2(base.reduce((a, i) => a + i.total_amount, 0)) };
  });

  // Outstanding and overdue follow approved invoices: the ones cleared for payment.
  const approved = invoices.filter((i) => i.status === 'approved' && i.outstanding > 0);
  const outstanding = splitCurrency(approved.map((i) => ({ currency: i.currency, amount: i.outstanding, count: 1 })));
  const overdueList = approved.filter((i) => i.due_date && i.due_date < asOf);
  const overdue = splitCurrency(overdueList.map((i) => ({ currency: i.currency, amount: i.outstanding, count: 1 })));
  const awaitingApproval = splitCurrency(invoices
    .filter((i) => i.status === 'submitted')
    .map((i) => ({ currency: i.currency, amount: i.total_amount, count: 1 })));

  const aging = AGING_BUCKETS.map((b) => ({ ...b, count: 0, amount: 0, invoices: [] }));
  for (const inv of approved) {
    const late = inv.due_date ? daysBetween(inv.due_date, asOf) : 0;
    const bucket = aging.find((b) => (b.min === null || late >= b.min) && (b.max === null || late <= b.max));
    bucket.count += 1;
    if (inv.currency === BASE_CURRENCY) bucket.amount = round2(bucket.amount + inv.outstanding);
    bucket.invoices.push({
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      vendorId: inv.vendor_id,
      vendorName: inv.vendor_name,
      currency: inv.currency,
      outstanding: inv.outstanding,
      dueDate: inv.due_date,
      daysOverdue: Math.max(0, late),
    });
  }
  aging.forEach((b) => b.invoices.sort((x, y) => y.daysOverdue - x.daysOverdue || String(x.dueDate).localeCompare(String(y.dueDate))));

  // Payments made in the range on invoices the user can see (any issue date).
  const paymentRows = await inRange(
    db('invoice_payments')
      .join('invoices', 'invoices.id', 'invoice_payments.invoice_id')
      .whereIn('invoice_payments.invoice_id', scopeInvoices(db('invoices').select('invoices.id'), poIds, user)),
    'invoice_payments.payment_date', range,
  )
    .select(db.raw("coalesce(invoices.currency, 'INR') as currency"))
    .sum({ amount: 'invoice_payments.amount' })
    .count({ count: '*' })
    .groupBy(db.raw("coalesce(invoices.currency, 'INR')"));
  const paid = splitCurrency(paymentRows);

  const recentInvoices = invoices.slice(0, 10).map((i) => ({
    id: i.id,
    invoiceNumber: i.invoice_number,
    vendorId: i.vendor_id,
    vendorName: i.vendor_name,
    poNumber: i.po_number,
    status: i.status,
    currency: i.currency,
    totalAmount: i.total_amount,
    amountPaid: i.amount_paid,
    outstanding: i.outstanding,
    issueDate: i.issue_date,
    dueDate: i.due_date,
    isOverdue: i.is_overdue,
    daysOverdue: i.days_overdue,
  }));

  return {
    range: { from: range.from || null, to: range.to || null, asOf },
    currency: BASE_CURRENCY,
    scope: scopeLabel(user),
    kpis: {
      totalSpending: { amount: spending.base, count: spending.baseCount, others: spending.others },
      outstanding: { amount: outstanding.base, count: outstanding.baseCount, others: outstanding.others, awaitingApproval: { amount: awaitingApproval.base, count: awaitingApproval.baseCount } },
      paid: { amount: paid.base, count: paid.baseCount, others: paid.others },
      overdue: { amount: overdue.base, count: overdue.baseCount, others: overdue.others },
    },
    spendingByVendor: { top: topVendors, otherVendors: { count: Math.max(0, vendorRows.length - 5), amount: restAmount } },
    invoiceStatus: statusBreakdown,
    invoiceCount: invoices.length,
    recentInvoices,
    aging,
  };
}

const isIsoDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !!toDate(v);

module.exports = { buildDashboard, isIsoDate, COMMITTED_PO_STATUSES, BASE_CURRENCY };
