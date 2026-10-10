import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, ArrowLeft, Ban, Check, CheckCircle2, CircleDollarSign, Edit3, FileText, MoreHorizontal, RotateCcw, Send, ShieldCheck, Trash2, Undo2,
} from 'lucide-react';
import { invoiceService } from '@/services/api';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Invoice, LIFECYCLE, STATUS_META, dueLabel, formatDate, formatDateTime, formatMoney, formatQty, isPartlyPaid, methodLabel, toneClass,
} from './invoiceModel';
import { InvoiceStatusBadge } from './InvoiceList';
import { PaymentDialog, ReasonDialog } from './InvoiceDialogs';

export type InvoiceAction = 'submit' | 'approve' | 'return' | 'pay' | 'dispute' | 'resolve' | 'delete';

function Fact({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{children}</dd>
    </div>
  );
}

function Lifecycle({ inv }: { inv: Invoice }) {
  if (inv.status === 'disputed') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
        <Ban className="w-4 h-4 mt-0.5 shrink-0" />
        <span>Disputed{inv.disputeReason ? `: ${inv.disputeReason}` : '.'} Payment is on hold until the dispute is resolved, which sends it back for approval.</span>
      </div>
    );
  }
  const current = LIFECYCLE.findIndex(s => s.status === inv.status);
  return (
    <ol className="flex items-center overflow-x-auto pb-1" aria-label="Invoice progress">
      {LIFECYCLE.map((step, i) => {
        const done = i <= current;
        const label = step.status === 'paid' && isPartlyPaid(inv) ? 'Part paid' : step.label;
        return (
          <li key={step.status} className="flex items-center shrink-0" aria-current={i === current ? 'step' : undefined}>
            <div className="flex items-center gap-2">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold
                ${done ? 'bg-primary border-primary text-primary-foreground' : i === current + 1 ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground'}`}>
                {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </span>
              <span className={`text-xs sm:text-sm ${i === current ? 'font-semibold text-foreground' : done ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
            </div>
            {i < LIFECYCLE.length - 1 && <span className={`mx-2 sm:mx-3 h-px w-8 sm:w-14 ${i < current ? 'bg-primary' : 'bg-border'}`} />}
          </li>
        );
      })}
    </ol>
  );
}

interface MatchLine {
  poLineIndex: number;
  description: string;
  ordered: number;
  received: number;
  billed_total: number;
  this_invoice: number;
  po_unit_price: number;
  invoice_unit_price: number;
  result: 'matched' | 'price_mismatch' | 'over_received' | 'not_received';
}

const MATCH_META: Record<MatchLine['result'], { label: string; className: string }> = {
  matched: { label: 'Matches', className: 'text-emerald-700' },
  price_mismatch: { label: 'Price differs from PO', className: 'text-red-600 font-medium' },
  over_received: { label: 'Billed more than received', className: 'text-amber-700 font-medium' },
  not_received: { label: 'Not received yet', className: 'text-amber-700' },
};

// PO vs goods received vs this bill, line by line. Advisory only: approval is still a person's call.
function MatchCheck({ inv }: { inv: Invoice }) {
  const [data, setData] = useState<{ match: MatchLine[]; po: any } | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!inv.poId) return;
    invoiceService.getPaymentSummary(inv.id)
      .then((res: any) => { if (!cancelled) setData(res.data); })
      .catch(() => { if (!cancelled) setData(null); });
    return () => { cancelled = true; };
  }, [inv.id, inv.poId, inv.updatedAt]);
  if (!inv.poId || !data || !data.match.length) return null;
  const issues = data.match.filter(m => m.result !== 'matched').length;
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
        PO and receipt match
        <span className={`text-sm font-normal ${issues ? 'text-amber-700' : 'text-emerald-700'}`}>
          {issues ? `${issues} line${issues === 1 ? '' : 's'} to check` : 'all lines match'}
        </span>
      </h2>
      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Ordered</TableHead>
              <TableHead className="text-right">{inv.grnId ? 'On GRN' : 'Received'}</TableHead>
              <TableHead className="text-right">This bill</TableHead>
              <TableHead className="text-right">Billed on PO</TableHead>
              <TableHead>Check</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.match.map(m => (
              <TableRow key={m.poLineIndex}>
                <TableCell className="font-medium">{m.description}</TableCell>
                <TableCell className="text-right tabular-nums">{formatQty(m.ordered)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatQty(m.received)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatQty(m.this_invoice)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatQty(m.billed_total)}</TableCell>
                <TableCell className={`text-sm ${MATCH_META[m.result].className}`}>
                  {MATCH_META[m.result].label}
                  {m.result === 'price_mismatch' && (
                    <span className="block text-xs font-normal text-muted-foreground">
                      PO {formatMoney(m.po_unit_price, inv.currency)}, billed {formatMoney(m.invoice_unit_price, inv.currency)}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data.po && (
        <p className="text-xs text-muted-foreground">
          {data.po.po_number}: {formatMoney(data.po.invoiced_subtotal, inv.currency)} billed (before tax) of {formatMoney(data.po.total_amount, inv.currency)} across {data.po.invoice_count} submitted invoice{data.po.invoice_count === 1 ? '' : 's'}
          {data.po.remaining_to_invoice > 0 ? `, ${formatMoney(data.po.remaining_to_invoice, inv.currency)} still to bill.` : '.'}
        </p>
      )}
    </section>
  );
}

export function InvoiceDetail({
  invoice: inv,
  busy,
  canWrite,
  canSettle,
  onBack,
  onEdit,
  onAction,
}: {
  invoice: Invoice;
  busy: boolean;
  canWrite: boolean;
  canSettle: boolean;
  onBack: () => void;
  onEdit: () => void;
  onAction: (action: InvoiceAction, payload?: any) => Promise<boolean>;
}) {
  const [paying, setPaying] = useState(false);
  const [reason, setReason] = useState<'dispute' | 'return' | null>(null);
  const [confirm, setConfirm] = useState<'submit' | 'approve' | 'resolve' | 'delete' | null>(null);

  const draft = inv.status === 'draft';
  const due = dueLabel(inv);
  const canDispute = canSettle && ['submitted', 'approved'].includes(inv.status);
  const history = [...inv.history].reverse();

  const primary = (() => {
    if (draft && canWrite) return { label: 'Submit for approval', icon: Send, run: () => setConfirm('submit') };
    if (inv.status === 'submitted' && canWrite) return { label: 'Approve', icon: ShieldCheck, run: () => setConfirm('approve') };
    if (inv.status === 'approved' && canSettle) return { label: 'Record payment', icon: CircleDollarSign, run: () => setPaying(true) };
    if (inv.status === 'disputed' && canSettle) return { label: 'Resolve dispute', icon: RotateCcw, run: () => setConfirm('resolve') };
    return null;
  })();

  const confirmCopy = {
    submit: { title: `Submit ${inv.invoiceNumber} for approval?`, body: `It will be locked for editing. Total ${formatMoney(inv.totalAmount, inv.currency)}.`, cta: 'Submit' },
    approve: { title: `Approve ${inv.invoiceNumber}?`, body: `${formatMoney(inv.totalAmount, inv.currency)} to ${inv.vendorName} becomes ready to pay, due ${formatDate(inv.dueDate)}.`, cta: 'Approve' },
    resolve: { title: `Resolve the dispute on ${inv.invoiceNumber}?`, body: 'It goes back to pending approval so the corrected bill can be approved again.', cta: 'Resolve' },
    delete: { title: `Delete ${inv.invoiceNumber}?`, body: 'This draft will be removed. Its quantities become available to bill again.', cta: 'Delete draft' },
  } as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-wrap">
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={onBack} aria-label="Back to invoices"><ArrowLeft className="w-4 h-4" /></Button>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground truncate">{inv.invoiceNumber}</h1>
          <InvoiceStatusBadge invoice={inv} />
        </div>
        <div className="flex flex-wrap gap-2">
          {draft && canWrite && <Button variant="outline" className="gap-2" onClick={onEdit} disabled={busy}><Edit3 className="w-4 h-4" /> Edit</Button>}
          {inv.status === 'submitted' && canWrite && (
            <Button variant="outline" className="gap-2" onClick={() => setReason('return')} disabled={busy}><Undo2 className="w-4 h-4" /> Send back</Button>
          )}
          {primary && <Button className="gap-2" onClick={primary.run} disabled={busy}><primary.icon className="w-4 h-4" /> {primary.label}</Button>}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 w-9 p-0" aria-label="More actions"><MoreHorizontal className="w-4 h-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {inv.poId && (
                <DropdownMenuItem asChild className="gap-2">
                  <Link to={`?section=purchase-orders&po=${inv.poId}`}><FileText className="w-4 h-4" /> Open {inv.poNumber}</Link>
                </DropdownMenuItem>
              )}
              {inv.shipmentId && (
                <DropdownMenuItem asChild className="gap-2">
                  <Link to={`?section=shipments&shipment=${inv.shipmentId}`}><FileText className="w-4 h-4" /> Open shipment for {inv.grnNumber}</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild className="gap-2">
                <Link to={`?section=invoices&vendor=${inv.vendorId}`}><FileText className="w-4 h-4" /> All invoices from this vendor</Link>
              </DropdownMenuItem>
              {canDispute && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setReason('dispute')} className="gap-2 text-destructive focus:text-destructive"><AlertTriangle className="w-4 h-4" /> Dispute invoice</DropdownMenuItem>
                </>
              )}
              {draft && canWrite && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setConfirm('delete')} className="gap-2 text-destructive focus:text-destructive"><Trash2 className="w-4 h-4" /> Delete draft</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Lifecycle inv={inv} />

      {inv.isOverdue && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Due {formatDate(inv.dueDate)}, {inv.daysOverdue} day{inv.daysOverdue === 1 ? '' : 's'} ago. {formatMoney(inv.outstanding, inv.currency)} is unpaid.
          </span>
          {inv.status === 'approved' && canSettle && <Button size="sm" onClick={() => setPaying(true)}>Record payment</Button>}
        </div>
      )}
      {inv.status === 'paid' && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> Paid in full on {formatDate(inv.paymentDate)}.
        </div>
      )}

      <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5 rounded-lg border bg-card p-5">
        <Fact label="Vendor">
          <Link to={`?section=vendors&vendor=${inv.vendorId}`} className="text-primary hover:underline">{inv.vendorName}</Link>
        </Fact>
        <Fact label="Vendor's invoice number">{inv.vendorInvoiceNumber || '—'}</Fact>
        <Fact label="Purchase order">
          {inv.poId ? <Link to={`?section=purchase-orders&po=${inv.poId}`} className="text-primary hover:underline">{inv.poNumber}</Link> : 'None (manual)'}
        </Fact>
        <Fact label="Goods receipt">
          {inv.grnNumber
            ? (inv.shipmentId ? <Link to={`?section=shipments&shipment=${inv.shipmentId}`} className="text-primary hover:underline">{inv.grnNumber}</Link> : inv.grnNumber)
            : '—'}
        </Fact>
        <Fact label="Invoice date">{formatDate(inv.issueDate)}</Fact>
        <Fact label="Due date">
          {formatDate(inv.dueDate)}
          {due && <span className={`block text-xs font-normal ${toneClass[due.tone]}`}>{due.text}</span>}
        </Fact>
        <Fact label="Total">{formatMoney(inv.totalAmount, inv.currency)}</Fact>
        <Fact label="Status">{STATUS_META[inv.status].label}{inv.po?.terms ? <span className="block text-xs font-normal text-muted-foreground">Terms: {inv.po.terms}</span> : null}</Fact>
        {inv.otherInvoices.length > 0 && (
          <Fact label={`Other invoices on ${inv.poNumber}`} className="col-span-2 md:col-span-4">
            {inv.otherInvoices.map((o, i) => (
              <span key={o.id}>{i > 0 && ', '}<Link to={`?section=invoices&invoice=${o.id}`} className="text-primary hover:underline">{o.invoice_number}</Link>
                <span className="text-muted-foreground font-normal"> ({STATUS_META[o.status]?.label || o.status})</span></span>
            ))}
          </Fact>
        )}
        {inv.notes && <Fact label="Notes" className="col-span-2 md:col-span-4"><span className="font-normal whitespace-pre-wrap">{inv.notes}</span></Fact>}
      </dl>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Lines <span className="text-muted-foreground font-normal">({inv.lines.length})</span></h2>
        <div className="rounded-lg border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>PO line</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit price</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inv.lines.map((l, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{l.description}</TableCell>
                  <TableCell className="text-muted-foreground">{l.poLineIndex === null ? 'Not on PO' : `Line ${l.poLineIndex + 1}`}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatQty(l.quantity)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoney(l.unitPrice, inv.currency)}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{formatMoney(l.amount, inv.currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="text-right text-muted-foreground font-normal">Subtotal</TableCell>
                <TableCell className="text-right tabular-nums">{formatMoney(inv.subtotal, inv.currency)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={4} className="text-right text-muted-foreground font-normal">Tax ({inv.taxRate}%)</TableCell>
                <TableCell className="text-right tabular-nums">{formatMoney(inv.taxAmount, inv.currency)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={4} className="text-right font-semibold">Total</TableCell>
                <TableCell className="text-right tabular-nums font-semibold">{formatMoney(inv.totalAmount, inv.currency)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Payment</h2>
            {inv.status === 'approved' && canSettle && (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setPaying(true)} disabled={busy}><CircleDollarSign className="w-4 h-4" /> Record payment</Button>
            )}
          </div>
          <div className="rounded-lg border bg-card">
            <div className="grid grid-cols-3 gap-4 p-4">
              <div><p className="text-xs text-muted-foreground">Total</p><p className="mt-1 text-sm font-semibold tabular-nums">{formatMoney(inv.totalAmount, inv.currency)}</p></div>
              <div><p className="text-xs text-muted-foreground">Paid</p><p className="mt-1 text-sm font-semibold tabular-nums text-emerald-700">{formatMoney(inv.amountPaid, inv.currency)}</p></div>
              <div>
                <p className="text-xs text-muted-foreground">Outstanding</p>
                <p className={`mt-1 text-sm font-semibold tabular-nums ${inv.isOverdue ? 'text-red-600' : ''}`}>{formatMoney(inv.outstanding, inv.currency)}</p>
              </div>
            </div>
            {inv.totalAmount > 0 && (
              <div className="px-4 pb-4">
                <div className="h-2 rounded-full bg-muted overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100}
                  aria-valuenow={Math.round((inv.amountPaid / inv.totalAmount) * 100)} aria-label="Share paid">
                  <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (inv.amountPaid / inv.totalAmount) * 100)}%` }} />
                </div>
              </div>
            )}
            {inv.payments.length > 0 ? (
              <ul className="divide-y border-t">
                {inv.payments.map(p => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium">{formatDate(p.paymentDate)} · {methodLabel(p.method)}</p>
                      <p className="text-xs text-muted-foreground">{p.reference ? `Ref ${p.reference}` : 'No reference'}{p.notes ? ` · ${p.notes}` : ''}</p>
                    </div>
                    <span className="tabular-nums font-medium">{formatMoney(p.amount, inv.currency)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 pb-4 text-sm text-muted-foreground">
                {inv.status === 'approved' ? 'No payments yet. Record one when the bank transfer goes out.' : inv.status === 'paid' ? 'Marked as paid.' : 'Payments can be recorded once the invoice is approved.'}
              </p>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Activity</h2>
          <div className="rounded-lg border bg-card p-4">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No activity recorded.</p>
            ) : (
              <ol className="relative space-y-4 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-px before:bg-border">
                {history.map((h, i) => (
                  <li key={i} className="relative pl-6">
                    <span className={`absolute left-0 top-1.5 h-[11px] w-[11px] rounded-full ring-2 ring-background ${h.action === 'disputed' ? 'bg-red-500' : h.action.startsWith('paid') || h.action === 'part payment' ? 'bg-emerald-500' : 'bg-primary/60'}`} />
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <p className="text-sm font-medium capitalize">{h.action}{h.byName ? <span className="font-normal text-muted-foreground normal-case"> by {h.byName}</span> : null}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(h.at)}</p>
                    </div>
                    {h.note && <p className="text-sm text-foreground/80 mt-0.5">{h.note}</p>}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>
      </div>

      <MatchCheck inv={inv} />

      <PaymentDialog open={paying} invoice={inv} busy={busy} onOpenChange={setPaying} onSubmit={(data) => onAction('pay', data)} />
      <ReasonDialog
        open={reason === 'dispute'}
        title={`Dispute ${inv.invoiceNumber}?`}
        description="Payment is held until an admin resolves the dispute. The vendor is not notified automatically."
        label="What is wrong with the invoice"
        placeholder="e.g. Billed 12% above the PO price; asked for a credit note"
        confirmLabel="Dispute invoice"
        destructive
        busy={busy}
        onOpenChange={(o) => { if (!o) setReason(null); }}
        onSubmit={(r) => onAction('dispute', { reason: r })}
      />
      <ReasonDialog
        open={reason === 'return'}
        title={`Send ${inv.invoiceNumber} back to draft?`}
        description="Whoever prepared it can correct it and submit again."
        label="What needs correcting"
        confirmLabel="Send back"
        busy={busy}
        onOpenChange={(o) => { if (!o) setReason(null); }}
        onSubmit={(r) => onAction('return', { reason: r })}
      />

      <AlertDialog open={!!confirm} onOpenChange={(o) => { if (!busy && !o) setConfirm(null); }}>
        <AlertDialogContent>
          {confirm && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{confirmCopy[confirm].title}</AlertDialogTitle>
                <AlertDialogDescription>{confirmCopy[confirm].body}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={busy}>Back</AlertDialogCancel>
                <AlertDialogAction disabled={busy} className={confirm === 'delete' ? 'bg-destructive text-white hover:bg-destructive/90' : ''}
                  onClick={async (e) => { e.preventDefault(); if (await onAction(confirm)) setConfirm(null); }}>
                  {busy ? 'Working…' : confirmCopy[confirm].cta}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
