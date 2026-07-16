import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './ui/sheet';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Checkbox } from './ui/checkbox';

const vendors = [
  {
    id: 1,
    name: 'Tech Solution Ltd',
    category: 'Technology',
    contact: 'john.smith@techcorp.com',
    phone: '+1 (555) 123-4567',
    status: 'Active',
    location: 'New York, NY',
    contracts: 3,
    totalSpend: 125000,
    rating: 4.8,
    onboardDate: '2023-01-15'
  },
  {
    id: 2,
    name: 'Global Supplies Ltd',
    category: 'Manufacturing',
    contact: 'maria.garcia@globalsupplies.com',
    phone: '+1 (555) 234-5678',
    status: 'Active',
    location: 'Chicago, IL',
    contracts: 2,
    totalSpend: 89000,
    rating: 4.5,
    onboardDate: '2023-02-20'
  },
  {
    id: 3,
    name: 'Premium Services Inc',
    category: 'Services',
    contact: 'david.wilson@premium.com',
    phone: '+1 (555) 345-6789',
    status: 'Under Review',
    location: 'Los Angeles, CA',
    contracts: 1,
    totalSpend: 45000,
    rating: 4.2,
    onboardDate: '2023-03-10'
  },
  {
    id: 4,
    name: 'Quick Logistics',
    category: 'Transportation',
    contact: 'sarah.johnson@quicklogistics.com',
    phone: '+1 (555) 456-7890',
    status: 'Inactive',
    location: 'Miami, FL',
    contracts: 0,
    totalSpend: 0,
    rating: 3.8,
    onboardDate: '2023-04-05'
  },
  {
    id: 5,
    name: 'Digital Systems Co',
    category: 'Technology',
    contact: 'michael.brown@digitalsystems.com',
    phone: '+1 (555) 567-8901',
    status: 'Active',
    location: 'Seattle, WA',
    contracts: 4,
    totalSpend: 156000,
    rating: 4.9,
    onboardDate: '2023-01-28'
  }
];

// Performance metrics data for each vendor
const performanceData = [
  {
    vendorId: 1,
    onTimeDelivery: { score: 94, trend: 'up', deliveries: 156, onTime: 147, late: 9 },
    qualityCompliance: { score: 96, defectRate: 2.1, rejectionRate: 1.3, returns: 4 },
    costCompliance: { score: 98, priceVariance: -1.2, budgetAdherence: 98.8, costSavings: 15200 },
    responsiveness: { score: 92, avgResponseTime: 2.3, issueResolutionTime: 4.2, responseRate: 98 },
    innovation: { score: 87, suggestions: 12, implementedIdeas: 8, valueAddProjects: 3 },
    overallScore: 93.4,
    rating: 'Excellent',
    riskLevel: 'Low',
    lastReview: '2023-09-01'
  },
  {
    vendorId: 2,
    onTimeDelivery: { score: 89, trend: 'stable', deliveries: 98, onTime: 87, late: 11 },
    qualityCompliance: { score: 94, defectRate: 3.2, rejectionRate: 2.1, returns: 6 },
    costCompliance: { score: 91, priceVariance: 2.8, budgetAdherence: 95.2, costSavings: 8900 },
    responsiveness: { score: 88, avgResponseTime: 3.1, issueResolutionTime: 5.8, responseRate: 94 },
    innovation: { score: 79, suggestions: 6, implementedIdeas: 4, valueAddProjects: 1 },
    overallScore: 88.2,
    rating: 'Satisfactory',
    riskLevel: 'Low',
    lastReview: '2023-08-28'
  },
  {
    vendorId: 3,
    onTimeDelivery: { score: 76, trend: 'down', deliveries: 45, onTime: 34, late: 11 },
    qualityCompliance: { score: 82, defectRate: 5.8, rejectionRate: 4.2, returns: 9 },
    costCompliance: { score: 85, priceVariance: 4.5, budgetAdherence: 91.2, costSavings: 2100 },
    responsiveness: { score: 74, avgResponseTime: 6.2, issueResolutionTime: 8.7, responseRate: 87 },
    innovation: { score: 65, suggestions: 3, implementedIdeas: 1, valueAddProjects: 0 },
    overallScore: 76.4,
    rating: 'Needs Improvement',
    riskLevel: 'Medium',
    lastReview: '2023-09-05'
  },
  {
    vendorId: 4,
    onTimeDelivery: { score: 68, trend: 'down', deliveries: 24, onTime: 16, late: 8 },
    qualityCompliance: { score: 71, defectRate: 8.1, rejectionRate: 6.4, returns: 12 },
    costCompliance: { score: 79, priceVariance: 6.8, budgetAdherence: 87.3, costSavings: -1200 },
    responsiveness: { score: 69, avgResponseTime: 7.8, issueResolutionTime: 12.3, responseRate: 82 },
    innovation: { score: 58, suggestions: 1, implementedIdeas: 0, valueAddProjects: 0 },
    overallScore: 69.0,
    rating: 'Needs Improvement',
    riskLevel: 'High',
    lastReview: '2023-09-10'
  },
  {
    vendorId: 5,
    onTimeDelivery: { score: 97, trend: 'up', deliveries: 203, onTime: 197, late: 6 },
    qualityCompliance: { score: 98, defectRate: 1.2, rejectionRate: 0.8, returns: 2 },
    costCompliance: { score: 96, priceVariance: -2.1, budgetAdherence: 99.2, costSavings: 23400 },
    responsiveness: { score: 95, avgResponseTime: 1.8, issueResolutionTime: 3.1, responseRate: 99 },
    innovation: { score: 92, suggestions: 18, implementedIdeas: 14, valueAddProjects: 5 },
    overallScore: 95.6,
    rating: 'Excellent',
    riskLevel: 'Low',
    lastReview: '2023-08-25'
  }
];

