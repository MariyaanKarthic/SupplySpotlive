import React from 'react';
import { ClipboardList, Hourglass, ThumbsDown, UserCog } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, XAxis, YAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  C, EmptyState, KpiRow, KpiSpec, PieLegend, ReportCard, ReportProps, formatAny, formatDate, formatDays, formatInr, formatPct, plural,
} from './reportKit';

type PrStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
export interface PrData {
  kpis: {
    totalPrs: { count: number; budget: number };
    avgApprovalTime: { days: number | null; hours: number | null; count: number };
    rejectionRate: { pct: number | null; rejected: number; decided: number };
    bottleneck: { approverId: string; name: string; decisions: number; avgDays: number; avgHours: number } | null;
    pendingCount: number;
  };
  statusDistribution: { status: PrStatus; name: string; count: number }[];
  approvalTimeByDept: { department: string; total: number; approved: number; rejected: number; pending: number; budget: number; avgDays: number | null; avgHours: number | null }[];
  rejectionReasons: { id: string; name: string; count: number; examples: { prId: string; prNumber: string; reason: string | null }[] }[];
  approvers: { approverId: string; name: string; decisions: number; avgDays: number; avgHours: number }[];
  pending: { prId: string; prNumber: string; title: string; requester: string; department: string; submittedAt: string | null; daysPending: number | null; approver: string; budget: number; currency: string; priority: string }[];
}

const STATUS_COLORS: Record<PrStatus, string> = { draft: C.slate, submitted: C.amber, approved: C.green, rejected: C.red };
const deptConfig = { value: { label: 'Avg days to decide', color: C.blue } } satisfies ChartConfig;
const deptHoursConfig = { value: { label: 'Avg hours to decide', color: C.blue } } satisfies ChartConfig;

// Approval time reads better in hours when it is under a day.
const formatApproval = (days: number | null, hours: number | null) => {
  if (days === null) return '–';
  if (hours !== null && hours < 24) return `${Math.round(hours)} hour${Math.round(hours) === 1 ? '' : 's'}`;
  return formatDays(days);
};

export function PrApprovalReport({ data, previous, previousLabel, loading, go }: ReportProps<PrData>) {
  const k = data?.kpis;
  const p = previous?.kpis;
  const kpis: KpiSpec[] = [
    {
      id: 'total', label: 'Purchase requests', icon: ClipboardList, tone: 'blue',
      value: k ? String(k.totalPrs.count) : '–',
      sub: k ? `${formatInr(k.totalPrs.budget)} estimated · ${k.pendingCount} pending` : null,
      current: k?.totalPrs.count, previous: p?.totalPrs.count, previousText: p ? String(p.totalPrs.count) : undefined, better: 'up',
      onClick: () => go({ section: 'purchase-requisitions' }),
    },
    {
      id: 'time', label: 'Avg approval time', icon: Hourglass, tone: 'amber',
      value: k ? formatApproval(k.avgApprovalTime.days, k.avgApprovalTime.hours) : '–',
      sub: k ? `Submitted to decision · ${plural(k.avgApprovalTime.count, 'decision')}` : null,
      current: k?.avgApprovalTime.hours, previous: p?.avgApprovalTime.hours, previousText: p ? formatApproval(p.avgApprovalTime.days, p.avgApprovalTime.hours) : undefined, better: 'down',
    },
    {
      id: 'rejection', label: 'Rejection rate', icon: ThumbsDown, tone: 'red',
      value: k ? formatPct(k.rejectionRate.pct) : '–',
      sub: k ? `${k.rejectionRate.rejected} of ${k.rejectionRate.decided} decided` : null,
      current: k?.rejectionRate.pct, previous: p?.rejectionRate.pct, previousText: p ? formatPct(p.rejectionRate.pct) : undefined, better: 'down',
      onClick: () => go({ section: 'purchase-requisitions', status: 'rejected' }),
    },
    {
      id: 'bottleneck', label: 'Approval bottleneck', icon: UserCog, tone: 'violet',
      value: k?.bottleneck ? k.bottleneck.name : '–',
      sub: k?.bottleneck ? `Slowest approver · ${formatApproval(k.bottleneck.avgDays, k.bottleneck.avgHours)} avg over ${plural(k.bottleneck.decisions, 'decision')}` : 'No decisions in this period',
      previousText: p ? (p.bottleneck ? `${p.bottleneck.name} (${formatApproval(p.bottleneck.avgDays, p.bottleneck.avgHours)})` : '–') : undefined,
    },
  ];

  return (
    <div className="space-y-4">
      <KpiRow kpis={kpis} loading={loading} hasData={!!data} previousLabel={previous ? previousLabel : null} />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <StatusPie data={data} loading={loading} go={go} />
        <DeptTimes data={data} loading={loading} go={go} />
        <RejectionReasons data={data} loading={loading} go={go} />
      </div>
      <Pending data={data} loading={loading} go={go} />
    </div>
  );
}

