import React, { useEffect, useRef } from 'react';
import { ChevronRight, ClipboardList, Navigation, Quote, Receipt, ShoppingCart, Users } from 'lucide-react';
import type { NavigationItem } from '../App';
import { cn } from './ui/utils';

export interface FlowStep {
  id: NavigationItem;
  label: string;
  short: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

/** The buying flow, in order. Each step's output feeds the next one. */
export const FLOW_STEPS: FlowStep[] = [
  { id: 'vendors', label: 'Vendors', short: 'Vendors', description: 'Approved suppliers you can buy from', icon: Users },
  { id: 'purchase-requisitions', label: 'Purchase Requests', short: 'Requests', description: 'Teams ask for what they need', icon: ClipboardList },
  { id: 'rfq', label: 'RFQs & Quotations', short: 'RFQs', description: 'Collect and compare vendor quotes', icon: Quote },
  { id: 'purchase-orders', label: 'Purchase Orders', short: 'Orders', description: 'Approve and send the order', icon: ShoppingCart },
  { id: 'shipments', label: 'Shipments', short: 'Shipments', description: 'Track delivery and receive goods', icon: Navigation },
  { id: 'invoices', label: 'Invoices', short: 'Invoices', description: 'Match the bill, approve and pay', icon: Receipt },
];

export const flowStepIndex = (section: NavigationItem) => FLOW_STEPS.findIndex(s => s.id === section);

/**
 * Slim step bar under the top navigation on purchase-flow pages: shows where the current page sits
 * in Vendor → Request → RFQ → Order → Shipment → Invoice and links to the other steps.
 */
export function PurchaseFlowBar({ activeSection, onSectionChange }: {
  activeSection: NavigationItem; onSectionChange: (s: NavigationItem) => void;
}) {
  const current = flowStepIndex(activeSection);
  const listRef = useRef<HTMLOListElement>(null);
  // On narrow screens the bar scrolls sideways; keep the current step in view.
  useEffect(() => {
    const list = listRef.current;
    const el = list?.querySelector<HTMLElement>('[aria-current="step"]');
    if (list && el) list.scrollLeft = el.offsetLeft - list.clientWidth / 2 + el.clientWidth / 2;
  }, [current]);
  if (current < 0) return null;
  return (
    <nav aria-label="Purchase flow" className="shrink-0 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <ol ref={listRef} className="relative mx-auto flex max-w-[1700px] items-center gap-1 overflow-x-auto px-4 py-2 scrollbar-none sm:px-6">
        <li className="mr-2 hidden shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground md:block">Purchase flow</li>
        {FLOW_STEPS.map((step, i) => {
          const active = i === current;
          const done = i < current;
          return (
            <li key={step.id} className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => onSectionChange(step.id)}
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'group flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                  active ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )}
              >
                <span className={cn(
                  'flex size-5 items-center justify-center rounded-full text-[10px] font-bold tabular-nums',
                  active ? 'bg-white text-blue-700' : done ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500 group-hover:bg-white',
                )}>{i + 1}</span>
                <span className="sm:hidden">{step.short}</span>
                <span className="hidden sm:inline">{step.label}</span>
              </button>
              {i < FLOW_STEPS.length - 1 && <ChevronRight aria-hidden className={cn('size-3.5', i < current ? 'text-blue-300' : 'text-slate-300')} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Larger version for the Home screen: one card per step, connected left to right. */
export function PurchaseFlowOverview({ onNavigate }: { onNavigate: (s: NavigationItem) => void }) {
  return (
    <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {FLOW_STEPS.map((step, i) => {
        const Icon = step.icon;
        return (
          <li key={step.id} className="relative">
            <button
              type="button"
              onClick={() => onNavigate(step.id)}
              className="group flex h-full w-full flex-col gap-3 rounded-xl border bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                  <Icon className="size-4.5" />
                </span>
                <span className="text-[11px] font-semibold tabular-nums text-slate-400">Step {i + 1}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{step.label}</p>
                <p className="mt-0.5 text-xs leading-snug text-slate-500">{step.description}</p>
              </div>
            </button>
            {i < FLOW_STEPS.length - 1 && (
              <ChevronRight aria-hidden className="absolute -right-3 top-1/2 z-10 hidden size-5 -translate-y-1/2 rounded-full border bg-white p-0.5 text-slate-400 shadow-sm xl:block" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
