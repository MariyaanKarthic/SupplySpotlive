import React, { useMemo, useState } from 'react';
import { AlertOctagon, CalendarCheck, ClipboardCheck, ShieldCheck } from 'lucide-react';
import { Cell, Pie, PieChart } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { C, EmptyState, KpiRow, KpiSpec, PieLegend, ReportCard, ReportProps, formatDate, formatPct, plural, titleCase } from './reportKit';

type Status = 'certified' | 'pending' | 'non_compliant';
type Level = 'red' | 'yellow' | 'green';
interface Cert { id: string; type: string; expiryDate: string | null; expiryState: string | null; status: string }
interface VendorRow {
  vendorId: string; vendorName: string; category: string; vendorStatus: string; status: Status;
  level: Level; levelLabel: string;
  gstVerified: boolean; panVerified: boolean;
  certificates: Cert[];
  lastAudit: string | null; lastAuditResult: string | null; nextAuditDue: string | null; auditDue: boolean;
  openIssues: number; issues: string[];
}
export interface ComplianceData {
  source: string;
  access?: { level: string; label: string };
  range: { asOf: string };
  kpis: {
    coverage: { pct: number | null; certified: number; total: number };
    auditsDue: { count: number; neverAudited: number; dueSoon: number };
    openIssues: { count: number; vendors: number };
    auditsInPeriod: { count: number; failed: number };
    certificates: { expired: number; expiringSoon: number };
  };
  statusDistribution: { status: Status; name: string; count: number }[];
  expiringSoon: { certId: string; vendorId: string; vendorName: string; name: string; date: string; daysLeft: number; verified: boolean }[];
  vendors: VendorRow[];
}

