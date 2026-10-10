import React, { useEffect, useState } from 'react';
import { Printer } from 'lucide-react';
import { toast } from 'sonner';
import { shipmentService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EVENT_META, Shipment, TrackingEventType, formatDate, formatQty } from './shipmentModel';

const nowLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};
const todayIso = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

// Manual tracking update, since there is no carrier feed.
export function TrackingEventDialog({
  open, shipment, busy, onOpenChange, onSubmit,
}: {
  open: boolean;
  shipment: Shipment;
  busy: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (data: any) => Promise<boolean>;
}) {
  const [event, setEvent] = useState<TrackingEventType>('in_transit');
  const [when, setWhen] = useState(nowLocal());
  const [location, setLocation] = useState('');
  const [temperature, setTemperature] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const seen = new Set(shipment.events.map(e => e.statusEvent));
    setEvent(!seen.has('picked_up') && !shipment.shippedDate ? 'picked_up' : seen.has('out_for_delivery') ? 'delivered' : 'in_transit');
    setWhen(nowLocal());
    setLocation('');
    setTemperature('');
    setNotes('');
    setError(null);
  }, [open, shipment]);

  const submit = async () => {
    setError(null);
    const date = new Date(when);
    if (isNaN(date.getTime())) return setError('Enter when this happened.');
    if (date.getTime() > Date.now() + 60000) return setError('The time cannot be in the future.');
    if (event === 'exception' && !notes.trim()) return setError('Describe the exception so others know what happened.');
    const ok = await onSubmit({
      statusEvent: event,
      eventDate: date.toISOString(),
      location: location.trim(),
      temperature: temperature === '' ? null : Number(temperature),
      notes: notes.trim(),
    });
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) onOpenChange(o); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add tracking update</DialogTitle>
          <DialogDescription>Log what the carrier or supplier reported for {shipment.shipmentNumber}.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>What happened</Label>
            <Select value={event} onValueChange={(v) => setEvent(v as TrackingEventType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(EVENT_META) as TrackingEventType[]).map(k => <SelectItem key={k} value={k}>{EVENT_META[k].label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ev-when">When</Label>
            <Input id="ev-when" type="datetime-local" value={when} max={nowLocal()} onChange={(e) => setWhen(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ev-loc">Location</Label>
            <Input id="ev-loc" placeholder="e.g. Pune hub" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ev-temp">Temperature (°C, optional)</Label>
            <Input id="ev-temp" type="number" step="0.1" placeholder="For cold-chain goods" value={temperature} onChange={(e) => setTemperature(e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="ev-notes">Notes{event === 'exception' ? '' : ' (optional)'}</Label>
            <Textarea id="ev-notes" rows={2} placeholder={event === 'exception' ? 'What went wrong and the new estimate, if known' : ''} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        {event === 'exception' && <p className="text-xs text-red-600">An exception marks the shipment as delayed until the next movement is logged.</p>}
        {event === 'delivered' && <p className="text-xs text-muted-foreground">This records the arrival. Record the goods receipt afterwards to check quantities and issue a GRN.</p>}
        <DialogFooter className="items-center">
          <p className="text-sm text-destructive mr-auto" role="alert">{error}</p>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Add update'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Receive goods: a partial delivery keeps the shipment open; "receive in full" closes it and logs any shortfall.
export function ReceiveDialog({
  open, mode, shipment, busy, onOpenChange, onSubmit,
}: {
  open: boolean;
  mode: 'partial' | 'full';
  shipment: Shipment;
  busy: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (mode: 'partial' | 'full', data: any) => Promise<boolean>;
}) {
  const [date, setDate] = useState(todayIso());
  const [qty, setQty] = useState<string[]>([]);
  const [reasons, setReasons] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [applyToPo, setApplyToPo] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const outstanding = shipment.items.map(it => Math.max(0, it.quantity - it.receivedQuantity));

  useEffect(() => {
    if (!open) return;
    setDate(shipment.actualDeliveryDate || todayIso());
    setQty(outstanding.map(o => (mode === 'full' ? String(o) : '')));
    setReasons(shipment.items.map(() => ''));
    setNotes('');
    setApplyToPo(true);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, shipment]);

  const submit = async () => {
    setError(null);
    if (!date) return setError('Enter the delivery date.');
    if (date > todayIso()) return setError('The delivery date cannot be in the future.');
    const items = shipment.items.map((it, i) => ({ poLineIndex: it.poLineIndex, quantity: Number(qty[i]) || 0, reason: reasons[i]?.trim() || undefined }));
    const over = items.findIndex((it, i) => it.quantity > outstanding[i] || it.quantity < 0);
    if (over >= 0) return setError(`"${shipment.items[over].description}": enter between 0 and ${formatQty(outstanding[over])}.`);
    if (mode === 'partial' && items.every(it => it.quantity <= 0)) return setError('Enter the quantity received for at least one line.');
    const missingReason = items.findIndex((it, i) => it.quantity < outstanding[i] && outstanding[i] > 0 && !it.reason);
    if (mode === 'full' && missingReason >= 0) return setError(`Say why "${shipment.items[missingReason].description}" came up short.`);
    const ok = await onSubmit(mode, { receivedDate: date, items, notes: notes.trim(), applyToPo });
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) onOpenChange(o); }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === 'full' ? 'Receive shipment' : 'Record partial delivery'}</DialogTitle>
          <DialogDescription>
            {mode === 'full'
              ? 'Confirm what arrived. This closes the shipment and issues a GRN; anything not received is logged as short.'
              : 'Enter only what arrived in this delivery. The shipment stays open for the rest.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="max-w-48 space-y-1.5">
            <Label htmlFor="rcv-date">Delivered on</Label>
            <Input id="rcv-date" type="date" value={date} max={todayIso()} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Expected</TableHead>
                  <TableHead className="text-right w-28">Received</TableHead>
                  <TableHead>Reason if short</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipment.items.map((it, i) => {
                  const short = outstanding[i] > 0 && (Number(qty[i]) || 0) < outstanding[i];
                  return (
                    <TableRow key={it.poLineIndex}>
                      <TableCell>
                        {it.description}
                        {it.receivedQuantity > 0 && <span className="block text-xs text-muted-foreground">{formatQty(it.receivedQuantity)} already received</span>}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatQty(outstanding[i])}</TableCell>
                      <TableCell>
                        <Input aria-label={`Received quantity for ${it.description}`} type="number" min="0" max={outstanding[i]} step="any" className="text-right"
                          value={qty[i] ?? ''} disabled={outstanding[i] <= 0} placeholder="0"
                          onChange={(e) => setQty(q => q.map((v, j) => (j === i ? e.target.value : v)))} />
                      </TableCell>
                      <TableCell>
                        <Input aria-label={`Reason for ${it.description}`} placeholder={short ? (mode === 'full' ? 'Required' : 'e.g. back-ordered') : ''}
                          value={reasons[i] ?? ''} disabled={!short}
                          onChange={(e) => setReasons(r => r.map((v, j) => (j === i ? e.target.value : v)))} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rcv-notes">Notes (optional)</Label>
            <Textarea id="rcv-notes" rows={2} placeholder="Condition of goods, who signed, seal numbers…" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <label className="flex items-start gap-2 text-sm cursor-pointer">
            <Checkbox checked={applyToPo} onCheckedChange={(c) => setApplyToPo(c === true)} className="mt-0.5" />
            <span>Also record these quantities on {shipment.poNumber}<span className="block text-xs text-muted-foreground">Updates the PO's received quantities and status.</span></span>
          </label>
        </div>
        <DialogFooter className="items-center">
          <p className="text-sm text-destructive mr-auto" role="alert">{error}</p>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>{busy ? 'Saving…' : mode === 'full' ? 'Receive and issue GRN' : 'Save partial delivery'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const esc = (v: unknown) => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
const money = (n: number, currency: string) => {
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(n); } catch { return `${currency} ${n.toFixed(2)}`; }
};

// GRN as a standalone printable page.
function grnHtml(data: any, r: any) {
  const currency = data.po?.currency || 'USD';
  const rows = r.items.map((it: any, i: number) => `
    <tr><td>${i + 1}</td><td>${esc(it.description)}</td><td class="n">${formatQty(it.shippedQuantity)}</td>
    <td class="n">${formatQty(it.previouslyReceived)}</td><td class="n"><b>${formatQty(it.receivedQuantity)}</b></td>
    <td class="n">${formatQty(it.shortQuantity)}</td><td>${esc(it.reason || '')}</td><td class="n">${money(it.value, currency)}</td></tr>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(r.grn_number)}</title><style>
    body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#111;margin:32px;font-size:13px}
    h1{font-size:22px;margin:0}.muted{color:#666}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:20px 0}
    .box{border:1px solid #ddd;border-radius:6px;padding:10px}.box b{display:block;font-size:11px;color:#666;font-weight:500;margin-bottom:4px}
    table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border-bottom:1px solid #e5e5e5;padding:6px 8px;text-align:left}
    th{background:#f6f6f6;font-size:11px;text-transform:uppercase;color:#555}.n{text-align:right}
    .sign{display:grid;grid-template-columns:1fr 1fr;gap:48px;margin-top:56px}.sign div{border-top:1px solid #999;padding-top:6px;color:#555}
    @media print{body{margin:12mm}}</style></head><body>
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div><h1>Goods Receipt Note</h1><div class="muted">${esc(r.grn_number)}${r.is_final ? '' : ' · partial delivery'}</div></div>
      <div style="text-align:right"><b>Received ${esc(formatDate(r.received_date))}</b><div class="muted">by ${esc(r.received_by_name || '—')}</div></div>
    </div>
    <div class="grid">
      <div class="box"><b>Supplier</b>${esc(data.vendor.name)}<br><span class="muted">${esc(data.vendor.address || '')}</span>${data.vendor.tax_id ? `<br><span class="muted">GST/Tax ID ${esc(data.vendor.tax_id)}</span>` : ''}</div>
      <div class="box"><b>Purchase order</b>${esc(data.po?.po_number || '—')}<br><span class="muted">Issued ${esc(formatDate(data.po?.issue_date || null))}</span></div>
      <div class="box"><b>Shipment</b>${esc(data.shipment.shipment_number)}<br><span class="muted">${esc([data.shipment.carrier_name, data.shipment.tracking_number].filter(Boolean).join(' · ') || 'Carrier not recorded')}</span></div>
      <div class="box"><b>Delivered to</b>${esc(data.shipment.destination_address || '—')}</div>
      <div class="box"><b>Expected delivery</b>${esc(formatDate(data.shipment.expected_delivery_date))}</div>
      <div class="box"><b>Received value</b>${money(r.total_value, currency)}</div>
    </div>
    <table><thead><tr><th>#</th><th>Item</th><th class="n">Shipped</th><th class="n">Earlier</th><th class="n">Received</th><th class="n">${r.is_final ? 'Short' : 'Outstanding'}</th><th>Reason</th><th class="n">Value</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td></td><td><b>Total</b></td><td></td><td></td><td class="n"><b>${formatQty(r.total_received)}</b></td><td class="n">${formatQty(r.total_short)}</td><td></td><td class="n"><b>${money(r.total_value, currency)}</b></td></tr></tfoot></table>
    ${r.notes ? `<p><b>Notes:</b> ${esc(r.notes)}</p>` : ''}
    <p class="muted">${r.applied_to_po ? 'Quantities posted to the purchase order.' : 'Quantities not posted to the purchase order.'}</p>
    <div class="sign"><div>Received by (stores)</div><div>Checked by (quality)</div></div>
    </body></html>`;
}

export function GRNDialog({
  open, shipmentId, receiptId, onOpenChange,
}: {
  open: boolean;
  shipmentId: string;
  receiptId: string | null;
  onOpenChange: (o: boolean) => void;
}) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setData(null);
    setError(null);
    shipmentService.getGRN(shipmentId, receiptId || undefined)
      .then((res: any) => setData(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load the GRN'));
  }, [open, shipmentId, receiptId]);

  const receipt = data?.receipts?.[data.receipts.length - 1];
  const print = () => {
    const w = window.open('', '_blank');
    if (!w) return toast.error('Allow pop-ups for this site to print the GRN.');
    w.document.write(grnHtml(data, receipt));
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 250);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{receipt ? `Goods receipt note ${receipt.grn_number}` : 'Goods receipt note'}</DialogTitle>
          <DialogDescription>
            {receipt ? `${receipt.is_final ? 'Final receipt' : 'Partial delivery'} received ${formatDate(receipt.received_date)}${receipt.received_by_name ? ` by ${receipt.received_by_name}` : ''}.` : 'Loading…'}
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!data && !error && <div className="h-40 rounded bg-muted animate-pulse" />}
        {receipt && (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div><dt className="text-xs text-muted-foreground">Supplier</dt><dd className="font-medium">{data.vendor.name}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Purchase order</dt><dd className="font-medium">{data.po?.po_number}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Shipment</dt><dd className="font-medium">{data.shipment.shipment_number}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Received value</dt><dd className="font-medium">{money(receipt.total_value, data.po?.currency || 'USD')}</dd></div>
            </dl>
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Shipped</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                    <TableHead className="text-right">{receipt.is_final ? 'Short' : 'Outstanding'}</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipt.items.map((it: any) => (
                    <TableRow key={it.poLineIndex}>
                      <TableCell>{it.description}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatQty(it.shippedQuantity)}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">{formatQty(it.receivedQuantity)}</TableCell>
                      <TableCell className={`text-right tabular-nums ${it.shortQuantity > 0 ? 'text-amber-700' : 'text-muted-foreground'}`}>{formatQty(it.shortQuantity)}</TableCell>
                      <TableCell className="text-muted-foreground">{it.reason || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {receipt.notes && <p className="text-sm"><span className="text-muted-foreground">Notes:</span> {receipt.notes}</p>}
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
          <Button className="gap-2" onClick={print} disabled={!receipt}><Printer className="w-4 h-4" /> Print GRN</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
