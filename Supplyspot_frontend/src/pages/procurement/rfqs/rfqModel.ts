// Shared types and helpers for the RFQ and quotation module.
import { formatCompactMoney, formatDate, formatMoney } from '../purchase-orders/poModel';
import { formatDateTime, parseTimestamp } from '../purchase-requests/prModel';

export { formatCompactMoney, formatDate, formatDateTime, formatMoney };

export type RFQStatus = 'draft' | 'sent' | 'quotations_received' | 'under_review' | 'awarded' | 'closed';
export type QuotationStatus = 'submitted' | 'reviewed' | 'accepted' | 'rejected';

export interface RFQItem {
  description: string;
  quantity: number;
  unit: string;
  category: string;
  budget: number;
}

export interface RFQVendor {
  id: string;
  name: string;
  category?: string;
  status?: string;
  rating?: number;
  email?: string | null;
}

export interface QuotationItem {
  rfqItemIndex: number | null;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  rfqId: string;
  rfqNumber: string | null;
  vendorId: string;
  vendorName: string;
  vendorEmail: string | null;
  vendorRating: number | null;
  status: QuotationStatus;
  totalAmount: number;
  currency: string;
  deliveryDate: string;
  paymentTerms: string;
  validUntil: string;
  notes: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  decidedAt: string | null;
  rejectionReason: string | null;
  archived: boolean;
  purchaseOrderId: string | null;
  poNumber: string | null;
  items: QuotationItem[];
}

export interface RFQHistoryEntry {
  action: string;
  userId: string;
  userName: string;
  at: string;
  comment?: string;
}

export interface RFQ {
  id: string;
  rfqNumber: string;
  title: string;
  description: string;
  category: string;
  status: RFQStatus;
  priority: 'low' | 'medium' | 'high';
  currency: string;
  budget: number | null;
  dueDate: string;
  sentAt: string | null;
  notes: string;
  items: RFQItem[];
  vendorIds: string[];
  vendors: RFQVendor[];
  respondedVendorIds: string[];
  purchaseRequestId: string | null;
  prNumber: string | null;
  prTitle: string | null;
  prDepartment: string | null;
  quotationCount: number;
  openQuotationCount: number;
  lowestQuote: { id: string; amount: number; vendorName: string; partial: boolean } | null;
  awardedQuotationId: string | null;
  awardedVendorName: string | null;
  awardedAmount: number | null;
  awardedAt: string | null;
  closedAt: string | null;
  closeReason: string | null;
  poId: string | null;
  poNumber: string | null;
  poStatus: string | null;
  createdByName: string | null;
  history: RFQHistoryEntry[];
  quotations: Quotation[] | null; // only on the detail response
  createdAt: string | null;
  updatedAt: string | null;
}

