import React, { useState } from 'react';
import { 
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
  PanelLeft
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
import {
  Sidebar as ShadcnSidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
} from './ui/sidebar';

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
      { id: 'goods-receipts' as NavigationItem, label: 'Goods Receipts', icon: PackageCheck, badge: '3', badgeVariant: 'secondary' },
      { id: 'procurement-collaboration' as NavigationItem, label: 'Collaboration Dashboard', icon: Users2, badge: '8', badgeVariant: 'destructive' },
      { id: 'contracts' as NavigationItem, label: 'Contracts', icon: FileText },
    ]
  },
  {
    title: 'Finance & Payments',
    items: [
      { id: 'invoices' as NavigationItem, label: 'Invoices', icon: Receipt, badge: '7', badgeVariant: 'destructive' },
      { id: 'ap-automation' as NavigationItem, label: 'AP Automation', icon: Zap },
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
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const toggleGroup = (groupTitle: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(groupTitle)) {
      newCollapsed.delete(groupTitle);
    } else {
      newCollapsed.add(groupTitle);
    }
    setCollapsedGroups(newCollapsed);
  };

  return (
    <TooltipProvider>
      <ShadcnSidebar 
        collapsible="icon"
        className={cn(
          "bg-[#32343e] text-white border-r border-white/10 flex flex-col transition-all duration-300 h-screen shrink-0",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
          {/* Sidebar Header */}
          <SidebarHeader className="p-4 border-b border-white/10">
            <div className={cn("flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
              {!isCollapsed && <Logo size="md" />}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-white hover:bg-white/10"
                onClick={() => setIsCollapsed(!isCollapsed)}
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <PanelLeft className={cn("w-4 h-4 transition-transform duration-300", isCollapsed && "rotate-180")} />
              </Button>
            </div>
          </SidebarHeader>

          {/* Sidebar Content */}
          <SidebarContent className="flex-1 overflow-y-auto p-2 scrollbar-thin">
            {navigationGroups.map((group, groupIndex) => (
              <SidebarGroup key={group.title} className={cn("mb-2", groupIndex === 0 && "mt-1")}>
                {!isCollapsed && (
                  <SidebarGroupLabel 
                    className="flex items-center justify-between px-3 py-2 text-xs font-medium text-white/50 uppercase tracking-wider cursor-pointer hover:bg-white/10 rounded-md"
                    onClick={() => toggleGroup(group.title)}
                  >
                    <span>{group.title}</span>
                    {collapsedGroups.has(group.title) ? (
                      <ChevronRight className="w-3 h-3 text-white/50" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-white/50" />
                    )}
                  </SidebarGroupLabel>
                )}

                {(!collapsedGroups.has(group.title) || isCollapsed) && (
                  <SidebarGroupContent>
                    <SidebarMenu className="space-y-1 mt-1">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeSection === item.id;

                        return (
                          <SidebarMenuItem key={item.id}>
                            <SidebarMenuButton
                              isActive={isActive}
                              onClick={() => onSectionChange(item.id)}
                              tooltip={item.label}
                              className={cn(
                                "w-full justify-start gap-3 h-9 px-3 text-white/70 hover:text-white hover:bg-white/10 transition-colors",
                                isActive && "bg-white/20 text-white font-medium hover:bg-white/25",
                                isCollapsed && "justify-center px-0"
                              )}
                            >
                              <Icon className={cn(
                                "w-4 h-4 flex-shrink-0",
                                isActive ? "text-white" : "text-white/70"
                              )} />
                              {!isCollapsed && (
                                <span className="flex-1 text-left truncate">{item.label}</span>
                              )}
                            </SidebarMenuButton>

                            {!isCollapsed && item.badge && (
                              <SidebarMenuBadge 
                                className={cn(
                                  "ml-auto text-xs px-1.5 py-0.5 rounded-full",
                                  item.badgeVariant === 'destructive' && "bg-destructive text-destructive-foreground",
                                  item.badgeVariant === 'secondary' && "bg-white/20 text-white",
                                  (!item.badgeVariant || item.badgeVariant === 'default') && "bg-primary text-primary-foreground"
                                )}
                              >
                                {item.badge}
                              </SidebarMenuBadge>
                            )}
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                )}
              </SidebarGroup>
            ))}
          </SidebarContent>

          {/* Sidebar Footer */}
          <SidebarFooter className="p-4 border-t border-white/10 space-y-4">
            {!isCollapsed && (
              <div className="flex items-center justify-between px-2">
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 relative">
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full border-2 border-[#32343e]" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 relative">
                    <Shield className="w-4 h-4" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full border-2 border-[#32343e]" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10">
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={cn(
                  "w-full justify-start gap-3 h-12 p-3 text-white hover:bg-white/10",
                  isCollapsed && "justify-center px-0"
                )}>
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-white">JD</span>
                  </div>
                  {!isCollapsed && (
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold">John Doe</p>
                      <p className="text-[10px] text-white/50 uppercase tracking-wide">System Administrator</p>
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Shield className="mr-2 h-4 w-4" />
                  Security
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Help & Support
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => { logout(); navigate('/login'); }}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </ShadcnSidebar>
      </TooltipProvider>
  );
}