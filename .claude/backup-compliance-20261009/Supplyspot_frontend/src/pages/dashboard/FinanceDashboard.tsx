import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CalendarRange, CheckCircle2, Clock, IndianRupee, RefreshCw, Wallet } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts';
import { financeService } from '@/services/api';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '../procurement/purchase-orders/poModel';
import { STATUS_META, InvoiceStatus } from '../finance/invoices/invoiceModel';

// ---------- Response shape (GET /finance/dashboard) ----------

interface OtherCurrency { currency: string; amount: number; count: number }
interface Kpi { amount: number; count: number; others: OtherCurrency[] }
interface RecentInvoice {
  id: string; invoiceNumber: string; vendorId: string; vendorName: string; poNumber: string | null;
  status: InvoiceStatus; currency: string; totalAmount: number; amountPaid: number; outstanding: number;
  issueDate: string | null; dueDate: string | null; isOverdue: boolean; daysOverdue: number;
}
interface AgingBucket {
  id: string; label: string; count: number; amount: number;
  invoices: { id: string; invoiceNumber: string; vendorId: string; vendorName: string; currency: string; outstanding: number; dueDate: string | null; daysOverdue: number }[];
}
interface FinanceData {
  range: { from: string | null; to: string | null; asOf: string };
  currency: string;
  scope: { all: boolean; label: string };
  kpis: { totalSpending: Kpi; outstanding: Kpi & { awaitingApproval: { amount: number; count: number } }; paid: Kpi; overdue: Kpi };
  spendingByVendor: { top: { vendorId: string; vendorName: string; amount: number; poCount: number }[]; otherVendors: { count: number; amount: number } };
  invoiceStatus: { status: InvoiceStatus; count: number; amount: number }[];
  invoiceCount: number;
  recentInvoices: RecentInvoice[];
  aging: AgingBucket[];
}

