import { useEffect, useState } from 'react';
import { invoiceService } from '@/services/api';
import { Invoice, mapInvoice } from '../../finance/invoices/invoiceModel';

// Invoices billed against this PO's goods receipts, grouped by GRN id.
export function useGrnInvoices(poId: string, refreshKey?: unknown) {
  const [byGrn, setByGrn] = useState<Record<string, Invoice[]>>({});
  useEffect(() => {
    let cancelled = false;
    invoiceService.getInvoices({ po_id: poId })
      .then((res: any) => {
        if (cancelled) return;
        const grouped: Record<string, Invoice[]> = {};
        (res.data?.invoices || []).map(mapInvoice).forEach((i: Invoice) => {
          if (i.grnId) (grouped[i.grnId] = grouped[i.grnId] || []).push(i);
        });
        setByGrn(grouped);
      })
      .catch(() => { if (!cancelled) setByGrn({}); });
    return () => { cancelled = true; };
  }, [poId, refreshKey]);
  return byGrn;
}