function StatusPie({ data, loading, go }: { data: PrData | null; loading: boolean; go: (p: Record<string, string>) => void }) {
  const all = (data?.statusDistribution || []).map(r => ({ ...r, key: r.status, value: r.count, color: STATUS_COLORS[r.status] }));
  const slices = all.filter(r => r.count > 0);
  const total = all.reduce((a, r) => a + r.count, 0);
  const config = Object.fromEntries(all.map(r => [r.key, { label: r.name, color: r.color }])) satisfies ChartConfig;
  return (
    <ReportCard title="Request status" description="Requests in this period by status. Click a status to open them.">
      {!total ? <EmptyState loading={loading} text="No purchase requests in this period." /> : (
        <div className="flex flex-col items-center gap-2">
          <ChartContainer config={config} className="aspect-square h-[256px] w-full max-w-[300px]">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel />} />
              <Pie data={slices} dataKey="value" nameKey="key" innerRadius={50} outerRadius={80} paddingAngle={slices.length > 1 ? 2 : 0} stroke="var(--background)" strokeWidth={2}
                className="cursor-pointer" onClick={(e: any) => e?.status && go({ section: 'purchase-requisitions', status: e.status })}>
                {slices.map(r => <Cell key={r.key} fill={r.color} />)}
              </Pie>
              <text x="50%" y="48%" textAnchor="middle" className="fill-foreground text-xl font-bold">{total}</text>
              <text x="50%" y="60%" textAnchor="middle" className="fill-muted-foreground text-[11px]">requests</text>
            </PieChart>
          </ChartContainer>
          <PieLegend rows={all.map(r => ({ key: r.key, name: r.name, value: r.count, color: r.color }))} onClick={(status) => go({ section: 'purchase-requisitions', status })} />
        </div>
      )}
    </ReportCard>
  );
}

function DeptTimes({ data, loading, go }: { data: PrData | null; loading: boolean; go: (p: Record<string, string>) => void }) {
  const decided = (data?.approvalTimeByDept || []).filter(d => d.avgHours !== null);
  // Hours read better when every department decides within two days.
  const inHours = decided.every(d => (d.avgHours || 0) < 48);
  const unit = inHours ? 'h' : 'd';
  const rows = decided.map(d => ({ ...d, value: inHours ? d.avgHours : d.avgDays }));
  const waiting = (data?.approvalTimeByDept || []).filter(d => d.avgHours === null && d.pending > 0);
  return (
    <ReportCard title="Approval time by department" description="Average time from submission to decision. Click a bar to open that department's requests.">
      {!rows.length ? <EmptyState loading={loading} text="No requests were decided in this period." /> : (
        <>
          <ChartContainer config={inHours ? deptHoursConfig : deptConfig} className="aspect-auto w-full" style={{ height: Math.max(260, rows.length * 32 + 30) }}>
            <BarChart data={rows} layout="vertical" margin={{ left: 4, right: 36, top: 4, bottom: 4 }}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v) => `${v}${unit}`} />
              <YAxis type="category" dataKey="department" width={90} tickLine={false} axisLine={false} />
              <ChartTooltip cursor={{ fillOpacity: 0.4 }} content={<ChartTooltipContent hideLabel formatter={(value, _n, item) => (
                <div className="w-full space-y-0.5">
                  <p className="font-medium text-foreground">{item.payload.department}</p>
                  <div className="flex justify-between gap-4"><span className="text-muted-foreground">Avg to decide</span><span className="tabular-nums">{formatApproval(item.payload.avgDays, item.payload.avgHours)}</span></div>
                  <div className="flex justify-between gap-4"><span className="text-muted-foreground">Approved / rejected</span><span className="tabular-nums">{item.payload.approved} / {item.payload.rejected}</span></div>
                  {item.payload.pending > 0 && <div className="flex justify-between gap-4"><span className="text-muted-foreground">Pending</span><span className="tabular-nums">{item.payload.pending}</span></div>}
                </div>
              )} />} />
              <Bar dataKey="value" fill="var(--color-value)" radius={[0, 4, 4, 0]} maxBarSize={20} className="cursor-pointer"
                onClick={(e: any) => e?.department && go({ section: 'purchase-requisitions', dept: e.department })}>
                <LabelList dataKey="value" position="right" formatter={(v: number) => `${v}${unit}`} className="fill-muted-foreground text-[11px]" />
              </Bar>
            </BarChart>
          </ChartContainer>
          {waiting.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">Waiting on a first decision: {waiting.map(d => `${d.department} (${d.pending})`).join(', ')}.</p>
          )}
        </>
      )}
    </ReportCard>
  );
}

