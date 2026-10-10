// Shared pieces for the Reports dashboard: periods, number formatting, colours, KPI tiles and cards.
import React from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '../../procurement/purchase-orders/poModel';

export { formatDate };

// ---------- Periods ----------

export type Preset = 'this_month' | 'last_month' | 'this_quarter' | 'last_quarter' | 'this_year' | 'last_year' | 'all' | 'custom';
export const PRESETS: { id: Preset; label: string }[] = [
  { id: 'this_month', label: 'This month' },
  { id: 'last_month', label: 'Last month' },
  { id: 'this_quarter', label: 'This quarter' },
  { id: 'last_quarter', label: 'Last quarter' },
  { id: 'this_year', label: 'This year' },
  { id: 'last_year', label: 'Last year' },
  { id: 'all', label: 'All time' },
  { id: 'custom', label: 'Custom range' },
];
export const DEFAULT_PRESET: Preset = 'this_year';

export interface Range { from: string; to: string }

export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parse = (s: string) => new Date(`${s}T00:00:00`);

export function presetRange(preset: Preset): Range {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const q = Math.floor(m / 3) * 3;
  switch (preset) {
    case 'this_month': return { from: iso(new Date(y, m, 1)), to: iso(new Date(y, m + 1, 0)) };
    case 'last_month': return { from: iso(new Date(y, m - 1, 1)), to: iso(new Date(y, m, 0)) };
    case 'this_quarter': return { from: iso(new Date(y, q, 1)), to: iso(new Date(y, q + 3, 0)) };
    case 'last_quarter': return { from: iso(new Date(y, q - 3, 1)), to: iso(new Date(y, q, 0)) };
    case 'this_year': return { from: `${y}-01-01`, to: `${y}-12-31` };
    case 'last_year': return { from: `${y - 1}-01-01`, to: `${y - 1}-12-31` };
    default: return { from: '', to: '' };
  }
}

/**
 * The period just before `range`, for comparisons: the previous month, quarter or year when the range is a
 * whole one of those, otherwise a stretch of the same length ending the day before. Null for open ranges.
 */
