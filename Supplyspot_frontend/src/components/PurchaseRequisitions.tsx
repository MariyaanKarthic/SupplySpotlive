import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { toast } from 'sonner';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit,
  ArrowLeft,
  CheckCircle2, 
  XCircle, 
  Clock, 
  DollarSign, 
  Building, 
  FileText,
  User,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Layers,
  Trash2,
  Check,
  X
} from 'lucide-react';
import { ModernDataTable, ColumnDef } from './ui/modern-data-table';
import { cn } from './ui/utils';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from './ui/breadcrumb';

// Types & Contracts
export type PRStatus = 'Draft' | 'Pending_Approval' | 'Approved' | 'Rejected' | 'Converted_To_PO' | 'Cancelled';
export type PRType = 'Standard' | 'Service' | 'Stock_Transfer' | 'Subcontracting';

export interface PRItem {
  id: string;
  itemCode?: string;
  materialName?: string;
  description: string;
  category: string;
  productReference?: string;
  quantity: number;
  unitOfMeasure: string;
  estimatedUnitPrice: number;
  estimatedTotalPrice: number;
  glAccount: string;
  costCenter: string;
  plant?: string;
  suggestedSupplierId?: string;
  requiredDeliveryDate: string;
}

export interface PurchaseRequisition {
  id: string;
  prNumber: string;
  requisitionType: PRType;
  requesterId: string;
  requesterName: string;
  department: string;
  justification: string;
  prDate: string;
  purchaseValue?: number;
  items: PRItem[];
  currency: string;
  totalEstimatedAmount: number;
  status: PRStatus;
  approvalHistory: {
    step: number;
    approverRole: string; // 'Dept_Head' | 'Finance_Lead' | 'Procurement'
    approverId?: string;
    approverName?: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    comments?: string;
    actionDate?: string;
  }[];
  convertedPOId?: string;
  createdAt: string;
  updatedAt: string;
}

