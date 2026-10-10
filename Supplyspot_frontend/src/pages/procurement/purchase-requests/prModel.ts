// Shared types and helpers for the Purchase Requests module.
import { formatCompactMoney, formatDate, formatMoney } from '../purchase-orders/poModel';

export { formatCompactMoney, formatDate, formatMoney };

export type PRStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
export type PRPriority = 'low' | 'medium' | 'high';

export interface PRItem {
  description: string;
  quantity: number;
  unit: string;
  budget: number;
  category: string;
}

export interface PRHistoryEntry {
  action: 'created' | 'submitted' | 'approved' | 'rejected' | 'revised' | 'rfq_created';
  userId: string;
  userName: string;
  at: string;
  comment?: string;
}

export interface PurchaseRequest {
  id: string;
  prNumber: string;
  title: string;
  status: PRStatus;
  requesterId: string;
  requesterName: string;
  requesterEmail: string | null;
  department: string;
  requestedDate: string;
  priority: PRPriority;
  currency: string;
  budgetTotal: number;
  items: PRItem[];
  notes: string;
  submittedAt: string | null;
  approvalDate: string | null;
  approverId: string | null;
  approverName: string | null;
  rejectionReason: string | null;
  rfqId: string | null;
  rfqNumber: string | null;
  rfqStatus: string | null;
  history: PRHistoryEntry[];
  createdAt: string | null;
  updatedAt: string | null;
}

export const STATUS_META: Record<PRStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  submitted: { label: 'Awaiting approval', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved: { label: 'Approved', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected', className: 'bg-red-50 text-red-700 border-red-200' },
};

export const PRIORITY_META: Record<PRPriority, { label: string; className: string }> = {
  high: { label: 'High', className: 'bg-red-50 text-red-700 border-red-200' },
  medium: { label: 'Medium', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  low: { label: 'Low', className: 'bg-slate-50 text-slate-600 border-slate-200' },
};

export const STATUS_FILTERS: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'submitted', label: 'Awaiting approval' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];

export const DEPARTMENTS = ['Admin', 'Facilities', 'Finance', 'HR', 'IT', 'Marketing', 'Operations', 'Production', 'R&D', 'Sales'];

export const CATEGORIES = ['IT Hardware', 'Software', 'Office Supplies', 'Raw Materials', 'MRO', 'Services', 'Facilities', 'Logistics', 'Marketing', 'Other'];

export const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];

// Roles that may raise requests, and roles that may approve them (mirrors routes/purchaseRequests.js).
export const REQUEST_ROLES = ['admin', 'procurement_manager', 'finance_manager', 'ap_clerk'];
export const APPROVER_ROLES = ['admin', 'procurement_manager'];

export interface CurrentUser {
  id: string | null;
  role: string | null;
}

export const canRequest = (user: CurrentUser) => !!user.role && REQUEST_ROLES.includes(user.role);
export const canApprove = (user: CurrentUser) => !!user.role && APPROVER_ROLES.includes(user.role);
export const isOwnerOrAdmin = (pr: PurchaseRequest, user: CurrentUser) => pr.requesterId === user.id || user.role === 'admin';
// Approvers cannot decide their own requests, except admins.
export const canDecide = (pr: PurchaseRequest, user: CurrentUser) =>
  pr.status === 'submitted' && canApprove(user) && (pr.requesterId !== user.id || user.role === 'admin');
export const canEdit = (pr: PurchaseRequest, user: CurrentUser) => pr.status === 'draft' && isOwnerOrAdmin(pr, user);
export const canCreateRfq = (pr: PurchaseRequest, user: CurrentUser) => pr.status === 'approved' && !pr.rfqId && canApprove(user);

// SQLite returns timestamps as "YYYY-MM-DD HH:MM:SS" (UTC) or as epoch milliseconds; Postgres returns ISO strings.
export function parseTimestamp(value: any): Date | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return new Date(value);
  const s = String(value);
  if (/^\d+$/.test(s)) return new Date(Number(s));
  const d = new Date(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s) ? `${s.replace(' ', 'T')}Z` : s);
  return isNaN(d.getTime()) ? null : d;
}

