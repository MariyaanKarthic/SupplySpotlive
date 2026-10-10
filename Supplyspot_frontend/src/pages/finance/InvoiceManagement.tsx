import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { invoiceService } from '@/services/api';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Invoice, STATUS_FILTERS, canSettle, canWrite, formatMoney, mapInvoice } from './invoices/invoiceModel';
import { InvoiceFilters, InvoiceList } from './invoices/InvoiceList';
import { InvoiceAction, InvoiceDetail } from './invoices/InvoiceDetail';
import { InvoiceFormDrawer } from './invoices/InvoiceFormDrawer';

const ACTION_CALLS: Record<Exclude<InvoiceAction, 'delete'>, (id: string, payload?: any) => Promise<any>> = {
  submit: (id) => invoiceService.submitInvoice(id),
  approve: (id) => invoiceService.approveInvoice(id),
  return: (id, payload) => invoiceService.returnInvoice(id, payload),
  pay: (id, payload) => invoiceService.payInvoice(id, payload),
  dispute: (id, payload) => invoiceService.disputeInvoice(id, payload),
  resolve: (id, payload) => invoiceService.resolveDispute(id, payload),
};

const ACTION_DONE: Record<Exclude<InvoiceAction, 'delete' | 'pay'>, string> = {
  submit: 'submitted for approval',
  approve: 'approved',
  return: 'sent back to draft',
  dispute: 'disputed',
  resolve: 'dispute resolved; back to pending approval',
};

