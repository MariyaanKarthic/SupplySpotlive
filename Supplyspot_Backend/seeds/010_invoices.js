/**
 * Sample invoices against the sample POs and GRNs (seeds 006 / .claude/seed_pos.py and 009_shipments.js):
 * a draft, invoices awaiting approval, approved (one overdue and part paid), paid in full, and one disputed for a price mismatch.
 * Purchase orders and receipts are not changed. Dates are relative to the day the seed runs. Run it on its own:
 *   npx knex seed:run --specific=010_invoices.js
 * Re-running it replaces every invoice and invoice payment.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const { v4: uuidv4 } = require('uuid');

const DAY = 86400000;
const dateIn = (days) => new Date(Date.now() + days * DAY).toISOString().split('T')[0];
const at = (days, hour = 10) => {
  const d = new Date(Date.now() + days * DAY);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
};
const sqlTime = (iso) => iso.replace('T', ' ').slice(0, 19);
const parse = (v, fallback = []) => (typeof v === 'string' ? JSON.parse(v || 'null') || fallback : (v || fallback));
const round2 = (n) => Math.round(n * 100) / 100;

exports.seed = async function(knex) {
  const admin = await knex('users').where('role', 'admin').first();
  if (!admin) throw new Error('Seed users first (001_users.js)');
  const by = { by: admin.id, by_name: admin.name || admin.email };

  await knex('invoice_payments').del();
  await knex('invoices').del();

  const year = new Date().getFullYear();
  let seq = 0;

  /**
   * opts: grn (GRN number to bill), status, issued (days ago), dueIn (days from today), taxRate, vendorRef,
   * priceFactor (bills above the PO price), payments [[amount | 'rest', daysAgo, method, reference]], dispute, notes
   */
  async function invoice(poNumber, opts) {
    const po = await knex('purchase_orders').where('po_number', poNumber).first();
    if (!po) {
      console.warn(`Skipping invoice for ${poNumber}: PO not found`);
      return;
    }
    const poLines = parse(po.line_items);
    let receipt = null;
    let lines;
    if (opts.grn) {
      receipt = await knex('shipment_receipts').where('grn_number', opts.grn).first();
      if (!receipt) {
        console.warn(`Skipping invoice for ${opts.grn}: GRN not found`);
        return;
      }
      lines = parse(receipt.items).filter((it) => Number(it.receivedQuantity) > 0)
        .map((it) => ({ poLineIndex: Number(it.poLineIndex), description: it.description, quantity: Number(it.receivedQuantity) }));
    } else {
      const receiving = ['partially_received', 'received', 'closed'].includes(po.status);
      lines = poLines.map((li, i) => ({ poLineIndex: i, description: li.description, quantity: Number(receiving ? li.receivedQuantity : li.quantity) || 0 }))
        .filter((l) => l.quantity > 0);
    }
    lines = lines.map((l) => {
      const unitPrice = round2((Number(poLines[l.poLineIndex]?.unitPrice) || 0) * (opts.priceFactor && l.poLineIndex === 0 ? opts.priceFactor : 1));
      return { ...l, unitPrice, amount: round2(unitPrice * l.quantity) };
    });
    if (opts.extraLine) lines.push({ poLineIndex: null, ...opts.extraLine, amount: round2(opts.extraLine.quantity * opts.extraLine.unitPrice) });

    const taxRate = opts.taxRate ?? 18;
    const subtotal = round2(lines.reduce((a, l) => a + l.amount, 0));
    const tax = round2(subtotal * taxRate / 100);
    const total = round2(subtotal + tax);

    const issued = -opts.issued;
    const history = [{ at: at(issued, 9), ...by, action: 'created', note: receipt ? `From ${receipt.grn_number}` : `From ${po.po_number}` }];
    const row = {
      id: uuidv4(),
      invoice_number: `INV-${year}-${String(++seq).padStart(4, '0')}`,
      vendor_invoice_number: opts.vendorRef || null,
      vendor_id: po.vendor_id,
      po_id: po.id,
      grn_id: receipt?.id || null,
      po_number: po.po_number,
      grn_number: receipt?.grn_number || null,
      currency: po.currency || 'INR',
      line_items: JSON.stringify(lines),
      tax_rate: taxRate,
      subtotal,
      tax_amount: tax,
      total_amount: total,
      amount: total,
      net_amount: subtotal,
      amount_paid: 0,
      issue_date: dateIn(issued),
      due_date: dateIn(opts.dueIn),
      status: opts.status,
      notes: opts.notes || null,
      submission_method: 'manual_entry',
      matching_status: 'matched',
      created_by: admin.id,
      updated_by: admin.id,
      created_at: sqlTime(at(issued, 9)),
      updated_at: sqlTime(at(-1, 9)),
    };

    if (opts.status !== 'draft') {
      row.submitted_at = at(issued, 11);
      row.submitted_by = admin.id;
      history.push({ at: row.submitted_at, ...by, action: 'submitted', note: null });
    }
    if (['approved', 'paid'].includes(opts.status) || (opts.status === 'disputed' && opts.approvedBeforeDispute)) {
      row.approved_at = at(issued + 2, 15);
      row.approved_by = admin.id;
      history.push({ at: row.approved_at, ...by, action: 'approved', note: null });
    }
    if (opts.status === 'disputed') {
      row.disputed_at = at(issued + 3, 12);
      row.dispute_reason = opts.dispute;
      history.push({ at: row.disputed_at, ...by, action: 'disputed', note: opts.dispute });
    }

    const payments = [];
    let paid = 0;
    for (const [amount, daysAgo, method, reference] of opts.payments || []) {
      const value = amount === 'rest' ? round2(total - paid) : amount;
      paid = round2(paid + value);
      const full = paid >= total - 0.001;
      payments.push({
        id: uuidv4(), invoice_id: row.id, amount: value, payment_date: dateIn(-daysAgo), method, reference,
        notes: null, recorded_by: admin.id, created_at: sqlTime(at(-daysAgo, 16)),
      });
      history.push({ at: at(-daysAgo, 16), ...by, action: full ? 'paid in full' : 'part payment', note: `${value} ${row.currency} · ref ${reference}` });
      if (full) {
        row.payment_date = dateIn(-daysAgo);
        row.paid_at = at(-daysAgo, 16);
      }
    }
    row.amount_paid = paid;
    row.history = JSON.stringify(history);
    await knex('invoices').insert(row);
    if (payments.length) await knex('invoice_payments').insert(payments);
  }

  // Paid in full against the legal retainer GRN.
  await invoice('PO-2026-0005', { grn: 'GRN-2026-0001', status: 'paid', issued: 20, dueIn: -5, vendorRef: 'LGL/26-27/0412',
    payments: [['rest', 6, 'bank_transfer', 'UTR2026100311842']] });
  // Approved, past due and only part paid (shows as overdue).
  await invoice('PO-2026-0008', { grn: 'GRN-2026-0002', status: 'approved', issued: 25, dueIn: -10, vendorRef: 'FHS-0921',
    payments: [[200000, 8, 'bank_transfer', 'UTR2026100133977']], notes: 'Balance held until the September attendance sheet is signed off.' });
  // Awaiting approval: the part of PO-2026-0007 received so far.
  await invoice('PO-2026-0007', { grn: 'GRN-2026-0003', status: 'submitted', issued: 3, dueIn: 27, vendorRef: 'SS/INV/7781' });
  // Approved and due later this cycle.
  await invoice('PO-2026-0006', { status: 'approved', issued: 6, dueIn: 54, vendorRef: 'TCH-24-1190' });
  // Paid in two instalments.
  await invoice('PO-2026-0001', { status: 'paid', issued: 40, dueIn: -10, vendorRef: 'AGR/0098',
    payments: [[22567.5, 38, 'bank_transfer', 'UTR2026082944210'], ['rest', 12, 'cheque', 'CHQ 004417']] });
  // Disputed: billed above the PO price on the first line.
  await invoice('PO-2026-0002', { status: 'disputed', issued: 9, dueIn: 21, vendorRef: 'NX-55102', priceFactor: 1.12, taxRate: 0,
    approvedBeforeDispute: false, dispute: 'Access points billed at 12% above the PO price. Asked the vendor for a credit note.' });
  // Draft being prepared, with a freight line that is not on the PO.
  await invoice('PO-2026-0003', { status: 'draft', issued: 1, dueIn: 14, vendorRef: 'EL-3307',
    extraLine: { description: 'Freight and handling', quantity: 1, unitPrice: 850 } });
};
