import React, { useState, useEffect } from 'react';
import { 
  Home,
  Users, 
  FileText, 
  Receipt, 
  CreditCard, 
  FolderOpen, 
  BarChart3, 
  FileBarChart2,
  Settings,
  UserPlus,
  Zap,
  Quote,
  ShoppingCart,
  ChevronDown,
  ChevronRight,
  Bell,
  LogOut,
  User,
  Shield,
  HelpCircle,
  FileCheck,
  Target,
  ShieldCheck,
  Truck,
  MessageSquare,
  UserCheck,
  Monitor,
  Database,
  Users2,
  PackageCheck,
  PanelLeft,
  ClipboardList,
  Search,
  Upload,
  Navigation,
  LayoutDashboard,
  Menu
} from 'lucide-react';
import { toast } from 'sonner';
import { NavigationItem } from '../App';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from './ui/dropdown-menu';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem
} from './ui/command';
import { searchItems, SearchItem } from '../utils/search-registry';
import { TooltipProvider } from './ui/tooltip';
import { cn } from './ui/utils';
import { Logo } from './Logo';
import { FLOW_STEPS } from './PurchaseFlow';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './ui/sheet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
interface SidebarProps {
  activeSection: NavigationItem;
  onSectionChange: (section: NavigationItem) => void;
}

interface NavigationGroup {
  title: string;
  /** Numbered steps of the buying flow get a step number in the menu. */
  flow?: boolean;
  items: {
    id: NavigationItem;
    label: string;
    icon: any;
    badge?: string;
    badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  }[];
}

// Grouped by what people come to do. "Purchase flow" lists the core steps in the order work moves through them.
const navigationGroups: NavigationGroup[] = [
  {
    title: 'Overview',
    items: [
      { id: 'home' as NavigationItem, label: 'Home', icon: Home },
      { id: 'finance' as NavigationItem, label: 'Finance Dashboard', icon: LayoutDashboard },
      { id: 'compliance' as NavigationItem, label: 'Compliance Dashboard', icon: ShieldCheck },
      { id: 'reports' as NavigationItem, label: 'Reports', icon: FileBarChart2 },
      { id: 'analytics' as NavigationItem, label: 'Analytics', icon: BarChart3 },
      { id: 'databoards' as NavigationItem, label: 'Databoards', icon: Database, badge: 'New', badgeVariant: 'default' },
    ]
  },
  {
    title: 'Purchase flow',
    flow: true,
    items: FLOW_STEPS.map(step => ({ id: step.id, label: step.label, icon: step.icon })),
  },
  {
    title: 'Vendors',
    items: [
      { id: 'registration' as NavigationItem, label: 'Vendor Registration', icon: UserPlus },
      { id: 'registration-review' as NavigationItem, label: 'Registration Review', icon: FileCheck },
      { id: 'supplier-dashboard' as NavigationItem, label: 'Supplier Dashboard', icon: Monitor, badge: 'New', badgeVariant: 'default' },
      { id: 'contracts' as NavigationItem, label: 'Contracts', icon: FileText },
    ]
  },
  {
    title: 'Procurement',
    items: [
      { id: 'sourcing-rfx' as NavigationItem, label: 'Sourcing & RFx', icon: Target },
      { id: 'goods-receipts' as NavigationItem, label: 'Goods Receipts', icon: PackageCheck },
      { id: 'procurement-collaboration' as NavigationItem, label: 'Collaboration Dashboard', icon: Users2 },
    ]
  },
  {
    title: 'Operations',
    items: [
      { id: 'payments' as NavigationItem, label: 'Payments', icon: CreditCard },
      { id: 'ap-automation' as NavigationItem, label: 'AP Automation', icon: Zap },
      { id: 'delivery-slots' as NavigationItem, label: 'Smart Delivery Slots', icon: Truck },
      { id: 'gate-entry' as NavigationItem, label: 'Gate Entry Integration', icon: UserCheck },
      { id: 'dispute-management' as NavigationItem, label: 'Dispute & Query Management', icon: MessageSquare },
    ]
  },
  {
    title: 'More',
    items: [
      { id: 'documents' as NavigationItem, label: 'Documents', icon: FolderOpen },
      { id: 'audit-trail' as NavigationItem, label: 'Audit Trail', icon: Shield },
      { id: 'regulatory-compliance' as NavigationItem, label: 'Regulatory & Sustainability', icon: ShieldCheck },
      { id: 'settings' as NavigationItem, label: 'Settings', icon: Settings },
    ]
  }
];

