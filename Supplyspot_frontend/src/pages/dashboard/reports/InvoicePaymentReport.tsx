import React from 'react';
import { CalendarClock, CheckCircle2, Hourglass, Receipt } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, XAxis, YAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { ChartConfig, ChartContainer, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  C, EmptyState, KpiRow, KpiSpec, LinkText, OtherCurrency, ReportCard, ReportProps,
  formatAny, formatDate, formatDays, formatInr, formatInrCompact, formatPct, othersNote, plural, truncate,
} from './reportKit';

interface InvoiceRow {
  invoiceId: string; invoiceNumber: string; vendorId: string; vendorName: string; poId: string | null; poNumber: string | null;
  status: string; state: 'paid' | 'overdue' | 'pending'; currency: string; total: number; paid: number; outstanding: number;
  issueDate: string | null; dueDate: string | null; paidOn: string | null; daysOverdue: number; lateBy: number | null;
}
export interface InvoiceData {
  kpis: {
    totalInvoiced: { amount: number; count: number; others: OtherCurrency[] };
    paidOnTime: { pct: number | null; onTime: number; paid: number };
    avgPaymentDelay: { days: number | null; count: number };
    dso: { days: number | null; outstanding: number; periodDays: number };
  };
  statusOverTime: { month: string; label: string; paid: number; pending: number; overdue: number; count: number }[];
  byVendor: {
    vendorId: string; vendorName: string; invoices: number; invoiced: number; paid: number; outstanding: number; paidCount: number;
    onTimeCount: number; overdueCount: number; onTimePct: number | null; avgDaysToPay: number | null; otherCurrencyInvoices: number;
  }[];
  aging: { id: string; label: string; count: number; amount: number }[];
  largestUnpaid: InvoiceRow[];
  otherCurrencyUnpaid: InvoiceRow[];
}

const stackConfig = {
  paid: { label: 'Paid', color: C.green },
  pending: { label: 'Pending', color: C.amber },
  overdue: { label: 'Overdue', color: C.red },
} satisfies ChartConfig;
const vendorConfig = { onTimePct: { label: 'Paid on time', color: C.green } } satisfies ChartConfig;
const AGING_COLORS: Record<string, string> = { current: C.amber, '0_30': '#fca5a5', '31_60': C.red, '60_plus': '#b91c1c' };
const agingConfig = { amount: { label: 'Outstanding', color: C.red } } satisfies ChartConfig;

// Positive = paid after the due date; negative = early.
const formatDelay = (d: number | null) => (d === null ? '–' : d === 0 ? 'On due date' : d > 0 ? `${formatDays(d)} late` : `${formatDays(-d)} early`);

export function InvoicePaymentReport({ data, previous, previousLabel, loading, go }: ReportProps<InvoiceData>) {
  const k = data?.kpis;
  const p = previous?.kpis;
  const kpis: KpiSpec[] = [
    {
      id: 'invoiced', label: 'Total invoiced', icon: Receipt, tone: 'blue',
      value: k ? formatInr(k.totalInvoiced.amount) : '–',
      sub: k ? `${plural(k.totalInvoiced.count, 'invoice')} issued (drafts excluded)` : null,
      note: k ? othersNote(k.totalInvoiced.others) : null,
      current: k?.totalInvoiced.amount, previous: p?.totalInvoiced.amount, previousText: p ? formatInr(p.totalInvoiced.amount) : undefined, better: 'down',
      onClick: () => go({ section: 'invoices' }),
    },
    {
      id: 'ontime', label: 'Paid on time', icon: CheckCircle2, tone: 'green',
      value: k ? formatPct(k.paidOnTime.pct) : '–',
      sub: k ? `${k.paidOnTime.onTime} of ${plural(k.paidOnTime.paid, 'paid invoice')} by due date` : null,
      current: k?.paidOnTime.pct, previous: p?.paidOnTime.pct, previousText: p ? formatPct(p.paidOnTime.pct) : undefined, better: 'up',
      onClick: () => go({ section: 'invoices', status: 'paid' }),
    },
    {
      id: 'delay', label: 'Avg payment delay', icon: Hourglass, tone: 'amber',
      value: k ? formatDelay(k.avgPaymentDelay.days) : '–',
      sub: k ? `Final payment vs due date · ${plural(k.avgPaymentDelay.count, 'invoice')}` : null,
      current: k?.avgPaymentDelay.days, previous: p?.avgPaymentDelay.days, previousText: p ? formatDelay(p.avgPaymentDelay.days) : undefined, better: 'down',
    },
    {
      id: 'dso', label: 'Days outstanding (DSO)', icon: CalendarClock, tone: 'red',
      value: k ? formatDays(k.dso.days) : '–',
      sub: k ? `${formatInr(k.dso.outstanding)} unpaid ÷ invoiced × ${k.dso.periodDays} days` : null,
      current: k?.dso.days, previous: p?.dso.days, previousText: p ? formatDays(p.dso.days) : undefined, better: 'down',
      onClick: () => go({ section: 'invoices', status: 'open' }),
    },
  ];

  return (
    <div className="space-y-4">
      <KpiRow kpis={kpis} loading={loading} hasData={!!data} previousLabel={previous ? previousLabel : null} />
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <StatusOverTime className="xl:col-span-3" data={data} loading={loading} />
        <Aging className="xl:col-span-2" data={data} loading={loading} go={go} />
      </div>
      <VendorOnTime data={data} loading={loading} go={go} />
      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
        <LargestUnpaid data={data} loading={loading} go={go} />
        <VendorTrends data={data} loading={loading} go={go} />
      </div>
    </div>
  );
}

