import React, { useMemo, useState } from 'react';
import {
  ArrowDown, ArrowUp, ArrowUpDown, Award, ChevronLeft, ChevronRight, Download, Eye, FileText, Plus, Quote, RefreshCw, Scale, Search, Send, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RFQ, STATUS_FILTERS, dueLabel, dueOffset, exportRFQsCsv, formatCompactMoney, formatDate, formatMoney } from './rfqModel';
import { StatusBadge } from './RFQDetail';
import { EmptyTableRow, KpiCard, KpiTone, PageHeader, SortableHeader } from '@/components/common';

type SortKey = 'rfqNumber' | 'dueDate' | 'budget' | 'quotationCount' | 'createdAt' | 'status';

export interface ListFilters {
  status: string;
  search: string;
  prId: string;
  vendorId: string;
}

// What the buyer should do next on an RFQ, shown in the last column.
function nextStep(rfq: RFQ): { label: string; icon: React.ComponentType<{ className?: string }> } | null {
  if (rfq.status === 'draft') return rfq.vendorIds.length ? { label: 'Send', icon: Send } : { label: 'Choose vendors', icon: Send };
  if (rfq.status === 'quotations_received' || rfq.status === 'under_review') {
    return rfq.openQuotationCount > 1 ? { label: 'Compare', icon: Scale } : { label: 'Review', icon: Eye };
  }
  if (rfq.status === 'awarded' && rfq.poNumber) return { label: rfq.poNumber, icon: Award };
  return null;
}

