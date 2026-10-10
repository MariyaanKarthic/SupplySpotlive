import React, { useMemo } from 'react';
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

  const kpis = [
    { id: 'in_transit', label: 'In transit', value: counts.inTransit, hint: 'Including awaiting dispatch', icon: Truck, tone: 'border-l-blue-500 [&_.kpi-icon]:bg-blue-50 [&_.kpi-icon]:text-blue-600', apply: 'open' },
    { id: 'delayed', label: 'Delayed', value: counts.delayed, hint: 'Past due or held up', icon: AlertTriangle, tone: 'border-l-red-500 [&_.kpi-icon]:bg-red-50 [&_.kpi-icon]:text-red-600', apply: 'delayed' },
    { id: 'delivered', label: 'Received', value: counts.delivered, hint: 'Delivered in full', icon: CheckCircle2, tone: 'border-l-emerald-500 [&_.kpi-icon]:bg-emerald-50 [&_.kpi-icon]:text-emerald-600', apply: 'delivered' },
    { id: 'partial', label: 'Partially received', value: counts.partial, hint: 'Balance still to come', icon: PackageOpen, tone: 'border-l-amber-500 [&_.kpi-icon]:bg-amber-50 [&_.kpi-icon]:text-amber-600', apply: 'partially_received' },
  ];
  const advancedCount = [filters.vendorId, filters.dueFrom, filters.dueTo].filter(Boolean).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Shipment Tracking</h1>
          <p className="text-sm text-muted-foreground mt-1">Deliveries on their way from suppliers to your receiving dock.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button className="gap-2" onClick={onCreate}><Plus className="w-4 h-4" /> New shipment</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(k => {
          const active = filters.status === k.apply;
          return (
            <button key={k.id} type="button" aria-pressed={active} className="text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onFiltersChange({ status: active ? 'all' : k.apply })}>
              <Card className={`border-l-4 shadow-sm hover:shadow-md transition-all ${k.tone} ${active ? 'ring-2 ring-primary/30' : ''}`}>
                <CardContent className="p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{k.label}</p>
                    <p className={`text-xl font-bold mt-0.5 tabular-nums ${k.id === 'delayed' && k.value > 0 ? 'text-red-600' : 'text-foreground'}`}>
                      {loading && !shipments.length ? '–' : k.value}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{k.hint}</p>
                  </div>
                  <div className="kpi-icon p-2.5 rounded-lg"><k.icon className="w-5 h-5" /></div>
                </CardContent>
              </Card>
            </button>
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
                  <TableHead>Shipment</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Carrier</TableHead>
                  <TableHead>Latest update</TableHead>
                  <TableHead>Expected</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && !shipments.length && [0, 1, 2, 3].map(i => (
                  <TableRow key={i}><TableCell colSpan={6}><div className="h-6 rounded bg-muted animate-pulse" /></TableCell></TableRow>
                ))}
                {!loading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                      {shipments.length ? 'No shipments match these filters.' : 'No shipments yet. Sending a PO to its vendor creates one.'}
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map(s => {
                  const eta = etaLabel(s);
                  const late = isDelayed(s);
                  return (
                    <TableRow key={s.id} className={`cursor-pointer ${late ? 'bg-red-50/60 hover:bg-red-50' : ''}`} onClick={() => onOpen(s)}>
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