// Invoices: the last step of the buying flow, after the purchase order and goods receipt.
export function InvoiceManagement({ onNavigate }: { onNavigate?: (view: any) => void }) {
  const { vendor: authUser } = useAuth();
  const role: string | undefined = authUser?.role;

  // Open invoice, create drawer and filters live in the URL so links work and Back behaves.
  const [searchParams, setSearchParams] = useSearchParams();
  const invoiceId = searchParams.get('invoice');
  const creating = searchParams.get('new') === '1';
  const fromPo = searchParams.get('from_po');
  const fromGrn = searchParams.get('from_grn');
  const statusParam = searchParams.get('status') || 'all';
  const filters: InvoiceFilters = {
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

  const { data, loading, error, refetch } = useApi(useCallback(() => invoiceService.getInvoices({ limit: 500 }) as any, []));
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  useEffect(() => {
    const raw = (data as any)?.invoices;
    if (raw) setInvoices(raw.map(mapInvoice));
  }, [data]);

  // The detail view needs payments and the linked PO / GRN, which the list does not carry.
  const [detail, setDetail] = useState<Invoice | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const loadDetail = useCallback(async (id: string) => {
    setDetailError(null);
    try {
      const res: any = await invoiceService.getInvoice(id);
      setDetail(mapInvoice(res.data));
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'Not found');
    }
  }, []);
  useEffect(() => {
    if (invoiceId) loadDetail(invoiceId);
    else setDetail(null);
  }, [invoiceId, loadDetail]);
  const selected = detail && detail.id === invoiceId ? detail : null;

  const [editing, setEditing] = useState<Invoice | null>(null);
  const [busy, setBusy] = useState(false);

  const upsert = (inv: Invoice) => {
    setInvoices(prev => (prev.some(p => p.id === inv.id) ? prev.map(p => (p.id === inv.id ? inv : p)) : [inv, ...prev]));
    if (inv.id === invoiceId) setDetail(inv);
  };

  const runAction = async (inv: Invoice, action: InvoiceAction, payload?: any): Promise<boolean> => {
    setBusy(true);
    try {
      if (action === 'delete') {
        await invoiceService.deleteInvoice(inv.id);
        setInvoices(prev => prev.filter(p => p.id !== inv.id));
        toast.success(`${inv.invoiceNumber} deleted.`);
        updateParams({ invoice: null });
        return true;
      }
      const res: any = await ACTION_CALLS[action](inv.id, payload);
      const updated = mapInvoice(res.data);
      upsert(updated);
      if (action === 'pay') {
        toast.success(updated.status === 'paid'
          ? `${inv.invoiceNumber} paid in full.`
          : `Payment recorded. ${formatMoney(updated.outstanding, updated.currency)} still outstanding on ${inv.invoiceNumber}.`);
      } else {
        toast.success(`${inv.invoiceNumber} ${ACTION_DONE[action]}.`);
      }
      return true;
    } catch (err) {
      toast.error(`Could not update ${inv.invoiceNumber}: ${err instanceof Error ? err.message : 'unknown error'}`);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const backToList = () => updateParams({ invoice: null });
  const formOpen = creating || !!editing;

  const crumbs = (
    <div className="sticky top-0 bg-background/95 backdrop-blur z-20 border-b py-3 -mx-6 px-6">
      <Breadcrumb className="text-xs">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => onNavigate && onNavigate('home')} className="cursor-pointer">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Finance</BreadcrumbPage></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {invoiceId
              ? <BreadcrumbLink onClick={backToList} className="cursor-pointer">Invoices</BreadcrumbLink>
              : <BreadcrumbPage>Invoices</BreadcrumbPage>}
          </BreadcrumbItem>
          {invoiceId && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>{selected?.invoiceNumber || '…'}</BreadcrumbPage></BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );

  let body: React.ReactNode;
  if (invoiceId && selected) {
    body = (
      <InvoiceDetail
        invoice={selected}
        busy={busy}
        canWrite={canWrite(role)}
        canSettle={canSettle(role)}
        onBack={backToList}
        onEdit={() => setEditing(selected)}
        onAction={(action, payload) => runAction(selected, action, payload)}
      />
    );
  } else if (invoiceId) {
    body = detailError ? (
      <div className="py-16 text-center space-y-3">
        <p className="font-medium text-foreground">This invoice could not be found.</p>
        <p className="text-sm text-muted-foreground">{detailError}</p>
        <Button variant="outline" onClick={backToList}>Back to invoices</Button>
      </div>
    ) : (
      <div className="space-y-4 py-6">
        <div className="h-8 w-56 rounded bg-muted animate-pulse" />
        <div className="h-40 rounded bg-muted animate-pulse" />
      </div>
    );
  } else {
    body = (
      <InvoiceList
        invoices={invoices}
        loading={loading}
        error={error}
        filters={filters}
        canCreate={canWrite(role)}
        onFiltersChange={(f) => updateParams({
          ...(f.status !== undefined && { status: f.status === 'all' ? null : f.status }),
          ...(f.search !== undefined && { q: f.search }),
          ...(f.vendorId !== undefined && { vendor: f.vendorId }),
          ...(f.poId !== undefined && { po: f.poId }),
          ...(f.dueFrom !== undefined && { due_from: f.dueFrom }),
          ...(f.dueTo !== undefined && { due_to: f.dueTo }),
        }, true)}
        onOpen={(i) => updateParams({ invoice: i.id, new: null })}
        onCreate={() => updateParams({ new: '1' })}
        onRefresh={() => refetch()}
      />
    );
  }

  return (
    <div className="px-6 pb-6 space-y-6 w-full max-w-full overflow-x-hidden">
      {crumbs}
      {body}
      <InvoiceFormDrawer
        open={formOpen}
        invoice={editing}
        initialPoId={fromPo}
        initialGrnId={fromGrn}
        onOpenChange={(open) => {
          if (open) return;
          setEditing(null);
          if (creating) updateParams({ new: null, from_po: null, from_grn: null }, true);
        }}
        onSaved={(inv, created) => {
          upsert(inv);
          setEditing(null);
          toast.success(created ? `${inv.invoiceNumber} saved as a draft.` : `${inv.invoiceNumber} saved.`);
          if (created) updateParams({ new: null, from_po: null, from_grn: null, invoice: inv.id }, true);
        }}
      />
    </div>
  );
}
