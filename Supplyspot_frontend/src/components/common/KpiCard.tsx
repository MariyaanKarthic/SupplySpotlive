import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/components/ui/utils';

export type KpiTone = 'slate' | 'blue' | 'indigo' | 'violet' | 'cyan' | 'amber' | 'yellow' | 'emerald' | 'green' | 'red';

const TONES: Record<KpiTone, { bar: string; icon: string; ring: string; tint: string }> = {
  slate: { bar: 'bg-slate-400', icon: 'bg-slate-100 text-slate-600', ring: 'ring-slate-400/40', tint: 'bg-slate-50/70' },
  blue: { bar: 'bg-blue-500', icon: 'bg-blue-50 text-blue-600', ring: 'ring-blue-500/40', tint: 'bg-blue-50/50' },
  indigo: { bar: 'bg-indigo-500', icon: 'bg-indigo-50 text-indigo-600', ring: 'ring-indigo-500/40', tint: 'bg-indigo-50/50' },
  violet: { bar: 'bg-violet-500', icon: 'bg-violet-50 text-violet-600', ring: 'ring-violet-500/40', tint: 'bg-violet-50/50' },
  cyan: { bar: 'bg-cyan-500', icon: 'bg-cyan-50 text-cyan-600', ring: 'ring-cyan-500/40', tint: 'bg-cyan-50/50' },
  amber: { bar: 'bg-amber-500', icon: 'bg-amber-50 text-amber-600', ring: 'ring-amber-500/40', tint: 'bg-amber-50/50' },
  yellow: { bar: 'bg-yellow-500', icon: 'bg-yellow-50 text-yellow-600', ring: 'ring-yellow-500/40', tint: 'bg-yellow-50/50' },
  emerald: { bar: 'bg-emerald-500', icon: 'bg-emerald-50 text-emerald-600', ring: 'ring-emerald-500/40', tint: 'bg-emerald-50/50' },
  green: { bar: 'bg-green-500', icon: 'bg-green-50 text-green-600', ring: 'ring-green-500/40', tint: 'bg-green-50/50' },
  red: { bar: 'bg-red-500', icon: 'bg-red-50 text-red-600', ring: 'ring-red-500/40', tint: 'bg-red-50/50' },
};

/**
 * Dashboard figure tile: small uppercase label, a large number, then a muted hint.
 * Clickable when `onClick` is set (used as a filter shortcut); `active` marks the applied filter.
 */
export function KpiCard({
  label, value, suffix, hint, note, noteClassName, icon: Icon, tone = 'slate', valueClassName, loading, active, onClick, children, footer, className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  suffix?: React.ReactNode;
  hint?: React.ReactNode;
  note?: React.ReactNode;
  noteClassName?: string;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: KpiTone;
  valueClassName?: string;
  loading?: boolean;
  active?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  const t = TONES[tone];
  const body = (
    <Card className={cn(
      'relative h-full overflow-hidden shadow-sm transition-all',
      onClick && 'group-hover:shadow-md group-hover:-translate-y-px',
      active && ['ring-2', t.ring, t.tint],
      className,
    )}>
      <span aria-hidden className={cn('absolute inset-y-0 left-0 w-1', t.bar)} />
      <div className="flex h-full flex-col gap-2 p-4 pl-5">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 line-clamp-2 pt-0.5 text-[11px] font-semibold uppercase leading-snug tracking-wider text-muted-foreground">{label}</p>
          {Icon && <span className={cn('shrink-0 rounded-lg p-1.5', t.icon)}><Icon className="size-4" /></span>}
        </div>
        {loading ? (
          <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
        ) : (
          <p className={cn('truncate text-2xl xl:text-[1.75rem] font-semibold leading-tight tracking-tight tabular-nums text-foreground', valueClassName)}>
            {value}
            {suffix && <span className="ml-0.5 text-sm font-medium tracking-normal text-muted-foreground">{suffix}</span>}
          </p>
        )}
        {children}
        {(hint || note) && (
          <div className="mt-auto space-y-0.5">
            {hint && <p className="truncate text-xs text-muted-foreground" title={typeof hint === 'string' ? hint : undefined}>{hint}</p>}
            {note && <p className={cn('truncate text-xs', noteClassName || 'text-amber-700')} title={typeof note === 'string' ? note : undefined}>{note}</p>}
          </div>
        )}
        {footer}
      </div>
    </Card>
  );
  return onClick ? (
    <button type="button" onClick={onClick} aria-pressed={active}
      className="group h-full w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {body}
    </button>
  ) : <div className="h-full">{body}</div>;
}
