import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DraggableTableRow, DraggableTableHeader } from './ui/draggable-table-row';
import { 
  Database,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Plus,
  Calendar as CalendarIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  FileText,
  Users,
  Building2,
  Receipt,
  CreditCard,
  Package,
  Target,
  ShoppingCart,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Star,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  MapPin,
  Phone,
  Mail,
  Globe,
  Award,
  Shield,
  Activity,
  BarChart3,
  PieChart,
  Settings,
  ExternalLink,
  Copy,
  Archive,
  Send,
  Ban,
  CheckSquare,
  Calendar as CalIcon,
  FileCheck,
  AlertCircle,
  Info
} from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { cn } from './ui/utils';

// Data Types
interface Vendor {
  id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  status: 'active' | 'pending' | 'suspended' | 'rejected';
  tier: 'platinum' | 'gold' | 'silver' | 'bronze';
  registrationDate: Date;
  lastActivity: Date;
  totalOrders: number;
  totalValue: number;
  rating: number;
  compliance: 'compliant' | 'non-compliant' | 'pending';
  paymentTerms: string;
  creditLimit: number;
  outstandingAmount: number;
}

interface Contract {
  id: string;
  contractNumber: string;
  vendorName: string;
  vendorId: string;
  title: string;
  type: 'master-agreement' | 'purchase-contract' | 'service-agreement' | 'nda';
  status: 'draft' | 'under-review' | 'approved' | 'active' | 'expired' | 'terminated';
  startDate: Date;
  endDate: Date;
  value: number;
  currency: string;
  renewalDate?: Date;
  autoRenewal: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  progress: number;
  lastModified: Date;
  createdBy: string;
}

interface RFQ {
  id: string;
  rfqNumber: string;
  title: string;
  category: string;
  description: string;
  status: 'draft' | 'published' | 'closed' | 'awarded' | 'cancelled';
  issuedDate: Date;
  closingDate: Date;
  estimatedValue: number;
  currency: string;
  responsesReceived: number;
  totalInvited: number;
  responseRate: number;
  winningBid?: number;
  winningVendor?: string;
  evaluationStatus: 'pending' | 'in-progress' | 'completed';
  createdBy: string;
  lastModified: Date;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorName: string;
  vendorId: string;
  rfqReference?: string;
  contractReference?: string;
  orderDate: Date;
  deliveryDate: Date;
  status: 'created' | 'sent' | 'acknowledged' | 'in-production' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
  urgency: 'low' | 'normal' | 'high' | 'urgent';
  totalAmount: number;
  currency: string;
  itemsCount: number;
  paymentTerms: string;
  shippingMethod: string;
  department: string;
  approvedBy: string;
  lastUpdated: Date;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  vendorName: string;
  vendorId: string;
  poReference?: string;
  submissionDate: Date;
  dueDate: Date;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: 'received' | 'under-review' | 'approved' | 'rejected' | 'paid' | 'overdue';
  paymentDate?: Date;
  processingTime?: number;
  approvedBy?: string;
  rejectionReason?: string;
  paymentMethod?: string;
  discountApplied?: number;
  itemsCount: number;
}

interface Payment {
  id: string;
  paymentId: string;
  vendorName: string;
  vendorId: string;
  invoiceReference: string;
  paymentDate: Date;
  amount: number;
  currency: string;
  method: 'bank-transfer' | 'check' | 'ach' | 'wire' | 'credit-card';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  reference: string;
  approvedBy: string;
  bankDetails?: string;
  transactionFee?: number;
  exchangeRate?: number;
  scheduledDate?: Date;
  actualDate?: Date;
}

interface Document {
  id: string;
  name: string;
  type: 'contract' | 'invoice' | 'po' | 'certificate' | 'compliance' | 'rfq' | 'other';
  vendorName?: string;
  vendorId?: string;
  referenceId?: string;
  uploadDate: Date;
  fileSize: number;
  format: string;
  status: 'active' | 'archived' | 'expired' | 'pending-review';
  expiryDate?: Date;
  downloadCount: number;
  lastAccessed?: Date;
  uploadedBy: string;
  tags: string[];
}

interface Delivery {
  id: string;
  poNumber: string;
  vendorName: string;
  vendorId: string;
  deliveryDate: Date;
  scheduledDate: Date;
  status: 'scheduled' | 'in-transit' | 'delivered' | 'delayed' | 'cancelled';
  trackingNumber?: string;
  carrier: string;
  itemsCount: number;
  totalWeight?: number;
  deliveryAddress: string;
  signedBy?: string;
  deliveryNotes?: string;
  proofOfDelivery?: boolean;
  delay?: number;
  deliverySlot?: string;
}

