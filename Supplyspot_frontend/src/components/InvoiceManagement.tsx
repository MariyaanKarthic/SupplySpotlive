import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Textarea } from './ui/textarea';
import { 
  Search, 
  Plus, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Upload,
  Scan,
  FileImage,
  Mail,
  Globe,
  Zap,
  AlertTriangle,
  Link,
  FileText,
  Camera,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  Settings,
  Bot,
  Target,
  Paperclip,
  Calendar,
  User,
  Building
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

const invoices = [
  {
    id: 1,
    invoiceNumber: 'INV-2023-001',
    vendor: 'TechCorp Solutions',
    amount: 12500,
    dueDate: '2023-12-15',
    issueDate: '2023-11-15',
    status: 'Paid',
    description: 'Software licensing Q4 2023',
    paymentDate: '2023-12-10',
    approvedBy: 'John Smith',
    category: 'Technology',
    taxAmount: 1250,
    netAmount: 11250,
    submissionMethod: 'E-Invoice',
    poNumber: 'PO-2023-045',
    grnNumber: 'GRN-2023-089',
    matchingStatus: 'Matched',
    ocrConfidence: 98,
    extractedData: true
  },
  {
    id: 2,
    invoiceNumber: 'INV-2023-002',
    vendor: 'Global Supplies Ltd',
    amount: 8900,
    dueDate: '2023-12-20',
    issueDate: '2023-11-20',
    status: 'Pending Approval',
    description: 'Raw materials November 2023',
    paymentDate: null,
    approvedBy: null,
    category: 'Materials',
    taxAmount: 890,
    netAmount: 8010,
    submissionMethod: 'OCR Scan',
    poNumber: 'PO-2023-052',
    grnNumber: 'GRN-2023-095',
    matchingStatus: 'Pending Review',
    ocrConfidence: 94,
    extractedData: true
  },
  {
    id: 3,
    invoiceNumber: 'INV-2023-003',
    vendor: 'Premium Services Inc',
    amount: 4500,
    dueDate: '2023-12-25',
    issueDate: '2023-11-25',
    status: 'Approved',
    description: 'Consulting services November 2023',
    paymentDate: null,
    approvedBy: 'Sarah Johnson',
    category: 'Services',
    taxAmount: 450,
    netAmount: 4050,
    submissionMethod: 'Portal Upload',
    poNumber: 'PO-2023-048',
    grnNumber: null,
    matchingStatus: 'PO Matched',
    ocrConfidence: 96,
    extractedData: true
  },
  {
    id: 4,
    invoiceNumber: 'INV-2023-004',
    vendor: 'Quick Logistics',
    amount: 3200,
    dueDate: '2023-11-30',
    issueDate: '2023-11-01',
    status: 'Overdue',
    description: 'Transportation services October 2023',
    paymentDate: null,
    approvedBy: 'Mike Wilson',
    category: 'Transportation',
    taxAmount: 320,
    netAmount: 2880,
    submissionMethod: 'Email',
    poNumber: 'PO-2023-041',
    grnNumber: 'GRN-2023-078',
    matchingStatus: 'Mismatched',
    ocrConfidence: 87,
    extractedData: true
  },
  {
    id: 5,
    invoiceNumber: 'INV-2023-005',
    vendor: 'Digital Systems Co',
    amount: 15600,
    dueDate: '2023-12-30',
    issueDate: '2023-11-30',
    status: 'OCR Processing',
    description: 'Cloud infrastructure November 2023',
    paymentDate: null,
    approvedBy: null,
    category: 'Technology',
    taxAmount: 1560,
    netAmount: 14040,
    submissionMethod: 'Paper Scan',
    poNumber: null,
    grnNumber: null,
    matchingStatus: 'Processing',
    ocrConfidence: 91,
    extractedData: false
  }
];

// Mock PO and GRN data for matching
const purchaseOrders = [
  { id: 'PO-2023-045', vendor: 'TechCorp Solutions', amount: 12500, items: ['Software License'] },
  { id: 'PO-2023-052', vendor: 'Global Supplies Ltd', amount: 8900, items: ['Raw Materials'] },
  { id: 'PO-2023-048', vendor: 'Premium Services Inc', amount: 4500, items: ['Consulting'] },
  { id: 'PO-2023-041', vendor: 'Quick Logistics', amount: 3500, items: ['Transportation'] },
  { id: 'PO-2023-055', vendor: 'Digital Systems Co', amount: 15600, items: ['Cloud Services'] }
];

const goodsReceipts = [
  { id: 'GRN-2023-089', poNumber: 'PO-2023-045', vendor: 'TechCorp Solutions', receivedDate: '2023-11-10' },
  { id: 'GRN-2023-095', poNumber: 'PO-2023-052', vendor: 'Global Supplies Ltd', receivedDate: '2023-11-18' },
  { id: 'GRN-2023-078', poNumber: 'PO-2023-041', vendor: 'Quick Logistics', receivedDate: '2023-10-28' }
];

// OCR Processing stages
const ocrStages = [
  { id: 'upload', title: 'Document Upload', completed: true },
  { id: 'scan', title: 'OCR Scanning', completed: true },
  { id: 'extract', title: 'Data Extraction', completed: true },
  { id: 'validate', title: 'Data Validation', completed: false },
  { id: 'match', title: 'PO/GRN Matching', completed: false }
];

// Vendor submission data
const vendorSubmissions = [
  {
    id: 1,
    vendor: 'TechCorp Solutions',
    submissionDate: '2023-09-15 14:30',
    invoiceNumber: 'TECH-2023-1247',
    amount: 8750,
    status: 'Processing',
    method: 'Portal Upload',
    attachments: ['invoice.pdf', 'receipt.jpg']
  },
  {
    id: 2,
    vendor: 'Global Supplies Ltd',
    submissionDate: '2023-09-14 09:15',
    invoiceNumber: 'GS-INV-9834',
    amount: 12300,
    status: 'Approved',
    method: 'Email',
    attachments: ['invoice_sept.pdf']
  },
  {
    id: 3,
    vendor: 'Premium Services Inc',
    submissionDate: '2023-09-13 16:45',
    invoiceNumber: 'PS-2023-456',
    amount: 5600,
    status: 'Rejected',
    method: 'E-Invoice',
    attachments: []
  }
];

export function InvoiceManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isViewInvoiceOpen, setIsViewInvoiceOpen] = useState(false);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [isVendorSubmissionOpen, setIsVendorSubmissionOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('all');

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'default';
      case 'Approved': return 'secondary';
      case 'Pending Approval': return 'outline';
      case 'Overdue': return 'destructive';
      case 'Rejected': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Approved': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'Pending Approval': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'Overdue': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'Rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleViewInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsViewInvoiceOpen(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      simulateOCRProcessing();
    }
  };

  const simulateOCRProcessing = () => {
    setOcrProgress(0);
    const interval = setInterval(() => {
      setOcrProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setExtractedData({
            invoiceNumber: 'INV-2023-' + Math.floor(Math.random() * 1000),
            vendor: 'Auto-detected Vendor',
            amount: (Math.random() * 10000 + 1000).toFixed(2),
            date: new Date().toISOString().split('T')[0],
            confidence: Math.floor(Math.random() * 20 + 80)
          });
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const getMatchingStatusColor = (status: string) => {
    switch (status) {
      case 'Matched': return 'default';
      case 'PO Matched': return 'secondary';
      case 'Pending Review': return 'outline';
      case 'Mismatched': return 'destructive';
      case 'Processing': return 'outline';
      default: return 'outline';
    }
  };

  const getSubmissionMethodIcon = (method: string) => {
    switch (method) {
      case 'OCR Scan': return <Scan className="w-4 h-4" />;
      case 'E-Invoice': return <Zap className="w-4 h-4" />;
      case 'Portal Upload': return <Upload className="w-4 h-4" />;
      case 'Email': return <Mail className="w-4 h-4" />;
      case 'Paper Scan': return <FileImage className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const totalPending = invoices.filter(inv => inv.status === 'Pending Approval').reduce((sum, inv) => sum + inv.amount, 0);
  const totalOverdue = invoices.filter(inv => inv.status === 'Overdue').reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.amount, 0);
  const totalOcrProcessing = invoices.filter(inv => inv.status === 'OCR Processing').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Invoice Management</h1>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => setIsVendorSubmissionOpen(true)}
          >
            <Globe className="w-4 h-4" />
            Vendor Portal
          </Button>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => setIsOcrModalOpen(true)}
          >
            <Scan className="w-4 h-4" />
            OCR Scan
          </Button>
          <Dialog open={isAddInvoiceOpen} onOpenChange={setIsAddInvoiceOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl w-[80vw]">
              <DialogHeader>
                <DialogTitle>Create New Invoice</DialogTitle>
                <DialogDescription>
                  Create a new invoice by entering the details below.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice-number">Invoice Number</Label>
                  <Input id="invoice-number" placeholder="INV-2023-XXX" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice-vendor">Vendor</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="techcorp">TechCorp Solutions</SelectItem>
                      <SelectItem value="global">Global Supplies Ltd</SelectItem>
                      <SelectItem value="premium">Premium Services Inc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice-amount">Amount</Label>
                  <Input id="invoice-amount" type="number" placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice-due">Due Date</Label>
                  <Input id="invoice-due" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice-issue">Issue Date</Label>
                  <Input id="invoice-issue" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice-category">Category</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="materials">Materials</SelectItem>
                      <SelectItem value="services">Services</SelectItem>
                      <SelectItem value="transportation">Transportation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="invoice-description">Description</Label>
                  <Input id="invoice-description" placeholder="Invoice description" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsAddInvoiceOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsAddInvoiceOpen(false)}>
                  Create Invoice
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Invoices</p>
              <p className="text-2xl font-semibold">{invoices.length}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">OCR Processing</p>
              <p className="text-2xl font-semibold">{totalOcrProcessing}</p>
            </div>
            <Bot className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Approval</p>
              <p className="text-2xl font-semibold">${totalPending.toLocaleString()}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Auto-Matched</p>
              <p className="text-2xl font-semibold">{invoices.filter(inv => inv.matchingStatus === 'Matched').length}</p>
            </div>
            <Target className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Paid This Month</p>
              <p className="text-2xl font-semibold">${totalPaid.toLocaleString()}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="all" className="gap-2">
            <FileText className="w-4 h-4" />
            All Invoices
          </TabsTrigger>
          <TabsTrigger value="ocr" className="gap-2">
            <Scan className="w-4 h-4" />
            OCR Processing
          </TabsTrigger>
          <TabsTrigger value="matching" className="gap-2">
            <Link className="w-4 h-4" />
            Auto Matching
          </TabsTrigger>
          <TabsTrigger value="vendor" className="gap-2">
            <Globe className="w-4 h-4" />
            Vendor Submissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {/* Search and Filters */}
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>
          </Card>

          {/* Enhanced Invoices Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Invoice Details</th>
                    <th className="text-left p-4 font-medium">Vendor</th>
                    <th className="text-left p-4 font-medium">Amount</th>
                    <th className="text-left p-4 font-medium">Submission</th>
                    <th className="text-left p-4 font-medium">Matching</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{invoice.invoiceNumber}</p>
                          <p className="text-sm text-muted-foreground">{invoice.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {invoice.issueDate}
                            </Badge>
                            {invoice.extractedData && (
                              <Badge variant="secondary" className="text-xs gap-1">
                                <Bot className="w-3 h-3" />
                                OCR {invoice.ocrConfidence}%
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{invoice.vendor}</p>
                          <p className="text-sm text-muted-foreground">{invoice.category}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-medium">${invoice.amount.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Net: ${invoice.netAmount.toLocaleString()}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getSubmissionMethodIcon(invoice.submissionMethod)}
                          <div>
                            <p className="text-sm font-medium">{invoice.submissionMethod}</p>
                            <p className="text-xs text-muted-foreground">Due: {invoice.dueDate}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <Badge variant={getMatchingStatusColor(invoice.matchingStatus)} className="text-xs">
                            {invoice.matchingStatus}
                          </Badge>
                          {invoice.poNumber && (
                            <p className="text-xs text-muted-foreground">PO: {invoice.poNumber}</p>
                          )}
                          {invoice.grnNumber && (
                            <p className="text-xs text-muted-foreground">GRN: {invoice.grnNumber}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(invoice.status)}
                          <Badge variant={getStatusColor(invoice.status)}>
                            {invoice.status}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewInvoice(invoice)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" />
                              Download PDF
                            </DropdownMenuItem>
                            {invoice.matchingStatus === 'Mismatched' && (
                              <DropdownMenuItem>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Re-match PO
                              </DropdownMenuItem>
                            )}
                            {invoice.status === 'Pending Approval' && (
                              <>
                                <DropdownMenuItem>
                                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <XCircle className="w-4 h-4 mr-2 text-red-500" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Invoice
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="ocr" className="space-y-6">
          <Card className="p-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <Scan className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h3>OCR Invoice Processing</h3>
                <p className="text-muted-foreground">
                  Upload paper invoices or scanned documents for automatic data extraction
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <Card className="p-4 border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 cursor-pointer">
                  <div className="text-center space-y-2">
                    <Camera className="w-8 h-8 mx-auto text-muted-foreground" />
                    <p className="text-sm font-medium">Scan Paper Invoice</p>
                    <p className="text-xs text-muted-foreground">Take photo or scan document</p>
                  </div>
                </Card>
                
                <Card className="p-4 border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 cursor-pointer">
                  <div className="text-center space-y-2">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                    <p className="text-sm font-medium">Upload Digital File</p>
                    <p className="text-xs text-muted-foreground">PDF, JPG, PNG supported</p>
                  </div>
                </Card>
                
                <Card className="p-4 border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 cursor-pointer">
                  <div className="text-center space-y-2">
                    <Mail className="w-8 h-8 mx-auto text-muted-foreground" />
                    <p className="text-sm font-medium">Email Processing</p>
                    <p className="text-xs text-muted-foreground">Forward to invoice@company.com</p>
                  </div>
                </Card>
              </div>

              <Button className="gap-2" onClick={() => setIsOcrModalOpen(true)}>
                <Plus className="w-4 h-4" />
                Start OCR Processing
              </Button>
            </div>
          </Card>

          {/* OCR Processing Queue */}
          <Card>
            <div className="p-4 border-b">
              <h3>Processing Queue</h3>
            </div>
            <div className="divide-y">
              {invoices.filter(inv => inv.status === 'OCR Processing').map((invoice) => (
                <div key={invoice.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <FileImage className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">{invoice.vendor}</p>
                      </div>
                    </div>
                    <Badge variant="outline">Processing</Badge>
                  </div>
                  <Progress value={75} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Extracting data...</span>
                    <span>75%</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="matching" className="space-y-6">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Target className="w-6 h-6 text-green-600" />
                <div>
                  <h3>Automatic PO/GRN Matching</h3>
                  <p className="text-muted-foreground">
                    AI-powered matching of invoices to purchase orders and goods receipts
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 bg-green-50">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <p className="font-medium">Auto-Matched</p>
                  </div>
                  <p className="text-2xl font-semibold text-green-600">
                    {invoices.filter(inv => inv.matchingStatus === 'Matched').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Perfect matches found</p>
                </Card>

                <Card className="p-4 bg-yellow-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <p className="font-medium">Pending Review</p>
                  </div>
                  <p className="text-2xl font-semibold text-yellow-600">
                    {invoices.filter(inv => inv.matchingStatus === 'Pending Review').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Manual review needed</p>
                </Card>

                <Card className="p-4 bg-red-50">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <p className="font-medium">Mismatched</p>
                  </div>
                  <p className="text-2xl font-semibold text-red-600">
                    {invoices.filter(inv => inv.matchingStatus === 'Mismatched').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Require attention</p>
                </Card>
              </div>
            </div>
          </Card>

          {/* Matching Results */}
          <Card>
            <div className="p-4 border-b">
              <h3>Matching Results</h3>
            </div>
            <div className="divide-y">
              {invoices.filter(inv => inv.matchingStatus !== 'Processing').map((invoice) => (
                <div key={invoice.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">{invoice.vendor}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <div className="space-y-1">
                        {invoice.poNumber && (
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-500" />
                            <span className="text-sm">PO: {invoice.poNumber}</span>
                          </div>
                        )}
                        {invoice.grnNumber && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm">GRN: {invoice.grnNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getMatchingStatusColor(invoice.matchingStatus)}>
                        {invoice.matchingStatus}
                      </Badge>
                      {invoice.matchingStatus === 'Mismatched' && (
                        <Button variant="outline" size="sm">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Re-match
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="vendor" className="space-y-6">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Globe className="w-6 h-6 text-blue-600" />
                <div>
                  <h3>Vendor Submission Portal</h3>
                  <p className="text-muted-foreground">
                    Track invoices submitted by vendors through the online portal
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Upload className="w-5 h-5 text-blue-600" />
                    <p className="font-medium">Portal Uploads</p>
                  </div>
                  <p className="text-2xl font-semibold">
                    {vendorSubmissions.filter(sub => sub.method === 'Portal Upload').length}
                  </p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-5 h-5 text-green-600" />
                    <p className="font-medium">Email Submissions</p>
                  </div>
                  <p className="text-2xl font-semibold">
                    {vendorSubmissions.filter(sub => sub.method === 'Email').length}
                  </p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-purple-600" />
                    <p className="font-medium">E-Invoices</p>
                  </div>
                  <p className="text-2xl font-semibold">
                    {vendorSubmissions.filter(sub => sub.method === 'E-Invoice').length}
                  </p>
                </Card>
              </div>
            </div>
          </Card>

          {/* Vendor Submissions */}
          <Card>
            <div className="p-4 border-b">
              <h3>Recent Vendor Submissions</h3>
            </div>
            <div className="divide-y">
              {vendorSubmissions.map((submission) => (
                <div key={submission.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Building className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{submission.vendor}</p>
                        <p className="text-sm text-muted-foreground">
                          {submission.invoiceNumber} • ${submission.amount.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {submission.submissionDate}
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {submission.method}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={getStatusColor(submission.status)}>
                        {submission.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Review
                      </Button>
                    </div>
                  </div>
                  {submission.attachments.length > 0 && (
                    <div className="flex items-center gap-2 mt-2 ml-12">
                      <Paperclip className="w-4 h-4 text-muted-foreground" />
                      <div className="flex gap-2">
                        {submission.attachments.map((file, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {file}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invoice Detail Modal */}
      <Dialog open={isViewInvoiceOpen} onOpenChange={setIsViewInvoiceOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              View detailed information about this invoice.
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Invoice Number</Label>
                  <p className="text-sm mt-1">{selectedInvoice.invoiceNumber}</p>
                </div>
                <div>
                  <Label>Vendor</Label>
                  <p className="text-sm mt-1">{selectedInvoice.vendor}</p>
                </div>
                <div>
                  <Label>Issue Date</Label>
                  <p className="text-sm mt-1">{selectedInvoice.issueDate}</p>
                </div>
                <div>
                  <Label>Due Date</Label>
                  <p className="text-sm mt-1">{selectedInvoice.dueDate}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">
                    <Badge variant={getStatusColor(selectedInvoice.status)}>
                      {selectedInvoice.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Category</Label>
                  <p className="text-sm mt-1">{selectedInvoice.category}</p>
                </div>
                <div>
                  <Label>Net Amount</Label>
                  <p className="text-sm mt-1">${selectedInvoice.netAmount.toLocaleString()}</p>
                </div>
                <div>
                  <Label>Tax Amount</Label>
                  <p className="text-sm mt-1">${selectedInvoice.taxAmount.toLocaleString()}</p>
                </div>
                <div>
                  <Label>Total Amount</Label>
                  <p className="text-lg font-semibold mt-1">${selectedInvoice.amount.toLocaleString()}</p>
                </div>
                {selectedInvoice.approvedBy && (
                  <div>
                    <Label>Approved By</Label>
                    <p className="text-sm mt-1">{selectedInvoice.approvedBy}</p>
                  </div>
                )}
                {selectedInvoice.paymentDate && (
                  <div>
                    <Label>Payment Date</Label>
                    <p className="text-sm mt-1">{selectedInvoice.paymentDate}</p>
                  </div>
                )}
              </div>
              
              <div>
                <Label>Description</Label>
                <p className="text-sm mt-1">{selectedInvoice.description}</p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
                {selectedInvoice.status === 'Pending Approval' && (
                  <>
                    <Button className="gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </Button>
                    <Button variant="destructive" className="gap-2">
                      <XCircle className="w-4 h-4" />
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* OCR Processing Modal */}
      <Dialog open={isOcrModalOpen} onOpenChange={setIsOcrModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scan className="w-5 h-5" />
              OCR Invoice Processing
            </DialogTitle>
            <DialogDescription>
              Upload or scan invoices for automatic data extraction and PO matching
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Upload Methods */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 cursor-pointer">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="text-center space-y-2">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                    <p className="font-medium">Upload File</p>
                    <p className="text-sm text-muted-foreground">PDF, JPG, PNG</p>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </Card>
              
              <Card className="p-4 border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 cursor-pointer">
                <div className="text-center space-y-2">
                  <Camera className="w-8 h-8 mx-auto text-muted-foreground" />
                  <p className="font-medium">Scan Document</p>
                  <p className="text-sm text-muted-foreground">Use camera</p>
                </div>
              </Card>
              
              <Card className="p-4 border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 cursor-pointer">
                <div className="text-center space-y-2">
                  <Mail className="w-8 h-8 mx-auto text-muted-foreground" />
                  <p className="font-medium">Email Forward</p>
                  <p className="text-sm text-muted-foreground">invoices@company.com</p>
                </div>
              </Card>
            </div>

            {/* Processing Status */}
            {selectedFile && (
              <Card className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <FileImage className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>OCR Processing</span>
                      <span>{ocrProgress}%</span>
                    </div>
                    <Progress value={ocrProgress} className="h-2" />
                  </div>

                  {/* Processing Steps */}
                  <div className="space-y-2">
                    {ocrStages.map((stage, index) => (
                      <div key={stage.id} className="flex items-center gap-3">
                        {index < 3 ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className={`text-sm ${index < 3 ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {stage.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Extracted Data Preview */}
            {extractedData && (
              <Card className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-purple-600" />
                    <h4>Extracted Data</h4>
                    <Badge variant="secondary">
                      {extractedData.confidence}% Confidence
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Invoice Number</Label>
                      <Input value={extractedData.invoiceNumber} />
                    </div>
                    <div>
                      <Label>Vendor</Label>
                      <Input value={extractedData.vendor} />
                    </div>
                    <div>
                      <Label>Amount</Label>
                      <Input value={extractedData.amount} />
                    </div>
                    <div>
                      <Label>Date</Label>
                      <Input value={extractedData.date} />
                    </div>
                  </div>

                  {/* Auto-matching Results */}
                  <div className="space-y-3">
                    <h5>PO Matching Results</h5>
                    <div className="space-y-2">
                      {purchaseOrders.slice(0, 2).map((po) => (
                        <div key={po.id} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded">
                              <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">{po.id}</p>
                              <p className="text-sm text-muted-foreground">
                                {po.vendor} • ${po.amount.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">85% Match</Badge>
                            <Button variant="outline" size="sm">
                              Select
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOcrModalOpen(false)}>
                Cancel
              </Button>
              {extractedData && (
                <Button>
                  Create Invoice
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Vendor Submission Portal Modal */}
      <Dialog open={isVendorSubmissionOpen} onOpenChange={setIsVendorSubmissionOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Vendor Submission Portal
            </DialogTitle>
            <DialogDescription>
              Manage vendor invoice submissions and portal access
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Portal Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Active Vendors</p>
                    <p className="text-xl font-semibold">24</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">This Month</p>
                    <p className="text-xl font-semibold">{vendorSubmissions.length}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Processing</p>
                    <p className="text-xl font-semibold">
                      {vendorSubmissions.filter(sub => sub.status === 'Processing').length}
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Auto-Approved</p>
                    <p className="text-xl font-semibold">89%</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Submission Methods */}
            <Card className="p-4">
              <h4 className="mb-4">Available Submission Methods</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 border rounded">
                  <Globe className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Web Portal</p>
                    <p className="text-sm text-muted-foreground">portal.company.com/invoices</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded">
                  <Mail className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">Email Submission</p>
                    <p className="text-sm text-muted-foreground">invoices@company.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded">
                  <Zap className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium">E-Invoice API</p>
                    <p className="text-sm text-muted-foreground">Direct integration</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Recent Submissions Table */}
            <Card>
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h4>Recent Submissions</h4>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Vendor</th>
                      <th className="text-left p-4 font-medium">Invoice</th>
                      <th className="text-left p-4 font-medium">Amount</th>
                      <th className="text-left p-4 font-medium">Method</th>
                      <th className="text-left p-4 font-medium">Submitted</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendorSubmissions.map((submission) => (
                      <tr key={submission.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{submission.vendor}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{submission.invoiceNumber}</p>
                            {submission.attachments.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {submission.attachments.length} attachment(s)
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="font-medium">${submission.amount.toLocaleString()}</p>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline">{submission.method}</Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm">{submission.submissionDate}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant={getStatusColor(submission.status)}>
                            {submission.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              Review
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Portal Configuration */}
            <Card className="p-4">
              <h4 className="mb-4">Portal Configuration</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto-approve matching invoices</p>
                    <p className="text-sm text-muted-foreground">
                      Automatically approve invoices that match PO within tolerance
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Notify vendors of submission status changes
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}