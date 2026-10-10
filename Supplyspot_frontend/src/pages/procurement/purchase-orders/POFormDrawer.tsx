import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { purchaseOrderService, vendorService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { PurchaseOrder, POPriority, formatMoney, mapPurchaseOrder } from './poModel';

interface LineDraft {
  key: number;
  description: string;
  quantity: string;
  unitPrice: string;
  deliveryDate: string;
}

interface FormState {
  vendorId: string;
  priority: POPriority;
  currency: string;
  issueDate: string;
  expectedDeliveryDate: string;
  terms: string;
  deliveryAddress: string;
  notes: string;
  lines: LineDraft[];
}

const todayIso = () => new Date().toISOString().split('T')[0];
const inDaysIso = (days: number) => new Date(Date.now() + days * 86400000).toISOString().split('T')[0];
let lineKey = 0;
const emptyLine = (): LineDraft => ({ key: ++lineKey, description: '', quantity: '1', unitPrice: '', deliveryDate: '' });

function initialState(po: PurchaseOrder | null): FormState {
  if (!po) {
    return {
      vendorId: '', priority: 'medium', currency: 'USD', issueDate: todayIso(), expectedDeliveryDate: inDaysIso(14),
      terms: 'Net 30', deliveryAddress: '', notes: '', lines: [emptyLine()],
    };
  }
  return {
    vendorId: po.vendorId, priority: po.priority, currency: po.currency, issueDate: po.issueDate,
    expectedDeliveryDate: po.expectedDeliveryDate, terms: po.terms, deliveryAddress: po.deliveryAddress, notes: po.notes,
    lines: po.lineItems.length
      ? po.lineItems.map(li => ({ key: ++lineKey, description: li.description, quantity: String(li.quantity), unitPrice: String(li.unitPrice), deliveryDate: li.deliveryDate || '' }))
      : [emptyLine()],
  };
}

export function POFormDrawer({
  open,
  onOpenChange,
  po,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  po: PurchaseOrder | null; // null = create
  onSaved: (po: PurchaseOrder, created: boolean) => void;
}) {
  const [form, setForm] = useState<FormState>(() => initialState(po));
  const [saving, setSaving] = useState<'draft' | 'submit' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: vendorData, loading: vendorsLoading } = useApi(
    useCallback(() => vendorService.getVendors({ page: 1, limit: 100 }) as any, [])
  );
  const vendors = useMemo(
    () => (((vendorData as any)?.vendors || []) as any[]).slice().sort((a, b) => a.name.localeCompare(b.name)),
    [vendorData]
  );

  useEffect(() => {
    if (open) {
      setForm(initialState(po));
      setError(null);
    }
  }, [open, po]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(f => ({ ...f, [key]: value }));
  const setLine = (key: number, patch: Partial<LineDraft>) =>
    setForm(f => ({ ...f, lines: f.lines.map(l => (l.key === key ? { ...l, ...patch } : l)) }));

  const lineTotal = (l: LineDraft) => (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0);
  const total = form.lines.reduce((acc, l) => acc + lineTotal(l), 0);

  const validate = () => {
    if (!form.vendorId) return 'Choose a vendor.';
    if (!form.issueDate || !form.expectedDeliveryDate) return 'Issue and expected delivery dates are required.';
    if (form.expectedDeliveryDate < form.issueDate) return 'Expected delivery must be on or after the issue date.';
    const filled = form.lines.filter(l => l.description.trim());
    if (!filled.length) return 'Add at least one line item.';
    if (filled.some(l => !(Number(l.quantity) > 0) || !(Number(l.unitPrice) >= 0) || l.unitPrice === '')) {
      return 'Each line item needs a quantity above 0 and a unit price.';
    }
    if (!(total > 0)) return 'The PO total must be more than 0.';
    return null;
  };

  const save = async (mode: 'draft' | 'submit') => {
    const problem = validate();
    if (problem) { setError(problem); return; }
    setSaving(mode);
    setError(null);
    const payload = {
      vendorId: form.vendorId,
      priority: form.priority,
      currency: form.currency,
      issueDate: form.issueDate,
      expectedDeliveryDate: form.expectedDeliveryDate,
      terms: form.terms,
      deliveryAddress: form.deliveryAddress,
      notes: form.notes,
      lineItems: form.lines
        .filter(l => l.description.trim())
        .map(l => ({ description: l.description.trim(), quantity: Number(l.quantity), unitPrice: Number(l.unitPrice), deliveryDate: l.deliveryDate || null })),
    };
    try {
      let res: any;
      if (po) {
        res = await purchaseOrderService.updatePurchaseOrder(po.id, payload);
        if (mode === 'submit' && po.status === 'new') res = await purchaseOrderService.submitPO(po.id);
      } else {
        res = await purchaseOrderService.createPurchaseOrder({ ...payload, submitForApproval: mode === 'submit' });
      }
      onSaved(mapPurchaseOrder(res.data), !po);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the purchase order');
    } finally {
      setSaving(null);
    }
  };

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!saving) onOpenChange(o); }} direction="right">
      <DrawerContent className="data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-3xl p-0 gap-0 border-l shadow-2xl flex flex-col h-full bg-background">
        <DrawerHeader className="p-6 border-b shrink-0">
          <DrawerTitle className="text-xl font-semibold">{po ? `Edit ${po.poNumber}` : 'New purchase order'}</DrawerTitle>
          <DrawerDescription>
            {po ? 'Changes are saved to the backend. Only drafts and POs awaiting approval can be edited.' : 'Save as a draft, or submit it straight for approval.'}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Vendor and dates</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Vendor</Label>
                <Select value={form.vendorId || undefined} onValueChange={(v) => set('vendorId', v)}>
                  <SelectTrigger aria-label="Vendor"><SelectValue placeholder={vendorsLoading ? 'Loading vendors…' : 'Choose a vendor'} /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="po-issue">Issue date</Label>
                <Input id="po-issue" type="date" value={form.issueDate} onChange={(e) => set('issueDate', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="po-delivery">Expected delivery</Label>
                <Input id="po-delivery" type="date" min={form.issueDate} value={form.expectedDeliveryDate} onChange={(e) => set('expectedDeliveryDate', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => set('priority', v as POPriority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Select value={form.currency} onValueChange={(v) => set('currency', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['USD', 'EUR', 'GBP', 'INR', 'AED', 'SGD'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Line items</h3>
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => set('lines', [...form.lines, emptyLine()])}>
                <Plus className="w-4 h-4" /> Add line
              </Button>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <div className="hidden sm:grid grid-cols-[1fr_80px_120px_140px_110px_36px] gap-2 px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
                <span>Item</span><span className="text-right">Qty</span><span className="text-right">Unit price</span><span>Deliver by</span><span className="text-right">Total</span><span />
              </div>
              {form.lines.map((l, i) => (
                <div key={l.key} className="grid grid-cols-2 sm:grid-cols-[1fr_80px_120px_140px_110px_36px] gap-2 px-3 py-2 border-t first:border-t-0 sm:first:border-t items-center">
                  <Input aria-label={`Item ${i + 1}`} placeholder="Item description" value={l.description} onChange={(e) => setLine(l.key, { description: e.target.value })} className="col-span-2 sm:col-span-1" />
                  <Input aria-label={`Quantity ${i + 1}`} type="number" min="0" step="any" value={l.quantity} onChange={(e) => setLine(l.key, { quantity: e.target.value })} className="text-right" />
                  <Input aria-label={`Unit price ${i + 1}`} type="number" min="0" step="0.01" placeholder="0.00" value={l.unitPrice} onChange={(e) => setLine(l.key, { unitPrice: e.target.value })} className="text-right" />
                  <Input aria-label={`Deliver by ${i + 1}`} type="date" value={l.deliveryDate} onChange={(e) => setLine(l.key, { deliveryDate: e.target.value })} />
                  <span className="text-sm font-medium text-right tabular-nums">{formatMoney(lineTotal(l), form.currency)}</span>
                  <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 justify-self-end" aria-label={`Remove line ${i + 1}`}
                    disabled={form.lines.length === 1} onClick={() => set('lines', form.lines.filter(x => x.key !== l.key))}>
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Delivery and terms</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="po-terms">Payment terms</Label>
                <Input id="po-terms" value={form.terms} onChange={(e) => set('terms', e.target.value)} placeholder="Net 30" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="po-address">Delivery address</Label>
                <Input id="po-address" value={form.deliveryAddress} onChange={(e) => set('deliveryAddress', e.target.value)} placeholder="Warehouse or site address" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="po-notes">Notes for the vendor</Label>
                <Textarea id="po-notes" rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Delivery instructions, quality requirements…" />
              </div>
            </div>
          </section>
        </div>

        <div className="border-t p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 bg-background">
          <div>
            <p className="text-xs text-muted-foreground">PO total</p>
            <p className="text-lg font-semibold tabular-nums">{formatMoney(total, form.currency)}</p>
          </div>
          <div className="flex flex-col items-stretch sm:items-end gap-2">
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={!!saving}>Cancel</Button>
              <Button variant="outline" onClick={() => save('draft')} disabled={!!saving}>
                {saving === 'draft' ? 'Saving…' : po ? 'Save changes' : 'Save draft'}
              </Button>
              {(!po || po.status === 'new') && (
                <Button onClick={() => save('submit')} disabled={!!saving}>
                  {saving === 'submit' ? 'Submitting…' : 'Submit for approval'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