function RejectionReasons({ data, loading, go }: { data: PrData | null; loading: boolean; go: (p: Record<string, string>) => void }) {
  const rows = data?.rejectionReasons || [];
  const max = Math.max(1, ...rows.map(r => r.count));
  return (
    <ReportCard title="Rejection reasons" description="Rejected requests grouped by the reason the approver gave.">
      {!rows.length ? <EmptyState loading={loading} text="No requests were rejected in this period." /> : (
        <div className="space-y-3">
          <ul className="space-y-2">
            {rows.map(r => (
              <li key={r.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm"><span>{r.name}</span><span className="tabular-nums font-medium">{r.count}</span></div>
                <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-red-500" style={{ width: `${(r.count / max) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
          <ul className="space-y-1.5 text-xs border-t pt-3">
            {rows.flatMap(r => r.examples.slice(0, 3).map(e => (
              <li key={e.prId}>
                <button type="button" className="text-left hover:underline" onClick={() => go({ section: 'purchase-requisitions', pr: e.prId })}>
                  <span className="font-medium">{e.prNumber}</span>
                  <span className="text-muted-foreground"> · {e.reason || 'No reason given'}</span>
                </button>
              </li>
            )))}
          </ul>
        </div>
      )}
    </ReportCard>
  );
}

function Pending({ data, loading, go }: { data: PrData | null; loading: boolean; go: (p: Record<string, string>) => void }) {
  const rows = data?.pending || [];
  return (
    <ReportCard title="Pending approvals" description="Submitted requests waiting for a decision, oldest first." bodyClassName="px-0 pb-2">
      {!rows.length ? <div className="px-6"><EmptyState loading={loading} text="Nothing is waiting for approval." /></div> : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">PR</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Days pending</TableHead>
                <TableHead className="pr-6">Approver</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(r => (
                <TableRow key={r.prId} className="cursor-pointer" onClick={() => go({ section: 'purchase-requisitions', pr: r.prId })}>
                  <TableCell className="pl-6 max-w-[260px]">
                    <span className="font-medium">{r.prNumber}</span>
                    <span className="block text-[11px] text-muted-foreground truncate">{r.title}</span>
                  </TableCell>
                  <TableCell>{r.requester}</TableCell>
                  <TableCell>{r.department}</TableCell>
                  <TableCell className="text-right tabular-nums whitespace-nowrap">{formatAny(r.budget, r.currency)}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(r.submittedAt)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className={(r.daysPending || 0) > 7 ? 'bg-red-50 text-red-700 border-red-200' : (r.daysPending || 0) > 3 ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}>
                      {r.daysPending ?? '–'}d
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-6 text-muted-foreground max-w-[200px] truncate">{r.approver}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </ReportCard>
  );
}
