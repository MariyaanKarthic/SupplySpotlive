import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Receipt } from 'lucide-react';
import { invoiceService } from '@/services/api';
import { STATUS_META, InvoiceStatus, formatDate, formatMoney, methodLabel } from '../finance/invoices/invoiceModel';

interface Summary {
  currency: string;
  count: number;
  invoiced: number;
  paid: number;
  outstanding: number;
  overdue_count: number;
  overdue_amount: number;
  recent_invoices: { id: string; invoice_number: string; status: InvoiceStatus; total_amount: number; outstanding: number; currency: string; due_date: string | null; is_overdue: boolean; days_overdue: number; po_number: string | null }[];
  payments: { id: string; amount: number; payment_date: string; method: string; reference: string | null; invoice_id: string; invoice_number: string }[];
}

// Billing record for one vendor: what was invoiced, paid and is still owed, recent invoices and payments.
export function VendorInvoiceSummary({ vendorId }: { vendorId: string }) {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(false);
    invoiceService.getVendorSummary(vendorId)
      .then((res: any) => { if (!cancelled) setData(res.data); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [vendorId]);

  if (error) return null;
  const cur = data?.currency || 'INR';
  return (
    <section className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2"><Receipt className="w-4 h-4 text-muted-foreground" /> Invoices and payments</h3>
        {data && data.count > 0 && (
          <Link to={`?section=invoices&vendor=${vendorId}`} className="text-xs text-primary hover:underline">View invoices</Link>
        )}
      </div>
      {!data ? (
        <div className="h-14 rounded bg-muted animate-pulse" />
      ) : data.count === 0 ? (
        <p className="text-sm text-muted-foreground">No invoices from this vendor yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-x-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Invoiced</p>
              <p className="font-semibold tabular-nums">{formatMoney(data.invoiced, cur)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Paid</p>
              <p className="font-semibold tabular-nums text-emerald-700">{formatMoney(data.paid, cur)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Outstanding</p>
              <p className={`font-semibold tabular-nums ${data.overdue_count ? 'text-red-600' : ''}`}>{formatMoney(data.outstanding, cur)}</p>
              {data.overdue_count > 0 && (
                <p className="text-[11px] text-red-600">{data.overdue_amount >= data.outstanding ? 'All overdue' : `${formatMoney(data.overdue_amount, cur)} overdue`}</p>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Recent invoices</p>
            <ul className="divide-y rounded-md border">
              {data.recent_invoices.map(i => (
                <li key={i.id}>
                  <Link to={`?section=invoices&invoice=${i.id}`} className={`flex items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-muted/40 ${i.is_overdue ? 'bg-red-50/60' : ''}`}>
                    <span className="min-w-0">
                      <span className="font-medium">{i.invoice_number}</span>
                      <span className="block text-xs text-muted-foreground truncate">
                        {i.po_number || 'No PO'} · due {formatDate(i.due_date)}
                        {i.is_overdue && <span className="text-red-600 font-medium"> · {i.days_overdue} d overdue</span>}
                      </span>
                    </span>
                    <span className="text-right shrink-0">
                      <span className="block tabular-nums">{formatMoney(i.total_amount, i.currency)}</span>
                      <span className="block text-xs text-muted-foreground">{STATUS_META[i.status]?.label || i.status}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {data.payments.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Payment history</p>
              <ul className="space-y-1.5 text-sm">
                {data.payments.map(p => (
                  <li key={p.id} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate">
                      {formatDate(p.payment_date)} · <Link to={`?section=invoices&invoice=${p.invoice_id}`} className="text-primary hover:underline">{p.invoice_number}</Link>
                      <span className="text-xs text-muted-foreground"> · {methodLabel(p.method)}{p.reference ? ` · ${p.reference}` : ''}</span>
                    </span>
                    <span className="tabular-nums shrink-0">{formatMoney(p.amount, cur)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
