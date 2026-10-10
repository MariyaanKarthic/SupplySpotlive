import React from 'react';
import { AlertTriangle, Clock, Truck } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, XAxis, YAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { ChartConfig, ChartContainer, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  C, EmptyState, KpiRow, KpiSpec, LinkText, PieLegend, ReportCard, ReportProps, formatDate, formatDays, formatPct, plural, truncate,
} from './reportKit';

type Outcome = 'on_time' | 'late' | 'open';
interface ShipmentRow {
  id: string; shipmentNumber: string; poId: string; poNumber: string | null; vendorId: string; vendorName: string; status: string;
  expected: string | null; arrived: string | null; stillOpen: boolean; outcome: Outcome; delayDays: number; hasException: boolean;
  reason: { id: string; label: string; text: string | null } | null;
}
export interface DeliveryData {
  kpis: {
    onTimeRate: { pct: number | null; onTime: number; late: number; due: number };
    avgDelay: { days: number | null; count: number; stillOpen: number };
    exceptionRate: { pct: number | null; count: number; total: number };
  };
  trend: { month: string; label: string; onTime: number; late: number; open: number; rate: number | null }[];
  delayReasons: { id: string; name: string; count: number }[];
  byVendor: { vendorId: string; vendorName: string; onTime: number; late: number; open: number; total: number; rate: number | null }[];
  shipments: ShipmentRow[];
}

const trendConfig = {
  onTime: { label: 'On time', color: C.green },
  late: { label: 'Late', color: C.red },
  open: { label: 'Not due / in transit', color: C.slate },
} satisfies ChartConfig;
const REASON_COLORS: Record<string, string> = {
  transit: C.amber, documents: C.violet, weather: C.cyan, vendor: '#f97316', other: C.blue, unrecorded: C.slate,
};
const OUTCOME_BADGE: Record<Outcome, { label: string; className: string }> = {
  on_time: { label: 'On time', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  late: { label: 'Late', className: 'bg-red-50 text-red-700 border-red-200' },
  open: { label: 'In progress', className: 'bg-slate-50 text-slate-600 border-slate-200' },
};

export function DeliveryReport({ data, previous, previousLabel, loading, go }: ReportProps<DeliveryData>) {
  const k = data?.kpis;
  const p = previous?.kpis;
  const kpis: KpiSpec[] = [
    {
      id: 'ontime', label: 'On-time rate', icon: Truck, tone: 'green',
      value: k ? formatPct(k.onTimeRate.pct) : '–',
      sub: k ? `${k.onTimeRate.onTime} of ${plural(k.onTimeRate.due, 'shipment')} due` : 'Shipments due in the period',
      current: k?.onTimeRate.pct, previous: p?.onTimeRate.pct, previousText: p ? formatPct(p.onTimeRate.pct) : undefined, better: 'up',
      onClick: () => go({ section: 'shipments' }),
    },
    {
      id: 'delay', label: 'Average delay', icon: Clock, tone: 'amber',
      value: k ? formatDays(k.avgDelay.days) : '–',
      sub: k ? `${plural(k.avgDelay.count, 'late shipment')}${k.avgDelay.stillOpen ? ` · ${k.avgDelay.stillOpen} still open` : ''}` : null,
      current: k?.avgDelay.days, previous: p?.avgDelay.days, previousText: p ? formatDays(p.avgDelay.days) : undefined, better: 'down',
      onClick: () => go({ section: 'shipments', status: 'delayed' }),
    },
    {
      id: 'exceptions', label: 'Exception rate', icon: AlertTriangle, tone: 'red',
      value: k ? formatPct(k.exceptionRate.pct) : '–',
      sub: k ? `${k.exceptionRate.count} of ${plural(k.exceptionRate.total, 'shipment')} reported an exception` : null,
      current: k?.exceptionRate.pct, previous: p?.exceptionRate.pct, previousText: p ? formatPct(p.exceptionRate.pct) : undefined, better: 'down',
    },
  ];

  return (
    <div className="space-y-4">
      <KpiRow kpis={kpis} loading={loading} hasData={!!data} previousLabel={previous ? previousLabel : null} />
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <Trend className="xl:col-span-3" data={data} loading={loading} />
        <Reasons className="xl:col-span-2" data={data} loading={loading} />
      </div>
      <ByVendor data={data} loading={loading} go={go} />
      <Shipments data={data} loading={loading} go={go} />
    </div>
  );
}

function Trend({ data, loading, className }: { data: DeliveryData | null; loading: boolean; className?: string }) {
  const rows = data?.trend || [];
  const any = rows.some(r => r.onTime + r.late + r.open > 0);
  return (
    <ReportCard className={className} title="On time vs late" description="Shipments by the month they were expected.">
      {!any ? <EmptyState loading={loading} text="No shipments expected in this period." /> : (
        <ChartContainer config={trendConfig} className="aspect-auto h-[260px] w-full">
          <LineChart data={rows} margin={{ left: 0, right: 16, top: 8, bottom: 4 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v: string) => v.slice(0, 3)} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={30} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend content={<ChartLegendContent />} />
            <Line type="linear" dataKey="onTime" stroke="var(--color-onTime)" strokeWidth={2.5} dot={{ r: 3 }} />
            <Line type="linear" dataKey="late" stroke="var(--color-late)" strokeWidth={2.5} dot={{ r: 3 }} />
            <Line type="linear" dataKey="open" stroke="var(--color-open)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
          </LineChart>
        </ChartContainer>
      )}
    </ReportCard>
  );
}

function Reasons({ data, loading, className }: { data: DeliveryData | null; loading: boolean; className?: string }) {
  const rows = (data?.delayReasons || []).map(r => ({ ...r, key: r.id, value: r.count, color: REASON_COLORS[r.id] || C.blue }));
  const config = Object.fromEntries(rows.map(r => [r.key, { label: r.name, color: r.color }])) satisfies ChartConfig;
  return (
    <ReportCard className={className} title="Delay reasons" description="Late shipments, grouped by the exception the carrier or supplier reported.">
      {!rows.length ? <EmptyState loading={loading} text="No late shipments in this period." /> : (
        <div className="flex flex-col sm:flex-row xl:flex-col 2xl:flex-row items-center gap-3">
          <ChartContainer config={config} className="aspect-square h-[256px] w-full max-w-[300px]">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel />} />
              <Pie data={rows} dataKey="value" nameKey="key" innerRadius={48} outerRadius={82} paddingAngle={rows.length > 1 ? 2 : 0} stroke="var(--background)" strokeWidth={2}>
                {rows.map(r => <Cell key={r.key} fill={r.color} />)}
              </Pie>
            </PieChart>
          </ChartContainer>
          <PieLegend rows={rows.map(r => ({ key: r.key, name: r.name, value: r.count, color: r.color }))} />
        </div>
      )}
    </ReportCard>
  );
}

