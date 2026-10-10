/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('purchase_requests', function(table) {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.string('pr_number').notNullable().unique();
    table.string('title').notNullable();
    table.string('status').notNullable().defaultTo('draft');
    table.uuid('requester_id').references('id').inTable('users').notNullable();
    table.string('department');
    table.date('requested_date');
    table.string('priority').defaultTo('medium');
    table.string('currency').defaultTo('INR');
    table.decimal('budget_total', 15, 2).notNullable().defaultTo(0);
    table.jsonb('items');
    table.text('notes');
    table.timestamp('submitted_at').nullable();
    table.timestamp('approval_date').nullable();
    table.uuid('approver_id').references('id').inTable('users').nullable();
    table.text('rejection_reason');
    table.uuid('rfq_id').references('id').inTable('rfqs').nullable();
    table.jsonb('history');
    table.uuid('updated_by').references('id').inTable('users');
    table.timestamps(true, true);

    // Indexes
    table.index(['status']);
    table.index(['department']);
    table.index(['requester_id']);
    table.index(['rfq_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('purchase_requests');
};
