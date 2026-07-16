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
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import {
  Building2,
  User,
  Bell,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Plus,
  Edit,
  Calendar as CalendarIcon,
  Send,
  MessageSquare,
  BarChart3,
  Award,
  Shield,
  Truck,
  CreditCard,
  Receipt,
  Zap,
  Target,
  Users,
  Globe,
  Phone,
  Mail,
  Grid,
  List,
  Table,
  MapPin,
  Star,
  ThumbsUp,
  RefreshCw,
  ExternalLink,
  Paperclip,
  CheckSquare,
  AlertCircle,
  Info,
  ArrowUp,
  ArrowDown,
  Percent,
  Calendar as CalIcon,
  Clock3,
  FileCheck,
  Archive,
  PieChart,
  Activity,
  Layers,
  Settings,
  Settings2,
  HelpCircle,
  LogOut,
  ArrowUpDown,
  Columns,
  ChevronDown,
  GripVertical,
  Check
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Checkbox } from './ui/checkbox';
import { format, addDays, subDays } from 'date-fns';

interface SupplierProfile {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  supplierCode: string;
  registrationDate: Date;
  status: 'active' | 'pending' | 'suspended';
  tier: 'platinum' | 'gold' | 'silver' | 'bronze';
  category: string;
  region: string;
  paymentTerms: string;
  creditLimit: number;
  rating: number;
  certifications: string[];
  logo?: string;
  avatar?: string;
}

interface RFQ {
  id: string;
  rfqNumber: string;
  title: string;
  description: string;
  category: string;
  issuedDate: Date;
  submissionDeadline: Date;
  status: 'open' | 'submitted' | 'awarded' | 'rejected' | 'expired';
  estimatedValue: number;
  currency: string;
  attachments: string[];
  requirements: string[];
  quotationSubmitted?: {
    submittedAt: Date;
    totalAmount: number;
    deliveryTime: string;
    validityPeriod: string;
    notes: string;
  };
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  rfqReference?: string;
  orderDate: Date;
  deliveryDate: Date;
  status: 'created' | 'acknowledged' | 'in-progress' | 'shipped' | 'delivered' | 'completed';
  totalAmount: number;
  currency: string;
  items: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    deliveryStatus: 'pending' | 'ready' | 'shipped' | 'delivered';
  }[];
  shippingAddress: string;
  specialInstructions?: string;
  acknowledgedAt?: Date;
  estimatedShipDate?: Date;
  actualShipDate?: Date;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  poReference: string;
  submissionDate: Date;
  dueDate: Date;
  amount: number;
  currency: string;
  status: 'draft' | 'submitted' | 'in-review' | 'approved' | 'paid' | 'rejected';
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  taxAmount: number;
  totalAmount: number;
  reviewNotes?: string;
  rejectionReason?: string;
  paymentDate?: Date;
}

interface Notification {
  id: string;
  type: 'rfq' | 'po' | 'invoice' | 'payment' | 'document' | 'alert';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionRequired: boolean;
  actionUrl?: string;
}

interface ComplianceDocument {
  id: string;
  type: 'certificate' | 'license' | 'tax-document' | 'insurance' | 'audit-report';
  name: string;
  uploadDate: Date;
  expiryDate?: Date;
  status: 'valid' | 'expiring' | 'expired' | 'pending-review';
  fileUrl: string;
  reviewNotes?: string;
}

interface PerformanceMetric {
  metric: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  target?: number;
  period: string;
}

const mockSupplierProfile: SupplierProfile = {
  id: 'SUP-001',
  companyName: 'Advanced Materials Solutions Ltd',
  contactPerson: 'Sarah Chen',
  email: 'sarah.chen@advancedmaterials.com',
  phone: '+1-555-0123',
  address: '123 Industrial Drive, Manufacturing District, NY 10001',
  supplierCode: 'AMS-001',
  registrationDate: new Date('2023-01-15'),
  status: 'active',
  tier: 'gold',
  category: 'Raw Materials',
  region: 'North America',
  paymentTerms: 'Net 30',
  creditLimit: 500000,
  rating: 4.6,
  certifications: ['ISO 9001:2015', 'ISO 14001:2015', 'OHSAS 18001'],
  logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop&q=80',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&q=80'
};

const mockRFQs: RFQ[] = [
  {
    id: 'RFQ-001',
    rfqNumber: 'RFQ-2024-001234',
    title: 'Steel Components for Manufacturing Line Upgrade',
    description: 'High-grade steel components required for production line modernization project',
    category: 'Raw Materials',
    issuedDate: new Date('2024-01-15'),
    submissionDeadline: new Date('2024-01-25'),
    status: 'submitted',
    estimatedValue: 125000,
    currency: 'USD',
    attachments: ['RFQ-specs.pdf', 'technical-drawings.dwg'],
    requirements: ['ISO 9001 certified', 'Delivery within 30 days', 'Quality certificates required'],
    quotationSubmitted: {
      submittedAt: new Date('2024-01-20'),
      totalAmount: 118500,
      deliveryTime: '25 days',
      validityPeriod: '45 days',
      notes: 'Includes expedited shipping and quality inspection certificates'
    }
  },
  {
    id: 'RFQ-002',
    rfqNumber: 'RFQ-2024-001245',
    title: 'Electronic Components - Circuit Boards',
    description: 'Custom PCB manufacturing for new product line',
    category: 'Electronics',
    issuedDate: new Date('2024-01-22'),
    submissionDeadline: new Date('2024-02-05'),
    status: 'open',
    estimatedValue: 75000,
    currency: 'USD',
    attachments: ['PCB-specifications.pdf'],
    requirements: ['RoHS compliant', 'UL certified', 'Prototype samples required']
  },
  {
    id: 'RFQ-003',
    rfqNumber: 'RFQ-2024-001256',
    title: 'Packaging Materials - Q1 2024',
    description: 'Quarterly packaging materials supply contract',
    category: 'Packaging',
    issuedDate: new Date('2024-01-10'),
    submissionDeadline: new Date('2024-01-20'),
    status: 'awarded',
    estimatedValue: 45000,
    currency: 'USD',
    attachments: ['packaging-specs.pdf'],
    requirements: ['Sustainable materials', 'Bulk delivery capability']
  },
  { id: 'RFQ-004', rfqNumber: 'RFQ-2024-001267', title: 'Industrial Lubricants', description: 'Bulk supply of lubricants', category: 'Maintenance', issuedDate: subDays(new Date(), 2), submissionDeadline: addDays(new Date(), 10), status: 'open', estimatedValue: 12000, currency: 'USD', attachments: ['lub-specs.pdf'], requirements: ['Safety data sheets'] },
  { id: 'RFQ-005', rfqNumber: 'RFQ-2024-001278', title: 'Warehouse Racking System', description: 'Modular racking for new wing', category: 'Equipment', issuedDate: subDays(new Date(), 5), submissionDeadline: addDays(new Date(), 15), status: 'open', estimatedValue: 85000, currency: 'USD', attachments: ['rack-layout.dwg'], requirements: ['Installation included'] },
  { id: 'RFQ-006', rfqNumber: 'RFQ-2024-001289', title: 'Office Supplies Annual', description: 'Consolidated stationery contract', category: 'Admin', issuedDate: subDays(new Date(), 1), submissionDeadline: addDays(new Date(), 30), status: 'open', estimatedValue: 5000, currency: 'USD', attachments: ['items-list.xlsx'], requirements: ['Desk-to-desk delivery'] },
  { id: 'RFQ-007', rfqNumber: 'RFQ-2024-001290', title: 'HVAC Maintenance', description: 'Annual service contract', category: 'Services', issuedDate: subDays(new Date(), 10), submissionDeadline: subDays(new Date(), 1), status: 'expired', estimatedValue: 15000, currency: 'USD', attachments: ['service-scope.pdf'], requirements: ['Licensed techs'] },
  { id: 'RFQ-008', rfqNumber: 'RFQ-2024-001301', title: 'Safety Gear (PPE)', description: 'Hard hats, gloves, vests', category: 'Safety', issuedDate: subDays(new Date(), 3), submissionDeadline: addDays(new Date(), 7), status: 'open', estimatedValue: 8000, currency: 'USD', attachments: ['ppe-specs.pdf'], requirements: ['ANSI approved'] },
  { id: 'RFQ-009', rfqNumber: 'RFQ-2024-001312', title: 'Network Infrastructure', description: 'Fiber optic cabling', category: 'IT', issuedDate: subDays(new Date(), 4), submissionDeadline: addDays(new Date(), 12), status: 'submitted', estimatedValue: 35000, currency: 'USD', attachments: ['net-plan.pdf'], requirements: ['Warranty provided'], quotationSubmitted: { submittedAt: new Date(), totalAmount: 32400, deliveryTime: '15 days', validityPeriod: '60 days', notes: 'Using premium fiber' } },
  { id: 'RFQ-010', rfqNumber: 'RFQ-2024-001323', title: 'Cleaning Chemicals', description: 'Industrial grade detergents', category: 'Chemicals', issuedDate: subDays(new Date(), 8), submissionDeadline: addDays(new Date(), 3), status: 'open', estimatedValue: 7500, currency: 'USD', attachments: ['chem-data.pdf'], requirements: ['Eco-friendly'] }
];

