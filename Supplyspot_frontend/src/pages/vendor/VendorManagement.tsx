import React, { useState, useCallback } from 'react';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Phone,
  Mail,
  MapPin,
  Building,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Target,
  Zap,
  DollarSign,
  MessageSquare,
  Lightbulb,
  Award,
  Calculator,
  BarChart3,
  Users,
  FileText,
  Bell,
  Calendar,
  History,
  Settings2,
  Shield,
  Activity,
  ChevronRight,
  Download,
  Send,
  Reply,
  Paperclip,
  Star,
  Archive,
  MoreVertical,
  UserPlus,
  Clock2,
  MessageCircle
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { useApi } from '@/hooks/useApi';
import { vendorService } from '@/services/api';

// Weighted scorecard weights (static config — not yet stored in DB)
const scorecardWeights = {
  onTimeDelivery: 25,
  qualityCompliance: 30,
  costCompliance: 20,
  responsiveness: 15,
  innovation: 10
};

interface VendorManagementProps {
  onNavigateToRegistration?: () => void;
  onNavigate?: (section: any) => void;
}

export function VendorManagement({ onNavigateToRegistration, onNavigate }: VendorManagementProps) {
  // ── Live data from API ──────────────────────────────────────────────────────
  const { data: vendorData, loading: vendorLoading, error: vendorError } = useApi(
    useCallback(() => vendorService.getVendors({ page: 1, limit: 100 }) as any, [])
  );

  const vendors = (vendorData as any)?.vendors?.map((v: any) => {
    let contactInfo: any = {};
    try { contactInfo = typeof v.contact_info === 'string' ? JSON.parse(v.contact_info) : (v.contact_info || {}); } catch {}
    return {
      id: v.id,
      name: v.name,
      category: v.category ? v.category.charAt(0).toUpperCase() + v.category.slice(1) : 'Other',
      contact: contactInfo.email || '',
      phone: contactInfo.phone || '',
      status: v.status === 'active' ? 'Active'
            : v.status === 'under_review' ? 'Under Review'
            : v.status === 'inactive' ? 'Inactive'
            : (v.status || ''),
      location: contactInfo.address || '',
      contracts: v.contracts_count || 0,
      totalSpend: Number(v.total_spend) || 0,
      rating: Number(v.rating) || 0,
      onboardDate: v.onboard_date ? new Date(v.onboard_date).toISOString().split('T')[0] : '',
    };
  }) || [];

  // Performance / alerts / discussions — static placeholders (no DB tables yet)
  const performanceData: any[] = [];
  const vendorAlerts: any[] = [];
  const actionPlans: any[] = [];
  const discussions: any[] = [];
  const historicalData: any[] = [];

  // ── Local UI state ──────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [isViewVendorOpen, setIsViewVendorOpen] = useState(false);
  const [selectedPerformanceVendor, setSelectedPerformanceVendor] = useState<any>(null);
  const [isPerformanceDetailOpen, setIsPerformanceDetailOpen] = useState(false);
  const [selectedScorecardVendor, setSelectedScorecardVendor] = useState<any>(null);
  const [isScorecardOpen, setIsScorecardOpen] = useState(false);
  const [selectedActionPlan, setSelectedActionPlan] = useState<any>(null);
  const [isActionPlanOpen, setIsActionPlanOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [isAlertReviewOpen, setIsAlertReviewOpen] = useState(false);
  const [isDiscussionsOpen, setIsDiscussionsOpen] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState<any>(null);
  const [isDiscussionDetailOpen, setIsDiscussionDetailOpen] = useState(false);

  const filteredVendors = vendors.filter((vendor: any) =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.contact.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Helper functions ────────────────────────────────────────────────────────
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'default';
      case 'Under Review': return 'secondary';
      case 'Inactive': return 'destructive';
      default: return 'outline';
    }
  };

  const handleViewVendor = (vendor: any) => {
    setSelectedVendor(vendor);
    setIsViewVendorOpen(true);
  };

  const handleViewPerformance = (vendor: any) => {
    const performance = performanceData.find(p => p.vendorId === vendor.id);
    setSelectedPerformanceVendor({ ...vendor, performance });
    setIsPerformanceDetailOpen(true);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return 'default';
    if (score >= 80) return 'secondary';
    return 'destructive';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Target className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'Excellent': return 'text-green-600';
      case 'Satisfactory': return 'text-yellow-600';
      case 'Needs Improvement': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-green-600';
      case 'Medium': return 'text-yellow-600';
      case 'High': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'Low': return 'default';
      case 'Medium': return 'secondary';
      case 'High': return 'destructive';
      default: return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'High': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'Medium': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default: return <AlertTriangle className="w-4 h-4 text-blue-600" />;
    }
  };

  const calculateWeightedScore = (performance: any) => {
    const scores = {
      onTimeDelivery: performance.onTimeDelivery.score,
      qualityCompliance: performance.qualityCompliance.score,
      costCompliance: performance.costCompliance.score,
      responsiveness: performance.responsiveness.score,
      innovation: performance.innovation.score
    };
    let weightedSum = 0;
    let totalWeight = 0;
    Object.entries(scorecardWeights).forEach(([key, weight]) => {
      weightedSum += scores[key as keyof typeof scores] * weight;
      totalWeight += weight;
    });
    return Math.round(weightedSum / totalWeight * 100) / 100;
  };

  const handleViewScorecard = (vendor: any) => {
    const performance = performanceData.find(p => p.vendorId === vendor.id);
    setSelectedScorecardVendor({ ...vendor, performance });
    setIsScorecardOpen(true);
  };

  const handleViewActionPlan = (plan: any) => {
    setSelectedActionPlan(plan);
    setIsActionPlanOpen(true);
  };

  const handleReviewAlert = (alert: any) => {
    const vendor = vendors.find((v: any) => v.id === alert.vendorId);
    const performance = performanceData.find(p => p.vendorId === alert.vendorId);
    setSelectedAlert({ ...alert, vendor, performance });
    setIsAlertReviewOpen(true);
  };

  const handleViewAllDiscussions = () => {
    setIsDiscussionsOpen(true);
  };

  const handleViewDiscussion = (discussion: any) => {
    const vendor = vendors.find((v: any) => v.id === discussion.vendorId);
    setSelectedDiscussion({ ...discussion, vendor });
    setIsDiscussionDetailOpen(true);
  };

  const getDiscussionStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'text-green-600';
      case 'In Progress': return 'text-blue-600';
      case 'Pending': return 'text-yellow-600';
      case 'Resolved': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Active': return 'default';
      case 'In Progress': return 'secondary';
      case 'Pending': return 'outline';
      case 'Resolved': return 'secondary';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-600';
      case 'Medium': return 'text-yellow-600';
      case 'Low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Quality': return <Shield className="w-4 h-4" />;
      case 'Logistics': return <Clock className="w-4 h-4" />;
      case 'Contracts': return <FileText className="w-4 h-4" />;
      case 'Cost': return <DollarSign className="w-4 h-4" />;
      case 'Innovation': return <Lightbulb className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  return (
    <div className="px-6 pb-6 space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Sticky Header section with Breadcrumbs */}
      <div className="sticky top-0 bg-background/95 backdrop-blur z-20 border-b py-3 -mx-6 px-6 space-y-1.5 flex flex-col no-print">
        <Breadcrumb className="text-xs">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink 
                onClick={() => onNavigate && onNavigate("home")} 
                className="cursor-pointer"
              >
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Supplier Onboarding</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Vendor Management</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center justify-between w-full">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Vendor Management</h1>
          <div className="flex items-center gap-2">
          <Button
            className="gap-2"
            onClick={onNavigateToRegistration}
          >
            <Plus className="w-4 h-4" />
            Add Vendor
          </Button>
          <Button variant="outline" className="gap-2">
            <UserPlus className="w-4 h-4" />
            Registration Portal
          </Button>
        </div>
        </div>
      </div>

      {/* Vendor Registration CTA */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100">Secure Vendor Registration</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                New vendors must complete our comprehensive registration and compliance verification process
              </p>
            </div>
          </div>
          <Button
            onClick={onNavigateToRegistration}
            variant="outline"
            className="border-blue-200 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900"
          >
            Start Registration
          </Button>
        </div>
      </Card>

      {/* Loading / error state */}
      {vendorLoading && (
        <div className="text-sm text-muted-foreground text-center py-4">Loading vendors from API...</div>
      )}
      {vendorError && (
        <div className="text-sm text-destructive text-center py-2">⚠ Could not reach backend: {vendorError}</div>
      )}

      {/* Tabs Navigation */}
      <Tabs defaultValue="vendors" className="space-y-6">
        <TabsList className="w-fit">
          <TabsTrigger value="vendors" className="gap-2">
            <Building className="w-4 h-4" />
            Vendor List
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <Award className="w-4 h-4" />
            Performance Metrics
          </TabsTrigger>
          <TabsTrigger value="scoring" className="gap-2">
            <Calculator className="w-4 h-4" />
            Scoring & Evaluation
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Insights & Actions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vendors" className="space-y-6">
          {/* Search and Filters */}
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search vendors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>
          </Card>

          {/* Vendors Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Vendor</th>
                    <th className="text-left p-4 font-medium">Category</th>
                    <th className="text-left p-4 font-medium">Contact</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Contracts</th>
                    <th className="text-left p-4 font-medium">Total Spend</th>
                    <th className="text-left p-4 font-medium">Rating</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVendors.map((vendor: any) => (
                    <tr key={vendor.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{vendor.name}</p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {vendor.location}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">{vendor.category}</Badge>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="w-3 h-3" />
                            {vendor.contact}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            {vendor.phone}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={getStatusColor(vendor.status) as any}>
                          {vendor.status}
                        </Badge>
                      </td>
                      <td className="p-4">{vendor.contracts}</td>
                      <td className="p-4">${vendor.totalSpend.toLocaleString()}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          {vendor.rating}
                        </div>
                      </td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewVendor(vendor)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewPerformance(vendor)}>
                              <Award className="w-4 h-4 mr-2" />
                              Performance
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                  {!vendorLoading && filteredVendors.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        {vendorError ? 'Backend unavailable — start the backend server to see live data.' : 'No vendors found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Avg On-Time Delivery</p>
                  <p className="text-xl font-bold text-foreground mt-0.5">86%</p>
                  <p className="text-[11px] text-blue-600 font-medium">Across All Vendors</p>
                </div>
                <div className="p-2.5 bg-blue-50 rounded-lg">
                  <Award className="w-5 h-5 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-rose-500 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Avg Quality Score</p>
                  <p className="text-xl font-bold text-foreground mt-0.5">88.2%</p>
                  <p className="text-[11px] text-rose-600 font-medium">Across All Vendors</p>
                </div>
                <div className="p-2.5 bg-rose-50 rounded-lg">
                  <Activity className="w-5 h-5 text-rose-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Avg Cost Compliance</p>
                  <p className="text-xl font-bold text-foreground mt-0.5">94.2%</p>
                  <p className="text-[11px] text-emerald-600 font-medium">Budget adherence</p>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-lg">
                  <Clock className="w-5 h-5 text-emerald-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Innovation Score</p>
                  <p className="text-xl font-bold text-foreground mt-0.5">76.2%</p>
                  <p className="text-[11px] text-amber-600 font-medium">Value-add contributions</p>
                </div>
                <div className="p-2.5 bg-amber-50 rounded-lg">
                  <Target className="w-5 h-5 text-amber-600" />
                </div>
              </CardContent>
            </Card>
          </div>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground text-center">Performance metrics data will appear here once performance tracking is implemented in the backend.</p>
          </Card>
        </TabsContent>

        <TabsContent value="scoring" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Weighted Scorecard Configuration</h3>
              <p className="text-sm text-muted-foreground">Configure KPI weights and evaluation criteria</p>
            </div>
            <Button variant="outline" className="gap-2">
              <Settings2 className="w-4 h-4" />
              Configure Weights
            </Button>
          </div>
          <div className="grid grid-cols-5 gap-4">
            {Object.entries(scorecardWeights).map(([key, weight]) => (
              <Card key={key} className="p-4 bg-slate-50/50 dark:bg-slate-900/20 border-none shadow-none text-center">
                <p className="text-xs text-muted-foreground font-medium uppercase mb-1">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                <h3 className="text-2xl font-bold">{weight}%</h3>
              </Card>
            ))}
          </div>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground text-center">Vendor scorecards will appear once performance data is tracked in the backend.</p>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="flex flex-col border-slate-200 shadow-none">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-red-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800">High-Risk Supplier Alerts</h3>
                </div>
                <Badge variant="outline">{vendorAlerts.length} Active</Badge>
              </div>
              <div className="p-6 text-center text-sm text-muted-foreground">No active alerts.</div>
            </Card>
            <Card className="flex flex-col border-slate-200 shadow-none">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800">Corrective Action Plans</h3>
                </div>
                <Button variant="default" size="sm" className="h-8 bg-slate-900 text-white hover:bg-slate-800 gap-1.5">
                  <Plus className="w-3 h-3" /> Create Action Plan
                </Button>
              </div>
              <div className="p-6 text-center text-sm text-muted-foreground">No action plans.</div>
            </Card>
          </div>
          <Card className="border-emerald-100 bg-emerald-50/10 shadow-none">
            <div className="p-4 border-b border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-slate-800">Supplier Collaboration Portal</h3>
              </div>
              <div className="flex gap-2">
                <Button variant="default" size="sm" className="h-8 bg-slate-900 text-white gap-2">
                  <Send className="w-3 h-3" /> Send Message
                </Button>
                <Button variant="outline" size="sm" className="h-8 bg-white gap-2" onClick={handleViewAllDiscussions}>
                  <Eye className="w-3 h-3" /> View All Discussions
                </Button>
              </div>
            </div>
            <div className="p-6 grid grid-cols-3 gap-6">
              <Card className="p-5 border-none shadow-none bg-orange-50/60">
                <h4 className="text-sm font-semibold text-slate-800 mb-1">Active Discussions</h4>
                <div className="text-2xl font-bold text-slate-900 mb-0.5">{discussions.length}</div>
                <p className="text-[11px] text-muted-foreground">Open issue threads</p>
              </Card>
              <Card className="p-5 border-none shadow-none bg-pink-50/60">
                <h4 className="text-sm font-semibold text-slate-800 mb-1">Total Vendors</h4>
                <div className="text-2xl font-bold text-slate-900 mb-0.5">{vendors.length}</div>
                <p className="text-[11px] text-muted-foreground">Registered vendors</p>
              </Card>
              <Card className="p-5 border-none shadow-none bg-emerald-100/40">
                <h4 className="text-sm font-semibold text-slate-800 mb-1">Active Vendors</h4>
                <div className="text-2xl font-bold text-slate-900 mb-0.5">
                  {vendors.filter((v: any) => v.status === 'Active').length}
                </div>
                <p className="text-[11px] text-muted-foreground">Currently active</p>
              </Card>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alert Review Drawer */}
      <Drawer open={isAlertReviewOpen} onOpenChange={setIsAlertReviewOpen} direction="right">
        <DrawerContent className="sm:max-w-4xl p-0 gap-0 border-l border-slate-200 shadow-2xl flex flex-col h-full bg-white">
          <DrawerHeader className="p-6 border-b shrink-0">
            <DrawerTitle className="text-xl font-bold text-slate-800">High-Risk Supplier Alert Review</DrawerTitle>
            <DrawerDescription className="text-sm text-slate-500">Review and take action on supplier performance alert</DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto p-6">
            <p className="text-sm text-muted-foreground">No alert selected.</p>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}