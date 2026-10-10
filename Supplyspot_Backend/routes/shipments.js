const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { authenticate, authorize } = require('../middleware/auth');
const { db } = require('../config/database');
const logger = require('../config/logger');
const {
  STATUSES, TRACKING_EVENTS, MOVING_STATUSES, parseJson, round3, today, toDate, clearPoCache, nextGrnNumber,
  remainingByLine, totals, createFromPO, enrichShipments, mapEvent, mapReceipt, applyReceiptToPO,
} = require('../services/shipments');

const router = express.Router();

const READ_ROLES = ['admin', 'procurement_manager', 'finance_manager', 'ap_clerk', 'viewer'];
const WRITE_ROLES = ['admin', 'procurement_manager'];
const RECEIVE_ROLES = ['admin', 'procurement_manager', 'ap_clerk'];

const handle = (label, fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    if (error && error.status && error.message) return res.status(error.status).json({ success: false, error: error.message });
    logger.error(`${label} error:`, error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const invalid = (req, res) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return false;
  res.status(400).json({ success: false, error: errors.array()[0].msg, details: errors.array() });
  return true;
};

async function loadDetail(id) {
  const shipment = await db('shipments').where('id', id).first();
  if (!shipment) return null;
  const [enriched] = await enrichShipments([shipment]);
  const events = await db('delivery_tracking').where('shipment_id', id).orderBy('event_date', 'asc').orderBy('created_at', 'asc');
  const receipts = await db('shipment_receipts').where('shipment_id', id).orderBy('created_at', 'asc');
  const po = await db('purchase_orders').where('id', shipment.po_id).first();
  const others = await db('shipments').where('po_id', shipment.po_id).whereNot('id', id).select('id', 'shipment_number', 'status');
  return {
    ...enriched,
    events: events.map(mapEvent),
    receipts: receipts.map(mapReceipt),
    is_closed: shipment.status === 'cancelled' || receipts.some((r) => r.is_final)
      || parseJson(shipment.items).every((it) => Number(it.receivedQuantity) >= Number(it.quantity)),
    po: po && {
      id: po.id,
      po_number: po.po_number,
      status: po.status,
      currency: po.currency,
      issue_date: toDate(po.issue_date),
      expected_delivery_date: toDate(po.expected_delivery_date),
      line_items: parseJson(po.line_items),
    },
    other_shipments: others,
  };
}

const sendDetail = async (res, id, status = 200, extra = {}) =>
  res.status(status).json({ success: true, data: { ...(await loadDetail(id)), ...extra } });

// GET /shipments/stats — counts per card plus delivery performance; ?vendor_id= narrows to one vendor
router.get('/stats', [authenticate, authorize(...READ_ROLES)], handle('Shipment stats', async (req, res) => {
  let q = db('shipments');
  if (req.query.vendor_id) q = q.where('vendor_id', req.query.vendor_id);
  const rows = await enrichShipments(await q.select('*'), { withLatestEvent: false });

  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  rows.forEach((s) => { counts[s.status] = (counts[s.status] || 0) + 1; });
  const overdue = rows.filter((s) => s.is_overdue);
  const completed = rows.filter((s) => s.status === 'delivered' && s.actual_delivery_date && s.expected_delivery_date);
  const onTime = completed.filter((s) => s.actual_delivery_date <= s.expected_delivery_date);
  const late = completed.filter((s) => s.actual_delivery_date > s.expected_delivery_date);
  res.json({
    success: true,
    data: {
      total: rows.length,
      counts,
      // "Delayed" covers shipments flagged by an exception and those simply past their expected date.
      delayed: rows.filter((s) => s.status === 'delayed' || s.is_overdue).length,
      overdue: overdue.length,
      inTransit: rows.filter((s) => ['pending', 'in_transit'].includes(s.status) && !s.is_overdue).length,
      completed: completed.length,
      onTime: onTime.length,
      onTimeRate: completed.length ? Math.round((onTime.length / completed.length) * 100) : null,
      avgDelayDays: late.length ? round3(late.reduce((a, s) => a + s.delay_days, 0) / late.length) : 0,
    },
  });
}));

// GET /shipments
router.get('/', [
  authenticate,
  authorize(...READ_ROLES),
  query('status').optional().isIn([...STATUSES, 'open']),
  query('limit').optional().isInt({ min: 1, max: 500 }),
  query('page').optional().isInt({ min: 1 }),
], handle('List shipments', async (req, res) => {
  if (invalid(req, res)) return;
  const { po_id, vendor_id, status, search, due_from, due_to, overdue } = req.query;
  const limit = parseInt(req.query.limit || 200, 10);
  const page = parseInt(req.query.page || 1, 10);

  let q = db('shipments');
  if (po_id) q = q.where('po_id', po_id);
  if (vendor_id) q = q.where('vendor_id', vendor_id);
  if (due_from) q = q.where('expected_delivery_date', '>=', due_from);
  if (due_to) q = q.where('expected_delivery_date', '<=', due_to);
  if (status === 'open') q = q.whereNotIn('status', ['delivered', 'cancelled']);
  // Delayed includes shipments that are simply late as well as ones an exception flagged.
  else if (status === 'delayed') {
    q = q.where((b) => b.where('status', 'delayed')
      .orWhere((o) => o.whereIn('status', MOVING_STATUSES).whereNull('actual_delivery_date').where('expected_delivery_date', '<', today())));
  } else if (status) q = q.where('status', status);
  if (overdue === '1') q = q.whereIn('status', MOVING_STATUSES).whereNull('actual_delivery_date').where('expected_delivery_date', '<', today());
  if (search) {
    const term = `%${String(search).toLowerCase()}%`;
    q = q.where((b) => b
      .whereRaw('lower(shipment_number) like ?', [term])
      .orWhereRaw('lower(coalesce(tracking_number, \'\')) like ?', [term])
      .orWhereRaw('lower(coalesce(carrier_name, \'\')) like ?', [term])
      .orWhereIn('po_id', db('purchase_orders').select('id').whereRaw('lower(po_number) like ?', [term]))
      .orWhereIn('vendor_id', db('vendors').select('id').whereRaw('lower(name) like ?', [term])));
  }

  const total = await q.clone().count('id as count').first();
  const rows = await q.orderBy('expected_delivery_date', 'asc').limit(limit).offset((page - 1) * limit);
  res.json({
    success: true,
    data: {
      shipments: await enrichShipments(rows),
      pagination: { page, limit, total: Number(total.count), totalPages: Math.ceil(Number(total.count) / limit) },
    },
  });
}));

// GET /shipments/po/:poId/remaining — what is still left to ship on a PO (prefills the create form)
router.get('/po/:poId/remaining', [authenticate, authorize(...READ_ROLES)], handle('PO remaining', async (req, res) => {
  const po = await db('purchase_orders').where('id', req.params.poId).first();
  if (!po) return res.status(404).json({ success: false, error: 'Purchase order not found' });
  const vendor = await db('vendors').where('id', po.vendor_id).first();
  res.json({
    success: true,
    data: {
      po: { id: po.id, po_number: po.po_number, status: po.status, expected_delivery_date: toDate(po.expected_delivery_date), delivery_address: po.delivery_address },
      vendor: { id: vendor?.id, name: vendor?.name, address: parseJson(vendor?.contact_info, {})?.address || null },
      lines: await remainingByLine(po),
    },
  });
}));

// GET /shipments/:id — shipment with its tracking history and receipts
router.get('/:id', [authenticate, authorize(...READ_ROLES)], handle('Get shipment', async (req, res) => {
  const detail = await loadDetail(req.params.id);
  if (!detail) return res.status(404).json({ success: false, error: 'Shipment not found' });
  res.json({ success: true, data: detail });
}));

// POST /shipments — create a shipment for a PO
router.post('/', [
  authenticate,
  authorize(...WRITE_ROLES),
  body('poId').isString().notEmpty().withMessage('Choose a purchase order'),
  body('items').optional().isArray(),
  body('expectedDeliveryDate').optional({ values: 'falsy' }).isDate().withMessage('Expected delivery must be a date'),
  body('shippedDate').optional({ values: 'falsy' }).isDate().withMessage('Shipped date must be a date'),
], handle('Create shipment', async (req, res) => {
  if (invalid(req, res)) return;
  const po = await db('purchase_orders').where('id', req.body.poId).first();
  if (!po) return res.status(400).json({ success: false, error: 'Purchase order not found' });
  const shipment = await createFromPO(po, req.user, req.body);
  logger.logAudit('SHIPMENT_CREATED', req.user.id, { shipmentId: shipment.id, poId: po.id });
  await sendDetail(res, shipment.id, 201);
}));

// PUT /shipments/:id — carrier, tracking number, dates, addresses, notes
const UPDATABLE = {
  carrierName: 'carrier_name',
  trackingNumber: 'tracking_number',
  expectedDeliveryDate: 'expected_delivery_date',
  shippedDate: 'shipped_date',
  originAddress: 'origin_address',
  destinationAddress: 'destination_address',
  notes: 'notes',
};
router.put('/:id', [
  authenticate,
  authorize(...WRITE_ROLES),
  body('expectedDeliveryDate').optional({ values: 'falsy' }).isDate().withMessage('Expected delivery must be a date'),
  body('shippedDate').optional({ values: 'falsy' }).isDate().withMessage('Shipped date must be a date'),
], handle('Update shipment', async (req, res) => {
  if (invalid(req, res)) return;
  const shipment = await db('shipments').where('id', req.params.id).first();
  if (!shipment) return res.status(404).json({ success: false, error: 'Shipment not found' });
  if (shipment.status === 'cancelled') return res.status(409).json({ success: false, error: 'A cancelled shipment cannot be edited' });

  const update = { updated_by: req.user.id, updated_at: db.fn.now() };
  for (const [key, column] of Object.entries(UPDATABLE)) {
    if (req.body[key] !== undefined) update[column] = req.body[key] === '' ? null : req.body[key];
  }
  if (update.expected_delivery_date === null) return res.status(400).json({ success: false, error: 'Expected delivery date is required' });
  if (update.shipped_date && shipment.status === 'pending') update.status = 'in_transit';
  await db('shipments').where('id', shipment.id).update(update);
  logger.logAudit('SHIPMENT_UPDATED', req.user.id, { shipmentId: shipment.id });
  await sendDetail(res, shipment.id);
}));

// POST /shipments/:id/track — buyer-entered tracking event
router.post('/:id/track', [
  authenticate,
  authorize(...WRITE_ROLES),
  body('statusEvent').isIn(TRACKING_EVENTS).withMessage('Choose what happened'),
  body('eventDate').optional({ values: 'falsy' }).isISO8601().withMessage('Event date must be a date and time'),
  body('location').optional().isString(),
  body('temperature').optional({ values: 'null' }).isFloat({ min: -100, max: 100 }).withMessage('Temperature must be between -100 and 100 °C'),
], handle('Add tracking event', async (req, res) => {
  if (invalid(req, res)) return;
  const shipment = await db('shipments').where('id', req.params.id).first();
  if (!shipment) return res.status(404).json({ success: false, error: 'Shipment not found' });
  if (shipment.status === 'cancelled') return res.status(409).json({ success: false, error: 'Cannot track a cancelled shipment' });

  const eventDate = req.body.eventDate ? new Date(req.body.eventDate) : new Date();
  if (eventDate.getTime() > Date.now() + 5 * 60000) return res.status(400).json({ success: false, error: 'Event date cannot be in the future' });
  const event = req.body.statusEvent;
  const eventDay = eventDate.toISOString().split('T')[0];

  const update = { updated_by: req.user.id, updated_at: db.fn.now() };
  const receivingStarted = ['partially_received', 'delivered'].includes(shipment.status);
  if (event === 'exception') {
    if (!receivingStarted) update.status = 'delayed';
  } else if (event === 'delivered') {
    if (shipment.status !== 'partially_received') update.status = 'delivered';
    if (!shipment.actual_delivery_date) update.actual_delivery_date = eventDay;
  } else if (!receivingStarted) {
    update.status = 'in_transit';
  }
  if (['picked_up', 'in_transit', 'out_for_delivery'].includes(event) && !shipment.shipped_date) update.shipped_date = eventDay;

  await db.transaction(async (trx) => {
    await trx('delivery_tracking').insert({
      id: uuidv4(),
      shipment_id: shipment.id,
      status_event: event,
      event_date: eventDate.toISOString(),
      location: req.body.location || null,
      temperature: req.body.temperature === undefined || req.body.temperature === null || req.body.temperature === '' ? null : Number(req.body.temperature),
      notes: req.body.notes || null,
      created_by: req.user.id,
      created_at: new Date().toISOString(),
    });
    await trx('shipments').where('id', shipment.id).update(update);
  });
  logger.logAudit('SHIPMENT_TRACKED', req.user.id, { shipmentId: shipment.id, event });
  await sendDetail(res, shipment.id, 201);
}));

/**
 * Records goods arriving against a shipment and writes a GRN.
 * Body: { receivedDate?, notes?, applyToPo? (default true), items?: [{ poLineIndex, quantity, reason? }] }
 * `quantity` is what arrived in this delivery. A final receipt closes the shipment; anything not received is logged as short.
 */
async function recordReceipt(req, res, final) {
  const shipment = await db('shipments').where('id', req.params.id).first();
  if (!shipment) return res.status(404).json({ success: false, error: 'Shipment not found' });
  if (shipment.status === 'cancelled') return res.status(409).json({ success: false, error: 'Cannot receive a cancelled shipment' });
  const priorReceipts = await db('shipment_receipts').where('shipment_id', shipment.id);
  if (priorReceipts.some((r) => r.is_final)) return res.status(409).json({ success: false, error: 'This shipment has already been received in full' });

  const receivedDate = req.body.receivedDate || today();
  if (receivedDate > today()) return res.status(400).json({ success: false, error: 'Delivery date cannot be in the future' });

  const items = parseJson(shipment.items);
  const outstanding = items.map((it) => round3(Number(it.quantity) - Number(it.receivedQuantity || 0)));
  if (outstanding.every((q) => q <= 0)) return res.status(409).json({ success: false, error: 'Everything on this shipment has already been received' });

  const given = Array.isArray(req.body.items) ? req.body.items : null;
  if (!final && !given) return res.status(400).json({ success: false, error: 'Enter the quantity received for at least one line' });

  const unknown = (given || []).find((g) => !items.some((it) => Number(it.poLineIndex) === Number(g.poLineIndex)));
  if (unknown) return res.status(400).json({ success: false, error: `PO line ${Number(unknown.poLineIndex) + 1} is not on this shipment` });

  const lines = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const entry = given ? given.find((g) => Number(g.poLineIndex) === Number(it.poLineIndex)) : null;
    const qty = given ? round3(Number(entry?.quantity) || 0) : outstanding[i];
    if (qty < 0) return res.status(400).json({ success: false, error: 'Quantities cannot be negative' });
    if (qty > outstanding[i]) {
      return res.status(400).json({ success: false, error: `"${it.description}": only ${outstanding[i]} is still expected on this shipment` });
    }
    const short = round3(outstanding[i] - qty);
    lines.push({
      poLineIndex: it.poLineIndex,
      description: it.description,
      shippedQuantity: Number(it.quantity),
      previouslyReceived: Number(it.receivedQuantity || 0),
      receivedQuantity: qty,
      shortQuantity: short,
      reason: (entry?.reason || '').trim() || null,
    });
  }
  if (!final && lines.every((l) => l.receivedQuantity <= 0)) {
    return res.status(400).json({ success: false, error: 'Enter the quantity received for at least one line' });
  }

  const newItems = items.map((it, i) => ({ ...it, receivedQuantity: round3(Number(it.receivedQuantity || 0) + lines[i].receivedQuantity) }));
  const complete = newItems.every((it) => it.receivedQuantity >= Number(it.quantity));
  const isFinal = final || complete;
  const applyToPo = req.body.applyToPo !== false;
  const receiptId = uuidv4();
  let appliedToPo = false;
  const grnNumber = await nextGrnNumber();

  await db.transaction(async (trx) => {
    if (applyToPo) {
      const byLine = Object.fromEntries(lines.map((l) => [l.poLineIndex, l.receivedQuantity]));
      appliedToPo = await applyReceiptToPO(trx, shipment.po_id, byLine, req.user.id);
    }
    await trx('shipment_receipts').insert({
      id: receiptId,
      grn_number: grnNumber,
      shipment_id: shipment.id,
      po_id: shipment.po_id,
      received_date: receivedDate,
      items: JSON.stringify(lines),
      is_final: isFinal,
      applied_to_po: appliedToPo,
      notes: req.body.notes || null,
      received_by: req.user.id,
      created_at: new Date().toISOString(),
    });
    const update = {
      items: JSON.stringify(newItems),
      ...totals(newItems),
      status: isFinal ? 'delivered' : 'partially_received',
      updated_by: req.user.id,
      updated_at: trx.fn.now(),
    };
    if (isFinal) update.actual_delivery_date = receivedDate;
    await trx('shipments').where('id', shipment.id).update(update);
    // Keep the timeline complete when goods are received without anyone logging the delivery first.
    const hasDelivered = await trx('delivery_tracking').where({ shipment_id: shipment.id, status_event: 'delivered' }).first();
    if (isFinal && !hasDelivered) {
      await trx('delivery_tracking').insert({
        id: uuidv4(),
        shipment_id: shipment.id,
        status_event: 'delivered',
        event_date: new Date(`${receivedDate}T${receivedDate === today() ? new Date().toISOString().slice(11, 19) : '12:00:00'}Z`).toISOString(),
        location: shipment.destination_address,
        notes: 'Recorded with the goods receipt',
        created_by: req.user.id,
        created_at: new Date().toISOString(),
      });
    }
  });
  if (appliedToPo) await clearPoCache();
  logger.logAudit(final ? 'SHIPMENT_RECEIVED' : 'SHIPMENT_PARTIALLY_RECEIVED', req.user.id, { shipmentId: shipment.id, receiptId });

  const receipt = await db('shipment_receipts').where('id', receiptId).first();
  await sendDetail(res, shipment.id, 201, { receipt: mapReceipt(receipt) });
}