// Initial Mock Seed Data
const initialPRs: PurchaseRequisition[] = [
  {
    id: 'pr-1',
    prNumber: 'PR-2026-0001',
    requisitionType: 'Service',
    requesterId: 'req-1',
    requesterName: 'Jane Doe',
    department: 'Marketing',
    justification: 'Q1 Marketing Campaign design services & asset creation',
    prDate: '2026-08-09',
    purchaseValue: 12500,
    currency: 'USD',
    totalEstimatedAmount: 12500,
    status: 'Approved',
    items: [
      {
        id: 'item-1',
        itemCode: 'MAT-2026-002',
        materialName: 'Creative Design Services',
        description: 'Creative Design & Branding Services',
        category: 'Services',
        productReference: 'PRD-MKT-01',
        quantity: 1,
        unitOfMeasure: 'Hours',
        estimatedUnitPrice: 12500,
        estimatedTotalPrice: 12500,
        glAccount: '520100',
        costCenter: 'MKT-02',
        plant: 'Plant A - Chennai',
        suggestedSupplierId: 'vendor-1',
        requiredDeliveryDate: '2026-09-15',
      }
    ],
    approvalHistory: [
      { step: 1, approverRole: 'Dept_Head', approverName: 'Alice Head', status: 'Approved', comments: 'Budget is approved for Q1.', actionDate: '2026-08-10' },
      { step: 2, approverRole: 'Finance_Lead', approverName: 'Bob Finance', status: 'Approved', comments: 'Under cost-center allocation limits.', actionDate: '2026-08-11' },
      { step: 3, approverRole: 'Procurement', approverName: 'Charlie Procurement', status: 'Approved', comments: 'Standard SLA terms approved.', actionDate: '2026-08-12' }
    ],
    createdAt: '2026-08-09',
    updatedAt: '2026-08-12'
  },
  {
    id: 'pr-2',
    prNumber: 'PR-2026-0002',
    requisitionType: 'Standard',
    requesterId: 'req-2',
    requesterName: 'John Doe',
    department: 'IT',
    justification: 'Laptops for incoming Q3 software developer hires',
    prDate: '2026-08-04',
    purchaseValue: 8400,
    currency: 'USD',
    totalEstimatedAmount: 8400,
    status: 'Converted_To_PO',
    convertedPOId: 'PO-2026-0043',
    items: [
      { id: 'item-2-1', itemCode: 'MAT-2026-001', materialName: 'Macbook Pro 16"', description: 'Developer Spec Macbook Pro 16"', category: 'IT Equipment', productReference: 'PRD-IT-99', quantity: 3, unitOfMeasure: 'Units', estimatedUnitPrice: 2800, estimatedTotalPrice: 8400, glAccount: '520200', costCenter: 'IT-01', plant: 'Plant A - Chennai', suggestedSupplierId: 'vendor-2', requiredDeliveryDate: '2026-09-01' },
      { id: 'item-2-2', itemCode: 'MAT-2026-012', materialName: 'Dell UltraSharp 27" 4K', description: '4K USB-C Monitor U2723QE', category: 'IT Equipment', productReference: 'PRD-IT-27M', quantity: 6, unitOfMeasure: 'Units', estimatedUnitPrice: 600, estimatedTotalPrice: 3600, glAccount: '520200', costCenter: 'IT-01', plant: 'Plant A - Chennai', suggestedSupplierId: 'vendor-3', requiredDeliveryDate: '2026-09-02' },
      { id: 'item-2-3', itemCode: 'MAT-2026-013', materialName: 'Magic Keyboard & Mouse', description: 'Apple Magic Keyboard and Mouse combo', category: 'IT Accessories', productReference: 'PRD-IT-KB', quantity: 3, unitOfMeasure: 'Sets', estimatedUnitPrice: 200, estimatedTotalPrice: 600, glAccount: '520201', costCenter: 'IT-01', plant: 'Plant A - Chennai', suggestedSupplierId: 'vendor-2', requiredDeliveryDate: '2026-09-01' },
      { id: 'item-2-4', itemCode: 'MAT-2026-014', materialName: 'USB-C Multi-port Hub', description: 'Anker USB-C 7-in-1 Hub', category: 'IT Accessories', productReference: 'PRD-IT-HB', quantity: 3, unitOfMeasure: 'Units', estimatedUnitPrice: 100, estimatedTotalPrice: 300, glAccount: '520201', costCenter: 'IT-01', plant: 'Plant A - Chennai', suggestedSupplierId: 'vendor-4', requiredDeliveryDate: '2026-09-05' },
      { id: 'item-2-5', itemCode: 'MAT-2026-015', materialName: 'Laptop Stand', description: 'Adjustable Aluminum Laptop Stand', category: 'IT Accessories', productReference: 'PRD-IT-LS', quantity: 3, unitOfMeasure: 'Units', estimatedUnitPrice: 50, estimatedTotalPrice: 150, glAccount: '520201', costCenter: 'IT-01', plant: 'Plant A - Chennai', suggestedSupplierId: 'vendor-5', requiredDeliveryDate: '2026-09-05' },
      { id: 'item-2-6', itemCode: 'MAT-2026-016', materialName: 'YubiKey 5 NFC', description: 'Security Key for 2FA', category: 'IT Security', productReference: 'PRD-IT-YK', quantity: 3, unitOfMeasure: 'Units', estimatedUnitPrice: 50, estimatedTotalPrice: 150, glAccount: '520202', costCenter: 'IT-01', plant: 'Plant A - Chennai', suggestedSupplierId: 'vendor-6', requiredDeliveryDate: '2026-09-01' }
    ],
    approvalHistory: [
      { step: 1, approverRole: 'Dept_Head', approverName: 'Alice Head', status: 'Approved', comments: 'Hires confirmed.', actionDate: '2026-08-05' },
      { step: 2, approverRole: 'Finance_Lead', approverName: 'Bob Finance', status: 'Approved', comments: 'Approved.', actionDate: '2026-08-06' }
    ],
    createdAt: '2026-08-04',
    updatedAt: '2026-08-06'
  },
  {
    id: 'pr-3',
    prNumber: 'PR-2026-0003',
    requisitionType: 'Standard',
    requesterId: 'req-3',
    requesterName: 'Mike Johnson',
    department: 'Operations',
    justification: 'High-capacity battery replacements for warehouse forklifts',
    prDate: '2026-08-15',
    purchaseValue: 9200,
    currency: 'USD',
    totalEstimatedAmount: 9200,
    status: 'Pending_Approval',
    items: [
      { id: 'item-3-1', itemCode: 'MAT-2026-003', materialName: 'Forklift Battery Pack', description: 'Forklift Lead-Acid Battery pack', category: 'Maintenance', productReference: 'PRD-OPS-05', quantity: 2, unitOfMeasure: 'Units', estimatedUnitPrice: 4600, estimatedTotalPrice: 9200, glAccount: '520300', costCenter: 'OPS-03', plant: 'Plant B - Mumbai', requiredDeliveryDate: '2026-09-20' },
      { id: 'item-3-2', itemCode: 'MAT-2026-021', materialName: 'Battery Charger Station', description: 'Industrial Forklift Charger 36V', category: 'Maintenance', productReference: 'PRD-OPS-06', quantity: 1, unitOfMeasure: 'Units', estimatedUnitPrice: 2400, estimatedTotalPrice: 2400, glAccount: '520300', costCenter: 'OPS-03', plant: 'Plant B - Mumbai', requiredDeliveryDate: '2026-09-20' },
      { id: 'item-3-3', itemCode: 'MAT-2026-022', materialName: 'Maintenance Toolkit', description: 'Comprehensive heavy-duty mechanic toolkit', category: 'Maintenance', productReference: 'PRD-OPS-07', quantity: 1, unitOfMeasure: 'Units', estimatedUnitPrice: 350, estimatedTotalPrice: 350, glAccount: '520301', costCenter: 'OPS-03', plant: 'Plant B - Mumbai', requiredDeliveryDate: '2026-09-15' },
      { id: 'item-3-4', itemCode: 'MAT-2026-023', materialName: 'Safety Gloves & Goggles', description: 'Chemical resistant PPE sets', category: 'Safety', productReference: 'PRD-OPS-08', quantity: 5, unitOfMeasure: 'Sets', estimatedUnitPrice: 40, estimatedTotalPrice: 200, glAccount: '520302', costCenter: 'OPS-03', plant: 'Plant B - Mumbai', requiredDeliveryDate: '2026-09-15' },
      { id: 'item-3-5', itemCode: 'MAT-2026-024', materialName: 'Spill Containment Kit', description: 'Acid and chemical spill response kit', category: 'Safety', productReference: 'PRD-OPS-09', quantity: 2, unitOfMeasure: 'Units', estimatedUnitPrice: 150, estimatedTotalPrice: 300, glAccount: '520302', costCenter: 'OPS-03', plant: 'Plant B - Mumbai', requiredDeliveryDate: '2026-09-18' }
    ],
    approvalHistory: [
      { step: 1, approverRole: 'Dept_Head', status: 'Pending' },
      { step: 2, approverRole: 'Finance_Lead', status: 'Pending' }
    ],
    createdAt: '2026-08-15',
    updatedAt: '2026-08-15'
  },
  {
    id: 'pr-4',
    prNumber: 'PR-2026-0004',
    requisitionType: 'Standard',
    requesterId: 'req-2',
    requesterName: 'John Doe',
    department: 'IT',
    justification: 'Server rack replacement UPS battery power units',
    prDate: '2026-08-16',
    purchaseValue: 14000,
    currency: 'USD',
    totalEstimatedAmount: 14000,
    status: 'Pending_Approval',
    items: [
      { id: 'item-4-1', itemCode: 'MAT-2026-004', materialName: 'APC Smart-UPS 10kVA', description: 'APC Smart-UPS SRT 10kVA', category: 'IT Equipment', productReference: 'PRD-IT-88', quantity: 2, unitOfMeasure: 'Units', estimatedUnitPrice: 7000, estimatedTotalPrice: 14000, glAccount: '520200', costCenter: 'IT-01', plant: 'Plant A - Chennai', requiredDeliveryDate: '2026-10-01' },
      { id: 'item-4-2', itemCode: 'MAT-2026-031', materialName: 'Extended Battery Pack', description: 'APC SRT192BP2 Extended Battery Pack', category: 'IT Equipment', productReference: 'PRD-IT-89', quantity: 4, unitOfMeasure: 'Units', estimatedUnitPrice: 1500, estimatedTotalPrice: 6000, glAccount: '520200', costCenter: 'IT-01', plant: 'Plant A - Chennai', requiredDeliveryDate: '2026-10-01' },
      { id: 'item-4-3', itemCode: 'MAT-2026-032', materialName: 'Network Management Card', description: 'UPS Network Management Card 3', category: 'IT Accessories', productReference: 'PRD-IT-90', quantity: 2, unitOfMeasure: 'Units', estimatedUnitPrice: 400, estimatedTotalPrice: 800, glAccount: '520201', costCenter: 'IT-01', plant: 'Plant A - Chennai', requiredDeliveryDate: '2026-09-25' },
      { id: 'item-4-4', itemCode: 'MAT-2026-033', materialName: 'Environmental Sensor', description: 'Temperature & Humidity Sensor', category: 'IT Accessories', productReference: 'PRD-IT-91', quantity: 2, unitOfMeasure: 'Units', estimatedUnitPrice: 250, estimatedTotalPrice: 500, glAccount: '520201', costCenter: 'IT-01', plant: 'Plant A - Chennai', requiredDeliveryDate: '2026-09-25' },
      { id: 'item-4-5', itemCode: 'MAT-2026-034', materialName: 'Server Rack Rails', description: 'Heavy Duty 4-Post Rack Mount Rails', category: 'IT Hardware', productReference: 'PRD-IT-92', quantity: 2, unitOfMeasure: 'Sets', estimatedUnitPrice: 100, estimatedTotalPrice: 200, glAccount: '520201', costCenter: 'IT-01', plant: 'Plant A - Chennai', requiredDeliveryDate: '2026-09-20' }
    ],
    approvalHistory: [
      { step: 1, approverRole: 'Dept_Head', status: 'Pending' },
      { step: 2, approverRole: 'Finance_Lead', status: 'Pending' },
      { step: 3, approverRole: 'Procurement', status: 'Pending' }
    ],
    createdAt: '2026-08-16',
    updatedAt: '2026-08-16'
  },
  {
    id: 'pr-5',
    prNumber: 'PR-2026-0005',
    requesterId: 'req-4',
    requesterName: 'Sarah Smith',
    department: 'HR',
    justification: 'Team building annual summit catering & venue booking',
    requisitionType: 'Standard',
    prDate: '2026-08-17',
    purchaseValue: 4500,
    currency: 'USD',
    totalEstimatedAmount: 4500,
    status: 'Draft',
    items: [
      {
        id: 'item-5',
        itemCode: 'MAT-2026-005',
        materialName: 'Summit Venue Packages',
        description: 'Summit Venue & Catering packages',
        category: 'Events',
        productReference: 'PRD-HR-11',
        quantity: 1,
        unitOfMeasure: 'Units',
        estimatedUnitPrice: 4500,
        estimatedTotalPrice: 4500,
        glAccount: '520400',
        costCenter: 'HR-01',
        plant: 'Plant C - Bangalore',
        requiredDeliveryDate: '2026-11-10',
      }
    ],
    approvalHistory: [],
    createdAt: '2026-08-17',
    updatedAt: '2026-08-17'
  },
  {
    id: 'pr-6',
    prNumber: 'PR-2026-0006',
    requisitionType: 'Service',
    requesterId: 'req-5',
    requesterName: 'David Lee',
    department: 'Finance',
    justification: 'Annual subscription renewal for global tax compliance software',
    prDate: '2026-08-14',
    purchaseValue: 750,
    currency: 'USD',
    totalEstimatedAmount: 750,
    status: 'Approved',
    items: [
      {
        id: 'item-6',
        itemCode: 'MAT-2026-006',
        materialName: 'TaxCompliance Cloud Pro',
        description: 'TaxCompliance Cloud Pro subscription',
        category: 'Software License',
        productReference: 'PRD-FIN-44',
        quantity: 1,
        unitOfMeasure: 'Units',
        estimatedUnitPrice: 750,
        estimatedTotalPrice: 750,
        glAccount: '520500',
        costCenter: 'FIN-01',
        plant: 'Plant A - Chennai',
        requiredDeliveryDate: '2026-09-30',
      }
    ],
    approvalHistory: [
      { step: 1, approverRole: 'Dept_Head', approverName: 'Alice Head', status: 'Approved', comments: 'Essential tool renewal.', actionDate: '2026-08-14' }
    ],
    createdAt: '2026-08-14',
    updatedAt: '2026-08-14'
  }
];

