// Shared logic for RFQs and quotations: numbering, loading with related records, the PR → RFQ hand-off,
// and the quotation comparison. Used by routes/rfqs.js, routes/quotations.js and routes/purchaseRequests.js.
const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/database');
const { delByPrefix } = require('../config/redis');

const RFQ_STATUSES = ['draft', 'sent', 'quotations_received', 'under_review', 'awarded', 'closed'];
// RFQs in these states accept new quotations and decisions on them.
const OPEN_RFQ_STATUSES = ['sent', 'quotations_received', 'under_review'];
const QUOTATION_STATUSES = ['submitted', 'reviewed', 'accepted', 'rejected'];
const PENDING_QUOTATION_STATUSES = ['submitted', 'reviewed'];

const parseJson = (value, fallback = []) => {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return fallback; }
};
const round2 = (n) => Math.round(Number(n) * 100) / 100;
// Timestamps are stored as "YYYY-MM-DD HH:MM:SS" UTC, the same shape SQLite's CURRENT_TIMESTAMP uses.
const nowTs = () => new Date().toISOString().replace('T', ' ').slice(0, 19);
const today = () => new Date().toISOString().split('T')[0];
const toDateOnly = (value) => {
  if (!value) return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const d = new Date(typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value);
  return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
};

const historyEntry = (user, action, comment) => ({
  action,
  userId: user.id,
  userName: user.name,
  at: new Date().toISOString(),
  ...(comment ? { comment } : {}),
});

async function nextNumber(table, column, prefixBase, trx = db) {
  const prefix = `${prefixBase}-${new Date().getFullYear()}-`;
  const rows = await trx(table).where(column, 'like', `${prefix}%`).select(column);
  const max = rows.reduce((acc, r) => Math.max(acc, parseInt(r[column].slice(prefix.length), 10) || 0), 0);
  return `${prefix}${String(max + 1).padStart(4, '0')}`;
}

// RFQ items come from the purchase request: { description, quantity, unit, category, budget }.
function normalizeRfqItems(items) {
  return (items || [])
    .map((it) => ({
      description: String(it.description ?? '').trim(),
      quantity: Number(it.quantity) || 0,
      unit: String(it.unit ?? '').trim() || 'pcs',
      category: String(it.category ?? '').trim() || 'Other',
      budget: round2(Number(it.budget) || 0),
    }))
    .filter((it) => it.description);
}

function rfqItemsProblem(items) {
  if (!items.length) return 'Add at least one item';
  if (items.some((it) => !(it.quantity > 0))) return 'Each item needs a quantity above 0';
  return null;
}

const clearCaches = async () => {
  await delByPrefix('rfqs:');
  await delByPrefix('purchase_requests:');
  await delByPrefix('purchase_orders:');
};

// Builds a draft RFQ row from an approved purchase request. The caller inserts it and links the request.
async function rfqFromPurchaseRequest(pr, user, { dueDate, title, description, notes, vendorIds } = {}, trx = db) {
  const items = normalizeRfqItems(parseJson(pr.items));
  const categoryCounts = items.reduce((acc, it) => ({ ...acc, [it.category]: (acc[it.category] || 0) + 1 }), {});
  const category = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  return {
    id: uuidv4(),
    rfq_number: await nextNumber('rfqs', 'rfq_number', 'RFQ', trx),
    title: title || pr.title,
    description: description || `Sourcing for ${pr.pr_number} (${pr.department || 'no department'}).`,
    category,
    budget: pr.budget_total,
    currency: pr.currency || 'INR',
    issued_date: null,
    due_date: dueDate,
    status: 'draft',
    priority: pr.priority || 'medium',
    purchase_request_id: pr.id,
    items: JSON.stringify(items),
    vendor_ids: JSON.stringify(vendorIds || []),
    notes: notes ?? pr.notes ?? null,
    attachments: JSON.stringify([]),
    history: JSON.stringify([historyEntry(user, 'created', pr.pr_number)]),
    created_by: user.id,
    updated_by: user.id,
    created_at: nowTs(),
    updated_at: nowTs(),
  };
}

