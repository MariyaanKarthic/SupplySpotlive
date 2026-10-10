import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BarChart3, Building2, CalendarRange, ClipboardList, Download, FileSpreadsheet, FileText, GitCompare, Mail, Receipt,
  RefreshCw, ShieldCheck, Truck, Users,
} from 'lucide-react';
import { reportsService, ReportType } from '@/services/api';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '../../contexts/AuthContext';
import {
  DEFAULT_PRESET, PRESETS, Preset, Range, formatDate, presetRange, previousRange, shortRangeLabel,
} from './reports/reportKit';
import { SpendReport } from './reports/SpendReport';
import { SupplierReport } from './reports/SupplierReport';
import { DeliveryReport } from './reports/DeliveryReport';
import { PrApprovalReport } from './reports/PrApprovalReport';
import { InvoicePaymentReport } from './reports/InvoicePaymentReport';
import { ComplianceReport } from './reports/ComplianceReport';

const REPORTS: { id: ReportType; label: string; short: string; icon: React.ComponentType<{ className?: string }>; blurb: string }[] = [
  { id: 'spend', label: 'Spend Analysis', short: 'Spend', icon: BarChart3, blurb: 'Committed purchase order spend by month, vendor, category and terms' },
  { id: 'suppliers', label: 'Supplier Performance', short: 'Suppliers', icon: Users, blurb: 'Delivery, lead time, quality, price and communication by vendor' },
  { id: 'delivery', label: 'Delivery Performance', short: 'Delivery', icon: Truck, blurb: 'On-time rate, delays and their reasons for shipments due in the period' },
  { id: 'pr-approval', label: 'Purchase Requests & Approvals', short: 'PR & Approval', icon: ClipboardList, blurb: 'Request volumes, approval times, rejections and the approval queue' },
  { id: 'invoice-payment', label: 'Invoices & Payments', short: 'Invoice & Payment', icon: Receipt, blurb: 'Invoiced amounts, on-time payment, aging and outstanding by vendor' },
  { id: 'compliance', label: 'Compliance', short: 'Compliance', icon: ShieldCheck, blurb: 'Vendor certification status, audits due and expiring certificates' },
];
const isReport = (v: string | null): v is ReportType => !!v && REPORTS.some(r => r.id === v);

interface Meta { canChooseDepartment: boolean; departments: string[]; scopeLabel: string }
interface Schedule { reportType: ReportType; frequency: 'weekly' | 'monthly'; format: 'csv' | 'pdf'; email: string; filters: { period?: string; department?: string }; updatedAt: string }

