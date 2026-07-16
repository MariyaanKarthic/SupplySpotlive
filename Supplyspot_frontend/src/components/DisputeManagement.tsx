import React, { useState } from 'react';
import {
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  DollarSign,
  Package,
  Truck,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Send,
  Paperclip,
  Download,
  Upload,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Timer,
  Bell,
  ArrowRight,
  ArrowUp,
  Activity,
  Target,
  MessageCircle,
  Zap,
  Info,
  ExternalLink,
  Hash,
  Award,
  RefreshCw,
  Settings,
  ChevronRight,
  ChevronDown,
  User,
  Phone,
  Mail,
  Building,
  AlertCircle,
  Workflow,
  RotateCcw,
  Grid,
  List,
  Table as TableIcon
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
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Avatar, AvatarFallback } from './ui/avatar';
import { format, addDays, differenceInHours, differenceInDays } from 'date-fns';

interface Dispute {
  id: string;
  title: string;
  description: string;
  category: 'invoice-discrepancy' | 'payment-delay' | 'delivery-issue' | 'quality-issue' | 'po-issue' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'submitted' | 'assigned' | 'investigating' | 'pending-supplier' | 'pending-internal' | 'resolved' | 'closed' | 'escalated';
  submittedBy: {
    name: string;
    email: string;
    company: string;
    role: string;
  };
  assignedTo?: {
    name: string;
    department: 'ap' | 'procurement' | 'logistics' | 'quality' | 'legal';
    email: string;
  };
  relatedDocuments: {
    type: 'po' | 'invoice' | 'asn' | 'contract' | 'delivery-note';
    number: string;
    amount?: number;
    currency?: string;
  }[];
  messages: DisputeMessage[];
  attachments: DisputeAttachment[];
  resolution?: DisputeResolution;
  slaDetails: {
    targetResolution: Date;
    escalationDate: Date;
    isOverdue: boolean;
    hoursRemaining: number;
  };
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  tags: string[];
}

interface DisputeMessage {
  id: string;
  disputeId: string;
  sender: {
    name: string;
    email: string;
    type: 'supplier' | 'internal';
    department?: string;
  };
  message: string;
  isInternal: boolean;
  timestamp: Date;
  attachments?: string[];
  status: 'sent' | 'read' | 'replied';
}

interface DisputeAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
  url: string;
}

interface DisputeResolution {
  id: string;
  type: 'full-credit' | 'partial-credit' | 'no-action' | 'process-change' | 'policy-update';
  description: string;
  financialAdjustment?: {
    amount: number;
    currency: string;
    creditNoteNumber?: string;
  };
  approvedBy: string;
  resolvedAt: Date;
  followUpRequired: boolean;
  preventiveActions: string[];
}

interface EscalationRule {
  id: string;
  name: string;
  category: string;
  priority: string;
  escalationHours: number;
  escalateTo: string;
  notificationChannels: string[];
  isActive: boolean;
}

interface DisputeAnalytics {
  totalDisputes: number;
  openDisputes: number;
  avgResolutionTime: number;
  resolutionRate: number;
  categoryBreakdown: Record<string, number>;
  topSuppliers: Array<{ name: string; count: number }>;
  trendData: Array<{ date: string; disputes: number; resolved: number }>;
}

