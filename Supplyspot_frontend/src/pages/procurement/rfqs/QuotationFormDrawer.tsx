import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { quotationService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { PAYMENT_TERMS, Quotation, RFQ, formatMoney, inDaysIso, isPendingQuote, mapQuotation, todayIso } from './rfqModel';

interface LineDraft {
  quote: boolean; // false = the vendor did not quote this item
  quantity: string;
  unitPrice: string;
}

interface ExtraDraft {
  key: number;
  description: string;
  amount: string;
}

let extraKey = 0;

// Buyers record quotations they receive from vendors (by email, portal export or on paper) against the RFQ's lines.
export function QuotationFormDrawer({
  open,
  onOpenChange,
  rfq,
  initialVendorId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rfq: RFQ;
  initialVendorId: string | null;
  onSaved: (q: Quotation) => void;
}) {
  // Invited vendors without an open quotation; a rejected one can be replaced by a revised quote.
  const openQuoteVendorIds = new Set((rfq.quotations || []).filter(isPendingQuote).map(q => q.vendorId));
  const availableVendors = rfq.vendors.filter(v => !openQuoteVendorIds.has(v.id));

  const [vendorId, setVendorId] = useState('');
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [extras, setExtras] = useState<ExtraDraft[]>([]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [validUntil, setValidUntil] = useState(inDaysIso(30));
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setVendorId(initialVendorId && availableVendors.some(v => v.id === initialVendorId) ? initialVendorId : (availableVendors.length === 1 ? availableVendors[0].id : ''));
    setLines(rfq.items.map(it => ({ quote: true, quantity: String(it.quantity), unitPrice: '' })));
    setExtras([]);
    setDeliveryDate(inDaysIso(14));
    setPaymentTerms('Net 30');
    setValidUntil(inDaysIso(30));
    setNotes('');
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, rfq.id, initialVendorId]);

  const setLine = (i: number, patch: Partial<LineDraft>) => {
    setError(null);
    setLines(ls => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  };
  const setExtra = (key: number, patch: Partial<ExtraDraft>) => setExtras(es => es.map(e => (e.key === key ? { ...e, ...patch } : e)));

  const lineTotal = (l: LineDraft) => (l.quote ? (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0) : 0);
  const itemsTotal = lines.reduce((acc, l) => acc + lineTotal(l), 0);
  const extrasTotal = extras.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const total = itemsTotal + extrasTotal;
  const vsBudget = rfq.budget ? total - rfq.budget : null;

  const save = async () => {
    if (!vendorId) { setError('Choose the vendor who sent this quotation.'); return; }
    const quoted = lines.map((l, i) => ({ ...l, i })).filter(l => l.quote);
    if (!quoted.length) { setError('Price at least one item.'); return; }
    if (quoted.some(l => l.unitPrice === '' || !(Number(l.unitPrice) >= 0))) { setError('Enter a unit price for each quoted item, or untick the ones not quoted.'); return; }
    if (quoted.some(l => !(Number(l.quantity) > 0))) { setError('Each quoted item needs a quantity above 0.'); return; }
    if (extras.some(e => e.description.trim() && !(Number(e.amount) >= 0))) { setError('Extra charges need an amount.'); return; }
    if (!deliveryDate) { setError('Add the delivery date the vendor promised.'); return; }
    if (!(total > 0)) { setError('The quotation total must be above zero.'); return; }

    setSaving(true);
    setError(null);
    try {
      const res: any = await quotationService.submitQuotation({
        rfqId: rfq.id,
        vendorId,
        deliveryDate,
        paymentTerms,
        validUntil: validUntil || undefined,
        notes: notes.trim() || undefined,
        items: [
          ...quoted.map(l => ({ rfqItemIndex: l.i, quantity: Number(l.quantity), unitPrice: Number(l.unitPrice) })),
          ...extras.filter(e => e.description.trim()).map(e => ({ description: e.description.trim(), quantity: 1, unitPrice: Number(e.amount) || 0, unit: 'lot' })),
        ],
      });
      onSaved(mapQuotation(res.data));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the quotation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!saving) onOpenChange(o); }} direction="right">
      <DrawerContent className="data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-3xl p-0 gap-0 border-l shadow-2xl flex flex-col h-full bg-background">
        <DrawerHeader className="p-6 border-b shrink-0">
          <DrawerTitle className="text-xl font-semibold">Record a quotation for {rfq.rfqNumber}</DrawerTitle>
          <DrawerDescription>Enter the prices and terms from the vendor's quotation. You can compare it with the others once it is saved.</DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Vendor</Label>
              {availableVendors.length === 0 ? (
                <p className="text-sm text-muted-foreground">Every invited vendor already has an open quotation. Reject one first to record a revised quote.</p>
              ) : (
                <Select value={vendorId || undefined} onValueChange={(v) => { setError(null); setVendorId(v); }}>
                  <SelectTrigger aria-label="Vendor"><SelectValue placeholder="Choose an invited vendor" /></SelectTrigger>
                  <SelectContent>
                    {availableVendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qt-delivery">Delivery date</Label>
              <Input id="qt-delivery" type="date" min={todayIso()} value={deliveryDate} onChange={(e) => { setError(null); setDeliveryDate(e.target.value); }} />
            </div>
            <div className="space-y-1.5">
              <Label>Payment terms</Label>
              <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                <SelectTrigger aria-label="Payment terms"><SelectValue /></SelectTrigger>
                <SelectContent>{PAYMENT_TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qt-valid">Valid until</Label>
              <Input id="qt-valid" type="date" min={todayIso()} value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Prices</h3>
            <div className="border rounded-lg overflow-hidden">
              <div className="hidden sm:grid grid-cols-[28px_1fr_90px_120px_120px] gap-2 px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
                <span /><span>Item</span><span className="text-right">Qty</span><span className="text-right">Unit price</span><span className="text-right">Line total</span>
              </div>
              {rfq.items.map((it, i) => {
                const l = lines[i];
                if (!l) return null;
                return (
                  <div key={i} className={`grid grid-cols-[28px_1fr] sm:grid-cols-[28px_1fr_90px_120px_120px] gap-2 px-3 py-2 border-t first:border-t-0 sm:first:border-t items-center ${l.quote ? '' : 'opacity-60'}`}>
                    <input type="checkbox" className="h-4 w-4 accent-primary" checked={l.quote} onChange={(e) => setLine(i, { quote: e.target.checked })} aria-label={`Quoted: ${it.description}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{it.description}</p>
                      <p className="text-xs text-muted-foreground">Requested {it.quantity} {it.unit}{l.quote ? '' : ' · not quoted'}</p>
                    </div>
                    <Input aria-label={`Quantity ${i + 1}`} type="number" min="0" step="any" value={l.quantity} disabled={!l.quote}
                      onChange={(e) => setLine(i, { quantity: e.target.value })} className="text-right col-start-2 sm:col-start-auto" />
                    <Input aria-label={`Unit price ${i + 1}`} type="number" min="0" step="0.01" placeholder="0.00" value={l.unitPrice} disabled={!l.quote}
                      onChange={(e) => setLine(i, { unitPrice: e.target.value })} className="text-right col-start-2 sm:col-start-auto" />
                    <p className="text-right text-sm font-medium tabular-nums col-start-2 sm:col-start-auto">{formatMoney(lineTotal(l), rfq.currency)}</p>
                  </div>
                );
              })}
              {extras.map(e => (
                <div key={e.key} className="grid grid-cols-[28px_1fr_120px] sm:grid-cols-[28px_1fr_120px_120px] gap-2 px-3 py-2 border-t items-center bg-muted/20">
                  <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" aria-label="Remove charge" onClick={() => setExtras(es => es.filter(x => x.key !== e.key))}>
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                  <Input aria-label="Charge description" placeholder="e.g. Freight, installation, GST" value={e.description} onChange={(ev) => setExtra(e.key, { description: ev.target.value })} />
                  <Input aria-label="Charge amount" type="number" min="0" step="0.01" placeholder="0.00" value={e.amount} onChange={(ev) => setExtra(e.key, { amount: ev.target.value })} className="text-right" />
                  <p className="hidden sm:block text-right text-sm font-medium tabular-nums">{formatMoney(Number(e.amount) || 0, rfq.currency)}</p>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" className="gap-1.5"
              onClick={() => setExtras(es => [...es, { key: ++extraKey, description: '', amount: '' }])}>
              <Plus className="w-4 h-4" /> Add a charge
            </Button>
          </section>

          <section className="space-y-1.5">
            <Label htmlFor="qt-notes">Vendor notes</Label>
            <Textarea id="qt-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Brand offered, warranty, exclusions…" />
          </section>
        </div>

        <div className="border-t p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 bg-background">
          <div>
            <p className="text-xs text-muted-foreground">Quotation total</p>
            <p className="text-lg font-semibold tabular-nums">{formatMoney(total, rfq.currency)}</p>
            {vsBudget !== null && total > 0 && (
              <p className={`text-xs ${vsBudget > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                {formatMoney(Math.abs(vsBudget), rfq.currency)} {vsBudget > 0 ? 'over' : 'under'} budget
              </p>
            )}
          </div>
          <div className="flex flex-col items-stretch sm:items-end gap-2">
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
              <Button onClick={save} disabled={saving || availableVendors.length === 0}>{saving ? 'Saving…' : 'Save quotation'}</Button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
