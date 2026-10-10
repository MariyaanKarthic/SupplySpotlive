import React, { useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown, CheckCircle, ChevronLeft, ChevronRight, ClipboardCheck, Clock,
  Download, Filter, Plus, RefreshCw, Search, Send, Settings2, ShoppingCart, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  PurchaseOrder, STATUS_FILTERS, deliveryLabel, exportPurchaseOrdersCsv, formatCompactMoney, formatDate, formatMoney, isOpen, isOverdue,
} from './poModel';
import { POAction, PriorityBadge, StatusBadge, nextStep } from './PODetail';

type SortKey = 'poNumber' | 'vendorName' | 'totalAmount' | 'issueDate' | 'expectedDeliveryDate' | 'status';

const COLUMNS: { id: string; label: string; sortKey?: SortKey; align?: 'right' }[] = [
  { id: 'vendor', label: 'Vendor', sortKey: 'vendorName' },
  { id: 'amount', label: 'Amount', sortKey: 'totalAmount', align: 'right' },
  { id: 'issueDate', label: 'Issued', sortKey: 'issueDate' },
  { id: 'delivery', label: 'Expected delivery', sortKey: 'expectedDeliveryDate' },
  { id: 'priority', label: 'Priority' },
  { id: 'status', label: 'Status', sortKey: 'status' },
];

export interface ListFilters {
  status: string;
  search: string;
  priority: string;
  overdueOnly: boolean;
}

