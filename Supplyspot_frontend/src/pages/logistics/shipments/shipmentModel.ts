// Shared types and helpers for the Shipment Tracking module.

export type ShipmentStatus = 'pending' | 'in_transit' | 'delayed' | 'delivered' | 'partially_received' | 'cancelled';
export type TrackingEventType = 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception';

export interface ShipmentItem {
  poLineIndex: number;
  description: string;
  quantity: number;
  receivedQuantity: number;
}

export interface TrackingEvent {
  id: string;
  statusEvent: TrackingEventType;
  eventDate: string;
  location: string | null;
  temperature: number | null;
  notes: string | null;
}

export interface ReceiptLine {
  poLineIndex: number;
  description: string;
  shippedQuantity: number;
  previouslyReceived: number;
  receivedQuantity: number;
  shortQuantity: number;
  reason: string | null;
}

export interface Receipt {
  id: string;
  grnNumber: string;
  receivedDate: string;
  items: ReceiptLine[];
  isFinal: boolean;
  appliedToPo: boolean;
  notes: string | null;
  createdAt: string | null;
}

export interface Shipment {
  id: string;
  shipmentNumber: string;
  poId: string;
  poNumber: string | null;
  poStatus: string | null;
  vendorId: string;
  vendorName: string;
  status: ShipmentStatus;
  expectedDeliveryDate: string | null;
  actualDeliveryDate: string | null;
  shippedDate: string | null;
  carrierName: string;
  trackingNumber: string;
  originAddress: string;
  destinationAddress: string;
  items: ShipmentItem[];
  shippedQuantity: number;
  receivedQuantity: number;
  notes: string;
  cancelReason: string | null;
  isOverdue: boolean;
  delayDays: number | null;
  latestEvent: { statusEvent: TrackingEventType; eventDate: string; location: string | null } | null;
  receiptCount: number;
  createdAt: string | null;
  updatedAt: string | null;
  // Only on the detail response.
  events: TrackingEvent[];
  receipts: Receipt[];
  isClosed: boolean;
  po: { id: string; poNumber: string; status: string; currency: string; lineItems: { description: string; quantity: number; unitPrice: number; receivedQuantity: number }[] } | null;
  otherShipments: { id: string; shipment_number: string; status: ShipmentStatus }[];
}

export const STATUS_META: Record<ShipmentStatus, { label: string; className: string }> = {
  pending: { label: 'Awaiting dispatch', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  in_transit: { label: 'In transit', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  delayed: { label: 'Delayed', className: 'bg-red-50 text-red-700 border-red-200' },
  delivered: { label: 'Delivered', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  partially_received: { label: 'Partially received', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  cancelled: { label: 'Cancelled', className: 'bg-slate-100 text-slate-500 border-slate-200' },
};

export const EVENT_META: Record<TrackingEventType, { label: string; dot: string }> = {
  picked_up: { label: 'Picked up', dot: 'bg-indigo-500' },
  in_transit: { label: 'In transit', dot: 'bg-blue-500' },
  out_for_delivery: { label: 'Out for delivery', dot: 'bg-violet-500' },
  delivered: { label: 'Delivered', dot: 'bg-emerald-500' },
  exception: { label: 'Exception', dot: 'bg-red-500' },
};

// Filter chips above the list. 'delayed' on the server also matches anything past its expected date.
export const STATUS_FILTERS: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'pending', label: 'Awaiting dispatch' },
  { id: 'in_transit', label: 'In transit' },
  { id: 'delayed', label: 'Delayed' },
  { id: 'partially_received', label: 'Partially received' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

// Journey shown as a progress timeline on the detail page.
export const JOURNEY: { id: string; label: string }[] = [
  { id: 'created', label: 'Created' },
  { id: 'picked_up', label: 'Picked up' },
  { id: 'in_transit', label: 'In transit' },
  { id: 'out_for_delivery', label: 'Out for delivery' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'received', label: 'Received' },
];

// Index of the furthest journey step reached, from the status and the events logged.
export function journeyIndex(s: Shipment): number {
  const seen = new Set(s.events.map(e => e.statusEvent));
  if (s.isClosed && s.status === 'delivered') return 5;
  if (s.status === 'delivered' || s.status === 'partially_received' || seen.has('delivered')) return 4;
  if (seen.has('out_for_delivery')) return 3;
  if (seen.has('in_transit') || s.status === 'in_transit' || s.status === 'delayed') return seen.has('picked_up') || s.shippedDate ? 2 : 1;
  if (seen.has('picked_up') || s.shippedDate) return 1;
  return 0;
}

const parseArray = (value: any) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value || '[]'); } catch { return []; }
  }
  return [];
};

const mapEvent = (e: any): TrackingEvent => ({
  id: e.id,
  statusEvent: e.status_event,
  eventDate: e.event_date,
  location: e.location || null,
  temperature: e.temperature === null || e.temperature === undefined ? null : Number(e.temperature),
  notes: e.notes || null,
});

