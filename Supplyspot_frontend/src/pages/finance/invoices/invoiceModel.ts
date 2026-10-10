// Shared types and helpers for the Invoices module.
import { formatCompactMoney, formatDate, formatMoney } from '../../procurement/purchase-orders/poModel';

export { formatCompactMoney, formatDate, formatMoney };

export type InvoiceStatus = 'draft' | 'submitted' | 'approved' | 'paid' | 'disputed';

export interface InvoiceLine {
  poLineIndex: number | null; // null = entered by hand (freight, extras)
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InvoicePayment {
  id: string;
  amount: number;
  paymentDate: string;
  method: string;
  reference: string | null;
  notes: string | null;
  invoiceNumber?: string;
}

export interface HistoryEntry {
  at: string;
  byName: string | null;
  action: string;
  note: string | null;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  vendorInvoiceNumber: string;
  vendorId: string;
  vendorName: string;
  poId: string | null;
  poNumber: string | null;
  grnId: string | null;
  grnNumber: string | null;
  shipmentId: string | null;
  status: InvoiceStatus;
  currency: string;
  lines: InvoiceLine[];
  taxRate: number;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  outstanding: number;
  issueDate: string | null;
  dueDate: string | null;
  paymentDate: string | null;
  isOverdue: boolean;
  daysOverdue: number;
  description: string;
  notes: string;
  disputeReason: string | null;
  history: HistoryEntry[];
  createdAt: string | null;
  updatedAt: string | null;
  // Only on the detail response.
  payments: InvoicePayment[];
  po: { id: string; poNumber: string; status: string; terms: string | null; totalAmount: number; lineItems: { description: string; quantity: number; unitPrice: number; receivedQuantity: number }[] } | null;
  grn: { id: string; grnNumber: string; shipmentId: string; receivedDate: string | null; isFinal: boolean } | null;
  otherInvoices: { id: string; invoice_number: string; status: InvoiceStatus; total_amount: number }[];
}

export const STATUS_META: Record<InvoiceStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  submitted: { label: 'Pending approval', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved: { label: 'Approved', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  paid: { label: 'Paid', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  disputed: { label: 'Disputed', className: 'bg-red-50 text-red-700 border-red-200' },
};

export const OVERDUE_META = { label: 'Overdue', className: 'bg-red-50 text-red-700 border-red-200' };

export const STATUS_FILTERS: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'submitted', label: 'Pending approval' },
  { id: 'approved', label: 'Approved' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'paid', label: 'Paid' },
  { id: 'disputed', label: 'Disputed' },
];

export const LIFECYCLE: { status: InvoiceStatus; label: string }[] = [
  { status: 'draft', label: 'Draft' },
  { status: 'submitted', label: 'Submitted' },
  { status: 'approved', label: 'Approved' },
  { status: 'paid', label: 'Paid' },
];

export const PAYMENT_METHODS: { id: string; label: string }[] = [
  { id: 'bank_transfer', label: 'Bank transfer (NEFT/RTGS)' },
  { id: 'upi', label: 'UPI' },
  { id: 'cheque', label: 'Cheque' },
  { id: 'card', label: 'Card' },
  { id: 'other', label: 'Other' },
];
export const methodLabel = (id: string) => PAYMENT_METHODS.find(m => m.id === id)?.label || id;

// Who can do what, mirroring the API: admin and finance managers raise and approve; only admins pay and dispute.
export const canWrite = (role?: string) => role === 'admin' || role === 'finance_manager';
export const canSettle = (role?: string) => role === 'admin';

const parseArray = (value: any) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value || '[]'); } catch { return []; }
  }
  return [];
};

export const mapPayment = (p: any): InvoicePayment => ({
  id: p.id,
  amount: Number(p.amount) || 0,
  paymentDate: p.payment_date,
  method: p.method || 'other',
  reference: p.reference || null,
  notes: p.notes || null,
  invoiceNumber: p.invoice_number,
});

