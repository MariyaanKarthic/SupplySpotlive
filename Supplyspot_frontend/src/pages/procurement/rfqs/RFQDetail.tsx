import React, { useState } from 'react';
import {
  Archive, ArchiveRestore, ArrowLeft, Award, Ban, CalendarClock, Check, CheckCircle, ClipboardList, Clock, Edit3, Eye, FilePlus2, FileText,
  Inbox, Lock, MoreHorizontal, Printer, Scale, Send, ShoppingCart, Trash2, XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Table as UITable, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  LIFECYCLE, QUOTATION_STATUS_META, Quotation, RFQ, RFQHistoryEntry, STATUS_META, dueLabel, dueOffset, formatDate, formatDateTime, formatMoney,
  isExpired, isOpenForQuotes, isPendingQuote,
} from './rfqModel';
import { QuotationComparison } from './QuotationComparison';

export type RFQAction = 'send' | 'start_review' | 'close' | 'delete';
export type QuoteAction = 'review' | 'accept' | 'reject' | 'archive' | 'unarchive';

export function StatusBadge({ rfq, className = '' }: { rfq: RFQ; className?: string }) {
  const meta = STATUS_META[rfq.status];
  return <Badge variant="outline" className={`${meta.className} ${className}`}>{meta.label}</Badge>;
}

export function QuoteStatusBadge({ q }: { q: Quotation }) {
  const meta = QUOTATION_STATUS_META[q.status];
  return <Badge variant="outline" className={meta.className}>{q.archived ? 'Archived' : meta.label}</Badge>;
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{children}</dd>
    </div>
  );
}

