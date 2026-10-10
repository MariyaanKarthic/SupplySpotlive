import React from 'react';
import { Repeat, Star, Timer, Truck } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Scatter, ScatterChart, XAxis, YAxis, ZAxis, LabelList } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  C, EmptyState, KpiRow, KpiSpec, ReportCard, ReportProps, formatDays, formatInr, formatInrCompact, formatPct, plural, ratingColor, truncate,
} from './reportKit';

interface ScoreRow {
  vendorId: string; vendorName: string; category: string; poCount: number; spend: number; nonInrPos: number; shipments: number; onTime: number; late: number;
  deliveryRate: number | null; avgLeadTimeDays: number | null; rating: number | null; qualityScore: number | null;
  priceScore: number | null; quotesCompared: number; communicationScore: number | null; overallScore: number | null;
}
export interface SupplierData {
  kpis: {
    onTimeRate: { pct: number | null; onTime: number; late: number };
    avgLeadTime: { days: number | null; count: number };
    qualityScore: { rating: number | null; vendorCount: number };
    repeatVendors: { pct: number | null; repeat: number; total: number };
  };
  onTimeByVendor: { vendorId: string; vendorName: string; rate: number; onTime: number; late: number }[];
  leadTimeHistogram: { label: string; count: number }[];
  bubbles: { vendorId: string; vendorName: string; spend: number; rating: number; poCount: number; deliveryRate: number | null }[];
  scorecard: ScoreRow[];
}

const onTimeConfig = { rate: { label: 'On time', color: C.green } } satisfies ChartConfig;
const leadConfig = { count: { label: 'Deliveries', color: C.violet } } satisfies ChartConfig;
const bubbleConfig = { rating: { label: 'Rating', color: C.blue } } satisfies ChartConfig;

function scoreClass(score: number | null) {
  if (score === null) return 'text-muted-foreground';
  if (score >= 85) return 'text-emerald-700 bg-emerald-50';
  if (score >= 70) return 'text-amber-700 bg-amber-50';
  return 'text-red-700 bg-red-50';
}
const Score = ({ value, suffix = '' }: { value: number | null; suffix?: string }) => (
  <span className={`inline-block min-w-[44px] text-center rounded px-1.5 py-0.5 text-xs font-medium tabular-nums ${scoreClass(value)}`}>
    {value === null ? '–' : `${value}${suffix}`}
  </span>
);

export function SupplierReport({ data, previous, previousLabel, loading, go }: ReportProps<SupplierData>) {
  const k = data?.kpis;
  const p = previous?.kpis;
  const kpis: KpiSpec[] = [
    {
      id: 'ontime', label: 'Avg on-time delivery', icon: Truck, tone: 'green',
      value: k ? formatPct(k.onTimeRate.pct) : '–',
      sub: k ? `${k.onTimeRate.onTime} on time · ${k.onTimeRate.late} late` : null,
      current: k?.onTimeRate.pct, previous: p?.onTimeRate.pct, previousText: p ? formatPct(p.onTimeRate.pct) : undefined, better: 'up',
      onClick: () => go({ section: 'shipments' }),
    },
    {
      id: 'lead', label: 'Avg lead time', icon: Timer, tone: 'violet',
      value: k ? formatDays(k.avgLeadTime.days) : '–',
      sub: k ? `PO issue to arrival · ${plural(k.avgLeadTime.count, 'delivery')}`.replace('deliverys', 'deliveries') : null,
      current: k?.avgLeadTime.days, previous: p?.avgLeadTime.days, previousText: p ? formatDays(p.avgLeadTime.days) : undefined, better: 'down',
    },
    {
      id: 'quality', label: 'Quality score', icon: Star, tone: 'amber',
      value: k?.qualityScore.rating ? `${k.qualityScore.rating} / 5` : '–',
      sub: k ? `Average rating of ${plural(k.qualityScore.vendorCount, 'vendor')} used` : null,
      current: k?.qualityScore.rating, previous: p?.qualityScore.rating, previousText: p?.qualityScore.rating ? `${p.qualityScore.rating} / 5` : (p ? '–' : undefined), better: 'up',
    },
    {
      id: 'repeat', label: 'Repeat vendors', icon: Repeat, tone: 'blue',
      value: k ? formatPct(k.repeatVendors.pct) : '–',
      sub: k ? `${k.repeatVendors.repeat} of ${plural(k.repeatVendors.total, 'vendor')} with 2+ POs` : null,
      current: k?.repeatVendors.pct, previous: p?.repeatVendors.pct, previousText: p ? formatPct(p.repeatVendors.pct) : undefined, better: 'up',
    },
  ];

  return (
    <div className="space-y-4">
      <KpiRow kpis={kpis} loading={loading} hasData={!!data} previousLabel={previous ? previousLabel : null} />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <OnTimeByVendor data={data} loading={loading} go={go} />
        <LeadTimeHistogram data={data} loading={loading} />
      </div>
      <VendorBubbles data={data} loading={loading} go={go} />
      <Scorecard data={data} loading={loading} go={go} />
    </div>
  );
}

