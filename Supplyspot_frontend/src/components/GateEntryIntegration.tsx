import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Progress } from './ui/progress';
import { Switch } from './ui/switch';
import { 
  Shield, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  QrCode,
  Camera,
  MapPin,
  UserCheck,
  Building,
  Car,
  Truck,
  Phone,
  Mail,
  FileText,
  Settings,
  Eye,
  Download,
  RefreshCw,
  Bell,
  LogIn,
  LogOut,
  Timer,
  ShieldCheck,
  ClipboardList,
  Zap,
  Package,
  ClipboardCheck,
  Scan,
  AlertCircle,
  CheckSquare,
  Clock3,
  Grid,
  List,
  Table as TableIcon,
  BarChart3,
  Weight,
  Receipt,
  FileCheck,
  Route,
  Activity,
  Target,
  TrendingUp,
  Warehouse,
  Monitor,
  Lock,
  Unlock,
  UserX,
  ShieldAlert,
  Video,
  Fingerprint,
  Key,
  Database,
  Wifi,
  WifiOff,
  Home,
  Building2,
  DoorOpen,
  DoorClosed,
  Siren,
  Smartphone,
  Cpu,
  HardDrive,
  Network,
  Server,
  Globe,
  Save,
  RotateCcw,
  AlertOctagon,
  BellRing,
  MessageSquare,
  Volume2,
  VolumeX,
  UserPlus,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Clock4,
  MoreHorizontal,
  Maximize2,
  Minimize2,
  PanelTopOpen,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  TrendingDown,
  Radio,
  Crosshair,
  Navigation,
  ScanLine,
  Thermometer,
  Gauge,
  Radar,
  Satellite,
  Power,
  PowerOff
} from 'lucide-react';
import { format, addDays } from 'date-fns';

interface MaterialItem {
  id: string;
  materialCode: string;
  description: string;
  quantity: number;
  unit: string;
  weight?: number;
  dimensions?: string;
  lotNumber?: string;
  expiryDate?: Date;
  specialHandling?: string[];
}

interface ASNDelivery {
  id: string;
  asnNumber: string;
  poNumber: string;
  vendor: {
    name: string;
    code: string;
    contactPerson: string;
    phone: string;
    email: string;
  };
  driver: {
    name: string;
    license: string;
    phone: string;
    photo?: string;
  };
  vehicle: {
    registrationNumber: string;
    type: 'truck' | 'van' | 'trailer' | 'container';
    capacity: string;
    dimensions?: string;
  };
  materials: MaterialItem[];
  expectedArrival: Date;
  deliveryWindow: {
    start: Date;
    end: Date;
  };
  status: 'notified' | 'in-transit' | 'arrived' | 'gate-verified' | 'unloading' | 'completed' | 'rejected';
  priority: 'standard' | 'urgent' | 'critical';
  specialInstructions?: string;
  gateEntry?: {
    arrivalTime?: Date;
    gateNumber: string;
    securityGuard: string;
    verificationStatus: 'pending' | 'verified' | 'discrepancy' | 'rejected';
    discrepancies?: string[];
    photos?: string[];
    temperatureCheck?: number;
    sealNumbers?: string[];
    weighbridgeReading?: number;
  };
  warehouseAllocation?: {
    dockNumber?: string;
    slotTime?: Date;
    instructions?: string;
  };
  grn?: {
    grnNumber?: string;
    createdAt?: Date;
    receivedQuantities?: { [materialId: string]: number };
    qualityStatus?: 'pending' | 'approved' | 'rejected' | 'hold';
  };
  createdAt: Date;
  updatedAt: Date;
}

interface GatePass {
  id: string;
  passNumber: string;
  vendor: {
    name: string;
    code: string;
    contactPerson: string;
    phone: string;
    email: string;
  };
  visitor: {
    name: string;
    idNumber: string;
    phone: string;
    designation: string;
    vehicleNumber?: string;
    vehicleType?: 'car' | 'truck' | 'van' | 'motorcycle';
  };
  purpose: string;
  department: string;
  approver: string;
  requestedBy: string;
  validFrom: Date;
  validTo: Date;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'expired' | 'cancelled';
  priority: 'normal' | 'urgent' | 'emergency';
  securityLevel: 'basic' | 'standard' | 'restricted' | 'high-security';
  entryGate: string;
  restrictions: string[];
  checkedInAt?: Date;
  checkedOutAt?: Date;
  escortRequired: boolean;
  documentsRequired: string[];
  createdAt: Date;
  qrCode: string;
  notes?: string;
  asnReference?: string;
}