const mockDisputes: Dispute[] = [
  {
    id: 'DISP-100',
    title: 'Invoice Amount Mismatch - Unauthorized $750 Freight Charge',
    description: 'Invoice INV-AF-2024-089 shows total of $12,750 but PO-2024-123 was approved for $12,000. Invoice includes $750 freight charge not specified in original purchase order.',
    category: 'invoice-discrepancy',
    priority: 'high',
    status: 'submitted',
    submittedBy: {
      name: 'Amanda Foster',
      email: 'amanda.foster@automotivefleet.com',
      company: 'Automotive Fleet Services',
      role: 'AP Manager'
    },
    assignedTo: {
      name: 'Jennifer Liu',
      department: 'ap',
      email: 'jennifer.liu@company.com'
    },
    relatedDocuments: [
      {
        type: 'po',
        number: 'PO-2024-123',
        amount: 12000,
        currency: 'USD'
      },
      {
        type: 'invoice',
        number: 'INV-AF-2024-089',
        amount: 12750,
        currency: 'USD'
      }
    ],
    messages: [
      {
        id: 'MSG-100A',
        disputeId: 'DISP-100',
        sender: {
          name: 'Amanda Foster',
          email: 'amanda.foster@automotivefleet.com',
          type: 'supplier'
        },
        message: 'Our invoice includes a freight charge of $750 that was not included in the original PO. This charge was added due to special delivery requirements requested after PO approval. Can you please review and approve the additional amount?',
        isInternal: false,
        timestamp: new Date('2024-01-22T08:15:00'),
        status: 'sent'
      }
    ],
    attachments: [
      {
        id: 'ATT-100A',
        name: 'Invoice_INV-AF-2024-089.pdf',
        type: 'pdf',
        size: 245760,
        uploadedBy: 'Amanda Foster',
        uploadedAt: new Date('2024-01-22T08:15:00'),
        url: '#'
      },
      {
        id: 'ATT-100B',
        name: 'Freight_Charge_Breakdown.xlsx',
        type: 'excel',
        size: 89440,
        uploadedBy: 'Amanda Foster',
        uploadedAt: new Date('2024-01-22T08:15:00'),
        url: '#'
      }
    ],
    slaDetails: {
      targetResolution: new Date('2024-01-24T17:00:00'),
      escalationDate: new Date('2024-01-23T17:00:00'),
      isOverdue: false,
      hoursRemaining: 31
    },
    createdAt: new Date('2024-01-22T08:15:00'),
    updatedAt: new Date('2024-01-22T08:15:00'),
    tags: ['amount-mismatch', 'unauthorized-charges', 'freight-costs', 'urgent']
  },
  {
    id: 'DISP-101',
    title: 'Missing PO Reference - Cannot Process Invoice INV-TC-445',
    description: 'Invoice INV-TC-445 for $8,950 does not contain any PO reference number. Our AP system requires PO matching for all invoices over $5,000. Unable to process payment without proper PO linkage.',
    category: 'invoice-discrepancy',
    priority: 'medium',
    status: 'pending-supplier',
    submittedBy: {
      name: 'David Rodriguez',
      email: 'david.rodriguez@techconsulting.com',
      company: 'Tech Consulting Group',
      role: 'Billing Coordinator'
    },
    assignedTo: {
      name: 'Lisa Wang',
      department: 'ap',
      email: 'lisa.wang@company.com'
    },
    relatedDocuments: [
      {
        type: 'invoice',
        number: 'INV-TC-445',
        amount: 8950,
        currency: 'USD'
      }
    ],
    messages: [
      {
        id: 'MSG-101A',
        disputeId: 'DISP-101',
        sender: {
          name: 'Lisa Wang',
          email: 'lisa.wang@company.com',
          type: 'internal',
          department: 'AP'
        },
        message: 'Your invoice INV-TC-445 is missing the required PO reference number. Based on the services described, this likely corresponds to PO-2024-078 for IT consulting services. Please confirm and resubmit with the correct PO reference.',
        isInternal: false,
        timestamp: new Date('2024-01-21T14:30:00'),
        status: 'sent'
      },
      {
        id: 'MSG-101B',
        disputeId: 'DISP-101',
        sender: {
          name: 'David Rodriguez',
          email: 'david.rodriguez@techconsulting.com',
          type: 'supplier'
        },
        message: 'Thank you for the clarification. Yes, this invoice should reference PO-2024-078. I will update our invoice template to include the PO reference and resubmit.',
        isInternal: false,
        timestamp: new Date('2024-01-21T16:45:00'),
        status: 'read'
      }
    ],
    attachments: [
      {
        id: 'ATT-101A',
        name: 'Invoice_INV-TC-445_Original.pdf',
        type: 'pdf',
        size: 156890,
        uploadedBy: 'David Rodriguez',
        uploadedAt: new Date('2024-01-21T09:15:00'),
        url: '#'
      }
    ],
    slaDetails: {
      targetResolution: new Date('2024-01-23T14:30:00'),
      escalationDate: new Date('2024-01-22T14:30:00'),
      isOverdue: false,
      hoursRemaining: 18
    },
    createdAt: new Date('2024-01-21T09:15:00'),
    updatedAt: new Date('2024-01-21T16:45:00'),
    tags: ['missing-po-reference', 'ap-compliance', 'documentation-required']
  },
  {
    id: 'DISP-102',
    title: 'ASN Reference Missing - Delivery Verification Required',
    description: 'Invoice INV-ML-667 for $23,400 references goods delivery but no ASN number provided. Cannot verify delivery against receiving records. Need ASN reference to match against delivery confirmation.',
    category: 'invoice-discrepancy',
    priority: 'high',
    status: 'assigned',
    submittedBy: {
      name: 'Rebecca Chen',
      email: 'rebecca.chen@metallogistics.com',
      company: 'Metal Logistics Corp',
      role: 'Invoice Processing'
    },
    assignedTo: {
      name: 'Mike Chen',
      department: 'ap',
      email: 'mike.chen@company.com'
    },
    relatedDocuments: [
      {
        type: 'invoice',
        number: 'INV-ML-667',
        amount: 23400,
        currency: 'USD'
      },
      {
        type: 'po',
        number: 'PO-2024-156',
        amount: 23400,
        currency: 'USD'
      }
    ],
    messages: [
      {
        id: 'MSG-102A',
        disputeId: 'DISP-102',
        sender: {
          name: 'Mike Chen',
          email: 'mike.chen@company.com',
          type: 'internal',
          department: 'AP'
        },
        message: 'Your invoice shows delivery completed on Jan 18, but we need the ASN reference number to verify against our receiving system. Please provide the ASN number for this shipment.',
        isInternal: false,
        timestamp: new Date('2024-01-22T10:20:00'),
        status: 'sent'
      },
      {
        id: 'MSG-102B',
        disputeId: 'DISP-102',
        sender: {
          name: 'Rebecca Chen',
          email: 'rebecca.chen@metallogistics.com',
          type: 'supplier'
        },
        message: 'The ASN reference for this delivery is ASN-ML-2024-089. The goods were delivered to your warehouse on Jan 18 at 2:30 PM. Please let me know if you need any additional documentation.',
        isInternal: false,
        timestamp: new Date('2024-01-22T11:45:00'),
        status: 'read'
      }
    ],
    attachments: [
      {
        id: 'ATT-102A',
        name: 'Delivery_Receipt_Jan18.pdf',
        type: 'pdf',
        size: 298670,
        uploadedBy: 'Rebecca Chen',
        uploadedAt: new Date('2024-01-22T11:45:00'),
        url: '#'
      },
      {
        id: 'ATT-102B',
        name: 'ASN_ML-2024-089.pdf',
        type: 'pdf',
        size: 145230,
        uploadedBy: 'Rebecca Chen',
        uploadedAt: new Date('2024-01-22T11:45:00'),
        url: '#'
      }
    ],
    slaDetails: {
      targetResolution: new Date('2024-01-24T10:20:00'),
      escalationDate: new Date('2024-01-23T10:20:00'),
      isOverdue: false,
      hoursRemaining: 34
    },
    createdAt: new Date('2024-01-22T10:20:00'),
    updatedAt: new Date('2024-01-22T11:45:00'),
    tags: ['missing-asn-reference', 'delivery-verification', 'receiving-mismatch']
  },
  {
    id: 'DISP-103',
    title: 'Invoice Amount Discrepancy - Quantity vs Pricing Mismatch',
    description: 'Invoice INV-PS-334 shows 250 units @ $45/unit = $11,250, but PO-2024-089 specified 250 units @ $42/unit = $10,500. Price increase of $3/unit not authorized.',
    category: 'invoice-discrepancy',
    priority: 'critical',
    status: 'escalated',
    submittedBy: {
      name: 'Marcus Thompson',
      email: 'marcus.thompson@plasticssupply.com',
      company: 'Plastics Supply Solutions',
      role: 'Finance Director'
    },
    assignedTo: {
      name: 'Jennifer Liu',
      department: 'ap',
      email: 'jennifer.liu@company.com'
    },
    relatedDocuments: [
      {
        type: 'po',
        number: 'PO-2024-089',
        amount: 10500,
        currency: 'USD'
      },
      {
        type: 'invoice',
        number: 'INV-PS-334',
        amount: 11250,
        currency: 'USD'
      },
      {
        type: 'asn',
        number: 'ASN-PS-2024-067'
      }
    ],
    messages: [
      {
        id: 'MSG-103A',
        disputeId: 'DISP-103',
        sender: {
          name: 'Marcus Thompson',
          email: 'marcus.thompson@plasticssupply.com',
          type: 'supplier'
        },
        message: 'The price increase reflects current market conditions for plastic resins. We sent a price update notice on Jan 10, but may not have received confirmation. Can we discuss a partial adjustment?',
        isInternal: false,
        timestamp: new Date('2024-01-21T13:20:00'),
        status: 'read'
      },
      {
        id: 'MSG-103B',
        disputeId: 'DISP-103',
        sender: {
          name: 'Jennifer Liu',
          email: 'jennifer.liu@company.com',
          type: 'internal',
          department: 'AP'
        },
        message: 'We did not receive any price change notification on Jan 10. The PO was issued on Jan 15 with the original pricing. This matter has been escalated to procurement for review.',
        isInternal: false,
        timestamp: new Date('2024-01-21T15:45:00'),
        status: 'sent'
      }
    ],
    attachments: [
      {
        id: 'ATT-103A',
        name: 'Price_Comparison_Analysis.xlsx',
        type: 'excel',
        size: 67820,
        uploadedBy: 'Jennifer Liu',
        uploadedAt: new Date('2024-01-21T15:45:00'),
        url: '#'
      },
      {
        id: 'ATT-103B',
        name: 'Market_Pricing_Notice_Jan10.pdf',
        type: 'pdf',
        size: 198440,
        uploadedBy: 'Marcus Thompson',
        uploadedAt: new Date('2024-01-21T16:10:00'),
        url: '#'
      }
    ],
    slaDetails: {
      targetResolution: new Date('2024-01-23T13:20:00'),
      escalationDate: new Date('2024-01-22T13:20:00'),
      isOverdue: true,
      hoursRemaining: -8
    },
    createdAt: new Date('2024-01-21T13:20:00'),
    updatedAt: new Date('2024-01-21T16:10:00'),
    tags: ['pricing-discrepancy', 'unauthorized-price-increase', 'escalated', 'procurement-review']
  },
  {
    id: 'DISP-001',
    title: 'Invoice Amount Mismatch - PO-2024-001',
    description: 'Invoice amount of $15,500 does not match PO amount of $15,000. Additional charges not documented in original agreement.',
    category: 'invoice-discrepancy',
    priority: 'high',
    status: 'investigating',
    submittedBy: {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@steelcomponents.com',
      company: 'Steel Components Inc',
      role: 'Finance Manager'
    },
    assignedTo: {
      name: 'Mike Chen',
      department: 'ap',
      email: 'mike.chen@company.com'
    },
    relatedDocuments: [
      {
        type: 'po',
        number: 'PO-2024-001',
        amount: 15000,
        currency: 'USD'
      },
      {
        type: 'invoice',
        number: 'INV-SC-001',
        amount: 15500,
        currency: 'USD'
      }
    ],
    messages: [
      {
        id: 'MSG-001',
        disputeId: 'DISP-001',
        sender: {
          name: 'Sarah Johnson',
          email: 'sarah.johnson@steelcomponents.com',
          type: 'supplier'
        },
        message: 'Hello, I noticed a discrepancy between our invoice and the original PO. The invoice includes additional shipping charges that were not agreed upon.',
        isInternal: false,
        timestamp: new Date('2024-01-20T09:30:00'),
        status: 'read'
      },
      {
        id: 'MSG-002',
        disputeId: 'DISP-001',
        sender: {
          name: 'Mike Chen',
          email: 'mike.chen@company.com',
          type: 'internal',
          department: 'AP'
        },
        message: 'Thank you for bringing this to our attention. I am reviewing the original agreement and will get back to you within 24 hours.',
        isInternal: false,
        timestamp: new Date('2024-01-20T14:15:00'),
        status: 'read'
      }
    ],
    attachments: [
      {
        id: 'ATT-001',
        name: 'Original_Agreement.pdf',
        type: 'pdf',
        size: 245760,
        uploadedBy: 'Sarah Johnson',
        uploadedAt: new Date('2024-01-20T09:30:00'),
        url: '#'
      },
      {
        id: 'ATT-002',
        name: 'Invoice_Screenshot.png',
        type: 'image',
        size: 102400,
        uploadedBy: 'Sarah Johnson',
        uploadedAt: new Date('2024-01-20T09:32:00'),
        url: '#'
      }
    ],
    slaDetails: {
      targetResolution: new Date('2024-01-22T17:00:00'),
      escalationDate: new Date('2024-01-21T17:00:00'),
      isOverdue: false,
      hoursRemaining: 18
    },
    createdAt: new Date('2024-01-20T09:30:00'),
    updatedAt: new Date('2024-01-20T14:15:00'),
    tags: ['billing', 'shipping-charges', 'contract-review']
  },
  {
    id: 'DISP-002',
    title: 'Payment Delay - 45 Days Overdue',
    description: 'Payment for invoice INV-GP-456 is 45 days overdue. Invoice was approved and processed but payment has not been received.',
    category: 'payment-delay',
    priority: 'critical',
    status: 'escalated',
    submittedBy: {
      name: 'David Rodriguez',
      email: 'david.rodriguez@greenpack.com',
      company: 'GreenPack Solutions',
      role: 'Accounts Receivable'
    },
    assignedTo: {
      name: 'Lisa Wang',
      department: 'ap',
      email: 'lisa.wang@company.com'
    },
    relatedDocuments: [
      {
        type: 'invoice',
        number: 'INV-GP-456',
        amount: 28750,
        currency: 'USD'
      }
    ],
    messages: [
      {
        id: 'MSG-003',
        disputeId: 'DISP-002',
        sender: {
          name: 'David Rodriguez',
          email: 'david.rodriguez@greenpack.com',
          type: 'supplier'
        },
        message: 'Our records show that invoice INV-GP-456 for $28,750 is now 45 days past due. Can you please provide an update on the payment status?',
        isInternal: false,
        timestamp: new Date('2024-01-18T11:00:00'),
        status: 'read'
      }
    ],
    attachments: [],
    slaDetails: {
      targetResolution: new Date('2024-01-19T17:00:00'),
      escalationDate: new Date('2024-01-19T09:00:00'),
      isOverdue: true,
      hoursRemaining: -24
    },
    createdAt: new Date('2024-01-18T11:00:00'),
    updatedAt: new Date('2024-01-19T16:30:00'),
    tags: ['payment-overdue', 'escalated', 'accounts-payable']
  },
  {
    id: 'DISP-003',
    title: 'Quality Issue - Defective Products',
    description: 'Received shipment contains 15% defective electronic components. Requesting replacement or credit adjustment.',
    category: 'quality-issue',
    priority: 'high',
    status: 'pending-supplier',
    submittedBy: {
      name: 'Jennifer Lee',
      email: 'jennifer.lee@electrotech.com',
      company: 'ElectroTech Corp',
      role: 'Quality Manager'
    },
    assignedTo: {
      name: 'Robert Taylor',
      department: 'quality',
      email: 'robert.taylor@company.com'
    },
    relatedDocuments: [
      {
        type: 'po',
        number: 'PO-2024-087',
        amount: 45000,
        currency: 'USD'
      },
      {
        type: 'asn',
        number: 'ASN-ET-2024-012'
      }
    ],
    messages: [],
    attachments: [],
    resolution: {
      id: 'RES-003',
      type: 'partial-credit',
      description: 'Approved 15% credit adjustment for defective components. Supplier to implement improved QC process.',
      financialAdjustment: {
        amount: 6750,
        currency: 'USD',
        creditNoteNumber: 'CN-2024-045'
      },
      approvedBy: 'Robert Taylor',
      resolvedAt: new Date('2024-01-19T15:30:00'),
      followUpRequired: true,
      preventiveActions: ['Enhanced incoming inspection', 'Supplier QC audit scheduled']
    },
    slaDetails: {
      targetResolution: new Date('2024-01-21T17:00:00'),
      escalationDate: new Date('2024-01-20T17:00:00'),
      isOverdue: false,
      hoursRemaining: 42
    },
    createdAt: new Date('2024-01-17T13:45:00'),
    updatedAt: new Date('2024-01-19T15:30:00'),
    resolvedAt: new Date('2024-01-19T15:30:00'),
    tags: ['quality-control', 'defective-products', 'credit-adjustment']
  },
  {
    id: 'DISP-004',
    title: 'Missing PO Reference on Invoice INV-TM-789',
    description: 'Invoice INV-TM-789 for $8,250 does not contain the required PO reference number. Our AP system cannot process without proper PO linking.',
    category: 'invoice-discrepancy',
    priority: 'medium',
    status: 'pending-supplier',
    submittedBy: {
      name: 'Mark Anderson',
      email: 'mark.anderson@techmate.com',
      company: 'TechMate Solutions',
      role: 'AP Coordinator'
    },
    assignedTo: {
      name: 'Lisa Wang',
      department: 'ap',
      email: 'lisa.wang@company.com'
    },
    relatedDocuments: [
      {
        type: 'invoice',
        number: 'INV-TM-789',
        amount: 8250,
        currency: 'USD'
      },
      {
        type: 'po',
        number: 'PO-2024-067',
        amount: 8250,
        currency: 'USD'
      },
      {
        type: 'asn',
        number: 'ASN-TM-2024-023'
      }
    ],
    messages: [
      {
        id: 'MSG-004',
        disputeId: 'DISP-004',
        sender: {
          name: 'Mark Anderson',
          email: 'mark.anderson@techmate.com',
          type: 'supplier'
        },
        message: 'The invoice was generated from our system but the PO reference field appears to be blank. Can you please provide the correct PO number that should be referenced?',
        isInternal: false,
        timestamp: new Date('2024-01-21T08:15:00'),
        status: 'read'
      },
      {
        id: 'MSG-005',
        disputeId: 'DISP-004',
        sender: {
          name: 'Lisa Wang',
          email: 'lisa.wang@company.com',
          type: 'internal',
          department: 'AP'
        },
        message: 'The correct PO reference should be PO-2024-067. Please update your invoice to include this reference and resubmit.',
        isInternal: false,
        timestamp: new Date('2024-01-21T10:30:00'),
        status: 'sent'
      }
    ],
    attachments: [
      {
        id: 'ATT-003',
        name: 'Invoice_INV-TM-789.pdf',
        type: 'pdf',
        size: 189440,
        uploadedBy: 'Mark Anderson',
        uploadedAt: new Date('2024-01-21T08:15:00'),
        url: '#'
      },
      {
        id: 'ATT-004',
        name: 'PO_Reference_Screenshot.png',
        type: 'image',
        size: 76800,
        uploadedBy: 'Lisa Wang',
        uploadedAt: new Date('2024-01-21T10:30:00'),
        url: '#'
      }
    ],
    slaDetails: {
      targetResolution: new Date('2024-01-23T17:00:00'),
      escalationDate: new Date('2024-01-22T17:00:00'),
      isOverdue: false,
      hoursRemaining: 28
    },
    createdAt: new Date('2024-01-21T08:15:00'),
    updatedAt: new Date('2024-01-21T10:30:00'),
    tags: ['missing-po-reference', 'invoice-processing', 'document-linking']
  },
  {
    id: 'DISP-005',
    title: 'ASN Reference Missing - Delivery Verification Issue',
    description: 'Invoice INV-GP-456 references goods delivery but no ASN number is provided. Unable to verify delivery against our receiving records.',
    category: 'invoice-discrepancy',
    priority: 'high',
    status: 'assigned',
    submittedBy: {
      name: 'Carol Stevens',
      email: 'carol.stevens@globalparts.com',
      company: 'Global Parts Inc',
      role: 'Billing Specialist'
    },
    assignedTo: {
      name: 'Mike Chen',
      department: 'ap',
      email: 'mike.chen@company.com'
    },
    relatedDocuments: [
      {
        type: 'invoice',
        number: 'INV-GP-456',
        amount: 12800,
        currency: 'USD'
      },
      {
        type: 'po',
        number: 'PO-2024-089',
        amount: 12800,
        currency: 'USD'
      }
    ],
    messages: [
      {
        id: 'MSG-006',
        disputeId: 'DISP-005',
        sender: {
          name: 'Carol Stevens',
          email: 'carol.stevens@globalparts.com',
          type: 'supplier'
        },
        message: 'Our invoice INV-GP-456 shows delivery completed on Jan 18, but we realized the ASN reference is missing. The ASN number should be ASN-GP-2024-045. Can you please update your records?',
        isInternal: false,
        timestamp: new Date('2024-01-21T14:20:00'),
        status: 'read'
      }
    ],
    attachments: [
      {
        id: 'ATT-005',
        name: 'Delivery_Confirmation.pdf',
        type: 'pdf',
        size: 156220,
        uploadedBy: 'Carol Stevens',
        uploadedAt: new Date('2024-01-21T14:20:00'),
        url: '#'
      }
    ],
    slaDetails: {
      targetResolution: new Date('2024-01-23T14:20:00'),
      escalationDate: new Date('2024-01-22T14:20:00'),
      isOverdue: false,
      hoursRemaining: 22
    },
    createdAt: new Date('2024-01-21T14:20:00'),
    updatedAt: new Date('2024-01-21T14:20:00'),
    tags: ['missing-asn-reference', 'delivery-verification', 'receiving-records']
  }
];