export function ReportsDashboard({ onNavigate }: { onNavigate?: (view: any) => void }) {
  const { vendor: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // All filter state lives in the URL next to section=reports so a view can be shared and Back works.
  const report: ReportType = isReport(searchParams.get('report')) ? searchParams.get('report') as ReportType : 'spend';
  const presetParam = searchParams.get('period') as Preset | null;
  const preset: Preset = presetParam && PRESETS.some(p => p.id === presetParam) ? presetParam : DEFAULT_PRESET;
  const customFrom = searchParams.get('from') || '';
  const customTo = searchParams.get('to') || '';
  const range: Range = preset === 'custom' ? { from: customFrom, to: customTo } : presetRange(preset);
  const department = searchParams.get('dept') || 'all';
  const compareMode = searchParams.get('compare'); // null | 'prev' | 'custom'
  const compareRange: Range | null = compareMode === 'custom'
    ? { from: searchParams.get('cfrom') || '', to: searchParams.get('cto') || '' }
    : compareMode === 'prev' ? previousRange(range) : null;

  const updateParams = useCallback((patch: Record<string, string | null>) => {
    setSearchParams(() => {
      const next = new URLSearchParams(window.location.search);
      Object.entries(patch).forEach(([k, v]) => (v === null || v === '' ? next.delete(k) : next.set(k, v)));
      return next;
    }, { replace: true });
  }, [setSearchParams]);
  const go = useCallback((params: Record<string, string>) => setSearchParams(params), [setSearchParams]);

  const [meta, setMeta] = useState<Meta | null>(null);
  useEffect(() => {
    reportsService.getMeta().then((res: any) => setMeta(res.data)).catch(() => setMeta(null));
  }, []);
  const deptParam = meta?.canChooseDepartment && department !== 'all' ? department : '';

  const [data, setData] = useState<any>(null);
  const [previous, setPrevious] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    setPrevious(null);
    const params = { from: range.from, to: range.to, department: deptParam };
    Promise.all([
      reportsService.getReport(report, params),
      compareRange ? reportsService.getReport(report, { ...compareRange, department: deptParam }) : Promise.resolve(null),
    ])
      .then(([cur, prev]: any[]) => {
        if (cancelled) return;
        setData(cur.data);
        setPrevious(prev ? prev.data : null);
      })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load the report'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report, range.from, range.to, deptParam, compareRange?.from, compareRange?.to, reloadKey]);

  const periodLabel = shortRangeLabel(range);
  const previousLabel = compareRange ? shortRangeLabel(compareRange) : null;
  const active = REPORTS.find(r => r.id === report)!;

  // ---------- Export ----------
  const [exporting, setExporting] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const doExport = async (format: 'csv' | 'pdf') => {
    setExporting(format);
    setNotice(null);
    try {
      const { blob, fileName } = await reportsService.exportReport({ report_type: report, format, date_from: range.from, date_to: range.to, department: deptParam });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setNotice({ tone: 'error', text: err instanceof Error ? err.message : 'Export failed' });
    } finally {
      setExporting(null);
    }
  };

  // ---------- Email schedule ----------
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [emailOpen, setEmailOpen] = useState(false);
  useEffect(() => {
    reportsService.getSchedules().then((res: any) => setSchedules(res.data || [])).catch(() => setSchedules([]));
  }, []);
  const schedule = schedules.find(s => s.reportType === report) || null;

  const props = { data, previous, periodLabel, previousLabel, loading, go };

  return (
    <div className="px-6 pb-6 space-y-5 w-full max-w-full overflow-x-hidden">
      <div className="sticky top-0 bg-background/95 backdrop-blur z-20 border-b py-3 -mx-6 px-6">
        <Breadcrumb className="text-xs">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => onNavigate && onNavigate('home')} className="cursor-pointer">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Reports</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex flex-col 2xl:flex-row 2xl:items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Procurement, spending, supplier, delivery and compliance analytics · {data?.scope?.label || meta?.scopeLabel || '…'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PeriodFilter
            preset={preset}
            from={customFrom}
            to={customTo}
            label={periodLabel}
            onPreset={(p) => updateParams({ period: p === DEFAULT_PRESET ? null : p, ...(p !== 'custom' && { from: null, to: null }) })}
            onCustom={(from, to) => updateParams({ period: 'custom', from, to })}
          />
          <DepartmentFilter meta={meta} value={department} userDepartment={currentUser?.department || null} onChange={(d) => updateParams({ dept: d === 'all' ? null : d })} />
          <CompareControl
            mode={compareMode}
            range={compareRange}
            canPrevious={!!previousRange(range)}
            onChange={(mode, r) => updateParams({ compare: mode, cfrom: mode === 'custom' ? r?.from || null : null, cto: mode === 'custom' ? r?.to || null : null })}
          />
          <Button variant="outline" size="icon" onClick={() => setReloadKey(k => k + 1)} disabled={loading} aria-label="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Report categories */}
      <div className="-mx-1 overflow-x-auto">
        <div role="tablist" aria-label="Report" className="inline-flex min-w-full gap-1 rounded-lg bg-muted p-1">
          {REPORTS.map(r => {
            const Icon = r.icon;
            const selected = r.id === report;
            return (
              <button
                key={r.id}
                role="tab"
                aria-selected={selected}
                type="button"
                onClick={() => updateParams({ report: r.id === 'spend' ? null : r.id })}
                className={`flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${selected ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Icon className="w-4 h-4" />{r.short}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">{active.label}</h2>
          <p className="text-xs text-muted-foreground">
            {active.blurb} · {periodLabel}{previousLabel ? ` compared with ${previousLabel}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setEmailOpen(true)}>
            <Mail className="w-4 h-4" />{schedule ? `Emailed ${schedule.frequency}` : 'Email report'}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-2" disabled={!!exporting}>
                <Download className={`w-4 h-4 ${exporting ? 'animate-pulse' : ''}`} />{exporting ? 'Exporting…' : 'Export'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">{active.label} · {periodLabel}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => doExport('csv')} className="gap-2"><FileSpreadsheet className="w-4 h-4" />CSV (all rows)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => doExport('pdf')} className="gap-2"><FileText className="w-4 h-4" />PDF report</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {notice && (
        <p className={`text-sm ${notice.tone === 'error' ? 'text-red-600' : 'text-emerald-700'}`}>{notice.text}</p>
      )}
      {error && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <p className="text-sm text-red-700">{error}</p>
            <Button variant="outline" size="sm" onClick={() => setReloadKey(k => k + 1)}>Try again</Button>
          </CardContent>
        </Card>
      )}

      {report === 'spend' && <SpendReport {...props} />}
      {report === 'suppliers' && <SupplierReport {...props} />}
      {report === 'delivery' && <DeliveryReport {...props} />}
      {report === 'pr-approval' && <PrApprovalReport {...props} />}
      {report === 'invoice-payment' && <InvoicePaymentReport {...props} />}
      {report === 'compliance' && <ComplianceReport {...props} />}

      <EmailDialog
        open={emailOpen}
        onOpenChange={setEmailOpen}
        report={active}
        schedule={schedule}
        defaultEmail={currentUser?.email || ''}
        filters={{ period: preset, department: deptParam }}
        onSaved={(s) => {
          setSchedules(list => [...list.filter(x => x.reportType !== report), ...(s ? [s] : [])]);
          setNotice({ tone: 'ok', text: s ? `Saved: ${active.label} will be emailed ${s.frequency} to ${s.email}.` : `Stopped emailing ${active.label}.` });
        }}
      />
    </div>
  );
}

// ---------- Filters ----------

function PeriodFilter({ preset, from, to, label, onPreset, onCustom }: {
  preset: Preset; from: string; to: string; label: string; onPreset: (p: Preset) => void; onCustom: (from: string, to: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Select value={preset} onValueChange={(v) => (v === 'custom' ? setOpen(true) : onPreset(v as Preset))}>
        <SelectTrigger className="w-[150px]" aria-label="Period"><SelectValue /></SelectTrigger>
        <SelectContent>{PRESETS.map(p => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}</SelectContent>
      </Select>
      <RangePopover
        open={open}
        onOpenChange={setOpen}
        from={from}
        to={to}
        idPrefix="rep"
        trigger={(
          <Button variant="outline" className="gap-2 max-w-[250px]">
            <CalendarRange className="w-4 h-4 shrink-0" />
            <span className="truncate">{preset === 'custom' ? label : 'Date range'}</span>
          </Button>
        )}
        onApply={onCustom}
      />
    </>
  );
}

function RangePopover({ open, onOpenChange, from, to, trigger, onApply, idPrefix, requireBoth = false }: {
  open: boolean; onOpenChange: (o: boolean) => void; from: string; to: string; trigger: React.ReactNode;
  onApply: (from: string, to: string) => void; idPrefix: string; requireBoth?: boolean;
}) {
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);
  useEffect(() => { setDraftFrom(from); setDraftTo(to); }, [from, to, open]);
  const invalid = !!draftFrom && !!draftTo && draftFrom > draftTo;
  const missing = requireBoth ? !draftFrom || !draftTo : !draftFrom && !draftTo;
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor={`${idPrefix}-from`} className="text-xs">From</Label>
            <Input id={`${idPrefix}-from`} type="date" value={draftFrom} onChange={e => setDraftFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${idPrefix}-to`} className="text-xs">To</Label>
            <Input id={`${idPrefix}-to`} type="date" value={draftTo} onChange={e => setDraftTo(e.target.value)} />
          </div>
        </div>
        {invalid && <p className="text-xs text-red-600">The start date must be on or before the end date.</p>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" disabled={invalid || missing} onClick={() => { onApply(draftFrom, draftTo); onOpenChange(false); }}>Apply</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function DepartmentFilter({ meta, value, userDepartment, onChange }: {
  meta: Meta | null; value: string; userDepartment: string | null; onChange: (d: string) => void;
}) {
  if (!meta) return null;
  if (!meta.canChooseDepartment) {
    return (
      <span className="inline-flex items-center gap-1.5 h-9 rounded-md border px-3 text-sm text-muted-foreground" title={meta.scopeLabel}>
        <Building2 className="w-4 h-4" />{userDepartment ? `${userDepartment} department` : 'Your requests'}
      </span>
    );
  }
  return (
    <Select value={meta.departments.includes(value) ? value : 'all'} onValueChange={onChange}>
      <SelectTrigger className="w-[200px]" aria-label="Department">
        <Building2 className="w-4 h-4 text-muted-foreground" /><SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All departments</SelectItem>
        {meta.departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function CompareControl({ mode, range, canPrevious, onChange }: {
  mode: string | null; range: Range | null; canPrevious: boolean; onChange: (mode: string | null, range?: Range) => void;
}) {
  const [open, setOpen] = useState(false);
  const value = mode === 'custom' ? 'custom' : mode === 'prev' && canPrevious ? 'prev' : 'none';
  return (
    <>
      <Select value={value} onValueChange={(v) => (v === 'custom' ? setOpen(true) : onChange(v === 'none' ? null : v))}>
        <SelectTrigger className="w-[190px]" aria-label="Compare">
          <GitCompare className="w-4 h-4 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No comparison</SelectItem>
          <SelectItem value="prev" disabled={!canPrevious}>vs previous period</SelectItem>
          <SelectItem value="custom">vs custom period…</SelectItem>
        </SelectContent>
      </Select>
      <RangePopover
        open={open}
        onOpenChange={setOpen}
        from={mode === 'custom' ? range?.from || '' : ''}
        to={mode === 'custom' ? range?.to || '' : ''}
        idPrefix="cmp"
        requireBoth
        trigger={<span className={mode === 'custom' && range ? 'text-xs text-muted-foreground cursor-pointer hover:underline' : 'sr-only'}>{mode === 'custom' && range ? `vs ${formatDate(range.from)} – ${formatDate(range.to)}` : 'Compare period'}</span>}
        onApply={(from, to) => onChange('custom', { from, to })}
      />
    </>
  );
}

// ---------- Email preference ----------

function EmailDialog({ open, onOpenChange, report, schedule, defaultEmail, filters, onSaved }: {
  open: boolean; onOpenChange: (o: boolean) => void; report: { id: ReportType; label: string }; schedule: Schedule | null;
  defaultEmail: string; filters: { period: string; department: string }; onSaved: (s: Schedule | null) => void;
}) {
  const [frequency, setFrequency] = useState<'weekly' | 'monthly'>('weekly');
  const [format, setFormat] = useState<'csv' | 'pdf'>('pdf');
  const [email, setEmail] = useState(defaultEmail);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!open) return;
    setFrequency(schedule?.frequency || 'weekly');
    setFormat(schedule?.format || 'pdf');
    setEmail(schedule?.email || defaultEmail);
    setError(null);
  }, [open, schedule, defaultEmail]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res: any = await reportsService.saveSchedule(report.id, { frequency, format, email, filters });
      onSaved(res.data);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };
  const remove = async () => {
    setSaving(true);
    try {
      await reportsService.deleteSchedule(report.id);
      onSaved(null);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Email this report</DialogTitle>
          <DialogDescription>
            Save a preference to receive {report.label} by email with the current filters. Emails start once mail delivery is set up for SupplySpot.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">How often</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as 'weekly' | 'monthly')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly (Monday)</SelectItem>
                  <SelectItem value="monthly">Monthly (1st)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Format</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as 'csv' | 'pdf')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="report-email" className="text-xs">Send to</Label>
            <Input id="report-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com" />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {schedule ? <Button variant="ghost" className="text-red-600" disabled={saving} onClick={remove}>Stop emailing</Button> : <span />}
          <Button disabled={saving || !email} onClick={save}>{saving ? 'Saving…' : schedule ? 'Update' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