interface SecurityAlert {
  id: string;
  type: 'expired-pass' | 'unauthorized-entry' | 'missing-escort' | 'security-breach' | 'document-missing' | 'system-failure' | 'intrusion-detected' | 'suspicious-activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  gatePassId?: string;
  location: string;
  timestamp: Date;
  status: 'active' | 'investigating' | 'resolved' | 'escalated';
  assignedTo?: string;
  resolution?: string;
  resolvedAt?: Date;
}

interface EntryLog {
  id: string;
  gatePassId: string;
  action: 'check-in' | 'check-out' | 'entry-denied' | 'exit-denied';
  timestamp: Date;
  gate: string;
  guardName: string;
  vehicleNumber?: string;
  accompanyingPersons?: number;
  notes?: string;
  photoCapture?: boolean;
  temperatureCheck?: number;
  healthDeclaration?: boolean;
}

interface GateEntryStats {
  totalActivePasses: number;
  todayEntries: number;
  pendingApprovals: number;
  securityAlerts: number;
  avgProcessingTime: number;
  complianceRate: number;
  asnDeliveries: {
    expected: number;
    arrived: number;
    inProcess: number;
    completed: number;
  };
  materialVerification: {
    totalDeliveries: number;
    verified: number;
    discrepancies: number;
    rejected: number;
  };
  deliveryPerformance: {
    onTimeDeliveries: number;
    totalDeliveries: number;
    avgDelayTime: number;
  };
}

const mockGatePasses: GatePass[] = [
  {
    id: 'GP-001',
    passNumber: 'GP-2024-001234',
    vendor: {
      name: 'Steel Components Inc',
      code: 'SCI-001',
      contactPerson: 'Sarah Johnson',
      phone: '+1-555-0123',
      email: 'sarah.johnson@steelcomponents.com'
    },
    visitor: {
      name: 'Michael Rodriguez',
      idNumber: 'DL-123456789',
      phone: '+1-555-0124',
      designation: 'Site Engineer',
      vehicleNumber: 'ABC-1234',
      vehicleType: 'car'
    },
    purpose: 'Equipment Installation - Manufacturing Line 3',
    department: 'Production',
    approver: 'David Chen',
    requestedBy: 'Sarah Johnson',
    validFrom: new Date('2024-01-22T08:00:00'),
    validTo: new Date('2024-01-22T18:00:00'),
    status: 'active',
    priority: 'normal',
    securityLevel: 'standard',
    entryGate: 'Main Gate A',
    restrictions: ['restricted-area-B', 'no-photography'],
    checkedInAt: new Date('2024-01-22T08:15:00'),
    escortRequired: false,
    documentsRequired: ['government-id', 'safety-certificate'],
    createdAt: new Date('2024-01-21T14:30:00'),
    qrCode: 'QR-GP-001-2024',
    notes: 'Installation expected to complete by 5 PM'
  }
];

const mockASNDeliveries: ASNDelivery[] = [
  {
    id: 'ASN-001',
    asnNumber: 'ASN-2024-001234',
    poNumber: 'PO-2024-5678',
    vendor: {
      name: 'Steel Components Inc',
      code: 'SCI-001',
      contactPerson: 'Sarah Johnson',
      phone: '+1-555-0123',
      email: 'sarah.johnson@steelcomponents.com'
    },
    driver: {
      name: 'Michael Rodriguez',
      license: 'CDL-123456789',
      phone: '+1-555-0124'
    },
    vehicle: {
      registrationNumber: 'TRUCK-001',
      type: 'truck',
      capacity: '20 tons'
    },
    materials: [
      {
        id: 'MAT-001',
        materialCode: 'STL-001',
        description: 'Steel Sheets 10mm',
        quantity: 100,
        unit: 'sheets',
        weight: 5000,
        dimensions: '2000x1000x10mm'
      }
    ],
    expectedArrival: new Date('2024-10-02T10:00:00'),
    deliveryWindow: {
      start: new Date('2024-10-02T09:00:00'),
      end: new Date('2024-10-02T11:00:00')
    },
    status: 'arrived',
    priority: 'standard',
    gateEntry: {
      arrivalTime: new Date('2024-10-02T09:45:00'),
      gateNumber: 'Gate-A1',
      securityGuard: 'John Smith',
      verificationStatus: 'verified',
      weighbridgeReading: 6850,
      sealNumbers: ['SEAL-12345', 'SEAL-67890']
    },
    warehouseAllocation: {
      dockNumber: 'DOCK-03',
      slotTime: new Date('2024-10-02T10:15:00'),
      instructions: 'Use crane for steel sheets'
    },
    createdAt: new Date('2024-10-01T16:30:00'),
    updatedAt: new Date('2024-10-02T09:45:00')
  }
];

