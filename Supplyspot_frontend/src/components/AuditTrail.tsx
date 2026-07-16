import React, { useState } from 'react';
import {
  FileCheck,
  Calendar,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Download,
  Filter,
  Search,
  RefreshCw,
  Shield,
  FileText,
  CreditCard,
  Users,
  ShoppingCart,
  Receipt,
  Building2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Grid,
  List,
  Table as TableIcon
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
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarComponent } from './ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { format } from 'date-fns';

interface AuditEntry {
  id: string;
  timestamp: Date;
  action: string;
  module: 'vendor' | 'contract' | 'invoice' | 'payment' | 'rfq' | 'po' | 'document' | 'registration';
  entityId: string;
  entityName: string;
  userId: string;
  userName: string;
  userRole: string;
  status: 'approved' | 'rejected' | 'pending' | 'reviewed';
  previousValue?: string;
  newValue?: string;
  comments?: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  complianceScore: number;
  attachments?: string[];
  ipAddress: string;
  sessionId: string;
}

interface ApprovalWorkflow {
  id: string;
  name: string;
  type: 'vendor-onboarding' | 'contract-approval' | 'payment-authorization' | 'risk-assessment';
  status: 'active' | 'completed' | 'pending' | 'escalated';
  steps: ApprovalStep[];
  createdAt: Date;
  completedAt?: Date;
  totalSteps: number;
  completedSteps: number;
  currentStep: number;
  estimatedCompletion: Date;
}

interface ApprovalStep {
  id: string;
  stepNumber: number;
  name: string;
  assignedTo: string;
  assignedRole: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  completedAt?: Date;
  comments?: string;
  duration?: number; // in hours
  slaBreached: boolean;
}

const mockAuditEntries: AuditEntry[] = [
  {
    id: 'AUD-001',
    timestamp: new Date('2024-01-15T10:30:00'),
    action: 'Vendor Registration Approved',
    module: 'vendor',
    entityId: 'VEN-001',
    entityName: 'TechCorp Solutions Ltd.',
    userId: 'USR-001',
    userName: 'Sarah Johnson',
    userRole: 'Procurement Manager',
    status: 'approved',
    comments: 'All compliance documents verified. Credit score: 850/1000',
    riskLevel: 'low',
    complianceScore: 95,
    ipAddress: '192.168.1.100',
    sessionId: 'SES-001'
  },
  {
    id: 'AUD-002',
    timestamp: new Date('2024-01-15T14:20:00'),
    action: 'Contract Amendment Rejected',
    module: 'contract',
    entityId: 'CON-001',
    entityName: 'Annual Software License Agreement',
    userId: 'USR-002',
    userName: 'Michael Chen',
    userRole: 'Legal Counsel',
    status: 'rejected',
    previousValue: 'Payment terms: Net 30',
    newValue: 'Payment terms: Net 60',
    comments: 'Payment terms exceed company policy. Requires CFO approval for >45 days.',
    riskLevel: 'medium',
    complianceScore: 72,
    attachments: ['contract-amendment-v2.pdf'],
    ipAddress: '192.168.1.101',
    sessionId: 'SES-002'
  },
  {
    id: 'AUD-003',
    timestamp: new Date('2024-01-16T09:15:00'),
    action: 'Invoice Payment Authorized',
    module: 'payment',
    entityId: 'INV-001',
    entityName: 'Monthly Service Invoice - December',
    userId: 'USR-003',
    userName: 'Emily Rodriguez',
    userRole: 'Finance Director',
    status: 'approved',
    comments: 'Expedited payment authorized due to early payment discount',
    riskLevel: 'low',
    complianceScore: 98,
    ipAddress: '192.168.1.102',
    sessionId: 'SES-003'
  },
  {
    id: 'AUD-004',
    timestamp: new Date('2024-01-16T11:45:00'),
    action: 'Risk Assessment Escalated',
    module: 'vendor',
    entityId: 'VEN-002',
    entityName: 'GlobalTech Industries',
    userId: 'USR-004',
    userName: 'David Kim',
    userRole: 'Risk Analyst',
    status: 'pending',
    comments: 'Credit score dropped below threshold. Manual review required.',
    riskLevel: 'critical',
    complianceScore: 45,
    ipAddress: '192.168.1.103',
    sessionId: 'SES-004'
  },
  {
    id: 'AUD-005',
    timestamp: new Date('2024-01-17T16:30:00'),
    action: 'RFQ Response Approved',
    module: 'rfq',
    entityId: 'RFQ-001',
    entityName: 'Office Supplies Procurement Q1',
    userId: 'USR-001',
    userName: 'Sarah Johnson',
    userRole: 'Procurement Manager',
    status: 'approved',
    comments: 'Best value proposal selected. 15% cost savings achieved.',
    riskLevel: 'low',
    complianceScore: 88,
    ipAddress: '192.168.1.100',
    sessionId: 'SES-005'
  }
];

