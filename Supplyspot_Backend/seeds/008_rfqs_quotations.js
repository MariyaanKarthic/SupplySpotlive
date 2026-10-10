/**
 * Sample RFQs and quotations covering every RFQ status. PR-2026-0012 is left without an RFQ so there is always an
 * approved request to try "create RFQ" on. Builds on the vendors, users and purchase requests already
 * in the database (seeds 001, 002 and 007), so run it on its own:
 *   npx knex seed:run --specific=008_rfqs_quotations.js
 * Re-running it replaces the RFQs, quotations and RFQ-created purchase orders it made before.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const { v4: uuidv4 } = require('uuid');

const DAY = 86400000;
const dateIn = (days) => new Date(Date.now() + days * DAY).toISOString().split('T')[0];
const tsAgo = (days, hour = 10) => {
  const d = new Date(Date.now() - days * DAY);
  d.setUTCHours(hour, 15, 0, 0);
  return d.toISOString().replace('T', ' ').slice(0, 19);
};
const round2 = (n) => Math.round(n * 100) / 100;
const parse = (v) => (typeof v === 'string' ? JSON.parse(v || '[]') : (v || []));

// The draft RFQ created from PR-2026-0008 before this seed existed keeps its id.
const EXISTING_DRAFT_RFQ_ID = '830d86e3-b4fc-48ce-ae98-18dd430bf9bc';

exports.seed = async function(knex) {
  const admin = await knex('users').where('role', 'admin').first();
  if (!admin) throw new Error('Seed users first (001_users.js)');
  const vendors = await knex('vendors').select('id', 'name');
  const vendor = (name) => {
    const v = vendors.find((x) => x.name === name);
    if (!v) throw new Error(`Vendor "${name}" not found; seed vendors first (002_vendors.js)`);
    return v;
  };
  const prs = await knex('purchase_requests').select('*');
  const prByNumber = (n) => prs.find((p) => p.pr_number === n) || null;
  const who = { userId: admin.id, userName: admin.name };
  const h = (action, daysAgo, comment) => ({ action, ...who, at: new Date(tsAgo(daysAgo).replace(' ', 'T') + 'Z').toISOString(), ...(comment ? { comment } : {}) });

  // Clear what an earlier run (or the UI) created.
  const oldRfqIds = (await knex('rfqs').select('id')).map((r) => r.id);
  if (oldRfqIds.length) {
    await knex('quotations').whereIn('rfq_id', oldRfqIds).update({ purchase_order_id: null });
    await knex('purchase_orders').whereIn('rfq_id', oldRfqIds).del();
  }
  await knex('quotation_items').del();
  await knex('quotations').del();
  // Unlink every purchase request and drop RFQ entries from their history; the loop below re-adds the ones it creates.
  for (const pr of prs) {
    const history = parse(pr.history).filter((e) => e.action !== 'rfq_created');
    pr.history = JSON.stringify(history);
    await knex('purchase_requests').where('id', pr.id).update({ rfq_id: null, history: pr.history });
  }
  await knex('rfqs').del();

  const poRows = await knex('purchase_orders').where('po_number', 'like', `PO-${new Date().getFullYear()}-%`).select('po_number');
  let poSeq = poRows.reduce((m, r) => Math.max(m, parseInt(r.po_number.split('-')[2], 10) || 0), 0);
  const year = new Date().getFullYear();
  let rfqSeq = 0;
  let qtSeq = 0;

  const specs = [
    {
      id: EXISTING_DRAFT_RFQ_ID, pr: 'PR-2026-0008', status: 'draft', createdDaysAgo: 0, due: 7,
      vendors: ['GreenLeaf Packaging Solutions', 'Royal Textiles Mills'],
      notes: 'Booth is 3m x 3m. Artwork files will be shared after award.',
    },
    {
      title: 'Ergonomic chairs for the 3rd floor', status: 'sent', createdDaysAgo: 3, sentDaysAgo: 2, due: 9,
      category: 'Facilities', priority: 'medium', currency: 'INR',
      items: [
        { description: 'Ergonomic mesh office chair', quantity: 40, unit: 'pcs', category: 'Facilities', budget: 360000 },
        { description: 'Height-adjustable footrest', quantity: 10, unit: 'pcs', category: 'Facilities', budget: 25000 },
      ],
      vendors: ['Pinnacle Facility Services', 'Royal Textiles Mills', 'Evergreen Safety Equipment'],
      notes: 'Deliver and assemble on the 3rd floor, Tower B. Five-year warranty on mechanisms preferred.',
    },
    {
      pr: 'PR-2026-0002', status: 'quotations_received', createdDaysAgo: 7, sentDaysAgo: 6, due: 3,
      vendors: ['Pinnacle Facility Services', 'Evergreen Safety Equipment', 'Bharat Electricals'],
      quotes: [
        { vendor: 'Pinnacle Facility Services', daysAgo: 4, delivery: 10, terms: 'Net 30', valid: 25,
          prices: [1150, 290, 4300], notes: 'Prices include delivery within city limits.' },
        { vendor: 'Bharat Electricals', daysAgo: 2, delivery: 6, terms: 'Net 15', valid: 20,
          prices: [1240, 270, 4050], extras: [['Delivery charges', 1, 1500]] },
      ],
    },
    {
      pr: 'PR-2026-0003', status: 'under_review', createdDaysAgo: 10, sentDaysAgo: 9, due: -1,
      vendors: ['Ironclad Fasteners', 'Bharat Electricals', 'Apex Precision Engineering'],
      quotes: [
        { vendor: 'Ironclad Fasteners', daysAgo: 6, delivery: 5, terms: 'Net 30', valid: 30, prices: [39500],
          status: 'reviewed', reviewedDaysAgo: 1, notes: 'Servo Hydraulic 46 or equivalent. Stock available.' },
        { vendor: 'Bharat Electricals', daysAgo: 5, delivery: 12, terms: '50% advance, 50% on delivery', valid: 15, prices: [37800],
          extras: [['Freight and handling', 1, 4000]] },
        { vendor: 'Apex Precision Engineering', daysAgo: 4, delivery: 8, terms: 'Net 45', valid: 30, prices: [46500],
          status: 'rejected', decidedDaysAgo: 1, reason: 'Price is 11% above budget and above the other two quotes.' },
      ],
    },
    {
      pr: 'PR-2026-0009', status: 'awarded', createdDaysAgo: 21, sentDaysAgo: 20, due: -8, awardedDaysAgo: 3,
      vendors: ['Pinnacle Facility Services', 'CleanWave Environmental', 'Brightpath HR Services'],
      quotes: [
        { vendor: 'CleanWave Environmental', daysAgo: 15, delivery: 30, terms: 'Quarterly in advance', valid: 60, prices: [51000],
          status: 'accepted', notes: 'Includes filter replacement and gas top-up at each visit.' },
        { vendor: 'Pinnacle Facility Services', daysAgo: 13, delivery: 21, terms: 'Net 30', valid: 45, prices: [56500],
          status: 'rejected', reason: 'Not selected. RFQ was awarded to CleanWave Environmental.' },
      ],
      po: { status: 'new' },
    },
    {
      title: 'Corrugated shipping cartons, Q4', status: 'awarded', createdDaysAgo: 48, sentDaysAgo: 47, due: -37, awardedDaysAgo: 33,
      category: 'Packaging', priority: 'high', currency: 'INR',
      items: [
        { description: '5-ply carton 600x400x400 mm', quantity: 5000, unit: 'pcs', category: 'Packaging', budget: 225000 },
        { description: 'Brown packing tape 48 mm', quantity: 400, unit: 'roll', category: 'Packaging', budget: 24000 },
      ],
      vendors: ['GreenLeaf Packaging Solutions', 'Royal Textiles Mills', 'Silverline Glass Industries'],
      quotes: [
        { vendor: 'GreenLeaf Packaging Solutions', daysAgo: 42, delivery: -20, terms: 'Net 30', valid: -10, prices: [41.5, 55],
          status: 'accepted', notes: 'Printed with logo at no extra cost.' },
        { vendor: 'Royal Textiles Mills', daysAgo: 40, delivery: -15, terms: 'Net 45', valid: -12, prices: [46, 52],
          status: 'rejected', reason: 'Not selected. RFQ was awarded to GreenLeaf Packaging Solutions.', archivedDaysAgo: 30 },
        { vendor: 'Silverline Glass Industries', daysAgo: 39, delivery: -18, terms: 'Advance', valid: -15, prices: [49, 60],
          status: 'rejected', reason: 'Advance payment terms not acceptable.' },
      ],
      po: { status: 'acknowledged' },
    },
    {
      title: 'Forklift annual maintenance', status: 'closed', createdDaysAgo: 35, sentDaysAgo: 34, due: -20, closedDaysAgo: 18,
      category: 'Services', priority: 'low', currency: 'INR', closeReason: 'Budget moved to next quarter. Will re-issue in January.',
      items: [{ description: 'Annual maintenance, 3 electric forklifts', quantity: 1, unit: 'contract', category: 'Services', budget: 150000 }],
      vendors: ['Northstar Warehousing', 'Swift Cargo Movers'],
      quotes: [
        { vendor: 'Northstar Warehousing', daysAgo: 25, delivery: -5, terms: 'Net 30', valid: -1, prices: [168000],
          status: 'rejected', reason: 'RFQ closed: Budget moved to next quarter. Will re-issue in January.' },
      ],
    },
    {
      title: 'Network switches for plant 2', status: 'quotations_received', createdDaysAgo: 15, sentDaysAgo: 14, due: -2,
      category: 'IT Hardware', priority: 'high', currency: 'INR',
      items: [
        { description: '48-port managed PoE switch', quantity: 4, unit: 'pcs', category: 'IT Hardware', budget: 520000 },
        { description: '10G SFP+ transceiver', quantity: 8, unit: 'pcs', category: 'IT Hardware', budget: 64000 },
        { description: 'Installation and configuration', quantity: 1, unit: 'job', category: 'Services', budget: 40000 },
      ],
      vendors: ['Orion Data Systems', 'Zenith Cloud Networks', 'Quantum Circuits India'],
      notes: 'Switches must support VLANs and be compatible with our existing Cisco core.',
      quotes: [
        { vendor: 'Zenith Cloud Networks', daysAgo: 5, delivery: 14, terms: 'Net 30', valid: 21, prices: [124000, 7600, 35000] },
        { vendor: 'Orion Data Systems', daysAgo: 3, delivery: 21, terms: 'Net 45', valid: 30, prices: [118500, 8200], skipLast: true,
          notes: 'Installation not included; our partner can quote separately.' },
      ],
    },
  ];

  for (const spec of specs) {
    const pr = spec.pr ? prByNumber(spec.pr) : null;
    if (spec.pr && !pr) continue; // purchase request seed not loaded
    const items = pr ? parse(pr.items) : spec.items;
    const budget = round2(items.reduce((a, it) => a + (Number(it.budget) || 0), 0));
    const rfqId = spec.id || uuidv4();
    const rfqNumber = `RFQ-${year}-${String(++rfqSeq).padStart(4, '0')}`;
    const vendorIds = spec.vendors.map((n) => vendor(n).id);
    const history = [h('created', spec.createdDaysAgo, pr ? pr.pr_number : undefined)];
    if (spec.sentDaysAgo !== undefined) history.push(h('sent', spec.sentDaysAgo, `${vendorIds.length} vendors`));

    const rfq = {
      id: rfqId,
      rfq_number: rfqNumber,
      title: pr ? pr.title : spec.title,
      description: pr ? `Sourcing for ${pr.pr_number} (${pr.department}).` : null,
      category: spec.category || items[0]?.category || null,
      budget,
      currency: pr ? pr.currency : spec.currency,
      issued_date: spec.sentDaysAgo !== undefined ? tsAgo(spec.sentDaysAgo).slice(0, 10) : null,
      due_date: dateIn(spec.due),
      status: spec.status,
      priority: pr ? pr.priority : spec.priority,
      purchase_request_id: pr ? pr.id : null,
      items: JSON.stringify(items),
      vendor_ids: JSON.stringify(vendorIds),
      notes: spec.notes || pr?.notes || null,
      sent_at: spec.sentDaysAgo !== undefined ? tsAgo(spec.sentDaysAgo) : null,
      attachments: JSON.stringify([]),
      created_by: admin.id,
      updated_by: admin.id,
      created_at: tsAgo(spec.createdDaysAgo, 9),
      updated_at: tsAgo(Math.min(spec.createdDaysAgo, spec.awardedDaysAgo ?? spec.closedDaysAgo ?? spec.createdDaysAgo), 11),
    };

    const quoteRows = [];
    const itemRows = [];
    for (const q of spec.quotes || []) {
      const v = vendor(q.vendor);
      const qid = uuidv4();
      const lines = items
        .map((it, i) => (q.prices[i] === undefined ? null : {
          rfq_item_index: i, description: it.description, quantity: Number(it.quantity), unit: it.unit, unit_price: q.prices[i],
        }))
        .filter(Boolean);
      (q.extras || []).forEach(([description, quantity, price]) => lines.push({ rfq_item_index: null, description, quantity, unit: 'lot', unit_price: price }));
      const total = round2(lines.reduce((a, li) => a + li.quantity * li.unit_price, 0));
      const status = q.status || 'submitted';
      quoteRows.push({
        id: qid,
        quotation_number: `QT-${year}-${String(++qtSeq).padStart(4, '0')}`,
        rfq_id: rfqId,
        vendor_id: v.id,
        total_amount: total,
        currency: rfq.currency,
        submitted_date: tsAgo(q.daysAgo).slice(0, 10),
        submitted_at: tsAgo(q.daysAgo, 14),
        valid_until: dateIn(q.valid),
        delivery_date: dateIn(q.delivery),
        payment_terms: q.terms,
        status,
        notes: q.notes || null,
        reviewed_at: q.reviewedDaysAgo !== undefined ? tsAgo(q.reviewedDaysAgo) : null,
        decided_at: status === 'accepted' || status === 'rejected' ? tsAgo(q.decidedDaysAgo ?? spec.awardedDaysAgo ?? spec.closedDaysAgo ?? 1) : null,
        rejection_reason: q.reason || null,
        archived_at: q.archivedDaysAgo !== undefined ? tsAgo(q.archivedDaysAgo) : null,
        attachments: JSON.stringify([]),
        created_by: admin.id,
        updated_by: admin.id,
        created_at: tsAgo(q.daysAgo, 14),
        updated_at: tsAgo(q.daysAgo, 14),
      });
      lines.forEach((li, position) => itemRows.push({
        id: uuidv4(), quotation_id: qid, position, ...li, total_price: round2(li.quantity * li.unit_price),
      }));
      history.push(h('quotation_received', q.daysAgo, `${v.name} · ${quoteRows[quoteRows.length - 1].quotation_number}`));
      if (status === 'rejected' && q.decidedDaysAgo !== undefined) {
        history.push(h('quotation_rejected', q.decidedDaysAgo, `${v.name} · ${quoteRows[quoteRows.length - 1].quotation_number}: ${q.reason}`));
      }
    }
    if (spec.status === 'under_review') history.push(h('review_started', 1));

    let po = null;
    const accepted = quoteRows.find((q) => q.status === 'accepted');
    if (accepted) {
      po = {
        id: uuidv4(),
        po_number: `PO-${year}-${String(++poSeq).padStart(4, '0')}`,
        rfq_id: rfqId,
        vendor_id: accepted.vendor_id,
        total_amount: accepted.total_amount,
        currency: accepted.currency,
        status: spec.po.status,
        priority: rfq.priority,
        acknowledgment_status: spec.po.status === 'acknowledged' ? 'acknowledged' : 'pending',
        acknowledgment_date: spec.po.status === 'acknowledged' ? tsAgo(spec.awardedDaysAgo - 3).slice(0, 10) : null,
        issue_date: tsAgo(spec.awardedDaysAgo).slice(0, 10),
        expected_delivery_date: accepted.delivery_date,
        terms: accepted.payment_terms,
        notes: `Awarded from ${rfqNumber} (${accepted.quotation_number})${pr ? ` for ${pr.pr_number}` : ''}.`,
        line_items: JSON.stringify(itemRows.filter((li) => li.quotation_id === accepted.id).map((li) => ({
          description: li.description, quantity: li.quantity, unitPrice: li.unit_price, totalAmount: li.total_price,
          deliveryDate: accepted.delivery_date, receivedQuantity: 0,
        }))),
        attachments: JSON.stringify([]),
        created_by: admin.id,
        updated_by: admin.id,
        created_at: tsAgo(spec.awardedDaysAgo, 12),
        updated_at: tsAgo(spec.awardedDaysAgo, 12),
      };
      accepted.purchase_order_id = po.id;
      const vName = vendors.find((x) => x.id === accepted.vendor_id).name;
      history.push(h('awarded', spec.awardedDaysAgo, `${vName} · ${accepted.quotation_number}`));
      history.push(h('po_created', spec.awardedDaysAgo, po.po_number));
      Object.assign(rfq, {
        awarded_vendor_id: accepted.vendor_id, awarded_amount: accepted.total_amount, awarded_quotation_id: accepted.id, awarded_at: tsAgo(spec.awardedDaysAgo, 12),
      });
    }
    if (spec.status === 'closed') {
      history.push(h('closed', spec.closedDaysAgo, spec.closeReason));
      Object.assign(rfq, { closed_at: tsAgo(spec.closedDaysAgo), close_reason: spec.closeReason });
    }
    history.sort((a, b) => a.at.localeCompare(b.at));
    rfq.history = JSON.stringify(history);

    await knex('rfqs').insert(rfq);
    if (po) await knex('purchase_orders').insert(po);
    if (quoteRows.length) await knex('quotations').insert(quoteRows);
    if (itemRows.length) await knex('quotation_items').insert(itemRows);
    if (pr) {
      const prHistory = [...parse(pr.history), h('rfq_created', spec.createdDaysAgo, rfqNumber)];
      await knex('purchase_requests').where('id', pr.id).update({ rfq_id: rfqId, history: JSON.stringify(prHistory) });
    }
  }
};
