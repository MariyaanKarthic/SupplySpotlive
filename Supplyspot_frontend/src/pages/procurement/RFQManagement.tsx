import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { CheckCircle, ShoppingCart } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { purchaseRequestService, quotationService, rfqService, vendorService } from '@/services/api';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { PurchaseRequest, mapPurchaseRequest } from './purchase-requests/prModel';
import { Quotation, RFQ, RFQVendor, STATUS_FILTERS, canManage, formatMoney, mapRFQ } from './rfqs/rfqModel';
import { RFQList, ListFilters } from './rfqs/RFQList';
import { QuoteAction, RFQAction, RFQDetail } from './rfqs/RFQDetail';
import { RFQFormDrawer } from './rfqs/RFQFormDrawer';
import { QuotationFormDrawer } from './rfqs/QuotationFormDrawer';

const RFQ_CALLS: Record<RFQAction, (id: string, payload?: any) => Promise<any>> = {
  send: (id) => rfqService.sendRFQ(id),
  start_review: (id) => rfqService.startReview(id),
  close: (id, payload) => rfqService.closeRFQ(id, payload || {}),
  delete: (id) => rfqService.deleteRFQ(id),
};
const RFQ_DONE: Record<RFQAction, string> = {
  send: 'sent to vendors',
  start_review: 'moved to review',
  close: 'closed',
  delete: 'deleted',
};
const QUOTE_CALLS: Record<QuoteAction, (id: string, payload?: any) => Promise<any>> = {
  review: (id) => quotationService.reviewQuotation(id),
  accept: (id, payload) => quotationService.acceptQuotation(id, payload || {}),
  reject: (id, payload) => quotationService.rejectQuotation(id, payload),
  archive: (id) => quotationService.archiveQuotation(id),
  unarchive: (id) => quotationService.unarchiveQuotation(id),
};
const QUOTE_DONE: Record<QuoteAction, string> = {
  review: 'marked as reviewed',
  accept: 'accepted',
  reject: 'rejected',
  archive: 'archived',
  unarchive: 'restored',
};
const TABS = ['quotations', 'compare', 'details', 'activity'];

