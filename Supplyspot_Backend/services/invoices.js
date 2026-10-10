// Shared invoice logic: numbering, prefilling lines from a PO or GRN, quantity checks, totals and list enrichment.
const { db } = require('../config/database');
const { parseJson, today, toDate, toIso, daysBetween } = require('./shipments');

const STATUSES = ['draft', 'submitted', 'approved', 'paid', 'disputed'];
// Invoices still waiting on money; these are the ones that can fall overdue.
const UNPAID_STATUSES = ['submitted', 'approved', 'disputed'];
// POs a supplier can bill against: sent onwards, not cancelled.
const INVOICEABLE_PO_STATUSES = ['sent', 'acknowledged', 'partially_received', 'received', 'closed'];
// Who sees every invoice; everyone else only sees invoices on their own POs (or that they raised).
const FULL_VIEW_ROLES = ['admin', 'finance_manager'];
const PAYMENT_METHODS = ['bank_transfer', 'cheque', 'card', 'upi', 'other'];

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const round3 = (n) => Math.round((Number(n) || 0) * 1000) / 1000;

async function nextInvoiceNumber() {
  const full = `INV-${new Date().getFullYear()}-`;
  const rows = await db('invoices').where('invoice_number', 'like', `${full}%`).select('invoice_number');
  const max = rows.reduce((acc, r) => Math.max(acc, parseInt(r.invoice_number.slice(full.length), 10) || 0), 0);
  return `${full}${String(max + 1).padStart(4, '0')}`;
}

// "Net 30", "2/10 Net 30" → 30 days; anything else → 30.
function termsDays(terms) {
  const m = String(terms || '').match(/net\s*(\d{1,3})/i);
  return m ? Number(m[1]) : 30;
}
const addDays = (date, days) => new Date(new Date(`${date}T00:00:00Z`).getTime() + days * 86400000).toISOString().split('T')[0];

function computeTotals(lines, taxRate) {
  const subtotal = round2(lines.reduce((a, l) => a + Number(l.amount || 0), 0));
  const tax = round2(subtotal * (Number(taxRate) || 0) / 100);
  return { subtotal, tax_amount: tax, total_amount: round2(subtotal + tax) };
}

/**
 * Cleans line input into stored lines: { poLineIndex, description, quantity, unitPrice, amount }.
 * poLineIndex is null for lines entered by hand (freight, services not on the PO).
 */
function normaliseLines(input) {
  if (!Array.isArray(input)) return [];
  return input
    .map((l) => {
      const quantity = round3(l.quantity);
      const unitPrice = round2(l.unitPrice);
      const idx = l.poLineIndex === null || l.poLineIndex === undefined || l.poLineIndex === '' ? null : Number(l.poLineIndex);
      return {
        poLineIndex: Number.isInteger(idx) ? idx : null,
        description: String(l.description || '').trim(),
        quantity,
        unitPrice,
        amount: round2(quantity * unitPrice),
      };
    })
    .filter((l) => l.description || l.quantity || l.unitPrice);
}

// Quantity billed per PO line on other invoices for the same PO (or the same GRN when grnId is given).
async function invoicedByLine({ poId = null, grnId = null, excludeInvoiceId = null }) {
  let q = db('invoices');
  if (grnId) q = q.where('grn_id', grnId);
  else q = q.where('po_id', poId);
  if (excludeInvoiceId) q = q.whereNot('id', excludeInvoiceId);
  const rows = await q.select('line_items');
  const totals = {};
  for (const r of rows) {
    for (const l of parseJson(r.line_items)) {
      if (l.poLineIndex === null || l.poLineIndex === undefined) continue;
      totals[l.poLineIndex] = round3((totals[l.poLineIndex] || 0) + Number(l.quantity || 0));
    }
  }
  return totals;
}

const poReceiving = (po) => ['partially_received', 'received', 'closed'].includes(po.status);

/**
 * Lines a PO can still be billed for. Once goods are being received, billing follows what was received;
 * before that (services, advance invoices) it follows what was ordered.
 */
