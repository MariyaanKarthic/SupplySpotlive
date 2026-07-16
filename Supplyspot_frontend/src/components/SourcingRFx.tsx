import React, { useState } from 'react';
import {
  Target,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  Settings,
  Play,
  Pause,
  Award,
  Zap,
  Calendar,
  Star,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  MessageSquare,
  Mail,
  Phone,
  ExternalLink,
  Copy,
  ChevronDown,
  ChevronRight,
  Grid,
  List,
  Table as TableIcon
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { Calendar as CalendarComponent } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { format } from 'date-fns';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DraggableTableRow, DraggableTableHeader } from './ui/draggable-table-row';

interface SourcingRequest {
  id: string;
  type: 'RFQ' | 'RFP' | 'RFI';
  title: string;
  description: string;
  category: string;
  prNumber?: string; // SAP Purchase Requisition Number
  budget: number;
  currency: string;
  dueDate: Date;
  status: 'draft' | 'published' | 'in-progress' | 'evaluation' | 'awarded' | 'closed';
  createdBy: string;
  responses: number;
  estimatedValue: number;
  scoringCriteria: ScoringCriteria;
  isReverseAuction: boolean;
  auctionStartDate?: Date;
  auctionEndDate?: Date;
  suppliers: string[];
  attachments: string[];
}

interface ScoringCriteria {
  price: { weight: number; enabled: boolean };
  quality: { weight: number; enabled: boolean };
  leadTime: { weight: number; enabled: boolean };
  experience: { weight: number; enabled: boolean };
  certification: { weight: number; enabled: boolean };
  sustainability: { weight: number; enabled: boolean };
}

interface SupplierResponse {
  id: string;
  rfxId: string;
  supplierId: string;
  supplierName: string;
  submittedAt: Date;
  status: 'draft' | 'submitted' | 'shortlisted' | 'awarded' | 'rejected';
  totalScore: number;
  breakdown: {
    price: { score: number; value: number };
    quality: { score: number; value: number };
    leadTime: { score: number; value: number };
    experience: { score: number; value: number };
    certification: { score: number; value: number };
    sustainability: { score: number; value: number };
  };
  proposedPrice: number;
  deliveryTime: number;
  validUntil: Date;
  notes: string;
}

interface ReverseAuction {
  id: string;
  rfxId: string;
  status: 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
  participants: number;
  startingPrice: number;
  currentBestPrice: number;
  leadingSupplier: string;
  startTime: Date;
  endTime: Date;
  bids: AuctionBid[];
  rules: {
    minDecrementAmount: number;
    maxDecrementPercent: number;
    overtimeEnabled: boolean;
    overtimeDuration: number;
  };
}

interface AuctionBid {
  id: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  timestamp: Date;
  rank: number;
}

