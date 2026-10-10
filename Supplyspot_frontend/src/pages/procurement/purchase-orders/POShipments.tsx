import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Truck } from 'lucide-react';
import { shipmentService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { PurchaseOrder } from './poModel';
import { Shipment, etaLabel, formatDate, formatQty, isDelayed, mapShipment, toneClass } from '../../logistics/shipments/shipmentModel';
import { ShipmentStatusBadge } from '../../logistics/shipments/ShipmentList';

const SHIPPABLE = ['sent', 'acknowledged', 'partially_received'];

// Shipments carrying this PO's goods, with a shortcut to open another one.
export function POShipments({ po }: { po: PurchaseOrder }) {
  const [shipments, setShipments] = useState<Shipment[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    shipmentService.getShipments({ po_id: po.id })
      .then((res: any) => { if (!cancelled) setShipments((res.data?.shipments || []).map(mapShipment)); })
      .catch(() => { if (!cancelled) setShipments([]); });
    return () => { cancelled = true; };
  }, [po.id, po.status, po.updatedAt]);

  const shippable = SHIPPABLE.includes(po.status);
  if (!shippable && !shipments?.length) return null;

  return (
    <section className="space-y-3 no-print">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Truck className="w-4 h-4 text-muted-foreground" /> Shipments
          {shipments && <span className="text-muted-foreground font-normal">({shipments.length})</span>}
        </h2>
        {shippable && (
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <Link to={`?section=shipments&new=1&from_po=${po.id}`}><Plus className="w-4 h-4" /> Create shipment</Link>
          </Button>
        )}
      </div>
      <div className="rounded-lg border bg-card divide-y">
        {shipments === null && <div className="p-4"><div className="h-6 rounded bg-muted animate-pulse" /></div>}
        {shipments?.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">No shipment yet. Create one when the vendor confirms dispatch to track delivery.</p>
        )}
        {shipments?.map(s => {
          const eta = etaLabel(s);
          return (
            <Link key={s.id} to={`?section=shipments&shipment=${s.id}`}
              className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-muted/40 ${isDelayed(s) ? 'bg-red-50/60' : ''}`}>
              <div className="min-w-0">
                <p className="font-medium text-foreground">{s.shipmentNumber}</p>
                <p className="text-xs text-muted-foreground">
                  {[s.carrierName, s.trackingNumber].filter(Boolean).join(' · ') || 'Carrier not set'} · {formatQty(s.receivedQuantity)} of {formatQty(s.shippedQuantity)} received
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Expected {formatDate(s.expectedDeliveryDate)}</p>
                  {eta && <p className={`text-xs ${toneClass[eta.tone]}`}>{eta.text}</p>}
                </div>
                <ShipmentStatusBadge shipment={s} />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
