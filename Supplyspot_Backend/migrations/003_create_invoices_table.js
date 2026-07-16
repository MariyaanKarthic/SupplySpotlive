/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('invoices', function(table) {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.string('invoice_number').notNullable().unique();
    table.uuid('vendor_id').references('id').inTable('vendors').notNullable();
    table.decimal('amount', 15, 2).notNullable();
    table.decimal('tax_amount', 15, 2).defaultTo(0);
    table.decimal('net_amount', 15, 2).notNullable();
    table.date('due_date').notNullable();
    table.date('issue_date').notNullable();
    table.date('payment_date');
    table.string('status').defaultTo('draft');
    table.string('description');
    table.string('category');
    table.string('submission_method');
    table.string('po_number');
    table.string('grn_number');
    table.string('matching_status');
    table.integer('ocr_confidence');
    table.boolean('extracted_data').defaultTo(false);
    table.jsonb('line_items');
    table.uuid('approved_by').references('id').inTable('users');
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
    table.timestamps(true, true);
    
    // Indexes
    table.index(['invoice_number']);
    table.index(['vendor_id']);
    table.index(['status']);
    table.index(['due_date']);
    table.index(['po_number']);
    table.index(['created_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('invoices');
};