const toIso = (value: any) => parseTimestamp(value)?.toISOString() ?? null;
const toDate = (value: any) => {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return parseTimestamp(value)?.toISOString().split('T')[0] ?? '';
};

const parseArray = (value: any) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value || '[]'); } catch { return []; }
  }
  return [];
};

export function mapPurchaseRequest(pr: any): PurchaseRequest {
  const status = (STATUS_META[pr.status as PRStatus] ? pr.status : 'draft') as PRStatus;
  const priority = (PRIORITY_META[pr.priority as PRPriority] ? pr.priority : 'medium') as PRPriority;
  return {
    id: pr.id,
    prNumber: pr.pr_number,
    title: pr.title || '',
    status,
    requesterId: pr.requester_id,
    requesterName: pr.requester_name || 'Unknown',
    requesterEmail: pr.requester_email || null,
    department: pr.department || '',
    requestedDate: toDate(pr.requested_date),
    priority,
    currency: pr.currency || 'INR',
    budgetTotal: Number(pr.budget_total) || 0,
    items: parseArray(pr.items).map((it: any) => ({
      description: it.description || '',
      quantity: Number(it.quantity) || 0,
      unit: it.unit || 'pcs',
      budget: Number(it.budget) || 0,
      category: it.category || 'Other',
    })),
    notes: pr.notes || '',
    submittedAt: toIso(pr.submitted_at),
    approvalDate: toIso(pr.approval_date),
    approverId: pr.approver_id || null,
    approverName: pr.approver_name || null,
    rejectionReason: pr.rejection_reason || null,
    rfqId: pr.rfq_id || null,
    rfqNumber: pr.rfq_number || null,
    rfqStatus: pr.rfq_status || null,
    history: parseArray(pr.history).map((h: any) => ({ ...h, at: toIso(h.at) || h.at })),
    createdAt: toIso(pr.created_at),
    updatedAt: toIso(pr.updated_at),
  };
}

export function formatDateTime(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

// Days until the needed-by date (negative when past). Null once the request is decided.
export function neededByOffset(pr: PurchaseRequest): number | null {
  if (!pr.requestedDate || pr.status === 'approved' || pr.status === 'rejected') return null;
  const due = new Date(`${pr.requestedDate}T00:00:00`).getTime();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((due - start) / 86400000);
}

export function neededByLabel(pr: PurchaseRequest) {
  const offset = neededByOffset(pr);
  if (offset === null) return null;
  if (offset === 0) return 'Needed today';
  if (offset > 0) return `In ${offset} day${offset === 1 ? '' : 's'}`;
  return `${-offset} day${offset === -1 ? '' : 's'} past`;
}

// Whole days a submitted request has been waiting for a decision.
export function waitingDays(pr: PurchaseRequest): number | null {
  if (pr.status !== 'submitted' || !pr.submittedAt) return null;
  return Math.max(0, Math.floor((Date.now() - new Date(pr.submittedAt).getTime()) / 86400000));
}

const csvCell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;

// One row per item so the export opens cleanly in Excel.
export function exportPurchaseRequestsCsv(prs: PurchaseRequest[], filename: string) {
  const headers = ['PR Number', 'Title', 'Status', 'Priority', 'Department', 'Requester', 'Created', 'Needed By', 'Currency', 'PR Budget',
    'Item #', 'Item', 'Category', 'Quantity', 'Unit', 'Item Budget', 'Approver', 'Decision Date', 'RFQ'];
  const rows: unknown[][] = [];
  prs.forEach(pr => {
    const base = [pr.prNumber, pr.title, STATUS_META[pr.status].label, PRIORITY_META[pr.priority].label, pr.department, pr.requesterName,
      pr.createdAt?.split('T')[0] || '', pr.requestedDate, pr.currency, pr.budgetTotal];
    const tail = [pr.approverName || '', pr.approvalDate?.split('T')[0] || '', pr.rfqNumber || ''];
    if (!pr.items.length) rows.push([...base, '', '', '', '', '', '', ...tail]);
    pr.items.forEach((it, i) => rows.push([...base, i + 1, it.description, it.category, it.quantity, it.unit, it.budget, ...tail]));
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