const menuItemClass = (isActive: boolean) => cn(
  "relative flex items-center gap-2.5 py-2 pl-3 pr-2.5 rounded-md text-xs font-medium cursor-pointer text-slate-300 hover:text-white hover:bg-white/10 focus:bg-white/10 focus:text-white transition-colors",
  isActive && "bg-blue-500/15 text-white focus:bg-blue-500/20 before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-full before:bg-blue-400"
);

function NavItemContent({ item, step, isActive }: { item: NavigationGroup['items'][number]; step?: number; isActive: boolean }) {
  const Icon = item.icon;
  return (
    <>
      {step !== undefined ? (
        <span className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold tabular-nums",
          isActive ? "bg-blue-500 text-white" : "bg-white/10 text-slate-300"
        )}>{step}</span>
      ) : (
        <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-blue-300" : "text-slate-400")} />
      )}
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge && (
        <span className="rounded-full bg-blue-500/20 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-blue-200">{item.badge}</span>
      )}
    </>
  );
}

function GroupItems({ group, activeSection, onSectionChange }: { group: NavigationGroup; activeSection: NavigationItem; onSectionChange: (s: NavigationItem) => void }) {
  return (
    <>
      {group.items.map((item, i) => {
        const isActive = activeSection === item.id;
        return (
          <DropdownMenuItem key={item.id} onClick={() => onSectionChange(item.id)} className={menuItemClass(isActive)}
            aria-current={isActive ? 'page' : undefined}>
            <NavItemContent item={item} step={group.flow && i < FLOW_STEPS.length ? i + 1 : undefined} isActive={isActive} />
          </DropdownMenuItem>
        );
      })}
    </>
  );
}