const mockWorkflows: ApprovalWorkflow[] = [
  {
    id: 'WF-001',
    name: 'TechCorp Solutions - Vendor Onboarding',
    type: 'vendor-onboarding',
    status: 'completed',
    createdAt: new Date('2024-01-10T09:00:00'),
    completedAt: new Date('2024-01-15T10:30:00'),
    totalSteps: 4,
    completedSteps: 4,
    currentStep: 4,
    estimatedCompletion: new Date('2024-01-14T17:00:00'),
    steps: [
      {
        id: 'STP-001',
        stepNumber: 1,
        name: 'Document Verification',
        assignedTo: 'compliance-team@company.com',
        assignedRole: 'Compliance Officer',
        status: 'approved',
        completedAt: new Date('2024-01-11T14:00:00'),
        comments: 'All required documents submitted and verified',
        duration: 5,
        slaBreached: false
      },
      {
        id: 'STP-002',
        stepNumber: 2,
        name: 'Financial Assessment',
        assignedTo: 'finance-team@company.com',
        assignedRole: 'Financial Analyst',
        status: 'approved',
        completedAt: new Date('2024-01-12T11:30:00'),
        comments: 'Strong financial position. Credit score: 850',
        duration: 3,
        slaBreached: false
      },
      {
        id: 'STP-003',
        stepNumber: 3,
        name: 'Risk Evaluation',
        assignedTo: 'risk-team@company.com',
        assignedRole: 'Risk Manager',
        status: 'approved',
        completedAt: new Date('2024-01-13T16:15:00'),
        comments: 'Low risk profile. No red flags identified',
        duration: 4,
        slaBreached: false
      },
      {
        id: 'STP-004',
        stepNumber: 4,
        name: 'Final Approval',
        assignedTo: 'sarah.johnson@company.com',
        assignedRole: 'Procurement Manager',
        status: 'approved',
        completedAt: new Date('2024-01-15T10:30:00'),
        comments: 'Approved for vendor registration',
        duration: 2,
        slaBreached: false
      }
    ]
  },
  {
    id: 'WF-002',
    name: 'High-Value Contract Amendment',
    type: 'contract-approval',
    status: 'pending',
    createdAt: new Date('2024-01-16T14:00:00'),
    totalSteps: 5,
    completedSteps: 2,
    currentStep: 3,
    estimatedCompletion: new Date('2024-01-22T17:00:00'),
    steps: [
      {
        id: 'STP-005',
        stepNumber: 1,
        name: 'Legal Review',
        assignedTo: 'legal-team@company.com',
        assignedRole: 'Legal Counsel',
        status: 'approved',
        completedAt: new Date('2024-01-17T10:00:00'),
        comments: 'Terms reviewed and approved',
        duration: 6,
        slaBreached: false
      },
      {
        id: 'STP-006',
        stepNumber: 2,
        name: 'Financial Impact Assessment',
        assignedTo: 'finance-team@company.com',
        assignedRole: 'Finance Manager',
        status: 'approved',
        completedAt: new Date('2024-01-18T15:30:00'),
        comments: 'Budget allocation confirmed',
        duration: 8,
        slaBreached: true
      },
      {
        id: 'STP-007',
        stepNumber: 3,
        name: 'Risk Assessment',
        assignedTo: 'risk-team@company.com',
        assignedRole: 'Risk Manager',
        status: 'pending',
        duration: 12,
        slaBreached: false
      },
      {
        id: 'STP-008',
        stepNumber: 4,
        name: 'Department Head Approval',
        assignedTo: 'dept.head@company.com',
        assignedRole: 'Department Head',
        status: 'pending',
        slaBreached: false
      },
      {
        id: 'STP-009',
        stepNumber: 5,
        name: 'Executive Approval',
        assignedTo: 'cfo@company.com',
        assignedRole: 'Chief Financial Officer',
        status: 'pending',
        slaBreached: false
      }
    ]
  }
];

