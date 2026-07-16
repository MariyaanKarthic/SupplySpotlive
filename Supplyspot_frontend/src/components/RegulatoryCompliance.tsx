import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Globe,
  Leaf,
  Factory,
  Zap,
  Recycle,
  Award,
  FileText,
  Eye,
  Download,
  Upload,
  Search,
  Filter,
  Bell,
  BarChart3,
  Calendar,
  MapPin,
  Users,
  Building2,
  ExternalLink,
  RefreshCw,
  Settings,
  Plus,
  Edit,
  Trash2,
  Star,
  Target,
  Activity,
  Gauge,
  AlertCircle,
  Info,
  ChevronRight,
  Grid,
  List,
  Table as TableIcon,
  ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DraggableTableRow, DraggableTableHeader } from './ui/draggable-table-row';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { format } from 'date-fns';

interface RegulatoryAlert {
  id: string;
  title: string;
  description: string;
  type: 'regulatory' | 'sustainability' | 'compliance' | 'environmental';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  status: 'active' | 'resolved' | 'monitoring' | 'acknowledged';
  jurisdiction: string;
  effectiveDate: Date;
  impactedSuppliers: number;
  regulatoryBody: string;
  source: string;
  tags: string[];
  actionRequired: boolean;
  deadline?: Date;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ComplianceFramework {
  id: string;
  name: string;
  category: 'environmental' | 'social' | 'governance' | 'industry' | 'regional';
  description: string;
  jurisdiction: string;
  status: 'active' | 'draft' | 'deprecated';
  requirements: ComplianceRequirement[];
  lastUpdated: Date;
  supplierCoverage: number;
  complianceRate: number;
}

interface ComplianceRequirement {
  id: string;
  title: string;
  description: string;
  mandatory: boolean;
  documentRequired: boolean;
  certificationRequired: boolean;
  renewalFrequency?: 'annual' | 'biannual' | 'triennial' | 'ongoing';
  nextReview?: Date;
  weight: number;
}

interface SustainabilityMetric {
  id: string;
  supplierId: string;
  supplierName: string;
  category: 'carbon' | 'water' | 'waste' | 'energy' | 'social' | 'governance';
  metric: string;
  value: number;
  unit: string;
  targetValue?: number;
  benchmarkValue?: number;
  trend: 'improving' | 'stable' | 'declining';
  lastUpdated: Date;
  verificationStatus: 'verified' | 'self-reported' | 'pending';
  score: number;
}

interface RiskAssessment {
  id: string;
  supplierId: string;
  supplierName: string;
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  categories: {
    regulatory: { score: number; trend: 'improving' | 'stable' | 'declining' };
    environmental: { score: number; trend: 'improving' | 'stable' | 'declining' };
    social: { score: number; trend: 'improving' | 'stable' | 'declining' };
    governance: { score: number; trend: 'improving' | 'stable' | 'declining' };
  };
  lastAssessment: Date;
  nextAssessment: Date;
  assessmentMethod: 'automated' | 'manual' | 'third-party';
  flaggedIssues: string[];
}

const mockRegulatoryAlerts: RegulatoryAlert[] = [
  {
    id: 'REG-001',
    title: 'EU Corporate Sustainability Reporting Directive (CSRD) Update',
    description: 'New requirements for detailed sustainability reporting with extended scope covering more companies. Mandatory ESG disclosures with standardized reporting formats.',
    type: 'regulatory',
    severity: 'critical',
    status: 'active',
    jurisdiction: 'European Union',
    effectiveDate: new Date('2024-01-01'),
    impactedSuppliers: 45,
    regulatoryBody: 'European Commission',
    source: 'Official Journal of the European Union',
    tags: ['ESG', 'Reporting', 'Sustainability', 'CSRD'],
    actionRequired: true,
    deadline: new Date('2024-06-30'),
    assignedTo: 'Compliance Team',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'REG-002',
    title: 'Carbon Border Adjustment Mechanism (CBAM) Implementation',
    description: 'EU CBAM requires detailed carbon content reporting for imports in cement, iron and steel, aluminum, fertilizers, electricity and hydrogen sectors.',
    type: 'environmental',
    severity: 'high',
    status: 'monitoring',
    jurisdiction: 'European Union',
    effectiveDate: new Date('2024-10-01'),
    impactedSuppliers: 23,
    regulatoryBody: 'European Commission',
    source: 'CBAM Regulation (EU) 2023/956',
    tags: ['Carbon', 'Emissions', 'Import', 'CBAM'],
    actionRequired: true,
    deadline: new Date('2024-09-01'),
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-18')
  },
  {
    id: 'REG-003',
    title: 'UK Modern Slavery Act Statement Requirements',
    description: 'Annual transparency statement requirements for businesses with turnover over £36 million. Enhanced due diligence on supply chain practices.',
    type: 'compliance',
    severity: 'medium',
    status: 'acknowledged',
    jurisdiction: 'United Kingdom',
    effectiveDate: new Date('2024-04-01'),
    impactedSuppliers: 31,
    regulatoryBody: 'UK Home Office',
    source: 'Modern Slavery Act 2015',
    tags: ['Human Rights', 'Supply Chain', 'Due Diligence'],
    actionRequired: false,
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: 'REG-004',
    title: 'California Climate Corporate Data Accountability Act',
    description: 'Mandatory climate-related financial disclosures for large companies operating in California. Scope 1, 2, and 3 emissions reporting required.',
    type: 'sustainability',
    severity: 'high',
    status: 'active',
    jurisdiction: 'California, USA',
    effectiveDate: new Date('2024-07-01'),
    impactedSuppliers: 18,
    regulatoryBody: 'California Air Resources Board',
    source: 'SB 253',
    tags: ['Climate', 'Emissions', 'Disclosure', 'California'],
    actionRequired: true,
    deadline: new Date('2024-05-15'),
    assignedTo: 'Environmental Team',
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-21')
  }
];

const mockComplianceFrameworks: ComplianceFramework[] = [
  {
    id: 'FW-001',
    name: 'ISO 14001 Environmental Management',
    category: 'environmental',
    description: 'International standard for environmental management systems helping organizations improve their environmental performance.',
    jurisdiction: 'Global',
    status: 'active',
    lastUpdated: new Date('2024-01-15'),
    supplierCoverage: 89,
    complianceRate: 92,
    requirements: [
      {
        id: 'REQ-001',
        title: 'Environmental Policy',
        description: 'Documented environmental policy aligned with organizational purpose',
        mandatory: true,
        documentRequired: true,
        certificationRequired: false,
        renewalFrequency: 'annual',
        nextReview: new Date('2024-12-31'),
        weight: 15
      },
      {
        id: 'REQ-002',
        title: 'ISO 14001 Certification',
        description: 'Valid ISO 14001 certification from accredited body',
        mandatory: true,
        documentRequired: true,
        certificationRequired: true,
        renewalFrequency: 'triennial',
        nextReview: new Date('2026-06-30'),
        weight: 30
      }
    ]
  },
  {
    id: 'FW-002',
    name: 'Global Reporting Initiative (GRI)',
    category: 'social',
    description: 'Comprehensive sustainability reporting framework covering economic, environmental, and social impacts.',
    jurisdiction: 'Global',
    status: 'active',
    lastUpdated: new Date('2024-01-20'),
    supplierCoverage: 65,
    complianceRate: 78,
    requirements: [
      {
        id: 'REQ-003',
        title: 'GRI Standards Reporting',
        description: 'Sustainability report following GRI Standards',
        mandatory: false,
        documentRequired: true,
        certificationRequired: false,
        renewalFrequency: 'annual',
        weight: 25
      }
    ]
  }
];

const mockSustainabilityMetrics: SustainabilityMetric[] = [
  {
    id: 'MET-001',
    supplierId: 'SUP-001',
    supplierName: 'EcoTech Manufacturing',
    category: 'carbon',
    metric: 'Carbon Emissions (Scope 1+2)',
    value: 1250,
    unit: 'tCO2e',
    targetValue: 1000,
    benchmarkValue: 1500,
    trend: 'improving',
    lastUpdated: new Date('2024-01-15'),
    verificationStatus: 'verified',
    score: 85
  },
  {
    id: 'MET-002',
    supplierId: 'SUP-002',
    supplierName: 'GreenPack Solutions',
    category: 'waste',
    metric: 'Waste Diverted from Landfill',
    value: 95,
    unit: '%',
    targetValue: 98,
    benchmarkValue: 85,
    trend: 'stable',
    lastUpdated: new Date('2024-01-18'),
    verificationStatus: 'self-reported',
    score: 92
  },
  {
    id: 'MET-003',
    supplierId: 'SUP-003',
    supplierName: 'Renewable Energy Corp',
    category: 'energy',
    metric: 'Renewable Energy Usage',
    value: 78,
    unit: '%',
    targetValue: 90,
    benchmarkValue: 65,
    trend: 'improving',
    lastUpdated: new Date('2024-01-20'),
    verificationStatus: 'verified',
    score: 88
  }
];

const mockRiskAssessments: RiskAssessment[] = [
  {
    id: 'RISK-001',
    supplierId: 'SUP-001',
    supplierName: 'EcoTech Manufacturing',
    overallRisk: 'low',
    riskScore: 25,
    categories: {
      regulatory: { score: 20, trend: 'stable' },
      environmental: { score: 15, trend: 'improving' },
      social: { score: 30, trend: 'stable' },
      governance: { score: 35, trend: 'improving' }
    },
    lastAssessment: new Date('2024-01-15'),
    nextAssessment: new Date('2024-04-15'),
    assessmentMethod: 'automated',
    flaggedIssues: []
  },
  {
    id: 'RISK-002',
    supplierId: 'SUP-004',
    supplierName: 'Global Logistics Ltd',
    overallRisk: 'high',
    riskScore: 78,
    categories: {
      regulatory: { score: 85, trend: 'declining' },
      environmental: { score: 75, trend: 'stable' },
      social: { score: 70, trend: 'declining' },
      governance: { score: 82, trend: 'stable' }
    },
    lastAssessment: new Date('2024-01-10'),
    nextAssessment: new Date('2024-02-10'),
    assessmentMethod: 'third-party',
    flaggedIssues: ['Regulatory non-compliance in subsidiary', 'Missing sustainability certifications', 'Delayed ESG reporting']
  }
];

export function RegulatoryCompliance() {
  const [activeTab, setActiveTab] = useState('alerts');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedAlert, setSelectedAlert] = useState<RegulatoryAlert | null>(null);
  const [selectedFramework, setSelectedFramework] = useState<ComplianceFramework | null>(null);
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [complianceViewMode, setComplianceViewMode] = useState<'card' | 'list' | 'table'>('table');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Dnd-kit sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      // Handle reorder if needed
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(filteredAlerts.map((a) => a.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'info': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-red-600 bg-red-50';
      case 'resolved': return 'text-green-600 bg-green-50';
      case 'monitoring': return 'text-yellow-600 bg-yellow-50';
      case 'acknowledged': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'regulatory': return FileText;
      case 'sustainability': return Leaf;
      case 'compliance': return ShieldCheck;
      case 'environmental': return Globe;
      default: return AlertTriangle;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'declining': return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'stable': return <Activity className="w-4 h-4 text-blue-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const filteredAlerts = mockRegulatoryAlerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         alert.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         alert.jurisdiction.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
    const matchesType = filterType === 'all' || alert.type === filterType;
    return matchesSearch && matchesSeverity && matchesType;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-primary" />
            Regulatory & Sustainability Monitoring
          </h1>
          <p className="text-muted-foreground mt-2">
            Continuous monitoring of regulatory changes and sustainability requirements for proactive compliance management
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Sync Updates
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
          <Dialog open={showCreateAlert} onOpenChange={setShowCreateAlert}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Alert
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Regulatory Alert</DialogTitle>
                <DialogDescription>
                  Add a new regulatory or sustainability alert for monitoring
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Alert Title</Label>
                  <Input placeholder="Enter alert title" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea placeholder="Detailed description of the regulatory change" rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regulatory">Regulatory</SelectItem>
                        <SelectItem value="sustainability">Sustainability</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                        <SelectItem value="environmental">Environmental</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Severity</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Jurisdiction</Label>
                  <Input placeholder="e.g., European Union, United States" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateAlert(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setShowCreateAlert(false)}>
                    Create Alert
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Alerts</p>
                <p className="text-2xl font-bold">24</p>
                <p className="text-xs text-red-600">4 critical</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Compliance Rate</p>
                <p className="text-2xl font-bold">87%</p>
                <p className="text-xs text-green-600">+3% this month</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sustainability Score</p>
                <p className="text-2xl font-bold">8.2</p>
                <p className="text-xs text-muted-foreground">out of 10</p>
              </div>
              <Leaf className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Risk Suppliers</p>
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-orange-600">High risk</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="alerts">Regulatory Alerts</TabsTrigger>
          <TabsTrigger value="frameworks">Compliance Frameworks</TabsTrigger>
          <TabsTrigger value="sustainability">Sustainability Metrics</TabsTrigger>
          <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
          <TabsTrigger value="monitoring">Real-time Monitoring</TabsTrigger>
        </TabsList>

        {/* Regulatory Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          {/* Critical Alerts Banner */}
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">Critical Regulatory Updates Detected</AlertTitle>
            <AlertDescription className="text-red-700">
              4 critical regulatory alerts require immediate attention. Review and assign actions to ensure compliance.
            </AlertDescription>
          </Alert>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search alerts by title, jurisdiction, or regulatory body..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="regulatory">Regulatory</SelectItem>
                    <SelectItem value="sustainability">Sustainability</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="environmental">Environmental</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* View Toggle Buttons */}
          <div className="flex items-center border rounded-md w-fit">
            <Button
              variant={complianceViewMode === 'card' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setComplianceViewMode('card')}
              className="rounded-r-none"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={complianceViewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setComplianceViewMode('list')}
              className="rounded-none border-l border-r"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={complianceViewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setComplianceViewMode('table')}
              className="rounded-l-none"
            >
              <TableIcon className="w-4 h-4" />
            </Button>
          </div>

          {/* Alerts List */}
          {complianceViewMode === 'card' && (
            <div className="space-y-4">
              {filteredAlerts.map((alert) => {
              const TypeIcon = getTypeIcon(alert.type);
              return (
                <Card key={alert.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <TypeIcon className="w-5 h-5 text-muted-foreground" />
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          <Badge variant="outline" className={getStatusColor(alert.status)}>
                            {alert.status}
                          </Badge>
                          <Badge variant="outline" className="text-blue-600 bg-blue-50">
                            {alert.jurisdiction}
                          </Badge>
                          {alert.actionRequired && (
                            <Badge variant="outline" className="text-orange-600 bg-orange-50">
                              <Clock className="w-3 h-3 mr-1" />
                              Action Required
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className="font-semibold mb-2">{alert.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {alert.description}
                        </p>
                        
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Regulatory Body:</span>
                            <p className="font-medium">{alert.regulatoryBody}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Effective Date:</span>
                            <p className="font-medium">{format(alert.effectiveDate, 'MMM dd, yyyy')}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Impacted Suppliers:</span>
                            <p className="font-medium">{alert.impactedSuppliers} suppliers</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Last Updated:</span>
                            <p className="font-medium">{format(alert.updatedAt, 'MMM dd, yyyy')}</p>
                          </div>
                        </div>
                        
                        {alert.deadline && (
                          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-orange-600" />
                              <span className="text-sm font-medium text-orange-800">
                                Action Deadline: {format(alert.deadline, 'PPp')}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedAlert(alert)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>{selectedAlert?.title}</DialogTitle>
                              <DialogDescription>
                                Regulatory Alert Details - {selectedAlert?.id}
                              </DialogDescription>
                            </DialogHeader>
                            {selectedAlert && (
                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Type & Severity</Label>
                                    <div className="flex gap-2 mt-1">
                                      <Badge className={getSeverityColor(selectedAlert.severity)}>
                                        {selectedAlert.severity}
                                      </Badge>
                                      <Badge variant="outline" className="capitalize">
                                        {selectedAlert.type}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div>
                                    <Label>Status</Label>
                                    <Badge className={getStatusColor(selectedAlert.status)}>
                                      {selectedAlert.status}
                                    </Badge>
                                  </div>
                                  <div>
                                    <Label>Jurisdiction</Label>
                                    <p>{selectedAlert.jurisdiction}</p>
                                  </div>
                                  <div>
                                    <Label>Regulatory Body</Label>
                                    <p>{selectedAlert.regulatoryBody}</p>
                                  </div>
                                </div>
                                
                                <div>
                                  <Label>Description</Label>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {selectedAlert.description}
                                  </p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Effective Date</Label>
                                    <p>{format(selectedAlert.effectiveDate, 'PPp')}</p>
                                  </div>
                                  <div>
                                    <Label>Impacted Suppliers</Label>
                                    <p>{selectedAlert.impactedSuppliers} suppliers affected</p>
                                  </div>
                                </div>
                                
                                {selectedAlert.tags.length > 0 && (
                                  <div>
                                    <Label>Tags</Label>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                      {selectedAlert.tags.map((tag, index) => (
                                        <Badge key={index} variant="outline">
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {selectedAlert.assignedTo && (
                                  <div>
                                    <Label>Assigned To</Label>
                                    <p className="text-sm">{selectedAlert.assignedTo}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          )}

          {/* List View */}
          {complianceViewMode === 'list' && (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => {
                const TypeIcon = getTypeIcon(alert.type);
                return (
                  <Card key={alert.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <TypeIcon className="w-5 h-5 text-muted-foreground" />
                          <p className="font-semibold">{alert.title}</p>
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {alert.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Globe className="w-4 h-4" />
                            <span>{alert.regulatoryBody}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{format(alert.effectiveDate, 'MMM dd, yyyy')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setSelectedAlert(alert)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm">Assign</Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Table View */}
          {complianceViewMode === 'table' && (
            <Card>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={filteredAlerts.map((a) => a.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <Table>
                    <TableHeader>
                      <DraggableTableHeader
                        showDragHandle={true}
                        allSelected={selectedRows.size === filteredAlerts.length && filteredAlerts.length > 0}
                        onSelectAll={handleSelectAll}
                      >
                        <TableHead>Alert Details</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Regulatory Body</TableHead>
                        <TableHead>Effective Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </DraggableTableHeader>
                    </TableHeader>
                    <TableBody>
                      {filteredAlerts.map((alert) => {
                        const TypeIcon = getTypeIcon(alert.type);
                        return (
                          <DraggableTableRow
                            key={alert.id}
                            id={alert.id}
                            isSelected={selectedRows.has(alert.id)}
                            onSelect={() => handleSelectRow(alert.id)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <TypeIcon className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">{alert.title}</p>
                                  <p className="text-sm text-muted-foreground">{alert.description.slice(0, 50)}...</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {alert.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getSeverityColor(alert.severity)}>
                                {alert.severity}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{alert.regulatoryBody}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{format(alert.effectiveDate, 'MMM dd, yyyy')}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="ghost" onClick={() => setSelectedAlert(alert)}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button size="sm">Assign</Button>
                              </div>
                            </TableCell>
                          </DraggableTableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </SortableContext>
              </DndContext>
            </Card>
          )}
        </TabsContent>

        {/* Compliance Frameworks Tab */}
        <TabsContent value="frameworks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Compliance Frameworks</CardTitle>
              <CardDescription>
                Monitor compliance across multiple regulatory and sustainability frameworks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockComplianceFrameworks.map((framework) => (
                  <Card key={framework.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold">{framework.name}</h3>
                          <p className="text-sm text-muted-foreground capitalize">
                            {framework.category} • {framework.jurisdiction}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-green-600 bg-green-50">
                            {framework.status}
                          </Badge>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedFramework(framework)}
                              >
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                              <DialogHeader>
                                <DialogTitle>{framework.name}</DialogTitle>
                                <DialogDescription>
                                  Compliance Framework Details and Requirements
                                </DialogDescription>
                              </DialogHeader>
                              {selectedFramework && (
                                <div className="space-y-6">
                                  <div className="grid grid-cols-3 gap-4">
                                    <div>
                                      <Label>Category</Label>
                                      <p className="capitalize">{selectedFramework.category}</p>
                                    </div>
                                    <div>
                                      <Label>Jurisdiction</Label>
                                      <p>{selectedFramework.jurisdiction}</p>
                                    </div>
                                    <div>
                                      <Label>Status</Label>
                                      <Badge variant="outline" className="text-green-600 bg-green-50">
                                        {selectedFramework.status}
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <Label>Description</Label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {selectedFramework.description}
                                    </p>
                                  </div>
                                  
                                  <div>
                                    <Label>Requirements ({selectedFramework.requirements.length})</Label>
                                    <div className="space-y-3 mt-2">
                                      {selectedFramework.requirements.map((req) => (
                                        <div key={req.id} className="p-3 border rounded-lg">
                                          <div className="flex items-center justify-between mb-2">
                                            <h5 className="font-medium">{req.title}</h5>
                                            <div className="flex items-center gap-2">
                                              {req.mandatory && (
                                                <Badge variant="outline" className="text-red-600 bg-red-50">
                                                  Mandatory
                                                </Badge>
                                              )}
                                              <span className="text-sm text-muted-foreground">
                                                Weight: {req.weight}%
                                              </span>
                                            </div>
                                          </div>
                                          <p className="text-sm text-muted-foreground mb-2">
                                            {req.description}
                                          </p>
                                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            {req.documentRequired && <span>📄 Document Required</span>}
                                            {req.certificationRequired && <span>🏆 Certification Required</span>}
                                            {req.renewalFrequency && (
                                              <span>🔄 Renewal: {req.renewalFrequency}</span>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Supplier Coverage: {framework.supplierCoverage}%</span>
                          <span>Compliance Rate: {framework.complianceRate}%</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{ width: `${framework.supplierCoverage}%` }}
                              ></div>
                            </div>
                          </div>
                          <div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ width: `${framework.complianceRate}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex justify-between text-sm text-muted-foreground">
                        <span>{framework.requirements.length} requirements</span>
                        <span>Updated: {format(framework.lastUpdated, 'MMM dd, yyyy')}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sustainability Metrics Tab */}
        <TabsContent value="sustainability" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sustainability Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Carbon Emissions Reduction</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                      </div>
                      <span className="font-medium">-22%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Renewable Energy Usage</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                      <span className="font-medium">65%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Waste Diversion Rate</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: '89%' }}></div>
                      </div>
                      <span className="font-medium">89%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Water Conservation</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-cyan-500 h-2 rounded-full" style={{ width: '72%' }}></div>
                      </div>
                      <span className="font-medium">-28%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ESG Score Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Excellent (8.0-10.0)</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">156</p>
                      <p className="text-xs text-muted-foreground">45%</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>Good (6.0-7.9)</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">98</p>
                      <p className="text-xs text-muted-foreground">28%</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span>Fair (4.0-5.9)</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">67</p>
                      <p className="text-xs text-muted-foreground">19%</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>Poor (0.0-3.9)</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">28</p>
                      <p className="text-xs text-muted-foreground">8%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Supplier Sustainability Metrics</CardTitle>
              <CardDescription>
                Track sustainability performance across your supplier base
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Metric</TableHead>
                    <TableHead>Current Value</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Trend</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockSustainabilityMetrics.map((metric) => (
                    <TableRow key={metric.id}>
                      <TableCell className="font-medium">{metric.supplierName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {metric.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{metric.metric}</TableCell>
                      <TableCell>
                        {metric.value} {metric.unit}
                      </TableCell>
                      <TableCell>
                        {metric.targetValue} {metric.unit}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(metric.trend)}
                          <span className="capitalize">{metric.trend}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${metric.score}%` }}
                            ></div>
                          </div>
                          <span className="font-medium">{metric.score}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={
                            metric.verificationStatus === 'verified' ? 'text-green-600 bg-green-50' :
                            metric.verificationStatus === 'pending' ? 'text-yellow-600 bg-yellow-50' :
                            'text-blue-600 bg-blue-50'
                          }
                        >
                          {metric.verificationStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Assessment Tab */}
        <TabsContent value="risk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Risk Assessment</CardTitle>
              <CardDescription>
                Comprehensive risk evaluation across regulatory, environmental, social, and governance factors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRiskAssessments.map((assessment) => (
                  <Card key={assessment.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold">{assessment.supplierName}</h3>
                          <p className="text-sm text-muted-foreground">
                            Risk Score: {assessment.riskScore}/100
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getRiskColor(assessment.overallRisk)}>
                            {assessment.overallRisk} risk
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            Details
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        {Object.entries(assessment.categories).map(([category, data]) => (
                          <div key={category} className="text-center">
                            <p className="text-xs text-muted-foreground capitalize mb-1">{category}</p>
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <span className="font-medium">{data.score}</span>
                              {getTrendIcon(data.trend)}
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div 
                                className={`h-1 rounded-full ${
                                  data.score <= 25 ? 'bg-green-500' :
                                  data.score <= 50 ? 'bg-yellow-500' :
                                  data.score <= 75 ? 'bg-orange-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${data.score}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {assessment.flaggedIssues.length > 0 && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Flagged Issues ({assessment.flaggedIssues.length})
                          </h4>
                          <ul className="text-sm text-red-700 space-y-1">
                            {assessment.flaggedIssues.map((issue, index) => (
                              <li key={index}>• {issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="mt-4 flex justify-between text-sm text-muted-foreground">
                        <span>Last Assessment: {format(assessment.lastAssessment, 'MMM dd, yyyy')}</span>
                        <span>Next Assessment: {format(assessment.nextAssessment, 'MMM dd, yyyy')}</span>
                        <span className="capitalize">Method: {assessment.assessmentMethod}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Real-time Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Live Monitoring Dashboard</CardTitle>
                <CardDescription>Real-time regulatory and sustainability monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <div>
                        <p className="font-medium">Regulatory Feed</p>
                        <p className="text-xs text-muted-foreground">Connected</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-600 bg-green-50">
                      Active
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                      <div>
                        <p className="font-medium">ESG Data Stream</p>
                        <p className="text-xs text-muted-foreground">Real-time updates</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-blue-600 bg-blue-50">
                      Syncing
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">Compliance Scanner</p>
                        <p className="text-xs text-muted-foreground">Scheduled check</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-yellow-600 bg-yellow-50">
                      Pending
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Critical alert detected</p>
                      <p className="text-muted-foreground">EU CSRD reporting requirements updated</p>
                      <p className="text-xs text-muted-foreground">2 minutes ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Compliance check completed</p>
                      <p className="text-muted-foreground">EcoTech Manufacturing - ISO 14001</p>
                      <p className="text-xs text-muted-foreground">15 minutes ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Sustainability data updated</p>
                      <p className="text-muted-foreground">Q4 carbon emissions reports received</p>
                      <p className="text-xs text-muted-foreground">1 hour ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Risk assessment scheduled</p>
                      <p className="text-muted-foreground">Global Logistics Ltd - High risk review</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Monitoring Configuration</CardTitle>
              <CardDescription>
                Configure real-time monitoring settings and alert thresholds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Alert Sensitivity</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Critical Alerts</Label>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>High Priority Alerts</Label>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Medium Priority Alerts</Label>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Low Priority Alerts</Label>
                        <Switch />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Monitoring Frequency</h4>
                    <div className="space-y-3">
                      <div>
                        <Label>Regulatory Updates</Label>
                        <Select defaultValue="daily">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="realtime">Real-time</SelectItem>
                            <SelectItem value="hourly">Hourly</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Compliance Checks</Label>
                        <Select defaultValue="weekly">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-3">Notification Settings</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <Label>Email Notifications</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>SMS Alerts (Critical Only)</Label>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Dashboard Notifications</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Weekly Summary Reports</Label>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}