async function poBillableLines(po, excludeInvoiceId = null) {
  const lines = parseJson(po.line_items);
  const invoiced = await invoicedByLine({ poId: po.id, excludeInvoiceId });
  const basisIsReceived = poReceiving(po);
  return lines.map((li, index) => {
    const ordered = Number(li.quantity) || 0;
    const received = Number(li.receivedQuantity) || 0;
    const basis = basisIsReceived ? received : ordered;
    return {
      poLineIndex: index,
      description: li.description,
      ordered,
      received,
      invoiced: invoiced[index] || 0,
      remaining: round3(Math.max(0, basis - (invoiced[index] || 0))),
      // Ceiling is always the ordered quantity; billing ahead of receipt is allowed but flagged in the match check.
      maxQuantity: round3(Math.max(0, ordered - (invoiced[index] || 0))),
      unitPrice: Number(li.unitPrice) || 0,
    };
  });
}

// Lines a GRN can still be billed for: what it received, less what other invoices on that GRN already billed.
async function grnBillableLines(receipt, po, excludeInvoiceId = null) {
  const poLines = parseJson(po?.line_items);
  const onGrn = await invoicedByLine({ grnId: receipt.id, excludeInvoiceId });
  const onPo = po ? await invoicedByLine({ poId: po.id, excludeInvoiceId }) : {};
  return parseJson(receipt.items)
    .filter((it) => Number(it.receivedQuantity) > 0)
    .map((it) => {
      const index = Number(it.poLineIndex);
      const ordered = Number(poLines[index]?.quantity) || 0;
      const received = Number(it.receivedQuantity) || 0;
      const remaining = round3(Math.max(0, Math.min(received - (onGrn[index] || 0), ordered - (onPo[index] || 0))));
      return {
        poLineIndex: index,
        description: it.description,
        ordered,
        received,
        invoiced: onGrn[index] || 0,
        remaining,
        maxQuantity: remaining,
        unitPrice: Number(poLines[index]?.unitPrice) || 0,
      };
    });
}

/**
 * Loads and checks the PO / GRN an invoice points at. Returns { po, receipt, vendorId, currency }.
 * Throws { status, message } when the links don't fit together.
 */
async function resolveLinks({ poId, grnId, vendorId }) {
  let receipt = null;
  let po = null;
  if (grnId) {
    receipt = await db('shipment_receipts').where('id', grnId).first();
    if (!receipt) throw { status: 400, message: 'Goods receipt not found' };
    if (poId && poId !== receipt.po_id) throw { status: 400, message: 'That goods receipt belongs to a different purchase order' };
    poId = receipt.po_id;
  }
  if (poId) {
    po = await db('purchase_orders').where('id', poId).first();
    if (!po) throw { status: 400, message: 'Purchase order not found' };
    if (!INVOICEABLE_PO_STATUSES.includes(po.status)) {
      throw { status: 409, message: `${po.po_number} has not been sent to its vendor yet, so it cannot be invoiced (it is "${po.status.replace(/_/g, ' ')}")` };
    }
    if (vendorId && vendorId !== po.vendor_id) throw { status: 400, message: `${po.po_number} is with a different vendor` };
    vendorId = po.vendor_id;
  }
  if (!vendorId) throw { status: 400, message: 'Choose a vendor, purchase order or goods receipt' };
  const vendor = await db('vendors').where('id', vendorId).first();
  if (!vendor) throw { status: 400, message: 'Vendor not found' };
  return { po, receipt, vendor, vendorId, currency: po?.currency || null };
}

// Stops a PO line being billed beyond what was ordered (across all invoices) or a GRN line beyond what it received.
async function checkQuantities(lines, { po, receipt, excludeInvoiceId }) {
  if (!po) {
    const linked = lines.find((l) => l.poLineIndex !== null);
    if (linked) throw { status: 400, message: 'Lines can only reference PO lines when the invoice is linked to a purchase order' };
    return;
  }
  const poLines = parseJson(po.line_items);
  const billable = receipt ? await grnBillableLines(receipt, po, excludeInvoiceId) : await poBillableLines(po, excludeInvoiceId);
  const seen = {};
  for (const l of lines) {
    if (l.poLineIndex === null) continue;
    if (!poLines[l.poLineIndex]) throw { status: 400, message: `${po.po_number} has no line ${l.poLineIndex + 1}` };
    seen[l.poLineIndex] = round3((seen[l.poLineIndex] || 0) + l.quantity);
  }
  for (const [index, qty] of Object.entries(seen)) {
    const line = billable.find((b) => b.poLineIndex === Number(index));
    const max = line ? line.maxQuantity : 0;
    if (qty > max + 1e-9) {
      const what = poLines[index].description;
      throw {
        status: 400,
        message: receipt
          ? `"${what}": only ${max} can still be billed on this goods receipt`
          : `"${what}": only ${max} of ${Number(poLines[index].quantity) || 0} ordered is left to bill on ${po.po_number}`,
      };
    }
  }
}