// Weighted scorecard configuration
const scorecardWeights = {
  onTimeDelivery: 25,
  qualityCompliance: 30,
  costCompliance: 20,
  responsiveness: 15,
  innovation: 10
};

// Risk alerts and action plans
const vendorAlerts = [
  {
    vendorId: 3,
    type: 'Quality',
    severity: 'Medium',
    message: 'Defect rate above acceptable threshold (5.8%)',
    date: '2023-09-12',
    status: 'Active'
  },
  {
    vendorId: 4,
    type: 'Delivery',
    severity: 'High',
    message: 'Repeated delivery delays - 3 consecutive late deliveries',
    date: '2023-09-15',
    status: 'Active'
  },
  {
    vendorId: 4,
    type: 'Quality',
    severity: 'High',
    message: 'Quality failures exceed threshold - immediate review required',
    date: '2023-09-14',
    status: 'Active'
  }
];

const actionPlans = [
  {
    vendorId: 3,
    title: 'Quality Improvement Program',
    description: 'Implement enhanced quality control measures and training',
    dueDate: '2023-10-15',
    status: 'In Progress',
    assignee: 'Quality Manager',
    actions: [
      'Conduct quality audit',
      'Implement process improvements',
      'Provide staff training',
      'Monthly quality reviews'
    ]
  },
  {
    vendorId: 4,
    title: 'Delivery Performance Recovery Plan',
    description: 'Address delivery delays and improve logistics coordination',
    dueDate: '2023-09-30',
    status: 'Urgent',
    assignee: 'Supply Chain Manager',
    actions: [
      'Review delivery processes',
      'Implement backup suppliers',
      'Weekly delivery meetings',
      'Performance monitoring'
    ]
  }
];

// Historical performance data (last 6 months)
const historicalData = [
  { month: 'Apr 2023', vendor1: 91, vendor2: 85, vendor3: 78, vendor4: 72, vendor5: 93 },
  { month: 'May 2023', vendor1: 92, vendor2: 86, vendor3: 77, vendor4: 71, vendor5: 94 },
  { month: 'Jun 2023', vendor1: 93, vendor2: 87, vendor3: 76, vendor4: 70, vendor5: 95 },
  { month: 'Jul 2023', vendor1: 94, vendor2: 88, vendor3: 77, vendor4: 69, vendor5: 96 },
  { month: 'Aug 2023', vendor1: 93, vendor2: 89, vendor3: 76, vendor4: 68, vendor5: 95 },
  { month: 'Sep 2023', vendor1: 93, vendor2: 88, vendor3: 76, vendor4: 69, vendor5: 96 }
];

