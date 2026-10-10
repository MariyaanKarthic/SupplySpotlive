/**
 * Sample shipments against the sample POs (seed 006 / .claude/seed_pos.py and 008): in transit, awaiting dispatch,
 * delayed, partially received, and delivered both on time and late, with tracking events and GRNs.
 * Purchase orders are not changed; receipts are written to match what the POs already show as received.
 * Dates are relative to the day the seed runs. Run it on its own:
 *   npx knex seed:run --specific=009_shipments.js
 * Re-running it replaces every shipment, tracking event and GRN.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const { v4: uuidv4 } = require('uuid');

const DAY = 86400000;
const dateIn = (days) => new Date(Date.now() + days * DAY).toISOString().split('T')[0];
const at = (days, hour) => {
  const d = new Date(Date.now() + days * DAY);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
};
const parse = (v, fallback = []) => (typeof v === 'string' ? JSON.parse(v || 'null') || fallback : (v || fallback));

exports.seed = async function(knex) {
  const admin = await knex('users').where('role', 'admin').first();
  if (!admin) throw new Error('Seed users first (001_users.js)');

  await knex('shipment_receipts').del();
  await knex('delivery_tracking').del();
  await knex('shipments').del();

  const year = new Date().getFullYear();
  let shipSeq = 0;
  let grnSeq = 0;

  async function shipment(poNumber, opts) {
    const po = await knex('purchase_orders').where('po_number', poNumber).first();
    if (!po) {
      console.warn(`Skipping shipment for ${poNumber}: PO not found`);
      return;
    }
    const vendor = await knex('vendors').where('id', po.vendor_id).first();
    const lines = parse(po.line_items);
    const items = lines.map((li, i) => ({
      poLineIndex: i,
      description: li.description,
      quantity: Number(li.quantity),
      receivedQuantity: opts.received ? Number(opts.received[i] || 0) : 0,
    }));
    const id = uuidv4();
    await knex('shipments').insert({
      id,
      shipment_number: `SHIP-${year}-${String(++shipSeq).padStart(4, '0')}`,
      po_id: po.id,
      vendor_id: po.vendor_id,
      status: opts.status,
      expected_delivery_date: opts.expected,
      actual_delivery_date: opts.actual || null,
      shipped_date: opts.shipped || null,
      carrier_name: opts.carrier || null,
      tracking_number: opts.tracking || null,
      origin_address: parse(vendor?.contact_info, {}).address || null,
      destination_address: po.delivery_address,
      items: JSON.stringify(items),
      shipped_quantity: items.reduce((a, it) => a + it.quantity, 0),
      received_quantity: items.reduce((a, it) => a + it.receivedQuantity, 0),
      notes: opts.notes || null,
      created_by: admin.id,
      updated_by: admin.id,
      created_at: (opts.created || at(-10, 9)).replace('T', ' ').slice(0, 19),
      updated_at: (opts.updated || at(-1, 9)).replace('T', ' ').slice(0, 19),
    });
    for (const [event, daysAgo, hour, location, notes, temperature] of opts.events || []) {
      await knex('delivery_tracking').insert({
        id: uuidv4(),
        shipment_id: id,
        status_event: event,
        event_date: at(-daysAgo, hour),
        location,
        temperature: temperature ?? null,
        notes: notes || null,
        created_by: admin.id,
        created_at: at(-daysAgo, hour + 1),
      });
    }
    for (const r of opts.receipts || []) {
      await knex('shipment_receipts').insert({
        id: uuidv4(),
        grn_number: `GRN-${year}-${String(++grnSeq).padStart(4, '0')}`,
        shipment_id: id,
        po_id: po.id,
        received_date: r.date,
        items: JSON.stringify(items.map((it, i) => ({
          poLineIndex: i,
          description: it.description,
          shippedQuantity: it.quantity,
          previouslyReceived: 0,
          receivedQuantity: r.qty[i] || 0,
          shortQuantity: it.quantity - (r.qty[i] || 0),
          reason: r.reasons?.[i] || null,
        }))),
        is_final: !!r.final,
        applied_to_po: true,
        notes: r.notes || null,
        received_by: admin.id,
        created_at: `${r.date}T11:30:00.000Z`,
      });
    }
  }

  // Delivered on time, full receipt.
  const po5 = await knex('purchase_orders').where('po_number', 'PO-2026-0005').first();
  const po5Qty = po5 ? parse(po5.line_items).map((li) => Number(li.quantity)) : [];
  await shipment('PO-2026-0005', {
    status: 'delivered', expected: dateIn(-16), shipped: dateIn(-21), actual: dateIn(-17),
    carrier: 'Blue Dart', tracking: 'BD7823410056IN', received: po5Qty, created: at(-23, 9),
    events: [
      ['picked_up', 21, 8, 'Vendor warehouse'],
      ['in_transit', 19, 14, 'Pune hub'],
      ['out_for_delivery', 17, 6, 'Bhiwandi delivery centre'],
      ['delivered', 17, 12, 'Receiving dock 2', 'Signed by stores'],
    ],
    receipts: [{ date: dateIn(-17), qty: po5Qty, final: true, notes: 'All cartons intact.' }],
  });

  // Delivered three days late.
  const po8 = await knex('purchase_orders').where('po_number', 'PO-2026-0008').first();
  const po8Qty = po8 ? parse(po8.line_items).map((li) => Number(li.quantity)) : [];
  await shipment('PO-2026-0008', {
    status: 'delivered', expected: dateIn(-19), shipped: dateIn(-25), actual: dateIn(-16),
    carrier: 'Gati', tracking: 'GATI-55120983', received: po8Qty, created: at(-27, 9),
    events: [
      ['picked_up', 25, 9, 'Vendor warehouse'],
      ['in_transit', 23, 15, 'Hyderabad transit hub'],
      ['exception', 20, 10, 'Solapur', 'Truck breakdown, cargo moved to another vehicle'],
      ['in_transit', 18, 16, 'Pune hub'],
      ['delivered', 16, 11, 'Receiving dock 1'],
    ],
    receipts: [{ date: dateIn(-16), qty: po8Qty, final: true }],
  });

  // Partially received: the steel plate arrived, enclosures and fabric are still to come.
  await shipment('PO-2026-0007', {
    status: 'partially_received', expected: dateIn(-14), shipped: dateIn(-18),
    carrier: 'Delhivery', tracking: 'DLV1190023887', received: [0, 1, 0], created: at(-19, 9),
    events: [
      ['picked_up', 18, 9, 'Vendor warehouse'],
      ['in_transit', 16, 13, 'Nashik hub'],
      ['delivered', 14, 11, 'Receiving dock 1', 'Part load: 1 of 3 consignments'],
    ],
    receipts: [{
      date: dateIn(-14), qty: [0, 1, 0], notes: 'Vendor confirmed the rest ships next week.',
      reasons: ['Back-ordered at vendor', null, 'Back-ordered at vendor'],
    }],
  });

  // Delayed: past its expected date and held up in transit.
  await shipment('PO-2026-0013', {
    status: 'delayed', expected: dateIn(-5), shipped: dateIn(-9),
    carrier: 'VRL Logistics', tracking: 'VRL-30027719', created: at(-10, 9),
    events: [
      ['picked_up', 9, 10, 'Vendor warehouse'],
      ['in_transit', 7, 18, 'Nagpur hub'],
      ['exception', 5, 9, 'Nagpur hub', 'Held at hub: road closure on NH-53'],
    ],
  });

  // In transit, due in 12 days (USD import).
  await shipment('PO-2026-0017', {
    status: 'in_transit', expected: dateIn(12), shipped: dateIn(-2),
    carrier: 'DHL Express', tracking: '1Z4598720394', created: at(-3, 9),
    events: [
      ['picked_up', 2, 7, 'Shenzhen, CN'],
      ['in_transit', 1, 20, 'Hong Kong air hub'],
    ],
  });

  // In transit and out for delivery today.
  await shipment('PO-2026-0014', {
    status: 'in_transit', expected: dateIn(1), shipped: dateIn(-3),
    carrier: 'Safexpress', tracking: 'SFX-7712093', created: at(-4, 9),
    events: [
      ['picked_up', 3, 9, 'Vendor warehouse'],
      ['in_transit', 2, 15, 'Thane transit hub'],
      ['out_for_delivery', 0, 6, 'Bhiwandi delivery centre'],
    ],
  });

  // Temperature-controlled consignment with readings at each scan.
  await shipment('PO-2026-0011', {
    status: 'in_transit', expected: dateIn(2), shipped: dateIn(-2),
    carrier: 'Snowman Logistics', tracking: 'SNW-0099213', notes: 'Keep between 2 and 8 °C.', created: at(-3, 9),
    events: [
      ['picked_up', 2, 8, 'Vendor cold store', null, 4.5],
      ['in_transit', 1, 12, 'Vadodara reefer yard', null, 5.1],
      ['in_transit', 0, 5, 'Surat checkpoint', 'Reefer unit checked', 4.8],
    ],
  });

  // Just sent to the vendor; waiting for dispatch.
  await shipment('PO-2026-0018', {
    status: 'pending', expected: dateIn(10), created: at(-1, 9),
  });
};
