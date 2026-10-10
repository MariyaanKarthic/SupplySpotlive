import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  AlertTriangle, BadgeCheck, CalendarClock, ClipboardCheck, FileCheck2, Pencil, Plus, ShieldAlert, X,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts';
import { complianceService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDate } from '../procurement/purchase-orders/poModel';
import { DateFilter, Preset, PRESETS, presetRange, rangeLabel } from './dateRange';

// ---------- Response shapes (/compliance/*) ----------

type Level = 'green' | 'yellow' | 'red';
type CertificationStatus = 'certified' | 'pending' | 'non_compliant';
type ExpiryState = 'expired' | 'expiring' | 'valid' | 'no_expiry';
type CertRecordStatus = 'verified' | 'pending_verification' | 'rejected';
type AuditResult = 'passed' | 'passed_with_observations' | 'failed';

interface ComplianceData {
  range: { from: string | null; to: string | null; asOf: string };
  scope: { level: 'all' | 'vendors' | 'summary'; label: string };
  rules: { expiringWithinDays: number; auditIntervalDays: number };
  kpis: {
    certified: { count: number; total: number };
    issues: { count: number; critical: number };
    auditsDue: { count: number; neverAudited: number; total: number };
    documentation: { complete: number; total: number; percent: number };
  };
  certificationStatus: { status: CertificationStatus; count: number }[];
  complianceLevels: { level: Level; count: number }[];
  certificates: { total: number; expired: number; expiring: number };
  issuesByCategory: { category: string; label: string; total: number; open: number }[];
  audits: { count: number; byResult: { result: AuditResult; count: number }[] };
}
interface Certification {
  id: string; vendorId: string; vendorName: string; type: string; certificateNumber: string | null; issuingBody: string | null;
  issueDate: string | null; expiryDate: string | null; daysToExpiry: number | null; expiryState: ExpiryState;
  status: CertRecordStatus; verifiedBy: string | null; verifiedAt: string | null; notes: string | null;
}
interface Audit {
  id: string; vendorId: string; vendorName: string; auditDate: string; auditType: string; auditor: string | null;
  result: AuditResult; score: number | null; findings: string | null; nextAuditDue: string | null;
}
interface ComplianceVendor {
  id: string; name: string; category: string; status: string; certificationStatus: CertificationStatus;
  lastAuditDate: string | null; daysSinceAudit: number | null; auditDue: boolean; latestAudit: Audit | null;
  certifications: Certification[]; openIssues: number;
  documentation: { gstVerified: boolean; panVerified: boolean; complete: boolean; missing: string[] };
  compliance: { level: Level; label: string; reasons: string[] };
}
interface Dispute {
  id: string; disputeNumber: string; title: string; description: string; category: string; categoryLabel: string;
  priority: 'low' | 'medium' | 'high' | 'critical'; status: string; vendorId: string | null; vendorName: string | null;
  raisedAt: string | null; daysOpen: number | null;
}

// ---------- Colours and labels ----------

const LEVEL_COLORS: Record<Level, string> = { green: '#22c55e', yellow: '#eab308', red: '#ef4444' };
const LEVEL_BADGE: Record<Level, string> = {
  green: 'bg-green-50 text-green-700 border-green-200',
  yellow: 'bg-yellow-50 text-yellow-800 border-yellow-300',
  red: 'bg-red-50 text-red-700 border-red-200',
};
const CERT_STATUS_META: Record<CertificationStatus, { label: string; color: string; level: Level }> = {
  certified: { label: 'Certified', color: LEVEL_COLORS.green, level: 'green' },
  pending: { label: 'Pending certification', color: LEVEL_COLORS.yellow, level: 'yellow' },
  non_compliant: { label: 'Non-compliant', color: LEVEL_COLORS.red, level: 'red' },
};
const EXPIRY_META: Record<ExpiryState, { label: (days: number | null) => string; className: string; row: string }> = {
  expired: { label: (d) => `Expired ${Math.abs(d ?? 0)}d ago`, className: LEVEL_BADGE.red, row: 'bg-red-50/60 hover:bg-red-50' },
  expiring: { label: (d) => (d === 0 ? 'Expires today' : `${d}d left`), className: LEVEL_BADGE.yellow, row: 'bg-yellow-50/60 hover:bg-yellow-50' },
  valid: { label: (d) => `${d}d left`, className: 'bg-slate-50 text-slate-600 border-slate-200', row: '' },
  no_expiry: { label: () => 'No expiry', className: 'bg-slate-50 text-slate-500 border-slate-200', row: '' },
};
const RECORD_STATUS_LABEL: Record<CertRecordStatus, string> = {
  verified: 'Verified', pending_verification: 'Awaiting verification', rejected: 'Rejected',
};
const AUDIT_RESULT_META: Record<AuditResult, { label: string; className: string }> = {
  passed: { label: 'Passed', className: LEVEL_BADGE.green },
  passed_with_observations: { label: 'Passed with observations', className: LEVEL_BADGE.yellow },
  failed: { label: 'Failed', className: LEVEL_BADGE.red },
};
const AUDIT_TYPES = [
  { id: 'routine', label: 'Routine' }, { id: 'certification', label: 'Certification' },
  { id: 'follow_up', label: 'Follow-up' }, { id: 'surprise', label: 'Surprise' },
];
const PRIORITY_CLASS: Record<string, string> = {
  critical: 'bg-red-600 text-white border-red-600',
  high: LEVEL_BADGE.red,
  medium: LEVEL_BADGE.yellow,
  low: 'bg-slate-50 text-slate-600 border-slate-200',
};
const humanize = (s: string) => s.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());

