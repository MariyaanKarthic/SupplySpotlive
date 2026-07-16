/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('vendors', function(table) {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.string('name').notNullable();
    table.string('category').notNullable();
    table.string('tax_id');
    table.string('registration_number');
    table.string('website');
    table.string('description');
    table.string('status').defaultTo('under_review');
    table.decimal('total_spend', 15, 2).defaultTo(0);
    table.decimal('rating', 3, 2).defaultTo(0);
    table.integer('contracts_count').defaultTo(0);
    table.date('onboard_date');
    table.jsonb('contact_info');
    table.jsonb('bank_details');
    table.jsonb('compliance_info');
    table.boolean('is_active').defaultTo(true);
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
    table.timestamps(true, true);
    
    // Indexes
    table.index(['name']);
    table.index(['category']);
    table.index(['status']);
    table.index(['is_active']);
    table.index(['created_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('vendors');
};
