import React, { useState } from 'react';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from './ui/breadcrumb';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DatePicker } from './ui/date-picker';
import { 
  Search, 
  Plus, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

const payments = [
  {
    id: 1,
    paymentId: 'PAY-2023-001',
    vendor: 'TechCorp Solutions',
    invoiceNumber: 'INV-2023-001',
    amount: 12500,
    paymentDate: '2023-12-10',
    dueDate: '2023-12-15',
    status: 'Completed',
    method: 'Bank Transfer',
    reference: 'TXN-78945612',
    description: 'Software licensing Q4 2023',
    category: 'Technology',
    approvedBy: 'John Smith',
    processedBy: 'Finance Team'
  },
  {
    id: 2,
    paymentId: 'PAY-2023-002',
    vendor: 'Global Supplies Ltd',
    invoiceNumber: 'INV-2023-002',
    amount: 8900,
    paymentDate: null,
    dueDate: '2023-12-20',
    status: 'Pending',
    method: 'ACH Transfer',
    reference: null,
    description: 'Raw materials November 2023',
    category: 'Materials',
    approvedBy: 'Sarah Johnson',
    processedBy: null
  },
  {
    id: 3,
    paymentId: 'PAY-2023-003',
    vendor: 'Premium Services Inc',
    invoiceNumber: 'INV-2023-003',
    amount: 4500,
    paymentDate: '2023-12-12',
    dueDate: '2023-12-25',
    status: 'Completed',
    method: 'Credit Card',
    reference: 'CC-98765432',
    description: 'Consulting services November 2023',
    category: 'Services',
    approvedBy: 'Mike Wilson',
    processedBy: 'Finance Team'
  },
  {
    id: 4,
    paymentId: 'PAY-2023-004',
    vendor: 'Quick Logistics',
    invoiceNumber: 'INV-2023-004',
    amount: 3200,
    paymentDate: null,
    dueDate: '2023-11-30',
    status: 'Failed',
    method: 'Bank Transfer',
    reference: null,
    description: 'Transportation services October 2023',
    category: 'Transportation',
    approvedBy: 'Emily Davis',
    processedBy: null
  },
  {
    id: 5,
    paymentId: 'PAY-2023-005',
    vendor: 'Digital Systems Co',
    invoiceNumber: 'INV-2023-005',
    amount: 15600,
    paymentDate: null,
    dueDate: '2023-12-30',
    status: 'Scheduled',
    method: 'Bank Transfer',
    reference: null,
    description: 'Cloud infrastructure November 2023',
    category: 'Technology',
    approvedBy: 'John Smith',
    processedBy: null,
    scheduledDate: '2023-12-28'
  }
];

interface PaymentManagementProps {
  onNavigate?: (section: any) => void;
}

export function PaymentManagement({ onNavigate }: PaymentManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isViewPaymentOpen, setIsViewPaymentOpen] = useState(false);

  const filteredPayments = payments.filter(payment =>
    payment.paymentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'default';
      case 'Pending': return 'secondary';
      case 'Scheduled': return 'outline';
      case 'Failed': return 'destructive';
      case 'Cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'Scheduled': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'Failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'Cancelled': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'Credit Card': return <CreditCard className="w-4 h-4" />;
      case 'Bank Transfer': return <ArrowUpRight className="w-4 h-4" />;
      case 'ACH Transfer': return <ArrowDownLeft className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  const handleViewPayment = (payment: any) => {
    setSelectedPayment(payment);
    setIsViewPaymentOpen(true);
  };

  const totalCompleted = payments.filter(p => p.status === 'Completed').reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0);
  const totalScheduled = payments.filter(p => p.status === 'Scheduled').reduce((sum, p) => sum + p.amount, 0);
  const totalFailed = payments.filter(p => p.status === 'Failed').reduce((sum, p) => sum + p.amount, 0);

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
              <BreadcrumbPage>Finance & Payments</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Payments</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center justify-between w-full">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Payment Management</h1>
          
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Completed</p>
              <p className="text-xl font-bold text-foreground mt-0.5">${totalCompleted.toLocaleString()}</p>
              <p className="text-[11px] text-emerald-600 font-medium">Fully paid & settled</p>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Pending</p>
              <p className="text-xl font-bold text-foreground mt-0.5">${totalPending.toLocaleString()}</p>
              <p className="text-[11px] text-amber-600 font-medium">Awaiting processing</p>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Scheduled</p>
              <p className="text-xl font-bold text-foreground mt-0.5">${totalScheduled.toLocaleString()}</p>
              <p className="text-[11px] text-blue-600 font-medium">Queued disbursement</p>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Failed</p>
              <p className="text-xl font-bold text-foreground mt-0.5">${totalFailed.toLocaleString()}</p>
              <p className="text-[11px] text-rose-600 font-medium">Requires investigation</p>
            </div>
            <div className="p-2.5 bg-rose-50 rounded-lg">
              <XCircle className="w-5 h-5 text-rose-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search payments..."
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

      {/* Payments Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-medium">Payment ID</th>
                <th className="text-left p-4 font-medium">Vendor</th>
                <th className="text-left p-4 font-medium">Invoice</th>
                <th className="text-left p-4 font-medium">Amount</th>
                <th className="text-left p-4 font-medium">Method</th>
                <th className="text-left p-4 font-medium">Date</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="border-b hover:bg-muted/50">
                  <td className="p-4">
                    <div>
                      <p className="font-medium">{payment.paymentId}</p>
                      <p className="text-sm text-muted-foreground">{payment.description}</p>
                    </div>
                  </td>
                  <td className="p-4">{payment.vendor}</td>
                  <td className="p-4">
                    <p className="font-medium">{payment.invoiceNumber}</p>
                    <p className="text-sm text-muted-foreground">Due: {payment.dueDate}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-medium">${payment.amount.toLocaleString()}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {getPaymentMethodIcon(payment.method)}
                      <span className="text-sm">{payment.method}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div>
                      {payment.paymentDate ? (
                        <p>{payment.paymentDate}</p>
                      ) : payment.status === 'Scheduled' && payment.scheduledDate ? (
                        <p className="text-blue-600">Scheduled: {payment.scheduledDate}</p>
                      ) : (
                        <p className="text-muted-foreground">-</p>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(payment.status)}
                      <Badge variant={getStatusColor(payment.status)}>
                        {payment.status}
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
                        <DropdownMenuItem onClick={() => handleViewPayment(payment)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {(payment.status === 'Pending' || payment.status === 'Scheduled') && (
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Payment
                          </DropdownMenuItem>
                        )}
                        {payment.status === 'Failed' && (
                          <DropdownMenuItem>
                            <ArrowUpRight className="w-4 h-4 mr-2" />
                            Retry Payment
                          </DropdownMenuItem>
                        )}
                        {(payment.status === 'Pending' || payment.status === 'Scheduled') && (
                          <DropdownMenuItem className="text-destructive">
                            <XCircle className="w-4 h-4 mr-2" />
                            Cancel Payment
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Payment Detail Sheet */}
      <Sheet open={isViewPaymentOpen} onOpenChange={setIsViewPaymentOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Payment Details</SheetTitle>
            <SheetDescription>
              View detailed information about this payment.
            </SheetDescription>
          </SheetHeader>
          {selectedPayment && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Payment ID</Label>
                  <p className="text-sm font-semibold mt-1">{selectedPayment.paymentId}</p>
                </div>
                <div>
                  <Label>Vendor</Label>
                  <p className="text-sm font-medium mt-1">{selectedPayment.vendor}</p>
                </div>
                <div>
                  <Label>Invoice Number</Label>
                  <p className="text-sm mt-1">{selectedPayment.invoiceNumber}</p>
                </div>
                <div>
                  <Label>Amount</Label>
                  <p className="text-lg font-semibold mt-1">${selectedPayment.amount.toLocaleString()}</p>
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getPaymentMethodIcon(selectedPayment.method)}
                    <span className="text-sm">{selectedPayment.method}</span>
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">
                    <Badge variant={getStatusColor(selectedPayment.status)}>
                      {selectedPayment.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Due Date</Label>
                  <p className="text-sm mt-1">{selectedPayment.dueDate}</p>
                </div>
                {selectedPayment.paymentDate && (
                  <div>
                    <Label>Payment Date</Label>
                    <p className="text-sm mt-1">{selectedPayment.paymentDate}</p>
                  </div>
                )}
                {selectedPayment.scheduledDate && (
                  <div>
                    <Label>Scheduled Date</Label>
                    <p className="text-sm mt-1">{selectedPayment.scheduledDate}</p>
                  </div>
                )}
                {selectedPayment.reference && (
                  <div>
                    <Label>Reference Number</Label>
                    <p className="text-sm mt-1">{selectedPayment.reference}</p>
                  </div>
                )}
                <div>
                  <Label>Category</Label>
                  <p className="text-sm mt-1">{selectedPayment.category}</p>
                </div>
                <div>
                  <Label>Approved By</Label>
                  <p className="text-sm mt-1">{selectedPayment.approvedBy}</p>
                </div>
                {selectedPayment.processedBy && (
                  <div>
                    <Label>Processed By</Label>
                    <p className="text-sm mt-1">{selectedPayment.processedBy}</p>
                  </div>
                )}
              </div>
              
              <div>
                <Label>Description</Label>
                <p className="text-sm mt-1">{selectedPayment.description}</p>
              </div>

              <div className="flex gap-2 pt-4">
                {selectedPayment.status === 'Pending' && (
                  <Button className="gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Process Payment
                  </Button>
                )}
                {selectedPayment.status === 'Failed' && (
                  <Button className="gap-2">
                    <ArrowUpRight className="w-4 h-4" />
                    Retry Payment
                  </Button>
                )}
                {(selectedPayment.status === 'Pending' || selectedPayment.status === 'Scheduled') && (
                  <Button variant="destructive" className="gap-2">
                    <XCircle className="w-4 h-4" />
                    Cancel Payment
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}