export function POList({
  purchaseOrders,
  loading,
  error,
  busyId,
  filters,
  onFiltersChange,
  onOpen,
  onCreate,
  onRefresh,
  onAction,
  onBulkAction,
}: {
  purchaseOrders: PurchaseOrder[];
  loading: boolean;
  error: string | null;
  busyId: string | null;
  filters: ListFilters;
  onFiltersChange: (f: Partial<ListFilters>) => void;
  onOpen: (po: PurchaseOrder) => void;
  onCreate: () => void;
  onRefresh: () => void;
  onAction: (po: PurchaseOrder, action: POAction) => void;
  onBulkAction: (pos: PurchaseOrder[], action: 'approve' | 'send') => void;
}) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'issueDate', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [visible, setVisible] = useState<string[]>(COLUMNS.map(c => c.id));
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const counts = useMemo(() => ({
    open: purchaseOrders.filter(isOpen),
    pendingApproval: purchaseOrders.filter(po => po.status === 'pending_approval'),
    awaitingAck: purchaseOrders.filter(po => po.status === 'sent'),
    overdue: purchaseOrders.filter(isOverdue),
  }), [purchaseOrders]);
  // Sum committed value in the most common currency; POs in other currencies are counted separately.
  const currencyCounts = counts.open.reduce<Record<string, number>>((acc, po) => ({ ...acc, [po.currency]: (acc[po.currency] || 0) + 1 }), {});
  const mainCurrency = Object.entries(currencyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'USD';
  const openValue = counts.open.filter(po => po.currency === mainCurrency).reduce((acc, po) => acc + po.totalAmount, 0);
  const otherCurrencyCount = counts.open.length - (currencyCounts[mainCurrency] || 0);

  const filtered = useMemo(() => {
    const statuses = STATUS_FILTERS.find(f => f.id === filters.status)?.statuses;
    const term = filters.search.trim().toLowerCase();
    return purchaseOrders.filter(po =>
      (!statuses || statuses.includes(po.status)) &&
      (filters.priority === 'all' || po.priority === filters.priority) &&
      (!filters.overdueOnly || isOverdue(po)) &&
      (!term || po.poNumber.toLowerCase().includes(term) || po.vendorName.toLowerCase().includes(term) ||
        po.lineItems.some(li => li.description.toLowerCase().includes(term)))
    );
  }, [purchaseOrders, filters]);

  const sorted = useMemo(() => {
    const rows = [...filtered];
    rows.sort((a, b) => {
      const av = a[sort.key] as any;
      const bv = b[sort.key] as any;
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sort.dir === 'asc' ? cmp : -cmp;
    });
    return rows;
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const paged = sorted.slice((currentPage - 1) * perPage, currentPage * perPage);
  const selectedPOs = purchaseOrders.filter(po => selected.has(po.id));
  const canBulkApprove = selectedPOs.filter(po => po.status === 'new' || po.status === 'pending_approval');
  const canBulkSend = selectedPOs.filter(po => po.status === 'approved');
  const advancedCount = [filters.priority !== 'all', filters.overdueOnly].filter(Boolean).length;
  const anyFilter = filters.status !== 'all' || filters.search !== '' || advancedCount > 0;

  const updateFilters = (f: Partial<ListFilters>) => { setPage(1); onFiltersChange(f); };
  const toggleSort = (key: SortKey) =>
    setSort(s => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'totalAmount' || key === 'issueDate' ? 'desc' : 'asc' }));
  const toggleSelected = (id: string) =>
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allOnPageSelected = paged.length > 0 && paged.every(po => selected.has(po.id));

  const kpis = [
    { id: 'open', label: 'Open POs', value: counts.open.length, hint: `${formatCompactMoney(openValue, mainCurrency)} committed${otherCurrencyCount ? ` + ${otherCurrencyCount} in other currencies` : ''}`, icon: ShoppingCart, tone: 'blue',
      active: filters.status === 'all' && !filters.overdueOnly, apply: () => updateFilters({ status: 'all', overdueOnly: false }) },
    { id: 'approval', label: 'Awaiting approval', value: counts.pendingApproval.length, hint: 'Needs a decision', icon: CheckCircle, tone: 'amber',
      active: filters.status === 'pending_approval', apply: () => updateFilters({ status: 'pending_approval', overdueOnly: false }) },
    { id: 'ack', label: 'Awaiting vendor ack', value: counts.awaitingAck.length, hint: 'Sent, not confirmed', icon: ClipboardCheck, tone: 'violet',
      active: filters.status === 'with_vendor' && !filters.overdueOnly, apply: () => updateFilters({ status: 'with_vendor', overdueOnly: false }) },
    { id: 'overdue', label: 'Overdue deliveries', value: counts.overdue.length, hint: 'Past expected date', icon: AlertTriangle, tone: 'red',
      active: filters.overdueOnly, apply: () => updateFilters({ status: 'all', overdueOnly: true }) },
  ];
  const toneClass: Record<string, string> = {
    blue: 'border-l-blue-500 [&_.kpi-icon]:bg-blue-50 [&_.kpi-icon]:text-blue-600',
    amber: 'border-l-amber-500 [&_.kpi-icon]:bg-amber-50 [&_.kpi-icon]:text-amber-600',
    violet: 'border-l-violet-500 [&_.kpi-icon]:bg-violet-50 [&_.kpi-icon]:text-violet-600',
    red: 'border-l-red-500 [&_.kpi-icon]:bg-red-50 [&_.kpi-icon]:text-red-600',
  };

  const SortIcon = ({ k }: { k?: SortKey }) =>
    !k ? null : sort.key !== k ? <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground/60" />
      : sort.dir === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-primary" /> : <ArrowDown className="w-3.5 h-3.5 text-primary" />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Purchase Orders</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button className="gap-2" onClick={onCreate}>
            <Plus className="w-4 h-4" /> New purchase order
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(k => (
          <button key={k.id} type="button" onClick={k.apply} aria-pressed={k.active} className="text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Card className={`border-l-4 shadow-sm hover:shadow-md transition-all ${toneClass[k.tone]} ${k.active ? 'ring-2 ring-primary/30' : ''}`}>
              <CardContent className="p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{k.label}</p>
                  <p className="text-xl font-bold text-foreground mt-0.5 tabular-nums">{loading && !purchaseOrders.length ? '–' : k.value}</p>
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
                placeholder="Search by PO number, vendor or item…"
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
                className="pl-10 h-10"
                aria-label="Search purchase orders"
              />
            </div>
            <div className="flex items-center gap-2">
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
                    <Checkbox checked={filters.overdueOnly} onCheckedChange={(c) => updateFilters({ overdueOnly: c === true })} />
                    Only overdue deliveries
                  </label>
                </PopoverContent>
              </Popover>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-10 gap-2"><Settings2 className="w-4 h-4" /> Columns</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel>Show columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {COLUMNS.map(col => (
                    <label key={col.id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-accent rounded-sm">
                      <Checkbox
                        checked={visible.includes(col.id)}
                        onCheckedChange={() => setVisible(v => (v.includes(col.id) ? v.filter(x => x !== col.id) : [...v, col.id]))}
                      />
                      {col.label}
                    </label>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" className="h-10 gap-2" disabled={!sorted.length}
                onClick={() => exportPurchaseOrdersCsv(sorted, `purchase_orders_${new Date().toISOString().split('T')[0]}.csv`)}>
                <Download className="w-4 h-4" /> Export
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by status">
            {STATUS_FILTERS.map(f => (
              <Button key={f.id} size="sm" variant={filters.status === f.id ? 'default' : 'outline'} className="h-8 rounded-full"
                onClick={() => updateFilters({ status: f.id, overdueOnly: false })} aria-pressed={filters.status === f.id}>
                {f.label}
              </Button>
            ))}
            {anyFilter && (
              <Button size="sm" variant="ghost" className="h-8 gap-1 text-muted-foreground"
                onClick={() => updateFilters({ status: 'all', search: '', priority: 'all', overdueOnly: false })}>
                <X className="w-3.5 h-3.5" /> Clear
              </Button>
            )}
          </div>
        </div>

        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b bg-primary/5 text-sm no-print">
            <span className="font-medium">{selected.size} selected</span>
            <Button size="sm" variant="outline" className="h-8 gap-1.5" disabled={!canBulkApprove.length} onClick={() => { onBulkAction(canBulkApprove, 'approve'); setSelected(new Set()); }}>
              <CheckCircle className="w-4 h-4" /> Approve ({canBulkApprove.length})
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-1.5" disabled={!canBulkSend.length} onClick={() => { onBulkAction(canBulkSend, 'send'); setSelected(new Set()); }}>
              <Send className="w-4 h-4" /> Send to vendor ({canBulkSend.length})
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-1.5"
              onClick={() => exportPurchaseOrdersCsv(selectedPOs, `purchase_orders_selected_${new Date().toISOString().split('T')[0]}.csv`)}>
              <Download className="w-4 h-4" /> Export
            </Button>
            <Button size="sm" variant="ghost" className="h-8" onClick={() => setSelected(new Set())}>Clear selection</Button>
          </div>
        )}

        {error && (
          <div className="px-4 py-3 text-sm text-destructive border-b" role="alert">
            Could not load purchase orders: {error}. Check that the backend is running, then press Refresh.
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="border-b">
                <th className="w-10 p-3 no-print">
                  <Checkbox aria-label="Select all on this page" checked={allOnPageSelected}
                    onCheckedChange={(c) => setSelected(s => { const n = new Set(s); paged.forEach(po => (c ? n.add(po.id) : n.delete(po.id))); return n; })} />
                </th>
                <th className="text-left p-3 font-medium text-muted-foreground whitespace-nowrap">
                  <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort('poNumber')}>PO number <SortIcon k="poNumber" /></button>
                </th>
                {COLUMNS.filter(c => visible.includes(c.id)).map(col => (
                  <th key={col.id} className={`p-3 font-medium text-muted-foreground whitespace-nowrap ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                    aria-sort={col.sortKey && sort.key === col.sortKey ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                    {col.sortKey
                      ? <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort(col.sortKey!)}>{col.label} <SortIcon k={col.sortKey} /></button>
                      : col.label}
                  </th>
                ))}
                <th className="p-3 font-medium text-muted-foreground text-right no-print">Next step</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && !purchaseOrders.length && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={9} className="p-3"><div className="h-6 rounded bg-muted animate-pulse" /></td></tr>
              ))}
              {!loading && !error && sorted.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-14 text-center">
                    <ShoppingCart className="w-10 h-10 mx-auto text-muted-foreground/40" />
                    {purchaseOrders.length === 0 ? (
                      <>
                        <p className="mt-3 font-medium text-foreground">No purchase orders yet</p>
                        <p className="text-sm text-muted-foreground">Create your first PO to start tracking orders with vendors.</p>
                        <Button className="mt-4 gap-2" onClick={onCreate}><Plus className="w-4 h-4" /> New purchase order</Button>
                      </>
                    ) : (
                      <>
                        <p className="mt-3 font-medium text-foreground">No purchase orders match these filters</p>
                        <Button variant="link" onClick={() => updateFilters({ status: 'all', search: '', priority: 'all', overdueOnly: false })}>Clear filters</Button>
                      </>
                    )}
                  </td>
                </tr>
              )}
              {paged.map(po => {
                const step = nextStep(po);
                const delivery = deliveryLabel(po);
                const overdue = isOverdue(po);
                const quickAction = step && ['submit', 'approve', 'acknowledge', 'close'].includes(step.action);
                return (
                  <tr key={po.id} className="hover:bg-muted/40 cursor-pointer" onClick={() => onOpen(po)}
                    onKeyDown={(e) => { if (e.key === 'Enter') onOpen(po); }} tabIndex={0} aria-label={`Open ${po.poNumber}`}>
                    <td className="p-3 no-print" onClick={(e) => e.stopPropagation()}>
                      <Checkbox aria-label={`Select ${po.poNumber}`} checked={selected.has(po.id)} onCheckedChange={() => toggleSelected(po.id)} />
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <p className="font-semibold text-foreground">{po.poNumber}</p>
                      <p className="text-xs text-muted-foreground">{po.lineItems.length} item{po.lineItems.length === 1 ? '' : 's'}</p>
                    </td>
                    {visible.includes('vendor') && <td className="p-3 whitespace-nowrap font-medium">{po.vendorName}</td>}
                    {visible.includes('amount') && <td className="p-3 whitespace-nowrap text-right font-semibold tabular-nums">{formatMoney(po.totalAmount, po.currency)}</td>}
                    {visible.includes('issueDate') && <td className="p-3 whitespace-nowrap text-muted-foreground">{formatDate(po.issueDate)}</td>}
                    {visible.includes('delivery') && (
                      <td className="p-3 whitespace-nowrap">
                        <p>{formatDate(po.expectedDeliveryDate)}</p>
                        {delivery && <p className={`text-xs flex items-center gap-1 ${overdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>{overdue && <Clock className="w-3 h-3" />}{delivery}</p>}
                      </td>
                    )}
                    {visible.includes('priority') && <td className="p-3"><PriorityBadge po={po} /></td>}
                    {visible.includes('status') && <td className="p-3 whitespace-nowrap"><StatusBadge po={po} /></td>}
                    <td className="p-3 text-right whitespace-nowrap no-print" onClick={(e) => e.stopPropagation()}>
                      {step && (
                        <Button size="sm" variant={quickAction ? 'outline' : 'ghost'} className="h-8 gap-1.5" disabled={busyId === po.id}
                          onClick={() => (quickAction ? onAction(po, step.action) : onOpen(po))}>
                          <step.icon className="w-3.5 h-3.5" />
                          {busyId === po.id ? 'Working…' : step.label}
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
