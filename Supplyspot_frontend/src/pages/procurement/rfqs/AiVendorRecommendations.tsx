import React from 'react';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { AiVendorRecommendations } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const FIT_META: Record<AiVendorRecommendations['recommendations'][number]['fit'], { label: string; className: string }> = {
  strong: { label: 'Strong fit', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  good: { label: 'Good fit', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  possible: { label: 'Possible', className: 'bg-muted text-muted-foreground border-border' },
};

// Claude's shortlist for the RFQ, shown above the vendor list. Advisory: the buyer still ticks the vendors.
export function AiVendorRecommendationsPanel({
  result,
  loading,
  error,
  selected,
  onSelectAll,
  onDismiss,
}: {
  result: AiVendorRecommendations | null;
  loading: boolean;
  error: string | null;
  selected: string[];
  onSelectAll: (ids: string[]) => void;
  onDismiss: () => void;
}) {
  if (loading) {
    return (
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground flex items-center gap-2" aria-live="polite">
        <Sparkles className="w-4 h-4 text-primary animate-pulse" /> Claude is comparing vendors against these items…
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 flex items-start justify-between gap-3" role="alert">
        <span className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />{error}</span>
        <Button variant="ghost" size="sm" className="h-7" onClick={onDismiss}>Dismiss</Button>
      </div>
    );
  }
  if (!result) return null;
  const ids = result.recommendations.map(r => r.vendorId);
  const missing = ids.filter(id => !selected.includes(id));
  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-foreground flex items-start gap-2">
          <Sparkles className="w-4 h-4 mt-0.5 text-primary shrink-0" />
          <span>{result.summary}</span>
        </p>
        <Button variant="ghost" size="sm" className="h-7 shrink-0" onClick={onDismiss}>Hide</Button>
      </div>
      {result.recommendations.length > 0 && (
        <ul className="space-y-2">
          {result.recommendations.map(r => (
            <li key={r.vendorId} className="text-sm flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
              <span className="font-medium text-foreground shrink-0">{r.vendorName}</span>
              <Badge variant="outline" className={`w-fit shrink-0 ${FIT_META[r.fit].className}`}>{FIT_META[r.fit].label}</Badge>
              <span className="text-muted-foreground">{r.reason}</span>
            </li>
          ))}
        </ul>
      )}
      {result.cautions.length > 0 && (
        <ul className="space-y-1 text-xs text-amber-800">
          {result.cautions.map((c, i) => <li key={i} className="flex items-start gap-1.5"><AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />{c}</li>)}
        </ul>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <p className="text-xs text-muted-foreground">Suggested by Claude from vendor categories, scores and risk. Check before sending.</p>
        {ids.length > 0 && (
          <Button size="sm" variant="outline" disabled={!missing.length} onClick={() => onSelectAll(ids)}>
            {missing.length ? `Select ${missing.length === ids.length ? 'these' : 'the other'} ${missing.length} vendor${missing.length === 1 ? '' : 's'}` : 'All selected'}
          </Button>
        )}
      </div>
    </div>
  );
}
