import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Search, Star } from 'lucide-react';
import { rfqService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { PurchaseRequest } from '../purchase-requests/prModel';
import { RFQ, RFQItem, RFQVendor, formatDate, formatMoney, inDaysIso, mapRFQ, todayIso } from './rfqModel';

// Purchase-request item categories → the vendor categories that usually supply them, used to suggest vendors.
const CATEGORY_MATCH: Record<string, string[]> = {
  'IT Hardware': ['technology'],
  Software: ['technology'],
  'Office Supplies': ['other', 'services'],
  'Raw Materials': ['materials', 'manufacturing'],
  MRO: ['manufacturing', 'materials'],
  Services: ['services', 'consulting'],
  Facilities: ['services'],
  Logistics: ['logistics'],
  Marketing: ['services', 'other'],
  Packaging: ['materials'],
};

const BLOCKED_VENDOR_STATUSES = ['suspended', 'inactive'];

interface Source {
  title: string;
  currency: string;
  budget: number | null;
  items: RFQItem[];
  categories: string[];
}

export function RFQFormDrawer({
  open,
  onOpenChange,
  rfq,
  initialPrId,
  purchaseRequests,
  vendors,
  vendorsLoading,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rfq: RFQ | null; // null = create from a purchase request
  initialPrId: string | null;
  purchaseRequests: PurchaseRequest[]; // approved requests without an RFQ
  vendors: RFQVendor[];
  vendorsLoading: boolean;
  onSaved: (rfq: RFQ, opts: { created: boolean; sent: boolean }) => void;
}) {
  const [prId, setPrId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(inDaysIso(10));
  const [notes, setNotes] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [vendorSearch, setVendorSearch] = useState('');
  const [saving, setSaving] = useState<'draft' | 'send' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pr = useMemo(() => purchaseRequests.find(p => p.id === prId) || null, [purchaseRequests, prId]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setVendorSearch('');
    if (rfq) {
      setPrId(rfq.purchaseRequestId || '');
      setTitle(rfq.title);
      setDueDate(rfq.dueDate || inDaysIso(10));
      setNotes(rfq.notes);
      setSelected(rfq.vendorIds);
    } else {
      const initial = purchaseRequests.find(p => p.id === initialPrId) || null;
      setPrId(initial?.id || '');
      setTitle(initial?.title || '');
      setDueDate(inDaysIso(10));
      setNotes(initial?.notes || '');
      setSelected([]);
    }
    // Only reset when the drawer opens or switches record, not on every list refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, rfq?.id, initialPrId]);

  // A request chosen from the link may arrive after the drawer opened.
  useEffect(() => {
    if (open && !rfq && !prId && initialPrId && purchaseRequests.some(p => p.id === initialPrId)) {
      const initial = purchaseRequests.find(p => p.id === initialPrId)!;
      setPrId(initial.id);
      setTitle(initial.title);
      setNotes(initial.notes);
    }
  }, [open, rfq, prId, initialPrId, purchaseRequests]);

  const choosePr = (id: string) => {
    const next = purchaseRequests.find(p => p.id === id);
    setError(null);
    setPrId(id);
    if (next) { setTitle(next.title); setNotes(next.notes); }
  };

  const source: Source | null = rfq
    ? { title: rfq.title, currency: rfq.currency, budget: rfq.budget, items: rfq.items, categories: [...new Set(rfq.items.map(i => i.category))] }
    : pr
      ? { title: pr.title, currency: pr.currency, budget: pr.budgetTotal, items: pr.items, categories: [...new Set(pr.items.map(i => i.category))] }
      : null;

  const suggestedCategories = useMemo(
    () => new Set((source?.categories || []).flatMap(c => CATEGORY_MATCH[c] || [])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [source?.categories.join('|')],
  );

  const vendorRows = useMemo(() => {
    const term = vendorSearch.trim().toLowerCase();
    return vendors
      .filter(v => !term || v.name.toLowerCase().includes(term) || (v.category || '').toLowerCase().includes(term))
      .map(v => ({ ...v, suggested: suggestedCategories.has(v.category || ''), blocked: BLOCKED_VENDOR_STATUSES.includes(v.status || '') }))
      .sort((a, b) => Number(a.blocked) - Number(b.blocked) || Number(b.suggested) - Number(a.suggested) || (b.rating || 0) - (a.rating || 0) || a.name.localeCompare(b.name));
  }, [vendors, vendorSearch, suggestedCategories]);

  const toggleVendor = (id: string) => {
    setError(null);
    setSelected(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));
  };

  const validate = (mode: 'draft' | 'send') => {
    if (!rfq && !pr) return 'Choose the approved purchase request to source.';
    if (!title.trim()) return 'Give the RFQ a title.';
    if (!dueDate) return 'Choose when quotations are due.';
    if (dueDate < todayIso()) return 'The due date is in the past.';
    if (mode === 'send' && !selected.length) return 'Choose at least one vendor to send the RFQ to.';
    return null;
  };

  const save = async (mode: 'draft' | 'send') => {
    const problem = validate(mode);
    if (problem) { setError(problem); return; }
    setSaving(mode);
    setError(null);
    try {
      let res: any;
      if (rfq) {
        res = await rfqService.updateRFQ(rfq.id, { title: title.trim(), dueDate, notes, vendorIds: selected });
        if (mode === 'send') res = await rfqService.sendRFQ(rfq.id, { vendorIds: selected });
      } else {
        res = await rfqService.createRFQ({
          purchaseRequestId: pr!.id, title: title.trim(), dueDate, notes, vendorIds: selected, send: mode === 'send',
        });
      }
      onSaved(mapRFQ(res.data), { created: !rfq, sent: mode === 'send' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the RFQ');
    } finally {
      setSaving(null);
    }
  };

  const dueDays = dueDate ? Math.round((new Date(`${dueDate}T00:00:00`).getTime() - new Date(`${todayIso()}T00:00:00`).getTime()) / 86400000) : null;

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!saving) onOpenChange(o); }} direction="right">
      <DrawerContent className="data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-3xl p-0 gap-0 border-l shadow-2xl flex flex-col h-full bg-background">
        <DrawerHeader className="p-6 border-b shrink-0">
          <DrawerTitle className="text-xl font-semibold">{rfq ? `Edit ${rfq.rfqNumber}` : 'New RFQ'}</DrawerTitle>
          <DrawerDescription>
            {rfq ? 'Drafts can be changed until they are sent.' : 'Items and budget come from the approved purchase request. Choose vendors and a due date.'}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Purchase request</h3>
            {rfq ? (
              <p className="text-sm text-foreground">
                {rfq.prNumber ? <><span className="font-medium">{rfq.prNumber}</span> · {rfq.prTitle}</> : 'Not linked to a purchase request'}
              </p>
            ) : purchaseRequests.length === 0 ? (
              <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                There are no approved purchase requests waiting for an RFQ. Approve a request first, then come back here.
              </p>
            ) : (
              <Select value={prId || undefined} onValueChange={choosePr}>
                <SelectTrigger aria-label="Purchase request"><SelectValue placeholder="Choose an approved purchase request" /></SelectTrigger>
                <SelectContent>
                  {purchaseRequests.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.prNumber} · {p.title} · {formatMoney(p.budgetTotal, p.currency)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {pr && !rfq && (
              <p className="text-xs text-muted-foreground">
                {pr.department} · requested by {pr.requesterName}{pr.requestedDate ? ` · needed by ${formatDate(pr.requestedDate)}` : ''}
              </p>
            )}
          </section>

          {source && (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Items to quote <span className="font-normal text-muted-foreground">({source.items.length})</span></h3>
              <div className="rounded-lg border overflow-hidden text-sm">
                {source.items.map((it, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 px-3 py-2 border-t first:border-t-0">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{it.description}</p>
                      <p className="text-xs text-muted-foreground">{it.category}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="tabular-nums">{it.quantity} {it.unit}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">Budget {formatMoney(it.budget, source.currency)}</p>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between px-3 py-2 bg-muted/40 border-t font-medium">
                  <span>Total budget</span>
                  <span className="tabular-nums">{source.budget !== null ? formatMoney(source.budget, source.currency) : '—'}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Vendors quote against these lines. The budget is not shared with them.</p>
            </section>
          )}

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="rfq-title">RFQ title</Label>
              <Input id="rfq-title" value={title} onChange={(e) => { setError(null); setTitle(e.target.value); }} placeholder={source?.title || 'e.g. Laptops for new hires'} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rfq-due">Quotations due</Label>
              <Input id="rfq-due" type="date" min={todayIso()} value={dueDate} onChange={(e) => { setError(null); setDueDate(e.target.value); }} />
              <p className={`text-xs flex items-center gap-1 ${dueDays !== null && (dueDays < 7 || dueDays > 14) ? 'text-amber-700' : 'text-muted-foreground'}`}>
                <CalendarClock className="w-3.5 h-3.5" />
                {dueDays === null ? 'Vendors usually need 7 to 14 days.'
                  : dueDays < 0 ? 'This date has passed.'
                    : `${dueDays} day${dueDays === 1 ? '' : 's'} for vendors to respond${dueDays < 7 ? ', which is short' : dueDays > 14 ? ', which is longer than usual' : ''}.`}
              </p>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="rfq-notes">Instructions for vendors</Label>
              <Textarea id="rfq-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Delivery location, specifications, certifications, how to submit…" />
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-foreground">Send to vendors <span className="font-normal text-muted-foreground">({selected.length} selected)</span></h3>
              {selected.length > 0 && <Button variant="ghost" size="sm" className="h-7" onClick={() => setSelected([])}>Clear</Button>}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search vendors by name or category" value={vendorSearch} onChange={(e) => setVendorSearch(e.target.value)} aria-label="Search vendors" />
            </div>
            <div className="rounded-lg border max-h-72 overflow-y-auto divide-y">
              {vendorsLoading && <p className="p-4 text-sm text-muted-foreground">Loading vendors…</p>}
              {!vendorsLoading && vendorRows.length === 0 && <p className="p-4 text-sm text-muted-foreground">No vendors match.</p>}
              {vendorRows.map(v => (
                <label key={v.id} className={`flex items-center gap-3 px-3 py-2.5 text-sm ${v.blocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-muted/40'}`}>
                  <Checkbox checked={selected.includes(v.id)} disabled={v.blocked} onCheckedChange={() => toggleVendor(v.id)} aria-label={v.name} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">{v.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{v.category}{v.blocked ? ` · ${v.status}, cannot be invited` : v.status === 'under_review' ? ' · onboarding under review' : ''}</p>
                  </div>
                  {v.suggested && !v.blocked && <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 shrink-0">Suggested</Badge>}
                  {!!v.rating && <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 tabular-nums"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />{v.rating.toFixed(1)}</span>}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Suggested vendors supply this request's item categories. Three or more quotes make the comparison worthwhile.</p>
          </section>
        </div>

        <div className="border-t p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 bg-background">
          <div>
            <p className="text-xs text-muted-foreground">Budget</p>
            <p className="text-lg font-semibold tabular-nums">{source?.budget != null ? formatMoney(source.budget, source.currency) : '—'}</p>
          </div>
          <div className="flex flex-col items-stretch sm:items-end gap-2">
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={!!saving}>Cancel</Button>
              <Button variant="outline" onClick={() => save('draft')} disabled={!!saving}>
                {saving === 'draft' ? 'Saving…' : rfq ? 'Save changes' : 'Save draft'}
              </Button>
              <Button onClick={() => save('send')} disabled={!!saving}>
                {saving === 'send' ? 'Sending…' : `Send to ${selected.length || ''} vendor${selected.length === 1 ? '' : 's'}`.replace('  ', ' ')}
              </Button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
