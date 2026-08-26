import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { NavigationItem } from "../App";
import { 
  BarChart3, 
  UserPlus, 
  Users, 
  UserCheck, 
  Users2, 
  ShoppingCart, 
  Quote, 
  Truck, 
  Lock, 
  Clock, 
  Zap, 
  FileText, 
  PackageCheck, 
  Receipt, 
  Target, 
  MessageSquare, 
  ShieldAlert, 
  Share2,
  Database,
  RefreshCw,
  BellRing,
  ClipboardList
} from "lucide-react";

// Mock data for the Side Panel widgets
const recentLogs = [
  {
    id: 1,
    action: "Vendor Approved",
    details: "TechCorp Solutions registration approved",
    time: "10 mins ago",
    status: "success",
  },
  {
    id: 2,
    action: "Invoice Uploaded",
    details: "Invoice INV-2026-089 uploaded by Supplier",
    time: "32 mins ago",
    status: "info",
  },
  {
    id: 3,
    action: "Contract Updated",
    details: "Contract for Logistics Services updated",
    time: "2 hours ago",
    status: "warning",
  },
  {
    id: 4,
    action: "Dispute Opened",
    details: "Dispute DISP-402 raised by Finance Team",
    time: "4 hours ago",
    status: "error",
  },
];

const recentOrders = [
  {
    id: "PO-2026-0043",
    vendor: "Global Logistics",
    amount: "$12,450.00",
    status: "Pending",
    statusVariant: "warning" as const,
  },
  {
    id: "PO-2026-0042",
    vendor: "Prime Mfg Co.",
    amount: "$8,900.00",
    status: "Shipped",
    statusVariant: "info" as const,
  },
  {
    id: "PO-2026-0041",
    vendor: "Apex Solutions",
    amount: "$4,500.00",
    status: "Completed",
    statusVariant: "success" as const,
  },
];

const pendingRequests = [
  {
    id: "REQ-0024",
    type: "RFQ Response",
    title: "RFQ for Steel Pipes",
    sender: "SteelWorks",
    deadline: "Aug 20, 2026",
  },
  {
    id: "REQ-0025",
    type: "Vendor Registration",
    title: "Horizon Tech Onboarding",
    sender: "Horizon Tech",
    deadline: "Aug 22, 2026",
  },
];

