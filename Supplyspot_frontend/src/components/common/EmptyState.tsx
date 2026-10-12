import React from 'react';
import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/components/ui/utils';

interface EmptyAction {
  label: string;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
}

/**
 * Friendly placeholder for an empty list. Use `filtered` when rows exist but the filters hide them all;
 * it switches to a "no matches" look with a clear-filters button.
 */
export function EmptyState({ icon: Icon, title, description, action, secondaryAction, filtered, onClearFilters, compact, className }: {
  icon?: React.ComponentType<{ className?: string }>;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: EmptyAction | null;
  secondaryAction?: EmptyAction | null;
  filtered?: boolean;
  onClearFilters?: () => void;
  compact?: boolean;
  className?: string;
}) {
  const Shown = filtered ? SearchX : Icon;
  const actions = filtered
    ? (onClearFilters ? [{ label: 'Clear filters', onClick: onClearFilters, variant: 'outline' as const }] : [])
    : [action, secondaryAction].filter(Boolean) as EmptyAction[];
  return (
    <div className={cn('flex flex-col items-center justify-center text-center px-6', compact ? 'py-8' : 'py-14', className)}>
      {Shown && (
        <div className={cn('flex items-center justify-center rounded-full mb-4', compact ? 'size-11' : 'size-14',
          filtered ? 'bg-muted text-muted-foreground' : 'bg-primary/5 text-primary/70 ring-8 ring-primary/[0.03]')}>
          <Shown className={compact ? 'size-5' : 'size-6'} />
        </div>
      )}
      <p className="text-base font-semibold text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>}
      {actions.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {actions.map((a, i) => {
            const AIcon = a.icon;
            return (
              <Button key={a.label} variant={a.variant ?? (i === 0 ? 'default' : 'outline')} onClick={a.onClick} className="gap-2">
                {AIcon && <AIcon className="size-4" />}{a.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** EmptyState wrapped in a full-width table row. */
export function EmptyTableRow({ colSpan, ...props }: React.ComponentProps<typeof EmptyState> & { colSpan: number }) {
  return (
    <tr className="hover:bg-transparent">
      <td colSpan={colSpan} className="p-0"><EmptyState {...props} /></td>
    </tr>
  );
}
