// One colour language for every status pill in the app.
// draft = gray, waiting on someone = amber, in progress = blue, done/approved = green, rejected/blocked = red.
export type StatusTone = 'neutral' | 'pending' | 'info' | 'success' | 'danger' | 'muted';

export const STATUS_TONE_CLASS: Record<StatusTone, string> = {
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  muted: 'bg-slate-50 text-slate-500 border-slate-200',
};

/** Badge classes for a tone, including the leading status dot (see `.status-pill` in index.css). */
export const statusClass = (tone: StatusTone) => `status-pill ${STATUS_TONE_CLASS[tone]}`;

const EXACT: Record<string, StatusTone> = {
  draft: 'neutral', new: 'neutral',
  submitted: 'pending', pending: 'pending', pending_approval: 'pending', under_review: 'pending', awaiting_approval: 'pending',
  sent: 'info', quotations_received: 'info', in_transit: 'info', acknowledged: 'info', partially_received: 'info', reviewed: 'info', in_progress: 'info',
  approved: 'success', accepted: 'success', awarded: 'success', received: 'success', delivered: 'success', paid: 'success', completed: 'success',
  rejected: 'danger', cancelled: 'danger', canceled: 'danger', disputed: 'danger', delayed: 'danger', overdue: 'danger',
  closed: 'muted', archived: 'muted',
};

const TONE_KEYWORDS: [StatusTone, string[]][] = [
  ['danger', ['reject', 'cancel', 'disput', 'delay', 'overdue', 'fail', 'expired', 'non_compliant', 'non-compliant', 'blocked', 'exception', 'critical', 'inactive', 'suspend', 'declin', 'error']],
  ['success', ['approved', 'accept', 'award', 'received', 'delivered', 'paid', 'complete', 'verified', 'certified', 'active', 'passed', 'resolved', 'success', 'compliant']],
  ['pending', ['pending', 'submitted', 'awaiting', 'review', 'waiting', 'expiring', 'due', 'hold', 'open', 'draft_review']],
  ['info', ['sent', 'transit', 'progress', 'acknowledged', 'partial', 'processing', 'scheduled', 'shipped', 'quotations_received', 'new']],
  ['muted', ['closed', 'archived']],
];

/** Best-guess tone for a free-text status (for screens without their own status table). */
export function toneForStatus(status: string | null | undefined): StatusTone {
  const s = String(status || '').toLowerCase().replace(/\s+/g, '_');
  if (!s) return 'neutral';
  if (EXACT[s]) return EXACT[s];
  for (const [tone, words] of TONE_KEYWORDS) if (words.some(w => s.includes(w))) return tone;
  return 'neutral';
}

export const humanizeStatus = (status: string) =>
  status.replace(/[_-]+/g, ' ').replace(/^\w/, c => c.toUpperCase());