function StatusOverTime({ data, loading, className }: { data: InvoiceData | null; loading: boolean; className?: string }) {
  const rows = data?.statusOverTime || [];
  const any = rows.some(r => r.count > 0);
  return (
    <ReportCard className={className} title="Payment status over time" description="INR invoices by issue month: paid so far, still pending, and overdue.">
      {!any ? <EmptyState loading={loading} text="No invoices issued in this period." /> : (
        <ChartContainer config={stackConfig} className="aspect-auto h-[260px] w-full">
          <BarChart data={rows} margin={{ left: 8, right: 8, top: 8, bottom: 4 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v: string) => v.slice(0, 3)} />
            <YAxis tickFormatter={formatInrCompact} tickLine={false} axisLine={false} width={70} />
            <ChartTooltip cursor={{ fillOpacity: 0.4 }} content={<ChartTooltipContent formatter={(value, name) => (
              <div className="flex w-full justify-between gap-4">
                <span className="text-muted-foreground">{stackConfig[name as keyof typeof stackConfig]?.label}</span>
                <span className="font-mono tabular-nums text-foreground">{formatInr(Number(value))}</span>
              </div>
            )} />} />
            <Legend content={<ChartLegendContent />} />
            <Bar dataKey="paid" stackId="s" fill="var(--color-paid)" maxBarSize={40} />
            <Bar dataKey="pending" stackId="s" fill="var(--color-pending)" maxBarSize={40} />
            <Bar dataKey="overdue" stackId="s" fill="var(--color-overdue)" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ChartContainer>
      )}
    </ReportCard>
  );
}