// Draft → Sent → Quotations received → Under review → Awarded. A closed RFQ shows where it stopped.
function Lifecycle({ rfq }: { rfq: RFQ }) {
  const closed = rfq.status === 'closed';
  const awardedBeforeClose = closed && !!rfq.awardedQuotationId;
  // For a closed RFQ, work out the furthest step it reached from what it holds.
  const reached = closed
    ? (awardedBeforeClose ? 4 : rfq.quotationCount > 0 ? 2 : rfq.sentAt ? 1 : 0)
    : LIFECYCLE.findIndex(s => s.status === rfq.status);
  const dates: Record<string, string | null> = {
    draft: rfq.createdAt,
    sent: rfq.sentAt,
    awarded: rfq.awardedAt,
  };
  return (
    <div className="rounded-lg border bg-card p-4 sm:p-5 overflow-x-auto">
      <ol className="flex items-start min-w-[560px]" aria-label="RFQ progress">
        {LIFECYCLE.map((step, i) => {
          const done = i < reached || (i === reached && (step.status === 'awarded' || closed));
          const active = i === reached && !done;
          return (
            <li key={step.status} className={`flex items-start ${i < LIFECYCLE.length - 1 ? 'flex-1' : ''}`} aria-current={active ? 'step' : undefined}>
              <div className="flex flex-col items-center text-center min-w-[92px]">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold
                  ${done ? 'bg-primary border-primary text-primary-foreground' : active ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground'}`}>
                  {done ? <Check className="w-4 h-4" /> : i + 1}
                </span>
                <span className={`mt-1.5 text-xs sm:text-sm ${active || done ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{step.label}</span>
                <span className="text-[11px] text-muted-foreground">{i <= reached && dates[step.status] ? formatDate(dates[step.status]!.split('T')[0]) : ' '}</span>
              </div>
              {i < LIFECYCLE.length - 1 && (
                <div className="flex-1 pt-3.5 px-1">
                  <div className={`h-1 rounded-full ${i < reached ? 'bg-primary' : 'bg-muted'}`} />
                </div>
              )}
            </li>
          );
        })}
        {closed && (
          <li className="flex items-start pl-2">
            <div className="flex flex-col items-center text-center min-w-[80px]">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border bg-slate-600 border-slate-600 text-white"><Lock className="w-3.5 h-3.5" /></span>
              <span className="mt-1.5 text-xs sm:text-sm font-semibold text-foreground">Closed</span>
              <span className="text-[11px] text-muted-foreground">{rfq.closedAt ? formatDate(rfq.closedAt.split('T')[0]) : ' '}</span>
            </div>
          </li>
        )}
      </ol>
    </div>
  );
}

const HISTORY_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  created: { label: 'created the RFQ', icon: FileText, tone: 'bg-slate-100 text-slate-600' },
  sent: { label: 'sent it to', icon: Send, tone: 'bg-indigo-50 text-indigo-700' },
  quotation_received: { label: 'recorded a quotation from', icon: Inbox, tone: 'bg-cyan-50 text-cyan-700' },
  review_started: { label: 'started reviewing quotations', icon: Eye, tone: 'bg-amber-50 text-amber-700' },
  quotation_rejected: { label: 'rejected', icon: XCircle, tone: 'bg-red-50 text-red-700' },
  awarded: { label: 'awarded it to', icon: Award, tone: 'bg-emerald-50 text-emerald-700' },
  po_created: { label: 'created purchase order', icon: ShoppingCart, tone: 'bg-emerald-50 text-emerald-700' },
  closed: { label: 'closed the RFQ', icon: Lock, tone: 'bg-slate-100 text-slate-600' },
};

function History({ entries }: { entries: RFQHistoryEntry[] }) {
  if (!entries.length) return <p className="text-sm text-muted-foreground">No activity recorded yet.</p>;
  return (
    <ol className="space-y-4">
      {[...entries].reverse().map((h, i) => {
        const meta = HISTORY_META[h.action] || HISTORY_META.created;
        const inline = ['sent', 'quotation_received', 'quotation_rejected', 'awarded', 'po_created'].includes(h.action);
        return (
          <li key={i} className="flex gap-3">
            <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${meta.tone}`}><meta.icon className="w-3.5 h-3.5" /></span>
            <div className="min-w-0 text-sm">
              <p className="text-foreground">
                <span className="font-medium">{h.userName}</span>{' '}
                <span className="text-muted-foreground">{meta.label}{inline && h.comment ? ` ${h.comment}` : ''}{h.action === 'created' && h.comment ? ` from ${h.comment}` : ''}</span>
              </p>
              <p className="text-xs text-muted-foreground">{formatDateTime(h.at)}</p>
              {h.comment && h.action === 'closed' && <p className="mt-1.5 rounded-md bg-muted/60 px-3 py-2 text-sm text-foreground whitespace-pre-wrap">{h.comment}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function QuotationCard({
  q, rfq, canAct, busy, onAction, onCompare,
}: {
  q: Quotation;
  rfq: RFQ;
  canAct: boolean;
  busy: boolean;
  onAction: (action: QuoteAction) => void;
  onCompare: () => void;
}) {
  const pending = isPendingQuote(q);
  const decidable = canAct && pending && isOpenForQuotes(rfq);
  const expired = isExpired(q) && pending;
  const vsBudget = rfq.budget ? q.totalAmount - rfq.budget : null;
  const isLowest = rfq.lowestQuote?.id === q.id && pending && (rfq.quotations || []).filter(isPendingQuote).length > 1;
  const covered = rfq.items.filter((_, i) => q.items.some(li => li.rfqItemIndex === i)).length;
  return (
    <div className={`rounded-lg border bg-card p-4 flex flex-col gap-3 ${q.status === 'accepted' ? 'border-emerald-300 ring-1 ring-emerald-200' : ''} ${q.archived ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-foreground truncate">{q.vendorName}</p>
          <p className="text-xs text-muted-foreground">{q.quotationNumber} · received {formatDate(q.submittedAt?.split('T')[0] || null)}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <QuoteStatusBadge q={q} />
          {isLowest && <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Lowest</Badge>}
        </div>
      </div>
      <div>
        <p className="text-2xl font-semibold tabular-nums text-foreground">{formatMoney(q.totalAmount, q.currency)}</p>
        {vsBudget !== null && (
          <p className={`text-xs ${vsBudget > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
            {formatMoney(Math.abs(vsBudget), q.currency)} {vsBudget > 0 ? 'over' : 'under'} budget
          </p>
        )}
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div><dt className="text-xs text-muted-foreground">Delivery</dt><dd className="font-medium">{formatDate(q.deliveryDate || null)}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Payment terms</dt><dd className="font-medium">{q.paymentTerms || '—'}</dd></div>
        <div>
          <dt className="text-xs text-muted-foreground">Valid until</dt>
          <dd className={`font-medium ${expired ? 'text-red-600' : ''}`}>{formatDate(q.validUntil || null)}{expired ? ' (expired)' : ''}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Items quoted</dt>
          <dd className={`font-medium ${covered < rfq.items.length ? 'text-amber-700' : ''}`}>{covered} of {rfq.items.length}</dd>
        </div>
      </dl>
      {q.notes && <p className="text-xs text-muted-foreground line-clamp-2">{q.notes}</p>}
      {q.status === 'rejected' && q.rejectionReason && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-800">{q.rejectionReason}</p>
      )}
      {q.status === 'accepted' && q.poNumber && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-800 flex items-center gap-1.5"><ShoppingCart className="w-3.5 h-3.5" /> Purchase order {q.poNumber}</p>
      )}
      <div className="mt-auto flex flex-wrap gap-2 pt-1 no-print">
        {decidable && (
          <>
            <Button size="sm" className="gap-1.5" disabled={busy || expired} onClick={() => onAction('accept')} title={expired ? 'This quotation has expired' : undefined}>
              <Award className="w-3.5 h-3.5" /> Accept
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 text-destructive hover:text-destructive" disabled={busy} onClick={() => onAction('reject')}>
              <XCircle className="w-3.5 h-3.5" /> Reject
            </Button>
            {q.status === 'submitted' && (
              <Button size="sm" variant="ghost" className="gap-1.5" disabled={busy} onClick={() => onAction('review')}>
                <Eye className="w-3.5 h-3.5" /> Mark reviewed
              </Button>
            )}
          </>
        )}
        {canAct && q.status === 'rejected' && (
          <Button size="sm" variant="ghost" className="gap-1.5" disabled={busy} onClick={() => onAction(q.archived ? 'unarchive' : 'archive')}>
            {q.archived ? <><ArchiveRestore className="w-3.5 h-3.5" /> Restore</> : <><Archive className="w-3.5 h-3.5" /> Archive</>}
          </Button>
        )}
        {!decidable && q.status !== 'rejected' && (
          <Button size="sm" variant="ghost" className="gap-1.5" onClick={onCompare}><Scale className="w-3.5 h-3.5" /> Compare</Button>
        )}
      </div>
    </div>
  );
}

export function RFQDetail({
  rfq,
  canAct,
  busy,
  busyQuoteId,
  tab,
  onTabChange,
  comparisonKey,
  onBack,
  onEdit,
  onRecordQuote,
  onAction,
  onQuoteAction,
  onOpenPR,
  onOpenPO,
}: {
  rfq: RFQ;
  canAct: boolean;
  busy: boolean;
  busyQuoteId: string | null;
  tab: string;
  onTabChange: (tab: string) => void;
  comparisonKey: number;
  onBack: () => void;
  onEdit: () => void;
  onRecordQuote: (vendorId?: string) => void;
  onAction: (action: RFQAction, payload?: any) => Promise<boolean>;
  onQuoteAction: (q: Quotation, action: QuoteAction, payload?: any) => Promise<boolean>;
  onOpenPR: () => void;
  onOpenPO: () => void;
}) {
  const [dialog, setDialog] = useState<null | { kind: 'close' | 'delete' | 'send' | 'accept' | 'reject'; quote?: Quotation }>(null);
  const [shown, setShown] = useState<typeof dialog>(null);
  const [text, setText] = useState('');
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const quotations = rfq.quotations || [];
  const visibleQuotes = quotations.filter(q => showArchived || !q.archived);
  const archivedCount = quotations.filter(q => q.archived).length;
  const pendingQuotes = quotations.filter(isPendingQuote);
  const offset = dueOffset(rfq);
  const due = dueLabel(rfq);
  const respondedIds = new Set(rfq.respondedVendorIds);
  const itemsBudget = rfq.items.reduce((acc, it) => acc + it.budget, 0);
  const dialogBusy = busy || (!!dialog?.quote && busyQuoteId === dialog.quote.id);

  const openDialog = (d: NonNullable<typeof dialog>) => {
    setText('');
    setDialogError(null);
    setShown(d);
    setDialog(d);
  };

  const confirm = async () => {
    if (!dialog) return;
    setDialogError(null);
    let ok = false;
    if (dialog.kind === 'close') {
      if (rfq.status !== 'awarded' && !text.trim()) { setDialogError('Say why the RFQ is closing without an award.'); return; }
      ok = await onAction('close', { reason: text.trim() || undefined });
    }
    if (dialog.kind === 'delete') ok = await onAction('delete');
    if (dialog.kind === 'send') ok = await onAction('send');
    if (dialog.kind === 'accept' && dialog.quote) ok = await onQuoteAction(dialog.quote, 'accept', { notes: text.trim() || undefined });
    if (dialog.kind === 'reject' && dialog.quote) {
      if (!text.trim()) { setDialogError('Give the reason, so the decision is on record.'); return; }
      ok = await onQuoteAction(dialog.quote, 'reject', { reason: text.trim() });
    }
    if (ok) setDialog(null);
  };

  const quoteAction = (q: Quotation, action: QuoteAction) => {
    if (action === 'accept' || action === 'reject') return openDialog({ kind: action, quote: q });
    onQuoteAction(q, action);
  };
  const quoteById = (id: string) => quotations.find(q => q.id === id);

  // The single primary action for the RFQ's current state.
  let primary: React.ReactNode = null;
  if (canAct) {
    if (rfq.status === 'draft') {
      primary = rfq.vendorIds.length
        ? <Button className="gap-2" onClick={() => openDialog({ kind: 'send' })} disabled={busy}><Send className="w-4 h-4" /> Send to {rfq.vendorIds.length} vendor{rfq.vendorIds.length === 1 ? '' : 's'}</Button>
        : <Button className="gap-2" onClick={onEdit} disabled={busy}><Send className="w-4 h-4" /> Choose vendors</Button>;
    } else if (isOpenForQuotes(rfq)) {
      primary = (
        <>
          {pendingQuotes.length > 1 && tab !== 'compare' && (
            <Button className="gap-2" onClick={() => onTabChange('compare')}><Scale className="w-4 h-4" /> Compare {pendingQuotes.length} quotes</Button>
          )}
          <Button variant={pendingQuotes.length > 1 && tab !== 'compare' ? 'outline' : 'default'} className="gap-2" onClick={() => onRecordQuote()} disabled={busy}>
            <FilePlus2 className="w-4 h-4" /> Record quotation
          </Button>
        </>
      );
    } else if (rfq.status === 'awarded' && rfq.poNumber) {
      primary = <Button className="gap-2" onClick={onOpenPO}><ShoppingCart className="w-4 h-4" /> Open {rfq.poNumber}</Button>;
    }
  }

  let banner: React.ReactNode = null;
  if (rfq.status === 'draft') {
    banner = (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 flex items-center gap-2">
        <FileText className="w-4 h-4 shrink-0" />
        {rfq.vendorIds.length ? `Ready to send to ${rfq.vendorIds.length} vendor${rfq.vendorIds.length === 1 ? '' : 's'}.` : 'Choose the vendors to invite, then send the RFQ.'}
      </div>
    );
  } else if (rfq.status === 'sent' || rfq.status === 'quotations_received') {
    const late = offset !== null && offset < 0;
    banner = (
      <div className={`rounded-lg border px-4 py-3 text-sm flex items-center gap-2 ${late ? 'border-red-200 bg-red-50 text-red-800' : 'border-indigo-200 bg-indigo-50 text-indigo-800'}`}>
        <CalendarClock className="w-4 h-4 shrink-0" />
        {rfq.respondedVendorIds.length} of {rfq.vendorIds.length} vendors have quoted. Quotations are due {formatDate(rfq.dueDate || null)}{due ? ` (${due.toLowerCase()})` : ''}.
        {late && pendingQuotes.length > 0 && ' You can review what has arrived.'}
      </div>
    );
  } else if (rfq.status === 'under_review') {
    banner = (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
        <Eye className="w-4 h-4 shrink-0" />
        {pendingQuotes.length} quotation{pendingQuotes.length === 1 ? '' : 's'} still in the running. Accepting one awards the RFQ and creates a draft purchase order.
      </div>
    );
  } else if (rfq.status === 'awarded') {
    banner = (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <p className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Awarded to <span className="font-semibold">{rfq.awardedVendorName}</span> for {formatMoney(rfq.awardedAmount || 0, rfq.currency)}
          {rfq.poNumber ? <> · purchase order <span className="font-semibold">{rfq.poNumber}</span>{rfq.poStatus === 'new' ? ' (draft)' : ''}</> : null}.
        </p>
        {rfq.poNumber && <Button size="sm" variant="outline" className="h-8 bg-white no-print" onClick={onOpenPO}>Open purchase order</Button>}
      </div>
    );
  } else if (rfq.status === 'closed') {
    banner = (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <p className="font-medium flex items-center gap-2"><Ban className="w-4 h-4" /> Closed{rfq.awardedVendorName ? ` after awarding ${rfq.awardedVendorName}` : ' without an award'}</p>
        {rfq.closeReason && <p className="mt-1 whitespace-pre-wrap">{rfq.closeReason}</p>}
      </div>
    );
  }

  const dq = shown?.quote;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 no-print shrink-0" onClick={onBack} aria-label="Back to RFQs">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">{rfq.rfqNumber}</h1>
              <StatusBadge rfq={rfq} />
            </div>
            <p className="mt-1 text-muted-foreground truncate">{rfq.title}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 no-print">
          {primary}
          {canAct && rfq.status === 'draft' && (
            <Button variant="outline" className="gap-2" onClick={onEdit} disabled={busy}><Edit3 className="w-4 h-4" /> Edit</Button>
          )}
          {canAct && rfq.status === 'quotations_received' && (
            <Button variant="outline" className="gap-2" onClick={() => onAction('start_review')} disabled={busy}><Eye className="w-4 h-4" /> Start review</Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 w-9 p-0" aria-label="More actions"><MoreHorizontal className="w-4 h-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {rfq.prNumber && <DropdownMenuItem onClick={onOpenPR} className="gap-2"><ClipboardList className="w-4 h-4" /> Open {rfq.prNumber}</DropdownMenuItem>}
              <DropdownMenuItem onClick={() => window.print()} className="gap-2"><Printer className="w-4 h-4" /> Print / save as PDF</DropdownMenuItem>
              {canAct && rfq.status !== 'closed' && rfq.status !== 'draft' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => openDialog({ kind: 'close' })} className="gap-2"><Lock className="w-4 h-4" /> Close RFQ</DropdownMenuItem>
                </>
              )}
              {canAct && rfq.status === 'draft' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => openDialog({ kind: 'delete' })} className="gap-2 text-destructive focus:text-destructive"><Trash2 className="w-4 h-4" /> Delete draft</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Lifecycle rfq={rfq} />
      {banner}

      <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5 rounded-lg border bg-card p-5">
        <Fact label="Purchase request">
          {rfq.prNumber ? (
            <button className="text-sm text-primary hover:underline text-left" onClick={onOpenPR}>{rfq.prNumber}</button>
          ) : '—'}
          {rfq.prDepartment && <span className="block text-xs font-normal text-muted-foreground">{rfq.prDepartment}</span>}
        </Fact>
        <Fact label="Budget">{rfq.budget !== null ? formatMoney(rfq.budget, rfq.currency) : '—'}</Fact>
        <Fact label="Quotations due">
          {formatDate(rfq.dueDate || null)}
          {due && <span className={`block text-xs font-normal ${offset !== null && offset < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>{due}</span>}
        </Fact>
        <Fact label="Sent">{rfq.sentAt ? formatDateTime(rfq.sentAt) : 'Not yet'}</Fact>
        <Fact label="Vendors invited">{rfq.vendorIds.length}</Fact>
        <Fact label="Quotations">{rfq.quotationCount}</Fact>
        <Fact label="Lowest quote">
          {rfq.lowestQuote ? formatMoney(rfq.lowestQuote.amount, rfq.currency) : '—'}
          {rfq.lowestQuote && <span className="block text-xs font-normal text-muted-foreground">{rfq.lowestQuote.vendorName}</span>}
        </Fact>
        <Fact label="Purchase order">
          {rfq.poNumber ? <button className="text-sm text-primary hover:underline" onClick={onOpenPO}>{rfq.poNumber}</button> : '—'}
        </Fact>
      </dl>

      <Tabs value={tab} onValueChange={onTabChange} className="space-y-4">
        <TabsList className="no-print">
          <TabsTrigger value="quotations">Quotations ({quotations.filter(q => !q.archived).length})</TabsTrigger>
          <TabsTrigger value="compare" disabled={!quotations.length}>Compare</TabsTrigger>
          <TabsTrigger value="details">Items and vendors</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="quotations" className="space-y-3">
          {archivedCount > 0 && (
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setShowArchived(s => !s)}>
                <Archive className="w-3.5 h-3.5" /> {showArchived ? 'Hide' : 'Show'} archived ({archivedCount})
              </Button>
            </div>
          )}
          {visibleQuotes.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center">
              <Inbox className="w-10 h-10 mx-auto text-muted-foreground/40" />
              {rfq.status === 'draft' ? (
                <>
                  <p className="mt-3 font-medium text-foreground">Not sent yet</p>
                  <p className="text-sm text-muted-foreground">Send the RFQ to vendors to start collecting quotations.</p>
                </>
              ) : (
                <>
                  <p className="mt-3 font-medium text-foreground">No quotations yet</p>
                  <p className="text-sm text-muted-foreground">When a vendor replies, record their prices here to compare them.</p>
                  {canAct && isOpenForQuotes(rfq) && <Button className="mt-4 gap-2" onClick={() => onRecordQuote()}><FilePlus2 className="w-4 h-4" /> Record quotation</Button>}
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {visibleQuotes.map(q => (
                <QuotationCard key={q.id} q={q} rfq={rfq} canAct={canAct} busy={busyQuoteId === q.id}
                  onAction={(a) => quoteAction(q, a)} onCompare={() => onTabChange('compare')} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="compare">
          {tab === 'compare' && (
            <QuotationComparison
              rfq={rfq}
              canDecide={canAct}
              busyId={busyQuoteId}
              refreshKey={comparisonKey}
              onAccept={(id) => { const q = quoteById(id); if (q) openDialog({ kind: 'accept', quote: q }); }}
              onReject={(id) => { const q = quoteById(id); if (q) openDialog({ kind: 'reject', quote: q }); }}
            />
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Items <span className="text-muted-foreground font-normal">({rfq.items.length})</span></h2>
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
                  {rfq.items.map((it, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">{it.description}</TableCell>
                      <TableCell className="text-muted-foreground">{it.category}</TableCell>
                      <TableCell className="text-right tabular-nums">{it.quantity} {it.unit}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatMoney(it.budget, rfq.currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4} className="text-right font-medium">Total budget</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">{formatMoney(rfq.budget ?? itemsBudget, rfq.currency)}</TableCell>
                  </TableRow>
                </TableFooter>
              </UITable>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-foreground">Invited vendors <span className="text-muted-foreground font-normal">({rfq.vendors.length})</span></h2>
              <div className="rounded-lg border bg-card divide-y">
                {rfq.vendors.length === 0 && <p className="p-4 text-sm text-muted-foreground">No vendors chosen yet.</p>}
                {rfq.vendors.map(v => {
                  const quote = quotations.find(q => q.vendorId === v.id && !q.archived);
                  return (
                    <div key={v.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{v.name}</p>
                        <p className="text-xs text-muted-foreground">{v.email || <span className="capitalize">{v.category}</span>}</p>
                      </div>
                      {quote ? (
                        <span className="text-right shrink-0">
                          <span className="block font-medium tabular-nums">{formatMoney(quote.totalAmount, quote.currency)}</span>
                          <span className="text-xs text-muted-foreground">{QUOTATION_STATUS_META[quote.status].label}</span>
                        </span>
                      ) : rfq.status === 'draft' ? (
                        <span className="text-xs text-muted-foreground">Not sent</span>
                      ) : respondedIds.has(v.id) ? (
                        <span className="text-xs text-muted-foreground">Quote archived</span>
                      ) : canAct && isOpenForQuotes(rfq) ? (
                        <Button size="sm" variant="ghost" className="h-8 gap-1.5" onClick={() => onRecordQuote(v.id)}><FilePlus2 className="w-3.5 h-3.5" /> Record quote</Button>
                      ) : (
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> No response</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-foreground">Instructions for vendors</h2>
              <div className="rounded-lg border bg-card p-4 text-sm text-foreground whitespace-pre-wrap min-h-24">
                {rfq.notes || <span className="text-muted-foreground">No instructions.</span>}
              </div>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <div className="rounded-lg border bg-card p-4 max-w-2xl">
            <History entries={rfq.history} />
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!dialog} onOpenChange={(o) => { if (!o && !dialogBusy) setDialog(null); }}>
        <DialogContent className="sm:max-w-lg">
          {shown?.kind === 'send' && (
            <DialogHeader>
              <DialogTitle>Send {rfq.rfqNumber} to {rfq.vendorIds.length} vendor{rfq.vendorIds.length === 1 ? '' : 's'}?</DialogTitle>
              <DialogDescription>{rfq.vendors.map(v => v.name).join(', ')}. Quotations are due {formatDate(rfq.dueDate || null)}. The RFQ can't be edited after it is sent.</DialogDescription>
            </DialogHeader>
          )}
          {shown?.kind === 'delete' && (
            <DialogHeader>
              <DialogTitle>Delete {rfq.rfqNumber}?</DialogTitle>
              <DialogDescription>The draft is removed{rfq.prNumber ? ` and ${rfq.prNumber} becomes ready for a new RFQ` : ''}.</DialogDescription>
            </DialogHeader>
          )}
          {shown?.kind === 'close' && (
            <DialogHeader>
              <DialogTitle>Close {rfq.rfqNumber}?</DialogTitle>
              <DialogDescription>
                {rfq.status === 'awarded' ? 'Closing marks sourcing as finished. The purchase order is not affected.'
                  : `No quotation will be awarded${pendingQuotes.length ? `, and the ${pendingQuotes.length} open quotation${pendingQuotes.length === 1 ? ' is' : 's are'} declined` : ''}.`}
              </DialogDescription>
            </DialogHeader>
          )}
          {shown?.kind === 'accept' && dq && (
            <DialogHeader>
              <DialogTitle>Award {rfq.rfqNumber} to {dq.vendorName}?</DialogTitle>
              <DialogDescription>
                A draft purchase order for {formatMoney(dq.totalAmount, dq.currency)} is created from {dq.quotationNumber}
                {pendingQuotes.length > 1 ? `, and the other ${pendingQuotes.length - 1} open quotation${pendingQuotes.length - 1 === 1 ? ' is' : 's are'} declined` : ''}.
              </DialogDescription>
            </DialogHeader>
          )}
          {shown?.kind === 'reject' && dq && (
            <DialogHeader>
              <DialogTitle>Reject {dq.vendorName}'s quotation?</DialogTitle>
              <DialogDescription>{dq.quotationNumber} · {formatMoney(dq.totalAmount, dq.currency)}. Rejected quotations can be archived later.</DialogDescription>
            </DialogHeader>
          )}

          {(shown?.kind === 'close' || shown?.kind === 'accept' || shown?.kind === 'reject') && (
            <div className="space-y-1.5">
              <Label htmlFor="rfq-dialog-text">
                {shown.kind === 'reject' ? 'Reason' : shown.kind === 'close' ? (rfq.status === 'awarded' ? 'Note (optional)' : 'Reason') : 'Note for the purchase order (optional)'}
              </Label>
              <Textarea id="rfq-dialog-text" rows={3} value={text} onChange={(e) => { setDialogError(null); setText(e.target.value); }} autoFocus
                placeholder={shown.kind === 'reject' ? 'e.g. Above budget, delivery too late, missing items' : shown.kind === 'close' ? 'e.g. Requirement dropped, budget moved' : 'Anything the PO approver should know'} />
            </div>
          )}
          {dialogError && <p className="text-sm text-destructive" role="alert">{dialogError}</p>}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialog(null)} disabled={dialogBusy}>Cancel</Button>
            <Button onClick={confirm} disabled={dialogBusy}
              className={shown?.kind === 'reject' || shown?.kind === 'delete' ? 'bg-destructive text-white hover:bg-destructive/90' : ''}>
              {dialogBusy ? 'Working…'
                : shown?.kind === 'send' ? 'Send RFQ'
                  : shown?.kind === 'delete' ? 'Delete draft'
                    : shown?.kind === 'close' ? 'Close RFQ'
                      : shown?.kind === 'accept' ? 'Award and create PO'
                        : 'Reject quotation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

