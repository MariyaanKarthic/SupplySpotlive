import React, { useState } from 'react';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
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
  Route,
  QrCode,
  Printer,
  PhoneCall,
  ShieldCheck,
  Container,
  FileText,
  Check,
  ChevronUp,
  UserCheck,
  Radio,
  ClipboardList,
  Layers,
  Sparkles,
  CircleDot,
  X,
  Camera,
  PenTool,
  FileCheck,
  Image as ImageIcon,
  ShieldAlert,
  CheckSquare,
  UploadCloud,
  Map as MapIcon,
  Compass,
  Fuel,
  Flame,
  Maximize2,
  ArrowUpRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DraggableTableRow, DraggableTableHeader } from '@/components/ui/draggable-table-row';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format, addDays, startOfWeek, isToday, isSameDay } from 'date-fns';
import { toast } from 'sonner';

interface CargoItem {
  id: string;
  sku: string;
  description: string;
  quantity: number;
  unit: string;
  weightKg: number;
  handlingTag?: string;
}

interface ProofOfDelivery {
  id: string;
  capturedAt: Date;
  signedBy: string;
  recipientTitle: string;
  signatureDataUrl?: string;
  photoUrls: string[];
  receiverNotes?: string;
  deliveryStatus: 'verified' | 'accepted_with_exceptions' | 'rejected';
  inspectionPassed: boolean;
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
  dockNumber?: string;
  gateNumber?: string;
  cargoItems?: CargoItem[];
  proofOfDelivery?: ProofOfDelivery;
  vehicleInfo?: {
    type: string;
    plateNumber: string;
    driverName: string;
    driverPhone?: string;
    gpsStatus?: string;
    distanceRemaining?: string;
  };
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

interface DeliveryRoute {
  id: string;
  title: string;
  origin: string;
  destination: string;
  waypoints: string[];
  totalDistanceMiles: number;
  estDurationMins: number;
  fuelCostUsd: number;
  co2SavedKg: number;
  bottleneckRisk: 'low' | 'medium' | 'high';
  trafficStatus: 'Clear Highway' | 'Moderate Congestion' | 'High Bottleneck Ahead';
  recommendedAction: string;
  assignedBookings: string[];
}

const mockDeliveryRoutes: DeliveryRoute[] = [
  {
    id: 'ROUTE-NORTH-EXPRESS',
    title: 'North Corridor Eco-Fast Track',
    origin: 'Steel Components Hub (I-95 North)',
    destination: 'Main Warehouse A - Dock 03',
    waypoints: ['I-95 Gate 1 Bypass', 'Freight Expressway Exit 12', 'Dock 03 Holding Yard'],
    totalDistanceMiles: 34.2,
    estDurationMins: 38,
    fuelCostUsd: 48.50,
    co2SavedKg: 18.4,
    bottleneckRisk: 'low',
    trafficStatus: 'Clear Highway',
    recommendedAction: 'Primary recommended route. Bypasses downtown construction choke point.',
    assignedBookings: ['BOOK-001', 'BOOK-002']
  },
  {
    id: 'ROUTE-SOUTH-METRO',
    title: 'Metro Industrial Express Loop',
    origin: 'Global Electronics Hub',
    destination: 'Factory B - Cleanroom Gate 3',
    waypoints: ['Industrial Beltway', 'Cleanroom Gate 3 Security Check'],
    totalDistanceMiles: 18.5,
    estDurationMins: 24,
    fuelCostUsd: 26.10,
    co2SavedKg: 12.0,
    bottleneckRisk: 'low',
    trafficStatus: 'Clear Highway',
    recommendedAction: 'Optimal short-haul route with dedicated green corridor signal clearance.',
    assignedBookings: ['BOOK-003', 'BOOK-006']
  },
  {
    id: 'ROUTE-WEST-BYPASS',
    title: 'West Freight Bypass (Hazardous & Heavy)',
    origin: 'EcoPolymer Chemical Terminal',
    destination: 'Factory B - Dock 05',
    waypoints: ['State Route 44 Bypass', 'Hazmat Checkpoint B', 'Dock 05 Unloading Bay'],
    totalDistanceMiles: 42.8,
    estDurationMins: 55,
    fuelCostUsd: 64.20,
    co2SavedKg: 24.5,
    bottleneckRisk: 'medium',
    trafficStatus: 'Moderate Congestion',
    recommendedAction: 'Rerouted to avoid I-90 bridge restriction. Saves 15 mins vs standard route.',
    assignedBookings: ['BOOK-004', 'BOOK-005']
  }
];

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

interface ProductionSchedule {
  id: string;
  productionLine: string;
  material: string;
  requiredDelivery: Date;
  quantity: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  linkedSlots: string[];
}

// Mock Delivery Locations
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
    facilities: ['Loading Dock 1-6', 'Heavy Crane', 'Forklift Bay', 'Temperature Control', '24/7 Security Gate']
  },
  {
    id: 'LOC-002',
    name: 'Factory B - Raw Materials',
    address: '5678 Production Ave, Manufacturing Hub',
    type: 'factory',
    coordinates: { lat: 40.7589, lng: -73.9851 },
    capacity: 35,
    operatingHours: {
      start: '05:00',
      end: '20:00',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    facilities: ['Heavy Lift Crane', 'Quality Control Inspection Station', 'Hazmat Storage', 'Cleanroom Entrance']
  },
  {
    id: 'LOC-003',
    name: 'Distribution Center North',
    address: '910 Logistics Pkwy, Freight Terminal',
    type: 'distribution-center',
    coordinates: { lat: 40.7306, lng: -73.9352 },
    capacity: 60,
    operatingHours: {
      start: '06:00',
      end: '23:00',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    facilities: ['Automated Sorting Conveyors', 'High Bay Docks', 'Cross-Docking Platform']
  },
  {
    id: 'LOC-004',
    name: 'Plant C Assembly Hub',
    address: '432 Enterprise Way, Tech Sector',
    type: 'factory',
    coordinates: { lat: 40.7112, lng: -74.0125 },
    capacity: 25,
    operatingHours: {
      start: '07:00',
      end: '19:00',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    facilities: ['Precision Assembly Docks', 'ESD Protected Bay', 'Rapid Buffer Zone']
  }
];

// 10 Complete Active Delivery Bookings
const mockInitialBookings: SlotBooking[] = [
  {
    id: 'BOOK-001',
    slotId: 'SLOT-001',
    supplierId: 'SUP-001',
    supplierName: 'Steel Components Inc',
    poNumber: 'PO-2026-0801',
    expectedVolume: 750,
    actualVolume: 750,
    priority: 'urgent',
    status: 'in-transit',
    bookedAt: new Date(Date.now() - 3600 * 1000 * 24 * 3),
    estimatedArrival: new Date(Date.now() + 1000 * 60 * 18), // 18 mins from now
    contactPerson: 'John Smith',
    contactPhone: '+1-555-0123',
    dockNumber: 'Dock 03',
    gateNumber: 'Gate 1 - Heavy Vehicles',
    cargoItems: [
      { id: 'C-101', sku: 'STL-COIL-40', description: 'Heavy Gauge Steel Coils', quantity: 500, unit: 'pcs', weightKg: 8500, handlingTag: 'Overhead Crane' },
      { id: 'C-102', sku: 'STL-BEAM-20', description: 'Structural I-Beams (Grade 50)', quantity: 250, unit: 'pcs', weightKg: 4000, handlingTag: 'Heavy Lift Sling' }
    ],
    vehicleInfo: {
      type: 'Semi-Trailer 18-Wheeler',
      plateNumber: 'ABC-1234',
      driverName: 'Mike Johnson',
      driverPhone: '+1-555-0123',
      gpsStatus: 'En-route (4.2 miles away)',
      distanceRemaining: '4.2 miles • ETA 18 mins'
    },
    deliveryInstructions: 'Use Loading Dock 3. Requires 15-ton overhead crane for coil unloading. Security gate clearance pre-approved.'
  },
  {
    id: 'BOOK-002',
    slotId: 'SLOT-001',
    supplierId: 'SUP-002',
    supplierName: 'Apex Logistics & Fasteners Ltd',
    poNumber: 'PO-2026-0802',
    expectedVolume: 1200,
    priority: 'high',
    status: 'confirmed',
    bookedAt: new Date(Date.now() - 3600 * 1000 * 24 * 2),
    estimatedArrival: new Date(Date.now() + 1000 * 60 * 75), // 75 mins from now
    contactPerson: 'Sarah Jenkins',
    contactPhone: '+1-555-0198',
    dockNumber: 'Dock 01',
    gateNumber: 'Gate 2 - Standard Freight',
    cargoItems: [
      { id: 'C-201', sku: 'FST-M8-100', description: 'M8 Stainless Steel Hex Bolts', quantity: 800, unit: 'boxes', weightKg: 240, handlingTag: 'Standard Pallet' },
      { id: 'C-202', sku: 'FST-NUT-M8', description: 'M8 Nylon Lock Nuts', quantity: 400, unit: 'boxes', weightKg: 90, handlingTag: 'Standard Pallet' }
    ],
    vehicleInfo: {
      type: 'Box Truck 24ft',
      plateNumber: 'NY-9821',
      driverName: 'David Ross',
      driverPhone: '+1-555-0198',
      gpsStatus: 'Dispatched from Regional Distribution Hub',
      distanceRemaining: '14.8 miles • ETA 1h 15m'
    },
    deliveryInstructions: 'Standard forklift offloading. Gate 2 security check required upon entry.'
  },
  {
    id: 'BOOK-003',
    slotId: 'SLOT-002',
    supplierId: 'SUP-003',
    supplierName: 'Global Microchips & Electronics',
    poNumber: 'PO-2026-0803',
    expectedVolume: 350,
    actualVolume: 350,
    priority: 'urgent',
    status: 'delivered',
    bookedAt: new Date(Date.now() - 3600 * 1000 * 24 * 4),
    estimatedArrival: new Date(Date.now() - 1000 * 60 * 45),
    actualArrival: new Date(Date.now() - 1000 * 60 * 48),
    contactPerson: 'Robert Chen',
    contactPhone: '+1-555-0245',
    dockNumber: 'Dock Cleanroom 02',
    gateNumber: 'Gate 3 - Express Cleanroom',
    cargoItems: [
      { id: 'C-301', sku: 'CHIP-MCU-32', description: '32-Bit Microcontroller IC Units', quantity: 250, unit: 'trays', weightKg: 45, handlingTag: 'ESD Cleanroom Sealed' },
      { id: 'C-302', sku: 'CHIP-PWR-12', description: 'Power Management IC Drivers', quantity: 100, unit: 'trays', weightKg: 15, handlingTag: 'ESD Sensitive' }
    ],
    vehicleInfo: {
      type: 'Climate-Controlled Freight Van',
      plateNumber: 'TX-3342',
      driverName: 'Linus Vance',
      driverPhone: '+1-555-0245',
      gpsStatus: 'Delivered & Gate Checked Out',
      distanceRemaining: '0 miles (Offloaded)'
    },
    proofOfDelivery: {
      id: 'POD-2026-003',
      capturedAt: new Date(Date.now() - 1000 * 60 * 48),
      signedBy: 'Robert Chen',
      recipientTitle: 'Cleanroom Lead QA Inspector',
      signatureDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="260" height="60"><path d="M 20 40 Q 60 10 90 35 T 150 25 T 220 30" stroke="%230f172a" stroke-width="2.5" fill="none"/><text x="20" y="55" font-family="sans-serif" font-size="10" fill="%2364748b">Verified Signature - Robert Chen</text></svg>',
      photoUrls: [
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=400&q=80'
      ],
      receiverNotes: 'All 350 microcontrollers ESD sealed & passed cleanroom zero-particle inspection.',
      deliveryStatus: 'verified',
      inspectionPassed: true
    },
    deliveryInstructions: 'Anti-static ESD handling required. Delivered directly to Cleanroom Bay 1.'
  },
  {
    id: 'BOOK-004',
    slotId: 'SLOT-002',
    supplierId: 'SUP-004',
    supplierName: 'EcoPolymer Synthetics Co.',
    poNumber: 'PO-2026-0804',
    expectedVolume: 2500,
    priority: 'normal',
    status: 'delayed',
    bookedAt: new Date(Date.now() - 3600 * 1000 * 24 * 1),
    estimatedArrival: new Date(Date.now() + 1000 * 60 * 140),
    contactPerson: 'Carlos Mendez',
    contactPhone: '+1-555-0377',
    dockNumber: 'Dock 05',
    gateNumber: 'Gate 1 - Heavy Vehicles',
    cargoItems: [
      { id: 'C-401', sku: 'POLY-RES-99', description: 'High-Density Polymer Resin Drums', quantity: 20, unit: 'drums', weightKg: 2500, handlingTag: 'Hazmat Class 3' }
    ],
    vehicleInfo: {
      type: 'Hazmat Flatbed Carrier',
      plateNumber: 'IL-5519',
      driverName: 'Pedro Morales',
      driverPhone: '+1-555-0377',
      gpsStatus: 'Delayed in Traffic (Highway I-95 congestion)',
      distanceRemaining: '22 miles • Delayed ETA +35m'
    },
    deliveryInstructions: 'Verify safety seals before opening container. Hazmat safety documentation attached.'
  },
  {
    id: 'BOOK-005',
    slotId: 'SLOT-003',
    supplierId: 'SUP-005',
    supplierName: 'ThermalTech Heat Exchangers',
    poNumber: 'PO-2026-0805',
    expectedVolume: 180,
    priority: 'high',
    status: 'confirmed',
    bookedAt: new Date(Date.now() - 3600 * 1000 * 12),
    estimatedArrival: addDays(new Date(), 1),
    contactPerson: 'David Miller',
    contactPhone: '+1-555-0412',
    dockNumber: 'Dock 04',
    gateNumber: 'Gate 1 - Heavy Vehicles',
    cargoItems: [
      { id: 'C-501', sku: 'THM-HEX-50', description: 'Industrial Heat Exchanger Coils', quantity: 180, unit: 'units', weightKg: 4200, handlingTag: 'Crane Sling' }
    ],
    vehicleInfo: {
      type: 'Heavy Hauler Semi-Trailer',
      plateNumber: 'OH-7712',
      driverName: 'Marcus Brody',
      driverPhone: '+1-555-0412',
      gpsStatus: 'Scheduled for Tomorrow Morning Dispatch',
      distanceRemaining: '115 miles'
    },
    deliveryInstructions: 'Heavy lift dock 04. Contact shift manager 30 mins prior to arrival.'
  },
  {
    id: 'BOOK-006',
    slotId: 'SLOT-004',
    supplierId: 'SUP-006',
    supplierName: 'Titanium Alloy Metals Corp',
    poNumber: 'PO-2026-0806',
    expectedVolume: 450,
    priority: 'urgent',
    status: 'in-transit',
    bookedAt: new Date(Date.now() - 3600 * 1000 * 18),
    estimatedArrival: new Date(Date.now() + 1000 * 60 * 5), // 5 mins from now
    contactPerson: 'James Wilson',
    contactPhone: '+1-555-0589',
    dockNumber: 'Dock 02',
    gateNumber: 'Gate 2 - Standard Freight',
    cargoItems: [
      { id: 'C-601', sku: 'TIT-ROD-10', description: 'Grade 5 Titanium Alloy Rods', quantity: 450, unit: 'rods', weightKg: 1800, handlingTag: 'Bundle Strapped' }
    ],
    vehicleInfo: {
      type: 'Freight Semi-Trailer',
      plateNumber: 'FL-8823',
      driverName: 'Victor Hugo',
      driverPhone: '+1-555-0589',
      gpsStatus: 'At Security Gate 2 (Check-in Processing)',
      distanceRemaining: '0.2 miles • At Gate'
    },
    deliveryInstructions: 'Metallurgical quality inspection certificate check mandatory at Gate 2 security.'
  },
  {
    id: 'BOOK-007',
    slotId: 'SLOT-005',
    supplierId: 'SUP-007',
    supplierName: 'Quantum Wire & Cable Systems',
    poNumber: 'PO-2026-0807',
    expectedVolume: 15,
    priority: 'normal',
    status: 'pending',
    bookedAt: new Date(Date.now() - 3600 * 1000 * 6),
    estimatedArrival: addDays(new Date(), 1),
    contactPerson: 'Anna Smith',
    contactPhone: '+1-555-0634',
    dockNumber: 'Dock 06',
    gateNumber: 'Gate 2 - Standard Freight',
    cargoItems: [
      { id: 'C-701', sku: 'WIR-COP-50', description: 'Heavy Duty Industrial Copper Spools', quantity: 15, unit: 'spools', weightKg: 3100, handlingTag: 'Wooden Reels' }
    ],
    vehicleInfo: {
      type: 'Cargo Flatbed Van',
      plateNumber: 'PA-1102',
      driverName: 'Thomas Wright',
      driverPhone: '+1-555-0634',
      gpsStatus: 'Awaiting Final Waybill Confirmation',
      distanceRemaining: '78 miles'
    },
    deliveryInstructions: 'Forklift unspooling platform setup required prior to unloading.'
  },
  {
    id: 'BOOK-008',
    slotId: 'SLOT-005',
    supplierId: 'SUP-008',
    supplierName: 'OpticFiber Networks Solutions',
    poNumber: 'PO-2026-0808',
    expectedVolume: 800,
    priority: 'normal',
    status: 'confirmed',
    bookedAt: new Date(Date.now() - 3600 * 1000 * 10),
    estimatedArrival: addDays(new Date(), 1),
    contactPerson: 'Edward Davis',
    contactPhone: '+1-555-0781',
    dockNumber: 'Dock 08',
    gateNumber: 'Gate 3 - Express Cleanroom',
    cargoItems: [
      { id: 'C-801', sku: 'OPT-CBL-100', description: 'Single-Mode Fiber Optic Cable Bundles', quantity: 800, unit: 'coils', weightKg: 420, handlingTag: 'Fragile Glass Fiber' }
    ],
    vehicleInfo: {
      type: 'Box Delivery Truck',
      plateNumber: 'MI-4431',
      driverName: 'Aaron Paul',
      driverPhone: '+1-555-0781',
      gpsStatus: 'En-route (18.5 miles away)',
      distanceRemaining: '18.5 miles • ETA 35 mins'
    },
    deliveryInstructions: 'Fragile optical components. Do not stack higher than 3 pallet layers.'
  },
  {
    id: 'BOOK-009',
    slotId: 'SLOT-006',
    supplierId: 'SUP-009',
    supplierName: 'ProPackaging & Container Corp',
    poNumber: 'PO-2026-0809',
    expectedVolume: 5000,
    actualVolume: 5000,
    priority: 'low',
    status: 'delivered',
    bookedAt: new Date(Date.now() - 3600 * 1000 * 48),
    estimatedArrival: new Date(Date.now() - 3600 * 1000 * 3),
    actualArrival: new Date(Date.now() - 3600 * 1000 * 3.1),
    contactPerson: 'Frank Wright',
    contactPhone: '+1-555-0892',
    dockNumber: 'Dock Bay 01',
    gateNumber: 'Gate 1 - Heavy Vehicles',
    cargoItems: [
      { id: 'C-901', sku: 'PKG-BOX-XL', description: 'Heavy Duty Corrugated Master Cartons', quantity: 5000, unit: 'boxes', weightKg: 1200, handlingTag: 'Palletized' }
    ],
    vehicleInfo: {
      type: 'High-Capacity Container Truck',
      plateNumber: 'GA-6621',
      driverName: "Sean O'Connor",
      driverPhone: '+1-555-0892',
      gpsStatus: 'Completed & Gate Checked Out',
      distanceRemaining: '0 miles (Completed)'
    },
    deliveryInstructions: 'Recyclable materials bay unloading. Stack in Packaging Bay 4.'
  },
  {
    id: 'BOOK-010',
    slotId: 'SLOT-004',
    supplierId: 'SUP-010',
    supplierName: 'Industrial Hydraulics & Valves',
    poNumber: 'PO-2026-0810',
    expectedVolume: 180,
    priority: 'high',
    status: 'in-transit',
    bookedAt: new Date(Date.now() - 3600 * 1000 * 15),
    estimatedArrival: new Date(Date.now() + 1000 * 60 * 8), // 8 mins from now
    contactPerson: 'Gregory Taylor',
    contactPhone: '+1-555-0915',
    dockNumber: 'Dock 03',
    gateNumber: 'Gate 2 - Standard Freight',
    cargoItems: [
      { id: 'C-1001', sku: 'HYD-VLV-300', description: 'High-Pressure Hydraulic Control Valves', quantity: 180, unit: 'pcs', weightKg: 850, handlingTag: 'Crated Hydro-Test' }
    ],
    vehicleInfo: {
      type: 'Specialized Freight Truck',
      plateNumber: 'NC-3310',
      driverName: 'Eric Stevens',
      driverPhone: '+1-555-0915',
      gpsStatus: 'Approaching Yard (0.8 miles away)',
      distanceRemaining: '0.8 miles • ETA 8 mins'
    },
    deliveryInstructions: 'Hydrostatic pressure test certificates required upon physical receipt.'
  }
];

// Initial Delivery Slots with Bookings Attached
const mockInitialSlots: DeliverySlot[] = [
  {
    id: 'SLOT-001',
    date: new Date(),
    startTime: '08:00',
    endTime: '10:00',
    duration: 120,
    capacity: 10,
    availableCapacity: 2,
    location: mockDeliveryLocations[0],
    slotType: 'standard',
    status: 'partially-booked',
    priority: 'high',
    cost: 150,
    currency: 'USD',
    automationRules: [],
    bookings: [mockInitialBookings[0], mockInitialBookings[1]],
    restrictions: [
      {
        id: 'REST-001',
        type: 'weight-limit',
        description: 'Maximum weight per delivery slot',
        value: 15000,
        isActive: true
      }
    ]
  },
  {
    id: 'SLOT-002',
    date: new Date(),
    startTime: '14:00',
    endTime: '16:00',
    duration: 120,
    capacity: 12,
    availableCapacity: 4,
    location: mockDeliveryLocations[1],
    slotType: 'express',
    status: 'partially-booked',
    priority: 'high',
    cost: 220,
    currency: 'USD',
    automationRules: [],
    bookings: [mockInitialBookings[2], mockInitialBookings[3]],
    restrictions: []
  },
  {
    id: 'SLOT-003',
    date: addDays(new Date(), 1),
    startTime: '06:00',
    endTime: '08:00',
    duration: 120,
    capacity: 8,
    availableCapacity: 7,
    location: mockDeliveryLocations[2],
    slotType: 'bulk',
    status: 'available',
    priority: 'medium',
    cost: 180,
    currency: 'USD',
    automationRules: [],
    bookings: [mockInitialBookings[4]],
    restrictions: []
  },
  {
    id: 'SLOT-004',
    date: addDays(new Date(), 1),
    startTime: '10:00',
    endTime: '12:00',
    duration: 120,
    capacity: 15,
    availableCapacity: 3,
    location: mockDeliveryLocations[1],
    slotType: 'fragile',
    status: 'partially-booked',
    priority: 'high',
    cost: 250,
    currency: 'USD',
    automationRules: [],
    bookings: [mockInitialBookings[5], mockInitialBookings[9]],
    restrictions: []
  },
  {
    id: 'SLOT-005',
    date: addDays(new Date(), 1),
    startTime: '13:00',
    endTime: '15:00',
    duration: 120,
    capacity: 10,
    availableCapacity: 6,
    location: mockDeliveryLocations[0],
    slotType: 'temperature-controlled',
    status: 'available',
    priority: 'medium',
    cost: 290,
    currency: 'USD',
    automationRules: [],
    bookings: [mockInitialBookings[6], mockInitialBookings[7]],
    restrictions: []
  },
  {
    id: 'SLOT-006',
    date: new Date(),
    startTime: '06:00',
    endTime: '08:00',
    duration: 120,
    capacity: 10,
    availableCapacity: 0,
    location: mockDeliveryLocations[3],
    slotType: 'standard',
    status: 'fully-booked',
    priority: 'medium',
    cost: 140,
    currency: 'USD',
    automationRules: [],
    bookings: [mockInitialBookings[8]],
    restrictions: []
  }
];

const mockProductionSchedule: ProductionSchedule[] = [
  {
    id: 'PROD-001',
    productionLine: 'Assembly Line A - Steel Chassis',
    material: 'Heavy Steel Coils & I-Beams',
    requiredDelivery: new Date(),
    quantity: 750,
    priority: 'critical',
    linkedSlots: ['SLOT-001']
  },
  {
    id: 'PROD-002',
    productionLine: 'Cleanroom Line B - Micro-Controllers',
    material: '32-Bit Microcontroller IC Units',
    requiredDelivery: new Date(),
    quantity: 350,
    priority: 'critical',
    linkedSlots: ['SLOT-002']
  },
  {
    id: 'PROD-003',
    productionLine: 'Line C - Heat Exchangers',
    material: 'Industrial Coils',
    requiredDelivery: addDays(new Date(), 1),
    quantity: 180,
    priority: 'high',
    linkedSlots: ['SLOT-003']
  }
];

interface DeliverySlotsProps {
  onNavigate?: (section: any) => void;
}

export function DeliverySlots({ onNavigate }: DeliverySlotsProps) {
  const [activeTab, setActiveTab] = useState('bookings');
  const [slots, setSlots] = useState<DeliverySlot[]>(mockInitialSlots);
  const [bookings, setBookings] = useState<SlotBooking[]>(mockInitialBookings);

  // Filters & Search
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedSlotType, setSelectedSlotType] = useState('all');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dialogs & Sheets
  const [showCreateSlot, setShowCreateSlot] = useState(false);
  const [showAddBooking, setShowAddBooking] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<DeliverySlot | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<SlotBooking | null>(null);
  const [showBookingDetail, setShowBookingDetail] = useState(false);
  const [showGatePassModal, setShowGatePassModal] = useState(false);
  const [showAiBanner, setShowAiBanner] = useState(() => localStorage.getItem('hide_ai_delivery_banner') !== 'true');

  // Digital Proof of Delivery (POD) State
  const [showPodModal, setShowPodModal] = useState(false);
  const [podForm, setPodForm] = useState({
    signedBy: '',
    recipientTitle: 'Receiving Dock Lead',
    deliveryStatus: 'verified' as 'verified' | 'accepted_with_exceptions' | 'rejected',
    inspectionPassed: true,
    receiverNotes: '',
    signatureDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="260" height="60"><path d="M 20 40 Q 60 10 90 35 T 150 25 T 220 30" stroke="%230f172a" stroke-width="2.5" fill="none"/><text x="20" y="55" font-family="sans-serif" font-size="10" fill="%2364748b">Verified Signature</text></svg>',
    photoUrls: [
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=400&q=80'
    ]
  });

  const handleOpenPodModal = (booking: SlotBooking) => {
    setSelectedBooking(booking);
    if (booking.proofOfDelivery) {
      setPodForm({
        signedBy: booking.proofOfDelivery.signedBy,
        recipientTitle: booking.proofOfDelivery.recipientTitle,
        deliveryStatus: booking.proofOfDelivery.deliveryStatus,
        inspectionPassed: booking.proofOfDelivery.inspectionPassed,
        receiverNotes: booking.proofOfDelivery.receiverNotes || '',
        signatureDataUrl: booking.proofOfDelivery.signatureDataUrl || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="260" height="60"><path d="M 20 40 Q 60 10 90 35 T 150 25 T 220 30" stroke="%230f172a" stroke-width="2.5" fill="none"/><text x="20" y="55" font-family="sans-serif" font-size="10" fill="%2364748b">Verified Signature</text></svg>',
        photoUrls: booking.proofOfDelivery.photoUrls || []
      });
    } else {
      setPodForm({
        signedBy: booking.vehicleInfo?.driverName || booking.contactPerson || 'Authorized Receiver',
        recipientTitle: 'Receiving Dock Lead',
        deliveryStatus: 'verified',
        inspectionPassed: true,
        receiverNotes: 'All offloaded items inspected and matched against PO waybill.',
        signatureDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="260" height="60"><path d="M 20 40 Q 60 10 90 35 T 150 25 T 220 30" stroke="%230f172a" stroke-width="2.5" fill="none"/><text x="20" y="55" font-family="sans-serif" font-size="10" fill="%2364748b">Verified Signature</text></svg>',
        photoUrls: [
          'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=400&q=80'
        ]
      });
    }
    setShowPodModal(true);
  };

  const handleSavePodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    const newPod: ProofOfDelivery = {
      id: selectedBooking.proofOfDelivery?.id || `POD-${selectedBooking.id}`,
      capturedAt: new Date(),
      signedBy: podForm.signedBy || 'Receiving Inspector',
      recipientTitle: podForm.recipientTitle || 'Dock Lead',
      signatureDataUrl: podForm.signatureDataUrl,
      photoUrls: podForm.photoUrls,
      receiverNotes: podForm.receiverNotes,
      deliveryStatus: podForm.deliveryStatus,
      inspectionPassed: podForm.inspectionPassed
    };

    setBookings(prev => prev.map(b => {
      if (b.id === selectedBooking.id) {
        const updatedBooking: SlotBooking = {
          ...b,
          status: 'delivered' as const,
          actualArrival: b.actualArrival || new Date(),
          proofOfDelivery: newPod
        };
        if (selectedBooking.id === b.id) {
          setSelectedBooking(updatedBooking);
        }
        return updatedBooking;
      }
      return b;
    }));

    setShowPodModal(false);
    toast.success(`Digital Proof of Delivery (POD) saved for ${selectedBooking.id}! Delivery loop closed.`);
  };

  // Dynamic Map Routing State
  const [selectedRouteId, setSelectedRouteId] = useState<string>('ROUTE-NORTH-EXPRESS');
  const [showRouteMapModal, setShowRouteMapModal] = useState(false);
  const [routingStrategy, setRoutingStrategy] = useState<'fastest' | 'eco' | 'bottleneck'>('fastest');
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  const activeRoute = mockDeliveryRoutes.find(r => r.id === selectedRouteId) || mockDeliveryRoutes[0];

  const handleRecalculateRoute = () => {
    setIsCalculatingRoute(true);
    toast.info('AI Engine calculating optimal waypoint routing & traffic bypass...');
    setTimeout(() => {
      setIsCalculatingRoute(false);
      toast.success(`Dynamic route recalculated! ${routingStrategy === 'fastest' ? 'Fastest path chosen (saved 14 mins)' : routingStrategy === 'eco' ? 'Eco-Route chosen (saved $42 fuel spend)' : 'Bottlenecks bypassed via Freight Expressway'}`);
    }, 900);
  };

  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Form State for New Booking
  const [newBookingForm, setNewBookingForm] = useState({
    slotId: 'SLOT-001',
    supplierName: '',
    supplierId: '',
    poNumber: '',
    expectedVolume: 500,
    priority: 'high' as 'urgent' | 'high' | 'normal' | 'low',
    status: 'confirmed' as 'confirmed' | 'pending' | 'in-transit' | 'delivered' | 'delayed' | 'cancelled',
    contactPerson: '',
    contactPhone: '',
    dockNumber: 'Dock 01',
    gateNumber: 'Gate 1',
    driverName: '',
    plateNumber: '',
    vehicleType: 'Box Truck 24ft',
    deliveryInstructions: ''
  });

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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      // Reorder if needed
    }
  };

  // Helper Badge Colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'partially-booked': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'fully-booked': return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'blocked': return 'text-slate-700 bg-slate-100 border-slate-200';
      case 'maintenance': return 'text-orange-700 bg-orange-50 border-orange-200';
      default: return 'text-slate-700 bg-slate-100 border-slate-200';
    }
  };

  const getSlotTypeColor = (type: string) => {
    switch (type) {
      case 'standard': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'express': return 'text-purple-700 bg-purple-50 border-purple-200';
      case 'bulk': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'fragile': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'temperature-controlled': return 'text-cyan-700 bg-cyan-50 border-cyan-200';
      default: return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
      case 'urgent': return 'text-rose-700 bg-rose-50 border-rose-200 font-semibold';
      case 'high': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'medium':
      case 'normal': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'low': return 'text-slate-600 bg-slate-100 border-slate-200';
      default: return 'text-slate-600 bg-slate-100 border-slate-200';
    }
  };

  const getBookingStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 gap-1"><CheckCircle className="w-3 h-3" /> Confirmed</Badge>;
      case 'in-transit':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 gap-1 animate-pulse"><Radio className="w-3 h-3 text-blue-600" /> In-Transit</Badge>;
      case 'delivered':
        return <Badge variant="outline" className="bg-teal-50 text-teal-800 border-teal-300 gap-1"><ShieldCheck className="w-3 h-3 text-teal-600" /> Delivered</Badge>;
      case 'delayed':
        return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300 gap-1"><AlertTriangle className="w-3 h-3 text-rose-600" /> Delayed</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-300 gap-1"><XCircle className="w-3 h-3" /> Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Filter slots
  const filteredSlots = slots.filter(slot => {
    const matchesLocation = selectedLocation === 'all' || slot.location.id === selectedLocation;
    const matchesType = selectedSlotType === 'all' || slot.slotType === selectedSlotType;
    const matchesSearch = slot.location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          slot.slotType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLocation && matchesType && matchesSearch;
  });

  // Filter active bookings
  const filteredBookings = bookings.filter(b => {
    const matchesStatus = bookingStatusFilter === 'all' || b.status === bookingStatusFilter;
    const matchesSearch = b.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (b.poNumber && b.poNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (b.vehicleInfo?.driverName && b.vehicleInfo.driverName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          b.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const utilizationRate = slots.reduce((total, slot) => {
    return total + ((slot.capacity - slot.availableCapacity) / slot.capacity);
  }, 0) / (slots.length || 1) * 100;

  // View detail handler
  const handleViewBookingDetail = (booking: SlotBooking) => {
    setSelectedBooking(booking);
    setShowBookingDetail(true);
  };

  // Status update handler
  const handleUpdateBookingStatus = (bookingId: string, newStatus: SlotBooking['status']) => {
    setBookings(prev => prev.map(b => {
      if (b.id === bookingId) {
        const updated = {
          ...b,
          status: newStatus,
          actualArrival: newStatus === 'delivered' ? new Date() : b.actualArrival
        };
        if (selectedBooking && selectedBooking.id === bookingId) {
          setSelectedBooking(updated);
        }
        return updated;
      }
      return b;
    }));
    toast.success(`Booking ${bookingId} status updated to ${newStatus.toUpperCase()}`);
  };

  // Add new booking handler
  const handleCreateBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookingForm.supplierName || !newBookingForm.poNumber) {
      toast.error('Please enter Supplier Name and PO Number');
      return;
    }

    const newId = `BOOK-${(bookings.length + 1).toString().padStart(3, '0')}`;
    const targetSlot = slots.find(s => s.id === newBookingForm.slotId) || slots[0];

    const createdBooking: SlotBooking = {
      id: newId,
      slotId: targetSlot.id,
      supplierId: newBookingForm.supplierId || `SUP-${Math.floor(100 + Math.random() * 900)}`,
      supplierName: newBookingForm.supplierName,
      poNumber: newBookingForm.poNumber,
      expectedVolume: Number(newBookingForm.expectedVolume),
      priority: newBookingForm.priority,
      status: newBookingForm.status,
      bookedAt: new Date(),
      estimatedArrival: addDays(new Date(), 1),
      contactPerson: newBookingForm.contactPerson || 'Logistics Coordinator',
      contactPhone: newBookingForm.contactPhone || '+1-555-0999',
      dockNumber: newBookingForm.dockNumber,
      gateNumber: newBookingForm.gateNumber,
      cargoItems: [
        {
          id: `C-NEW-${Date.now()}`,
          sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
          description: `Delivery items for ${newBookingForm.poNumber}`,
          quantity: Number(newBookingForm.expectedVolume),
          unit: 'pcs',
          weightKg: Number(newBookingForm.expectedVolume) * 2.5,
          handlingTag: 'Standard Delivery'
        }
      ],
      vehicleInfo: {
        type: newBookingForm.vehicleType,
        plateNumber: newBookingForm.plateNumber || 'REG-2026-X',
        driverName: newBookingForm.driverName || 'Assigned Driver',
        driverPhone: newBookingForm.contactPhone || '+1-555-0999',
        gpsStatus: 'Confirmed & En-route',
        distanceRemaining: '12 miles'
      },
      deliveryInstructions: newBookingForm.deliveryInstructions || 'Standard dock unloading instructions apply.'
    };

    setBookings([createdBooking, ...bookings]);

    // Update slot capacity
    setSlots(prev => prev.map(s => {
      if (s.id === targetSlot.id) {
        return {
          ...s,
          availableCapacity: Math.max(0, s.availableCapacity - 1),
          bookings: [createdBooking, ...s.bookings]
        };
      }
      return s;
    }));

    setShowAddBooking(false);
    toast.success(`Active Delivery Booking ${newId} created successfully!`);
  };

  const generateTimeSlots = () => {
    const result = [];
    for (let hour = 6; hour < 22; hour++) {
      result.push(`${hour.toString().padStart(2, '0')}:00`);
      result.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return result;
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
              <BreadcrumbPage>Logistics</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Smart Delivery Slots</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center justify-between w-full">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Delivery Slots Management</h1>
          
        </div>
      </div>

      {/* Metric Cards Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="border-l-4 border-l-primary shadow-sm">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Active Bookings</p>
              <p className="text-xl font-bold text-foreground mt-0.5">{bookings.length}</p>
              <p className="text-[11px] text-emerald-600 font-medium">10 Active Shipments</p>
            </div>
            <div className="p-2.5 bg-primary/10 rounded-lg">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">In-Transit</p>
              <p className="text-xl font-bold text-blue-600 mt-0.5">
                {bookings.filter(b => b.status === 'in-transit').length}
              </p>
              <p className="text-[11px] text-blue-600 font-medium">GPS Live Tracking</p>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-lg">
              <Radio className="w-5 h-5 text-blue-600 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Confirmed / Delivered</p>
              <p className="text-xl font-bold text-emerald-600 mt-0.5">
                {bookings.filter(b => b.status === 'confirmed' || b.status === 'delivered').length}
              </p>
              <p className="text-[11px] text-emerald-600 font-medium">
                {bookings.filter(b => b.status === 'delivered').length} Fully Received
              </p>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Slot Utilization</p>
              <p className="text-xl font-bold text-amber-600 mt-0.5">{utilizationRate.toFixed(0)}%</p>
              <p className="text-[11px] text-emerald-600 font-medium">+12% Efficiency</p>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-lg">
              <Gauge className="w-5 h-5 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm col-span-2 sm:col-span-1">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">On-Time Gate Rate</p>
              <p className="text-xl font-bold text-purple-600 mt-0.5">96.4%</p>
              <p className="text-[11px] text-emerald-600 font-medium">Target &gt;95%</p>
            </div>
            <div className="p-2.5 bg-purple-50 rounded-lg">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Smart Banner */}
      {showAiBanner && (
        <Alert className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50/50 relative pr-10 shadow-sm">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900 font-semibold flex items-center gap-2 text-xs sm:text-sm">
            AI Smart Delivery Optimization
          </AlertTitle>
          <AlertDescription className="text-blue-800 text-xs sm:text-sm mt-0.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>
              3 active inbound trucks are currently within 5 miles. Loading Dock 03 is reserved for <strong>Steel Components Inc (PO-2026-0801)</strong>.
            </span>
            <Button variant="outline" size="sm" className="bg-white border-blue-300 text-blue-700 hover:bg-blue-100 self-start sm:self-auto shrink-0 text-xs h-7 px-2.5" onClick={() => toast.success('Gate 1 automated green clearance dispatched to drivers!')}>
              Dispatch Gate Clearance
            </Button>
          </AlertDescription>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setShowAiBanner(false);
              localStorage.setItem('hide_ai_delivery_banner', 'true');
              toast.info('AI Optimization notification dismissed.');
            }}
            className="absolute right-2 top-2 text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-100/60 transition-colors h-auto w-auto"
            title="Close Notification"
          >
            <X className="w-4 h-4" />
          </Button>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-fit">
          <TabsTrigger value="bookings" className="gap-1.5">
            <ClipboardList className="w-4 h-4" /> Active Bookings ({bookings.length})
          </TabsTrigger>
          <TabsTrigger value="slots" className="gap-1.5">
            <Truck className="w-4 h-4" /> Delivery Slots ({slots.length})
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-1.5">
            <Activity className="w-4 h-4" /> Production Sync
          </TabsTrigger>
          <TabsTrigger value="optimization" className="gap-1.5">
            <Zap className="w-4 h-4" /> Smart Optimization
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5">
            <BarChart3 className="w-4 h-4" /> Analytics
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: ACTIVE BOOKINGS TAB */}
        <TabsContent value="bookings" className="space-y-4">
          <Card className="shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden rounded-xl p-0">
            <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    Active Delivery Bookings
                    <Badge variant="secondary" className="font-semibold text-xs">{filteredBookings.length} Total</Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Real-time tracking of confirmed, in-transit, and delivered supplier shipments with action detail inspection
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-full sm:w-60">
                    <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search supplier, PO, driver..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 h-8 text-xs"
                    />
                  </div>
                  <Select value={bookingStatusFilter} onValueChange={setBookingStatusFilter}>
                    <SelectTrigger className="w-36 h-8 text-xs">
                      <SelectValue placeholder="Status Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
                      <SelectItem value="in-transit" className="text-xs">In-Transit</SelectItem>
                      <SelectItem value="confirmed" className="text-xs">Confirmed</SelectItem>
                      <SelectItem value="delivered" className="text-xs">Delivered</SelectItem>
                      <SelectItem value="delayed" className="text-xs">Delayed</SelectItem>
                      <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0 border-t border-slate-200 dark:border-slate-800">
              <div className="overflow-x-auto w-full max-w-full">
                <Table className="w-full min-w-[960px] border-collapse">
                  <TableHeader className="bg-slate-100/80 dark:bg-slate-900/80">
                    <TableRow className="text-xs">
                      <TableHead className="w-[200px] min-w-[200px] sticky left-0 z-20 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.08)]">
                        Supplier & Order
                      </TableHead>
                      <TableHead className="w-[170px]">Location & Assigned Dock</TableHead>
                      <TableHead className="w-[170px]">Driver & Vehicle</TableHead>
                      <TableHead className="w-[120px]">Volume & Cargo</TableHead>
                      <TableHead className="w-[110px]">Status</TableHead>
                      <TableHead className="w-[150px]">ETA / Telematics</TableHead>
                      <TableHead className="w-[90px]">Priority</TableHead>
                      <TableHead className="w-[140px] text-right">Action Detail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No active delivery bookings match the criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBookings.map((booking) => {
                        const slot = slots.find(s => s.id === booking.slotId) || slots[0];
                        return (
                          <TableRow key={booking.id} className="group hover:bg-muted/30 transition-colors">
                            <TableCell className="w-[200px] min-w-[200px] sticky left-0 z-10 bg-white dark:bg-slate-950 group-hover:bg-slate-50 dark:group-hover:bg-slate-900/90 border-r border-slate-200 dark:border-slate-800 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.08)]">
                              <div>
                                <p className="font-semibold text-foreground">{booking.supplierName}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">
                                    {booking.poNumber || booking.id}
                                  </span>
                                  <span className="text-xs text-muted-foreground">{booking.id}</span>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div>
                                <p className="font-medium text-sm flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-primary" />
                                  {slot?.location.name || 'Warehouse A'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {booking.dockNumber || 'Dock 01'} • {booking.gateNumber || 'Gate 1'}
                                </p>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div>
                                <p className="font-medium text-sm text-foreground">
                                  {booking.vehicleInfo?.driverName || booking.contactPerson}
                                </p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Truck className="w-3.5 h-3.5" />
                                  {booking.vehicleInfo?.plateNumber || 'N/A'} ({booking.vehicleInfo?.type || 'Truck'})
                                </p>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{booking.expectedVolume.toLocaleString()} units</p>
                                <p className="text-xs text-muted-foreground">
                                  {booking.cargoItems?.length || 1} line item(s)
                                </p>
                              </div>
                            </TableCell>

                            <TableCell>
                              {getBookingStatusBadge(booking.status)}
                            </TableCell>

                            <TableCell>
                              <div>
                                <p className="text-xs font-medium flex items-center gap-1 text-foreground">
                                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                  {booking.estimatedArrival ? format(booking.estimatedArrival, 'HH:mm (MMM dd)') : 'TBD'}
                                </p>
                                <p className="text-[11px] text-muted-foreground truncate max-w-[140px]" title={booking.vehicleInfo?.gpsStatus}>
                                  {booking.vehicleInfo?.gpsStatus || 'GPS Active'}
                                </p>
                              </div>
                            </TableCell>

                            <TableCell>
                              <Badge variant="outline" className={getPriorityColor(booking.priority)}>
                                {booking.priority.charAt(0).toUpperCase() + booking.priority.slice(1)}
                              </Badge>
                            </TableCell>

                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                   variant="outline"
                                   size="icon"
                                   className="h-8 w-8 text-slate-600 hover:text-primary hover:bg-slate-50 border-slate-200"
                                   title="View Action Details & Milestone Timeline"
                                   onClick={() => handleViewBookingDetail(booking)}
                                 >
                                   <Eye className="w-3.5 h-3.5" />
                                 </Button>

                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 text-slate-600 hover:text-primary"
                                  title="Print Gate Pass"
                                  onClick={() => {
                                    setSelectedBooking(booking);
                                    setShowGatePassModal(true);
                                  }}
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                </Button>
                                
                                <Button
                                  variant={booking.proofOfDelivery ? "secondary" : "outline"}
                                  size="icon"
                                  className={`h-8 w-8 ${booking.proofOfDelivery ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'text-slate-600 hover:text-emerald-700'}`}
                                  title={booking.proofOfDelivery ? "Digital POD Verified & Sealed" : "Capture Digital POD Signature & Evidence"}
                                  onClick={() => handleOpenPodModal(booking)}
                                >
                                  <FileCheck className="w-3.5 h-3.5" />
                                </Button>

                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 text-blue-600 hover:bg-blue-50 border-blue-200"
                                  title="View Dynamic Map Route & Telematics"
                                  onClick={() => setShowRouteMapModal(true)}
                                >
                                  <MapIcon className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: DELIVERY SLOTS TAB */}
        <TabsContent value="slots" className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-2">
                  <Button 
                    variant={viewMode === 'calendar' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setViewMode('calendar')}
                  >
                    <Calendar className="w-4 h-4 mr-1" />
                    Calendar View
                  </Button>
                  <Button 
                    variant={viewMode === 'list' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <BarChart3 className="w-4 h-4 mr-1" />
                    List View
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-3 items-center">
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger className="w-48 h-9">
                      <SelectValue placeholder="All Locations" />
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
                    <SelectTrigger className="w-44 h-9">
                      <SelectValue placeholder="All Slot Types" />
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
              </div>
            </CardContent>
          </Card>

          {viewMode === 'calendar' ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Weekly Delivery Schedule Grid</CardTitle>
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
                  <div className="p-2 text-center text-xs font-semibold text-muted-foreground">Time</div>
                  {weekDays.map(day => (
                    <div key={day.toISOString()} className="p-2 text-center border-b">
                      <div className="text-xs font-medium text-muted-foreground">{format(day, 'EEE')}</div>
                      <div className={`text-base ${isToday(day) ? 'font-bold text-primary' : 'font-semibold'}`}>
                        {format(day, 'd')}
                      </div>
                    </div>
                  ))}
                  
                  {generateTimeSlots().filter((_, index) => index % 2 === 0).map(time => (
                    <React.Fragment key={time}>
                      <div className="p-2 text-xs text-muted-foreground text-right border-r font-mono">{time}</div>
                      {weekDays.map(day => {
                        const daySlots = filteredSlots.filter(slot => 
                          isSameDay(slot.date, day) && slot.startTime === time
                        );
                        return (
                          <div key={`${day.toISOString()}-${time}`} className="p-1 min-h-16 border border-border/40">
                            {daySlots.map(slot => (
                              <div 
                                key={slot.id}
                                className={`mb-1 p-2 rounded border text-xs cursor-pointer transition-all hover:shadow-md ${getStatusColor(slot.status)}`}
                                onClick={() => setSelectedSlot(slot)}
                              >
                                <div className="font-semibold truncate">{slot.location.name}</div>
                                <div className="flex items-center justify-between mt-1">
                                  <Badge variant="outline" className={`text-[10px] px-1 py-0 ${getSlotTypeColor(slot.slotType)}`}>
                                    {slot.slotType}
                                  </Badge>
                                  <span className="font-mono text-[10px]">{slot.bookings.length} Booked</span>
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
            <Card className="shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden rounded-xl p-0">
              <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
                <CardTitle>Delivery Slots & Capacity Overview</CardTitle>
                <CardDescription>Manage master delivery slots, operating rules, and active bookings</CardDescription>
              </CardHeader>
              <CardContent className="p-0 border-t border-slate-200 dark:border-slate-800 overflow-x-auto w-full max-w-full">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={filteredSlots.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                    <Table>
                      <TableHeader>
                        <DraggableTableHeader
                          showDragHandle={true}
                          allSelected={selectedRows.size === filteredSlots.length && filteredSlots.length > 0}
                          onSelectAll={handleSelectAll}
                        >
                          <TableHead>Date & Window</TableHead>
                          <TableHead>Facility Location</TableHead>
                          <TableHead>Slot Type</TableHead>
                          <TableHead>Capacity Utilization</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Cost</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </DraggableTableHeader>
                      </TableHeader>
                      <TableBody>
                        {filteredSlots.map((slot) => {
                          const usedCap = slot.capacity - slot.availableCapacity;
                          const percent = Math.min(100, Math.round((usedCap / slot.capacity) * 100));
                          return (
                            <DraggableTableRow
                              key={slot.id}
                              id={slot.id}
                              isSelected={selectedRows.has(slot.id)}
                              onSelect={() => handleSelectRow(slot.id)}
                            >
                              <TableCell>
                                <div>
                                  <p className="font-semibold text-foreground">{format(slot.date, 'MMM dd, yyyy')}</p>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                                    <Clock className="w-3 h-3" />
                                    {slot.startTime} - {slot.endTime} ({slot.duration}m)
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium text-sm">{slot.location.name}</p>
                                  <p className="text-xs text-muted-foreground capitalize">{slot.location.type}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={getSlotTypeColor(slot.slotType)}>
                                  {slot.slotType}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1 w-32">
                                  <div className="flex justify-between text-xs font-medium">
                                    <span>{usedCap} / {slot.capacity} slots</span>
                                    <span>{percent}%</span>
                                  </div>
                                  <Progress value={percent} className="h-1.5" />
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(slot.status)}>
                                  {slot.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="font-medium text-sm">${slot.cost} {slot.currency}</span>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1 text-xs"
                                  onClick={() => setSelectedSlot(slot)}
                                >
                                  <Eye className="w-3.5 h-3.5" /> View Slot ({slot.bookings.length})
                                </Button>
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
        </TabsContent>

        {/* TAB 3: PRODUCTION SYNC */}
        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Production Schedule Integration
              </CardTitle>
              <CardDescription>
                Automated synchronization between assembly line schedules and inbound raw material delivery slots
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockProductionSchedule.map((schedule) => (
                <Card key={schedule.id} className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                      <div>
                        <h4 className="font-semibold text-lg text-foreground">{schedule.productionLine}</h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Package className="w-4 h-4 text-primary" /> Material Required: <span className="font-medium text-foreground">{schedule.material}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getPriorityColor(schedule.priority)}>
                          {schedule.priority.charAt(0).toUpperCase() + schedule.priority.slice(1)} Priority
                        </Badge>
                        <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-300 gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Live Synced
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm bg-muted/40 p-3 rounded-lg">
                      <div>
                        <span className="text-muted-foreground text-xs block">Required Delivery Deadline:</span>
                        <p className="font-semibold text-foreground">{format(schedule.requiredDelivery, 'PPP (HH:mm)')}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs block">Batch Quantity Required:</span>
                        <p className="font-semibold text-foreground">{schedule.quantity} units</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs block">Linked Delivery Slots:</span>
                        <p className="font-semibold text-primary flex items-center gap-1">
                          <Truck className="w-4 h-4" /> {schedule.linkedSlots.join(', ')}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-md">
                      <span className="flex items-center gap-2 font-medium">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        Auto-Optimized: Material slot dynamically linked with active delivery PO-2026-0801
                      </span>
                      <Button variant="ghost" size="sm" className="h-6 text-xs text-emerald-800 hover:bg-emerald-100" onClick={() => toast.success('Sync re-validated!')}>
                        Re-check Sync
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: SMART OPTIMIZATION */}
        <TabsContent value="optimization" className="space-y-6">
          {/* Dynamic Map Routing & Telematics Section */}
          <Card className="border-l-4 border-l-blue-600 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <MapIcon className="w-5 h-5 text-blue-600" /> Dynamic Map Routing & Fleet Telematics
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Automated waypoint calculation to minimize fuel spend, avoid traffic bottlenecks, and optimize arrival windows
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={routingStrategy} onValueChange={(val: any) => setRoutingStrategy(val)}>
                    <SelectTrigger className="w-44 h-8 text-xs bg-white dark:bg-slate-900">
                      <SelectValue placeholder="Strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fastest" className="text-xs">Fastest Path (Least Time)</SelectItem>
                      <SelectItem value="eco" className="text-xs">Eco-Friendly (Min Fuel Spend)</SelectItem>
                      <SelectItem value="bottleneck" className="text-xs">Bypass Bottlenecks & Tolls</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    size="sm"
                    className="h-8 gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleRecalculateRoute}
                    disabled={isCalculatingRoute}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCalculatingRoute ? 'animate-spin' : ''}`} />
                    {isCalculatingRoute ? 'Calculating...' : 'Recalculate Route'}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Route Selector Badges */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {mockDeliveryRoutes.map(route => (
                  <div
                    key={route.id}
                    onClick={() => setSelectedRouteId(route.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedRouteId === route.id
                        ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-500/20 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-card'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-xs text-foreground truncate">{route.title}</span>
                      <Badge variant="outline" className={`text-[10px] ${
                        route.bottleneckRisk === 'low' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-amber-50 text-amber-700 border-amber-300'
                      }`}>
                        {route.trafficStatus}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t text-[11px]">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Distance</span>
                        <span className="font-bold font-mono text-foreground">{route.totalDistanceMiles} mi</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Est. Time</span>
                        <span className="font-bold font-mono text-foreground">{route.estDurationMins} min</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Fuel Spend</span>
                        <span className="font-bold font-mono text-emerald-600">${route.fuelCostUsd}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Interactive Vector Route Map Canvas (Light Mode GIS Map) */}
              <div className="bg-white text-slate-900 rounded-xl p-4 relative overflow-hidden shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-blue-600 animate-spin-slow" />
                    <span className="text-xs font-bold text-slate-900">Live Telematics Route Map</span>
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-mono">
                      GPS Signal Active
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs text-slate-700 hover:text-slate-900 border-slate-300 gap-1 bg-slate-50 hover:bg-slate-100"
                    onClick={() => setShowRouteMapModal(true)}
                  >
                    <Maximize2 className="w-3.5 h-3.5" /> Open Route Sheet
                  </Button>
                </div>

                {/* Light Mode Vector SVG Map Engine */}
                <div className="w-full h-72 bg-[#eef2f6] rounded-lg border border-slate-300 relative flex items-center justify-center overflow-hidden shadow-inner">
                  <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="lightGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                        <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                      </pattern>
                    </defs>

                    {/* Base Map Background Grid */}
                    <rect width="100%" height="100%" fill="#f1f5f9" />
                    <rect width="100%" height="100%" fill="url(#lightGrid)" />

                    {/* Soft Green Park Areas */}
                    <path d="M 20 20 L 220 20 L 180 80 L 20 60 Z" fill="#dcfce7" stroke="#bbf7d0" strokeWidth="1.5" />
                    <text x="70" y="45" fill="#15803d" fontSize="10" fontWeight="bold">🌲 Navruz Logistics Park</text>

                    <path d="M 380 180 L 580 160 L 540 250 L 340 260 Z" fill="#dcfce7" stroke="#bbf7d0" strokeWidth="1.5" />
                    <text x="410" y="220" fill="#15803d" fontSize="10" fontWeight="bold">🌳 Tashkent City Green Zone</text>

                    {/* Water Bodies / Rivers */}
                    <path d="M 750 0 C 720 100 780 200 740 300" fill="none" stroke="#bae6fd" strokeWidth="14" strokeLinecap="round" />
                    <path d="M 750 0 C 720 100 780 200 740 300" fill="none" stroke="#0284c7" strokeWidth="2" strokeDasharray="6 3" />
                    <text x="755" y="160" fill="#0369a1" fontSize="9" fontWeight="semibold" transform="rotate(80 755 160)">Islam Karimov River</text>

                    {/* Road Network Grid */}
                    {/* Secondary roads */}
                    <path d="M 0 100 L 800 100" fill="none" stroke="#ffffff" strokeWidth="12" />
                    <path d="M 0 100 L 800 100" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />

                    <path d="M 0 210 L 800 210" fill="none" stroke="#ffffff" strokeWidth="14" />
                    <path d="M 0 210 L 800 210" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
                    <text x="140" y="205" fill="#64748b" fontSize="10" fontWeight="medium">Navoi Avenue</text>

                    {/* Vertical connecting avenues */}
                    <path d="M 160 0 L 160 300" fill="none" stroke="#ffffff" strokeWidth="10" />
                    <path d="M 160 0 L 160 300" fill="none" stroke="#cbd5e1" strokeWidth="1" />

                    <path d="M 400 0 L 400 300" fill="none" stroke="#ffffff" strokeWidth="12" />
                    <path d="M 400 0 L 400 300" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />

                    {/* Active Royal Blue Route Vector Polyline */}
                    <path
                      d="M 160 80 L 400 80 L 400 210 L 520 210 L 520 250"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Route Directional Pulse Halo */}
                    <path
                      d="M 160 80 L 400 80 L 400 210 L 520 210 L 520 250"
                      fill="none"
                      stroke="#60a5fa"
                      strokeWidth="12"
                      strokeOpacity="0.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="animate-pulse"
                    />

                    {/* ========================================================= */}
                    {/* 1. 3D PICKUP WAREHOUSE ICON & NAME CALLOUT */}
                    {/* ========================================================= */}
                    <g transform="translate(140, 50)" className="cursor-pointer group">
                      {/* Shadow */}
                      <ellipse cx="20" cy="35" rx="22" ry="7" fill="#94a3b8" opacity="0.4" />

                      {/* 3D Isometric Pickup Warehouse Building */}
                      <path d="M 0 15 L 20 5 L 40 15 L 40 30 L 20 40 L 0 30 Z" fill="#15803d" />
                      <path d="M 20 5 L 40 15 L 20 25 L 0 15 Z" fill="#22c55e" />
                      <path d="M 20 25 L 40 15 L 40 30 L 20 40 Z" fill="#16a34a" />

                      {/* Warehouse Loading Bay Doors */}
                      <rect x="7" y="22" width="8" height="10" fill="#052e16" rx="1" />
                      <rect x="25" y="22" width="8" height="10" fill="#052e16" rx="1" />

                      {/* 3D Pickup Badge Banner */}
                      <g transform="translate(-50, -25)">
                        <rect x="0" y="0" width="160" height="22" rx="6" fill="#15803d" stroke="#ffffff" strokeWidth="1.5" className="shadow-md" />
                        <text x="8" y="14" fill="#ffffff" fontSize="10" fontWeight="bold">🏬 PICKUP: {activeRoute.origin.split(' ')[0]} Hub</text>
                      </g>
                    </g>

                    {/* ========================================================= */}
                    {/* 2. 3D LIVE FREIGHT TRUCK ICON & DRIVER CALLOUT */}
                    {/* ========================================================= */}
                    <g transform="translate(380, 110)" className="cursor-pointer">
                      {/* Live Radar Ping */}
                      <circle cx="20" cy="15" r="22" fill="#3b82f6" opacity="0.3" className="animate-ping" />
                      <ellipse cx="20" cy="28" rx="18" ry="6" fill="#64748b" opacity="0.4" />

                      {/* 3D Rendered Freightliner Truck */}
                      {/* Trailer Body */}
                      <path d="M 5 8 L 26 8 L 26 22 L 5 22 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                      <path d="M 26 8 L 32 12 L 32 26 L 26 22 Z" fill="#e2e8f0" />
                      {/* Truck Cab */}
                      <path d="M 26 14 L 36 14 L 38 19 L 38 25 L 26 25 Z" fill="#2563eb" />
                      <path d="M 30 16 L 36 16 L 37 19 L 30 19 Z" fill="#93c5fd" />
                      {/* Chrome Wheels */}
                      <circle cx="10" cy="24" r="3.5" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1" />
                      <circle cx="22" cy="24" r="3.5" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1" />
                      <circle cx="34" cy="26" r="3.5" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1" />

                      {/* 3D Truck Driver Callout Chip */}
                      <g transform="translate(-40, -22)">
                        <rect x="0" y="0" width="145" height="20" rx="5" fill="#1e40af" stroke="#ffffff" strokeWidth="1.5" className="shadow-md" />
                        <text x="6" y="13" fill="#ffffff" fontSize="9" fontWeight="bold">🚛 TRK-8804 (Linus Vance • 54 mph)</text>
                      </g>
                    </g>

                    {/* ========================================================= */}
                    {/* 3. 3D INTERMEDIATE WAYPOINT CONE PIN */}
                    {/* ========================================================= */}
                    <g transform="translate(400, 210)">
                      <ellipse cx="0" cy="8" rx="10" ry="4" fill="#94a3b8" opacity="0.4" />
                      <circle r="9" fill="#ea580c" stroke="#ffffff" strokeWidth="2" />
                      <text x="0" y="3" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">🚧</text>
                      <text x="14" y="4" fill="#c2410c" fontSize="9" fontWeight="bold">Waypoint: Gate B Checkpoint</text>
                    </g>

                    {/* ========================================================= */}
                    {/* 4. 3D DELIVERY WAREHOUSE ICON & DESTINATION WAREHOUSE NAME */}
                    {/* ========================================================= */}
                    <g transform="translate(500, 220)" className="cursor-pointer">
                      {/* Shadow */}
                      <ellipse cx="20" cy="35" rx="22" ry="7" fill="#94a3b8" opacity="0.4" />

                      {/* 3D Isometric Delivery Warehouse Building */}
                      <path d="M 0 15 L 20 5 L 40 15 L 40 30 L 20 40 L 0 30 Z" fill="#6b21a8" />
                      <path d="M 20 5 L 40 15 L 20 25 L 0 15 Z" fill="#a855f7" />
                      <path d="M 20 25 L 40 15 L 40 30 L 20 40 Z" fill="#7e22ce" />

                      {/* Delivery Dock Doors */}
                      <rect x="8" y="22" width="9" height="10" fill="#3b0764" rx="1" />
                      <rect x="23" y="22" width="9" height="10" fill="#3b0764" rx="1" />

                      {/* 3D Delivery Badge Banner */}
                      <g transform="translate(-60, 42)">
                        <rect x="0" y="0" width="185" height="22" rx="6" fill="#6b21a8" stroke="#ffffff" strokeWidth="1.5" className="shadow-md" />
                        <text x="8" y="14" fill="#ffffff" fontSize="10" fontWeight="bold">🏬 DELIVERY: {activeRoute.destination}</text>
                      </g>
                    </g>
                  </svg>

                  {/* Floating Telematics Info Badge (Light Glassmorphic) */}
                  <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur border border-slate-300 p-2.5 rounded-lg text-xs flex items-center gap-4 text-slate-800 shadow-md">
                    <div className="flex items-center gap-1.5">
                      <Fuel className="w-4 h-4 text-emerald-600" />
                      <span>Fuel Economy: <strong className="text-emerald-700">7.2 MPG</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-amber-600" />
                      <span>CO2 Avoided: <strong className="text-amber-700">-{activeRoute.co2SavedKg} kg</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-blue-600" />
                      <span>Speed: <strong className="text-blue-700">54 mph</strong></span>
                    </div>
                  </div>
                </div>

                {/* Waypoints Breakdown Bar */}
                <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Navigation className="w-4 h-4 text-blue-600" />
                    <span>Calculated Waypoints: </span>
                    <span className="font-mono text-slate-900 font-semibold">{activeRoute.waypoints.join(' ➔ ')}</span>
                  </div>
                  <span className="text-emerald-700 font-semibold text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{activeRoute.recommendedAction}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" /> AI Optimization Engine
                </CardTitle>
                <CardDescription>Intelligent recommendations for delivery efficiency and dock load balancing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-xl bg-card shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Route className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold">Route & Gate Consolidation</span>
                    </div>
                    <Badge variant="outline" className="text-emerald-700 bg-emerald-50">
                      $1,450 Savings
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Consolidate 4 inbound shipments into 2 synchronized gate arrival slots to eliminate truck queuing at Gate 1.
                  </p>
                  <Button size="sm" className="mt-3 text-xs gap-1" onClick={() => toast.success('Route consolidation applied!')}>
                    Apply Optimization
                  </Button>
                </div>
                
                <div className="p-4 border rounded-xl bg-card shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span className="font-semibold">Peak Hour Rebalancing</span>
                    </div>
                    <Badge variant="outline" className="text-blue-700 bg-blue-50">
                      +15% Offload Speed
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Shift 3 non-urgent deliveries from 10:00 AM peak window to 02:00 PM off-peak slot for Warehouse A.
                  </p>
                  <Button variant="outline" size="sm" className="mt-3 text-xs" onClick={() => toast.success('Off-peak rebalancing applied!')}>
                    Implement Shift
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-slate-700" /> Automation Rules Engine
                </CardTitle>
                <CardDescription>Configure auto-assignment, notification triggers, and gate entry security policies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3.5 border rounded-lg">
                  <div>
                    <p className="font-semibold text-sm">Auto-assign critical assembly materials</p>
                    <p className="text-xs text-muted-foreground">Automatically reserve Dock 03 for urgent POs</p>
                  </div>
                  <Switch defaultChecked onCheckedChange={(val) => toast.info(`Auto-assignment ${val ? 'enabled' : 'disabled'}`)} />
                </div>
                <div className="flex items-center justify-between p-3.5 border rounded-lg">
                  <div>
                    <p className="font-semibold text-sm">Real-time GPS Gate Alerts</p>
                    <p className="text-xs text-muted-foreground">Alert gate security when truck is within 2 miles</p>
                  </div>
                  <Switch defaultChecked onCheckedChange={(val) => toast.info(`GPS alerts ${val ? 'enabled' : 'disabled'}`)} />
                </div>
                <div className="flex items-center justify-between p-3.5 border rounded-lg">
                  <div>
                    <p className="font-semibold text-sm">Automated Digital Gate Pass QR Dispatch</p>
                    <p className="text-xs text-muted-foreground">Send digital QR pass to driver phone upon dispatch</p>
                  </div>
                  <Switch defaultChecked onCheckedChange={(val) => toast.info(`QR Pass auto-dispatch ${val ? 'enabled' : 'disabled'}`)} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 5: ANALYTICS */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Logistics Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span>On-Time Arrival Rate</span>
                  <span className="font-bold text-emerald-600">96.4%</span>
                </div>
                <Progress value={96.4} className="h-2" />

                <div className="flex justify-between items-center text-sm">
                  <span>Dock Capacity Utilization</span>
                  <span className="font-bold text-blue-600">88.2%</span>
                </div>
                <Progress value={88.2} className="h-2" />

                <div className="flex justify-between items-center text-sm">
                  <span>Average Turnaround Time per Truck</span>
                  <span className="font-bold text-purple-600">24.5 min</span>
                </div>
                <Progress value={75} className="h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Facility Performance Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Location</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>On-Time</TableHead>
                      <TableHead>Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockDeliveryLocations.map(loc => (
                      <TableRow key={loc.id}>
                        <TableCell className="font-medium text-sm">{loc.name}</TableCell>
                        <TableCell className="text-xs">{loc.capacity} Trucks/Day</TableCell>
                        <TableCell className="text-xs text-emerald-600 font-semibold">97%</TableCell>
                        <TableCell className="text-xs flex items-center gap-1 font-medium">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" /> 4.9
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ========================================================================= */}
      {/* ACTION DETAIL SHEET: VIEW ACTIVE BOOKING DETAILS (COMPLETE FLOW) */}
      {/* ========================================================================= */}
      <Sheet open={showBookingDetail} onOpenChange={setShowBookingDetail}>
        <SheetContent className="sm:max-w-4xl overflow-y-auto p-0">
          {selectedBooking && (
            <div>
              {/* Top Banner Header */}
              <div className="bg-slate-900 text-white p-6 relative">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary text-primary-foreground font-mono text-xs px-2 py-0.5">
                        {selectedBooking.id}
                      </Badge>
                      <span className="text-xs text-slate-300 font-mono">PO: {selectedBooking.poNumber || 'N/A'}</span>
                    </div>
                    <h2 className="text-2xl font-bold mt-1 text-white">{selectedBooking.supplierName}</h2>
                    <p className="text-xs text-slate-300 flex items-center gap-2 mt-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" /> Supplier ID: {selectedBooking.supplierId}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-slate-400">Current Booking Status</p>
                      <div className="mt-1">{getBookingStatusBadge(selectedBooking.status)}</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 gap-1.5"
                      onClick={() => setShowGatePassModal(true)}
                    >
                      <QrCode className="w-4 h-4 text-emerald-400" /> Print Gate Pass
                    </Button>
                  </div>
                </div>

                {/* Status Quick Action Updater Bar */}
                <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="text-slate-300 font-medium flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-primary" /> Update Delivery Milestone:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                      size="sm"
                      variant={selectedBooking.status === 'confirmed' ? 'default' : 'outline'}
                      className="h-7 text-xs bg-slate-800 hover:bg-slate-700 border-slate-700 text-white"
                      onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'confirmed')}
                    >
                      Confirmed
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedBooking.status === 'in-transit' ? 'default' : 'outline'}
                      className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'in-transit')}
                    >
                      In-Transit
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedBooking.status === 'delivered' ? 'default' : 'outline'}
                      className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'delivered')}
                    >
                      Delivered
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedBooking.status === 'delayed' ? 'default' : 'outline'}
                      className="h-7 text-xs bg-rose-600 hover:bg-rose-700 text-white"
                      onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'delayed')}
                    >
                      Delayed
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* 5-Step Delivery Lifecycle Tracker */}
                <Card className="border shadow-sm">
                  <CardHeader className="py-3 px-4 bg-muted/40 border-b">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Route className="w-4 h-4 text-primary" /> Delivery Lifecycle Pipeline Tracker
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-5 gap-2 text-center text-xs">
                      {/* Step 1 */}
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold mb-1.5 shadow-sm">
                          <Check className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">1. Approved</span>
                        <span className="text-[11px] text-muted-foreground mt-0.5">PO Verified</span>
                      </div>

                      {/* Step 2 */}
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-1.5 shadow-sm ${
                          ['confirmed', 'in-transit', 'delivered'].includes(selectedBooking.status)
                            ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          <Check className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">2. Dispatched</span>
                        <span className="text-[11px] text-muted-foreground mt-0.5">Carrier Ready</span>
                      </div>

                      {/* Step 3 */}
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-1.5 shadow-sm ${
                          selectedBooking.status === 'in-transit'
                            ? 'bg-blue-600 text-white ring-4 ring-blue-100 animate-pulse'
                            : selectedBooking.status === 'delivered'
                            ? 'bg-emerald-500 text-white'
                            : selectedBooking.status === 'delayed'
                            ? 'bg-rose-500 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          <Radio className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">3. In-Transit</span>
                        <span className="text-[11px] text-muted-foreground mt-0.5">Live Telematics</span>
                      </div>

                      {/* Step 4 */}
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-1.5 shadow-sm ${
                          selectedBooking.status === 'delivered'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          <Building2 className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">4. Gate Check-in</span>
                        <span className="text-[11px] text-muted-foreground mt-0.5">{selectedBooking.dockNumber || 'Dock 01'}</span>
                      </div>

                      {/* Step 5 */}
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-1.5 shadow-sm ${
                          selectedBooking.status === 'delivered'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">5. Offloaded</span>
                        <span className="text-[11px] text-muted-foreground mt-0.5">GRN Issued</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 3 Detail Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card 1: Facility & Location */}
                  <Card className="shadow-sm">
                    <CardHeader className="py-3 px-4 bg-muted/30 border-b">
                      <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-primary" /> Facility & Gate Assignment
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Target Location:</span>
                        <p className="font-semibold text-sm text-foreground">Main Warehouse A</p>
                      </div>
                      <div className="pt-2 border-t flex justify-between">
                        <div>
                          <span className="text-muted-foreground">Assigned Dock:</span>
                          <p className="font-bold text-primary text-sm">{selectedBooking.dockNumber || 'Dock 01'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Security Gate:</span>
                          <p className="font-bold text-foreground text-sm">{selectedBooking.gateNumber || 'Gate 1'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Card 2: Transport & Telematics */}
                  <Card className="shadow-sm">
                    <CardHeader className="py-3 px-4 bg-muted/30 border-b">
                      <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-blue-600" /> Carrier Telematics & Driver
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Driver Name & Phone:</span>
                        <p className="font-semibold text-sm text-foreground flex items-center gap-2">
                          {selectedBooking.vehicleInfo?.driverName || selectedBooking.contactPerson}
                          <a href={`tel:${selectedBooking.contactPhone}`} className="text-primary hover:underline flex items-center gap-0.5 text-xs font-normal">
                            <PhoneCall className="w-3 h-3" /> Call
                          </a>
                        </p>
                      </div>
                      <div className="pt-2 border-t flex justify-between">
                        <div>
                          <span className="text-muted-foreground">Vehicle Plate:</span>
                          <p className="font-mono font-bold text-foreground">{selectedBooking.vehicleInfo?.plateNumber || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Truck Type:</span>
                          <p className="font-medium text-foreground">{selectedBooking.vehicleInfo?.type || 'Truck'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Card 3: Live GPS Telematics */}
                  <Card className="shadow-sm border-blue-200 bg-blue-50/40">
                    <CardHeader className="py-3 px-4 bg-blue-100/50 border-b border-blue-200">
                      <CardTitle className="text-xs font-semibold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-blue-600 animate-pulse" /> Live GPS Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2 text-xs">
                      <div>
                        <span className="text-blue-700">GPS Signal:</span>
                        <p className="font-semibold text-sm text-blue-950 mt-0.5">
                          {selectedBooking.vehicleInfo?.gpsStatus || 'Active Transponder'}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-blue-200">
                        <span className="text-blue-700">ETA Window:</span>
                        <p className="font-mono font-bold text-blue-950">
                          {selectedBooking.estimatedArrival ? format(selectedBooking.estimatedArrival, 'HH:mm (MMM dd)') : 'TBD'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Cargo Items Breakdown Table */}
                <Card className="shadow-sm">
                  <CardHeader className="py-3 px-4 bg-muted/40 border-b flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary" /> Cargo & Itemized Line Items Breakdown
                    </CardTitle>
                    <Badge variant="outline" className="font-mono text-xs">
                      {selectedBooking.expectedVolume.toLocaleString()} Total Units
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-muted/20">
                        <TableRow className="text-xs">
                          <TableHead>SKU</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Total Weight</TableHead>
                          <TableHead>Handling Requirements</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedBooking.cargoItems && selectedBooking.cargoItems.length > 0 ? (
                          selectedBooking.cargoItems.map(item => (
                            <TableRow key={item.id} className="text-xs">
                              <TableCell className="font-mono font-semibold text-primary">{item.sku}</TableCell>
                              <TableCell className="font-medium text-foreground">{item.description}</TableCell>
                              <TableCell className="font-semibold">{item.quantity} {item.unit}</TableCell>
                              <TableCell className="font-mono">{item.weightKg} kg</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                                  {item.handlingTag || 'Standard'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow className="text-xs">
                            <TableCell className="font-mono font-semibold text-primary">PO-MATERIAL-01</TableCell>
                            <TableCell className="font-medium">Raw Components & Assemblies</TableCell>
                            <TableCell className="font-semibold">{selectedBooking.expectedVolume} units</TableCell>
                            <TableCell className="font-mono">1,250 kg</TableCell>
                            <TableCell><Badge variant="secondary">Standard Freight</Badge></TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Delivery Instructions Box */}
                {selectedBooking.deliveryInstructions && (
                  <Card className="bg-amber-50/50 border-amber-200 shadow-sm">
                    <CardContent className="p-4 flex gap-3 items-start">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">Special Delivery Instructions</h4>
                        <p className="text-xs text-amber-800 mt-1">{selectedBooking.deliveryInstructions}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Digital Proof of Delivery (POD) Section */}
                <Card className={`shadow-sm ${selectedBooking.proofOfDelivery ? 'border-emerald-300 bg-emerald-50/30' : 'border-dashed border-slate-300 bg-slate-50/50'}`}>
                  <CardHeader className="py-3 px-4 bg-muted/40 border-b flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-600" /> Digital Proof of Delivery (POD) Loop
                    </CardTitle>
                    {selectedBooking.proofOfDelivery ? (
                      <Badge className="bg-emerald-600 text-white gap-1 text-xs">
                        <CheckCircle className="w-3.5 h-3.5" /> POD Verified & Sealed
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-300 text-xs">
                        POD Pending Signature
                      </Badge>
                    )}
                  </CardHeader>

                  <CardContent className="p-4 space-y-4 text-xs">
                    {selectedBooking.proofOfDelivery ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Signature Display Box */}
                          <div className="bg-white border rounded-xl p-3 shadow-sm flex flex-col justify-between">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Digital Recipient Signature</span>
                            <div className="my-2 p-2 bg-slate-50 border border-slate-200 rounded flex items-center justify-center min-h-[60px]">
                              {selectedBooking.proofOfDelivery.signatureDataUrl ? (
                                <img src={selectedBooking.proofOfDelivery.signatureDataUrl} alt="Recipient Signature" className="max-h-12 object-contain" />
                              ) : (
                                <span className="font-mono text-xs italic text-slate-700 font-bold">Signed: {selectedBooking.proofOfDelivery.signedBy}</span>
                              )}
                            </div>
                            <div className="flex justify-between items-center text-[11px] text-slate-600 pt-1 border-t">
                              <span>Signee: <strong className="text-slate-900">{selectedBooking.proofOfDelivery.signedBy}</strong> ({selectedBooking.proofOfDelivery.recipientTitle})</span>
                              <span className="font-mono">{format(selectedBooking.proofOfDelivery.capturedAt, 'HH:mm (MMM dd)')}</span>
                            </div>
                          </div>

                          {/* Inspection & Notes */}
                          <div className="bg-white border rounded-xl p-3 shadow-sm space-y-2">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Receiving Inspection & Notes</span>
                            <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-200">
                              <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="font-medium text-xs">Physical Quantity & Container Seal Inspected OK</span>
                            </div>
                            {selectedBooking.proofOfDelivery.receiverNotes && (
                              <p className="text-slate-700 text-xs italic bg-slate-50 p-2 rounded border">
                                "{selectedBooking.proofOfDelivery.receiverNotes}"
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Uploaded Photo Evidence Gallery */}
                        {selectedBooking.proofOfDelivery.photoUrls && selectedBooking.proofOfDelivery.photoUrls.length > 0 && (
                          <div>
                            <span className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                              <Camera className="w-3.5 h-3.5 text-primary" /> Captured Offload Photo Evidence ({selectedBooking.proofOfDelivery.photoUrls.length} Files)
                            </span>
                            <div className="flex flex-wrap gap-3">
                              {selectedBooking.proofOfDelivery.photoUrls.map((url, idx) => (
                                <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="group relative rounded-lg overflow-hidden border border-slate-300 w-28 h-20 bg-slate-100 shadow-sm hover:ring-2 hover:ring-primary transition-all">
                                  <img src={url} alt={`POD Evidence ${idx+1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                  <span className="absolute bottom-1 right-1 bg-slate-900/80 text-white text-[9px] px-1 rounded font-mono">Photo #{idx+1}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end pt-1">
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => handleOpenPodModal(selectedBooking)}>
                            <PenTool className="w-3.5 h-3.5" /> Edit / Recapture POD
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left py-2">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 justify-center sm:justify-start">
                            <Camera className="w-4 h-4 text-primary" /> Instant Driver / Receiver Digital POD Capture
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Capture recipient digital signature and upload photo evidence upon truck offload to close delivery loop instantly.
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shrink-0"
                          onClick={() => handleOpenPodModal(selectedBooking)}
                        >
                          <FileCheck className="w-4 h-4" /> Capture Digital POD Now
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ========================================================================= */}
      {/* DIGITAL GATE PASS MODAL */}
      {/* ========================================================================= */}
      <Dialog open={showGatePassModal} onOpenChange={setShowGatePassModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" /> Digital Gate Security Pass
            </DialogTitle>
            <DialogDescription>
              Authorized entry pass for inbound delivery vehicle
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4 py-2">
              <div className="bg-white text-slate-900 border-2 border-slate-900 rounded-xl p-5 shadow-lg relative overflow-hidden">
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
                  <div>
                    <h3 className="font-black text-lg tracking-tight uppercase">Gate Pass</h3>
                    <p className="text-xs font-mono text-slate-600">SUPPLIER SPOT FREIGHT TERMINAL</p>
                  </div>
                  <Badge className="bg-emerald-600 text-white font-mono font-bold text-xs px-2.5 py-1">
                    AUTHORIZED
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 py-4 text-xs">
                  <div>
                    <span className="text-slate-500 uppercase font-semibold text-[10px] block">Supplier</span>
                    <p className="font-bold text-slate-900 truncate">{selectedBooking.supplierName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase font-semibold text-[10px] block">PO Reference</span>
                    <p className="font-mono font-bold text-slate-900">{selectedBooking.poNumber}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase font-semibold text-[10px] block">Security Gate</span>
                    <p className="font-bold text-primary">{selectedBooking.gateNumber || 'Gate 1'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase font-semibold text-[10px] block">Assigned Dock</span>
                    <p className="font-bold text-primary">{selectedBooking.dockNumber || 'Dock 01'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase font-semibold text-[10px] block">Driver</span>
                    <p className="font-semibold text-slate-900">{selectedBooking.vehicleInfo?.driverName || selectedBooking.contactPerson}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase font-semibold text-[10px] block">Vehicle License</span>
                    <p className="font-mono font-bold text-slate-900">{selectedBooking.vehicleInfo?.plateNumber}</p>
                  </div>
                </div>

                {/* Visual QR Code Box */}
                <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="w-28 h-28 bg-slate-900 p-2 rounded flex items-center justify-center">
                    <QrCode className="w-24 h-24 text-white" />
                  </div>
                  <p className="text-[11px] font-mono font-semibold text-slate-700 mt-2">
                    PASS-KEY: {selectedBooking.id}-2026-X
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowGatePassModal(false)}>Close</Button>
            <Button className="gap-1.5 bg-primary" onClick={() => {
              toast.success('Printing Digital Gate Security Pass...');
              setShowGatePassModal(false);
            }}>
              <Printer className="w-4 h-4" /> Print Pass
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG: CREATE NEW ACTIVE DELIVERY BOOKING */}
      {/* ========================================================================= */}
      <Dialog open={showAddBooking} onOpenChange={setShowAddBooking}>
        <DialogContent className="sm:max-w-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" /> Add Active Delivery Booking
            </DialogTitle>
            <DialogDescription>
              Book an active inbound delivery shipment into a master delivery slot
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateBookingSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Select Target Delivery Slot</Label>
                <Select value={newBookingForm.slotId} onValueChange={(val) => setNewBookingForm({...newBookingForm, slotId: val})}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {slots.map(s => (
                      <SelectItem key={s.id} value={s.id} className="text-xs">
                        {format(s.date, 'MMM dd')} ({s.startTime}-{s.endTime}) - {s.location.name} [{s.availableCapacity} avail]
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Supplier Name *</Label>
                <Input
                  className="h-9 text-xs"
                  placeholder="e.g. Apex Fasteners Ltd"
                  value={newBookingForm.supplierName}
                  onChange={(e) => setNewBookingForm({...newBookingForm, supplierName: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">PO Number *</Label>
                <Input
                  className="h-9 text-xs font-mono"
                  placeholder="PO-2026-0999"
                  value={newBookingForm.poNumber}
                  onChange={(e) => setNewBookingForm({...newBookingForm, poNumber: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label className="text-xs">Expected Volume (Units)</Label>
                <Input
                  type="number"
                  className="h-9 text-xs"
                  value={newBookingForm.expectedVolume}
                  onChange={(e) => setNewBookingForm({...newBookingForm, expectedVolume: Number(e.target.value)})}
                />
              </div>

              <div>
                <Label className="text-xs">Priority</Label>
                <Select value={newBookingForm.priority} onValueChange={(val: any) => setNewBookingForm({...newBookingForm, priority: val})}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Initial Status</Label>
                <Select value={newBookingForm.status} onValueChange={(val: any) => setNewBookingForm({...newBookingForm, status: val})}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="in-transit">In-Transit</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Assigned Dock Number</Label>
                <Input
                  className="h-9 text-xs"
                  placeholder="e.g. Dock 04"
                  value={newBookingForm.dockNumber}
                  onChange={(e) => setNewBookingForm({...newBookingForm, dockNumber: e.target.value})}
                />
              </div>

              <div>
                <Label className="text-xs">Security Gate</Label>
                <Input
                  className="h-9 text-xs"
                  placeholder="e.g. Gate 2"
                  value={newBookingForm.gateNumber}
                  onChange={(e) => setNewBookingForm({...newBookingForm, gateNumber: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Driver Name</Label>
                <Input
                  className="h-9 text-xs"
                  placeholder="Driver Full Name"
                  value={newBookingForm.driverName}
                  onChange={(e) => setNewBookingForm({...newBookingForm, driverName: e.target.value})}
                />
              </div>

              <div>
                <Label className="text-xs">Vehicle Plate Number</Label>
                <Input
                  className="h-9 text-xs font-mono"
                  placeholder="e.g. CA-5542"
                  value={newBookingForm.plateNumber}
                  onChange={(e) => setNewBookingForm({...newBookingForm, plateNumber: e.target.value})}
                />
              </div>

              <div>
                <Label className="text-xs">Driver Contact Phone</Label>
                <Input
                  className="h-9 text-xs"
                  placeholder="+1-555-0999"
                  value={newBookingForm.contactPhone}
                  onChange={(e) => setNewBookingForm({...newBookingForm, contactPhone: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Delivery / Unloading Instructions</Label>
              <Textarea
                className="text-xs h-20"
                placeholder="Specify crane requirement, ESD handling, temperature control settings..."
                value={newBookingForm.deliveryInstructions}
                onChange={(e) => setNewBookingForm({...newBookingForm, deliveryInstructions: e.target.value})}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setShowAddBooking(false)}>Cancel</Button>
              <Button type="submit" className="bg-primary">Confirm Booking</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG: CAPTURE / EDIT DIGITAL PROOF OF DELIVERY (POD) */}
      {/* ========================================================================= */}
      <Dialog open={showPodModal} onOpenChange={setShowPodModal}>
        <DialogContent className="sm:max-w-xl overflow-y-auto max-h-[92vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
              <FileCheck className="w-5 h-5 text-emerald-600" /> Digital Proof of Delivery (POD) Verification
            </DialogTitle>
            <DialogDescription>
              Capture driver digital signature, upload offload photo evidence & close delivery loop
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <form onSubmit={handleSavePodSubmit} className="space-y-4 text-xs">
              <div className="bg-slate-100 dark:bg-slate-800/60 p-3 rounded-lg flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedBooking.supplierName}</span>
                  <p className="text-[11px] text-muted-foreground font-mono">Ref: {selectedBooking.id} • {selectedBooking.poNumber}</p>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 font-mono text-[10px]">
                  {selectedBooking.dockNumber || 'Dock 01'}
                </Badge>
              </div>

              {/* Recipient & Role */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Signed By (Driver / Receiver Full Name) *</Label>
                  <Input
                    className="h-8 text-xs mt-1"
                    placeholder="e.g. Linus Vance / Robert Chen"
                    value={podForm.signedBy}
                    onChange={(e) => setPodForm({...podForm, signedBy: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs">Recipient Title / Role</Label>
                  <Input
                    className="h-8 text-xs mt-1"
                    placeholder="e.g. Lead QA Inspector / Receiving Lead"
                    value={podForm.recipientTitle}
                    onChange={(e) => setPodForm({...podForm, recipientTitle: e.target.value})}
                  />
                </div>
              </div>

              {/* Digital Signature Pad */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <Label className="text-xs flex items-center gap-1">
                    <PenTool className="w-3.5 h-3.5 text-primary" /> Recipient Touch / Digital Signature
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] text-slate-500 hover:text-slate-900"
                    onClick={() => {
                      setPodForm({
                        ...podForm,
                        signatureDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="260" height="60"><path d="M 15 35 Q 50 15 100 40 T 180 20 T 240 30" stroke="%230f172a" stroke-width="2.5" fill="none"/><text x="15" y="55" font-family="sans-serif" font-size="10" fill="%2364748b">Verified Touch Signature</text></svg>'
                      });
                      toast.info('Signature pad refreshed');
                    }}
                  >
                    Reset Signature
                  </Button>
                </div>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-3 bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center min-h-[90px] relative">
                  {podForm.signatureDataUrl ? (
                    <img src={podForm.signatureDataUrl} alt="Signature Preview" className="max-h-14 object-contain" />
                  ) : (
                    <span className="text-muted-foreground text-xs font-mono italic">Draw signature with stylus or touch</span>
                  )}
                  <span className="absolute bottom-1.5 right-2 text-[10px] text-slate-400 font-mono">TIMESTAMPED SIGNATURE</span>
                </div>
              </div>

              {/* Photo Evidence Upload */}
              <div>
                <Label className="text-xs flex items-center gap-1 mb-1">
                  <Camera className="w-3.5 h-3.5 text-blue-600" /> Upload Offload Photo Evidence & Bill of Lading
                </Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1 border-blue-300 bg-blue-50/50 text-blue-700 hover:bg-blue-100"
                    onClick={() => {
                      const newUrl = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80';
                      if (!podForm.photoUrls.includes(newUrl)) {
                        setPodForm({...podForm, photoUrls: [...podForm.photoUrls, newUrl]});
                        toast.success('Attached BOL Scan Photo');
                      }
                    }}
                  >
                    <UploadCloud className="w-3 h-3" /> + Attach BOL Scan
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1 border-emerald-300 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100"
                    onClick={() => {
                      const newUrl = 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=400&q=80';
                      if (!podForm.photoUrls.includes(newUrl)) {
                        setPodForm({...podForm, photoUrls: [...podForm.photoUrls, newUrl]});
                        toast.success('Attached Cargo Seal & Pallet Photo');
                      }
                    }}
                  >
                    <Camera className="w-3 h-3" /> + Attach Cargo Condition Photo
                  </Button>
                </div>

                {/* Photo Gallery Thumbnails */}
                {podForm.photoUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {podForm.photoUrls.map((url, i) => (
                      <div key={i} className="relative w-20 h-16 border rounded overflow-hidden group">
                        <img src={url} alt={`Evidence ${i}`} className="w-full h-full object-cover" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setPodForm({...podForm, photoUrls: podForm.photoUrls.filter((_, idx) => idx !== i)})}
                          className="absolute top-0.5 right-0.5 bg-rose-600 text-white rounded-full p-0.5 opacity-80 hover:opacity-100 h-auto w-auto hover:bg-rose-700 hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Delivery Inspection & Verification Status */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                <div>
                  <Label className="text-xs">Inspection Result</Label>
                  <Select value={podForm.deliveryStatus} onValueChange={(val: any) => setPodForm({...podForm, deliveryStatus: val})}>
                    <SelectTrigger className="h-8 text-xs mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="verified" className="text-xs">Verified & Sealed (100% Accepted)</SelectItem>
                      <SelectItem value="accepted_with_exceptions" className="text-xs">Accepted with Minor Exceptions</SelectItem>
                      <SelectItem value="rejected" className="text-xs">Rejected / Damaged</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <Switch
                    id="inspection-switch"
                    checked={podForm.inspectionPassed}
                    onCheckedChange={(checked) => setPodForm({...podForm, inspectionPassed: checked})}
                  />
                  <Label htmlFor="inspection-switch" className="text-xs cursor-pointer font-medium">
                    Physical Count & Seal Verification Passed
                  </Label>
                </div>
              </div>

              {/* Receiver Inspection Notes */}
              <div>
                <Label className="text-xs">Inspection Notes & Exception Comments</Label>
                <Textarea
                  className="text-xs h-16 mt-1"
                  placeholder="Record pallet count, temperature log readings, or container condition comments..."
                  value={podForm.receiverNotes}
                  onChange={(e) => setPodForm({...podForm, receiverNotes: e.target.value})}
                />
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button variant="outline" type="button" onClick={() => setShowPodModal(false)}>Cancel</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Save POD & Close Delivery Loop
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* SIDE SHEET: FULL DYNAMIC ROUTE MAP & FLEET TELEMATICS (LIGHT MODE GIS MAP) */}
      {/* ========================================================================= */}
      <Sheet open={showRouteMapModal} onOpenChange={setShowRouteMapModal}>
        <SheetContent side="right" className="sm:max-w-xl md:max-w-2xl lg:max-w-3xl w-full overflow-y-auto p-0 bg-white text-slate-900 border-l border-slate-200 shadow-2xl">
          <SheetHeader className="p-5 border-b border-slate-200 bg-slate-50/50">
            <div className="flex justify-between items-center pr-6">
              <div>
                <SheetTitle className="text-xl font-bold flex items-center gap-2 text-slate-900">
                  <MapIcon className="w-6 h-6 text-blue-600" /> Interactive Fleet Dynamic Route Planner
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                  Real-time telemetry, automated waypoint optimization & live bottleneck avoidance
                </SheetDescription>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs px-2.5 py-1 shrink-0">
                {activeRoute.trafficStatus}
              </Badge>
            </div>
          </SheetHeader>

          <div className="p-5 space-y-4">
            {/* Grid metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
                <span className="text-slate-500 block text-xs font-semibold">Active Route Path</span>
                <span className="font-semibold text-slate-900 truncate block mt-0.5">{activeRoute.title}</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
                <span className="text-slate-500 block text-xs font-semibold">Total Distance</span>
                <span className="font-bold text-emerald-700 font-mono text-sm mt-0.5">{activeRoute.totalDistanceMiles} Miles</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
                <span className="text-slate-500 block text-xs font-semibold">Est. Travel Duration</span>
                <span className="font-bold text-blue-700 font-mono text-sm mt-0.5">{activeRoute.estDurationMins} Minutes</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
                <span className="text-slate-500 block text-xs font-semibold">Est. Fuel Cost</span>
                <span className="font-bold text-amber-700 font-mono text-sm mt-0.5">${activeRoute.fuelCostUsd} USD</span>
              </div>
            </div>

            {/* Large Interactive Light Mode SVG Map */}
            <div className="w-full h-84 bg-[#eef2f6] rounded-xl border border-slate-300 relative flex items-center justify-center overflow-hidden shadow-inner">
              <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="modalLightGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                    <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                  </pattern>
                </defs>

                {/* Base Map Tile Fill */}
                <rect width="100%" height="100%" fill="#f1f5f9" />
                <rect width="100%" height="100%" fill="url(#modalLightGrid)" />

                {/* Soft Green Park Areas matching Google Maps aesthetic */}
                <path d="M 40 30 L 320 30 L 260 120 L 40 90 Z" fill="#dcfce7" stroke="#bbf7d0" strokeWidth="1.5" />
                <text x="110" y="70" fill="#15803d" fontSize="11" fontWeight="bold">🌲 Navruz Logistics Park</text>

                <path d="M 450 200 L 720 180 L 680 310 L 410 320 Z" fill="#dcfce7" stroke="#bbf7d0" strokeWidth="1.5" />
                <text x="500" y="255" fill="#15803d" fontSize="11" fontWeight="bold">🌳 Tashkent City Park</text>

                {/* Water Bodies / River */}
                <path d="M 820 0 C 780 120 840 240 790 350" fill="none" stroke="#bae6fd" strokeWidth="18" strokeLinecap="round" />
                <path d="M 820 0 C 780 120 840 240 790 350" fill="none" stroke="#0284c7" strokeWidth="2.5" strokeDasharray="8 4" />
                <text x="825" y="180" fill="#0369a1" fontSize="10" fontWeight="bold" transform="rotate(82 825 180)">Islam Karimov Waterway</text>

                {/* White Street Grid Roads */}
                <path d="M 0 120 L 860 120" fill="none" stroke="#ffffff" strokeWidth="16" />
                <path d="M 0 120 L 860 120" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />

                <path d="M 0 240 L 860 240" fill="none" stroke="#ffffff" strokeWidth="18" />
                <path d="M 0 240 L 860 240" fill="none" stroke="#cbd5e1" strokeWidth="2" />
                <text x="220" y="235" fill="#475569" fontSize="11" fontWeight="semibold">Navoi Avenue</text>

                <path d="M 200 0 L 200 350" fill="none" stroke="#ffffff" strokeWidth="14" />
                <path d="M 200 0 L 200 350" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />

                <path d="M 460 0 L 460 350" fill="none" stroke="#ffffff" strokeWidth="16" />
                <path d="M 460 0 L 460 350" fill="none" stroke="#cbd5e1" strokeWidth="2" />

                {/* Royal Blue Navigation Vector Polyline Route */}
                <path
                  d="M 200 80 L 460 80 L 460 240 L 560 240 L 560 300"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d="M 200 80 L 460 80 L 460 240 L 560 240 L 560 300"
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth="12"
                  strokeOpacity="0.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-pulse"
                />

                {/* ========================================================= */}
                {/* 1. 3D PICKUP WAREHOUSE ICON & NAME CALLOUT */}
                {/* ========================================================= */}
                <g transform="translate(180, 50)" className="cursor-pointer">
                  {/* Shadow */}
                  <ellipse cx="24" cy="40" rx="26" ry="8" fill="#94a3b8" opacity="0.4" />

                  {/* 3D Isometric Pickup Warehouse Building */}
                  <path d="M 0 18 L 24 6 L 48 18 L 48 36 L 24 48 L 0 36 Z" fill="#15803d" />
                  <path d="M 24 6 L 48 18 L 24 30 L 0 18 Z" fill="#22c55e" />
                  <path d="M 24 30 L 48 18 L 48 36 L 24 48 Z" fill="#16a34a" />

                  {/* Warehouse Loading Bay Doors */}
                  <rect x="8" y="26" width="10" height="12" fill="#052e16" rx="1.5" />
                  <rect x="30" y="26" width="10" height="12" fill="#052e16" rx="1.5" />

                  {/* 3D Pickup Badge Banner */}
                  <g transform="translate(-60, -30)">
                    <rect x="0" y="0" width="200" height="24" rx="6" fill="#15803d" stroke="#ffffff" strokeWidth="2" className="shadow-lg" />
                    <text x="10" y="16" fill="#ffffff" fontSize="11" fontWeight="bold">🏬 PICKUP: {activeRoute.origin}</text>
                  </g>
                </g>

                {/* ========================================================= */}
                {/* 2. 3D LIVE FREIGHT TRUCK ICON & DRIVER CALLOUT */}
                {/* ========================================================= */}
                <g transform="translate(435, 125)" className="cursor-pointer">
                  {/* Live Radar Ping */}
                  <circle cx="24" cy="18" r="26" fill="#3b82f6" opacity="0.3" className="animate-ping" />
                  <ellipse cx="24" cy="32" rx="22" ry="7" fill="#64748b" opacity="0.4" />

                  {/* 3D Rendered Freightliner Truck */}
                  {/* Trailer Body */}
                  <path d="M 6 10 L 30 10 L 30 26 L 6 26 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
                  <path d="M 30 10 L 38 15 L 38 31 L 30 26 Z" fill="#e2e8f0" />
                  {/* Truck Cab */}
                  <path d="M 30 16 L 42 16 L 45 22 L 45 30 L 30 30 Z" fill="#2563eb" />
                  <path d="M 34 18 L 42 18 L 43 22 L 34 22 Z" fill="#93c5fd" />
                  {/* Chrome Wheels */}
                  <circle cx="12" cy="28" r="4" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1" />
                  <circle cx="26" cy="28" r="4" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1" />
                  <circle cx="40" cy="31" r="4" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1" />

                  {/* 3D Truck Driver Callout Chip */}
                  <g transform="translate(-45, -24)">
                    <rect x="0" y="0" width="165" height="22" rx="6" fill="#1e40af" stroke="#ffffff" strokeWidth="2" className="shadow-lg" />
                    <text x="8" y="15" fill="#ffffff" fontSize="10" fontWeight="bold">🚛 TRK-8804 (Linus Vance • 54 mph)</text>
                  </g>
                </g>

                {/* ========================================================= */}
                {/* 3. 3D INTERMEDIATE WAYPOINT CONE PIN */}
                {/* ========================================================= */}
                <g transform="translate(460, 240)">
                  <ellipse cx="0" cy="10" rx="12" ry="5" fill="#94a3b8" opacity="0.4" />
                  <circle r="11" fill="#ea580c" stroke="#ffffff" strokeWidth="2.5" />
                  <text x="0" y="4" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">🚧</text>
                  <text x="16" y="4" fill="#c2410c" fontSize="10" fontWeight="bold">Waypoint: Gate B Checkpoint</text>
                </g>

                {/* ========================================================= */}
                {/* 4. 3D DELIVERY WAREHOUSE ICON & DESTINATION WAREHOUSE NAME */}
                {/* ========================================================= */}
                <g transform="translate(540, 270)" className="cursor-pointer">
                  {/* Shadow */}
                  <ellipse cx="24" cy="40" rx="26" ry="8" fill="#94a3b8" opacity="0.4" />

                  {/* 3D Isometric Delivery Warehouse Building */}
                  <path d="M 0 18 L 24 6 L 48 18 L 48 36 L 24 48 L 0 36 Z" fill="#6b21a8" />
                  <path d="M 24 6 L 48 18 L 24 30 L 0 18 Z" fill="#a855f7" />
                  <path d="M 24 30 L 48 18 L 48 36 L 24 48 Z" fill="#7e22ce" />

                  {/* Delivery Dock Doors */}
                  <rect x="10" y="26" width="10" height="12" fill="#3b0764" rx="1.5" />
                  <rect x="28" y="26" width="10" height="12" fill="#3b0764" rx="1.5" />

                  {/* 3D Delivery Badge Banner */}
                  <g transform="translate(-70, 52)">
                    <rect x="0" y="0" width="220" height="24" rx="6" fill="#6b21a8" stroke="#ffffff" strokeWidth="2" className="shadow-lg" />
                    <text x="10" y="16" fill="#ffffff" fontSize="10" fontWeight="bold">🏬 DELIVERY: {activeRoute.destination}</text>
                  </g>
                </g>
              </svg>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 border-t border-slate-200">
              <span className="text-xs text-slate-600">
                Recommended Action: <strong className="text-emerald-700">{activeRoute.recommendedAction}</strong>
              </span>
              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs" onClick={() => setShowRouteMapModal(false)}>
                  Close Sheet
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5" onClick={handleRecalculateRoute}>
                  <Compass className="w-4 h-4" /> Recalculate Route Path
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}