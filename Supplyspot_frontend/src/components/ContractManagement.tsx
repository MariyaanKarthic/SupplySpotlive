import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { DatePicker } from './ui/date-picker';
import { 
  Search, 
  Plus, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  FileText,
  Calendar,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

const contracts = [
  {
    id: 1,
    title: 'Software Licensing Agreement',
    vendor: 'TechCorp Solutions',
    type: 'Service Agreement',
    status: 'Active',
    value: 125000,
    startDate: '2023-01-15',
    endDate: '2024-01-15',
    renewalDate: '2023-12-15',
    progress: 75,
    description: 'Annual software licensing and support agreement',
    keyTerms: ['24/7 Support', 'Unlimited Users', 'Cloud Hosting'],
    paymentTerms: 'Net 30',
    autoRenewal: true
  },
  {
    id: 2,
    title: 'Manufacturing Supply Contract',
    vendor: 'Global Supplies Ltd',
    type: 'Supply Agreement',
    status: 'Active',
    value: 89000,
    startDate: '2023-02-20',
    endDate: '2024-02-20',
    renewalDate: '2024-01-20',
    progress: 60,
    description: 'Raw materials supply contract for manufacturing',
    keyTerms: ['Quality Assurance', 'On-time Delivery', 'Bulk Pricing'],
    paymentTerms: 'Net 15',
    autoRenewal: false
  },
  {
    id: 3,
    title: 'Professional Services Agreement',
    vendor: 'Premium Services Inc',
    type: 'Service Agreement',
    status: 'Pending Approval',
    value: 45000,
    startDate: '2023-03-10',
    endDate: '2023-09-10',
    renewalDate: '2023-08-10',
    progress: 20,
    description: 'Consulting and professional services contract',
    keyTerms: ['Milestone-based', 'Intellectual Property', 'Confidentiality'],
    paymentTerms: 'Net 30',
    autoRenewal: false
  },
  {
    id: 4,
    title: 'Transportation Services',
    vendor: 'Quick Logistics',
    type: 'Service Agreement',
    status: 'Expired',
    value: 32000,
    startDate: '2022-06-01',
    endDate: '2023-06-01',
    renewalDate: '2023-05-01',
    progress: 100,
    description: 'Logistics and transportation services',
    keyTerms: ['Express Delivery', 'Insurance Coverage', 'Tracking'],
    paymentTerms: 'Net 30',
    autoRenewal: false
  },
  {
    id: 5,
    title: 'Digital Infrastructure Contract',
    vendor: 'Digital Systems Co',
    type: 'Technology Agreement',
    status: 'Active',
    value: 156000,
    startDate: '2023-01-28',
    endDate: '2025-01-28',
    renewalDate: '2024-12-28',
    progress: 45,
    description: 'Cloud infrastructure and digital services',
    keyTerms: ['99.9% Uptime', 'Data Backup', 'Security Compliance'],
    paymentTerms: 'Net 30',
    autoRenewal: true
  }
];

export function ContractManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddContractOpen, setIsAddContractOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [isViewContractOpen, setIsViewContractOpen] = useState(false);

  const filteredContracts = contracts.filter(contract =>
    contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'default';
      case 'Pending Approval': return 'secondary';
      case 'Expired': return 'destructive';
      case 'Draft': return 'outline';
      default: return 'outline';
    }
  };

  const getDaysUntilExpiry = (endDate: string) => {
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleViewContract = (contract: any) => {
    setSelectedContract(contract);
    setIsViewContractOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Contract Management</h1>
        </div>
        <Sheet open={isAddContractOpen} onOpenChange={setIsAddContractOpen}>
          <SheetTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Contract
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Create New Contract</SheetTitle>
              <SheetDescription>
                Create a new contract by filling out the details below.
              </SheetDescription>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="contract-title">Contract Title</Label>
                <Input id="contract-title" placeholder="Enter contract title" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contract-vendor">Vendor</Label>
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
                <Label htmlFor="contract-type">Contract Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service">Service Agreement</SelectItem>
                    <SelectItem value="supply">Supply Agreement</SelectItem>
                    <SelectItem value="technology">Technology Agreement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contract-value">Contract Value</Label>
                <Input id="contract-value" type="number" placeholder="Enter value" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contract-start">Start Date</Label>
                <DatePicker id="contract-start" placeholder="Select start date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contract-end">End Date</Label>
                <DatePicker id="contract-end" placeholder="Select end date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contract-renewal">Renewal Date</Label>
                <DatePicker id="contract-renewal" placeholder="Select renewal date" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="contract-description">Description</Label>
                <Textarea id="contract-description" placeholder="Contract description" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsAddContractOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsAddContractOpen(false)}>
                Create Contract
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Total Contracts</p>
              <p className="text-xl font-bold text-foreground mt-0.5">156</p>
              <p className="text-[11px] text-blue-600 font-medium">All agreements</p>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Active Contracts</p>
              <p className="text-xl font-bold text-foreground mt-0.5">123</p>
              <p className="text-[11px] text-emerald-600 font-medium">Currently active</p>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-lg">
              <FileText className="w-5 h-5 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Expiring Soon</p>
              <p className="text-xl font-bold text-foreground mt-0.5">8</p>
              <p className="text-[11px] text-amber-600 font-medium">Within 30 days</p>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Total Value</p>
              <p className="text-xl font-bold text-foreground mt-0.5">$2.4M</p>
              <p className="text-[11px] text-purple-600 font-medium">Active contract sum</p>
            </div>
            <div className="p-2.5 bg-purple-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-purple-600" />
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
              placeholder="Search contracts..."
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

      {/* Contracts Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-medium">Contract</th>
                <th className="text-left p-4 font-medium">Vendor</th>
                <th className="text-left p-4 font-medium">Type</th>
                <th className="text-left p-4 font-medium">Value</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Progress</th>
                <th className="text-left p-4 font-medium">Expiry</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.map((contract) => {
                const daysUntilExpiry = getDaysUntilExpiry(contract.endDate);
                return (
                  <tr key={contract.id} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{contract.title}</p>
                        <p className="text-sm text-muted-foreground">{contract.description}</p>
                      </div>
                    </td>
                    <td className="p-4">{contract.vendor}</td>
                    <td className="p-4">
                      <Badge variant="outline">{contract.type}</Badge>
                    </td>
                    <td className="p-4">${contract.value.toLocaleString()}</td>
                    <td className="p-4">
                      <Badge variant={getStatusColor(contract.status)}>
                        {contract.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <Progress value={contract.progress} className="w-20" />
                        <p className="text-xs text-muted-foreground">{contract.progress}%</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <p className="text-sm">{contract.endDate}</p>
                        <p className={`text-xs ${daysUntilExpiry < 30 ? 'text-red-500' : 'text-muted-foreground'}`}>
                          {daysUntilExpiry > 0 ? `${daysUntilExpiry} days left` : 'Expired'}
                        </p>
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
                          <DropdownMenuItem onClick={() => handleViewContract(contract)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Contract
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="w-4 h-4 mr-2" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Contract
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Contract Detail Sheet */}
      <Sheet open={isViewContractOpen} onOpenChange={setIsViewContractOpen}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Contract Details</SheetTitle>
            <SheetDescription>
              View detailed information about this contract.
            </SheetDescription>
          </SheetHeader>
          {selectedContract && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Contract Title</Label>
                  <p className="text-sm mt-1 font-medium">{selectedContract.title}</p>
                </div>
                <div>
                  <Label>Vendor</Label>
                  <p className="text-sm mt-1 font-medium">{selectedContract.vendor}</p>
                </div>
                <div>
                  <Label>Contract Type</Label>
                  <p className="text-sm mt-1">{selectedContract.type}</p>
                </div>
                <div>
                  <Label>Contract Value</Label>
                  <p className="text-sm mt-1 font-semibold">${selectedContract.value.toLocaleString()}</p>
                </div>
                <div>
                  <Label>Start Date</Label>
                  <p className="text-sm mt-1">{selectedContract.startDate}</p>
                </div>
                <div>
                  <Label>End Date</Label>
                  <p className="text-sm mt-1">{selectedContract.endDate}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">
                    <Badge variant={getStatusColor(selectedContract.status)}>
                      {selectedContract.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Auto Renewal</Label>
                  <p className="text-sm mt-1">{selectedContract.autoRenewal ? 'Yes' : 'No'}</p>
                </div>
              </div>
              
              <div>
                <Label>Description</Label>
                <p className="text-sm mt-1">{selectedContract.description}</p>
              </div>

              <div>
                <Label>Key Terms</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedContract.keyTerms.map((term: string, index: number) => (
                    <Badge key={index} variant="secondary">{term}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Payment Terms</Label>
                <p className="text-sm mt-1">{selectedContract.paymentTerms}</p>
              </div>

              <div>
                <Label>Progress</Label>
                <div className="mt-1">
                  <Progress value={selectedContract.progress} className="w-full" />
                  <p className="text-sm text-muted-foreground mt-1">{selectedContract.progress}% Complete</p>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}