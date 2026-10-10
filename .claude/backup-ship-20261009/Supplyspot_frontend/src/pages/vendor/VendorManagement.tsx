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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useApi } from '@/hooks/useApi';
import { vendorService } from '@/services/api';
import { VendorPerformancePanel, VendorPanelTab, formatScore, scoreColor, gradeVariant, riskVariant, priorityColor } from './VendorPerformancePanel';

const yesNo = (value: any) => (value === undefined || value === null ? '' : value ? 'Yes' : 'No');

function VendorDetailSection({ title, rows }: { title: string; rows: [string, any][] }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">{title}</h4>
      <Card className="divide-y gap-0 py-0">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium text-right break-all">{value || '—'}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

interface VendorManagementProps {
  onNavigateToRegistration?: () => void;
  onNavigate?: (section: any) => void;
}

export function VendorManagement({ onNavigateToRegistration, onNavigate }: VendorManagementProps) {
  // ── Live data from API ──────────────────────────────────────────────────────
  const { data: vendorData, loading: vendorLoading, error: vendorError, refetch: refetchVendors } = useApi(
    useCallback(() => vendorService.getVendors({ page: 1, limit: 100 }) as any, [])
  );

  const { data: overviewData, loading: overviewLoading, error: overviewError, refetch: refetchOverview } = useApi(
    useCallback(() => vendorService.getPerformanceOverview() as any, [])
  );
  const overview = overviewData as any;
  const overviewRows: any[] = overview?.vendors || [];
  const scorecardWeights: Record<string, number> = overview?.weights || {};
  const kpiLabels: Record<string, string> = {
    delivery: 'On-Time Delivery',
    quality: 'Quality',
    cost: 'Cost Compliance',
    compliance: 'Compliance',
    responsiveness: 'Responsiveness',
  };
  const riskRows = overviewRows
    .filter((r) => r.riskLevel !== 'Low')
    .sort((a, b) => (a.riskLevel === b.riskLevel ? (a.overall ?? 0) - (b.overall ?? 0) : a.riskLevel === 'High' ? -1 : 1));
  const priorityRank: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
  const actionRows = overviewRows
    .flatMap((r) => (r.recommendedActions || []).map((a: any) => ({ ...a, vendorId: r.vendorId, vendorName: r.name })))
    .filter((a) => a.priority !== 'Low')
    .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);
  const hasTransactions = overview
    ? Object.values(overview.summary.transactions as Record<string, number>).some((n) => n > 0)
    : false;

  const parseJson = (value: any) => {
    try { return typeof value === 'string' ? JSON.parse(value) : (value || {}); } catch { return {}; }
  };

  const vendors = (vendorData as any)?.vendors?.map((v: any) => {
    const contactInfo = parseJson(v.contact_info);
    return {
      id: v.id,
      name: v.name,
      categoryRaw: v.category || 'other',
      category: v.category ? v.category.charAt(0).toUpperCase() + v.category.slice(1) : 'Other',
      contactName: contactInfo.name || '',
      contact: contactInfo.email || '',
      phone: contactInfo.phone || '',
      statusRaw: v.status || '',
      status: v.status === 'active' ? 'Active'
            : v.status === 'under_review' ? 'Under Review'
            : v.status === 'inactive' ? 'Inactive'
            : v.status === 'suspended' ? 'Suspended'
            : v.status === 'rejected' ? 'Rejected'
            : (v.status || ''),
      location: contactInfo.address || '',
      contracts: v.contracts_count || 0,
      totalSpend: Number(v.total_spend) || 0,
      rating: Number(v.rating) || 0,
      onboardDate: v.onboard_date ? String(v.onboard_date).split('T')[0] : '',
      taxId: v.tax_id || '',
      registrationNumber: v.registration_number || '',
      website: v.website || '',
      description: v.description || '',
      bankDetails: parseJson(v.bank_details),
      complianceInfo: parseJson(v.compliance_info),
    };
  }) || [];

  const formatINR = (amount: number) =>
    amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  // Discussions have no DB table yet
  const discussions: any[] = [];

  // ── Local UI state ──────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [isViewVendorOpen, setIsViewVendorOpen] = useState(false);
  const [selectedPerformanceVendor, setSelectedPerformanceVendor] = useState<any>(null);
  const [isPerformanceDetailOpen, setIsPerformanceDetailOpen] = useState(false);
  const [performanceTab, setPerformanceTab] = useState<VendorPanelTab>('performance');
  const [selectedScorecardVendor, setSelectedScorecardVendor] = useState<any>(null);
  const [isScorecardOpen, setIsScorecardOpen] = useState(false);
  const [selectedActionPlan, setSelectedActionPlan] = useState<any>(null);
  const [isActionPlanOpen, setIsActionPlanOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [isAlertReviewOpen, setIsAlertReviewOpen] = useState(false);
  const [isDiscussionsOpen, setIsDiscussionsOpen] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState<any>(null);
  const [isDiscussionDetailOpen, setIsDiscussionDetailOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [vendorToDelete, setVendorToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
      case 'Inactive':
      case 'Suspended':
      case 'Rejected': return 'destructive';
      default: return 'outline';
    }
  };

  const handleEditVendor = (vendor: any) => {
    setEditForm({
      id: vendor.id,
      name: vendor.name,
      category: vendor.categoryRaw,
      status: vendor.statusRaw,
      contactName: vendor.contactName,
      email: vendor.contact,
      phone: vendor.phone,
      address: vendor.location,
      taxId: vendor.taxId,
      registrationNumber: vendor.registrationNumber,
      website: vendor.website,
      description: vendor.description,
    });
    setEditError(null);
    setIsEditOpen(true);
  };

  const handleSaveVendor = async () => {
    if (!editForm) return;
    if (!editForm.name || editForm.name.trim().length < 2) {
      setEditError('Vendor name must be at least 2 characters.');
      return;
    }
    setIsSaving(true);
    setEditError(null);
    try {
      await vendorService.updateVendor(editForm.id, {
        name: editForm.name.trim(),
        category: editForm.category,
        status: editForm.status,
        contact: {
          name: editForm.contactName,
          email: editForm.email,
          phone: editForm.phone,
          address: editForm.address,
        },
        taxId: editForm.taxId,
        registrationNumber: editForm.registrationNumber,
        website: editForm.website,
        description: editForm.description,
      });
      setIsEditOpen(false);
      await Promise.all([refetchVendors(), refetchOverview()]);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update vendor');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!vendorToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await vendorService.deleteVendor(vendorToDelete.id);
      setVendorToDelete(null);
      await Promise.all([refetchVendors(), refetchOverview()]);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete vendor');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewVendor = (vendor: any) => {
    setSelectedVendor(vendor);
    setIsViewVendorOpen(true);
  };

  const handleViewPerformance = (vendor: { id: string; name: string }, tab: VendorPanelTab = 'performance') => {
    setSelectedPerformanceVendor(vendor);
    setPerformanceTab(tab);
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

  const handleViewActionPlan = (plan: any) => {
    setSelectedActionPlan(plan);
    setIsActionPlanOpen(true);
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
                      <td className="p-4">{formatINR(vendor.totalSpend)}</td>
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
                            <DropdownMenuItem onClick={() => handleEditVendor(vendor)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => { setDeleteError(null); setVendorToDelete(vendor); }}
                            >
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
            {[
              { key: 'delivery', label: 'Avg On-Time Delivery', sub: 'Across all vendors', border: 'border-l-blue-500', text: 'text-blue-600', bg: 'bg-blue-50', Icon: Clock },
              { key: 'quality', label: 'Avg Quality Score', sub: 'Across all vendors', border: 'border-l-rose-500', text: 'text-rose-600', bg: 'bg-rose-50', Icon: Activity },
              { key: 'cost', label: 'Avg Cost Compliance', sub: 'Invoice match and quote vs budget', border: 'border-l-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', Icon: DollarSign },
              { key: 'compliance', label: 'Avg Compliance Score', sub: `${overview?.summary.compliantVendors ?? 0} of ${overview?.summary.totalVendors ?? 0} fully compliant`, border: 'border-l-amber-500', text: 'text-amber-600', bg: 'bg-amber-50', Icon: Shield },
            ].map(({ key, label, sub, border, text, bg, Icon }) => (
              <Card key={key} className={`border-l-4 ${border} shadow-sm hover:shadow-md transition-all`}>
                <CardContent className="p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">{label}</p>
                    <p className="text-xl font-bold text-foreground mt-0.5">
                      {formatScore(overview?.summary.averageKpis?.[key], '%')}
                    </p>
                    <p className={`text-[11px] ${text} font-medium`}>{sub}</p>
                  </div>
                  <div className={`p-2.5 ${bg} rounded-lg`}>
                    <Icon className={`w-5 h-5 ${text}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {overview && !hasTransactions && (
            <p className="text-xs text-muted-foreground">
              No purchase orders, invoices or disputes are recorded yet, so delivery, quality, cost and responsiveness are based on each vendor's rating. They switch to actual figures as transactions are recorded.
            </p>
          )}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Vendor</th>
                    <th className="text-left p-4 font-medium">Total Spend</th>
                    <th className="text-left p-4 font-medium">Contracts</th>
                    <th className="text-left p-4 font-medium">Avg Rating</th>
                    <th className="text-left p-4 font-medium">Compliance</th>
                    <th className="text-left p-4 font-medium">Overall Score</th>
                    <th className="text-left p-4 font-medium">Risk</th>
                    <th className="text-left p-4 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {[...overviewRows].sort((a, b) => b.totalSpend - a.totalSpend).map((row) => (
                    <tr key={row.vendorId} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <p className="font-medium">{row.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{row.category}</p>
                      </td>
                      <td className="p-4">{formatINR(row.totalSpend)}</td>
                      <td className="p-4">{row.contracts}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          {row.rating || '—'}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={row.complianceStatus === 'Compliant' ? 'default' : row.complianceStatus === 'Partially Compliant' ? 'secondary' : 'destructive'}>
                          {row.complianceStatus}
                        </Badge>
                      </td>
                      <td className={`p-4 font-semibold ${scoreColor(row.overall)}`}>{formatScore(row.overall)}</td>
                      <td className="p-4"><Badge variant={riskVariant(row.riskLevel) as any}>{row.riskLevel}</Badge></td>
                      <td className="p-4">
                        <Button variant="ghost" size="sm" onClick={() => handleViewPerformance({ id: row.vendorId, name: row.name })}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!overviewLoading && overviewRows.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        {overviewError ? `Could not load performance data: ${overviewError}` : 'No vendors found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="scoring" className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Weighted Scorecard</h3>
            <p className="text-sm text-muted-foreground">KPI weights used to calculate each vendor's overall score</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {Object.entries(scorecardWeights).map(([key, weight]) => (
              <Card key={key} className="p-4 bg-slate-50/50 dark:bg-slate-900/20 border-none shadow-none text-center">
                <p className="text-xs text-muted-foreground font-medium uppercase mb-1">{kpiLabels[key] || key}</p>
                <h3 className="text-2xl font-bold">{weight}%</h3>
                <p className="text-[11px] text-muted-foreground">Avg {formatScore(overview?.summary.averageKpis?.[key])}</p>
              </Card>
            ))}
          </div>
          {overview && (
            <div className="flex flex-wrap gap-2 text-sm">
              {Object.entries(overview.summary.gradeCounts as Record<string, number>).map(([grade, count]) => (
                <Badge key={grade} variant={gradeVariant(grade) as any}>{grade}: {count}</Badge>
              ))}
              <Badge variant="outline">Not rated: {overview.summary.totalVendors - Object.values(overview.summary.gradeCounts as Record<string, number>).reduce((a, b) => a + b, 0)}</Badge>
            </div>
          )}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">#</th>
                    <th className="text-left p-4 font-medium">Vendor</th>
                    {Object.keys(scorecardWeights).map((key) => (
                      <th key={key} className="text-left p-4 font-medium">{kpiLabels[key] || key}</th>
                    ))}
                    <th className="text-left p-4 font-medium">Overall</th>
                    <th className="text-left p-4 font-medium">Grade</th>
                    <th className="text-left p-4 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {overviewRows.map((row, index) => (
                    <tr key={row.vendorId} className="border-b hover:bg-muted/50">
                      <td className="p-4 text-muted-foreground">{row.overall === null ? '—' : index + 1}</td>
                      <td className="p-4 font-medium">{row.name}</td>
                      {Object.keys(scorecardWeights).map((key) => (
                        <td key={key} className={`p-4 ${scoreColor(row.kpis[key])}`}>{formatScore(row.kpis[key])}</td>
                      ))}
                      <td className={`p-4 font-semibold ${scoreColor(row.overall)}`}>{formatScore(row.overall)}</td>
                      <td className="p-4"><Badge variant={gradeVariant(row.grade) as any}>{row.grade}</Badge></td>
                      <td className="p-4">
                        <Button variant="outline" size="sm" onClick={() => handleViewPerformance({ id: row.vendorId, name: row.name }, 'scoring')}>
                          Scorecard
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!overviewLoading && overviewRows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-muted-foreground">
                        {overviewError ? `Could not load scorecards: ${overviewError}` : 'No vendors found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="flex flex-col border-slate-200 shadow-none gap-0">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-red-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800">High-Risk Supplier Alerts</h3>
                </div>
                <Badge variant="outline">
                  {overview?.summary.riskCounts.High ?? 0} High · {overview?.summary.riskCounts.Medium ?? 0} Medium
                </Badge>
              </div>
              <div className="divide-y max-h-[420px] overflow-y-auto">
                {riskRows.length ? riskRows.map((row) => (
                  <div key={row.vendorId} className="p-4 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`w-4 h-4 ${row.riskLevel === 'High' ? 'text-red-600' : 'text-yellow-600'}`} />
                        <p className="font-medium text-sm">{row.name}</p>
                        <Badge variant={riskVariant(row.riskLevel) as any}>{row.riskLevel}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{row.riskReasons.join(' · ')}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleViewPerformance({ id: row.vendorId, name: row.name }, 'insights')}>
                      Review
                    </Button>
                  </div>
                )) : (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    {overviewLoading ? 'Loading...' : 'No active alerts.'}
                  </div>
                )}
              </div>
            </Card>
            <Card className="flex flex-col border-slate-200 shadow-none gap-0">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800">Recommended Actions</h3>
                </div>
                <Badge variant="outline">{actionRows.length} Open</Badge>
              </div>
              <div className="divide-y max-h-[420px] overflow-y-auto">
                {actionRows.length ? actionRows.map((action, i) => (
                  <div key={`${action.vendorId}-${i}`} className="p-4 flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="font-medium text-sm">{action.title}</p>
                      <p className="text-xs text-muted-foreground">{action.vendorName} · {action.reason}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-semibold ${priorityColor(action.priority)}`}>{action.priority}</span>
                      <Button variant="ghost" size="sm" onClick={() => handleViewPerformance({ id: action.vendorId, name: action.vendorName }, 'actions')}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )) : (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    {overviewLoading ? 'Loading...' : 'No actions needed.'}
                  </div>
                )}
              </div>
            </Card>
          </div>
          <Card className="border-emerald-100 bg-emerald-50/10 shadow-none">
            <div className="p-4 border-b border-emerald-100 flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-slate-800">Portfolio Snapshot</h3>
            </div>
            <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-5 border-none shadow-none bg-orange-50/60 gap-1">
                <h4 className="text-sm font-semibold text-slate-800">Total Vendors</h4>
                <div className="text-2xl font-bold text-slate-900">{overview?.summary.totalVendors ?? vendors.length}</div>
                <p className="text-[11px] text-muted-foreground">{overview?.summary.activeVendors ?? 0} active</p>
              </Card>
              <Card className="p-5 border-none shadow-none bg-pink-50/60 gap-1">
                <h4 className="text-sm font-semibold text-slate-800">Total Spend</h4>
                <div className="text-2xl font-bold text-slate-900">{formatINR(overview?.summary.totalSpend ?? 0)}</div>
                <p className="text-[11px] text-muted-foreground">{overview?.summary.totalContracts ?? 0} contracts</p>
              </Card>
              <Card className="p-5 border-none shadow-none bg-emerald-100/40 gap-1">
                <h4 className="text-sm font-semibold text-slate-800">Average Rating</h4>
                <div className="text-2xl font-bold text-slate-900">{formatScore(overview?.summary.averageRating, ' / 5')}</div>
                <p className="text-[11px] text-muted-foreground">Rated vendors only</p>
              </Card>
              <Card className="p-5 border-none shadow-none bg-blue-50/60 gap-1">
                <h4 className="text-sm font-semibold text-slate-800">Average Score</h4>
                <div className="text-2xl font-bold text-slate-900">{formatScore(overview?.summary.averageOverall, ' / 100')}</div>
                <p className="text-[11px] text-muted-foreground">Weighted scorecard</p>
              </Card>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Vendor Details Drawer */}
      <Drawer open={isViewVendorOpen} onOpenChange={setIsViewVendorOpen} direction="right">
        <DrawerContent className="sm:max-w-2xl p-0 gap-0 border-l shadow-2xl flex flex-col h-full bg-background">
          <DrawerHeader className="p-6 border-b shrink-0">
            <DrawerTitle className="text-xl font-semibold">{selectedVendor?.name}</DrawerTitle>
            <DrawerDescription className="flex items-center gap-2">
              <Badge variant="outline">{selectedVendor?.category}</Badge>
              <Badge variant={getStatusColor(selectedVendor?.status) as any}>{selectedVendor?.status}</Badge>
            </DrawerDescription>
          </DrawerHeader>
          {selectedVendor && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {selectedVendor.description && (
                <p className="text-sm text-muted-foreground">{selectedVendor.description}</p>
              )}
              <div className="grid grid-cols-3 gap-3">
                <Card className="p-4">
                  <p className="text-xs text-muted-foreground">Contracts</p>
                  <p className="text-xl font-semibold">{selectedVendor.contracts}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-muted-foreground">Total Spend</p>
                  <p className="text-xl font-semibold">{formatINR(selectedVendor.totalSpend)}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-muted-foreground">Rating</p>
                  <p className="text-xl font-semibold flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    {selectedVendor.rating || '—'}
                  </p>
                </Card>
              </div>
              <VendorDetailSection title="Contact" rows={[
                ['Contact Person', selectedVendor.contactName],
                ['Email', selectedVendor.contact],
                ['Phone', selectedVendor.phone],
                ['Address', selectedVendor.location],
                ['Website', selectedVendor.website],
              ]} />
              <VendorDetailSection title="Registration" rows={[
                ['Tax ID (GSTIN)', selectedVendor.taxId],
                ['Registration Number', selectedVendor.registrationNumber],
                ['Onboard Date', selectedVendor.onboardDate],
              ]} />
              <VendorDetailSection title="Bank Details" rows={[
                ['Bank', selectedVendor.bankDetails.bankName],
                ['Account Name', selectedVendor.bankDetails.accountName],
                ['Account Number', selectedVendor.bankDetails.accountNumber],
                ['IFSC', selectedVendor.bankDetails.ifsc],
              ]} />
              <VendorDetailSection title="Compliance" rows={[
                ['GST Verified', yesNo(selectedVendor.complianceInfo.gstVerified)],
                ['PAN Verified', yesNo(selectedVendor.complianceInfo.panVerified)],
                ['MSME Registered', yesNo(selectedVendor.complianceInfo.msmeRegistered)],
                ['ISO 9001', yesNo(selectedVendor.complianceInfo.iso9001)],
                ['Last Audit', selectedVendor.complianceInfo.lastAuditDate],
              ]} />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setIsViewVendorOpen(false); handleViewPerformance(selectedVendor); }}>
                  <Award className="w-4 h-4 mr-2" />
                  Performance & Insights
                </Button>
                <Button variant="outline" onClick={() => { setIsViewVendorOpen(false); handleEditVendor(selectedVendor); }}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Vendor
                </Button>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      {/* Vendor Performance Drawer */}
      <Drawer open={isPerformanceDetailOpen} onOpenChange={setIsPerformanceDetailOpen} direction="right">
        <DrawerContent className="sm:max-w-2xl p-0 gap-0 border-l shadow-2xl flex flex-col h-full bg-background">
          <DrawerHeader className="p-6 border-b shrink-0">
            <DrawerTitle className="text-xl font-semibold">{selectedPerformanceVendor?.name}</DrawerTitle>
            <DrawerDescription>Performance, analytics, scoring, insights and actions from live vendor records</DrawerDescription>
          </DrawerHeader>
          {selectedPerformanceVendor && (
            <div className="flex-1 overflow-y-auto p-6">
              <VendorPerformancePanel
                vendorId={selectedPerformanceVendor.id}
                tab={performanceTab}
                onTabChange={setPerformanceTab}
              />
            </div>
          )}
        </DrawerContent>
      </Drawer>

      {/* Edit Vendor Drawer */}
      <Drawer open={isEditOpen} onOpenChange={setIsEditOpen} direction="right">
        <DrawerContent className="sm:max-w-2xl p-0 gap-0 border-l shadow-2xl flex flex-col h-full bg-background">
          <DrawerHeader className="p-6 border-b shrink-0">
            <DrawerTitle className="text-xl font-semibold">Edit Vendor</DrawerTitle>
            <DrawerDescription>Update vendor details. Changes are saved to the backend.</DrawerDescription>
          </DrawerHeader>
          {editForm && (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="vendor-name">Vendor Name</Label>
                <Input id="vendor-name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={editForm.category} onValueChange={(value) => setEditForm({ ...editForm, category: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['technology', 'manufacturing', 'services', 'materials', 'logistics', 'consulting', 'other'].map((c) => (
                        <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-contact">Contact Person</Label>
                  <Input id="vendor-contact" value={editForm.contactName} onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-email">Email</Label>
                  <Input id="vendor-email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-phone">Phone</Label>
                  <Input id="vendor-phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-website">Website</Label>
                  <Input id="vendor-website" value={editForm.website} onChange={(e) => setEditForm({ ...editForm, website: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vendor-address">Address</Label>
                <Input id="vendor-address" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-tax">Tax ID (GSTIN)</Label>
                  <Input id="vendor-tax" value={editForm.taxId} onChange={(e) => setEditForm({ ...editForm, taxId: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-reg">Registration Number</Label>
                  <Input id="vendor-reg" value={editForm.registrationNumber} onChange={(e) => setEditForm({ ...editForm, registrationNumber: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vendor-desc">Description</Label>
                <Textarea id="vendor-desc" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
              </div>
              {editError && <p className="text-sm text-destructive">{editError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isSaving}>Cancel</Button>
                <Button onClick={handleSaveVendor} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      {/* Delete Vendor Confirmation */}
      <AlertDialog open={!!vendorToDelete} onOpenChange={(open) => { if (!open && !isDeleting) setVendorToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {vendorToDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the vendor and its details from the system. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={(e) => { e.preventDefault(); handleConfirmDelete(); }}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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