// Discussions mock data
const discussions = [
  {
    id: 1,
    subject: 'Quality Improvement Initiative - Q4 2023',
    vendorId: 3,
    status: 'Active',
    priority: 'High',
    participants: ['John Doe', 'Sarah Chen', 'Mike Johnson'],
    lastActivity: '2023-09-15 14:30',
    messageCount: 12,
    category: 'Quality',
    isStarred: true,
    messages: [
      {
        id: 1,
        sender: 'John Doe',
        role: 'Procurement Manager',
        timestamp: '2023-09-10 09:15',
        content: 'We need to address the recent quality issues identified in your deliveries. The defect rate has increased to 5.8% which is above our acceptable threshold.',
        attachments: ['Quality_Report_Sept.pdf']
      },
      {
        id: 2,
        sender: 'Sarah Chen',
        role: 'Vendor Quality Manager',
        timestamp: '2023-09-10 15:30',
        content: 'Thank you for bringing this to our attention. We have reviewed the report and identified the root cause. We will implement corrective measures immediately.',
        attachments: []
      },
      {
        id: 3,
        sender: 'Mike Johnson',
        role: 'Operations Director',
        timestamp: '2023-09-12 11:45',
        content: 'We have implemented new quality control processes and retrained our production staff. We expect to see improvements within the next 2 weeks.',
        attachments: ['Improvement_Plan.pdf', 'Training_Schedule.xlsx']
      }
    ]
  },
  {
    id: 2,
    subject: 'Delivery Schedule Optimization',
    vendorId: 1,
    status: 'In Progress',
    priority: 'Medium',
    participants: ['Alice Wang', 'David Kim'],
    lastActivity: '2023-09-14 16:45',
    messageCount: 8,
    category: 'Logistics',
    isStarred: false,
    messages: [
      {
        id: 1,
        sender: 'Alice Wang',
        role: 'Supply Chain Manager',
        timestamp: '2023-09-08 10:20',
        content: 'We would like to discuss optimizing our delivery schedule to better align with our production needs.',
        attachments: []
      },
      {
        id: 2,
        sender: 'David Kim',
        role: 'Vendor Logistics Manager',
        timestamp: '2023-09-09 14:15',
        content: 'We are open to adjusting our delivery schedule. Could you provide your preferred delivery windows?',
        attachments: []
      }
    ]
  },
  {
    id: 3,
    subject: 'Contract Renewal Discussion',
    vendorId: 5,
    status: 'Pending',
    priority: 'High',
    participants: ['Robert Smith', 'Emma Wilson', 'Lisa Garcia'],
    lastActivity: '2023-09-13 13:20',
    messageCount: 15,
    category: 'Contracts',
    isStarred: true,
    messages: [
      {
        id: 1,
        sender: 'Robert Smith',
        role: 'Procurement Director',
        timestamp: '2023-09-05 09:00',
        content: 'We would like to start discussions for the contract renewal. Your performance has been excellent and we are interested in extending our partnership.',
        attachments: ['Performance_Summary.pdf']
      },
      {
        id: 2,
        sender: 'Emma Wilson',
        role: 'Vendor Account Manager',
        timestamp: '2023-09-05 16:30',
        content: 'Thank you for the positive feedback. We are excited to continue our partnership and would like to discuss improved terms for the next contract period.',
        attachments: ['Proposal_Draft.pdf']
      }
    ]
  },
  {
    id: 4,
    subject: 'Cost Reduction Proposals',
    vendorId: 2,
    status: 'Resolved',
    priority: 'Medium',
    participants: ['Michael Brown', 'Jennifer Lee'],
    lastActivity: '2023-09-11 10:15',
    messageCount: 6,
    category: 'Cost',
    isStarred: false,
    messages: [
      {
        id: 1,
        sender: 'Michael Brown',
        role: 'Cost Manager',
        timestamp: '2023-09-01 08:30',
        content: 'We are looking for opportunities to reduce costs while maintaining quality. Do you have any proposals?',
        attachments: []
      },
      {
        id: 2,
        sender: 'Jennifer Lee',
        role: 'Vendor Sales Manager',
        timestamp: '2023-09-02 11:45',
        content: 'We have identified several cost-saving opportunities through process optimization and bulk purchasing. Please find our detailed proposal attached.',
        attachments: ['Cost_Reduction_Proposal.pdf']
      }
    ]
  },
  {
    id: 5,
    subject: 'Innovation Partnership Program',
    vendorId: 1,
    status: 'Active',
    priority: 'Low',
    participants: ['Tom Zhang', 'Anna Rodriguez'],
    lastActivity: '2023-09-14 09:30',
    messageCount: 4,
    category: 'Innovation',
    isStarred: false,
    messages: [
      {
        id: 1,
        sender: 'Tom Zhang',
        role: 'Innovation Manager',
        timestamp: '2023-09-12 14:00',
        content: 'We are launching an innovation partnership program and would like to invite you to participate.',
        attachments: ['Innovation_Program_Overview.pdf']
      },
      {
        id: 2,
        sender: 'Anna Rodriguez',
        role: 'Vendor R&D Director',
        timestamp: '2023-09-13 16:20',
        content: 'This sounds like an exciting opportunity. We have several innovative solutions that could benefit your operations.',
        attachments: ['Innovation_Proposals.pdf']
      }
    ]
  }
];

