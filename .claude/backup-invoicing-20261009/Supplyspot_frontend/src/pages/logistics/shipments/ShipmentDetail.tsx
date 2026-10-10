import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, ArrowLeft, Ban, Check, ChevronDown, ClipboardCheck, Edit3, FileText, MapPin, MoreHorizontal, PackageCheck, Plus,
  Thermometer, Truck, Warehouse,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  EVENT_META, JOURNEY, STATUS_META, Shipment, canReceive, etaLabel, formatDate, formatDateTime, formatQty, isDelayed, isMoving, journeyIndex, toneClass,
} from './shipmentModel';
import { ShipmentStatusBadge } from './ShipmentList';
import { GRNDialog, ReceiveDialog, TrackingEventDialog } from './ShipmentDialogs';

export type ShipmentAction = 'track' | 'partial' | 'receive' | 'cancel';

function Fact({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{children}</dd>
    </div>
  );
}

function Journey({ s }: { s: Shipment }) {
  if (s.status === 'cancelled') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
        <Ban className="w-4 h-4" /> This shipment was cancelled{s.cancelReason ? `: ${s.cancelReason}` : '.'}
      </div>
    );
  }
  const current = journeyIndex(s);
  const late = isDelayed(s);
  return (
    <ol className="flex items-center overflow-x-auto pb-1" aria-label="Shipment progress">
      {JOURNEY.map((step, i) => {
        const done = i <= current;
        const next = i === current + 1;
        const label = step.id === 'received' && s.status === 'partially_received' ? 'Partly received' : step.label;
        return (
          <li key={step.id} className="flex items-center shrink-0" aria-current={i === current ? 'step' : undefined}>
            <div className="flex items-center gap-2">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold
                ${done ? 'bg-primary border-primary text-primary-foreground' : next && late ? 'border-red-400 text-red-600 bg-red-50' : next ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground'}`}>
                {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </span>
              <span className={`text-xs sm:text-sm ${i === current ? 'font-semibold text-foreground' : done ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
            </div>
            {i < JOURNEY.length - 1 && <span className={`mx-2 sm:mx-3 h-px w-6 sm:w-10 ${i < current ? 'bg-primary' : 'bg-border'}`} />}
          </li>
        );
      })}
    </ol>
  );
}

const STATES = /^(andhra pradesh|arunachal pradesh|assam|bihar|chhattisgarh|goa|gujarat|haryana|himachal pradesh|jharkhand|karnataka|kerala|madhya pradesh|maharashtra|manipur|meghalaya|mizoram|nagaland|odisha|punjab|rajasthan|sikkim|tamil nadu|telangana|tripura|uttar pradesh|uttarakhand|west bengal|delhi|india)$/i;

// Short place label for the map, e.g. "..., Gurugram, Haryana 122001" -> "Gurugram".
const placeName = (address: string) => {
  const parts = address.split(',').map(p => p.replace(/\s*\d{5,6}$/, '').trim()).filter(Boolean);
  while (parts.length > 1 && STATES.test(parts[parts.length - 1])) parts.pop();
  return parts[parts.length - 1] || '—';
};

// Illustrative route: origin, destination and how far along the journey the shipment is. Not a live GPS map.
function RouteMap({ s }: { s: Shipment }) {
  const progress = s.status === 'cancelled' ? 0 : Math.min(1, journeyIndex(s) / 4);
  const late = isDelayed(s);
  const x = 40 + progress * 520;
  const y = 70 - Math.sin(progress * Math.PI) * 40;
  const lastLocation = [...s.events].reverse().find(e => e.location)?.location;
  return (
    <div className="rounded-lg border bg-card p-4">
      <svg viewBox="0 0 600 110" className="w-full h-auto max-h-40" role="img" aria-label={`Route from ${placeName(s.originAddress)} to ${placeName(s.destinationAddress)}`}>
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="currentColor" strokeOpacity="0.06" /></pattern>
        </defs>
        <rect width="600" height="110" fill="url(#grid)" className="text-foreground" />
        <path d="M40 70 Q300 -10 560 70" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" strokeDasharray="6 6" className="text-foreground" />
        {progress > 0 && (
          <path d="M40 70 Q300 -10 560 70" fill="none" stroke={late ? '#dc2626' : '#2563eb'} strokeWidth="3"
            pathLength={1} strokeDasharray={`${progress} 1`} />
        )}
        <circle cx="40" cy="70" r="7" fill="#4f46e5" />
        <circle cx="560" cy="70" r="7" fill="#059669" />
        {s.status !== 'cancelled' && progress > 0 && progress < 1 && (
          <g transform={`translate(${x - 12} ${y - 12})`}>
            <circle cx="12" cy="12" r="13" fill={late ? '#fee2e2' : '#dbeafe'} stroke={late ? '#dc2626' : '#2563eb'} />
            <Truck x={4} y={4} width={16} height={16} color={late ? '#dc2626' : '#2563eb'} />
          </g>
        )}
      </svg>
      <div className="flex justify-between gap-4 text-sm -mt-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-medium"><Warehouse className="w-3.5 h-3.5 text-indigo-600" /> {placeName(s.originAddress)}</p>
          <p className="text-xs text-muted-foreground truncate max-w-64">{s.originAddress || 'Origin not recorded'}</p>
        </div>
        {lastLocation && isMoving(s) && (
          <div className="text-center hidden sm:block">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="w-3.5 h-3.5" /> Last seen</p>
            <p className="text-sm font-medium">{lastLocation}</p>
          </div>
        )}
        <div className="min-w-0 text-right">
          <p className="flex items-center justify-end gap-1.5 font-medium"><MapPin className="w-3.5 h-3.5 text-emerald-600" /> {placeName(s.destinationAddress)}</p>
          <p className="text-xs text-muted-foreground truncate max-w-64 ml-auto">{s.destinationAddress || 'Destination not recorded'}</p>
        </div>
      </div>
    </div>
  );
}

function DeliveryDates({ s }: { s: Shipment }) {
  const eta = etaLabel(s);
  return (
    <div className="rounded-lg border bg-card p-4 grid grid-cols-3 gap-4">
      <div>
        <p className="text-xs text-muted-foreground">Shipped</p>
        <p className="mt-1 text-sm font-medium">{formatDate(s.shippedDate)}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Expected</p>
        <p className="mt-1 text-sm font-medium">{formatDate(s.expectedDeliveryDate)}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Actual</p>
        <p className="mt-1 text-sm font-medium">{formatDate(s.actualDeliveryDate)}</p>
      </div>
      {eta && (
        <p className={`col-span-3 text-sm border-t pt-3 ${toneClass[eta.tone]}`}>
          {eta.tone === 'late' && <AlertTriangle className="w-4 h-4 inline mr-1.5 -mt-0.5" />}
          {eta.text}
        </p>
      )}
    </div>
  );
}

export function ShipmentDetail({
  shipment: s,
  busy,
  onBack,
  onEdit,
  onAction,
}: {
  shipment: Shipment;
  busy: boolean;
  onBack: () => void;
  onEdit: () => void;
  onAction: (action: ShipmentAction, payload?: any) => Promise<boolean>;
}) {
  const [tracking, setTracking] = useState(false);
  const [receiving, setReceiving] = useState<'partial' | 'full' | null>(null);
  const [grn, setGrn] = useState<{ receiptId: string | null } | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const receivable = canReceive(s);
  const canTrack = s.status !== 'cancelled' && !s.isClosed;
  const canCancel = s.receiptCount === 0 && s.receipts.length === 0 && !['delivered', 'cancelled'].includes(s.status);
  const lastReceipt = s.receipts[s.receipts.length - 1];
  const events = [...s.events].reverse(); // newest first
  const arrivedAwaitingGrn = s.status === 'delivered' && !s.isClosed;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-wrap">
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={onBack} aria-label="Back to shipments"><ArrowLeft className="w-4 h-4" /></Button>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground truncate">{s.shipmentNumber}</h1>
          <ShipmentStatusBadge shipment={s} />
        </div>
        <div className="flex flex-wrap gap-2">
          {canTrack && (
            <Button variant={receivable && (s.status === 'delivered' || s.status === 'partially_received') ? 'outline' : 'default'} className="gap-2" onClick={() => setTracking(true)} disabled={busy}>
              <Plus className="w-4 h-4" /> Add tracking update
            </Button>
          )}
          {receivable && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant={s.status === 'delivered' || s.status === 'partially_received' ? 'default' : 'outline'} className="gap-2" disabled={busy}>
                  <PackageCheck className="w-4 h-4" /> Receive <ChevronDown className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setReceiving('full')} className="gap-2"><ClipboardCheck className="w-4 h-4" /> Receive in full</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setReceiving('partial')} className="gap-2"><PackageCheck className="w-4 h-4" /> Record partial delivery</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {s.receipts.length > 0 && (
            <Button variant="outline" className="gap-2" onClick={() => setGrn({ receiptId: lastReceipt?.id || null })}><FileText className="w-4 h-4" /> GRN</Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 w-9 p-0" aria-label="More actions"><MoreHorizontal className="w-4 h-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {s.status !== 'cancelled' && <DropdownMenuItem onClick={onEdit} className="gap-2"><Edit3 className="w-4 h-4" /> Edit details</DropdownMenuItem>}
              <DropdownMenuItem asChild className="gap-2">
                <Link to={`?section=purchase-orders&po=${s.poId}`}><FileText className="w-4 h-4" /> Open {s.poNumber}</Link>
              </DropdownMenuItem>
              {canCancel && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setConfirmCancel(true)} className="gap-2 text-destructive focus:text-destructive"><Ban className="w-4 h-4" /> Cancel shipment</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Journey s={s} />

      {isDelayed(s) && s.status !== 'cancelled' && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            {s.isOverdue ? `Expected ${formatDate(s.expectedDeliveryDate)} and not delivered yet.` : 'The carrier reported an exception.'}
            {(() => { const ex = [...s.events].reverse().find(e => e.statusEvent === 'exception'); return ex?.notes ? ` Last exception: ${ex.notes.replace(/[.\s]+$/, '')}.` : ''; })()}
            {' '}Chase the vendor, or update the expected date under More actions → Edit details.
          </span>
        </div>
      )}
      {arrivedAwaitingGrn && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center justify-between gap-3">
          <span>The goods have arrived. Check them in to issue a GRN and update {s.poNumber}.</span>
          <Button size="sm" onClick={() => setReceiving('full')}>Receive now</Button>
        </div>
      )}
      {s.isClosed && s.status === 'delivered' && lastReceipt && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span>
            Received with {lastReceipt.grnNumber}.{' '}
            {lastReceipt.appliedToPo
              ? `Quantities were posted to ${s.poNumber}, which is now ${s.po?.status === 'received' ? 'fully received and ready to close' : (s.po?.status || '').replace(/_/g, ' ')}.`
              : `Quantities were not posted to ${s.poNumber}; record the receipt there.`}
          </span>
          <Button size="sm" variant="outline" className="bg-white" asChild>
            <Link to={`?section=purchase-orders&po=${s.poId}`}>Process receipt in {s.poNumber}</Link>
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><RouteMap s={s} /></div>
        <DeliveryDates s={s} />
      </div>

      <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5 rounded-lg border bg-card p-5">
        <Fact label="Purchase order">
          <Link to={`?section=purchase-orders&po=${s.poId}`} className="text-primary hover:underline">{s.poNumber}</Link>
        </Fact>
        <Fact label="Vendor">
          <Link to={`?section=vendors&vendor=${s.vendorId}`} className="text-primary hover:underline">{s.vendorName}</Link>
        </Fact>
        <Fact label="Carrier">{s.carrierName || '—'}</Fact>
        <Fact label="Tracking number"><span className="font-mono">{s.trackingNumber || '—'}</span></Fact>
        <Fact label="Quantity">{formatQty(s.receivedQuantity)} of {formatQty(s.shippedQuantity)} received</Fact>
        <Fact label="Status">{s.isOverdue && s.status !== 'delayed' ? 'Delayed (overdue)' : STATUS_META[s.status].label}</Fact>
        {s.otherShipments.length > 0 && (
          <Fact label="Other shipments on this PO" className="col-span-2">
            {s.otherShipments.map((o, i) => (
              <span key={o.id}>{i > 0 && ', '}<Link to={`?section=shipments&shipment=${o.id}`} className="text-primary hover:underline">{o.shipment_number}</Link></span>
            ))}
          </Fact>
        )}
        {s.notes && <Fact label="Notes" className="col-span-2 md:col-span-4"><span className="font-normal whitespace-pre-wrap">{s.notes}</span></Fact>}
      </dl>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Items <span className="text-muted-foreground font-normal">({s.items.length})</span></h2>
          <div className="rounded-lg border bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Shipped</TableHead>
                  <TableHead className="text-right">Received</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {s.items.map(it => (
                  <TableRow key={it.poLineIndex}>
                    <TableCell className="font-medium">{it.description}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatQty(it.quantity)}</TableCell>
                    <TableCell className={`text-right tabular-nums ${it.receivedQuantity >= it.quantity ? 'text-emerald-700' : it.receivedQuantity > 0 ? 'text-amber-700' : 'text-muted-foreground'}`}>
                      {formatQty(it.receivedQuantity)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {s.receipts.length > 0 && (
            <>
              <h2 className="text-base font-semibold text-foreground pt-3">Goods receipts</h2>
              <ul className="rounded-lg border bg-card divide-y">
                {s.receipts.map(r => {
                  const received = r.items.reduce((a, it) => a + it.receivedQuantity, 0);
                  const short = r.items.reduce((a, it) => a + it.shortQuantity, 0);
                  return (
                    <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                      <div>
                        <p className="font-medium">{r.grnNumber} <span className="text-muted-foreground font-normal">· {r.isFinal ? 'final' : 'partial'}</span></p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(r.receivedDate)} · {formatQty(received)} received{short > 0 ? ` · ${formatQty(short)} ${r.isFinal ? 'short' : 'still to come'}` : ''}
                        </p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => setGrn({ receiptId: r.id })}>View</Button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Tracking history</h2>
          <div className="rounded-lg border bg-card p-4">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No updates yet.{canTrack ? ' Add one when the carrier or supplier reports progress.' : ''}
              </p>
            ) : (
              <ol className="relative space-y-5 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-px before:bg-border">
                {events.map(e => (
                  <li key={e.id} className="relative pl-6">
                    <span className={`absolute left-0 top-1.5 h-[11px] w-[11px] rounded-full ring-2 ring-background ${EVENT_META[e.statusEvent]?.dot || 'bg-slate-400'}`} />
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <p className={`text-sm font-medium ${e.statusEvent === 'exception' ? 'text-red-700' : 'text-foreground'}`}>{EVENT_META[e.statusEvent]?.label || e.statusEvent}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(e.eventDate)}</p>
                    </div>
                    {(e.location || e.temperature !== null) && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-3">
                        {e.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{e.location}</span>}
                        {e.temperature !== null && <span className="flex items-center gap-1"><Thermometer className="w-3 h-3" />{e.temperature} °C</span>}
                      </p>
                    )}
                    {e.notes && <p className="text-sm text-foreground/80 mt-1">{e.notes}</p>}
                  </li>
                ))}
                {s.createdAt && (
                  <li className="relative pl-6">
                    <span className="absolute left-0 top-1.5 h-[11px] w-[11px] rounded-full ring-2 ring-background bg-slate-300" />
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <p className="text-sm text-muted-foreground">Shipment created</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(s.createdAt)}</p>
                    </div>
                  </li>
                )}
              </ol>
            )}
          </div>
        </section>
      </div>

      <TrackingEventDialog open={tracking} shipment={s} busy={busy} onOpenChange={setTracking} onSubmit={(data) => onAction('track', data)} />
      <ReceiveDialog open={!!receiving} mode={receiving || 'full'} shipment={s} busy={busy}
        onOpenChange={(o) => { if (!o) setReceiving(null); }}
        onSubmit={async (mode, data) => {
          const ok = await onAction(mode === 'full' ? 'receive' : 'partial', data);
          if (ok) setGrn({ receiptId: null });
          return ok;
        }} />
      <GRNDialog open={!!grn} shipmentId={s.id} receiptId={grn?.receiptId || null} onOpenChange={(o) => { if (!o) setGrn(null); }} />

      <AlertDialog open={confirmCancel} onOpenChange={(o) => { if (!busy) setConfirmCancel(o); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel {s.shipmentNumber}?</AlertDialogTitle>
            <AlertDialogDescription>Its quantities go back to "left to ship" on {s.poNumber}, so you can create a new shipment for them.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Back</AlertDialogCancel>
            <AlertDialogAction disabled={busy} className="bg-destructive text-white hover:bg-destructive/90"
              onClick={async (e) => { e.preventDefault(); if (await onAction('cancel')) setConfirmCancel(false); }}>
              {busy ? 'Working…' : 'Cancel shipment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
