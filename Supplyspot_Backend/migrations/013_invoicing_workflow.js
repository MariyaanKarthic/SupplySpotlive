/**
 * Invoicing workflow: invoices are raised against a purchase order, a goods receipt (GRN), or both, and paid manually.
 * Extends the original `invoices` table (migration 003) and adds `invoice_payments` for payment history.
 *
 * Invoice lifecycle: draft → submitted → approved → paid; submitted or approved invoices can be disputed,
 * and a resolved dispute sends the invoice back to submitted. Overdue is computed (unpaid and past due_date), not stored.
 *
 * Amount columns: subtotal (before tax) + tax_amount = total_amount. The old `amount` and `net_amount`
 * columns are kept in step (amount = total, net_amount = subtotal) because analytics and payments still read them.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.alterTable('invoices', function(table) {
    table.uuid('po_id').references('id').inTable('purchase_orders').nullable();
    table.uuid('grn_id').references('id').inTable('shipment_receipts').nullable();
    table.string('vendor_invoice_number'); // the supplier's own reference, for reconciliation
    table.string('currency').defaultTo('INR');
    table.decimal('tax_rate', 6, 3).defaultTo(0); // percent, applied to the subtotal
    table.decimal('subtotal', 15, 2).defaultTo(0);
    table.decimal('total_amount', 15, 2).defaultTo(0);
    table.decimal('amount_paid', 15, 2).defaultTo(0);
    table.text('notes');
    table.timestamp('submitted_at').nullable();
    table.uuid('submitted_by').nullable();
    table.timestamp('approved_at').nullable();
    table.timestamp('paid_at').nullable();
    table.timestamp('disputed_at').nullable();
    table.text('dispute_reason');
    table.jsonb('history'); // [{ at, by, action, note }]

    table.index(['po_id']);
    table.index(['grn_id']);
  });

  await knex.schema.createTable('invoice_payments', function(table) {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('invoice_id').references('id').inTable('invoices').onDelete('CASCADE').notNullable();
    table.decimal('amount', 15, 2).notNullable();
    table.date('payment_date').notNullable();
    table.string('method'); // bank_transfer, cheque, card, upi, other
    table.string('reference'); // UTR / cheque number
    table.text('notes');
    table.uuid('recorded_by').references('id').inTable('users');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['invoice_id']);
  });

  // Old statuses map onto the new lifecycle; old amounts fill the new columns.
  await knex('invoices').where('status', 'pending_approval').update({ status: 'submitted' });
  await knex('invoices').where('status', 'overdue').update({ status: 'approved' });
  await knex('invoices').where('status', 'rejected').update({ status: 'disputed' });
  await knex('invoices').update({
    subtotal: knex.raw('coalesce(net_amount, amount)'),
    total_amount: knex.raw('amount'),
  });
  await knex('invoices').where('status', 'paid').update({ amount_paid: knex.raw('amount') });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('invoice_payments');
  await knex.schema.alterTable('invoices', function(table) {
    table.dropIndex(['po_id']);
    table.dropIndex(['grn_id']);
    table.dropColumn('po_id');
    table.dropColumn('grn_id');
    table.dropColumn('vendor_invoice_number');
    table.dropColumn('currency');
    table.dropColumn('tax_rate');
    table.dropColumn('subtotal');
    table.dropColumn('total_amount');
    table.dropColumn('amount_paid');
    table.dropColumn('notes');
    table.dropColumn('submitted_at');
    table.dropColumn('submitted_by');
    table.dropColumn('approved_at');
    table.dropColumn('paid_at');
    table.dropColumn('disputed_at');
    table.dropColumn('dispute_reason');
    table.dropColumn('history');
  });
};