// Mock Data
const mockVendors: Vendor[] = [
  {
    id: 'V001',
    name: 'Advanced Materials Solutions Ltd',
    code: 'AMS-001',
    email: 'contact@advancedmaterials.com',
    phone: '+1-555-0123',
    address: '123 Industrial Drive, Manufacturing District, NY 10001',
    category: 'Raw Materials',
    status: 'active',
    tier: 'gold',
    registrationDate: new Date('2023-01-15'),
    lastActivity: new Date('2024-01-20'),
    totalOrders: 124,
    totalValue: 2450000,
    rating: 4.6,
    compliance: 'compliant',
    paymentTerms: 'Net 30',
    creditLimit: 500000,
    outstandingAmount: 85000
  },
  {
    id: 'V002',
    name: 'Tech Components Inc',
    code: 'TCI-002',
    email: 'orders@techcomponents.com',
    phone: '+1-555-0124',
    address: '456 Tech Park, Silicon Valley, CA 94086',
    category: 'Electronics',
    status: 'active',
    tier: 'platinum',
    registrationDate: new Date('2022-06-20'),
    lastActivity: new Date('2024-01-22'),
    totalOrders: 287,
    totalValue: 3850000,
    rating: 4.8,
    compliance: 'compliant',
    paymentTerms: 'Net 45',
    creditLimit: 750000,
    outstandingAmount: 125000
  },
  {
    id: 'V003',
    name: 'Global Logistics Partners',
    code: 'GLP-003',
    email: 'service@globallogistics.com',
    phone: '+1-555-0125',
    address: '789 Shipping Lane, Port District, FL 33101',
    category: 'Logistics',
    status: 'pending',
    tier: 'silver',
    registrationDate: new Date('2024-01-10'),
    lastActivity: new Date('2024-01-18'),
    totalOrders: 15,
    totalValue: 185000,
    rating: 4.2,
    compliance: 'pending',
    paymentTerms: 'Net 30',
    creditLimit: 200000,
    outstandingAmount: 25000
  },
  {
    id: 'V004',
    name: 'Sustainable Packaging Co',
    code: 'SPC-004',
    email: 'info@sustainablepack.com',
    phone: '+1-555-0126',
    address: '321 Green Street, Eco Park, OR 97201',
    category: 'Packaging',
    status: 'active',
    tier: 'gold',
    registrationDate: new Date('2023-03-12'),
    lastActivity: new Date('2024-01-19'),
    totalOrders: 89,
    totalValue: 950000,
    rating: 4.4,
    compliance: 'compliant',
    paymentTerms: 'Net 30',
    creditLimit: 300000,
    outstandingAmount: 42000
  }
];

const mockContracts: Contract[] = [
  {
    id: 'C001',
    contractNumber: 'CNT-2024-001',
    vendorName: 'Advanced Materials Solutions Ltd',
    vendorId: 'V001',
    title: 'Master Service Agreement - Raw Materials Supply',
    type: 'master-agreement',
    status: 'active',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    value: 2500000,
    currency: 'USD',
    renewalDate: new Date('2024-11-01'),
    autoRenewal: true,
    riskLevel: 'low',
    progress: 75,
    lastModified: new Date('2024-01-15'),
    createdBy: 'John Smith'
  },
  {
    id: 'C002',
    contractNumber: 'CNT-2024-002',
    vendorName: 'Tech Components Inc',
    vendorId: 'V002',
    title: 'Electronics Supply Contract - Q1-Q4 2024',
    type: 'purchase-contract',
    status: 'active',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    value: 4200000,
    currency: 'USD',
    autoRenewal: false,
    riskLevel: 'medium',
    progress: 60,
    lastModified: new Date('2024-01-20'),
    createdBy: 'Sarah Johnson'
  },
  {
    id: 'C003',
    contractNumber: 'CNT-2024-003',
    vendorName: 'Global Logistics Partners',
    vendorId: 'V003',
    title: 'Logistics Service Agreement',
    type: 'service-agreement',
    status: 'under-review',
    startDate: new Date('2024-02-01'),
    endDate: new Date('2025-01-31'),
    value: 850000,
    currency: 'USD',
    autoRenewal: true,
    riskLevel: 'medium',
    progress: 25,
    lastModified: new Date('2024-01-22'),
    createdBy: 'Mike Davis'
  }
];

const mockRFQs: RFQ[] = [
  {
    id: 'RFQ001',
    rfqNumber: 'RFQ-2024-001234',
    title: 'Steel Components for Manufacturing Line Upgrade',
    category: 'Raw Materials',
    description: 'High-grade steel components required for production line modernization',
    status: 'closed',
    issuedDate: new Date('2024-01-15'),
    closingDate: new Date('2024-01-25'),
    estimatedValue: 125000,
    currency: 'USD',
    responsesReceived: 8,
    totalInvited: 12,
    responseRate: 66.7,
    winningBid: 118500,
    winningVendor: 'Advanced Materials Solutions Ltd',
    evaluationStatus: 'completed',
    createdBy: 'John Smith',
    lastModified: new Date('2024-01-26')
  },
  {
    id: 'RFQ002',
    rfqNumber: 'RFQ-2024-001245',
    title: 'Electronic Components - Circuit Boards',
    category: 'Electronics',
    description: 'Custom PCB manufacturing for new product line',
    status: 'published',
    issuedDate: new Date('2024-01-22'),
    closingDate: new Date('2024-02-05'),
    estimatedValue: 75000,
    currency: 'USD',
    responsesReceived: 3,
    totalInvited: 8,
    responseRate: 37.5,
    evaluationStatus: 'pending',
    createdBy: 'Sarah Johnson',
    lastModified: new Date('2024-01-23')
  },
  {
    id: 'RFQ003',
    rfqNumber: 'RFQ-2024-001256',
    title: 'Packaging Materials - Q1 2024',
    category: 'Packaging',
    description: 'Quarterly packaging materials supply contract',
    status: 'awarded',
    issuedDate: new Date('2024-01-10'),
    closingDate: new Date('2024-01-20'),
    estimatedValue: 45000,
    currency: 'USD',
    responsesReceived: 5,
    totalInvited: 6,
    responseRate: 83.3,
    winningBid: 42500,
    winningVendor: 'Sustainable Packaging Co',
    evaluationStatus: 'completed',
    createdBy: 'Mike Davis',
    lastModified: new Date('2024-01-21')
  }
];

