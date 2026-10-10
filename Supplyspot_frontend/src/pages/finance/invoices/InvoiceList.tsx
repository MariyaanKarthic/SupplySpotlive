import React, { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Download, FilePen, Filter, Plus, RefreshCw, Search, ShieldCheck, X } from 'lucide-react';
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

  const kpis = [
    { id: 'draft', label: 'Draft', list: groups.draft, amount: (i: Invoice) => i.totalAmount, icon: FilePen, tone: 'border-l-slate-400 [&_.kpi-icon]:bg-slate-100 [&_.kpi-icon]:text-slate-600' },
    { id: 'submitted', label: 'Pending approval', list: groups.submitted, amount: (i: Invoice) => i.totalAmount, icon: Clock, tone: 'border-l-amber-500 [&_.kpi-icon]:bg-amber-50 [&_.kpi-icon]:text-amber-600' },
    { id: 'approved', label: 'Approved', list: groups.approved, amount: (i: Invoice) => i.outstanding, icon: ShieldCheck, tone: 'border-l-blue-500 [&_.kpi-icon]:bg-blue-50 [&_.kpi-icon]:text-blue-600' },
    { id: 'paid', label: 'Paid', list: groups.paid, amount: (i: Invoice) => i.totalAmount, icon: CheckCircle2, tone: 'border-l-emerald-500 [&_.kpi-icon]:bg-emerald-50 [&_.kpi-icon]:text-emerald-600' },
    { id: 'overdue', label: 'Overdue', list: groups.overdue, amount: (i: Invoice) => i.outstanding, icon: AlertTriangle, tone: 'border-l-red-500 [&_.kpi-icon]:bg-red-50 [&_.kpi-icon]:text-red-600' },
  ];
  const advancedCount = [filters.vendorId, filters.dueFrom, filters.dueTo].filter(Boolean).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-1">Supplier bills against purchase orders and goods receipts, from approval to payment.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button variant="outline" className="gap-2" disabled={!filtered.length} onClick={() => exportInvoicesCsv(filtered, 'invoices.csv')}>
            <Download className="w-4 h-4" /> Export
          </Button>
          {canCreate && <Button className="gap-2" onClick={onCreate}><Plus className="w-4 h-4" /> New invoice</Button>}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {kpis.map(k => {
          const active = filters.status === k.id;
          return (
            <button key={k.id} type="button" aria-pressed={active} className="text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onFiltersChange({ status: active ? 'all' : k.id })}>
              <Card className={`border-l-4 shadow-sm hover:shadow-md transition-all h-full ${k.tone} ${active ? 'ring-2 ring-primary/30' : ''}`}>
                <CardContent className="p-3.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground font-medium">{k.label}</p>
                    <p className={`text-xl font-bold mt-0.5 tabular-nums ${k.id === 'overdue' && k.list.length > 0 ? 'text-red-600' : 'text-foreground'}`}>
                      {loading && !invoices.length ? '–' : k.list.length}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {k.list.length ? `${sumByCurrency(k.list, k.amount)}${k.id === 'approved' || k.id === 'overdue' ? ' due' : ''}` : 'None'}
                    </p>
                  </div>
                  <div className="kpi-icon p-2.5 rounded-lg shrink-0"><k.icon className="w-5 h-5" /></div>
                </CardContent>
              </Card>
            </button>
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
                  <TableHead>Invoice</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Against</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && !invoices.length && [0, 1, 2, 3].map(i => (
                  <TableRow key={i}><TableCell colSpan={6}><div className="h-6 rounded bg-muted animate-pulse" /></TableCell></TableRow>
                ))}
                {!loading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                      {invoices.length ? 'No invoices match these filters.' : 'No invoices yet. Create one from a sent purchase order or a goods receipt.'}
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map(i => {
                  const due = dueLabel(i);
                  return (
                    <TableRow key={i.id} className={`cursor-pointer ${i.isOverdue ? 'bg-red-50/60 hover:bg-red-50' : ''}`} onClick={() => onOpen(i)}>
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
