import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import {
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
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
  Upload,
  Award,
  TrendingUp,
  Users,
  Quote,
  RefreshCw,
  Grid,
  List,
  Table,
  ArrowUpDown,
  ChevronDown,
  Settings2,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  X
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from './ui/dropdown-menu';
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

// Mock data for RFQs
const rfqData = [
  {
    id: 9991,
    rfqNumber: 'RFQ-2025-001',
    title: 'Office Furniture Supply RFQ',
    buyer: 'TechCorp Inc.',
    description: 'Need office furniture for new office setup as discussed in collaboration dashboard',
    category: 'Furniture',
    budget: 60000,
    currency: 'USD',
    issuedDate: '2025-09-01',
    dueDate: '2025-10-15',
    status: 'Open',
    priority: 'High',
    suppliers: ['Premium Office Solutions', 'OfficeMax Solutions', 'Global Office Co'],
    quotationsReceived: 1,
    totalQuotations: 3,
    attachments: ['specifications.pdf'],
    clarifications: 1
  },
  {
    id: 9992,
    rfqNumber: 'RFQ-2025-002',
    title: 'Raw Materials Sourcing',
    buyer: 'BuildCorp',
    description: 'Bulk supply of raw materials for production',
    category: 'Construction',
    budget: 150000,
    currency: 'USD',
    issuedDate: '2025-09-10',
    dueDate: '2025-10-25',
    status: 'Awarded',
    priority: 'Low',
    suppliers: ['MaterialSource Inc', 'Global Building'],
    quotationsReceived: 2,
    totalQuotations: 2,
    attachments: ['site_plan.dwg'],
    clarifications: 0,
    awardedTo: 'MaterialSource Inc',
    awardedAmount: 145000
  },
  {
    id: 1,
    rfqNumber: 'RFQ-2023-001',
    title: 'Office Equipment Procurement',
    buyer: 'TechCorp Inc.',
    description: 'Need laptops, monitors, and office chairs for new office setup',
    category: 'IT Equipment',
    budget: 50000,
    currency: 'USD',
    issuedDate: '2023-11-01',
    dueDate: '2023-11-15',
    status: 'Open',
    priority: 'High',
    suppliers: ['OfficeMax Solutions', 'Tech Suppliers Ltd', 'Global Office Co'],
    quotationsReceived: 2,
    totalQuotations: 3,
    attachments: ['specifications.pdf', 'requirements.xlsx'],
    clarifications: 1
  },
  {
    id: 2,
    rfqNumber: 'RFQ-2023-002',
    title: 'Software Licensing',
    buyer: 'StartupCorp',
    description: 'Enterprise software licenses for productivity and collaboration tools',
    category: 'Software',
    budget: 25000,
    currency: 'USD',
    issuedDate: '2023-10-28',
    dueDate: '2023-11-12',
    status: 'Under Review',
    priority: 'Medium',
    suppliers: ['Microsoft Partner', 'Adobe Reseller', 'Google Workspace'],
    quotationsReceived: 3,
    totalQuotations: 3,
    attachments: ['user_requirements.pdf'],
    clarifications: 0
  },
  {
    id: 3,
    rfqNumber: 'RFQ-2023-003',
    title: 'Catering Services',
    buyer: 'EventCorp',
    description: 'Corporate event catering for 200 people, lunch and dinner',
    category: 'Services',
    budget: 15000,
    currency: 'USD',
    issuedDate: '2023-11-05',
    dueDate: '2023-11-20',
    status: 'Awarded',
    priority: 'Low',
    suppliers: ['Premium Catering', 'Local Food Co', 'Gourmet Events'],
    quotationsReceived: 3,
    totalQuotations: 3,
    attachments: ['menu_requirements.pdf', 'venue_details.pdf'],
    clarifications: 2,
    awardedTo: 'Premium Catering',
    awardedAmount: 12500
  },
  {
    id: 4,
    rfqNumber: 'RFQ-2023-004',
    title: 'Construction Materials',
    buyer: 'BuildCorp',
    description: 'Bulk supply of cement, steel rods, and bricks for new site',
    category: 'Construction',
    budget: 75000,
    currency: 'USD',
    issuedDate: '2023-11-10',
    dueDate: '2023-11-25',
    status: 'Rejected',
    priority: 'High',
    suppliers: ['Materials Plus', 'Global Building', 'Solid Foundation'],
    quotationsReceived: 1,
    totalQuotations: 3,
    attachments: ['site_plan.dwg'],
    clarifications: 0
  },
  {
    id: 5,
    rfqNumber: 'RFQ-2023-005',
    title: 'Janitorial Services',
    buyer: 'CleanState',
    description: 'Daily cleaning of 5000 sq ft office space',
    category: 'Services',
    budget: 5000,
    currency: 'USD',
    issuedDate: '2023-11-12',
    dueDate: '2023-11-28',
    status: 'Open',
    priority: 'Low',
    suppliers: ['Sparkle Cleaning', 'EcoService', 'Shine Bright'],
    quotationsReceived: 5,
    totalQuotations: 8,
    attachments: ['service_scope.pdf'],
    clarifications: 3
  },
  {
    id: 6,
    rfqNumber: 'RFQ-2024-001',
    title: 'Network Switch Upgrade',
    buyer: 'NetSync Solutions',
    description: 'High-performance 10Gb switches for data center',
    category: 'IT Equipment',
    budget: 35000,
    currency: 'USD',
    issuedDate: '2024-01-05',
    dueDate: '2024-01-20',
    status: 'Open',
    priority: 'High',
    suppliers: ['Cisco Partner', 'Juniper Systems', 'Global Tech'],
    quotationsReceived: 0,
    totalQuotations: 5,
    attachments: ['network_layout.pdf'],
    clarifications: 1
  },
  {
    id: 7,
    rfqNumber: 'RFQ-2024-002',
    title: 'Marketing Agency Retainer',
    buyer: 'BrandBoost',
    description: 'Digital marketing and social media management for brand relaunch',
    category: 'Services',
    budget: 12000,
    currency: 'USD',
    issuedDate: '2024-01-08',
    dueDate: '2024-01-22',
    status: 'Under Review',
    priority: 'Medium',
    suppliers: ['Creative Hub', 'Social Ninja', 'AdMasters'],
    quotationsReceived: 4,
    totalQuotations: 4,
    attachments: ['brand_guidelines.pdf', 'campaign_v1.pptx'],
    clarifications: 5
  },
  {
    id: 8,
    rfqNumber: 'RFQ-2024-003',
    title: 'Packaging Supplies',
    buyer: 'EcoPack Co.',
    description: 'Recyclable cardboard boxes and biodegradable bubble wrap',
    category: 'Industrial',
    budget: 8500,
    currency: 'USD',
    issuedDate: '2024-01-10',
    dueDate: '2024-01-25',
    status: 'Awarded',
    priority: 'Low',
    suppliers: ['GreenBox', 'EarthPack', 'NatureSave'],
    quotationsReceived: 2,
    totalQuotations: 3,
    attachments: ['packaging_specs.pdf'],
    clarifications: 0
  },
  {
    id: 9,
    rfqNumber: 'RFQ-2024-004',
    title: 'Bulk Office Furniture',
    buyer: 'FutureWorks',
    description: '50 ergonomic desks and 50 executive chairs',
    category: 'Furniture',
    budget: 45000,
    currency: 'USD',
    issuedDate: '2024-01-12',
    dueDate: '2024-01-30',
    status: 'Open',
    priority: 'Medium',
    suppliers: ['Office Depot', 'Herman Miller', 'ChairExpert'],
    quotationsReceived: 1,
    totalQuotations: 10,
    attachments: ['office_layout.dwg'],
    clarifications: 2
  },
  {
    id: 10,
    rfqNumber: 'RFQ-2024-005',
    title: 'Industrial Generator Repair',
    buyer: 'HeavyPower',
    description: 'Repair and maintenance of 500kVa standby generator',
    category: 'Maintenance',
    budget: 15000,
    currency: 'USD',
    issuedDate: '2024-01-15',
    dueDate: '2024-01-28',
    status: 'Under Review',
    priority: 'High',
    suppliers: ['GenRepair', 'PowerPlus', 'Maintenance Pro'],
    quotationsReceived: 3,
    totalQuotations: 3,
    attachments: ['generator_logs.pdf'],
    clarifications: 4
  },
  {
    id: 11,
    rfqNumber: 'RFQ-2024-006',
    title: 'Solar Panel Installation',
    buyer: 'GreenEnergy',
    description: '100kW rooftop solar array installation for main warehouse',
    category: 'Industrial',
    budget: 120000,
    currency: 'USD',
    issuedDate: '2024-01-20',
    dueDate: '2024-02-15',
    status: 'Open',
    priority: 'High',
    suppliers: ['SunPower', 'EcoEnergy', 'SolarWay'],
    quotationsReceived: 0,
    totalQuotations: 6,
    attachments: ['roof_specs.pdf'],
    clarifications: 2
  },
  {
    id: 12,
    rfqNumber: 'RFQ-2024-007',
    title: 'Corporate Travel Management',
    buyer: 'GlobalCorp',
    description: 'Enterprise travel agency services for global employee base',
    category: 'Services',
    budget: 250000,
    currency: 'USD',
    issuedDate: '2024-01-22',
    dueDate: '2024-02-28',
    status: 'Under Review',
    priority: 'Medium',
    suppliers: ['AMEX GBT', 'BCD Travel', 'CWT'],
    quotationsReceived: 4,
    totalQuotations: 4,
    attachments: ['travel_policy.pdf'],
    clarifications: 8
  },
  {
    id: 13,
    rfqNumber: 'RFQ-2024-008',
    title: 'Lab Supplies Q2',
    buyer: 'BioTech Labs',
    description: 'Consolidated lab consumables and reagents for Q2 2024',
    category: 'Chemicals',
    budget: 45000,
    currency: 'USD',
    issuedDate: '2024-01-25',
    dueDate: '2024-02-10',
    status: 'Open',
    priority: 'High',
    suppliers: ['Thermo Fisher', 'VWR', 'Sigma Aldrich'],
    quotationsReceived: 2,
    totalQuotations: 5,
    attachments: ['item_list_q2.xlsx'],
    clarifications: 1
  },
  {
    id: 14,
    rfqNumber: 'RFQ-2024-009',
    title: 'Heavy Machinery Rental',
    buyer: 'Industrial Solutions',
    description: 'Excavators and cranes for 3-month construction project',
    category: 'Industrial',
    budget: 85000,
    currency: 'USD',
    issuedDate: '2024-01-28',
    dueDate: '2024-02-12',
    status: 'Awarded',
    priority: 'High',
    suppliers: ['United Rentals', 'Sunbelt', 'Herc Rentals'],
    quotationsReceived: 3,
    totalQuotations: 3,
    attachments: ['project_timeline.pdf'],
    clarifications: 0
  },
  {
    id: 15,
    rfqNumber: 'RFQ-2024-010',
    title: 'Cybersecurity Audit',
    buyer: 'CyberDefense',
    description: 'Social engineering and penetration testing for retail network',
    category: 'Services',
    budget: 35000,
    currency: 'USD',
    issuedDate: '2024-02-01',
    dueDate: '2024-02-25',
    status: 'Under Review',
    priority: 'Medium',
    suppliers: ['FireEye', 'CrowdStrike', 'Palo Alto'],
    quotationsReceived: 2,
    totalQuotations: 2,
    attachments: ['network_scope.pdf'],
    clarifications: 3
  },
  {
    id: 16,
    rfqNumber: 'RFQ-2024-011',
    title: 'Employee Insurance Renewal',
    buyer: 'HR Solutions',
    description: 'Annual health and life insurance for 500+ employees',
    category: 'Services',
    budget: 1500000,
    currency: 'USD',
    issuedDate: '2024-02-05',
    dueDate: '2024-03-15',
    status: 'Open',
    priority: 'High',
    suppliers: ['Aetna', 'UnitedHealth', 'Cigna'],
    quotationsReceived: 1,
    totalQuotations: 5,
    attachments: ['employee_census_2024.xlsx'],
    clarifications: 4
  },
  {
    id: 17,
    rfqNumber: 'RFQ-2024-012',
    title: 'Cloud Data Storage',
    buyer: 'SaaS Innovators',
    description: 'Multi-region S3 compatible storage for backup systems',
    category: 'IT Equipment',
    budget: 25000,
    currency: 'USD',
    issuedDate: '2024-02-10',
    dueDate: '2024-02-24',
    status: 'Open',
    priority: 'Medium',
    suppliers: ['AWS', 'Azure', 'Google Cloud'],
    quotationsReceived: 0,
    totalQuotations: 3,
    attachments: ['storage_requirements.pdf'],
    clarifications: 0
  },
  {
    id: 18,
    rfqNumber: 'RFQ-2024-013',
    title: 'Water Treatment Chemicals',
    buyer: 'H2O Systems',
    description: 'Annual supply of industrial water filtration resins',
    category: 'Chemicals',
    budget: 65000,
    currency: 'USD',
    issuedDate: '2024-02-12',
    dueDate: '2024-03-01',
    status: 'Under Review',
    priority: 'Low',
    suppliers: ['Ecolab', 'Veolia', 'Suez'],
    quotationsReceived: 3,
    totalQuotations: 3,
    attachments: ['water_analysis_report.pdf'],
    clarifications: 2
  },
  {
    id: 19,
    rfqNumber: 'RFQ-2024-014',
    title: 'Electric Vehicle Fleet',
    buyer: 'EcoLogistics',
    description: 'Purchase of 10 electric delivery vans for urban routes',
    category: 'Industrial',
    budget: 550000,
    currency: 'USD',
    issuedDate: '2024-02-15',
    dueDate: '2024-03-20',
    status: 'Open',
    priority: 'High',
    suppliers: ['Tesla', 'Rivian', 'Ford Pro'],
    quotationsReceived: 2,
    totalQuotations: 10,
    attachments: ['fleet_specifications.pdf'],
    clarifications: 5
  },
  {
    id: 20,
    rfqNumber: 'RFQ-2024-015',
    title: 'Precision CNC Machining',
    buyer: 'AutoParts Inc.',
    description: 'Production of specialty aluminum engine components',
    category: 'Industrial',
    budget: 95000,
    currency: 'USD',
    issuedDate: '2024-02-18',
    dueDate: '2024-03-10',
    status: 'Open',
    priority: 'Medium',
    suppliers: ['ToolCraft', 'MegaMachining', 'PrecisionParts'],
    quotationsReceived: 1,
    totalQuotations: 4,
    attachments: ['cad_drawings_v2.zip'],
    clarifications: 3
  }
];

// Mock quotation data
const quotationData = [
  {
    id: 9991,
    rfqId: 9993, // matching a potential QUO ID
    rfqNumber: 'RFQ-2025-003',
    supplierName: 'CleanPro Services',
    quotationNumber: 'QUO-2025-089',
    totalAmount: 15000,
    currency: 'USD',
    submittedDate: '2025-10-01',
    validUntil: '2025-11-01',
    status: 'Submitted',
    lineItems: [
      { item: 'Cleaning Services', unitPrice: 15000, quantity: 1, total: 15000 }
    ],
    notes: 'Quotation for Cleaning Services.',
    attachments: ['quotation_details.pdf']
  },
  {
    id: 1,
    rfqId: 1,
    rfqNumber: 'RFQ-2023-001',
    supplierName: 'Tech Suppliers Ltd',
    quotationNumber: 'QUO-2023-001',
    totalAmount: 47500,
    currency: 'USD',
    submittedDate: '2023-11-08',
    validUntil: '2023-12-08',
    status: 'Submitted',
    lineItems: [
      { item: 'Laptops (10 units)', unitPrice: 1200, quantity: 10, total: 12000 },
      { item: 'Monitors (15 units)', unitPrice: 300, quantity: 15, total: 4500 },
      { item: 'Office Chairs (20 units)', unitPrice: 250, quantity: 20, total: 5000 }
    ],
    notes: 'All items include 2-year warranty. Delivery within 5 business days.',
    attachments: ['quotation_details.pdf', 'warranty_terms.pdf']
  },
  {
    id: 2,
    rfqId: 2,
    rfqNumber: 'RFQ-2023-002',
    supplierName: 'Microsoft Partner',
    quotationNumber: 'QUO-2023-002',
    totalAmount: 22000,
    currency: 'USD',
    submittedDate: '2023-11-05',
    validUntil: '2023-12-05',
    status: 'Under Review',
    lineItems: [
      { item: 'Office 365 E3 (50 licenses)', unitPrice: 300, quantity: 50, total: 15000 },
      { item: 'Teams Premium (50 licenses)', unitPrice: 140, quantity: 50, total: 7000 }
    ],
    notes: 'Annual subscription with enterprise support included.',
    attachments: ['license_agreement.pdf']
  },
  {
    id: 3,
    rfqId: 8,
    rfqNumber: 'RFQ-2024-003',
    supplierName: 'EcoPack Co.',
    quotationNumber: 'QUO-2024-003',
    totalAmount: 8200,
    currency: 'USD',
    submittedDate: '2024-02-12',
    validUntil: '2024-03-12',
    status: 'Awarded',
    lineItems: [{ item: 'Cardboard Boxes', unitPrice: 1, quantity: 5000, total: 5000 }],
    notes: 'Sustainable options included.'
  },
  {
    id: 4,
    rfqId: 4,
    rfqNumber: 'RFQ-2023-004',
    supplierName: 'Solid Foundation',
    quotationNumber: 'QUO-2023-004',
    totalAmount: 72000,
    currency: 'USD',
    submittedDate: '2023-11-20',
    validUntil: '2023-12-20',
    status: 'Rejected',
    lineItems: [{ item: 'Steel Rods', unitPrice: 100, quantity: 500, total: 50000 }],
    notes: 'Standard delivery.'
  },
  {
    id: 5,
    rfqId: 5,
    rfqNumber: 'RFQ-2023-005',
    title: 'Janitorial Services',
    supplierName: 'EcoService',
    quotationNumber: 'QUO-2023-005',
    totalAmount: 4800,
    currency: 'USD',
    submittedDate: '2023-11-22',
    validUntil: '2023-12-22',
    status: 'Submitted',
    lineItems: [{ item: 'Monthly Cleaning', unitPrice: 4800, quantity: 1, total: 4800 }],
    notes: 'Full commercial cleaning service.'
  },
  {
    id: 6,
    rfqId: 10,
    rfqNumber: 'RFQ-2024-005',
    supplierName: 'PowerPlus',
    quotationNumber: 'QUO-2024-010',
    totalAmount: 14500,
    currency: 'USD',
    submittedDate: '2024-02-05',
    validUntil: '2024-03-05',
    status: 'Under Review',
    lineItems: [{ item: 'Generator Overhaul', unitPrice: 14500, quantity: 1, total: 14500 }],
    notes: 'Includes 6 months warranty on parts.'
  },
  {
    id: 7,
    rfqId: 14,
    rfqNumber: 'RFQ-2024-009',
    supplierName: 'Sunbelt',
    quotationNumber: 'QUO-2024-014',
    totalAmount: 82000,
    currency: 'USD',
    submittedDate: '2024-02-01',
    validUntil: '2024-03-01',
    status: 'Awarded',
    lineItems: [{ item: 'Machinery Rental', unitPrice: 82000, quantity: 1, total: 82000 }],
    notes: 'Priority maintenance included.'
  },
  {
    id: 8,
    rfqId: 18,
    rfqNumber: 'RFQ-2024-013',
    supplierName: 'Veolia',
    quotationNumber: 'QUO-2024-018',
    totalAmount: 63000,
    currency: 'USD',
    submittedDate: '2024-02-15',
    validUntil: '2024-03-15',
    status: 'Under Review',
    lineItems: [{ item: 'Filtration Resins', unitPrice: 63000, quantity: 1, total: 63000 }],
    notes: 'Premium grade materials.'
  },
  {
    id: 9,
    rfqId: 7,
    rfqNumber: 'RFQ-2024-002',
    supplierName: 'Social Ninja',
    quotationNumber: 'QUO-2024-002',
    totalAmount: 11000,
    currency: 'USD',
    submittedDate: '2024-01-15',
    validUntil: '2024-02-15',
    status: 'Under Review',
    lineItems: [{ item: 'Marketing Retainer', unitPrice: 11000, quantity: 1, total: 11000 }],
    notes: 'Includes weekly performance reports.'
  },
  {
    id: 10,
    rfqId: 11,
    rfqNumber: 'RFQ-2024-006',
    supplierName: 'SunPower',
    quotationNumber: 'QUO-2024-006',
    totalAmount: 115000,
    currency: 'USD',
    submittedDate: '2024-02-05',
    validUntil: '2024-03-05',
    status: 'Submitted',
    lineItems: [{ item: 'Solar Installation', unitPrice: 115000, quantity: 1, total: 115000 }],
    notes: 'Max efficiency panels proposed.'
  }
];

// Mock clarification data
const clarificationData = [
  {
    id: 1,
    rfqId: 1,
    rfqNumber: 'RFQ-2023-001',
    supplierName: 'OfficeMax Solutions',
    question: 'Can we substitute the requested laptop model with a similar specification but different brand?',
    askedDate: '2023-11-03',
    response: 'Yes, as long as the specifications meet or exceed the minimum requirements stated in the RFQ.',
    respondedDate: '2023-11-04',
    status: 'Answered'
  },
  {
    id: 2,
    rfqId: 1,
    rfqNumber: 'RFQ-2023-001',
    supplierName: 'Tech Suppliers Ltd',
    question: 'What is the exact model number for the monitors specified in the requirements? The document lists "27-inch 4K monitors" but no specific model.',
    askedDate: '2023-11-06',
    response: null,
    respondedDate: null,
    status: 'Pending'
  },
  {
    id: 3,
    rfqId: 1,
    rfqNumber: 'RFQ-2023-001',
    supplierName: 'Global Office Co',
    question: 'Can the delivery be split into two phases - laptops first, then furniture? We have the laptops in stock but chairs require 2 weeks lead time.',
    askedDate: '2023-11-08',
    response: null,
    respondedDate: null,
    status: 'Pending'
  },
  {
    id: 4,
    rfqId: 3,
    rfqNumber: 'RFQ-2023-003',
    supplierName: 'Gourmet Events',
    question: 'Is there a preferred menu style, and can we include vegetarian/vegan options?',
    askedDate: '2023-11-07',
    response: 'International cuisine preferred. Please include 20% vegetarian and 10% vegan options.',
    respondedDate: '2023-11-08',
    status: 'Answered'
  },
  {
    id: 5,
    rfqId: 2,
    rfqNumber: 'RFQ-2023-002',
    supplierName: 'Microsoft Partner',
    question: 'Does the enterprise software license requirement include mobile device access? If so, how many mobile users should we account for?',
    askedDate: '2023-11-05',
    response: null,
    respondedDate: null,
    status: 'Pending'
  },
  {
    id: 6,
    rfqId: 2,
    rfqNumber: 'RFQ-2023-002',
    supplierName: 'Adobe Reseller',
    question: 'Are you open to a hybrid licensing model with some cloud-based and some on-premise solutions to reduce overall costs?',
    askedDate: '2023-11-09',
    response: null,
    respondedDate: null,
    status: 'Pending'
  },
  {
    id: 7,
    rfqId: 1,
    rfqNumber: 'RFQ-2023-001',
    supplierName: 'Tech Suppliers Ltd',
    question: 'Is installation and setup service required for the office equipment, or is delivery-only acceptable?',
    askedDate: '2023-11-10',
    response: null,
    respondedDate: null,
    status: 'Pending'
  },
  {
    id: 8,
    rfqId: 4,
    rfqNumber: 'RFQ-2023-004',
    supplierName: 'Steel Works Inc',
    question: 'The blueprints show Grade 60 steel specifications, but Grade 50 would be sufficient for this application and cost 15% less. Can we propose this alternative?',
    askedDate: '2023-11-12',
    response: null,
    respondedDate: null,
    status: 'Pending'
  },
  {
    id: 9,
    rfqId: 3,
    rfqNumber: 'RFQ-2023-003',
    supplierName: 'Local Food Co',
    question: 'What are the on-site kitchen facilities available at the venue? This will affect our equipment needs and pricing.',
    askedDate: '2023-11-11',
    response: null,
    respondedDate: null,
    status: 'Pending'
  },
  {
    id: 10,
    rfqId: 2,
    rfqNumber: 'RFQ-2023-002',
    supplierName: 'Google Workspace',
    question: 'Will you require data migration services from your existing productivity suite? If yes, what is the current platform and data volume?',
    askedDate: '2023-11-10',
    response: null,
    respondedDate: null,
    status: 'Pending'
  },
  {
    id: 11,
    rfqId: 1,
    rfqNumber: 'RFQ-2023-001',
    supplierName: 'OfficeMax Solutions',
    question: 'Are warranty extensions available as an add-on? We can offer 3-year extended warranty at additional 12% cost.',
    askedDate: '2023-11-13',
    response: null,
    respondedDate: null,
    status: 'Pending'
  },
  {
    id: 12,
    rfqId: 4,
    rfqNumber: 'RFQ-2023-004',
    supplierName: 'Concrete Masters',
    question: 'The material specifications require delivery on a specific date. Can you accommodate a 3-day delivery window instead to optimize logistics and reduce costs?',
    askedDate: '2023-11-14',
    response: null,
    respondedDate: null,
    status: 'Pending'
  }
];



export function RFQManagement() {
  const [activeTab, setActiveTab] = useState('rfqs');
  const [rfqs, setRFQs] = useState(rfqData);
  const [quotations, setQuotations] = useState(quotationData);
  const [selectedRFQ, setSelectedRFQ] = useState<any>(null);
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [isRFQModalOpen, setIsRFQModalOpen] = useState(false);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [isClarificationModalOpen, setIsClarificationModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [quotationSearchTerm, setQuotationSearchTerm] = useState('');
  const [quotationStatusFilter, setQuotationStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('table');
  const [quotationViewMode, setQuotationViewMode] = useState<'grid' | 'list' | 'table'>('table');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [quotationPage, setQuotationPage] = useState(1);

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
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
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
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-slate-600"
            disabled={to >= totalItems}
            onClick={() => onPageChange(currentPage + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' | null }>({ key: '', direction: null });
  const [quotationSortConfig, setQuotationSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' | null }>({ key: '', direction: null });
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'rfqNumber', 'buyer', 'category', 'priority', 'budget', 'dueDate', 'status', 'progress'
  ]);
  const [visibleQuotationColumns, setVisibleQuotationColumns] = useState<string[]>([
    'quotationNumber', 'rfqNumber', 'amount', 'submittedDate', 'validUntil', 'status'
  ]);
  const [isQuotationFormModalOpen, setIsQuotationFormModalOpen] = useState(false);
  const [quotationFormMode, setQuotationFormMode] = useState<'create' | 'edit'>('create');
  const [currentQuotationForForm, setCurrentQuotationForForm] = useState<any>(null);
  const [isDeleteQuotationConfirmOpen, setIsDeleteQuotationConfirmOpen] = useState(false);
  const [quotationToDelete, setQuotationToDelete] = useState<number | null>(null);

  const toggleColumn = (columnId: string) => {
    setVisibleColumns(prev =>
      prev.includes(columnId)
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  };

  const toggleQuotationColumn = (columnId: string) => {
    setVisibleQuotationColumns(prev =>
      prev.includes(columnId)
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setRFQs((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  const requestQuotationSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (quotationSortConfig.key === key && quotationSortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (quotationSortConfig.key === key && quotationSortConfig.direction === 'desc') {
      direction = null;
    }
    setQuotationSortConfig({ key, direction });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'default';
      case 'Under Review': return 'secondary';
      case 'Awarded': return 'default';
      case 'Rejected': return 'destructive';
      case 'Submitted': return 'secondary';
      case 'Answered': return 'default';
      case 'Pending': return 'outline';
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

  const filteredRFQs = rfqs.filter(rfq => {
    const matchesSearch = rfq.rfqNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfq.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfq.buyer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rfq.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (!sortConfig.direction || !sortConfig.key) return 0;

    let aValue: any = a[sortConfig.key as keyof typeof a];
    let bValue: any = b[sortConfig.key as keyof typeof b];

    // Special handling for progress
    if (sortConfig.key === 'progress') {
      aValue = a.quotationsReceived / a.totalQuotations;
      bValue = b.quotationsReceived / b.totalQuotations;
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredQuotations = quotations.filter(quo => {
    const matchesSearch = quo.quotationNumber.toLowerCase().includes(quotationSearchTerm.toLowerCase()) ||
      quo.rfqNumber.toLowerCase().includes(quotationSearchTerm.toLowerCase()) ||
      quo.supplierName.toLowerCase().includes(quotationSearchTerm.toLowerCase());
    const matchesStatus = quotationStatusFilter === 'all' || quo.status === quotationStatusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (!quotationSortConfig.direction || !quotationSortConfig.key) return 0;

    let aValue: any = a[quotationSortConfig.key as keyof typeof a];
    let bValue: any = b[quotationSortConfig.key as keyof typeof b];

    // Special handling for amount
    if (quotationSortConfig.key === 'amount') {
      aValue = a.totalAmount;
      bValue = b.totalAmount;
    }

    if (aValue < bValue) return quotationSortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return quotationSortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const pagedRFQs = filteredRFQs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const pagedQuotations = filteredQuotations.slice(
    (quotationPage - 1) * itemsPerPage,
    quotationPage * itemsPerPage
  );

  const handleSubmitQuotation = (rfqId: number) => {
    const rfq = rfqs.find(r => r.id === rfqId);
    setQuotationFormMode('create');
    setCurrentQuotationForForm({
      rfqNumber: rfq?.rfqNumber || '',
      supplierName: 'JD Electronics', // Current supplier
      currency: rfq?.currency || 'USD',
      lineItems: [{ item: '', unitPrice: 0, quantity: 1, total: 0 }],
      totalAmount: 0,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: ''
    });
    setIsQuotationFormModalOpen(true);
  };

  const handleEditQuotation = (quotation: any) => {
    setQuotationFormMode('edit');
    setCurrentQuotationForForm({ ...quotation });
    setIsQuotationFormModalOpen(true);
  };

  const handleSaveQuotation = (formData: any) => {
    if (quotationFormMode === 'create') {
      const newQuotation = {
        ...formData,
        id: Math.max(...quotations.map(q => q.id)) + 1,
        quotationNumber: `QUO-${Math.floor(1000 + Math.random() * 9000)}`,
        submittedDate: new Date().toISOString().split('T')[0],
        status: 'Submitted'
      };
      setQuotations([newQuotation, ...quotations]);
    } else {
      setQuotations(quotations.map(q => q.id === formData.id ? formData : q));
    }
    setIsQuotationFormModalOpen(false);
  };

  const confirmDeleteQuotation = (id: number) => {
    setQuotationToDelete(id);
    setIsDeleteQuotationConfirmOpen(true);
  };

  const handleDeleteQuotation = () => {
    if (quotationToDelete) {
      setQuotations(quotations.filter(q => q.id !== quotationToDelete));
      setIsDeleteQuotationConfirmOpen(false);
      setQuotationToDelete(null);
    }
  };

  const handleClarificationRequest = (rfqId: number) => {
    console.log('Requesting clarification for RFQ:', rfqId);
    setIsClarificationModalOpen(true);
  };

  const handleExportCSV = () => {
    if (activeTab === 'quotations') {
      const headers = ['Quotation Number', 'RFQ Number', 'Supplier', 'Amount', 'Currency', 'Submitted Date', 'Valid Until', 'Status'];
      const csvData = quotations.map(quo => [
        quo.quotationNumber,
        quo.rfqNumber,
        quo.supplierName,
        quo.totalAmount,
        quo.currency,
        quo.submittedDate,
        quo.validUntil,
        quo.status
      ]);
      const csvContent = [headers, ...csvData].map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "quotation_data_export.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = ['RFQ Number', 'Title', 'Buyer', 'Category', 'Priority', 'Budget', 'Due Date', 'Status'];
      const csvData = rfqs.map(rfq => [
        rfq.rfqNumber,
        `"${rfq.title.replace(/"/g, '""')}"`,
        rfq.buyer,
        rfq.category,
        rfq.priority,
        rfq.budget,
        rfq.dueDate,
        rfq.status
      ]);

      const csvContent = [headers, ...csvData].map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "rfq_data_export.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleExportExcel = () => {
    // Basic Excel-compatible CSV export
    handleExportCSV();
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>RFQ Management</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 h-10 border-slate-200" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
        <Card className="p-3.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active RFQs</p>
              <p className="text-2xl font-semibold">{rfqData.filter(r => r.status === 'Open').length}</p>
              <p className="text-xs text-muted-foreground">Open for bidding</p>
            </div>
            <Quote className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-3.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Quotations</p>
              <p className="text-2xl font-semibold">{quotationData.filter(q => q.status === 'Submitted').length}</p>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </div>
            <FileText className="w-8 h-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-3.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Awards Won</p>
              <p className="text-2xl font-semibold">{rfqData.filter(r => r.status === 'Awarded').length}</p>
              <p className="text-xs text-green-500">This month</p>
            </div>
            <Award className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-3.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-2xl font-semibold">67%</p>
              <p className="text-xs text-green-500">+5% from last month</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl bg-slate-100/50 p-1 rounded-full">
          <TabsTrigger value="rfqs" className="gap-2 rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Quote className="w-4 h-4" />
            RFQs
          </TabsTrigger>
          <TabsTrigger value="quotations" className="gap-2 rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <FileText className="w-4 h-4" />
            My Quotation
          </TabsTrigger>
          <TabsTrigger value="clarifications" className="gap-2 rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <MessageSquare className="w-4 h-4" />
            Clarifications
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2 rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <TrendingUp className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rfqs" className="space-y-4">
          <div className="print-container">
            {/* Combined Data Views Card */}
            <Card className="mx-auto max-w-full overflow-hidden border-slate-200/60 shadow-md">
              <div className="p-3.5 border-b flex flex-col xl:flex-row items-center justify-between gap-4 bg-white no-print">
                <h3 className="font-bold text-lg text-slate-800 shrink-0">Available RFQs</h3>

                <div className="flex flex-1 items-center gap-3 w-full max-w-4xl">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search RFQs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-10 bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="h-10 px-3 flex items-center gap-2 bg-slate-50/50 border-slate-200 hover:bg-slate-100 transition-colors">
                          <Filter className="w-4 h-4 text-slate-600" />
                          <span className="text-sm font-medium text-slate-700">Filters</span>
                          {(statusFilter !== 'all' || searchTerm !== '') && (
                            <Badge variant="secondary" className="ml-1 h-5 px-1.5 min-w-5 justify-center bg-primary/10 text-primary border-none text-[10px]">
                              {[statusFilter !== 'all', searchTerm !== ''].filter(Boolean).length}
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
                                setStatusFilter('all');
                                setSearchTerm('');
                              }}
                              className="h-8 text-xs text-muted-foreground hover:text-primary"
                            >
                              Reset all
                            </Button>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">RFQ Status</Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                              <SelectTrigger className="w-full h-10 border-slate-200">
                                <SelectValue placeholder="All Statuses" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="Open">Open</SelectItem>
                                <SelectItem value="Under Review">Under Review</SelectItem>
                                <SelectItem value="Awarded">Awarded</SelectItem>
                                <SelectItem value="Rejected">Rejected</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Business Category</Label>
                            <Select defaultValue="all">
                              <SelectTrigger className="w-full h-10 border-slate-200">
                                <SelectValue placeholder="All Categories" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                <SelectItem value="IT Equipment">IT Equipment</SelectItem>
                                <SelectItem value="Software">Software</SelectItem>
                                <SelectItem value="Services">Services</SelectItem>
                                <SelectItem value="Construction">Construction</SelectItem>
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
                        { id: 'rfqNumber', label: 'RFQ Details' },
                        { id: 'buyer', label: 'Buyer' },
                        { id: 'category', label: 'Category' },
                        { id: 'priority', label: 'Priority' },
                        { id: 'budget', label: 'Budget' },
                        { id: 'dueDate', label: 'Due Date' },
                        { id: 'status', label: 'Status' },
                        { id: 'progress', label: 'Progress' }
                      ].map(col => (
                        <div key={col.id} className="flex items-center space-x-2 px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors" onClick={(e) => { e.preventDefault(); toggleColumn(col.id); }}>
                          <Checkbox
                            id={`col-${col.id}`}
                            checked={visibleColumns.includes(col.id)}
                            onCheckedChange={() => toggleColumn(col.id)}
                          />
                          <Label htmlFor={`col-${col.id}`} className="text-sm cursor-pointer flex-1">{col.label}</Label>
                        </div>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="flex items-center border border-slate-200 rounded-lg p-1 bg-slate-50 shrink-0 h-10">
                    <Button
                      variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="rounded-md h-8 px-3"
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="rounded-md h-8 px-3"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                      className="rounded-md h-8 px-3"
                    >
                      <Table className="w-4 h-4" />
                    </Button>
                  </div>

                  <DropdownMenu>
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
                      <DropdownMenuItem onClick={handleExportPDF} className="gap-2 cursor-pointer">
                        <FileText className="w-4 h-4 text-red-600" />
                        Export to PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div> {/* end of toolbar/header area inside Card */}

              {/* Table View (Default) */}
              {viewMode === 'table' && (
                <div className="overflow-hidden bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <DraggableTableHeader>
                          {visibleColumns.includes('rfqNumber') && (
                            <th className="text-left p-4 font-semibold text-slate-600 text-sm sticky left-8 z-30 bg-[#f8fafc] border-b shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] whitespace-nowrap min-w-[200px]">
                              <button onClick={() => requestSort('rfqNumber')} className="flex items-center gap-1 hover:text-primary transition-colors">
                                RFQ Details
                                <ArrowUpDown className={`w-3.5 h-3.5 ${sortConfig.key === 'rfqNumber' ? 'text-primary' : 'text-slate-400'}`} />
                              </button>
                            </th>
                          )}
                          {visibleColumns.includes('buyer') && (
                            <th className="text-left p-4 font-semibold text-slate-600 text-sm whitespace-nowrap min-w-[150px]">
                              <button onClick={() => requestSort('buyer')} className="flex items-center gap-1 hover:text-primary transition-colors">
                                Buyer
                                <ArrowUpDown className={`w-3.5 h-3.5 ${sortConfig.key === 'buyer' ? 'text-primary' : 'text-slate-400'}`} />
                              </button>
                            </th>
                          )}
                          {visibleColumns.includes('category') && (
                            <th className="text-left p-4 font-semibold text-slate-600 text-sm whitespace-nowrap">
                              <button onClick={() => requestSort('category')} className="flex items-center gap-1 hover:text-primary transition-colors">
                                Category
                                <ArrowUpDown className={`w-3.5 h-3.5 ${sortConfig.key === 'category' ? 'text-primary' : 'text-slate-400'}`} />
                              </button>
                            </th>
                          )}
                          {visibleColumns.includes('priority') && (
                            <th className="text-left p-4 font-semibold text-slate-600 text-sm whitespace-nowrap">
                              <button onClick={() => requestSort('priority')} className="flex items-center gap-1 hover:text-primary transition-colors">
                                Priority
                                <ArrowUpDown className={`w-3.5 h-3.5 ${sortConfig.key === 'priority' ? 'text-primary' : 'text-slate-400'}`} />
                              </button>
                            </th>
                          )}
                          {visibleColumns.includes('budget') && (
                            <th className="text-left p-4 font-semibold text-slate-600 text-sm whitespace-nowrap">
                              <button onClick={() => requestSort('budget')} className="flex items-center gap-1 hover:text-primary transition-colors">
                                Budget
                                <ArrowUpDown className={`w-3.5 h-3.5 ${sortConfig.key === 'budget' ? 'text-primary' : 'text-slate-400'}`} />
                              </button>
                            </th>
                          )}
                          {visibleColumns.includes('dueDate') && (
                            <th className="text-left p-4 font-semibold text-slate-600 text-sm whitespace-nowrap">
                              <button onClick={() => requestSort('dueDate')} className="flex items-center gap-1 hover:text-primary transition-colors">
                                Due Date
                                <ArrowUpDown className={`w-3.5 h-3.5 ${sortConfig.key === 'dueDate' ? 'text-primary' : 'text-slate-400'}`} />
                              </button>
                            </th>
                          )}
                          {visibleColumns.includes('status') && (
                            <th className="text-left p-4 font-semibold text-slate-600 text-sm whitespace-nowrap">
                              <button onClick={() => requestSort('status')} className="flex items-center gap-1 hover:text-primary transition-colors">
                                Status
                                <ArrowUpDown className={`w-3.5 h-3.5 ${sortConfig.key === 'status' ? 'text-primary' : 'text-slate-400'}`} />
                              </button>
                            </th>
                          )}
                          {visibleColumns.includes('progress') && (
                            <th className="text-left p-4 font-semibold text-slate-600 text-sm whitespace-nowrap min-w-[120px]">
                              <button onClick={() => requestSort('progress')} className="flex items-center gap-1 hover:text-primary transition-colors">
                                Progress
                                <ArrowUpDown className={`w-3.5 h-3.5 ${sortConfig.key === 'progress' ? 'text-primary' : 'text-slate-400'}`} />
                              </button>
                            </th>
                          )}
                          <th className="text-left p-4 font-semibold text-slate-600 text-sm sticky right-0 z-30 bg-[#f8fafc] border-b shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] whitespace-nowrap text-center">Action</th>
                        </DraggableTableHeader>
                      </thead>
                      <tbody>
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleDragEnd}
                        >
                          <SortableContext
                            items={pagedRFQs.map((r) => r.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {pagedRFQs.map((rfq) => (
                              <DraggableTableRow key={rfq.id} id={rfq.id}>
                                {visibleColumns.includes('rfqNumber') && (
                                  <td className="p-4 sticky left-8 z-20 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-slate-50 transition-colors whitespace-nowrap">
                                    <div>
                                      <p className="font-medium text-slate-900 leading-tight">{rfq.rfqNumber}</p>
                                      <p className="text-xs text-muted-foreground line-clamp-1">{rfq.title}</p>
                                    </div>
                                  </td>
                                )}
                                {visibleColumns.includes('buyer') && (
                                  <td className="p-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                        <Building className="w-4 h-4 text-slate-500" />
                                      </div>
                                      <span className="font-medium text-sm text-slate-700">{rfq.buyer}</span>
                                    </div>
                                  </td>
                                )}
                                {visibleColumns.includes('category') && (
                                  <td className="p-4 whitespace-nowrap">
                                    <Badge variant="outline" className="text-xs font-medium border-slate-200">
                                      {rfq.category}
                                    </Badge>
                                  </td>
                                )}
                                {visibleColumns.includes('priority') && (
                                  <td className="p-4 whitespace-nowrap">
                                    <Badge variant={getPriorityColor(rfq.priority)} className="text-[10px] uppercase tracking-wider font-bold h-5">
                                      {rfq.priority}
                                    </Badge>
                                  </td>
                                )}
                                {visibleColumns.includes('budget') && (
                                  <td className="p-4 whitespace-nowrap">
                                    <p className="font-bold text-slate-900">{rfq.currency} {rfq.budget.toLocaleString()}</p>
                                  </td>
                                )}
                                {visibleColumns.includes('dueDate') && (
                                  <td className="p-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2 text-slate-600">
                                      <Calendar className="w-4 h-4" />
                                      <span className="text-sm">{rfq.dueDate}</span>
                                    </div>
                                  </td>
                                )}
                                {visibleColumns.includes('status') && (
                                  <td className="p-4 whitespace-nowrap">
                                    <Badge variant={getStatusColor(rfq.status)}>
                                      {rfq.status}
                                    </Badge>
                                  </td>
                                )}
                                {visibleColumns.includes('progress') && (
                                  <td className="p-4">
                                    <div className="space-y-1.5 w-full min-w-[100px]">
                                      <div className="flex justify-between text-[10px] font-medium text-slate-500">
                                        <span>Bids</span>
                                        <span>{rfq.quotationsReceived}/{rfq.totalQuotations}</span>
                                      </div>
                                      <Progress
                                        value={(rfq.quotationsReceived / rfq.totalQuotations) * 100}
                                        className="h-1.5"
                                      />
                                    </div>
                                  </td>
                                )}
                                <td className="p-4 sticky right-0 z-20 bg-white shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-slate-50 transition-colors whitespace-nowrap text-center">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedRFQ(rfq);
                                      setIsRFQModalOpen(true);
                                    }}
                                    className="h-8 w-8 p-0 bg-white hover:bg-slate-50 rounded-full border-slate-200"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-slate-600" />
                                  </Button>
                                </td>
                              </DraggableTableRow>
                            ))}
                          </SortableContext>
                        </DndContext>
                      </tbody>
                    </table>
                  </div>
                  <MaterialPagination
                    currentPage={currentPage}
                    totalItems={filteredRFQs.length}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}

              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRFQs.map((rfq) => (
                      <Card key={rfq.id} className="p-4 hover:shadow-md transition-shadow">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold">{rfq.rfqNumber}</p>
                              <p className="text-sm text-muted-foreground">{rfq.title}</p>
                            </div>
                            <Badge variant={getStatusColor(rfq.status)} className="text-xs">
                              {rfq.status}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{rfq.buyer}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-semibold">{rfq.currency} {rfq.budget.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">Due: {rfq.dueDate}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {rfq.category}
                            </Badge>
                            <Badge variant={getPriorityColor(rfq.priority)} className="text-xs">
                              {rfq.priority}
                            </Badge>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Quotations</span>
                              <span>{rfq.quotationsReceived}/{rfq.totalQuotations}</span>
                            </div>
                            <Progress
                              value={(rfq.quotationsReceived / rfq.totalQuotations) * 100}
                              className="h-2"
                            />
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => {
                                setSelectedRFQ(rfq);
                                setIsRFQModalOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleSubmitQuotation(rfq.id)}>
                                  <Send className="w-4 h-4 mr-2" />
                                  Submit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleClarificationRequest(rfq.id)}>
                                  <MessageSquare className="w-4 h-4 mr-2" />
                                  Ask
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* List View */}
              {viewMode === 'list' && (
                <div className="p-4 space-y-3">
                  {filteredRFQs.map((rfq) => (
                    <Card key={rfq.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-semibold">{rfq.rfqNumber}</p>
                            <Badge variant={getStatusColor(rfq.status)} className="text-xs">
                              {rfq.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {rfq.category}
                            </Badge>
                            <Badge variant={getPriorityColor(rfq.priority)} className="text-xs">
                              {rfq.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{rfq.title}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Building className="w-4 h-4" />
                              <span>{rfq.buyer}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              <span>{rfq.currency} {rfq.budget.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>Due: {rfq.dueDate}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>Quotes: {rfq.quotationsReceived}/{rfq.totalQuotations}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRFQ(rfq);
                              setIsRFQModalOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleSubmitQuotation(rfq.id)}>
                                <Send className="w-4 h-4 mr-2" />
                                Submit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleClarificationRequest(rfq.id)}>
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Ask
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quotations" className="space-y-4">
          <div className="print-container">
            <Card className="mx-auto max-w-full overflow-hidden border-slate-200/60 shadow-md">
              <div className="p-3.5 border-b flex flex-col xl:flex-row items-center justify-between gap-4 bg-white no-print">
                <h3 className="font-bold text-lg text-slate-800 shrink-0">My Quotation</h3>

                <div className="flex flex-1 items-center gap-3 w-full max-w-4xl">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search quotations..."
                      value={quotationSearchTerm}
                      onChange={(e) => setQuotationSearchTerm(e.target.value)}
                      className="pl-10 h-10 bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-10 px-3 flex items-center gap-2 bg-slate-50/50 border-slate-200">
                          <Filter className="w-4 h-4 text-slate-600" />
                          <span className="text-sm font-medium">Filters</span>
                          {quotationStatusFilter !== 'all' && (
                            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px] bg-blue-100 text-blue-700 border-blue-200">1</Badge>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-4" align="end">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm">Advanced Filters</h4>
                            <Button variant="ghost" size="sm" onClick={() => setQuotationStatusFilter('all')} className="h-8 text-xs text-blue-600 hover:text-blue-700 px-2">Reset</Button>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quotation Status</Label>
                            <Select value={quotationStatusFilter} onValueChange={setQuotationStatusFilter}>
                              <SelectTrigger className="w-full h-10 border-slate-200">
                                <SelectValue placeholder="All Statuses" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="Submitted">Submitted</SelectItem>
                                <SelectItem value="Under Review">Under Review</SelectItem>
                                <SelectItem value="Awarded">Awarded</SelectItem>
                                <SelectItem value="Rejected">Rejected</SelectItem>
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
                        { id: 'quotationNumber', label: 'Quotation Details' },
                        { id: 'rfqNumber', label: 'RFQ Number' },
                        { id: 'amount', label: 'Amount' },
                        { id: 'submittedDate', label: 'Submitted Date' },
                        { id: 'validUntil', label: 'Valid Until' },
                        { id: 'status', label: 'Status' }
                      ].map(col => (
                        <div key={col.id} className="flex items-center space-x-2 px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors" onClick={(e) => { e.preventDefault(); toggleQuotationColumn(col.id); }}>
                          <Checkbox
                            id={`quo-col-${col.id}`}
                            checked={visibleQuotationColumns.includes(col.id)}
                            onCheckedChange={() => toggleQuotationColumn(col.id)}
                          />
                          <Label htmlFor={`quo-col-${col.id}`} className="text-sm cursor-pointer flex-1">{col.label}</Label>
                        </div>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="flex items-center border border-slate-200 rounded-lg p-1 bg-slate-50 shrink-0 h-10">
                    <Button
                      variant={quotationViewMode === 'grid' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setQuotationViewMode('grid')}
                      className="rounded-md h-8 px-3"
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={quotationViewMode === 'list' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setQuotationViewMode('list')}
                      className="rounded-md h-8 px-3"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={quotationViewMode === 'table' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setQuotationViewMode('table')}
                      className="rounded-md h-8 px-3"
                    >
                      <Table className="w-4 h-4" />
                    </Button>
                  </div>

                  <DropdownMenu>
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
                      <DropdownMenuItem onClick={handleExportPDF} className="gap-2 cursor-pointer">
                        <FileText className="w-4 h-4 text-red-600" />
                        Export to PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Table View */}
              {quotationViewMode === 'table' && (
                <div className="overflow-hidden bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <DraggableTableHeader>
                          {visibleQuotationColumns.includes('quotationNumber') && (
                            <th className="text-left p-4 font-semibold text-slate-600 text-sm sticky left-8 z-30 bg-[#f8fafc] border-b shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] whitespace-nowrap min-w-[200px]">
                              <button onClick={() => requestQuotationSort('quotationNumber')} className="flex items-center gap-1 hover:text-primary transition-colors">
                                Quotation Details
                                <ArrowUpDown className={`w-3.5 h-3.5 ${quotationSortConfig.key === 'quotationNumber' ? 'text-primary' : 'text-slate-400'}`} />
                              </button>
                            </th>
                          )}
                          {visibleQuotationColumns.includes('rfqNumber') && (
                            <th className="text-left p-4 font-semibold text-slate-600 text-sm whitespace-nowrap min-w-[150px]">
                              <button onClick={() => requestQuotationSort('rfqNumber')} className="flex items-center gap-1 hover:text-primary transition-colors">
                                RFQ Number
                                <ArrowUpDown className={`w-3.5 h-3.5 ${quotationSortConfig.key === 'rfqNumber' ? 'text-primary' : 'text-slate-400'}`} />
                              </button>
                            </th>
                          )}
                          {visibleQuotationColumns.includes('amount') && (
                            <th className="text-left p-4 font-semibold text-slate-600 text-sm whitespace-nowrap">
                              <button onClick={() => requestQuotationSort('amount')} className="flex items-center gap-1 hover:text-primary transition-colors">
                                Amount
                                <ArrowUpDown className={`w-3.5 h-3.5 ${quotationSortConfig.key === 'amount' ? 'text-primary' : 'text-slate-400'}`} />
                              </button>
                            </th>
                          )}
                          {visibleQuotationColumns.includes('submittedDate') && (
                            <th className="text-left p-4 font-semibold text-slate-600 text-sm whitespace-nowrap">
                              <button onClick={() => requestQuotationSort('submittedDate')} className="flex items-center gap-1 hover:text-primary transition-colors">
                                Submitted Date
                                <ArrowUpDown className={`w-3.5 h-3.5 ${quotationSortConfig.key === 'submittedDate' ? 'text-primary' : 'text-slate-400'}`} />
                              </button>
                            </th>
                          )}
                          {visibleQuotationColumns.includes('validUntil') && (
                            <th className="text-left p-4 font-semibold text-slate-600 text-sm whitespace-nowrap">
                              <button onClick={() => requestQuotationSort('validUntil')} className="flex items-center gap-1 hover:text-primary transition-colors">
                                Valid Until
                                <ArrowUpDown className={`w-3.5 h-3.5 ${quotationSortConfig.key === 'validUntil' ? 'text-primary' : 'text-slate-400'}`} />
                              </button>
                            </th>
                          )}
                          {visibleQuotationColumns.includes('status') && (
                            <th className="text-left p-4 font-semibold text-slate-600 text-sm whitespace-nowrap">
                              <button onClick={() => requestQuotationSort('status')} className="flex items-center gap-1 hover:text-primary transition-colors">
                                Status
                                <ArrowUpDown className={`w-3.5 h-3.5 ${quotationSortConfig.key === 'status' ? 'text-primary' : 'text-slate-400'}`} />
                              </button>
                            </th>
                          )}
                          <th className="text-left p-4 font-semibold text-slate-600 text-sm sticky right-0 z-30 bg-[#f8fafc] border-b shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] whitespace-nowrap text-center">Action</th>
                        </DraggableTableHeader>
                      </thead>
                      <tbody>
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={(event) => {
                            const { active, over } = event;
                            if (over && active.id !== over.id) {
                              setQuotations((items) => {
                                const oldIndex = items.findIndex((i) => i.id === active.id);
                                const newIndex = items.findIndex((i) => i.id === over.id);
                                return arrayMove(items, oldIndex, newIndex);
                              });
                            }
                          }}
                        >
                          <SortableContext
                            items={pagedQuotations.map((q) => q.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {pagedQuotations.map((quo) => (
                              <DraggableTableRow key={quo.id} id={quo.id}>
                                {visibleQuotationColumns.includes('quotationNumber') && (
                                  <td className="p-4 sticky left-8 z-20 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-slate-50 transition-colors whitespace-nowrap">
                                    <div>
                                      <p className="font-medium text-slate-900 leading-tight">{quo.quotationNumber}</p>
                                      <p className="text-xs text-muted-foreground line-clamp-1">Supplier: {quo.supplierName}</p>
                                    </div>
                                  </td>
                                )}
                                {visibleQuotationColumns.includes('rfqNumber') && (
                                  <td className="p-4 whitespace-nowrap text-sm text-slate-700 font-medium">
                                    {quo.rfqNumber}
                                  </td>
                                )}
                                {visibleQuotationColumns.includes('amount') && (
                                  <td className="p-4 whitespace-nowrap">
                                    <p className="font-bold text-slate-900">{quo.currency} {quo.totalAmount.toLocaleString()}</p>
                                  </td>
                                )}
                                {visibleQuotationColumns.includes('submittedDate') && (
                                  <td className="p-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2 text-slate-600">
                                      <Calendar className="w-4 h-4" />
                                      <span className="text-sm">{quo.submittedDate}</span>
                                    </div>
                                  </td>
                                )}
                                {visibleQuotationColumns.includes('validUntil') && (
                                  <td className="p-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2 text-slate-600">
                                      <Clock className="w-4 h-4" />
                                      <span className="text-sm">{quo.validUntil}</span>
                                    </div>
                                  </td>
                                )}
                                {visibleQuotationColumns.includes('status') && (
                                  <td className="p-4 whitespace-nowrap">
                                    <Badge variant={getStatusColor(quo.status)}>
                                      {quo.status}
                                    </Badge>
                                  </td>
                                )}
                                <td className="p-4 sticky right-0 z-20 bg-white shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-slate-50 transition-colors whitespace-nowrap text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedQuotation(quo);
                                        setIsQuotationModalOpen(true);
                                      }}
                                      className="h-8 w-8 p-0 bg-white hover:bg-slate-50 rounded-full border-slate-200"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-slate-600" />
                                    </Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                                          <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEditQuotation(quo)}>
                                          <Edit className="w-4 h-4 mr-2" />
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => confirmDeleteQuotation(quo.id)} className="text-red-600 focus:text-red-600">
                                          <X className="w-4 h-4 mr-2" />
                                          Delete
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
                  <MaterialPagination
                    currentPage={quotationPage}
                    totalItems={filteredQuotations.length}
                    onPageChange={setQuotationPage}
                  />
                </div>
              )}

              {/* Grid View */}
              {quotationViewMode === 'grid' && (
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pagedQuotations.map((quo) => (
                      <Card key={quo.id} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-bold text-lg">{quo.quotationNumber}</p>
                            <p className="text-xs text-muted-foreground">{quo.rfqNumber}</p>
                          </div>
                          <Badge variant={getStatusColor(quo.status)}>{quo.status}</Badge>
                        </div>
                        <div className="space-y-3 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Amount:</span>
                            <span className="font-bold">{quo.currency} {quo.totalAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Supplier:</span>
                            <span>{quo.supplierName}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Valid Until:</span>
                            <span>{quo.validUntil}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            variant="outline"
                            className="flex-1 gap-2 border-slate-200"
                            onClick={() => {
                              setSelectedQuotation(quo);
                              setIsQuotationModalOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-[42px] px-2 border-slate-200">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditQuotation(quo)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => confirmDeleteQuotation(quo.id)} className="text-red-600 focus:text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* List View */}
              {quotationViewMode === 'list' && (
                <div className="p-4 space-y-3">
                  {pagedQuotations.map((quo) => (
                    <Card key={quo.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-semibold">{quo.quotationNumber}</p>
                            <Badge variant={getStatusColor(quo.status)} className="text-xs">{quo.status}</Badge>
                            <span className="text-xs text-muted-foreground">{quo.rfqNumber}</span>
                          </div>
                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              <span className="font-bold text-slate-900">{quo.currency} {quo.totalAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>Submitted: {quo.submittedDate}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>Valid: {quo.validUntil}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedQuotation(quo);
                              setIsQuotationModalOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditQuotation(quo)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => confirmDeleteQuotation(quo.id)} className="text-red-600 focus:text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clarifications" className="space-y-6">
          {/* Clarifications */}
          <Card>
            <div className="p-4 border-b">
              <h3>Questions & Clarifications</h3>
            </div>
            <div className="space-y-4 p-4">
              {clarificationData.map((clarification) => (
                <Card key={clarification.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{clarification.rfqNumber}</span>
                        <Badge variant={getStatusColor(clarification.status)} className="text-xs">
                          {clarification.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Asked: {clarification.askedDate}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm">Question:</Label>
                      <p className="text-sm mt-1 p-3 bg-muted/30 rounded">{clarification.question}</p>
                    </div>

                    {clarification.response && (
                      <div>
                        <Label className="text-sm">Response:</Label>
                        <p className="text-sm mt-1 p-3 bg-green-50 rounded">{clarification.response}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Responded: {clarification.respondedDate}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Supplier: {clarification.supplierName}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Analytics Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="p-4 border-b">
                <h3>Bidding Performance</h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span>Win Rate</span>
                  <span className="font-semibold">67%</span>
                </div>
                <Progress value={67} className="h-2" />

                <div className="flex justify-between items-center">
                  <span>Response Rate</span>
                  <span className="font-semibold">85%</span>
                </div>
                <Progress value={85} className="h-2" />

                <div className="flex justify-between items-center">
                  <span>Average Bid Amount</span>
                  <span className="font-semibold">$34,750</span>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-4 border-b">
                <h3>Category Performance</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span>IT Equipment</span>
                  <div className="flex items-center gap-2">
                    <Progress value={75} className="w-16 h-2" />
                    <span className="text-sm">75%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Software</span>
                  <div className="flex items-center gap-2">
                    <Progress value={60} className="w-16 h-2" />
                    <span className="text-sm">60%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Services</span>
                  <div className="flex items-center gap-2">
                    <Progress value={80} className="w-16 h-2" />
                    <span className="text-sm">80%</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* RFQ Details Modal */}
      <Dialog open={isRFQModalOpen} onOpenChange={setIsRFQModalOpen}>
        <DialogContent className="max-w-4xl w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>RFQ Details</DialogTitle>
            <DialogDescription>
              Review RFQ requirements and submit your quotation
            </DialogDescription>
          </DialogHeader>
          {selectedRFQ && (
            <div className="space-y-6">
              {/* RFQ Header */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>RFQ Number</Label>
                  <p className="text-sm mt-1">{selectedRFQ.rfqNumber}</p>
                </div>
                <div>
                  <Label>Buyer</Label>
                  <p className="text-sm mt-1">{selectedRFQ.buyer}</p>
                </div>
                <div>
                  <Label>Title</Label>
                  <p className="text-sm mt-1">{selectedRFQ.title}</p>
                </div>
                <div>
                  <Label>Category</Label>
                  <p className="text-sm mt-1">{selectedRFQ.category}</p>
                </div>
                <div>
                  <Label>Budget</Label>
                  <p className="text-lg font-semibold mt-1">{selectedRFQ.currency} {selectedRFQ.budget?.toLocaleString()}</p>
                </div>
                <div>
                  <Label>Due Date</Label>
                  <p className="text-sm mt-1">{selectedRFQ.dueDate}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label>Description</Label>
                <p className="text-sm mt-1 p-3 bg-muted/30 rounded">{selectedRFQ.description}</p>
              </div>

              {/* Attachments */}
              {selectedRFQ.attachments && selectedRFQ.attachments.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold text-slate-700">Attachments</Label>
                  <div className="grid grid-cols-1 gap-2 mt-3">
                    {selectedRFQ.attachments.map((attachment: string, index: number) => (
                      <div key={index} className="flex items-center gap-4 p-3 border border-slate-200 rounded-xl bg-slate-50/20 hover:bg-white hover:border-primary/40 hover:shadow-sm transition-all group">
                        <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-sm font-semibold text-slate-700 truncate">{attachment}</span>
                          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Document</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-slate-100 border border-slate-100" title="View Attachment">
                            <Eye className="w-4.5 h-4.5 text-slate-600" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-blue-50 border border-blue-50" title="Download Attachment">
                            <Download className="w-4.5 h-4.5 text-blue-600" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="grid grid-cols-4 gap-3 pt-6 border-t mt-6">
                <Button className="gap-2 h-11 font-bold shadow-md bg-slate-900 hover:bg-slate-800 text-white transition-all transform active:scale-95">
                  <Send className="w-4 h-4" />
                  Submit
                </Button>
                <Button variant="outline" className="gap-2 h-11 font-semibold border-slate-200 hover:bg-slate-50 transition-all">
                  <MessageSquare className="w-4 h-4" />
                  Ask
                </Button>
                <Button variant="outline" className="gap-2 h-11 font-semibold border-slate-200 hover:bg-slate-50 transition-all text-blue-600">
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button variant="outline" onClick={() => setIsRFQModalOpen(false)} className="h-11 font-semibold border-slate-200 hover:bg-slate-50 transition-all">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quotation Details Modal */}
      <Dialog open={isQuotationModalOpen} onOpenChange={setIsQuotationModalOpen}>
        <DialogContent className="max-w-4xl w-[85vw]">
          <DialogHeader>
            <DialogTitle>Quotation Details</DialogTitle>
            <DialogDescription>
              Review your submitted quotation
            </DialogDescription>
          </DialogHeader>
          {selectedQuotation && (
            <div className="space-y-6">
              {/* Quotation Header */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quotation Number</Label>
                  <p className="text-sm mt-1">{selectedQuotation.quotationNumber}</p>
                </div>
                <div>
                  <Label>RFQ Number</Label>
                  <p className="text-sm mt-1">{selectedQuotation.rfqNumber}</p>
                </div>
                <div>
                  <Label>Total Amount</Label>
                  <p className="text-lg font-semibold mt-1">{selectedQuotation.currency} {selectedQuotation.totalAmount?.toLocaleString()}</p>
                </div>
                <div>
                  <Label>Valid Until</Label>
                  <p className="text-sm mt-1">{selectedQuotation.validUntil}</p>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <Label>Line Items</Label>
                <div className="mt-2 border rounded">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Item</th>
                        <th className="text-left p-3 font-medium">Unit Price</th>
                        <th className="text-left p-3 font-medium">Quantity</th>
                        <th className="text-left p-3 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedQuotation.lineItems?.map((item: any, index: number) => (
                        <tr key={index} className="border-b">
                          <td className="p-3">{item.item}</td>
                          <td className="p-3">${item.unitPrice?.toLocaleString()}</td>
                          <td className="p-3">{item.quantity}</td>
                          <td className="p-3">${item.total?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label>Notes</Label>
                <p className="text-sm mt-1 p-3 bg-muted/30 rounded">{selectedQuotation.notes}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t mt-6">
                <Button variant="outline" className="gap-2" onClick={() => {
                  setIsQuotationModalOpen(false);
                  handleEditQuotation(selectedQuotation);
                }}>
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
                <Button variant="outline" className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => {
                  setIsQuotationModalOpen(false);
                  confirmDeleteQuotation(selectedQuotation.id);
                }}>
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
                <Button variant="outline" className="ml-auto" onClick={() => setIsQuotationModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Clarification Request Modal */}
      <Dialog open={isClarificationModalOpen} onOpenChange={setIsClarificationModalOpen}>
        <DialogContent className="max-w-lg w-[80vw]">
          <DialogHeader>
            <DialogTitle>Request Clarification</DialogTitle>
            <DialogDescription>
              Ask questions about the RFQ requirements
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Question</Label>
              <Textarea
                placeholder="Enter your question about the RFQ requirements..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select question category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technical Specifications</SelectItem>
                  <SelectItem value="commercial">Commercial Terms</SelectItem>
                  <SelectItem value="delivery">Delivery Requirements</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsClarificationModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsClarificationModalOpen(false)}>
                Submit Question
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
            border: none;
            box-shadow: none;
          }
          .no-print {
            display: none !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            border: 1px solid #e2e8f0 !important;
      {/* Quotation Form Modal (Create/Edit) */}
      <Dialog open={isQuotationFormModalOpen} onOpenChange={setIsQuotationFormModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{quotationFormMode === 'create' ? 'Submit New Quotation' : 'Edit Quotation'}</DialogTitle>
            <DialogDescription>
              {quotationFormMode === 'create' ? 'Fill in the details to submit your proposal' : 'Update the details of your submitted quotation'}
            </DialogDescription>
          </DialogHeader>
          {currentQuotationForForm && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>RFQ Number</Label>
                  <Input value={currentQuotationForForm.rfqNumber} readOnly className="bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <Label>Valid Until</Label>
                  <Input 
                    type="date" 
                    value={currentQuotationForForm.validUntil} 
                    onChange={(e) => setCurrentQuotationForForm({...currentQuotationForForm, validUntil: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Line Items</Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      const items = [...currentQuotationForForm.lineItems, { item: '', unitPrice: 0, quantity: 1, total: 0 }];
                      setCurrentQuotationForForm({...currentQuotationForForm, lineItems: items});
                    }}
                  >
                    Add Item
                  </Button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-[11px] uppercase tracking-wider font-bold text-slate-500">
                      <tr>
                        <th className="p-2 text-left">Description</th>
                        <th className="p-2 text-right w-24">Unit Price</th>
                        <th className="p-2 text-right w-20">Qty</th>
                        <th className="p-2 text-right w-24">Total</th>
                        <th className="p-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {currentQuotationForForm.lineItems.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="p-2">
                            <Input 
                              value={item.item} 
                              onChange={(e) => {
                                const newItems = [...currentQuotationForForm.lineItems];
                                newItems[idx].item = e.target.value;
                                setCurrentQuotationForForm({...currentQuotationForForm, lineItems: newItems});
                              }}
                              placeholder="Item description"
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <Input 
                              type="number"
                              value={item.unitPrice} 
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                const newItems = [...currentQuotationForForm.lineItems];
                                newItems[idx].unitPrice = val;
                                newItems[idx].total = val * newItems[idx].quantity;
                                const newTotal = newItems.reduce((acc, i) => acc + i.total, 0);
                                setCurrentQuotationForForm({...currentQuotationForForm, lineItems: newItems, totalAmount: newTotal});
                              }}
                              className="h-8 text-xs text-right pr-1"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <Input 
                              type="number"
                              value={item.quantity} 
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                const newItems = [...currentQuotationForForm.lineItems];
                                newItems[idx].quantity = val;
                                newItems[idx].total = val * newItems[idx].unitPrice;
                                const newTotal = newItems.reduce((acc, i) => acc + i.total, 0);
                                setCurrentQuotationForForm({...currentQuotationForForm, lineItems: newItems, totalAmount: newTotal});
                              }}
                              className="h-8 text-xs text-right pr-1"
                            />
                          </td>
                          <td className="p-2 text-right font-semibold">
                            {currentQuotationForForm.currency} {item.total.toLocaleString()}
                          </td>
                          <td className="p-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-red-500" 
                              onClick={() => {
                                if (currentQuotationForForm.lineItems.length > 1) {
                                  const newItems = currentQuotationForForm.lineItems.filter((_: any, i: number) => i !== idx);
                                  const newTotal = newItems.reduce((acc: number, i: any) => acc + i.total, 0);
                                  setCurrentQuotationForForm({...currentQuotationForForm, lineItems: newItems, totalAmount: newTotal});
                                }
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50/50">
                      <tr>
                        <td colSpan={3} className="p-2 text-right font-bold">Total Amount:</td>
                        <td className="p-2 text-right font-bold text-blue-600 text-base">
                          {currentQuotationForForm.currency} {currentQuotationForForm.totalAmount.toLocaleString()}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Internal Notes</Label>
                <Textarea 
                  value={currentQuotationForForm.notes} 
                  onChange={(e) => setCurrentQuotationForForm({...currentQuotationForForm, notes: e.target.value})}
                  placeholder="Special terms, delivery conditions, etc."
                  rows={3}
                  className="text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white">
                <Button variant="outline" onClick={() => setIsQuotationFormModalOpen(false)}>Cancel</Button>
                <Button onClick={() => handleSaveQuotation(currentQuotationForForm)}>
                  {quotationFormMode === 'create' ? 'Submit Proposal' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteQuotationConfirmOpen} onOpenChange={setIsDeleteQuotationConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Quotation</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this quotation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteQuotationConfirmOpen(false)}>No, Keep it</Button>
            <Button variant="destructive" onClick={handleDeleteQuotation}>Yes, Cancel Proposal</Button>
          </div>
        </DialogContent>
      </Dialog>
            padding: 8px !important;
          }
          .sticky {
            position: static !important;
          }
        }
      `}} />
    </div>
  );
}