// RFQs and quotations: the second step of the buying flow, between an approved purchase request and the purchase order.
export function RFQManagement({ onNavigate }: { onNavigate?: (view: any) => void }) {
  const { vendor: authUser } = useAuth();
  const manage = canManage(authUser?.role);

  // The open RFQ, its tab, the drawers and the list filters live in the URL so links can be shared and Back works.
  const [searchParams, setSearchParams] = useSearchParams();
  const rfqId = searchParams.get('rfq');
  const tabParam = searchParams.get('tab') || 'quotations';
  const tab = TABS.includes(tabParam) ? tabParam : 'quotations';
  const creating = searchParams.get('new') === '1';
  const fromPrId = searchParams.get('from_pr');
  const recordParam = searchParams.get('record'); // '1' or a vendor id
  const statusParam = searchParams.get('status') || 'all';
  const filters: ListFilters = {
    status: STATUS_FILTERS.some(f => f.id === statusParam) ? statusParam : 'all',
    search: searchParams.get('q') || '',
    prId: searchParams.get('pr') || 'all',
    vendorId: searchParams.get('vendor') || 'all',
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
    useCallback(() => rfqService.getRFQs({ page: 1, limit: 100 }) as any, [])
  );
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  useEffect(() => {
    const raw = (data as any)?.rfqs;
    if (raw) setRfqs(raw.map(mapRFQ));
  }, [data]);

  // The list response has no quotations, so the open RFQ is always fetched on its own.
  const [detail, setDetail] = useState<RFQ | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const loadDetail = useCallback(async (id: string) => {
    setDetailError(null);
    try {
      const res: any = await rfqService.getRFQ(id);
      const mapped = mapRFQ(res.data);
      setDetail(mapped);
      setRfqs(prev => (prev.some(r => r.id === mapped.id) ? prev.map(r => (r.id === mapped.id ? { ...mapped, quotations: null } : r)) : prev));
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'Not found');
    }
  }, []);
  useEffect(() => {
    if (rfqId) loadDetail(rfqId);
    else setDetail(null);
  }, [rfqId, loadDetail]);
  const selected = rfqId && detail?.id === rfqId ? detail : null;

  // Approved purchase requests that still need an RFQ, and the vendor list, for the create and edit drawer.
  const [openPRs, setOpenPRs] = useState<PurchaseRequest[]>([]);
  const [vendors, setVendors] = useState<RFQVendor[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [editing, setEditing] = useState<RFQ | null>(null);
  const formOpen = creating || !!editing;
  useEffect(() => {
    if (!formOpen) return;
    let cancelled = false;
    purchaseRequestService.getPurchaseRequests({ status: 'approved', limit: 100 })
      .then((res: any) => {
        if (cancelled) return;
        setOpenPRs((res.data?.purchaseRequests || []).map(mapPurchaseRequest).filter((p: PurchaseRequest) => !p.rfqId));
      })
      .catch(() => { if (!cancelled) setOpenPRs([]); });
    if (!vendors.length) {
      setVendorsLoading(true);
      vendorService.getVendors({ limit: 100 })
        .then((res: any) => {
          if (cancelled) return;
          setVendors((res.data?.vendors || []).map((v: any) => ({
            id: v.id, name: v.name, category: v.category, status: v.status, rating: Number(v.rating) || 0,
          })));
        })
        .catch(() => { if (!cancelled) toast.error('Could not load vendors'); })
        .finally(() => { if (!cancelled) setVendorsLoading(false); });
    }
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formOpen]);

  const [busy, setBusy] = useState(false);
  const [busyQuoteId, setBusyQuoteId] = useState<string | null>(null);
  const [comparisonKey, setComparisonKey] = useState(0);
  const [award, setAward] = useState<{ poId: string; poNumber: string; vendorName: string; amount: number; currency: string } | null>(null);

  const refreshAfterChange = async (id: string) => {
    await loadDetail(id);
    setComparisonKey(k => k + 1);
  };

  const runRfqAction = async (rfq: RFQ, action: RFQAction, payload?: any): Promise<boolean> => {
    setBusy(true);
    try {
      const res: any = await RFQ_CALLS[action](rfq.id, payload);
      if (action === 'delete') {
        setRfqs(prev => prev.filter(r => r.id !== rfq.id));
        updateParams({ rfq: null, tab: null }, true);
      } else {
        const updated = mapRFQ(res.data);
        setDetail(updated);
        setRfqs(prev => prev.map(r => (r.id === updated.id ? { ...updated, quotations: null } : r)));
      }
      toast.success(`${rfq.rfqNumber} ${RFQ_DONE[action]}.`);
      return true;
    } catch (err) {
      toast.error(`Could not update ${rfq.rfqNumber}: ${err instanceof Error ? err.message : 'unknown error'}`);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const runQuoteAction = async (rfq: RFQ, q: Quotation, action: QuoteAction, payload?: any): Promise<boolean> => {
    setBusyQuoteId(q.id);
    try {
      const res: any = await QUOTE_CALLS[action](q.id, payload);
      await refreshAfterChange(rfq.id);
      if (action === 'accept' && res.data?.purchase_order) {
        setAward({ poId: res.data.purchase_order.id, poNumber: res.data.purchase_order.po_number, vendorName: q.vendorName, amount: q.totalAmount, currency: q.currency });
      } else {
        toast.success(`${q.vendorName}'s quotation ${QUOTE_DONE[action]}.`);
      }
      return true;
    } catch (err) {
      toast.error(`Could not update ${q.quotationNumber}: ${err instanceof Error ? err.message : 'unknown error'}`);
      return false;
    } finally {
      setBusyQuoteId(null);
    }
  };

  const openRFQ = (rfq: RFQ, openTab?: string) => updateParams({ rfq: rfq.id, tab: openTab || null, new: null, from_pr: null });
  const backToList = () => updateParams({ rfq: null, tab: null, record: null });
  const openPO = (poId: string | null) => {
    if (!poId) return;
    setSearchParams({ section: 'purchase-orders', po: poId });
  };
  const openPR = (prId: string | null) => {
    if (!prId) return;
    setSearchParams({ section: 'purchase-requisitions', pr: prId });
  };

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
            {rfqId
              ? <BreadcrumbLink onClick={backToList} className="cursor-pointer">RFQs</BreadcrumbLink>
              : <BreadcrumbPage>RFQs</BreadcrumbPage>}
          </BreadcrumbItem>
          {rfqId && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>{selected?.rfqNumber || '…'}</BreadcrumbPage></BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );

  let body: React.ReactNode;
  if (rfqId && selected) {
    body = (
      <RFQDetail
        rfq={selected}
        canAct={manage}
        busy={busy}
        busyQuoteId={busyQuoteId}
        tab={tab}
        onTabChange={(t) => updateParams({ tab: t === 'quotations' ? null : t }, true)}
        comparisonKey={comparisonKey}
        onBack={backToList}
        onEdit={() => setEditing(selected)}
        onRecordQuote={(vendorId) => updateParams({ record: vendorId || '1' })}
        onAction={(action, payload) => runRfqAction(selected, action, payload)}
        onQuoteAction={(q, action, payload) => runQuoteAction(selected, q, action, payload)}
        onOpenPR={() => openPR(selected.purchaseRequestId)}
        onOpenPO={() => openPO(selected.poId)}
      />
    );
  } else if (rfqId) {
    body = detailError ? (
      <div className="py-16 text-center space-y-3">
        <p className="font-medium text-foreground">This RFQ could not be found.</p>
        <p className="text-sm text-muted-foreground">{detailError}</p>
        <Button variant="outline" onClick={backToList}>Back to RFQs</Button>
      </div>
    ) : (
      <div className="space-y-4 py-6">
        <div className="h-8 w-56 rounded bg-muted animate-pulse" />
        <div className="h-20 rounded bg-muted animate-pulse" />
        <div className="h-48 rounded bg-muted animate-pulse" />
      </div>
    );
  } else {
    body = (
      <RFQList
        rfqs={rfqs}
        loading={loading}
        error={error}
        canManage={manage}
        filters={filters}
        onFiltersChange={(f) => updateParams({
          ...(f.status !== undefined && { status: f.status === 'all' ? null : f.status }),
          ...(f.search !== undefined && { q: f.search }),
          ...(f.prId !== undefined && { pr: f.prId === 'all' ? null : f.prId }),
          ...(f.vendorId !== undefined && { vendor: f.vendorId === 'all' ? null : f.vendorId }),
        }, true)}
        onOpen={openRFQ}
        onCreate={() => updateParams({ new: '1' })}
        onRefresh={() => refetch()}
      />
    );
  }

  return (
    <div className="px-6 pb-6 space-y-6 w-full max-w-full overflow-x-hidden">
      {crumbs}
      {body}

      <RFQFormDrawer
        open={formOpen}
        rfq={editing}
        initialPrId={fromPrId}
        purchaseRequests={openPRs}
        vendors={vendors}
        vendorsLoading={vendorsLoading}
        onOpenChange={(open) => {
          if (open) return;
          setEditing(null);
          if (creating) updateParams({ new: null, from_pr: null }, true);
        }}
        onSaved={(rfq, { created, sent }) => {
          setEditing(null);
          setRfqs(prev => (prev.some(r => r.id === rfq.id) ? prev.map(r => (r.id === rfq.id ? { ...rfq, quotations: null } : r)) : [{ ...rfq, quotations: null }, ...prev]));
          setDetail(rfq);
          toast.success(`${rfq.rfqNumber} ${sent ? `sent to ${rfq.vendorIds.length} vendor${rfq.vendorIds.length === 1 ? '' : 's'}` : created ? 'saved as a draft' : 'saved'}.`);
          if (created) updateParams({ new: null, from_pr: null, rfq: rfq.id }, true);
        }}
      />

      {selected && (
        <QuotationFormDrawer
          open={!!recordParam}
          rfq={selected}
          initialVendorId={recordParam && recordParam !== '1' ? recordParam : null}
          onOpenChange={(open) => { if (!open) updateParams({ record: null }, true); }}
          onSaved={async (q) => {
            updateParams({ record: null }, true);
            toast.success(`${q.quotationNumber} from ${q.vendorName} recorded: ${formatMoney(q.totalAmount, q.currency)}.`);
            await refreshAfterChange(selected.id);
          }}
        />
      )}

      <Dialog open={!!award} onOpenChange={(o) => { if (!o) setAward(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-600" /> Awarded to {award?.vendorName}</DialogTitle>
            <DialogDescription>
              Purchase order <span className="font-semibold text-foreground">{award?.poNumber}</span> was created as a draft for{' '}
              {award ? formatMoney(award.amount, award.currency) : ''}. Submit it for approval from Purchase Orders.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAward(null)}>Stay here</Button>
            <Button className="gap-2" onClick={() => { const id = award?.poId || null; setAward(null); openPO(id); }}>
              <ShoppingCart className="w-4 h-4" /> Open {award?.poNumber}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