const WRITE_ROLES = ['admin', 'compliance_manager'];
const DISPUTE_ROLES = ['admin', 'compliance_manager', 'procurement_manager'];
const DEFAULT_PRESET: Preset = 'last_12_months';

type VendorFilter = { kind: 'status'; value: CertificationStatus } | { kind: 'level'; value: Level } | { kind: 'audit_due' } | { kind: 'docs' } | null;

// ---------- Page ----------

export function ComplianceDashboard({ onNavigate }: { onNavigate?: (view: any) => void }) {
  const { vendor: authUser } = useAuth();
  const role: string | undefined = authUser?.role;
  const canWrite = !!role && WRITE_ROLES.includes(role);
  const canSettle = !!role && DISPUTE_ROLES.includes(role);

  const [searchParams, setSearchParams] = useSearchParams();
  const presetParam = searchParams.get('period') as Preset | null;
  const preset: Preset = presetParam && PRESETS.some(p => p.id === presetParam) ? presetParam : DEFAULT_PRESET;
  const customFrom = searchParams.get('from') || '';
  const customTo = searchParams.get('to') || '';
  const range = preset === 'custom' ? { from: customFrom, to: customTo } : presetRange(preset);
  const certParam = searchParams.get('cert');

  // Period and the open certificate live in the URL next to section=compliance so the view can be linked and Back works.
  const updateParams = useCallback((patch: Record<string, string | null>) => {
    setSearchParams(() => {
      const next = new URLSearchParams(window.location.search);
      Object.entries(patch).forEach(([k, v]) => (v === null || v === '' ? next.delete(k) : next.set(k, v)));
      return next;
    }, { replace: true });
  }, [setSearchParams]);
  const goTo = (params: Record<string, string>) => setSearchParams(params);

  const [data, setData] = useState<ComplianceData | null>(null);
  const [vendors, setVendors] = useState<ComplianceVendor[]>([]);
  const [certs, setCerts] = useState<Certification[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (from: string, to: string) => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await complianceService.getDashboard({ from, to });
      const dash: ComplianceData = res.data;
      setData(dash);
      if (dash.scope.level === 'summary') {
        setVendors([]); setCerts([]); setAudits([]); setDisputes([]);
        return;
      }
      const [v, c, a, d]: any[] = await Promise.all([
        complianceService.getVendors(),
        complianceService.getCertifications(),
        complianceService.getAudits({ from, to }),
        complianceService.getDisputes(),
      ]);
      setVendors(v.data.vendors);
      setCerts(c.data.certifications);
      setAudits(a.data.audits);
      setDisputes(d.data.disputes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the compliance dashboard');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(range.from, range.to); }, [load, range.from, range.to]);
  const reload = () => load(range.from, range.to);

  const [vendorFilter, setVendorFilter] = useState<VendorFilter>(null);
  const [certFilter, setCertFilter] = useState<'attention' | 'all'>('attention');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [auditVendor, setAuditVendor] = useState<ComplianceVendor | null>(null);
  const [settling, setSettling] = useState<{ dispute: Dispute; action: 'resolve' | 'close' } | null>(null);

  const levelByVendor = useMemo(() => new Map(vendors.map(v => [v.id, v.compliance])), [vendors]);
  const editingCert = certParam ? certs.find(c => c.id === certParam) || null : null;
  const label = rangeLabel(preset, range.from, range.to);
  const summaryOnly = data?.scope.level === 'summary';

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const filterVendors = (f: VendorFilter) => { setVendorFilter(f); if (!summaryOnly) setTimeout(() => scrollTo('compliance-vendors'), 0); };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="px-6 pb-6 space-y-6 w-full max-w-full overflow-x-hidden">
        <div className="sticky top-0 bg-background/95 backdrop-blur z-20 border-b py-3 -mx-6 px-6">
          <Breadcrumb className="text-xs">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => onNavigate && onNavigate('home')} className="cursor-pointer">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Compliance</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Compliance Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Certifications, audits and compliance issues · {data?.scope.label || '…'}
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
            onRefresh={reload}
          />
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <p className="text-sm text-red-700">{error}</p>
              <Button variant="outline" size="sm" onClick={reload}>Try again</Button>
            </CardContent>
          </Card>
        )}

        <KpiRow
          data={data}
          loading={loading}
          onCertified={() => filterVendors({ kind: 'status', value: 'certified' })}
          onIssues={() => !summaryOnly && scrollTo('compliance-disputes')}
          onAuditsDue={() => filterVendors({ kind: 'audit_due' })}
          onDocs={() => filterVendors({ kind: 'docs' })}
        />

        {data && !summaryOnly && (data.certificates.expired > 0 || data.certificates.expiring > 0) && (
          <ExpiryAlert
            data={data}
            certs={certs}
            onReview={() => { setCertFilter('attention'); scrollTo('compliance-certs'); }}
            onEdit={(id) => updateParams({ cert: id })}
          />
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <StatusChart data={data} loading={loading} onStatus={(s) => filterVendors({ kind: 'status', value: s })} />
          <IssuesChart
            data={data}
            loading={loading}
            periodLabel={label}
            active={categoryFilter}
            onCategory={(c) => { setCategoryFilter(c === categoryFilter ? null : c); if (!summaryOnly) scrollTo('compliance-disputes'); }}
          />
        </div>

        {summaryOnly ? (
          <Card className="shadow-sm">
            <CardContent className="p-4 text-sm text-muted-foreground flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              Vendor-level certificates, audits and disputes are shown to admins, compliance managers and procurement managers.
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
              <CertificationsTable
                certs={certs}
                levels={levelByVendor}
                loading={loading}
                filter={certFilter}
                onFilter={setCertFilter}
                canWrite={canWrite}
                onEdit={(id) => updateParams({ cert: id })}
                onVendor={(id) => goTo({ section: 'vendors', vendor: id })}
              />
              <DisputesTable
                disputes={disputes}
                levels={levelByVendor}
                loading={loading}
                category={categoryFilter}
                onClearCategory={() => setCategoryFilter(null)}
                canSettle={canSettle}
                onSettle={(dispute, action) => setSettling({ dispute, action })}
                onOpen={(id) => goTo({ section: 'dispute-management', dispute: id })}
                onVendor={(id) => goTo({ section: 'vendors', vendor: id })}
              />
            </div>
            <VendorsTable
              vendors={vendors}
              loading={loading}
              filter={vendorFilter}
              onClearFilter={() => setVendorFilter(null)}
              canWrite={canWrite}
              onAudit={setAuditVendor}
              onVendor={(id) => goTo({ section: 'vendors', vendor: id })}
            />
            <AuditHistory audits={audits} levels={levelByVendor} loading={loading} periodLabel={label} onVendor={(id) => goTo({ section: 'vendors', vendor: id })} />
          </>
        )}

        <EditCertificationDialog
          cert={editingCert}
          canWrite={canWrite}
          onClose={() => updateParams({ cert: null })}
          onSaved={() => { updateParams({ cert: null }); reload(); }}
        />
        <RecordAuditDialog vendor={auditVendor} onClose={() => setAuditVendor(null)} onSaved={() => { setAuditVendor(null); reload(); }} />
        <SettleDisputeDialog value={settling} onClose={() => setSettling(null)} onSaved={() => { setSettling(null); reload(); }} />
      </div>
    </TooltipProvider>
  );
}

