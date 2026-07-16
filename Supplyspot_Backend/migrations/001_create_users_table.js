/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.string('email').unique().notNullable();
    table.string('password_hash').notNullable();
    table.string('name').notNullable();
    table.string('role').notNullable().defaultTo('viewer');
    table.string('department');
    table.string('phone');
    table.string('avatar_url');
    table.boolean('is_active').defaultTo(true);
    table.boolean('email_verified').defaultTo(false);
    table.timestamp('email_verified_at');
    table.timestamp('last_login');
    table.timestamp('password_changed_at').defaultTo(knex.fn.now());
    table.timestamps(true, true);
    
    // Indexes
    table.index(['email']);
    table.index(['role']);
    table.index(['is_active']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('users');
};