const mockEscalationRules: EscalationRule[] = [
  {
    id: 'ESC-001',
    name: 'Critical Payment Issues',
    category: 'payment-delay',
    priority: 'critical',
    escalationHours: 4,
    escalateTo: 'Finance Director',
    notificationChannels: ['email', 'sms', 'teams'],
    isActive: true
  },
  {
    id: 'ESC-002',
    name: 'High Priority Invoice Disputes',
    category: 'invoice-discrepancy',
    priority: 'high',
    escalationHours: 24,
    escalateTo: 'AP Manager',
    notificationChannels: ['email', 'teams'],
    isActive: true
  },
  {
    id: 'ESC-003',
    name: 'Quality Issues',
    category: 'quality-issue',
    priority: 'high',
    escalationHours: 48,
    escalateTo: 'Quality Director',
    notificationChannels: ['email'],
    isActive: true
  }
];

const mockAnalytics: DisputeAnalytics = {
  totalDisputes: 156,
  openDisputes: 23,
  avgResolutionTime: 3.2,
  resolutionRate: 94.2,
  categoryBreakdown: {
    'invoice-discrepancy': 45,
    'payment-delay': 38,
    'delivery-issue': 32,
    'quality-issue': 24,
    'po-issue': 17
  },
  topSuppliers: [
    { name: 'Steel Components Inc', count: 8 },
    { name: 'GreenPack Solutions', count: 6 },
    { name: 'ElectroTech Corp', count: 5 }
  ],
  trendData: [
    { date: 'Jan 1', disputes: 12, resolved: 10 },
    { date: 'Jan 8', disputes: 15, resolved: 14 },
    { date: 'Jan 15', disputes: 9, resolved: 11 },
    { date: 'Jan 22', disputes: 18, resolved: 16 }
  ]
};