function Aging({ data, loading, className, go }: { data: InvoiceData | null; loading: boolean; className?: string; go: (p: Record<string, string>) => void }) {
  const rows = data?.aging || [];
  const count = rows.reduce((a, r) => a + r.count, 0);
  return (
    <ReportCard className={className} title="Invoice aging" description={`Unpaid INR amounts by days past due, as of today.`}>
      {!count ? <EmptyState loading={loading} text="Nothing unpaid for invoices issued in this period." /> : (
        <ChartContainer config={agingConfig} className="aspect-auto h-[240px] w-full">
          <BarChart data={rows} margin={{ left: 0, right: 8, top: 20, bottom: 4 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v: string) => v.replace(' overdue', '')} interval={0} fontSize={11} />
            <YAxis tickFormatter={formatInrCompact} tickLine={false} axisLine={false} width={64} />
            <ChartTooltip cursor={{ fillOpacity: 0.4 }} content={<ChartTooltipContent hideLabel formatter={(value, _n, item) => (
              <div className="w-full space-y-0.5">
                <p className="font-medium text-foreground">{item.payload.label}</p>
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">{plural(item.payload.count, 'invoice')}</span><span className="font-mono tabular-nums">{formatInr(Number(value))}</span></div>
              </div>
            )} />} />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={48} className="cursor-pointer"
              onClick={(e: any) => go({ section: 'invoices', status: e?.id === 'current' ? 'open' : 'overdue' })}>
              {rows.map(r => <Cell key={r.id} fill={AGING_COLORS[r.id] || C.red} />)}
              <LabelList dataKey="count" position="top" className="fill-muted-foreground text-[11px]" formatter={(v: number) => (v ? plural(v, 'inv') : '')} />
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </ReportCard>
  );
}

function VendorOnTime({ data, loading, go }: { data: InvoiceData | null; loading: boolean; go: (p: Record<string, string>) => void }) {
  const rows = (data?.byVendor || []).filter(v => v.onTimePct !== null).slice(0, 12);
  return (
    <ReportCard title="Payment performance by vendor" description="Share of each vendor's paid invoices settled by the due date. Click a bar to see the vendor's invoices.">
      {!rows.length ? <EmptyState loading={loading} text="No invoices have been paid in full for this period yet." height={140} /> : (
        <ChartContainer config={vendorConfig} className="aspect-auto w-full" style={{ height: Math.max(260, rows.length * 32 + 30) }}>
          <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 40, top: 4, bottom: 4 }}>
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="vendorName" width={180} tickLine={false} axisLine={false} tickFormatter={(v: string) => truncate(v, 26)} />
            <ChartTooltip cursor={{ fillOpacity: 0.4 }} content={<ChartTooltipContent hideLabel formatter={(value, _n, item) => (
              <div className="w-full space-y-0.5">
                <p className="font-medium text-foreground">{item.payload.vendorName}</p>
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">{item.payload.onTimeCount} of {item.payload.paidCount} on time</span><span className="tabular-nums">{value}%</span></div>
                {item.payload.avgDaysToPay !== null && <div className="flex justify-between gap-4"><span className="text-muted-foreground">Avg days to pay</span><span className="tabular-nums">{item.payload.avgDaysToPay}</span></div>}
              </div>
            )} />} />
            <Bar dataKey="onTimePct" radius={[0, 4, 4, 0]} maxBarSize={20} className="cursor-pointer" onClick={(e: any) => e?.vendorId && go({ section: 'invoices', vendor: e.vendorId })}>
              {rows.map(r => <Cell key={r.vendorId} fill={(r.onTimePct || 0) >= 90 ? C.green : (r.onTimePct || 0) >= 70 ? C.amber : C.red} />)}
              <LabelList dataKey="onTimePct" position="right" formatter={(v: number) => `${v}%`} className="fill-muted-foreground text-[11px]" />
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </ReportCard>
  );
}

function LargestUnpaid({ data, loading, go }: { data: InvoiceData | null; loading: boolean; go: (p: Record<string, string>) => void }) {
  const rows = data?.largestUnpaid || [];
  const other = data?.otherCurrencyUnpaid || [];
  return (
    <ReportCard title="Largest unpaid invoices" description="Top 10 INR invoices with money still owed." bodyClassName="px-0 pb-2">
      {!rows.length ? <div className="px-6"><EmptyState loading={loading} text="Every invoice in this period is paid." height={140} /></div> : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Invoice</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="text-right pr-6">Outstanding</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(i => (
                <TableRow key={i.invoiceId} className="cursor-pointer" onClick={() => go({ section: 'invoices', invoice: i.invoiceId })}>
                  <TableCell className="pl-6 font-medium whitespace-nowrap">
                    {i.invoiceNumber}
                    {i.poNumber && i.poId && <span className="block text-[11px] font-normal"><LinkText className="text-muted-foreground" onClick={() => go({ section: 'purchase-orders', po: i.poId! })}>{i.poNumber}</LinkText></span>}
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate"><LinkText onClick={() => go({ section: 'vendors', vendor: i.vendorId })}>{i.vendorName}</LinkText></TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(i.dueDate)}
                    {i.state === 'overdue' && <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 border-red-200">{i.daysOverdue}d late</Badge>}
                  </TableCell>
                  <TableCell className="text-right pr-6 tabular-nums whitespace-nowrap">
                    {formatInr(i.outstanding)}
                    {i.paid > 0 && <span className="block text-[11px] text-muted-foreground">of {formatInr(i.total)}</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {other.length > 0 && (
            <p className="px-6 pt-2 text-xs text-muted-foreground">
              Also unpaid in other currencies: {other.map(o => `${o.invoiceNumber} (${formatAny(o.outstanding, o.currency)})`).join(', ')}.
            </p>
          )}
        </div>
      )}
    </ReportCard>
  );
}

function VendorTrends({ data, loading, go }: { data: InvoiceData | null; loading: boolean; go: (p: Record<string, string>) => void }) {
  const rows = data?.byVendor || [];
  return (
    <ReportCard title="Payment trends by vendor" description="INR invoiced, paid and still owed per vendor." bodyClassName="px-0 pb-2">
      {!rows.length ? <div className="px-6"><EmptyState loading={loading} text="No invoices issued in this period." height={140} /></div> : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Vendor</TableHead>
                <TableHead className="text-right">Invoiced</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="text-right">On time</TableHead>
                <TableHead className="text-right pr-6">Avg days to pay</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(v => (
                <TableRow key={v.vendorId} className="cursor-pointer" onClick={() => go({ section: 'invoices', vendor: v.vendorId })}>
                  <TableCell className="pl-6 font-medium max-w-[200px]">
                    <span className="block truncate">{v.vendorName}</span>
                    <span className="block text-[11px] text-muted-foreground font-normal">
                      {plural(v.invoices, 'invoice')}{v.overdueCount ? ` · ${v.overdueCount} overdue` : ''}{v.otherCurrencyInvoices ? ` · ${v.otherCurrencyInvoices} not in INR` : ''}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums whitespace-nowrap">{v.invoiced || !v.otherCurrencyInvoices ? formatInr(v.invoiced) : <span className="text-muted-foreground">Not in INR</span>}</TableCell>
                  <TableCell className="text-right tabular-nums whitespace-nowrap text-emerald-700">{formatInr(v.paid)}</TableCell>
                  <TableCell className={`text-right tabular-nums whitespace-nowrap ${v.overdueCount ? 'text-red-600' : ''}`}>{formatInr(v.outstanding)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatPct(v.onTimePct)}</TableCell>
                  <TableCell className="text-right pr-6 tabular-nums">{v.avgDaysToPay ?? '–'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </ReportCard>
  );
}
