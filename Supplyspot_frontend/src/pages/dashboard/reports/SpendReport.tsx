import React, { useState } from 'react';
import { Award, IndianRupee, PieChart as PieIcon, ShoppingCart } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  C, EmptyState, KpiRow, KpiSpec, LinkText, OtherCurrency, PieLegend, ReportCard, ReportProps, SERIES,
  formatAny, formatInr, formatInrCompact, formatPct, othersNote, plural, titleCase, truncate,
} from './reportKit';

export interface SpendData {
  kpis: {
    totalSpend: { amount: number; count: number; others: OtherCurrency[] };
    avgOrderValue: { amount: number; count: number };
    largestOrder: { amount: number; poId: string; poNumber: string; vendorId: string; vendorName: string } | null;
    supplierConcentration: { pct: number | null; amount: number; vendors: string[]; vendorCount: number };
  };
  byMonth: { month: string; label: string; amount: number; count: number }[];
  byCategory: { name: string; amount: number; count: number }[];
  byVendor: { vendorId: string; vendorName: string; category: string; amount: number; poCount: number }[];
  byPaymentTerms: { name: string; amount: number; count: number }[];
  byCurrency: { name: string; amount: number; count: number }[];
  topVendors: { vendorId: string; vendorName: string; category: string; totalPoValue: number; poCount: number; invoiceCount: number; avgPoSize: number; sharePct: number | null }[];
}

const monthConfig = { amount: { label: 'Spend', color: C.blue } } satisfies ChartConfig;
const barConfig = { amount: { label: 'Spend', color: C.blue } } satisfies ChartConfig;

export function SpendReport({ data, previous, previousLabel, loading, go }: ReportProps<SpendData>) {
  const k = data?.kpis;
  const p = previous?.kpis;
  const kpis: KpiSpec[] = [
    {
      id: 'total', label: 'Total spend', icon: IndianRupee, tone: 'blue',
      value: k ? formatInr(k.totalSpend.amount) : '–',
      sub: k ? `${plural(k.totalSpend.count, 'committed PO')}` : 'Approved POs onwards',
      note: k ? othersNote(k.totalSpend.others) : null,
      current: k?.totalSpend.amount, previous: p?.totalSpend.amount, previousText: p ? formatInr(p.totalSpend.amount) : undefined, better: 'down',
      onClick: () => go({ section: 'purchase-orders' }),
    },
    {
      id: 'avg', label: 'Average order value', icon: ShoppingCart, tone: 'violet',
      value: k ? formatInr(k.avgOrderValue.amount) : '–',
      sub: k ? `Across ${plural(k.avgOrderValue.count, 'INR order')}` : null,
      current: k?.avgOrderValue.amount, previous: p?.avgOrderValue.amount, previousText: p ? formatInr(p.avgOrderValue.amount) : undefined, better: 'down',
    },
    {
      id: 'largest', label: 'Largest order', icon: Award, tone: 'amber',
      value: k?.largestOrder ? formatInr(k.largestOrder.amount) : '–',
      sub: k?.largestOrder ? `${k.largestOrder.poNumber} · ${k.largestOrder.vendorName}` : 'No orders',
      current: k?.largestOrder?.amount ?? null, previous: p ? (p.largestOrder?.amount ?? 0) : null, previousText: p?.largestOrder ? formatInr(p.largestOrder.amount) : (p ? '–' : undefined), better: 'down',
      onClick: k?.largestOrder ? () => go({ section: 'purchase-orders', po: k.largestOrder!.poId }) : undefined,
    },
    {
      id: 'concentration', label: 'Supplier concentration (top 3)', icon: PieIcon, tone: 'slate',
      value: k ? formatPct(k.supplierConcentration.pct) : '–',
      sub: k ? (k.supplierConcentration.vendors.join(', ') || 'No vendors') : null,
      current: k?.supplierConcentration.pct, previous: p?.supplierConcentration.pct, previousText: p ? formatPct(p.supplierConcentration.pct) : undefined, better: 'down',
    },
  ];

  return (
    <div className="space-y-4">
      <KpiRow kpis={kpis} loading={loading} hasData={!!data} previousLabel={previous ? previousLabel : null} />
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <SpendByMonth className="xl:col-span-3" data={data} loading={loading} />
        <SpendSplitPie className="xl:col-span-2" data={data} loading={loading} />
      </div>
      <SpendBreakdown data={data} loading={loading} go={go} />
      <TopVendors data={data} loading={loading} go={go} />
    </div>
  );
}