export function mapInvoice(i: any): Invoice {
  const status = (STATUS_META[i.status as InvoiceStatus] ? i.status : 'draft') as InvoiceStatus;
  return {
    id: i.id,
    invoiceNumber: i.invoice_number,
    vendorInvoiceNumber: i.vendor_invoice_number || '',
    vendorId: i.vendor_id,
    vendorName: i.vendor_name || 'Unknown vendor',
    poId: i.po_id || null,
    poNumber: i.po_number || null,
    grnId: i.grn_id || null,
    grnNumber: i.grn_number || null,
    shipmentId: i.shipment_id || null,
    status,
    currency: i.currency || 'INR',
    lines: parseArray(i.line_items).map((l: any) => ({
      poLineIndex: l.poLineIndex === null || l.poLineIndex === undefined ? null : Number(l.poLineIndex),
      description: l.description || '',
      quantity: Number(l.quantity) || 0,
      unitPrice: Number(l.unitPrice) || 0,
      amount: Number(l.amount ?? (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0)) || 0,
    })),
    taxRate: Number(i.tax_rate) || 0,
    subtotal: Number(i.subtotal) || 0,
    taxAmount: Number(i.tax_amount) || 0,
    totalAmount: Number(i.total_amount) || 0,
    amountPaid: Number(i.amount_paid) || 0,
    outstanding: Number(i.outstanding) || 0,
    issueDate: i.issue_date || null,
    dueDate: i.due_date || null,
    paymentDate: i.payment_date || null,
    isOverdue: !!i.is_overdue,
    daysOverdue: Number(i.days_overdue) || 0,
    description: i.description || '',
    notes: i.notes || '',
    disputeReason: i.dispute_reason || null,
    history: parseArray(i.history).map((h: any) => ({ at: h.at, byName: h.by_name || null, action: h.action, note: h.note || null })),
    createdAt: i.created_at || null,
    updatedAt: i.updated_at || null,
    payments: parseArray(i.payments).map(mapPayment),
    po: i.po
      ? {
        id: i.po.id,
        poNumber: i.po.po_number,
        status: i.po.status,
        terms: i.po.terms || null,
        totalAmount: Number(i.po.total_amount) || 0,
        lineItems: parseArray(i.po.line_items).map((li: any) => ({
          description: li.description || '',
          quantity: Number(li.quantity) || 0,
          unitPrice: Number(li.unitPrice) || 0,
          receivedQuantity: Number(li.receivedQuantity) || 0,
        })),
      }
      : null,
    grn: i.grn
      ? { id: i.grn.id, grnNumber: i.grn.grn_number, shipmentId: i.grn.shipment_id, receivedDate: i.grn.received_date || null, isFinal: !!i.grn.is_final }
      : null,
    otherInvoices: parseArray(i.other_invoices),
  };
}

export const isPartlyPaid = (inv: Invoice) => inv.status === 'approved' && inv.amountPaid > 0;

// Whole days from today to the due date (negative = past due).
export function daysToDue(inv: Invoice): number | null {
  if (!inv.dueDate) return null;
  const due = new Date(`${inv.dueDate}T00:00:00`).getTime();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((due - start) / 86400000);
}

// Due-date hint for unpaid invoices; payment date for paid ones.
export function dueLabel(inv: Invoice): { text: string; tone: 'muted' | 'ok' | 'warn' | 'late' } | null {
  if (inv.status === 'paid') return inv.paymentDate ? { text: `Paid ${formatDate(inv.paymentDate)}`, tone: 'ok' } : null;
  if (inv.status === 'draft') return null;
  if (inv.isOverdue) return { text: `${inv.daysOverdue} day${inv.daysOverdue === 1 ? '' : 's'} overdue`, tone: 'late' };
  const days = daysToDue(inv);
  if (days === null) return null;
  if (days === 0) return { text: 'Due today', tone: 'warn' };
  if (days <= 7) return { text: `Due in ${days} day${days === 1 ? '' : 's'}`, tone: 'warn' };
  return { text: `Due in ${days} days`, tone: 'muted' };
}

export const toneClass = {
  muted: 'text-muted-foreground',
  ok: 'text-emerald-700',
  warn: 'text-amber-700',
  late: 'text-red-600 font-medium',
} as const;

export function formatDateTime(value: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  return isNaN(d.getTime()) ? value : d.toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function formatQty(n: number) {
  return Number.isInteger(n) ? String(n) : n.toLocaleString(undefined, { maximumFractionDigits: 3 });
}

export const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

export function exportInvoicesCsv(invoices: Invoice[], filename: string) {
  const header = ['Invoice', 'Vendor invoice #', 'Vendor', 'PO', 'GRN', 'Status', 'Invoice date', 'Due date', 'Currency', 'Subtotal', 'Tax', 'Total', 'Paid', 'Outstanding', 'Days overdue'];
  const rows = invoices.map(i => [
    i.invoiceNumber, i.vendorInvoiceNumber, i.vendorName, i.poNumber || '', i.grnNumber || '', STATUS_META[i.status].label,
    i.issueDate || '', i.dueDate || '', i.currency, i.subtotal, i.taxAmount, i.totalAmount, i.amountPaid, i.outstanding, i.isOverdue ? i.daysOverdue : '',
  ]);
  const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Sum of an amount across invoices, one figure per currency ("₹4.2L + $1.8K").
export function sumByCurrency(invoices: Invoice[], pick: (i: Invoice) => number, compact = true) {
  const totals = new Map<string, number>();
  invoices.forEach(i => totals.set(i.currency, (totals.get(i.currency) || 0) + pick(i)));
  const parts = [...totals.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  if (!parts.length) return compact ? formatCompactMoney(0, invoices[0]?.currency || 'INR') : formatMoney(0, invoices[0]?.currency || 'INR');
  return parts.map(([c, v]) => (compact ? formatCompactMoney(v, c) : formatMoney(v, c))).join(' + ');
}