async function vendorMapFor(ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return {};
  const vendors = await db('vendors').whereIn('id', unique).select('id', 'name', 'category', 'status', 'rating', 'contact_info');
  return Object.fromEntries(vendors.map((v) => {
    const contact = parseJson(v.contact_info, {});
    return [v.id, { id: v.id, name: v.name, category: v.category, status: v.status, rating: Number(v.rating) || 0, email: contact?.email || null }];
  }));
}

// Quotations with their line items and vendor names.
async function enrichQuotations(quotations) {
  if (!quotations.length) return [];
  const ids = quotations.map((q) => q.id);
  const items = await db('quotation_items').whereIn('quotation_id', ids).orderBy('position', 'asc');
  const vendorMap = await vendorMapFor(quotations.map((q) => q.vendor_id));
  const rfqIds = [...new Set(quotations.map((q) => q.rfq_id).filter(Boolean))];
  const rfqs = rfqIds.length ? await db('rfqs').whereIn('id', rfqIds).select('id', 'rfq_number', 'title', 'status') : [];
  const rfqMap = Object.fromEntries(rfqs.map((r) => [r.id, r]));
  const poIds = [...new Set(quotations.map((q) => q.purchase_order_id).filter(Boolean))];
  const pos = poIds.length ? await db('purchase_orders').whereIn('id', poIds).select('id', 'po_number', 'status') : [];
  const poMap = Object.fromEntries(pos.map((p) => [p.id, p]));
  return quotations.map((q) => ({
    ...q,
    total_amount: Number(q.total_amount) || 0,
    delivery_date: toDateOnly(q.delivery_date),
    valid_until: toDateOnly(q.valid_until),
    vendor_name: vendorMap[q.vendor_id]?.name || 'Unknown vendor',
    vendor_email: vendorMap[q.vendor_id]?.email || null,
    vendor_rating: vendorMap[q.vendor_id]?.rating ?? null,
    rfq_number: rfqMap[q.rfq_id]?.rfq_number || null,
    rfq_title: rfqMap[q.rfq_id]?.title || null,
    rfq_status: rfqMap[q.rfq_id]?.status || null,
    po_number: q.purchase_order_id ? (poMap[q.purchase_order_id]?.po_number || null) : null,
    items: items.filter((it) => it.quotation_id === q.id).map((it) => ({
      id: it.id,
      rfq_item_index: it.rfq_item_index,
      description: it.description,
      quantity: Number(it.quantity) || 0,
      unit: it.unit,
      unit_price: Number(it.unit_price) || 0,
      total_price: Number(it.total_price) || 0,
    })),
    line_items: undefined,
  }));
}