export function RFQList({
  rfqs,
  loading,
  error,
  canManage,
  filters,
  onFiltersChange,
  onOpen,
  onCreate,
  onRefresh,
}: {
  rfqs: RFQ[];
  loading: boolean;
  error: string | null;
  canManage: boolean;
  filters: ListFilters;
  onFiltersChange: (f: Partial<ListFilters>) => void;
  onOpen: (rfq: RFQ, tab?: string) => void;
  onCreate: () => void;
  onRefresh: () => void;
}) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'createdAt', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const prOptions = useMemo(() => {
    const seen = new Map<string, string>();
    rfqs.forEach(r => { if (r.purchaseRequestId && r.prNumber) seen.set(r.purchaseRequestId, `${r.prNumber} · ${r.prTitle || r.title}`); });
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [rfqs]);
  const vendorOptions = useMemo(() => {
    const seen = new Map<string, string>();
    rfqs.forEach(r => r.vendors.forEach(v => seen.set(v.id, v.name)));
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [rfqs]);

  const groups = useMemo(() => ({
    draft: rfqs.filter(r => r.status === 'draft'),
    awaiting: rfqs.filter(r => r.status === 'sent'),
    review: rfqs.filter(r => r.status === 'quotations_received' || r.status === 'under_review'),
    awarded: rfqs.filter(r => r.status === 'awarded'),
  }), [rfqs]);
  const awardedValue = groups.awarded.filter(r => r.currency === 'INR').reduce((acc, r) => acc + (r.awardedAmount || 0), 0);
  const quotesToReview = groups.review.reduce((acc, r) => acc + r.openQuotationCount, 0);
  const overdue = groups.awaiting.filter(r => (dueOffset(r) ?? 0) < 0).length;

  const filtered = useMemo(() => {
    const statuses = STATUS_FILTERS.find(f => f.id === filters.status)?.statuses || null;
    const term = filters.search.trim().toLowerCase();
    return rfqs.filter(r =>
      (!statuses || statuses.includes(r.status)) &&
      (filters.prId === 'all' || r.purchaseRequestId === filters.prId) &&
      (filters.vendorId === 'all' || r.vendorIds.includes(filters.vendorId)) &&
      (!term || r.rfqNumber.toLowerCase().includes(term) || r.title.toLowerCase().includes(term) ||
        (r.prNumber || '').toLowerCase().includes(term) || r.vendors.some(v => v.name.toLowerCase().includes(term)))
    );
  }, [rfqs, filters]);

  const sorted = useMemo(() => {
    const rows = [...filtered];
    rows.sort((a, b) => {
      const av = (a[sort.key] ?? '') as any;
      const bv = (b[sort.key] ?? '') as any;
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sort.dir === 'asc' ? cmp : -cmp;
    });
    return rows;
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const paged = sorted.slice((currentPage - 1) * perPage, currentPage * perPage);
  const anyFilter = filters.status !== 'all' || filters.search !== '' || filters.prId !== 'all' || filters.vendorId !== 'all';

  const updateFilters = (f: Partial<ListFilters>) => { setPage(1); onFiltersChange(f); };
  const clearFilters = () => updateFilters({ status: 'all', search: '', prId: 'all', vendorId: 'all' });
  const toggleSort = (key: SortKey) =>
    setSort(s => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'budget' || key === 'createdAt' ? 'desc' : 'asc' }));

  const kpis = [
    { id: 'draft', label: 'Drafts', value: groups.draft.length, hint: 'Not sent yet', icon: FileText, tone: 'slate' },
    { id: 'awaiting', label: 'Awaiting quotations', value: groups.awaiting.length, hint: overdue ? `${overdue} past due` : 'Out with vendors', icon: Send, tone: 'indigo' },
    { id: 'review', label: 'Under review', value: groups.review.length, hint: `${quotesToReview} quotation${quotesToReview === 1 ? '' : 's'} to compare`, icon: Scale, tone: 'amber' },
    { id: 'awarded', label: 'Awarded', value: groups.awarded.length, hint: `${formatCompactMoney(awardedValue, 'INR')} committed`, icon: Award, tone: 'emerald' },
  ];
  const SortHeader = ({ k, label, align }: { k: SortKey; label: string; align?: 'right' }) => (
    <SortableHeader k={k} label={label} align={align} sort={sort} onSort={toggleSort} />
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="RFQs and Quotations"
        description="Send approved purchase requests to vendors, compare their quotations and award the best one."
        actions={<>
          <Button variant="outline" className="gap-2" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          {canManage && <Button className="gap-2" onClick={onCreate}><Plus className="w-4 h-4" /> New RFQ</Button>}
        </>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(k => {
          const active = filters.status === k.id;
          return (
            <KpiCard key={k.id} label={k.label} value={k.value} hint={k.hint} icon={k.icon} tone={k.tone as KpiTone}
              loading={loading && !rfqs.length} active={active} onClick={() => updateFilters({ status: active ? 'all' : k.id })} />
          );
        })}
      </div>

      <Card className="overflow-hidden shadow-sm">
        <div className="p-3.5 border-b space-y-3 no-print">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by RFQ, title, purchase request or vendor…" value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })} className="pl-10 h-10" aria-label="Search RFQs" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={filters.prId} onValueChange={(v) => updateFilters({ prId: v })}>
                <SelectTrigger className="h-10 w-[200px]" aria-label="Purchase request"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All purchase requests</SelectItem>
                  {prOptions.map(([id, label]) => <SelectItem key={id} value={id}>{label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.vendorId} onValueChange={(v) => updateFilters({ vendorId: v })}>
                <SelectTrigger className="h-10 w-[200px]" aria-label="Supplier"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All suppliers</SelectItem>
                  {vendorOptions.map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" className="h-10 gap-2" disabled={!sorted.length}
                onClick={() => exportRFQsCsv(sorted, `rfqs_${new Date().toISOString().split('T')[0]}.csv`)}>
                <Download className="w-4 h-4" /> Export
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by status">
            {STATUS_FILTERS.map(f => (
              <Button key={f.id} size="sm" variant={filters.status === f.id ? 'default' : 'outline'} className="h-8 rounded-full"
                onClick={() => updateFilters({ status: f.id })} aria-pressed={filters.status === f.id}>
                {f.label}
              </Button>
            ))}
            {anyFilter && (
              <Button size="sm" variant="ghost" className="h-8 gap-1 text-muted-foreground" onClick={clearFilters}>
                <X className="w-3.5 h-3.5" /> Clear
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 text-sm text-destructive border-b" role="alert">
            Could not load RFQs: {error}. Check that the backend is running, then press Refresh.
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="border-b">
                <SortHeader k="rfqNumber" label="RFQ" />
                <SortHeader k="quotationCount" label="Responses" />
                <SortHeader k="budget" label="Budget" align="right" />
                <th className="p-3 font-medium text-muted-foreground text-right whitespace-nowrap">Lowest quote</th>
                <SortHeader k="dueDate" label="Due" />
                <SortHeader k="status" label="Status" />
                <th className="p-3 font-medium text-muted-foreground text-right no-print">Next step</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && !rfqs.length && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={7} className="p-3"><div className="h-6 rounded bg-muted animate-pulse" /></td></tr>
              ))}
              {!loading && !error && sorted.length === 0 && (
                rfqs.length === 0 ? (
                  <EmptyTableRow colSpan={7} icon={Quote} title="No RFQs yet"
                    description="Create one from an approved purchase request to start collecting quotations from vendors."
                    action={canManage ? { label: 'New RFQ', icon: Plus, onClick: onCreate } : null} />
                ) : (
                  <EmptyTableRow colSpan={7} filtered title="No RFQs match these filters"
                    description="Try a different status, purchase request or vendor." onClearFilters={clearFilters} />
                )
              )}
              {paged.map(rfq => {
                const step = nextStep(rfq);
                const due = dueLabel(rfq);
                const offset = dueOffset(rfq);
                const vsBudget = rfq.lowestQuote && rfq.budget ? rfq.lowestQuote.amount - rfq.budget : null;
                const responded = rfq.respondedVendorIds.length;
                return (
                  <tr key={rfq.id} className="hover:bg-muted/40 cursor-pointer" onClick={() => onOpen(rfq)}
                    onKeyDown={(e) => { if (e.key === 'Enter') onOpen(rfq); }} tabIndex={0} aria-label={`Open ${rfq.rfqNumber}`}>
                    <td className="p-3 min-w-[240px]">
                      <p className="font-semibold text-foreground">{rfq.rfqNumber}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{rfq.title}{rfq.prNumber ? ` · ${rfq.prNumber}` : ''}</p>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {rfq.status === 'draft' ? (
                        <span className="text-muted-foreground">{rfq.vendorIds.length ? `${rfq.vendorIds.length} vendor${rfq.vendorIds.length === 1 ? '' : 's'} chosen` : 'No vendors yet'}</span>
                      ) : (
                        <>
                          <p className="tabular-nums">{responded} of {rfq.vendorIds.length} quoted</p>
                          <div className="mt-1 h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${rfq.vendorIds.length ? Math.min(100, (responded / rfq.vendorIds.length) * 100) : 0}%` }} />
                          </div>
                        </>
                      )}
                    </td>
                    <td className="p-3 whitespace-nowrap text-right tabular-nums">{rfq.budget !== null ? formatMoney(rfq.budget, rfq.currency) : '—'}</td>
                    <td className="p-3 whitespace-nowrap text-right">
                      {rfq.status === 'awarded' && rfq.awardedAmount !== null ? (
                        <>
                          <p className="font-semibold tabular-nums">{formatMoney(rfq.awardedAmount, rfq.currency)}</p>
                          <p className="text-xs text-emerald-700">{rfq.awardedVendorName}</p>
                        </>
                      ) : rfq.lowestQuote ? (
                        <>
                          <p className="font-semibold tabular-nums">{formatMoney(rfq.lowestQuote.amount, rfq.currency)}</p>
                          <p className={`text-xs ${vsBudget !== null && vsBudget > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                            {rfq.lowestQuote.vendorName}{rfq.lowestQuote.partial ? ' · partial' : ''}{vsBudget !== null && vsBudget > 0 ? ' · over budget' : ''}
                          </p>
                        </>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <p>{formatDate(rfq.dueDate || null)}</p>
                      {due && <p className={`text-xs ${offset !== null && offset < 0 ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>{due}</p>}
                    </td>
                    <td className="p-3 whitespace-nowrap"><StatusBadge rfq={rfq} /></td>
                    <td className="p-3 text-right whitespace-nowrap no-print" onClick={(e) => e.stopPropagation()}>
                      {step && (
                        <Button size="sm" variant="ghost" className="h-8 gap-1.5"
                          onClick={() => onOpen(rfq, step.icon === Scale ? 'compare' : undefined)}>
                          <step.icon className="w-3.5 h-3.5" /> {step.label}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {sorted.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 border-t text-sm no-print">
            <div className="flex items-center gap-3 text-muted-foreground">
              <span>Rows per page</span>
              <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setPage(1); }}>
                <SelectTrigger className="h-8 w-[72px]"><SelectValue /></SelectTrigger>
                <SelectContent>{[10, 25, 50, 100].map(v => <SelectItem key={v} value={String(v)}>{v}</SelectItem>)}</SelectContent>
              </Select>
              <span>{(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, sorted.length)} of {sorted.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 gap-1" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
                <ChevronLeft className="w-4 h-4" /> Prev
              </Button>
              <span className="text-muted-foreground">Page {currentPage} of {totalPages}</span>
              <Button variant="outline" size="sm" className="h-8 gap-1" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
