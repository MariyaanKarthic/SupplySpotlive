// Shared shipment logic: numbering, creating a shipment from a PO, list enrichment and posting receipts back to the PO.
const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/database');
const { delByPrefix } = require('../config/redis');

const STATUSES = ['pending', 'in_transit', 'delayed', 'delivered', 'partially_received', 'cancelled'];
const TRACKING_EVENTS = ['picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'exception'];
// Shipments whose goods are still on the way; these are the ones that can run late.
const MOVING_STATUSES = ['pending', 'in_transit', 'delayed'];
// PO statuses that can still have goods shipped and received against them.
const SHIPPABLE_PO_STATUSES = ['sent', 'acknowledged', 'partially_received'];

const parseJson = (value, fallback = []) => {
  if (typeof value !== 'string') return value || fallback;
  try { return JSON.parse(value || 'null') || fallback; } catch { return fallback; }
};
const round3 = (n) => Math.round(Number(n) * 1000) / 1000;
const today = () => new Date().toISOString().split('T')[0];
const toDate = (value) => {
  if (!value) return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(typeof value === 'string' && value.length === 19 ? `${value.replace(' ', 'T')}Z` : value);
  return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
};
// SQLite hands timestamps back as "YYYY-MM-DD HH:MM:SS" (UTC) or epoch ms; the API always returns ISO strings.
const toIso = (value) => {
  if (!value) return null;
  const d = new Date(typeof value === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value) ? `${value.replace(' ', 'T')}Z` : value);
  return isNaN(d.getTime()) ? null : d.toISOString();
};
const daysBetween = (from, to) => Math.round((new Date(`${to}T00:00:00Z`) - new Date(`${from}T00:00:00Z`)) / 86400000);

const clearPoCache = () => delByPrefix('purchase_orders:');

async function nextNumber(table, column, prefix) {
  const full = `${prefix}-${new Date().getFullYear()}-`;
  const rows = await db(table).where(column, 'like', `${full}%`).select(column);
  const max = rows.reduce((acc, r) => Math.max(acc, parseInt(r[column].slice(full.length), 10) || 0), 0);
  return `${full}${String(max + 1).padStart(4, '0')}`;
}
const nextShipmentNumber = () => nextNumber('shipments', 'shipment_number', 'SHIP');
const nextGrnNumber = () => nextNumber('shipment_receipts', 'grn_number', 'GRN');

const isOverdue = (s) =>
  MOVING_STATUSES.includes(s.status) && !s.actual_delivery_date && !!s.expected_delivery_date && toDate(s.expected_delivery_date) < today();

function vendorAddress(vendor) {
  const contact = parseJson(vendor?.contact_info, {});
  return contact?.address || null;
}

// How much of each PO line is not yet received and not already on its way in another open shipment.
async function remainingByLine(po, excludeShipmentId = null) {
  const lines = parseJson(po.line_items);
  const open = await db('shipments').where('po_id', po.id).whereNot('status', 'cancelled')
    .modify((q) => { if (excludeShipmentId) q.whereNot('id', excludeShipmentId); });
  // A final receipt closes a shipment; whatever it came up short is no longer on its way.
  const closed = new Set((await db('shipment_receipts').whereIn('shipment_id', open.map((s) => s.id)).where('is_final', true)
    .select('shipment_id')).map((r) => r.shipment_id));
  const inFlight = {};
  for (const s of open.filter((x) => !closed.has(x.id))) {
    for (const it of parseJson(s.items)) {
      inFlight[it.poLineIndex] = (inFlight[it.poLineIndex] || 0) + Math.max(0, Number(it.quantity) - Number(it.receivedQuantity || 0));
    }
  }
  return lines.map((li, index) => ({
    poLineIndex: index,
    description: li.description,
    ordered: Number(li.quantity) || 0,
    remaining: round3(Math.max(0, (Number(li.quantity) || 0) - (Number(li.receivedQuantity) || 0) - (inFlight[index] || 0))),
  }));
}

const totals = (items) => ({
  shipped_quantity: round3(items.reduce((a, it) => a + Number(it.quantity || 0), 0)),
  received_quantity: round3(items.reduce((a, it) => a + Number(it.receivedQuantity || 0), 0)),
});

/**
 * Creates a shipment for a PO. `items` ([{ poLineIndex, quantity }]) picks what ships; omitted, everything still
 * outstanding on the PO ships. Throws { status, message } for problems the caller should report.
 */
async function createFromPO(po, user, input = {}) {
  if (!SHIPPABLE_PO_STATUSES.includes(po.status)) {
    throw { status: 409, message: `Shipments can only be created for POs that are sent, acknowledged or partially received (this one is "${po.status}")` };
  }
  const remaining = await remainingByLine(po);
  let items;
  if (Array.isArray(input.items) && input.items.length) {
    items = [];
    for (const entry of input.items) {
      const line = remaining.find((r) => r.poLineIndex === Number(entry.poLineIndex));
      const qty = round3(Number(entry.quantity) || 0);
      if (!line) throw { status: 400, message: `PO line ${Number(entry.poLineIndex) + 1} does not exist` };
      if (qty <= 0) continue;
      if (qty > line.remaining) throw { status: 400, message: `Only ${line.remaining} of "${line.description}" is left to ship` };
      items.push({ poLineIndex: line.poLineIndex, description: line.description, quantity: qty, receivedQuantity: 0 });
    }
  } else {
    items = remaining.filter((r) => r.remaining > 0)
      .map((r) => ({ poLineIndex: r.poLineIndex, description: r.description, quantity: r.remaining, receivedQuantity: 0 }));
  }
  if (!items.length) throw { status: 409, message: 'Nothing left to ship on this PO: every line is received or already on an open shipment' };

  const vendor = await db('vendors').where('id', po.vendor_id).first();
  const status = input.shippedDate ? 'in_transit' : 'pending';
  const data = {
    id: uuidv4(),
    shipment_number: await nextShipmentNumber(),
    po_id: po.id,
    vendor_id: po.vendor_id,
    status,
    expected_delivery_date: input.expectedDeliveryDate || toDate(po.expected_delivery_date),
    shipped_date: input.shippedDate || null,
    carrier_name: input.carrierName || null,
    tracking_number: input.trackingNumber || null,
    origin_address: input.originAddress || vendorAddress(vendor),
    destination_address: input.destinationAddress || po.delivery_address || null,
    items: JSON.stringify(items),
    ...totals(items),
    notes: input.notes || null,
    created_by: user.id,
    updated_by: user.id,
  };
  await db('shipments').insert(data);
  return db('shipments').where('id', data.id).first();
}