const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'PO001',
    poNumber: 'PO-2024-005678',
    vendorName: 'Advanced Materials Solutions Ltd',
    vendorId: 'V001',
    rfqReference: 'RFQ-2024-001234',
    orderDate: new Date('2024-01-26'),
    deliveryDate: new Date('2024-02-20'),
    status: 'acknowledged',
    urgency: 'normal',
    totalAmount: 118500,
    currency: 'USD',
    itemsCount: 3,
    paymentTerms: 'Net 30',
    shippingMethod: 'Ground Freight',
    department: 'Manufacturing',
    approvedBy: 'John Smith',
    lastUpdated: new Date('2024-01-27')
  },
  {
    id: 'PO002',
    poNumber: 'PO-2024-005689',
    vendorName: 'Sustainable Packaging Co',
    vendorId: 'V004',
    rfqReference: 'RFQ-2024-001256',
    orderDate: new Date('2024-01-12'),
    deliveryDate: new Date('2024-02-01'),
    status: 'delivered',
    urgency: 'high',
    totalAmount: 42500,
    currency: 'USD',
    itemsCount: 2,
    paymentTerms: 'Net 30',
    shippingMethod: 'Express',
    department: 'Operations',
    approvedBy: 'Sarah Johnson',
    lastUpdated: new Date('2024-02-01')
  },
  {
    id: 'PO003',
    poNumber: 'PO-2024-005690',
    vendorName: 'Tech Components Inc',
    vendorId: 'V002',
    orderDate: new Date('2024-01-20'),
    deliveryDate: new Date('2024-02-15'),
    status: 'in-production',
    urgency: 'normal',
    totalAmount: 89500,
    currency: 'USD',
    itemsCount: 5,
    paymentTerms: 'Net 45',
    shippingMethod: 'Air Freight',
    department: 'R&D',
    approvedBy: 'Mike Davis',
    lastUpdated: new Date('2024-01-22')
  }
];

const mockInvoices: Invoice[] = [
  {
    id: 'INV001',
    invoiceNumber: 'INV-AMS-2024-0034',
    vendorName: 'Advanced Materials Solutions Ltd',
    vendorId: 'V001',
    poReference: 'PO-2024-005678',
    submissionDate: new Date('2024-02-02'),
    dueDate: new Date('2024-03-04'),
    amount: 118500,
    taxAmount: 11850,
    totalAmount: 130350,
    currency: 'USD',
    status: 'approved',
    processingTime: 3,
    approvedBy: 'Finance Team',
    itemsCount: 3
  },
  {
    id: 'INV002',
    invoiceNumber: 'INV-SPC-2024-0012',
    vendorName: 'Sustainable Packaging Co',
    vendorId: 'V004',
    poReference: 'PO-2024-005689',
    submissionDate: new Date('2024-02-02'),
    dueDate: new Date('2024-03-04'),
    amount: 42500,
    taxAmount: 4250,
    totalAmount: 46750,
    currency: 'USD',
    status: 'paid',
    paymentDate: new Date('2024-02-28'),
    processingTime: 2,
    approvedBy: 'Finance Team',
    paymentMethod: 'bank-transfer',
    itemsCount: 2
  },
  {
    id: 'INV003',
    invoiceNumber: 'INV-TCI-2024-0089',
    vendorName: 'Tech Components Inc',
    vendorId: 'V002',
    poReference: 'PO-2024-005690',
    submissionDate: new Date('2024-01-28'),
    dueDate: new Date('2024-03-13'),
    amount: 89500,
    taxAmount: 8950,
    totalAmount: 98450,
    currency: 'USD',
    status: 'under-review',
    processingTime: 5,
    itemsCount: 5
  }
];