// ---------- Small pieces ----------

function ComplianceBadge({ compliance }: { compliance?: ComplianceVendor['compliance'] }) {
  if (!compliance) return null;
  const badge = (
    <Badge variant="outline" className={`gap-1.5 whitespace-nowrap ${LEVEL_BADGE[compliance.level]}`}>
      <span className="h-2 w-2 rounded-full" style={{ background: LEVEL_COLORS[compliance.level] }} />
      {compliance.label}
    </Badge>
  );
  if (!compliance.reasons.length) return badge;
  return (
    <Tooltip>
      <TooltipTrigger asChild><span className="inline-flex cursor-help">{badge}</span></TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <ul className="list-disc pl-4 space-y-0.5 text-xs">{compliance.reasons.map(r => <li key={r}>{r}</li>)}</ul>
      </TooltipContent>
    </Tooltip>
  );
}

function VendorLink({ id, name, onVendor }: { id: string | null; name: string | null; onVendor: (id: string) => void }) {
  if (!id) return <span>{name || '–'}</span>;
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); onVendor(id); }} className="font-medium text-left hover:underline truncate max-w-[200px]">
      {name}
    </button>
  );
}

function EmptyState({ loading, text }: { loading: boolean; text: string }) {
  return loading
    ? <div className="h-[200px] rounded-lg bg-muted animate-pulse" />
    : <div className="h-[140px] flex items-center justify-center text-sm text-muted-foreground text-center px-4">{text}</div>;
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <Badge variant="secondary" className="gap-1 pr-1">
      {label}
      <button type="button" onClick={onClear} aria-label="Clear filter" className="rounded hover:bg-muted p-0.5"><X className="w-3 h-3" /></button>
    </Badge>
  );
}

// ---------- KPI tiles ----------