const receiptValidators = [
  authenticate,
  authorize(...RECEIVE_ROLES),
  body('receivedDate').optional({ values: 'falsy' }).isDate().withMessage('Delivery date must be a date'),
  body('items').optional().isArray(),
  body('applyToPo').optional().isBoolean(),
];

// POST /shipments/:id/partial-receive — record part of the shipment arriving
router.post('/:id/partial-receive', receiptValidators, handle('Partial receive', async (req, res) => {
  if (invalid(req, res)) return;
  await recordReceipt(req, res, false);
}));

// POST /shipments/:id/receive — receive the rest and close the shipment (shortfalls are logged on the GRN)
router.post('/:id/receive', receiptValidators, handle('Receive shipment', async (req, res) => {
  if (invalid(req, res)) return;
  await recordReceipt(req, res, true);
}));

// POST /shipments/:id/cancel
router.post('/:id/cancel', [authenticate, authorize(...WRITE_ROLES)], handle('Cancel shipment', async (req, res) => {
  const shipment = await db('shipments').where('id', req.params.id).first();
  if (!shipment) return res.status(404).json({ success: false, error: 'Shipment not found' });
  const receipts = await db('shipment_receipts').where('shipment_id', shipment.id).first();
  if (receipts || ['delivered', 'cancelled'].includes(shipment.status)) {
    return res.status(409).json({ success: false, error: 'Only shipments with nothing received yet can be cancelled' });
  }
  await db('shipments').where('id', shipment.id)
    .update({ status: 'cancelled', cancel_reason: req.body.reason || null, updated_by: req.user.id, updated_at: db.fn.now() });
  logger.logAudit('SHIPMENT_CANCELLED', req.user.id, { shipmentId: shipment.id });
  await sendDetail(res, shipment.id);
}));

