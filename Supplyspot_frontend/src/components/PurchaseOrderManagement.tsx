import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Eye,
  Download,
  Send,
  FileText,
  Calendar,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Building,
  User,
  MessageSquare,
  RefreshCw,
  ShoppingCart,
  Package,
  Truck,
  Bell,
  Check,
  X,
  AlertTriangle,
  History,
  MessageCircle,
  ClipboardCheck,
  Edit3,
  ArrowRight,
  TrendingUp,
  Users,
  Calculator,
  Archive,
  Grid,
  List,
  Table,
  Settings2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from './ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Checkbox } from './ui/checkbox';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { DraggableTableRow, DraggableTableHeader } from './ui/draggable-table-row';

// Mock data for Purchase Orders
const purchaseOrderData = [
  {
    id: 9991,
    poNumber: 'PO-2025-001',
    rfqNumber: 'RFQ-2025-001',
    buyer: 'TechCorp Inc.',
    buyerContact: 'john.smith@techcorp.com',
    issueDate: '2025-10-16',
    expectedDeliveryDate: '2025-11-01',
    totalAmount: 60000,
    currency: 'USD',
    status: 'New',
    priority: 'High',
    acknowledgmentStatus: 'Pending',
    lineItems: [
      { id: 1, item: 'Office Furniture Set', quantity: 1, unitPrice: 60000, total: 60000, deliveryDate: '2025-11-01' }
    ],
    deliveryAddress: '123 Business Park, Tech City, TC 12345',
    terms: 'Net 30 days',
    notes: 'Based on RFQ-2025-001 specifications.',
    attachments: ['PO_specifications.pdf'],
    notifications: [],
    changeRequests: [],
    communicationHistory: []
  },
  {
    id: 1,
    poNumber: 'PO-2023-001',
    rfqNumber: 'RFQ-2023-001',
    buyer: 'TechCorp Inc.',
    buyerContact: 'john.smith@techcorp.com',
    issueDate: '2023-11-15',
    expectedDeliveryDate: '2023-11-30',
    totalAmount: 47500,
    currency: 'USD',
    status: 'New',
    priority: 'High',
    acknowledgmentStatus: 'Pending',
    lineItems: [
      { id: 1, item: 'Laptops (HP EliteBook)', quantity: 10, unitPrice: 1200, total: 12000, deliveryDate: '2023-11-30' },
      { id: 2, item: 'Monitors (Dell 24")', quantity: 15, unitPrice: 300, total: 4500, deliveryDate: '2023-11-28' },
      { id: 3, item: 'Office Chairs (Ergonomic)', quantity: 20, unitPrice: 250, total: 5000, deliveryDate: '2023-11-25' }
    ],
    deliveryAddress: '123 Business Park, Tech City, TC 12345',
    terms: 'Net 30 days',
    notes: 'All items must meet specified quality standards. Delivery to be coordinated with facilities team.',
    attachments: ['PO_specifications.pdf', 'delivery_instructions.pdf'],
    notifications: [
      { id: 1, type: 'new_po', message: 'New purchase order received', timestamp: '2023-11-15 09:00', read: false },
      { id: 2, type: 'reminder', message: 'Acknowledgment required within 24 hours', timestamp: '2023-11-15 15:00', read: false }
    ],
    changeRequests: [],
    communicationHistory: []
  },
  {
    id: 2,
    poNumber: 'PO-2023-002',
    rfqNumber: 'RFQ-2023-002',
    buyer: 'StartupCorp',
    buyerContact: 'mary.jones@startupcorp.com',
    issueDate: '2023-11-12',
    expectedDeliveryDate: '2023-11-20',
    totalAmount: 22000,
    currency: 'USD',
    status: 'Acknowledged',
    priority: 'Medium',
    acknowledgmentStatus: 'Acknowledged',
    acknowledgmentDate: '2023-11-13',
    lineItems: [
      { id: 1, item: 'Office 365 E3 Licenses', quantity: 50, unitPrice: 300, total: 15000, deliveryDate: '2023-11-20' },
      { id: 2, item: 'Teams Premium Licenses', quantity: 50, unitPrice: 140, total: 7000, deliveryDate: '2023-11-20' }
    ],
    deliveryAddress: 'Digital delivery - License activation',
    terms: 'Net 15 days',
    notes: 'Annual subscription with enterprise support. Activation instructions to be provided.',
    attachments: ['license_terms.pdf'],
    notifications: [
      { id: 1, type: 'acknowledgment', message: 'Purchase order acknowledged successfully', timestamp: '2023-11-13 10:30', read: true }
    ],
    changeRequests: [],
    communicationHistory: [
      { id: 1, type: 'acknowledgment', message: 'PO acknowledged. Delivery scheduled as requested.', timestamp: '2023-11-13 10:30', author: 'Supplier' }
    ]
  },
  {
    id: 3,
    poNumber: 'PO-2023-003',
    rfqNumber: 'RFQ-2023-003',
    buyer: 'EventCorp',
    buyerContact: 'event.manager@eventcorp.com',
    issueDate: '2023-11-08',
    expectedDeliveryDate: '2023-11-18',
    totalAmount: 12500,
    currency: 'USD',
    status: 'In Progress',
    priority: 'High',
    acknowledgmentStatus: 'Acknowledged',
    acknowledgmentDate: '2023-11-09',
    lineItems: [
      { id: 1, item: 'Corporate Lunch Catering', quantity: 1, unitPrice: 6000, total: 6000, deliveryDate: '2023-11-18' },
      { id: 2, item: 'Corporate Dinner Catering', quantity: 1, unitPrice: 6500, total: 6500, deliveryDate: '2023-11-18' }
    ],
    deliveryAddress: 'Grand Hotel Conference Center, Event City, EC 54321',
    terms: 'Net 30 days',
    notes: 'Menu confirmed as per RFQ. Setup required by 11:30 AM for lunch, 6:30 PM for dinner.',
    attachments: ['menu_details.pdf', 'venue_layout.pdf'],
    notifications: [],
    changeRequests: [
      {
        id: 1,
        type: 'quantity_change',
        description: 'Increase guest count from 200 to 220 people',
        requestedBy: 'Supplier',
        requestDate: '2023-11-10',
        status: 'Pending',
        originalValue: '200 guests',
        proposedValue: '220 guests',
        impactAmount: 1250,
        reason: 'Client requested additional attendees'
      }
    ],
    communicationHistory: [
      { id: 1, type: 'acknowledgment', message: 'PO acknowledged. Menu preparation underway.', timestamp: '2023-11-09 14:20', author: 'Supplier' },
      { id: 2, type: 'change_request', message: 'Requesting approval for guest count increase to 220.', timestamp: '2023-11-10 09:15', author: 'Supplier' }
    ]
  },
  {
    id: 4,
    poNumber: 'PO-2023-004',
    rfqNumber: 'RFQ-2023-004',
    buyer: 'BuildCorp',
    buyerContact: 'procurement@buildcorp.com',
    issueDate: '2023-11-05',
    expectedDeliveryDate: '2023-11-22',
    totalAmount: 68000,
    currency: 'USD',
    status: 'Change Requested',
    priority: 'High',
    acknowledgmentStatus: 'Acknowledged',
    acknowledgmentDate: '2023-11-06',
    lineItems: [
      { id: 1, item: 'Steel Beams (Grade A)', quantity: 50, unitPrice: 800, total: 40000, deliveryDate: '2023-11-20' },
      { id: 2, item: 'Concrete Mix (Premium)', quantity: 100, unitPrice: 180, total: 18000, deliveryDate: '2023-11-22' },
      { id: 3, item: 'Electrical Conduits', quantity: 200, unitPrice: 50, total: 10000, deliveryDate: '2023-11-22' }
    ],
    deliveryAddress: 'Construction Site B, Industrial District, ID 67890',
    terms: 'Net 45 days',
    notes: 'All materials must meet building code requirements. Delivery coordination required with site manager.',
    attachments: ['material_specifications.pdf', 'safety_requirements.pdf'],
    notifications: [
      { id: 1, type: 'change_response', message: 'Change request approved with conditions', timestamp: '2023-11-11 14:00', read: false }
    ],
    changeRequests: [
      {
        id: 1,
        type: 'delivery_date',
        description: 'Request delivery date extension due to weather delays',
        requestedBy: 'Supplier',
        requestDate: '2023-11-07',
        status: 'Approved',
        originalValue: '2023-11-15',
        proposedValue: '2023-11-22',
        impactAmount: 0,
        reason: 'Weather conditions affecting steel production',
        approvalDate: '2023-11-08',
        buyerResponse: 'Approved. Please provide daily progress updates.'
      }
    ],
    communicationHistory: [
      { id: 1, type: 'acknowledgment', message: 'PO acknowledged. Production scheduled.', timestamp: '2023-11-06 11:45', author: 'Supplier' },
      { id: 2, type: 'change_request', message: 'Requesting delivery extension due to weather impact.', timestamp: '2023-11-07 16:30', author: 'Supplier' },
      { id: 3, type: 'approval', message: 'Change approved. Please provide progress updates.', timestamp: '2023-11-08 09:00', author: 'Buyer' }
    ]
  }
];