async function enrichShipments(shipments, { withLatestEvent = true } = {}) {
  if (!shipments.length) return [];
  const ids = shipments.map((s) => s.id);
  const pos = await db('purchase_orders').whereIn('id', [...new Set(shipments.map((s) => s.po_id))])
    .select('id', 'po_number', 'status', 'currency');
  const vendors = await db('vendors').whereIn('id', [...new Set(shipments.map((s) => s.vendor_id))]).select('id', 'name');
  const poMap = Object.fromEntries(pos.map((p) => [p.id, p]));
  const vendorMap = Object.fromEntries(vendors.map((v) => [v.id, v.name]));
  let latest = {};
  let receiptCounts = {};
  if (withLatestEvent) {
    const events = await db('delivery_tracking').whereIn('shipment_id', ids).orderBy('event_date', 'asc');
    for (const e of events) latest[e.shipment_id] = e;
    const counts = await db('shipment_receipts').whereIn('shipment_id', ids).select('shipment_id').count('id as n').groupBy('shipment_id');
    receiptCounts = Object.fromEntries(counts.map((c) => [c.shipment_id, Number(c.n)]));
  }
  return shipments.map((s) => {
    const expected = toDate(s.expected_delivery_date);
    const actual = toDate(s.actual_delivery_date);
    const ev = latest[s.id];
    return {
      ...s,
      expected_delivery_date: expected,
      actual_delivery_date: actual,
      shipped_date: toDate(s.shipped_date),
      shipped_quantity: Number(s.shipped_quantity) || 0,
      received_quantity: Number(s.received_quantity) || 0,
      items: parseJson(s.items),
      po_number: poMap[s.po_id]?.po_number || null,
      po_status: poMap[s.po_id]?.status || null,
      vendor_name: vendorMap[s.vendor_id] || 'Unknown',
      is_overdue: isOverdue(s),
      // Positive = days late (or days overdue while still moving); negative = early.
      delay_days: expected ? (actual ? daysBetween(expected, actual) : isOverdue(s) ? daysBetween(expected, today()) : null) : null,
      latest_event: ev ? { status_event: ev.status_event, event_date: toIso(ev.event_date), location: ev.location } : null,
      receipt_count: receiptCounts[s.id] || 0,
      created_at: toIso(s.created_at),
      updated_at: toIso(s.updated_at),
    };
  });
}

const mapEvent = (e) => ({
  ...e,
  event_date: toIso(e.event_date),
  created_at: toIso(e.created_at),
  temperature: e.temperature === null || e.temperature === undefined ? null : Number(e.temperature),
});
const mapReceipt = (r) => ({
  ...r,
  received_date: toDate(r.received_date),
  items: parseJson(r.items),
  is_final: !!r.is_final,
  applied_to_po: !!r.applied_to_po,
  created_at: toIso(r.created_at),
});

/**
 * Adds received quantities to the PO's lines (cumulative) and moves the PO to partially_received / received.
 * Returns false when the PO is no longer in a state that takes receipts.
 */
async function applyReceiptToPO(trx, poId, receivedByLine, userId) {
  const po = await trx('purchase_orders').where('id', poId).first();
  if (!po || !SHIPPABLE_PO_STATUSES.includes(po.status)) return false;
  const lines = parseJson(po.line_items);
  lines.forEach((li, index) => {
    const add = Number(receivedByLine[index] || 0);
    if (add > 0) li.receivedQuantity = round3(Math.min(Number(li.quantity) || 0, (Number(li.receivedQuantity) || 0) + add));
  });
  const all = lines.length > 0 && lines.every((li) => (Number(li.receivedQuantity) || 0) >= (Number(li.quantity) || 0));
  const any = lines.some((li) => (Number(li.receivedQuantity) || 0) > 0);
  const status = all ? 'received' : any ? 'partially_received' : po.status;
  await trx('purchase_orders').where('id', poId)
    .update({ line_items: JSON.stringify(lines), status, updated_by: userId, updated_at: trx.fn.now() });
  return true;
}

module.exports = {
  STATUSES,
  TRACKING_EVENTS,
  MOVING_STATUSES,
  SHIPPABLE_PO_STATUSES,
  parseJson,
  round3,
  today,
  toDate,
  toIso,
  daysBetween,
  clearPoCache,
  nextGrnNumber,
  isOverdue,
  remainingByLine,
  totals,
  createFromPO,
  enrichShipments,
  mapEvent,
  mapReceipt,
  applyReceiptToPO,
};
