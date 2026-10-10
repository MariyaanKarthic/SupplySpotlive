import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useApi } from '@/hooks/useApi';
import { purchaseOrderService } from '@/services/api';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { PurchaseOrder, STATUS_FILTERS, mapPurchaseOrder } from './purchase-orders/poModel';
import { POList, ListFilters } from './purchase-orders/POList';
import { PODetail, POAction } from './purchase-orders/PODetail';
import { POFormDrawer } from './purchase-orders/POFormDrawer';

const ACTION_CALLS: Record<POAction, (id: string, payload?: any) => Promise<any>> = {
  submit: (id) => purchaseOrderService.submitPO(id),
  approve: (id) => purchaseOrderService.approvePO(id, {}),
  send: (id) => purchaseOrderService.sendToVendor(id),
  acknowledge: (id) => purchaseOrderService.acknowledgePO(id),
  receive: (id, payload) => purchaseOrderService.receiveGoods(id, payload || {}),
  close: (id) => purchaseOrderService.closePO(id),
  cancel: (id) => purchaseOrderService.cancelPO(id),
};

const ACTION_DONE: Record<POAction, string> = {
  submit: 'submitted for approval',
  approve: 'approved',
  send: 'sent to vendor',
  acknowledge: 'marked as acknowledged',
  receive: 'receipt recorded',
  close: 'closed',
  cancel: 'cancelled',
};