// RFQs with the purchase request, invited vendors, quotation summary and the PO they led to.
async function enrichRFQs(rfqs, { withQuotations = false } = {}) {
  if (!rfqs.length) return [];
  const rfqIds = rfqs.map((r) => r.id);
  const quotations = await db('quotations').whereIn('rfq_id', rfqIds).orderBy('total_amount', 'asc');
  const prIds = [...new Set(rfqs.map((r) => r.purchase_request_id).filter(Boolean))];
  const prs = prIds.length ? await db('purchase_requests').whereIn('id', prIds).select('id', 'pr_number', 'title', 'department', 'requester_id') : [];
  const prMap = Object.fromEntries(prs.map((p) => [p.id, p]));
  const allVendorIds = rfqs.flatMap((r) => parseJson(r.vendor_ids)).concat(quotations.map((q) => q.vendor_id));
  const vendorMap = await vendorMapFor(allVendorIds);
  const userIds = [...new Set(rfqs.map((r) => r.created_by).filter(Boolean))];
  const users = userIds.length ? await db('users').whereIn('id', userIds).select('id', 'name') : [];
  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));
  const pos = await db('purchase_orders').whereIn('rfq_id', rfqIds).select('id', 'po_number', 'status', 'rfq_id');
  const poMap = Object.fromEntries(pos.map((p) => [p.rfq_id, p]));
  const detailed = withQuotations ? await enrichQuotations(quotations) : [];
  // Which RFQ lines each quotation prices, so the "lowest quote" prefers quotes that cover every item.
  const quotedLines = quotations.length
    ? await db('quotation_items').whereIn('quotation_id', quotations.map((q) => q.id)).whereNotNull('rfq_item_index').select('quotation_id', 'rfq_item_index')
    : [];
  const coverage = quotedLines.reduce((acc, li) => {
    (acc[li.quotation_id] = acc[li.quotation_id] || new Set()).add(Number(li.rfq_item_index));
    return acc;
  }, {});

  return rfqs.map((rfq) => {
    const own = quotations.filter((q) => q.rfq_id === rfq.id);
    const live = own.filter((q) => !q.archived_at && q.status !== 'rejected');
    const itemCount = parseJson(rfq.items).length;
    const complete = live.filter((q) => (coverage[q.id]?.size || 0) >= itemCount);
    const lowest = (complete.length ? complete : live)
      .reduce((best, q) => (best === null || Number(q.total_amount) < Number(best.total_amount) ? q : best), null);
    const vendorIds = parseJson(rfq.vendor_ids);
    const pr = rfq.purchase_request_id ? prMap[rfq.purchase_request_id] : null;
    const po = poMap[rfq.id] || null;
    return {
      ...rfq,
      budget: rfq.budget === null || rfq.budget === undefined ? null : Number(rfq.budget),
      awarded_amount: rfq.awarded_amount === null || rfq.awarded_amount === undefined ? null : Number(rfq.awarded_amount),
      due_date: toDateOnly(rfq.due_date),
      issued_date: toDateOnly(rfq.issued_date),
      items: parseJson(rfq.items),
      vendor_ids: vendorIds,
      vendors: vendorIds.map((id) => vendorMap[id] || { id, name: 'Unknown vendor' }),
      history: parseJson(rfq.history),
      attachments: parseJson(rfq.attachments),
      created_by_name: userMap[rfq.created_by] || null,
      pr_number: pr?.pr_number || null,
      pr_title: pr?.title || null,
      pr_department: pr?.department || null,
      quotation_count: own.filter((q) => !q.archived_at).length,
      open_quotation_count: own.filter((q) => PENDING_QUOTATION_STATUSES.includes(q.status)).length,
      responded_vendor_ids: [...new Set(own.map((q) => q.vendor_id))],
      lowest_quote: lowest ? {
        id: lowest.id, amount: Number(lowest.total_amount), vendor_name: vendorMap[lowest.vendor_id]?.name || 'Unknown vendor', partial: !complete.length,
      } : null,
      awarded_vendor_name: rfq.awarded_vendor_id ? (vendorMap[rfq.awarded_vendor_id]?.name || null) : null,
      po_id: po?.id || null,
      po_number: po?.po_number || null,
      po_status: po?.status || null,
      ...(withQuotations ? { quotations: detailed.filter((q) => q.rfq_id === rfq.id) } : {}),
    };
  });
}

const daysBetween = (fromIso, toIso) => {
  if (!fromIso || !toIso) return null;
  return Math.round((new Date(`${toIso}T00:00:00Z`).getTime() - new Date(`${fromIso}T00:00:00Z`).getTime()) / 86400000);
};