interface CatalogMaterial {
  code: string;
  name: string;
  defaultPrice: number;
  defaultCategory: string;
  defaultUom: string;
}

const mockMaterials: CatalogMaterial[] = [
  { code: 'MAT-2026-001', name: 'Macbook Pro 16"', defaultPrice: 2800, defaultCategory: 'IT Equipment', defaultUom: 'Units' },
  { code: 'MAT-2026-002', name: 'Creative Design Services', defaultPrice: 150, defaultCategory: 'Services', defaultUom: 'Hours' },
  { code: 'MAT-2026-003', name: 'Forklift Lead-Acid Battery pack', defaultPrice: 4600, defaultCategory: 'Maintenance', defaultUom: 'Units' },
  { code: 'MAT-2026-004', name: 'APC Smart-UPS SRT 10kVA', defaultPrice: 7000, defaultCategory: 'IT Equipment', defaultUom: 'Units' },
  { code: 'MAT-2026-005', name: 'Summit Venue & Catering packages', defaultPrice: 4500, defaultCategory: 'Events', defaultUom: 'Units' },
  { code: 'MAT-2026-006', name: 'TaxCompliance Cloud Pro subscription', defaultPrice: 750, defaultCategory: 'Software License', defaultUom: 'Units' }
];

const mockPlants = [
  'Plant A - Chennai',
  'Plant B - Mumbai',
  'Plant C - Bangalore',
  'Plant D - New Delhi'
];

const mockUOMs = [
  'Units',
  'Hours',
  'Kilograms',
  'Liters',
  'Services'
];