// GET /shipments/:id/grn — goods receipt note data; ?receipt_id= picks one GRN, otherwise all of them
router.get('/:id/grn', [authenticate, authorize(...READ_ROLES)], handle('GRN', async (req, res) => {
  const detail = await loadDetail(req.params.id);
  if (!detail) return res.status(404).json({ success: false, error: 'Shipment not found' });
  let receipts = detail.receipts;
  if (req.query.receipt_id) receipts = receipts.filter((r) => r.id === req.query.receipt_id);
  if (!receipts.length) return res.status(404).json({ success: false, error: 'No goods have been received on this shipment yet' });

  const vendor = await db('vendors').where('id', detail.vendor_id).first();
  const contact = parseJson(vendor?.contact_info, {});
  const userIds = [...new Set(receipts.map((r) => r.received_by).filter(Boolean))];
  const users = userIds.length ? await db('users').whereIn('id', userIds).select('id', 'name') : [];
  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));
  const poLines = detail.po?.line_items || [];

  res.json({
    success: true,
    data: {
      shipment: {
        id: detail.id, shipment_number: detail.shipment_number, carrier_name: detail.carrier_name, tracking_number: detail.tracking_number,
        shipped_date: detail.shipped_date, expected_delivery_date: detail.expected_delivery_date, actual_delivery_date: detail.actual_delivery_date,
        origin_address: detail.origin_address, destination_address: detail.destination_address, status: detail.status,
      },
      po: detail.po && { id: detail.po.id, po_number: detail.po.po_number, issue_date: detail.po.issue_date, currency: detail.po.currency },
      vendor: { id: vendor?.id, name: vendor?.name, address: contact?.address || null, email: contact?.email || null, phone: contact?.phone || null, tax_id: vendor?.tax_id || null },
      receipts: receipts.map((r) => {
        const items = r.items.map((it) => {
          const unitPrice = Number(poLines[it.poLineIndex]?.unitPrice) || 0;
          return { ...it, unitPrice, value: round3(unitPrice * it.receivedQuantity) };
        });
        return {
          ...r,
          received_by_name: userMap[r.received_by] || null,
          items,
          total_received: round3(items.reduce((a, it) => a + it.receivedQuantity, 0)),
          total_short: round3(items.reduce((a, it) => a + it.shortQuantity, 0)),
          total_value: Math.round(items.reduce((a, it) => a + it.value, 0) * 100) / 100,
        };
      }),
    },
  });
}));

module.exports = router;
