import React, { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
  Star,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  History,
  Info,
} from 'lucide-react';
import { vendorService } from '@/services/api';

export type VendorPanelTab = 'performance' | 'analytics' | 'scoring' | 'insights' | 'actions';

export const formatINR = (amount: number | null | undefined) =>
  amount === null || amount === undefined
    ? '—'
    : Number(amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export const formatScore = (score: number | null | undefined, suffix = '') =>
  score === null || score === undefined ? '—' : `${score}${suffix}`;

export const scoreColor = (score: number | null | undefined) => {
  if (score === null || score === undefined) return 'text-muted-foreground';
  if (score >= 85) return 'text-green-600';
  if (score >= 70) return 'text-yellow-600';
  return 'text-red-600';
};

export const gradeVariant = (grade: string) => {
  switch (grade) {
    case 'Excellent': return 'default';
    case 'Satisfactory': return 'secondary';
    case 'Needs Improvement': return 'destructive';
    default: return 'outline';
  }
};

export const riskVariant = (risk: string) => {
  switch (risk) {
    case 'High': return 'destructive';
    case 'Medium': return 'secondary';
    default: return 'outline';
  }
};

export const priorityColor = (priority: string) => {
  switch (priority) {
    case 'High': return 'text-red-600';
    case 'Medium': return 'text-yellow-600';
    default: return 'text-green-600';
  }
};

function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <Card className="p-4 gap-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-lg font-semibold">{value}</div>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </Card>
  );
}

