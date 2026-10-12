import React from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/components/ui/utils';

export type SortDir = 'asc' | 'desc';
export interface SortState<K extends string> { key: K; dir: SortDir }

/** Arrow showing whether a column is sorted, and which way. */
export function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown className="size-3.5 text-muted-foreground/50 group-hover/sort:text-muted-foreground" />;
  return dir === 'asc' ? <ArrowUp className="size-3.5 text-primary" /> : <ArrowDown className="size-3.5 text-primary" />;
}

/** Table header cell with a sort button. Works inside plain <table> and the ui/table component. */
export function SortableHeader<K extends string>({ k, label, sort, onSort, align, className }: {
  k: K; label: React.ReactNode; sort: SortState<K>; onSort: (k: K) => void; align?: 'left' | 'right'; className?: string;
}) {
  const active = sort.key === k;
  return (
    <th className={cn('h-10 px-3 font-medium text-muted-foreground whitespace-nowrap align-middle', align === 'right' ? 'text-right' : 'text-left', className)}
      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" onClick={() => onSort(k)}
        className={cn('group/sort inline-flex items-center gap-1 rounded px-1 -mx-1 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          active && 'text-foreground', align === 'right' && 'flex-row-reverse')}>
        {label}
        <SortIndicator active={active} dir={sort.dir} />
      </button>
    </th>
  );
}

/** Generic client-side sort helper for list pages. */
export function sortRows<T>(rows: T[], get: (row: T) => unknown, dir: SortDir): T[] {
  const out = [...rows];
  out.sort((a, b) => {
    const av = get(a) ?? '';
    const bv = get(b) ?? '';
    const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv), undefined, { numeric: true });
    return dir === 'asc' ? cmp : -cmp;
  });
  return out;
}