const mockSourcingRequests: SourcingRequest[] = [
  {
    id: 'RFQ-2024-001',
    type: 'RFQ',
    title: 'Office Furniture Procurement Q1 2024',
    description: 'Sourcing office furniture for new headquarters expansion including desks, chairs, and storage solutions.',
    category: 'Office Supplies',
    prNumber: 'PR-45001234',
    budget: 250000,
    currency: 'USD',
    dueDate: new Date('2024-02-15'),
    status: 'in-progress',
    createdBy: 'Sarah Johnson',
    responses: 8,
    estimatedValue: 230000,
    isReverseAuction: false,
    suppliers: ['SUP-001', 'SUP-002', 'SUP-003', 'SUP-004', 'SUP-005'],
    attachments: ['specifications.pdf', 'floor-plan.dwg'],
    scoringCriteria: {
      price: { weight: 40, enabled: true },
      quality: { weight: 25, enabled: true },
      leadTime: { weight: 15, enabled: true },
      experience: { weight: 10, enabled: true },
      certification: { weight: 5, enabled: true },
      sustainability: { weight: 5, enabled: true }
    }
  },
  {
    id: 'RFP-2024-002',
    type: 'RFP',
    title: 'IT Infrastructure Modernization',
    description: 'Comprehensive IT infrastructure upgrade including servers, networking equipment, and cloud migration services.',
    category: 'Technology',
    prNumber: 'PR-45001235',
    budget: 1500000,
    currency: 'USD',
    dueDate: new Date('2024-03-01'),
    status: 'published',
    createdBy: 'Michael Chen',
    responses: 12,
    estimatedValue: 1350000,
    isReverseAuction: true,
    auctionStartDate: new Date('2024-02-20T10:00:00'),
    auctionEndDate: new Date('2024-02-20T16:00:00'),
    suppliers: ['SUP-006', 'SUP-007', 'SUP-008', 'SUP-009'],
    attachments: ['technical-requirements.pdf', 'current-architecture.pdf'],
    scoringCriteria: {
      price: { weight: 35, enabled: true },
      quality: { weight: 30, enabled: true },
      leadTime: { weight: 10, enabled: true },
      experience: { weight: 15, enabled: true },
      certification: { weight: 10, enabled: true },
      sustainability: { weight: 0, enabled: false }
    }
  },
  {
    id: 'RFI-2024-003',
    type: 'RFI',
    title: 'Sustainability Consulting Services',
    description: 'Information gathering for potential sustainability consulting partners to help achieve carbon neutrality goals.',
    category: 'Professional Services',
    budget: 500000,
    currency: 'USD',
    dueDate: new Date('2024-02-28'),
    status: 'draft',
    createdBy: 'Emily Rodriguez',
    responses: 0,
    estimatedValue: 450000,
    isReverseAuction: false,
    suppliers: [],
    attachments: ['sustainability-goals.pdf'],
    scoringCriteria: {
      price: { weight: 20, enabled: true },
      quality: { weight: 35, enabled: true },
      leadTime: { weight: 5, enabled: true },
      experience: { weight: 25, enabled: true },
      certification: { weight: 15, enabled: true },
      sustainability: { weight: 0, enabled: false }
    }
  }
];

const mockSupplierResponses: SupplierResponse[] = [
  {
    id: 'RESP-001',
    rfxId: 'RFQ-2024-001',
    supplierId: 'SUP-001',
    supplierName: 'Premier Office Solutions',
    submittedAt: new Date('2024-01-20T14:30:00'),
    status: 'submitted',
    totalScore: 87,
    proposedPrice: 235000,
    deliveryTime: 6,
    validUntil: new Date('2024-03-01'),
    notes: 'Premium quality furniture with 5-year warranty and free installation service.',
    breakdown: {
      price: { score: 85, value: 235000 },
      quality: { score: 95, value: 9.5 },
      leadTime: { score: 80, value: 6 },
      experience: { score: 90, value: 15 },
      certification: { score: 85, value: 8.5 },
      sustainability: { score: 70, value: 7.0 }
    }
  },
  {
    id: 'RESP-002',
    rfxId: 'RFQ-2024-001',
    supplierId: 'SUP-002',
    supplierName: 'Corporate Furnishings Ltd',
    submittedAt: new Date('2024-01-22T09:15:00'),
    status: 'shortlisted',
    totalScore: 92,
    proposedPrice: 218000,
    deliveryTime: 8,
    validUntil: new Date('2024-02-28'),
    notes: 'Eco-friendly materials with GREENGUARD certification. Bulk discount applied.',
    breakdown: {
      price: { score: 95, value: 218000 },
      quality: { score: 88, value: 8.8 },
      leadTime: { score: 75, value: 8 },
      experience: { score: 95, value: 18 },
      certification: { score: 90, value: 9.0 },
      sustainability: { score: 95, value: 9.5 }
    }
  }
];

