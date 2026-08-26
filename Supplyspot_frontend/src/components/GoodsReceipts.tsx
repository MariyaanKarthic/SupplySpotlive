import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from './ui/sheet';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { DatePicker } from './ui/date-picker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
// Standardized Draggable components are used from ui/draggable-table-row
import { 
  Bell,
  Search, 
  Filter,
  Columns,
  Printer,
  MoreHorizontal, 
  Edit, 
  Eye,
  Download,
  Package,
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Truck,
  ClipboardCheck,
  Camera,
  Grid,
  List,
  Table as TableIcon,
  Plus,
  Save,
  X,
  Check,
  ShoppingCart,
  Building,
  MapPin,
  User,
  History,
  MessageSquare,
  Upload,
  CheckSquare,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  BarChart3,
  FileCheck,
  Scan,
  CheckCheck,
  MinusCircle,
  Receipt
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
import { toast } from 'sonner';
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
import { ModernDataTable, ColumnDef } from './ui/modern-data-table';
import { Settings2, ArrowUpDown, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from './ui/breadcrumb';

// Mock data for Goods Receipts
const mockGoodsReceipts = [
  {
    id: 1,
    grNumber: 'GR-2024-001',
    poNumber: 'PO-2023-001',
    poId: 1,
    vendor: 'Tech Solutions Ltd.',
    vendorCode: 'VEN001',
    receiptDate: '2024-02-14',
    expectedDate: '2024-02-15',
    status: 'Completed',
    receivedBy: 'John Smith',
    inspectedBy: 'Sarah Johnson',
    location: 'Warehouse A - Bay 3',
    warehouse: 'Central Warehouse',
    totalItems: 3,
    itemsReceived: 3,
    itemsAccepted: 3,
    itemsRejected: 0,
    qualityStatus: 'Passed',
    matchingStatus: '3-Way Matched',
    invoiceMatched: true,
    poMatched: true,
    notes: 'All items received in good condition. Quality inspection completed.',
    lineItems: [
      { 
        id: 1, 
        item: 'Laptops (HP EliteBook)', 
        poQty: 10, 
        receivedQty: 10, 
        acceptedQty: 10, 
        rejectedQty: 0,
        uom: 'Units',
        batchNumber: 'BATCH-2024-001',
        serialNumbers: ['SN001', 'SN002', 'SN003'],
        inspectionStatus: 'Passed',
        inspectionNotes: 'All units working properly',
        location: 'Bay 3, Shelf A'
      },
      { 
        id: 2, 
        item: 'Monitors (Dell 24")', 
        poQty: 15, 
        receivedQty: 15, 
        acceptedQty: 15, 
        rejectedQty: 0,
        uom: 'Units',
        batchNumber: 'BATCH-2024-002',
        inspectionStatus: 'Passed',
        inspectionNotes: 'No physical damage, display tests passed',
        location: 'Bay 3, Shelf B'
      },
      { 
        id: 3, 
        item: 'Office Chairs (Ergonomic)', 
        poQty: 20, 
        receivedQty: 20, 
        acceptedQty: 20, 
        rejectedQty: 0,
        uom: 'Units',
        batchNumber: 'BATCH-2024-003',
        inspectionStatus: 'Passed',
        inspectionNotes: 'All chairs meet ergonomic standards',
        location: 'Bay 3, Shelf C'
      }
    ],
    documents: [
      { id: 1, name: 'Delivery_Note_GR001.pdf', type: 'Delivery Note', uploadDate: '2024-02-14', size: '245 KB' },
      { id: 2, name: 'Packing_List_GR001.pdf', type: 'Packing List', uploadDate: '2024-02-14', size: '187 KB' },
      { id: 3, name: 'Quality_Inspection_Report.pdf', type: 'Quality Report', uploadDate: '2024-02-14', size: '523 KB' }
    ],
    images: [
      { id: 1, name: 'received_items_1.jpg', uploadDate: '2024-02-14' },
      { id: 2, name: 'quality_check_1.jpg', uploadDate: '2024-02-14' }
    ],
    history: [
      { id: 1, action: 'GR Created', user: 'John Smith', timestamp: '2024-02-14 09:00', details: 'Goods receipt created' },
      { id: 2, action: 'Items Received', user: 'John Smith', timestamp: '2024-02-14 09:30', details: 'All items physically received' },
      { id: 3, action: 'Quality Inspection', user: 'Sarah Johnson', timestamp: '2024-02-14 11:00', details: 'Quality inspection completed - Passed' },
      { id: 4, action: 'GR Completed', user: 'Sarah Johnson', timestamp: '2024-02-14 11:30', details: 'Goods receipt finalized' }
    ]
  },
  {
    id: 2,
    grNumber: 'GR-2024-002',
    poNumber: 'PO-2023-002',
    poId: 2,
    vendor: 'Global Supplies Inc.',
    vendorCode: 'VEN002',
    receiptDate: '2024-02-15',
    expectedDate: '2024-02-15',
    status: 'Pending Inspection',
    receivedBy: 'Michael Brown',
    inspectedBy: null,
    location: 'Warehouse B - Bay 1',
    warehouse: 'Central Warehouse',
    totalItems: 2,
    itemsReceived: 2,
    itemsAccepted: 0,
    itemsRejected: 0,
    qualityStatus: 'Pending',
    matchingStatus: 'PO Matched',
    invoiceMatched: false,
    poMatched: true,
    notes: 'Items received, awaiting quality inspection.',
    lineItems: [
      { 
        id: 1, 
        item: 'Office 365 E3 Licenses', 
        poQty: 50, 
        receivedQty: 50, 
        acceptedQty: 0, 
        rejectedQty: 0,
        uom: 'Licenses',
        batchNumber: 'LICENSE-2024-001',
        inspectionStatus: 'Pending',
        inspectionNotes: '',
        location: 'Digital Asset - No Physical Location'
      },
      { 
        id: 2, 
        item: 'Teams Premium Licenses', 
        poQty: 50, 
        receivedQty: 50, 
        acceptedQty: 0, 
        rejectedQty: 0,
        uom: 'Licenses',
        batchNumber: 'LICENSE-2024-002',
        inspectionStatus: 'Pending',
        inspectionNotes: '',
        location: 'Digital Asset - No Physical Location'
      }
    ],
    documents: [
      { id: 1, name: 'License_Confirmation.pdf', type: 'Confirmation', uploadDate: '2024-02-15', size: '156 KB' }
    ],
    images: [],
    history: [
      { id: 1, action: 'GR Created', user: 'Michael Brown', timestamp: '2024-02-15 10:00', details: 'Goods receipt created' },
      { id: 2, action: 'Items Received', user: 'Michael Brown', timestamp: '2024-02-15 10:15', details: 'License confirmation received' }
    ]
  },
  {
    id: 3,
    grNumber: 'GR-2024-003',
    poNumber: 'PO-2023-003',
    poId: 3,
    vendor: 'Industrial Parts Co.',
    vendorCode: 'VEN003',
    receiptDate: '2024-02-13',
    expectedDate: '2024-02-12',
    status: 'Partial',
    receivedBy: 'David Wilson',
    inspectedBy: 'Sarah Johnson',
    location: 'Warehouse A - Bay 5',
    warehouse: 'Central Warehouse',
    totalItems: 4,
    itemsReceived: 4,
    itemsAccepted: 3,
    itemsRejected: 1,
    qualityStatus: 'Issues Found',
    matchingStatus: 'Variance',
    invoiceMatched: false,
    poMatched: true,
    notes: 'Partial receipt - 1 item rejected due to quality issues. Replacement requested.',
    lineItems: [
      { 
        id: 1, 
        item: 'Industrial Pumps (Model X200)', 
        poQty: 5, 
        receivedQty: 5, 
        acceptedQty: 4, 
        rejectedQty: 1,
        uom: 'Units',
        batchNumber: 'PUMP-2024-001',
        serialNumbers: ['PUMP001', 'PUMP002', 'PUMP003', 'PUMP004'],
        inspectionStatus: 'Issues Found',
        inspectionNotes: 'Unit PUMP005 failed pressure test - shaft misalignment detected',
        location: 'Bay 5, Section A'
      },
      { 
        id: 2, 
        item: 'Industrial Valves (3-inch)', 
        poQty: 20, 
        receivedQty: 20, 
        acceptedQty: 20, 
        rejectedQty: 0,
        uom: 'Units',
        batchNumber: 'VALVE-2024-001',
        inspectionStatus: 'Passed',
        inspectionNotes: 'All valves meet specifications',
        location: 'Bay 5, Section B'
      },
      { 
        id: 3, 
        item: 'Pressure Gauges (Digital)', 
        poQty: 15, 
        receivedQty: 15, 
        acceptedQty: 15, 
        rejectedQty: 0,
        uom: 'Units',
        batchNumber: 'GAUGE-2024-001',
        inspectionStatus: 'Passed',
        inspectionNotes: 'Calibration verified',
        location: 'Bay 5, Section C'
      },
      { 
        id: 4, 
        item: 'Safety Relief Valves', 
        poQty: 10, 
        receivedQty: 10, 
        acceptedQty: 10, 
        rejectedQty: 0,
        uom: 'Units',
        batchNumber: 'SAFETY-2024-001',
        inspectionStatus: 'Passed',
        inspectionNotes: 'Safety certification verified',
        location: 'Bay 5, Section D'
      }
    ],
    documents: [
      { id: 1, name: 'Delivery_Note.pdf', type: 'Delivery Note', uploadDate: '2024-02-13', size: '298 KB' },
      { id: 2, name: 'Quality_Report_Issues.pdf', type: 'Quality Report', uploadDate: '2024-02-13', size: '645 KB' },
      { id: 3, name: 'Rejection_Notice.pdf', type: 'Rejection', uploadDate: '2024-02-13', size: '123 KB' }
    ],
    images: [
      { id: 1, name: 'defective_pump.jpg', uploadDate: '2024-02-13' }
    ],
    history: [
      { id: 1, action: 'GR Created', user: 'David Wilson', timestamp: '2024-02-13 08:00', details: 'Goods receipt created' },
      { id: 2, action: 'Items Received', user: 'David Wilson', timestamp: '2024-02-13 08:45', details: 'Items physically received - 1 day late' },
      { id: 3, action: 'Quality Inspection', user: 'Sarah Johnson', timestamp: '2024-02-13 10:30', details: 'Quality inspection - Issues found with 1 pump' },
      { id: 4, action: 'Item Rejected', user: 'Sarah Johnson', timestamp: '2024-02-13 11:00', details: 'Pump PUMP005 rejected - shaft misalignment' },
      { id: 5, action: 'Status Updated', user: 'David Wilson', timestamp: '2024-02-13 14:00', details: 'Status changed to Partial - Replacement requested' }
    ]
  },
  {
    id: 4,
    grNumber: 'GR-2024-004',
    poNumber: 'PO-2023-004',
    poId: 4,
    vendor: 'Office Furniture Plus',
    vendorCode: 'VEN004',
    receiptDate: '2024-02-16',
    expectedDate: '2024-02-18',
    status: 'Draft',
    receivedBy: 'Emily Davis',
    inspectedBy: null,
    location: 'Warehouse C - Receiving Dock',
    warehouse: 'North Warehouse',
    totalItems: 5,
    itemsReceived: 5,
    itemsAccepted: 0,
    itemsRejected: 0,
    qualityStatus: 'Not Started',
    matchingStatus: 'PO Matched',
    invoiceMatched: false,
    poMatched: true,
    notes: 'Early delivery - Items being unloaded, GR in progress.',
    lineItems: [
      { 
        id: 1, 
        item: 'Executive Desks (Oak)', 
        poQty: 8, 
        receivedQty: 8, 
        acceptedQty: 0, 
        rejectedQty: 0,
        uom: 'Units',
        batchNumber: '',
        inspectionStatus: 'Not Started',
        inspectionNotes: '',
        location: 'Receiving Dock'
      },
      { 
        id: 2, 
        item: 'Filing Cabinets (4-Drawer)', 
        poQty: 12, 
        receivedQty: 12, 
        acceptedQty: 0, 
        rejectedQty: 0,
        uom: 'Units',
        batchNumber: '',
        inspectionStatus: 'Not Started',
        inspectionNotes: '',
        location: 'Receiving Dock'
      },
      { 
        id: 3, 
        item: 'Conference Tables (10-Seater)', 
        poQty: 3, 
        receivedQty: 3, 
        acceptedQty: 0, 
        rejectedQty: 0,
        uom: 'Units',
        batchNumber: '',
        inspectionStatus: 'Not Started',
        inspectionNotes: '',
        location: 'Receiving Dock'
      },
      { 
        id: 4, 
        item: 'Visitor Chairs (Mesh Back)', 
        poQty: 24, 
        receivedQty: 24, 
        acceptedQty: 0, 
        rejectedQty: 0,
        uom: 'Units',
        batchNumber: '',
        inspectionStatus: 'Not Started',
        inspectionNotes: '',
        location: 'Receiving Dock'
      },
      { 
        id: 5, 
        item: 'Storage Cabinets (Mobile)', 
        poQty: 10, 
        receivedQty: 10, 
        acceptedQty: 0, 
        rejectedQty: 0,
        uom: 'Units',
        batchNumber: '',
        inspectionStatus: 'Not Started',
        inspectionNotes: '',
        location: 'Receiving Dock'
      }
    ],
    documents: [],
    images: [],
    history: [
      { id: 1, action: 'GR Created', user: 'Emily Davis', timestamp: '2024-02-16 07:30', details: 'Goods receipt created - Early delivery' }
    ]
  },
  {
    id: 5,
    grNumber: 'GR-2024-005',
    poNumber: 'PO-2023-005',
    poId: 5,
    vendor: 'Electronic Components Ltd.',
    vendorCode: 'VEN005',
    receiptDate: '2024-02-12',
    expectedDate: '2024-02-10',
    status: 'Rejected',
    receivedBy: 'Robert Taylor',
    inspectedBy: 'Sarah Johnson',
    location: 'Warehouse B - Quarantine Area',
    warehouse: 'Central Warehouse',
    totalItems: 3,
    itemsReceived: 3,
    itemsAccepted: 0,
    itemsRejected: 3,
    qualityStatus: 'Failed',
    matchingStatus: 'Not Matched',
    invoiceMatched: false,
    poMatched: false,
    notes: 'Full rejection - All items failed quality inspection. Incorrect specifications. Return to vendor initiated.',
    lineItems: [
      { 
        id: 1, 
        item: 'Microcontrollers (ARM Cortex)', 
        poQty: 100, 
        receivedQty: 100, 
        acceptedQty: 0, 
        rejectedQty: 100,
        uom: 'Units',
        batchNumber: 'MCU-2024-001',
        inspectionStatus: 'Failed',
        inspectionNotes: 'Wrong model received - M3 instead of M4. Does not meet specifications.',
        location: 'Quarantine Area'
      },
      { 
        id: 2, 
        item: 'PCB Boards (Custom Design)', 
        poQty: 50, 
        receivedQty: 50, 
        acceptedQty: 0, 
        rejectedQty: 50,
        uom: 'Units',
        batchNumber: 'PCB-2024-001',
        inspectionStatus: 'Failed',
        inspectionNotes: 'Design revision mismatch - Rev A received instead of Rev C',
        location: 'Quarantine Area'
      },
      { 
        id: 3, 
        item: 'Power Supply Units (12V)', 
        poQty: 75, 
        receivedQty: 75, 
        acceptedQty: 0, 
        rejectedQty: 75,
        uom: 'Units',
        batchNumber: 'PSU-2024-001',
        inspectionStatus: 'Failed',
        inspectionNotes: 'Voltage output unstable - Failed electrical testing',
        location: 'Quarantine Area'
      }
    ],
    documents: [
      { id: 1, name: 'Delivery_Note.pdf', type: 'Delivery Note', uploadDate: '2024-02-12', size: '234 KB' },
      { id: 2, name: 'Quality_Failure_Report.pdf', type: 'Quality Report', uploadDate: '2024-02-12', size: '892 KB' },
      { id: 3, name: 'Return_Authorization.pdf', type: 'Return', uploadDate: '2024-02-12', size: '178 KB' }
    ],
    images: [
      { id: 1, name: 'incorrect_items_1.jpg', uploadDate: '2024-02-12' },
      { id: 2, name: 'incorrect_items_2.jpg', uploadDate: '2024-02-12' }
    ],
    history: [
      { id: 1, action: 'GR Created', user: 'Robert Taylor', timestamp: '2024-02-12 09:00', details: 'Goods receipt created - 2 days late' },
      { id: 2, action: 'Items Received', user: 'Robert Taylor', timestamp: '2024-02-12 09:30', details: 'Items physically received' },
      { id: 3, action: 'Quality Inspection', user: 'Sarah Johnson', timestamp: '2024-02-12 11:00', details: 'Quality inspection started' },
      { id: 4, action: 'Items Rejected', user: 'Sarah Johnson', timestamp: '2024-02-12 13:00', details: 'All items rejected - Specification mismatch' },
      { id: 5, action: 'Return Initiated', user: 'Robert Taylor', timestamp: '2024-02-12 15:00', details: 'Return to vendor process initiated' }
    ]
  },
  {
    id: 6,
    grNumber: 'GR-2024-006',
    poNumber: 'PO-2023-006',
    poId: 6,
    vendor: 'Apex Hardware Supplies',
    vendorCode: 'VEN006',
    receiptDate: '2024-02-17',
    expectedDate: '2024-02-17',
    status: 'Completed',
    receivedBy: 'Alex Turner',
    inspectedBy: 'Sarah Johnson',
    location: 'Warehouse A - Bay 14',
    warehouse: 'Central Warehouse',
    totalItems: 4,
    itemsReceived: 4,
    itemsAccepted: 4,
    itemsRejected: 0,
    qualityStatus: 'Passed',
    matchingStatus: '3-Way Matched',
    invoiceMatched: true,
    poMatched: true,
    notes: 'Fast delivery, all fasteners and structural bolts passed stress testing.',
    lineItems: [],
    documents: [],
    images: [],
    history: []
  },
  {
    id: 7,
    grNumber: 'GR-2024-007',
    poNumber: 'PO-2023-007',
    poId: 7,
    vendor: 'Global Logistics & Packaging',
    vendorCode: 'VEN007',
    receiptDate: '2024-02-18',
    expectedDate: '2024-02-18',
    status: 'Pending Inspection',
    receivedBy: 'David Miller',
    inspectedBy: null,
    location: 'Dock 2 - Receiving',
    warehouse: 'North Distribution Hub',
    totalItems: 12,
    itemsReceived: 12,
    itemsAccepted: 0,
    itemsRejected: 0,
    qualityStatus: 'Pending',
    matchingStatus: 'PO Matched',
    invoiceMatched: false,
    poMatched: true,
    notes: 'Pallets received intact. Awaiting QA barcode scan.',
    lineItems: [],
    documents: [],
    images: [],
    history: []
  },
  {
    id: 8,
    grNumber: 'GR-2024-008',
    poNumber: 'PO-2023-008',
    poId: 8,
    vendor: 'Titan Steel & Metals',
    vendorCode: 'VEN008',
    receiptDate: '2024-02-19',
    expectedDate: '2024-02-20',
    status: 'Completed',
    receivedBy: 'John Smith',
    inspectedBy: 'Sarah Johnson',
    location: 'Warehouse B - Yard 3',
    warehouse: 'Central Warehouse',
    totalItems: 8,
    itemsReceived: 8,
    itemsAccepted: 8,
    itemsRejected: 0,
    qualityStatus: 'Passed',
    matchingStatus: '3-Way Matched',
    invoiceMatched: true,
    poMatched: true,
    notes: 'Heavy metal beams received 1 day early. Mill test cert verified.',
    lineItems: [],
    documents: [],
    images: [],
    history: []
  },
  {
    id: 9,
    grNumber: 'GR-2024-009',
    poNumber: 'PO-2023-009',
    poId: 9,
    vendor: 'Precision Dynamics Corp',
    vendorCode: 'VEN009',
    receiptDate: '2024-02-20',
    expectedDate: '2024-02-20',
    status: 'Partial',
    receivedBy: 'Emily Davis',
    inspectedBy: 'Sarah Johnson',
    location: 'Warehouse A - Bay 02',
    warehouse: 'Central Warehouse',
    totalItems: 20,
    itemsReceived: 15,
    itemsAccepted: 15,
    itemsRejected: 0,
    qualityStatus: 'Passed',
    matchingStatus: 'Variance',
    invoiceMatched: false,
    poMatched: true,
    notes: 'Partial shipment of 15 motors. Remaining 5 backordered for next week.',
    lineItems: [],
    documents: [],
    images: [],
    history: []
  },
  {
    id: 10,
    grNumber: 'GR-2024-010',
    poNumber: 'PO-2023-010',
    poId: 10,
    vendor: 'Polymer Synthetics Tech',
    vendorCode: 'VEN010',
    receiptDate: '2024-02-21',
    expectedDate: '2024-02-21',
    status: 'Draft',
    receivedBy: 'Robert Taylor',
    inspectedBy: null,
    location: 'Dock 4 - Receiving',
    warehouse: 'South Plant Warehouse',
    totalItems: 6,
    itemsReceived: 0,
    itemsAccepted: 0,
    itemsRejected: 0,
    qualityStatus: 'Not Started',
    matchingStatus: 'Not Matched',
    invoiceMatched: false,
    poMatched: false,
    notes: 'Truck arrived at gate. Unloading in progress.',
    lineItems: [],
    documents: [],
    images: [],
    history: []
  },
  {
    id: 11,
    grNumber: 'GR-2024-011',
    poNumber: 'PO-2023-011',
    poId: 11,
    vendor: 'Solaris Energy Solutions',
    vendorCode: 'VEN011',
    receiptDate: '2024-02-22',
    expectedDate: '2024-02-22',
    status: 'Completed',
    receivedBy: 'Alex Turner',
    inspectedBy: 'Sarah Johnson',
    location: 'Warehouse C - Solar Bay',
    warehouse: 'North Distribution Hub',
    totalItems: 15,
    itemsReceived: 15,
    itemsAccepted: 15,
    itemsRejected: 0,
    qualityStatus: 'Passed',
    matchingStatus: '3-Way Matched',
    invoiceMatched: true,
    poMatched: true,
    notes: 'Solar panels and inverters passed voltage efficiency test.',
    lineItems: [],
    documents: [],
    images: [],
    history: []
  },
  {
    id: 12,
    grNumber: 'GR-2024-012',
    poNumber: 'PO-2023-012',
    poId: 12,
    vendor: 'Quantum Microcircuits',
    vendorCode: 'VEN012',
    receiptDate: '2024-02-23',
    expectedDate: '2024-02-23',
    status: 'Pending Inspection',
    receivedBy: 'David Miller',
    inspectedBy: null,
    location: 'Cleanroom Storage - Bay 1',
    warehouse: 'Central Warehouse',
    totalItems: 50,
    itemsReceived: 50,
    itemsAccepted: 0,
    itemsRejected: 0,
    qualityStatus: 'Pending',
    matchingStatus: 'PO Matched',
    invoiceMatched: false,
    poMatched: true,
    notes: 'Microchips batch in ESD packaging. Cleanroom QA required.',
    lineItems: [],
    documents: [],
    images: [],
    history: []
  },
  {
    id: 13,
    grNumber: 'GR-2024-013',
    poNumber: 'PO-2023-013',
    poId: 13,
    vendor: 'Cascade Hydraulics',
    vendorCode: 'VEN013',
    receiptDate: '2024-02-24',
    expectedDate: '2024-02-25',
    status: 'Completed',
    receivedBy: 'John Smith',
    inspectedBy: 'Sarah Johnson',
    location: 'Warehouse A - Heavy Equipment',
    warehouse: 'Central Warehouse',
    totalItems: 9,
    itemsReceived: 9,
    itemsAccepted: 9,
    itemsRejected: 0,
    qualityStatus: 'Passed',
    matchingStatus: '3-Way Matched',
    invoiceMatched: true,
    poMatched: true,
    notes: 'Hydraulic pumps pressure tested with zero leakage.',
    lineItems: [],
    documents: [],
    images: [],
    history: []
  },
  {
    id: 14,
    grNumber: 'GR-2024-014',
    poNumber: 'PO-2023-014',
    poId: 14,
    vendor: 'Vanguard Industrial Tools',
    vendorCode: 'VEN014',
    receiptDate: '2024-02-25',
    expectedDate: '2024-02-25',
    status: 'Completed',
    receivedBy: 'Emily Davis',
    inspectedBy: 'Sarah Johnson',
    location: 'Tool Crib - Locker 4',
    warehouse: 'South Plant Warehouse',
    totalItems: 30,
    itemsReceived: 30,
    itemsAccepted: 30,
    itemsRejected: 0,
    qualityStatus: 'Passed',
    matchingStatus: '3-Way Matched',
    invoiceMatched: true,
    poMatched: true,
    notes: 'Pneumatic drill kits verified and added to plant inventory.',
    lineItems: [],
    documents: [],
    images: [],
    history: []
  },
  {
    id: 15,
    grNumber: 'GR-2024-015',
    poNumber: 'PO-2023-015',
    poId: 15,
    vendor: 'Pinnacle Chemical Corp',
    vendorCode: 'VEN015',
    receiptDate: '2024-02-26',
    expectedDate: '2024-02-26',
    status: 'Rejected',
    receivedBy: 'Robert Taylor',
    inspectedBy: 'Sarah Johnson',
    location: 'Hazmat Storage - Tank 2',
    warehouse: 'Central Warehouse',
    totalItems: 4,
    itemsReceived: 4,
    itemsAccepted: 0,
    itemsRejected: 4,
    qualityStatus: 'Failed',
    matchingStatus: 'Not Matched',
    invoiceMatched: false,
    poMatched: false,
    notes: 'Coolant barrels failed viscosity & purity lab testing. Damaged seals.',
    lineItems: [],
    documents: [],
    images: [],
    history: []
  },
  {
    id: 16,
    grNumber: 'GR-2024-016',
    poNumber: 'PO-2023-016',
    poId: 16,
    vendor: 'Horizon Office Supplies',
    vendorCode: 'VEN016',
    receiptDate: '2024-02-27',
    expectedDate: '2024-02-27',
    status: 'Completed',
    receivedBy: 'Alex Turner',
    inspectedBy: 'Sarah Johnson',
    location: 'Admin Building - Supply Room',
    warehouse: 'Central Warehouse',
    totalItems: 18,
    itemsReceived: 18,
    itemsAccepted: 18,
    itemsRejected: 0,
    qualityStatus: 'Passed',
    matchingStatus: '3-Way Matched',
    invoiceMatched: true,
    poMatched: true,
    notes: 'Printer cartridges and ergonomic desks delivered intact.',
    lineItems: [],
    documents: [],
    images: [],
    history: []
  },
  {
    id: 17,
    grNumber: 'GR-2024-017',
    poNumber: 'PO-2023-017',
    poId: 17,
    vendor: 'Matrix Automation Systems',
    vendorCode: 'VEN017',
    receiptDate: '2024-02-28',
    expectedDate: '2024-02-28',
    status: 'Pending Inspection',
    receivedBy: 'David Miller',
    inspectedBy: null,
    location: 'Dock 1 - Receiving',
    warehouse: 'North Distribution Hub',
    totalItems: 8,
    itemsReceived: 8,
    itemsAccepted: 0,
    itemsRejected: 0,
    qualityStatus: 'Pending',
    matchingStatus: 'PO Matched',
    invoiceMatched: false,
    poMatched: true,
    notes: 'PLC controller cabinets received. Scheduled for firmware check.',
    lineItems: [],
    documents: [],
    images: [],
    history: []
  },
  {
    id: 18,
    grNumber: 'GR-2024-018',
    poNumber: 'PO-2023-018',
    poId: 18,
    vendor: 'Delta Cable & Wiring',
    vendorCode: 'VEN018',
    receiptDate: '2024-03-01',
    expectedDate: '2024-03-01',
    status: 'Completed',
    receivedBy: 'John Smith',
    inspectedBy: 'Sarah Johnson',
    location: 'Warehouse B - Rack 11',
    warehouse: 'Central Warehouse',
    totalItems: 25,
    itemsReceived: 25,
    itemsAccepted: 25,
    itemsRejected: 0,
    qualityStatus: 'Passed',
    matchingStatus: '3-Way Matched',
    invoiceMatched: true,
    poMatched: true,
    notes: 'Armored fiber optic spools continuity verified.',
    lineItems: [],
    documents: [],
    images: [],
    history: []
  },
  {
    id: 19,
    grNumber: 'GR-2024-019',
    poNumber: 'PO-2023-019',
    poId: 19,
    vendor: 'Echo Precision Bearings',
    vendorCode: 'VEN019',
    receiptDate: '2024-03-02',
    expectedDate: '2024-03-02',
    status: 'Completed',
    receivedBy: 'Emily Davis',
    inspectedBy: 'Sarah Johnson',
    location: 'Warehouse A - Bay 05',
    warehouse: 'Central Warehouse',
    totalItems: 40,
    itemsReceived: 40,
    itemsAccepted: 40,
    itemsRejected: 0,
    qualityStatus: 'Passed',
    matchingStatus: '3-Way Matched',
    invoiceMatched: true,
    poMatched: true,
    notes: 'Heavy duty ceramic roller bearings fully inspected and logged.',
    lineItems: [],
    documents: [],
    images: [],
    history: []
  },
  {
    id: 20,
    grNumber: 'GR-2024-020',
    poNumber: 'PO-2023-020',
    poId: 20,
    vendor: 'Nordic Refrigeration Systems',
    vendorCode: 'VEN020',
    receiptDate: '2024-03-03',
    expectedDate: '2024-03-03',
    status: 'Partial',
    receivedBy: 'Robert Taylor',
    inspectedBy: 'Sarah Johnson',
    location: 'Cold Storage - Bay 1',
    warehouse: 'South Plant Warehouse',
    totalItems: 10,
    itemsReceived: 7,
    itemsAccepted: 7,
    itemsRejected: 0,
    qualityStatus: 'Passed',
    matchingStatus: 'Variance',
    invoiceMatched: false,
    poMatched: true,
    notes: '7 cooling compressor units accepted. 3 units pending freight arrival.',
    lineItems: [],
    documents: [],
    images: [],
    history: []
  },
  {
    id: 21,
    grNumber: 'GR-2024-021',
    poNumber: 'PO-2023-021',
    poId: 21,
    vendor: 'Starlight Safety Gear',
    vendorCode: 'VEN021',
    receiptDate: '2024-03-04',
    expectedDate: '2024-03-04',
    status: 'Completed',
    receivedBy: 'Alex Turner',
    inspectedBy: 'Sarah Johnson',
    location: 'Safety Depot - Locker 1',
    warehouse: 'Central Warehouse',
    totalItems: 60,
    itemsReceived: 60,
    itemsAccepted: 60,
    itemsRejected: 0,
    qualityStatus: 'Passed',
    matchingStatus: '3-Way Matched',
    invoiceMatched: true,
    poMatched: true,
    notes: 'Kevlar gloves and hard hats batch ANSI certified.',
    lineItems: [],
    documents: [],
    images: [],
    history: []
  },
  {
    id: 22,
    grNumber: 'GR-2024-022',
    poNumber: 'PO-2023-022',
    poId: 22,
    vendor: 'Zephyr Pneumatic Solutions',
    vendorCode: 'VEN022',
    receiptDate: '2024-03-05',
    expectedDate: '2024-03-05',
    status: 'Pending Inspection',
    receivedBy: 'David Miller',
    inspectedBy: null,
    location: 'Dock 3 - Receiving',
    warehouse: 'North Distribution Hub',
    totalItems: 14,
    itemsReceived: 14,
    itemsAccepted: 0,
    itemsRejected: 0,
    qualityStatus: 'Pending',
    matchingStatus: 'PO Matched',
    invoiceMatched: false,
    poMatched: true,
    notes: 'Air compression valves received. Scheduled for pressure check.',
    lineItems: [],
    documents: [],
    images: [],
    history: []
  }
];

interface GoodsReceiptsProps {
  onNavigate?: (section: any) => void;
}

export function GoodsReceipts({ onNavigate }: GoodsReceiptsProps) {
  const [goodsReceipts, setGoodsReceipts] = useState(mockGoodsReceipts);
  const [grSearchTerm, setGrSearchTerm] = useState('');
  const [grStatusFilter, setGrStatusFilter] = useState('all');
  const [grSortConfig, setGrSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
    key: 'grNumber',
    direction: 'desc'
  });
  
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [grCurrentPage, setGrCurrentPage] = useState(1);
  const [grViewMode, setGrViewMode] = useState<'card' | 'list' | 'table'>('table');
  const [visibleGrColumns, setVisibleGrColumns] = useState<string[]>([
    'grNumber', 'poNumber', 'vendor', 'receiptDate', 'status', 'quality', 'matching', 'progress'
  ]);
  const [isColumnsPopoverOpen, setIsColumnsPopoverOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedGR, setSelectedGR] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showMetrics, setShowMetrics] = useState(true);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const grColumns: ColumnDef<any>[] = [
    {
      key: 'grNumber',
      header: 'GR Number',
      sortable: true,
      render: (gr) => (
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-100 leading-tight">{gr.grNumber}</p>
          <p className="text-[11px] text-slate-400 font-medium">Location: {gr.warehouse}</p>
        </div>
      ),
    },
    {
      key: 'poNumber',
      header: 'PO Reference',
      sortable: true,
      render: (gr) => (
        <Badge variant="outline" className="font-medium text-xs border-slate-200 text-slate-600 h-6">
          <ShoppingCart className="w-3 h-3 mr-1 text-slate-400" />
          {gr.poNumber}
        </Badge>
      ),
    },
    {
      key: 'vendor',
      header: 'Vendor',
      sortable: true,
      render: (gr) => (
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
            <Building className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700">{gr.vendor}</p>
            <p className="text-[10px] text-slate-400 font-medium">{gr.vendorCode}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'receiptDate',
      header: 'Receipt Date',
      sortable: true,
      render: (gr) => (
        <div className="flex items-center gap-1.5 text-slate-600 font-medium h-7 px-2.5 bg-slate-50/60 rounded-md group-hover:bg-white transition-colors w-fit">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs">{gr.receiptDate}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (gr) => getStatusBadge(gr.status),
    },
    {
      key: 'qualityStatus',
      header: 'Quality',
      sortable: true,
      render: (gr) => getQualityBadge(gr.qualityStatus),
    },
    {
      key: 'matchingStatus',
      header: 'Matching',
      sortable: true,
      render: (gr) => getMatchingBadge(gr.matchingStatus),
    },
    {
      key: 'progress',
      header: 'Progress',
      sortable: true,
      render: (gr) => (
        <div className="flex flex-col gap-1 min-w-[120px]">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
            <span>{Math.round((gr.itemsAccepted / gr.totalItems) * 105)}%</span>
            <span className="text-slate-300">Intake</span>
          </div>
          <Progress value={(gr.itemsAccepted / gr.totalItems) * 105} className="h-1 bg-slate-100" />
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (gr) => (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewGR(gr)}
            className="h-7 w-7 p-0 bg-white hover:bg-slate-50 rounded-full border-slate-200"
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
              <DropdownMenuLabel className="text-xs font-semibold text-slate-500 px-2 py-1.5">Actions</DropdownMenuLabel>
              <DropdownMenuItem className="gap-2.5 py-2.5 cursor-pointer rounded-md">
                <Edit className="w-4 h-4 text-blue-500" />
                <span className="font-semibold text-sm">Update GR</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2.5 py-2.5 cursor-pointer rounded-md">
                <Scan className="w-4 h-4 text-purple-500" />
                <span className="font-semibold text-sm">Print Labels</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1.5" />
              <DropdownMenuItem className="gap-2.5 py-2.5 cursor-pointer rounded-md text-slate-600">
                <Download className="w-4 h-4" />
                <span className="font-semibold text-sm">Download PDF</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const handleSelectRow = (id: number) => {
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
      setSelectedRows(new Set(filteredGRs.map((gr) => gr.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  // Dnd-kit sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (grSortConfig.key === key && grSortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (grSortConfig.key === key && grSortConfig.direction === 'desc') {
      direction = null;
    }
    setGrSortConfig({ key, direction });
  };

  const toggleColumn = (columnId: string) => {
    setVisibleGrColumns(prev =>
      prev.includes(columnId)
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  };

  const handleExportCSV = () => {
    const dataToExport = goodsReceipts;
    if (dataToExport.length === 0) return;
    const headers = ['GR Number', 'PO Reference', 'Vendor', 'Vendor Code', 'Receipt Date', 'Status', 'Quality Status', 'Matching Status', 'Warehouse'].join(',');
    const rows = dataToExport.map(item => [
      item.grNumber,
      item.poNumber,
      `"${item.vendor}"`,
      item.vendorCode,
      item.receiptDate,
      item.status,
      item.qualityStatus,
      item.matchingStatus,
      `"${item.warehouse}"`
    ].join(','));
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `goods_receipts_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Report Exported', { description: 'goods_receipts_export.csv has been downloaded.' });
  };

  const handleExportExcel = () => {
    const dataToExport = goodsReceipts;
    if (dataToExport.length === 0) return;
    const headers = ['GR Number\tPO Reference\tVendor\tVendor Code\tReceipt Date\tStatus\tQuality Status\tMatching Status\tWarehouse'].join('\n');
    const rows = dataToExport.map(item => [
      item.grNumber,
      item.poNumber,
      item.vendor,
      item.vendorCode,
      item.receiptDate,
      item.status,
      item.qualityStatus,
      item.matchingStatus,
      item.warehouse
    ].join('\t')).join('\n');
    const excelContent = `${headers}\n${rows}`;
    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `goods_receipts_export_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Excel Report Exported', { description: 'goods_receipts_export.xls has been downloaded.' });
  };

  const handleExportPDF = () => {
    toast.info('Preparing PDF document...', { description: 'Opening system print preview.' });
    setTimeout(() => {
      window.print();
    }, 300);
  };

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
      <div className="flex items-center justify-end px-4 py-2 border-t text-[13px] text-slate-500 gap-8 h-12 bg-white">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <Select value={itemsPerPage.toString()} onValueChange={(v: string) => {
            setItemsPerPage(parseInt(v));
            onPageChange(1);
          }}>
            <SelectTrigger className="h-8 w-16 border-none shadow-none focus:ring-0 bg-transparent hover:bg-slate-50 text-slate-600 font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 25, 50].map(v => (
                <SelectItem key={v} value={v.toString()}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <span className="font-medium whitespace-nowrap">{from}–{to} of {totalItems}</span>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-slate-600"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <ChevronLeft className="h-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-slate-600"
            disabled={to >= totalItems}
            onClick={() => onPageChange(currentPage + 1)}
          >
            <ChevronRight className="h-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over.id) {
      setGoodsReceipts((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Create GR Form State
  const [newGR, setNewGR] = useState({
    poNumber: '',
    receiptDate: '',
    receivedBy: 'John Smith',
    location: '',
    warehouse: '',
    notes: ''
  });

  // Filter goods receipts
  const filteredGRs = React.useMemo(() => {
    return goodsReceipts.filter(gr => {
      const matchesSearch = gr.grNumber.toLowerCase().includes(grSearchTerm.toLowerCase()) ||
                           gr.poNumber.toLowerCase().includes(grSearchTerm.toLowerCase()) ||
                           gr.vendor.toLowerCase().includes(grSearchTerm.toLowerCase());
      const matchesStatus = grStatusFilter === 'all' || gr.status === grStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [goodsReceipts, grSearchTerm, grStatusFilter]);

  const sortedGRs = React.useMemo(() => {
    const sortableItems = [...filteredGRs];
    if (grSortConfig.key !== null && grSortConfig.direction !== null) {
      sortableItems.sort((a: any, b: any) => {
        const aValue = a[grSortConfig.key];
        const bValue = b[grSortConfig.key];

        if (aValue === undefined || bValue === undefined) return 0;

        if (aValue < bValue) {
          return grSortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return grSortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredGRs, grSortConfig]);

  const pagedGRs = sortedGRs.slice(
    (grCurrentPage - 1) * itemsPerPage,
    grCurrentPage * itemsPerPage
  );

  // Statistics
  const stats = {
    total: goodsReceipts.length,
    completed: goodsReceipts.filter(gr => gr.status === 'Completed').length,
    pendingInspection: goodsReceipts.filter(gr => gr.status === 'Pending Inspection').length,
    partial: goodsReceipts.filter(gr => gr.status === 'Partial').length,
    draft: goodsReceipts.filter(gr => gr.status === 'Draft').length,
    rejected: goodsReceipts.filter(gr => gr.status === 'Rejected').length,
    threeWayMatched: goodsReceipts.filter(gr => gr.matchingStatus === '3-Way Matched').length
  };

  const getStatusBadge = (status: string) => {
    const styles: any = {
      'Completed': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      'Pending Inspection': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      'Partial': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
      'Draft': 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      'Rejected': 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
    };
    return (
      <Badge variant="outline" className={`font-semibold text-[11px] px-2.5 py-0.5 rounded-full ${styles[status] || styles['Draft']}`}>
        {status}
      </Badge>
    );
  };

  const getQualityBadge = (status: string) => {
    const styles: any = {
      'Passed': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      'Failed': 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
      'Issues Found': 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
      'Pending': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      'Not Started': 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
    };
    const icons: any = {
      'Passed': CheckCircle,
      'Failed': XCircle,
      'Issues Found': AlertCircle,
      'Pending': Clock,
      'Not Started': MinusCircle
    };
    const Icon = icons[status] || Clock;
    return (
      <Badge variant="outline" className={`gap-1 font-semibold text-[11px] px-2.5 py-0.5 rounded-full ${styles[status] || styles['Not Started']}`}>
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  const getMatchingBadge = (status: string) => {
    const styles: any = {
      '3-Way Matched': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      'PO Matched': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
      'Variance': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      'Not Matched': 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
    };
    const icons: any = {
      '3-Way Matched': CheckCheck,
      'PO Matched': CheckCircle,
      'Variance': AlertTriangle,
      'Not Matched': XCircle
    };
    const Icon = icons[status] || Clock;
    return (
      <Badge variant="outline" className={`gap-1 font-semibold text-[11px] px-2.5 py-0.5 rounded-full ${styles[status] || styles['Not Matched']}`}>
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  const handleCreateGR = () => {
    const grNumber = `GR-2024-${String(goodsReceipts.length + 1).padStart(3, '0')}`;
    
    const newGoodsReceipt = {
      id: goodsReceipts.length + 1,
      grNumber,
      poNumber: newGR.poNumber,
      poId: 1,
      vendor: 'New Vendor',
      vendorCode: 'VEN006',
      receiptDate: newGR.receiptDate,
      expectedDate: newGR.receiptDate,
      status: 'Draft',
      receivedBy: newGR.receivedBy,
      inspectedBy: null,
      location: newGR.location,
      warehouse: newGR.warehouse,
      totalItems: 0,
      itemsReceived: 0,
      itemsAccepted: 0,
      itemsRejected: 0,
      qualityStatus: 'Not Started',
      matchingStatus: 'PO Matched',
      invoiceMatched: false,
      poMatched: true,
      notes: newGR.notes,
      lineItems: [],
      documents: [],
      images: [],
      history: [
        { 
          id: 1, 
          action: 'GR Created', 
          user: newGR.receivedBy, 
          timestamp: new Date().toISOString(), 
          details: 'Goods receipt created' 
        }
      ]
    };

    setGoodsReceipts([...goodsReceipts, newGoodsReceipt]);
    setShowCreateDialog(false);
    setNewGR({
      poNumber: '',
      receiptDate: '',
      receivedBy: 'John Smith',
      location: '',
      warehouse: '',
      notes: ''
    });
    toast.success('Goods Receipt created successfully', {
      description: `${grNumber} has been created and saved as draft.`
    });
  };

  const handleViewGR = (gr: any) => {
    setSelectedGR(gr);
    setShowViewDialog(true);
    setActiveTab('overview');
  };

  const handleCompleteInspection = (grId: number) => {
    setGoodsReceipts(goodsReceipts.map(gr => {
      if (gr.id === grId) {
        return {
          ...gr,
          status: 'Completed',
          qualityStatus: 'Passed',
          inspectedBy: 'Sarah Johnson',
          itemsAccepted: gr.totalItems,
          lineItems: gr.lineItems.map(item => ({
            ...item,
            acceptedQty: item.receivedQty,
            inspectionStatus: 'Passed',
            inspectionNotes: 'Inspection completed - All items approved'
          })),
          history: [
            ...gr.history,
            {
              id: gr.history.length + 1,
              action: 'Quality Inspection',
              user: 'Sarah Johnson',
              timestamp: new Date().toISOString(),
              details: 'Quality inspection completed - All items passed'
            },
            {
              id: gr.history.length + 2,
              action: 'GR Completed',
              user: 'Sarah Johnson',
              timestamp: new Date().toISOString(),
              details: 'Goods receipt finalized'
            }
          ]
        };
      }
      return gr;
    }));
    toast.success('Inspection completed', {
      description: 'All items have been inspected and accepted.'
    });
    setShowViewDialog(false);
  };

  return (
    <div className="px-6 pb-6 space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Sticky Header section with Breadcrumbs */}
      <div className="sticky top-0 bg-background/95 backdrop-blur z-20 border-b py-3 -mx-6 px-6 space-y-1.5 no-print flex flex-col">
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
              <BreadcrumbPage>Goods Receipts</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center justify-between w-full">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Goods Receipts</h1>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowMetrics(!showMetrics)}
              className={`h-11 w-11 p-0 border-slate-200 hover:bg-slate-100 transition-all ${showMetrics ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-slate-600'}`}
            >
              <BarChart3 className="w-5 h-5" />
            </Button>
            <Button variant="outline" className="h-11 px-4 border-slate-200 hover:bg-slate-100 text-slate-700 font-bold gap-2 relative bg-white">
              <Bell className="w-4 h-4 text-slate-500" />
              Alerts
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-500 text-[10px] flex items-center justify-center rounded-full border-2 border-white text-white font-black">2</span>
            </Button>
            <Button className="h-11 px-6 bg-blue-600 hover:bg-blue-700 font-bold gap-2 transform transition-all active:scale-95 text-white" onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-5 h-5" />
              Create Entry
            </Button>
          </div>
        </div>
      </div>

      {/* High Density Metric Summary */}
      {showMetrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 bg-transparent no-print">
          {[
            { label: 'Total GRs', value: stats.total, icon: Package, border: 'border-l-primary', iconBg: 'bg-primary/10', iconColor: 'text-primary', sub: 'Total Received' },
            { label: 'Completed', value: stats.completed, icon: CheckCircle, border: 'border-l-emerald-500', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', sub: 'Fully Inspected' },
            { label: 'Pending Insp.', value: stats.pendingInspection, icon: Clock, border: 'border-l-blue-500', iconBg: 'bg-blue-50', iconColor: 'text-blue-600', sub: 'In QC Queue' },
            { label: 'Partial/Short', value: stats.partial, icon: AlertCircle, border: 'border-l-amber-500', iconBg: 'bg-amber-50', iconColor: 'text-amber-600', sub: 'Quantity Discrepancy' },
            { label: 'Draft Mode', value: stats.draft, icon: FileText, border: 'border-l-slate-400', iconBg: 'bg-slate-100', iconColor: 'text-slate-600', sub: 'Unsubmitted Drafts' },
            { label: 'Rejected', value: stats.rejected, icon: XCircle, border: 'border-l-rose-500', iconBg: 'bg-rose-50', iconColor: 'text-rose-600', sub: 'Failed QC Intake' },
            { label: '3-Way Match', value: stats.threeWayMatched, icon: CheckCheck, border: 'border-l-indigo-500', iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600', sub: 'PO & Invoice Matched' }
          ].map((stat, i) => (
            <Card key={i} className={`border-l-4 ${stat.border} shadow-sm hover:shadow-md transition-all duration-300`}>
              <CardContent className="p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">{stat.label}</p>
                  <p className="text-xl font-bold text-foreground mt-0.5">{stat.value}</p>
                  <p className={`text-[11px] font-medium ${stat.iconColor}`}>{stat.sub}</p>
                </div>
                <div className={`p-2.5 ${stat.iconBg} rounded-lg`}>
                  <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ModernDataTable
        title="Goods Intake"
        data={goodsReceipts}
        columns={grColumns}
        idKey="id"
        searchPlaceholder="Search by GR, PO, or vendor..."
        searchKeys={['grNumber', 'poNumber', 'vendor']}
        selectable={true}
        draggable={true}
        onRowOrderChange={(reordered) => setGoodsReceipts(reordered)}
        exportEnabled={true}
        onExport={handleExportCSV}
        extraActions={
          <>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9.5 text-xs font-semibold gap-1.5 px-3.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Goods Receipt
            </Button>
          </>
        }
      />


      {/* Create GR Sheet */}
      <Sheet open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create Goods Receipt</SheetTitle>
            <SheetDescription>
              Record received goods against a purchase order
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="poNumber">Purchase Order Number *</Label>
                <Select value={newGR.poNumber} onValueChange={(value: string) => setNewGR({...newGR, poNumber: value})}>
                  <SelectTrigger id="poNumber">
                    <SelectValue placeholder="Select PO" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PO-2023-001">PO-2023-001 - Tech Solutions Ltd.</SelectItem>
                    <SelectItem value="PO-2023-002">PO-2023-002 - Global Supplies Inc.</SelectItem>
                    <SelectItem value="PO-2023-003">PO-2023-003 - Industrial Parts Co.</SelectItem>
                    <SelectItem value="PO-2023-004">PO-2023-004 - Office Furniture Plus</SelectItem>
                    <SelectItem value="PO-2023-005">PO-2023-005 - Electronic Components Ltd.</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="receiptDate">Receipt Date *</Label>
                <DatePicker
                  id="receiptDate"
                  value={newGR.receiptDate}
                  onChange={(e) => setNewGR({...newGR, receiptDate: e.target.value})}
                  placeholder="Select receipt date"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="warehouse">Warehouse *</Label>
                <Select value={newGR.warehouse} onValueChange={(value: string) => setNewGR({...newGR, warehouse: value})}>
                  <SelectTrigger id="warehouse">
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Central Warehouse">Central Warehouse</SelectItem>
                    <SelectItem value="North Warehouse">North Warehouse</SelectItem>
                    <SelectItem value="South Warehouse">South Warehouse</SelectItem>
                    <SelectItem value="East Distribution Center">East Distribution Center</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Receiving Location *</Label>
                <Input
                  id="location"
                  placeholder="e.g., Warehouse A - Bay 3"
                  value={newGR.location}
                  onChange={(e) => setNewGR({...newGR, location: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="receivedBy">Received By *</Label>
              <Select value={newGR.receivedBy} onValueChange={(value: string) => setNewGR({...newGR, receivedBy: value})}>
                <SelectTrigger id="receivedBy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="John Smith">John Smith</SelectItem>
                  <SelectItem value="Michael Brown">Michael Brown</SelectItem>
                  <SelectItem value="David Wilson">David Wilson</SelectItem>
                  <SelectItem value="Emily Davis">Emily Davis</SelectItem>
                  <SelectItem value="Robert Taylor">Robert Taylor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes about the receipt..."
                value={newGR.notes}
                onChange={(e) => setNewGR({...newGR, notes: e.target.value})}
                rows={3}
              />
            </div>

            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                After creating the GR, you'll be able to record item-level details and perform quality inspection.
              </AlertDescription>
            </Alert>
          </div>

          <SheetFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateGR}
              disabled={!newGR.poNumber || !newGR.receiptDate || !newGR.warehouse || !newGR.location}
            >
              <Save className="w-4 h-4 mr-2" />
              Create Goods Receipt
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* View/Edit GR Sheet */}
      <Sheet open={showViewDialog} onOpenChange={setShowViewDialog}>
        <SheetContent className="sm:max-w-[95vw] lg:sm:max-w-7xl h-[92vh] p-0 overflow-y-auto border-none shadow-2xl">
          {selectedGR && (
            <div className="flex h-full flex-col lg:flex-row bg-white">
              {/* Main Content Area - Left Side */}
              <div className="flex-1 overflow-y-auto custom-scrollbar border-r border-slate-100 bg-slate-50/30">
                {/* Modal Header Context */}
                <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/60 p-6 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/10">
                      <Receipt className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedGR.grNumber}</h2>
                        {getStatusBadge(selectedGR.status)}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <span>PO Ref: {selectedGR.poNumber}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                        <span>{selectedGR.vendor}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" className="h-10 px-4 font-bold border-slate-200 hover:bg-slate-50 transition-all gap-2 bg-white">
                      <Download className="w-4 h-4 text-slate-600" />
                      Export PDF
                    </Button>
                    <Button variant="ghost" onClick={() => setShowViewDialog(false)} className="h-10 w-10 p-0 rounded-full hover:bg-slate-100 transition-colors">
                      <X className="w-5 h-5 text-slate-400" />
                    </Button>
                  </div>
                </div>

                <div className="p-8">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                    <div className="flex items-center justify-between">
                      <TabsList className="w-fit">
                        <TabsTrigger value="overview" className="rounded-lg px-6 font-semibold text-xs data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all">Details</TabsTrigger>
                        <TabsTrigger value="items" className="rounded-lg px-6 font-semibold text-xs data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all">Line Items</TabsTrigger>
                        <TabsTrigger value="documents" className="rounded-lg px-6 font-semibold text-xs data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all">Documents</TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="overview" className="space-y-8 mt-0 focus-visible:ring-0">
                      {/* Primary Metadata Grid (3 Columns) */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-6">
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-500 mb-2 leading-none">Logistics Details</Label>
                            <Card className="p-4 border-slate-200/60 bg-white shadow-sm space-y-4">
                              <div className="flex items-center justify-between group">
                                <span className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                                  <Building className="w-3.5 h-3.5 text-slate-400" /> Warehouse
                                </span>
                                <span className="text-sm font-bold text-slate-900">{selectedGR.warehouse}</span>
                              </div>
                              <div className="flex items-center justify-between group">
                                <span className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Bin Location
                                </span>
                                <span className="text-sm font-bold text-slate-900">{selectedGR.location}</span>
                              </div>
                              <div className="flex items-center justify-between group pt-2 border-t border-slate-50">
                                <span className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                                  <User className="w-3.5 h-3.5 text-slate-400" /> Intake By
                                </span>
                                <span className="text-sm font-bold text-slate-900">{selectedGR.receivedBy}</span>
                              </div>
                            </Card>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-500 mb-2 leading-none">Timeline Tracking</Label>
                            <Card className="p-4 border-slate-200/60 bg-white shadow-sm space-y-4">
                              <div className="flex items-center justify-between group">
                                <span className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Receipt Date
                                </span>
                                <span className="text-sm font-bold text-slate-900">{selectedGR.receiptDate}</span>
                              </div>
                              <div className="flex items-center justify-between group">
                                <span className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Expected
                                </span>
                                <span className="text-sm font-bold text-slate-900">{selectedGR.expectedDate}</span>
                              </div>
                              <div className="flex items-center justify-between group pt-2 border-t border-slate-50">
                                <span className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                                  <TrendingUp className="w-3.5 h-3.5 text-slate-400" /> SLA Status
                                </span>
                                <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-bold text-xs">On Time</Badge>
                              </div>
                            </Card>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-500 mb-2 leading-none">Quality Verification</Label>
                            <Card className="p-4 border-slate-200/60 bg-white shadow-sm space-y-4">
                              <div className="flex items-center justify-between group">
                                <span className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                                  <ClipboardCheck className="w-3.5 h-3.5 text-slate-400" /> Quality Pass
                                </span>
                                {getQualityBadge(selectedGR.qualityStatus)}
                              </div>
                              <div className="flex items-center justify-between group">
                                <span className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                                  <CheckCheck className="w-3.5 h-3.5 text-slate-400" /> 3-Way Match
                                </span>
                                {getMatchingBadge(selectedGR.matchingStatus)}
                              </div>
                              <div className="flex flex-col gap-2 pt-2 border-t border-slate-50">
                                <div className="flex justify-between text-xs font-semibold text-slate-500">
                                  <span>Intake Progress</span>
                                  <span>{Math.round((selectedGR.itemsAccepted / selectedGR.totalItems) * 100)}%</span>
                                </div>
                                <Progress value={(selectedGR.itemsAccepted / selectedGR.totalItems) * 100} className="h-1.5 bg-slate-100" />
                              </div>
                            </Card>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="items" className="mt-0 focus-visible:ring-0">
                      {/* Line Items Manifest */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-slate-900 rounded-full"></div>
                            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Received Manifest ({selectedGR.lineItems.length})</h3>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="h-8 text-xs font-bold gap-2">
                              <Plus className="w-3.5 h-3.5" /> Add Discrepancy
                            </Button>
                          </div>
                        </div>

                        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                          <Table className="w-full text-left">
                            <TableHeader className="bg-slate-50 border-b border-slate-200">
                              <TableRow>
                                <TableHead className="p-4 text-xs font-semibold text-slate-500">Received Item Details</TableHead>
                                <TableHead className="p-4 text-xs font-semibold text-slate-500">Quantity Check</TableHead>
                                <TableHead className="p-4 text-xs font-semibold text-slate-500">Unit Match</TableHead>
                                <TableHead className="p-4 text-xs font-semibold text-slate-500">Verification</TableHead>
                                <TableHead className="p-4 text-xs font-semibold text-slate-500">Condition</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-slate-100">
                              {selectedGR.lineItems.map((item: any) => (
                                <TableRow key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                  <TableCell className="p-4">
                                    <div className="space-y-0.5">
                                      <p className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">{item.item}</p>
                                      <p className="text-[10px] text-slate-400 font-bold tracking-wide">Batch: {item.batchNumber || 'N/A'}</p>
                                    </div>
                                  </TableCell>
                                  <TableCell className="p-4">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-black text-slate-900">{item.receivedQty}</span>
                                      <span className="text-[10px] font-bold text-slate-400">/ {item.poQty}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="p-4">
                                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-bold text-[10px]">
                                      {item.uom}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="p-4">
                                    {getQualityBadge(item.inspectionStatus)}
                                  </TableCell>
                                  <TableCell className="p-4">
                                    <span className="text-xs font-bold text-slate-600">{item.inspectionNotes || 'Intake successful'}</span>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="documents" className="mt-0 focus-visible:ring-0">
                      {/* Documents & Compliance */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 px-1">
                            <FileCheck className="w-5 h-5 text-slate-900" />
                            <h3 className="text-sm font-bold text-slate-900">Related Artifacts</h3>
                          </div>
                          <div className="space-y-2">
                            {selectedGR.documents.map((doc: any) => (
                              <div key={doc.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-300 transition-all group">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 font-bold group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors capitalize">
                                    {doc.name.split('.').pop()}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-900">{doc.name}</p>
                                    <p className="text-xs text-slate-400 font-medium">{doc.type} • {doc.size}</p>
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-2 px-1">
                            <Camera className="w-5 h-5 text-slate-900" />
                            <h3 className="text-sm font-bold text-slate-900">Visual Evidence</h3>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {selectedGR.images.map((img: any) => (
                              <div key={img.id} className="relative aspect-video rounded-xl overflow-hidden group border border-slate-200 bg-slate-100">
                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-10">
                                  <Eye className="w-5 h-5 text-white" />
                                </div>
                                <div className="absolute bottom-2 left-2 right-2 text-xs font-medium text-white z-20 truncate drop-shadow-md">
                                  {img.name}
                                </div>
                              </div>
                            ))}
                            <Button variant="outline" className="aspect-video rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/30 transition-all gap-2 h-auto w-full bg-transparent">
                              <Upload className="w-5 h-5" />
                              <span className="text-xs font-semibold leading-none">Upload Proof</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Footer Actions Context-Aware */}
                <div className="sticky bottom-0 z-50 bg-white/80 backdrop-blur-md border-t border-slate-200 p-6 flex flex-col sm:flex-row items-center gap-4 shadow-[0_-5px_15px_-10px_rgba(0,0,0,0.1)]">
                  {selectedGR.status === 'Pending Inspection' && (
                    <Button onClick={() => handleCompleteInspection(selectedGR.id)} className="w-full sm:flex-1 h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold gap-2 shadow-lg shadow-slate-900/20">
                      <ClipboardCheck className="w-5 h-5" />
                      Finalize Compliance Check
                    </Button>
                  )}
                  <Button variant="outline" className="w-full sm:flex-none sm:min-w-[160px] h-12 font-bold border-slate-200 hover:bg-white transition-all bg-white gap-2">
                    <History className="w-4 h-4 text-slate-500" />
                    Audit Logs
                  </Button>
                  <Button variant="ghost" onClick={() => setShowViewDialog(false)} className="w-full sm:flex-none h-12 font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                    Close Manifest
                  </Button>
                </div>
              </div>

              {/* Activity Sidebar - Right Side */}
              <div className="w-full lg:w-[380px] bg-white flex flex-col no-print border-l border-slate-100">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-slate-900" />
                    <h3 className="font-bold text-slate-900 text-sm">Collaboration Log</h3>
                  </div>
                  <Badge className="bg-slate-900 text-white border-none font-bold text-xs">{selectedGR.history.length}</Badge>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  {selectedGR.history.map((entry: any, idx: number) => (
                    <div key={entry.id} className="relative pl-6 border-l-2 border-slate-100 space-y-2">
                      <div className={`absolute -left-[5px] top-0 h-2 w-2 rounded-full ${idx === 0 ? 'bg-blue-500 ring-4 ring-blue-500/20' : 'bg-slate-300'}`}></div>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                        <span>{entry.user}</span>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {new Date(entry.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 group hover:border-slate-200 transition-all">
                        <p className="text-xs font-bold text-slate-400 mb-1 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> {entry.action}
                        </p>
                        <p className="text-[13px] text-slate-700 font-medium leading-relaxed">{entry.details}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100">
                  <div className="flex items-start gap-3 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-slate-900/5 transition-all">
                    <Textarea 
                      placeholder="Comment on manifest..." 
                      className="flex-1 min-h-[60px] border-none focus-visible:ring-0 resize-none text-[13px] bg-transparent font-medium"
                    />
                    <Button variant="ghost" size="sm" className="h-10 w-10 p-0 hover:bg-slate-900 hover:text-white transition-colors self-end m-1 rounded-xl">
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-3 text-center">Press Shift+Enter for new line</p>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
