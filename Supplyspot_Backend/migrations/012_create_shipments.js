/**
 * Shipment tracking: one PO can ship in several shipments (back-orders, split deliveries).
 * Each shipment keeps its lines (which PO line, how much shipped, how much received so far), a log of
 * tracking events entered by the buyer, and one goods receipt note (GRN) per delivery received.
 *
 * Shipment statuses: pending (awaiting dispatch) → in_transit → delayed | delivered | partially_received; cancelled.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable('shipments', function(table) {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.string('shipment_number').notNullable().unique();
    table.uuid('po_id').references('id').inTable('purchase_orders').notNullable();
    table.uuid('vendor_id').references('id').inTable('vendors').notNullable();
    table.string('status').notNullable().defaultTo('pending');
    table.date('expected_delivery_date');
    table.date('actual_delivery_date').nullable();
    table.date('shipped_date').nullable();
    table.string('carrier_name');
    table.string('tracking_number');
    table.text('origin_address');
    table.text('destination_address');
    table.jsonb('items'); // [{ poLineIndex, description, quantity, receivedQuantity }]
    table.decimal('shipped_quantity', 15, 3).notNullable().defaultTo(0);
    table.decimal('received_quantity', 15, 3).notNullable().defaultTo(0);
    table.text('notes');
    table.text('cancel_reason');
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
    table.timestamps(true, true);

    table.index(['po_id']);
    table.index(['vendor_id']);
    table.index(['status']);
  });

  await knex.schema.createTable('delivery_tracking', function(table) {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('shipment_id').references('id').inTable('shipments').onDelete('CASCADE').notNullable();
    table.string('status_event').notNullable(); // picked_up, in_transit, out_for_delivery, delivered, exception
    table.timestamp('event_date').notNullable();
    table.string('location');
    table.decimal('temperature', 6, 2).nullable();
    table.text('notes');
    table.uuid('created_by').references('id').inTable('users');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['shipment_id']);
  });

  await knex.schema.createTable('shipment_receipts', function(table) {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.string('grn_number').notNullable().unique();
    table.uuid('shipment_id').references('id').inTable('shipments').onDelete('CASCADE').notNullable();
    table.uuid('po_id').references('id').inTable('purchase_orders').notNullable();
    table.date('received_date').notNullable();
    table.jsonb('items'); // [{ poLineIndex, description, shippedQuantity, receivedQuantity, shortQuantity, reason }]
    table.boolean('is_final').notNullable().defaultTo(false);
    table.boolean('applied_to_po').notNullable().defaultTo(false);
    table.text('notes');
    table.uuid('received_by').references('id').inTable('users');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['shipment_id']);
    table.index(['po_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('shipment_receipts');
  await knex.schema.dropTableIfExists('delivery_tracking');
  await knex.schema.dropTableIfExists('shipments');
};
