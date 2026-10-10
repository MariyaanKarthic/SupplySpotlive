const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { authenticate, authorize } = require('../middleware/auth');
const { db } = require('../config/database');
const logger = require('../config/logger');
const { parseJson, today, toDate } = require('../services/shipments');
const {
  STATUSES, UNPAID_STATUSES, PAYMENT_METHODS, round2, round3, addDays, termsDays, nextInvoiceNumber, computeTotals,
  normaliseLines, poBillableLines, grnBillableLines, invoicedByLine, resolveLinks, checkQuantities, historyEntry,
  appendHistory, scopeQuery, canView, enrichInvoices, mapPayment,
} = require('../services/invoices');

const router = express.Router();

const READ_ROLES = ['admin', 'procurement_manager', 'finance_manager', 'ap_clerk', 'viewer'];
// Raising, editing, submitting and approving invoices.
const WRITE_ROLES = ['admin', 'finance_manager'];
// Recording payments and raising or resolving disputes.
const ADMIN_ROLES = ['admin'];

const handle = (label, fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    if (error && error.status && error.message) return res.status(error.status).json({ success: false, error: error.message });
    logger.error(`${label} error:`, error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const invalid = (req, res) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return false;
  res.status(400).json({ success: false, error: errors.array()[0].msg, details: errors.array() });
  return true;
};

const now = () => new Date().toISOString();

// Loads an invoice the user may see, or answers 404 and returns null.
async function loadVisible(req, res) {
  const inv = await db('invoices').where('id', req.params.id).first();
  if (!inv || !(await canView(req.user, inv))) {
    res.status(404).json({ success: false, error: 'Invoice not found' });
    return null;
  }
  return inv;
}

async function loadDetail(id) {
  const inv = await db('invoices').where('id', id).first();
  if (!inv) return null;
  const [enriched] = await enrichInvoices([inv]);
  const payments = await db('invoice_payments').where('invoice_id', id).orderBy('payment_date', 'asc').orderBy('created_at', 'asc');
  const po = inv.po_id ? await db('purchase_orders').where('id', inv.po_id).first() : null;
  const receipt = inv.grn_id ? await db('shipment_receipts').where('id', inv.grn_id).first() : null;
  const others = inv.po_id
    ? await db('invoices').where('po_id', inv.po_id).whereNot('id', id).select('id', 'invoice_number', 'status', 'total_amount')
    : [];
  return {
    ...enriched,
    payments: payments.map(mapPayment),
    po: po && {
      id: po.id,
      po_number: po.po_number,
      status: po.status,
      currency: po.currency,
      terms: po.terms,
      total_amount: Number(po.total_amount) || 0,
      issue_date: toDate(po.issue_date),
      line_items: parseJson(po.line_items),
    },
    grn: receipt && {
      id: receipt.id,
      grn_number: receipt.grn_number,
      shipment_id: receipt.shipment_id,
      received_date: toDate(receipt.received_date),
      is_final: !!receipt.is_final,
      items: parseJson(receipt.items),
    },
    other_invoices: others.map((o) => ({ ...o, total_amount: Number(o.total_amount) || 0 })),
  };
}

const sendDetail = async (res, id, status = 200) => res.status(status).json({ success: true, data: await loadDetail(id) });

// Moves an invoice between statuses, recording who did it; answers 409 when the move isn't allowed from its status.
async function transition(req, res, { from, to, action, note = null, extra = {}, audit }) {
  const inv = await loadVisible(req, res);
  if (!inv) return;
  if (!from.includes(inv.status)) {
    return res.status(409).json({ success: false, error: `${inv.invoice_number} is ${inv.status}; it can only be ${action} when ${from.join(' or ')}` });
  }
  await db('invoices').where('id', inv.id).update({
    status: to,
    ...extra,
    history: appendHistory(inv, historyEntry(req.user, action, note)),
    updated_by: req.user.id,
    updated_at: db.fn.now(),
  });
  logger.logAudit(audit, req.user.id, { invoiceId: inv.id, from: inv.status, to });
  await sendDetail(res, inv.id);
}

// GET /invoices — filters: po_id, grn_id, vendor_id, status (incl. overdue, open), search, date_from/date_to (invoice date), due_from/due_to
router.get('/', [
  authenticate,
  authorize(...READ_ROLES),
  query('status').optional().isIn([...STATUSES, 'overdue', 'open']).withMessage('Unknown status'),
  query('limit').optional().isInt({ min: 1, max: 500 }),
  query('page').optional().isInt({ min: 1 }),
  query('date_from').optional({ values: 'falsy' }).isDate(),
  query('date_to').optional({ values: 'falsy' }).isDate(),
  query('due_from').optional({ values: 'falsy' }).isDate(),
  query('due_to').optional({ values: 'falsy' }).isDate(),
], handle('List invoices', async (req, res) => {
  if (invalid(req, res)) return;
  const { po_id, grn_id, vendor_id, status, search, date_from, date_to, due_from, due_to } = req.query;
  const limit = parseInt(req.query.limit || 200, 10);
  const page = parseInt(req.query.page || 1, 10);

  let q = scopeQuery(db('invoices'), req.user);
  if (po_id) q = q.where('po_id', po_id);
  if (grn_id) q = q.where('grn_id', grn_id);
  if (vendor_id) q = q.where('vendor_id', vendor_id);
  if (date_from) q = q.where('issue_date', '>=', date_from);
  if (date_to) q = q.where('issue_date', '<=', date_to);
  if (due_from) q = q.where('due_date', '>=', due_from);
  if (due_to) q = q.where('due_date', '<=', due_to);
  if (status === 'overdue') q = q.whereIn('status', UNPAID_STATUSES).where('due_date', '<', today());
  else if (status === 'open') q = q.whereIn('status', UNPAID_STATUSES);
  else if (status) q = q.where('status', status);
  if (search) {
    const term = `%${String(search).toLowerCase()}%`;
    q = q.where((b) => b
      .whereRaw('lower(invoice_number) like ?', [term])
      .orWhereRaw('lower(coalesce(vendor_invoice_number, \'\')) like ?', [term])
      .orWhereIn('vendor_id', db('vendors').select('id').whereRaw('lower(name) like ?', [term]))
      .orWhereIn('po_id', db('purchase_orders').select('id').whereRaw('lower(po_number) like ?', [term])));
  }

  const total = await q.clone().count('id as count').first();
  const rows = await q.orderBy('created_at', 'desc').limit(limit).offset((page - 1) * limit);
  res.json({
    success: true,
    data: {
      invoices: await enrichInvoices(rows),
      pagination: { page, limit, total: Number(total.count), totalPages: Math.ceil(Number(total.count) / limit) },
    },
  });
}));

// GET /invoices/prefill?po_id= | ?grn_id= — lines still left to bill, with suggested dates (fills the create drawer)
router.get('/prefill', [authenticate, authorize(...READ_ROLES)], handle('Invoice prefill', async (req, res) => {
  const { po, receipt, vendor, currency } = await resolveLinks({ poId: req.query.po_id || null, grnId: req.query.grn_id || null });
  const lines = receipt ? await grnBillableLines(receipt, po) : await poBillableLines(po);
  const issueDate = today();
  res.json({
    success: true,
    data: {
      po: { id: po.id, po_number: po.po_number, status: po.status, terms: po.terms, currency: po.currency, total_amount: Number(po.total_amount) || 0 },
      grn: receipt && { id: receipt.id, grn_number: receipt.grn_number, received_date: toDate(receipt.received_date), shipment_id: receipt.shipment_id },
      vendor: { id: vendor.id, name: vendor.name },
      currency: currency || 'INR',
      issue_date: issueDate,
      due_date: addDays(issueDate, termsDays(po.terms)),
      lines,
    },
  });
}));

// GET /invoices/grns — goods receipts that still have something to bill (for the create drawer's GRN picker)
router.get('/grns', [authenticate, authorize(...READ_ROLES)], handle('Billable GRNs', async (req, res) => {
  let q = db('shipment_receipts as r').join('purchase_orders as p', 'p.id', 'r.po_id')
    .join('vendors as v', 'v.id', 'p.vendor_id')
    .select('r.id', 'r.grn_number', 'r.received_date', 'r.po_id', 'r.items', 'p.po_number', 'p.vendor_id', 'v.name as vendor_name')
    .orderBy('r.created_at', 'desc');
  if (req.query.po_id) q = q.where('r.po_id', req.query.po_id);
  const rows = await q;
  const out = [];
  for (const r of rows) {
    const billed = await invoicedByLine({ grnId: r.id });
    const received = parseJson(r.items).reduce((a, it) => a + Number(it.receivedQuantity || 0), 0);
    const invoiced = Object.values(billed).reduce((a, n) => a + n, 0);
    out.push({
      id: r.id, grn_number: r.grn_number, received_date: toDate(r.received_date), po_id: r.po_id, po_number: r.po_number,
      vendor_id: r.vendor_id, vendor_name: r.vendor_name, received_quantity: round3(received), invoiced_quantity: round3(invoiced),
      fully_invoiced: received > 0 && invoiced >= received,
    });
  }
  res.json({ success: true, data: { grns: out } });
}));

// GET /invoices/vendor/:vendorId/summary — totals, recent invoices and payment history for one vendor
router.get('/vendor/:vendorId/summary', [authenticate, authorize(...READ_ROLES)], handle('Vendor invoice summary', async (req, res) => {
  const rows = await enrichInvoices(await scopeQuery(db('invoices'), req.user).where('vendor_id', req.params.vendorId).orderBy('created_at', 'desc'));
  const billed = rows.filter((i) => i.status !== 'draft');
  const payments = rows.length
    ? await db('invoice_payments').whereIn('invoice_id', rows.map((i) => i.id)).orderBy('payment_date', 'desc').limit(10)
    : [];
  const numberById = Object.fromEntries(rows.map((i) => [i.id, i.invoice_number]));
  const sum = (list, key) => round2(list.reduce((a, i) => a + i[key], 0));
  const overdue = billed.filter((i) => i.is_overdue);
  res.json({
    success: true,
    data: {
      currency: rows[0]?.currency || 'INR',
      count: rows.length,
      invoiced: sum(billed, 'total_amount'),
      paid: sum(billed, 'amount_paid'),
      outstanding: sum(billed, 'outstanding'),
      overdue_count: overdue.length,
      overdue_amount: sum(overdue, 'outstanding'),
      recent_invoices: rows.slice(0, 6).map((i) => ({
        id: i.id, invoice_number: i.invoice_number, status: i.status, total_amount: i.total_amount, outstanding: i.outstanding,
        currency: i.currency, due_date: i.due_date, is_overdue: i.is_overdue, days_overdue: i.days_overdue, po_number: i.po_number,
      })),
      payments: payments.map((p) => ({ ...mapPayment(p), invoice_number: numberById[p.invoice_id] })),
    },
  });
}));

// GET /invoices/:id — invoice with its lines, payments and linked PO / GRN
router.get('/:id', [authenticate, authorize(...READ_ROLES)], handle('Get invoice', async (req, res) => {
  const inv = await loadVisible(req, res);
  if (!inv) return;
  await sendDetail(res, inv.id);
}));

// GET /invoices/:id/payment-summary — totals, what is paid and outstanding, and a PO / GRN match check per line
router.get('/:id/payment-summary', [authenticate, authorize(...READ_ROLES)], handle('Payment summary', async (req, res) => {
  const inv = await loadVisible(req, res);
  if (!inv) return;
  const detail = await loadDetail(inv.id);
  let poSummary = null;
  let match = [];
  if (detail.po) {
    const onPo = await enrichInvoices(await db('invoices').where('po_id', detail.po.id).whereNot('status', 'draft'));
    const invoicedTotal = round2(onPo.reduce((a, i) => a + i.subtotal, 0));
    poSummary = {
      po_number: detail.po.po_number,
      total_amount: detail.po.total_amount,
      invoiced_subtotal: invoicedTotal,
      paid: round2(onPo.reduce((a, i) => a + i.amount_paid, 0)),
      remaining_to_invoice: round2(Math.max(0, detail.po.total_amount - invoicedTotal)),
      invoice_count: onPo.length,
    };
    // Three-way check per line: ordered (PO) vs received (GRN or PO) vs billed (all invoices on the PO).
    const billedAll = await invoicedByLine({ poId: detail.po.id });
    const grnItems = detail.grn ? detail.grn.items : null;
    match = detail.line_items.filter((l) => l.poLineIndex !== null && l.poLineIndex !== undefined).map((l) => {
      const poLine = detail.po.line_items[l.poLineIndex] || {};
      const ordered = Number(poLine.quantity) || 0;
      const received = grnItems
        ? Number(grnItems.find((g) => Number(g.poLineIndex) === Number(l.poLineIndex))?.receivedQuantity) || 0
        : Number(poLine.receivedQuantity) || 0;
      const billed = billedAll[l.poLineIndex] || 0;
      const priceDiff = round2(Number(l.unitPrice) - (Number(poLine.unitPrice) || 0));
      let result = 'matched';
      if (priceDiff !== 0) result = 'price_mismatch';
      else if (l.quantity > received + 1e-9) result = received > 0 ? 'over_received' : 'not_received';
      return {
        poLineIndex: l.poLineIndex, description: l.description, ordered, received, billed_total: billed,
        this_invoice: l.quantity, po_unit_price: Number(poLine.unitPrice) || 0, invoice_unit_price: Number(l.unitPrice) || 0, result,
      };
    });
  }
  res.json({
    success: true,
    data: {
      invoice_number: detail.invoice_number,
      status: detail.status,
      currency: detail.currency,
      subtotal: detail.subtotal,
      tax_rate: detail.tax_rate,
      tax_amount: detail.tax_amount,
      total_amount: detail.total_amount,
      amount_paid: detail.amount_paid,
      outstanding: detail.outstanding,
      due_date: detail.due_date,
      is_overdue: detail.is_overdue,
      days_overdue: detail.days_overdue,
      payments: detail.payments,
      po: poSummary,
      match,
    },
  });
}));

const lineValidators = [
  body('items').optional().isArray().withMessage('Items must be a list'),
  body('items.*.quantity').optional().isFloat({ gt: 0 }).withMessage('Each line needs a quantity above zero'),
  body('items.*.unitPrice').optional().isFloat({ min: 0 }).withMessage('Unit prices cannot be negative'),
  body('taxRate').optional({ values: 'null' }).isFloat({ min: 0, max: 100 }).withMessage('Tax rate must be between 0 and 100%'),
  body('issueDate').optional({ values: 'falsy' }).isDate().withMessage('Invoice date must be a date'),
  body('dueDate').optional({ values: 'falsy' }).isDate().withMessage('Due date must be a date'),
];

function checkLines(lines) {
  if (!lines.length) throw { status: 400, message: 'Add at least one line' };
  const blank = lines.find((l) => !l.description);
  if (blank) throw { status: 400, message: 'Every line needs a description' };
  const zero = lines.find((l) => !(l.quantity > 0));
  if (zero) throw { status: 400, message: `"${zero.description}" needs a quantity above zero` };
}

/**
 * POST /invoices — create a draft from a PO (poId), a GRN (grnId), or by hand (vendorId).
 * items omitted = everything still left to bill on the PO / GRN.
 */
router.post('/', [
  authenticate,
  authorize(...WRITE_ROLES),
  ...lineValidators,
], handle('Create invoice', async (req, res) => {
  if (invalid(req, res)) return;
  const { po, receipt, vendorId, currency } = await resolveLinks({
    poId: req.body.poId || null, grnId: req.body.grnId || null, vendorId: req.body.vendorId || null,
  });

  let lines;
  if (Array.isArray(req.body.items)) {
    lines = normaliseLines(req.body.items);
  } else if (po) {
    const billable = receipt ? await grnBillableLines(receipt, po) : await poBillableLines(po);
    lines = billable.filter((l) => l.remaining > 0).map((l) => ({
      poLineIndex: l.poLineIndex, description: l.description, quantity: l.remaining, unitPrice: l.unitPrice, amount: round2(l.remaining * l.unitPrice),
    }));
    if (!lines.length) throw { status: 409, message: `Nothing is left to bill on ${receipt ? receipt.grn_number : po.po_number}` };
  } else {
    lines = [];
  }
  checkLines(lines);
  await checkQuantities(lines, { po, receipt });

  const issueDate = req.body.issueDate || today();
  const dueDate = req.body.dueDate || addDays(issueDate, termsDays(po?.terms));
  if (dueDate < issueDate) throw { status: 400, message: 'The due date cannot be before the invoice date' };
  const taxRate = req.body.taxRate === undefined || req.body.taxRate === null || req.body.taxRate === '' ? 18 : Number(req.body.taxRate);
  const totals = computeTotals(lines, taxRate);

  const id = uuidv4();
  const invoiceNumber = await nextInvoiceNumber();
  await db('invoices').insert({
    id,
    invoice_number: invoiceNumber,
    vendor_invoice_number: (req.body.vendorInvoiceNumber || '').trim() || null,
    vendor_id: vendorId,
    po_id: po?.id || null,
    grn_id: receipt?.id || null,
    po_number: po?.po_number || null,
    grn_number: receipt?.grn_number || null,
    currency: currency || req.body.currency || 'INR',
    line_items: JSON.stringify(lines),
    tax_rate: taxRate,
    subtotal: totals.subtotal,
    tax_amount: totals.tax_amount,
    total_amount: totals.total_amount,
    amount: totals.total_amount,
    net_amount: totals.subtotal,
    amount_paid: 0,
    issue_date: issueDate,
    due_date: dueDate,
    status: 'draft',
    description: (req.body.description || '').trim() || null,
    notes: (req.body.notes || '').trim() || null,
    submission_method: 'manual_entry',
    matching_status: po ? 'matched' : 'unmatched',
    history: JSON.stringify([historyEntry(req.user, 'created', receipt ? `From ${receipt.grn_number}` : po ? `From ${po.po_number}` : null)]),
    created_by: req.user.id,
    updated_by: req.user.id,
    created_at: now(),
    updated_at: now(),
  });
  logger.logAudit('INVOICE_CREATED', req.user.id, { invoiceId: id, poId: po?.id || null, grnId: receipt?.id || null });
  await sendDetail(res, id, 201);
}));

// PUT /invoices/:id — drafts only; whitelisted fields. Changing items re-checks quantities against the PO / GRN.
const UPDATABLE = {
  vendorInvoiceNumber: 'vendor_invoice_number',
  issueDate: 'issue_date',
  dueDate: 'due_date',
  description: 'description',
  notes: 'notes',
};
router.put('/:id', [
  authenticate,
  authorize(...WRITE_ROLES),
  ...lineValidators,
], handle('Update invoice', async (req, res) => {
  if (invalid(req, res)) return;
  const inv = await loadVisible(req, res);
  if (!inv) return;
  if (inv.status !== 'draft') return res.status(409).json({ success: false, error: `${inv.invoice_number} is ${inv.status}; only drafts can be edited` });

  const update = { updated_by: req.user.id, updated_at: db.fn.now() };
  for (const [key, column] of Object.entries(UPDATABLE)) {
    if (req.body[key] !== undefined) update[column] = typeof req.body[key] === 'string' ? (req.body[key].trim() || null) : req.body[key];
  }
  if (update.issue_date === null || update.due_date === null) throw { status: 400, message: 'Invoice and due dates are required' };
  const issueDate = update.issue_date || toDate(inv.issue_date);
  const dueDate = update.due_date || toDate(inv.due_date);
  if (dueDate < issueDate) throw { status: 400, message: 'The due date cannot be before the invoice date' };

  let lines = parseJson(inv.line_items);
  if (Array.isArray(req.body.items)) {
    lines = normaliseLines(req.body.items);
    checkLines(lines);
    const po = inv.po_id ? await db('purchase_orders').where('id', inv.po_id).first() : null;
    const receipt = inv.grn_id ? await db('shipment_receipts').where('id', inv.grn_id).first() : null;
    await checkQuantities(lines, { po, receipt, excludeInvoiceId: inv.id });
    update.line_items = JSON.stringify(lines);
  }
  const taxRate = req.body.taxRate === undefined || req.body.taxRate === null || req.body.taxRate === '' ? Number(inv.tax_rate) || 0 : Number(req.body.taxRate);
  const totals = computeTotals(lines, taxRate);
  Object.assign(update, {
    tax_rate: taxRate, subtotal: totals.subtotal, tax_amount: totals.tax_amount, total_amount: totals.total_amount,
    amount: totals.total_amount, net_amount: totals.subtotal,
  });

  await db('invoices').where('id', inv.id).update(update);
  logger.logAudit('INVOICE_UPDATED', req.user.id, { invoiceId: inv.id });
  await sendDetail(res, inv.id);
}));

// POST /invoices/:id/submit — draft → submitted (pending approval)
router.post('/:id/submit', [authenticate, authorize(...WRITE_ROLES)], handle('Submit invoice', async (req, res) => {
  const inv = await db('invoices').where('id', req.params.id).first();
  if (inv && inv.status === 'draft') {
    const lines = parseJson(inv.line_items);
    if (!lines.length || !(Number(inv.total_amount) > 0)) {
      return res.status(400).json({ success: false, error: 'Add at least one priced line before submitting' });
    }
  }
  await transition(req, res, {
    from: ['draft'], to: 'submitted', action: 'submitted', audit: 'INVOICE_SUBMITTED',
    extra: { submitted_at: now(), submitted_by: req.user.id },
  });
}));

// POST /invoices/:id/approve — submitted → approved (ready to pay)
router.post('/:id/approve', [authenticate, authorize(...WRITE_ROLES)], handle('Approve invoice', async (req, res) => {
  await transition(req, res, {
    from: ['submitted'], to: 'approved', action: 'approved', note: req.body.notes || null, audit: 'INVOICE_APPROVED',
    extra: { approved_at: now(), approved_by: req.user.id },
  });
}));

// POST /invoices/:id/return — submitted → draft, with a reason, so it can be corrected
router.post('/:id/return', [
  authenticate, authorize(...WRITE_ROLES), body('reason').trim().notEmpty().withMessage('Say what needs correcting'),
], handle('Return invoice', async (req, res) => {
  if (invalid(req, res)) return;
  await transition(req, res, {
    from: ['submitted'], to: 'draft', action: 'returned to draft', note: req.body.reason, audit: 'INVOICE_RETURNED',
    extra: { submitted_at: null, submitted_by: null },
  });
}));

// POST /invoices/:id/pay — record a payment (defaults to the full outstanding amount); paid in full → paid
router.post('/:id/pay', [
  authenticate,
  authorize(...ADMIN_ROLES),
  body('amount').optional({ values: 'null' }).isFloat({ gt: 0 }).withMessage('Payment amount must be above zero'),
  body('paymentDate').optional({ values: 'falsy' }).isDate().withMessage('Payment date must be a date'),
  body('method').optional({ values: 'falsy' }).isIn(PAYMENT_METHODS).withMessage('Unknown payment method'),
], handle('Pay invoice', async (req, res) => {
  if (invalid(req, res)) return;
  const inv = await loadVisible(req, res);
  if (!inv) return;
  if (inv.status !== 'approved') {
    return res.status(409).json({ success: false, error: `${inv.invoice_number} is ${inv.status}; only approved invoices can be paid` });
  }
  const total = Number(inv.total_amount) || 0;
  const paidSoFar = Number(inv.amount_paid) || 0;
  const outstanding = round2(total - paidSoFar);
  const amount = req.body.amount === undefined || req.body.amount === null || req.body.amount === '' ? outstanding : round2(req.body.amount);
  if (amount > outstanding + 0.001) throw { status: 400, message: `Only ${outstanding} is outstanding on ${inv.invoice_number}` };
  const paymentDate = req.body.paymentDate || today();
  if (paymentDate > today()) throw { status: 400, message: 'Payment date cannot be in the future' };

  const newPaid = round2(paidSoFar + amount);
  const full = newPaid >= total - 0.001;
  const note = `${amount} ${inv.currency || ''}`.trim() + (req.body.reference ? ` · ref ${req.body.reference}` : '');
  await db.transaction(async (trx) => {
    await trx('invoice_payments').insert({
      id: uuidv4(),
      invoice_id: inv.id,
      amount,
      payment_date: paymentDate,
      method: req.body.method || 'bank_transfer',
      reference: (req.body.reference || '').trim() || null,
      notes: (req.body.notes || '').trim() || null,
      recorded_by: req.user.id,
      created_at: now(),
    });
    await trx('invoices').where('id', inv.id).update({
      amount_paid: newPaid,
      ...(full ? { status: 'paid', payment_date: paymentDate, paid_at: now() } : {}),
      history: appendHistory(inv, historyEntry(req.user, full ? 'paid in full' : 'part payment', note)),
      updated_by: req.user.id,
      updated_at: trx.fn.now(),
    });
  });
  logger.logAudit(full ? 'INVOICE_PAID' : 'INVOICE_PART_PAID', req.user.id, { invoiceId: inv.id, amount });
  await sendDetail(res, inv.id, 201);
}));

// POST /invoices/:id/dispute — submitted / approved → disputed, with a reason
router.post('/:id/dispute', [
  authenticate, authorize(...ADMIN_ROLES), body('reason').trim().notEmpty().withMessage('Say what is wrong with the invoice'),
], handle('Dispute invoice', async (req, res) => {
  if (invalid(req, res)) return;
  await transition(req, res, {
    from: ['submitted', 'approved'], to: 'disputed', action: 'disputed', note: req.body.reason, audit: 'INVOICE_DISPUTED',
    extra: { disputed_at: now(), dispute_reason: req.body.reason },
  });
}));

// POST /invoices/:id/resolve — disputed → submitted, so it goes through approval again
router.post('/:id/resolve', [authenticate, authorize(...ADMIN_ROLES)], handle('Resolve dispute', async (req, res) => {
  await transition(req, res, {
    from: ['disputed'], to: 'submitted', action: 'dispute resolved', note: req.body.note || null, audit: 'INVOICE_DISPUTE_RESOLVED',
    extra: { approved_at: null, approved_by: null },
  });
}));

// DELETE /invoices/:id — drafts only
router.delete('/:id', [authenticate, authorize(...WRITE_ROLES)], handle('Delete invoice', async (req, res) => {
  const inv = await loadVisible(req, res);
  if (!inv) return;
  if (inv.status !== 'draft') return res.status(409).json({ success: false, error: `${inv.invoice_number} is ${inv.status}; only drafts can be deleted` });
  await db('invoices').where('id', inv.id).del();
  logger.logAudit('INVOICE_DELETED', req.user.id, { invoiceId: inv.id, invoiceNumber: inv.invoice_number });
  res.json({ success: true, data: { id: inv.id, invoice_number: inv.invoice_number } });
}));

// OCR extraction used by the upload flow (unchanged).
// Multer storage setup for OCR uploads
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ 
  storage, 
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Helper for OCR Extraction
async function processOCRDocument(fileBuffer, fileName = 'document.png') {
  let text = '';
  try {
    const tesseract = require('tesseract.js');
    if (fileBuffer && fileBuffer.length > 0) {
      const { data } = await tesseract.recognize(fileBuffer, 'eng');
      text = data?.text || '';
    }
  } catch (err) {
    logger.warn('Tesseract OCR fallback triggered:', err.message);
  }

  // Fetch real vendors and POs from DB for matching
  const vendors = await db('vendors').select('id', 'name').limit(10);
  const pos = await db('purchase_orders').select('id', 'po_number', 'vendor_id', 'total_amount').limit(10);

  // Extract Invoice Number
  const invMatch = text.match(/INV[-_\s]?\d+/i) || text.match(/Invoice\s*#?\s*([A-Z0-9-]+)/i);
  const invoiceNumber = invMatch ? invMatch[0].replace(/\s+/g, '') : `INV-${Date.now().toString().slice(-6)}`;

  // Extract Amounts
  const amountMatch = text.match(/Total[:\s]*\$?\s*([\d,]+\.?\d*)/i) || text.match(/\$\s*([\d,]+\.?\d*)/);
  const rawAmount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 12500.00;
  const amount = isNaN(rawAmount) ? 12500.00 : rawAmount;
  const taxAmount = Math.round(amount * 0.10 * 100) / 100;
  const netAmount = Math.round((amount - taxAmount) * 100) / 100;

  // Extract Vendor
  let matchedVendor = vendors[0] || { id: uuidv4(), name: 'TechCorp Solutions' };
  for (const v of vendors) {
    if (text.toLowerCase().includes(v.name.toLowerCase())) {
      matchedVendor = v;
      break;
    }
  }

  // PO Matching logic
  const candidatePOs = pos.map(po => {
    let score = 70;
    if (po.vendor_id === matchedVendor.id) score += 15;
    if (Math.abs(Number(po.total_amount) - amount) < 100) score += 10;
    return {
      id: po.id,
      poNumber: po.po_number || `PO-2023-${po.id.slice(0, 3)}`,
      vendor: matchedVendor.name,
      amount: Number(po.total_amount) || amount,
      matchScore: Math.min(score, 98),
      items: ['Software License & Hardware Supplies']
    };
  });

  if (candidatePOs.length === 0) {
    candidatePOs.push({
      id: 'PO-2023-045',
      poNumber: 'PO-2023-045',
      vendor: matchedVendor.name,
      amount: amount,
      matchScore: 95,
      items: ['Software License & Maintenance']
    });
  }

  const bestPO = candidatePOs[0];

  return {
    invoiceNumber,
    vendor: matchedVendor.name,
    vendorId: matchedVendor.id,
    amount,
    taxAmount,
    netAmount,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    confidence: Math.floor(Math.random() * (98 - 92 + 1)) + 92,
    description: `OCR processed document (${fileName})`,
    poNumber: bestPO ? bestPO.poNumber : 'PO-2023-045',
    grnNumber: 'GRN-2023-089',
    matchingStatus: 'PO Matched',
    lineItems: [
      { description: 'Software License', quantity: 1, unitPrice: netAmount, total: netAmount }
    ],
    matchingPOs: candidatePOs,
    rawText: text || 'Scanned invoice content'
  };
}

// POST /invoices/ocr-process (and alias /process-ocr)
router.post('/ocr-process', [authenticate], upload.single('file'), async (req, res) => {
  try {
    const fileBuffer = req.file ? req.file.buffer : null;
    const fileName = req.file ? req.file.originalname : 'invoice_scan.png';

    const extracted = await processOCRDocument(fileBuffer, fileName);
    logger.info(`OCR processed file: ${fileName}`);

    res.json({
      success: true,
      data: extracted
    });
  } catch (error) {
    logger.error('OCR Process error:', error);
    res.status(500).json({ success: false, error: 'Failed to process OCR document', details: error.message });
  }
});

router.post('/process-ocr', [authenticate], upload.single('file'), async (req, res) => {
  try {
    const fileBuffer = req.file ? req.file.buffer : null;
    const fileName = req.file ? req.file.originalname : 'invoice_scan.png';
    const extracted = await processOCRDocument(fileBuffer, fileName);
    res.json({ success: true, data: extracted });
  } catch (error) {
    logger.error('OCR Process error:', error);
    res.status(500).json({ success: false, error: 'Failed to process OCR document' });
  }
});


module.exports = router;
