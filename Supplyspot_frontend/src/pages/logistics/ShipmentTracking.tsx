import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useApi } from '@/hooks/useApi';
import { shipmentService } from '@/services/api';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { STATUS_FILTERS, Shipment, mapShipment } from './shipments/shipmentModel';
import { ShipmentList, ShipmentFilters } from './shipments/ShipmentList';
import { ShipmentDetail, ShipmentAction } from './shipments/ShipmentDetail';
import { ShipmentFormDrawer } from './shipments/ShipmentFormDrawer';

const ACTION_CALLS: Record<ShipmentAction, (id: string, payload?: any) => Promise<any>> = {
  track: (id, payload) => shipmentService.addTrackingEvent(id, payload),
  partial: (id, payload) => shipmentService.partialReceive(id, payload),
  receive: (id, payload) => shipmentService.receive(id, payload),
  cancel: (id) => shipmentService.cancelShipment(id),
};

const ACTION_DONE: Record<ShipmentAction, string> = {
  track: 'tracking update added',
  partial: 'partial delivery recorded',
  receive: 'received',
  cancel: 'cancelled',
};

export function ShipmentTracking({ onNavigate }: { onNavigate?: (view: any) => void }) {
  // Open shipment, create drawer and filters live in the URL so links work and Back behaves.
  const [searchParams, setSearchParams] = useSearchParams();
  const shipmentId = searchParams.get('shipment');
  const creating = searchParams.get('new') === '1';
  const fromPo = searchParams.get('from_po');
  const statusParam = searchParams.get('status') || 'all';
  const filters: ShipmentFilters = {
    status: STATUS_FILTERS.some(f => f.id === statusParam) ? statusParam : 'all',
    search: searchParams.get('q') || '',
    vendorId: searchParams.get('vendor') || '',
    poId: searchParams.get('po') || '',
    dueFrom: searchParams.get('due_from') || '',
    dueTo: searchParams.get('due_to') || '',
  };

  const updateParams = useCallback((patch: Record<string, string | null>, replace = false) => {
    setSearchParams(() => {
      const next = new URLSearchParams(window.location.search);
      Object.entries(patch).forEach(([k, v]) => (v === null || v === '' ? next.delete(k) : next.set(k, v)));
      return next;
    }, { replace });
  }, [setSearchParams]);

  const { data, loading, error, refetch } = useApi(useCallback(() => shipmentService.getShipments({ limit: 500 }) as any, []));
  const [shipments, setShipments] = useState<Shipment[]>([]);
  useEffect(() => {
    const raw = (data as any)?.shipments;
    if (raw) setShipments(raw.map(mapShipment));
  }, [data]);

  // The detail view needs events and receipts, which the list does not carry.
  const [detail, setDetail] = useState<Shipment | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const loadDetail = useCallback(async (id: string) => {
    setDetailError(null);
    try {
      const res: any = await shipmentService.getShipment(id);
      setDetail(mapShipment(res.data));
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'Not found');
    }
  }, []);
  useEffect(() => {
    if (shipmentId) loadDetail(shipmentId);
    else setDetail(null);
  }, [shipmentId, loadDetail]);
  const selected = detail && detail.id === shipmentId ? detail : null;

  const [editing, setEditing] = useState<Shipment | null>(null);
  const [busy, setBusy] = useState(false);

  const upsert = (s: Shipment) => {
    setShipments(prev => (prev.some(p => p.id === s.id) ? prev.map(p => (p.id === s.id ? s : p)) : [s, ...prev]));
    if (s.id === shipmentId) setDetail(s);
  };

  const runAction = async (s: Shipment, action: ShipmentAction, payload?: any): Promise<boolean> => {
    setBusy(true);
    try {
      const res: any = await ACTION_CALLS[action](s.id, payload);
      const updated = mapShipment(res.data);
      upsert(updated);
      if (action === 'receive' || action === 'partial') {
        const grn = res.data?.receipt?.grn_number;
        toast.success(`${s.shipmentNumber} ${updated.status === 'partially_received' ? 'partially received' : 'received'}${grn ? `, ${grn} issued` : ''}.`);
      } else {
        toast.success(`${s.shipmentNumber}: ${ACTION_DONE[action]}.`);
      }
      return true;
    } catch (err) {
      toast.error(`Could not update ${s.shipmentNumber}: ${err instanceof Error ? err.message : 'unknown error'}`);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const backToList = () => updateParams({ shipment: null });
  const formOpen = creating || !!editing;

  const crumbs = (
    <div className="sticky top-0 bg-background/95 backdrop-blur z-20 border-b py-3 -mx-6 px-6">
      <Breadcrumb className="text-xs">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => onNavigate && onNavigate('home')} className="cursor-pointer">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Logistics</BreadcrumbPage></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {shipmentId
              ? <BreadcrumbLink onClick={backToList} className="cursor-pointer">Shipment Tracking</BreadcrumbLink>
              : <BreadcrumbPage>Shipment Tracking</BreadcrumbPage>}
          </BreadcrumbItem>
          {shipmentId && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>{selected?.shipmentNumber || '…'}</BreadcrumbPage></BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );

  let body: React.ReactNode;
  if (shipmentId && selected) {
    body = (
      <ShipmentDetail
        shipment={selected}
        busy={busy}
        onBack={backToList}
        onEdit={() => setEditing(selected)}
        onAction={(action, payload) => runAction(selected, action, payload)}
      />
    );
  } else if (shipmentId) {
    body = detailError ? (
      <div className="py-16 text-center space-y-3">
        <p className="font-medium text-foreground">This shipment could not be found.</p>
        <p className="text-sm text-muted-foreground">{detailError}</p>
        <Button variant="outline" onClick={backToList}>Back to shipments</Button>
      </div>
    ) : (
      <div className="space-y-4 py-6">
        <div className="h-8 w-56 rounded bg-muted animate-pulse" />
        <div className="h-40 rounded bg-muted animate-pulse" />
      </div>
    );
  } else {
    body = (
      <ShipmentList
        shipments={shipments}
        loading={loading}
        error={error}
        filters={filters}
        onFiltersChange={(f) => updateParams({
          ...(f.status !== undefined && { status: f.status === 'all' ? null : f.status }),
          ...(f.search !== undefined && { q: f.search }),
          ...(f.vendorId !== undefined && { vendor: f.vendorId }),
          ...(f.poId !== undefined && { po: f.poId }),
          ...(f.dueFrom !== undefined && { due_from: f.dueFrom }),
          ...(f.dueTo !== undefined && { due_to: f.dueTo }),
        }, true)}
        onOpen={(s) => updateParams({ shipment: s.id, new: null })}
        onCreate={() => updateParams({ new: '1' })}
        onRefresh={() => refetch()}
      />
    );
  }

  return (
    <div className="px-6 pb-6 space-y-6 w-full max-w-full overflow-x-hidden">
      {crumbs}
      {body}
      <ShipmentFormDrawer
        open={formOpen}
        shipment={editing}
        initialPoId={fromPo}
        onOpenChange={(open) => {
          if (open) return;
          setEditing(null);
          if (creating) updateParams({ new: null, from_po: null }, true);
        }}
        onSaved={(s, created) => {
          upsert(s);
          setEditing(null);
          toast.success(created ? `${s.shipmentNumber} created.` : `${s.shipmentNumber} saved.`);
          if (created) updateParams({ new: null, from_po: null, shipment: s.id }, true);
        }}
      />
    </div>
  );
}