function Rows({ title, rows }: { title: string; rows: [string, React.ReactNode][] }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">{title}</h4>
      <Card className="divide-y gap-0 py-0">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium text-right">{value ?? '—'}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
      <Info className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

interface VendorPerformancePanelProps {
  vendorId: string;
  tab: VendorPanelTab;
  onTabChange: (tab: VendorPanelTab) => void;
}

export function VendorPerformancePanel({ vendorId, tab, onTabChange }: VendorPerformancePanelProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await vendorService.getVendorPerformance(vendorId);
      if (res?.success) setData(res.data);
      else setError(res?.error || 'Could not load vendor performance');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load vendor performance');
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => { setData(null); load(); }, [load]);

  if (loading && !data) return <p className="text-sm text-muted-foreground">Loading vendor performance...</p>;
  if (error) return <p className="text-sm text-destructive">⚠ {error}</p>;
  if (!data) return null;

  const { performance, analytics, scoring, insights, actions } = data;
  const noTransactions = !analytics.hasTransactions;

  return (
    <Tabs value={tab} onValueChange={(v) => onTabChange(v as VendorPanelTab)} className="space-y-4">
      <TabsList className="w-full grid grid-cols-5">
        <TabsTrigger value="performance" className="text-[11px] px-1">Performance</TabsTrigger>
        <TabsTrigger value="analytics" className="text-[11px] px-1">Analytics</TabsTrigger>
        <TabsTrigger value="scoring" className="text-[11px] px-1">Scoring</TabsTrigger>
        <TabsTrigger value="insights" className="text-[11px] px-1">Insights</TabsTrigger>
        <TabsTrigger value="actions" className="text-[11px] px-1">Actions</TabsTrigger>
      </TabsList>

      {/* ── Performance ── */}
      <TabsContent value="performance" className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Total Spend" value={formatINR(performance.totalSpend)} />
          <Stat label="Contracts" value={performance.contracts} hint={`Avg ${formatINR(performance.averageContractValue)} per contract`} />
          <Stat
            label="Average Rating"
            value={
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                {performance.rating ? `${performance.rating} / 5` : 'Not rated yet'}
              </span>
            }
          />
          <Stat
            label="Compliance Status"
            value={
              <Badge variant={performance.complianceStatus === 'Compliant' ? 'default' : performance.complianceStatus === 'Partially Compliant' ? 'secondary' : 'destructive'}>
                {performance.complianceStatus}
              </Badge>
            }
            hint={`${performance.complianceScore}/100 compliance score`}
          />
        </div>
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Overall Score</p>
            <p className={`text-sm font-semibold ${scoreColor(scoring.overall)}`}>{formatScore(scoring.overall, ' / 100')}</p>
          </div>
          <Progress value={scoring.overall || 0} />
          <div className="flex items-center gap-2">
            <Badge variant={gradeVariant(scoring.grade) as any}>{scoring.grade}</Badge>
            <Badge variant={riskVariant(scoring.riskLevel) as any}>{scoring.riskLevel} risk</Badge>
          </div>
        </Card>
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Compliance Checks</h4>
          <Card className="divide-y gap-0 py-0">
            {performance.complianceChecks.map((c: any) => (
              <div key={c.key} className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
                <span className="flex items-center gap-2">
                  {c.passed ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                  {c.label}
                </span>
                <span className="text-xs text-muted-foreground">{c.detail || `${c.weight} pts`}</span>
              </div>
            ))}
          </Card>
        </div>
        <Rows title="Relationship" rows={[
          ['Vendor Since', performance.onboardDate || '—'],
          ['Tenure', performance.tenureMonths !== null ? `${Math.floor(performance.tenureMonths / 12)}y ${performance.tenureMonths % 12}m` : '—'],
        ]} />
      </TabsContent>

      {/* ── Analytics ── */}
      <TabsContent value="analytics" className="space-y-4">
        {noTransactions && (
          <EmptyNote>No purchase orders, invoices, quotations or disputes are recorded for this vendor yet. Order, delivery and invoice figures will fill in as they are created.</EmptyNote>
        )}
        <div>
          <h4 className="text-sm font-semibold mb-2">Order Trend (last 6 months)</h4>
          <Card className="p-4">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="orders" name="Purchase orders" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="invoices" name="Invoices" fill="#10b981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        <Rows title="Orders" rows={[
          ['Purchase Orders', analytics.orders.total],
          ['Open', analytics.orders.open],
          ['Received', analytics.orders.received],
          ['Overdue', analytics.orders.overdue],
          ['Order Value', formatINR(analytics.orders.totalValue)],
          ['Average Order Value', formatINR(analytics.orders.averageValue)],
        ]} />
        <Rows title="Delivery" rows={[
          ['On-Time Delivery Rate', formatScore(analytics.delivery.onTimeRate, '%')],
          ['Delivered On Time', analytics.delivery.onTime],
          ['Delivered Late', analytics.delivery.late],
          ['PO Acknowledgement Rate', formatScore(analytics.delivery.acknowledgementRate, '%')],
        ]} />
        <Rows title="Quality" rows={[
          ['Rating', analytics.quality.rating ? `${analytics.quality.rating} / 5` : 'Not rated'],
          ['Disputes', analytics.quality.disputes],
          ['Open Disputes', analytics.quality.openDisputes],
          ['Dispute Rate', formatScore(analytics.quality.disputeRate, '%')],
          ['Rejected Invoices', analytics.quality.rejectedInvoices],
        ]} />
        <Rows title="Cost" rows={[
          ['Total Spend', formatINR(analytics.cost.totalSpend)],
          ['Average Contract Value', formatINR(analytics.cost.averageContractValue)],
          ['Share of Category Spend', formatScore(analytics.cost.categorySpendShare, '%')],
          ['Category Spend Rank', analytics.cost.categorySpendRank ? `#${analytics.cost.categorySpendRank} of ${analytics.cost.categoryVendorCount}` : '—'],
          ['Category Average Spend', formatINR(analytics.cost.categoryAverageSpend)],
          ['Category Average Rating', formatScore(analytics.cost.categoryAverageRating)],
          ['Invoiced / Paid', `${formatINR(analytics.cost.invoicedTotal)} / ${formatINR(analytics.cost.paidTotal)}`],
          ['Invoice-PO Match Rate', formatScore(analytics.cost.invoiceMatchRate, '%')],
          ['Average Days to Pay', formatScore(analytics.cost.averagePaymentDays)],
          ['Quotations / RFQs Won', `${analytics.cost.quotations} / ${analytics.cost.rfqsWon}`],
        ]} />
      </TabsContent>

      {/* ── Scoring ── */}
      <TabsContent value="scoring" className="space-y-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Weighted Score</p>
            <p className={`text-2xl font-bold ${scoreColor(scoring.overall)}`}>{formatScore(scoring.overall, ' / 100')}</p>
          </div>
          <Badge variant={gradeVariant(scoring.grade) as any}>{scoring.grade}</Badge>
        </Card>
        <div className="space-y-3">
          {scoring.kpis.map((k: any) => (
            <Card key={k.key} className="p-4 gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{k.label} <span className="text-xs text-muted-foreground">({k.weight}%)</span></p>
                <p className={`text-sm font-semibold ${scoreColor(k.score)}`}>{formatScore(k.score)}</p>
              </div>
              <Progress value={k.score || 0} />
              <p className="text-[11px] text-muted-foreground">{k.basis}</p>
            </Card>
          ))}
        </div>
        {noTransactions && (
          <EmptyNote>Delivery, quality, cost and responsiveness use this vendor's rating until purchase orders and invoices are recorded; compliance uses the vendor's verification records.</EmptyNote>
        )}
      </TabsContent>

      {/* ── Insights ── */}
      <TabsContent value="insights" className="space-y-4">
        <Card className="p-4 text-sm">{insights.summary}</Card>
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-600" /> Strengths</h4>
          <Card className="divide-y gap-0 py-0">
            {insights.strengths.length ? insights.strengths.map((s: string) => (
              <div key={s} className="flex items-center gap-2 px-4 py-2.5 text-sm"><CheckCircle className="w-4 h-4 text-green-600 shrink-0" />{s}</div>
            )) : <div className="px-4 py-2.5 text-sm text-muted-foreground">No standout strengths yet.</div>}
          </Card>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2"><Lightbulb className="w-4 h-4 text-yellow-600" /> Areas for Improvement</h4>
          <Card className="divide-y gap-0 py-0">
            {insights.improvements.length ? insights.improvements.map((s: string) => (
              <div key={s} className="flex items-center gap-2 px-4 py-2.5 text-sm"><AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0" />{s}</div>
            )) : <div className="px-4 py-2.5 text-sm text-muted-foreground">Nothing flagged.</div>}
          </Card>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            Risk <Badge variant={riskVariant(insights.riskLevel) as any}>{insights.riskLevel}</Badge>
          </h4>
          {insights.riskReasons.length ? (
            <Card className="divide-y gap-0 py-0">
              {insights.riskReasons.map((r: string) => (
                <div key={r} className="px-4 py-2.5 text-sm">{r}</div>
              ))}
            </Card>
          ) : <p className="text-sm text-muted-foreground">No risk factors found.</p>}
        </div>
      </TabsContent>

      {/* ── Actions ── */}
      <TabsContent value="actions" className="space-y-4">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Recommended Actions</h4>
          <Card className="divide-y gap-0 py-0">
            {actions.recommended.length ? actions.recommended.map((a: any) => (
              <div key={a.title} className="px-4 py-3 text-sm space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{a.title}</span>
                  <span className={`text-xs font-semibold ${priorityColor(a.priority)}`}>{a.priority}</span>
                </div>
                <p className="text-xs text-muted-foreground">{a.category} · {a.reason}</p>
              </div>
            )) : <div className="px-4 py-3 text-sm text-muted-foreground">No actions needed right now.</div>}
          </Card>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2"><History className="w-4 h-4" /> Activity History</h4>
          <Card className="divide-y gap-0 py-0">
            {actions.history.length ? actions.history.map((h: any, i: number) => (
              <div key={`${h.date}-${i}`} className="flex items-start justify-between gap-4 px-4 py-2.5 text-sm">
                <div>
                  <p className="font-medium">{h.description}</p>
                  <p className="text-xs text-muted-foreground">{h.type}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{h.date}</span>
              </div>
            )) : <div className="px-4 py-2.5 text-sm text-muted-foreground">No activity recorded.</div>}
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
