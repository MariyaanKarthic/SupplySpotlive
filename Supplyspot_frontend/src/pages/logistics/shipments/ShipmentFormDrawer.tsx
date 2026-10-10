import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { purchaseOrderService, shipmentService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Shipment, formatQty, mapShipment } from './shipmentModel';

interface LineDraft { poLineIndex: number; description: string; ordered: number; remaining: number; quantity: string }

interface FormState {
  poId: string;
  carrierName: string;
  trackingNumber: string;
  expectedDeliveryDate: string;
  shippedDate: string;
  originAddress: string;
  destinationAddress: string;
  notes: string;
  lines: LineDraft[];
}

const SHIPPABLE = ['sent', 'acknowledged', 'partially_received'];
const empty = (poId = ''): FormState => ({
  poId, carrierName: '', trackingNumber: '', expectedDeliveryDate: '', shippedDate: '', originAddress: '', destinationAddress: '', notes: '', lines: [],
});

export function ShipmentFormDrawer({
  open,
  shipment,
  initialPoId,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  shipment: Shipment | null; // null = create
  initialPoId?: string | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (s: Shipment, created: boolean) => void;
}) {
  const [form, setForm] = useState<FormState>(empty());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingLines, setLoadingLines] = useState(false);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(f => ({ ...f, [key]: value }));

  const { data: poData, loading: posLoading } = useApi(
    useCallback(() => (open && !shipment ? purchaseOrderService.getPurchaseOrders({ page: 1, limit: 100 }) : Promise.resolve({ success: true, data: null })) as any, [open, shipment])
  );
  const pos = useMemo(
    () => (((poData as any)?.purchaseOrders || []) as any[]).filter(p => SHIPPABLE.includes(p.status) || p.id === initialPoId)
      .sort((a, b) => String(a.po_number).localeCompare(String(b.po_number))),
    [poData, initialPoId]
  );

  // Pull what is left to ship on the chosen PO, with its dates and addresses.
  const loadPO = useCallback(async (poId: string) => {
    setLoadingLines(true);
    setError(null);
    try {
      const res: any = await shipmentService.getRemainingForPO(poId);
      const d = res.data;
      setForm(f => ({
        ...f,
        poId,
        expectedDeliveryDate: d.po.expected_delivery_date || '',
        originAddress: d.vendor.address || '',
        destinationAddress: d.po.delivery_address || '',
        lines: d.lines.map((l: any) => ({ ...l, quantity: String(l.remaining) })),
      }));
      if (!SHIPPABLE.includes(d.po.status)) setError(`${d.po.po_number} must be sent to the vendor before goods can ship.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the purchase order');
    } finally {
      setLoadingLines(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (shipment) {
      setForm({
        ...empty(shipment.poId),
        carrierName: shipment.carrierName,
        trackingNumber: shipment.trackingNumber,
        expectedDeliveryDate: shipment.expectedDeliveryDate || '',
        shippedDate: shipment.shippedDate || '',
        originAddress: shipment.originAddress,
        destinationAddress: shipment.destinationAddress,
        notes: shipment.notes,
      });
    } else {
      setForm(empty(initialPoId || ''));
      if (initialPoId) loadPO(initialPoId);
    }
  }, [open, shipment, initialPoId, loadPO]);

  const nothingLeft = !shipment && form.poId && !loadingLines && form.lines.length > 0 && form.lines.every(l => l.remaining <= 0);

  const save = async () => {
    setError(null);
    if (!shipment && !form.poId) return setError('Choose the purchase order this shipment is for.');
    if (!form.expectedDeliveryDate) return setError('Enter the expected delivery date.');
    if (form.shippedDate && form.shippedDate > form.expectedDeliveryDate) return setError('Expected delivery cannot be before the shipped date.');
    const payload: any = {
      carrierName: form.carrierName.trim(),
      trackingNumber: form.trackingNumber.trim(),
      expectedDeliveryDate: form.expectedDeliveryDate,
      shippedDate: form.shippedDate || (shipment ? '' : undefined),
      originAddress: form.originAddress.trim(),
      destinationAddress: form.destinationAddress.trim(),
      notes: form.notes.trim(),
    };
    if (!shipment) {
      const items = form.lines.map(l => ({ poLineIndex: l.poLineIndex, quantity: Number(l.quantity) || 0 })).filter(i => i.quantity > 0);
      const over = form.lines.find(l => (Number(l.quantity) || 0) > l.remaining);
      if (over) return setError(`Only ${formatQty(over.remaining)} of "${over.description}" is left to ship.`);
      if (!items.length) return setError('Enter a quantity for at least one line.');
      payload.poId = form.poId;
      payload.items = items;
    }
    setSaving(true);
    try {
      const res: any = shipment ? await shipmentService.updateShipment(shipment.id, payload) : await shipmentService.createShipment(payload);
      onSaved(mapShipment(res.data), !shipment);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the shipment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!saving) onOpenChange(o); }} direction="right">
      <DrawerContent className="data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-2xl p-0 gap-0 border-l shadow-2xl flex flex-col h-full bg-background">
        <DrawerHeader className="p-6 border-b shrink-0">
          <DrawerTitle className="text-xl font-semibold">{shipment ? `Edit ${shipment.shipmentNumber}` : 'New shipment'}</DrawerTitle>
          <DrawerDescription>
            {shipment ? 'Update the carrier, tracking number and dates.' : 'Pick a PO that has been sent to its vendor. Quantities default to everything not yet received or already on its way.'}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!shipment && (
            <section className="space-y-3">
              <div className="space-y-1.5">
                <Label>Purchase order</Label>
                <Select value={form.poId} onValueChange={(v) => loadPO(v)} disabled={posLoading}>
                  <SelectTrigger><SelectValue placeholder={posLoading ? 'Loading purchase orders…' : 'Choose a sent purchase order'} /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {pos.map(p => <SelectItem key={p.id} value={p.id}>{p.po_number} · {p.vendor_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {form.poId && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-[1fr_90px_110px] gap-2 px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
                    <span>Item</span><span className="text-right">Left to ship</span><span className="text-right">Shipping now</span>
                  </div>
                  {loadingLines && <div className="p-4"><div className="h-6 rounded bg-muted animate-pulse" /></div>}
                  {!loadingLines && form.lines.map((l, i) => (
                    <div key={l.poLineIndex} className="grid grid-cols-[1fr_90px_110px] gap-2 px-3 py-2 border-t items-center">
                      <span className="text-sm">{l.description}<span className="block text-xs text-muted-foreground">Ordered {formatQty(l.ordered)}</span></span>
                      <span className="text-sm text-right tabular-nums text-muted-foreground">{formatQty(l.remaining)}</span>
                      <Input aria-label={`Quantity shipping for ${l.description}`} type="number" min="0" max={l.remaining} step="any" className="text-right"
                        value={l.quantity} disabled={l.remaining <= 0}
                        onChange={(e) => set('lines', form.lines.map((x, j) => (j === i ? { ...x, quantity: e.target.value } : x)))} />
                    </div>
                  ))}
                </div>
              )}
              {nothingLeft && <p className="text-sm text-amber-700">Everything on this PO is already received or on an open shipment.</p>}
            </section>
          )}

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="carrier">Carrier</Label>
              <Input id="carrier" placeholder="e.g. Blue Dart" value={form.carrierName} onChange={(e) => set('carrierName', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tracking">Tracking number</Label>
              <Input id="tracking" placeholder="AWB / LR number" value={form.trackingNumber} onChange={(e) => set('trackingNumber', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shipped">Shipped on</Label>
              <Input id="shipped" type="date" value={form.shippedDate} onChange={(e) => set('shippedDate', e.target.value)} />
              <p className="text-xs text-muted-foreground">Leave empty while it is still awaiting dispatch.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expected">Expected delivery</Label>
              <Input id="expected" type="date" value={form.expectedDeliveryDate} onChange={(e) => set('expectedDeliveryDate', e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="origin">Ships from</Label>
              <Input id="origin" placeholder="Supplier warehouse" value={form.originAddress} onChange={(e) => set('originAddress', e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="dest">Deliver to</Label>
              <Input id="dest" placeholder="Your receiving dock" value={form.destinationAddress} onChange={(e) => set('destinationAddress', e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" rows={3} placeholder="Handling instructions, temperature range, contact at the dock…" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
            </div>
          </section>
        </div>

        <div className="p-4 border-t flex items-center justify-between gap-3 shrink-0">
          <p className="text-sm text-destructive min-h-5" role="alert">{error}</p>
          <div className="flex gap-2 shrink-0">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving || loadingLines || !!nothingLeft}>{saving ? 'Saving…' : shipment ? 'Save changes' : 'Create shipment'}</Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