const STATUS_COLORS: Record<Status, string> = { certified: C.green, pending: C.amber, non_compliant: C.red };
const STATUS_BADGE: Record<Status, { label: string; className: string }> = {
  certified: { label: 'Certified', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  non_compliant: { label: 'Non-compliant', className: 'bg-red-50 text-red-700 border-red-200' },
};
const LEVEL_DOT: Record<Level, string> = { red: 'bg-red-500', yellow: 'bg-amber-500', green: 'bg-emerald-500' };
const daysTone = (d: number) => (d <= 30 ? 'red' : d <= 60 ? 'amber' : 'green');
const TONE_BADGE: Record<string, string> = {
  red: 'bg-red-50 text-red-700 border-red-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};
const TONE_DOT: Record<string, string> = { red: 'bg-red-500', amber: 'bg-amber-500', green: 'bg-emerald-500' };
const chipClass = (state: string | null) =>
  state === 'expired' ? TONE_BADGE.red : state === 'expiring' || state === 'expiring_soon' ? TONE_BADGE.amber : 'bg-muted text-foreground border-border';

export function ComplianceReport({ data, previous, previousLabel, loading, go }: ReportProps<ComplianceData>) {
  const k = data?.kpis;
  const p = previous?.kpis;
  const summaryOnly = data?.access?.level === 'summary';
  const kpis: KpiSpec[] = [
    {
      id: 'coverage', label: 'Certification coverage', icon: ShieldCheck, tone: 'green',
      value: k ? formatPct(k.coverage.pct) : '–',
      sub: k ? `${k.coverage.certified} of ${plural(k.coverage.total, 'vendor')} fully certified${k.certificates.expired ? ` · ${plural(k.certificates.expired, 'certificate')} expired` : ''}` : null,
      onClick: () => go({ section: 'compliance' }),
    },
    {
      id: 'audits', label: 'Audits due', icon: CalendarCheck, tone: 'amber',
      value: k ? String(k.auditsDue.count) : '–',
      sub: k ? `${k.auditsDue.neverAudited} never audited · ${k.auditsDue.dueSoon} more due soon` : null,
    },
    {
      id: 'issues', label: 'Open compliance issues', icon: AlertOctagon, tone: 'red',
      value: k ? String(k.openIssues.count) : '–',
      sub: k ? `Across ${plural(k.openIssues.vendors, 'vendor')}` : null,
    },
    {
      id: 'period', label: 'Audits in period', icon: ClipboardCheck, tone: 'blue',
      value: k ? String(k.auditsInPeriod.count) : '–',
      sub: k ? (k.auditsInPeriod.failed ? `${k.auditsInPeriod.failed} failed` : 'None failed') : null,
      current: k?.auditsInPeriod.count, previous: p?.auditsInPeriod.count, previousText: p ? String(p.auditsInPeriod.count) : undefined, better: 'up',
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Compliance status is shown as of {formatDate(data?.range.asOf || null)}; the date range only applies to audits held in the period.
        {summaryOnly && ' You have summary access, so vendor details are hidden.'}
      </p>
      <KpiRow kpis={kpis} loading={loading} hasData={!!data} previousLabel={previous ? previousLabel : null} />
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <StatusPie className="xl:col-span-2" data={data} loading={loading} />
        {!summaryOnly && <ExpiryTimeline className="xl:col-span-3" data={data} loading={loading} go={go} />}
      </div>
      {!summaryOnly && <VendorTable data={data} loading={loading} go={go} />}
    </div>
  );
}

function StatusPie({ data, loading, className }: { data: ComplianceData | null; loading: boolean; className?: string }) {
  const all = (data?.statusDistribution || []).map(r => ({ ...r, key: r.status, value: r.count, color: STATUS_COLORS[r.status] }));
  const slices = all.filter(r => r.count > 0);
  const total = all.reduce((a, r) => a + r.count, 0);
  const config = Object.fromEntries(all.map(r => [r.key, { label: r.name, color: r.color }])) satisfies ChartConfig;
  return (
    <ReportCard className={className} title="Vendor certification status" description="Certified: GST and PAN verified, verified certificates, nothing expired. Non-compliant: a certificate expired or the vendor is suspended.">
      {!total ? <EmptyState loading={loading} text="No vendors on record." /> : (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <ChartContainer config={config} className="aspect-square h-[256px] w-full max-w-[300px]">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel />} />
              <Pie data={slices} dataKey="value" nameKey="key" innerRadius={52} outerRadius={84} paddingAngle={slices.length > 1 ? 2 : 0} stroke="var(--background)" strokeWidth={2}>
                {slices.map(r => <Cell key={r.key} fill={r.color} />)}
              </Pie>
              <text x="50%" y="48%" textAnchor="middle" className="fill-foreground text-xl font-bold">{total}</text>
              <text x="50%" y="60%" textAnchor="middle" className="fill-muted-foreground text-[11px]">vendors</text>
            </PieChart>
          </ChartContainer>
          <PieLegend rows={all.map(r => ({ key: r.key, name: r.name, value: r.count, color: r.color, extra: total ? `${Math.round((r.count / total) * 100)}%` : undefined }))} />
        </div>
      )}
    </ReportCard>
  );
}

// Certificates due to expire in the next 90 days, placed on a time axis.
function ExpiryTimeline({ data, loading, className, go }: { data: ComplianceData | null; loading: boolean; className?: string; go: (p: Record<string, string>) => void }) {
  const rows = data?.expiringSoon || [];
  const asOf = data?.range.asOf;
  const marks = useMemo(() => {
    if (!asOf) return [];
    const start = new Date(`${asOf}T00:00:00`);
    return [0, 30, 60, 90].map(d => ({ d, label: d === 0 ? 'Today' : formatDate(new Date(start.getTime() + d * 86400000).toISOString().slice(0, 10)) }));
  }, [asOf]);
  const open = (r: ComplianceData['expiringSoon'][number]) => go({ section: 'compliance', cert: r.certId });
  return (
    <ReportCard className={className} title="Certificates expiring soon" description="Certificates that expire in the next 90 days. Click one to open it in Compliance.">
      {!rows.length ? <EmptyState loading={loading} text="Nothing expires in the next 90 days." /> : (
        <div className="space-y-3">
          <div className="relative h-10 mx-2">
            <div className="absolute left-0 right-0 top-4 h-1 rounded-full bg-gradient-to-r from-red-200 via-amber-200 to-emerald-100" />
            {marks.map(m => (
              <div key={m.d} className="absolute top-0 -translate-x-1/2 text-[10px] text-muted-foreground whitespace-nowrap" style={{ left: `${(m.d / 90) * 100}%` }}>
                <div className="h-3 w-px bg-border mx-auto mb-3" />
                <span className="absolute top-6 left-1/2 -translate-x-1/2">{m.label}</span>
              </div>
            ))}
            {rows.map(r => (
              <button
                key={r.certId}
                type="button"
                title={`${r.vendorName}: ${r.name}, ${formatDate(r.date)} (${r.daysLeft} days)`}
                onClick={() => open(r)}
                className={`absolute top-[11px] h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-background shadow ${TONE_DOT[daysTone(r.daysLeft)]}`}
                style={{ left: `${Math.min(100, (r.daysLeft / 90) * 100)}%` }}
              />
            ))}
          </div>
          <ul className="divide-y rounded-lg border mt-6 max-h-72 overflow-y-auto">
            {rows.map(r => (
              <li key={r.certId}>
                <button type="button" onClick={() => open(r)} className="w-full flex items-center justify-between gap-3 px-3 py-2 text-sm text-left hover:bg-muted/50">
                  <span className="min-w-0 truncate">
                    <span className="font-medium">{r.vendorName}</span>
                    <span className="text-muted-foreground"> · {r.name}{r.verified ? '' : ' (unverified)'}</span>
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">{formatDate(r.date)}</span>
                    <Badge variant="outline" className={TONE_BADGE[daysTone(r.daysLeft)]}>{r.daysLeft}d</Badge>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ReportCard>
  );
}

const Check = ({ ok }: { ok: boolean }) => (
  <span className={`inline-block h-2 w-2 rounded-full ${ok ? 'bg-emerald-500' : 'bg-red-500'}`} title={ok ? 'Verified' : 'Not verified'} />
);

function VendorTable({ data, loading, go }: { data: ComplianceData | null; loading: boolean; go: (p: Record<string, string>) => void }) {
  const [filter, setFilter] = useState<'all' | Status>('all');
  const all = data?.vendors || [];
  const rows = filter === 'all' ? all : all.filter(v => v.status === filter);
  return (
    <ReportCard
      title="Vendor compliance summary"
      description="Problems first. Click a vendor to open it."
      bodyClassName="px-0 pb-2"
      action={(
        <div className="flex flex-wrap rounded-md border p-0.5 shrink-0">
          {(['all', 'non_compliant', 'pending', 'certified'] as const).map(id => (
            <Button key={id} size="sm" variant={filter === id ? 'secondary' : 'ghost'} className="h-7 px-2 text-xs" onClick={() => setFilter(id)}>
              {id === 'all' ? `All (${all.length})` : `${STATUS_BADGE[id].label} (${all.filter(v => v.status === id).length})`}
            </Button>
          ))}
        </div>
      )}
    >
      {!rows.length ? <div className="px-6"><EmptyState loading={loading} text="No vendors match." height={140} /></div> : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Vendor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">GST</TableHead>
                <TableHead className="text-center">PAN</TableHead>
                <TableHead>Certificates</TableHead>
                <TableHead>Last audit</TableHead>
                <TableHead>Next audit due</TableHead>
                <TableHead className="pr-6">Issues</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(v => {
                const badge = STATUS_BADGE[v.status];
                return (
                  <TableRow key={v.vendorId} className="cursor-pointer" onClick={() => go({ section: 'vendors', vendor: v.vendorId })}>
                    <TableCell className="pl-6 font-medium max-w-[220px]">
                      <span className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full shrink-0 ${LEVEL_DOT[v.level]}`} title={v.levelLabel} />
                        <span className="truncate">{v.vendorName}</span>
                      </span>
                      <span className="block text-[11px] text-muted-foreground font-normal pl-4">{titleCase(v.category || '')} · {titleCase(v.vendorStatus || '')}</span>
                    </TableCell>
                    <TableCell><Badge variant="outline" className={badge.className}>{badge.label}</Badge></TableCell>
                    <TableCell className="text-center"><Check ok={v.gstVerified} /></TableCell>
                    <TableCell className="text-center"><Check ok={v.panVerified} /></TableCell>
                    <TableCell className="max-w-[220px]">
                      {v.certificates.length ? (
                        <span className="flex flex-wrap gap-1">
                          {v.certificates.map(c => (
                            <Badge key={c.id} variant="outline" className={`text-[10px] px-1.5 py-0 ${chipClass(c.expiryState)}`} title={c.expiryDate ? `Expires ${formatDate(c.expiryDate)}` : 'No expiry'}>
                              {c.type}
                            </Badge>
                          ))}
                        </span>
                      ) : <span className="text-xs text-muted-foreground">None</span>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(v.lastAudit)}
                      {v.lastAuditResult && <span className="block text-[11px] text-muted-foreground">{titleCase(v.lastAuditResult)}</span>}
                    </TableCell>
                    <TableCell className={`whitespace-nowrap ${v.auditDue ? 'text-red-600 font-medium' : ''}`}>{formatDate(v.nextAuditDue)}</TableCell>
                    <TableCell className="pr-6 max-w-[260px]">
                      {v.issues.length ? <span className="block truncate text-red-700 text-xs" title={v.issues.join('; ')}>{v.issues.join('; ')}</span> : <span className="text-xs text-muted-foreground">None</span>}
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
