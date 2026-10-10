import React, { useMemo, useState } from 'react';
import {
  ArrowDown, ArrowUp, ArrowUpDown, CheckCircle, ChevronLeft, ChevronRight, ClipboardList, Clock, Download, FilePlus2, FileText, Filter, Plus,
  RefreshCw, Search, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CurrentUser, PurchaseRequest, STATUS_FILTERS, canRequest, exportPurchaseRequestsCsv, formatCompactMoney, formatDate, formatMoney,
  neededByLabel, neededByOffset,
} from './prModel';
import { PRAction, PriorityBadge, StatusBadge, nextStep } from './PRDetail';

type SortKey = 'prNumber' | 'title' | 'department' | 'budgetTotal' | 'createdAt' | 'requestedDate' | 'status';

export interface ListFilters {
  status: string;
  search: string;
  department: string;
  priority: string;
  mineOnly: boolean;
}

export function PRList({
  requests,
  user,
  loading,
  error,
  busyId,
  filters,
  onFiltersChange,
  onOpen,
  onCreate,
  onRefresh,
  onAction,
}: {
  requests: PurchaseRequest[];
  user: CurrentUser;
  loading: boolean;
  error: string | null;
  busyId: string | null;
  filters: ListFilters;
  onFiltersChange: (f: Partial<ListFilters>) => void;
  onOpen: (pr: PurchaseRequest) => void;
  onCreate: () => void;
  onRefresh: () => void;
  onAction: (pr: PurchaseRequest, action: PRAction) => void;
}) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'createdAt', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const departments = useMemo(() => [...new Set(requests.map(r => r.department).filter(Boolean))].sort(), [requests]);

  const counts = useMemo(() => ({
    submitted: requests.filter(r => r.status === 'submitted'),
    readyForRfq: requests.filter(r => r.status === 'approved' && !r.rfqId),
    drafts: requests.filter(r => r.status === 'draft' && r.requesterId === user.id),
    rejected: requests.filter(r => r.status === 'rejected'),
  }), [requests, user.id]);
  const currencyCounts = counts.submitted.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.currency]: (acc[r.currency] || 0) + 1 }), {});
  const mainCurrency = Object.entries(currencyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'INR';
  const pendingValue = counts.submitted.filter(r => r.currency === mainCurrency).reduce((acc, r) => acc + r.budgetTotal, 0);

  const filtered = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return requests.filter(r =>
      (filters.status === 'all' || r.status === filters.status) &&
      (filters.department === 'all' || r.department === filters.department) &&
      (filters.priority === 'all' || r.priority === filters.priority) &&
      (!filters.mineOnly || r.requesterId === user.id) &&
      (!term || r.prNumber.toLowerCase().includes(term) || r.title.toLowerCase().includes(term) ||
        r.requesterName.toLowerCase().includes(term) || r.items.some(it => it.description.toLowerCase().includes(term)))
    );
  }, [requests, filters, user.id]);

  const sorted = useMemo(() => {
    const rows = [...filtered];
    rows.sort((a, b) => {
      const av = (a[sort.key] ?? '') as any;
      const bv = (b[sort.key] ?? '') as any;
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sort.dir === 'asc' ? cmp : -cmp;
    });
    return rows;
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const paged = sorted.slice((currentPage - 1) * perPage, currentPage * perPage);
  const advancedCount = [filters.department !== 'all', filters.priority !== 'all', filters.mineOnly].filter(Boolean).length;
  const anyFilter = filters.status !== 'all' || filters.search !== '' || advancedCount > 0;
  const clearFilters = () => updateFilters({ status: 'all', search: '', department: 'all', priority: 'all', mineOnly: false });

  const updateFilters = (f: Partial<ListFilters>) => { setPage(1); onFiltersChange(f); };
  const toggleSort = (key: SortKey) =>
    setSort(s => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'budgetTotal' || key === 'createdAt' ? 'desc' : 'asc' }));

  const kpis = [
    { id: 'submitted', label: 'Awaiting approval', value: counts.submitted.length, hint: `${formatCompactMoney(pendingValue, mainCurrency)} requested`, icon: Clock, tone: 'amber',
      active: filters.status === 'submitted' && !filters.mineOnly, apply: () => updateFilters({ status: 'submitted', mineOnly: false }) },
    { id: 'rfq', label: 'Approved, no RFQ yet', value: counts.readyForRfq.length, hint: 'Ready for sourcing', icon: FilePlus2, tone: 'emerald',
      active: filters.status === 'approved', apply: () => updateFilters({ status: 'approved', mineOnly: false }) },
    { id: 'drafts', label: 'My drafts', value: counts.drafts.length, hint: 'Not submitted yet', icon: FileText, tone: 'slate',
      active: filters.status === 'draft' && filters.mineOnly, apply: () => updateFilters({ status: 'draft', mineOnly: true }) },
    { id: 'rejected', label: 'Rejected', value: counts.rejected.length, hint: 'Can be revised', icon: X, tone: 'red',
      active: filters.status === 'rejected', apply: () => updateFilters({ status: 'rejected', mineOnly: false }) },
  ];
  const toneClass: Record<string, string> = {
    amber: 'border-l-amber-500 [&_.kpi-icon]:bg-amber-50 [&_.kpi-icon]:text-amber-600',
    emerald: 'border-l-emerald-500 [&_.kpi-icon]:bg-emerald-50 [&_.kpi-icon]:text-emerald-600',
    slate: 'border-l-slate-400 [&_.kpi-icon]:bg-slate-100 [&_.kpi-icon]:text-slate-600',
    red: 'border-l-red-500 [&_.kpi-icon]:bg-red-50 [&_.kpi-icon]:text-red-600',
  };

  const SortHeader = ({ k, label, align }: { k: SortKey; label: string; align?: 'right' }) => (
    <th className={`p-3 font-medium text-muted-foreground whitespace-nowrap ${align === 'right' ? 'text-right' : 'text-left'}`}
      aria-sort={sort.key === k ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
      <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort(k)}>
        {label}
        {sort.key !== k ? <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground/60" />
          : sort.dir === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-primary" /> : <ArrowDown className="w-3.5 h-3.5 text-primary" />}
      </button>
    </th>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Purchase Requests</h1>
          <p className="text-sm text-muted-foreground">Ask for what your team needs. Approved requests go out to vendors as RFQs.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          {canRequest(user) && (
            <Button className="gap-2" onClick={onCreate}>
              <Plus className="w-4 h-4" /> New request
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(k => (
          <button key={k.id} type="button" onClick={k.apply} aria-pressed={k.active} className="text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Card className={`border-l-4 shadow-sm hover:shadow-md transition-all ${toneClass[k.tone]} ${k.active ? 'ring-2 ring-primary/30' : ''}`}>
              <CardContent className="p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{k.label}</p>
                  <p className="text-xl font-bold text-foreground mt-0.5 tabular-nums">{loading && !requests.length ? '–' : k.value}</p>
                  <p className="text-[11px] text-muted-foreground">{k.hint}</p>
                </div>
                <div className="kpi-icon p-2.5 rounded-lg"><k.icon className="w-5 h-5" /></div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      <Card className="overflow-hidden shadow-sm">
        <div className="p-3.5 border-b space-y-3 no-print">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by PR number, title, requester or item…"
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
                className="pl-10 h-10"
                aria-label="Search purchase requests"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={filters.department} onValueChange={(v) => updateFilters({ department: v })}>
                <SelectTrigger className="h-10 w-[170px]" aria-label="Department"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-10 gap-2">
                    <Filter className="w-4 h-4" /> Filters
                    {advancedCount > 0 && <span className="ml-1 rounded bg-primary/10 text-primary text-[10px] px-1.5">{advancedCount}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-4 space-y-4" align="end">
                  <div className="space-y-1.5">
                    <Label>Priority</Label>
                    <Select value={filters.priority} onValueChange={(v) => updateFilters({ priority: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any priority</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={filters.mineOnly} onCheckedChange={(c) => updateFilters({ mineOnly: c === true })} />
                    Only my requests
                  </label>
                </PopoverContent>
              </Popover>
              <Button variant="outline" className="h-10 gap-2" disabled={!sorted.length}
                onClick={() => exportPurchaseRequestsCsv(sorted, `purchase_requests_${new Date().toISOString().split('T')[0]}.csv`)}>
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
            Could not load purchase requests: {error}. Check that the backend is running, then press Refresh.
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="border-b">
                <SortHeader k="prNumber" label="Request" />
                <SortHeader k="department" label="Department" />
                <SortHeader k="budgetTotal" label="Budget" align="right" />
                <SortHeader k="createdAt" label="Created" />
                <SortHeader k="requestedDate" label="Needed by" />
                <th className="p-3 font-medium text-muted-foreground text-left">Priority</th>
                <SortHeader k="status" label="Status" />
                <th className="p-3 font-medium text-muted-foreground text-right no-print">Next step</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && !requests.length && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={8} className="p-3"><div className="h-6 rounded bg-muted animate-pulse" /></td></tr>
              ))}
              {!loading && !error && sorted.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-14 text-center">
                    <ClipboardList className="w-10 h-10 mx-auto text-muted-foreground/40" />
                    {requests.length === 0 ? (
                      <>
                        <p className="mt-3 font-medium text-foreground">No purchase requests yet</p>
                        <p className="text-sm text-muted-foreground">Raise a request for the items your team needs, then submit it for approval.</p>
                        {canRequest(user) && <Button className="mt-4 gap-2" onClick={onCreate}><Plus className="w-4 h-4" /> New request</Button>}
                      </>
                    ) : (
                      <>
                        <p className="mt-3 font-medium text-foreground">No purchase requests match these filters</p>
                        <Button variant="link" onClick={clearFilters}>Clear filters</Button>
                      </>
                    )}
                  </td>
                </tr>
              )}
              {paged.map(pr => {
                const step = nextStep(pr, user);
                const neededBy = neededByLabel(pr);
                const offset = neededByOffset(pr);
                // Approve and create-RFQ need a dialog, so those open the request instead of acting from the row.
                const quickAction = step && ['submit', 'revise'].includes(step.action);
                return (
                  <tr key={pr.id} className="hover:bg-muted/40 cursor-pointer" onClick={() => onOpen(pr)}
                    onKeyDown={(e) => { if (e.key === 'Enter') onOpen(pr); }} tabIndex={0} aria-label={`Open ${pr.prNumber}`}>
                    <td className="p-3 min-w-[220px]">
                      <p className="font-semibold text-foreground">{pr.prNumber}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{pr.title} · {pr.requesterName}</p>
                    </td>
                    <td className="p-3 whitespace-nowrap">{pr.department || '—'}</td>
                    <td className="p-3 whitespace-nowrap text-right font-semibold tabular-nums">{formatMoney(pr.budgetTotal, pr.currency)}</td>
                    <td className="p-3 whitespace-nowrap text-muted-foreground">{formatDate(pr.createdAt?.split('T')[0] || null)}</td>
                    <td className="p-3 whitespace-nowrap">
                      <p>{formatDate(pr.requestedDate || null)}</p>
                      {neededBy && <p className={`text-xs ${offset !== null && offset < 0 ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>{neededBy}</p>}
                    </td>
                    <td className="p-3"><PriorityBadge pr={pr} /></td>
                    <td className="p-3 whitespace-nowrap">
                      <StatusBadge pr={pr} />
                      {pr.rfqNumber && <p className="text-xs text-muted-foreground mt-1">{pr.rfqNumber}</p>}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap no-print" onClick={(e) => e.stopPropagation()}>
                      {step ? (
                        <Button size="sm" variant={quickAction ? 'outline' : 'ghost'} className="h-8 gap-1.5" disabled={busyId === pr.id}
                          onClick={() => (quickAction ? onAction(pr, step.action) : onOpen(pr))}>
                          <step.icon className="w-3.5 h-3.5" />
                          {busyId === pr.id ? 'Working…' : step.label}
                        </Button>
                      ) : pr.status === 'approved' && pr.rfqNumber ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><CheckCircle className="w-3.5 h-3.5" /> In sourcing</span>
                      ) : null}
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
