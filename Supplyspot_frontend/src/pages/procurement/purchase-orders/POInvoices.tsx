import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Receipt } from 'lucide-react';
import { invoiceService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { PurchaseOrder, formatMoney } from './poModel';
import { Invoice, canWrite, dueLabel, formatDate, mapInvoice, sumByCurrency, toneClass } from '../../finance/invoices/invoiceModel';
import { InvoiceStatusBadge } from '../../finance/invoices/InvoiceList';

const INVOICEABLE = ['sent', 'acknowledged', 'partially_received', 'received', 'closed'];

// Supplier invoices billed against this PO, with a shortcut to raise another.
export function POInvoices({ po }: { po: PurchaseOrder }) {
  const { vendor: authUser } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    invoiceService.getInvoices({ po_id: po.id })
      .then((res: any) => { if (!cancelled) setInvoices((res.data?.invoices || []).map(mapInvoice)); })
      .catch(() => { if (!cancelled) setInvoices([]); });
    return () => { cancelled = true; };
  }, [po.id, po.status, po.updatedAt]);

  const invoiceable = INVOICEABLE.includes(po.status);
  if (!invoiceable && !invoices?.length) return null;
  const billed = (invoices || []).filter(i => i.status !== 'draft');

  return (
    <section className="space-y-3 no-print">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Receipt className="w-4 h-4 text-muted-foreground" /> Invoices
          {invoices && <span className="text-muted-foreground font-normal">({invoices.length})</span>}
        </h2>
        {invoiceable && canWrite(authUser?.role) && (
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <Link to={`?section=invoices&new=1&from_po=${po.id}`}><Plus className="w-4 h-4" /> Create invoice</Link>
          </Button>
        )}
      </div>
      {billed.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Billed {sumByCurrency(billed, i => i.totalAmount, false)} incl. tax · paid {sumByCurrency(billed, i => i.amountPaid, false)} · outstanding {sumByCurrency(billed, i => i.outstanding, false)}
        </p>
      )}
      <div className="rounded-lg border bg-card divide-y">
        {invoices === null && <div className="p-4"><div className="h-6 rounded bg-muted animate-pulse" /></div>}
        {invoices?.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">No invoices yet. Record the vendor's bill here when it arrives.</p>
        )}
        {invoices?.map(i => {
          const due = dueLabel(i);
          return (
            <Link key={i.id} to={`?section=invoices&invoice=${i.id}`}
              className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-muted/40 ${i.isOverdue ? 'bg-red-50/60' : ''}`}>
              <div className="min-w-0">
                <p className="font-medium text-foreground">{i.invoiceNumber}{i.grnNumber && <span className="text-muted-foreground font-normal"> · {i.grnNumber}</span>}</p>
                <p className="text-xs text-muted-foreground">
                  {formatMoney(i.totalAmount, i.currency)}{i.amountPaid > 0 && i.status !== 'paid' ? ` · ${formatMoney(i.outstanding, i.currency)} left` : ''}
                  {i.vendorInvoiceNumber ? ` · vendor ref ${i.vendorInvoiceNumber}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Due {formatDate(i.dueDate)}</p>
                  {due && <p className={`text-xs ${toneClass[due.tone]}`}>{due.text}</p>}
                </div>
                <InvoiceStatusBadge invoice={i} />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
