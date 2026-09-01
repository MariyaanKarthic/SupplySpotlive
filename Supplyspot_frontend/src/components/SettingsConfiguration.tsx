import React, { useState } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './ui/breadcrumb';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Sliders,
  Building2,
  Mail,
  Zap,
  Database,
  ShieldCheck,
  ChevronRight,
  Settings,
  Building,
  PackageCheck,
  Users,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConfigCard {
  id: string;
  title: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  badge?: string;
  items: string[];
}

interface SidebarNavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const settingsNav: SidebarNavItem[] = [
  { id: 'company-setup', label: 'Company Setup', icon: Building },
  { id: 'module-access', label: 'Module Access', icon: PackageCheck },
  { id: 'vendor-verification', label: 'Vendor Verification', icon: ShieldCheck },
  { id: 'vendor-module-access', label: 'Vendor Module Access', icon: Users },
];

const configCards: ConfigCard[] = [
  {
    id: 'company-settings',
    title: 'Company Settings',
    icon: Sliders,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
    items: [
      'Company Profile',
      'Email Domain Configuration',
      'User Management',
      'User Roles',
      'Courier Type',
      'Material',
      'Service',
    ],
  },
  {
    id: 'org-masters',
    title: 'Organization Masters',
    icon: Building2,
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-50',
    items: [
      'Company Code',
      'Plant',
      'Purchase Organization',
      'Purchase Group',
      'Company Code to Plant Mapping',
      'Company Code to Purchase Org Mapping',
      'Business Partner Category',
      'Nature of Vendor',
    ],
  },
  {
    id: 'ap-email',
    title: 'Accounts Payable Automation Email',
    icon: Mail,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    items: ['Configured Email Address'],
  },
  {
    id: 'workflow',
    title: 'Workflow Configuration',
    icon: Zap,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
    items: ['Workflow Rules'],
  },
  {
    id: 'sap',
    title: 'SAP Configuration',
    icon: Database,
    iconColor: 'text-violet-600',
    iconBg: 'bg-violet-50',
    items: ['SAP Integration'],
  },
  {
    id: 'security',
    title: 'Security Control',
    icon: ShieldCheck,
    iconColor: 'text-rose-600',
    iconBg: 'bg-rose-50',
    items: ['Audit Log'],
  },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function ConfigCardItem({ label }: { label: string }) {
  return (
    <button className="group w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-all duration-150 text-left">
      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
        {label}
      </span>
      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-150 shrink-0" />
    </button>
  );
}

function ConfigCardComponent({ card }: { card: ConfigCard }) {
  const Icon = card.icon;
  return (
    <Card className="flex flex-col overflow-hidden shadow-none border hover:shadow-sm transition-shadow duration-200 p-0">
      {/* Card Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b bg-muted/20">
        <div className={`w-9 h-9 rounded-lg ${card.iconBg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-[18px] h-[18px] ${card.iconColor}`} strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground leading-tight truncate">
              {card.title}
            </h3>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {card.items.length} {card.items.length === 1 ? 'item' : 'items'}
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0 text-[10px] font-medium">
          {card.items.length}
        </Badge>
      </div>

      {/* Card Items */}
      <div className="px-2 py-2 flex flex-col gap-0.5">
        {card.items.map((item) => (
          <ConfigCardItem key={item} label={item} />
        ))}
      </div>
    </Card>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

interface SettingsConfigurationProps {
  onNavigate?: (section: any) => void;
}

export function SettingsConfiguration({ onNavigate }: SettingsConfigurationProps) {
  const [activeNav, setActiveNav] = useState('company-setup');

  const activeNavItem = settingsNav.find((n) => n.id === activeNav);

  return (
    <div className="px-6 pb-6 space-y-6 w-full max-w-full overflow-x-hidden">

      {/* Sticky Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur z-20 border-b py-3 -mx-6 px-6 space-y-1.5 flex flex-col no-print">
        <Breadcrumb className="text-xs">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                onClick={() => onNavigate && onNavigate('home')}
                className="cursor-pointer"
              >
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Settings</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{activeNavItem?.label ?? 'Setup'}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between w-full">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Setup</h1>
          <Button variant="outline" className="gap-2">
            <Settings className="w-4 h-4" />
            System Preferences
          </Button>
        </div>
      </div>

      {/* Body: left sub-nav + content */}
      <div className="flex gap-6 min-h-[calc(100vh-180px)]">

        {/* Left sub-navigation */}
        <aside className="w-52 shrink-0">
          <Card className="shadow-none p-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 py-2">
              Configuration
            </p>
            <nav className="flex flex-col gap-0.5">
              {settingsNav.map((item) => {
                const isActive = activeNav === item.id;
                const NavIcon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveNav(item.id)}
                    className={`
                      group w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left
                      ${isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }
                    `}
                  >
                    <NavIcon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </Card>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {configCards.map((card) => (
              <ConfigCardComponent key={card.id} card={card} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default SettingsConfiguration;
