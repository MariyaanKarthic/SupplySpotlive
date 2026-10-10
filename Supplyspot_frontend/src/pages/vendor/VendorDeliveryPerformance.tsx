import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck } from 'lucide-react';
import { shipmentService } from '@/services/api';

interface Stats {
  total: number;
  delayed: number;
  inTransit: number;
  completed: number;
  onTime: number;
  onTimeRate: number | null;
  avgDelayDays: number;
  counts: Record<string, number>;
}

// Delivery record for one vendor, from its shipments.
export function VendorDeliveryPerformance({ vendorId }: { vendorId: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStats(null);
    setError(false);
    shipmentService.getStats({ vendor_id: vendorId })
      .then((res: any) => { if (!cancelled) setStats(res.data); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [vendorId]);

  if (error) return null;
  return (
    <section className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2"><Truck className="w-4 h-4 text-muted-foreground" /> Delivery performance</h3>
        {stats && stats.total > 0 && (
          <Link to={`?section=shipments&vendor=${vendorId}`} className="text-xs text-primary hover:underline">View shipments</Link>
        )}
      </div>
      {!stats ? (
        <div className="h-14 rounded bg-muted animate-pulse" />
      ) : stats.total === 0 ? (
        <p className="text-sm text-muted-foreground">No shipments from this vendor yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">On time</p>
            <p className={`text-lg font-semibold ${stats.onTimeRate === null ? '' : stats.onTimeRate >= 90 ? 'text-emerald-700' : stats.onTimeRate >= 70 ? 'text-amber-700' : 'text-red-600'}`}>
              {stats.onTimeRate === null ? '—' : `${stats.onTimeRate}%`}
            </p>
            <p className="text-[11px] text-muted-foreground">{stats.onTime} of {stats.completed} deliveries</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg delay when late</p>
            <p className="text-lg font-semibold">{stats.avgDelayDays ? `${stats.avgDelayDays} d` : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">In transit</p>
            <p className="text-lg font-semibold">{stats.inTransit}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Delayed now</p>
            <p className={`text-lg font-semibold ${stats.delayed ? 'text-red-600' : ''}`}>{stats.delayed}</p>
            {(stats.counts.partially_received || 0) > 0 && <p className="text-[11px] text-muted-foreground">{stats.counts.partially_received} partly received</p>}
          </div>
        </div>
      )}
    </section>
  );
}
