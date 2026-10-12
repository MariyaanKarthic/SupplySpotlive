import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Download, FilePen, Filter, Plus, Receipt, RefreshCw, Search, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Invoice, OVERDUE_META, STATUS_FILTERS, STATUS_META, dueLabel, exportInvoicesCsv, formatDate, formatMoney, isPartlyPaid, sumByCurrency, toneClass,
} from './invoiceModel';
import { EmptyTableRow, KpiCard, KpiTone, PageHeader, SortableHeader, SortState, sortRows } from '@/components/common';

export interface InvoiceFilters {
  status: string;
  search: string;
  vendorId: string;
  poId: string;
  dueFrom: string;
  dueTo: string;
}

export function InvoiceStatusBadge({ invoice, className = '' }: { invoice: Invoice; className?: string }) {
  const meta = STATUS_META[invoice.status];
  return (
    <span className={`inline-flex flex-wrap gap-1 ${className}`}>
      <Badge variant="outline" className={meta.className}>{isPartlyPaid(invoice) ? 'Part paid' : meta.label}</Badge>
      {invoice.isOverdue && <Badge variant="outline" className={OVERDUE_META.className}>{OVERDUE_META.label}</Badge>}
    </span>
  );
}

const matchesStatus = (i: Invoice, status: string) => {
  if (status === 'all') return true;
  if (status === 'overdue') return i.isOverdue;
  return i.status === status;
};