interface VendorManagementProps {
  onNavigateToRegistration?: () => void;
}

export function VendorManagement({ onNavigateToRegistration }: VendorManagementProps) {
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

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.contact.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    const vendor = vendors.find(v => v.id === alert.vendorId);
    const performance = performanceData.find(p => p.vendorId === alert.vendorId);
    setSelectedAlert({ ...alert, vendor, performance });
    setIsAlertReviewOpen(true);
  };

  const handleViewAllDiscussions = () => {
    setIsDiscussionsOpen(true);
  };

  const handleViewDiscussion = (discussion: any) => {
    const vendor = vendors.find(v => v.id === discussion.vendorId);
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Vendor Management</h1>
        </div>
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

      {/* Rest of the component remains the same... */}
      {/* Tabs Navigation */}
      <Tabs defaultValue="vendors" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
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
                  {filteredVendors.map((vendor) => (
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
                        <Badge variant={getStatusColor(vendor.status)}>
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
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Other tab contents would continue here... */}
        <TabsContent value="performance" className="space-y-6">
          {/* Summary Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-0 border-none shadow-none bg-blue-50/80 dark:bg-blue-950/20">
              <div className="p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-blue-500/90 flex items-center justify-center text-white shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Avg On-Time Delivery</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-bold">86%</h3>
                    <span className="text-[10px] text-muted-foreground font-normal">Across All Vendors</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-0 border-none shadow-none bg-pink-50/50 dark:bg-pink-950/20">
              <div className="p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-pink-500 flex items-center justify-center text-white shrink-0">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Avg Quality Score</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-bold">88.2%</h3>
                    <span className="text-[10px] text-muted-foreground font-normal">Across All Vendors</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-0 border-none shadow-none bg-green-50/50 dark:bg-green-950/20">
              <div className="p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-green-600 flex items-center justify-center text-white shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Avg Cost Compliance</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-bold">94.2%</h3>
                    <span className="text-[10px] text-muted-foreground font-normal">Budget adherence</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-0 border-none shadow-none bg-orange-50/50 dark:bg-orange-950/20">
              <div className="p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-orange-500/80 flex items-center justify-center text-white shrink-0">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Innovation Score</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-bold">76.2%</h3>
                    <span className="text-[10px] text-muted-foreground font-normal">Value-add contributions</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search Vendor"
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-sm text-muted-foreground border-b italic">
                    <th className="p-4 text-left w-12 italic font-normal"><Checkbox /></th>
                    <th className="p-4 text-left italic font-normal">Vendor</th>
                    <th className="p-4 text-left italic font-normal">Overall score</th>
                    <th className="p-4 text-left italic font-normal">On-Time Delivery</th>
                    <th className="p-4 text-left italic font-normal">Quality Compliance</th>
                    <th className="p-4 text-left italic font-normal">Cost Compliance</th>
                    <th className="p-4 text-left italic font-normal">Responsiveness</th>
                    <th className="p-4 text-left italic font-normal">Innovation</th>
                    <th className="p-4 text-left italic font-normal">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {vendors.map((vendor) => {
                    const performance = performanceData.find(p => p.vendorId === vendor.id);
                    if (!performance) return null;
                    
                    return (
                      <tr key={vendor.id} className="border-b hover:bg-muted/50">
                        <td className="p-4"><Checkbox /></td>
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-blue-600">{vendor.name}</p>
                            <p className="text-xs text-muted-foreground">{vendor.category}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge 
                            className={`rounded-full px-3 py-1 font-medium border-none shadow-none text-white ${
                              performance.overallScore >= 90 ? 'bg-green-600' : 
                              performance.overallScore >= 80 ? 'bg-slate-100 text-slate-600' : 
                              'bg-red-700'
                            }`}
                          >
                            {performance.overallScore}%
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <span className={performance.onTimeDelivery.score >= 90 ? 'text-green-600' : 'text-red-500'}>
                              {performance.onTimeDelivery.score}%
                            </span>
                            {getTrendIcon(performance.onTimeDelivery.trend)}
                          </div>
                        </td>
                        <td className="p-4 text-yellow-600">
                          {performance.qualityCompliance.score}%
                        </td>
                        <td className="p-4 text-green-600">
                          {performance.costCompliance.score}%
                        </td>
                        <td className="p-4 text-green-600">
                          {performance.responsiveness.score}%
                        </td>
                        <td className="p-4 text-green-600">
                          {performance.innovation.score}%
                        </td>
                        <td className="p-4">
                          <Button variant="ghost" size="sm" onClick={() => handleViewPerformance(vendor)}>
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="scoring" className="space-y-6">
          {/* Header with Weights */}
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

          {/* Supplier Status Summary */}
          <div className="grid grid-cols-3 gap-6">
            <Card className="p-4 bg-green-50/50 dark:bg-green-950/10 border-none shadow-none">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded bg-green-600 flex items-center justify-center text-white">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-green-800 dark:text-green-300 font-medium">Excellent Suppliers</h4>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">15</span>
                    <span className="text-xs text-green-700/60 font-medium uppercase">Score ≥ 90%</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-yellow-50/50 dark:bg-yellow-950/10 border-none shadow-none">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded bg-yellow-600 flex items-center justify-center text-white">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-yellow-800 dark:text-yellow-300 font-medium">Satisfactory Suppliers</h4>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">12</span>
                    <span className="text-xs text-yellow-700/60 font-medium uppercase">Score 80-89%</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-red-50/50 dark:bg-red-950/10 border-none shadow-none">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded bg-red-600/80 flex items-center justify-center text-white">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-red-800 dark:text-red-300 font-medium">Needs Improvement</h4>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">12</span>
                    <span className="text-xs text-red-700/60 font-medium uppercase">Score &lt; 80%</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Category Comparison */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-slate-700">Category Performance Comparison</h4>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Technology', score: 94.5, count: 2 },
                { label: 'Manufacturing', score: 88.2, count: 1 },
                { label: 'Services', score: 76.4, count: 1 },
                { label: 'Transportation', score: 69.0, count: 1 }
              ].map((cat) => (
                <Card key={cat.label} className="p-4 shadow-none border border-slate-200">
                  <p className="text-sm font-medium mb-1">{cat.label}</p>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-xl font-bold">{cat.score}%</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{cat.count} suppliers</span>
                  </div>
                  <Progress value={cat.score} className="h-2 bg-slate-100" />
                </Card>
              ))}
            </div>
          </div>

          {/* Detailed Scoring Table */}
          <Card className="overflow-hidden border-slate-200 shadow-none">
            <div className="p-4 border-b bg-slate-50/50">
              <h3 className="font-semibold text-slate-800">Supplier Scoring & Evaluation</h3>
              <p className="text-xs text-muted-foreground">Weighted scorecard evaluation and comparative analysis</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/20 text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="p-4 text-left font-semibold">Supplier</th>
                    <th className="p-4 text-left font-semibold">Category</th>
                    <th className="p-4 text-left font-semibold">Weighted Score</th>
                    <th className="p-4 text-left font-semibold">Rating</th>
                    <th className="p-4 text-left font-semibold">Risk Level</th>
                    <th className="p-4 text-left font-semibold text-nowrap">Last Review</th>
                    <th className="p-4 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y">
                  {vendors.map((vendor) => {
                    const performance = performanceData.find(p => p.vendorId === vendor.id);
                    if (!performance) return null;
                    
                    return (
                      <tr key={vendor.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div className="font-medium text-slate-700">{vendor.name}</div>
                          <div className="text-[11px] text-muted-foreground">{vendor.location}</div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="font-normal text-[10px] uppercase tracking-tighter px-1.5 py-0">
                            {vendor.category}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <span className="font-bold min-w-[3rem]">{performance.overallScore}%</span>
                            <Progress value={performance.overallScore} className="h-1.5 w-20 bg-slate-200" />
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge 
                            variant="secondary"
                            className={`rounded-sm text-[10px] px-2 py-0.5 border-none ${
                              performance.rating === 'Excellent' ? 'bg-green-100 text-green-700' :
                              performance.rating === 'Satisfactory' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}
                          >
                            {performance.rating}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge 
                            className={`rounded-full text-[10px] px-2.5 py-0 border-none ${
                                performance.riskLevel === 'Low' ? 'bg-green-600/90 text-white' :
                                performance.riskLevel === 'Medium' ? 'bg-orange-500 text-white' :
                                'bg-red-600 text-white'
                            }`}
                          >
                            {performance.riskLevel}
                          </Badge>
                        </td>
                        <td className="p-4 text-[11px] text-muted-foreground">{performance.lastReview}</td>
                        <td className="p-4">
                          <Button variant="outline" size="sm" className="text-[10px] h-8" onClick={() => handleViewScorecard(vendor)}>
                            View Scorecard
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Alerts Section */}
            <Card className="flex flex-col border-slate-200 shadow-none">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-red-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800">High-Risk Supplier Alerts</h3>
                </div>
                <Badge variant="destructive" className="rounded-full px-2 py-0 h-5 text-[10px]">3 Active</Badge>
              </div>
              <div className="p-4 space-y-3">
                {vendorAlerts.map((alert, idx) => {
                  const vendor = vendors.find(v => v.id === alert.vendorId);
                  return (
                    <Card key={idx} className="p-3 border-slate-100 shadow-none bg-white hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-3">
                          <div className={`mt-0.5 ${alert.severity === 'High' ? 'text-red-500' : 'text-yellow-500'}`}>
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-slate-800">{vendor?.name}</h4>
                            <p className="text-xs text-muted-foreground">{alert.message}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">{alert.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            className={`rounded-sm text-[10px] px-1.5 py-0 border-none ${
                              alert.severity === 'High' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'
                            }`}
                          >
                            {alert.severity}
                          </Badge>
                          <Button variant="outline" size="sm" className="h-7 px-2 text-[10px]" onClick={() => handleReviewAlert(alert)}>
                            Review
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </Card>

            {/* Action Plans Section */}
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
              <div className="p-4 space-y-4">
                {actionPlans.map((plan, idx) => {
                  const vendor = vendors.find(v => v.id === plan.vendorId);
                  return (
                    <Card key={idx} className="p-4 border-slate-100 shadow-none bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-slate-800 text-sm">{plan.title}</h4>
                          <p className="text-[11px] text-blue-600 font-medium">{vendor?.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            className={`rounded-sm text-[10px] px-1.5 py-0 border-none uppercase ${
                              plan.status === 'Urgent' ? 'bg-red-600 text-white font-bold' : 'bg-green-600 text-white'
                            }`}
                          >
                            {plan.status}
                          </Badge>
                          <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => handleViewActionPlan(plan)}>
                            View Details
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Due: {plan.dueDate}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" /> Assignee: {plan.assignee}
                          </div>
                        </div>
                        <span className="font-medium">{plan.actions.length} action items</span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Collaboration Portal */}
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
                <div className="text-2xl font-bold text-slate-900 mb-0.5">8</div>
                <p className="text-[11px] text-muted-foreground">Open issue threads</p>
              </Card>
              <Card className="p-5 border-none shadow-none bg-pink-50/60">
                <h4 className="text-sm font-semibold text-slate-800 mb-1">Improvement Proposals</h4>
                <div className="text-2xl font-bold text-slate-900 mb-0.5">15</div>
                <p className="text-[11px] text-muted-foreground">Pending review</p>
              </Card>
              <Card className="p-5 border-none shadow-none bg-emerald-100/40">
                <h4 className="text-sm font-semibold text-slate-800 mb-1">Resolved Issues</h4>
                <div className="text-2xl font-bold text-slate-900 mb-0.5">42</div>
                <p className="text-[11px] text-muted-foreground">This month</p>
              </Card>
            </div>
          </Card>

          {/* Historical Table */}
          <Card className="overflow-hidden border-slate-200 shadow-none">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-700">
                <History className="w-5 h-5" />
                <h3 className="font-semibold text-slate-800">Historical Performance Trends</h3>
              </div>
              <Button variant="outline" size="sm" className="h-8 gap-2">
                <Download className="w-3 h-3" /> Export Report
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b text-xs font-semibold text-slate-600">
                    <th className="p-4 text-left">Month</th>
                    {vendors.map(v => (
                      <th key={v.id} className="p-4 text-left">{v.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-xs divide-y">
                  {historicalData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-4 font-semibold text-slate-700">{row.month}</td>
                      <td className="p-4">{row.vendor1}%</td>
                      <td className="p-4">{row.vendor2}%</td>
                      <td className="p-4">{row.vendor3}%</td>
                      <td className="p-4">{row.vendor4}%</td>
                      <td className="p-4">{row.vendor5}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet open={isAlertReviewOpen} onOpenChange={setIsAlertReviewOpen}>
        <SheetContent side="right" className="sm:max-w-4xl p-0 gap-0 border-l border-slate-200 shadow-2xl flex flex-col h-full bg-white">
          <SheetHeader className="p-6 border-b shrink-0">
            <div className="flex items-center justify-between pr-8">
              <div>
                <SheetTitle className="text-xl font-bold text-slate-800">High-Risk Supplier Alert Review</SheetTitle>
                <SheetDescription className="text-sm text-slate-500">Review and take action on supplier performance alert</SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Alert Overview Header */}
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="h-14 w-14 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                  <Building className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 leading-tight">{selectedAlert?.vendor?.name}</h3>
                  <p className="text-sm text-slate-500 font-medium">{selectedAlert?.vendor?.category} • {selectedAlert?.vendor?.location}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 px-3 py-1 font-bold text-[10px] uppercase tracking-wide">
                  {selectedAlert?.severity} Priority
                </Badge>
                <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 px-3 py-1 font-bold text-[10px] uppercase tracking-wide">
                  {selectedAlert?.type}
                </Badge>
              </div>
            </div>

            {/* Alert Details Card */}
            <Card className="p-5 border-slate-100 bg-slate-50 shadow-none rounded-xl">
              <h4 className="text-sm font-bold text-red-600 mb-3">Alert Details</h4>
              <p className="text-sm font-medium text-slate-800 mb-4">{selectedAlert?.message}</p>
              <div className="flex items-center gap-6 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5 font-medium">
                  <Calendar className="w-4 h-4" /> Alert Date: {selectedAlert?.date}
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <Zap className="w-4 h-4" /> Status: {selectedAlert?.status}
                </div>
              </div>
            </Card>

            {/* Current Performance Snapshot */}
            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-4">Current Performance Snapshot</h4>
              <div className="grid grid-cols-5 gap-4 text-center">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Overall Score</p>
                  <div className="text-xl font-bold text-slate-800">{selectedAlert?.performance?.overallScore}%</div>
                  <Badge className="bg-red-600 text-white rounded-sm text-[9px] px-2 py-0 border-none font-bold uppercase">Needs Improvement</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">On-Time Delivery</p>
                  <div className="text-xl font-bold text-slate-800">{selectedAlert?.performance?.onTimeDelivery?.score}%</div>
                  <div className="flex justify-center text-red-600"><TrendingDown className="w-4 h-4" /></div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Quality Score</p>
                  <div className="text-xl font-bold text-slate-800">{selectedAlert?.performance?.qualityCompliance?.score}%</div>
                  <p className="text-[10px] font-medium text-slate-500">{selectedAlert?.performance?.qualityCompliance?.defectRate}% defects</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Cost Compliance</p>
                  <div className="text-xl font-bold text-slate-800">{selectedAlert?.performance?.costCompliance?.score}%</div>
                  <p className="text-[10px] font-medium text-slate-500">+{selectedAlert?.performance?.costCompliance?.priceVariance}% variance</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Risk Level</p>
                  <div className="text-xl font-bold text-slate-800">{selectedAlert?.performance?.riskLevel}</div>
                  <Badge variant="secondary" className="bg-slate-100 text-slate-700 rounded-sm text-[9px] px-2 py-0 border-none font-bold uppercase">Medium</Badge>
                </div>
              </div>
            </div>

            {/* Impact Assessment */}
            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-4">Impact Assessment</h4>
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 shadow-none border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded bg-green-50 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-sm font-bold text-slate-800">Financial Impact</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mb-4">Potential cost implications</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Contract Value:</span>
                      <span className="font-bold text-slate-800">$45,000</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Risk Exposure:</span>
                      <span className="font-bold text-red-600">$6,750</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 shadow-none border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded bg-blue-50 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-bold text-slate-800">Operational Impact</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mb-4">Business continuity risks</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Active Contracts:</span>
                      <span className="font-bold text-slate-800">1</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Dependency Level:</span>
                      <span className="font-bold text-yellow-600">Medium</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 shadow-none border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded bg-purple-50 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-sm font-bold text-slate-800">Compliance Risk</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mb-4">Regulatory compliance status</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Audit Status:</span>
                      <span className="font-bold text-green-600">Compliant</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Risk Level:</span>
                      <span className="font-bold text-yellow-600">Medium</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Recommended Actions */}
            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-4">Recommended Actions</h4>
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 shadow-none border-slate-100 bg-white">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-8 w-8 rounded bg-blue-50 flex items-center justify-center text-blue-600">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-slate-800">Quality Improvement Plan</span>
                  </div>
                  <ul className="text-xs text-slate-500 space-y-2 list-disc pl-5">
                    <li>Conduct immediate quality audit</li>
                    <li>Review and update quality standards</li>
                    <li>Implement enhanced inspection procedures</li>
                  </ul>
                </Card>
                <Card className="p-4 shadow-none border-slate-100 bg-white">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-8 w-8 rounded bg-yellow-50 flex items-center justify-center text-yellow-600">
                      <Lightbulb className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-slate-800">Process Enhancement</span>
                  </div>
                  <ul className="text-xs text-slate-500 space-y-2 list-disc pl-5">
                    <li>Provide additional training to supplier staff</li>
                    <li>Implement real-time quality monitoring</li>
                    <li>Establish corrective action protocols</li>
                  </ul>
                </Card>
              </div>
            </div>

            {/* Review Details Form */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-sm font-bold text-slate-800">Review Details</h4>
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">Assign Reviewer</Label>
                  <Select>
                    <SelectTrigger className="h-10 text-xs bg-slate-50 border-none shadow-none">
                      <SelectValue placeholder="Select reviewer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="john">John Doe</SelectItem>
                      <SelectItem value="jane">Jane Smith</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">Review Priority</Label>
                  <Select>
                    <SelectTrigger className="h-10 text-xs bg-slate-50 border-none shadow-none">
                      <SelectValue placeholder="Set priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">Follow-up Date</Label>
                  <div className="relative">
                    <Input type="date" className="h-10 text-xs bg-slate-50 border-none shadow-none" defaultValue="2023-09-25" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">Review Notes & Comments</Label>
                <Textarea placeholder="Add your review notes, observations, and recommended next steps..." className="min-h-[100px] text-xs bg-slate-50 border-none shadow-none resize-none p-4" />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t bg-white shrink-0 flex flex-col gap-3">
            <div className="grid grid-cols-4 gap-2">
              <Button className="bg-slate-900 text-white hover:bg-black text-[11px] font-bold h-10 px-4">
                <CheckCircle className="w-4 h-4 mr-2" /> Complete Review
              </Button>
              <Button variant="outline" className="text-[11px] font-bold h-10 px-4 border-slate-200">
                <FileText className="w-4 h-4 mr-2" /> Generate Action Plan
              </Button>
              <Button variant="outline" className="text-[11px] font-bold h-10 px-4 border-slate-200">
                <Send className="w-4 h-4 mr-2" /> Notify Supplier
              </Button>
              <Button variant="outline" className="text-[11px] font-bold h-10 px-4 border-slate-200">
                <Users className="w-4 h-4 mr-2" /> Escalate to Management
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="text-[11px] font-bold h-10 px-4 border-slate-200">
                <Clock className="w-4 h-4 mr-2" /> Schedule Meeting
              </Button>
              <Button variant="destructive" className="bg-red-600 text-white hover:bg-red-700 text-[11px] font-bold h-10 px-4 border-none">
                <AlertTriangle className="w-4 h-4 mr-2" /> Mark as Critical
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}