const vendorConfig = { onTime: { label: 'On time', color: C.green }, late: { label: 'Late', color: C.red }, open: { label: 'Not due yet', color: C.slate } } satisfies ChartConfig;

function ByVendor({ data, loading, go }: { data: DeliveryData | null; loading: boolean; go: (p: Record<string, string>) => void }) {
  const rows = (data?.byVendor || []).slice(0, 12);
  return (
    <ReportCard title="Performance by vendor" description="Shipments per vendor by result. Click a bar to see that vendor's shipments.">
      {!rows.length ? <EmptyState loading={loading} text="No shipments expected in this period." /> : (
        <ChartContainer config={vendorConfig} className="aspect-auto w-full" style={{ height: Math.max(260, rows.length * 34 + 60) }}>
          <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} domain={[0, 'dataMax']} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="vendorName" width={180} tickLine={false} axisLine={false} tickFormatter={(v: string) => truncate(v, 26)} />
            <ChartTooltip cursor={{ fillOpacity: 0.4 }} content={<ChartTooltipContent labelFormatter={(_l, items) => {
              const row = items?.[0]?.payload;
              return row ? `${row.vendorName}${row.rate !== null ? ` · ${row.rate}% on time` : ''}` : '';
            }} />} />
            <Legend content={<ChartLegendContent />} />
            {(['onTime', 'late', 'open'] as const).map((key, i, all) => (
              <Bar key={key} dataKey={key} stackId="a" fill={`var(--color-${key})`} maxBarSize={22} radius={i === all.length - 1 ? [0, 4, 4, 0] : 0}
                className="cursor-pointer" onClick={(e: any) => e?.vendorId && go({ section: 'shipments', vendor: e.vendorId })} />
            ))}
          </BarChart>
        </ChartContainer>
      )}
    </ReportCard>
  );
}

function Shipments({ data, loading, go }: { data: DeliveryData | null; loading: boolean; go: (p: Record<string, string>) => void }) {
  const rows = (data?.shipments || []).slice(0, 25);
  const total = data?.shipments.length || 0;
  return (
    <ReportCard title="Recent shipments" description={`Latest ${Math.min(25, total)} of ${plural(total, 'shipment')} by expected date. The export has them all.`} bodyClassName="px-0 pb-2">
      {!rows.length ? <div className="px-6"><EmptyState loading={loading} text="No shipments expected in this period." /></div> : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Shipment</TableHead>
                <TableHead>PO</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead>Actual</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6">Delay reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(s => {
                const badge = OUTCOME_BADGE[s.outcome];
                return (
                  <TableRow key={s.id} className="cursor-pointer" onClick={() => go({ section: 'shipments', shipment: s.id })}>
                    <TableCell className="pl-6 font-medium whitespace-nowrap">{s.shipmentNumber}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {s.poNumber ? <LinkText onClick={() => go({ section: 'purchase-orders', po: s.poId })}>{s.poNumber}</LinkText> : '–'}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate">
                      <LinkText onClick={() => go({ section: 'vendors', vendor: s.vendorId })}>{s.vendorName}</LinkText>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(s.expected)}</TableCell>
                    <TableCell className="whitespace-nowrap">{s.arrived ? formatDate(s.arrived) : <span className="text-muted-foreground">Not arrived</span>}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="outline" className={badge.className}>
                        {s.outcome === 'late' ? `Late ${s.delayDays}d${s.stillOpen ? ', open' : ''}` : badge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-6 max-w-[260px]">
                      {s.reason ? (
                        <span className="block truncate" title={s.reason.text || s.reason.label}>
                          <span className="font-medium">{s.reason.label}</span>
                          {s.reason.text && <span className="text-muted-foreground"> · {s.reason.text}</span>}
                        </span>
                      ) : <span className="text-muted-foreground">–</span>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </ReportCard>
  );
}