export function DisputeManagement() {
  const [activeTab, setActiveTab] = useState('disputes');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showCreateDispute, setShowCreateDispute] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [queryCategory, setQueryCategory] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [showDiscrepancyDetails, setShowDiscrepancyDetails] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [quickReply, setQuickReply] = useState('');
  const [replyingInDetail, setReplyingInDetail] = useState(false);
  const [disputeViewMode, setDisputeViewMode] = useState<'card' | 'list' | 'table'>('table');
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
      setSelectedRows(new Set(filteredDisputes.map((d) => d.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  // Reply handling functions
  const handleSendQuickReply = (disputeId: string) => {
    if (!quickReply.trim()) return;
    
    // In a real app, this would make an API call
    console.log(`Sending reply to dispute ${disputeId}:`, quickReply);
    
    // Reset state
    setQuickReply('');
    setReplyingTo(null);
    
    // Here you would typically update the dispute with the new message
    // For now, we'll just show a success state
  };

  const handleSendDetailedReply = () => {
    if (!newMessage.trim() || !selectedDispute) return;
    
    console.log(`Sending detailed reply to dispute ${selectedDispute.id}:`, newMessage);
    
    // Reset state
    setNewMessage('');
    setReplyingInDetail(false);
    
    // In a real app, this would update the messages array
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'assigned': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'investigating': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'pending-supplier': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'pending-internal': return 'text-cyan-600 bg-cyan-50 border-cyan-200';
      case 'resolved': return 'text-green-600 bg-green-50 border-green-200';
      case 'closed': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'escalated': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'invoice-discrepancy': return FileText;
      case 'payment-delay': return DollarSign;
      case 'delivery-issue': return Truck;
      case 'quality-issue': return AlertTriangle;
      case 'po-issue': return Package;
      default: return MessageSquare;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'invoice-discrepancy': return 'text-blue-600 bg-blue-50';
      case 'payment-delay': return 'text-red-600 bg-red-50';
      case 'delivery-issue': return 'text-purple-600 bg-purple-50';
      case 'quality-issue': return 'text-orange-600 bg-orange-50';
      case 'po-issue': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredDisputes = mockDisputes.filter(dispute => {
    const matchesSearch = dispute.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         dispute.submittedBy.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         dispute.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || dispute.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || dispute.category === filterCategory;
    const matchesPriority = filterPriority === 'all' || dispute.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
  });

  const overdueDisputes = mockDisputes.filter(d => d.slaDetails.isOverdue).length;
  const escalatedDisputes = mockDisputes.filter(d => d.status === 'escalated').length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-primary" />
            Dispute & Query Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive dispute resolution with automated workflows and SLA management
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
          <Dialog open={showCreateDispute} onOpenChange={setShowCreateDispute}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Submit Query
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Submit New Query/Dispute</DialogTitle>
                <DialogDescription>
                  Create a new dispute or query with automatic routing and SLA tracking
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div>
                  <Label>Title</Label>
                  <Input placeholder="Brief description of the issue" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select value={queryCategory} onValueChange={(value: string) => {
                      setQueryCategory(value);
                      setShowDiscrepancyDetails(value === 'invoice-discrepancy');
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="invoice-discrepancy">Invoice Discrepancy</SelectItem>
                        <SelectItem value="payment-delay">Payment Delay</SelectItem>
                        <SelectItem value="delivery-issue">Delivery Issue</SelectItem>
                        <SelectItem value="quality-issue">Quality Issue</SelectItem>
                        <SelectItem value="po-issue">PO Issue</SelectItem>
                        <SelectItem value="asn-issue">ASN Issue</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Document Linking Section */}
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Hash className="w-5 h-5 text-blue-600" />
                      Document Reference & Linking
                    </CardTitle>
                    <CardDescription>
                      Link your query to specific documents for faster resolution
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Document Type</Label>
                        <Select value={documentType} onValueChange={setDocumentType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select document type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="invoice">Invoice</SelectItem>
                            <SelectItem value="po">Purchase Order (PO)</SelectItem>
                            <SelectItem value="asn">Advanced Shipping Notice (ASN)</SelectItem>
                            <SelectItem value="contract">Contract</SelectItem>
                            <SelectItem value="delivery-note">Delivery Note</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Document Number</Label>
                        <div className="relative">
                          <Input 
                            placeholder="Enter document number"
                            value={documentNumber}
                            onChange={(e: { target: { value: string } }) => setDocumentNumber(e.target.value)}
                          />
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="absolute right-1 top-1 h-8 w-8 p-0"
                            disabled={!documentNumber}
                          >
                            <Search className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {documentNumber && (
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-800">Document Found</AlertTitle>
                        <AlertDescription className="text-green-700">
                          {documentType.toUpperCase()} #{documentNumber} - Status: Active | Amount: $15,500 | Date: Jan 20, 2024
                          <Button variant="link" className="p-0 ml-2 text-green-700">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View Details
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}

                    <div>
                      <Label>Additional Related Documents</Label>
                      <div className="flex gap-2">
                        <Input placeholder="Additional PO/Invoice/ASN numbers (comma separated)" />
                        <Button variant="outline" size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Invoice Discrepancy Details */}
                {showDiscrepancyDetails && (
                  <Card className="border-orange-200 bg-orange-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                        Invoice Discrepancy Details
                      </CardTitle>
                      <CardDescription>
                        Provide specific details about the invoice discrepancy
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Type of Discrepancy</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select discrepancy type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="amount-mismatch">Amount Mismatch</SelectItem>
                            <SelectItem value="missing-po-reference">Missing PO Reference</SelectItem>
                            <SelectItem value="missing-asn-reference">Missing ASN Reference</SelectItem>
                            <SelectItem value="incorrect-quantity">Incorrect Quantity</SelectItem>
                            <SelectItem value="wrong-pricing">Wrong Pricing</SelectItem>
                            <SelectItem value="unauthorized-charges">Unauthorized Additional Charges</SelectItem>
                            <SelectItem value="duplicate-invoice">Duplicate Invoice</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Invoice Amount</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                            <Input type="number" placeholder="15,500" className="pl-10" />
                          </div>
                        </div>
                        <div>
                          <Label>Expected/PO Amount</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                            <Input type="number" placeholder="15,000" className="pl-10" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Invoice Date</Label>
                          <Input type="date" />
                        </div>
                        <div>
                          <Label>Due Date</Label>
                          <Input type="date" />
                        </div>
                      </div>

                      <div>
                        <Label>Missing References</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="missing-po" />
                            <Label htmlFor="missing-po" className="font-normal">Missing PO Number on Invoice</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="missing-asn" />
                            <Label htmlFor="missing-asn" className="font-normal">Missing ASN Reference</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="missing-delivery" />
                            <Label htmlFor="missing-delivery" className="font-normal">Missing Delivery Note Reference</Label>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div>
                  <Label>Description</Label>
                  <Textarea 
                    placeholder="Detailed description of the issue. Please be as specific as possible to help us resolve your query quickly." 
                    rows={4} 
                  />
                </div>

                {/* Quick Templates */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Quick Templates</CardTitle>
                    <CardDescription>
                      Use these templates to speed up your query submission
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" className="justify-start">
                        <FileText className="w-4 h-4 mr-2" />
                        Invoice Amount Mismatch
                      </Button>
                      <Button variant="outline" size="sm" className="justify-start">
                        <Hash className="w-4 h-4 mr-2" />
                        Missing PO Reference
                      </Button>
                      <Button variant="outline" size="sm" className="justify-start">
                        <Truck className="w-4 h-4 mr-2" />
                        Missing ASN Reference
                      </Button>
                      <Button variant="outline" size="sm" className="justify-start">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Payment Delay Query
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div>
                  <Label>Attachments</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                    <p className="font-medium mb-1">Upload supporting documents</p>
                    <p className="text-sm text-muted-foreground mb-3">
                      Drag and drop files here or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supported formats: PDF, XLSX, DOC, PNG, JPG (Max 10MB each)
                    </p>
                    <Button variant="outline" size="sm" className="mt-3">
                      <Paperclip className="w-4 h-4 mr-2" />
                      Choose Files
                    </Button>
                  </div>
                </div>

                {/* Expected Resolution */}
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-900">Expected Resolution Timeline</p>
                        <p className="text-sm text-blue-700">
                          Based on your query category and priority, we aim to provide an initial response within 
                          <span className="font-medium"> 4-24 hours</span> and full resolution within 
                          <span className="font-medium"> 2-5 business days</span>.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => {
                    setShowCreateDispute(false);
                    setQueryCategory('');
                    setDocumentType('');
                    setDocumentNumber('');
                    setShowDiscrepancyDetails(false);
                  }}>
                    Cancel
                  </Button>
                  <Button variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button onClick={() => {
                    setShowCreateDispute(false);
                    setQueryCategory('');
                    setDocumentType('');
                    setDocumentNumber('');
                    setShowDiscrepancyDetails(false);
                  }}>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Query
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
                <p className="text-sm text-muted-foreground">Open Disputes</p>
                <p className="text-2xl font-bold">{mockAnalytics.openDisputes}</p>
                <p className="text-xs text-red-600">{overdueDisputes} overdue</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Resolution Time</p>
                <p className="text-2xl font-bold">{mockAnalytics.avgResolutionTime} days</p>
                <p className="text-xs text-green-600">-0.3 vs last month</p>
              </div>
              <Timer className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolution Rate</p>
                <p className="text-2xl font-bold">{mockAnalytics.resolutionRate}%</p>
                <p className="text-xs text-green-600">+2.1% vs last month</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Invoice Discrepancies</p>
                <p className="text-2xl font-bold">{mockDisputes.filter(d => d.category === 'invoice-discrepancy').length}</p>
                <p className="text-xs text-orange-600">
                  {mockDisputes.filter(d => d.category === 'invoice-discrepancy' && (d.tags.includes('amount-mismatch') || d.tags.includes('pricing-discrepancy'))).length} amount mismatches
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Discrepancy Alerts */}
      {mockDisputes.filter(d => d.category === 'invoice-discrepancy' && 
        (d.tags.includes('amount-mismatch') || d.tags.includes('pricing-discrepancy') || d.tags.includes('unauthorized-charges'))).length > 0 && (
        <Alert className="border-orange-200 bg-orange-50 mb-4">
          <DollarSign className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800">Invoice Amount Discrepancies Detected</AlertTitle>
          <AlertDescription className="text-orange-700">
            {mockDisputes.filter(d => d.category === 'invoice-discrepancy' && 
              (d.tags.includes('amount-mismatch') || d.tags.includes('pricing-discrepancy'))).length} invoice(s) have amount mismatches requiring review.
            <Button variant="link" className="p-0 ml-2 text-orange-700">
              Review Amount Discrepancies
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Missing Reference Alerts */}
      {mockDisputes.filter(d => d.category === 'invoice-discrepancy' && 
        (d.tags.includes('missing-po-reference') || d.tags.includes('missing-asn-reference'))).length > 0 && (
        <Alert className="border-purple-200 bg-purple-50 mb-4">
          <Hash className="h-4 w-4 text-purple-600" />
          <AlertTitle className="text-purple-800">Missing Document References</AlertTitle>
          <AlertDescription className="text-purple-700">
            {mockDisputes.filter(d => d.category === 'invoice-discrepancy' && 
              (d.tags.includes('missing-po-reference') || d.tags.includes('missing-asn-reference'))).length} invoice(s) are missing required PO or ASN references.
            <Button variant="link" className="p-0 ml-2 text-purple-700">
              View Missing References
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* SLA Alerts */}
      {overdueDisputes > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">SLA Breach Alert</AlertTitle>
          <AlertDescription className="text-red-700">
            {overdueDisputes} dispute(s) have exceeded their SLA targets and require immediate attention.
            <Button variant="link" className="p-0 ml-2 text-red-700">
              View Overdue Cases
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="disputes">Active Disputes</TabsTrigger>
          <TabsTrigger value="workflow">Workflow & Routing</TabsTrigger>
          <TabsTrigger value="communication">Communication Hub</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Reports</TabsTrigger>
          <TabsTrigger value="settings">SLA & Settings</TabsTrigger>
        </TabsList>

        {/* Active Disputes Tab */}
        <TabsContent value="disputes" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search disputes by title, company, or description..."
                      value={searchQuery}
                      onChange={(e: { target: { value: string } }) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="pending-supplier">Pending Supplier</SelectItem>
                    <SelectItem value="pending-internal">Pending Internal</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="escalated">Escalated</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="invoice-discrepancy">Invoice Discrepancy</SelectItem>
                    <SelectItem value="payment-delay">Payment Delay</SelectItem>
                    <SelectItem value="delivery-issue">Delivery Issue</SelectItem>
                    <SelectItem value="quality-issue">Quality Issue</SelectItem>
                    <SelectItem value="po-issue">PO Issue</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* View Toggle Buttons */}
          <div className="flex items-center border rounded-md w-fit">
            <Button
              variant={disputeViewMode === 'card' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDisputeViewMode('card')}
              className="rounded-r-none"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={disputeViewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDisputeViewMode('list')}
              className="rounded-none border-l border-r"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={disputeViewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDisputeViewMode('table')}
              className="rounded-l-none"
            >
              <TableIcon className="w-4 h-4" />
            </Button>
          </div>

          {/* Card View */}
          {disputeViewMode === 'card' && (
            <div className="space-y-4">
              {filteredDisputes.map((dispute) => {
              const CategoryIcon = getCategoryIcon(dispute.category);
              return (
                <Card key={dispute.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <CategoryIcon className="w-5 h-5 text-muted-foreground" />
                          <Badge className={getPriorityColor(dispute.priority)}>
                            {dispute.priority}
                          </Badge>
                          <Badge variant="outline" className={getStatusColor(dispute.status)}>
                            {dispute.status.replace('-', ' ')}
                          </Badge>
                          <Badge variant="outline" className={getCategoryColor(dispute.category)}>
                            {dispute.category.replace('-', ' ')}
                          </Badge>
                          {dispute.slaDetails.isOverdue && (
                            <Badge variant="outline" className="text-red-600 bg-red-50">
                              <Clock className="w-3 h-3 mr-1" />
                              Overdue
                            </Badge>
                          )}
                          
                          {/* Special indicators for invoice discrepancies */}
                          {dispute.category === 'invoice-discrepancy' && (
                            <>
                              {dispute.tags.includes('amount-mismatch') && (
                                <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200">
                                  <DollarSign className="w-3 h-3 mr-1" />
                                  Amount Mismatch
                                </Badge>
                              )}
                              {dispute.tags.includes('missing-po-reference') && (
                                <Badge variant="outline" className="text-purple-600 bg-purple-50 border-purple-200">
                                  <Hash className="w-3 h-3 mr-1" />
                                  Missing PO Ref
                                </Badge>
                              )}
                              {dispute.tags.includes('missing-asn-reference') && (
                                <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200">
                                  <Truck className="w-3 h-3 mr-1" />
                                  Missing ASN Ref
                                </Badge>
                              )}
                              {(dispute.tags.includes('unauthorized-charges') || dispute.tags.includes('pricing-discrepancy')) && (
                                <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Unauthorized Charges
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                        
                        <h3 className="font-semibold mb-2">{dispute.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {dispute.description}
                        </p>
                        
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Submitted By:</span>
                            <p className="font-medium">{dispute.submittedBy.name}</p>
                            <p className="text-xs text-muted-foreground">{dispute.submittedBy.company}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Assigned To:</span>
                            <p className="font-medium">{dispute.assignedTo?.name || 'Unassigned'}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {dispute.assignedTo?.department || ''}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">SLA Status:</span>
                            <p className={`font-medium ${dispute.slaDetails.isOverdue ? 'text-red-600' : 'text-green-600'}`}>
                              {dispute.slaDetails.isOverdue ? 
                                `${Math.abs(dispute.slaDetails.hoursRemaining)}h overdue` :
                                `${dispute.slaDetails.hoursRemaining}h remaining`
                              }
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Last Updated:</span>
                            <p className="font-medium">{format(dispute.updatedAt, 'MMM dd, HH:mm')}</p>
                          </div>
                        </div>
                        
                        {dispute.relatedDocuments.length > 0 && (
                          <div className="mt-4">
                            <span className="text-sm text-muted-foreground">Related Documents:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {dispute.relatedDocuments.map((doc, index) => {
                                // Check if this is an amount mismatch scenario
                                const isInvoiceDiscrepancy = dispute.category === 'invoice-discrepancy';
                                const hasAmountMismatch = dispute.tags.includes('amount-mismatch') || dispute.tags.includes('pricing-discrepancy');
                                const isInvoice = doc.type === 'invoice';
                                const isPO = doc.type === 'po';
                                
                                // Get PO amount for comparison
                                const poDoc = dispute.relatedDocuments.find(d => d.type === 'po');
                                const invoiceDoc = dispute.relatedDocuments.find(d => d.type === 'invoice');
                                const hasAmountConflict = isInvoiceDiscrepancy && hasAmountMismatch && 
                                  poDoc && invoiceDoc && poDoc.amount !== invoiceDoc.amount;
                                
                                let badgeColor = "text-xs";
                                if (hasAmountConflict && isInvoice) {
                                  badgeColor = "text-xs text-red-600 bg-red-50 border-red-200";
                                } else if (hasAmountConflict && isPO) {
                                  badgeColor = "text-xs text-green-600 bg-green-50 border-green-200";
                                }
                                
                                return (
                                  <Badge key={index} variant="outline" className={badgeColor}>
                                    {doc.type.toUpperCase()}: {doc.number}
                                    {doc.amount && (
                                      <span className={hasAmountConflict && (isInvoice || isPO) ? "font-bold" : ""}>
                                        {` (${doc.amount.toLocaleString()})`}
                                      </span>
                                    )}
                                    {hasAmountConflict && isInvoice && (
                                      <AlertTriangle className="w-3 h-3 ml-1 inline" />
                                    )}
                                    {hasAmountConflict && isPO && (
                                      <CheckCircle className="w-3 h-3 ml-1 inline" />
                                    )}
                                  </Badge>
                                );
                              })}
                            </div>
                            
                            {/* Amount Discrepancy Alert */}
                            {dispute.category === 'invoice-discrepancy' && 
                             (dispute.tags.includes('amount-mismatch') || dispute.tags.includes('pricing-discrepancy')) && (
                              <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                                <div className="flex items-center gap-2 text-sm">
                                  <DollarSign className="w-4 h-4 text-orange-600" />
                                  <span className="text-orange-800 font-medium">Amount Discrepancy Detected</span>
                                </div>
                                {(() => {
                                  const poDoc = dispute.relatedDocuments.find(d => d.type === 'po');
                                  const invoiceDoc = dispute.relatedDocuments.find(d => d.type === 'invoice');
                                  if (poDoc && invoiceDoc && poDoc.amount && invoiceDoc.amount) {
                                    const difference = invoiceDoc.amount - poDoc.amount;
                                    return (
                                      <p className="text-xs text-orange-700 mt-1">
                                        Invoice amount (${invoiceDoc.amount.toLocaleString()}) exceeds PO amount (${poDoc.amount.toLocaleString()}) by ${Math.abs(difference).toLocaleString()}
                                      </p>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            )}
                            
                            {/* Missing Reference Alert */}
                            {dispute.category === 'invoice-discrepancy' && 
                             (dispute.tags.includes('missing-po-reference') || dispute.tags.includes('missing-asn-reference')) && (
                              <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded-lg">
                                <div className="flex items-center gap-2 text-sm">
                                  <Hash className="w-4 h-4 text-purple-600" />
                                  <span className="text-purple-800 font-medium">Missing Document Reference</span>
                                </div>
                                <p className="text-xs text-purple-700 mt-1">
                                  {dispute.tags.includes('missing-po-reference') && 'PO reference number required for processing'}
                                  {dispute.tags.includes('missing-asn-reference') && 'ASN reference needed for delivery verification'}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedDispute(dispute)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-6xl">
                            <DialogHeader>
                              <DialogTitle>{selectedDispute?.title}</DialogTitle>
                              <DialogDescription>
                                Dispute #{selectedDispute?.id} - {selectedDispute?.submittedBy.company}
                              </DialogDescription>
                            </DialogHeader>
                            {selectedDispute && (
                              <div className="space-y-6">
                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <Label>Status</Label>
                                    <Badge className={getStatusColor(selectedDispute.status)}>
                                      {selectedDispute.status.replace('-', ' ')}
                                    </Badge>
                                  </div>
                                  <div>
                                    <Label>Priority</Label>
                                    <Badge className={getPriorityColor(selectedDispute.priority)}>
                                      {selectedDispute.priority}
                                    </Badge>
                                  </div>
                                  <div>
                                    <Label>Category</Label>
                                    <Badge className={getCategoryColor(selectedDispute.category)}>
                                      {selectedDispute.category.replace('-', ' ')}
                                    </Badge>
                                  </div>
                                </div>
                                
                                <div>
                                  <Label>Description</Label>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {selectedDispute.description}
                                  </p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Submitted By</Label>
                                    <div className="p-3 bg-muted rounded-lg">
                                      <p className="font-medium">{selectedDispute.submittedBy.name}</p>
                                      <p className="text-sm text-muted-foreground">{selectedDispute.submittedBy.role}</p>
                                      <p className="text-sm">{selectedDispute.submittedBy.company}</p>
                                      <p className="text-sm text-muted-foreground">{selectedDispute.submittedBy.email}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <Label>Assigned To</Label>
                                    <div className="p-3 bg-muted rounded-lg">
                                      <p className="font-medium">{selectedDispute.assignedTo?.name || 'Unassigned'}</p>
                                      <p className="text-sm text-muted-foreground capitalize">
                                        {selectedDispute.assignedTo?.department} Department
                                      </p>
                                      <p className="text-sm text-muted-foreground">{selectedDispute.assignedTo?.email}</p>
                                    </div>
                                  </div>
                                </div>
                                
                                {selectedDispute.attachments.length > 0 && (
                                  <div>
                                    <Label>Attachments ({selectedDispute.attachments.length})</Label>
                                    <div className="space-y-2 mt-2">
                                      {selectedDispute.attachments.map((attachment) => (
                                        <div key={attachment.id} className="flex items-center justify-between p-2 border rounded">
                                          <div className="flex items-center gap-2">
                                            <Paperclip className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-sm font-medium">{attachment.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                              ({formatFileSize(attachment.size)})
                                            </span>
                                          </div>
                                          <Button variant="ghost" size="sm">
                                            <Download className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                <div>
                                  <Label>Communication History ({selectedDispute.messages.length})</Label>
                                  <ScrollArea className="h-64 mt-2 border rounded-lg p-4">
                                    <div className="space-y-4">
                                      {selectedDispute.messages.map((message) => (
                                        <div key={message.id} className={`flex ${message.sender.type === 'internal' ? 'justify-end' : 'justify-start'}`}>
                                          <div className={`max-w-[70%] p-3 rounded-lg ${
                                            message.sender.type === 'internal' 
                                              ? 'bg-primary text-primary-foreground ml-auto' 
                                              : 'bg-muted'
                                          }`}>
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className="text-sm font-medium">{message.sender.name}</span>
                                              <span className="text-xs opacity-75">
                                                {format(message.timestamp, 'MMM dd, HH:mm')}
                                              </span>
                                            </div>
                                            <p className="text-sm">{message.message}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </ScrollArea>
                                </div>
                                
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <MessageCircle className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Send Response</span>
                                  </div>
                                  
                                  {/* Reply Templates for detailed view */}
                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setNewMessage("Thank you for submitting this dispute. We are currently reviewing the details and will get back to you within 24 hours.")}
                                    >
                                      <Zap className="w-3 h-3 mr-1" />
                                      Acknowledgment
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setNewMessage("We need additional documentation to process your dispute. Please provide the missing information at your earliest convenience.")}
                                    >
                                      <Info className="w-3 h-3 mr-1" />
                                      Request Info
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setNewMessage("Your dispute has been resolved. Please review the resolution details and confirm if you need any further assistance.")}
                                    >
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Resolved
                                    </Button>
                                  </div>
                                  
                                  <div className="flex gap-2">
                                    <Textarea
                                      placeholder="Type your detailed response..."
                                      value={newMessage}
                                      onChange={(e: { target: { value: string } }) => setNewMessage(e.target.value)}
                                      className="flex-1"
                                      rows={3}
                                    />
                                    <div className="flex flex-col gap-2">
                                      <Button 
                                        onClick={handleSendDetailedReply}
                                        disabled={!newMessage.trim()}
                                      >
                                        <Send className="w-4 h-4 mr-1" />
                                        Send
                                      </Button>
                                      <Button variant="outline" size="sm">
                                        <Paperclip className="w-4 h-4 mr-1" />
                                        Attach
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-3 h-3" />
                                      <span>Response will be sent immediately</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        Internal Response
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setReplyingTo(replyingTo === dispute.id ? null : dispute.id)}
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          {replyingTo === dispute.id ? 'Cancel' : 'Reply'}
                        </Button>
                        
                        {dispute.status !== 'resolved' && dispute.status !== 'closed' && (
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-1" />
                            Update
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Quick Reply Interface */}
                    {replyingTo === dispute.id && (
                      <div className="border-t bg-muted/30 p-4 space-y-3 mt-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MessageCircle className="w-4 h-4" />
                          <span>Quick Reply to {dispute.submittedBy.name}</span>
                        </div>
                        
                        {/* Quick Reply Templates */}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setQuickReply("Thank you for submitting this dispute. We are currently reviewing the details and will get back to you within 24 hours.")}
                          >
                            <Zap className="w-3 h-3 mr-1" />
                            Acknowledgment
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setQuickReply("We need additional documentation to process your dispute. Please provide the missing information at your earliest convenience.")}
                          >
                            <Info className="w-3 h-3 mr-1" />
                            Request Info
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setQuickReply("Your dispute has been escalated to our senior team for immediate review. You will receive an update within 4 hours.")}
                          >
                            <ArrowUp className="w-3 h-3 mr-1" />
                            Escalate
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setQuickReply("We have resolved your dispute. Please review the resolution details and confirm if you need any further assistance.")}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Resolved
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <Textarea
                            placeholder="Type your reply message..."
                            value={quickReply}
                            onChange={(e: { target: { value: string } }) => setQuickReply(e.target.value)}
                            rows={3}
                            className="resize-none"
                          />
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>Response will be logged with timestamp</span>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setReplyingTo(null);
                                  setQuickReply('');
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSendQuickReply(dispute.id)}
                                disabled={!quickReply.trim()}
                              >
                                <Send className="w-4 h-4 mr-1" />
                                Send Reply
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Recent Messages Preview */}
                        {dispute.messages.length > 0 && (
                          <div className="border-t pt-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <MessageSquare className="w-4 h-4" />
                              <span>Recent Messages ({dispute.messages.length})</span>
                            </div>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {dispute.messages.slice(-2).map((message) => (
                                <div key={message.id} className="text-xs p-2 bg-background rounded border">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium">{message.sender.name}</span>
                                    <span className="text-muted-foreground">
                                      {format(message.timestamp, 'MMM dd, HH:mm')}
                                    </span>
                                    <Badge variant="outline" className={`text-xs ${message.sender.type === 'internal' ? 'text-blue-600' : 'text-green-600'}`}>
                                      {message.sender.type}
                                    </Badge>
                                  </div>
                                  <p className="text-muted-foreground line-clamp-2">{message.message}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          )}

          {/* List View */}
          {disputeViewMode === 'list' && (
            <div className="space-y-3">
              {filteredDisputes.map((dispute) => {
                const CategoryIcon = getCategoryIcon(dispute.category);
                return (
                  <Card key={dispute.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CategoryIcon className="w-5 h-5 text-muted-foreground" />
                          <p className="font-semibold">{dispute.title}</p>
                          <Badge className={getPriorityColor(dispute.priority)}>
                            {dispute.priority}
                          </Badge>
                          <Badge variant="outline" className={getStatusColor(dispute.status)}>
                            {dispute.status.replace('-', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{dispute.submittedBy.company}</span>
                          <span>{dispute.category.replace('-', ' ')}</span>
                          <span>Submitted: {dispute.createdAt.toLocaleDateString()}</span>
                          <span>{dispute.messages.length} messages</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setSelectedDispute(dispute)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Table View */}
          {disputeViewMode === 'table' && (
            <Card>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={filteredDisputes.map((d) => d.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <Table>
                    <TableHeader>
                      <DraggableTableHeader
                        showDragHandle={true}
                        allSelected={selectedRows.size === filteredDisputes.length && filteredDisputes.length > 0}
                        onSelectAll={handleSelectAll}
                      >
                        <TableHead>Dispute Details</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted By</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </DraggableTableHeader>
                    </TableHeader>
                    <TableBody>
                      {filteredDisputes.map((dispute) => {
                        const CategoryIcon = getCategoryIcon(dispute.category);
                        return (
                          <DraggableTableRow
                            key={dispute.id}
                            id={dispute.id}
                            isSelected={selectedRows.has(dispute.id)}
                            onSelect={() => handleSelectRow(dispute.id)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <CategoryIcon className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">{dispute.title}</p>
                                  <p className="text-xs text-muted-foreground">{dispute.messages.length} messages</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getCategoryColor(dispute.category)}>
                                {dispute.category.replace('-', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getPriorityColor(dispute.priority)}>
                                {dispute.priority}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getStatusColor(dispute.status)}>
                                {dispute.status.replace('-', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{dispute.submittedBy.company}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{dispute.createdAt.toLocaleDateString()}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="ghost" onClick={() => setSelectedDispute(dispute)}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </DraggableTableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </SortableContext>
              </DndContext>
            </Card>
          )}
        </TabsContent>

        {/* Workflow & Routing Tab */}
        <TabsContent value="workflow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Automatic Routing Rules</CardTitle>
              <CardDescription>
                Configure how disputes are automatically assigned to appropriate teams
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Category-Based Routing</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Invoice Discrepancy</p>
                          <p className="text-sm text-muted-foreground">Auto-assign to AP Team</p>
                        </div>
                        <Badge variant="outline" className="text-green-600 bg-green-50">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Payment Delay</p>
                          <p className="text-sm text-muted-foreground">Auto-assign to AP Team</p>
                        </div>
                        <Badge variant="outline" className="text-green-600 bg-green-50">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Quality Issue</p>
                          <p className="text-sm text-muted-foreground">Auto-assign to Quality Team</p>
                        </div>
                        <Badge variant="outline" className="text-green-600 bg-green-50">Active</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Priority-Based Routing</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Critical Priority</p>
                          <p className="text-sm text-muted-foreground">Immediate escalation to managers</p>
                        </div>
                        <Badge variant="outline" className="text-green-600 bg-green-50">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">High Priority</p>
                          <p className="text-sm text-muted-foreground">Assign to senior team members</p>
                        </div>
                        <Badge variant="outline" className="text-green-600 bg-green-50">Active</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Escalation Rules</CardTitle>
              <CardDescription>
                SLA-based escalation policies for overdue disputes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Escalation Time</TableHead>
                    <TableHead>Escalate To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockEscalationRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {rule.category.replace('-', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(rule.priority)}>
                          {rule.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{rule.escalationHours} hours</TableCell>
                      <TableCell>{rule.escalateTo}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={rule.isActive ? 'text-green-600 bg-green-50' : 'text-gray-600 bg-gray-50'}>
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Switch checked={rule.isActive} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Communication Hub Tab */}
        <TabsContent value="communication" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Messages</CardTitle>
                <CardDescription>Latest communication across all active disputes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockDisputes.flatMap(d => d.messages).slice(0, 10).map((message) => (
                    <div key={message.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>{message.sender.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{message.sender.name}</span>
                          <Badge variant="outline" className={message.sender.type === 'internal' ? 'text-blue-600 bg-blue-50' : 'text-green-600 bg-green-50'}>
                            {message.sender.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(message.timestamp, 'MMM dd, HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{message.message}</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full justify-start gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Send Broadcast Message
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Bell className="w-4 h-4" />
                    Setup Notifications
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <FileText className="w-4 h-4" />
                    Message Templates
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Settings className="w-4 h-4" />
                    Communication Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics & Reports Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Dispute Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(mockAnalytics.categoryBreakdown).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="capitalize">{category.replace('-', ' ')}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${(count / Math.max(...Object.values(mockAnalytics.categoryBreakdown))) * 100}%` }}
                          ></div>
                        </div>
                        <span className="font-medium w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Suppliers by Disputes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockAnalytics.topSuppliers.map((supplier, index) => (
                    <div key={supplier.name} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="font-medium">{supplier.name}</span>
                      </div>
                      <Badge variant="outline">{supplier.count} disputes</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Key performance indicators for dispute management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <Timer className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">{mockAnalytics.avgResolutionTime}</p>
                  <p className="text-sm text-muted-foreground">Avg Resolution (days)</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold">{mockAnalytics.resolutionRate}%</p>
                  <p className="text-sm text-muted-foreground">Resolution Rate</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                  <p className="text-2xl font-bold">87%</p>
                  <p className="text-sm text-muted-foreground">Supplier Satisfaction</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Target className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                  <p className="text-2xl font-bold">92%</p>
                  <p className="text-sm text-muted-foreground">SLA Compliance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SLA & Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SLA Configuration</CardTitle>
              <CardDescription>
                Configure service level agreements for different dispute types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Default Resolution Time (hours)</Label>
                    <Input type="number" defaultValue="48" />
                  </div>
                  <div>
                    <Label>Escalation Threshold (% of SLA)</Label>
                    <Input type="number" defaultValue="80" />
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-3">Category-Specific SLAs</h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Invoice Discrepancy</Label>
                        <Input type="number" defaultValue="24" placeholder="Hours" />
                      </div>
                      <div>
                        <Label>Payment Delay</Label>
                        <Input type="number" defaultValue="8" placeholder="Hours" />
                      </div>
                      <div>
                        <Label>Quality Issue</Label>
                        <Input type="number" defaultValue="72" placeholder="Hours" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-3">Notification Settings</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Email notifications for new disputes</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>SMS alerts for critical disputes</Label>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Daily summary reports</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Auto-assign based on workload</Label>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}