// ---------- Money ----------

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const formatInr = (n: number) => inr.format(n || 0);
// Indian short scale for axes and legends: ₹1.2 Cr, ₹4.5 L, ₹80 K.
function formatInrCompact(n: number) {
  const v = Math.abs(n || 0);
  const short = (x: number) => String(Math.round(x * 10) / 10);
  if (v >= 1e7) return `₹${short(n / 1e7)} Cr`;
  if (v >= 1e5) return `₹${short(n / 1e5)} L`;
  if (v >= 1e3) return `₹${short(n / 1e3)} K`;
  return formatInr(n);
}
function formatAny(amount: number, currency: string) {
  if (currency === 'INR') return formatInr(amount);
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString('en-IN')}`;
  }
}
// "+ $3,816.67 in USD (2)" for amounts the INR totals leave out.
const othersNote = (others: OtherCurrency[]) =>
  others.length ? `Plus ${others.map(o => formatAny(o.amount, o.currency)).join(', ')} not in INR` : null;

// ---------- Date filter ----------

type Preset = 'this_month' | 'last_month' | 'this_quarter' | 'this_year' | 'last_12_months' | 'all' | 'custom';
const PRESETS: { id: Preset; label: string }[] = [
  { id: 'this_month', label: 'This month' },
  { id: 'last_month', label: 'Last month' },
  { id: 'this_quarter', label: 'This quarter' },
  { id: 'this_year', label: 'This year' },
  { id: 'last_12_months', label: 'Last 12 months' },
  { id: 'all', label: 'All time' },
  { id: 'custom', label: 'Custom range' },
];
const DEFAULT_PRESET: Preset = 'this_year';

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function presetRange(preset: Preset): { from: string; to: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (preset) {
    case 'this_month': return { from: iso(new Date(y, m, 1)), to: iso(new Date(y, m + 1, 0)) };
    case 'last_month': return { from: iso(new Date(y, m - 1, 1)), to: iso(new Date(y, m, 0)) };
    case 'this_quarter': {
      const q = Math.floor(m / 3) * 3;
      return { from: iso(new Date(y, q, 1)), to: iso(new Date(y, q + 3, 0)) };
    }
    case 'this_year': return { from: `${y}-01-01`, to: `${y}-12-31` };
    case 'last_12_months': return { from: iso(new Date(y, m - 11, 1)), to: iso(new Date(y, m + 1, 0)) };
    default: return { from: '', to: '' };
  }
}

function rangeLabel(preset: Preset, from: string, to: string) {
  if (preset !== 'custom') return PRESETS.find(p => p.id === preset)!.label;
  if (from && to) return `${formatDate(from)} – ${formatDate(to)}`;
  if (from) return `From ${formatDate(from)}`;
  if (to) return `Up to ${formatDate(to)}`;
  return 'All time';
}

// ---------- Colours: paid = green, unpaid / overdue = red, pending = amber ----------

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: '#94a3b8', // slate-400
  submitted: '#f59e0b', // amber-500, pending approval
  approved: '#3b82f6', // blue-500, cleared for payment
  paid: '#10b981', // emerald-500
  disputed: '#ef4444', // red-500
};
const SPEND_COLOR = '#3b82f6';

function paymentBadge(inv: RecentInvoice) {
  if (inv.status === 'paid') return { label: 'Paid', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (inv.status === 'draft') return { label: 'Not billed', className: 'bg-slate-50 text-slate-600 border-slate-200' };
  if (inv.isOverdue) return { label: `Overdue ${inv.daysOverdue}d`, className: 'bg-red-50 text-red-700 border-red-200' };
  if (inv.amountPaid > 0) return { label: 'Part paid', className: 'bg-amber-50 text-amber-700 border-amber-200' };
  return { label: 'Unpaid', className: 'bg-red-50 text-red-600 border-red-200' };
}

// ---------- Page ----------

export function FinanceDashboard({ onNavigate }: { onNavigate?: (view: any) => void }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const presetParam = searchParams.get('period') as Preset | null;
  const preset: Preset = presetParam && PRESETS.some(p => p.id === presetParam) ? presetParam : DEFAULT_PRESET;
  const customFrom = searchParams.get('from') || '';
  const customTo = searchParams.get('to') || '';
  const range = preset === 'custom' ? { from: customFrom, to: customTo } : presetRange(preset);

  // Filter state lives in the URL next to section=finance so the view can be linked and Back works.
  const updateParams = useCallback((patch: Record<string, string | null>) => {
    setSearchParams(() => {
      const next = new URLSearchParams(window.location.search);
      Object.entries(patch).forEach(([k, v]) => (v === null || v === '' ? next.delete(k) : next.set(k, v)));
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const goTo = (params: Record<string, string>) => setSearchParams(params);

  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async (from: string, to: string) => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await financeService.getDashboard({ from, to });
      setData(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the finance dashboard');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(range.from, range.to); }, [load, range.from, range.to]);

  const [agingOpen, setAgingOpen] = useState<string | null>(null);
  const label = rangeLabel(preset, range.from, range.to);

  return (
    <div className="px-6 pb-6 space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="sticky top-0 bg-background/95 backdrop-blur z-20 border-b py-3 -mx-6 px-6">
        <Breadcrumb className="text-xs">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => onNavigate && onNavigate('home')} className="cursor-pointer">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Finance</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Finance Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Spending, invoices and payments · {data?.scope.label || '…'}
          </p>
        </div>
        <DateFilter
          preset={preset}
          from={customFrom}
          to={customTo}
          label={label}
          loading={loading}
          onPreset={(p) => updateParams({ period: p === DEFAULT_PRESET ? null : p, ...(p !== 'custom' && { from: null, to: null }) })}
          onCustom={(from, to) => updateParams({ period: 'custom', from, to })}
          onRefresh={() => load(range.from, range.to)}
        />
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <p className="text-sm text-red-700">{error}</p>
            <Button variant="outline" size="sm" onClick={() => load(range.from, range.to)}>Try again</Button>
          </CardContent>
        </Card>
      )}

      <KpiRow data={data} loading={loading} periodLabel={label} onOpenInvoices={(status) => goTo({ section: 'invoices', status })} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <VendorSpendChart data={data} loading={loading} onVendor={(id) => goTo({ section: 'vendors', vendor: id })} />
        <InvoiceStatusChart data={data} loading={loading} onStatus={(status) => goTo({ section: 'invoices', status })} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <RecentInvoices
          className="xl:col-span-3"
          data={data}
          loading={loading}
          onOpen={(id) => goTo({ section: 'invoices', invoice: id })}
          onViewAll={() => goTo({ section: 'invoices' })}
        />
        <AgingReport
          className="xl:col-span-2"
          data={data}
          loading={loading}
          open={agingOpen}
          onToggle={(id) => setAgingOpen(agingOpen === id ? null : id)}
          onOpen={(id) => goTo({ section: 'invoices', invoice: id })}
        />
      </div>
    </div>
  );
}

// ---------- Date filter ----------

function DateFilter({ preset, from, to, label, loading, onPreset, onCustom, onRefresh }: {
  preset: Preset; from: string; to: string; label: string; loading: boolean;
  onPreset: (p: Preset) => void; onCustom: (from: string, to: string) => void; onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);
  useEffect(() => { setDraftFrom(from); setDraftTo(to); }, [from, to]);
  const invalid = !!draftFrom && !!draftTo && draftFrom > draftTo;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={preset}
        onValueChange={(v) => {
          if (v === 'custom') setOpen(true);
          else onPreset(v as Preset);
        }}
      >
        <SelectTrigger className="w-[160px]" aria-label="Period"><SelectValue /></SelectTrigger>
        <SelectContent>
          {PRESETS.map(p => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2 max-w-[260px]">
            <CalendarRange className="w-4 h-4 shrink-0" />
            <span className="truncate">{preset === 'custom' ? label : 'Date range'}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="fin-from" className="text-xs">From</Label>
              <Input id="fin-from" type="date" value={draftFrom} onChange={e => setDraftFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fin-to" className="text-xs">To</Label>
              <Input id="fin-to" type="date" value={draftTo} onChange={e => setDraftTo(e.target.value)} />
            </div>
          </div>
          {invalid && <p className="text-xs text-red-600">The start date must be on or before the end date.</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" disabled={invalid || (!draftFrom && !draftTo)} onClick={() => { onCustom(draftFrom, draftTo); setOpen(false); }}>
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <Button variant="outline" size="icon" onClick={onRefresh} disabled={loading} aria-label="Refresh">
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
}

// ---------- KPI tiles ----------

function KpiRow({ data, loading, periodLabel, onOpenInvoices }: {
  data: FinanceData | null; loading: boolean; periodLabel: string; onOpenInvoices: (status: string) => void;
}) {
  const k = data?.kpis;
  const tiles = [
    {
      id: 'spending',
      label: 'Total spending',
      value: k ? formatInr(k.totalSpending.amount) : '–',
      sub: k ? `${k.totalSpending.count} approved PO${k.totalSpending.count === 1 ? '' : 's'} · ${periodLabel}` : periodLabel,
      note: k ? othersNote(k.totalSpending.others) : null,
      icon: IndianRupee,
      tone: 'border-l-blue-500 [&_.kpi-icon]:bg-blue-50 [&_.kpi-icon]:text-blue-600',
      valueClass: 'text-foreground',
    },
    {
      id: 'outstanding',
      label: 'Outstanding invoices',
      value: k ? formatInr(k.outstanding.amount) : '–',
      sub: k ? `${k.outstanding.count} approved, not fully paid` : 'Approved, not fully paid',
      note: k
        ? (k.outstanding.awaitingApproval.count
          ? `${formatInr(k.outstanding.awaitingApproval.amount)} more awaiting approval`
          : othersNote(k.outstanding.others))
        : null,
      noteClass: 'text-amber-700',
      icon: Wallet,
      tone: 'border-l-red-400 [&_.kpi-icon]:bg-red-50 [&_.kpi-icon]:text-red-500',
      valueClass: 'text-foreground',
      onClick: () => onOpenInvoices('approved'),
    },
    {
      id: 'paid',
      label: `Paid · ${periodLabel}`,
      value: k ? formatInr(k.paid.amount) : '–',
      sub: k ? `${k.paid.count} payment${k.paid.count === 1 ? '' : 's'} recorded` : 'Payments by payment date',
      note: k ? othersNote(k.paid.others) : null,
      icon: CheckCircle2,
      tone: 'border-l-emerald-500 [&_.kpi-icon]:bg-emerald-50 [&_.kpi-icon]:text-emerald-600',
      valueClass: 'text-emerald-700',
      onClick: () => onOpenInvoices('paid'),
    },
    {
      id: 'overdue',
      label: 'Overdue invoices',
      value: k ? formatInr(k.overdue.amount) : '–',
      sub: k ? `${k.overdue.count} approved and past due` : 'Approved and past due',
      note: k ? othersNote(k.overdue.others) : null,
      icon: AlertTriangle,
      tone: 'border-l-red-600 [&_.kpi-icon]:bg-red-100 [&_.kpi-icon]:text-red-600',
      valueClass: k && k.overdue.count ? 'text-red-600' : 'text-foreground',
      onClick: () => onOpenInvoices('overdue'),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      {tiles.map(t => {
        const Icon = t.icon;
        const body = (
          <Card className={`border-l-4 shadow-sm h-full ${t.tone} ${t.onClick ? 'hover:shadow-md transition-all' : ''}`}>
            <CardContent className="p-4 flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="text-xs text-muted-foreground font-medium truncate">{t.label}</p>
                <p className={`text-2xl font-bold tabular-nums ${t.valueClass} ${loading && !data ? 'animate-pulse' : ''}`}>{t.value}</p>
                <p className="text-[11px] text-muted-foreground truncate">{t.sub}</p>
                {t.note && <p className={`text-[11px] truncate ${t.noteClass || 'text-muted-foreground'}`}>{t.note}</p>}
              </div>
              <div className="kpi-icon rounded-lg p-2 shrink-0"><Icon className="w-5 h-5" /></div>
            </CardContent>
          </Card>
        );
        return t.onClick ? (
          <button key={t.id} type="button" onClick={t.onClick} className="text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {body}
          </button>
        ) : <div key={t.id}>{body}</div>;
      })}
    </div>
  );
}

// ---------- Charts ----------

const spendConfig = { amount: { label: 'PO total', color: SPEND_COLOR } } satisfies ChartConfig;

function VendorSpendChart({ data, loading, onVendor }: { data: FinanceData | null; loading: boolean; onVendor: (id: string) => void }) {
  const rows = data?.spendingByVendor.top || [];
  const rest = data?.spendingByVendor.otherVendors;
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Spending by vendor</CardTitle>
        <CardDescription>Top 5 vendors by approved PO value (INR). Click a bar to open the vendor.</CardDescription>
      </CardHeader>
      <CardContent>
        {!rows.length ? (
          <EmptyState loading={loading} text="No approved purchase orders in this period." />
        ) : (
          <>
            <ChartContainer config={spendConfig} className="aspect-auto h-[260px] w-full">
              <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }} barCategoryGap={10}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={formatInrCompact} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="vendorName"
                  width={170}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: string) => (v.length > 24 ? `${v.slice(0, 23)}…` : v)}
                />
                <ChartTooltip
                  cursor={{ fillOpacity: 0.4 }}
                  content={(
                    <ChartTooltipContent
                      hideLabel
                      formatter={(value, _name, item) => (
                        <div className="w-full space-y-0.5">
                          <p className="font-medium text-foreground">{item.payload.vendorName}</p>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">{item.payload.poCount} PO{item.payload.poCount === 1 ? '' : 's'}</span>
                            <span className="font-mono font-medium tabular-nums text-foreground">{formatInr(Number(value))}</span>
                          </div>
                        </div>
                      )}
                    />
                  )}
                />
                <Bar
                  dataKey="amount"
                  fill="var(--color-amount)"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={28}
                  className="cursor-pointer"
                  onClick={(entry: any) => entry?.vendorId && onVendor(entry.vendorId)}
                />
              </BarChart>
            </ChartContainer>
            {rest && rest.count > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {rest.count} other vendor{rest.count === 1 ? '' : 's'}: {formatInr(rest.amount)}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

const statusConfig = Object.fromEntries(
  (Object.keys(STATUS_COLORS) as InvoiceStatus[]).map(s => [s, { label: STATUS_META[s].label, color: STATUS_COLORS[s] }]),
) satisfies ChartConfig;

function InvoiceStatusChart({ data, loading, onStatus }: { data: FinanceData | null; loading: boolean; onStatus: (status: string) => void }) {
  const rows = useMemo(() => (data?.invoiceStatus || []).map(r => ({ ...r, label: STATUS_META[r.status].label, fill: STATUS_COLORS[r.status] })), [data]);
  const slices = rows.filter(r => r.count > 0);
  const total = rows.reduce((a, r) => a + r.count, 0);
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Invoice status</CardTitle>
        <CardDescription>Invoices issued in this period, by status. Click a status to see those invoices.</CardDescription>
      </CardHeader>
      <CardContent>
        {!total ? (
          <EmptyState loading={loading} text="No invoices issued in this period." />
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <ChartContainer config={statusConfig} className="aspect-square h-[240px] w-full max-w-[260px]">
              <PieChart>
                <ChartTooltip
                  content={(
                    <ChartTooltipContent
                      nameKey="status"
                      hideLabel
                      formatter={(value, _name, item) => (
                        <div className="flex w-full items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: item.payload.fill }} />
                            {item.payload.label}
                          </span>
                          <span className="font-mono font-medium tabular-nums text-foreground">{value}</span>
                        </div>
                      )}
                    />
                  )}
                />
                <Pie
                  data={slices}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={slices.length > 1 ? 2 : 0}
                  stroke="var(--background)"
                  strokeWidth={2}
                  className="cursor-pointer"
                  onClick={(entry: any) => entry?.status && onStatus(entry.status)}
                >
                  {slices.map(r => <Cell key={r.status} fill={r.fill} />)}
                </Pie>
                <text x="50%" y="48%" textAnchor="middle" className="fill-foreground text-2xl font-bold">{total}</text>
                <text x="50%" y="58%" textAnchor="middle" className="fill-muted-foreground text-xs">invoices</text>
              </PieChart>
            </ChartContainer>
            <ul className="flex-1 w-full space-y-1.5">
              {rows.map(r => (
                <li key={r.status}>
                  <button
                    type="button"
                    onClick={() => onStatus(r.status)}
                    className="w-full flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60 text-left"
                  >
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: r.fill }} />
                      {r.label}
                    </span>
                    <span className="flex items-baseline gap-3 tabular-nums">
                      <span className="text-xs text-muted-foreground">{r.amount ? formatInrCompact(r.amount) : ''}</span>
                      <span className="font-medium w-6 text-right">{r.count}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------- Tables ----------

function RecentInvoices({ data, loading, className, onOpen, onViewAll }: {
  data: FinanceData | null; loading: boolean; className?: string; onOpen: (id: string) => void; onViewAll: () => void;
}) {
  const rows = data?.recentInvoices || [];
  return (
    <Card className={`shadow-sm ${className || ''}`}>
      <CardHeader className="pb-2 flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-base">Recent invoices</CardTitle>
          <CardDescription>Latest 10 issued in this period.</CardDescription>
        </div>
        <Button variant="ghost" size="sm" className="gap-1 shrink-0" onClick={onViewAll}>
          View all <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="px-0 pb-2">
        {!rows.length ? (
          <div className="px-6"><EmptyState loading={loading} text="No invoices issued in this period." /></div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Invoice</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-6">Payment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(inv => {
                  const pay = paymentBadge(inv);
                  const meta = STATUS_META[inv.status];
                  return (
                    <TableRow key={inv.id} className="cursor-pointer" onClick={() => onOpen(inv.id)}>
                      <TableCell className="pl-6 font-medium whitespace-nowrap">
                        {inv.invoiceNumber}
                        {inv.poNumber && <span className="block text-[11px] text-muted-foreground font-normal">{inv.poNumber}</span>}
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate">{inv.vendorName}</TableCell>
                      <TableCell className="text-right tabular-nums whitespace-nowrap">{formatAny(inv.totalAmount, inv.currency)}</TableCell>
                      <TableCell className={`whitespace-nowrap ${inv.isOverdue ? 'text-red-600' : ''}`}>{formatDate(inv.dueDate)}</TableCell>
                      <TableCell><Badge variant="outline" className={meta.className}>{meta.label}</Badge></TableCell>
                      <TableCell className="pr-6"><Badge variant="outline" className={pay.className}>{pay.label}</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const AGING_TONE: Record<string, { bar: string; text: string }> = {
  current: { bar: 'bg-amber-400', text: 'text-amber-700' },
  '0_30': { bar: 'bg-red-300', text: 'text-red-600' },
  '31_60': { bar: 'bg-red-500', text: 'text-red-700' },
  '60_plus': { bar: 'bg-red-700', text: 'text-red-800' },
};

function AgingReport({ data, loading, className, open, onToggle, onOpen }: {
  data: FinanceData | null; loading: boolean; className?: string; open: string | null;
  onToggle: (id: string) => void; onOpen: (id: string) => void;
}) {
  const buckets = data?.aging || [];
  const total = buckets.reduce((a, b) => a + b.amount, 0);
  const count = buckets.reduce((a, b) => a + b.count, 0);
  return (
    <Card className={`shadow-sm ${className || ''}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Aging report</CardTitle>
        <CardDescription>
          Approved invoices awaiting payment, by days past due as of {data ? formatDate(data.range.asOf) : 'today'}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!count ? (
          <EmptyState loading={loading} text="Nothing awaiting payment for invoices issued in this period." />
        ) : (
          <>
            {/* Share of outstanding INR per bucket */}
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted gap-0.5" aria-hidden>
              {buckets.filter(b => b.amount > 0).map(b => (
                <div key={b.id} className={AGING_TONE[b.id]?.bar} style={{ width: `${(b.amount / (total || 1)) * 100}%` }} />
              ))}
            </div>
            <div className="divide-y rounded-lg border">
              {buckets.map(b => (
                <div key={b.id}>
                  <button
                    type="button"
                    disabled={!b.count}
                    onClick={() => onToggle(b.id)}
                    aria-expanded={open === b.id}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-sm text-left hover:bg-muted/50 disabled:hover:bg-transparent disabled:cursor-default"
                  >
                    <span className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-[2px] ${AGING_TONE[b.id]?.bar}`} />
                      <span className="font-medium">{b.id === 'current' ? b.label : `${b.label} overdue`}</span>
                      <span className="text-xs text-muted-foreground">{b.count} invoice{b.count === 1 ? '' : 's'}</span>
                    </span>
                    <span className={`tabular-nums font-semibold ${b.amount ? AGING_TONE[b.id]?.text : 'text-muted-foreground'}`}>
                      {formatInr(b.amount)}
                    </span>
                  </button>
                  {open === b.id && b.invoices.length > 0 && (
                    <ul className="bg-muted/30 px-3 pb-2 space-y-1">
                      {b.invoices.map(i => (
                        <li key={i.id}>
                          <button type="button" onClick={() => onOpen(i.id)} className="w-full flex items-center justify-between gap-3 py-1.5 text-xs text-left hover:underline">
                            <span className="truncate">
                              <span className="font-medium">{i.invoiceNumber}</span> · {i.vendorName}
                              <span className="text-muted-foreground"> · due {formatDate(i.dueDate)}{i.daysOverdue ? ` (${i.daysOverdue}d late)` : ''}</span>
                            </span>
                            <span className="tabular-nums shrink-0">{formatAny(i.outstanding, i.currency)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Total outstanding {formatInr(total)} across {count} invoice{count === 1 ? '' : 's'}.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ loading, text }: { loading: boolean; text: string }) {
  return loading
    ? <div className="h-[220px] rounded-lg bg-muted animate-pulse" />
    : <div className="h-[160px] flex items-center justify-center text-sm text-muted-foreground text-center">{text}</div>;
}