// Side-by-side view: one row per RFQ item with each quotation's price, plus extras and the commercial terms.
function buildComparison(rfq, quotations) {
  const shown = quotations.filter((q) => !q.archived_at);
  const items = rfq.items.map((it, index) => {
    const prices = {};
    shown.forEach((q) => {
      const lines = q.items.filter((li) => li.rfq_item_index === index);
      prices[q.id] = lines.length
        ? {
          quantity: lines.reduce((acc, li) => acc + li.quantity, 0),
          unitPrice: lines.length === 1 ? lines[0].unit_price : null,
          totalPrice: round2(lines.reduce((acc, li) => acc + li.total_price, 0)),
          quantityShort: lines.reduce((acc, li) => acc + li.quantity, 0) < it.quantity,
        }
        : null;
    });
    const candidates = shown.filter((q) => q.status !== 'rejected' && prices[q.id]);
    const lowest = candidates.reduce((best, q) => (!best || prices[q.id].totalPrice < prices[best.id].totalPrice ? q : best), null);
    return { index, description: it.description, quantity: it.quantity, unit: it.unit, budget: it.budget, prices, lowestQuotationId: lowest?.id || null };
  });

  const extras = {};
  shown.forEach((q) => {
    const lines = q.items.filter((li) => li.rfq_item_index === null || li.rfq_item_index === undefined || li.rfq_item_index >= rfq.items.length);
    extras[q.id] = { total: round2(lines.reduce((acc, li) => acc + li.total_price, 0)), lines: lines.map((li) => li.description) };
  });

  const sentOn = toDateOnly(rfq.sent_at) || rfq.issued_date || today();
  const coverage = (q) => rfq.items.filter((_, i) => q.items.some((li) => li.rfq_item_index === i)).length;
  const contenders = shown.filter((q) => q.status !== 'rejected');
  // Quotes that price every item rank ahead of partial ones, so a cheap partial quote never looks like the best deal.
  const sortedByTotal = [...contenders].sort((a, b) =>
    (coverage(b) === rfq.items.length) - (coverage(a) === rfq.items.length) || a.total_amount - b.total_amount);
  const lowestTotal = sortedByTotal[0] || null;
  const byDelivery = contenders.filter((q) => q.delivery_date).sort((a, b) => a.delivery_date.localeCompare(b.delivery_date));
  // Only call a quote "fastest" when it beats the others, not when several promise the same date.
  const fastest = byDelivery.length > 1 && byDelivery[0].delivery_date < byDelivery[1].delivery_date ? byDelivery[0] : null;

  const columns = shown.map((q) => {
    const covered = coverage(q);
    return {
      id: q.id,
      quotationNumber: q.quotation_number,
      vendorId: q.vendor_id,
      vendorName: q.vendor_name,
      vendorRating: q.vendor_rating,
      status: q.status,
      currency: q.currency,
      totalAmount: q.total_amount,
      deliveryDate: q.delivery_date,
      deliveryDays: daysBetween(sentOn, q.delivery_date),
      paymentTerms: q.payment_terms || null,
      validUntil: q.valid_until,
      expired: !!q.valid_until && q.valid_until < today(),
      notes: q.notes || null,
      itemsCovered: covered,
      itemsTotal: rfq.items.length,
      vsBudget: rfq.budget ? round2(q.total_amount - rfq.budget) : null,
      vsLowest: lowestTotal ? round2(q.total_amount - lowestTotal.total_amount) : null,
      rank: q.status === 'rejected' ? null : sortedByTotal.findIndex((x) => x.id === q.id) + 1,
    };
  });

  return {
    rfq: {
      id: rfq.id, rfq_number: rfq.rfq_number, title: rfq.title, status: rfq.status, currency: rfq.currency,
      budget: rfq.budget, due_date: rfq.due_date, awarded_quotation_id: rfq.awarded_quotation_id,
    },
    columns,
    items,
    extras,
    summary: {
      lowestTotalId: lowestTotal?.id || null,
      fastestDeliveryId: fastest?.id || null,
      spread: contenders.length > 1
        ? round2(Math.max(...contenders.map((q) => q.total_amount)) - Math.min(...contenders.map((q) => q.total_amount))) : 0,
    },
  };
}

module.exports = {
  RFQ_STATUSES,
  OPEN_RFQ_STATUSES,
  QUOTATION_STATUSES,
  PENDING_QUOTATION_STATUSES,
  parseJson,
  round2,
  nowTs,
  today,
  toDateOnly,
  historyEntry,
  nextNumber,
  normalizeRfqItems,
  rfqItemsProblem,
  clearCaches,
  rfqFromPurchaseRequest,
  enrichRFQs,
  enrichQuotations,
  buildComparison,
};