export function PurchaseOrderManagement({ onNavigate }: { onNavigate?: (view: any) => void }) {
  // The open PO, the create drawer and the list filters live in the URL so links can be shared and Back works.
  const [searchParams, setSearchParams] = useSearchParams();
  const poId = searchParams.get('po');
  const creating = searchParams.get('new') === '1';
  const statusParam = searchParams.get('status') || 'all';
  const filters: ListFilters = {
    status: STATUS_FILTERS.some(f => f.id === statusParam) ? statusParam : 'all',
    search: searchParams.get('q') || '',
    priority: searchParams.get('priority') || 'all',
    overdueOnly: searchParams.get('overdue') === '1',
  };

  const updateParams = useCallback((patch: Record<string, string | null>, replace = false) => {
    // Read the live URL rather than the render-time params so quick successive updates don't overwrite each other.
    setSearchParams(() => {
      const next = new URLSearchParams(window.location.search);
      Object.entries(patch).forEach(([k, v]) => (v === null || v === '' ? next.delete(k) : next.set(k, v)));
      return next;
    }, { replace });
  }, [setSearchParams]);

  const { data, loading, error, refetch } = useApi(
    useCallback(() => purchaseOrderService.getPurchaseOrders({ page: 1, limit: 100 }) as any, [])
  );
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  useEffect(() => {
    const raw = (data as any)?.purchaseOrders;
    if (raw) setPurchaseOrders(raw.map(mapPurchaseOrder));
  }, [data]);

  // A PO opened from a link may not be in the first page of results, so fetch it on its own.
  const [linkedPO, setLinkedPO] = useState<PurchaseOrder | null>(null);
  const [linkedError, setLinkedError] = useState<string | null>(null);
  const listedPO = useMemo(() => purchaseOrders.find(p => p.id === poId) || null, [purchaseOrders, poId]);
  useEffect(() => {
    setLinkedError(null);
    if (!poId || listedPO || loading) return;
    let cancelled = false;
    purchaseOrderService.getPurchaseOrder(poId)
      .then((res: any) => { if (!cancelled) setLinkedPO(mapPurchaseOrder(res.data)); })
      .catch((err) => { if (!cancelled) setLinkedError(err instanceof Error ? err.message : 'Not found'); });
    return () => { cancelled = true; };
  }, [poId, listedPO, loading]);
  const selectedPO = poId ? (listedPO || (linkedPO?.id === poId ? linkedPO : null)) : null;

  const [editing, setEditing] = useState<PurchaseOrder | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const upsert = (po: PurchaseOrder) => {
    setPurchaseOrders(prev => (prev.some(p => p.id === po.id) ? prev.map(p => (p.id === po.id ? po : p)) : [po, ...prev]));
    if (linkedPO?.id === po.id) setLinkedPO(po);
  };

  const runAction = async (po: PurchaseOrder, action: POAction, payload?: any): Promise<boolean> => {
    setBusyId(po.id);
    try {
      const res: any = await ACTION_CALLS[action](po.id, payload);
      const updated = mapPurchaseOrder(res.data);
      upsert(updated);
      const shipmentNote = action === 'send' && res.data?.shipment_number ? ` Shipment ${res.data.shipment_number} opened for tracking.` : '';
      toast.success(`${po.poNumber} ${action === 'receive' && updated.status === 'partially_received' ? 'partially received' : ACTION_DONE[action]}.${shipmentNote}`);
      return true;
    } catch (err) {
      toast.error(`Could not update ${po.poNumber}: ${err instanceof Error ? err.message : 'unknown error'}`);
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const runBulk = async (pos: PurchaseOrder[], action: 'approve' | 'send') => {
    const results = await Promise.allSettled(pos.map(po => ACTION_CALLS[action](po.id)));
    let ok = 0;
    results.forEach(r => { if (r.status === 'fulfilled') { ok++; upsert(mapPurchaseOrder((r.value as any).data)); } });
    if (ok) toast.success(`${ok} purchase order${ok === 1 ? '' : 's'} ${ACTION_DONE[action]}.`);
    if (ok < pos.length) toast.error(`${pos.length - ok} could not be ${ACTION_DONE[action]}. Refresh and try again.`);
  };

  const openPO = (po: PurchaseOrder) => updateParams({ po: po.id, new: null });
  const backToList = () => updateParams({ po: null });
  const formOpen = creating || !!editing;

  const crumbs = (
    <div className="sticky top-0 bg-background/95 backdrop-blur z-20 border-b py-3 -mx-6 px-6 no-print">
      <Breadcrumb className="text-xs">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => onNavigate && onNavigate('home')} className="cursor-pointer">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Procurement</BreadcrumbPage></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {poId
              ? <BreadcrumbLink onClick={backToList} className="cursor-pointer">Purchase Orders</BreadcrumbLink>
              : <BreadcrumbPage>Purchase Orders</BreadcrumbPage>}
          </BreadcrumbItem>
          {poId && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>{selectedPO?.poNumber || '…'}</BreadcrumbPage></BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );

  let body: React.ReactNode;
  if (poId && selectedPO) {
    body = (
      <PODetail
        po={selectedPO}
        busy={busyId === selectedPO.id}
        onBack={backToList}
        onEdit={() => setEditing(selectedPO)}
        onAction={(action, payload) => runAction(selectedPO, action, payload)}
      />
    );
  } else if (poId) {
    body = linkedError ? (
      <div className="py-16 text-center space-y-3">
        <p className="font-medium text-foreground">This purchase order could not be found.</p>
        <p className="text-sm text-muted-foreground">{linkedError}</p>
        <Button variant="outline" onClick={backToList}>Back to purchase orders</Button>
      </div>
    ) : (
      <div className="space-y-4 py-6">
        <div className="h-8 w-56 rounded bg-muted animate-pulse" />
        <div className="h-40 rounded bg-muted animate-pulse" />
      </div>
    );
  } else {
    body = (
      <POList
        purchaseOrders={purchaseOrders}
        loading={loading}
        error={error}
        busyId={busyId}
        filters={filters}
        onFiltersChange={(f) => updateParams({
          ...(f.status !== undefined && { status: f.status === 'all' ? null : f.status }),
          ...(f.search !== undefined && { q: f.search }),
          ...(f.priority !== undefined && { priority: f.priority === 'all' ? null : f.priority }),
          ...(f.overdueOnly !== undefined && { overdue: f.overdueOnly ? '1' : null }),
        }, true)}
        onOpen={openPO}
        onCreate={() => updateParams({ new: '1' })}
        onRefresh={() => refetch()}
        onAction={(po, action) => runAction(po, action)}
        onBulkAction={runBulk}
      />
    );
  }

  return (
    <div className="px-6 pb-6 space-y-6 w-full max-w-full overflow-x-hidden">
      {crumbs}
      {body}
      <POFormDrawer
        open={formOpen}
        po={editing}
        onOpenChange={(open) => {
          if (open) return;
          setEditing(null);
          if (creating) updateParams({ new: null }, true);
        }}
        onSaved={(po, created) => {
          upsert(po);
          setEditing(null);
          toast.success(created ? `${po.poNumber} created.` : `${po.poNumber} saved.`);
          if (created) updateParams({ new: null, po: po.id }, true);
        }}
      />
    </div>
  );
}
