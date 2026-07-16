/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('purchase_orders', function(table) {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.string('po_number').notNullable().unique();
    table.uuid('rfq_id').references('id').inTable('rfqs').nullable();
    table.uuid('vendor_id').references('id').inTable('vendors').notNullable();
    table.decimal('total_amount', 15, 2).notNullable();
    table.string('currency').defaultTo('USD');
    table.string('status').defaultTo('new');
    table.string('priority').defaultTo('medium');
    table.string('acknowledgment_status').defaultTo('pending');
    table.date('acknowledgment_date').nullable();
    table.date('issue_date');
    table.date('expected_delivery_date');
    table.text('delivery_address');
    table.string('terms');
    table.text('notes');
    table.jsonb('line_items');
    table.jsonb('attachments');
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
    table.timestamps(true, true);
    
    // Indexes
    table.index(['po_number']);
    table.index(['rfq_id']);
    table.index(['vendor_id']);
    table.index(['status']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('purchase_orders');
};