const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'PO-001',
    poNumber: 'PO-2024-005678',
    rfqReference: 'RFQ-2024-001234',
    orderDate: new Date('2024-01-26'),
    deliveryDate: new Date('2024-02-20'),
    status: 'in-progress',
    totalAmount: 118500,
    currency: 'USD',
    items: [
      {
        id: 'ITEM-001',
        description: 'Steel Sheets 10mm Grade A',
        quantity: 100,
        unitPrice: 450,
        totalPrice: 45000,
        deliveryStatus: 'ready'
      },
      {
        id: 'ITEM-002',
        description: 'Steel Rods 12mm Industrial Grade',
        quantity: 200,
        unitPrice: 125,
        totalPrice: 25000,
        deliveryStatus: 'ready'
      },
      {
        id: 'ITEM-003',
        description: 'Quality Inspection & Certification',
        quantity: 1,
        unitPrice: 2500,
        totalPrice: 2500,
        deliveryStatus: 'pending'
      }
    ],
    shippingAddress: 'Manufacturing Plant A, 456 Factory Road, Industrial Zone, NY 10002',
    specialInstructions: 'Delivery to be coordinated with site manager. Loading dock hours: 8 AM - 4 PM.',
    acknowledgedAt: new Date('2024-01-26'),
    estimatedShipDate: new Date('2024-02-18')
  },
  {
    id: 'PO-002',
    poNumber: 'PO-2024-005689',
    orderDate: new Date('2024-01-12'),
    deliveryDate: new Date('2024-02-01'),
    status: 'delivered',
    totalAmount: 28500,
    currency: 'USD',
    items: [
      {
        id: 'ITEM-004',
        description: 'Packaging Materials - Corrugated Boxes',
        quantity: 1000,
        unitPrice: 12.5,
        totalPrice: 12500,
        deliveryStatus: 'delivered'
      },
      {
        id: 'ITEM-005',
        description: 'Protective Foam Inserts',
        quantity: 500,
        unitPrice: 8.5,
        totalPrice: 4250,
        deliveryStatus: 'delivered'
      }
    ],
    shippingAddress: 'Warehouse B, 789 Storage Lane, Distribution Center, NY 10003',
    acknowledgedAt: new Date('2024-01-12'),
    actualShipDate: new Date('2024-01-28')
  }
];

const mockInvoices: Invoice[] = [
  { id: 'INV-001', invoiceNumber: 'INV-AMS-2024-0034', poReference: 'PO-2024-005689', submissionDate: subDays(new Date(), 20), dueDate: addDays(new Date(), 10), amount: 16750, currency: 'USD', status: 'paid', items: [{ description: 'Boxes', quantity: 1000, unitPrice: 12.5, totalPrice: 12500 }], taxAmount: 1687.5, totalAmount: 18437.5, paymentDate: subDays(new Date(), 2) },
  { id: 'INV-002', invoiceNumber: 'INV-AMS-2024-0035', poReference: 'PO-2024-005678', submissionDate: subDays(new Date(), 5), dueDate: addDays(new Date(), 25), amount: 72500, currency: 'USD', status: 'approved', items: [{ description: 'Steel', quantity: 100, unitPrice: 450, totalPrice: 45000 }], taxAmount: 7250, totalAmount: 79750 },
  { id: 'INV-003', invoiceNumber: 'INV-AMS-2024-0036', poReference: 'PO-2024-005690', submissionDate: subDays(new Date(), 1), dueDate: addDays(new Date(), 30), amount: 5400, currency: 'USD', status: 'submitted', items: [{ description: 'Oil', quantity: 50, unitPrice: 108, totalPrice: 5400 }], taxAmount: 540, totalAmount: 5940 },
  { id: 'INV-004', invoiceNumber: 'INV-AMS-2024-0037', poReference: 'PO-2024-005691', submissionDate: subDays(new Date(), 10), dueDate: subDays(new Date(), 2), amount: 12000, currency: 'USD', status: 'rejected', items: [{ description: 'PPE', quantity: 200, unitPrice: 60, totalPrice: 12000 }], taxAmount: 1200, totalAmount: 13200, rejectionReason: 'Incorrect pricing' },
  { id: 'INV-005', invoiceNumber: 'INV-AMS-2024-0038', poReference: 'PO-2024-005692', submissionDate: new Date(), dueDate: addDays(new Date(), 30), amount: 8500, currency: 'USD', status: 'draft', items: [{ description: 'Admin set', quantity: 1, unitPrice: 8500, totalPrice: 8500 }], taxAmount: 850, totalAmount: 9350 },
  { id: 'INV-006', invoiceNumber: 'INV-AMS-2024-0039', poReference: 'PO-2024-005693', submissionDate: subDays(new Date(), 15), dueDate: addDays(new Date(), 15), amount: 25000, currency: 'USD', status: 'in-review', items: [{ description: 'Consulting', quantity: 50, unitPrice: 500, totalPrice: 25000 }], taxAmount: 2500, totalAmount: 27500 },
  { id: 'INV-007', invoiceNumber: 'INV-AMS-2024-0040', poReference: 'PO-2024-005694', submissionDate: subDays(new Date(), 30), dueDate: new Date(), amount: 15000, currency: 'USD', status: 'paid', items: [{ description: 'Parts', quantity: 10, unitPrice: 1500, totalPrice: 15000 }], taxAmount: 1500, totalAmount: 16500, paymentDate: subDays(new Date(), 5) },
  { id: 'INV-008', invoiceNumber: 'INV-AMS-2024-0041', poReference: 'PO-2024-005695', submissionDate: subDays(new Date(), 8), dueDate: addDays(new Date(), 22), amount: 9500, currency: 'USD', status: 'approved', items: [{ description: 'Lab tools', quantity: 5, unitPrice: 1900, totalPrice: 9500 }], taxAmount: 950, totalAmount: 10450 },
  { id: 'INV-009', invoiceNumber: 'INV-AMS-2024-0042', poReference: 'PO-2024-005696', submissionDate: subDays(new Date(), 12), dueDate: addDays(new Date(), 18), amount: 32000, currency: 'USD', status: 'paid', items: [{ description: 'PCB', quantity: 500, unitPrice: 64, totalPrice: 32000 }], taxAmount: 3200, totalAmount: 35200, paymentDate: subDays(new Date(), 1) },
  { id: 'INV-010', invoiceNumber: 'INV-AMS-2024-0043', poReference: 'PO-2024-005697', submissionDate: subDays(new Date(), 4), dueDate: addDays(new Date(), 26), amount: 4500, currency: 'USD', status: 'submitted', items: [{ description: 'Misc', quantity: 1, unitPrice: 4500, totalPrice: 4500 }], taxAmount: 450, totalAmount: 4950 }
];

const mockComplianceDocuments: ComplianceDocument[] = [
  { id: 'DOC-001', type: 'certificate', name: 'ISO 9001:2015 Quality Management', uploadDate: subDays(new Date(), 200), expiryDate: addDays(new Date(), 165), status: 'valid', fileUrl: '#' },
  { id: 'DOC-002', type: 'license', name: 'Manufacturing Site License', uploadDate: subDays(new Date(), 300), expiryDate: addDays(new Date(), 65), status: 'valid', fileUrl: '#' },
  { id: 'DOC-003', type: 'tax-document', name: 'Annual Tax Certificate 2023', uploadDate: subDays(new Date(), 40), status: 'valid', fileUrl: '#' },
  { id: 'DOC-004', type: 'insurance', name: 'Public Liability Insurance', uploadDate: subDays(new Date(), 350), expiryDate: addDays(new Date(), 15), status: 'expiring', fileUrl: '#' },
  { id: 'DOC-005', type: 'audit-report', name: 'Social Compliance Audit Q4', uploadDate: subDays(new Date(), 15), status: 'pending-review', fileUrl: '#' },
  { id: 'DOC-006', type: 'certificate', name: 'ISO 14001:2015 Environment', uploadDate: subDays(new Date(), 360), expiryDate: subDays(new Date(), 5), status: 'expired', fileUrl: '#' },
  { id: 'DOC-007', type: 'license', name: 'Hazardous Waste Handling', uploadDate: subDays(new Date(), 20), expiryDate: addDays(new Date(), 345), status: 'valid', fileUrl: '#' },
  { id: 'DOC-008', type: 'certificate', name: 'OHSAS 18001 Health & Safety', uploadDate: subDays(new Date(), 400), expiryDate: subDays(new Date(), 35), status: 'expired', fileUrl: '#' },
  { id: 'DOC-009', type: 'insurance', name: 'Professional Indemnity', uploadDate: subDays(new Date(), 100), expiryDate: addDays(new Date(), 265), status: 'valid', fileUrl: '#' },
  { id: 'DOC-010', type: 'tax-document', name: 'VAT Registration', uploadDate: subDays(new Date(), 500), status: 'valid', fileUrl: '#' }
];

const mockNotifications: Notification[] = [
  {
    id: 'NOT-001',
    type: 'rfq',
    title: 'New RFQ Available',
    message: 'RFQ-2024-001245 for Electronic Components has been issued',
    timestamp: new Date('2024-01-22T09:00:00'),
    read: false,
    priority: 'high',
    actionRequired: true,
    actionUrl: '/rfq/RFQ-2024-001245'
  },
  {
    id: 'NOT-002',
    type: 'po',
    title: 'Purchase Order Confirmation Required',
    message: 'PO-2024-005678 requires your acknowledgment',
    timestamp: new Date('2024-01-26T14:30:00'),
    read: false,
    priority: 'urgent',
    actionRequired: true,
    actionUrl: '/po/PO-2024-005678'
  },
  {
    id: 'NOT-003',
    type: 'payment',
    title: 'Payment Processed',
    message: 'Payment for INV-AMS-2024-0034 has been processed - $18,437.50',
    timestamp: new Date('2024-02-28T16:15:00'),
    read: true,
    priority: 'medium',
    actionRequired: false
  },
  {
    id: 'NOT-004',
    type: 'document',
    title: 'Certificate Expiring Soon',
    message: 'ISO 14001:2015 certificate expires in 30 days',
    timestamp: new Date('2024-01-20T10:00:00'),
    read: false,
    priority: 'medium',
    actionRequired: true,
    actionUrl: '/documents/compliance'
  }
];


const mockPerformanceMetrics: PerformanceMetric[] = [
  {
    metric: 'Order Fulfillment Rate',
    value: 96.5,
    unit: '%',
    trend: 'up',
    target: 95,
    period: 'Last 6 months'
  },
  {
    metric: 'On-Time Delivery Rate',
    value: 92.3,
    unit: '%',
    trend: 'stable',
    target: 95,
    period: 'Last 6 months'
  },
  {
    metric: 'Quality Score',
    value: 4.6,
    unit: '/5',
    trend: 'up',
    target: 4.5,
    period: 'Last 6 months'
  },
  {
    metric: 'Invoice Processing Time',
    value: 8.2,
    unit: 'days',
    trend: 'down',
    target: 10,
    period: 'Last 3 months'
  },
  {
    metric: 'RFQ Response Rate',
    value: 89.7,
    unit: '%',
    trend: 'up',
    target: 85,
    period: 'Last 6 months'
  },
  {
    metric: 'Payment Days Outstanding',
    value: 28.5,
    unit: 'days',
    trend: 'down',
    target: 30,
    period: 'Last 3 months'
  }
];