interface HomeScreenProps {
  onNavigate: (section: NavigationItem) => void;
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  // Modules metadata derived from reference design layout
  const modules = [
    {
      id: "databoards" as NavigationItem,
      label: "Dashboard",
      icon: BarChart3,
      gradient: "from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20",
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100/80",
    },
    {
      id: "registration" as NavigationItem,
      label: "Vendor Registration",
      icon: UserPlus,
      gradient: "from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20",
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-100/80",
    },
    {
      id: "vendors" as NavigationItem,
      label: "Vendor Management",
      icon: Users,
      gradient: "from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20",
      iconColor: "text-indigo-600",
      iconBg: "bg-indigo-100/80",
    },
    {
      id: "supplier-dashboard" as NavigationItem,
      label: "Supplier",
      icon: UserCheck,
      gradient: "from-sky-500/10 to-blue-500/10 hover:from-sky-500/20 hover:to-sky-500/20",
      iconColor: "text-sky-600",
      iconBg: "bg-sky-100/80",
    },
    {
      id: "vendors" as NavigationItem, // Reuses VendorManagement mapping
      label: "Suppliers Management",
      icon: Users2,
      gradient: "from-violet-500/10 to-fuchsia-500/10 hover:from-violet-500/20 hover:to-fuchsia-500/20",
      iconColor: "text-violet-600",
      iconBg: "bg-violet-100/80",
    },
    {
      id: "purchase-orders" as NavigationItem,
      label: "Purchase Orders",
      icon: ShoppingCart,
      gradient: "from-pink-500/10 to-rose-500/10 hover:from-pink-500/20 hover:to-rose-500/20",
      iconColor: "text-pink-600",
      iconBg: "bg-pink-100/80",
    },
    {
      id: "purchase-requisitions" as NavigationItem,
      label: "Purchase Requisitions",
      icon: ClipboardList,
      gradient: "from-teal-500/10 to-emerald-500/10 hover:from-teal-500/20 hover:to-emerald-500/20",
      iconColor: "text-teal-600",
      iconBg: "bg-teal-100/80",
    },
    {
      id: "rfq" as NavigationItem,
      label: "Request for Quotation",
      icon: Quote,
      gradient: "from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20",
      iconColor: "text-amber-600",
      iconBg: "bg-amber-100/80",
    },
    {
      id: "delivery-slots" as NavigationItem,
      label: "Smart Delivery",
      icon: Truck,
      gradient: "from-cyan-500/10 to-teal-500/10 hover:from-cyan-500/20 hover:to-cyan-500/20",
      iconColor: "text-cyan-600",
      iconBg: "bg-cyan-100/80",
    },
    {
      id: "gate-entry" as NavigationItem,
      label: "Gate Entry Integration",
      icon: Lock,
      gradient: "from-red-500/10 to-orange-500/10 hover:from-red-500/20 hover:to-red-500/20",
      iconColor: "text-red-600",
      iconBg: "bg-red-100/80",
    },
    {
      id: "delivery-slots" as NavigationItem, // Map to delivery scheduling
      label: "Intelligent Scheduling",
      icon: Clock,
      gradient: "from-emerald-500/10 to-green-500/10 hover:from-emerald-500/20 hover:to-green-500/20",
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-100/80",
    },
    {
      id: "ap-automation" as NavigationItem,
      label: "Ap Automation",
      icon: Zap,
      gradient: "from-yellow-500/10 to-amber-500/10 hover:from-yellow-500/20 hover:to-amber-500/20",
      iconColor: "text-amber-600",
      iconBg: "bg-yellow-100/80",
    },
    {
      id: "invoices" as NavigationItem, // Map to invoices / capture
      label: "Invoice Capture & OCR",
      icon: FileText,
      gradient: "from-indigo-500/10 to-blue-500/10 hover:from-indigo-500/20 hover:to-blue-500/20",
      iconColor: "text-indigo-600",
      iconBg: "bg-indigo-100/80",
    },
    {
      id: "goods-receipts" as NavigationItem,
      label: "Goods receipts",
      icon: PackageCheck,
      gradient: "from-green-500/10 to-emerald-500/10 hover:from-green-500/20 hover:to-emerald-500/20",
      iconColor: "text-green-600",
      iconBg: "bg-green-100/80",
    },
    {
      id: "invoices" as NavigationItem,
      label: "Invoices",
      icon: Receipt,
      gradient: "from-sky-500/10 to-indigo-500/10 hover:from-sky-500/20 hover:to-indigo-500/20",
      iconColor: "text-sky-600",
      iconBg: "bg-sky-100/80",
    },
    {
      id: "regulatory-compliance" as NavigationItem,
      label: "Scoring & Evaluation",
      icon: Target,
      gradient: "from-rose-500/10 to-pink-500/10 hover:from-rose-500/20 hover:to-rose-500/20",
      iconColor: "text-rose-600",
      iconBg: "bg-rose-100/80",
    },
    {
      id: "dispute-management" as NavigationItem,
      label: "Dispute & Query Management",
      icon: MessageSquare,
      gradient: "from-orange-500/10 to-red-500/10 hover:from-orange-500/20 hover:to-red-500/20",
      iconColor: "text-orange-600",
      iconBg: "bg-orange-100/80",
    },
    {
      id: "audit-trail" as NavigationItem,
      label: "Workflow & Escalation",
      icon: ShieldAlert,
      gradient: "from-violet-500/10 to-purple-500/10 hover:from-violet-500/20 hover:to-purple-500/20",
      iconColor: "text-violet-600",
      iconBg: "bg-violet-100/80",
    },
    {
      id: "procurement-collaboration" as NavigationItem,
      label: "Resolution & Communication",
      icon: Share2,
      gradient: "from-blue-500/10 to-indigo-500/10 hover:from-blue-500/20 hover:to-indigo-500/20",
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100/80",
    },
    {
      id: "analytics" as NavigationItem,
      label: "Reporting",
      icon: Database,
      gradient: "from-teal-500/10 to-emerald-500/10 hover:from-teal-500/20 hover:to-emerald-500/20",
      iconColor: "text-teal-600",
      iconBg: "bg-teal-100/80",
    },
  ];

