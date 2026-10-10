/**
 * RFQ and quotation workflow: links RFQs to purchase requests, stores the RFQ's items and invited vendors,
 * adds the quotation fields buyers compare on, and moves quotation lines into their own table.
 *
 * RFQ lifecycle: draft → sent → quotations_received → under_review → awarded → closed (closed can also end an RFQ early).
 * Quotation statuses: submitted → reviewed → accepted | rejected (rejected ones can be archived).
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.alterTable('rfqs', function(table) {
    table.uuid('purchase_request_id').references('id').inTable('purchase_requests').nullable();
    table.jsonb('items');
    table.jsonb('vendor_ids');
    table.text('notes');
    table.timestamp('sent_at').nullable();
    table.uuid('awarded_quotation_id').nullable();
    table.timestamp('awarded_at').nullable();
    table.timestamp('closed_at').nullable();
    table.text('close_reason');
    table.jsonb('history');

    table.index(['purchase_request_id']);
  });

  await knex.schema.alterTable('quotations', function(table) {
    table.date('delivery_date');
    table.string('payment_terms');
    table.timestamp('submitted_at').nullable();
    table.timestamp('reviewed_at').nullable();
    table.timestamp('decided_at').nullable();
    table.text('rejection_reason');
    table.timestamp('archived_at').nullable();
    table.uuid('purchase_order_id').references('id').inTable('purchase_orders').nullable();
  });

  await knex.schema.createTable('quotation_items', function(table) {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('quotation_id').references('id').inTable('quotations').onDelete('CASCADE').notNullable();
    table.integer('rfq_item_index').nullable(); // which RFQ line this prices; null for extras such as freight
    table.integer('position').notNullable().defaultTo(0);
    table.string('description').notNullable();
    table.decimal('quantity', 15, 3).notNullable().defaultTo(0);
    table.string('unit');
    table.decimal('unit_price', 15, 2).notNullable().defaultTo(0);
    table.decimal('total_price', 15, 2).notNullable().defaultTo(0);
    table.timestamps(true, true);

    table.index(['quotation_id']);
  });

  // Old RFQ statuses map onto the new lifecycle.
  await knex('rfqs').where('status', 'open').update({ status: 'sent' });
  await knex('rfqs').where('status', 'cancelled').update({ status: 'closed' });

  // RFQs created from a purchase request before this migration only kept the request in their description.
  const prs = await knex('purchase_requests').whereNotNull('rfq_id').select('id', 'rfq_id', 'items');
  for (const pr of prs) {
    const items = typeof pr.items === 'string' ? JSON.parse(pr.items || '[]') : (pr.items || []);
    await knex('rfqs').where('id', pr.rfq_id).whereNull('purchase_request_id')
      .update({ purchase_request_id: pr.id, items: JSON.stringify(items) });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('quotation_items');
  await knex.schema.alterTable('quotations', function(table) {
    table.dropColumn('delivery_date');
    table.dropColumn('payment_terms');
    table.dropColumn('submitted_at');
    table.dropColumn('reviewed_at');
    table.dropColumn('decided_at');
    table.dropColumn('rejection_reason');
    table.dropColumn('archived_at');
    table.dropColumn('purchase_order_id');
  });
  await knex.schema.alterTable('rfqs', function(table) {
    table.dropIndex(['purchase_request_id']);
    table.dropColumn('purchase_request_id');
    table.dropColumn('items');
    table.dropColumn('vendor_ids');
    table.dropColumn('notes');
    table.dropColumn('sent_at');
    table.dropColumn('awarded_quotation_id');
    table.dropColumn('awarded_at');
    table.dropColumn('closed_at');
    table.dropColumn('close_reason');
    table.dropColumn('history');
  });
  await knex('rfqs').whereIn('status', ['sent', 'quotations_received', 'under_review']).update({ status: 'open' });
};
