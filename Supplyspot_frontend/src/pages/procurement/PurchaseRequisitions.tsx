import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { purchaseRequestService } from '@/services/api';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { CurrentUser, PurchaseRequest, STATUS_FILTERS, mapPurchaseRequest } from './purchase-requests/prModel';
import { PRList, ListFilters } from './purchase-requests/PRList';
import { PRDetail, PRAction } from './purchase-requests/PRDetail';
import { PRFormDrawer } from './purchase-requests/PRFormDrawer';

const ACTION_CALLS: Record<PRAction, (id: string, payload?: any) => Promise<any>> = {
  submit: (id) => purchaseRequestService.submitPR(id),
  approve: (id, payload) => purchaseRequestService.approvePR(id, payload || {}),
  reject: (id, payload) => purchaseRequestService.rejectPR(id, payload),
  revise: (id) => purchaseRequestService.revisePR(id),
  delete: (id) => purchaseRequestService.deletePurchaseRequest(id),
  create_rfq: (id, payload) => purchaseRequestService.createRFQ(id, payload),
};

const ACTION_DONE: Record<PRAction, string> = {
  submit: 'submitted for approval',
  approve: 'approved',
  reject: 'rejected',
  revise: 'reopened as a draft',
  delete: 'deleted',
  create_rfq: 'sent out for quotation',
};

