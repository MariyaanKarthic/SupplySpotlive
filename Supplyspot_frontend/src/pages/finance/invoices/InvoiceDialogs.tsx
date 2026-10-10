import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Invoice, PAYMENT_METHODS, formatMoney } from './invoiceModel';

const todayIso = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

// Manual payment record (no bank feed): amount defaults to everything outstanding.
export function PaymentDialog({
  open, invoice, busy, onOpenChange, onSubmit,
}: {
  open: boolean;
  invoice: Invoice;
  busy: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (data: any) => Promise<boolean>;
}) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayIso());
  const [method, setMethod] = useState('bank_transfer');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setAmount(String(invoice.outstanding));
    setDate(todayIso());
    setMethod('bank_transfer');
    setReference('');
    setNotes('');
    setError(null);
  }, [open, invoice]);

  const value = Number(amount);
  const partial = value > 0 && value < invoice.outstanding - 0.001;

  const submit = async () => {
    setError(null);
    if (!(value > 0)) return setError('Enter the amount paid.');
    if (value > invoice.outstanding + 0.001) return setError(`Only ${formatMoney(invoice.outstanding, invoice.currency)} is outstanding.`);
    if (!date) return setError('Enter the payment date.');
    if (date > todayIso()) return setError('The payment date cannot be in the future.');
    if (!reference.trim()) return setError('Enter the bank reference (UTR) or cheque number so the payment can be reconciled.');
    const ok = await onSubmit({ amount: value, paymentDate: date, method, reference: reference.trim(), notes: notes.trim() });
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) onOpenChange(o); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>
            {invoice.invoiceNumber} to {invoice.vendorName}: {formatMoney(invoice.outstanding, invoice.currency)} outstanding of {formatMoney(invoice.totalAmount, invoice.currency)}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="pay-amount">Amount ({invoice.currency})</Label>
            <Input id="pay-amount" type="number" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} />
            {partial && <p className="text-xs text-amber-700">Part payment: the invoice stays open for the rest.</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pay-date">Paid on</Label>
            <Input id="pay-date" type="date" max={todayIso()} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map(m => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pay-ref">Reference</Label>
            <Input id="pay-ref" placeholder="UTR / cheque number" value={reference} onChange={(e) => setReference(e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="pay-notes">Notes</Label>
            <Textarea id="pay-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter className="items-center gap-3">
          <p className="text-sm text-destructive mr-auto" role="alert">{error}</p>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>{busy ? 'Saving…' : partial ? 'Record part payment' : 'Mark as paid'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Asks for a reason before disputing an invoice or sending it back to draft.
export function ReasonDialog({
  open, title, description, label, placeholder, confirmLabel, destructive = false, busy, onOpenChange, onSubmit,
}: {
  open: boolean;
  title: string;
  description: string;
  label: string;
  placeholder?: string;
  confirmLabel: string;
  destructive?: boolean;
  busy: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (reason: string) => Promise<boolean>;
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (open) { setReason(''); setError(null); }
  }, [open]);

  const submit = async () => {
    if (!reason.trim()) return setError('This is required.');
    if (await onSubmit(reason.trim())) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) onOpenChange(o); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="reason">{label}</Label>
          <Textarea id="reason" rows={3} placeholder={placeholder} value={reason} onChange={(e) => setReason(e.target.value)} />
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy} className={destructive ? 'bg-destructive text-white hover:bg-destructive/90' : ''}>
            {busy ? 'Working…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
