import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Award, Clock, RefreshCw, Scale, Star, TrendingDown, XCircle } from 'lucide-react';
import { rfqService } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Comparison, ComparisonColumn, QUOTATION_STATUS_META, RFQ, formatDate, formatMoney } from './rfqModel';

const pct = (part: number, whole: number) => (whole ? `${part > 0 ? '+' : ''}${((part / whole) * 100).toFixed(1)}%` : '');

// Side-by-side table of an RFQ's quotations: one column per vendor, one row per item, then totals and terms.
export function QuotationComparison({
  rfq,
  canDecide,
  busyId,
  refreshKey,
  onAccept,
  onReject,
}: {
  rfq: RFQ;
  canDecide: boolean;
  busyId: string | null;
  refreshKey: number;
  onAccept: (quotationId: string) => void;
  onReject: (quotationId: string) => void;
}) {
  const [data, setData] = useState<Comparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hideRejected, setHideRejected] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await rfqService.getComparison(rfq.id);
      setData(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the comparison');
    } finally {
      setLoading(false);
    }
  }, [rfq.id]);

  useEffect(() => { load(); }, [load, refreshKey]);

  if (loading && !data) {
    return <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 rounded bg-muted animate-pulse" />)}</div>;
  }
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive flex items-center justify-between gap-3" role="alert">
        <span>{error}</span>
        <Button size="sm" variant="outline" onClick={load}>Try again</Button>
      </div>
    );
  }
  if (!data) return null;

  const rejectedCount = data.columns.filter(c => c.status === 'rejected').length;
  const columns = data.columns.filter(c => !(hideRejected && c.status === 'rejected'));
  const currency = data.rfq.currency;
  const budget = data.rfq.budget;
  const lowest = data.columns.find(c => c.id === data.summary.lowestTotalId) || null;
  const awardedId = data.rfq.awarded_quotation_id;
  const decidable = canDecide && ['quotations_received', 'under_review'].includes(rfq.status);

  if (!data.columns.length) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center">
        <Scale className="w-10 h-10 mx-auto text-muted-foreground/40" />
        <p className="mt-3 font-medium text-foreground">Nothing to compare yet</p>
        <p className="text-sm text-muted-foreground">The comparison fills in as vendors' quotations are recorded.</p>
      </div>
    );
  }

  const cellTone = (c: ComparisonColumn) =>
    c.id === awardedId ? 'bg-emerald-50/70' : c.status === 'rejected' ? 'bg-muted/40 text-muted-foreground' : '';

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-sm">
          {lowest && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1">
              <TrendingDown className="w-3.5 h-3.5" /> {lowest.itemsCovered < lowest.itemsTotal ? 'Lowest (partial quote)' : 'Best complete price'}: {lowest.vendorName}, {formatMoney(lowest.totalAmount, currency)}
            </span>
          )}
          {data.summary.spread > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-muted-foreground">
              Spread between quotes {formatMoney(data.summary.spread, currency)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {rejectedCount > 0 && (
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <Switch checked={!hideRejected} onCheckedChange={(c) => setHideRejected(!c)} aria-label="Show rejected quotations" />
              Show rejected ({rejectedCount})
            </label>
          )}
          <Button variant="outline" size="sm" className="gap-1.5" onClick={load} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b align-top">
              <th className="sticky left-0 z-10 bg-card p-3 text-left font-medium text-muted-foreground min-w-[200px]">
                {columns.length} quotation{columns.length === 1 ? '' : 's'}
              </th>
              {columns.map(c => (
                <th key={c.id} className={`p-3 text-left font-normal min-w-[190px] border-l ${cellTone(c)}`}>
                  <p className="font-semibold text-foreground leading-tight">{c.vendorName}</p>
                  <p className="text-xs text-muted-foreground">{c.quotationNumber}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <Badge variant="outline" className={QUOTATION_STATUS_META[c.status].className}>{c.id === awardedId ? 'Awarded' : QUOTATION_STATUS_META[c.status].label}</Badge>
                    {c.id === data.summary.lowestTotalId && <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Lowest</Badge>}
                    {c.id === data.summary.fastestDeliveryId && <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200">Fastest</Badge>}
                  </div>
                  {!!c.vendorRating && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {c.vendorRating.toFixed(1)} vendor rating</p>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.items.map(it => (
              <tr key={it.index}>
                <th scope="row" className="sticky left-0 z-10 bg-card p-3 text-left font-normal">
                  <p className="font-medium text-foreground">{it.description}</p>
                  <p className="text-xs text-muted-foreground">{it.quantity} {it.unit}{it.budget ? ` · budget ${formatMoney(it.budget, currency)}` : ''}</p>
                </th>
                {columns.map(c => {
                  const p = it.prices[c.id];
                  const best = it.lowestQuotationId === c.id && columns.filter(x => x.status !== 'rejected' && it.prices[x.id]).length > 1;
                  return (
                    <td key={c.id} className={`p-3 border-l tabular-nums ${cellTone(c)} ${best ? 'bg-emerald-50 text-emerald-900' : ''}`}>
                      {p ? (
                        <>
                          <p className="font-medium">{formatMoney(p.totalPrice, currency)}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.unitPrice !== null ? `${formatMoney(p.unitPrice, currency)} × ${p.quantity}` : `${p.quantity} ${it.unit}`}
                          </p>
                          {p.quantityShort && <p className="text-xs text-amber-700 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Short of {it.quantity}</p>}
                        </>
                      ) : (
                        <span className="text-xs text-amber-700 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Not quoted</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {columns.some(c => data.extras[c.id]?.total) && (
              <tr>
                <th scope="row" className="sticky left-0 z-10 bg-card p-3 text-left font-normal text-muted-foreground">Other charges</th>
                {columns.map(c => {
                  const ex = data.extras[c.id];
                  return (
                    <td key={c.id} className={`p-3 border-l tabular-nums ${cellTone(c)}`}>
                      {ex?.total ? <><p>{formatMoney(ex.total, currency)}</p><p className="text-xs text-muted-foreground">{ex.lines.join(', ')}</p></> : <span className="text-muted-foreground">—</span>}
                    </td>
                  );
                })}
              </tr>
            )}
            <tr className="bg-muted/30">
              <th scope="row" className="sticky left-0 z-10 bg-muted/30 p-3 text-left font-semibold text-foreground">Total</th>
              {columns.map(c => (
                <td key={c.id} className={`p-3 border-l tabular-nums ${cellTone(c)}`}>
                  <p className={`text-base font-semibold ${c.id === data.summary.lowestTotalId ? 'text-emerald-700' : 'text-foreground'}`}>{formatMoney(c.totalAmount, currency)}</p>
                  {c.status !== 'rejected' && lowest && c.id !== lowest.id && c.vsLowest !== null && (
                    c.vsLowest < 0
                      ? <p className="text-xs text-amber-700">{formatMoney(-c.vsLowest, currency)} less, but {c.itemsTotal - c.itemsCovered} item{c.itemsTotal - c.itemsCovered === 1 ? '' : 's'} not quoted</p>
                      : <p className="text-xs text-muted-foreground">{formatMoney(c.vsLowest, currency)} more ({pct(c.vsLowest, lowest.totalAmount)})</p>
                  )}
                </td>
              ))}
            </tr>
            {budget !== null && budget > 0 && (
              <tr>
                <th scope="row" className="sticky left-0 z-10 bg-card p-3 text-left font-normal text-muted-foreground">Against budget ({formatMoney(budget, currency)})</th>
                {columns.map(c => (
                  <td key={c.id} className={`p-3 border-l tabular-nums ${cellTone(c)}`}>
                    {c.vsBudget !== null && (
                      <span className={c.vsBudget > 0 ? 'text-red-600 font-medium' : 'text-emerald-700'}>
                        {formatMoney(Math.abs(c.vsBudget), currency)} {c.vsBudget > 0 ? 'over' : 'under'} ({pct(c.vsBudget, budget)})
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            )}
            <tr>
              <th scope="row" className="sticky left-0 z-10 bg-card p-3 text-left font-normal text-muted-foreground">Items quoted</th>
              {columns.map(c => (
                <td key={c.id} className={`p-3 border-l ${cellTone(c)} ${c.itemsCovered < c.itemsTotal ? 'text-amber-700 font-medium' : ''}`}>
                  {c.itemsCovered} of {c.itemsTotal}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row" className="sticky left-0 z-10 bg-card p-3 text-left font-normal text-muted-foreground">Delivery</th>
              {columns.map(c => (
                <td key={c.id} className={`p-3 border-l ${cellTone(c)}`}>
                  <p>{formatDate(c.deliveryDate)}</p>
                  {c.deliveryDays !== null && <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {c.deliveryDays} days from sending</p>}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row" className="sticky left-0 z-10 bg-card p-3 text-left font-normal text-muted-foreground">Payment terms</th>
              {columns.map(c => <td key={c.id} className={`p-3 border-l ${cellTone(c)}`}>{c.paymentTerms || '—'}</td>)}
            </tr>
            <tr>
              <th scope="row" className="sticky left-0 z-10 bg-card p-3 text-left font-normal text-muted-foreground">Valid until</th>
              {columns.map(c => (
                <td key={c.id} className={`p-3 border-l ${cellTone(c)} ${c.expired && c.status !== 'accepted' ? 'text-red-600 font-medium' : ''}`}>
                  {formatDate(c.validUntil)}{c.expired && c.status !== 'accepted' ? ' (expired)' : ''}
                </td>
              ))}
            </tr>
            {columns.some(c => c.notes) && (
              <tr>
                <th scope="row" className="sticky left-0 z-10 bg-card p-3 text-left font-normal text-muted-foreground">Vendor notes</th>
                {columns.map(c => <td key={c.id} className={`p-3 border-l text-xs ${cellTone(c)}`}>{c.notes || '—'}</td>)}
              </tr>
            )}
            {decidable && (
              <tr>
                <th scope="row" className="sticky left-0 z-10 bg-card p-3" />
                {columns.map(c => (
                  <td key={c.id} className={`p-3 border-l ${cellTone(c)}`}>
                    {(c.status === 'submitted' || c.status === 'reviewed') && (
                      <div className="flex flex-col gap-1.5">
                        <Button size="sm" className="gap-1.5" disabled={busyId === c.id || c.expired} onClick={() => onAccept(c.id)}
                          title={c.expired ? 'This quotation has expired' : undefined}>
                          <Award className="w-3.5 h-3.5" /> Award
                        </Button>
                        <Button size="sm" variant="ghost" className="gap-1.5 text-destructive hover:text-destructive" disabled={busyId === c.id} onClick={() => onReject(c.id)}>
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </Button>
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Green cells are the lowest price for that item. Quotes that skip items rank after complete ones when choosing the lowest.
      </p>
    </div>
  );
}