const isOverdue = (inv) => UNPAID_STATUSES.includes(inv.status) && !!inv.due_date && toDate(inv.due_date) < today();

const historyEntry = (user, action, note = null) => ({ at: new Date().toISOString(), by: user.id, by_name: user.name || user.email || null, action, note });
const appendHistory = (inv, entry) => JSON.stringify([...parseJson(inv.history), entry]);

// Restricts a query to invoices the user may see.
function scopeQuery(q, user) {
  if (FULL_VIEW_ROLES.includes(user.role)) return q;
  return q.where((b) => b
    .where('invoices.created_by', user.id)
    .orWhereIn('invoices.po_id', db('purchase_orders').select('id').where('created_by', user.id)));
}

async function canView(user, inv) {
  if (FULL_VIEW_ROLES.includes(user.role) || inv.created_by === user.id) return true;
  if (!inv.po_id) return false;
  const po = await db('purchase_orders').where('id', inv.po_id).select('created_by').first();
  return po?.created_by === user.id;
}

async function enrichInvoices(invoices) {
  if (!invoices.length) return [];
  const uniq = (key) => [...new Set(invoices.map((i) => i[key]).filter(Boolean))];
  const [vendors, pos, receipts] = await Promise.all([
    db('vendors').whereIn('id', uniq('vendor_id')).select('id', 'name'),
    db('purchase_orders').whereIn('id', uniq('po_id')).select('id', 'po_number', 'status', 'currency', 'total_amount'),
    db('shipment_receipts').whereIn('id', uniq('grn_id')).select('id', 'grn_number', 'shipment_id', 'received_date'),
  ]);
  const vendorMap = Object.fromEntries(vendors.map((v) => [v.id, v.name]));
  const poMap = Object.fromEntries(pos.map((p) => [p.id, p]));
  const grnMap = Object.fromEntries(receipts.map((r) => [r.id, r]));
  return invoices.map((inv) => {
    const total = Number(inv.total_amount) || Number(inv.amount) || 0;
    const paid = Number(inv.amount_paid) || 0;
    const due = toDate(inv.due_date);
    const overdue = isOverdue(inv);
    const lines = parseJson(inv.line_items);
    return {
      ...inv,
      vendor_name: vendorMap[inv.vendor_id] || 'Unknown',
      po_number: poMap[inv.po_id]?.po_number || inv.po_number || null,
      po_status: poMap[inv.po_id]?.status || null,
      grn_number: grnMap[inv.grn_id]?.grn_number || inv.grn_number || null,
      shipment_id: grnMap[inv.grn_id]?.shipment_id || null,
      line_items: lines,
      currency: inv.currency || poMap[inv.po_id]?.currency || 'INR',
      tax_rate: Number(inv.tax_rate) || 0,
      subtotal: Number(inv.subtotal) || Number(inv.net_amount) || 0,
      tax_amount: Number(inv.tax_amount) || 0,
      total_amount: total,
      amount_paid: paid,
      outstanding: inv.status === 'paid' ? 0 : round2(Math.max(0, total - paid)),
      issue_date: toDate(inv.issue_date),
      due_date: due,
      payment_date: toDate(inv.payment_date),
      is_overdue: overdue,
      days_overdue: overdue ? daysBetween(due, today()) : 0,
      history: parseJson(inv.history),
      submitted_at: toIso(inv.submitted_at),
      approved_at: toIso(inv.approved_at),
      paid_at: toIso(inv.paid_at),
      disputed_at: toIso(inv.disputed_at),
      created_at: toIso(inv.created_at),
      updated_at: toIso(inv.updated_at),
    };
  });
}

const mapPayment = (p) => ({
  ...p,
  amount: Number(p.amount) || 0,
  payment_date: toDate(p.payment_date),
  created_at: toIso(p.created_at),
});

module.exports = {
  STATUSES,
  UNPAID_STATUSES,
  INVOICEABLE_PO_STATUSES,
  FULL_VIEW_ROLES,
  PAYMENT_METHODS,
  round2,
  round3,
  addDays,
  termsDays,
  nextInvoiceNumber,
  computeTotals,
  normaliseLines,
  invoicedByLine,
  poBillableLines,
  grnBillableLines,
  resolveLinks,
  checkQuantities,
  isOverdue,
  historyEntry,
  appendHistory,
  scopeQuery,
  canView,
  enrichInvoices,
  mapPayment,
};