const mockPayments: Payment[] = [
  {
    id: 'PAY001',
    paymentId: 'PAY-2024-001234',
    vendorName: 'Sustainable Packaging Co',
    vendorId: 'V004',
    invoiceReference: 'INV-SPC-2024-0012',
    paymentDate: new Date('2024-02-28'),
    amount: 46750,
    currency: 'USD',
    method: 'bank-transfer',
    status: 'completed',
    reference: 'TXN-897456321',
    approvedBy: 'Finance Manager',
    bankDetails: 'Chase Bank - ****1234',
    transactionFee: 25,
    scheduledDate: new Date('2024-02-28'),
    actualDate: new Date('2024-02-28')
  },
  {
    id: 'PAY002',
    paymentId: 'PAY-2024-001245',
    vendorName: 'Advanced Materials Solutions Ltd',
    vendorId: 'V001',
    invoiceReference: 'INV-AMS-2024-0034',
    paymentDate: new Date('2024-03-05'),
    amount: 130350,
    currency: 'USD',
    method: 'ach',
    status: 'processing',
    reference: 'ACH-789654123',
    approvedBy: 'Finance Manager',
    scheduledDate: new Date('2024-03-05'),
    transactionFee: 15
  },
  {
    id: 'PAY003',
    paymentId: 'PAY-2024-001256',
    vendorName: 'Tech Components Inc',
    vendorId: 'V002',
    invoiceReference: 'INV-TCI-2024-0089',
    paymentDate: new Date('2024-03-15'),
    amount: 98450,
    currency: 'USD',
    method: 'wire',
    status: 'pending',
    reference: 'WIRE-456789321',
    approvedBy: 'CFO',
    scheduledDate: new Date('2024-03-15'),
    transactionFee: 45
  }
];

const mockDocuments: Document[] = [
  {
    id: 'DOC001',
    name: 'Master Service Agreement - AMS',
    type: 'contract',
    vendorName: 'Advanced Materials Solutions Ltd',
    vendorId: 'V001',
    referenceId: 'C001',
    uploadDate: new Date('2024-01-01'),
    fileSize: 2048576,
    format: 'PDF',
    status: 'active',
    expiryDate: new Date('2024-12-31'),
    downloadCount: 15,
    lastAccessed: new Date('2024-01-20'),
    uploadedBy: 'John Smith',
    tags: ['contract', 'msa', 'raw-materials']
  },
  {
    id: 'DOC002',
    name: 'ISO 9001:2015 Certificate - TCI',
    type: 'certificate',
    vendorName: 'Tech Components Inc',
    vendorId: 'V002',
    uploadDate: new Date('2023-06-15'),
    fileSize: 1024768,
    format: 'PDF',
    status: 'active',
    expiryDate: new Date('2026-06-14'),
    downloadCount: 8,
    lastAccessed: new Date('2024-01-18'),
    uploadedBy: 'Sarah Johnson',
    tags: ['certificate', 'iso', 'quality']
  },
  {
    id: 'DOC003',
    name: 'Purchase Order - PO-2024-005678',
    type: 'po',
    vendorName: 'Advanced Materials Solutions Ltd',
    vendorId: 'V001',
    referenceId: 'PO001',
    uploadDate: new Date('2024-01-26'),
    fileSize: 512384,
    format: 'PDF',
    status: 'active',
    downloadCount: 3,
    lastAccessed: new Date('2024-01-27'),
    uploadedBy: 'System',
    tags: ['po', 'purchase-order', 'steel']
  }
];

const mockDeliveries: Delivery[] = [
  {
    id: 'DEL001',
    poNumber: 'PO-2024-005689',
    vendorName: 'Sustainable Packaging Co',
    vendorId: 'V004',
    deliveryDate: new Date('2024-02-01'),
    scheduledDate: new Date('2024-02-01'),
    status: 'delivered',
    trackingNumber: 'TRK-123456789',
    carrier: 'FedEx Express',
    itemsCount: 2,
    totalWeight: 150.5,
    deliveryAddress: 'Warehouse A, 456 Storage Lane, Distribution Center',
    signedBy: 'John Warehouse',
    deliveryNotes: 'Delivered on time, all items accounted for',
    proofOfDelivery: true,
    delay: 0,
    deliverySlot: '10:00 AM - 12:00 PM'
  },
  {
    id: 'DEL002',
    poNumber: 'PO-2024-005678',
    vendorName: 'Advanced Materials Solutions Ltd',
    vendorId: 'V001',
    deliveryDate: new Date('2024-02-22'),
    scheduledDate: new Date('2024-02-20'),
    status: 'delayed',
    trackingNumber: 'TRK-987654321',
    carrier: 'Ground Freight Lines',
    itemsCount: 3,
    totalWeight: 2500.0,
    deliveryAddress: 'Manufacturing Plant A, 123 Factory Road',
    deliveryNotes: 'Delayed due to weather conditions',
    proofOfDelivery: false,
    delay: 2,
    deliverySlot: '8:00 AM - 10:00 AM'
  },
  {
    id: 'DEL003',
    poNumber: 'PO-2024-005690',
    vendorName: 'Tech Components Inc',
    vendorId: 'V002',
    deliveryDate: new Date('2024-02-15'),
    scheduledDate: new Date('2024-02-15'),
    status: 'in-transit',
    trackingNumber: 'TRK-456789123',
    carrier: 'Air Express',
    itemsCount: 5,
    totalWeight: 25.8,
    deliveryAddress: 'R&D Lab, 789 Innovation Drive',
    deliverySlot: '2:00 PM - 4:00 PM'
  }
];

