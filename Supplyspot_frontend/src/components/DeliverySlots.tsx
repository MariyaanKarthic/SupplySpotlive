import React, { useState } from 'react';
import {
  Truck,
  Calendar,
  Clock,
  MapPin,
  Package,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  Settings,
  Filter,
  Search,
  Plus,
  Edit,
  Eye,
  Trash2,
  Download,
  Upload,
  Zap,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Users,
  Building2,
  Navigation,
  Timer,
  Activity,
  DollarSign,
  Target,
  Award,
  AlertCircle,
  Info,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Star,
  Gauge,
  Route
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
import { Calendar as CalendarComponent } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Slider } from './ui/slider';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { format, addDays, startOfWeek, endOfWeek, isToday, isSameDay, parseISO } from 'date-fns';

interface DeliverySlot {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  capacity: number;
  availableCapacity: number;
  location: DeliveryLocation;
  slotType: 'standard' | 'express' | 'bulk' | 'fragile' | 'temperature-controlled';
  status: 'available' | 'partially-booked' | 'fully-booked' | 'blocked' | 'maintenance';
  priority: 'high' | 'medium' | 'low';
  cost: number;
  currency: string;
  automationRules: AutomationRule[];
  bookings: SlotBooking[];
  restrictions: DeliveryRestriction[];
}

interface DeliveryLocation {
  id: string;
  name: string;
  address: string;
  type: 'warehouse' | 'factory' | 'distribution-center' | 'store';
  coordinates: { lat: number; lng: number };
  capacity: number;
  operatingHours: {
    start: string;
    end: string;
    days: string[];
  };
  facilities: string[];
}

interface SlotBooking {
  id: string;
  slotId: string;
  supplierId: string;
  supplierName: string;
  poNumber?: string;
  expectedVolume: number;
  actualVolume?: number;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  status: 'confirmed' | 'pending' | 'in-transit' | 'delivered' | 'delayed' | 'cancelled';
  bookedAt: Date;
  estimatedArrival?: Date;
  actualArrival?: Date;
  deliveryInstructions?: string;
  contactPerson: string;
  contactPhone: string;
  vehicleInfo?: {
    type: string;
    plateNumber: string;
    driverName: string;
  };
}

interface AutomationRule {
  id: string;
  name: string;
  condition: string;
  action: 'auto-assign' | 'send-notification' | 'adjust-capacity' | 'block-slot' | 'prioritize';
  priority: number;
  isActive: boolean;
  parameters: Record<string, any>;
}

interface DeliveryRestriction {
  id: string;
  type: 'vehicle-size' | 'material-type' | 'supplier-category' | 'weight-limit' | 'special-handling';
  description: string;
  value: string | number;
  isActive: boolean;
}

interface ProductionSchedule {
  id: string;
  productionLine: string;
  material: string;
  requiredDelivery: Date;
  quantity: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  linkedSlots: string[];
}

