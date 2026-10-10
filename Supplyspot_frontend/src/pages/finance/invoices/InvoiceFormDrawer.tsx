import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { invoiceService, purchaseOrderService, vendorService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Invoice, formatDate, formatMoney, formatQty, mapInvoice, round2 } from './invoiceModel';

type Source = 'po' | 'grn' | 'manual';

interface LineDraft {
  key: string;
  poLineIndex: number | null;
  description: string;
  quantity: string;
  unitPrice: string;
  // Present when the line came from a PO / GRN.
  ordered?: number;
  received?: number;
  remaining?: number;
}

interface FormState {
  source: Source;
  poId: string;
  grnId: string;
  vendorId: string;
  vendorName: string;
  currency: string;
  vendorInvoiceNumber: string;
  issueDate: string;
  dueDate: string;
  taxRate: string;
  notes: string;
  lines: LineDraft[];
}

const INVOICEABLE = ['sent', 'acknowledged', 'partially_received', 'received', 'closed'];
let keySeq = 0;
const newKey = () => `l${++keySeq}`;
const todayIso = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};
const plusDays = (date: string, days: number) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
const blankLine = (): LineDraft => ({ key: newKey(), poLineIndex: null, description: '', quantity: '1', unitPrice: '' });
const empty = (source: Source = 'po'): FormState => ({
  source, poId: '', grnId: '', vendorId: '', vendorName: '', currency: 'INR', vendorInvoiceNumber: '',
  issueDate: todayIso(), dueDate: plusDays(todayIso(), 30), taxRate: '18', notes: '', lines: source === 'manual' ? [blankLine()] : [],
});

