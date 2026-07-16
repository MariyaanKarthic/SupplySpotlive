/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('disputes', function(table) {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.string('dispute_number').notNullable().unique();
    table.string('title').notNullable();
    table.text('description').notNullable();
    table.string('category').notNullable();
    table.string('priority').defaultTo('medium');
    table.string('status').defaultTo('submitted');
    table.jsonb('submitted_by').notNullable();
    table.jsonb('assigned_to');
    table.jsonb('related_documents');
    table.jsonb('sla_details');
    table.jsonb('tags');
    table.text('resolution_details');
    table.timestamp('resolved_at');
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
    table.timestamps(true, true);
    
    // Indexes
    table.index(['dispute_number']);
    table.index(['status']);
    table.index(['category']);
    table.index(['priority']);
    table.index(['created_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('disputes');
};
