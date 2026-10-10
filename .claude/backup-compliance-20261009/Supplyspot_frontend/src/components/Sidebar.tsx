import React, { useState, useEffect } from 'react';
import { 
  Home,
  Users, 
  FileText, 
  Receipt, 
  CreditCard, 
  FolderOpen, 
  BarChart3, 
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
  LayoutDashboard
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
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
interface SidebarProps {
  activeSection: NavigationItem;
  onSectionChange: (section: NavigationItem) => void;
}

interface NavigationGroup {
  title: string;
  items: {
    id: NavigationItem;
    label: string;
    icon: any;
    badge?: string;
    badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  }[];
}

const navigationGroups: NavigationGroup[] = [
  {
    title: 'Overview',
    items: [
      { id: 'home' as NavigationItem, label: 'Home', icon: Home },
    ]
  },
  {
    title: 'Vendor',
    items: [
      { id: 'registration' as NavigationItem, label: 'Vendor Registration', icon: UserPlus, badge: '3', badgeVariant: 'secondary' },
      { id: 'registration-review' as NavigationItem, label: 'Registration Review', icon: FileCheck, badge: '12', badgeVariant: 'destructive' },
      { id: 'vendors' as NavigationItem, label: 'Vendor Management', icon: Users },
      { id: 'supplier-dashboard' as NavigationItem, label: 'Supplier Dashboard', icon: Monitor, badge: 'New', badgeVariant: 'default' },
    ]
  },
  {
    title: 'Finance',
    items: [
      { id: 'finance' as NavigationItem, label: 'Finance Dashboard', icon: LayoutDashboard },
      { id: 'invoices' as NavigationItem, label: 'Invoices', icon: Receipt },
      { id: 'ap-automation' as NavigationItem, label: 'Ap Automation', icon: Zap },
      { id: 'payments' as NavigationItem, label: 'Payments', icon: CreditCard },
    ]
  },
  {
    title: 'Procurement',
    items: [
      { id: 'sourcing-rfx' as NavigationItem, label: 'Sourcing & RFx', icon: Target, badge: '5', badgeVariant: 'default' },
      { id: 'rfq' as NavigationItem, label: 'RFQs & Quotations', icon: Quote },
      { id: 'purchase-orders' as NavigationItem, label: 'Purchase Orders', icon: ShoppingCart },
      { id: 'purchase-requisitions' as NavigationItem, label: 'Purchase Requests', icon: ClipboardList },
      { id: 'goods-receipts' as NavigationItem, label: 'Goods Receipts', icon: PackageCheck, badge: '3', badgeVariant: 'secondary' },
      { id: 'procurement-collaboration' as NavigationItem, label: 'Collaboration Dashboard', icon: Users2, badge: '8', badgeVariant: 'destructive' },
      { id: 'contracts' as NavigationItem, label: 'Contracts', icon: FileText },
    ]
  },
  {
    title: 'Logistics',
    items: [
      { id: 'shipments' as NavigationItem, label: 'Shipment Tracking', icon: Navigation },
      { id: 'delivery-slots' as NavigationItem, label: 'Smart Delivery Slots', icon: Truck, badge: '24', badgeVariant: 'default' },
      { id: 'gate-entry' as NavigationItem, label: 'Gate Entry Integration', icon: UserCheck, badge: '4', badgeVariant: 'secondary' },
    ]
  },
  {
    title: 'More',
    items: [
      { id: 'dispute-management' as NavigationItem, label: 'Dispute & Query Management', icon: MessageSquare, badge: '8', badgeVariant: 'destructive' },
      { id: 'documents' as NavigationItem, label: 'Documents', icon: FolderOpen },
      { id: 'databoards' as NavigationItem, label: 'Databoards', icon: Database, badge: 'New', badgeVariant: 'default' },
      { id: 'analytics' as NavigationItem, label: 'Analytics', icon: BarChart3 },
      { id: 'audit-trail' as NavigationItem, label: 'Audit Trail', icon: Shield, badge: '12', badgeVariant: 'secondary' },
      { id: 'regulatory-compliance' as NavigationItem, label: 'Regulatory & Sustainability', icon: ShieldCheck, badge: '4', badgeVariant: 'destructive' },
      { id: 'settings' as NavigationItem, label: 'Settings', icon: Settings },
    ]
  }
];

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const [open, setOpen] = useState(false);
  const [searchTab, setSearchTab] = useState<'all' | 'modules' | 'submodules' | 'data'>('all');
  const [visibleCount, setVisibleCount] = useState(9);

  // Map icon names to local imported lucide icons
  const iconMap: Record<string, any> = {
    Home, Users, FileText, Receipt, CreditCard, FolderOpen, BarChart3, Settings,
    UserPlus, Zap, Quote, ShoppingCart, ChevronDown, ChevronRight, Bell, LogOut,
    User, Shield, HelpCircle, FileCheck, Target, ShieldCheck, Truck, MessageSquare,
    UserCheck, Monitor, Database, Users2, PackageCheck, ClipboardList, Upload, Search, LayoutDashboard
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

  // Resize listener to dynamically calculate visible count of navigation groups in top menu bar
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1650) {
        setVisibleCount(9);
      } else if (width >= 1450) {
        setVisibleCount(5);
      } else if (width >= 1250) {
        setVisibleCount(3);
      } else if (width >= 1024) {
        setVisibleCount(1);
      } else {
        setVisibleCount(0);
      }
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

  const overflowGroups = navigationGroups.slice(visibleCount);
  const isAnyOverflowActive = overflowGroups.some(group => 
    group.items.some(item => activeSection === item.id)
  );

  return (
    <header className="w-full h-16 bg-[#2a2c35] text-white flex items-center justify-between px-6 shadow-md border-b border-white/5 shrink-0 z-50">
      {/* Brand & Logo */}
      <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => onSectionChange('home')}>
        <Logo size="md" />
      </div>

      {/* Navigation Menus in the Center */}
      <nav className="hidden lg:flex items-center gap-1 xl:gap-2 flex-1 justify-start px-4 overflow-hidden">
        {navigationGroups.slice(0, visibleCount).map((group) => {
          if (group.items.length === 1) {
            const item = group.items[0];
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <Button
                key={item.id}
                variant="ghost"
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  "h-9 px-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg text-xs font-semibold gap-1.5 transition-all shrink-0",
                  isActive && "bg-white/15 text-white"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </Button>
            );
          }

          const isGroupActive = group.items.some(item => activeSection === item.id);

          return (
            <DropdownMenu key={group.title}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "h-9 px-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg text-xs font-semibold gap-1 transition-all shrink-0",
                    isGroupActive && "bg-white/10 text-white font-bold"
                  )}
                >
                  {group.title}
                  <ChevronDown className="w-3 h-3 text-white/40" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-slate-900 border-slate-800 text-white p-1 shadow-xl">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => onSectionChange(item.id)}
                      className={cn(
                        "flex items-center gap-2.5 py-2 px-2.5 rounded-md text-xs font-medium cursor-pointer text-slate-300 hover:text-white hover:bg-white/10 focus:bg-white/10 focus:text-white transition-colors",
                        isActive && "bg-white/15 text-white"
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <Badge
                          variant={item.badgeVariant === 'destructive' ? 'destructive' : item.badgeVariant === 'default' ? 'default' : 'secondary'}
                          className="h-4.5 px-1.5 text-[9px] font-bold"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        })}

        {/* More Dropdown for Overflow Groups */}
        {visibleCount < navigationGroups.length && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "h-9 px-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg text-xs font-semibold gap-1 transition-all shrink-0",
                  isAnyOverflowActive && "bg-white/10 text-white font-bold"
                )}
              >
                More
                <ChevronDown className="w-3 h-3 text-white/40" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-800 text-white p-1 shadow-xl">
              {navigationGroups.slice(visibleCount).map((group, index) => {
                const isGroupActive = group.items.some(item => activeSection === item.id);
                
                // If the group is 'More', render its items directly in the root dropdown
                if (group.title === 'More') {
                  return (
                    <React.Fragment key={group.title}>
                      {index > 0 && <DropdownMenuSeparator className="bg-slate-805 my-1" />}
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeSection === item.id;
                        return (
                          <DropdownMenuItem
                            key={item.id}
                            onClick={() => onSectionChange(item.id)}
                            className={cn(
                              "flex items-center gap-2.5 py-2 px-2.5 rounded-md text-xs font-medium cursor-pointer text-slate-300 hover:text-white hover:bg-white/10 focus:bg-white/10 focus:text-white transition-colors",
                              isActive && "bg-white/15 text-white"
                            )}
                          >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span className="flex-1 truncate">{item.label}</span>
                            {item.badge && (
                              <Badge
                                variant={item.badgeVariant === 'destructive' ? 'destructive' : item.badgeVariant === 'default' ? 'default' : 'secondary'}
                                className="h-4.5 px-1.5 text-[9px] font-bold"
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </DropdownMenuItem>
                        );
                      })}
                    </React.Fragment>
                  );
                }

                return (
                  <DropdownMenuSub key={group.title}>
                    <DropdownMenuSubTrigger className={cn(
                      "flex items-center gap-2 py-2 px-2.5 rounded-md text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer focus:bg-white/10 focus:text-white transition-colors",
                      isGroupActive && "bg-white/10 text-white"
                    )}>
                      <span>{group.title}</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-56 bg-slate-900 border-slate-850 text-white p-1 shadow-xl">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeSection === item.id;
                        return (
                          <DropdownMenuItem
                            key={item.id}
                            onClick={() => onSectionChange(item.id)}
                            className={cn(
                              "flex items-center gap-2.5 py-2 px-2.5 rounded-md text-xs font-medium cursor-pointer text-slate-300 hover:text-white hover:bg-white/10 focus:bg-white/10 focus:text-white transition-colors",
                              isActive && "bg-white/15 text-white"
                            )}
                          >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span className="flex-1 truncate">{item.label}</span>
                            {item.badge && (
                              <Badge
                                variant={item.badgeVariant === 'destructive' ? 'destructive' : item.badgeVariant === 'default' ? 'default' : 'secondary'}
                                className="h-4.5 px-1.5 text-[9px] font-bold"
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </nav>

      {/* Styled Centered Search Trigger Button */}
      <div className="flex-1 max-w-[280px] mx-4 hidden md:block">
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className="w-full h-9 bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white/50 hover:text-white rounded-full flex items-center justify-between px-3 text-[11px] gap-2 transition-all"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-white/40" />
            <span>Search Workspace</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-white/10 bg-white/10 px-1.5 font-mono text-[9px] font-medium text-white/40">
              <span className="text-[10px]">Ctrl</span>K
            </kbd>
            <span className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-blue-300 text-[9px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5 shrink-0 scale-90 origin-right">
              AI Chats 🌸
            </span>
          </div>
        </Button>
      </div>

      {/* Mobile Search Icon Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="md:hidden h-9 w-9 text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
      >
        <Search className="w-4 h-4" />
      </Button>

      {/* User Actions on the Right */}
      <div className="flex items-center gap-3 shrink-0">
        <Button variant="ghost" size="icon" className="relative h-9 w-9 text-white/70 hover:text-white hover:bg-white/10 rounded-xl">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 px-2 gap-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl">
              <div className="w-7 h-7 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-xs">
                JD
              </div>
              <span className="hidden sm:inline text-xs font-semibold text-white/80">John Doe</span>
              <ChevronDown className="w-3 h-3 text-white/40" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 bg-slate-900 border-slate-800 text-white p-1 shadow-xl">
            <div className="px-3 py-2 border-b border-slate-850">
              <p className="text-xs font-bold text-white">John Doe</p>
              <p className="text-[10px] text-slate-400 mt-0.5">john.doe@company.com</p>
            </div>
            <DropdownMenuItem className="gap-2.5 py-2 px-3 rounded-md text-xs font-semibold cursor-pointer text-slate-300 hover:text-white hover:bg-white/10 focus:bg-white/10 focus:text-white">
              <User className="w-4 h-4 text-slate-400" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSectionChange('settings')} className="gap-2.5 py-2 px-3 rounded-md text-xs font-semibold cursor-pointer text-slate-300 hover:text-white hover:bg-white/10 focus:bg-white/10 focus:text-white">
              <Settings className="w-4 h-4 text-slate-400" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-800 my-1" />
            <DropdownMenuItem onClick={() => { logout(); navigate('/login'); }} className="text-rose-400 focus:text-rose-400 gap-2.5 py-2.5 px-3 rounded-md text-xs font-semibold cursor-pointer hover:bg-rose-500/10 focus:bg-rose-500/10">
              <LogOut className="w-4 h-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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