function KpiRow({ data, loading, onCertified, onIssues, onAuditsDue, onDocs }: {
  data: ComplianceData | null; loading: boolean;
  onCertified: () => void; onIssues: () => void; onAuditsDue: () => void; onDocs: () => void;
}) {
  const k = data?.kpis;
  const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
  const tiles = [
    {
      id: 'certified',
      label: 'Vendors certified',
      value: k ? `${k.certified.count}` : '–',
      suffix: k ? ` / ${k.certified.total}` : '',
      sub: k ? `${pct(k.certified.count, k.certified.total)}% of vendors` : 'Certification status',
      icon: BadgeCheck,
      tone: 'border-l-green-500 [&_.kpi-icon]:bg-green-50 [&_.kpi-icon]:text-green-600',
      valueClass: 'text-foreground',
      onClick: onCertified,
    },
    {
      id: 'issues',
      label: 'Compliance issues',
      value: k ? `${k.issues.count}` : '–',
      sub: k ? (k.issues.critical ? `${k.issues.critical} critical · open disputes` : 'Open compliance or high-priority disputes') : 'Open disputes',
      icon: AlertTriangle,
      tone: 'border-l-red-500 [&_.kpi-icon]:bg-red-50 [&_.kpi-icon]:text-red-600',
      valueClass: k && k.issues.count ? 'text-red-600' : 'text-foreground',
      onClick: onIssues,
    },
    {
      id: 'audits',
      label: 'Audits due',
      value: k ? `${k.auditsDue.count}` : '–',
      sub: k
        ? `Last audit over a year ago${k.auditsDue.neverAudited ? ` · ${k.auditsDue.neverAudited} never audited` : ''}`
        : 'Last audit over a year ago',
      icon: CalendarClock,
      tone: 'border-l-yellow-500 [&_.kpi-icon]:bg-yellow-50 [&_.kpi-icon]:text-yellow-600',
      valueClass: k && k.auditsDue.count ? 'text-yellow-700' : 'text-foreground',
      onClick: onAuditsDue,
    },
    {
      id: 'docs',
      label: 'Documentation complete',
      value: k ? `${k.documentation.percent}%` : '–',
      sub: k ? `${k.documentation.complete} of ${k.documentation.total} vendors · GST, PAN and a current certificate` : 'GST, PAN and a current certificate',
      icon: FileCheck2,
      tone: 'border-l-blue-500 [&_.kpi-icon]:bg-blue-50 [&_.kpi-icon]:text-blue-600',
      valueClass: 'text-foreground',
      progress: k?.documentation.percent,
      onClick: onDocs,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      {tiles.map(t => {
        const Icon = t.icon;
        return (
          <button key={t.id} type="button" onClick={t.onClick} className="text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Card className={`border-l-4 shadow-sm h-full hover:shadow-md transition-all ${t.tone}`}>
              <CardContent className="p-4 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-xs text-muted-foreground font-medium truncate">{t.label}</p>
                  <p className={`text-2xl font-bold tabular-nums ${t.valueClass} ${loading && !data ? 'animate-pulse' : ''}`}>
                    {t.value}<span className="text-sm font-medium text-muted-foreground">{t.suffix}</span>
                  </p>
                  {t.progress !== undefined && <Progress value={t.progress} className="h-1.5" />}
                  <p className="text-[11px] text-muted-foreground truncate" title={t.sub}>{t.sub}</p>
                </div>
                <div className="kpi-icon rounded-lg p-2 shrink-0"><Icon className="w-5 h-5" /></div>
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  );
}

// ---------- Expiry alert ----------

function ExpiryAlert({ data, certs, onReview, onEdit }: {
  data: ComplianceData; certs: Certification[]; onReview: () => void; onEdit: (id: string) => void;
}) {
  const urgent = certs.filter(c => c.expiryState === 'expired' || c.expiryState === 'expiring').slice(0, 4);
  const { expired, expiring } = data.certificates;
  return (
    <Card className={`shadow-sm ${expired ? 'border-red-200 bg-red-50/40' : 'border-yellow-300 bg-yellow-50/50'}`}>
      <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-3 justify-between">
        <div className="space-y-1 min-w-0">
          <p className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className={`w-4 h-4 ${expired ? 'text-red-600' : 'text-yellow-600'}`} />
            {[expired && `${expired} certificate${expired === 1 ? '' : 's'} expired`, expiring && `${expiring} expiring within ${data.rules.expiringWithinDays} days`]
              .filter(Boolean).join(' · ')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {urgent.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => onEdit(c.id)}
                className={`text-xs rounded-md border px-2 py-0.5 hover:underline ${EXPIRY_META[c.expiryState].className}`}
              >
                {c.vendorName} · {c.type} · {EXPIRY_META[c.expiryState].label(c.daysToExpiry)}
              </button>
            ))}
          </div>
        </div>
        <Button variant="outline" size="sm" className="shrink-0" onClick={onReview}>Review certificates</Button>
      </CardContent>
    </Card>
  );
}

// ---------- Charts ----------

const statusConfig = Object.fromEntries(
  (Object.keys(CERT_STATUS_META) as CertificationStatus[]).map(s => [s, { label: CERT_STATUS_META[s].label, color: CERT_STATUS_META[s].color }]),
) satisfies ChartConfig;

function StatusChart({ data, loading, onStatus }: { data: ComplianceData | null; loading: boolean; onStatus: (s: CertificationStatus) => void }) {
  const rows = useMemo(() => (data?.certificationStatus || []).map(r => ({ ...r, ...CERT_STATUS_META[r.status], fill: CERT_STATUS_META[r.status].color })), [data]);
  const slices = rows.filter(r => r.count > 0);
  const total = rows.reduce((a, r) => a + r.count, 0);
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Vendor compliance status</CardTitle>
        <CardDescription>Vendors by certification status, as of today. Click a status to list those vendors.</CardDescription>
      </CardHeader>
      <CardContent>
        {!total ? (
          <EmptyState loading={loading} text="No vendors yet." />
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
                          <span className="font-mono font-medium tabular-nums text-foreground">
                            {value} ({Math.round((Number(value) / total) * 100)}%)
                          </span>
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
                <text x="50%" y="58%" textAnchor="middle" className="fill-muted-foreground text-xs">vendors</text>
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
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.fill }} />
                      {r.label}
                    </span>
                    <span className="flex items-baseline gap-3 tabular-nums">
                      <span className="text-xs text-muted-foreground">{total ? Math.round((r.count / total) * 100) : 0}%</span>
                      <span className="font-medium w-6 text-right">{r.count}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {data && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground border-t pt-3">
            <span>Overall standing:</span>
            {data.complianceLevels.map(l => (
              <span key={l.level} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: LEVEL_COLORS[l.level] }} />
                {l.count} {l.level === 'green' ? 'compliant' : l.level === 'yellow' ? 'warning' : 'non-compliant'}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const issuesConfig = {
  open: { label: 'Open', color: LEVEL_COLORS.red },
  closed: { label: 'Resolved / closed', color: '#94a3b8' },
} satisfies ChartConfig;

function IssuesChart({ data, loading, periodLabel, active, onCategory }: {
  data: ComplianceData | null; loading: boolean; periodLabel: string; active: string | null; onCategory: (c: string) => void;
}) {
  const rows = (data?.issuesByCategory || []).map(r => ({ ...r, closed: r.total - r.open }));
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Compliance issues by category</CardTitle>
        <CardDescription>Compliance and high-priority disputes raised · {periodLabel}. Click a bar to filter open disputes.</CardDescription>
      </CardHeader>
      <CardContent>
        {!rows.length ? (
          <EmptyState loading={loading} text="No compliance issues raised in this period." />
        ) : (
          <ChartContainer config={issuesConfig} className="aspect-auto h-[260px] w-full">
            <BarChart data={rows} margin={{ left: 0, right: 8, top: 8, bottom: 4 }} barCategoryGap={18}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} interval={0} tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
              <ChartTooltip cursor={{ fillOpacity: 0.4 }} content={<ChartTooltipContent />} />
              {(['open', 'closed'] as const).map((key, i) => (
                <Bar
                  key={key}
                  dataKey={key}
                  stackId="issues"
                  fill={`var(--color-${key})`}
                  radius={i === 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  maxBarSize={44}
                  className="cursor-pointer"
                  onClick={(entry: any) => entry?.category && onCategory(entry.category)}
                >
                  {rows.map(r => (
                    <Cell key={r.category} fillOpacity={!active || active === r.category ? 1 : 0.35} />
                  ))}
                </Bar>
              ))}
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ---------- Tables ----------

function CertificationsTable({ certs, levels, loading, filter, onFilter, canWrite, onEdit, onVendor }: {
  certs: Certification[]; levels: Map<string, ComplianceVendor['compliance']>; loading: boolean;
  filter: 'attention' | 'all'; onFilter: (f: 'attention' | 'all') => void; canWrite: boolean;
  onEdit: (id: string) => void; onVendor: (id: string) => void;
}) {
  const rows = filter === 'attention'
    ? certs.filter(c => c.expiryState === 'expired' || c.expiryState === 'expiring' || c.status !== 'verified')
    : certs;
  return (
    <Card id="compliance-certs" className="shadow-sm scroll-mt-20">
      <CardHeader className="pb-2 flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-base">Vendor certifications</CardTitle>
          <CardDescription>Yellow: expires within 30 days. Red: expired.</CardDescription>
        </div>
        <Select value={filter} onValueChange={(v) => onFilter(v as 'attention' | 'all')}>
          <SelectTrigger className="w-[170px] h-8 text-xs" aria-label="Certificates to show"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="attention">Needs attention</SelectItem>
            <SelectItem value="all">All certificates ({certs.length})</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-0 pb-2">
        {!rows.length ? (
          <div className="px-6"><EmptyState loading={loading} text="No certificates need attention." /></div>
        ) : (
          <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Vendor</TableHead>
                  <TableHead>Certificate</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-6 text-right"><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(c => {
                  const meta = EXPIRY_META[c.expiryState];
                  return (
                    <TableRow key={c.id} className={meta.row}>
                      <TableCell className="pl-6">
                        <div className="flex flex-col gap-1 items-start">
                          <VendorLink id={c.vendorId} name={c.vendorName} onVendor={onVendor} />
                          <ComplianceBadge compliance={levels.get(c.vendorId)} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium whitespace-nowrap">{c.type}</span>
                        <span className="block text-[11px] text-muted-foreground">{[c.issuingBody, c.certificateNumber].filter(Boolean).join(' · ')}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(c.expiryDate)}
                        <Badge variant="outline" className={`ml-0 mt-1 block w-fit ${meta.className}`}>{meta.label(c.daysToExpiry)}</Badge>
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {RECORD_STATUS_LABEL[c.status] || humanize(c.status)}
                        {c.verifiedBy && <span className="block text-muted-foreground">by {c.verifiedBy}</span>}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <Button variant="ghost" size="sm" className="gap-1" onClick={() => onEdit(c.id)}>
                          <Pencil className="w-3.5 h-3.5" /> {canWrite ? 'Edit' : 'View'}
                        </Button>
                      </TableCell>
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

function DisputesTable({ disputes, levels, loading, category, onClearCategory, canSettle, onSettle, onOpen, onVendor }: {
  disputes: Dispute[]; levels: Map<string, ComplianceVendor['compliance']>; loading: boolean; category: string | null;
  onClearCategory: () => void; canSettle: boolean; onSettle: (d: Dispute, action: 'resolve' | 'close') => void;
  onOpen: (id: string) => void; onVendor: (id: string) => void;
}) {
  const rows = category ? disputes.filter(d => d.category === category) : disputes;
  const categoryName = category ? (disputes.find(d => d.category === category)?.categoryLabel || humanize(category)) : null;
  return (
    <Card id="compliance-disputes" className="shadow-sm scroll-mt-20">
      <CardHeader className="pb-2 flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-base">Open disputes</CardTitle>
          <CardDescription>Compliance and high-priority disputes still open. Click a row to open it.</CardDescription>
        </div>
        {categoryName && <FilterChip label={categoryName} onClear={onClearCategory} />}
      </CardHeader>
      <CardContent className="px-0 pb-2">
        {!rows.length ? (
          <div className="px-6"><EmptyState loading={loading} text={category ? 'No open disputes in this category.' : 'No open compliance disputes.'} /></div>
        ) : (
          <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Vendor</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="text-right">Days open</TableHead>
                  {canSettle && <TableHead className="pr-6 text-right"><span className="sr-only">Actions</span></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(d => (
                  <TableRow key={d.id} className="cursor-pointer" onClick={() => onOpen(d.id)}>
                    <TableCell className="pl-6">
                      <div className="flex flex-col gap-1 items-start">
                        <VendorLink id={d.vendorId} name={d.vendorName} onVendor={onVendor} />
                        {d.vendorId && <ComplianceBadge compliance={levels.get(d.vendorId)} />}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[260px]">
                      <span className="font-medium line-clamp-2">{d.title}</span>
                      <span className="block text-[11px] text-muted-foreground">{d.disputeNumber} · {d.categoryLabel} · {humanize(d.status)}</span>
                    </TableCell>
                    <TableCell><Badge variant="outline" className={`capitalize ${PRIORITY_CLASS[d.priority] || ''}`}>{d.priority}</Badge></TableCell>
                    <TableCell className={`text-right tabular-nums ${(d.daysOpen ?? 0) > 14 ? 'text-red-600 font-medium' : ''}`}>{d.daysOpen ?? '–'}</TableCell>
                    {canSettle && (
                      <TableCell className="pr-6 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => onSettle(d, 'resolve')}>Resolve</Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs ml-1" onClick={() => onSettle(d, 'close')}>Close</Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const VENDOR_FILTER_LABEL = (f: NonNullable<VendorFilter>) => {
  switch (f.kind) {
    case 'status': return CERT_STATUS_META[f.value].label;
    case 'level': return f.value === 'green' ? 'Compliant' : f.value === 'yellow' ? 'Warning' : 'Non-compliant';
    case 'audit_due': return 'Audit due';
    case 'docs': return 'Documentation incomplete';
  }
};

function VendorsTable({ vendors, loading, filter, onClearFilter, canWrite, onAudit, onVendor }: {
  vendors: ComplianceVendor[]; loading: boolean; filter: VendorFilter; onClearFilter: () => void; canWrite: boolean;
  onAudit: (v: ComplianceVendor) => void; onVendor: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  const rank: Record<Level, number> = { red: 0, yellow: 1, green: 2 };
  const rows = vendors
    .filter(v => {
      if (!filter) return true;
      if (filter.kind === 'status') return v.certificationStatus === filter.value;
      if (filter.kind === 'level') return v.compliance.level === filter.value;
      if (filter.kind === 'audit_due') return v.auditDue;
      return !v.documentation.complete;
    })
    .filter(v => !search || v.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => rank[a.compliance.level] - rank[b.compliance.level] || a.name.localeCompare(b.name));
  return (
    <Card id="compliance-vendors" className="shadow-sm scroll-mt-20">
      <CardHeader className="pb-2 flex flex-col sm:flex-row sm:items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-base">Vendor compliance</CardTitle>
          <CardDescription>Green: compliant. Yellow: needs attention. Red: non-compliant. Hover a badge for the reasons.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {filter && <FilterChip label={VENDOR_FILTER_LABEL(filter)} onClear={onClearFilter} />}
          <Input placeholder="Search vendors" value={search} onChange={e => setSearch(e.target.value)} className="h-8 w-[180px] text-sm" />
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-2">
        {!rows.length ? (
          <div className="px-6"><EmptyState loading={loading} text="No vendors match." /></div>
        ) : (
          <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Vendor</TableHead>
                  <TableHead>Compliance</TableHead>
                  <TableHead>Certification</TableHead>
                  <TableHead>Certificates</TableHead>
                  <TableHead>Last audit</TableHead>
                  <TableHead className="text-right">Open issues</TableHead>
                  {canWrite && <TableHead className="pr-6 text-right"><span className="sr-only">Actions</span></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(v => (
                  <TableRow key={v.id}>
                    <TableCell className="pl-6">
                      <VendorLink id={v.id} name={v.name} onVendor={onVendor} />
                      <span className="block text-[11px] text-muted-foreground capitalize">{v.category} · {humanize(v.status)}</span>
                    </TableCell>
                    <TableCell><ComplianceBadge compliance={v.compliance} /></TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ background: CERT_STATUS_META[v.certificationStatus].color }} />
                        {CERT_STATUS_META[v.certificationStatus].label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[260px]">
                        {v.certifications.length ? v.certifications.map(c => (
                          <Badge key={c.id} variant="outline" className={`text-[11px] ${c.expiryState === 'expired' || c.expiryState === 'expiring' ? EXPIRY_META[c.expiryState].className : ''}`}>
                            {c.type}
                          </Badge>
                        )) : <span className="text-xs text-muted-foreground">None on file</span>}
                      </div>
                    </TableCell>
                    <TableCell className={`whitespace-nowrap text-sm ${v.auditDue ? 'text-yellow-700 font-medium' : ''}`}>
                      {v.lastAuditDate ? formatDate(v.lastAuditDate) : 'Never'}
                      {v.latestAudit && (
                        <span className="block text-[11px] font-normal text-muted-foreground">{AUDIT_RESULT_META[v.latestAudit.result].label}</span>
                      )}
                      {v.auditDue && <span className="block text-[11px] font-normal">Audit due</span>}
                    </TableCell>
                    <TableCell className={`text-right tabular-nums ${v.openIssues ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>{v.openIssues}</TableCell>
                    {canWrite && (
                      <TableCell className="pr-6 text-right">
                        <Button variant="ghost" size="sm" className="gap-1 whitespace-nowrap" onClick={() => onAudit(v)}>
                          <Plus className="w-3.5 h-3.5" /> Audit
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AuditHistory({ audits, levels, loading, periodLabel, onVendor }: {
  audits: Audit[]; levels: Map<string, ComplianceVendor['compliance']>; loading: boolean; periodLabel: string; onVendor: (id: string) => void;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2"><ClipboardCheck className="w-4 h-4" /> Audit history</CardTitle>
        <CardDescription>Audits carried out · {periodLabel}.</CardDescription>
      </CardHeader>
      <CardContent className="px-0 pb-2">
        {!audits.length ? (
          <div className="px-6"><EmptyState loading={loading} text="No audits recorded in this period." /></div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Date</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead>Findings</TableHead>
                  <TableHead className="pr-6">Next due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audits.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="pl-6 whitespace-nowrap">{formatDate(a.auditDate)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        <VendorLink id={a.vendorId} name={a.vendorName} onVendor={onVendor} />
                        <ComplianceBadge compliance={levels.get(a.vendorId)} />
                      </div>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {AUDIT_TYPES.find(t => t.id === a.auditType)?.label || humanize(a.auditType)}
                      {a.auditor && <span className="block text-[11px] text-muted-foreground">{a.auditor}</span>}
                    </TableCell>
                    <TableCell><Badge variant="outline" className={`whitespace-nowrap ${AUDIT_RESULT_META[a.result].className}`}>{AUDIT_RESULT_META[a.result].label}</Badge></TableCell>
                    <TableCell className="text-right tabular-nums">{a.score ?? '–'}</TableCell>
                    <TableCell className="max-w-[320px] text-xs text-muted-foreground"><span className="line-clamp-2">{a.findings || '–'}</span></TableCell>
                    <TableCell className="pr-6 whitespace-nowrap">{formatDate(a.nextAuditDue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------- Dialogs ----------

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function EditCertificationDialog({ cert, canWrite, onClose, onSaved }: {
  cert: Certification | null; canWrite: boolean; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({ type: '', certificate_number: '', issuing_body: '', issue_date: '', expiry_date: '', status: 'verified', notes: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!cert) return;
    setErr(null);
    setForm({
      type: cert.type,
      certificate_number: cert.certificateNumber || '',
      issuing_body: cert.issuingBody || '',
      issue_date: cert.issueDate || '',
      expiry_date: cert.expiryDate || '',
      status: cert.status,
      notes: cert.notes || '',
    });
  }, [cert]);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
  const datesInvalid = !!form.issue_date && !!form.expiry_date && form.expiry_date < form.issue_date;
  const preview = form.expiry_date ? Math.round((new Date(`${form.expiry_date}T00:00:00`).getTime() - new Date(`${todayIso()}T00:00:00`).getTime()) / 86400000) : null;

  const save = async () => {
    if (!cert) return;
    setSaving(true);
    setErr(null);
    try {
      await (complianceService.updateCertification(cert.id, form) as Promise<any>);
      toast.success(`${form.type} for ${cert.vendorName} updated.`);
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save the certificate');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!cert} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{canWrite ? 'Edit certificate' : 'Certificate'}</DialogTitle>
          <DialogDescription>{cert?.vendorName}{cert?.verifiedBy ? ` · verified by ${cert.verifiedBy}` : ''}</DialogDescription>
        </DialogHeader>
        <fieldset disabled={!canWrite || saving} className="grid grid-cols-2 gap-3">
          <div className="space-y-1 col-span-2">
            <Label htmlFor="cert-type">Certificate</Label>
            <Input id="cert-type" value={form.type} onChange={set('type')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cert-number">Certificate number</Label>
            <Input id="cert-number" value={form.certificate_number} onChange={set('certificate_number')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cert-body">Issued by</Label>
            <Input id="cert-body" value={form.issuing_body} onChange={set('issuing_body')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cert-issue">Issue date</Label>
            <Input id="cert-issue" type="date" value={form.issue_date} onChange={set('issue_date')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cert-expiry">Expiry date</Label>
            <Input id="cert-expiry" type="date" value={form.expiry_date} onChange={set('expiry_date')} />
            {preview !== null && !datesInvalid && (
              <p className={`text-[11px] ${preview < 0 ? 'text-red-600' : preview <= 30 ? 'text-yellow-700' : 'text-muted-foreground'}`}>
                {preview < 0 ? `Expired ${-preview} days ago` : `${preview} days until expiry`}
              </p>
            )}
          </div>
          <div className="space-y-1 col-span-2">
            <Label>Verification</Label>
            <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(RECORD_STATUS_LABEL) as CertRecordStatus[]).map(s => <SelectItem key={s} value={s}>{RECORD_STATUS_LABEL[s]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 col-span-2">
            <Label htmlFor="cert-notes">Notes</Label>
            <Textarea id="cert-notes" rows={2} value={form.notes} onChange={set('notes')} />
          </div>
        </fieldset>
        {datesInvalid && <p className="text-xs text-red-600">The expiry date must be after the issue date.</p>}
        {err && <p className="text-xs text-red-600">{err}</p>}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>{canWrite ? 'Cancel' : 'Close'}</Button>
          {canWrite && <Button onClick={save} disabled={saving || datesInvalid || !form.type.trim()}>{saving ? 'Saving…' : 'Save'}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RecordAuditDialog({ vendor, onClose, onSaved }: { vendor: ComplianceVendor | null; onClose: () => void; onSaved: () => void }) {
  const blank = { audit_date: todayIso(), audit_type: 'routine', auditor: '', result: 'passed', score: '', findings: '', next_audit_due: '', certification_status: '' };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { if (vendor) { setForm({ ...blank, certification_status: vendor.certificationStatus }); setErr(null); } }, [vendor]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
  const scoreInvalid = form.score !== '' && !(Number.isInteger(Number(form.score)) && Number(form.score) >= 0 && Number(form.score) <= 100);
  const dateInvalid = !form.audit_date || form.audit_date > todayIso();

  const save = async () => {
    if (!vendor) return;
    setSaving(true);
    setErr(null);
    try {
      await (complianceService.recordAudit(vendor.id, {
        ...form,
        score: form.score === '' ? null : Number(form.score),
        certification_status: form.certification_status !== vendor.certificationStatus ? form.certification_status : undefined,
      }) as Promise<any>);
      toast.success(`Audit recorded for ${vendor.name}.`);
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not record the audit');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!vendor} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record audit</DialogTitle>
          <DialogDescription>{vendor?.name}{vendor?.lastAuditDate ? ` · last audited ${formatDate(vendor.lastAuditDate)}` : ' · never audited'}</DialogDescription>
        </DialogHeader>
        <fieldset disabled={saving} className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="audit-date">Audit date</Label>
            <Input id="audit-date" type="date" max={todayIso()} value={form.audit_date} onChange={set('audit_date')} />
          </div>
          <div className="space-y-1">
            <Label>Type</Label>
            <Select value={form.audit_type} onValueChange={(v) => setForm(f => ({ ...f, audit_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{AUDIT_TYPES.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Result</Label>
            <Select value={form.result} onValueChange={(v) => setForm(f => ({ ...f, result: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(AUDIT_RESULT_META) as AuditResult[]).map(r => <SelectItem key={r} value={r}>{AUDIT_RESULT_META[r].label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="audit-score">Score (0–100)</Label>
            <Input id="audit-score" inputMode="numeric" value={form.score} onChange={set('score')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="audit-auditor">Auditor</Label>
            <Input id="audit-auditor" placeholder="You, if left blank" value={form.auditor} onChange={set('auditor')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="audit-next">Next audit due</Label>
            <Input id="audit-next" type="date" value={form.next_audit_due} onChange={set('next_audit_due')} />
          </div>
          <div className="space-y-1 col-span-2">
            <Label htmlFor="audit-findings">Findings</Label>
            <Textarea id="audit-findings" rows={3} value={form.findings} onChange={set('findings')} />
          </div>
          <div className="space-y-1 col-span-2">
            <Label>Vendor certification status</Label>
            <Select value={form.certification_status} onValueChange={(v) => setForm(f => ({ ...f, certification_status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(CERT_STATUS_META) as CertificationStatus[]).map(s => <SelectItem key={s} value={s}>{CERT_STATUS_META[s].label}</SelectItem>)}
              </SelectContent>
            </Select>
            {form.result === 'failed' && form.certification_status === 'certified' && (
              <p className="text-[11px] text-yellow-700">The audit failed but the vendor is still marked certified.</p>
            )}
          </div>
        </fieldset>
        {scoreInvalid && <p className="text-xs text-red-600">Score must be a whole number from 0 to 100.</p>}
        {err && <p className="text-xs text-red-600">{err}</p>}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving || scoreInvalid || dateInvalid}>{saving ? 'Saving…' : 'Record audit'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SettleDisputeDialog({ value, onClose, onSaved }: {
  value: { dispute: Dispute; action: 'resolve' | 'close' } | null; onClose: () => void; onSaved: () => void;
}) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { setNote(''); setErr(null); }, [value]);
  const verb = value?.action === 'close' ? 'Close' : 'Resolve';

  const save = async () => {
    if (!value) return;
    setSaving(true);
    setErr(null);
    try {
      const call = value.action === 'close' ? complianceService.closeDispute : complianceService.resolveDispute;
      await (call(value.dispute.id, note.trim() || undefined) as Promise<any>);
      toast.success(`${value.dispute.disputeNumber} ${value.action === 'close' ? 'closed' : 'resolved'}.`);
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : `Could not ${value.action} the dispute`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!value} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{verb} {value?.dispute.disputeNumber}</DialogTitle>
          <DialogDescription>{value?.dispute.title}</DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          <Label htmlFor="settle-note">{value?.action === 'close' ? 'Reason for closing' : 'Resolution'}</Label>
          <Textarea id="settle-note" rows={3} value={note} onChange={e => setNote(e.target.value)} />
        </div>
        {err && <p className="text-xs text-red-600">{err}</p>}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : verb}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
