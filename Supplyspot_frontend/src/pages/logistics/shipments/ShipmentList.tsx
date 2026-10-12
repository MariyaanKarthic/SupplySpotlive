import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Filter, PackageOpen, Plus, RefreshCw, Search, Truck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  EVENT_META, STATUS_FILTERS, STATUS_META, Shipment, etaLabel, formatDate, formatDateTime, isDelayed, toneClass,
} from './shipmentModel';
import { EmptyTableRow, KpiCard, KpiTone, PageHeader, SortableHeader, SortState, sortRows } from '@/components/common';

export interface ShipmentFilters {
  status: string;
  search: string;
  vendorId: string;
  poId: string;
  dueFrom: string;
  dueTo: string;
}

export function ShipmentStatusBadge({ shipment, className = '' }: { shipment: Shipment; className?: string }) {
  // A shipment past its date shows as Delayed even before anyone logs an exception.
  const meta = shipment.isOverdue && shipment.status !== 'delayed' ? STATUS_META.delayed : STATUS_META[shipment.status];
  return <Badge variant="outline" className={`${meta.className} ${className}`}>{meta.label}</Badge>;
}

const matchesStatus = (s: Shipment, status: string) => {
  if (status === 'all') return true;
  if (status === 'open') return !['delivered', 'cancelled'].includes(s.status);
  if (status === 'delayed') return isDelayed(s);
  if (status === 'in_transit') return s.status === 'in_transit' && !s.isOverdue;
  if (status === 'pending') return s.status === 'pending' && !s.isOverdue;
  return s.status === status;
};