const initialsOf = (name?: string, email?: string) => {
  const src = (name || email || '').trim();
  if (!src) return '?';
  const parts = src.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || src[0].toUpperCase();
};

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const navigate = useNavigate();
  const { logout, vendor: authUser } = useAuth();
  const displayName: string = authUser?.name || authUser?.email?.split('@')[0] || 'My account';
  const displayEmail: string = authUser?.email || '';
  const displayRole: string = (authUser?.role || '').replace(/_/g, ' ');

  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchTab, setSearchTab] = useState<'all' | 'modules' | 'submodules' | 'data'>('all');
  const [visibleCount, setVisibleCount] = useState(navigationGroups.length);

  // Map icon names to local imported lucide icons
  const iconMap: Record<string, any> = {
    Home, Users, FileText, Receipt, CreditCard, FolderOpen, BarChart3, Settings,
    UserPlus, Zap, Quote, ShoppingCart, ChevronDown, ChevronRight, Bell, LogOut,
    User, Shield, HelpCircle, FileCheck, Target, ShieldCheck, Truck, MessageSquare,
    UserCheck, Monitor, Database, Users2, PackageCheck, ClipboardList, Upload, Search, LayoutDashboard, FileBarChart2
  };

  // Keyboard shortcut listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // How many menu groups fit in the top bar; the rest fold into "More".
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1440) setVisibleCount(navigationGroups.length);
      else if (width >= 1280) setVisibleCount(4);
      else if (width >= 1120) setVisibleCount(3);
      else setVisibleCount(2);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSearchSelect = (item: SearchItem) => {
    setOpen(false);
    onSectionChange(item.targetSection);
    if (item.category === 'submodules') {
      toast.success(`Launched: ${item.title}`);
    } else if (item.category === 'data') {
      toast.info(`Opened Record: ${item.title} (${item.subtitle?.split('•')[0] || ''})`);
    }
  };

  const go = (section: NavigationItem) => { setMobileOpen(false); onSectionChange(section); };
  const visibleGroups = navigationGroups.slice(0, visibleCount);
  const overflowGroups = navigationGroups.slice(visibleCount);
  const isAnyOverflowActive = overflowGroups.some(group =>
    group.items.some(item => activeSection === item.id)
  );
  const triggerClass = (active: boolean) => cn(
    "relative h-9 px-3 text-white/70 hover:text-white hover:bg-white/10 rounded-lg text-xs font-semibold gap-1 transition-all shrink-0",
    active && "text-white bg-white/10 after:absolute after:left-3 after:right-3 after:-bottom-[13px] after:h-0.5 after:rounded-full after:bg-blue-400"
  );

  return (
    <header className="w-full h-16 bg-[#2a2c35] text-white flex items-center justify-between gap-2 px-3 sm:px-6 shadow-md border-b border-white/5 shrink-0 z-50">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden h-9 w-9 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"
        aria-label="Open navigation menu"
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Brand & Logo */}
      <button type="button" className="flex items-center gap-2 shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        onClick={() => onSectionChange('home')} aria-label="Go to Home">
        <Logo size="md" />
      </button>

      {/* Navigation Menus in the Center */}
      <nav aria-label="Main" className="hidden lg:flex self-stretch items-center gap-1 flex-1 justify-start px-4 overflow-hidden">
        {visibleGroups.map((group) => {
          const isGroupActive = group.items.some(item => activeSection === item.id);
          return (
            <DropdownMenu key={group.title}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={triggerClass(isGroupActive)}>
                  {group.title}
                  <ChevronDown className="w-3 h-3 text-white/40" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 bg-slate-900 border-slate-800 text-white p-1 shadow-xl">
                {group.flow && (
                  <p className="px-3 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Vendor to invoice, in order</p>
                )}
                <GroupItems group={group} activeSection={activeSection} onSectionChange={onSectionChange} />
              </DropdownMenuContent>
            </DropdownMenu>
          );
        })}

        {/* More Dropdown for Overflow Groups */}
        {overflowGroups.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={triggerClass(isAnyOverflowActive)}>
                More
                <ChevronDown className="w-3 h-3 text-white/40" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-slate-900 border-slate-800 text-white p-1 shadow-xl">
              {overflowGroups.map((group) => {
                const isGroupActive = group.items.some(item => activeSection === item.id);
                return (
                  <DropdownMenuSub key={group.title}>
                    <DropdownMenuSubTrigger className={cn(
                      "flex items-center gap-2 py-2 px-3 rounded-md text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer focus:bg-white/10 focus:text-white data-[state=open]:bg-white/10 data-[state=open]:text-white transition-colors",
                      isGroupActive && "text-white"
                    )}>
                      <span className="flex-1">{group.title}</span>
                      {isGroupActive && <span className="size-1.5 rounded-full bg-blue-400" aria-hidden />}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-64 bg-slate-900 border-slate-800 text-white p-1 shadow-xl">
                      <GroupItems group={group} activeSection={activeSection} onSectionChange={onSectionChange} />
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </nav>

      {/* Styled Centered Search Trigger Button */}
      <div className="flex-1 max-w-[260px] mx-2 hidden md:block">
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className="w-full h-9 bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white/60 hover:text-white rounded-full flex items-center justify-between px-3 text-xs gap-2 transition-all"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-white/50" />
            <span>Search workspace</span>
          </div>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-white/10 bg-white/10 px-1.5 font-mono text-[10px] font-medium text-white/50">
            Ctrl K
          </kbd>
        </Button>
      </div>

      {/* User Actions on the Right */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Mobile Search Icon Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          className="md:hidden h-9 w-9 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </Button>

        <Button variant="ghost" size="icon" className="relative h-9 w-9 text-white/70 hover:text-white hover:bg-white/10 rounded-lg" aria-label="Notifications">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-[#2a2c35]" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 px-1.5 sm:px-2 gap-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg" aria-label="Account menu">
              <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-[11px]">
                {initialsOf(authUser?.name, authUser?.email)}
              </div>
              <span className="hidden xl:inline max-w-[140px] truncate text-xs font-semibold text-white/80">{displayName}</span>
              <ChevronDown className="hidden sm:block w-3 h-3 text-white/40" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 bg-slate-900 border-slate-800 text-white p-1 shadow-xl">
            <div className="px-3 py-2.5 border-b border-slate-800 mb-1">
              <p className="text-xs font-semibold text-white truncate">{displayName}</p>
              {displayEmail && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{displayEmail}</p>}
              {displayRole && <p className="mt-1.5 inline-block rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium capitalize text-slate-300">{displayRole}</p>}
            </div>
            <DropdownMenuItem onClick={() => onSectionChange('settings')} className="gap-2.5 py-2 px-3 rounded-md text-xs font-medium cursor-pointer text-slate-300 hover:text-white hover:bg-white/10 focus:bg-white/10 focus:text-white">
              <Settings className="w-4 h-4 text-slate-400" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-800 my-1" />
            <DropdownMenuItem onClick={() => { logout(); navigate('/login'); }} className="text-rose-400 focus:text-rose-300 gap-2.5 py-2 px-3 rounded-md text-xs font-medium cursor-pointer hover:bg-rose-500/10 focus:bg-rose-500/10">
              <LogOut className="w-4 h-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile navigation drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[290px] max-w-[85vw] p-0 bg-[#2a2c35] text-white border-white/10">
          <SheetHeader className="px-4 py-4 border-b border-white/10">
            <SheetTitle className="text-white"><Logo size="md" /></SheetTitle>
            <SheetDescription className="sr-only">Main navigation</SheetDescription>
          </SheetHeader>
          <nav aria-label="Main" className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
            {navigationGroups.map(group => (
              <div key={group.title}>
                <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{group.title}</p>
                <div className="space-y-0.5">
                  {group.items.map((item, i) => {
                    const isActive = activeSection === item.id;
                    return (
                      <button key={item.id} type="button" onClick={() => go(item.id)} aria-current={isActive ? 'page' : undefined}
                        className={cn(menuItemClass(isActive), "w-full text-left text-sm py-2.5")}>
                        <NavItemContent item={item} step={group.flow && i < FLOW_STEPS.length ? i + 1 : undefined} isActive={isActive} />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Command Search Palette Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen} title="Global Search" description="Search sections, actions, and transactions...">
        <CommandInput placeholder="Search modules, features, or data records..." className="text-slate-900 bg-transparent border-none focus:ring-0" />
        
        {/* Navigation Tabs inside the Search Dialog */}
        <div className="flex items-center gap-1.5 p-2 bg-slate-50 border-b border-slate-200">
          {(['all', 'modules', 'submodules', 'data'] as const).map((tab) => (
            <Button
              key={tab}
              variant={searchTab === tab ? "default" : "ghost"}
              onClick={() => setSearchTab(tab)}
              className={cn(
                "h-7 px-3 text-[10px] font-bold rounded-md capitalize transition-all",
                searchTab === tab 
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm" 
                  : "text-slate-500 hover:text-slate-950 hover:bg-slate-100"
              )}
            >
              {tab === 'submodules' ? 'Actions' : tab === 'data' ? 'Records' : tab}
            </Button>
          ))}
        </div>

        <CommandList className="max-h-[380px] bg-white text-slate-900 p-1">
          <CommandEmpty className="py-6 text-center text-xs text-slate-400 font-medium">No matches found.</CommandEmpty>
          
          {/* Modules section */}
          {(searchTab === 'all' || searchTab === 'modules') && (
            <CommandGroup heading="Modules & Views">
              {searchItems.filter(item => item.category === 'modules').map((item) => {
                const IconComponent = iconMap[item.iconName] || FileText;
                return (
                  <CommandItem
                    key={item.id}
                    onSelect={() => handleSearchSelect(item)}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-all data-[selected=true]:bg-slate-100 data-[selected=true]:text-slate-900"
                  >
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900">{item.title}</p>
                      {item.subtitle && <p className="text-[10px] text-slate-500 mt-0.5 truncate">{item.subtitle}</p>}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {/* Submodules / Actions section */}
          {(searchTab === 'all' || searchTab === 'submodules') && (
            <CommandGroup heading="Actions & Operations">
              {searchItems.filter(item => item.category === 'submodules').map((item) => {
                const IconComponent = iconMap[item.iconName] || Zap;
                return (
                  <CommandItem
                    key={item.id}
                    onSelect={() => handleSearchSelect(item)}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-all data-[selected=true]:bg-slate-100 data-[selected=true]:text-slate-900"
                  >
                    <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900">{item.title}</p>
                      {item.subtitle && <p className="text-[10px] text-slate-500 mt-0.5 truncate">{item.subtitle}</p>}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {/* Data records section */}
          {(searchTab === 'all' || searchTab === 'data') && (
            <CommandGroup heading="Data Records & Transactions">
              {searchItems.filter(item => item.category === 'data').map((item) => {
                const IconComponent = iconMap[item.iconName] || ShoppingCart;
                return (
                  <CommandItem
                    key={item.id}
                    onSelect={() => handleSearchSelect(item)}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-all data-[selected=true]:bg-slate-100 data-[selected=true]:text-slate-900"
                  >
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900">{item.title}</p>
                      {item.subtitle && <p className="text-[10px] text-slate-500 mt-0.5 truncate">{item.subtitle}</p>}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </header>
  );
}