function OnTimeByVendor({ data, loading, go }: { data: SupplierData | null; loading: boolean; go: (p: Record<string, string>) => void }) {
  const rows = data?.onTimeByVendor || [];
  return (
    <ReportCard title="On-time delivery by vendor" description="Top 10 vendors by shipments that were due. Click a bar to see the vendor's shipments.">
      {!rows.length ? <EmptyState loading={loading} text="No shipments were due for these orders yet." /> : (
        <ChartContainer config={onTimeConfig} className="aspect-auto w-full" style={{ height: Math.max(260, rows.length * 34 + 30) }}>
          <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 40, top: 4, bottom: 4 }}>
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="vendorName" width={170} tickLine={false} axisLine={false} tickFormatter={(v: string) => truncate(v, 24)} />
            <ChartTooltip cursor={{ fillOpacity: 0.4 }} content={(
              <ChartTooltipContent hideLabel formatter={(value, _n, item) => (
                <div className="w-full space-y-0.5">
                  <p className="font-medium text-foreground">{item.payload.vendorName}</p>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">{item.payload.onTime} on time · {item.payload.late} late</span>
                    <span className="font-mono font-medium tabular-nums text-foreground">{value}%</span>
                  </div>
                </div>
              )} />
            )} />
            <Bar dataKey="rate" radius={[0, 4, 4, 0]} maxBarSize={22} className="cursor-pointer" onClick={(e: any) => e?.vendorId && go({ section: 'shipments', vendor: e.vendorId })}>
              {rows.map(r => <Cell key={r.vendorId} fill={r.rate >= 90 ? C.green : r.rate >= 70 ? C.amber : C.red} />)}
              <LabelList dataKey="rate" position="right" formatter={(v: number) => `${v}%`} className="fill-muted-foreground text-[11px]" />
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </ReportCard>
  );
}

function LeadTimeHistogram({ data, loading }: { data: SupplierData | null; loading: boolean }) {
  const rows = data?.leadTimeHistogram || [];
  const total = rows.reduce((a, r) => a + r.count, 0);
  return (
    <ReportCard title="Lead time distribution" description="Days from PO issue to goods arriving, per delivered shipment.">
      {!total ? <EmptyState loading={loading} text="No deliveries have arrived for these orders yet." /> : (
        <ChartContainer config={leadConfig} className="aspect-auto h-[240px] w-full">
          <BarChart data={rows} margin={{ left: 0, right: 8, top: 16, bottom: 4 }} barCategoryGap={4}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={30} />
            <ChartTooltip cursor={{ fillOpacity: 0.4 }} content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]}>
              <LabelList dataKey="count" position="top" className="fill-muted-foreground text-[11px]" formatter={(v: number) => (v ? v : '')} />
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </ReportCard>
  );
}