const mockReverseAuction: ReverseAuction = {
  id: 'AUCTION-001',
  rfxId: 'RFP-2024-002',
  status: 'active',
  participants: 4,
  startingPrice: 1500000,
  currentBestPrice: 1285000,
  leadingSupplier: 'TechCorp Solutions',
  startTime: new Date('2024-02-20T10:00:00'),
  endTime: new Date('2024-02-20T16:00:00'),
  rules: {
    minDecrementAmount: 5000,
    maxDecrementPercent: 2,
    overtimeEnabled: true,
    overtimeDuration: 300
  },
  bids: [
    { id: 'BID-001', supplierId: 'SUP-006', supplierName: 'TechCorp Solutions', amount: 1285000, timestamp: new Date('2024-02-20T14:35:00'), rank: 1 },
    { id: 'BID-002', supplierId: 'SUP-007', supplierName: 'Digital Systems Inc', amount: 1290000, timestamp: new Date('2024-02-20T14:32:00'), rank: 2 },
    { id: 'BID-003', supplierId: 'SUP-008', supplierName: 'Cloud Innovations', amount: 1315000, timestamp: new Date('2024-02-20T14:20:00'), rank: 3 },
    { id: 'BID-004', supplierId: 'SUP-009', supplierName: 'Enterprise Tech', amount: 1345000, timestamp: new Date('2024-02-20T14:05:00'), rank: 4 }
  ]
};