function SpendByMonth({ data, loading, className }: { data: SpendData | null; loading: boolean; className?: string }) {
  const rows = data?.byMonth || [];
  const any = rows.some(r => r.amount > 0);
  return (
    <ReportCard className={className} title="Spend by month" description="Committed purchase orders by issue month (INR).">
      {!any ? <EmptyState loading={loading} text="No committed purchase orders in this period." /> : (
        <ChartContainer config={monthConfig} className="aspect-auto h-[260px] w-full">
          <LineChart data={rows} margin={{ left: 8, right: 16, top: 8, bottom: 4 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v: string) => v.slice(0, 3)} />
            <YAxis tickFormatter={formatInrCompact} tickLine={false} axisLine={false} width={70} />
            <ChartTooltip content={(
              <ChartTooltipContent
                formatter={(value, _n, item) => (
                  <div className="flex w-full justify-between gap-4">
                    <span className="text-muted-foreground">{plural(item.payload.count, 'PO')}</span>
                    <span className="font-mono font-medium tabular-nums text-foreground">{formatInr(Number(value))}</span>
                  </div>
                )}
              />
            )} />
            <Line type="monotone" dataKey="amount" stroke="var(--color-amount)" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ChartContainer>
      )}
    </ReportCard>
  );
}

function SpendSplitPie({ data, loading, className }: { data: SpendData | null; loading: boolean; className?: string }) {
  const [by, setBy] = useState<'terms' | 'currency'>('terms');
  const source = by === 'terms' ? data?.byPaymentTerms || [] : data?.byCurrency || [];
  const rows = source.map((r, i) => ({ ...r, key: r.name, color: SERIES[i % SERIES.length], value: by === 'terms' ? r.amount : r.count }));
  const config = Object.fromEntries(rows.map(r => [r.key, { label: r.name, color: r.color }])) satisfies ChartConfig;
  return (
    <ReportCard
      className={className}
      title={by === 'terms' ? 'Spend by payment terms' : 'Orders by currency'}
      description={by === 'terms' ? 'INR spend split by PO payment terms.' : 'Committed POs per currency (amounts shown in their own currency).'}
      action={(
        <div className="flex rounded-md border p-0.5 shrink-0">
          {(['terms', 'currency'] as const).map(id => (
            <Button key={id} size="sm" variant={by === id ? 'secondary' : 'ghost'} className="h-7 px-2 text-xs" onClick={() => setBy(id)}>
              {id === 'terms' ? 'Terms' : 'Currency'}
            </Button>
          ))}
        </div>
      )}
    >
      {!rows.length ? <EmptyState loading={loading} text="No committed purchase orders in this period." /> : (
        <div className="flex flex-col sm:flex-row xl:flex-col 2xl:flex-row items-center gap-3">
          <ChartContainer config={config} className="aspect-square h-[256px] w-full max-w-[300px]">
            <PieChart>
              <ChartTooltip content={(
                <ChartTooltipContent nameKey="key" hideLabel formatter={(_v, _n, item) => (
                  <div className="flex w-full items-center justify-between gap-4">
                    <span>{item.payload.name}</span>
                    <span className="font-mono font-medium tabular-nums text-foreground">
                      {by === 'terms' ? formatInr(item.payload.amount) : `${plural(item.payload.count, 'PO')} · ${formatAny(item.payload.amount, item.payload.name)}`}
                    </span>
                  </div>
                )} />
              )} />
              <Pie data={rows} dataKey="value" nameKey="key" innerRadius={50} outerRadius={85} paddingAngle={rows.length > 1 ? 2 : 0} stroke="var(--background)" strokeWidth={2}>
                {rows.map(r => <Cell key={r.key} fill={r.color} />)}
              </Pie>
            </PieChart>
          </ChartContainer>
          <PieLegend
            rows={rows.map(r => ({ key: r.key, name: r.name, value: r.value, color: r.color, extra: by === 'terms' ? plural(r.count, 'PO') : formatAny(r.amount, r.name) }))}
            format={by === 'terms' ? formatInrCompact : (v) => plural(v, 'PO')}
          />
        </div>
      )}
    </ReportCard>
  );
}