type SortDirection = 'asc' | 'desc' | null;
type DataType = 'vendors' | 'contracts' | 'rfqs' | 'purchase-orders' | 'invoices' | 'payments' | 'documents' | 'deliveries';

interface SortConfig {
  key: string;
  direction: SortDirection;
}

export const Databoards: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DataType>('vendors');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: null });
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Dnd-kit sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      // Note: In a real app, you would update the data order here
      // For now, we just track the selection
    }
  };

  // Get data based on active tab
  const getData = () => {
    switch (activeTab) {
      case 'vendors': return mockVendors;
      case 'contracts': return mockContracts;
      case 'rfqs': return mockRFQs;
      case 'purchase-orders': return mockPurchaseOrders;
      case 'invoices': return mockInvoices;
      case 'payments': return mockPayments;
      case 'documents': return mockDocuments;
      case 'deliveries': return mockDeliveries;
      default: return [];
    }
  };

  // Filter and sort data
  const processedData = useMemo(() => {
    let data = [...getData()];
    
    // Apply search filter
    if (searchTerm) {
      data = data.filter((item: any) =>
        Object.values(item).some((value: any) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply other filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        data = data.filter((item: any) => item[key] === value);
      }
    });

    // Apply sorting
    if (sortConfig.key && sortConfig.direction) {
      data.sort((a: any, b: any) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return data;
  }, [activeTab, searchTerm, filters, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize);
  const paginatedData = processedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (key: string) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    if (sortConfig.direction === 'asc') {
      return <ArrowUp className="w-4 h-4" />;
    }
    if (sortConfig.direction === 'desc') {
      return <ArrowDown className="w-4 h-4" />;
    }
    return <ArrowUpDown className="w-4 h-4" />;
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedData.map((item: any) => item.id)));
    }
  };

  const getStatusBadge = (status: string, type?: string) => {
    const statusConfig: Record<string, { variant: string; className: string }> = {
      // Vendor statuses
      active: { variant: 'default', className: 'bg-green-100 text-green-800 border-green-200' },
      pending: { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      suspended: { variant: 'destructive', className: 'bg-red-100 text-red-800 border-red-200' },
      
      // Contract statuses
      'under-review': { variant: 'secondary', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      approved: { variant: 'default', className: 'bg-green-100 text-green-800 border-green-200' },
      expired: { variant: 'destructive', className: 'bg-red-100 text-red-800 border-red-200' },
      
      // RFQ statuses
      published: { variant: 'default', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      closed: { variant: 'secondary', className: 'bg-gray-100 text-gray-800 border-gray-200' },
      awarded: { variant: 'default', className: 'bg-green-100 text-green-800 border-green-200' },
      cancelled: { variant: 'destructive', className: 'bg-red-100 text-red-800 border-red-200' },
      
      // PO statuses
      created: { variant: 'secondary', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      sent: { variant: 'secondary', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      acknowledged: { variant: 'default', className: 'bg-green-100 text-green-800 border-green-200' },
      'in-production': { variant: 'secondary', className: 'bg-orange-100 text-orange-800 border-orange-200' },
      shipped: { variant: 'default', className: 'bg-green-100 text-green-800 border-green-200' },
      delivered: { variant: 'default', className: 'bg-green-100 text-green-800 border-green-200' },
      completed: { variant: 'default', className: 'bg-green-100 text-green-800 border-green-200' },
      
      // Invoice statuses
      received: { variant: 'secondary', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      rejected: { variant: 'destructive', className: 'bg-red-100 text-red-800 border-red-200' },
      paid: { variant: 'default', className: 'bg-green-100 text-green-800 border-green-200' },
      overdue: { variant: 'destructive', className: 'bg-red-100 text-red-800 border-red-200' },
      
      // Payment statuses
      processing: { variant: 'secondary', className: 'bg-orange-100 text-orange-800 border-orange-200' },
      failed: { variant: 'destructive', className: 'bg-red-100 text-red-800 border-red-200' },
      
      // Delivery statuses
      scheduled: { variant: 'secondary', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      'in-transit': { variant: 'secondary', className: 'bg-orange-100 text-orange-800 border-orange-200' },
      delayed: { variant: 'destructive', className: 'bg-red-100 text-red-800 border-red-200' }
    };

    const config = statusConfig[status] || { variant: 'secondary', className: 'bg-gray-100 text-gray-800 border-gray-200' };
    
    return (
      <Badge className={config.className}>
        {status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  const getTierBadge = (tier: string) => {
    const tierConfig: Record<string, string> = {
      platinum: 'bg-purple-100 text-purple-800 border-purple-200',
      gold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      silver: 'bg-gray-100 text-gray-800 border-gray-200',
      bronze: 'bg-orange-100 text-orange-800 border-orange-200'
    };

    return (
      <Badge className={tierConfig[tier] || 'bg-gray-100 text-gray-800 border-gray-200'}>
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </Badge>
    );
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return format(date, 'MMM dd, yyyy');
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const renderTableHeader = () => {
    const headers: Record<DataType, string[]> = {
      vendors: ['Name', 'Code', 'Category', 'Status', 'Tier', 'Rating', 'Total Orders', 'Total Value', 'Outstanding', 'Last Activity'],
      contracts: ['Contract #', 'Vendor', 'Title', 'Type', 'Status', 'Value', 'Start Date', 'End Date', 'Progress', 'Risk Level'],
      rfqs: ['RFQ #', 'Title', 'Category', 'Status', 'Est. Value', 'Responses', 'Response Rate', 'Closing Date', 'Evaluation'],
      'purchase-orders': ['PO #', 'Vendor', 'Status', 'Urgency', 'Total Amount', 'Items', 'Order Date', 'Delivery Date', 'Department'],
      invoices: ['Invoice #', 'Vendor', 'PO Reference', 'Status', 'Amount', 'Due Date', 'Processing Time', 'Submission Date'],
      payments: ['Payment ID', 'Vendor', 'Invoice Ref', 'Amount', 'Method', 'Status', 'Payment Date', 'Reference'],
      documents: ['Name', 'Type', 'Vendor', 'Format', 'Size', 'Status', 'Upload Date', 'Downloads', 'Last Accessed'],
      deliveries: ['PO #', 'Vendor', 'Status', 'Scheduled', 'Actual', 'Carrier', 'Items', 'Weight', 'Delay']
    };

    return (
      <TableHeader>
        <DraggableTableHeader
          showDragHandle={true}
          allSelected={selectedRows.size === paginatedData.length && paginatedData.length > 0}
          onSelectAll={handleSelectAll}
        >
          {headers[activeTab].map((header, index) => (
            <TableHead
              key={index}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort(header.toLowerCase().replace(/\s+/g, '-').replace('#', 'number'))}
            >
              <div className="flex items-center gap-2">
                {header}
                {getSortIcon(header.toLowerCase().replace(/\s+/g, '-').replace('#', 'number'))}
              </div>
            </TableHead>
          ))}
          <TableHead className="w-12">Actions</TableHead>
        </DraggableTableHeader>
      </TableHeader>
    );
  };

  const renderTableRow = (item: any, index: number) => {
    const isSelected = selectedRows.has(item.id);

    switch (activeTab) {
      case 'vendors':
        return (
          <DraggableTableRow
            key={item.id}
            id={item.id}
            isSelected={isSelected}
            onSelect={() => handleSelectRow(item.id)}
          >
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell>{item.code}</TableCell>
            <TableCell>{item.category}</TableCell>
            <TableCell>{getStatusBadge(item.status)}</TableCell>
            <TableCell>{getTierBadge(item.tier)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                {item.rating}
              </div>
            </TableCell>
            <TableCell>{item.totalOrders}</TableCell>
            <TableCell>{formatCurrency(item.totalValue)}</TableCell>
            <TableCell>{formatCurrency(item.outstandingAmount)}</TableCell>
            <TableCell>{formatDate(item.lastActivity)}</TableCell>
            <TableCell>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </TableCell>
          </DraggableTableRow>
        );

      case 'contracts':
        return (
          <DraggableTableRow
            key={item.id}
            id={item.id}
            isSelected={isSelected}
            onSelect={() => handleSelectRow(item.id)}
          >
            <TableCell className="font-medium">{item.contractNumber}</TableCell>
            <TableCell>{item.vendorName}</TableCell>
            <TableCell>{item.title}</TableCell>
            <TableCell>{item.type.replace('-', ' ')}</TableCell>
            <TableCell>{getStatusBadge(item.status)}</TableCell>
            <TableCell>{formatCurrency(item.value, item.currency)}</TableCell>
            <TableCell>{formatDate(item.startDate)}</TableCell>
            <TableCell>{formatDate(item.endDate)}</TableCell>
            <TableCell>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${item.progress}%` }}
                ></div>
              </div>
              <span className="text-xs text-muted-foreground">{item.progress}%</span>
            </TableCell>
            <TableCell>
              <Badge className={
                item.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                item.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                item.riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                'bg-red-100 text-red-800'
              }>
                {item.riskLevel}
              </Badge>
            </TableCell>
            <TableCell>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </TableCell>
          </DraggableTableRow>
        );

      case 'rfqs':
        return (
          <DraggableTableRow
            key={item.id}
            id={item.id}
            isSelected={isSelected}
            onSelect={() => handleSelectRow(item.id)}
          >
            <TableCell className="font-medium">{item.rfqNumber}</TableCell>
            <TableCell>{item.title}</TableCell>
            <TableCell>{item.category}</TableCell>
            <TableCell>{getStatusBadge(item.status)}</TableCell>
            <TableCell>{formatCurrency(item.estimatedValue, item.currency)}</TableCell>
            <TableCell>{item.responsesReceived}/{item.totalInvited}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <span>{item.responseRate.toFixed(1)}%</span>
                {item.responseRate >= 75 ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : item.responseRate >= 50 ? (
                  <TrendingUp className="w-4 h-4 text-yellow-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
              </div>
            </TableCell>
            <TableCell>{formatDate(item.closingDate)}</TableCell>
            <TableCell>{getStatusBadge(item.evaluationStatus)}</TableCell>
            <TableCell>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </TableCell>
          </DraggableTableRow>
        );

      case 'purchase-orders':
        return (
          <DraggableTableRow
            key={item.id}
            id={item.id}
            isSelected={isSelected}
            onSelect={() => handleSelectRow(item.id)}
          >
            <TableCell className="font-medium">{item.poNumber}</TableCell>
            <TableCell>{item.vendorName}</TableCell>
            <TableCell>{getStatusBadge(item.status)}</TableCell>
            <TableCell>
              <Badge className={
                item.urgency === 'urgent' ? 'bg-red-100 text-red-800' :
                item.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                'bg-green-100 text-green-800'
              }>
                {item.urgency}
              </Badge>
            </TableCell>
            <TableCell>{formatCurrency(item.totalAmount, item.currency)}</TableCell>
            <TableCell>{item.itemsCount}</TableCell>
            <TableCell>{formatDate(item.orderDate)}</TableCell>
            <TableCell>{formatDate(item.deliveryDate)}</TableCell>
            <TableCell>{item.department}</TableCell>
            <TableCell>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </TableCell>
          </DraggableTableRow>
        );

      case 'invoices':
        return (
          <DraggableTableRow
            key={item.id}
            id={item.id}
            isSelected={isSelected}
            onSelect={() => handleSelectRow(item.id)}
          >
            <TableCell className="font-medium">{item.invoiceNumber}</TableCell>
            <TableCell>{item.vendorName}</TableCell>
            <TableCell>{item.poReference || 'N/A'}</TableCell>
            <TableCell>{getStatusBadge(item.status)}</TableCell>
            <TableCell>{formatCurrency(item.totalAmount, item.currency)}</TableCell>
            <TableCell>{formatDate(item.dueDate)}</TableCell>
            <TableCell>{item.processingTime ? `${item.processingTime} days` : 'N/A'}</TableCell>
            <TableCell>{formatDate(item.submissionDate)}</TableCell>
            <TableCell>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </TableCell>
          </DraggableTableRow>
        );

      case 'payments':
        return (
          <DraggableTableRow
            key={item.id}
            id={item.id}
            isSelected={isSelected}
            onSelect={() => handleSelectRow(item.id)}
          >
            <TableCell className="font-medium">{item.paymentId}</TableCell>
            <TableCell>{item.vendorName}</TableCell>
            <TableCell>{item.invoiceReference}</TableCell>
            <TableCell>{formatCurrency(item.amount, item.currency)}</TableCell>
            <TableCell>{item.method.replace('-', ' ')}</TableCell>
            <TableCell>{getStatusBadge(item.status)}</TableCell>
            <TableCell>{formatDate(item.paymentDate)}</TableCell>
            <TableCell>{item.reference}</TableCell>
            <TableCell>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </TableCell>
          </DraggableTableRow>
        );

      case 'documents':
        return (
          <DraggableTableRow
            key={item.id}
            id={item.id}
            isSelected={isSelected}
            onSelect={() => handleSelectRow(item.id)}
          >
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell>{item.type.replace('-', ' ')}</TableCell>
            <TableCell>{item.vendorName || 'N/A'}</TableCell>
            <TableCell>{item.format}</TableCell>
            <TableCell>{formatFileSize(item.fileSize)}</TableCell>
            <TableCell>{getStatusBadge(item.status)}</TableCell>
            <TableCell>{formatDate(item.uploadDate)}</TableCell>
            <TableCell>{item.downloadCount}</TableCell>
            <TableCell>{item.lastAccessed ? formatDate(item.lastAccessed) : 'Never'}</TableCell>
            <TableCell>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </TableCell>
          </DraggableTableRow>
        );

      case 'deliveries':
        return (
          <DraggableTableRow
            key={item.id}
            id={item.id}
            isSelected={isSelected}
            onSelect={() => handleSelectRow(item.id)}
          >
            <TableCell className="font-medium">{item.poNumber}</TableCell>
            <TableCell>{item.vendorName}</TableCell>
            <TableCell>{getStatusBadge(item.status)}</TableCell>
            <TableCell>{formatDate(item.scheduledDate)}</TableCell>
            <TableCell>{formatDate(item.deliveryDate)}</TableCell>
            <TableCell>{item.carrier}</TableCell>
            <TableCell>{item.itemsCount}</TableCell>
            <TableCell>{item.totalWeight ? `${item.totalWeight} kg` : 'N/A'}</TableCell>
            <TableCell>
              {item.delay ? (
                <span className="text-red-600">+{item.delay} days</span>
              ) : (
                <span className="text-green-600">On time</span>
              )}
            </TableCell>
            <TableCell>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </TableCell>
          </DraggableTableRow>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Databoards</h1>
              <p className="text-lg text-muted-foreground">Comprehensive data management and analytics</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setShowExportDialog(true)}>
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import Data
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Vendors</p>
                <p className="text-2xl font-bold text-blue-600">{mockVendors.length}</p>
              </div>
              <Users className="w-6 h-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Contracts</p>
                <p className="text-2xl font-bold text-green-600">{mockContracts.length}</p>
              </div>
              <FileText className="w-6 h-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">RFQs</p>
                <p className="text-2xl font-bold text-purple-600">{mockRFQs.length}</p>
              </div>
              <Target className="w-6 h-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Purchase Orders</p>
                <p className="text-2xl font-bold text-orange-600">{mockPurchaseOrders.length}</p>
              </div>
              <ShoppingCart className="w-6 h-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Invoices</p>
                <p className="text-2xl font-bold text-red-600">{mockInvoices.length}</p>
              </div>
              <Receipt className="w-6 h-6 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Payments</p>
                <p className="text-2xl font-bold text-indigo-600">{mockPayments.length}</p>
              </div>
              <CreditCard className="w-6 h-6 text-indigo-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Documents</p>
                <p className="text-2xl font-bold text-teal-600">{mockDocuments.length}</p>
              </div>
              <FileCheck className="w-6 h-6 text-teal-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Deliveries</p>
                <p className="text-2xl font-bold text-cyan-600">{mockDeliveries.length}</p>
              </div>
              <Truck className="w-6 h-6 text-cyan-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Tables */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Data Management</CardTitle>
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search all data..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              {/* Filters */}
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>

              {/* Page Size */}
              <Select value={pageSize.toString()} onValueChange={(value: string) => setPageSize(Number(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as DataType)}>
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="vendors">Vendors</TabsTrigger>
              <TabsTrigger value="contracts">Contracts</TabsTrigger>
              <TabsTrigger value="rfqs">RFQs</TabsTrigger>
              <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
            </TabsList>

            {/* Filters Panel */}
            {showFilters && (
              <Card className="p-4 mb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {activeTab === 'vendors' && (
                    <>
                      <div>
                        <Label>Status</Label>
                        <Select value={filters.status || 'all'} onValueChange={(value: string) => setFilters(prev => ({ ...prev, status: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Tier</Label>
                        <Select value={filters.tier || 'all'} onValueChange={(value: string) => setFilters(prev => ({ ...prev, tier: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Tiers</SelectItem>
                            <SelectItem value="platinum">Platinum</SelectItem>
                            <SelectItem value="gold">Gold</SelectItem>
                            <SelectItem value="silver">Silver</SelectItem>
                            <SelectItem value="bronze">Bronze</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Select value={filters.category || 'all'} onValueChange={(value: string) => setFilters(prev => ({ ...prev, category: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            <SelectItem value="Raw Materials">Raw Materials</SelectItem>
                            <SelectItem value="Electronics">Electronics</SelectItem>
                            <SelectItem value="Logistics">Logistics</SelectItem>
                            <SelectItem value="Packaging">Packaging</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                  
                  {activeTab === 'contracts' && (
                    <>
                      <div>
                        <Label>Status</Label>
                        <Select value={filters.status || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="under-review">Under Review</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select value={filters.type || 'all'} onValueChange={(value: string) => setFilters(prev => ({ ...prev, type: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="master-agreement">Master Agreement</SelectItem>
                            <SelectItem value="purchase-contract">Purchase Contract</SelectItem>
                            <SelectItem value="service-agreement">Service Agreement</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                  
                  <div className="flex items-end">
                    <Button variant="outline" onClick={() => setFilters({})}>
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Selected Items Actions */}
            {selectedRows.size > 0 && (
              <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                <span className="text-sm font-medium">{selectedRows.size} items selected</span>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export Selected
                </Button>
                <Button variant="outline" size="sm">
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            )}

            {/* Table */}
            <div className="rounded-md border">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={paginatedData.map((item: any) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <Table>
                    {renderTableHeader()}
                    <TableBody>
                      {paginatedData.length > 0 ? (
                        paginatedData.map((item, index) => renderTableRow(item, index))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={12} className="text-center py-8">
                            <div className="flex flex-col items-center gap-2">
                              <Database className="w-8 h-8 text-muted-foreground" />
                              <p className="text-muted-foreground">No data found</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </SortableContext>
              </DndContext>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, processedData.length)} of {processedData.length} results
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Export Data</DialogTitle>
            <DialogDescription>
              Choose the format and data to export
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Data Type</Label>
              <Select defaultValue={activeTab}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendors">Vendors</SelectItem>
                  <SelectItem value="contracts">Contracts</SelectItem>
                  <SelectItem value="rfqs">RFQs</SelectItem>
                  <SelectItem value="purchase-orders">Purchase Orders</SelectItem>
                  <SelectItem value="invoices">Invoices</SelectItem>
                  <SelectItem value="payments">Payments</SelectItem>
                  <SelectItem value="documents">Documents</SelectItem>
                  <SelectItem value="deliveries">Deliveries</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Format</Label>
              <Select defaultValue="csv">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="pdf">PDF Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="include-filtered" defaultChecked />
              <Label htmlFor="include-filtered">Only export filtered data</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                Cancel
              </Button>
              <Button>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};