export function ShipmentList({
  shipments,
  loading,
  error,
  filters,
  onFiltersChange,
  onOpen,
  onCreate,
  onRefresh,
}: {
  shipments: Shipment[];
  loading: boolean;
  error: string | null;
  filters: ShipmentFilters;
  onFiltersChange: (f: Partial<ShipmentFilters>) => void;
  onOpen: (s: Shipment) => void;
  onCreate: () => void;
  onRefresh: () => void;
}) {
  const vendors = useMemo(() => {
    const map = new Map<string, string>();
    shipments.forEach(s => map.set(s.vendorId, s.vendorName));
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [shipments]);
  const poNumber = shipments.find(s => s.poId === filters.poId)?.poNumber;

  const counts = useMemo(() => ({
    inTransit: shipments.filter(s => matchesStatus(s, 'in_transit') || matchesStatus(s, 'pending')).length,
    delayed: shipments.filter(isDelayed).length,
    delivered: shipments.filter(s => s.status === 'delivered').length,
    partial: shipments.filter(s => s.status === 'partially_received').length,
  }), [shipments]);

  const filtered = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return shipments
      .filter(s =>
        matchesStatus(s, filters.status) &&
        (!filters.vendorId || s.vendorId === filters.vendorId) &&
        (!filters.poId || s.poId === filters.poId) &&
        (!filters.dueFrom || (s.expectedDeliveryDate || '') >= filters.dueFrom) &&
        (!filters.dueTo || (s.expectedDeliveryDate || '') <= filters.dueTo) &&
        (!term || [s.shipmentNumber, s.poNumber, s.vendorName, s.carrierName, s.trackingNumber]
          .some(v => (v || '').toLowerCase().includes(term))))
      // Late shipments first, then open ones by soonest expected date, then finished ones newest first.
      .sort((a, b) => {
        const rank = (s: Shipment) => (isDelayed(s) ? 0 : ['delivered', 'cancelled'].includes(s.status) ? 2 : 1);
        const exp = String(a.expectedDeliveryDate).localeCompare(String(b.expectedDeliveryDate));
        return rank(a) - rank(b) || (rank(a) === 2 ? -exp : exp);
      });
  }, [shipments, filters]);

  // 'priority' keeps the late-first order above; clicking a column header sorts by that column instead.
  type SortKey = 'priority' | 'shipmentNumber' | 'vendorName' | 'carrierName' | 'expectedDeliveryDate' | 'status';
  const [sort, setSort] = useState<SortState<SortKey>>({ key: 'priority', dir: 'asc' });
  const toggleSort = (key: SortKey) => setSort(s => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
  const rows = useMemo(() => (sort.key === 'priority' ? filtered
    : sortRows(filtered, s => (sort.key === 'status' ? STATUS_META[s.status]?.label : (s as any)[sort.key]), sort.dir)), [filtered, sort]);
  const clearFilters = () => onFiltersChange({ status: 'all', search: '', vendorId: '', poId: '', dueFrom: '', dueTo: '' });

  const kpis = [
    { id: 'in_transit', label: 'In transit', value: counts.inTransit, hint: 'Including awaiting dispatch', icon: Truck, tone: 'blue', apply: 'open' },
    { id: 'delayed', label: 'Delayed', value: counts.delayed, hint: 'Past due or held up', icon: AlertTriangle, tone: 'red', apply: 'delayed' },
    { id: 'delivered', label: 'Received', value: counts.delivered, hint: 'Delivered in full', icon: CheckCircle2, tone: 'emerald', apply: 'delivered' },
    { id: 'partial', label: 'Partially received', value: counts.partial, hint: 'Balance still to come', icon: PackageOpen, tone: 'amber', apply: 'partially_received' },
  ];
  const advancedCount = [filters.vendorId, filters.dueFrom, filters.dueTo].filter(Boolean).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Shipment Tracking"
        description="Deliveries on their way from suppliers to your receiving dock."
        actions={<>
          <Button variant="outline" className="gap-2" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button className="gap-2" onClick={onCreate}><Plus className="w-4 h-4" /> New shipment</Button>
        </>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(k => {
          const active = filters.status === k.apply;
          return (
            <KpiCard key={k.id} label={k.label} value={k.value} hint={k.hint} icon={k.icon} tone={k.tone as KpiTone}
              valueClassName={k.id === 'delayed' && k.value > 0 ? 'text-red-600' : undefined}
              loading={loading && !shipments.length} active={active} onClick={() => onFiltersChange({ status: active ? 'all' : k.apply })} />
          );
        })}
      </div>

      {counts.delayed > 0 && filters.status !== 'delayed' && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {counts.delayed} shipment{counts.delayed === 1 ? ' is' : 's are'} overdue or held up.
          </span>
          <Button size="sm" variant="outline" className="h-7 border-red-200 bg-white text-red-700 hover:bg-red-100" onClick={() => onFiltersChange({ status: 'delayed' })}>
            Show {counts.delayed === 1 ? 'it' : 'them'}
          </Button>
        </div>
      )}

      <Card className="overflow-hidden shadow-sm">
        <div className="p-3.5 border-b space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by shipment, PO, vendor, carrier or tracking number…" value={filters.search}
                onChange={(e) => onFiltersChange({ search: e.target.value })} className="pl-10 h-10" aria-label="Search shipments" />
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
                    <Label htmlFor="due-from">Due from</Label>
                    <Input id="due-from" type="date" value={filters.dueFrom} onChange={(e) => onFiltersChange({ dueFrom: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="due-to">Due to</Label>
                    <Input id="due-to" type="date" value={filters.dueTo} onChange={(e) => onFiltersChange({ dueTo: e.target.value })} />
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
          </div>
        </div>

        {error ? (
          <div className="p-10 text-center space-y-3">
            <p className="font-medium text-foreground">Shipments could not be loaded.</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={onRefresh}>Try again</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader k="shipmentNumber" label="Shipment" sort={sort} onSort={toggleSort} />
                  <SortableHeader k="vendorName" label="Vendor" sort={sort} onSort={toggleSort} />
                  <SortableHeader k="carrierName" label="Carrier" sort={sort} onSort={toggleSort} />
                  <TableHead>Latest update</TableHead>
                  <SortableHeader k="expectedDeliveryDate" label="Expected" sort={sort} onSort={toggleSort} />
                  <SortableHeader k="status" label="Status" sort={sort} onSort={toggleSort} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && !shipments.length && [0, 1, 2, 3].map(i => (
                  <TableRow key={i}><TableCell colSpan={6}><div className="h-6 rounded bg-muted animate-pulse" /></TableCell></TableRow>
                ))}
                {!loading && filtered.length === 0 && (shipments.length ? (
                  <EmptyTableRow colSpan={6} filtered title="No shipments match these filters"
                    description="Try a different status, vendor or date range." onClearFilters={clearFilters} />
                ) : (
                  <EmptyTableRow colSpan={6} icon={Truck} title="No shipments yet"
                    description="Sending a purchase order to its vendor creates a shipment automatically. You can also log one by hand."
                    action={{ label: 'New shipment', icon: Plus, onClick: onCreate }} />
                ))}
                {rows.map(s => {
                  const eta = etaLabel(s);
                  const late = isDelayed(s);
                  return (
                    <TableRow key={s.id} className={`cursor-pointer ${late ? 'bg-red-50/60 hover:bg-red-50' : ''}`} onClick={() => onOpen(s)}
                      tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') onOpen(s); }} aria-label={`Open ${s.shipmentNumber}`}>
                      <TableCell>
                        <span className="font-medium text-foreground">{s.shipmentNumber}</span>
                        <span className="block text-xs text-muted-foreground">{s.poNumber}</span>
                      </TableCell>
                      <TableCell className="max-w-48 truncate">{s.vendorName}</TableCell>
                      <TableCell>
                        {s.carrierName || <span className="text-muted-foreground">Not set</span>}
                        {s.trackingNumber && <span className="block text-xs text-muted-foreground font-mono">{s.trackingNumber}</span>}
                      </TableCell>
                      <TableCell>
                        {s.latestEvent ? (
                          <>
                            <span className="flex items-center gap-1.5">
                              <span className={`h-2 w-2 rounded-full ${EVENT_META[s.latestEvent.statusEvent]?.dot || 'bg-slate-400'}`} />
                              {EVENT_META[s.latestEvent.statusEvent]?.label || s.latestEvent.statusEvent}
                            </span>
                            <span className="block text-xs text-muted-foreground truncate max-w-56">
                              {[s.latestEvent.location, formatDateTime(s.latestEvent.eventDate)].filter(Boolean).join(' · ')}
                            </span>
                          </>
                        ) : <span className="text-muted-foreground">No updates yet</span>}
                      </TableCell>
                      <TableCell>
                        {formatDate(s.expectedDeliveryDate)}
                        {eta && <span className={`block text-xs ${toneClass[eta.tone]}`}>{eta.text}</span>}
                      </TableCell>
                      <TableCell><ShipmentStatusBadge shipment={s} /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        {!error && filtered.length > 0 && (
          <div className="px-4 py-2.5 border-t text-xs text-muted-foreground">
            Showing {filtered.length} of {shipments.length} shipment{shipments.length === 1 ? '' : 's'}
          </div>
        )}
      </Card>
    </div>
  );
}