function SpendBreakdown({ data, loading, go }: { data: SpendData | null; loading: boolean; go: (p: Record<string, string>) => void }) {
  const [by, setBy] = useState<'vendor' | 'category'>('vendor');
  const rows = by === 'vendor'
    ? (data?.byVendor || []).map(v => ({ key: v.vendorId, name: v.vendorName, amount: v.amount, count: v.poCount }))
    : (data?.byCategory || []).map(c => ({ key: c.name, name: titleCase(c.name), amount: c.amount, count: c.count }));
  return (
    <ReportCard
      title={by === 'vendor' ? 'Spend by vendor' : 'Spend by category'}
      description={by === 'vendor' ? 'Top 10 vendors by committed INR spend. Click a bar to open the vendor.' : 'Committed INR spend by vendor category.'}
      action={(
        <div className="flex rounded-md border p-0.5 shrink-0">
          {(['vendor', 'category'] as const).map(id => (
            <Button key={id} size="sm" variant={by === id ? 'secondary' : 'ghost'} className="h-7 px-2 text-xs" onClick={() => setBy(id)}>
              {id === 'vendor' ? 'Vendor' : 'Category'}
            </Button>
          ))}
        </div>
      )}
    >
      {!rows.length ? <EmptyState loading={loading} text="No committed purchase orders in this period." /> : (
        <ChartContainer config={barConfig} className="aspect-auto w-full" style={{ height: Math.max(260, rows.length * 34 + 30) }}>
          <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }} barCategoryGap={8}>
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={formatInrCompact} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="name" width={180} tickLine={false} axisLine={false} tickFormatter={(v: string) => truncate(v, 26)} />
            <ChartTooltip cursor={{ fillOpacity: 0.4 }} content={(
              <ChartTooltipContent hideLabel formatter={(value, _n, item) => (
                <div className="w-full space-y-0.5">
                  <p className="font-medium text-foreground">{item.payload.name}</p>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">{plural(item.payload.count, 'PO')}</span>
                    <span className="font-mono font-medium tabular-nums text-foreground">{formatInr(Number(value))}</span>
                  </div>
                </div>
              )} />
            )} />
            <Bar
              dataKey="amount" fill="var(--color-amount)" radius={[0, 4, 4, 0]} maxBarSize={24}
              className={by === 'vendor' ? 'cursor-pointer' : ''}
              onClick={(entry: any) => by === 'vendor' && entry?.key && go({ section: 'vendors', vendor: entry.key })}
            />
          </BarChart>
        </ChartContainer>
      )}
    </ReportCard>
  );
}

function TopVendors({ data, loading, go }: { data: SpendData | null; loading: boolean; go: (p: Record<string, string>) => void }) {
  const rows = data?.topVendors || [];
  return (
    <ReportCard title="Top vendors by spend" description="Committed INR purchase orders in this period, with invoices raised against them." bodyClassName="px-0 pb-2">
      {!rows.length ? <div className="px-6"><EmptyState loading={loading} text="No committed purchase orders in this period." /></div> : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Vendor</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Total PO value</TableHead>
                <TableHead className="text-right">POs</TableHead>
                <TableHead className="text-right">Invoices</TableHead>
                <TableHead className="text-right">Avg PO size</TableHead>
                <TableHead className="text-right pr-6">Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(v => (
                <TableRow key={v.vendorId} className="cursor-pointer" onClick={() => go({ section: 'vendors', vendor: v.vendorId })}>
                  <TableCell className="pl-6 font-medium max-w-[240px] truncate">{v.vendorName}</TableCell>
                  <TableCell className="text-muted-foreground">{titleCase(v.category || '')}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatInr(v.totalPoValue)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    <LinkText onClick={() => go({ section: 'purchase-orders', q: v.vendorName })}>{v.poCount}</LinkText>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {v.invoiceCount ? <LinkText onClick={() => go({ section: 'invoices', vendor: v.vendorId })}>{v.invoiceCount}</LinkText> : <span className="text-muted-foreground">0</span>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatInr(v.avgPoSize)}</TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden hidden sm:block">
                        <div className="h-full bg-blue-500" style={{ width: `${v.sharePct || 0}%` }} />
                      </div>
                      <span className="tabular-nums w-12 text-right">{formatPct(v.sharePct)}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </ReportCard>
  );
}