export const mapReceipt = (r: any): Receipt => ({
  id: r.id,
  grnNumber: r.grn_number,
  receivedDate: r.received_date,
  items: parseArray(r.items),
  isFinal: !!r.is_final,
  appliedToPo: !!r.applied_to_po,
  notes: r.notes || null,
  createdAt: r.created_at || null,
});

export function mapShipment(s: any): Shipment {
  const status = (STATUS_META[s.status as ShipmentStatus] ? s.status : 'pending') as ShipmentStatus;
  return {
    id: s.id,
    shipmentNumber: s.shipment_number,
    poId: s.po_id,
    poNumber: s.po_number || null,
    poStatus: s.po_status || null,
    vendorId: s.vendor_id,
    vendorName: s.vendor_name || 'Unknown vendor',
    status,
    expectedDeliveryDate: s.expected_delivery_date || null,
    actualDeliveryDate: s.actual_delivery_date || null,
    shippedDate: s.shipped_date || null,
    carrierName: s.carrier_name || '',
    trackingNumber: s.tracking_number || '',
    originAddress: s.origin_address || '',
    destinationAddress: s.destination_address || '',
    items: parseArray(s.items).map((it: any) => ({
      poLineIndex: Number(it.poLineIndex),
      description: it.description || '',
      quantity: Number(it.quantity) || 0,
      receivedQuantity: Number(it.receivedQuantity) || 0,
    })),
    shippedQuantity: Number(s.shipped_quantity) || 0,
    receivedQuantity: Number(s.received_quantity) || 0,
    notes: s.notes || '',
    cancelReason: s.cancel_reason || null,
    isOverdue: !!s.is_overdue,
    delayDays: s.delay_days === null || s.delay_days === undefined ? null : Number(s.delay_days),
    latestEvent: s.latest_event
      ? { statusEvent: s.latest_event.status_event, eventDate: s.latest_event.event_date, location: s.latest_event.location || null }
      : null,
    receiptCount: Number(s.receipt_count) || 0,
    createdAt: s.created_at || null,
    updatedAt: s.updated_at || null,
    events: parseArray(s.events).map(mapEvent),
    receipts: parseArray(s.receipts).map(mapReceipt),
    isClosed: !!s.is_closed,
    po: s.po
      ? {
        id: s.po.id,
        poNumber: s.po.po_number,
        status: s.po.status,
        currency: s.po.currency || 'USD',
        lineItems: parseArray(s.po.line_items).map((li: any) => ({
          description: li.description || '',
          quantity: Number(li.quantity) || 0,
          unitPrice: Number(li.unitPrice) || 0,
          receivedQuantity: Number(li.receivedQuantity) || 0,
        })),
      }
      : null,
    otherShipments: parseArray(s.other_shipments),
  };
}

// Delayed in the UI means flagged by an exception or simply past the expected date.
export const isDelayed = (s: Shipment) => s.status === 'delayed' || s.isOverdue;
export const isMoving = (s: Shipment) => ['pending', 'in_transit', 'delayed'].includes(s.status);
export const canReceive = (s: Shipment) => s.status !== 'cancelled' && !s.isClosed;

export function formatDate(value: string | null) {
  if (!value) return '—';
  const d = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return isNaN(d.getTime()) ? value : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(value: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  return isNaN(d.getTime()) ? value : d.toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function formatQty(n: number) {
  return Number.isInteger(n) ? String(n) : n.toLocaleString(undefined, { maximumFractionDigits: 3 });
}

// Whole days from today to the expected date (negative = late).
export function daysToExpected(s: Shipment): number | null {
  if (!s.expectedDeliveryDate) return null;
  const due = new Date(`${s.expectedDeliveryDate}T00:00:00`).getTime();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((due - start) / 86400000);
}

// ETA countdown for shipments still on the way; delivery outcome for finished ones.
export function etaLabel(s: Shipment): { text: string; tone: 'muted' | 'ok' | 'warn' | 'late' } | null {
  if (s.status === 'cancelled') return null;
  if (s.actualDeliveryDate && s.expectedDeliveryDate) {
    const diff = s.delayDays ?? 0;
    if (diff > 0) return { text: `Arrived ${diff} day${diff === 1 ? '' : 's'} late`, tone: 'late' };
    if (diff < 0) return { text: `Arrived ${-diff} day${diff === -1 ? '' : 's'} early`, tone: 'ok' };
    return { text: 'Arrived on time', tone: 'ok' };
  }
  if (!isMoving(s)) return null;
  const days = daysToExpected(s);
  if (days === null) return null;
  if (days < 0) return { text: `${-days} day${days === -1 ? '' : 's'} overdue`, tone: 'late' };
  if (days === 0) return { text: 'Due today', tone: 'warn' };
  if (days === 1) return { text: 'Due tomorrow', tone: 'warn' };
  return { text: `Due in ${days} days`, tone: 'muted' };
}

export const toneClass = {
  muted: 'text-muted-foreground',
  ok: 'text-emerald-700',
  warn: 'text-amber-700',
  late: 'text-red-600 font-medium',
} as const;
