/**
 * Reports dashboard: indexes for the date-range queries the reports run, plus a table for
 * "email this report" preferences (stored only; no mail is sent yet).
 *
 * Already indexed elsewhere: PO vendor_id/status/issue_date/created_by (008, 014), invoice
 * status/due_date/issue_date (003, 014), shipment po_id/vendor_id/status (012),
 * purchase request status/department/requester_id (010).
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.alterTable('shipments', function(table) {
    table.index(['expected_delivery_date']);
  });
  await knex.schema.alterTable('purchase_requests', function(table) {
    table.index(['submitted_at']);
    table.index(['created_at']);
  });
  await knex.schema.alterTable('purchase_orders', function(table) {
    table.index(['created_at']);
  });

  await knex.schema.createTable('report_schedules', function(table) {
    table.uuid('id').primary();
    table.uuid('user_id').notNullable();
    table.string('report_type', 40).notNullable();
    table.string('frequency', 20).notNullable().defaultTo('weekly'); // weekly | monthly
    table.string('format', 10).notNullable().defaultTo('pdf'); // csv | pdf
    table.string('email', 255).notNullable();
    table.json('filters'); // { period, department }
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.unique(['user_id', 'report_type']);
    table.index(['user_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('report_schedules');
  await knex.schema.alterTable('purchase_orders', function(table) {
    table.dropIndex(['created_at']);
  });
  await knex.schema.alterTable('purchase_requests', function(table) {
    table.dropIndex(['submitted_at']);
    table.dropIndex(['created_at']);
  });
  await knex.schema.alterTable('shipments', function(table) {
    table.dropIndex(['expected_delivery_date']);
  });
};