export const SupplierDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRFQ, setSelectedRFQ] = useState<RFQ | null>(null);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showUploadDocument, setShowUploadDocument] = useState(false);
  const [showSubmitQuotation, setShowSubmitQuotation] = useState(false);
  const [showShipmentNotification, setShowShipmentNotification] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [rfqViewMode, setRfqViewMode] = useState<'card' | 'list' | 'table'>('table');
  const [poViewMode, setPoViewMode] = useState<'card' | 'list' | 'table'>('table');
  const [invoiceViewMode, setInvoiceViewMode] = useState<'card' | 'list' | 'table'>('table');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [rfqPage, setRfqPage] = useState(1);
  const [poPage, setPoPage] = useState(1);
  const [invoicePage, setInvoicePage] = useState(1);

  const MaterialPagination = ({
    currentPage,
    totalItems,
    onPageChange
  }: {
    currentPage: number,
    totalItems: number,
    onPageChange: (page: number) => void
  }) => {
    const from = (currentPage - 1) * itemsPerPage + 1;
    const to = Math.min(currentPage * itemsPerPage, totalItems);

    return (
      <div className="flex items-center justify-end px-4 py-1 bg-card border-t text-sm text-muted-foreground gap-8">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <Select value={itemsPerPage.toString()} onValueChange={(v: string) => setItemsPerPage(parseInt(v))}>
            <SelectTrigger className="h-8 w-16 border-none shadow-none focus:ring-0 bg-transparent hover:bg-muted/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <span>{from}–{to} of {totalItems}</span>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={to >= totalItems}
            onClick={() => onPageChange(currentPage + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };
  const [complianceViewMode, setComplianceViewMode] = useState<'card' | 'list' | 'table'>('table');
  const [expandedRFQs, setExpandedRFQs] = useState<string[]>([]);

  // Seed Data State
  const [rfqs, setRFQs] = useState(mockRFQs);
  const [pos, setPOs] = useState(mockPurchaseOrders);
  const [invoices, setInvoices] = useState(mockInvoices);

  // Column Visibility State
  const [visibleColumns, setVisibleColumns] = useState({
    rfq: ['details', 'category', 'issued', 'deadline', 'value', 'status', 'actions'],
    po: ['details', 'date', 'delivery', 'amount', 'items', 'status', 'actions'],
    invoice: ['details', 'po', 'submission', 'due', 'amount', 'status', 'actions']
  });

  const toggleColumn = (table: 'rfq' | 'po' | 'invoice', col: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [table]: prev[table].includes(col)
        ? prev[table].filter(c => c !== col)
        : [...prev[table], col]
    }));
  };

  // DND Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent, type: 'rfq' | 'po' | 'invoice') => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      if (type === 'rfq') {
        setRFQs((items) => {
          const oldIndex = items.findIndex(i => i.id === active.id);
          const newIndex = items.findIndex(i => i.id === over.id);
          return arrayMove(items, oldIndex, newIndex);
        });
      } else if (type === 'po') {
        setPOs((items) => {
          const oldIndex = items.findIndex(i => i.id === active.id);
          const newIndex = items.findIndex(i => i.id === over.id);
          return arrayMove(items, oldIndex, newIndex);
        });
      } else if (type === 'invoice') {
        setInvoices((items) => {
          const oldIndex = items.findIndex(i => i.id === active.id);
          const newIndex = items.findIndex(i => i.id === over.id);
          return arrayMove(items, oldIndex, newIndex);
        });
      }
    }
  };

  const handleAcknowledgePO = (poId: string) => {
    setPOs(prev => prev.map(po => 
      po.id === poId ? { ...po, status: 'acknowledged', acknowledgedAt: new Date() } : po
    ));
    // Implementation of a notification/toast would go here
  };

  const handleSubmitQuotation = (rfqId: string, quoteData: any) => {
    setRFQs(prev => prev.map(rfq => 
      rfq.id === rfqId ? { 
        ...rfq, 
        status: 'submitted', 
        quotationSubmitted: { 
          submittedAt: new Date(),
          ...quoteData 
        } 
      } : rfq
    ));
    setShowSubmitQuotation(false);
  };

  const handleSubmitInvoice = (invoiceData: any) => {
    const newInvoice: Invoice = {
      id: `INV-NEW-${Math.random().toString(36).substr(2, 9)}`,
      submissionDate: new Date(),
      status: 'submitted',
      ...invoiceData
    };
    setInvoices(prev => [newInvoice, ...prev]);
    setShowCreateInvoice(false);
  };

  const handleUpdateShipmentStatus = (poId: string, shipmentData: any) => {
    setPOs(prev => prev.map(po => 
      po.id === poId ? { ...po, ...shipmentData, status: 'shipped' } : po
    ));
    setShowShipmentNotification(false);
  };

  const toggleRFQExpansion = (id: string) => {
    setExpandedRFQs(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Sortable Row Wrapper
  const SortableRow = ({ id, children, className }: { id: string, children: React.ReactNode, className?: string }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 50 : undefined,
      position: 'relative' as const,
      opacity: isDragging ? 0.8 : 1,
    };
    return (
      <tr ref={setNodeRef} style={style} className={className} {...attributes}>
        <td className="py-1.5 px-2 w-8 text-slate-300 hover:text-slate-600 cursor-grab active:cursor-grabbing" {...listeners}>
          <GripVertical className="w-4 h-4" />
        </td>
        {children}
      </tr>
    );
  };

  // Derived Filtered and Paged Data
  const filteredRFQs = rfqs.filter(rfq =>
    rfq.rfqNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rfq.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rfq.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const pagedRFQs = filteredRFQs.slice((rfqPage - 1) * itemsPerPage, rfqPage * itemsPerPage);

  const filteredPOs = pos.filter(po =>
    po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.items.some(item => item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const pagedPOs = filteredPOs.slice((poPage - 1) * itemsPerPage, poPage * itemsPerPage);

  const filteredInvoices = invoices.filter(inv =>
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.poReference.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const pagedInvoices = filteredInvoices.slice((invoicePage - 1) * itemsPerPage, invoicePage * itemsPerPage);

  const filteredDocs = mockComplianceDocuments.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Manage Columns Trigger Component
  const ManageColumnsTrigger = ({ table, columns }: { table: 'rfq' | 'po' | 'invoice', columns: { id: string, label: string }[] }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" title="Manage Columns">
          <Columns className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="z-50 w-56 bg-white p-4 rounded-lg shadow-xl border border-slate-200 animate-in fade-in zoom-in duration-200">
        <h4 className="font-semibold text-sm mb-3">Visible Columns</h4>
        <div className="space-y-2">
          {columns.map(col => (
            <div key={col.id} className="flex items-center gap-3">
              <Checkbox
                id={`${table}-${col.id}`}
                checked={visibleColumns[table].includes(col.id)}
                onCheckedChange={() => toggleColumn(table, col.id)}
              />
              <label htmlFor={`${table}-${col.id}`} className="text-sm font-medium leading-none cursor-pointer">
                {col.label}
              </label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': case 'created': case 'pending': case 'draft':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'submitted': case 'in-progress': case 'acknowledged': case 'in-review':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'awarded': case 'approved': case 'delivered': case 'completed': case 'paid': case 'valid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': case 'expired': case 'suspended':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'active': case 'ready': case 'shipped':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'expiring':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'gold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'silver':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'bronze':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const unreadNotifications = mockNotifications.filter(n => !n.read).length;
  const urgentNotifications = mockNotifications.filter(n => n.priority === 'urgent' && !n.read).length;

  return (
    <div className="p-4 pt-2 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center bg-transparent py-2 px-0">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Supplier Portal</h1>
        </div>
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 min-w-5 flex items-center justify-center p-0 rounded-full">
                    {unreadNotifications}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-sm">Notifications & Alerts</h4>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 text-sm">
                {mockNotifications.length > 0 ? mockNotifications.map((notif) => (
                  <div key={notif.id} className={`p-3 border rounded-lg flex items-start gap-3 ${!notif.read ? 'bg-muted/50 border-primary/20' : ''}`}>
                    <div className={`mt-0.5 p-1.5 rounded-full ${getPriorityColor(notif.priority)}`}>
                      {notif.priority === 'urgent' ? <AlertTriangle className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-semibold text-sm leading-none">{notif.title}</p>
                      <p className="text-muted-foreground text-xs">{notif.message}</p>
                      <p className="text-[10px] text-muted-foreground">{format(notif.timestamp, 'MMM dd, HH:mm')}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-muted-foreground text-sm py-4">No notifications</p>
                )}
              </div>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="relative hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-200">
                <Zap className="w-5 h-5 text-yellow-500" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="end">
              <div className="mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <h4 className="font-semibold text-sm">Quick Actions</h4>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="h-auto flex-col gap-2 p-3 text-xs hover:border-primary hover:text-primary transition-colors"
                  onClick={() => setShowSubmitQuotation(true)}
                >
                  <Send className="w-4 h-4" />
                  Submit Quote
                </Button>
                <Button
                  variant="outline"
                  className="h-auto flex-col gap-2 p-3 text-xs hover:border-primary hover:text-primary transition-colors"
                  onClick={() => setShowCreateInvoice(true)}
                >
                  <Receipt className="w-4 h-4" />
                  Create Invoice
                </Button>
                <Button
                  variant="outline"
                  className="h-auto flex-col gap-2 p-3 text-xs hover:border-primary hover:text-primary transition-colors"
                  onClick={() => setShowShipmentNotification(true)}
                >
                  <Truck className="w-4 h-4" />
                  Update Shipment
                </Button>
                <Button
                  variant="outline"
                  className="h-auto flex-col gap-2 p-3 text-xs hover:border-primary hover:text-primary transition-colors"
                  onClick={() => setShowUploadDocument(true)}
                >
                  <Upload className="w-4 h-4" />
                  Upload Document
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-2 p-3 text-xs hover:border-primary hover:text-primary transition-colors">
                  <Download className="w-4 h-4" />
                  Download Reports
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-2 p-3 text-xs hover:border-primary hover:text-primary transition-colors">
                  <MessageSquare className="w-4 h-4" />
                  Contact Support
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="relative hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200">
                <BarChart3 className="w-5 h-5 text-blue-500" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[340px]" align="end">
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                <h4 className="font-semibold text-sm">Key Business Metrics</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border rounded-lg bg-slate-50">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs text-muted-foreground font-medium">Open RFQs</p>
                    <Target className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="text-xl font-bold text-blue-600">{mockRFQs.filter(rfq => rfq.status === 'open').length}</p>
                  <p className="text-[10px] text-blue-600">Awaiting response</p>
                </div>
                <div className="p-3 border rounded-lg bg-slate-50">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs text-muted-foreground font-medium">Active POs</p>
                    <Package className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-xl font-bold text-green-600">{mockPurchaseOrders.filter(po => ['acknowledged', 'in-progress', 'shipped'].includes(po.status)).length}</p>
                  <p className="text-[10px] text-green-600">In progress</p>
                </div>
                <div className="p-3 border rounded-lg bg-slate-50">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs text-muted-foreground font-medium">Pending Invoices</p>
                    <Receipt className="w-4 h-4 text-orange-500" />
                  </div>
                  <p className="text-xl font-bold text-orange-600">{mockInvoices.filter(inv => ['submitted', 'in-review', 'approved'].includes(inv.status)).length}</p>
                  <p className="text-[10px] text-orange-600">Processing</p>
                </div>
                <div className="p-3 border rounded-lg bg-slate-50">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs text-muted-foreground font-medium">Payment Status</p>
                    <CreditCard className="w-4 h-4 text-purple-500" />
                  </div>
                  <p className="text-xl font-bold text-purple-600">$98.2K</p>
                  <p className="text-[10px] text-purple-600">Outstanding</p>
                </div>
                <div className="p-3 border rounded-lg bg-slate-50">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs text-muted-foreground font-medium">Performance</p>
                    <Award className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-xl font-bold text-green-600">96.5%</p>
                  <p className="text-[10px] text-green-600 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Fulfillment rate</p>
                </div>
                <div className="p-3 border rounded-lg bg-slate-50">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs text-muted-foreground font-medium">Compliance</p>
                    <Shield className="w-4 h-4 text-yellow-500" />
                  </div>
                  <p className="text-xl font-bold text-yellow-600">1</p>
                  <p className="text-[10px] text-yellow-600">Expiring soon</p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="icon">
            <HelpCircle className="w-5 h-5" />
          </Button>
          <Button variant="outline" size="icon">
            <Settings className="w-5 h-5" />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 p-0 hover:bg-slate-100 transition-all overflow-hidden ring-1 ring-slate-200">
                {mockSupplierProfile.avatar ? (
                  <img src={mockSupplierProfile.avatar} alt="User Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-xs">
                    {mockSupplierProfile.contactPerson.charAt(0)}
                  </div>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="relative h-20 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-t-lg">
                <div className="absolute -bottom-6 left-6">
                  <div className="w-16 h-16 rounded-xl bg-white p-1 shadow-lg border border-slate-100 overflow-hidden">
                    {mockSupplierProfile.logo ? (
                      <img src={mockSupplierProfile.logo} alt="Company Logo" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 rounded-lg text-slate-400 font-bold text-xl">
                        {mockSupplierProfile.companyName.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="pt-8 pb-4 px-6">
                <div className="mb-4">
                  <h3 className="font-bold text-lg leading-none mb-1">{mockSupplierProfile.companyName}</h3>
                  <p className="text-xs text-muted-foreground font-mono">{mockSupplierProfile.supplierCode}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Tier Level</p>
                    <Badge className={`${getTierColor(mockSupplierProfile.tier)} w-full justify-center text-[10px] py-0`}>
                      {mockSupplierProfile.tier.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Supplier Rating</p>
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold text-sm">{mockSupplierProfile.rating}</span>
                      <span className="text-[10px] text-muted-foreground">/5.0</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground leading-none mb-1">Primary Representative</p>
                      <p className="font-medium text-xs font-semibold">{mockSupplierProfile.contactPerson}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[10px] text-muted-foreground leading-none mb-1">Contact Email</p>
                      <p className="font-medium text-xs truncate font-semibold">{mockSupplierProfile.email}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t flex gap-2">
                  <Button variant="ghost" size="sm" className="w-full text-xs hover:bg-slate-50">
                    <Settings2 className="w-3.5 h-3.5 mr-2" />
                    Edit Profile
                  </Button>
                  <Button variant="outline" size="sm" className="w-full text-xs border-slate-200">
                    <LogOut className="w-3.5 h-3.5 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>


      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rfq">RFQs & Quotes</TabsTrigger>
          <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="shipments">Shipments</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Target className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">New RFQ Available</p>
                      <p className="text-sm text-muted-foreground">RFQ-2024-001245 for Electronic Components</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">Action Required</Badge>
                  </div>

                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Payment Received</p>
                      <p className="text-sm text-muted-foreground">INV-AMS-2024-0034 - $18,437.50</p>
                      <p className="text-xs text-muted-foreground">1 day ago</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <Package className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">PO Acknowledgment Required</p>
                      <p className="text-sm text-muted-foreground">PO-2024-005678 - $118,500</p>
                      <p className="text-xs text-muted-foreground">2 days ago</p>
                    </div>
                    <Badge className="bg-orange-100 text-orange-800">Pending</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockPerformanceMetrics.slice(0, 4).map((metric, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{metric.metric}</span>
                        <div className="flex items-center gap-2">
                          {metric.trend === 'up' ? (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          ) : metric.trend === 'down' ? (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          ) : (
                            <div className="w-4 h-4" />
                          )}
                          <span className="font-medium">
                            {metric.value}{metric.unit}
                          </span>
                        </div>
                      </div>
                      {metric.target && (
                        <div className="space-y-1">
                          <Progress
                            value={metric.unit === '%' ? metric.value : (metric.value / metric.target) * 100}
                            className="h-2"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Target: {metric.target}{metric.unit}</span>
                            <span>{metric.period}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* RFQs & Quotations Tab */}
        <TabsContent value="rfq" className="space-y-2">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">RFQs & Quotations</h3>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search RFQs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <ManageColumnsTrigger
                table="rfq"
                columns={[
                  { id: 'details', label: 'RFQ Details' },
                  { id: 'category', label: 'Category' },
                  { id: 'issued', label: 'Issued Date' },
                  { id: 'deadline', label: 'Deadline' },
                  { id: 'value', label: 'Estimated Value' },
                  { id: 'status', label: 'Status' },
                  { id: 'actions', label: 'Actions' }
                ]}
              />
              <div className="flex items-center border rounded-md">
                <Button
                  variant={rfqViewMode === 'card' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setRfqViewMode('card')}
                  className="rounded-r-none"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={rfqViewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setRfqViewMode('list')}
                  className="rounded-none border-l border-r"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={rfqViewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setRfqViewMode('table')}
                  className="rounded-l-none"
                >
                  <Table className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Card View (Default) */}
          {rfqViewMode === 'card' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {pagedRFQs.map((rfq) => (
                <Card key={rfq.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{rfq.rfqNumber}</CardTitle>
                        <p className="text-sm text-muted-foreground">{rfq.category}</p>
                      </div>
                      <Badge className={getStatusColor(rfq.status)}>
                        {rfq.status.replace('-', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-1">{rfq.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">{rfq.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Issued:</span>
                        <p className="font-medium">{format(rfq.issuedDate, 'MMM dd, yyyy')}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Deadline:</span>
                        <p className="font-medium">{format(rfq.submissionDeadline, 'MMM dd, yyyy')}</p>
                      </div>
                    </div>

                    <div className="text-sm">
                      <span className="text-muted-foreground">Estimated Value:</span>
                      <p className="font-medium">{rfq.currency} {rfq.estimatedValue.toLocaleString()}</p>
                    </div>

                    {rfq.quotationSubmitted && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded">
                        <p className="text-sm font-medium text-green-800">Quotation Submitted</p>
                        <p className="text-xs text-green-600">
                          Amount: {rfq.currency} {rfq.quotationSubmitted.totalAmount.toLocaleString()}
                        </p>
                        <p className="text-xs text-green-600">
                          Submitted: {format(rfq.quotationSubmitted.submittedAt, 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t">
                      <div className="flex items-center gap-2">
                        {rfq.attachments.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <Paperclip className="w-3 h-3 mr-1" />
                            {rfq.attachments.length} files
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {rfq.status === 'open' && !rfq.quotationSubmitted && (
                          <Button size="sm" variant="ghost" onClick={() => setShowSubmitQuotation(true)}>
                            <Send className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedRFQ(rfq)}
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
          {rfqViewMode === 'list' && (
            <div className="space-y-3">
              {pagedRFQs.map((rfq) => (
                <Card key={rfq.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-semibold">{rfq.rfqNumber}</p>
                        <Badge className={getStatusColor(rfq.status)}>
                          {rfq.status.replace('-', ' ')}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {rfq.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{rfq.title}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          <span>Issued: {format(rfq.issuedDate, 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>Deadline: {format(rfq.submissionDeadline, 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span>{rfq.currency} {rfq.estimatedValue.toLocaleString()}</span>
                        </div>
                      </div>
                      {rfq.quotationSubmitted && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                          <p className="text-xs font-medium text-green-800">
                            Quotation Submitted: {rfq.currency} {rfq.quotationSubmitted.totalAmount.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {rfq.attachments.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Paperclip className="w-3 h-3 mr-1" />
                          {rfq.attachments.length}
                        </Badge>
                      )}
                      {rfq.status === 'open' && !rfq.quotationSubmitted && (
                        <Button size="sm" variant="ghost" onClick={() => setShowSubmitQuotation(true)}>
                          <Send className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedRFQ(rfq)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Table View */}
          {rfqViewMode === 'table' && (
            <Card className="gap-0">
              <div className="overflow-x-auto relative">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'rfq')}>
                  <table className="w-full min-w-[850px]">
                    <thead>
                      <tr className="border-b bg-card">
                        <th className="w-8"></th>
                        {visibleColumns.rfq.includes('details') && (
                          <th className="text-left p-2 font-medium sticky left-0 z-20 bg-card shadow-[2px_0_0_rgba(0,0,0,0.05)] cursor-pointer hover:bg-muted transition-colors whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              RFQ Details
                              <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                            </div>
                          </th>
                        )}
                        {visibleColumns.rfq.includes('category') && (
                          <th className="text-left p-2 font-medium cursor-pointer hover:bg-muted transition-colors whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              Category
                              <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                            </div>
                          </th>
                        )}
                        {visibleColumns.rfq.includes('issued') && (
                          <th className="text-left p-2 font-medium cursor-pointer hover:bg-muted transition-colors whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              Issued
                              <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                            </div>
                          </th>
                        )}
                        {visibleColumns.rfq.includes('deadline') && (
                          <th className="text-left p-2 font-medium cursor-pointer hover:bg-muted transition-colors whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              Deadline
                              <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                            </div>
                          </th>
                        )}
                        {visibleColumns.rfq.includes('value') && (
                          <th className="text-left p-2 font-medium cursor-pointer hover:bg-muted transition-colors whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              Est. Value
                              <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                            </div>
                          </th>
                        )}
                        {visibleColumns.rfq.includes('status') && (
                          <th className="text-left p-2 font-medium cursor-pointer hover:bg-muted transition-colors whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              Status
                              <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                            </div>
                          </th>
                        )}
                        {visibleColumns.rfq.includes('actions') && (
                          <th className="text-left p-2 font-medium sticky right-0 z-20 bg-card shadow-[-2px_0_0_rgba(0,0,0,0.05)] whitespace-nowrap w-24">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <SortableContext items={filteredRFQs.map(r => r.id)} strategy={verticalListSortingStrategy}>
                      <tbody>
                        {pagedRFQs.map((rfq) => (
                          <React.Fragment key={rfq.id}>
                            <SortableRow id={rfq.id} className="border-b hover:bg-muted/50 group bg-card">
                              {visibleColumns.rfq.includes('details') && (
                                <td
                                  className="p-2 sticky left-0 z-10 bg-card group-hover:bg-muted shadow-[2px_0_0_rgba(0,0,0,0.05)] transition-colors cursor-pointer"
                                  onClick={() => toggleRFQExpansion(rfq.id)}
                                >
                                  <div className="flex items-center gap-2">
                                    {expandedRFQs.includes(rfq.id) ? (
                                      <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="w-3 h-3 text-muted-foreground" />
                                    )}
                                    <p className="font-medium text-sm">{rfq.rfqNumber}</p>
                                  </div>
                                </td>
                              )}
                              {visibleColumns.rfq.includes('category') && (
                                <td className="py-1.5 px-2">
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                    {rfq.category}
                                  </Badge>
                                </td>
                              )}
                              {visibleColumns.rfq.includes('issued') && (
                                <td className="py-1.5 px-2">
                                  <span className="text-xs">{format(rfq.issuedDate, 'MMM dd, yy')}</span>
                                </td>
                              )}
                              {visibleColumns.rfq.includes('deadline') && (
                                <td className="py-1.5 px-2">
                                  <span className="text-xs">{format(rfq.submissionDeadline, 'MMM dd, yy')}</span>
                                </td>
                              )}
                              {visibleColumns.rfq.includes('value') && (
                                <td className="py-1.5 px-2">
                                  <p className="font-semibold text-xs">{rfq.currency} {rfq.estimatedValue.toLocaleString()}</p>
                                </td>
                              )}
                              {visibleColumns.rfq.includes('status') && (
                                <td className="py-1.5 px-2">
                                  <Badge className={`${getStatusColor(rfq.status)} text-[10px] px-1.5 py-0`}>
                                    {rfq.status.replace('-', ' ')}
                                  </Badge>
                                </td>
                              )}
                              {visibleColumns.rfq.includes('actions') && (
                                <td className="p-2 sticky right-0 z-10 bg-card group-hover:bg-muted shadow-[-2px_0_0_rgba(0,0,0,0.05)] transition-colors w-24">
                                  <div className="flex items-center gap-1">
                                    {rfq.attachments.length > 0 && (
                                      <Badge variant="outline" className="p-1 h-6 w-6 flex items-center justify-center">
                                        <Paperclip className="w-3 h-3" />
                                      </Badge>
                                    )}
                                    {rfq.status === 'open' && !rfq.quotationSubmitted && (
                                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setShowSubmitQuotation(true)}>
                                        <Send className="w-3.5 h-3.5" />
                                      </Button>
                                    )}
                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSelectedRFQ(rfq)}>
                                      <Eye className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                </td>
                              )}
                            </SortableRow>
                            {expandedRFQs.includes(rfq.id) && (
                              <tr className="bg-slate-50/80 border-b">
                                <td colSpan={visibleColumns.rfq.length + 1} className="p-3 pl-10 sticky left-0 bg-slate-50/50">
                                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                    <p className="text-xs font-semibold text-slate-900">{rfq.title}</p>
                                    {rfq.quotationSubmitted && (
                                      <p className="text-xs text-green-600 mt-1 font-medium italic">
                                        Quote: {rfq.currency} {rfq.quotationSubmitted.totalAmount.toLocaleString()}
                                      </p>
                                    )}
                                    <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed max-w-2xl">{rfq.description}</p>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </SortableContext>
                  </table>
                </DndContext>
              </div>
              <MaterialPagination
                currentPage={rfqPage}
                totalItems={filteredRFQs.length}
                onPageChange={setRfqPage}
              />
            </Card>
          )}
        </TabsContent>

        {/* Purchase Orders Tab */}
        <TabsContent value="orders" className="space-y-2">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Purchase Orders</h3>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center border rounded-md">
                <Button
                  variant={poViewMode === 'card' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPoViewMode('card')}
                  className="rounded-r-none"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={poViewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPoViewMode('list')}
                  className="rounded-none border-l border-r"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={poViewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPoViewMode('table')}
                  className="rounded-l-none"
                >
                  <Table className="w-4 h-4" />
                </Button>
              </div>
              <ManageColumnsTrigger
                table="po"
                columns={[
                  { id: 'details', label: 'PO Details' },
                  { id: 'date', label: 'Order Date' },
                  { id: 'delivery', label: 'Delivery Date' },
                  { id: 'amount', label: 'Total Amount' },
                  { id: 'items', label: 'Items' },
                  { id: 'status', label: 'Status' },
                  { id: 'actions', label: 'Actions' }
                ]}
              />
              <Button variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Table View (Default) */}
          {poViewMode === 'table' && (
            <Card className="gap-0">
              <div className="overflow-x-auto">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'po')}>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-card">
                        <th className="w-8"></th>
                        {visibleColumns.po.includes('details') && (
                          <th className="text-left p-2 font-medium cursor-pointer hover:bg-muted transition-colors whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              PO Details
                              <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                            </div>
                          </th>
                        )}
                        {visibleColumns.po.includes('date') && (
                          <th className="text-left p-2 font-medium cursor-pointer hover:bg-muted transition-colors whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              Order Date
                              <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                            </div>
                          </th>
                        )}
                        {visibleColumns.po.includes('delivery') && (
                          <th className="text-left p-2 font-medium cursor-pointer hover:bg-muted transition-colors whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              Delivery Date
                              <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                            </div>
                          </th>
                        )}
                        {visibleColumns.po.includes('amount') && (
                          <th className="text-left p-2 font-medium cursor-pointer hover:bg-muted transition-colors whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              Total Amount
                              <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                            </div>
                          </th>
                        )}
                        {visibleColumns.po.includes('items') && (
                          <th className="text-left p-2 font-medium cursor-pointer hover:bg-muted transition-colors whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              Items
                              <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                            </div>
                          </th>
                        )}
                        {visibleColumns.po.includes('status') && (
                          <th className="text-left p-2 font-medium cursor-pointer hover:bg-muted transition-colors whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              Status
                              <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                            </div>
                          </th>
                        )}
                        {visibleColumns.po.includes('actions') && (
                          <th className="text-left p-2 font-medium whitespace-nowrap w-24">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <SortableContext items={filteredPOs.map(p => p.id)} strategy={verticalListSortingStrategy}>
                      <tbody>
                        {pagedPOs.map((po) => (
                          <SortableRow key={po.id} id={po.id} className="border-b hover:bg-muted/50 bg-card">
                            {visibleColumns.po.includes('details') && (
                              <td className="py-1.5 px-2">
                                <div>
                                  <p className="font-medium text-sm">{po.poNumber}</p>
                                  {po.rfqReference && (
                                    <p className="text-[10px] text-muted-foreground">RFQ: {po.rfqReference}</p>
                                  )}
                                </div>
                              </td>
                            )}
                            {visibleColumns.po.includes('date') && (
                              <td className="py-1.5 px-2">
                                <span className="text-xs">{format(po.orderDate, 'MMM dd, yy')}</span>
                              </td>
                            )}
                            {visibleColumns.po.includes('delivery') && (
                              <td className="py-1.5 px-2">
                                <span className="text-xs">{format(po.deliveryDate, 'MMM dd, yy')}</span>
                              </td>
                            )}
                            {visibleColumns.po.includes('amount') && (
                              <td className="py-1.5 px-2">
                                <p className="font-semibold text-xs">{po.currency} {po.totalAmount.toLocaleString()}</p>
                              </td>
                            )}
                            {visibleColumns.po.includes('items') && (
                              <td className="py-1.5 px-2">
                                <span className="text-xs">{po.items.length} items</span>
                              </td>
                            )}
                            {visibleColumns.po.includes('status') && (
                              <td className="py-1.5 px-2">
                                <Badge className={`${getStatusColor(po.status)} text-[10px] px-1.5 py-0`}>
                                  {po.status.replace('-', ' ')}
                                </Badge>
                              </td>
                            )}
                            {visibleColumns.po.includes('actions') && (
                              <td className="p-2 w-24">
                                <div className="flex items-center gap-1">
                                  {po.status === 'created' && (
                                    <Button size="icon" variant="ghost" className="h-7 w-7" title="Acknowledge">
                                      <CheckCircle className="w-3.5 h-3.5" />
                                    </Button>
                                  )}
                                  {['acknowledged', 'in-progress'].includes(po.status) && (
                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setShowShipmentNotification(true)} title="Update">
                                      <Truck className="w-3.5 h-3.5" />
                                    </Button>
                                  )}
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSelectedPO(po)}>
                                    <Eye className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </td>
                            )}
                          </SortableRow>
                        ))}
                      </tbody>
                    </SortableContext>
                  </table>
                </DndContext>
              </div>
              <MaterialPagination
                currentPage={poPage}
                totalItems={filteredPOs.length}
                onPageChange={setPoPage}
              />
            </Card>
          )}

          {/* List View */}
          {poViewMode === 'list' && (
            <div className="space-y-3">
              {pagedPOs.map((po) => (
                <Card key={po.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-semibold">{po.poNumber}</p>
                        <Badge className={getStatusColor(po.status)}>
                          {po.status.replace('-', ' ')}
                        </Badge>
                        {po.rfqReference && (
                          <Badge variant="outline" className="text-xs">
                            RFQ: {po.rfqReference}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          <span>Order: {format(po.orderDate, 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>Delivery: {format(po.deliveryDate, 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span>{po.currency} {po.totalAmount.toLocaleString()}</span>
                        </div>
                        <span>{po.items.length} items</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {po.status === 'created' && (
                        <Button size="sm" onClick={() => handleAcknowledgePO(po.id)}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Acknowledge
                        </Button>
                      )}
                      {['acknowledged', 'in-progress'].includes(po.status) && (
                        <Button size="sm" onClick={() => setShowShipmentNotification(true)}>
                          <Truck className="w-4 h-4 mr-2" />
                          Update
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => setSelectedPO(po)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Card View */}
          {poViewMode === 'card' && (
            <div className="space-y-4">
              {pagedPOs.map((po) => (
                <Card key={po.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{po.poNumber}</CardTitle>
                        {po.rfqReference && (
                          <p className="text-sm text-muted-foreground">RFQ: {po.rfqReference}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(po.status)}>
                          {po.status.replace('-', ' ')}
                        </Badge>
                        <Button size="sm" variant="ghost" onClick={() => setSelectedPO(po)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Order Date:</span>
                        <p className="font-medium">{format(po.orderDate, 'MMM dd, yyyy')}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Delivery Date:</span>
                        <p className="font-medium">{format(po.deliveryDate, 'MMM dd, yyyy')}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Total Amount:</span>
                        <p className="font-medium">{po.currency} {po.totalAmount.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Items ({po.items.length})</h4>
                      {po.items.slice(0, 2).map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-2 bg-muted rounded">
                          <div>
                            <p className="font-medium text-sm">{item.description}</p>
                            <p className="text-xs text-muted-foreground">
                              Qty: {item.quantity} × {po.currency} {item.unitPrice}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">{po.currency} {item.totalPrice.toLocaleString()}</p>
                            <Badge variant="outline" className={getStatusColor(item.deliveryStatus)}>
                              {item.deliveryStatus}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {po.items.length > 2 && (
                        <p className="text-sm text-muted-foreground text-center">
                          +{po.items.length - 2} more items
                        </p>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        {po.acknowledgedAt ? (
                          <span>Acknowledged: {format(po.acknowledgedAt, 'MMM dd, yyyy')}</span>
                        ) : (
                          <span>Acknowledgment Required</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {po.status === 'created' && (
                          <Button size="sm">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Acknowledge
                          </Button>
                        )}
                        {['acknowledged', 'in-progress'].includes(po.status) && (
                          <Button size="sm" onClick={() => setShowShipmentNotification(true)}>
                            <Truck className="w-4 h-4 mr-2" />
                            Update Shipment
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4 mr-2" />
                          Download PO
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Shipments Tab */}
        <TabsContent value="shipments" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Shipment Management</h3>
              <p className="text-sm text-muted-foreground">Update material readiness and shipping information</p>
            </div>
            <Button onClick={() => setShowShipmentNotification(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Shipment Update
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {mockPurchaseOrders.filter(po => ['acknowledged', 'in-progress', 'shipped'].includes(po.status)).map((po) => (
              <Card key={po.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">Shipment for {po.poNumber}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Delivery due: {format(po.deliveryDate, 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <Badge className={getStatusColor(po.status)}>
                      {po.status.replace('-', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Items Ready:</span>
                      <p className="font-medium">
                        {po.items.filter(item => item.deliveryStatus === 'ready').length} of {po.items.length}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Estimated Ship:</span>
                      <p className="font-medium">
                        {po.estimatedShipDate ? format(po.estimatedShipDate, 'MMM dd') : 'TBD'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Material Status</h4>
                    {po.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <p className="font-medium text-sm">{item.description}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <Badge variant="outline" className={getStatusColor(item.deliveryStatus)}>
                          {item.deliveryStatus}
                        </Badge>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Last updated: {format(po.acknowledgedAt || po.orderDate, 'MMM dd, HH:mm')}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Docs
                      </Button>
                      <Button size="sm" onClick={() => setShowShipmentNotification(true)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Update Status
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-2">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Invoice Management</h3>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center border rounded-md">
                <Button
                  variant={invoiceViewMode === 'card' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setInvoiceViewMode('card')}
                  className="rounded-r-none"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={invoiceViewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setInvoiceViewMode('list')}
                  className="rounded-none border-l border-r"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={invoiceViewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setInvoiceViewMode('table')}
                  className="rounded-l-none"
                >
                  <Table className="w-4 h-4" />
                </Button>
              </div>
              <ManageColumnsTrigger
                table="invoice"
                columns={[
                  { id: 'details', label: 'Invoice Details' },
                  { id: 'po', label: 'PO Reference' },
                  { id: 'submission', label: 'Submission Date' },
                  { id: 'due', label: 'Due Date' },
                  { id: 'amount', label: 'Amount' },
                  { id: 'status', label: 'Status' },
                  { id: 'actions', label: 'Actions' }
                ]}
              />
              <Button variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Table View */}
          {invoiceViewMode === 'table' && (
            <Card className="gap-0">
              <div className="overflow-x-auto">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'invoice')}>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-card">
                        <th className="w-8"></th>
                        {visibleColumns.invoice.includes('details') && (
                          <th className="text-left p-2 font-medium cursor-pointer hover:bg-muted transition-colors whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              Invoice Details
                              <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                            </div>
                          </th>
                        )}
                        {visibleColumns.invoice.includes('po') && (
                          <th className="text-left p-2 font-medium cursor-pointer hover:bg-muted transition-colors whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              PO Reference
                              <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                            </div>
                          </th>
                        )}
                        {visibleColumns.invoice.includes('submission') && (
                          <th className="text-left p-2 font-medium cursor-pointer hover:bg-muted transition-colors whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              Submission Date
                              <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                            </div>
                          </th>
                        )}
                        {visibleColumns.invoice.includes('due') && (
                          <th className="text-left p-2 font-medium cursor-pointer hover:bg-muted transition-colors whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              Due Date
                              <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                            </div>
                          </th>
                        )}
                        {visibleColumns.invoice.includes('amount') && (
                          <th className="text-left p-2 font-medium cursor-pointer hover:bg-muted transition-colors whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              Amount
                              <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                            </div>
                          </th>
                        )}
                        {visibleColumns.invoice.includes('status') && (
                          <th className="text-left p-2 font-medium cursor-pointer hover:bg-muted transition-colors whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              Status
                              <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                            </div>
                          </th>
                        )}
                        {visibleColumns.invoice.includes('actions') && (
                          <th className="text-left p-2 font-medium whitespace-nowrap w-24">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <SortableContext items={invoices.map(i => i.id)} strategy={verticalListSortingStrategy}>
                      <tbody>
                        {invoices.slice((invoicePage - 1) * itemsPerPage, invoicePage * itemsPerPage).map((invoice) => (
                          <SortableRow key={invoice.id} id={invoice.id} className="border-b hover:bg-muted/50 bg-card">
                            {visibleColumns.invoice.includes('details') && (
                              <td className="py-1.5 px-2">
                                <div>
                                  <p className="font-medium text-sm">{invoice.invoiceNumber}</p>
                                  {invoice.paymentDate && (
                                    <p className="text-[10px] text-green-600">Paid: {format(invoice.paymentDate, 'MMM dd')}</p>
                                  )}
                                  {invoice.rejectionReason && (
                                    <p className="text-[10px] text-red-600">{invoice.rejectionReason}</p>
                                  )}
                                </div>
                              </td>
                            )}
                            {visibleColumns.invoice.includes('po') && (
                              <td className="py-1.5 px-2">
                                <span className="text-xs">{invoice.poReference}</span>
                              </td>
                            )}
                            {visibleColumns.invoice.includes('submission') && (
                              <td className="py-1.5 px-2">
                                <span className="text-xs">{format(invoice.submissionDate, 'MMM dd, yy')}</span>
                              </td>
                            )}
                            {visibleColumns.invoice.includes('due') && (
                              <td className="py-1.5 px-2">
                                <span className="text-xs">{format(invoice.dueDate, 'MMM dd, yy')}</span>
                              </td>
                            )}
                            {visibleColumns.invoice.includes('amount') && (
                              <td className="py-1.5 px-2">
                                <p className="font-semibold text-xs">{invoice.currency} {invoice.totalAmount.toLocaleString()}</p>
                              </td>
                            )}
                            {visibleColumns.invoice.includes('status') && (
                              <td className="py-1.5 px-2">
                                <Badge className={`${getStatusColor(invoice.status)} text-[10px] px-1.5 py-0`}>
                                  {invoice.status.replace('-', ' ')}
                                </Badge>
                              </td>
                            )}
                            {visibleColumns.invoice.includes('actions') && (
                              <td className="p-2 w-24">
                                <div className="flex items-center gap-1">
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSelectedInvoice(invoice)}>
                                    <Eye className="w-3.5 h-3.5" />
                                  </Button>
                                  {invoice.status === 'draft' && (
                                    <Button size="icon" className="h-7 w-7">
                                      <Send className="w-3.5 h-3.5" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            )}
                          </SortableRow>
                        ))}
                      </tbody>
                    </SortableContext>
                  </table>
                </DndContext>
              </div>
              <MaterialPagination
                currentPage={invoicePage}
                totalItems={invoices.length}
                onPageChange={setInvoicePage}
              />
            </Card>
          )}

          {/* List View */}
          {invoiceViewMode === 'list' && (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <Card key={invoice.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-semibold">{invoice.invoiceNumber}</p>
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status.replace('-', ' ')}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          PO: {invoice.poReference}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          <span>Due: {format(invoice.dueDate, 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span>{invoice.currency} {invoice.totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          <span>{invoice.items.length} items</span>
                        </div>
                      </div>
                      {invoice.paymentDate && (
                        <p className="text-xs text-green-600 mt-1">Paid on {format(invoice.paymentDate, 'MMM dd, yyyy')}</p>
                      )}
                      {invoice.rejectionReason && (
                        <p className="text-xs text-red-600 mt-1">{invoice.rejectionReason}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setSelectedInvoice(invoice)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      {invoice.status === 'draft' && (
                        <Button size="sm">
                          <Send className="w-4 h-4 mr-2" />
                          Submit
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Card View */}
          {invoiceViewMode === 'card' && (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <Card key={invoice.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{invoice.invoiceNumber}</CardTitle>
                        <p className="text-sm text-muted-foreground">PO: {invoice.poReference}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status.replace('-', ' ')}
                        </Badge>
                        <Button size="sm" variant="ghost" onClick={() => setSelectedInvoice(invoice)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Submission Date:</span>
                        <p className="font-medium">{format(invoice.submissionDate, 'MMM dd, yyyy')}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Due Date:</span>
                        <p className="font-medium">{format(invoice.dueDate, 'MMM dd, yyyy')}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Amount:</span>
                        <p className="font-medium">{invoice.currency} {invoice.amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Total (incl. tax):</span>
                        <p className="font-medium">{invoice.currency} {invoice.totalAmount.toLocaleString()}</p>
                      </div>
                    </div>

                    {invoice.paymentDate && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded mb-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-green-800">Payment Processed</span>
                        </div>
                        <p className="text-sm text-green-600">
                          Paid on {format(invoice.paymentDate, 'MMM dd, yyyy')}
                        </p>
                      </div>
                    )}

                    {invoice.rejectionReason && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded mb-4">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="font-medium text-red-800">Invoice Rejected</span>
                        </div>
                        <p className="text-sm text-red-600">{invoice.rejectionReason}</p>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        {invoice.items.length} line items
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4 mr-2" />
                          Download PDF
                        </Button>
                        {invoice.status === 'draft' && (
                          <Button size="sm">
                            <Send className="w-4 h-4 mr-2" />
                            Submit
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Payment Tracking</h3>
              <p className="text-sm text-muted-foreground">Monitor payment status and history</p>
            </div>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Payment Report
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Outstanding Amount</p>
                    <p className="text-2xl font-bold text-orange-600">$79,750</p>
                    <p className="text-xs text-orange-600">1 invoice pending</p>
                  </div>
                  <Clock className="w-6 h-6 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Paid This Month</p>
                    <p className="text-2xl font-bold text-green-600">$18,438</p>
                    <p className="text-xs text-green-600">1 payment received</p>
                  </div>
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Payment Time</p>
                    <p className="text-2xl font-bold text-blue-600">28.5</p>
                    <p className="text-xs text-blue-600">days</p>
                  </div>
                  <BarChart3 className="w-6 h-6 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pagedInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${invoice.status === 'paid' ? 'bg-green-500' :
                        invoice.status === 'approved' ? 'bg-blue-500' :
                          invoice.status === 'rejected' ? 'bg-red-500' :
                            'bg-orange-500'
                        }`}></div>
                      <div>
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">{invoice.poReference}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{invoice.currency} {invoice.totalAmount.toLocaleString()}</p>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status.replace('-', ' ')}
                        </Badge>
                        {invoice.paymentDate && (
                          <span className="text-xs text-muted-foreground">
                            Paid {format(invoice.paymentDate, 'MMM dd')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Document & Compliance Management</h3>
              <p className="text-sm text-muted-foreground">Manage certificates, licenses and compliance documents</p>
            </div>
            <Button onClick={() => setShowUploadDocument(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </div>

          {/* Compliance Status Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Valid Documents</p>
                    <p className="text-2xl font-bold text-green-600">
                      {mockComplianceDocuments.filter(doc => doc.status === 'valid').length}
                    </p>
                  </div>
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Expiring Soon</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {mockComplianceDocuments.filter(doc => doc.status === 'expiring').length}
                    </p>
                  </div>
                  <AlertTriangle className="w-6 h-6 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Expired</p>
                    <p className="text-2xl font-bold text-red-600">
                      {mockComplianceDocuments.filter(doc => doc.status === 'expired').length}
                    </p>
                  </div>
                  <XCircle className="w-6 h-6 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Review</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {mockComplianceDocuments.filter(doc => doc.status === 'pending-review').length}
                    </p>
                  </div>
                  <Clock className="w-6 h-6 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Documents List */}
          <div className="space-y-4">
            {mockComplianceDocuments.map((document) => (
              <Card key={document.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{document.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {document.type.replace('-', ' ')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Uploaded: {format(document.uploadDate, 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(document.status)}>
                        {document.status.replace('-', ' ')}
                      </Badge>
                      {document.expiryDate && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Expires: {format(document.expiryDate, 'MMM dd, yyyy')}
                        </p>
                      )}
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Performance Analytics</h3>
              <p className="text-sm text-muted-foreground">View your performance metrics and reports</p>
            </div>
            <div className="flex gap-2">
              <Select defaultValue="6months">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1month">Last Month</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="1year">Last Year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>

          {/* Performance Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockPerformanceMetrics.map((metric, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{metric.metric}</h4>
                    {metric.trend === 'up' ? (
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    ) : metric.trend === 'down' ? (
                      <TrendingDown className="w-5 h-5 text-red-500" />
                    ) : (
                      <div className="w-5 h-5" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">
                        {metric.value}
                      </span>
                      <span className="text-muted-foreground">
                        {metric.unit}
                      </span>
                    </div>
                    {metric.target && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Target: {metric.target}{metric.unit}</span>
                          <span className={metric.value >= metric.target ? 'text-green-600' : 'text-orange-600'}>
                            {metric.value >= metric.target ? '✓ Met' : '△ Below'}
                          </span>
                        </div>
                        <Progress
                          value={metric.unit === '%' ? metric.value : (metric.value / metric.target) * 100}
                          className="h-2"
                        />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">{metric.period}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Additional Analytics Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Contribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">$342.5K</p>
                    <p className="text-sm text-muted-foreground">Total revenue last 6 months</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Q1 2024</span>
                      <span className="font-medium">$158.3K</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Q2 2024 (partial)</span>
                      <span className="font-medium">$184.2K</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">24</p>
                      <p className="text-sm text-muted-foreground">Total Orders</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">22</p>
                      <p className="text-sm text-muted-foreground">Completed</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>On-time deliveries</span>
                      <span className="font-medium">20/22 (91%)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Average order value</span>
                      <span className="font-medium">$14.3K</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Submit Quotation Dialog */}
      <Dialog open={showSubmitQuotation} onOpenChange={setShowSubmitQuotation}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Quotation</DialogTitle>
            <DialogDescription>
              Submit your quotation for the selected RFQ
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rfq-selection">Select RFQ</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select RFQ" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockRFQs.filter(rfq => rfq.status === 'open').map((rfq) => (
                      <SelectItem key={rfq.id} value={rfq.id}>
                        {rfq.rfqNumber} - {rfq.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="quote-currency">Currency</Label>
                <Select defaultValue="USD">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="total-amount">Total Amount</Label>
                <Input id="total-amount" type="number" placeholder="0.00" />
              </div>
              <div>
                <Label htmlFor="delivery-time">Delivery Time</Label>
                <Input id="delivery-time" placeholder="e.g., 30 days" />
              </div>
              <div>
                <Label htmlFor="validity-period">Quote Validity</Label>
                <Input id="validity-period" placeholder="e.g., 45 days" />
              </div>
            </div>

            <div>
              <Label htmlFor="quote-notes">Additional Notes</Label>
              <Textarea
                id="quote-notes"
                placeholder="Include any special terms, conditions, or additional information..."
                rows={4}
              />
            </div>

            <div>
              <Label>Attachments</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drag and drop files here, or click to browse
                </p>
                <Button variant="outline" size="sm" className="mt-2">
                  Choose Files
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSubmitQuotation(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleSubmitQuotation(selectedRFQ?.id || '', {})}>
                <Send className="w-4 h-4 mr-2" />
                Submit Quotation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Invoice Dialog */}
      <Dialog open={showCreateInvoice} onOpenChange={setShowCreateInvoice}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
            <DialogDescription>
              Create a new invoice for delivered goods or services
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="po-reference">Purchase Order Reference</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select PO" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockPurchaseOrders.filter(po => ['delivered', 'completed'].includes(po.status)).map((po) => (
                      <SelectItem key={po.id} value={po.id}>
                        {po.poNumber} - ${po.totalAmount.toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="invoice-date">Invoice Date</Label>
                <Input id="invoice-date" type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Invoice Items</Label>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground">
                  <div className="col-span-5">Description</div>
                  <div className="col-span-2">Quantity</div>
                  <div className="col-span-2">Unit Price</div>
                  <div className="col-span-2">Total</div>
                  <div className="col-span-1">Action</div>
                </div>

                <div className="grid grid-cols-12 gap-2">
                  <Input className="col-span-5" placeholder="Item description" />
                  <Input className="col-span-2" type="number" placeholder="1" />
                  <Input className="col-span-2" type="number" placeholder="0.00" />
                  <Input className="col-span-2" type="number" placeholder="0.00" readOnly />
                  <Button variant="ghost" size="sm" className="col-span-1">
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="subtotal">Subtotal</Label>
                <Input id="subtotal" type="number" placeholder="0.00" readOnly />
              </div>
              <div>
                <Label htmlFor="tax-amount">Tax Amount</Label>
                <Input id="tax-amount" type="number" placeholder="0.00" />
              </div>
              <div>
                <Label htmlFor="total-amount">Total Amount</Label>
                <Input id="total-amount" type="number" placeholder="0.00" readOnly />
              </div>
            </div>

            <div>
              <Label htmlFor="invoice-notes">Notes</Label>
              <Textarea
                id="invoice-notes"
                placeholder="Payment terms, additional information..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateInvoice(false)}>
                Cancel
              </Button>
              <Button variant="outline" onClick={() => handleSubmitInvoice({ status: 'draft' })}>
                <Archive className="w-4 h-4 mr-2" />
                Save as Draft
              </Button>
              <Button onClick={() => handleSubmitInvoice({ status: 'submitted' })}>
                <Send className="w-4 h-4 mr-2" />
                Submit Invoice
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog open={showUploadDocument} onOpenChange={setShowUploadDocument}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Compliance Document</DialogTitle>
            <DialogDescription>
              Upload certificates, licenses, and other compliance documents
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="document-type">Document Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="certificate">Certificate</SelectItem>
                    <SelectItem value="license">License</SelectItem>
                    <SelectItem value="tax-document">Tax Document</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="audit-report">Audit Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="document-name">Document Name</Label>
                <Input id="document-name" placeholder="Enter document name" />
              </div>
            </div>

            <div>
              <Label htmlFor="expiry-date">Expiry Date (if applicable)</Label>
              <Input id="expiry-date" type="date" />
            </div>

            <div>
              <Label>Upload File</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drag and drop your document here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                </p>
                <Button variant="outline" size="sm" className="mt-2">
                  Choose File
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="document-notes">Notes</Label>
              <Textarea
                id="document-notes"
                placeholder="Additional information about this document..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowUploadDocument(false)}>
                Cancel
              </Button>
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Shipment Notification Dialog */}
      <Dialog open={showShipmentNotification} onOpenChange={setShowShipmentNotification}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Update Shipment Status</DialogTitle>
            <DialogDescription>
              Update material readiness and shipping information for your purchase orders
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label htmlFor="shipment-po">Purchase Order</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select PO" />
                </SelectTrigger>
                <SelectContent>
                  {mockPurchaseOrders.filter(po => ['acknowledged', 'in-progress'].includes(po.status)).map((po) => (
                    <SelectItem key={po.id} value={po.id}>
                      {po.poNumber} - {po.items.length} items
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label>Material Readiness Status</Label>
              <div className="space-y-3">
                {mockPurchaseOrders[0]?.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{item.description}</p>
                      <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Select defaultValue={item.deliveryStatus}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="ready">Ready</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expected-ship-date">Expected Shipping Date</Label>
                <Input id="expected-ship-date" type="date" />
              </div>
              <div>
                <Label htmlFor="carrier-info">Carrier Information</Label>
                <Input id="carrier-info" placeholder="e.g., FedEx, UPS, DHL" />
              </div>
            </div>

            <div>
              <Label htmlFor="packaging-status">Packaging Status</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select packaging status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-started">Not Started</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Supporting Documents</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                <Paperclip className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Upload packing lists, certificates, or other supporting documents
                </p>
                <Button variant="outline" size="sm" className="mt-2">
                  Choose Files
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="shipment-notes">Additional Notes</Label>
              <Textarea
                id="shipment-notes"
                placeholder="Special handling instructions, delivery notes..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowShipmentNotification(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleUpdateShipmentStatus(selectedPO?.id || '', {})}>
                <Truck className="w-4 h-4 mr-2" />
                Update Shipment Status
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- Detail Modals (Functional Flows) --- */}

      {/* RFQ Detail Modal */}
      <Dialog open={!!selectedRFQ} onOpenChange={(open: boolean) => !open && setSelectedRFQ(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-center pr-8">
              <div>
                <DialogTitle className="text-xl font-bold">{selectedRFQ?.rfqNumber}</DialogTitle>
                <DialogDescription>{selectedRFQ?.category} • Issued {selectedRFQ && format(selectedRFQ.issuedDate, 'MMM dd, yyyy')}</DialogDescription>
              </div>
              <Badge className={selectedRFQ ? getStatusColor(selectedRFQ.status) : ''}>
                {selectedRFQ?.status}
              </Badge>
            </div>
          </DialogHeader>
          {selectedRFQ && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Requirement Overview</h4>
                    <p className="text-sm leading-relaxed">{selectedRFQ.description}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Specific Requirements</h4>
                    <ul className="space-y-1">
                      {selectedRFQ.requirements.map((req, i) => (
                        <li key={i} className="text-sm flex items-center gap-2">
                          <Check className="w-3 h-3 text-green-500" /> {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="space-y-4 border-l pl-6 border-slate-100">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Deadline for Submission</span>
                    <span className="text-sm font-semibold text-red-600">{format(selectedRFQ.submissionDeadline, 'MMMM dd, yyyy')}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Estimated Contract Value</span>
                    <span className="text-lg font-bold text-primary">{selectedRFQ.currency} {selectedRFQ.estimatedValue.toLocaleString()}</span>
                  </div>
                  <div className="pt-4">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Attachments ({selectedRFQ.attachments.length})</h4>
                    <div className="space-y-2">
                      {selectedRFQ.attachments.map((file, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100 text-xs">
                          <span className="truncate flex-1">{file}</span>
                          <Download className="w-3 h-3 cursor-pointer hover:text-primary" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedRFQ.quotationSubmitted ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckSquare className="w-5 h-5 text-green-600" />
                    <h4 className="font-bold text-green-800">Your Quotation Is Submitted</h4>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-green-600/70 block text-xs">Total Bid</span>
                      <span className="font-bold text-green-900">${selectedRFQ.quotationSubmitted.totalAmount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-green-600/70 block text-xs">Delivery Time</span>
                      <span className="font-semibold text-green-900">{selectedRFQ.quotationSubmitted.deliveryTime}</span>
                    </div>
                    <div>
                      <span className="text-green-600/70 block text-xs">Validity</span>
                      <span className="font-semibold text-green-900">{selectedRFQ.quotationSubmitted.validityPeriod}</span>
                    </div>
                    <div>
                      <span className="text-green-600/70 block text-xs">Submitted On</span>
                      <span className="font-semibold text-green-900">{format(selectedRFQ.quotationSubmitted.submittedAt, 'MMM dd, HH:mm')}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    <h4 className="text-blue-800 font-bold">Action Required</h4>
                  </div>
                  <p className="text-sm text-blue-700 mt-2">
                    This RFQ is currently open. You must submit your quotation before the deadline.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedRFQ(null)}>Close</Button>
                {selectedRFQ.status === 'open' && !selectedRFQ.quotationSubmitted && (
                  <Button onClick={() => { setSelectedRFQ(null); setShowSubmitQuotation(true); }}>
                    Prepare Quotation
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PO Detail Modal */}
      <Dialog open={!!selectedPO} onOpenChange={(open: boolean) => !open && setSelectedPO(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-center pr-8">
              <div>
                <DialogTitle className="text-xl font-bold">{selectedPO?.poNumber}</DialogTitle>
                <DialogDescription>Reference: {selectedPO?.rfqReference || 'Direct Order'} • Ordered {selectedPO && format(selectedPO.orderDate, 'MMM dd, yyyy')}</DialogDescription>
              </div>
              <Badge className={selectedPO ? getStatusColor(selectedPO.status) : ''}>
                {selectedPO?.status}
              </Badge>
            </div>
          </DialogHeader>
          {selectedPO && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <h4 className="text-sm font-bold uppercase text-muted-foreground pb-2 border-b">Ordered Items</h4>
                  <div className="space-y-2">
                    {selectedPO.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50/50">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{item.description}</p>
                          <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                            <span>Qty: {item.quantity}</span>
                            <span>Unit Price: ${item.unitPrice.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm">${item.totalPrice.toLocaleString()}</p>
                          <Badge variant="ghost" className="text-[10px] uppercase p-0 h-auto">{item.deliveryStatus}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center">
                    <span className="text-sm font-medium opacity-70">Total Order Amount</span>
                    <span className="text-xl font-black">${selectedPO.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
                <div className="space-y-6 pl-4 border-l border-slate-100">
                  <div>
                    <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Shipping Address
                    </h4>
                    <p className="text-sm leading-relaxed">{selectedPO.shippingAddress}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Important Dates
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Target Delivery</span>
                        <span className="font-semibold">{format(selectedPO.deliveryDate, 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Expected Ship</span>
                        <span className="font-semibold">{selectedPO.estimatedShipDate ? format(selectedPO.estimatedShipDate, 'MMM dd, yyyy') : '--'}</span>
                      </div>
                    </div>
                  </div>
                  {selectedPO.specialInstructions && (
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h4 className="text-[10px] font-bold uppercase text-yellow-800 mb-1">Special Instructions</h4>
                      <p className="text-xs text-yellow-700">{selectedPO.specialInstructions}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedPO(null)}>Close</Button>
                {selectedPO.status === 'created' ? (
                  <Button onClick={() => { handleAcknowledgePO(selectedPO.id); setSelectedPO(null); }}>
                    Acknowledge PO
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={() => { setShowShipmentNotification(true); setSelectedPO(null); }}>
                    Update Logistics Status
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Invoice Detail Modal */}
      <Dialog open={!!selectedInvoice} onOpenChange={(open: boolean) => !open && setSelectedInvoice(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <div className="flex justify-between items-center pr-8">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Receipt className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">{selectedInvoice?.invoiceNumber}</DialogTitle>
                  <DialogDescription>PO Ref: {selectedInvoice?.poReference}</DialogDescription>
                </div>
              </div>
              <Badge className={selectedInvoice ? getStatusColor(selectedInvoice.status) : ''}>
                {selectedInvoice?.status}
              </Badge>
            </div>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm border-b pb-6">
                <div>
                  <span className="text-muted-foreground block mb-1">Submission Date</span>
                  <span className="font-semibold">{format(selectedInvoice.submissionDate, 'MMMM dd, yyyy')}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Due Date</span>
                  <span className="font-semibold text-red-600">{format(selectedInvoice.dueDate, 'MMMM dd, yyyy')}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Total Amount</span>
                  <span className="font-bold text-lg">{selectedInvoice.currency} {selectedInvoice.totalAmount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Payment Date</span>
                  <span className="font-semibold">{selectedInvoice.paymentDate ? format(selectedInvoice.paymentDate, 'MMMM dd, yyyy') : 'Pending'}</span>
                </div>
              </div>

              {selectedInvoice.status === 'paid' && (
                <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-green-800">Payment Completed</h4>
                    <p className="text-sm text-green-700">Funds were settled on {format(selectedInvoice.paymentDate!, 'PPP')}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setSelectedInvoice(null)}>Close</Button>
                <Button variant="secondary">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};