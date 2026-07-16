import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
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
    name: 'TechCorp Solutions',
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
          <p className="text-muted-foreground">Manage your vendor relationships and performance metrics</p>
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
            Performance
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
          <div className="text-center py-8">
            <h3 className="text-lg font-medium mb-2">Performance Dashboard</h3>
            <p className="text-muted-foreground">Comprehensive performance analytics and scoring for all vendors</p>
          </div>
        </TabsContent>

        <TabsContent value="scoring" className="space-y-6">
          <div className="text-center py-8">
            <h3 className="text-lg font-medium mb-2">Scoring & Evaluation</h3>
            <p className="text-muted-foreground">Advanced vendor scoring and evaluation framework</p>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="text-center py-8">
            <h3 className="text-lg font-medium mb-2">Insights & Actions</h3>
            <p className="text-muted-foreground">Data-driven insights and recommended actions for vendor management</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}