const mockStats: GateEntryStats = {
  totalActivePasses: 12,
  todayEntries: 23,
  pendingApprovals: 4,
  securityAlerts: 2,
  avgProcessingTime: 15,
  complianceRate: 94.2,
  asnDeliveries: {
    expected: 8,
    arrived: 3,
    inProcess: 2,
    completed: 12
  },
  materialVerification: {
    totalDeliveries: 25,
    verified: 23,
    discrepancies: 1,
    rejected: 1
  },
  deliveryPerformance: {
    onTimeDeliveries: 22,
    totalDeliveries: 25,
    avgDelayTime: 8.5
  }
};

export const GateEntryIntegration: React.FC = () => {
  const [activeTab, setActiveTab] = useState('asn-deliveries');
  const [selectedPass, setSelectedPass] = useState<GatePass | null>(null);
  const [selectedASN, setSelectedASN] = useState<ASNDelivery | null>(null);
  const [showCreatePass, setShowCreatePass] = useState(false);
  const [showVerifyDelivery, setShowVerifyDelivery] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSecurityDashboard, setShowSecurityDashboard] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [gateViewMode, setGateViewMode] = useState<'card' | 'list' | 'table'>('table');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'expired': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency': return 'bg-red-100 text-red-800 border-red-200';
      case 'urgent': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gate Entry Integration</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowSettings(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" onClick={() => setShowSecurityDashboard(true)}>
            <Shield className="w-4 h-4 mr-2" />
            Security Dashboard
          </Button>
          <Button onClick={() => setShowCreatePass(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Gate Pass
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Expected ASN</p>
                <p className="text-xl font-bold">{mockStats.asnDeliveries.expected}</p>
                <p className="text-xs text-blue-600">Today</p>
              </div>
              <Package className="w-6 h-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Arrived</p>
                <p className="text-xl font-bold">{mockStats.asnDeliveries.arrived}</p>
                <p className="text-xs text-green-600">At gates</p>
              </div>
              <Truck className="w-6 h-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">In Process</p>
                <p className="text-xl font-bold">{mockStats.asnDeliveries.inProcess}</p>
                <p className="text-xs text-orange-600">Unloading</p>
              </div>
              <Activity className="w-6 h-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-xl font-bold">{mockStats.asnDeliveries.completed}</p>
                <p className="text-xs text-green-600">Today</p>
              </div>
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Verification Rate</p>
                <p className="text-xl font-bold">{Math.round((mockStats.materialVerification.verified / mockStats.materialVerification.totalDeliveries) * 100)}%</p>
                <p className="text-xs text-green-600">Material accuracy</p>
              </div>
              <ClipboardCheck className="w-6 h-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">On-Time Rate</p>
                <p className="text-xl font-bold">{Math.round((mockStats.deliveryPerformance.onTimeDeliveries / mockStats.deliveryPerformance.totalDeliveries) * 100)}%</p>
                <p className="text-xs text-green-600">Delivery performance</p>
              </div>
              <Target className="w-6 h-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg Delay</p>
                <p className="text-xl font-bold">{mockStats.deliveryPerformance.avgDelayTime}m</p>
                <p className="text-xs text-orange-600">When delayed</p>
              </div>
              <Clock3 className="w-6 h-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active Passes</p>
                <p className="text-xl font-bold">{mockStats.totalActivePasses}</p>
                <p className="text-xs text-blue-600">Visitor passes</p>
              </div>
              <UserCheck className="w-6 h-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="asn-deliveries">ASN Deliveries</TabsTrigger>
          <TabsTrigger value="gate-passes">Gate Passes</TabsTrigger>
          <TabsTrigger value="verification">Material Verification</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="entry-logs">Entry Logs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* ASN Deliveries Tab */}
        <TabsContent value="asn-deliveries" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search by ASN number, PO, vendor, or material..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="notified">Notified</SelectItem>
                    <SelectItem value="in-transit">In Transit</SelectItem>
                    <SelectItem value="arrived">Arrived</SelectItem>
                    <SelectItem value="gate-verified">Gate Verified</SelectItem>
                    <SelectItem value="unloading">Unloading</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* View Toggle Buttons */}
          <div className="flex items-center border rounded-md w-fit">
            <Button
              variant={gateViewMode === 'card' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setGateViewMode('card')}
              className="rounded-r-none"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={gateViewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setGateViewMode('list')}
              className="rounded-none border-l border-r"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={gateViewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setGateViewMode('table')}
              className="rounded-l-none"
            >
              <TableIcon className="w-4 h-4" />
            </Button>
          </div>

          {/* Card View */}
          {gateViewMode === 'card' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {mockASNDeliveries.map((asn) => (
              <Card key={asn.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{asn.asnNumber}</CardTitle>
                      <p className="text-sm text-muted-foreground">PO: {asn.poNumber}</p>
                      <p className="text-sm text-muted-foreground">{asn.vendor.name}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Badge className={
                        asn.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                        asn.status === 'arrived' || asn.status === 'gate-verified' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                        asn.status === 'in-transit' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                        'bg-gray-100 text-gray-800 border-gray-200'
                      }>
                        {asn.status.replace('-', ' ')}
                      </Badge>
                      <Badge className={getPriorityColor(asn.priority)}>
                        {asn.priority}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Driver:</span>
                      <p className="font-medium">{asn.driver.name}</p>
                      <p className="text-xs text-muted-foreground">{asn.driver.license}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Vehicle:</span>
                      <p className="font-medium">{asn.vehicle.registrationNumber}</p>
                      <p className="text-xs text-muted-foreground">{asn.vehicle.type} • {asn.vehicle.capacity}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Expected Arrival:</span>
                      <p className="font-medium">{format(asn.expectedArrival, 'MMM dd, HH:mm')}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Delivery Window:</span>
                      <p className="font-medium">{format(asn.deliveryWindow.start, 'HH:mm')} - {format(asn.deliveryWindow.end, 'HH:mm')}</p>
                    </div>
                  </div>

                  {asn.gateEntry?.arrivalTime && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Actual Arrival:</span>
                        <p className="font-medium">{format(asn.gateEntry.arrivalTime, 'MMM dd, HH:mm')}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Gate:</span>
                        <p className="font-medium">{asn.gateEntry.gateNumber}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <span className="text-sm text-muted-foreground">Materials ({asn.materials.length} items):</span>
                    <div className="space-y-1">
                      {asn.materials.slice(0, 2).map((material) => (
                        <div key={material.id} className="flex justify-between items-center text-xs p-2 bg-muted rounded">
                          <span className="font-medium">{material.description}</span>
                          <span className="text-muted-foreground">{material.quantity} {material.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {asn.gateEntry?.verificationStatus === 'verified' && (
                        <Badge variant="outline" className="text-green-600 bg-green-50">
                          <CheckSquare className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      {asn.warehouseAllocation?.dockNumber && (
                        <Badge variant="outline" className="text-blue-600 bg-blue-50">
                          <Warehouse className="w-3 h-3 mr-1" />
                          {asn.warehouseAllocation.dockNumber}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {asn.status === 'arrived' && (
                        <Button size="sm" variant="outline" onClick={() => setShowVerifyDelivery(true)}>
                          <Scan className="w-4 h-4 mr-2" />
                          Verify
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => setSelectedASN(asn)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          )}

          {/* List View */}
          {gateViewMode === 'list' && (
            <div className="space-y-3">
              {mockASNDeliveries.map((asn) => (
                <Card key={asn.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-semibold">{asn.asnNumber}</p>
                        <Badge className={
                          asn.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                          asn.status === 'arrived' || asn.status === 'gate-verified' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                          asn.status === 'in-transit' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                          'bg-gray-100 text-gray-800 border-gray-200'
                        }>
                          {asn.status.replace('-', ' ')}
                        </Badge>
                        <Badge className={getPriorityColor(asn.priority)}>
                          {asn.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>PO: {asn.poNumber}</span>
                        <span>{asn.vendor.name}</span>
                        <span>ETA: {asn.expectedArrival.toLocaleDateString()}</span>
                        <span>{asn.materials.length} items</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setSelectedASN(asn)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm">Verify</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Table View */}
          {gateViewMode === 'table' && (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">ASN Details</th>
                      <th className="text-left p-4 font-medium">PO Number</th>
                      <th className="text-left p-4 font-medium">Vendor</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Priority</th>
                      <th className="text-left p-4 font-medium">ETA</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockASNDeliveries.map((asn) => (
                      <tr key={asn.id} className="border-b hover:bg-muted/50 cursor-pointer">
                        <td className="p-4">
                          <p className="font-medium">{asn.asnNumber}</p>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">{asn.poNumber}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">{asn.vendor.name}</span>
                        </td>
                        <td className="p-4">
                          <Badge className={
                            asn.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                            asn.status === 'arrived' || asn.status === 'gate-verified' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            asn.status === 'in-transit' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                            'bg-gray-100 text-gray-800 border-gray-200'
                          }>
                            {asn.status.replace('-', ' ')}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge className={getPriorityColor(asn.priority)}>
                            {asn.priority}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">{asn.expectedArrival.toLocaleDateString()}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" onClick={() => setSelectedASN(asn)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm">Verify</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Gate Passes Tab */}
        <TabsContent value="gate-passes" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search by pass number, vendor, or visitor..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {mockGatePasses.map((pass) => (
              <Card key={pass.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{pass.passNumber}</CardTitle>
                      <p className="text-sm text-muted-foreground">{pass.vendor.name}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Badge className={getStatusColor(pass.status)}>
                        {pass.status}
                      </Badge>
                      <Badge className={getPriorityColor(pass.priority)}>
                        {pass.priority}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Visitor:</span>
                      <p className="font-medium">{pass.visitor.name}</p>
                      <p className="text-xs text-muted-foreground">{pass.visitor.designation}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Purpose:</span>
                      <p className="font-medium truncate">{pass.purpose}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Valid Period:</span>
                      <p className="font-medium">
                        {format(pass.validFrom, 'MMM dd, HH:mm')} - {format(pass.validTo, 'HH:mm')}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Entry Gate:</span>
                      <p className="font-medium">{pass.entryGate}</p>
                    </div>
                  </div>

                  {pass.visitor.vehicleNumber && (
                    <div className="flex items-center gap-2 text-sm">
                      <Car className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Vehicle:</span>
                      <span className="font-medium">{pass.visitor.vehicleNumber}</span>
                      <Badge variant="outline" className="text-xs">
                        {pass.visitor.vehicleType}
                      </Badge>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t">
                    <div className="flex items-center gap-2">
                      {pass.status === 'active' && (
                        <>
                          <Button size="sm" variant="outline">
                            <QrCode className="w-4 h-4 mr-2" />
                            QR Code
                          </Button>
                          <Button size="sm" variant="outline">
                            <LogOut className="w-4 h-4 mr-2" />
                            Check Out
                          </Button>
                        </>
                      )}
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setSelectedPass(pass)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Other tabs would continue here... */}
        <TabsContent value="verification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Material Verification</CardTitle>
              <p className="text-muted-foreground">Verify incoming materials against ASN documentation</p>
            </CardHeader>
            <CardContent>
              <p>Material verification interface would be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Monitoring</CardTitle>
              <p className="text-muted-foreground">Real-time security alerts and monitoring</p>
            </CardHeader>
            <CardContent>
              <p>Security monitoring interface would be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entry-logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Entry & Exit Logs</CardTitle>
              <p className="text-muted-foreground">Complete audit trail of all gate activities</p>
            </CardHeader>
            <CardContent>
              <p>Entry logs interface would be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gate Usage Analytics</CardTitle>
              <p className="text-muted-foreground">Performance metrics and analytics</p>
            </CardHeader>
            <CardContent>
              <p>Analytics dashboard would be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};