export function InvoiceFormDrawer({
  open,
  invoice,
  initialPoId,
  initialGrnId,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  invoice: Invoice | null; // null = create
  initialPoId?: string | null;
  initialGrnId?: string | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (inv: Invoice, created: boolean) => void;
}) {
  const [form, setForm] = useState<FormState>(empty());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingLines, setLoadingLines] = useState(false);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(f => ({ ...f, [key]: value }));
  const creating = !invoice;

  const { data: poData, loading: posLoading } = useApi(
    useCallback(() => (open && creating ? purchaseOrderService.getPurchaseOrders({ page: 1, limit: 100 }) : Promise.resolve({ success: true, data: null })) as any, [open, creating])
  );
  const pos = useMemo(
    () => (((poData as any)?.purchaseOrders || []) as any[]).filter(p => INVOICEABLE.includes(p.status) || p.id === initialPoId)
      .sort((a, b) => String(b.po_number).localeCompare(String(a.po_number))),
    [poData, initialPoId]
  );
  const { data: grnData, loading: grnsLoading } = useApi(
    useCallback(() => (open && creating ? invoiceService.getBillableGrns() : Promise.resolve({ success: true, data: null })) as any, [open, creating])
  );
  const grns = ((grnData as any)?.grns || []) as any[];
  const { data: vendorData, loading: vendorsLoading } = useApi(
    useCallback(() => (open && creating && form.source === 'manual' ? vendorService.getVendors({ page: 1, limit: 100 }) : Promise.resolve({ success: true, data: null })) as any, [open, creating, form.source])
  );
  const vendors = useMemo(
    () => (((vendorData as any)?.vendors || []) as any[]).slice().sort((a, b) => a.name.localeCompare(b.name)),
    [vendorData]
  );

  // Pull what is left to bill on the chosen PO or GRN, with its vendor, currency and suggested due date.
  const loadSource = useCallback(async (source: Source, id: string) => {
    setLoadingLines(true);
    setError(null);
    setForm(f => ({ ...f, source, poId: source === 'po' ? id : '', grnId: source === 'grn' ? id : '', lines: [] }));
    try {
      const res: any = await invoiceService.getPrefill(source === 'grn' ? { grn_id: id } : { po_id: id });
      const d = res.data;
      const lines: LineDraft[] = d.lines.map((l: any) => ({
        key: newKey(), poLineIndex: l.poLineIndex, description: l.description, quantity: String(l.remaining), unitPrice: String(l.unitPrice),
        ordered: l.ordered, received: l.received, remaining: l.remaining,
      }));
      setForm(f => ({
        ...f,
        poId: d.po.id,
        grnId: d.grn?.id || '',
        vendorId: d.vendor.id,
        vendorName: d.vendor.name,
        currency: d.currency,
        issueDate: d.issue_date,
        dueDate: d.due_date,
        lines,
      }));
      if (!lines.some(l => (l.remaining || 0) > 0)) {
        setError(`Everything on ${d.grn?.grn_number || d.po.po_number} has already been invoiced.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the purchase order');
    } finally {
      setLoadingLines(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (invoice) {
      setForm({
        source: invoice.grnId ? 'grn' : invoice.poId ? 'po' : 'manual',
        poId: invoice.poId || '',
        grnId: invoice.grnId || '',
        vendorId: invoice.vendorId,
        vendorName: invoice.vendorName,
        currency: invoice.currency,
        vendorInvoiceNumber: invoice.vendorInvoiceNumber,
        issueDate: invoice.issueDate || todayIso(),
        dueDate: invoice.dueDate || '',
        taxRate: String(invoice.taxRate),
        notes: invoice.notes,
        lines: invoice.lines.map(l => ({ key: newKey(), poLineIndex: l.poLineIndex, description: l.description, quantity: String(l.quantity), unitPrice: String(l.unitPrice) })),
      });
    } else if (initialGrnId) {
      setForm(empty('grn'));
      loadSource('grn', initialGrnId);
    } else if (initialPoId) {
      setForm(empty('po'));
      loadSource('po', initialPoId);
    } else {
      setForm(empty('po'));
    }
  }, [open, invoice, initialPoId, initialGrnId, loadSource]);

  const subtotal = round2(form.lines.reduce((a, l) => a + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0));
  const tax = round2(subtotal * (Number(form.taxRate) || 0) / 100);
  const total = round2(subtotal + tax);
  const linked = form.source !== 'manual';
  const readyForLines = !linked || !!form.poId;

  const updateLine = (key: string, patch: Partial<LineDraft>) => set('lines', form.lines.map(l => (l.key === key ? { ...l, ...patch } : l)));

  const save = async () => {
    setError(null);
    if (creating && form.source === 'po' && !form.poId) return setError('Choose the purchase order this invoice bills.');
    if (creating && form.source === 'grn' && !form.grnId) return setError('Choose the goods receipt this invoice bills.');
    if (creating && form.source === 'manual' && !form.vendorId) return setError('Choose the vendor.');
    if (!form.issueDate || !form.dueDate) return setError('Enter the invoice date and due date.');
    if (form.dueDate < form.issueDate) return setError('The due date cannot be before the invoice date.');
    const taxRate = Number(form.taxRate);
    if (form.taxRate === '' || isNaN(taxRate) || taxRate < 0 || taxRate > 100) return setError('Tax rate must be between 0 and 100%.');
    const items = form.lines
      .filter(l => l.description.trim() || Number(l.quantity) || Number(l.unitPrice))
      .map(l => ({ poLineIndex: l.poLineIndex, description: l.description.trim(), quantity: Number(l.quantity) || 0, unitPrice: Number(l.unitPrice) || 0 }));
    // Lines from the PO/GRN with nothing to bill are just dropped.
    const billed = items.filter(i => i.poLineIndex === null || i.quantity > 0);
    if (!billed.length) return setError('Add at least one line to bill.');
    const blank = billed.find(i => !i.description);
    if (blank) return setError('Every line needs a description.');
    const zero = billed.find(i => i.quantity <= 0);
    if (zero) return setError(`"${zero.description}" needs a quantity above zero.`);
    const over = form.lines.find(l => l.remaining !== undefined && (Number(l.quantity) || 0) > (l.remaining || 0));
    if (over && form.source === 'grn') return setError(`Only ${formatQty(over.remaining || 0)} of "${over.description}" can still be billed on this goods receipt.`);

    const payload: any = {
      vendorInvoiceNumber: form.vendorInvoiceNumber.trim(),
      issueDate: form.issueDate,
      dueDate: form.dueDate,
      taxRate,
      notes: form.notes.trim(),
      items: billed,
    };
    if (creating) {
      if (form.source === 'grn') payload.grnId = form.grnId;
      else if (form.source === 'po') payload.poId = form.poId;
      else { payload.vendorId = form.vendorId; payload.currency = form.currency; }
    }
    setSaving(true);
    try {
      const res: any = creating ? await invoiceService.createInvoice(payload) : await invoiceService.updateInvoice(invoice!.id, payload);
      onSaved(mapInvoice(res.data), creating);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the invoice');
    } finally {
      setSaving(false);
    }
  };

  const sourceButtons: { id: Source; label: string }[] = [
    { id: 'po', label: 'Purchase order' },
    { id: 'grn', label: 'Goods receipt (GRN)' },
    { id: 'manual', label: 'Manual entry' },
  ];

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!saving) onOpenChange(o); }} direction="right">
      <DrawerContent className="data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-3xl p-0 gap-0 border-l shadow-2xl flex flex-col h-full bg-background">
        <DrawerHeader className="p-6 border-b shrink-0">
          <DrawerTitle className="text-xl font-semibold">{invoice ? `Edit ${invoice.invoiceNumber}` : 'New invoice'}</DrawerTitle>
          <DrawerDescription>
            {invoice
              ? 'Drafts can be changed until they are submitted for approval.'
              : 'Bill against a purchase order or a goods receipt to fill the lines automatically, or enter a vendor bill by hand. It is saved as a draft.'}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {creating ? (
            <section className="space-y-3">
              <div className="inline-flex rounded-lg border p-1 bg-muted/40" role="group" aria-label="Invoice against">
                {sourceButtons.map(b => (
                  <button key={b.id} type="button" aria-pressed={form.source === b.id}
                    className={`px-3 py-1.5 text-sm rounded-md transition ${form.source === b.id ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={() => { if (form.source !== b.id) { setError(null); setForm({ ...empty(b.id), vendorInvoiceNumber: form.vendorInvoiceNumber, notes: form.notes }); } }}>
                    {b.label}
                  </button>
                ))}
              </div>
              {form.source === 'po' && (
                <div className="space-y-1.5">
                  <Label>Purchase order</Label>
                  <Select value={form.poId} onValueChange={(v) => loadSource('po', v)} disabled={posLoading}>
                    <SelectTrigger><SelectValue placeholder={posLoading ? 'Loading purchase orders…' : 'Choose a sent purchase order'} /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {pos.map(p => <SelectItem key={p.id} value={p.id}>{p.po_number} · {p.vendor_name} · {String(p.status).replace(/_/g, ' ')}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Once goods are being received, quantities default to what has been received and not yet billed.</p>
                </div>
              )}
              {form.source === 'grn' && (
                <div className="space-y-1.5">
                  <Label>Goods receipt</Label>
                  <Select value={form.grnId} onValueChange={(v) => loadSource('grn', v)} disabled={grnsLoading}>
                    <SelectTrigger><SelectValue placeholder={grnsLoading ? 'Loading goods receipts…' : grns.length ? 'Choose a GRN' : 'No goods receipts yet'} /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {grns.map(g => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.grn_number} · {g.po_number} · {g.vendor_name}{g.fully_invoiced ? ' · invoiced' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {form.source === 'manual' && (
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-3">
                  <div className="space-y-1.5">
                    <Label>Vendor</Label>
                    <Select value={form.vendorId} onValueChange={(v) => setForm(f => ({ ...f, vendorId: v, vendorName: vendors.find(x => x.id === v)?.name || '' }))} disabled={vendorsLoading}>
                      <SelectTrigger><SelectValue placeholder={vendorsLoading ? 'Loading vendors…' : 'Choose a vendor'} /></SelectTrigger>
                      <SelectContent className="max-h-72">
                        {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Currency</Label>
                    <Select value={form.currency} onValueChange={(v) => set('currency', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['INR', 'USD', 'EUR', 'GBP'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              {linked && form.vendorName && !loadingLines && (
                <p className="text-sm text-muted-foreground">Vendor: <span className="text-foreground font-medium">{form.vendorName}</span> · billed in {form.currency}</p>
              )}
            </section>
          ) : (
            <p className="text-sm text-muted-foreground">
              {invoice!.vendorName}{invoice!.poNumber ? ` · ${invoice!.poNumber}` : ''}{invoice!.grnNumber ? ` · ${invoice!.grnNumber}` : ''} · {invoice!.currency}
            </p>
          )}

          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="vendor-ref">Vendor's invoice number</Label>
              <Input id="vendor-ref" placeholder="As printed on their bill" value={form.vendorInvoiceNumber} onChange={(e) => set('vendorInvoiceNumber', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="issue">Invoice date</Label>
              <Input id="issue" type="date" value={form.issueDate} onChange={(e) => set('issueDate', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="due">Due date</Label>
              <Input id="due" type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
            </div>
          </section>

          {readyForLines && (
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Lines</h3>
                <Button type="button" size="sm" variant="ghost" className="gap-1.5" onClick={() => set('lines', [...form.lines, blankLine()])}>
                  <Plus className="w-4 h-4" /> Add line
                </Button>
              </div>
              <div className="border rounded-lg overflow-x-auto">
                <div className="min-w-[560px]">
                  <div className="grid grid-cols-[1fr_90px_110px_110px_32px] gap-2 px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
                    <span>Item</span><span className="text-right">Qty</span><span className="text-right">Unit price</span><span className="text-right">Amount</span><span />
                  </div>
                  {loadingLines && <div className="p-4"><div className="h-6 rounded bg-muted animate-pulse" /></div>}
                  {!loadingLines && form.lines.length === 0 && (
                    <p className="px-3 py-4 text-sm text-muted-foreground border-t">{linked ? 'Choose what you are billing to fill the lines.' : 'No lines yet.'}</p>
                  )}
                  {!loadingLines && form.lines.map(l => {
                    const amount = round2((Number(l.quantity) || 0) * (Number(l.unitPrice) || 0));
                    const over = l.remaining !== undefined && (Number(l.quantity) || 0) > (l.remaining || 0);
                    return (
                      <div key={l.key} className="grid grid-cols-[1fr_90px_110px_110px_32px] gap-2 px-3 py-2 border-t items-start">
                        <div>
                          {l.poLineIndex === null
                            ? <Input aria-label="Line description" placeholder="e.g. Freight and handling" value={l.description} onChange={(e) => updateLine(l.key, { description: e.target.value })} />
                            : <p className="text-sm pt-2">{l.description}</p>}
                          {l.ordered !== undefined && (
                            <p className={`text-xs mt-0.5 ${over ? 'text-amber-700' : 'text-muted-foreground'}`}>
                              Ordered {formatQty(l.ordered)} · received {formatQty(l.received || 0)} · {formatQty(l.remaining || 0)} left to bill
                            </p>
                          )}
                          {l.poLineIndex === null && linked && <p className="text-xs mt-0.5 text-muted-foreground">Not on the PO</p>}
                        </div>
                        <Input aria-label={`Quantity for ${l.description || 'line'}`} type="number" min="0" step="any" className="text-right" value={l.quantity}
                          onChange={(e) => updateLine(l.key, { quantity: e.target.value })} />
                        <Input aria-label={`Unit price for ${l.description || 'line'}`} type="number" min="0" step="any" className="text-right" value={l.unitPrice}
                          onChange={(e) => updateLine(l.key, { unitPrice: e.target.value })} />
                        <p className="text-sm text-right tabular-nums pt-2">{formatMoney(amount, form.currency)}</p>
                        <Button type="button" variant="ghost" size="sm" className="h-9 w-8 p-0 text-muted-foreground" aria-label="Remove line"
                          onClick={() => set('lines', form.lines.filter(x => x.key !== l.key))}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end">
                <dl className="w-full sm:w-80 text-sm space-y-1.5 pt-2">
                  <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="tabular-nums">{formatMoney(subtotal, form.currency)}</dd></div>
                  <div className="flex justify-between items-center gap-3">
                    <dt className="text-muted-foreground flex items-center gap-2">
                      Tax
                      <Input aria-label="Tax rate percent" type="number" min="0" max="100" step="any" className="h-8 w-20 text-right" value={form.taxRate}
                        onChange={(e) => set('taxRate', e.target.value)} />
                      %
                    </dt>
                    <dd className="tabular-nums">{formatMoney(tax, form.currency)}</dd>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatMoney(total, form.currency)}</dd></div>
                </dl>
              </div>
            </section>
          )}

          <section className="space-y-1.5">
            <Label htmlFor="inv-notes">Notes</Label>
            <Textarea id="inv-notes" rows={3} placeholder="Anything the approver should know, e.g. a short delivery or a price agreed by email" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </section>
          {form.poId && form.source !== 'manual' && form.issueDate && (
            <p className="text-xs text-muted-foreground">Due date follows the PO's payment terms from the invoice date ({formatDate(form.issueDate)}); change it if the bill says otherwise.</p>
          )}
        </div>

        <div className="p-4 border-t flex items-center justify-between gap-3 shrink-0">
          <p className="text-sm text-destructive min-h-5" role="alert">{error}</p>
          <div className="flex gap-2 shrink-0">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving || loadingLines}>{saving ? 'Saving…' : invoice ? 'Save changes' : 'Save draft'}</Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
