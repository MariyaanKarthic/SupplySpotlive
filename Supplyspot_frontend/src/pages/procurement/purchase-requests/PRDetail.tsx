import React, { useState } from 'react';
import {
  ArrowLeft, Ban, Check, CheckCircle, Clock, Edit3, FilePlus2, FileText, MoreHorizontal, Printer, RotateCcw, Send, Trash2, X, XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Table as UITable, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  CurrentUser, PRHistoryEntry, PRIORITY_META, PurchaseRequest, STATUS_META, canCreateRfq, canDecide, canEdit, formatDate, formatDateTime,
  formatMoney, isOwnerOrAdmin, neededByLabel, neededByOffset, waitingDays,
} from './prModel';

export type PRAction = 'submit' | 'approve' | 'reject' | 'revise' | 'delete' | 'create_rfq';

export interface NextStep {
  action: PRAction;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// The one primary action the current user can take on a request. Shared with the list's row actions.
export function nextStep(pr: PurchaseRequest, user: CurrentUser): NextStep | null {
  if (pr.status === 'draft' && isOwnerOrAdmin(pr, user)) return { action: 'submit', label: 'Submit for approval', icon: Send };
  if (canDecide(pr, user)) return { action: 'approve', label: 'Approve', icon: CheckCircle };
  if (pr.status === 'rejected' && isOwnerOrAdmin(pr, user)) return { action: 'revise', label: 'Revise and resubmit', icon: RotateCcw };
  if (canCreateRfq(pr, user)) return { action: 'create_rfq', label: 'Create RFQ', icon: FilePlus2 };
  return null;
}

export function StatusBadge({ pr, className = '' }: { pr: PurchaseRequest; className?: string }) {
  const meta = STATUS_META[pr.status];
  return <Badge variant="outline" className={`${meta.className} ${className}`}>{meta.label}</Badge>;
}

export function PriorityBadge({ pr }: { pr: PurchaseRequest }) {
  const meta = PRIORITY_META[pr.priority];
  return <Badge variant="outline" className={meta.className}>{meta.label}</Badge>;
}

function Fact({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{children}</dd>
    </div>
  );
}

// Draft → Submitted → Approved / Rejected
function Progress({ pr }: { pr: PurchaseRequest }) {
  const rejected = pr.status === 'rejected';
  const steps = [
    { label: 'Draft', at: pr.createdAt },
    { label: 'Submitted', at: pr.submittedAt },
    { label: rejected ? 'Rejected' : 'Approved', at: pr.approvalDate },
  ];
  const current = { draft: 0, submitted: 1, approved: 2, rejected: 2 }[pr.status];
  return (
    <div className="rounded-lg border bg-card p-4 sm:p-5">
      <ol className="flex items-start" aria-label="Request progress">
        {steps.map((step, i) => {
          const done = i < current || (i === current && i === 2);
          const active = i === current && i < 2;
          const isRejectStep = rejected && i === 2;
          return (
            <li key={step.label} className={`flex items-start ${i < steps.length - 1 ? 'flex-1' : ''}`} aria-current={active ? 'step' : undefined}>
              <div className="flex flex-col items-center text-center min-w-[84px]">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold
                  ${isRejectStep ? 'bg-red-600 border-red-600 text-white'
                    : done ? 'bg-primary border-primary text-primary-foreground'
                      : active ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground'}`}>
                  {isRejectStep ? <X className="w-4 h-4" /> : done ? <Check className="w-4 h-4" /> : i + 1}
                </span>
                <span className={`mt-1.5 text-xs sm:text-sm ${active || done ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{step.label}</span>
                <span className="text-[11px] text-muted-foreground">{i <= current && step.at ? formatDate(step.at.split('T')[0]) : ' '}</span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 pt-3.5 px-1">
                  <div className={`h-1 rounded-full ${i < current ? (rejected && i === 1 ? 'bg-red-300' : 'bg-primary') : 'bg-muted'}`} />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

const HISTORY_META: Record<PRHistoryEntry['action'], { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  created: { label: 'created the request', icon: FileText, tone: 'bg-slate-100 text-slate-600' },
  submitted: { label: 'submitted it for approval', icon: Send, tone: 'bg-amber-50 text-amber-700' },
  approved: { label: 'approved it', icon: CheckCircle, tone: 'bg-emerald-50 text-emerald-700' },
  rejected: { label: 'rejected it', icon: XCircle, tone: 'bg-red-50 text-red-700' },
  revised: { label: 'reopened it as a draft', icon: RotateCcw, tone: 'bg-slate-100 text-slate-600' },
  rfq_created: { label: 'created RFQ', icon: FilePlus2, tone: 'bg-indigo-50 text-indigo-700' },
};

function History({ entries }: { entries: PRHistoryEntry[] }) {
  if (!entries.length) return <p className="text-sm text-muted-foreground">No activity recorded yet.</p>;
  return (
    <ol className="relative space-y-4">
      {[...entries].reverse().map((h, i) => {
        const meta = HISTORY_META[h.action] || HISTORY_META.created;
        return (
          <li key={i} className="flex gap-3">
            <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${meta.tone}`}><meta.icon className="w-3.5 h-3.5" /></span>
            <div className="min-w-0 text-sm">
              <p className="text-foreground">
                <span className="font-medium">{h.userName}</span>{' '}
                <span className="text-muted-foreground">{meta.label}{h.action === 'rfq_created' && h.comment ? ` ${h.comment}` : ''}</span>
              </p>
              <p className="text-xs text-muted-foreground">{formatDateTime(h.at)}</p>
              {h.comment && h.action !== 'rfq_created' && (
                <p className="mt-1.5 rounded-md bg-muted/60 px-3 py-2 text-sm text-foreground whitespace-pre-wrap">{h.comment}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function PRDetail({
  pr,
  user,
  busy,
  onBack,
  onEdit,
  onAction,
  onOpenRfq,
  onCreateRfq,
}: {
  pr: PurchaseRequest;
  user: CurrentUser;
  busy: boolean;
  onBack: () => void;
  onEdit: () => void;
  onAction: (action: PRAction, payload?: any) => Promise<boolean>;
  onOpenRfq: () => void;
  onCreateRfq: () => void;
}) {
  const [dialog, setDialog] = useState<'approve' | 'reject' | 'delete' | null>(null);
  // Keeps the last dialog's content on screen while it animates closed.
  const [shown, setShown] = useState<'approve' | 'reject' | 'delete'>('approve');
  const [comment, setComment] = useState('');
  const [reason, setReason] = useState('');
  const [dialogError, setDialogError] = useState<string | null>(null);

  const step = nextStep(pr, user);
  const decide = canDecide(pr, user);
  const offset = neededByOffset(pr);
  const neededBy = neededByLabel(pr);
  const waiting = waitingDays(pr);
  const itemsTotal = pr.items.reduce((acc, it) => acc + it.budget, 0);

  const openDialog = (d: typeof dialog) => {
    setDialogError(null);
    if (d === 'approve') setComment('');
    if (d === 'reject') setReason('');
    if (d) setShown(d);
    setDialog(d);
  };

  const runStep = () => {
    if (!step) return;
    if (step.action === 'approve') return openDialog('approve');
    // The RFQ is set up on the RFQ page, where vendors are chosen.
    if (step.action === 'create_rfq') return onCreateRfq();
    onAction(step.action);
  };

  const confirmDialog = async () => {
    setDialogError(null);
    let ok = false;
    if (dialog === 'approve') ok = await onAction('approve', { comment: comment.trim() || undefined });
    if (dialog === 'reject') {
      if (!reason.trim()) { setDialogError('Tell the requester why, so they can fix it.'); return; }
      ok = await onAction('reject', { reason: reason.trim() });
    }
    if (dialog === 'delete') ok = await onAction('delete');
    if (ok) setDialog(null);
  };

  let banner: React.ReactNode = null;
  if (pr.status === 'submitted') {
    banner = (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
        <Clock className="w-4 h-4 shrink-0" />
        {decide
          ? `Waiting on your decision${waiting ? ` for ${waiting} day${waiting === 1 ? '' : 's'}` : ''}.`
          : `Waiting on a procurement manager to approve${waiting ? ` (${waiting} day${waiting === 1 ? '' : 's'} so far)` : ''}.`}
      </div>
    );
  } else if (pr.status === 'rejected') {
    banner = (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        <p className="font-medium flex items-center gap-2"><Ban className="w-4 h-4" /> Rejected by {pr.approverName || 'an approver'}</p>
        {pr.rejectionReason && <p className="mt-1 whitespace-pre-wrap">{pr.rejectionReason}</p>}
      </div>
    );
  } else if (pr.status === 'approved') {
    banner = (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <p className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {pr.rfqNumber
            ? <>Sent out for quotation as <span className="font-semibold">{pr.rfqNumber}</span>{pr.rfqStatus ? ` (${pr.rfqStatus.replace(/_/g, ' ')})` : ''}.</>
            : `Approved by ${pr.approverName || 'an approver'}${pr.approvalDate ? ` on ${formatDate(pr.approvalDate.split('T')[0])}` : ''}. Next, create an RFQ to collect vendor quotes.`}
        </p>
        {pr.rfqNumber && <Button size="sm" variant="outline" className="h-8 bg-white no-print" onClick={onOpenRfq}>Open {pr.rfqNumber}</Button>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 no-print shrink-0" onClick={onBack} aria-label="Back to purchase requests">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">{pr.prNumber}</h1>
              <StatusBadge pr={pr} />
              <PriorityBadge pr={pr} />
            </div>
            <p className="mt-1 text-muted-foreground truncate">{pr.title}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 no-print">
          {step && (
            <Button className="gap-2" onClick={runStep} disabled={busy}>
              <step.icon className="w-4 h-4" />
              {busy ? 'Working…' : step.label}
            </Button>
          )}
          {decide && (
            <Button variant="outline" className="gap-2 text-destructive hover:text-destructive" onClick={() => openDialog('reject')} disabled={busy}>
              <XCircle className="w-4 h-4" /> Reject
            </Button>
          )}
          {canEdit(pr, user) && (
            <Button variant="outline" className="gap-2" onClick={onEdit} disabled={busy}>
              <Edit3 className="w-4 h-4" /> Edit
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 w-9 p-0" aria-label="More actions"><MoreHorizontal className="w-4 h-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => window.print()} className="gap-2"><Printer className="w-4 h-4" /> Print / save as PDF</DropdownMenuItem>
              {canEdit(pr, user) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => openDialog('delete')} className="gap-2 text-destructive focus:text-destructive">
                    <Trash2 className="w-4 h-4" /> Delete draft
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Progress pr={pr} />
      {banner}

      <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5 rounded-lg border bg-card p-5">
        <Fact label="Requested by">
          {pr.requesterName}
          {pr.requesterEmail && <span className="block text-xs font-normal text-muted-foreground">{pr.requesterEmail}</span>}
        </Fact>
        <Fact label="Department">{pr.department || '—'}</Fact>
        <Fact label="Estimated budget">{formatMoney(pr.budgetTotal, pr.currency)}</Fact>
        <Fact label="Needed by">
          {formatDate(pr.requestedDate || null)}
          {neededBy && <span className={`block text-xs font-normal ${offset !== null && offset < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>{neededBy}</span>}
        </Fact>
        <Fact label="Created">{formatDateTime(pr.createdAt)}</Fact>
        <Fact label="Submitted">{formatDateTime(pr.submittedAt)}</Fact>
        <Fact label={pr.status === 'rejected' ? 'Rejected by' : 'Approved by'}>
          {pr.approverName || '—'}
          {pr.approvalDate && <span className="block text-xs font-normal text-muted-foreground">{formatDateTime(pr.approvalDate)}</span>}
        </Fact>
        <Fact label="RFQ">
          {pr.rfqNumber ? <button className="text-sm text-primary hover:underline" onClick={onOpenRfq}>{pr.rfqNumber}</button> : '—'}
        </Fact>
      </dl>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Items <span className="text-muted-foreground font-normal">({pr.items.length})</span></h2>
        <div className="rounded-lg border bg-card overflow-x-auto">
          <UITable>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Budget</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pr.items.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No items on this request.</TableCell></TableRow>
              )}
              {pr.items.map((it, i) => (
                <TableRow key={i}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-medium">{it.description}</TableCell>
                  <TableCell className="text-muted-foreground">{it.category}</TableCell>
                  <TableCell className="text-right tabular-nums">{it.quantity} {it.unit}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{formatMoney(it.budget, pr.currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="text-right font-medium">Total budget</TableCell>
                <TableCell className="text-right tabular-nums font-semibold">{formatMoney(itemsTotal || pr.budgetTotal, pr.currency)}</TableCell>
              </TableRow>
            </TableFooter>
          </UITable>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Justification and notes</h2>
          <div className="rounded-lg border bg-card p-4 text-sm text-foreground whitespace-pre-wrap min-h-24">
            {pr.notes || <span className="text-muted-foreground">No notes.</span>}
          </div>
        </section>
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Approval history</h2>
          <div className="rounded-lg border bg-card p-4">
            <History entries={pr.history} />
          </div>
        </section>
      </div>

      <AlertDialog open={dialog === 'delete'} onOpenChange={(o) => { if (!o && !busy) setDialog(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {pr.prNumber}?</AlertDialogTitle>
            <AlertDialogDescription>This draft will be removed permanently.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Back</AlertDialogCancel>
            <AlertDialogAction disabled={busy} className="bg-destructive text-white hover:bg-destructive/90"
              onClick={(e) => { e.preventDefault(); confirmDialog(); }}>
              {busy ? 'Deleting…' : 'Delete draft'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={dialog === 'approve' || dialog === 'reject'} onOpenChange={(o) => { if (!o && !busy) setDialog(null); }}>
        <DialogContent className="sm:max-w-lg">
          {shown === 'approve' && (
            <DialogHeader>
              <DialogTitle>Approve {pr.prNumber}?</DialogTitle>
              <DialogDescription>{pr.title} · {formatMoney(pr.budgetTotal, pr.currency)} for {pr.department}.</DialogDescription>
            </DialogHeader>
          )}
          {shown === 'reject' && (
            <DialogHeader>
              <DialogTitle>Reject {pr.prNumber}?</DialogTitle>
              <DialogDescription>{pr.requesterName} will see your reason and can revise and resubmit.</DialogDescription>
            </DialogHeader>
          )}
          <div className="space-y-3">
            {shown === 'approve' && (
              <div className="space-y-1.5">
                <Label htmlFor="pr-approve-comment">Comment (optional)</Label>
                <Textarea id="pr-approve-comment" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Anything procurement should know" />
              </div>
            )}
            {shown === 'reject' && (
              <div className="space-y-1.5">
                <Label htmlFor="pr-reject-reason">Reason</Label>
                <Textarea id="pr-reject-reason" rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="What needs to change before this can be approved?" autoFocus />
              </div>
            )}
            {dialogError && <p className="text-sm text-destructive" role="alert">{dialogError}</p>}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialog(null)} disabled={busy}>Cancel</Button>
            <Button onClick={confirmDialog} disabled={busy}
              className={shown === 'reject' ? 'bg-destructive text-white hover:bg-destructive/90' : ''}>
              {busy ? 'Working…' : shown === 'approve' ? 'Approve' : 'Reject request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
