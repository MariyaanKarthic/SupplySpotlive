import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { purchaseRequestService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { CATEGORIES, CURRENCIES, DEPARTMENTS, PRPriority, PurchaseRequest, formatMoney, mapPurchaseRequest } from './prModel';

interface ItemDraft {
  key: number;
  description: string;
  quantity: string;
  unit: string;
  budget: string;
  category: string;
}

interface FormState {
  title: string;
  department: string;
  requestedDate: string;
  priority: PRPriority;
  currency: string;
  notes: string;
  items: ItemDraft[];
}

const todayIso = () => new Date().toISOString().split('T')[0];
const inDaysIso = (days: number) => new Date(Date.now() + days * 86400000).toISOString().split('T')[0];
let itemKey = 0;
const emptyItem = (category = 'Other'): ItemDraft => ({ key: ++itemKey, description: '', quantity: '1', unit: 'pcs', budget: '', category });

function initialState(pr: PurchaseRequest | null, defaultDepartment: string): FormState {
  if (!pr) {
    return {
      title: '', department: defaultDepartment, requestedDate: inDaysIso(14), priority: 'medium', currency: 'INR', notes: '', items: [emptyItem()],
    };
  }
  return {
    title: pr.title, department: pr.department, requestedDate: pr.requestedDate, priority: pr.priority, currency: pr.currency, notes: pr.notes,
    items: pr.items.length
      ? pr.items.map(it => ({ key: ++itemKey, description: it.description, quantity: String(it.quantity), unit: it.unit, budget: String(it.budget), category: it.category }))
      : [emptyItem()],
  };
}

export function PRFormDrawer({
  open,
  onOpenChange,
  pr,
  defaultDepartment,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pr: PurchaseRequest | null; // null = create
  defaultDepartment: string;
  onSaved: (pr: PurchaseRequest, created: boolean) => void;
}) {
  const [form, setForm] = useState<FormState>(() => initialState(pr, defaultDepartment));
  const [saving, setSaving] = useState<'draft' | 'submit' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(initialState(pr, defaultDepartment));
      setError(null);
    }
  }, [open, pr, defaultDepartment]);

  // Any edit clears the last validation message, so it never points at something already fixed.
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => { setError(null); setForm(f => ({ ...f, [key]: value })); };
  const setItem = (key: number, patch: Partial<ItemDraft>) => {
    setError(null);
    setForm(f => ({ ...f, items: f.items.map(it => (it.key === key ? { ...it, ...patch } : it)) }));
  };

  const total = form.items.reduce((acc, it) => acc + (Number(it.budget) || 0), 0);
  const departmentOptions = form.department && !DEPARTMENTS.includes(form.department) ? [form.department, ...DEPARTMENTS] : DEPARTMENTS;

  const validate = (mode: 'draft' | 'submit') => {
    if (!form.title.trim()) return 'Give the request a short title.';
    if (!form.department) return 'Choose a department.';
    const filled = form.items.filter(it => it.description.trim());
    if (!filled.length) return 'Add at least one item.';
    if (filled.some(it => !(Number(it.quantity) > 0))) return 'Each item needs a quantity above 0.';
    if (filled.some(it => it.budget !== '' && !(Number(it.budget) >= 0))) return 'Budgets cannot be negative.';
    if (mode === 'submit') {
      if (!form.requestedDate) return 'Choose a needed-by date before submitting.';
      if (form.requestedDate < todayIso()) return 'The needed-by date is in the past.';
      if (filled.some(it => it.budget === '')) return 'Add an estimated budget for each item before submitting.';
    }
    return null;
  };

  const save = async (mode: 'draft' | 'submit') => {
    const problem = validate(mode);
    if (problem) { setError(problem); return; }
    setSaving(mode);
    setError(null);
    const payload = {
      title: form.title.trim(),
      department: form.department,
      requestedDate: form.requestedDate || '',
      priority: form.priority,
      currency: form.currency,
      notes: form.notes,
      items: form.items
        .filter(it => it.description.trim())
        .map(it => ({ description: it.description.trim(), quantity: Number(it.quantity), unit: it.unit.trim() || 'pcs', budget: Number(it.budget) || 0, category: it.category })),
    };
    try {
      let res: any;
      if (pr) {
        res = await purchaseRequestService.updatePurchaseRequest(pr.id, payload);
        if (mode === 'submit') res = await purchaseRequestService.submitPR(pr.id);
      } else {
        res = await purchaseRequestService.createPurchaseRequest({ ...payload, requestedDate: payload.requestedDate || undefined, submit: mode === 'submit' });
      }
      onSaved(mapPurchaseRequest(res.data), !pr);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the purchase request');
    } finally {
      setSaving(null);
    }
  };

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!saving) onOpenChange(o); }} direction="right">
      <DrawerContent className="data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-3xl p-0 gap-0 border-l shadow-2xl flex flex-col h-full bg-background">
        <DrawerHeader className="p-6 border-b shrink-0">
          <DrawerTitle className="text-xl font-semibold">{pr ? `Edit ${pr.prNumber}` : 'New purchase request'}</DrawerTitle>
          <DrawerDescription>
            {pr ? 'Only drafts can be edited. Submitting sends the request to a procurement manager.' : 'Save it as a draft, or submit it straight for approval.'}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">What do you need?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="pr-title">Title</Label>
                <Input id="pr-title" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Laptops for new hires" />
              </div>
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Select value={form.department || undefined} onValueChange={(v) => set('department', v)}>
                  <SelectTrigger aria-label="Department"><SelectValue placeholder="Choose a department" /></SelectTrigger>
                  <SelectContent>
                    {departmentOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pr-needed">Needed by</Label>
                <Input id="pr-needed" type="date" min={todayIso()} value={form.requestedDate} onChange={(e) => set('requestedDate', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => set('priority', v as PRPriority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Select value={form.currency} onValueChange={(v) => set('currency', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Items</h3>
              <Button type="button" variant="outline" size="sm" className="gap-1.5"
                onClick={() => set('items', [...form.items, emptyItem(form.items[form.items.length - 1]?.category)])}>
                <Plus className="w-4 h-4" /> Add item
              </Button>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <div className="hidden sm:grid grid-cols-[1fr_150px_70px_70px_120px_36px] gap-2 px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
                <span>Item</span><span>Category</span><span className="text-right">Qty</span><span>Unit</span><span className="text-right">Budget</span><span />
              </div>
              {form.items.map((it, i) => (
                <div key={it.key} className="grid grid-cols-2 sm:grid-cols-[1fr_150px_70px_70px_120px_36px] gap-2 px-3 py-2 border-t first:border-t-0 sm:first:border-t items-center">
                  <Input aria-label={`Item ${i + 1}`} placeholder="Item description" value={it.description} onChange={(e) => setItem(it.key, { description: e.target.value })} className="col-span-2 sm:col-span-1" />
                  <Select value={it.category} onValueChange={(v) => setItem(it.key, { category: v })}>
                    <SelectTrigger aria-label={`Category ${i + 1}`} className="col-span-2 sm:col-span-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input aria-label={`Quantity ${i + 1}`} type="number" min="0" step="any" value={it.quantity} onChange={(e) => setItem(it.key, { quantity: e.target.value })} className="text-right" />
                  <Input aria-label={`Unit ${i + 1}`} value={it.unit} onChange={(e) => setItem(it.key, { unit: e.target.value })} placeholder="pcs" />
                  <Input aria-label={`Budget ${i + 1}`} type="number" min="0" step="0.01" placeholder="0.00" value={it.budget} onChange={(e) => setItem(it.key, { budget: e.target.value })} className="text-right" />
                  <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 justify-self-end" aria-label={`Remove item ${i + 1}`}
                    disabled={form.items.length === 1} onClick={() => set('items', form.items.filter(x => x.key !== it.key))}>
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Budget is your estimate for the whole line, not per unit. Procurement uses it to set the RFQ budget.</p>
          </section>

          <section className="space-y-1.5">
            <Label htmlFor="pr-notes">Justification and notes</Label>
            <Textarea id="pr-notes" rows={4} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Why is this needed, preferred brands or vendors, delivery location…" />
          </section>
        </div>

        <div className="border-t p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 bg-background">
          <div>
            <p className="text-xs text-muted-foreground">Estimated total</p>
            <p className="text-lg font-semibold tabular-nums">{formatMoney(total, form.currency)}</p>
          </div>
          <div className="flex flex-col items-stretch sm:items-end gap-2">
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={!!saving}>Cancel</Button>
              <Button variant="outline" onClick={() => save('draft')} disabled={!!saving}>
                {saving === 'draft' ? 'Saving…' : pr ? 'Save changes' : 'Save draft'}
              </Button>
              <Button onClick={() => save('submit')} disabled={!!saving}>
                {saving === 'submit' ? 'Submitting…' : 'Submit for approval'}
              </Button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
