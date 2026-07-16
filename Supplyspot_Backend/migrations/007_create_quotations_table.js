/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('quotations', function(table) {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.string('quotation_number').notNullable().unique();
    table.uuid('rfq_id').references('id').inTable('rfqs').onDelete('CASCADE');
    table.uuid('vendor_id').references('id').inTable('vendors').notNullable();
    table.decimal('total_amount', 15, 2).notNullable();
    table.string('currency').defaultTo('USD');
    table.date('submitted_date');
    table.date('valid_until');
    table.string('status').defaultTo('submitted');
    table.jsonb('line_items');
    table.text('notes');
    table.jsonb('attachments');
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
    table.timestamps(true, true);
    
    // Indexes
    table.index(['quotation_number']);
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
  return knex.schema.dropTable('quotations');
};