interface PurchaseRequisitionsProps {
  onNavigate?: (section: any) => void;
}

export function PurchaseRequisitions({ onNavigate }: PurchaseRequisitionsProps) {
  const [prsList, setPrsList] = useState<PurchaseRequisition[]>(initialPRs);
  const [selectedPR, setSelectedPR] = useState<PurchaseRequisition | null>(null);
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'view' | 'edit'>('list');
  const [editingPR, setEditingPR] = useState<PurchaseRequisition | null>(null);
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Approved' | 'Draft'>('All');

  const prepopulateForm = (pr: PurchaseRequisition) => {
    setReqType(pr.requisitionType);
    setJustification(pr.justification);
    setDepartment(pr.department);
    setRequesterName(pr.requesterName);
    setPrDate(pr.prDate);
    setPurchaseValue(pr.purchaseValue || pr.totalEstimatedAmount);
    setItems(pr.items.map(item => ({ ...item })));
  };

  // Form states
  const [reqType, setReqType] = useState<PRType>('Standard');
  const [justification, setJustification] = useState('');
  const [department, setDepartment] = useState('IT');
  const [requesterName, setRequesterName] = useState('Kannan Thangavel');
  const [prDate, setPrDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [purchaseValue, setPurchaseValue] = useState<number>(0);
  const [items, setItems] = useState<PRItem[]>([
    {
      id: 'new-item-1',
      itemCode: '',
      materialName: '',
      description: '',
      category: 'IT Equipment',
      productReference: '',
      quantity: 0,
      unitOfMeasure: 'Units',
      estimatedUnitPrice: 0,
      estimatedTotalPrice: 0,
      glAccount: '520200',
      costCenter: 'IT-01',
      plant: 'Plant A - Chennai',
      requiredDeliveryDate: new Date().toISOString().split('T')[0]
    }
  ]);

  React.useEffect(() => {
    const total = items.reduce((acc, item) => acc + (item.estimatedTotalPrice || 0), 0);
    setPurchaseValue(total);
  }, [items]);

  const getStatusBadge = (status: PRStatus) => {
    switch (status) {
      case 'Draft':
        return <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none shadow-none font-semibold">Draft</Badge>;
      case 'Pending_Approval':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-200 shadow-none font-semibold">Pending Approval</Badge>;
      case 'Approved':
        return <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-none shadow-none font-semibold">Approved</Badge>;
      case 'Rejected':
        return <Badge variant="destructive" className="bg-rose-50 text-rose-700 hover:bg-rose-50 border-none shadow-none font-semibold">Rejected</Badge>;
      case 'Converted_To_PO':
        return <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-none shadow-none font-semibold">Converted to PO</Badge>;
      case 'Cancelled':
        return <Badge variant="outline" className="bg-gray-100 text-gray-500 hover:bg-gray-100 border-none shadow-none font-semibold">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'destructive';
      case 'Medium': return 'default';
      default: return 'secondary';
    }
  };

  // Add Item to Form Repeater
  const handleAddItem = () => {
    const newId = `new-item-${Date.now()}`;
    setItems([
      ...items,
      {
        id: newId,
        itemCode: '',
        materialName: '',
        description: '',
        category: 'IT Equipment',
        productReference: '',
        quantity: 0,
        unitOfMeasure: 'Units',
        estimatedUnitPrice: 0,
        estimatedTotalPrice: 0,
        glAccount: '520200',
        costCenter: 'IT-01',
        plant: 'Plant A - Chennai',
        requiredDeliveryDate: new Date().toISOString().split('T')[0]
      }
    ]);
  };

  // Remove Item from Form Repeater
  const handleRemoveItem = (itemId: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== itemId));
    } else {
      toast.warning('A Purchase Requisition must contain at least one line item.');
    }
  };

  // Update item field value
  const handleUpdateItemField = (itemId: string, field: keyof PRItem, value: any) => {
    const updated = items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        
        // Auto populate fields based on catalog material selection
        if (field === 'materialName') {
          const mat = mockMaterials.find(m => m.name === value);
          if (mat) {
            updatedItem.itemCode = mat.code;
            updatedItem.description = mat.name;
            updatedItem.estimatedUnitPrice = mat.defaultPrice;
            updatedItem.category = mat.defaultCategory;
            updatedItem.unitOfMeasure = mat.defaultUom;
            updatedItem.estimatedTotalPrice = updatedItem.quantity * mat.defaultPrice;
          }
        }
        
        if (field === 'quantity' || field === 'estimatedUnitPrice' || field === 'materialName') {
          const q = field === 'quantity' ? Number(value) : updatedItem.quantity;
          const p = field === 'estimatedUnitPrice' ? Number(value) : updatedItem.estimatedUnitPrice;
          updatedItem.estimatedTotalPrice = q * p;
        }
        return updatedItem;
      }
      return item;
    });
    setItems(updated);
  };

  // Form submit handler
  const handleCreatePR = (saveAsDraft: boolean) => {
    // Basic validations
    const invalidItems = items.some(item => !item.description.trim() || item.estimatedUnitPrice <= 0 || !item.requiredDeliveryDate);
    if (invalidItems) {
      toast.error('Please fill in complete descriptions, estimated prices, and required delivery dates for all items.');
      return;
    }
    if (!justification.trim()) {
      toast.error('Requisition justification is required.');
      return;
    }

    const totalAmount = items.reduce((acc, item) => acc + item.estimatedTotalPrice, 0);

    // Calculate approval tiers based on total amount
    const approvalHistory: any[] = [];
    if (!saveAsDraft) {
      approvalHistory.push({ step: 1, approverRole: 'Dept_Head', status: 'Pending' });
      if (totalAmount > 1000) {
        approvalHistory.push({ step: 2, approverRole: 'Finance_Lead', status: 'Pending' });
      }
      if (totalAmount > 10000) {
        approvalHistory.push({ step: 3, approverRole: 'Procurement', status: 'Pending' });
      }
    }

    const newPR: PurchaseRequisition = {
      id: `pr-${Date.now()}`,
      prNumber: `PR-2026-000${prsList.length + 1}`,
      requisitionType: reqType,
      requesterId: 'req-user',
      requesterName: requesterName,
      department: department,
      justification: justification,
      prDate: prDate,
      purchaseValue: purchaseValue,
      items: items,
      currency: 'USD',
      totalEstimatedAmount: totalAmount,
      status: saveAsDraft ? 'Draft' : 'Pending_Approval',
      approvalHistory: approvalHistory,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };

    setPrsList([newPR, ...prsList]);
    toast.success(saveAsDraft ? 'Purchase Requisition saved as draft.' : 'Purchase Requisition submitted for approval.');
    setCurrentView('list');
    resetForm();
  };

  const handleUpdatePR = (saveAsDraft: boolean) => {
    if (!editingPR) return;

    // Basic validations
    const invalidItems = items.some(item => !item.description.trim() || item.estimatedUnitPrice <= 0 || !item.requiredDeliveryDate);
    if (invalidItems) {
      toast.error('Please fill in complete descriptions, estimated prices, and required delivery dates for all items.');
      return;
    }
    if (!justification.trim()) {
      toast.error('Requisition justification is required.');
      return;
    }

    const totalAmount = items.reduce((acc, item) => acc + item.estimatedTotalPrice, 0);

    const approvalHistory = [...editingPR.approvalHistory];
    if (!saveAsDraft && editingPR.status === 'Draft') {
      // If promoting from Draft to Pending_Approval, calculate approvals matrix
      approvalHistory.push({ step: 1, approverRole: 'Dept_Head', status: 'Pending' });
      if (totalAmount > 1000) {
        approvalHistory.push({ step: 2, approverRole: 'Finance_Lead', status: 'Pending' });
      }
      if (totalAmount > 10000) {
        approvalHistory.push({ step: 3, approverRole: 'Procurement', status: 'Pending' });
      }
    }

    const updatedPR: PurchaseRequisition = {
      ...editingPR,
      requisitionType: reqType,
      department: department,
      requesterName: requesterName,
      justification: justification,
      prDate: prDate,
      purchaseValue: purchaseValue,
      items: items,
      totalEstimatedAmount: totalAmount,
      status: saveAsDraft ? 'Draft' : 'Pending_Approval',
      approvalHistory: approvalHistory,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    setPrsList(prev => prev.map(pr => pr.id === editingPR.id ? updatedPR : pr));
    toast.success(saveAsDraft ? 'Purchase Requisition draft updated.' : 'Purchase Requisition submitted for approval.');
    setCurrentView('list');
    setEditingPR(null);
    resetForm();
  };

  const resetForm = () => {
    setReqType('Standard');
    setJustification('');
    setDepartment('IT');
    setRequesterName('Kannan Thangavel');
    setPrDate(new Date().toISOString().split('T')[0]);
    setPurchaseValue(0);
    setItems([
      {
        id: 'new-item-1',
        itemCode: '',
        materialName: '',
        description: '',
        category: 'IT Equipment',
        productReference: '',
        quantity: 0,
        unitOfMeasure: 'Units',
        estimatedUnitPrice: 0,
        estimatedTotalPrice: 0,
        glAccount: '520200',
        costCenter: 'IT-01',
        plant: 'Plant A - Chennai',
        requiredDeliveryDate: new Date().toISOString().split('T')[0]
      }
    ]);
  };

  // Convert approved PR to PO
  const handleConvertToPO = (prId: string) => {
    const poId = `PO-2026-004${prsList.filter(pr => pr.status === 'Converted_To_PO').length + 4}`;
    const updated = prsList.map(pr => {
      if (pr.id === prId) {
        return {
          ...pr,
          status: 'Converted_To_PO' as PRStatus,
          convertedPOId: poId,
          updatedAt: new Date().toISOString().split('T')[0]
        };
      }
      return pr;
    });
    setPrsList(updated);
    toast.success(`Purchase Requisition successfully converted to Purchase Order: ${poId}`);
    setCurrentView('list');
  };

  // Approval matrix handler
  const handleApprovePR = (prId: string, comments: string) => {
    const updated = prsList.map(pr => {
      if (pr.id === prId) {
        let updatedHistory = [...pr.approvalHistory];
        const pendingIndex = updatedHistory.findIndex(h => h.status === 'Pending');
        if (pendingIndex !== -1) {
          updatedHistory[pendingIndex] = {
            ...updatedHistory[pendingIndex],
            status: 'Approved',
            approverName: 'Current User',
            comments: comments || 'Approved.',
            actionDate: new Date().toISOString().split('T')[0]
          };
        }

        // Check if all steps approved
        const allApproved = updatedHistory.every(h => h.status === 'Approved');
        const nextStatus = allApproved ? 'Approved' : 'Pending_Approval';

        return {
          ...pr,
          status: nextStatus as PRStatus,
          approvalHistory: updatedHistory,
          updatedAt: new Date().toISOString().split('T')[0]
        };
      }
      return pr;
    });
    setPrsList(updated);
    toast.success('Approval step processed successfully.');
    setCurrentView('list');
  };

  // Reject handler
  const handleRejectPR = (prId: string, comments: string) => {
    if (!comments.trim()) {
      toast.error('Rejection comments are required.');
      return;
    }
    const updated = prsList.map(pr => {
      if (pr.id === prId) {
        let updatedHistory = [...pr.approvalHistory];
        const pendingIndex = updatedHistory.findIndex(h => h.status === 'Pending');
        if (pendingIndex !== -1) {
          updatedHistory[pendingIndex] = {
            ...updatedHistory[pendingIndex],
            status: 'Rejected',
            approverName: 'Current User',
            comments: comments,
            actionDate: new Date().toISOString().split('T')[0]
          };
        }

        return {
          ...pr,
          status: 'Rejected' as PRStatus,
          approvalHistory: updatedHistory,
          updatedAt: new Date().toISOString().split('T')[0]
        };
      }
      return pr;
    });
    setPrsList(updated);
    toast.error('Purchase Requisition has been rejected.');
    setCurrentView('list');
  };

  // Filtered dataset for grid tab switcher
  const filteredData = prsList.filter(pr => {
    if (activeTab === 'Pending') return pr.status === 'Pending_Approval';
    if (activeTab === 'Approved') return pr.status === 'Approved';
    if (activeTab === 'Draft') return pr.status === 'Draft';
    return true;
  });

  const columns: ColumnDef<PurchaseRequisition>[] = [
    {
      key: 'prNumber',
      header: 'PR Details',
      sortable: true,
      render: (pr: PurchaseRequisition) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-slate-105 leading-tight">{pr.prNumber}</p>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">{pr.requisitionType} Type</p>
        </div>
      )
    },
    {
      key: 'requesterName',
      header: 'Requester & Dept',
      sortable: true,
      render: (pr: PurchaseRequisition) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-slate-105 leading-tight">{pr.requesterName}</p>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">{pr.department}</p>
        </div>
      )
    },
    {
      key: 'items',
      header: 'Line Items',
      sortable: true,
      render: (pr: PurchaseRequisition) => <span className="font-semibold text-slate-600 dark:text-slate-350">{pr.items.length} items</span>
    },
    {
      key: 'totalEstimatedAmount',
      header: 'Total Est. Amount',
      sortable: true,
      render: (pr: PurchaseRequisition) => (
        <span className="font-bold text-slate-900 dark:text-slate-105">
          ${pr.totalEstimatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      sortable: true,
      render: (pr: PurchaseRequisition) => <span className="text-sm font-semibold text-slate-500">{pr.createdAt}</span>
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (pr: PurchaseRequisition) => getStatusBadge(pr.status)
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (pr: PurchaseRequisition) => (
        <div className="flex items-center justify-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => { setSelectedPR(pr); setCurrentView('view'); }} title="View Details">
            <Eye className="w-4 h-4" />
          </Button>
          {pr.status === 'Draft' && (
            <Button size="sm" variant="ghost" onClick={() => { setEditingPR(pr); prepopulateForm(pr); setCurrentView('edit'); }} title="Edit Draft">
              <Edit className="w-4 h-4 text-indigo-600" />
            </Button>
          )}
          {pr.status === 'Approved' && (
            <Button size="sm" onClick={() => handleConvertToPO(pr.id)} className="h-7 text-xs font-semibold px-2.5">
              Convert PO
            </Button>
          )}
        </div>
      )
    }
  ];

  if (currentView === 'create' || currentView === 'edit') {
    const isEdit = currentView === 'edit';
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
                <BreadcrumbLink 
                  onClick={() => { setCurrentView('list'); setEditingPR(null); resetForm(); }} 
                  className="cursor-pointer"
                >
                  Purchase Requisitions
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{isEdit ? `Edit Requisition` : 'Create Requisition'}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center justify-between w-full">
            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
              {isEdit ? `Edit Requisition (${editingPR?.prNumber})` : 'Create Purchase Requisition'}
            </h1>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => { setCurrentView('list'); setEditingPR(null); resetForm(); }} className="text-slate-650 hover:text-slate-900 font-semibold hover:bg-transparent">Cancel</Button>
              <Button variant="outline" onClick={() => isEdit ? handleUpdatePR(true) : handleCreatePR(true)} className="font-semibold border-slate-200 text-slate-800 bg-white hover:bg-slate-50">Save Draft</Button>
              <Button onClick={() => isEdit ? handleUpdatePR(false) : handleCreatePR(false)} className="font-semibold bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-950 hover:bg-slate-800 rounded-md">Submit for Approval</Button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Read-Only HEADER Block */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-5 grid grid-cols-3 gap-4 text-sm shadow-sm">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">PR Number</span>
              <span className="font-bold text-slate-850 dark:text-slate-200 mt-1 block">
                {isEdit ? editingPR?.prNumber : `PR-2026-000${prsList.length + 1}`}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Created By</span>
              <span className="font-bold text-slate-850 dark:text-slate-200 mt-1 block">
                {requesterName}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Created On</span>
              <span className="font-bold text-slate-850 dark:text-slate-200 mt-1 block">
                {new Date().toLocaleDateString('en-GB')}
              </span>
            </div>
          </div>

          {/* Form Inputs Grid */}
          <div className="grid grid-cols-3 gap-4 pt-1">
            <div>
              <Label htmlFor="prDate" className="font-semibold text-[10px] text-slate-400 uppercase tracking-wider">PR Date</Label>
              <Input 
                id="prDate" 
                type="date"
                value={prDate} 
                onChange={(e) => setPrDate(e.target.value)}
                className="mt-1.5 h-10 text-sm bg-[#f8fafc] dark:bg-slate-900 border-slate-200"
              />
            </div>
            <div>
              <Label htmlFor="department" className="font-semibold text-[10px] text-slate-400 uppercase tracking-wider">Dept *</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger id="department" className="mt-1.5 h-10 text-sm bg-[#f8fafc] dark:bg-slate-900 border-slate-200">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IT">IT Department</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                  <SelectItem value="HR">Human Resources</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="purchaseValue" className="font-semibold text-[10px] text-slate-400 uppercase tracking-wider">Purchase Value</Label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-3 text-xs text-slate-400 font-semibold">$</span>
                <Input 
                  id="purchaseValue" 
                  type="number"
                  value={purchaseValue}
                  onChange={(e) => setPurchaseValue(Number(e.target.value))}
                  className="pl-7 h-10 text-sm font-semibold bg-[#f8fafc] dark:bg-slate-900 border-slate-200"
                />
              </div>
            </div>
          </div>

          {/* PR Type & Justification Row */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="reqType" className="font-semibold text-[10px] text-slate-400 uppercase tracking-wider">PR Type</Label>
              <Select value={reqType} onValueChange={(val) => setReqType(val as PRType)}>
                <SelectTrigger id="reqType" className="mt-1.5 h-10 text-sm bg-[#f8fafc] dark:bg-slate-900 border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Standard">Standard Purchase</SelectItem>
                  <SelectItem value="Service">Service Agreement</SelectItem>
                  <SelectItem value="Stock_Transfer">Stock Transfer</SelectItem>
                  <SelectItem value="Subcontracting">Subcontracting</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="justification" className="font-semibold text-[10px] text-slate-400 uppercase tracking-wider">Justification / Purpose</Label>
              <Input 
                id="justification" 
                placeholder="Describe why this requisition is necessary..." 
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                className="mt-1.5 h-10 text-sm bg-[#f8fafc] dark:bg-slate-900 border-slate-200"
              />
            </div>
          </div>

          {/* Line Items List Heading & Add button */}
          <div className="pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">Line Items List</span>
                <span className="text-xs text-slate-400 font-medium">({items.length} {items.length === 1 ? 'item' : 'items'})</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleAddItem} className="h-8 text-xs font-semibold gap-1 border-slate-200 hover:bg-slate-50">
                <Plus className="w-3.5 h-3.5" />
                Add Line Item
              </Button>
            </div>

            {/* Cards Stack */}
            <div className="space-y-4">
              {items.map((item, idx) => (
                <Card key={item.id} className="p-5 bg-white dark:bg-slate-950 relative overflow-visible border border-slate-200 dark:border-slate-800 shadow-sm rounded-lg">
                  <Button 
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(item.id)} 
                    className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors p-1 h-auto w-auto hover:bg-transparent"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>

                  <div className="space-y-4 pr-6">
                    {/* Row 1: Material selector, material no, description */}
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-4">
                        <Label className="font-semibold text-[10px] text-slate-400 uppercase tracking-wider">Material No</Label>
                        <Input 
                          value={item.itemCode || '—'} 
                          readOnly 
                          className="mt-1.5 h-10 text-xs bg-[#f8fafc] dark:bg-slate-900 border-dashed border-slate-200 text-slate-500 font-semibold text-center"
                        />
                      </div>
                      <div className="col-span-4">
                        <Label className="font-semibold text-[10px] text-slate-400 uppercase tracking-wider">Material</Label>
                        <Select 
                          value={item.materialName || ''} 
                          onValueChange={(val) => handleUpdateItemField(item.id, 'materialName', val)}
                        >
                          <SelectTrigger className="mt-1.5 h-10 text-xs bg-white dark:bg-slate-955 border-slate-200">
                            <SelectValue placeholder="Select material" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockMaterials.map(m => (
                              <SelectItem key={m.code} value={m.name}>{m.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-4">
                        <Label className="font-semibold text-[10px] text-slate-400 uppercase tracking-wider">Item Description</Label>
                        <Input 
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => handleUpdateItemField(item.id, 'description', e.target.value)}
                          className="mt-1.5 h-10 text-xs bg-white dark:bg-slate-950 border-slate-200"
                        />
                      </div>
                    </div>

                    {/* Row 2: Product Reference, Plant, Delivery Date, Qty, UoM, Price */}
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-2">
                        <Label className="font-semibold text-[10px] text-slate-400 uppercase tracking-wider">Product Reference</Label>
                        <Input 
                          placeholder="Reference"
                          value={item.productReference || ''}
                          onChange={(e) => handleUpdateItemField(item.id, 'productReference', e.target.value)}
                          className="mt-1.5 h-10 text-xs bg-white dark:bg-slate-950 border-slate-200"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="font-semibold text-[10px] text-slate-400 uppercase tracking-wider">Plant</Label>
                        <Select 
                          value={item.plant || ''} 
                          onValueChange={(val) => handleUpdateItemField(item.id, 'plant', val)}
                        >
                          <SelectTrigger className="mt-1.5 h-10 text-xs bg-white dark:bg-slate-950 border-slate-200">
                            <SelectValue placeholder="Select plant" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockPlants.map(p => (
                              <SelectItem key={p} value={p}>{p}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label className="font-semibold text-[10px] text-slate-400 uppercase tracking-wider">Delivery Date</Label>
                        <Input 
                          type="date"
                          value={item.requiredDeliveryDate}
                          onChange={(e) => handleUpdateItemField(item.id, 'requiredDeliveryDate', e.target.value)}
                          className="mt-1.5 h-10 text-xs bg-white dark:bg-slate-950 border-slate-200"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="font-semibold text-[10px] text-slate-400 uppercase tracking-wider">Qty</Label>
                        <Input 
                          type="number"
                          min="0"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItemField(item.id, 'quantity', e.target.value)}
                          className="mt-1.5 h-10 text-xs bg-white dark:bg-slate-950 border-slate-200 text-center font-semibold"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="font-semibold text-[10px] text-slate-400 uppercase tracking-wider">UoM</Label>
                        <Select 
                          value={item.unitOfMeasure} 
                          onValueChange={(val) => handleUpdateItemField(item.id, 'unitOfMeasure', val)}
                        >
                          <SelectTrigger className="mt-1.5 h-10 text-xs bg-white dark:bg-slate-950 border-slate-200">
                            <SelectValue placeholder="Units" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockUOMs.map(u => (
                              <SelectItem key={u} value={u}>{u}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label className="font-semibold text-[10px] text-slate-400 uppercase tracking-wider">Price ($)</Label>
                        <Input 
                          type="number"
                          min="0"
                          value={item.estimatedUnitPrice || ''}
                          onChange={(e) => handleUpdateItemField(item.id, 'estimatedUnitPrice', e.target.value)}
                          className="mt-1.5 h-10 text-xs bg-white dark:bg-slate-950 border-slate-200 text-right font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'view' && selectedPR) {
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
                <BreadcrumbLink 
                  onClick={() => setCurrentView('list')} 
                  className="cursor-pointer"
                >
                  Purchase Requisitions
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{selectedPR.prNumber}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">{selectedPR.prNumber}</h1>
              {getStatusBadge(selectedPR.status)}
            </div>
            <div className="flex gap-2">
              {selectedPR.status === 'Approved' && (
                <Button 
                  onClick={() => handleConvertToPO(selectedPR.id)} 
                  className="gap-1.5 font-semibold bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-950 hover:bg-slate-800 rounded-md shadow-sm"
                >
                  Convert to Purchase Order
                </Button>
              )}

            </div>
          </div>
        </div>        <div className="space-y-6">
          {/* Read-Only DETAILS Block */}
          <div className="grid grid-cols-4 gap-y-6 gap-x-4 text-sm px-1">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">PR Number</span>
              <span className="font-bold text-slate-850 dark:text-slate-200 mt-1 block">{selectedPR.prNumber}</span>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Created By</span>
              <span className="font-bold text-slate-850 dark:text-slate-200 mt-1 block">{selectedPR.requesterName}</span>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Created On</span>
              <span className="font-bold text-slate-850 dark:text-slate-200 mt-1 block">
                {selectedPR.createdAt}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">PR Date</span>
              <span className="font-bold text-slate-850 dark:text-slate-200 mt-1 block">{selectedPR.prDate}</span>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Dept</span>
              <span className="font-bold text-slate-850 dark:text-slate-200 mt-1 block">{selectedPR.department}</span>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Purchase Value</span>
              <span className="font-bold text-slate-850 dark:text-slate-200 mt-1 block">${selectedPR.purchaseValue || selectedPR.totalEstimatedAmount}</span>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">PR Type</span>
              <span className="font-bold text-slate-850 dark:text-slate-200 mt-1 block">{selectedPR.requisitionType}</span>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Justification / Purpose</span>
              <span className="font-bold text-slate-850 dark:text-slate-200 mt-1 block">{selectedPR.justification}</span>
            </div>
          </div>

          {/* Line items list */}
          <div className="pt-4 space-y-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">Line Items Details</span>
                <span className="text-xs text-slate-400 font-medium">({selectedPR.items.length} {selectedPR.items.length === 1 ? 'item' : 'items'})</span>
              </div>
            </div>

            {/* Table View */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                    <TableRow>
                      <TableHead className="w-[120px] font-semibold text-xs uppercase tracking-wider text-slate-500">Material No</TableHead>
                      <TableHead className="min-w-[150px] font-semibold text-xs uppercase tracking-wider text-slate-500">Material</TableHead>
                      <TableHead className="min-w-[200px] font-semibold text-xs uppercase tracking-wider text-slate-500">Description</TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider text-slate-500">Ref / Plant</TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider text-slate-500">Delivery Date</TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider text-slate-500 text-right">Qty / UoM</TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider text-slate-500 text-right">Unit Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedPR.items.map((item) => (
                      <TableRow key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/25">
                        <TableCell className="font-medium text-slate-900 dark:text-slate-100 text-sm">{item.itemCode || '—'}</TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300 text-sm">{item.materialName || '—'}</TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300 text-sm">{item.description}</TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300 text-sm">
                          <div className="flex flex-col">
                            <span>{item.productReference || '—'}</span>
                            <span className="text-xs text-slate-500">{item.plant || '—'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300 text-sm">{item.requiredDeliveryDate}</TableCell>
                        <TableCell className="text-right text-slate-700 dark:text-slate-300 text-sm">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{item.quantity}</span>
                          <span className="text-slate-500 ml-1 text-xs">{item.unitOfMeasure}</span>
                        </TableCell>
                        <TableCell className="text-right text-slate-900 dark:text-slate-100 font-medium text-sm">
                          ${item.estimatedUnitPrice}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

            {/* Actions Section */}
            {selectedPR.status === 'Pending_Approval' && (
              <div className="border-t pt-4 space-y-3">
                <Label className="font-bold text-xs text-slate-400 uppercase tracking-wider">Approver Actions & Comments</Label>
                <Textarea 
                  id="approverComments" 
                  placeholder="Add comments for approval or rejection..."
                  className="text-sm bg-white dark:bg-slate-950"
                  rows={2.5}
                />
                <div className="flex gap-2 justify-end pt-1">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      const comments = (document.getElementById('approverComments') as HTMLTextAreaElement)?.value || '';
                      handleRejectPR(selectedPR.id, comments);
                    }} 
                    className="gap-1 border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject Requisition
                  </Button>
                  <Button 
                    onClick={() => {
                      const comments = (document.getElementById('approverComments') as HTMLTextAreaElement)?.value || '';
                      handleApprovePR(selectedPR.id, comments);
                    }} 
                    className="gap-1 bg-emerald-600 hover:bg-emerald-700 font-semibold text-white"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve Requisition
                  </Button>
                </div>
              </div>
            )}

            {selectedPR.status === 'Converted_To_PO' && (
              <div className="border-t pt-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">Linked Document</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">{selectedPR.convertedPOId}</p>
                </div>
                <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">Converted Successfully</Badge>
              </div>
            )}
          </div>
        </div>
      );
  }

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
              <BreadcrumbPage>Purchase Requisitions</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center justify-between w-full">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Purchase Requisitions</h1>
          <Button onClick={() => { setCurrentView('create'); resetForm(); }} className="gap-1.5 shadow-sm font-semibold h-9.5 px-4">
            <Plus className="w-4 h-4" />
            Create PR
          </Button>
        </div>
      </div>

      {/* Overview Analytics row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-slate-400 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Total requisitions</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-200 mt-1">{prsList.length}</p>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg">
              <ClipboardList className="w-5 h-5 text-slate-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Awaiting approvals</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-200 mt-1">
                {prsList.filter(p => p.status === 'Pending_Approval').length}
              </p>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Approved lists</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-200 mt-1">
                {prsList.filter(p => p.status === 'Approved').length}
              </p>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">PO conversions</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-200 mt-1">
                {prsList.filter(p => p.status === 'Converted_To_PO').length}
              </p>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-lg">
              <ArrowRight className="w-5 h-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid view switcher tabs */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="space-y-4">
        <TabsList className="w-fit">
          <TabsTrigger value="All" className="gap-2">All</TabsTrigger>
          <TabsTrigger value="Pending" className="gap-2">Pending Approval</TabsTrigger>
          <TabsTrigger value="Approved" className="gap-2">Approved & Ready</TabsTrigger>
          <TabsTrigger value="Draft" className="gap-2">Draft</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Modern Data Table */}
      <ModernDataTable
        title="Purchase Requisitions Directory"
        data={filteredData}
        columns={columns}
        idKey="id"
        searchPlaceholder="Search requisitions..."
        searchKeys={['prNumber', 'requesterName', 'justification']}
        selectable={true}
        draggable={true}
        onRowOrderChange={(reordered: PurchaseRequisition[]) => setPrsList(reordered)}
        exportEnabled={true}
      />
    </div>
  );
}