export function previousRange(range: Range): Range | null {
  if (!range.from || !range.to) return null;
  const from = parse(range.from);
  const to = parse(range.to);
  const nextDay = new Date(to.getFullYear(), to.getMonth(), to.getDate() + 1);
  const wholeMonths = from.getDate() === 1 && nextDay.getDate() === 1;
  if (wholeMonths) {
    const months = (nextDay.getFullYear() - from.getFullYear()) * 12 + nextDay.getMonth() - from.getMonth();
    return { from: iso(new Date(from.getFullYear(), from.getMonth() - months, 1)), to: iso(new Date(from.getFullYear(), from.getMonth(), 0)) };
  }
  const days = Math.round((to.getTime() - from.getTime()) / 86400000) + 1;
  return { from: iso(new Date(from.getFullYear(), from.getMonth(), from.getDate() - days)), to: iso(new Date(from.getFullYear(), from.getMonth(), from.getDate() - 1)) };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// Short name for a range: "Oct 2026", "Q3 2026", "2026", or "1 Jan – 15 Feb 2026".
export function shortRangeLabel(range: Range | null) {
  if (!range || (!range.from && !range.to)) return 'All time';
  if (!range.from) return `Up to ${formatDate(range.to)}`;
  if (!range.to) return `From ${formatDate(range.from)}`;
  const from = parse(range.from);
  const to = parse(range.to);
  const nextDay = new Date(to.getFullYear(), to.getMonth(), to.getDate() + 1);
  if (from.getDate() === 1 && nextDay.getDate() === 1) {
    const months = (nextDay.getFullYear() - from.getFullYear()) * 12 + nextDay.getMonth() - from.getMonth();
    if (months === 1) return `${MONTHS[from.getMonth()]} ${from.getFullYear()}`;
    if (months === 3 && from.getMonth() % 3 === 0) return `Q${from.getMonth() / 3 + 1} ${from.getFullYear()}`;
    if (months === 12 && from.getMonth() === 0) return String(from.getFullYear());
  }
  return `${formatDate(range.from)} – ${formatDate(range.to)}`;
}

// ---------- Numbers ----------

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
export const formatInr = (n: number | null | undefined) => (n === null || n === undefined ? '–' : inr.format(n));
// Indian short scale for axes: ₹1.2 Cr, ₹4.5 L, ₹80 K.
export function formatInrCompact(n: number) {
  const v = Math.abs(n || 0);
  const short = (x: number) => String(Math.round(x * 10) / 10);
  if (v >= 1e7) return `₹${short(n / 1e7)} Cr`;
  if (v >= 1e5) return `₹${short(n / 1e5)} L`;
  if (v >= 1e3) return `₹${short(n / 1e3)} K`;
  return inr.format(n || 0);
}
export function formatAny(amount: number, currency: string) {
  if (!currency || currency === 'INR') return formatInr(amount);
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString('en-IN')}`;
  }
}
export const formatPct = (n: number | null | undefined) => (n === null || n === undefined ? '–' : `${n}%`);
export const formatDays = (n: number | null | undefined) => (n === null || n === undefined ? '–' : `${n} day${Math.abs(n) === 1 ? '' : 's'}`);
export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
export interface OtherCurrency { currency: string; amount: number; count: number }
export const othersNote = (others?: OtherCurrency[]) =>
  others && others.length ? `Plus ${others.map(o => formatAny(o.amount, o.currency)).join(', ')} not in INR` : null;
export const titleCase = (s: string) => s.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
export const truncate = (s: string, n = 22) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

// ---------- Colours (same palette as the Finance dashboard) ----------

export const C = {
  blue: '#3b82f6',
  green: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  slate: '#94a3b8',
  violet: '#8b5cf6',
  cyan: '#06b6d4',
};
export const SERIES = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#84cc16', '#64748b', '#f97316'];
// Rating 1–5 → red … green.
export function ratingColor(rating: number | null) {
  if (!rating) return C.slate;
  if (rating >= 4.5) return '#059669';
  if (rating >= 4) return C.green;
  if (rating >= 3.5) return C.amber;
  if (rating >= 3) return '#f97316';
  return C.red;
}

// ---------- Report props ----------

export type Go = (params: Record<string, string>) => void;
export interface ReportProps<T> {
  data: T | null;
  previous: T | null; // the comparison period, when comparing
  periodLabel: string;
  previousLabel: string | null;
  loading: boolean;
  go: Go;
}

// ---------- KPI tiles ----------

export interface KpiSpec {
  id: string;
  label: string;
  value: string;
  sub?: string | null;
  note?: string | null;
  icon: React.ComponentType<{ className?: string }>;
  tone: 'blue' | 'green' | 'amber' | 'red' | 'violet' | 'slate';
  // Comparison: the same figure for the previous period, and whether higher is better.
  current?: number | null;
  previous?: number | null;
  previousText?: string;
  better?: 'up' | 'down';
  onClick?: () => void;
}

const TONES: Record<KpiSpec['tone'], string> = {
  blue: 'border-l-blue-500 [&_.kpi-icon]:bg-blue-50 [&_.kpi-icon]:text-blue-600',
  green: 'border-l-emerald-500 [&_.kpi-icon]:bg-emerald-50 [&_.kpi-icon]:text-emerald-600',
  amber: 'border-l-amber-500 [&_.kpi-icon]:bg-amber-50 [&_.kpi-icon]:text-amber-600',
  red: 'border-l-red-500 [&_.kpi-icon]:bg-red-50 [&_.kpi-icon]:text-red-600',
  violet: 'border-l-violet-500 [&_.kpi-icon]:bg-violet-50 [&_.kpi-icon]:text-violet-600',
  slate: 'border-l-slate-400 [&_.kpi-icon]:bg-slate-100 [&_.kpi-icon]:text-slate-600',
};

function Delta({ k, previousLabel }: { k: KpiSpec; previousLabel: string }) {
  const cur = k.current;
  const prev = k.previous;
  let change: number | null = null;
  if (cur !== null && cur !== undefined && prev !== null && prev !== undefined) {
    change = prev === 0 ? (cur === 0 ? 0 : null) : Math.round(((cur - prev) / Math.abs(prev)) * 1000) / 10;
  }
  const up = change !== null && change > 0;
  const flat = change === 0;
  const good = change === null || flat ? null : (up ? k.better !== 'down' : k.better === 'down');
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="mt-2 pt-2 border-t border-dashed flex items-center justify-between gap-2 text-[11px]">
      <span className="text-muted-foreground truncate">{previousLabel}: <span className="font-medium text-foreground">{k.previousText ?? '–'}</span></span>
      {change !== null ? (
        <span className={`flex items-center gap-0.5 font-medium shrink-0 ${good === null ? 'text-muted-foreground' : good ? 'text-emerald-600' : 'text-red-600'}`}>
          <Icon className="w-3 h-3" />{Math.abs(change)}%
        </span>
      ) : (cur !== null && cur !== undefined && prev === 0 && cur !== 0 ? <span className="text-muted-foreground shrink-0">new</span> : null)}
    </div>
  );
}

export function KpiRow({ kpis, loading, hasData, previousLabel }: { kpis: KpiSpec[]; loading: boolean; hasData: boolean; previousLabel: string | null }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${kpis.length === 3 ? 'xl:grid-cols-3' : 'xl:grid-cols-4'} gap-3`}>
      {kpis.map(k => {
        const Icon = k.icon;
        const body = (
          <Card className={`border-l-4 shadow-sm h-full ${TONES[k.tone]} ${k.onClick ? 'hover:shadow-md transition-all' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="text-xs text-muted-foreground font-medium truncate">{k.label}</p>
                  <p className={`text-2xl font-bold tabular-nums truncate ${loading && !hasData ? 'animate-pulse text-muted-foreground' : 'text-foreground'}`}>{k.value}</p>
                  {k.sub && <p className="text-[11px] text-muted-foreground truncate" title={k.sub}>{k.sub}</p>}
                  {k.note && <p className="text-[11px] text-amber-700 truncate" title={k.note}>{k.note}</p>}
                </div>
                <div className="kpi-icon rounded-lg p-2 shrink-0"><Icon className="w-5 h-5" /></div>
              </div>
              {previousLabel && <Delta k={k} previousLabel={previousLabel} />}
            </CardContent>
          </Card>
        );
        return k.onClick ? (
          <button key={k.id} type="button" onClick={k.onClick} className="text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{body}</button>
        ) : <div key={k.id}>{body}</div>;
      })}
    </div>
  );
}

// ---------- Cards ----------

export function ReportCard({ title, description, className, action, children, bodyClassName }: {
  title: string; description?: React.ReactNode; className?: string; action?: React.ReactNode; children: React.ReactNode; bodyClassName?: string;
}) {
  return (
    <Card className={`shadow-sm min-w-0 ${className || ''}`}>
      <CardHeader className="pb-2 flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0">
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription className="mt-1">{description}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardContent className={bodyClassName}>{children}</CardContent>
    </Card>
  );
}

export function EmptyState({ loading, text, height = 220 }: { loading: boolean; text: string; height?: number }) {
  return loading
    ? <div className="rounded-lg bg-muted animate-pulse" style={{ height }} />
    : <div className="flex items-center justify-center text-sm text-muted-foreground text-center px-4" style={{ height: Math.min(height, 160) }}>{text}</div>;
}

// Legend list next to a pie: coloured swatch, name, value; rows are buttons when clickable.
export function PieLegend({ rows, format, onClick }: {
  rows: { key: string; name: string; value: number; color: string; extra?: string }[];
  format?: (v: number) => string;
  onClick?: (key: string) => void;
}) {
  return (
    <ul className="flex-1 w-full space-y-1">
      {rows.map(r => {
        const inner = (
          <>
            <span className="flex items-center gap-2 min-w-0">
              <span className="h-2.5 w-2.5 rounded-[2px] shrink-0" style={{ background: r.color }} />
              <span className="truncate" title={r.name}>{r.name}</span>
            </span>
            <span className="flex items-baseline gap-3 tabular-nums shrink-0">
              {r.extra && <span className="text-xs text-muted-foreground">{r.extra}</span>}
              <span className="font-medium">{format ? format(r.value) : r.value}</span>
            </span>
          </>
        );
        return (
          <li key={r.key}>
            {onClick ? (
              <button type="button" onClick={() => onClick(r.key)} className="w-full flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60 text-left">{inner}</button>
            ) : <div className="w-full flex items-center justify-between gap-3 px-2 py-1.5 text-sm">{inner}</div>}
          </li>
        );
      })}
    </ul>
  );
}

// Clickable text used in tables for drill-down.
export function LinkText({ onClick, children, className }: { onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); onClick(); }} className={`text-left hover:underline underline-offset-2 text-foreground ${className || ''}`}>
      {children}
    </button>
  );
}