  return (
    <div className="p-6 md:p-8 max-w-[1700px] mx-auto space-y-8">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome Back</h1>
          <p className="text-slate-500 text-sm mt-1">Manage vendor lifecycles, payments, and logistics in one unified platform.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 h-9">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Data
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Grid: My Access (Module Icons) */}
        <div className="lg:col-span-3 space-y-5">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="text-xl font-semibold text-slate-800 tracking-tight">My Access</h2>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
              {modules.length} Modules Available
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-5">
            {modules.map((mod, idx) => {
              const IconComponent = mod.icon;
              return (
                <Button
                  key={`${mod.id}-${idx}`}
                  variant="outline"
                  onClick={() => onNavigate(mod.id)}
                  className={`group flex flex-col items-center justify-center p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 text-center min-h-[145px] cursor-pointer bg-gradient-to-br ${mod.gradient} h-auto w-full`}
                >
                  {/* Icon Frame */}
                  <div className={`p-3.5 rounded-2xl mb-3.5 transition-all duration-300 group-hover:scale-110 shadow-sm ${mod.iconBg} ${mod.iconColor}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  {/* Label */}
                  <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 line-clamp-2 max-w-[110px] leading-tight whitespace-normal">
                    {mod.label}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Right Info Box Container: Logs, Orders, Requests */}
        <div className="lg:col-span-1 space-y-6">
          {/* Recent Logs Box Container */}
          <Card className="border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between space-y-0 py-4 px-5">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-blue-500" />
                Recent Logs
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-blue-600 hover:text-blue-700 h-8 px-2"
                onClick={() => onNavigate("audit-trail")}
              >
                View All
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5">
              {recentLogs.map((log) => (
                <div key={log.id} className="text-xs border-b border-slate-50 last:border-0 pb-3 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-slate-800 line-clamp-1">{log.action}</span>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">{log.time}</span>
                  </div>
                  <p className="text-slate-500 mt-1 leading-relaxed line-clamp-2">{log.details}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Orders Box Container */}
          <Card className="border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between space-y-0 py-4 px-5">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-500" />
                Active Orders
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-emerald-600 hover:text-emerald-700 h-8 px-2"
                onClick={() => onNavigate("purchase-orders")}
              >
                Manage
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50 last:border-0">
                  <div>
                    <span className="font-bold text-slate-800">{order.id}</span>
                    <p className="text-slate-400 text-[10px] mt-0.5">{order.vendor}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-slate-800 block">{order.amount}</span>
                    <Badge 
                      variant={
                        order.statusVariant === "success" ? "default" :
                        order.statusVariant === "warning" ? "outline" : "secondary"
                      }
                      className={`text-[9px] px-1 py-0 h-4 mt-0.5 rounded-md ${
                        order.statusVariant === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        order.statusVariant === "warning" ? "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Requests Box Container */}
          <Card className="border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between space-y-0 py-4 px-5">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <BellRing className="w-4 h-4 text-amber-500" />
                Pending Requests
              </CardTitle>
              <Badge className="bg-amber-100 hover:bg-amber-100 text-amber-800 border-0 h-5 px-1.5 text-[10px]">
                {pendingRequests.length} New
              </Badge>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {pendingRequests.map((req) => (
                <div key={req.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <Badge className="bg-slate-200/80 text-slate-800 hover:bg-slate-200 border-0 text-[9px] px-1 py-0">
                      {req.type}
                    </Badge>
                    <span className="text-[10px] text-slate-400">Due: {req.deadline}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 line-clamp-1">{req.title}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">From: {req.sender}</p>
                  <div className="flex justify-end gap-2 mt-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-[10px] h-6 px-2.5 bg-white"
                      onClick={() => onNavigate(req.type === "RFQ Response" ? "rfq" : "registration-review")}
                    >
                      Process
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