export function InvoiceList({
  invoices,
  loading,
  error,
  filters,
  canCreate,
  onFiltersChange,
  onOpen,
  onCreate,
  onRefresh,
}: {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  filters: InvoiceFilters;
  canCreate: boolean;
  onFiltersChange: (f: Partial<InvoiceFilters>) => void;
  onOpen: (i: Invoice) => void;
  onCreate: () => void;
  onRefresh: () => void;
}) {
  const vendors = useMemo(() => {
    const map = new Map<string, string>();
    invoices.forEach(i => map.set(i.vendorId, i.vendorName));
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [invoices]);
  const poNumber = invoices.find(i => i.poId === filters.poId)?.poNumber;

  const groups = useMemo(() => ({
    draft: invoices.filter(i => i.status === 'draft'),
    submitted: invoices.filter(i => i.status === 'submitted'),
    approved: invoices.filter(i => i.status === 'approved'),
    paid: invoices.filter(i => i.status === 'paid'),
    overdue: invoices.filter(i => i.isOverdue),
  }), [invoices]);

  const filtered = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return invoices
      .filter(i =>
        matchesStatus(i, filters.status) &&
        (!filters.vendorId || i.vendorId === filters.vendorId) &&
        (!filters.poId || i.poId === filters.poId) &&
        (!filters.dueFrom || (i.dueDate || '') >= filters.dueFrom) &&
        (!filters.dueTo || (i.dueDate || '') <= filters.dueTo) &&
        (!term || [i.invoiceNumber, i.vendorInvoiceNumber, i.vendorName, i.poNumber, i.grnNumber]
          .some(v => (v || '').toLowerCase().includes(term))))
      // Overdue first (most overdue on top), then unpaid by due date, then drafts, then paid newest first.
      .sort((a, b) => {
        const rank = (i: Invoice) => (i.isOverdue ? 0 : i.status === 'paid' ? 3 : i.status === 'draft' ? 2 : 1);
        const due = String(a.dueDate).localeCompare(String(b.dueDate));
        if (rank(a) !== rank(b)) return rank(a) - rank(b);
        if (rank(a) === 0) return b.daysOverdue - a.daysOverdue;
        return rank(a) === 3 ? String(b.paymentDate).localeCompare(String(a.paymentDate)) : due;
      });
  }, [invoices, filters]);

  // 'priority' keeps the overdue-first order above; clicking a column header sorts by that column instead.
  type SortKey = 'priority' | 'invoiceNumber' | 'vendorName' | 'poNumber' | 'totalAmount' | 'dueDate' | 'status';
  const [sort, setSort] = useState<SortState<SortKey>>({ key: 'priority', dir: 'asc' });
  const toggleSort = (key: SortKey) =>
    setSort(s => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'totalAmount' ? 'desc' : 'asc' }));
  const rows = useMemo(() => (sort.key === 'priority' ? filtered
    : sortRows(filtered, i => (sort.key === 'status' ? STATUS_META[i.status]?.label : (i as any)[sort.key]), sort.dir)), [filtered, sort]);
  const clearFilters = () => onFiltersChange({ status: 'all', search: '', vendorId: '', poId: '', dueFrom: '', dueTo: '' });

  const kpis = [
    { id: 'draft', label: 'Draft', list: groups.draft, amount: (i: Invoice) => i.totalAmount, icon: FilePen, tone: 'slate' },
    { id: 'submitted', label: 'Pending approval', list: groups.submitted, amount: (i: Invoice) => i.totalAmount, icon: Clock, tone: 'amber' },
    { id: 'approved', label: 'Approved', list: groups.approved, amount: (i: Invoice) => i.outstanding, icon: ShieldCheck, tone: 'blue' },
    { id: 'paid', label: 'Paid', list: groups.paid, amount: (i: Invoice) => i.totalAmount, icon: CheckCircle2, tone: 'emerald' },
    { id: 'overdue', label: 'Overdue', list: groups.overdue, amount: (i: Invoice) => i.outstanding, icon: AlertTriangle, tone: 'red' },
  ];
  const advancedCount = [filters.vendorId, filters.dueFrom, filters.dueTo].filter(Boolean).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Invoices"
        description="Supplier bills against purchase orders and goods receipts, from approval to payment."
        actions={<>
          <Button variant="outline" className="gap-2" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button variant="outline" className="gap-2" disabled={!filtered.length} onClick={() => exportInvoicesCsv(rows, 'invoices.csv')}>
            <Download className="w-4 h-4" /> Export
          </Button>
          {canCreate && <Button className="gap-2" onClick={onCreate}><Plus className="w-4 h-4" /> New invoice</Button>}
        </>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {kpis.map(k => {
          const active = filters.status === k.id;
          return (
            <KpiCard key={k.id} label={k.label} value={k.list.length} icon={k.icon} tone={k.tone as KpiTone}
              hint={k.list.length ? `${sumByCurrency(k.list, k.amount)}${k.id === 'approved' || k.id === 'overdue' ? ' due' : ''}` : 'None'}
              valueClassName={k.id === 'overdue' && k.list.length > 0 ? 'text-red-600' : undefined}
              loading={loading && !invoices.length} active={active} onClick={() => onFiltersChange({ status: active ? 'all' : k.id })} />
          );
        })}
      </div>

      {groups.overdue.length > 0 && filters.status !== 'overdue' && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {groups.overdue.length} invoice{groups.overdue.length === 1 ? ' is' : 's are'} past due, with {sumByCurrency(groups.overdue, i => i.outstanding, false)} unpaid.
          </span>
          <Button size="sm" variant="outline" className="h-7 border-red-200 bg-white text-red-700 hover:bg-red-100" onClick={() => onFiltersChange({ status: 'overdue' })}>
            Show {groups.overdue.length === 1 ? 'it' : 'them'}
          </Button>
        </div>
      )}

      <Card className="overflow-hidden shadow-sm">
        <div className="p-3.5 border-b space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by invoice number, vendor, vendor's reference, PO or GRN…" value={filters.search}
                onChange={(e) => onFiltersChange({ search: e.target.value })} className="pl-10 h-10" aria-label="Search invoices" />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-10 gap-2">
                  <Filter className="w-4 h-4" /> Filters
                  {advancedCount > 0 && <span className="ml-1 rounded bg-primary/10 text-primary text-[10px] px-1.5">{advancedCount}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 space-y-4" align="end">
                <div className="space-y-1.5">
                  <Label>Vendor</Label>
                  <Select value={filters.vendorId || 'all'} onValueChange={(v) => onFiltersChange({ vendorId: v === 'all' ? '' : v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem value="all">Any vendor</SelectItem>
                      {vendors.map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="inv-due-from">Due from</Label>
                    <Input id="inv-due-from" type="date" value={filters.dueFrom} onChange={(e) => onFiltersChange({ dueFrom: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="inv-due-to">Due to</Label>
                    <Input id="inv-due-to" type="date" value={filters.dueTo} onChange={(e) => onFiltersChange({ dueTo: e.target.value })} />
                  </div>
                </div>
                {advancedCount > 0 && (
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => onFiltersChange({ vendorId: '', dueFrom: '', dueTo: '' })}>Clear filters</Button>
                )}
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by status">
            {STATUS_FILTERS.map(f => (
              <Button key={f.id} size="sm" variant={filters.status === f.id ? 'default' : 'outline'} className="h-8 rounded-full"
                aria-pressed={filters.status === f.id} onClick={() => onFiltersChange({ status: f.id })}>
                {f.label}
              </Button>
            ))}
            {filters.poId && (
              <Badge variant="secondary" className="h-8 gap-1.5 rounded-full px-3">
                PO {poNumber || '…'}
                <button type="button" aria-label="Clear PO filter" onClick={() => onFiltersChange({ poId: '' })}><X className="w-3.5 h-3.5" /></button>
              </Badge>
            )}
            {filters.vendorId && (
              <Badge variant="secondary" className="h-8 gap-1.5 rounded-full px-3">
                {vendors.find(([id]) => id === filters.vendorId)?.[1] || 'Vendor'}
                <button type="button" aria-label="Clear vendor filter" onClick={() => onFiltersChange({ vendorId: '' })}><X className="w-3.5 h-3.5" /></button>
              </Badge>
            )}
          </div>
        </div>

        {error ? (
          <div className="p-10 text-center space-y-3">
            <p className="font-medium text-foreground">Invoices could not be loaded.</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={onRefresh}>Try again</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader k="invoiceNumber" label="Invoice" sort={sort} onSort={toggleSort} />
                  <SortableHeader k="vendorName" label="Vendor" sort={sort} onSort={toggleSort} />
                  <SortableHeader k="poNumber" label="Against" sort={sort} onSort={toggleSort} />
                  <SortableHeader k="totalAmount" label="Amount" align="right" sort={sort} onSort={toggleSort} />
                  <SortableHeader k="dueDate" label="Due" sort={sort} onSort={toggleSort} />
                  <SortableHeader k="status" label="Status" sort={sort} onSort={toggleSort} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && !invoices.length && [0, 1, 2, 3].map(i => (
                  <TableRow key={i}><TableCell colSpan={6}><div className="h-6 rounded bg-muted animate-pulse" /></TableCell></TableRow>
                ))}
                {!loading && filtered.length === 0 && (invoices.length ? (
                  <EmptyTableRow colSpan={6} filtered title="No invoices match these filters"
                    description="Try a different status, vendor or due date range." onClearFilters={clearFilters} />
                ) : (
                  <EmptyTableRow colSpan={6} icon={Receipt} title="No invoices yet"
                    description="Record a supplier bill against a sent purchase order or a goods receipt, then send it for approval."
                    action={canCreate ? { label: 'New invoice', icon: Plus, onClick: onCreate } : null} />
                ))}
                {rows.map(i => {
                  const due = dueLabel(i);
                  return (
                    <TableRow key={i.id} className={`cursor-pointer ${i.isOverdue ? 'bg-red-50/60 hover:bg-red-50' : ''}`} onClick={() => onOpen(i)}
                      tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') onOpen(i); }} aria-label={`Open ${i.invoiceNumber}`}>
                      <TableCell>
                        <span className="font-medium text-foreground">{i.invoiceNumber}</span>
                        {i.vendorInvoiceNumber && <span className="block text-xs text-muted-foreground">Vendor ref {i.vendorInvoiceNumber}</span>}
                      </TableCell>
                      <TableCell className="max-w-48 truncate">{i.vendorName}</TableCell>
                      <TableCell>
                        {i.poNumber || <span className="text-muted-foreground">No PO</span>}
                        {i.grnNumber && <span className="block text-xs text-muted-foreground">{i.grnNumber}</span>}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span className="font-medium">{formatMoney(i.totalAmount, i.currency)}</span>
                        {i.amountPaid > 0 && i.status !== 'paid' && (
                          <span className="block text-xs text-muted-foreground">{formatMoney(i.outstanding, i.currency)} left</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDate(i.dueDate)}
                        {due && <span className={`block text-xs ${toneClass[due.tone]}`}>{due.text}</span>}
                      </TableCell>
                      <TableCell><InvoiceStatusBadge invoice={i} /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        {!error && filtered.length > 0 && (
          <div className="px-4 py-2.5 border-t text-xs text-muted-foreground flex flex-wrap justify-between gap-2">
            <span>Showing {filtered.length} of {invoices.length} invoice{invoices.length === 1 ? '' : 's'}</span>
            <span>Outstanding in view: {sumByCurrency(filtered.filter(i => i.status !== 'draft'), i => i.outstanding, false)}</span>
          </div>
        )}
      </Card>
    </div>
  );
}
