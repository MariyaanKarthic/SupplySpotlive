import React, { useState } from 'react';
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
  ClipboardList
} from 'lucide-react';
import { NavigationItem } from '../App';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
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
    title: 'Supplier Onboarding',
    items: [
      { id: 'registration' as NavigationItem, label: 'Vendor Registration', icon: UserPlus, badge: '3', badgeVariant: 'secondary' },
      { id: 'registration-review' as NavigationItem, label: 'Registration Review', icon: FileCheck, badge: '12', badgeVariant: 'destructive' },
      { id: 'vendors' as NavigationItem, label: 'Vendor Management', icon: Users },
    ]
  },
  {
    title: 'Supplier Portal',
    items: [
      { id: 'supplier-dashboard' as NavigationItem, label: 'Supplier Dashboard', icon: Monitor, badge: 'New', badgeVariant: 'default' },
    ]
  },
  {
    title: 'Procurement',
    items: [
      { id: 'sourcing-rfx' as NavigationItem, label: 'Sourcing & RFx', icon: Target, badge: '5', badgeVariant: 'default' },
      { id: 'rfq' as NavigationItem, label: 'RFQ Management', icon: Quote, badge: '2', badgeVariant: 'secondary' },
      { id: 'purchase-orders' as NavigationItem, label: 'Purchase Orders', icon: ShoppingCart },
      { id: 'purchase-requisitions' as NavigationItem, label: 'Purchase Requisitions', icon: ClipboardList, badge: 'New', badgeVariant: 'default' },
      { id: 'goods-receipts' as NavigationItem, label: 'Goods Receipts', icon: PackageCheck, badge: '3', badgeVariant: 'secondary' },
      { id: 'procurement-collaboration' as NavigationItem, label: 'Collaboration Dashboard', icon: Users2, badge: '8', badgeVariant: 'destructive' },
      { id: 'contracts' as NavigationItem, label: 'Contracts', icon: FileText },
    ]
  },
  {
    title: 'Finance & Payments',
    items: [
      { id: 'invoices' as NavigationItem, label: 'Invoices', icon: Receipt, badge: '7', badgeVariant: 'destructive' },
      { id: 'ap-automation' as NavigationItem, label: 'Ap Automation', icon: Zap },
      { id: 'payments' as NavigationItem, label: 'Payments', icon: CreditCard },
    ]
  },
  {
    title: 'Logistics',
    items: [
      { id: 'delivery-slots' as NavigationItem, label: 'Smart Delivery Slots', icon: Truck, badge: '24', badgeVariant: 'default' },
    ]
  },
  {
    title: 'Security & Access',
    items: [
      { id: 'gate-entry' as NavigationItem, label: 'Gate Entry Integration', icon: UserCheck, badge: '4', badgeVariant: 'secondary' },
    ]
  },
  {
    title: 'Support & Resolution',
    items: [
      { id: 'dispute-management' as NavigationItem, label: 'Dispute & Query Management', icon: MessageSquare, badge: '8', badgeVariant: 'destructive' },
    ]
  },
  {
    title: 'Management',
    items: [
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

  return (
    <header className="w-full h-16 bg-[#2a2c35] text-white flex items-center justify-between px-6 shadow-md border-b border-white/5 shrink-0 z-50">
      {/* Brand & Logo */}
      <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => onSectionChange('home')}>
        <Logo size="md" />
      </div>

      {/* Navigation Menus in the Center */}
      <nav className="hidden lg:flex items-center gap-1 xl:gap-2 flex-1 justify-center max-w-5xl px-4 overflow-x-auto scrollbar-none">
        {navigationGroups.map((group) => {
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
      </nav>

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
    </header>
  );
}