function VendorBubbles({ data, loading, go }: { data: SupplierData | null; loading: boolean; go: (p: Record<string, string>) => void }) {
  const rows = data?.bubbles || [];
  const spends = rows.map(r => r.spend);
  // Spend spans several orders of magnitude, so the horizontal axis is logarithmic.
  const domain = rows.length ? [Math.pow(10, Math.floor(Math.log10(Math.min(...spends)))), Math.pow(10, Math.ceil(Math.log10(Math.max(...spends))))] : [1, 10];
  return (
    <ReportCard
      title="Vendor ratings"
      description="Each bubble is a vendor with INR orders in the period: across and size = spend, up and colour = rating. Click a bubble to open the vendor."
    >
      {!rows.length ? <EmptyState loading={loading} text="No rated vendors with orders in this period." /> : (
        <>
          <ChartContainer config={bubbleConfig} className="aspect-auto h-[300px] w-full">
            <ScatterChart margin={{ left: 0, right: 24, top: 16, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey="spend" name="Spend" scale="log" domain={domain} tickFormatter={formatInrCompact} tickLine={false} axisLine={false} label={{ value: 'Spend in period (log scale)', position: 'insideBottom', offset: -4, className: 'fill-muted-foreground text-[11px]' }} />
              <YAxis type="number" dataKey="rating" name="Rating" domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tickLine={false} axisLine={false} width={30} />
              <ZAxis type="number" dataKey="spend" range={[80, 1400]} name="Size" />
              <ChartTooltip cursor={{ strokeDasharray: '3 3' }} content={(
                <ChartTooltipContent hideLabel formatter={(_v, name, item) => (name === 'Spend' ? (
                  <div className="w-full space-y-0.5 min-w-[180px]">
                    <p className="font-medium text-foreground">{item.payload.vendorName}</p>
                    <div className="flex justify-between gap-4"><span className="text-muted-foreground">Rating</span><span className="tabular-nums">{item.payload.rating} / 5</span></div>
                    <div className="flex justify-between gap-4"><span className="text-muted-foreground">Spend</span><span className="tabular-nums">{formatInr(item.payload.spend)}</span></div>
                    <div className="flex justify-between gap-4"><span className="text-muted-foreground">POs</span><span className="tabular-nums">{item.payload.poCount}</span></div>
                    {item.payload.deliveryRate !== null && <div className="flex justify-between gap-4"><span className="text-muted-foreground">On time</span><span className="tabular-nums">{item.payload.deliveryRate}%</span></div>}
                  </div>
                ) : null)} />
              )} />
              <Scatter data={rows} className="cursor-pointer" onClick={(e: any) => e?.vendorId && go({ section: 'vendors', vendor: e.vendorId })}>
                {rows.map(r => <Cell key={r.vendorId} fill={ratingColor(r.rating)} fillOpacity={0.7} stroke={ratingColor(r.rating)} />)}
              </Scatter>
            </ScatterChart>
          </ChartContainer>
          <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground mt-2">
            {[['4.5+', 4.5], ['4–4.4', 4], ['3.5–3.9', 3.5], ['3–3.4', 3], ['Below 3', 2]].map(([label, r]) => (
              <span key={label as string} className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ background: ratingColor(r as number) }} />{label}</span>
            ))}
            <span className="ml-auto">Largest bubble: {formatInrCompact(Math.max(...rows.map(r => r.spend)))}</span>
          </div>
        </>
      )}
    </ReportCard>
  );
}

function Scorecard({ data, loading, go }: { data: SupplierData | null; loading: boolean; go: (p: Record<string, string>) => void }) {
  const rows = data?.scorecard || [];
  return (
    <ReportCard
      title="Vendor scorecard"
      description="Vendors with committed POs in this period. Scores are out of 100: quality = rating × 20, price = lowest quote ÷ this vendor's quote on shared RFQs, communication = sent POs acknowledged."
      bodyClassName="px-0 pb-2"
    >
      {!rows.length ? <div className="px-6"><EmptyState loading={loading} text="No committed purchase orders in this period." /></div> : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Vendor</TableHead>
                <TableHead className="text-right">POs</TableHead>
                <TableHead className="text-right">Spend</TableHead>
                <TableHead className="text-center">Delivery</TableHead>
                <TableHead className="text-right">Lead time</TableHead>
                <TableHead className="text-center">Quality</TableHead>
                <TableHead className="text-center">Price</TableHead>
                <TableHead className="text-center">Communication</TableHead>
                <TableHead className="text-center pr-6">Overall</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(v => (
                <TableRow key={v.vendorId} className="cursor-pointer" onClick={() => go({ section: 'vendors', vendor: v.vendorId })}>
                  <TableCell className="pl-6 font-medium max-w-[220px]">
                    <span className="block truncate">{v.vendorName}</span>
                    <span className="block text-[11px] text-muted-foreground font-normal">
                      {!v.shipments ? 'No shipments yet' : v.onTime + v.late ? `${v.onTime} on time · ${v.late} late` : 'Shipments not due yet'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{v.poCount}</TableCell>
                  <TableCell className="text-right tabular-nums whitespace-nowrap">
                    {v.spend || !v.nonInrPos ? formatInr(v.spend) : <span className="text-muted-foreground">Not in INR</span>}
                  </TableCell>
                  <TableCell className="text-center"><Score value={v.deliveryRate} suffix="%" /></TableCell>
                  <TableCell className="text-right tabular-nums whitespace-nowrap">{formatDays(v.avgLeadTimeDays)}</TableCell>
                  <TableCell className="text-center" title={v.rating ? `Rating ${v.rating}/5` : 'Not rated'}><Score value={v.qualityScore} /></TableCell>
                  <TableCell className="text-center" title={v.quotesCompared ? `${plural(v.quotesCompared, 'quote')} compared` : 'No competing quotes'}><Score value={v.priceScore} /></TableCell>
                  <TableCell className="text-center"><Score value={v.communicationScore} /></TableCell>
                  <TableCell className="text-center pr-6"><Score value={v.overallScore} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </ReportCard>
  );
}
