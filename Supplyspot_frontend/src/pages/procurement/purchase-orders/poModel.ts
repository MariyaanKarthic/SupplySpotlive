// Shared types and helpers for the Purchase Orders module.

export type POStatus =
  | 'new'
  | 'pending_approval'
  | 'approved'
  | 'sent'
  | 'acknowledged'
  | 'partially_received'
  | 'received'
  | 'closed'
  | 'cancelled';

export type POPriority = 'low' | 'medium' | 'high';

export interface POLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  deliveryDate?: string | null;
  receivedQuantity: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  vendorEmail: string | null;
  rfqId: string | null;
  rfqNumber: string | null;
  issueDate: string;
  expectedDeliveryDate: string;
  totalAmount: number;
  currency: string;
  status: POStatus;
  priority: POPriority;
  acknowledgmentStatus: 'pending' | 'acknowledged';
  acknowledgmentDate: string | null;
  lineItems: POLineItem[];
  deliveryAddress: string;
  terms: string;
  notes: string;
  attachments: { name: string; size?: number }[];
  createdAt: string | null;
  updatedAt: string | null;
}

export const STATUS_META: Record<POStatus, { label: string; className: string }> = {
  new: { label: 'Draft', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  pending_approval: { label: 'Pending approval', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved: { label: 'Approved', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  sent: { label: 'Sent to vendor', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  acknowledged: { label: 'Acknowledged', className: 'bg-violet-50 text-violet-700 border-violet-200' },
  partially_received: { label: 'Partially received', className: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  received: { label: 'Received', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  closed: { label: 'Closed', className: 'bg-slate-100 text-slate-500 border-slate-200' },
  cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-700 border-red-200' },
};

export const PRIORITY_META: Record<POPriority, { label: string; className: string }> = {
  high: { label: 'High', className: 'bg-red-50 text-red-700 border-red-200' },
  medium: { label: 'Medium', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  low: { label: 'Low', className: 'bg-slate-50 text-slate-600 border-slate-200' },
};

// Filter chips shown above the list; each maps to one or more backend statuses.
export const STATUS_FILTERS: { id: string; label: string; statuses: POStatus[] | null }[] = [
  { id: 'all', label: 'All', statuses: null },
  { id: 'draft', label: 'Draft', statuses: ['new'] },
  { id: 'pending_approval', label: 'Pending approval', statuses: ['pending_approval'] },
  { id: 'approved', label: 'Ready to send', statuses: ['approved'] },
  { id: 'with_vendor', label: 'With vendor', statuses: ['sent', 'acknowledged'] },
  { id: 'receiving', label: 'Receiving', statuses: ['partially_received'] },
  { id: 'received', label: 'Received', statuses: ['received'] },
  { id: 'closed', label: 'Closed / cancelled', statuses: ['closed', 'cancelled'] },
];

// The happy-path lifecycle shown as a stepper on the detail page.
export const LIFECYCLE: { status: POStatus; label: string }[] = [
  { status: 'new', label: 'Draft' },
  { status: 'pending_approval', label: 'Approval' },
  { status: 'approved', label: 'Approved' },
  { status: 'sent', label: 'Sent' },
  { status: 'acknowledged', label: 'Acknowledged' },
  { status: 'received', label: 'Received' },
  { status: 'closed', label: 'Closed' },
];

export const lifecycleIndex = (status: POStatus) => {
  if (status === 'partially_received') return LIFECYCLE.findIndex(s => s.status === 'received');
  return LIFECYCLE.findIndex(s => s.status === status);
};

export const isEditable = (po: PurchaseOrder) => po.status === 'new' || po.status === 'pending_approval';
export const isOpen = (po: PurchaseOrder) => !['received', 'closed', 'cancelled'].includes(po.status);

const toDate = (value: any) => (value ? new Date(value).toISOString().split('T')[0] : '');

const parseArray = (value: any) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value || '[]'); } catch { return []; }
  }
  return [];
};

export function mapPurchaseOrder(po: any): PurchaseOrder {
  const lineItems: POLineItem[] = parseArray(po.line_items).map((li: any) => {
    const quantity = Number(li.quantity) || 0;
    const unitPrice = Number(li.unitPrice ?? li.unit_price) || 0;
    return {
      description: li.description ?? li.item ?? '',
      quantity,
      unitPrice,
      totalAmount: Number(li.totalAmount ?? li.total) || quantity * unitPrice,
      deliveryDate: li.deliveryDate || null,
      receivedQuantity: Number(li.receivedQuantity) || 0,
    };
  });
  const status = (STATUS_META[po.status as POStatus] ? po.status : 'new') as POStatus;
  const priority = (PRIORITY_META[po.priority as POPriority] ? po.priority : 'medium') as POPriority;
  return {
    id: po.id,
    poNumber: po.po_number,
    vendorId: po.vendor_id,
    vendorName: po.vendor_name || 'Unknown vendor',
    vendorEmail: po.vendor_email || null,
    rfqId: po.rfq_id || null,
    rfqNumber: po.rfq_number || null,
    issueDate: toDate(po.issue_date),
    expectedDeliveryDate: toDate(po.expected_delivery_date),
    totalAmount: Number(po.total_amount) || 0,
    currency: po.currency || 'USD',
    status,
    priority,
    acknowledgmentStatus: po.acknowledgment_status === 'acknowledged' ? 'acknowledged' : 'pending',
    acknowledgmentDate: po.acknowledgment_date ? toDate(po.acknowledgment_date) : null,
    lineItems,
    deliveryAddress: po.delivery_address || '',
    terms: po.terms || '',
    notes: po.notes || '',
    attachments: parseArray(po.attachments).map((a: any) => (typeof a === 'string' ? { name: a } : a)),
    createdAt: po.created_at || null,
    updatedAt: po.updated_at || null,
  };
}

export function formatMoney(amount: number, currency = 'USD') {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export function formatCompactMoney(amount: number, currency = 'USD') {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1 }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export function formatDate(value: string | null) {
  if (!value) return '—';
  const d = new Date(`${value}T00:00:00`);
  return isNaN(d.getTime()) ? value : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

// Days until expected delivery (negative when late). Null when not relevant any more.
export function deliveryOffset(po: PurchaseOrder): number | null {
  if (!po.expectedDeliveryDate || !isOpen(po)) return null;
  const due = new Date(`${po.expectedDeliveryDate}T00:00:00`).getTime();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((due - start) / 86400000);
}

export const isOverdue = (po: PurchaseOrder) => {
  const offset = deliveryOffset(po);
  return offset !== null && offset < 0 && ['sent', 'acknowledged', 'partially_received'].includes(po.status);
};

export function deliveryLabel(po: PurchaseOrder) {
  const offset = deliveryOffset(po);
  if (offset === null) return null;
  if (offset === 0) return 'Due today';
  if (offset > 0) return `In ${offset} day${offset === 1 ? '' : 's'}`;
  return `${-offset} day${offset === -1 ? '' : 's'} late`;
}

const csvCell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;

// One row per line item so the export opens cleanly in Excel.
export function exportPurchaseOrdersCsv(pos: PurchaseOrder[], filename: string) {
  const headers = ['PO Number', 'Vendor', 'Status', 'Priority', 'Issue Date', 'Expected Delivery', 'Currency', 'PO Total',
    'Line #', 'Item', 'Quantity', 'Unit Price', 'Line Total', 'Received Qty', 'Terms', 'Delivery Address'];
  const rows: unknown[][] = [];
  pos.forEach(po => {
    const base = [po.poNumber, po.vendorName, STATUS_META[po.status].label, PRIORITY_META[po.priority].label,
      po.issueDate, po.expectedDeliveryDate, po.currency, po.totalAmount];
    const tail = [po.terms, po.deliveryAddress];
    if (!po.lineItems.length) rows.push([...base, '', '', '', '', '', '', ...tail]);
    po.lineItems.forEach((li, i) => rows.push([...base, i + 1, li.description, li.quantity, li.unitPrice, li.totalAmount, li.receivedQuantity, ...tail]));
  });
  const csv = [headers, ...rows].map(r => r.map(csvCell).join(',')).join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