// Purchase Requests: the first step of the buying flow. Kept under the existing "purchase-requisitions" section id
// so saved links keep working.
export function PurchaseRequisitions({ onNavigate }: { onNavigate?: (view: any) => void }) {
  const { vendor: authUser } = useAuth();
  const user: CurrentUser = useMemo(() => ({ id: authUser?.id || null, role: authUser?.role || null }), [authUser]);

  // The open request, the create drawer and the list filters live in the URL so links can be shared and Back works.
  const [searchParams, setSearchParams] = useSearchParams();
  const prId = searchParams.get('pr');
  const creating = searchParams.get('new') === '1';
  const statusParam = searchParams.get('status') || 'all';
  const filters: ListFilters = {
    status: STATUS_FILTERS.some(f => f.id === statusParam) ? statusParam : 'all',
    search: searchParams.get('q') || '',
    department: searchParams.get('dept') || 'all',
    priority: searchParams.get('priority') || 'all',
    mineOnly: searchParams.get('mine') === '1',
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
    useCallback(() => purchaseRequestService.getPurchaseRequests({ page: 1, limit: 100 }) as any, [])
  );
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  useEffect(() => {
    const raw = (data as any)?.purchaseRequests;
    if (raw) setRequests(raw.map(mapPurchaseRequest));
  }, [data]);

  // A request opened from a link may not be in the first page of results, so fetch it on its own.
  const [linkedPR, setLinkedPR] = useState<PurchaseRequest | null>(null);
  const [linkedError, setLinkedError] = useState<string | null>(null);
  const listedPR = useMemo(() => requests.find(r => r.id === prId) || null, [requests, prId]);
  useEffect(() => {
    setLinkedError(null);
    if (!prId || listedPR || loading) return;
    let cancelled = false;
    purchaseRequestService.getPurchaseRequest(prId)
      .then((res: any) => { if (!cancelled) setLinkedPR(mapPurchaseRequest(res.data)); })
      .catch((err) => { if (!cancelled) setLinkedError(err instanceof Error ? err.message : 'Not found'); });
    return () => { cancelled = true; };
  }, [prId, listedPR, loading]);
  const selectedPR = prId ? (listedPR || (linkedPR?.id === prId ? linkedPR : null)) : null;

  const [editing, setEditing] = useState<PurchaseRequest | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const upsert = (pr: PurchaseRequest) => {
    setRequests(prev => (prev.some(r => r.id === pr.id) ? prev.map(r => (r.id === pr.id ? pr : r)) : [pr, ...prev]));
    if (linkedPR?.id === pr.id) setLinkedPR(pr);
  };

  const runAction = async (pr: PurchaseRequest, action: PRAction, payload?: any): Promise<boolean> => {
    setBusyId(pr.id);
    try {
      const res: any = await ACTION_CALLS[action](pr.id, payload);
      if (action === 'delete') {
        setRequests(prev => prev.filter(r => r.id !== pr.id));
        updateParams({ pr: null }, true);
      } else {
        const updated = mapPurchaseRequest(res.data);
        upsert(updated);
        // A revised request goes straight back into the editor, since fixing it is the reason to reopen it.
        if (action === 'revise') setEditing(updated);
      }
      toast.success(`${pr.prNumber} ${ACTION_DONE[action]}.`);
      return true;
    } catch (err) {
      toast.error(`Could not update ${pr.prNumber}: ${err instanceof Error ? err.message : 'unknown error'}`);
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const openPR = (pr: PurchaseRequest) => updateParams({ pr: pr.id, new: null });
  const backToList = () => updateParams({ pr: null });
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
            {prId
              ? <BreadcrumbLink onClick={backToList} className="cursor-pointer">Purchase Requests</BreadcrumbLink>
              : <BreadcrumbPage>Purchase Requests</BreadcrumbPage>}
          </BreadcrumbItem>
          {prId && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>{selectedPR?.prNumber || '…'}</BreadcrumbPage></BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );

  let body: React.ReactNode;
  if (prId && selectedPR) {
    body = (
      <PRDetail
        pr={selectedPR}
        user={user}
        busy={busyId === selectedPR.id}
        onBack={backToList}
        onEdit={() => setEditing(selectedPR)}
        onAction={(action, payload) => runAction(selectedPR, action, payload)}
        onOpenRfq={() => selectedPR.rfqId && setSearchParams({ section: 'rfq', rfq: selectedPR.rfqId })}
        onCreateRfq={() => setSearchParams({ section: 'rfq', new: '1', from_pr: selectedPR.id })}
      />
    );
  } else if (prId) {
    body = linkedError ? (
      <div className="py-16 text-center space-y-3">
        <p className="font-medium text-foreground">This purchase request could not be found.</p>
        <p className="text-sm text-muted-foreground">{linkedError}</p>
        <Button variant="outline" onClick={backToList}>Back to purchase requests</Button>
      </div>
    ) : (
      <div className="space-y-4 py-6">
        <div className="h-8 w-56 rounded bg-muted animate-pulse" />
        <div className="h-24 rounded bg-muted animate-pulse" />
        <div className="h-40 rounded bg-muted animate-pulse" />
      </div>
    );
  } else {
    body = (
      <PRList
        requests={requests}
        user={user}
        loading={loading}
        error={error}
        busyId={busyId}
        filters={filters}
        onFiltersChange={(f) => updateParams({
          ...(f.status !== undefined && { status: f.status === 'all' ? null : f.status }),
          ...(f.search !== undefined && { q: f.search }),
          ...(f.department !== undefined && { dept: f.department === 'all' ? null : f.department }),
          ...(f.priority !== undefined && { priority: f.priority === 'all' ? null : f.priority }),
          ...(f.mineOnly !== undefined && { mine: f.mineOnly ? '1' : null }),
        }, true)}
        onOpen={openPR}
        onCreate={() => updateParams({ new: '1' })}
        onRefresh={() => refetch()}
        onAction={(pr, action) => runAction(pr, action)}
      />
    );
  }

  return (
    <div className="px-6 pb-6 space-y-6 w-full max-w-full overflow-x-hidden">
      {crumbs}
      {body}
      <PRFormDrawer
        open={formOpen}
        pr={editing}
        defaultDepartment={authUser?.department || ''}
        onOpenChange={(open) => {
          if (open) return;
          setEditing(null);
          if (creating) updateParams({ new: null }, true);
        }}
        onSaved={(pr, created) => {
          upsert(pr);
          setEditing(null);
          const verb = pr.status === 'submitted' ? 'submitted for approval' : created ? 'saved as a draft' : 'saved';
          toast.success(`${pr.prNumber} ${verb}.`);
          if (created) updateParams({ new: null, pr: pr.id }, true);
        }}
      />
    </div>
  );
}