// Mock notification data
const notificationData = [
  {
    id: 1,
    type: 'new_po',
    title: 'New Purchase Order Received',
    message: 'PO-2023-005 from Manufacturing Corp - $85,000',
    timestamp: '2023-11-16 10:30',
    read: false,
    priority: 'high',
    poNumber: 'PO-2023-005'
  },
  {
    id: 2,
    type: 'change_approved',
    title: 'Change Request Approved',
    message: 'Delivery date extension for PO-2023-004 approved',
    timestamp: '2023-11-15 14:22',
    read: false,
    priority: 'medium',
    poNumber: 'PO-2023-004'
  },
  {
    id: 3,
    type: 'acknowledgment_reminder',
    title: 'Acknowledgment Required',
    message: 'PO-2023-001 requires acknowledgment within 12 hours',
    timestamp: '2023-11-15 09:00',
    read: true,
    priority: 'high',
    poNumber: 'PO-2023-001'
  },
  {
    id: 4,
    type: 'amendment',
    title: 'PO Amendment Received',
    message: 'PO-2023-002 has been amended - quantity changes',
    timestamp: '2023-11-14 16:45',
    read: true,
    priority: 'medium',
    poNumber: 'PO-2023-002'
  }
];

export function PurchaseOrderManagement() {
  const [activeTab, setActiveTab] = useState('purchase-orders');
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [isChangeRequestModalOpen, setIsChangeRequestModalOpen] = useState(false);
  const [isCommunicationModalOpen, setIsCommunicationModalOpen] = useState(false);
  
  // High Density State
  const [poSearchTerm, setPoSearchTerm] = useState('');
  const [poStatusFilter, setPoStatusFilter] = useState('all');
  const [poSortConfig, setPoSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
    key: 'poNumber',
    direction: 'desc'
  });
  
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [poCurrentPage, setPoCurrentPage] = useState(1);
  const [poViewMode, setPoViewMode] = useState<'card' | 'list' | 'table'>('table');
  const [visiblePoColumns, setVisiblePoColumns] = useState<string[]>([
    'poNumber', 'buyer', 'amount', 'deliveryDate', 'status', 'acknowledgment'
  ]);
  const [isColumnsPopoverOpen, setIsColumnsPopoverOpen] = useState(false);

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [selectedChangeRequest, setSelectedChangeRequest] = useState<any>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'default';
      case 'Acknowledged': return 'secondary';
      case 'In Progress': return 'default';
      case 'Change Requested': return 'secondary';
      case 'Completed': return 'default';
      case 'Cancelled': return 'destructive';
      case 'Pending': return 'secondary';
      case 'Approved': return 'default';
      case 'Rejected': return 'destructive';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'destructive';
      case 'Medium': return 'default';
      case 'Low': return 'secondary';
      default: return 'outline';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_po': return <ShoppingCart className="w-4 h-4" />;
      case 'change_approved': return <CheckCircle className="w-4 h-4" />;
      case 'change_rejected': return <XCircle className="w-4 h-4" />;
      case 'acknowledgment_reminder': return <Clock className="w-4 h-4" />;
      case 'amendment': return <Edit className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (poSortConfig.key === key && poSortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (poSortConfig.key === key && poSortConfig.direction === 'desc') {
      direction = null;
    }
    setPoSortConfig({ key, direction });
  };

  const toggleColumn = (columnId: string) => {
    setVisiblePoColumns(prev =>
      prev.includes(columnId)
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  };

  const handleExportCSV = () => {
    const dataToExport = activeTab === 'purchase-orders' ? purchaseOrderData : notificationData;
    const headers = Object.keys(dataToExport[0]).join(',');
    const rows = dataToExport.map(item => Object.values(item).map(val => `"${val}"`).join(','));
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${activeTab}_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    handleExportCSV(); // Mock Excel export using CSV
  };

  const handleDragEnd = (event: DragEndEvent) => {
    // This would typically update the order in a real backend
    // For now we'll just log it or update local mock if it was mutable
    console.log('Drag end:', event);
  };

  const filteredPOs = purchaseOrderData.filter(po => {
    const matchesSearch = po.poNumber.toLowerCase().includes(poSearchTerm.toLowerCase()) ||
                         po.buyer.toLowerCase().includes(poSearchTerm.toLowerCase());
    const matchesStatus = poStatusFilter === 'all' || po.status === poStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedPOs = React.useMemo(() => {
    const sortableItems = [...filteredPOs];
    if (poSortConfig.key !== null && poSortConfig.direction !== null) {
        sortableItems.sort((a: any, b: any) => {
          const aValue = a[poSortConfig.key];
          const bValue = b[poSortConfig.key];

          if (aValue === undefined || bValue === undefined) return 0;

          if (aValue < bValue) {
            return poSortConfig.direction === 'asc' ? -1 : 1;
          }
          if (aValue > bValue) {
            return poSortConfig.direction === 'asc' ? 1 : -1;
          }
          return 0;
        });
    }
    return sortableItems;
  }, [filteredPOs, poSortConfig]);

  const pagedPOs = sortedPOs.slice(
    (poCurrentPage - 1) * itemsPerPage,
    poCurrentPage * itemsPerPage
  );

  const unreadNotifications = notificationData.filter(n => !n.read).length;

  const handleAcknowledgePO = (poId: number) => {
    console.log('Acknowledging PO:', poId);
    // Implementation would handle PO acknowledgment
  };

  const handleRequestChange = (poId: number) => {
    console.log('Requesting change for PO:', poId);
    setIsChangeRequestModalOpen(true);
  };

  const handleSendMessage = (poId: number) => {
    console.log('Sending message for PO:', poId);
    setIsCommunicationModalOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Purchase Order Management</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 relative">
            <Bell className="w-4 h-4" />
            Notifications
            {unreadNotifications > 0 && (
              <Badge className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center p-0 text-xs">
                {unreadNotifications}
              </Badge>
            )}
          </Button>
          <Button variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button className="gap-2" onClick={handleExportExcel}>
            <Download className="w-4 h-4" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active POs</p>
              <p className="text-2xl font-semibold">{purchaseOrderData.filter(po => ['New', 'Acknowledged', 'In Progress'].includes(po.status)).length}</p>
              <p className="text-xs text-muted-foreground">Requiring attention</p>
            </div>
            <ShoppingCart className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Acknowledgment</p>
              <p className="text-2xl font-semibold">{purchaseOrderData.filter(po => po.acknowledgmentStatus === 'Pending').length}</p>
              <p className="text-xs text-orange-500">Action required</p>
            </div>
            <ClipboardCheck className="w-8 h-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Change Requests</p>
              <p className="text-2xl font-semibold">{purchaseOrderData.reduce((acc, po) => acc + po.changeRequests.length, 0)}</p>
              <p className="text-xs text-muted-foreground">Active requests</p>
            </div>
            <Edit3 className="w-8 h-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-semibold">$150K</p>
              <p className="text-xs text-green-500">Active POs</p>
            </div>
            <Calculator className="w-8 h-8 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Alert for urgent actions */}
      {unreadNotifications > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {unreadNotifications} unread notification{unreadNotifications > 1 ? 's' : ''} requiring attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="purchase-orders" className="gap-2">
            <ShoppingCart className="w-4 h-4" />
            Purchase Orders
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 relative">
            <Bell className="w-4 h-4" />
            Notifications
            {unreadNotifications > 0 && (
              <Badge className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center p-0 text-xs">
                {unreadNotifications}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="change-requests" className="gap-2">
            <Edit3 className="w-4 h-4" />
            Change Requests
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="purchase-orders" className="space-y-6">
          {/* Combined Data Views Card */}
          <Card className="mx-auto max-w-full overflow-hidden border-slate-200/60 shadow-md">
            <div className="p-3.5 border-b flex flex-col xl:flex-row items-center justify-between gap-4 bg-white no-print">
              <h3 className="font-bold text-lg text-slate-800 shrink-0">Purchase Orders</h3>

              <div className="flex flex-1 items-center gap-3 w-full max-w-4xl">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search purchase orders..."
                    value={poSearchTerm}
                    onChange={(e) => setPoSearchTerm(e.target.value)}
                    className="pl-10 h-10 bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="h-10 px-3 flex items-center gap-2 bg-slate-50/50 border-slate-200 hover:bg-slate-100 transition-colors">
                        <Filter className="w-4 h-4 text-slate-600" />
                        <span className="text-sm font-medium text-slate-700">Filters</span>
                        {(poStatusFilter !== 'all' || poSearchTerm !== '') && (
                          <Badge variant="secondary" className="ml-1 h-5 px-1.5 min-w-5 justify-center bg-primary/10 text-primary border-none text-[10px]">
                            {[poStatusFilter !== 'all', poSearchTerm !== ''].filter(Boolean).length}
                          </Badge>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4" align="end">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-slate-900">Advanced Filters</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setPoStatusFilter('all');
                              setPoSearchTerm('');
                            }}
                            className="h-8 text-xs text-muted-foreground hover:text-primary"
                          >
                            Reset all
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Order Status</Label>
                          <Select value={poStatusFilter} onValueChange={setPoStatusFilter}>
                            <SelectTrigger className="w-full h-10 border-slate-200">
                              <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Statuses</SelectItem>
                              <SelectItem value="New">New</SelectItem>
                              <SelectItem value="Acknowledged">Acknowledged</SelectItem>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="Change Requested">Change Requested</SelectItem>
                              <SelectItem value="Completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-10 px-3 flex items-center gap-2 bg-slate-50/50 border-slate-200">
                      <Settings2 className="w-4 h-4 text-slate-600" />
                      <span className="text-sm font-medium">Columns</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuLabel>Manage Columns</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {[
                      { id: 'poNumber', label: 'PO Details' },
                      { id: 'buyer', label: 'Buyer' },
                      { id: 'amount', label: 'Amount' },
                      { id: 'deliveryDate', label: 'Delivery Date' },
                      { id: 'status', label: 'Status' },
                      { id: 'acknowledgment', label: 'Acknowledgment' }
                    ].map(col => (
                      <div key={col.id} className="flex items-center space-x-2 px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors" onClick={(e) => { e.preventDefault(); toggleColumn(col.id); }}>
                        <Checkbox
                          id={`col-${col.id}`}
                          checked={visiblePoColumns.includes(col.id)}
                          onCheckedChange={() => toggleColumn(col.id)}
                        />
                        <Label htmlFor={`col-${col.id}`} className="text-sm cursor-pointer flex-1">{col.label}</Label>
                      </div>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex items-center border border-slate-200 rounded-lg p-1 bg-slate-50 shrink-0 h-10">
                  <Button
                    variant={poViewMode === 'card' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setPoViewMode('card')}
                    className="rounded-md h-8 px-3"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={poViewMode === 'list' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setPoViewMode('list')}
                    className="rounded-md h-8 px-3"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={poViewMode === 'table' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setPoViewMode('table')}
                    className="rounded-md h-8 px-3"
                  >
                    <Table className="w-4 h-4" />
                  </Button>
                </div>

                <DropdownMenu dropDown={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-10 px-3 flex items-center gap-2 bg-slate-50/50 border-slate-200">
                      <Download className="w-4 h-4 text-slate-600" />
                      <span className="text-sm font-medium">Export</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={handleExportExcel} className="gap-2 cursor-pointer">
                      <FileSpreadsheet className="w-4 h-4 text-green-600" />
                      Export to Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportCSV} className="gap-2 cursor-pointer">
                      <FileText className="w-4 h-4 text-blue-600" />
                      Export to CSV
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

              {/* Table View (Default) */}
              {poViewMode === 'table' && (
                <div className="overflow-hidden bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <DraggableTableHeader>
                          {visiblePoColumns.includes('poNumber') && (
                            <th className="text-left p-4 font-semibold text-slate-600 text-sm sticky left-8 z-30 bg-[#f8fafc] border-b shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] whitespace-nowrap min-w-[200px]">
                              <button onClick={() => requestSort('poNumber')} className="flex items-center gap-1 hover:text-primary transition-all">
                                PO Details
                                <ArrowUpDown className={`w-3.5 h-3.5 ${poSortConfig.key === 'poNumber' ? 'text-primary' : 'text-slate-400'}`} />
                              </button>
                            </th>
                          )}
                          {visiblePoColumns.includes('buyer') && (
                            <th className="text-left p-4 font-semibold text-slate-600 text-sm whitespace-nowrap min-w-[150px]">
                              <button onClick={() => requestSort('buyer')} className="flex items-center gap-1 hover:text-primary transition-all">
                                Buyer
                                <ArrowUpDown className={`w-3.5 h-3.5 ${poSortConfig.key === 'buyer' ? 'text-primary' : 'text-slate-400'}`} />
                              </button>
                            </th>
                          )}
                          {visiblePoColumns.includes('amount') && (
                            <th className="text-left p-4 font-semibold text-slate-600 text-sm whitespace-nowrap">
                              <button onClick={() => requestSort('totalAmount')} className="flex items-center gap-1 hover:text-primary transition-all">
                                Amount
                                <ArrowUpDown className={`w-3.5 h-3.5 ${poSortConfig.key === 'totalAmount' ? 'text-primary' : 'text-slate-400'}`} />
                              </button>
                            </th>
                          )}
                          {visiblePoColumns.includes('deliveryDate') && (
                            <th className="text-left p-4 font-semibold text-slate-600 text-sm whitespace-nowrap">
                              <button onClick={() => requestSort('expectedDeliveryDate')} className="flex items-center gap-1 hover:text-primary transition-all">
                                Delivery Date
                                <ArrowUpDown className={`w-3.5 h-3.5 ${poSortConfig.key === 'expectedDeliveryDate' ? 'text-primary' : 'text-slate-400'}`} />
                              </button>
                            </th>
                          )}
                          {visiblePoColumns.includes('status') && (
                            <th className="text-left p-4 font-semibold text-slate-600 text-sm whitespace-nowrap">
                              <button onClick={() => requestSort('status')} className="flex items-center gap-1 hover:text-primary transition-all">
                                Status
                                <ArrowUpDown className={`w-3.5 h-3.5 ${poSortConfig.key === 'status' ? 'text-primary' : 'text-slate-400'}`} />
                              </button>
                            </th>
                          )}
                          {visiblePoColumns.includes('acknowledgment') && (
                            <th className="text-left p-4 font-semibold text-slate-600 text-sm whitespace-nowrap">
                              <button onClick={() => requestSort('acknowledgmentStatus')} className="flex items-center gap-1 hover:text-primary transition-all">
                                Acknowledgment
                                <ArrowUpDown className={`w-3.5 h-3.5 ${poSortConfig.key === 'acknowledgmentStatus' ? 'text-primary' : 'text-slate-400'}`} />
                              </button>
                            </th>
                          )}
                          <th className="p-4 font-semibold text-slate-600 text-sm sticky right-0 z-30 bg-[#f8fafc] border-b shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] text-center w-24">
                            Actions
                          </th>
                        </DraggableTableHeader>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleDragEnd}
                        >
                          <SortableContext
                            items={pagedPOs.map((p) => p.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {pagedPOs.map((po) => (
                              <DraggableTableRow key={po.id} id={po.id}>
                                {visiblePoColumns.includes('poNumber') && (
                                  <td className="p-4 sticky left-8 z-20 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-slate-50 transition-colors whitespace-nowrap">
                                    <div>
                                      <p className="font-bold text-slate-900 leading-tight">{po.poNumber}</p>
                                      <p className="text-[11px] text-slate-400 font-medium">RFQ: {po.rfqNumber}</p>
                                      <div className="flex items-center gap-1.5 mt-1.5">
                                        <Badge variant={getPriorityColor(po.priority)} className="h-4.5 px-1.5 text-[10px] font-bold uppercase tracking-wider">
                                          {po.priority}
                                        </Badge>
                                        {po.changeRequests.length > 0 && (
                                          <Badge variant="outline" className="h-4.5 px-1.5 text-[10px] font-bold border-slate-200 text-slate-500">
                                            {po.changeRequests.length} Changes
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                )}
                                {visiblePoColumns.includes('buyer') && (
                                  <td className="p-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                      <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white transition-colors">
                                        <Building className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-semibold text-slate-700">{po.buyer}</p>
                                        <p className="text-[11px] text-slate-400">{po.buyerContact}</p>
                                      </div>
                                    </div>
                                  </td>
                                )}
                                {visiblePoColumns.includes('amount') && (
                                  <td className="p-4 whitespace-nowrap">
                                    <p className="font-bold text-slate-900">{po.currency} {po.totalAmount.toLocaleString()}</p>
                                    <p className="text-[11px] text-slate-400 font-medium">{po.lineItems.length} items</p>
                                  </td>
                                )}
                                {visiblePoColumns.includes('deliveryDate') && (
                                  <td className="p-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2 text-slate-600 font-medium h-9 px-3 bg-slate-50/50 rounded-lg group-hover:bg-white transition-colors w-fit">
                                      <Calendar className="w-4 h-4 text-slate-400" />
                                      <span className="text-xs">{po.expectedDeliveryDate}</span>
                                    </div>
                                  </td>
                                )}
                                {visiblePoColumns.includes('status') && (
                                  <td className="p-4 whitespace-nowrap">
                                    <Badge variant={getStatusColor(po.status)} className="h-6 px-2.5 font-bold text-xs uppercase tracking-tight">
                                      {po.status}
                                    </Badge>
                                  </td>
                                )}
                                {visiblePoColumns.includes('acknowledgment') && (
                                  <td className="p-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      <Badge variant={getStatusColor(po.acknowledgmentStatus)} className="h-6 px-2.5 font-semibold text-xs transition-all">
                                        {po.acknowledgmentStatus}
                                      </Badge>
                                      {po.acknowledgmentStatus === 'Pending' && (
                                        <Clock className="w-4 h-4 text-orange-500 animate-pulse" />
                                      )}
                                    </div>
                                  </td>
                                )}
                                <td className="p-4 sticky right-0 z-20 bg-white shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-slate-50 transition-colors whitespace-nowrap text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedPO(po);
                                        setIsPOModalOpen(true);
                                      }}
                                      className="h-8 w-8 p-0 bg-white hover:bg-slate-50 rounded-full border-slate-200"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-slate-600" />
                                    </Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                                          <MoreHorizontal className="w-4 h-4 text-slate-400" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-48 shadow-xl border-slate-200/60 p-1.5">
                                        <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-1.5">PO Actions</DropdownMenuLabel>
                                        {po.acknowledgmentStatus === 'Pending' && (
                                          <DropdownMenuItem onClick={() => handleAcknowledgePO(po.id)} className="gap-2.5 py-2.5 cursor-pointer rounded-md">
                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                            <span className="font-semibold text-sm">Acknowledge PO</span>
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem onClick={() => handleRequestChange(po.id)} className="gap-2.5 py-2.5 cursor-pointer rounded-md">
                                          <Edit className="w-4 h-4 text-blue-500" />
                                          <span className="font-semibold text-sm">Request Change</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleSendMessage(po.id)} className="gap-2.5 py-2.5 cursor-pointer rounded-md">
                                          <MessageSquare className="w-4 h-4 text-slate-500" />
                                          <span className="font-semibold text-sm">Message Buyer</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="my-1.5" />
                                        <DropdownMenuItem className="gap-2.5 py-2.5 cursor-pointer rounded-md text-slate-600">
                                          <Download className="w-4 h-4" />
                                          <span className="font-semibold text-sm">Download PDF</span>
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </td>
                              </DraggableTableRow>
                            ))}
                          </SortableContext>
                        </DndContext>
                      </tbody>
                    </table>
                  </div>

                  {/* High Density Pagination */}
                  <div className="flex items-center justify-between p-4 bg-slate-50/50 border-t border-slate-100 no-print">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rows per page:</span>
                        <Select value={itemsPerPage.toString()} onValueChange={(v: string) => { setItemsPerPage(parseInt(v)); setPoCurrentPage(1); }}>
                          <SelectTrigger className="h-8 w-[70px] bg-white border-slate-200 text-xs font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[10, 25, 50, 100].map(v => (
                              <SelectItem key={v} value={v.toString()} className="text-xs font-bold">{v}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="h-4 w-px bg-slate-200" />
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        Showing <span className="text-slate-900">{(poCurrentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-900">{Math.min(poCurrentPage * itemsPerPage, sortedPOs.length)}</span> of <span className="text-slate-900">{sortedPOs.length}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPoCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={poCurrentPage === 1}
                        className="h-8 px-3 gap-1 bg-white border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-all font-bold text-[11px] uppercase tracking-wider"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        Prev
                      </Button>
                      <div className="flex items-center gap-1 mx-2">
                        {Array.from({ length: Math.min(5, Math.ceil(sortedPOs.length / itemsPerPage)) }, (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <Button
                              key={pageNum}
                              variant={poCurrentPage === pageNum ? 'default' : 'ghost'}
                              size="sm"
                              onClick={() => setPoCurrentPage(pageNum)}
                              className={`h-8 w-8 p-0 font-bold text-xs rounded-md transition-all ${poCurrentPage === pageNum ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPoCurrentPage(prev => Math.min(Math.ceil(sortedPOs.length / itemsPerPage), prev + 1))}
                        disabled={poCurrentPage === Math.ceil(sortedPOs.length / itemsPerPage)}
                        className="h-8 px-3 gap-1 bg-white border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-all font-bold text-[11px] uppercase tracking-wider"
                      >
                        Next
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

          {poViewMode === 'list' && (
            <div className="space-y-2 p-4">
              {pagedPOs.map((po) => (
                <div key={po.id} className="group flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-primary/30 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                      <ShoppingCart className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{po.poNumber}</h4>
                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">RFQ: {po.rfqNumber}</p>
                    </div>
                    <div className="hidden md:flex items-center gap-10 ml-6">
                      <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.15em] mb-1">Buyer</p>
                        <p className="text-sm font-bold text-slate-700">{po.buyer}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.15em] mb-1">Amount</p>
                        <p className="text-sm font-black text-slate-900">{po.currency} {po.totalAmount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.15em] mb-1">Expected Delivery</p>
                        <div className="flex items-center gap-1.5 text-sm font-bold text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {po.expectedDeliveryDate}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge variant={getStatusColor(po.status)} className="h-6 px-3 font-black text-[10px] uppercase tracking-wider">
                        {po.status}
                      </Badge>
                      <Badge variant={getPriorityColor(po.priority)} className="h-4.5 px-2 text-[9px] font-bold">
                        {po.priority}
                      </Badge>
                    </div>
                    <div className="h-10 w-px bg-slate-100 mx-2" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPO(po);
                        setIsPOModalOpen(true);
                      }}
                      className="h-10 px-4 font-bold text-xs border-slate-200 hover:border-primary hover:text-primary transition-all bg-white shadow-sm"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {poViewMode === 'card' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
              {pagedPOs.map((po) => (
                <Card key={po.id} className="group hover:shadow-xl transition-all duration-300 border-slate-200/60 overflow-hidden flex flex-col bg-white">
                  <div className="p-4 flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                        <ShoppingCart className="w-5 h-5" />
                      </div>
                      <Badge variant={getStatusColor(po.status)} className="h-6 px-2.5 font-bold text-[10px] uppercase tracking-tight">
                        {po.status}
                      </Badge>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{po.poNumber}</h4>
                      <p className="text-[11px] text-slate-400 font-medium">RFQ: {po.rfqNumber}</p>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 font-medium">Amount:</span>
                        <span className="font-bold text-slate-900">{po.currency} {po.totalAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 font-medium">Buyer:</span>
                        <span className="text-slate-700 font-semibold">{po.buyer}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 font-medium">Delivery:</span>
                        <span className="text-slate-700 font-semibold">{po.expectedDeliveryDate}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={getPriorityColor(po.priority)} className="h-5 px-2 text-[10px] font-bold">
                        {po.priority}
                      </Badge>
                      {po.changeRequests.length > 0 && (
                        <Badge variant="outline" className="h-5 px-2 text-[10px] font-bold border-slate-200 text-slate-400">
                          {po.changeRequests.length} Changes
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPO(po);
                        setIsPOModalOpen(true);
                      }}
                      className="flex-1 h-9 font-bold text-xs bg-white border-slate-200 hover:bg-slate-50 gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 bg-white border border-slate-200 hover:bg-slate-50 rounded-md">
                          <MoreHorizontal className="w-4 h-4 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {po.acknowledgmentStatus === 'Pending' && (
                          <DropdownMenuItem onClick={() => handleAcknowledgePO(po.id)}>
                            <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                            Acknowledge
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleRequestChange(po.id)}>
                          <Edit className="w-4 h-4 mr-2 text-blue-500" />
                          Change Request
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          {/* Notifications */}
          <Card>
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3>Notifications</h3>
                <Button variant="outline" size="sm">
                  Mark All Read
                </Button>
              </div>
            </div>
            <div className="space-y-2 p-4">
              {notificationData.map((notification) => (
                <Card key={notification.id} className={`p-4 ${!notification.read ? 'bg-blue-50 border-blue-200' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${!notification.read ? 'bg-blue-100' : 'bg-muted'}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{notification.title}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant={getPriorityColor(notification.priority)} className="text-xs">
                            {notification.priority}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{notification.timestamp}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {notification.poNumber}
                        </Badge>
                        {!notification.read && (
                          <Badge className="text-xs">Unread</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="change-requests" className="space-y-6">
          {/* Change Requests */}
          <Card>
            <div className="p-4 border-b">
              <h3>Change Requests</h3>
            </div>
            <div className="space-y-4 p-4">
              {purchaseOrderData.flatMap(po => 
                po.changeRequests.map(change => (
                  <Card key={`${po.id}-${change.id}`} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{po.poNumber}</span>
                          <Badge variant={getStatusColor(change.status)} className="text-xs">
                            {change.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Requested: {change.requestDate}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm">Change Type: {change.type.replace('_', ' ').toUpperCase()}</Label>
                        <p className="text-sm mt-1">{change.description}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm">Original Value:</Label>
                          <p className="text-sm mt-1 p-2 bg-red-50 rounded">{change.originalValue}</p>
                        </div>
                        <div>
                          <Label className="text-sm">Proposed Value:</Label>
                          <p className="text-sm mt-1 p-2 bg-green-50 rounded">{change.proposedValue}</p>
                        </div>
                      </div>
                      
                      {change.impactAmount !== 0 && (
                        <div>
                          <Label className="text-sm">Financial Impact:</Label>
                          <p className="text-sm mt-1 font-semibold">
                            {change.impactAmount > 0 ? '+' : ''}${change.impactAmount.toLocaleString()}
                          </p>
                        </div>
                      )}
                      
                      <div>
                        <Label className="text-sm">Reason:</Label>
                        <p className="text-sm mt-1 p-2 bg-muted/30 rounded">{change.reason}</p>
                      </div>
                      
                      {change.status === 'Approved' && (
                        <div>
                          <Label className="text-sm">Response:</Label>
                          <p className="text-sm mt-1 p-2 bg-green-50 rounded">Change request approved by buyer</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Status: {change.status}
                          </p>
                        </div>
                      )}
                      
                      {change.status === 'Rejected' && (
                        <div>
                          <Label className="text-sm">Response:</Label>
                          <p className="text-sm mt-1 p-2 bg-red-50 rounded">Change request rejected by buyer</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Status: {change.status}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Analytics Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="p-4 border-b">
                <h3>PO Performance</h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span>On-Time Acknowledgment</span>
                  <span className="font-semibold">92%</span>
                </div>
                <Progress value={92} className="h-2" />
                
                <div className="flex justify-between items-center">
                  <span>Change Request Rate</span>
                  <span className="font-semibold">15%</span>
                </div>
                <Progress value={15} className="h-2" />
                
                <div className="flex justify-between items-center">
                  <span>Average Processing Time</span>
                  <span className="font-semibold">2.3 days</span>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-4 border-b">
                <h3>Communication Metrics</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span>Messages Sent</span>
                  <span className="font-semibold">127</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Response Time</span>
                  <span className="font-semibold">4.2 hrs</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Resolution Rate</span>
                  <div className="flex items-center gap-2">
                    <Progress value={88} className="w-16 h-2" />
                    <span className="text-sm">88%</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isPOModalOpen} onOpenChange={setIsPOModalOpen}>
        <DialogContent className="max-w-4xl w-[95vw] sm:w-full overflow-hidden flex flex-col p-0 gap-0 border-none shadow-2xl">
          {selectedPO && (
            <>
              <div className="bg-slate-900 p-6 text-white shrink-0">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold tracking-tight">{selectedPO.poNumber}</h2>
                      <Badge className="bg-white/10 text-white border-white/20 hover:bg-white/20 px-3 py-1 font-bold text-[10px] uppercase tracking-widest leading-none">
                        {selectedPO.status}
                      </Badge>
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Issue Date: {selectedPO.issueDate} • Vendor Reference: VR-{selectedPO.id}992</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 mb-1">Total Order Value</p>
                    <p className="text-3xl font-black text-white leading-none">{selectedPO.currency} {selectedPO.totalAmount?.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto bg-white" style={{ maxHeight: 'calc(90vh - 120px)' }}>
                {/* Metadata Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <Building className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Buyer Information</p>
                        <p className="text-sm font-bold text-slate-700">{selectedPO.buyer}</p>
                        <p className="text-xs text-slate-500">{selectedPO.buyerContact}</p>
                      </div>
                    </div>
                    <div className="h-px bg-slate-100" />
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                        <ShoppingCart className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">RFQ Reference</p>
                        <p className="text-sm font-bold text-slate-700">{selectedPO.rfqNumber}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Delivery Details</p>
                        <p className="text-sm font-bold text-slate-700">Expected: {selectedPO.expectedDeliveryDate}</p>
                        <p className="text-xs text-slate-500">Priority: <span className="font-bold text-red-500">{selectedPO.priority}</span></p>
                      </div>
                    </div>
                    <div className="h-px bg-slate-100" />
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Payment Terms</p>
                        <p className="text-sm font-bold text-slate-700">{selectedPO.terms}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Shipping Address</p>
                    <div className="flex gap-2">
                      <Building className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">{selectedPO.deliveryAddress}</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200/60">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Acknowledgment</p>
                      <Badge variant={getStatusColor(selectedPO.acknowledgmentStatus)} className="font-bold">
                        {selectedPO.acknowledgmentStatus}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <List className="w-4 h-4" />
                      Order Items List
                    </h5>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedPO.lineItems?.length} Positions</span>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50/80 text-[10px] uppercase tracking-[0.1em] font-black text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="p-3 text-left">Description</th>
                          <th className="p-3 text-right">Qty</th>
                          <th className="p-3 text-right">Unit Price</th>
                          <th className="p-3 text-right">Total</th>
                          <th className="p-3 text-center">Delivery Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedPO.lineItems?.map((item: any) => (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-3">
                              <p className="font-bold text-slate-700">{item.item}</p>
                              <p className="text-[10px] text-slate-400">ID: ITEM-{item.id}200</p>
                            </td>
                            <td className="p-3 text-right font-black text-slate-600">{item.quantity}</td>
                            <td className="p-3 text-right font-semibold text-slate-500">{selectedPO.currency} {item.unitPrice?.toLocaleString()}</td>
                            <td className="p-3 text-right font-black text-slate-900">{selectedPO.currency} {item.total?.toLocaleString()}</td>
                            <td className="p-3 text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                {item.deliveryDate}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Communication and Notes section - High Density */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h5 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Collaboration Log
                    </h5>
                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/30 max-h-48 overflow-y-auto space-y-3">
                      {selectedPO.communicationHistory && selectedPO.communicationHistory.length > 0 ? (
                        selectedPO.communicationHistory.map((comm: any) => (
                          <div key={comm.id} className="text-xs bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                            <div className="flex justify-between items-center mb-1.5 font-bold">
                              <span className="text-primary uppercase tracking-tighter text-[9px]">{comm.type}</span>
                              <span className="text-slate-400 tabular-nums">{comm.timestamp}</span>
                            </div>
                            <p className="text-slate-600 leading-relaxed italic">"{comm.message}"</p>
                            <p className="mt-2 text-[9px] text-slate-400 text-right uppercase tracking-widest font-black">— {comm.author}</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-slate-400">
                          <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-10" />
                          <p className="text-xs font-medium">No communication history recorded.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      Delivery Notes & Instructions
                    </h5>
                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/80 h-48 flex flex-col justify-between">
                      <p className="text-xs text-slate-600 leading-relaxed italic font-medium">
                        "{selectedPO.notes || "No special instructions provided by the buyer for this order."}"
                      </p>
                      <div className="flex flex-wrap gap-2 pt-4">
                        {selectedPO.attachments?.map((file: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="bg-white text-[9px] font-bold uppercase tracking-widest border-slate-200 cursor-pointer hover:border-primary transition-colors gap-1.5 h-6">
                            <FileText className="w-3 h-3" />
                            {file}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-3 shrink-0 no-print">
                {selectedPO.acknowledgmentStatus === 'Pending' && (
                  <Button className="flex-1 sm:flex-none sm:min-w-[180px] gap-2 h-11 font-bold shadow-lg shadow-green-500/20 bg-green-600 hover:bg-green-700 transition-all transform active:scale-95 text-white" onClick={() => handleAcknowledgePO(selectedPO.id)}>
                    <CheckCircle className="w-5 h-5" />
                    Acknowledge Order
                  </Button>
                )}
                <Button variant="outline" className="flex-1 sm:flex-none sm:min-w-[160px] gap-2 h-11 font-bold border-slate-200 hover:bg-white transition-all shadow-sm bg-white" onClick={() => handleRequestChange(selectedPO.id)}>
                  <Edit3 className="w-4 h-4 text-blue-500" />
                  Request Change
                </Button>
                <Button variant="outline" className="flex-1 sm:flex-none sm:min-w-[160px] gap-2 h-11 font-bold border-slate-200 hover:bg-white transition-all shadow-sm bg-white" onClick={() => handleSendMessage(selectedPO.id)}>
                  <MessageCircle className="w-4 h-4 text-slate-500" />
                  Message
                </Button>
                <Button variant="outline" className="flex-1 sm:flex-none sm:min-w-[140px] gap-2 h-11 font-bold border-slate-200 hover:bg-white transition-all shadow-sm bg-white ml-auto">
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button variant="ghost" onClick={() => setIsPOModalOpen(false)} className="flex-1 sm:flex-none h-11 font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-200/50">
                  Close Review
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Change Request Modal */}
      <Dialog open={isChangeRequestModalOpen} onOpenChange={setIsChangeRequestModalOpen}>
        <DialogContent className="max-w-xl w-[80vw]">
          <DialogHeader>
            <DialogTitle>Request Change</DialogTitle>
            <DialogDescription>
              Submit a change request for this purchase order
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Change Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select change type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quantity">Quantity Change</SelectItem>
                  <SelectItem value="delivery_date">Delivery Date</SelectItem>
                  <SelectItem value="specifications">Specifications</SelectItem>
                  <SelectItem value="price">Price Adjustment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                placeholder="Describe the requested change and reason..."
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Current Value</Label>
                <Input placeholder="Current value" />
              </div>
              <div className="space-y-2">
                <Label>Proposed Value</Label>
                <Input placeholder="Proposed value" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Financial Impact (if applicable)</Label>
              <Input placeholder="$0.00" type="number" />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsChangeRequestModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsChangeRequestModalOpen(false)}>
                Submit Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Communication Modal */}
      <Dialog open={isCommunicationModalOpen} onOpenChange={setIsCommunicationModalOpen}>
        <DialogContent className="max-w-xl w-[80vw]">
          <DialogHeader>
            <DialogTitle>Send Message</DialogTitle>
            <DialogDescription>
              Communicate with the buyer about this purchase order
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input placeholder="Message subject" />
            </div>
            
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea 
                placeholder="Enter your message..."
                rows={6}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsCommunicationModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsCommunicationModalOpen(false)}>
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}