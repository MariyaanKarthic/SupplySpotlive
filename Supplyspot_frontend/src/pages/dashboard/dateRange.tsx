import React, { useEffect, useState } from 'react';
import { CalendarRange, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate } from '../procurement/purchase-orders/poModel';

// Period presets and the date filter shared by the Finance and Compliance dashboards.

export type Preset = 'this_month' | 'last_month' | 'this_quarter' | 'this_year' | 'last_12_months' | 'all' | 'custom';
export const PRESETS: { id: Preset; label: string }[] = [
  { id: 'this_month', label: 'This month' },
  { id: 'last_month', label: 'Last month' },
  { id: 'this_quarter', label: 'This quarter' },
  { id: 'this_year', label: 'This year' },
  { id: 'last_12_months', label: 'Last 12 months' },
  { id: 'all', label: 'All time' },
  { id: 'custom', label: 'Custom range' },
];

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function presetRange(preset: Preset): { from: string; to: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (preset) {
    case 'this_month': return { from: iso(new Date(y, m, 1)), to: iso(new Date(y, m + 1, 0)) };
    case 'last_month': return { from: iso(new Date(y, m - 1, 1)), to: iso(new Date(y, m, 0)) };
    case 'this_quarter': {
      const q = Math.floor(m / 3) * 3;
      return { from: iso(new Date(y, q, 1)), to: iso(new Date(y, q + 3, 0)) };
    }
    case 'this_year': return { from: `${y}-01-01`, to: `${y}-12-31` };
    case 'last_12_months': return { from: iso(new Date(y, m - 11, 1)), to: iso(new Date(y, m + 1, 0)) };
    default: return { from: '', to: '' };
  }
}

export function rangeLabel(preset: Preset, from: string, to: string) {
  if (preset !== 'custom') return PRESETS.find(p => p.id === preset)!.label;
  if (from && to) return `${formatDate(from)} – ${formatDate(to)}`;
  if (from) return `From ${formatDate(from)}`;
  if (to) return `Up to ${formatDate(to)}`;
  return 'All time';
}

export function DateFilter({ preset, from, to, label, loading, onPreset, onCustom, onRefresh }: {
  preset: Preset; from: string; to: string; label: string; loading: boolean;
  onPreset: (p: Preset) => void; onCustom: (from: string, to: string) => void; onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);
  useEffect(() => { setDraftFrom(from); setDraftTo(to); }, [from, to]);
  const invalid = !!draftFrom && !!draftTo && draftFrom > draftTo;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={preset}
        onValueChange={(v) => {
          if (v === 'custom') setOpen(true);
          else onPreset(v as Preset);
        }}
      >
        <SelectTrigger className="w-[160px]" aria-label="Period"><SelectValue /></SelectTrigger>
        <SelectContent>
          {PRESETS.map(p => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2 max-w-[260px]">
            <CalendarRange className="w-4 h-4 shrink-0" />
            <span className="truncate">{preset === 'custom' ? label : 'Date range'}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="period-from" className="text-xs">From</Label>
              <Input id="period-from" type="date" value={draftFrom} onChange={e => setDraftFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="period-to" className="text-xs">To</Label>
              <Input id="period-to" type="date" value={draftTo} onChange={e => setDraftTo(e.target.value)} />
            </div>
          </div>
          {invalid && <p className="text-xs text-red-600">The start date must be on or before the end date.</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" disabled={invalid || (!draftFrom && !draftTo)} onClick={() => { onCustom(draftFrom, draftTo); setOpen(false); }}>
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <Button variant="outline" size="icon" onClick={onRefresh} disabled={loading} aria-label="Refresh">
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
}