const mockDeliveryLocations: DeliveryLocation[] = [
  {
    id: 'LOC-001',
    name: 'Main Warehouse A',
    address: '1234 Industrial Blvd, Manufacturing District',
    type: 'warehouse',
    coordinates: { lat: 40.7128, lng: -74.0060 },
    capacity: 50,
    operatingHours: {
      start: '06:00',
      end: '22:00',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    facilities: ['Loading Dock', 'Crane', 'Forklift', 'Temperature Control', 'Security']
  },
  {
    id: 'LOC-002',
    name: 'Factory B - Raw Materials',
    address: '5678 Production Ave, Manufacturing Hub',
    type: 'factory',
    coordinates: { lat: 40.7589, lng: -73.9851 },
    capacity: 30,
    operatingHours: {
      start: '05:00',
      end: '20:00',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    facilities: ['Heavy Lift', 'Quality Control Station', 'Hazmat Handling']
  }
];

const mockDeliverySlots: DeliverySlot[] = [
  {
    id: 'SLOT-001',
    date: new Date(),
    startTime: '08:00',
    endTime: '10:00',
    duration: 120,
    capacity: 10,
    availableCapacity: 3,
    location: mockDeliveryLocations[0],
    slotType: 'standard',
    status: 'partially-booked',
    priority: 'high',
    cost: 150,
    currency: 'USD',
    automationRules: [],
    bookings: [
      {
        id: 'BOOK-001',
        slotId: 'SLOT-001',
        supplierId: 'SUP-001',
        supplierName: 'Steel Components Inc',
        poNumber: 'PO-2024-001',
        expectedVolume: 7,
        priority: 'high',
        status: 'confirmed',
        bookedAt: new Date('2024-01-20T10:30:00'),
        estimatedArrival: new Date('2024-01-22T08:30:00'),
        contactPerson: 'John Smith',
        contactPhone: '+1-555-0123',
        deliveryInstructions: 'Use loading dock 3. Require crane assistance.',
        vehicleInfo: {
          type: 'Semi-truck',
          plateNumber: 'ABC-123',
          driverName: 'Mike Johnson'
        }
      }
    ],
    restrictions: [
      {
        id: 'REST-001',
        type: 'weight-limit',
        description: 'Maximum weight per delivery',
        value: 5000,
        isActive: true
      }
    ]
  },
  {
    id: 'SLOT-002',
    date: addDays(new Date(), 1),
    startTime: '14:00',
    endTime: '16:00',
    duration: 120,
    capacity: 15,
    availableCapacity: 15,
    location: mockDeliveryLocations[1],
    slotType: 'bulk',
    status: 'available',
    priority: 'medium',
    cost: 200,
    currency: 'USD',
    automationRules: [],
    bookings: [],
    restrictions: []
  },
  {
    id: 'SLOT-003',
    date: addDays(new Date(), 2),
    startTime: '06:00',
    endTime: '08:00',
    duration: 120,
    capacity: 8,
    availableCapacity: 0,
    location: mockDeliveryLocations[0],
    slotType: 'express',
    status: 'fully-booked',
    priority: 'high',
    cost: 300,
    currency: 'USD',
    automationRules: [],
    bookings: [],
    restrictions: []
  }
];

const mockProductionSchedule: ProductionSchedule[] = [
  {
    id: 'PROD-001',
    productionLine: 'Assembly Line A',
    material: 'Steel Components',
    requiredDelivery: new Date(),
    quantity: 500,
    priority: 'critical',
    linkedSlots: ['SLOT-001']
  },
  {
    id: 'PROD-002',
    productionLine: 'Assembly Line B',
    material: 'Electronic Parts',
    requiredDelivery: addDays(new Date(), 1),
    quantity: 200,
    priority: 'high',
    linkedSlots: ['SLOT-002']
  }
];

export function DeliverySlots() {
  const [activeTab, setActiveTab] = useState('slots');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedSlotType, setSelectedSlotType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateSlot, setShowCreateSlot] = useState(false);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<DeliverySlot | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
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
      setSelectedRows(new Set(filteredSlots.map((s) => s.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-600 bg-green-50 border-green-200';
      case 'partially-booked': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'fully-booked': return 'text-red-600 bg-red-50 border-red-200';
      case 'blocked': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'maintenance': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSlotTypeColor = (type: string) => {
    switch (type) {
      case 'standard': return 'text-blue-600 bg-blue-50';
      case 'express': return 'text-purple-600 bg-purple-50';
      case 'bulk': return 'text-green-600 bg-green-50';
      case 'fragile': return 'text-orange-600 bg-orange-50';
      case 'temperature-controlled': return 'text-cyan-600 bg-cyan-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'normal': return 'text-blue-600 bg-blue-50';
      case 'low': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'in-transit': return 'text-blue-600 bg-blue-50';
      case 'delivered': return 'text-green-600 bg-green-50';
      case 'delayed': return 'text-orange-600 bg-orange-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredSlots = mockDeliverySlots.filter(slot => {
    const matchesLocation = selectedLocation === 'all' || slot.location.id === selectedLocation;
    const matchesType = selectedSlotType === 'all' || slot.slotType === selectedSlotType;
    const matchesSearch = slot.location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         slot.slotType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLocation && matchesType && matchesSearch;
  });

  const utilizationRate = mockDeliverySlots.reduce((total, slot) => {
    return total + ((slot.capacity - slot.availableCapacity) / slot.capacity);
  }, 0) / mockDeliverySlots.length * 100;

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour < 22; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  const getWeekDays = (date: Date) => {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(start, i));
    }
    return days;
  };

  const weekDays = getWeekDays(selectedDate);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Truck className="w-8 h-8 text-primary" />
            Automated Smart Delivery Slots
          </h1>
          <p className="text-muted-foreground mt-2">
            Intelligent delivery scheduling aligned with production requirements for optimized logistics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Auto-Optimize
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Schedule
          </Button>
          <Dialog open={showCreateSlot} onOpenChange={setShowCreateSlot}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Slot
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Create New Delivery Slot</DialogTitle>
                <DialogDescription>
                  Configure a new automated delivery slot with intelligent scheduling
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Location</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockDeliveryLocations.map(location => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Slot Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="express">Express</SelectItem>
                        <SelectItem value="bulk">Bulk</SelectItem>
                        <SelectItem value="fragile">Fragile</SelectItem>
                        <SelectItem value="temperature-controlled">Temperature Controlled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Start Time</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Start time" />
                      </SelectTrigger>
                      <SelectContent>
                        {generateTimeSlots().map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>End Time</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="End time" />
                      </SelectTrigger>
                      <SelectContent>
                        {generateTimeSlots().map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Capacity</Label>
                    <Input type="number" placeholder="Max deliveries" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Priority</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Cost (USD)</Label>
                    <Input type="number" placeholder="Slot cost" />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch />
                  <Label>Enable automated optimization</Label>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateSlot(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setShowCreateSlot(false)}>
                    Create Slot
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
                <p className="text-sm text-muted-foreground">Today's Slots</p>
                <p className="text-2xl font-bold">42</p>
                <p className="text-xs text-green-600">24 confirmed</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Utilization Rate</p>
                <p className="text-2xl font-bold">{utilizationRate.toFixed(1)}%</p>
                <p className="text-xs text-green-600">+8% vs last week</p>
              </div>
              <Gauge className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">On-Time Deliveries</p>
                <p className="text-2xl font-bold">94%</p>
                <p className="text-xs text-green-600">Above target</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cost Savings</p>
                <p className="text-2xl font-bold">$12.8K</p>
                <p className="text-xs text-green-600">This month</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Banner */}
      <Alert className="border-blue-200 bg-blue-50">
        <Zap className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">AI Optimization Insight</AlertTitle>
        <AlertDescription className="text-blue-700">
          Shifting 3 deliveries from peak hours (10-12 AM) to off-peak slots could reduce costs by $850 and improve efficiency by 12%.
          <Button variant="link" className="p-0 ml-2 text-blue-700">
            Apply Suggestions
          </Button>
        </AlertDescription>
      </Alert>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="slots">Delivery Slots</TabsTrigger>
          <TabsTrigger value="schedule">Production Sync</TabsTrigger>
          <TabsTrigger value="bookings">Active Bookings</TabsTrigger>
          <TabsTrigger value="optimization">Smart Optimization</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Delivery Slots Tab */}
        <TabsContent value="slots" className="space-y-6">
          {/* Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex gap-2">
                  <Button 
                    variant={viewMode === 'calendar' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setViewMode('calendar')}
                  >
                    <Calendar className="w-4 h-4 mr-1" />
                    Calendar
                  </Button>
                  <Button 
                    variant={viewMode === 'list' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <BarChart3 className="w-4 h-4 mr-1" />
                    List
                  </Button>
                </div>
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search slots by location or type..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {mockDeliveryLocations.map(location => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedSlotType} onValueChange={setSelectedSlotType}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="express">Express</SelectItem>
                    <SelectItem value="bulk">Bulk</SelectItem>
                    <SelectItem value="fragile">Fragile</SelectItem>
                    <SelectItem value="temperature-controlled">Temperature Controlled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {viewMode === 'calendar' ? (
            /* Calendar View */
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Weekly Delivery Schedule</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, -7))}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-medium">
                      {format(selectedDate, 'MMM dd')} - {format(addDays(selectedDate, 6), 'MMM dd, yyyy')}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, 7))}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-8 gap-1">
                  {/* Header */}
                  <div className="p-2 text-center text-sm font-medium text-muted-foreground">Time</div>
                  {weekDays.map(day => (
                    <div key={day.toISOString()} className="p-2 text-center">
                      <div className="text-sm font-medium">{format(day, 'EEE')}</div>
                      <div className={`text-lg ${isToday(day) ? 'font-bold text-primary' : ''}`}>
                        {format(day, 'd')}
                      </div>
                    </div>
                  ))}
                  
                  {/* Time slots */}
                  {generateTimeSlots().filter((_, index) => index % 2 === 0).map(time => (
                    <React.Fragment key={time}>
                      <div className="p-2 text-xs text-muted-foreground text-right">{time}</div>
                      {weekDays.map(day => {
                        const daySlots = filteredSlots.filter(slot => 
                          isSameDay(slot.date, day) && slot.startTime === time
                        );
                        return (
                          <div key={`${day.toISOString()}-${time}`} className="p-1 min-h-16 border border-border/50">
                            {daySlots.map(slot => (
                              <div 
                                key={slot.id}
                                className={`mb-1 p-1 rounded text-xs cursor-pointer hover:shadow-sm ${getStatusColor(slot.status)}`}
                                onClick={() => setSelectedSlot(slot)}
                              >
                                <div className="font-medium truncate">{slot.location.name}</div>
                                <div className="flex items-center justify-between">
                                  <Badge variant="outline" className={`text-xs ${getSlotTypeColor(slot.slotType)}`}>
                                    {slot.slotType}
                                  </Badge>
                                  <span>{slot.availableCapacity}/{slot.capacity}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            /* List View */
            <Card>
              <CardHeader>
                <CardTitle>Delivery Slots List</CardTitle>
                <CardDescription>Comprehensive view of all delivery slots</CardDescription>
              </CardHeader>
              <CardContent>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={filteredSlots.map((s) => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <Table>
                      <TableHeader>
                        <DraggableTableHeader
                          showDragHandle={true}
                          allSelected={selectedRows.size === filteredSlots.length && filteredSlots.length > 0}
                          onSelectAll={handleSelectAll}
                        >
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Capacity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Cost</TableHead>
                          <TableHead>Actions</TableHead>
                        </DraggableTableHeader>
                      </TableHeader>
                      <TableBody>
                        {filteredSlots.map((slot) => (
                          <DraggableTableRow
                            key={slot.id}
                            id={slot.id}
                            isSelected={selectedRows.has(slot.id)}
                            onSelect={() => handleSelectRow(slot.id)}
                          >
                            <TableCell>
                              <div>
                                <p className="font-medium">{format(slot.date, 'MMM dd, yyyy')}</p>
                                <p className="text-sm text-muted-foreground">
                                  {slot.startTime} - {slot.endTime}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{slot.location.name}</p>
                                <p className="text-sm text-muted-foreground capitalize">
                                  {slot.location.type}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getSlotTypeColor(slot.slotType)}>
                                {slot.slotType}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-primary h-2 rounded-full" 
                                    style={{ 
                                      width: `${((slot.capacity - slot.availableCapacity) / slot.capacity) * 100}%` 
                                    }}
                                  ></div>
                                </div>
                                <span className="text-sm">
                                  {slot.capacity - slot.availableCapacity}/{slot.capacity}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(slot.status)}>
                                {slot.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getPriorityColor(slot.priority)}>
                                {slot.priority}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">
                                ${slot.cost} {slot.currency}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => setSelectedSlot(slot)}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </DialogTrigger>
                              <DialogContent className="max-w-4xl">
                                <DialogHeader>
                                  <DialogTitle>Delivery Slot Details</DialogTitle>
                                  <DialogDescription>
                                    {selectedSlot?.location.name} - {selectedSlot && format(selectedSlot.date, 'PPp')}
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedSlot && (
                                  <div className="space-y-6">
                                    <div className="grid grid-cols-3 gap-4">
                                      <div>
                                        <Label>Status</Label>
                                        <Badge className={getStatusColor(selectedSlot.status)}>
                                          {selectedSlot.status}
                                        </Badge>
                                      </div>
                                      <div>
                                        <Label>Type</Label>
                                        <Badge className={getSlotTypeColor(selectedSlot.slotType)}>
                                          {selectedSlot.slotType}
                                        </Badge>
                                      </div>
                                      <div>
                                        <Label>Priority</Label>
                                        <Badge className={getPriorityColor(selectedSlot.priority)}>
                                          {selectedSlot.priority}
                                        </Badge>
                                      </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label>Time Slot</Label>
                                        <p>{selectedSlot.startTime} - {selectedSlot.endTime}</p>
                                        <p className="text-sm text-muted-foreground">
                                          Duration: {selectedSlot.duration} minutes
                                        </p>
                                      </div>
                                      <div>
                                        <Label>Capacity</Label>
                                        <p>{selectedSlot.capacity - selectedSlot.availableCapacity} / {selectedSlot.capacity} booked</p>
                                        <Progress 
                                          value={((selectedSlot.capacity - selectedSlot.availableCapacity) / selectedSlot.capacity) * 100} 
                                          className="mt-1"
                                        />
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <Label>Location Details</Label>
                                      <div className="p-3 bg-muted rounded-lg">
                                        <p className="font-medium">{selectedSlot.location.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                          {selectedSlot.location.address}
                                        </p>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                          {selectedSlot.location.facilities.map((facility, index) => (
                                            <Badge key={index} variant="outline" className="text-xs">
                                              {facility}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {selectedSlot.bookings.length > 0 && (
                                      <div>
                                        <Label>Current Bookings ({selectedSlot.bookings.length})</Label>
                                        <div className="space-y-2 mt-2">
                                          {selectedSlot.bookings.map((booking) => (
                                            <div key={booking.id} className="p-3 border rounded-lg">
                                              <div className="flex items-center justify-between mb-2">
                                                <p className="font-medium">{booking.supplierName}</p>
                                                <Badge className={getBookingStatusColor(booking.status)}>
                                                  {booking.status}
                                                </Badge>
                                              </div>
                                              <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                  <span className="text-muted-foreground">PO:</span>
                                                  <p>{booking.poNumber || 'N/A'}</p>
                                                </div>
                                                <div>
                                                  <span className="text-muted-foreground">Volume:</span>
                                                  <p>{booking.expectedVolume} units</p>
                                                </div>
                                                <div>
                                                  <span className="text-muted-foreground">Contact:</span>
                                                  <p>{booking.contactPerson}</p>
                                                </div>
                                                <div>
                                                  <span className="text-muted-foreground">Priority:</span>
                                                  <Badge variant="outline" className={getPriorityColor(booking.priority)}>
                                                    {booking.priority}
                                                  </Badge>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </DraggableTableRow>
                    ))}
                  </TableBody>
                </Table>
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>
      )}
    </TabsContent>

    {/* Production Sync Tab */}
    <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Production Schedule Integration</CardTitle>
              <CardDescription>
                Automated synchronization between production schedules and delivery slots
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockProductionSchedule.map((schedule) => (
                  <Card key={schedule.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{schedule.productionLine}</h4>
                          <p className="text-sm text-muted-foreground">{schedule.material}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(schedule.priority)}>
                            {schedule.priority}
                          </Badge>
                          <Badge variant="outline" className="text-green-600 bg-green-50">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Linked
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Required Delivery:</span>
                          <p className="font-medium">{format(schedule.requiredDelivery, 'PPp')}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Quantity:</span>
                          <p className="font-medium">{schedule.quantity} units</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Linked Slots:</span>
                          <p className="font-medium">{schedule.linkedSlots.length} slot(s)</p>
                        </div>
                      </div>
                      
                      <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                        <div className="flex items-center gap-2 text-sm text-green-800">
                          <Zap className="w-4 h-4" />
                          <span>Auto-optimized: Delivery slot automatically adjusted based on production schedule changes</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Bookings Tab */}
        <TabsContent value="bookings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Delivery Bookings</CardTitle>
              <CardDescription>
                Real-time tracking of confirmed and in-transit deliveries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Slot Details</TableHead>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>ETA</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockDeliverySlots
                    .flatMap(slot => slot.bookings.map(booking => ({...booking, slot})))
                    .map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{booking.supplierName}</p>
                          <Badge variant="outline" className={getPriorityColor(booking.priority)}>
                            {booking.priority}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{booking.slot.location.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(booking.slot.date, 'MMM dd')} • {booking.slot.startTime}-{booking.slot.endTime}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{booking.poNumber || 'N/A'}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{booking.expectedVolume} units</p>
                          {booking.actualVolume && (
                            <p className="text-sm text-muted-foreground">
                              Actual: {booking.actualVolume} units
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getBookingStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {booking.estimatedArrival ? (
                          <div>
                            <p className="font-medium">
                              {format(booking.estimatedArrival, 'MMM dd, HH:mm')}
                            </p>
                            {booking.actualArrival && (
                              <p className="text-sm text-green-600">
                                Delivered: {format(booking.actualArrival, 'HH:mm')}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">TBD</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{booking.contactPerson}</p>
                          <p className="text-sm text-muted-foreground">{booking.contactPhone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
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

        {/* Smart Optimization Tab */}
        <TabsContent value="optimization" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Optimization Engine</CardTitle>
                <CardDescription>Intelligent recommendations for delivery efficiency</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">Route Optimization</span>
                      <Badge variant="outline" className="text-green-600 bg-green-50">
                        $1,200 savings
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Consolidate 5 deliveries into 3 optimized routes to save fuel costs and reduce delivery windows.
                    </p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Apply Optimization
                    </Button>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-orange-500" />
                      <span className="font-medium">Peak Time Rebalancing</span>
                      <Badge variant="outline" className="text-blue-600 bg-blue-50">
                        12% efficiency gain
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Move 7 non-urgent deliveries from peak hours (10-12 AM) to off-peak slots for better utilization.
                    </p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Implement Changes
                    </Button>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-purple-500" />
                      <span className="font-medium">Capacity Optimization</span>
                      <Badge variant="outline" className="text-purple-600 bg-purple-50">
                        +18 slots available
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Dynamic capacity adjustment based on historical patterns can free up 18 additional slots this week.
                    </p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Enable Auto-Adjust
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Automation Rules</CardTitle>
                <CardDescription>Configure intelligent automation policies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Auto-assign critical deliveries</p>
                      <p className="text-sm text-muted-foreground">
                        Automatically prioritize and assign slots for critical production materials
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Dynamic pricing optimization</p>
                      <p className="text-sm text-muted-foreground">
                        Adjust slot pricing based on demand and availability
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Weather-based rescheduling</p>
                      <p className="text-sm text-muted-foreground">
                        Automatically reschedule deliveries based on weather conditions
                      </p>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Supplier performance alerts</p>
                      <p className="text-sm text-muted-foreground">
                        Send notifications for late or problematic deliveries
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>On-Time Delivery Rate</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '94%' }}></div>
                      </div>
                      <span className="font-medium">94%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Slot Utilization</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '87%' }}></div>
                      </div>
                      <span className="font-medium">87%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Cost Efficiency</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: '91%' }}></div>
                      </div>
                      <span className="font-medium">$2.1K saved</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Supplier Satisfaction</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '89%' }}></div>
                      </div>
                      <span className="font-medium">4.5/5</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span>Deliveries Completed</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">847</p>
                      <p className="text-xs text-green-600">+12% vs last week</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-500" />
                      <span>Average Turnaround</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">28 min</p>
                      <p className="text-xs text-blue-600">-5% vs last week</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-purple-500" />
                      <span>Cost per Delivery</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">$47</p>
                      <p className="text-xs text-purple-600">-8% vs last week</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Location Performance Analysis</CardTitle>
              <CardDescription>
                Comparative analysis across delivery locations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location</TableHead>
                    <TableHead>Total Slots</TableHead>
                    <TableHead>Utilization</TableHead>
                    <TableHead>On-Time Rate</TableHead>
                    <TableHead>Avg Turnaround</TableHead>
                    <TableHead>Cost Efficiency</TableHead>
                    <TableHead>Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockDeliveryLocations.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{location.name}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {location.type}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">156</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full" style={{ width: '89%' }}></div>
                          </div>
                          <span>89%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-green-600 font-medium">95%</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">24 min</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-blue-600 font-medium">$42/delivery</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="font-medium">4.8</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}