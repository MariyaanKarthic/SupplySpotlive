/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('invites', function(table) {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.string('invite_code').unique().notNullable();
    table.string('email').nullable();
    table.string('role').notNullable().defaultTo('vendor');
    table.string('status').notNullable().defaultTo('active'); // active, used, expired
    table.integer('max_uses').defaultTo(1);
    table.integer('times_used').defaultTo(0);
    table.timestamp('expires_at').nullable();
    table.timestamp('used_at').nullable();
    table.uuid('used_by').references('id').inTable('users').nullable();
    table.uuid('created_by').notNullable().references('id').inTable('users');
    table.text('notes').nullable();
    table.timestamps(true, true);
    
    // Indexes
    table.index(['invite_code']);
    table.index(['email']);
    table.index(['status']);
    table.index(['expires_at']);
    table.index(['created_by']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('invites');
};
