/**
 * Indexes for the finance dashboard's date-range queries. PO vendor_id and invoice status are already indexed
 * (migrations 008 and 003); this adds the date and ownership columns the dashboard filters on.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.alterTable('invoice_payments', function(table) {
    table.index(['payment_date']);
  });
  await knex.schema.alterTable('invoices', function(table) {
    table.index(['issue_date']);
  });
  await knex.schema.alterTable('purchase_orders', function(table) {
    table.index(['issue_date']);
    table.index(['created_by']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable('purchase_orders', function(table) {
    table.dropIndex(['issue_date']);
    table.dropIndex(['created_by']);
  });
  await knex.schema.alterTable('invoices', function(table) {
    table.dropIndex(['issue_date']);
  });
  await knex.schema.alterTable('invoice_payments', function(table) {
    table.dropIndex(['payment_date']);
  });
};
