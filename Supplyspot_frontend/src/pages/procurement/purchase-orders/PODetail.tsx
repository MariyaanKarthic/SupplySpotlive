import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Ban, Check, CheckCircle, ClipboardCheck, Edit3, FileText, Mail, MoreHorizontal, Package, Printer, Send, Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  LIFECYCLE, PRIORITY_META, PurchaseOrder, STATUS_META, deliveryLabel, formatDate, formatMoney, isEditable, isOverdue, lifecycleIndex,
} from './poModel';
import { POShipments } from './POShipments';
import { POInvoices } from './POInvoices';

export type POAction = 'submit' | 'approve' | 'send' | 'acknowledge' | 'receive' | 'close' | 'cancel';

export interface NextStep {
  action: POAction;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// The one primary action for each status. Shared with the list's row actions.
export function nextStep(po: PurchaseOrder): NextStep | null {
  switch (po.status) {
    case 'new': return { action: 'submit', label: 'Submit for approval', icon: Send };
    case 'pending_approval': return { action: 'approve', label: 'Approve', icon: CheckCircle };
    case 'approved': return { action: 'send', label: 'Send to vendor', icon: Send };
    case 'sent': return { action: 'acknowledge', label: 'Mark acknowledged', icon: ClipboardCheck };
    case 'acknowledged':
    case 'partially_received': return { action: 'receive', label: 'Record receipt', icon: Package };
    case 'received': return { action: 'close', label: 'Close PO', icon: Lock };
    default: return null;
  }
}

export const canCancel = (po: PurchaseOrder) => ['new', 'pending_approval', 'approved', 'sent', 'acknowledged'].includes(po.status);

export function StatusBadge({ po, className = '' }: { po: PurchaseOrder; className?: string }) {
  const meta = STATUS_META[po.status];
  return <Badge variant="outline" className={`${meta.className} ${className}`}>{meta.label}</Badge>;
}

export function PriorityBadge({ po }: { po: PurchaseOrder }) {
  const meta = PRIORITY_META[po.priority];
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

function Stepper({ po }: { po: PurchaseOrder }) {
  if (po.status === 'cancelled') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
        <Ban className="w-4 h-4" /> This purchase order was cancelled.
      </div>
    );
  }
  const current = lifecycleIndex(po.status);
  return (
    <ol className="flex items-center gap-0 overflow-x-auto pb-1" aria-label="PO progress">
      {LIFECYCLE.map((step, i) => {
        const done = i < current || (i === current && po.status === 'closed');
        const active = i === current && po.status !== 'closed';
        const label = po.status === 'partially_received' && step.status === 'received' ? 'Receiving' : step.label;
        return (
          <li key={step.status} className="flex items-center shrink-0" aria-current={active ? 'step' : undefined}>
            <div className="flex items-center gap-2">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold
                ${done ? 'bg-primary border-primary text-primary-foreground' : active ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground'}`}>
                {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </span>
              <span className={`text-xs sm:text-sm ${active ? 'font-semibold text-foreground' : done ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
            </div>
            {i < LIFECYCLE.length - 1 && <span className={`mx-2 sm:mx-3 h-px w-6 sm:w-10 ${i < current ? 'bg-primary' : 'bg-border'}`} />}
          </li>
        );
      })}
    </ol>
  );
}

export function PODetail({
  po,
  busy,
  onBack,
  onEdit,
  onAction,
}: {
  po: PurchaseOrder;
  busy: boolean;
  onBack: () => void;
  onEdit: () => void;
  onAction: (action: POAction, payload?: any) => Promise<boolean>;
}) {
  const [confirm, setConfirm] = useState<'send' | 'cancel' | null>(null);
  const [receiving, setReceiving] = useState(false);
  const [received, setReceived] = useState<string[]>([]);

  const step = nextStep(po);
  const subtotal = po.lineItems.reduce((acc, li) => acc + li.totalAmount, 0);
  const showReceived = ['sent', 'acknowledged', 'partially_received', 'received', 'closed'].includes(po.status);
  const delivery = deliveryLabel(po);
  const overdue = isOverdue(po);

  const runStep = () => {
    if (!step) return;
    if (step.action === 'send') return setConfirm('send');
    if (step.action === 'receive') {
      setReceived(po.lineItems.map(li => String(li.receivedQuantity || li.quantity)));
      return setReceiving(true);
    }
    onAction(step.action);
  };

  const submitReceipt = async () => {
    const items = po.lineItems.map((_, index) => ({ index, receivedQuantity: Number(received[index]) || 0 }));
    if (await onAction('receive', { items })) setReceiving(false);
  };

  const mailto = po.vendorEmail
    ? `mailto:${po.vendorEmail}?subject=${encodeURIComponent(`Purchase order ${po.poNumber}`)}`
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 no-print" onClick={onBack} aria-label="Back to purchase orders">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground truncate">{po.poNumber}</h1>
          <StatusBadge po={po} />
          {overdue && <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Delivery overdue</Badge>}
        </div>
        <div className="flex flex-wrap gap-2 no-print">
          {step && (
            <Button className="gap-2" onClick={runStep} disabled={busy}>
              <step.icon className="w-4 h-4" />
              {step.label}
            </Button>
          )}
          {isEditable(po) && (
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
              {mailto && (
                <DropdownMenuItem asChild className="gap-2">
                  <a href={mailto}><Mail className="w-4 h-4" /> Email vendor</a>
                </DropdownMenuItem>
              )}
              {po.status === 'partially_received' && (
                <DropdownMenuItem onClick={() => onAction('close')} className="gap-2"><Lock className="w-4 h-4" /> Close with partial receipt</DropdownMenuItem>
              )}
              {canCancel(po) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setConfirm('cancel')} className="gap-2 text-destructive focus:text-destructive">
                    <Ban className="w-4 h-4" /> Cancel PO
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Stepper po={po} />

      <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5 rounded-lg border bg-card p-5">
        <Fact label="Vendor">
          {po.vendorName}
          {po.vendorEmail && <span className="block text-xs font-normal text-muted-foreground">{po.vendorEmail}</span>}
        </Fact>
        <Fact label="PO total">{formatMoney(po.totalAmount, po.currency)}</Fact>
        <Fact label="Issue date">{formatDate(po.issueDate)}</Fact>
        <Fact label="Expected delivery">
          {formatDate(po.expectedDeliveryDate)}
          {delivery && <span className={`block text-xs font-normal ${overdue ? 'text-red-600' : 'text-muted-foreground'}`}>{delivery}</span>}
        </Fact>
        <Fact label="Priority"><PriorityBadge po={po} /></Fact>
        <Fact label="Payment terms">{po.terms || '—'}</Fact>
        <Fact label="Vendor acknowledgment">
          {po.acknowledgmentStatus === 'acknowledged' ? `Acknowledged ${formatDate(po.acknowledgmentDate)}` : 'Not yet'}
        </Fact>
        <Fact label="RFQ reference">
          {po.rfqNumber && po.rfqId ? <Link to={`?section=rfq&rfq=${po.rfqId}`} className="text-primary hover:underline">{po.rfqNumber}</Link> : po.rfqNumber || '—'}
        </Fact>
        <Fact label="Delivery address" className="col-span-2 md:col-span-4">{po.deliveryAddress || '—'}</Fact>
      </dl>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Line items <span className="text-muted-foreground font-normal">({po.lineItems.length})</span></h2>
        <div className="rounded-lg border bg-card overflow-x-auto">
          <UITable>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                {showReceived && <TableHead className="text-right">Received</TableHead>}
                <TableHead className="text-right">Unit price</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Deliver by</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {po.lineItems.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No line items on this PO.</TableCell></TableRow>
              )}
              {po.lineItems.map((li, i) => (
                <TableRow key={i}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-medium">{li.description}</TableCell>
                  <TableCell className="text-right tabular-nums">{li.quantity}</TableCell>
                  {showReceived && (
                    <TableCell className={`text-right tabular-nums ${li.receivedQuantity >= li.quantity ? 'text-emerald-700' : li.receivedQuantity > 0 ? 'text-amber-700' : 'text-muted-foreground'}`}>
                      {li.receivedQuantity} / {li.quantity}
                    </TableCell>
                  )}
                  <TableCell className="text-right tabular-nums">{formatMoney(li.unitPrice, po.currency)}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{formatMoney(li.totalAmount, po.currency)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(li.deliveryDate || null)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={showReceived ? 5 : 4} className="text-right font-medium">Total</TableCell>
                <TableCell className="text-right tabular-nums font-semibold">{formatMoney(subtotal || po.totalAmount, po.currency)}</TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </UITable>
        </div>
      </section>

      <POShipments po={po} />
      <POInvoices po={po} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Notes for the vendor</h2>
          <div className="rounded-lg border bg-card p-4 text-sm text-foreground whitespace-pre-wrap min-h-24">
            {po.notes || <span className="text-muted-foreground">No notes.</span>}
          </div>
          {po.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {po.attachments.map((file, idx) => (
                <Badge key={idx} variant="outline" className="gap-1.5 h-7"><FileText className="w-3.5 h-3.5" />{file.name}</Badge>
              ))}
            </div>
          )}
        </section>
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Activity</h2>
          <ul className="rounded-lg border bg-card p-4 space-y-3 text-sm">
            {po.createdAt && <li className="flex justify-between gap-4"><span>Created</span><span className="text-muted-foreground">{new Date(po.createdAt).toLocaleString()}</span></li>}
            {po.acknowledgmentDate && <li className="flex justify-between gap-4"><span>Vendor acknowledged</span><span className="text-muted-foreground">{formatDate(po.acknowledgmentDate)}</span></li>}
            {po.updatedAt && <li className="flex justify-between gap-4"><span>Last updated ({STATUS_META[po.status].label})</span><span className="text-muted-foreground">{new Date(po.updatedAt).toLocaleString()}</span></li>}
          </ul>
        </section>
      </div>

      <AlertDialog open={!!confirm} onOpenChange={(o) => { if (!o && !busy) setConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm === 'send' ? `Send ${po.poNumber} to ${po.vendorName}?` : `Cancel ${po.poNumber}?`}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === 'send'
                ? `The PO will be marked as sent and locked for editing. Total ${formatMoney(po.totalAmount, po.currency)}.`
                : 'The PO will be marked as cancelled. This cannot be undone from the app.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Back</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              className={confirm === 'cancel' ? 'bg-destructive text-white hover:bg-destructive/90' : ''}
              onClick={async (e) => {
                e.preventDefault();
                if (confirm && await onAction(confirm)) setConfirm(null);
              }}
            >
              {busy ? 'Working…' : confirm === 'send' ? 'Send to vendor' : 'Cancel PO'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={receiving} onOpenChange={(o) => { if (!busy) setReceiving(o); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Record goods receipt</DialogTitle>
            <DialogDescription>Enter the total quantity received so far for each line. Anything short of the ordered quantity keeps the PO open.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {po.lineItems.map((li, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="flex-1 text-sm">{li.description}</span>
                <Input
                  aria-label={`Received quantity for ${li.description}`}
                  type="number" min="0" max={li.quantity} step="any" className="w-24 text-right"
                  value={received[i] ?? ''}
                  onChange={(e) => setReceived(r => r.map((v, j) => (j === i ? e.target.value : v)))}
                />
                <span className="text-sm text-muted-foreground w-14">of {li.quantity}</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReceiving(false)} disabled={busy}>Cancel</Button>
            <Button onClick={submitReceipt} disabled={busy}>{busy ? 'Saving…' : 'Save receipt'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