export function SourcingRFx() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedRFx, setSelectedRFx] = useState<SourcingRequest | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showScoringDialog, setShowScoringDialog] = useState(false);
  const [rfxViewMode, setRfxViewMode] = useState<'card' | 'list' | 'table'>('table');
  const [newRFx, setNewRFx] = useState<Partial<SourcingRequest>>({
    type: 'RFQ',
    currency: 'USD',
    isReverseAuction: false,
    scoringCriteria: {
      price: { weight: 40, enabled: true },
      quality: { weight: 25, enabled: true },
      leadTime: { weight: 15, enabled: true },
      experience: { weight: 10, enabled: true },
      certification: { weight: 5, enabled: true },
      sustainability: { weight: 5, enabled: true }
    }
  });
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
      setSelectedRows(new Set(filteredRequests.map((r) => r.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-gray-600 bg-gray-50';
      case 'published': return 'text-blue-600 bg-blue-50';
      case 'in-progress': return 'text-yellow-600 bg-yellow-50';
      case 'evaluation': return 'text-purple-600 bg-purple-50';
      case 'awarded': return 'text-green-600 bg-green-50';
      case 'closed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'RFQ': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'RFP': return 'text-green-600 bg-green-50 border-green-200';
      case 'RFI': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const filteredRequests = mockSourcingRequests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || request.type === filterType;
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const calculateTotalWeight = (criteria: ScoringCriteria) => {
    return Object.values(criteria).reduce((total, criterion) => 
      criterion.enabled ? total + criterion.weight : total, 0
    );
  };

  const handleCreateRFx = () => {
    console.log('Creating RFx:', newRFx);
    setShowCreateDialog(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Target className="w-8 h-8 text-primary" />
            Sourcing & RFx Processes
          </h1>
          <p className="text-muted-foreground mt-2">
            Streamlined sourcing with automated quote comparison, reverse auctions, and intelligent supplier scoring
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Upload className="w-4 h-4" />
            Import from SAP
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create RFx
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Create New RFx</DialogTitle>
                <DialogDescription>
                  Create a new Request for Quotation, Proposal, or Information
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>RFx Type</Label>
                    <Select 
                      value={newRFx.type} 
                      onValueChange={(value: 'RFQ' | 'RFP' | 'RFI') => setNewRFx({...newRFx, type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RFQ">RFQ - Request for Quotation</SelectItem>
                        <SelectItem value="RFP">RFP - Request for Proposal</SelectItem>
                        <SelectItem value="RFI">RFI - Request for Information</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select onValueChange={(value: string) => setNewRFx({...newRFx, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="office-supplies">Office Supplies</SelectItem>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="professional-services">Professional Services</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="logistics">Logistics</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label>Title</Label>
                  <Input 
                    placeholder="Enter RFx title"
                    value={newRFx.title || ''}
                    onChange={(e) => setNewRFx({...newRFx, title: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label>Description</Label>
                  <Textarea 
                    placeholder="Detailed description of requirements"
                    value={newRFx.description || ''}
                    onChange={(e) => setNewRFx({...newRFx, description: e.target.value})}
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>SAP PR Number (Optional)</Label>
                    <Input 
                      placeholder="PR-45001236"
                      value={newRFx.prNumber || ''}
                      onChange={(e) => setNewRFx({...newRFx, prNumber: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Budget</Label>
                    <Input 
                      type="number"
                      placeholder="0"
                      value={newRFx.budget || ''}
                      onChange={(e) => setNewRFx({...newRFx, budget: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label>Currency</Label>
                    <Select 
                      value={newRFx.currency} 
                      onValueChange={(value: string) => setNewRFx({...newRFx, currency: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={newRFx.isReverseAuction}
                    onCheckedChange={(checked: boolean) => setNewRFx({...newRFx, isReverseAuction: checked})}
                  />
                  <Label>Enable Reverse Auction</Label>
                </div>
                
                <div className="flex justify-between">
                  <Dialog open={showScoringDialog} onOpenChange={setShowScoringDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline">Configure Scoring</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Scoring Criteria Configuration</DialogTitle>
                        <DialogDescription>
                          Set weights for different evaluation criteria (total must equal 100%)
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        {Object.entries(newRFx.scoringCriteria || {}).map(([key, criterion]) => (
                          <div key={key} className="flex items-center space-x-4">
                            <Switch 
                              checked={criterion.enabled}
                              onCheckedChange={(checked: boolean) => {
                                setNewRFx({...newRFx, scoringCriteria: {
                                  ...newRFx.scoringCriteria!,
                                  [key]: { ...criterion, enabled: checked }
                                }});
                              }}
                            />
                            <Label className="w-24 capitalize">{key}</Label>
                            <div className="flex-1">
                              <Slider
                                value={[criterion.weight]}
                                onValueChange={([value]: number[]) => {
                                  setNewRFx({...newRFx, scoringCriteria: {
                                    ...newRFx.scoringCriteria!,
                                    [key]: { ...criterion, weight: value }
                                  }});
                                }}
                                max={100}
                                step={5}
                                className="flex-1"
                                disabled={!criterion.enabled}
                              />
                            </div>
                            <span className="w-12 text-right">{criterion.weight}%</span>
                          </div>
                        ))}
                        <div className="pt-2 border-t">
                          <p className="text-sm">
                            Total Weight: {calculateTotalWeight(newRFx.scoringCriteria!)}%
                            {calculateTotalWeight(newRFx.scoringCriteria!) !== 100 && (
                              <span className="text-red-500 ml-2">Must equal 100%</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateRFx}>Create RFx</Button>
                  </div>
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
                <p className="text-sm text-muted-foreground">Active RFx</p>
                <p className="text-2xl font-bold">24</p>
                <p className="text-xs text-green-600">+3 this week</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Savings</p>
                <p className="text-2xl font-bold">$2.4M</p>
                <p className="text-xs text-green-600">+18% vs target</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold">5.2</p>
                <p className="text-xs text-muted-foreground">days</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Supplier Participation</p>
                <p className="text-2xl font-bold">89%</p>
                <p className="text-xs text-green-600">Above benchmark</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="responses">Responses & Scoring</TabsTrigger>
          <TabsTrigger value="auctions">Reverse Auctions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search RFx by title, description, or category..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="RFQ">RFQ</SelectItem>
                    <SelectItem value="RFP">RFP</SelectItem>
                    <SelectItem value="RFI">RFI</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="evaluation">Evaluation</SelectItem>
                    <SelectItem value="awarded">Awarded</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* View Toggle Buttons */}
          <div className="flex items-center border rounded-md w-fit">
            <Button
              variant={rfxViewMode === 'card' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setRfxViewMode('card')}
              className="rounded-r-none"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={rfxViewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setRfxViewMode('list')}
              className="rounded-none border-l border-r"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={rfxViewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setRfxViewMode('table')}
              className="rounded-l-none"
            >
              <TableIcon className="w-4 h-4" />
            </Button>
          </div>

          {/* RFx List */}
          {rfxViewMode === 'card' && (
            <div className="grid gap-4">
              {filteredRequests.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={getTypeColor(request.type)}>
                          {request.type}
                        </Badge>
                        <Badge variant="outline" className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                        {request.isReverseAuction && (
                          <Badge variant="outline" className="text-orange-600 bg-orange-50">
                            <Zap className="w-3 h-3 mr-1" />
                            Reverse Auction
                          </Badge>
                        )}
                        {request.prNumber && (
                          <Badge variant="outline" className="text-blue-600 bg-blue-50">
                            SAP: {request.prNumber}
                          </Badge>
                        )}
                      </div>
                      
                      <h3 className="font-semibold mb-2">{request.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {request.description}
                      </p>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Budget:</span>
                          <p className="font-medium">
                            {request.currency} {request.budget.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Due Date:</span>
                          <p className="font-medium">{format(request.dueDate, 'MMM dd, yyyy')}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Responses:</span>
                          <p className="font-medium">{request.responses} received</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Est. Value:</span>
                          <p className="font-medium">
                            {request.currency} {request.estimatedValue.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedRFx(request)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>{selectedRFx?.title}</DialogTitle>
                            <DialogDescription>{selectedRFx?.type} Details</DialogDescription>
                          </DialogHeader>
                          {selectedRFx && (
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Status</Label>
                                  <Badge className={getStatusColor(selectedRFx.status)}>
                                    {selectedRFx.status}
                                  </Badge>
                                </div>
                                <div>
                                  <Label>Category</Label>
                                  <p>{selectedRFx.category}</p>
                                </div>
                                <div>
                                  <Label>Budget</Label>
                                  <p>{selectedRFx.currency} {selectedRFx.budget.toLocaleString()}</p>
                                </div>
                                <div>
                                  <Label>Due Date</Label>
                                  <p>{format(selectedRFx.dueDate, 'PPp')}</p>
                                </div>
                              </div>
                              
                              <div>
                                <Label>Description</Label>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {selectedRFx.description}
                                </p>
                              </div>
                              
                              <div>
                                <Label>Scoring Criteria</Label>
                                <div className="grid grid-cols-2 gap-3 mt-2">
                                  {Object.entries(selectedRFx.scoringCriteria).map(([key, criterion]) => 
                                    criterion.enabled && (
                                      <div key={key} className="flex justify-between p-2 bg-muted rounded">
                                        <span className="capitalize">{key}</span>
                                        <span className="font-medium">{criterion.weight}%</span>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                              
                              <div>
                                <Label>Invited Suppliers</Label>
                                <p className="text-sm text-muted-foreground">
                                  {selectedRFx.suppliers.length} suppliers invited
                                </p>
                              </div>
                              
                              {selectedRFx.attachments.length > 0 && (
                                <div>
                                  <Label>Attachments</Label>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {selectedRFx.attachments.map((attachment, index) => (
                                      <Badge key={index} variant="outline" className="gap-1">
                                        <FileText className="w-3 h-3" />
                                        {attachment}
                                      </Badge>
                                    ))}
                                  </div>
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
            ))}
          </div>
          )}

          {/* List View */}
          {rfxViewMode === 'list' && (
            <div className="space-y-3">
              {filteredRequests.map((request) => (
                <Card key={request.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={getTypeColor(request.type)}>
                          {request.type}
                        </Badge>
                        <Badge variant="outline" className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {request.category}
                        </Badge>
                      </div>
                      <p className="font-medium mb-1">{request.title}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span>{request.currency} {request.estimatedValue.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{request.dueDate.toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{request.suppliers.length} suppliers</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedRFx(request)}>
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Table View */}
          {rfxViewMode === 'table' && (
            <Card>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={filteredRequests.map((r) => r.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <Table>
                    <TableHeader>
                      <DraggableTableHeader
                        showDragHandle={true}
                        allSelected={selectedRows.size === filteredRequests.length && filteredRequests.length > 0}
                        onSelectAll={handleSelectAll}
                      >
                        <TableHead>RFx Details</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Deadline</TableHead>
                        <TableHead>Suppliers</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </DraggableTableHeader>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((request) => (
                        <DraggableTableRow
                          key={request.id}
                          id={request.id}
                          isSelected={selectedRows.has(request.id)}
                          onSelect={() => handleSelectRow(request.id)}
                        >
                          <TableCell>
                            <div>
                              <p className="font-medium">{request.title}</p>
                              <p className="text-sm text-muted-foreground">{request.description.slice(0, 50)}...</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getTypeColor(request.type)}>
                              {request.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {request.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <p className="font-semibold">{request.currency} {request.estimatedValue.toLocaleString()}</p>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{request.dueDate.toLocaleDateString()}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{request.suppliers.length} suppliers</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusColor(request.status)}>
                              {request.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" onClick={() => setSelectedRFx(request)}>
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                            </div>
                          </TableCell>
                        </DraggableTableRow>
                      ))}
                    </TableBody>
                  </Table>
                </SortableContext>
              </DndContext>
            </Card>
          )}
        </TabsContent>

        {/* Responses & Scoring Tab */}
        <TabsContent value="responses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Responses</CardTitle>
              <CardDescription>
                Automated scoring and comparison of supplier proposals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Total Score</TableHead>
                    <TableHead>Proposed Price</TableHead>
                    <TableHead>Delivery Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockSupplierResponses.map((response) => (
                    <TableRow key={response.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{response.supplierName}</p>
                          <p className="text-xs text-muted-foreground">
                            Valid until: {format(response.validUntil, 'MMM dd')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(response.submittedAt, 'MMM dd, HH:mm')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${response.totalScore}%` }}
                            ></div>
                          </div>
                          <span className="font-medium">{response.totalScore}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          ${response.proposedPrice.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>{response.deliveryTime} weeks</TableCell>
                      <TableCell>
                        <Badge 
                          variant={response.status === 'shortlisted' ? 'default' : 'secondary'}
                          className={response.status === 'awarded' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {response.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>Response Details - {response.supplierName}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-6">
                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <Label>Total Score</Label>
                                    <div className="flex items-center gap-2 mt-1">
                                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                                        <div 
                                          className="bg-primary h-3 rounded-full" 
                                          style={{ width: `${response.totalScore}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-2xl font-bold">{response.totalScore}</span>
                                    </div>
                                  </div>
                                  <div>
                                    <Label>Proposed Price</Label>
                                    <p className="text-2xl font-bold">${response.proposedPrice.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <Label>Delivery Time</Label>
                                    <p className="text-2xl font-bold">{response.deliveryTime} weeks</p>
                                  </div>
                                </div>
                                
                                <div>
                                  <Label>Score Breakdown</Label>
                                  <div className="grid grid-cols-2 gap-3 mt-2">
                                    {Object.entries(response.breakdown).map(([key, score]) => (
                                      <div key={key} className="flex items-center justify-between p-3 border rounded">
                                        <div>
                                          <span className="capitalize font-medium">{key}</span>
                                          <p className="text-xs text-muted-foreground">
                                            Value: {score.value}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-bold">{score.score}</p>
                                          <div className="w-16 bg-gray-200 rounded-full h-1">
                                            <div 
                                              className="bg-primary h-1 rounded-full" 
                                              style={{ width: `${score.score}%` }}
                                            ></div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                
                                {response.notes && (
                                  <div>
                                    <Label>Supplier Notes</Label>
                                    <p className="text-sm text-muted-foreground mt-1 p-3 bg-muted rounded">
                                      {response.notes}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button variant="ghost" size="sm">
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reverse Auctions Tab */}
        <TabsContent value="auctions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Active Reverse Auction</CardTitle>
                  <CardDescription>Real-time competitive bidding</CardDescription>
                </div>
                <Badge className="text-green-600 bg-green-50">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Live
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Current Best Price</p>
                        <p className="text-2xl font-bold text-green-600">
                          ${mockReverseAuction.currentBestPrice.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Leading: {mockReverseAuction.leadingSupplier}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Savings</p>
                        <p className="text-2xl font-bold text-blue-600">
                          ${(mockReverseAuction.startingPrice - mockReverseAuction.currentBestPrice).toLocaleString()}
                        </p>
                        <p className="text-xs text-green-600">
                          {(((mockReverseAuction.startingPrice - mockReverseAuction.currentBestPrice) / mockReverseAuction.startingPrice) * 100).toFixed(1)}% saved
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Participants</p>
                        <p className="text-2xl font-bold">{mockReverseAuction.participants}</p>
                        <p className="text-xs text-muted-foreground">suppliers</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Time Remaining</p>
                        <p className="text-2xl font-bold text-orange-600">1:25:30</p>
                        <p className="text-xs text-muted-foreground">hours</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <h4 className="font-medium mb-4">Live Bidding Leaderboard</h4>
                  <div className="space-y-2">
                    {mockReverseAuction.bids.map((bid, index) => (
                      <div key={bid.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                        index === 0 ? 'bg-green-50 border-green-200' : 'bg-background'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-green-500 text-white' : 
                            index === 1 ? 'bg-gray-400 text-white' :
                            index === 2 ? 'bg-orange-400 text-white' : 'bg-gray-200'
                          }`}>
                            {bid.rank}
                          </div>
                          <div>
                            <p className="font-medium">{bid.supplierName}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(bid.timestamp, 'HH:mm:ss')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">${bid.amount.toLocaleString()}</p>
                          {index === 0 && (
                            <Badge variant="outline" className="text-green-600 bg-green-50">
                              <Award className="w-3 h-3 mr-1" />
                              Leading
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sourcing Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Cost Savings vs Target</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '118%' }}></div>
                      </div>
                      <span className="font-medium text-green-600">118%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Cycle Time Reduction</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                      <span className="font-medium">-15%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Supplier Diversity</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                      </div>
                      <span className="font-medium">92%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Response Rate</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '89%' }}></div>
                      </div>
                      <span className="font-medium">89%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>RFx Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>RFQ - Request for Quotation</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">45</p>
                      <p className="text-xs text-muted-foreground">62%</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>RFP - Request for Proposal</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">22</p>
                      <p className="text-xs text-muted-foreground">30%</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span>RFI - Request for Information</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">6</p>
                      <p className="text-xs text-muted-foreground">8%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Category Analysis</CardTitle>
              <CardDescription>
                Sourcing performance across different spend categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Total Spend</TableHead>
                    <TableHead>Savings</TableHead>
                    <TableHead>Avg. Response Time</TableHead>
                    <TableHead>Supplier Count</TableHead>
                    <TableHead>Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Technology</TableCell>
                    <TableCell>$2.4M</TableCell>
                    <TableCell className="text-green-600">+18.5%</TableCell>
                    <TableCell>4.2 days</TableCell>
                    <TableCell>12</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-green-600">Excellent</span>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Office Supplies</TableCell>
                    <TableCell>$850K</TableCell>
                    <TableCell className="text-green-600">+12.3%</TableCell>
                    <TableCell>3.8 days</TableCell>
                    <TableCell>8</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                        <span className="text-blue-600">Good</span>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Professional Services</TableCell>
                    <TableCell>$1.2M</TableCell>
                    <TableCell className="text-green-600">+8.7%</TableCell>
                    <TableCell>7.1 days</TableCell>
                    <TableCell>15</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <TrendingDown className="w-4 h-4 text-yellow-500" />
                        <span className="text-yellow-600">Average</span>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}