export function AuditTrail() {
  const [activeTab, setActiveTab] = useState('entries');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModule, setFilterModule] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<ApprovalWorkflow | null>(null);
  const [auditViewMode, setAuditViewMode] = useState<'card' | 'list' | 'table'>('table');
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
      setSelectedRows(new Set(filteredEntries.map((e) => e.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'vendor': return Users;
      case 'contract': return FileText;
      case 'invoice': return Receipt;
      case 'payment': return CreditCard;
      case 'rfq': return ShoppingCart;
      case 'po': return ShoppingCart;
      case 'document': return FileText;
      case 'registration': return Building2;
      default: return FileCheck;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected': return 'text-red-600 bg-red-50 border-red-200';
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'reviewed': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
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

  const filteredEntries = mockAuditEntries.filter(entry => {
    const matchesSearch = entry.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         entry.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         entry.userName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModule = filterModule === 'all' || entry.module === filterModule;
    const matchesStatus = filterStatus === 'all' || entry.status === filterStatus;
    return matchesSearch && matchesModule && matchesStatus;
  });

  const getWorkflowStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'active': return 'text-blue-600 bg-blue-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'escalated': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileCheck className="w-8 h-8 text-primary" />
            Audit Trail & Approvals
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive tracking of all approval processes for enhanced transparency and compliance oversight
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
          <Button variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Approvals</p>
                <p className="text-2xl font-bold">1,247</p>
                <p className="text-xs text-green-600">+12% from last month</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Reviews</p>
                <p className="text-2xl font-bold">23</p>
                <p className="text-xs text-yellow-600">3 require attention</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">SLA Breaches</p>
                <p className="text-2xl font-bold">5</p>
                <p className="text-xs text-red-600">2 critical</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Approval Time</p>
                <p className="text-2xl font-bold">2.3</p>
                <p className="text-xs text-muted-foreground">days</p>
              </div>
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="entries">Audit Entries</TabsTrigger>
          <TabsTrigger value="workflows">Approval Workflows</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Dashboard</TabsTrigger>
        </TabsList>

        {/* Audit Entries Tab */}
        <TabsContent value="entries" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters & Search</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search actions, entities, or users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterModule} onValueChange={setFilterModule}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by module" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modules</SelectItem>
                    <SelectItem value="vendor">Vendor Management</SelectItem>
                    <SelectItem value="contract">Contracts</SelectItem>
                    <SelectItem value="invoice">Invoices</SelectItem>
                    <SelectItem value="payment">Payments</SelectItem>
                    <SelectItem value="rfq">RFQ</SelectItem>
                    <SelectItem value="registration">Registration</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* View Toggle Buttons */}
          <div className="flex items-center border rounded-md w-fit">
            <Button
              variant={auditViewMode === 'card' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setAuditViewMode('card')}
              className="rounded-r-none"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={auditViewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setAuditViewMode('list')}
              className="rounded-none border-l border-r"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={auditViewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setAuditViewMode('table')}
              className="rounded-l-none"
            >
              <TableIcon className="w-4 h-4" />
            </Button>
          </div>

          {/* Table View */}
          {auditViewMode === 'table' && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Audit Entries</CardTitle>
                <CardDescription>
                  Detailed log of all approval activities and system changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={filteredEntries.map((e) => e.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <Table>
                      <TableHeader>
                        <DraggableTableHeader
                          showDragHandle={true}
                          allSelected={selectedRows.size === filteredEntries.length && filteredEntries.length > 0}
                          onSelectAll={handleSelectAll}
                        >
                          <TableHead>Timestamp</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Module</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Risk Level</TableHead>
                          <TableHead>Compliance</TableHead>
                          <TableHead>Actions</TableHead>
                        </DraggableTableHeader>
                      </TableHeader>
                      <TableBody>
                        {filteredEntries.map((entry) => {
                          const ModuleIcon = getModuleIcon(entry.module);
                          return (
                            <DraggableTableRow
                              key={entry.id}
                              id={entry.id}
                              isSelected={selectedRows.has(entry.id)}
                              onSelect={() => handleSelectRow(entry.id)}
                            >
                              <TableCell>
                                <div className="text-sm">
                                  {format(entry.timestamp, 'MMM dd, yyyy')}
                                  <br />
                                  <span className="text-muted-foreground text-xs">
                                    {format(entry.timestamp, 'HH:mm:ss')}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{entry.action}</p>
                                  <p className="text-sm text-muted-foreground truncate max-w-48">
                                    {entry.entityName}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <ModuleIcon className="w-4 h-4" />
                                  <span className="capitalize">{entry.module}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{entry.userName}</p>
                                  <p className="text-xs text-muted-foreground">{entry.userRole}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(entry.status)}>
                                  {entry.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={getRiskColor(entry.riskLevel)}>
                                  {entry.riskLevel}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-center">
                                  <p className="font-medium">{entry.complianceScore}%</p>
                                  <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                                    <div 
                                      className="bg-primary h-2 rounded-full" 
                                      style={{ width: `${entry.complianceScore}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedEntry(entry)}>
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>Audit Entry Details</DialogTitle>
                                      <DialogDescription>
                                        Complete information for audit entry {entry.id}
                                      </DialogDescription>
                                    </DialogHeader>
                                    {selectedEntry && (
                                      <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <label className="text-sm font-medium">Action</label>
                                            <p className="text-sm text-muted-foreground">{selectedEntry.action}</p>
                                          </div>
                                          <div>
                                            <label className="text-sm font-medium">Entity</label>
                                            <p className="text-sm text-muted-foreground">{selectedEntry.entityName}</p>
                                          </div>
                                          <div>
                                            <label className="text-sm font-medium">User</label>
                                            <p className="text-sm text-muted-foreground">
                                              {selectedEntry.userName} ({selectedEntry.userRole})
                                            </p>
                                          </div>
                                          <div>
                                            <label className="text-sm font-medium">Timestamp</label>
                                            <p className="text-sm text-muted-foreground">
                                              {format(selectedEntry.timestamp, 'MMM dd, yyyy HH:mm:ss')}
                                            </p>
                                          </div>
                                          <div>
                                            <label className="text-sm font-medium">Module</label>
                                            <p className="text-sm text-muted-foreground capitalize">{selectedEntry.module}</p>
                                          </div>
                                          <div>
                                            <label className="text-sm font-medium">Status</label>
                                            <Badge className={getStatusColor(selectedEntry.status)}>
                                              {selectedEntry.status}
                                            </Badge>
                                          </div>
                                          <div>
                                            <label className="text-sm font-medium">Risk Level</label>
                                            <Badge className={getRiskColor(selectedEntry.riskLevel)}>
                                              {selectedEntry.riskLevel}
                                            </Badge>
                                          </div>
                                          <div>
                                            <label className="text-sm font-medium">Compliance Score</label>
                                            <p className="text-sm text-muted-foreground">{selectedEntry.complianceScore}%</p>
                                          </div>
                                          <div>
                                            <label className="text-sm font-medium">Session ID</label>
                                            <p className="text-sm text-muted-foreground font-mono">{selectedEntry.sessionId}</p>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </DialogContent>
                                </Dialog>
                              </TableCell>
                            </DraggableTableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </SortableContext>
                </DndContext>
              </CardContent>
            </Card>
          )}

          {/* List View */}
          {auditViewMode === 'list' && (
            <div className="space-y-3">
              {filteredEntries.map((entry) => {
                const ModuleIcon = getModuleIcon(entry.module);
                return (
                  <Card key={entry.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <ModuleIcon className="w-4 h-4 text-muted-foreground" />
                          <p className="font-semibold">{entry.action}</p>
                          <Badge className={getStatusColor(entry.status)}>
                            {entry.status}
                          </Badge>
                          <Badge className={getRiskColor(entry.riskLevel)}>
                            {entry.riskLevel}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{entry.entityName}</span>
                          <span>{entry.userName}</span>
                          <span>{format(entry.timestamp, 'MMM dd, yyyy HH:mm')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setSelectedEntry(entry)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Card View */}
          {auditViewMode === 'card' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEntries.map((entry) => {
                const ModuleIcon = getModuleIcon(entry.module);
                return (
                  <Card key={entry.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <ModuleIcon className="w-4 h-4 text-muted-foreground" />
                          <CardTitle className="text-base">{entry.action}</CardTitle>
                        </div>
                        <Badge className={getStatusColor(entry.status)}>
                          {entry.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{entry.entityName}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">User:</span>
                          <span>{entry.userName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Module:</span>
                          <span className="capitalize">{entry.module}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Risk:</span>
                          <Badge className={getRiskColor(entry.riskLevel)}>
                            {entry.riskLevel}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Compliance:</span>
                          <span>{entry.complianceScore}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Timestamp:</span>
                          <span>{format(entry.timestamp, 'MMM dd, yyyy HH:mm')}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="ghost" className="flex-1" onClick={() => setSelectedEntry(entry)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Approval Workflows Tab */}
        <TabsContent value="workflows" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Approval Workflows</CardTitle>
              <CardDescription>
                Track the progress of multi-step approval processes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockWorkflows.map((workflow) => (
                  <Card key={workflow.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold">{workflow.name}</h3>
                          <p className="text-sm text-muted-foreground capitalize">
                            {workflow.type.replace('-', ' ')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getWorkflowStatusColor(workflow.status)}>
                            {workflow.status}
                          </Badge>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedWorkflow(workflow)}
                              >
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                              <DialogHeader>
                                <DialogTitle>Workflow Details: {workflow.name}</DialogTitle>
                                <DialogDescription>
                                  Complete workflow progress and step details
                                </DialogDescription>
                              </DialogHeader>
                              {selectedWorkflow && (
                                <div className="space-y-6">
                                  <div className="grid grid-cols-3 gap-4">
                                    <div>
                                      <label className="text-sm font-medium">Status</label>
                                      <Badge className={getWorkflowStatusColor(selectedWorkflow.status)}>
                                        {selectedWorkflow.status}
                                      </Badge>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Progress</label>
                                      <p>{selectedWorkflow.completedSteps}/{selectedWorkflow.totalSteps} steps</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Created</label>
                                      <p className="text-sm text-muted-foreground">
                                        {format(selectedWorkflow.createdAt, 'PPp')}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h4 className="font-medium mb-4">Workflow Steps</h4>
                                    <div className="space-y-3">
                                      {selectedWorkflow.steps.map((step, index) => (
                                        <div key={step.id} className="flex items-start gap-4 p-4 border rounded-lg">
                                          <div className="flex-shrink-0 mt-1">
                                            {step.status === 'approved' && <CheckCircle className="w-5 h-5 text-green-500" />}
                                            {step.status === 'rejected' && <XCircle className="w-5 h-5 text-red-500" />}
                                            {step.status === 'pending' && <Clock className="w-5 h-5 text-yellow-500" />}
                                            {step.status === 'skipped' && <AlertCircle className="w-5 h-5 text-gray-500" />}
                                          </div>
                                          <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                              <h5 className="font-medium">
                                                Step {step.stepNumber}: {step.name}
                                              </h5>
                                              <div className="flex items-center gap-2">
                                                <Badge 
                                                  variant={step.status === 'approved' ? 'default' : 'secondary'}
                                                  className={
                                                    step.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                    step.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                    step.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'
                                                  }
                                                >
                                                  {step.status}
                                                </Badge>
                                                {step.slaBreached && (
                                                  <Badge variant="destructive" className="text-xs">
                                                    SLA Breached
                                                  </Badge>
                                                )}
                                              </div>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                              Assigned to: {step.assignedRole} ({step.assignedTo})
                                            </p>
                                            {step.completedAt && (
                                              <p className="text-xs text-muted-foreground">
                                                Completed: {format(step.completedAt, 'PPp')}
                                                {step.duration && ` (${step.duration}h)`}
                                              </p>
                                            )}
                                            {step.comments && (
                                              <p className="text-sm mt-2 p-2 bg-gray-50 rounded">
                                                {step.comments}
                                              </p>
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
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress: {workflow.completedSteps}/{workflow.totalSteps} steps</span>
                          <span>{Math.round((workflow.completedSteps / workflow.totalSteps) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${(workflow.completedSteps / workflow.totalSteps) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex justify-between text-sm text-muted-foreground">
                        <span>Created: {format(workflow.createdAt, 'MMM dd, yyyy')}</span>
                        <span>
                          {workflow.status === 'completed' && workflow.completedAt
                            ? `Completed: ${format(workflow.completedAt, 'MMM dd, yyyy')}`
                            : `Est. completion: ${format(workflow.estimatedCompletion, 'MMM dd, yyyy')}`
                          }
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Dashboard Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Overall Compliance Score</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '87%' }}></div>
                      </div>
                      <span className="font-medium">87%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Risk Assessment Coverage</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                      </div>
                      <span className="font-medium">92%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Document Verification Rate</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                      </div>
                      <span className="font-medium">95%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>SLA Compliance</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                      </div>
                      <span className="font-medium">78%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Low Risk</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">312</p>
                      <p className="text-xs text-muted-foreground">62%</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span>Medium Risk</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">145</p>
                      <p className="text-xs text-muted-foreground">29%</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span>High Risk</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">38</p>
                      <p className="text-xs text-muted-foreground">7%</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>Critical Risk</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">8</p>
                      <p className="text-xs text-muted-foreground">2%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Compliance Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 border border-red-200 bg-red-50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <div className="flex-1">
                    <p className="font-medium">Critical: Vendor credit score below threshold</p>
                    <p className="text-sm text-muted-foreground">GlobalTech Industries - Requires immediate review</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Review
                  </Button>
                </div>
                <div className="flex items-center gap-3 p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-500" />
                  <div className="flex-1">
                    <p className="font-medium">SLA Warning: Contract approval overdue</p>
                    <p className="text-sm text-muted-foreground">High-Value Contract Amendment - 2 hours overdue</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Escalate
                  </Button>
                </div>
                <div className="flex items-center gap-3 p-3 border border-blue-200 bg-blue-50 rounded-lg">
                  <Shield className="w-5 h-5 text-blue-500" />
                  <div className="flex-1">
                    <p className="font-medium">Info: New compliance requirement</p>
                    <p className="text-sm text-muted-foreground">Updated financial verification standards effective next month</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}