export const STATUS_META: Record<RFQStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  sent: { label: 'Awaiting quotations', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  quotations_received: { label: 'Quotations received', className: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  under_review: { label: 'Under review', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  awarded: { label: 'Awarded', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  closed: { label: 'Closed', className: 'bg-slate-100 text-slate-500 border-slate-200' },
};

export const QUOTATION_STATUS_META: Record<QuotationStatus, { label: string; className: string }> = {
  submitted: { label: 'Submitted', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  reviewed: { label: 'Reviewed', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  accepted: { label: 'Accepted', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected', className: 'bg-red-50 text-red-700 border-red-200' },
};

// Filter chips above the list; each maps to one or more statuses.
export const STATUS_FILTERS: { id: string; label: string; statuses: RFQStatus[] | null }[] = [
  { id: 'all', label: 'All', statuses: null },
  { id: 'draft', label: 'Drafts', statuses: ['draft'] },
  { id: 'awaiting', label: 'Awaiting quotations', statuses: ['sent'] },
  { id: 'review', label: 'Quotes to review', statuses: ['quotations_received', 'under_review'] },
  { id: 'awarded', label: 'Awarded', statuses: ['awarded'] },
  { id: 'closed', label: 'Closed', statuses: ['closed'] },
];

export const LIFECYCLE: { status: RFQStatus; label: string }[] = [
  { status: 'draft', label: 'Draft' },
  { status: 'sent', label: 'Sent' },
  { status: 'quotations_received', label: 'Quotations received' },
  { status: 'under_review', label: 'Under review' },
  { status: 'awarded', label: 'Awarded' },
];

export const PAYMENT_TERMS = ['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Advance', '50% advance, 50% on delivery', 'On delivery'];

// Mirrors WRITE_ROLES in routes/rfqs.js and routes/quotations.js.
export const SOURCING_ROLES = ['admin', 'procurement_manager'];
export const canManage = (role: string | null | undefined) => !!role && SOURCING_ROLES.includes(role);

export const isOpenForQuotes = (rfq: RFQ) => ['sent', 'quotations_received', 'under_review'].includes(rfq.status);
export const isPendingQuote = (q: Quotation) => q.status === 'submitted' || q.status === 'reviewed';

const toIso = (value: any) => parseTimestamp(value)?.toISOString() ?? null;
const toDate = (value: any) => {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  return parseTimestamp(value)?.toISOString().split('T')[0] ?? '';
};
const parseArray = (value: any) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value || '[]'); } catch { return []; }
  }
  return [];
};
const numOrNull = (v: any) => (v === null || v === undefined || v === '' ? null : Number(v));

export function mapQuotation(q: any): Quotation {
  return {
    id: q.id,
    quotationNumber: q.quotation_number,
    rfqId: q.rfq_id,
    rfqNumber: q.rfq_number || null,
    vendorId: q.vendor_id,
    vendorName: q.vendor_name || 'Unknown vendor',
    vendorEmail: q.vendor_email || null,
    vendorRating: numOrNull(q.vendor_rating),
    status: (QUOTATION_STATUS_META[q.status as QuotationStatus] ? q.status : 'submitted') as QuotationStatus,
    totalAmount: Number(q.total_amount) || 0,
    currency: q.currency || 'INR',
    deliveryDate: toDate(q.delivery_date),
    paymentTerms: q.payment_terms || '',
    validUntil: toDate(q.valid_until),
    notes: q.notes || '',
    submittedAt: toIso(q.submitted_at || q.created_at),
    reviewedAt: toIso(q.reviewed_at),
    decidedAt: toIso(q.decided_at),
    rejectionReason: q.rejection_reason || null,
    archived: !!q.archived_at,
    purchaseOrderId: q.purchase_order_id || null,
    poNumber: q.po_number || null,
    items: parseArray(q.items).map((it: any) => ({
      rfqItemIndex: it.rfq_item_index === null || it.rfq_item_index === undefined ? null : Number(it.rfq_item_index),
      description: it.description || '',
      quantity: Number(it.quantity) || 0,
      unit: it.unit || 'pcs',
      unitPrice: Number(it.unit_price) || 0,
      totalPrice: Number(it.total_price) || 0,
    })),
  };
}

export function mapRFQ(r: any): RFQ {
  return {
    id: r.id,
    rfqNumber: r.rfq_number,
    title: r.title || '',
    description: r.description || '',
    category: r.category || '',
    status: (STATUS_META[r.status as RFQStatus] ? r.status : 'draft') as RFQStatus,
    priority: ['low', 'medium', 'high'].includes(r.priority) ? r.priority : 'medium',
    currency: r.currency || 'INR',
    budget: numOrNull(r.budget),
    dueDate: toDate(r.due_date),
    sentAt: toIso(r.sent_at),
    notes: r.notes || '',
    items: parseArray(r.items).map((it: any) => ({
      description: it.description || '',
      quantity: Number(it.quantity) || 0,
      unit: it.unit || 'pcs',
      category: it.category || 'Other',
      budget: Number(it.budget) || 0,
    })),
    vendorIds: parseArray(r.vendor_ids),
    vendors: parseArray(r.vendors),
    respondedVendorIds: parseArray(r.responded_vendor_ids),
    purchaseRequestId: r.purchase_request_id || null,
    prNumber: r.pr_number || null,
    prTitle: r.pr_title || null,
    prDepartment: r.pr_department || null,
    quotationCount: Number(r.quotation_count) || 0,
    openQuotationCount: Number(r.open_quotation_count) || 0,
    lowestQuote: r.lowest_quote
      ? { id: r.lowest_quote.id, amount: Number(r.lowest_quote.amount) || 0, vendorName: r.lowest_quote.vendor_name, partial: !!r.lowest_quote.partial }
      : null,
    awardedQuotationId: r.awarded_quotation_id || null,
    awardedVendorName: r.awarded_vendor_name || null,
    awardedAmount: numOrNull(r.awarded_amount),
    awardedAt: toIso(r.awarded_at),
    closedAt: toIso(r.closed_at),
    closeReason: r.close_reason || null,
    poId: r.po_id || null,
    poNumber: r.po_number || null,
    poStatus: r.po_status || null,
    createdByName: r.created_by_name || null,
    history: parseArray(r.history).map((h: any) => ({ ...h, at: toIso(h.at) || h.at })),
    quotations: Array.isArray(r.quotations) ? r.quotations.map(mapQuotation) : null,
    createdAt: toIso(r.created_at),
    updatedAt: toIso(r.updated_at),
  };
}

export interface ComparisonColumn {
  id: string;
  quotationNumber: string;
  vendorId: string;
  vendorName: string;
  vendorRating: number | null;
  status: QuotationStatus;
  currency: string;
  totalAmount: number;
  deliveryDate: string | null;
  deliveryDays: number | null;
  paymentTerms: string | null;
  validUntil: string | null;
  expired: boolean;
  notes: string | null;
  itemsCovered: number;
  itemsTotal: number;
  vsBudget: number | null;
  vsLowest: number | null;
  rank: number | null;
}

export interface Comparison {
  rfq: { id: string; rfq_number: string; status: RFQStatus; currency: string; budget: number | null; awarded_quotation_id: string | null };
  columns: ComparisonColumn[];
  items: {
    index: number;
    description: string;
    quantity: number;
    unit: string;
    budget: number;
    prices: Record<string, { quantity: number; unitPrice: number | null; totalPrice: number; quantityShort: boolean } | null>;
    lowestQuotationId: string | null;
  }[];
  extras: Record<string, { total: number; lines: string[] }>;
  summary: { lowestTotalId: string | null; fastestDeliveryId: string | null; spread: number };
}

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
};

// Days until quotations are due (negative when past). Null once the RFQ no longer waits on vendors.
export function dueOffset(rfq: RFQ): number | null {
  if (!rfq.dueDate || !['draft', 'sent', 'quotations_received'].includes(rfq.status)) return null;
  return Math.round((new Date(`${rfq.dueDate}T00:00:00`).getTime() - startOfToday()) / 86400000);
}

export function dueLabel(rfq: RFQ) {
  const offset = dueOffset(rfq);
  if (offset === null) return null;
  if (offset === 0) return 'Due today';
  if (offset > 0) return `${offset} day${offset === 1 ? '' : 's'} left`;
  return `${-offset} day${offset === -1 ? '' : 's'} past due`;
}

export const todayIso = () => new Date().toISOString().split('T')[0];
export const inDaysIso = (days: number) => new Date(Date.now() + days * 86400000).toISOString().split('T')[0];

export const isExpired = (q: Quotation) => !!q.validUntil && q.validUntil < todayIso();

const csvCell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export function exportRFQsCsv(rfqs: RFQ[], filename: string) {
  const headers = ['RFQ Number', 'Title', 'Status', 'Purchase Request', 'Currency', 'Budget', 'Due Date', 'Vendors Invited',
    'Quotations', 'Lowest Quote', 'Lowest Vendor', 'Awarded To', 'Awarded Amount', 'PO'];
  const rows = rfqs.map(r => [r.rfqNumber, r.title, STATUS_META[r.status].label, r.prNumber || '', r.currency, r.budget ?? '', r.dueDate,
    r.vendorIds.length, r.quotationCount, r.lowestQuote?.amount ?? '', r.lowestQuote?.vendorName || '', r.awardedVendorName || '',
    r.awardedAmount ?? '', r.poNumber || '']);
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
