/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('rfqs', function(table) {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.string('rfq_number').notNullable().unique();
    table.string('title').notNullable();
    table.text('description');
    table.string('category');
    table.decimal('budget', 15, 2);
    table.string('currency').defaultTo('USD');
    table.date('issued_date');
    table.date('due_date');
    table.string('status').defaultTo('open');
    table.string('priority').defaultTo('medium');
    table.uuid('awarded_vendor_id').references('id').inTable('vendors').nullable();
    table.decimal('awarded_amount', 15, 2).nullable();
    table.jsonb('attachments');
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
    table.timestamps(true, true);
    
    // Indexes
    table.index(['rfq_number']);
    table.index(['status']);
    table.index(['due_date']);
    table.index(['awarded_vendor_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('rfqs');
};
