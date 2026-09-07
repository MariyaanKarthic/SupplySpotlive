import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { vendorService } from '@/services/api';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
import { 
  Shield,
  CheckCircle,
  XCircle,
  Upload,
  Eye,
  Clock,
  Plus,
  UserCheck,
  FileCheck,
  Banknote as Bank,
  Scale,
  Zap,
  ChevronLeft,
  UserPlus,
  Copy,
  Check,
  ExternalLink,
  FileText,
  Search,
  Filter,
  Grid,
  List,
  Table,
  Building2,
  Mail,
  Phone,
  Calendar,
  User
} from 'lucide-react';

// Verification checklist
const verificationChecks = [
  { id: 'gstin', label: 'GSTIN Verification', status: 'completed', automated: true },
  { id: 'pan', label: 'PAN Verification', status: 'completed', automated: true },
  { id: 'bank', label: 'Bank Account Verification', status: 'pending', automated: true },
  { id: 'address', label: 'Address Verification', status: 'pending', automated: false },
  { id: 'references', label: 'Reference Verification', status: 'not_started', automated: false },
  { id: 'site_visit', label: 'Site Visit (if required)', status: 'not_started', automated: false }
];

interface VendorRegistrationProps {
  onNavigate?: (section: any) => void;
}

export function VendorRegistration({ onNavigate }: VendorRegistrationProps) {
  // Navigation & View states
  const [currentView, setCurrentView] = useState<'overview' | 'new-registration' | 'vendor-onboarding' | 'review-pending'>('overview');
  
  // Modal Popups
  const [isChooseVendorTypeOpen, setIsChooseVendorTypeOpen] = useState(false);
  const [vendorType, setVendorType] = useState<'company' | 'individual'>('company');
  const [isAdminInvitePreviewOpen, setIsAdminInvitePreviewOpen] = useState(false);
  const [isVendorWelcomeNoticeOpen, setIsVendorWelcomeNoticeOpen] = useState(false);
  const [registrationViewMode, setRegistrationViewMode] = useState<'card' | 'list' | 'table'>('table');
  
  // Admin basic entry form state
  const [adminBasicData, setAdminBasicData] = useState({
    companyCode: '1000',
    purchaseOrg: '1000',
    vendorName: '',
    vendorEmail: '',
    natureOfVendor: 'Manufacturer',
    businessPartnerCategory: 'Organization',
    contactPersonName: '',
    yearOfIncorporation: ''
  });

  // Copy link status
  const [copiedLink, setCopiedLink] = useState(false);
  const [sentInviteSuccess, setSentInviteSuccess] = useState(false);

  // Vendor multi-tab detailed registration state
  const [activeVendorTab, setActiveVendorTab] = useState('basic');
  const [vendorFormData, setVendorFormData] = useState({
    vendorName: '',
    vendorType: 'company',
    natureOfVendor: 'Manufacturer',
    businessPartnerCategory: 'Organization',
    companyCode: '1000',
    purchaseOrg: '1000',
    contactPersonName: '',
    vendorEmail: '',
    vendorPhone: '',
    yearOfIncorporation: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    addressProofType: 'Electricity Bill',
    panNumber: '',
    tanNumber: '',
    cinNumber: '',
    gstin: '',
    msmeRegNumber: '',
    iecCode: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
    ifscCode: '',
    eInvoicingEnabled: true,
    gstinForEInvoicing: '',
    portalUsername: '',
    primaryName: '',
    primaryEmail: '',
    primaryPhone: '',
    financeName: '',
    financeEmail: '',
    financePhone: '',
    sapVendorGroup: 'DOMESTIC',
    reconciliationAccount: '211000',
    termsOfPayment: 'NT30',
    currency: 'INR'
  });

  // Registrations list
  const [registrationsList, setRegistrationsList] = useState([
    {
      id: 1,
      companyName: 'TechnoVate Solutions Pvt Ltd',
      gstin: '29ABCDE1234F1Z5',
      contactPerson: 'Rajesh Kumar',
      email: 'rajesh@technovate.com',
      phone: '+91 9876543210',
      category: 'Technology',
      vendorType: 'company',
      registrationDate: '2023-09-10',
      status: 'Pending Verification',
      completionPercentage: 85,
      riskLevel: 'Low'
    },
    {
      id: 2,
      companyName: 'Global Manufacturing Co.',
      gstin: '27FGHIJ5678K2L9',
      contactPerson: 'Priya Sharma',
      email: 'priya@globalmanuf.com',
      phone: '+91 8765432109',
      category: 'Manufacturing',
      vendorType: 'company',
      registrationDate: '2023-09-12',
      status: 'Under Review',
      completionPercentage: 70,
      riskLevel: 'Medium'
    },
    {
      id: 3,
      companyName: 'Swift Logistics Services',
      gstin: '19MNOPQ9012R3S4',
      contactPerson: 'Amit Patel',
      email: 'amit@swiftlogistics.in',
      phone: '+91 7654321098',
      category: 'Transportation',
      vendorType: 'company',
      registrationDate: '2023-09-14',
      status: 'Approved',
      completionPercentage: 100,
      riskLevel: 'Low'
    }
  ]);

  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'default';
      case 'Pending Verification': return 'secondary';
      case 'Under Review': return 'outline';
      case 'Rejected': return 'destructive';
      default: return 'outline';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-green-600';
      case 'Medium': return 'text-yellow-600';
      case 'High': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getVerificationStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const handleReviewRegistration = (registration: any) => {
    setSelectedRegistration(registration);
    setIsReviewModalOpen(true);
  };

  const handleStartNewRegistration = () => setIsChooseVendorTypeOpen(true);

  const handleProceedToAdminEntry = () => {
    setIsChooseVendorTypeOpen(false);
    setCurrentView('new-registration');
  };

  const handleOpenInvitePreview = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdminInvitePreviewOpen(true);
  };

  const handleSendInvite = async () => {
    try {
      await vendorService.sendVendorInvite({
        email: adminBasicData.vendorEmail || 'abcsupplier@abc.com',
        vendorType,
        companyCode: adminBasicData.companyCode,
        purchaseOrg: adminBasicData.purchaseOrg,
        vendorName: adminBasicData.vendorName || 'New Partner',
        natureOfVendor: adminBasicData.natureOfVendor,
        businessPartnerCategory: adminBasicData.businessPartnerCategory,
        contactPersonName: adminBasicData.contactPersonName,
        yearOfIncorporation: adminBasicData.yearOfIncorporation
      });
    } catch (err) {
      console.log('Simulating email invite dispatch...');
    }

    setIsAdminInvitePreviewOpen(false);
    setSentInviteSuccess(true);
    
    setVendorFormData(prev => ({
      ...prev,
      vendorName: adminBasicData.vendorName,
      vendorEmail: adminBasicData.vendorEmail,
      contactPersonName: adminBasicData.contactPersonName,
      companyCode: adminBasicData.companyCode,
      purchaseOrg: adminBasicData.purchaseOrg,
      natureOfVendor: adminBasicData.natureOfVendor,
      businessPartnerCategory: adminBasicData.businessPartnerCategory,
      yearOfIncorporation: adminBasicData.yearOfIncorporation,
      vendorType: vendorType
    }));

    setIsVendorWelcomeNoticeOpen(true);
    setCurrentView('vendor-onboarding');
  };

  const handleVendorRegistrationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newReg = {
      id: registrationsList.length + 1,
      companyName: vendorFormData.vendorName || 'New Registered Vendor',
      gstin: vendorFormData.gstin || '29AAAAA0000A1Z5',
      contactPerson: vendorFormData.contactPersonName || 'Contact Person',
      email: vendorFormData.vendorEmail || 'vendor@example.com',
      phone: vendorFormData.vendorPhone || '+91 9999999999',
      category: vendorFormData.natureOfVendor,
      vendorType: vendorFormData.vendorType,
      registrationDate: new Date().toISOString().split('T')[0],
      status: 'Pending Verification',
      completionPercentage: 100,
      riskLevel: 'Low'
    };

    setRegistrationsList([newReg, ...registrationsList]);
    setCurrentView('overview');
    alert('Vendor Registration completed successfully! Your application is now pending admin approval.');
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {sentInviteSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="font-semibold text-sm">Vendor Invite Dispatched Successfully!</p>
              <p className="text-xs text-emerald-700">An invitation email with registration link was sent to {adminBasicData.vendorEmail || 'abcsupplier@abc.com'}.</p>
            </div>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className="border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-100 text-xs"
            onClick={() => {
              setIsVendorWelcomeNoticeOpen(true);
              setCurrentView('vendor-onboarding');
            }}
          >
            <ExternalLink className="w-3.5 h-3.5 mr-1" /> Open Vendor Registration Link
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Total Registrations</p>
              <p className="text-xl font-bold text-foreground mt-0.5">{registrationsList.length}</p>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-lg"><UserCheck className="w-5 h-5 text-blue-600" /></div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Approved</p>
              <p className="text-xl font-bold text-foreground mt-0.5">{registrationsList.filter(r => r.status === 'Approved').length}</p>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-lg"><CheckCircle className="w-5 h-5 text-emerald-600" /></div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Pending</p>
              <p className="text-xl font-bold text-foreground mt-0.5">{registrationsList.filter(r => r.status !== 'Approved').length}</p>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-lg"><Clock className="w-5 h-5 text-amber-600" /></div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Rejected</p>
              <p className="text-xl font-bold text-foreground mt-0.5">0</p>
            </div>
            <div className="p-2.5 bg-rose-50 rounded-lg"><XCircle className="w-5 h-5 text-rose-600" /></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg"><Shield className="w-6 h-6 text-purple-600" /></div>
            <div>
              <h3 className="font-semibold text-base">Clean & Verified Master</h3>
              <p className="text-xs text-muted-foreground">Ensures only genuine and compliant suppliers</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-emerald-100 rounded-lg"><FileCheck className="w-6 h-6 text-emerald-600" /></div>
            <div>
              <h3 className="font-semibold text-base">Compliance & Risk</h3>
              <p className="text-xs text-muted-foreground">Regulatory compliance and risk management</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg"><Zap className="w-6 h-6 text-blue-600" /></div>
            <div>
              <h3 className="font-semibold text-base">P2P Efficiency</h3>
              <p className="text-xs text-muted-foreground">Streamlined procure-to-pay cycle</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6 border-b flex items-center justify-between">
          <h3 className="font-bold text-lg">Vendor Registration Applications</h3>
          <Button variant="outline" size="sm" onClick={handleStartNewRegistration} className="gap-2">
            <Plus className="w-4 h-4" /> New Invite Registration
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-xs font-semibold text-muted-foreground">
                <th className="p-4">Company / Vendor</th>
                <th className="p-4">Vendor Type</th>
                <th className="p-4">Category</th>
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
                <th className="p-4">Progress</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {registrationsList.map((registration) => (
                <tr key={registration.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <p className="font-semibold text-gray-900">{registration.companyName}</p>
                    <p className="text-xs text-muted-foreground">GSTIN: {registration.gstin}</p>
                  </td>
                  <td className="p-4 capitalize"><Badge variant="secondary" className="capitalize text-xs font-medium">{registration.vendorType}</Badge></td>
                  <td className="p-4"><Badge variant="outline">{registration.category}</Badge></td>
                  <td className="p-4 text-xs">{registration.registrationDate}</td>
                  <td className="p-4"><Badge variant={getStatusColor(registration.status)}>{registration.status}</Badge></td>
                  <td className="p-4">
                    <div className="space-y-1 min-w-[120px]">
                      <div className="flex justify-between text-xs">
                        <span>{registration.completionPercentage}%</span>
                        <span className={getRiskColor(registration.riskLevel)}>{registration.riskLevel} Risk</span>
                      </div>
                      <Progress value={registration.completionPercentage} className="h-1.5" />
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <Button variant="outline" size="sm" onClick={() => handleReviewRegistration(registration)} className="gap-1 text-xs">
                      <Eye className="w-3.5 h-3.5" /> Review
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderNewRegistration = () => (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header with Back button */}
      <div className="flex items-center gap-3">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setCurrentView('overview')}
          className="rounded-full w-9 h-9 border-gray-300 bg-white hover:bg-gray-100"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </Button>
        <h2 className="text-xl font-bold text-gray-900">New Vendor Details</h2>
      </div>

      <Card className="p-6 border border-gray-200 shadow-sm rounded-xl space-y-6 bg-white">
        {/* Top title & note banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-5 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Vendor Details</h3>
              <div className="mt-1 bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                <span className="font-bold">Note : </span>
                Remaining onboarding documents need to be entered only by the vendor.
              </div>
            </div>
          </div>

          <Button variant="outline" className="bg-[#27272a] hover:bg-[#18181b] text-white border-none gap-2 font-medium text-xs px-4 py-2 shrink-0">
            <FileText className="w-4 h-4" />
            Save As Draft
          </Button>
        </div>

        {/* Inputs Grid matching Screenshot 2 */}
        <form onSubmit={handleOpenInvitePreview} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-700">Company Code <span className="text-red-500">*</span></Label>
              <Select value={adminBasicData.companyCode} onValueChange={(val) => setAdminBasicData({...adminBasicData, companyCode: val})}>
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue placeholder="Select Company Code" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1000">1000 - Digylax Technologies</SelectItem>
                  <SelectItem value="2000">2000 - SupplySpot Global</SelectItem>
                  <SelectItem value="3000">3000 - Apex Logistics</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-700">Purchase Organization <span className="text-red-500">*</span></Label>
              <Select value={adminBasicData.purchaseOrg} onValueChange={(val) => setAdminBasicData({...adminBasicData, purchaseOrg: val})}>
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue placeholder="Select Purchase Org" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1000">1000 - Central Sourcing</SelectItem>
                  <SelectItem value="2000">2000 - Regional Procurement</SelectItem>
                  <SelectItem value="3000">3000 - IT Services</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-700">Nature of Vendor <span className="text-red-500">*</span></Label>
              <Select value={adminBasicData.natureOfVendor} onValueChange={(val) => setAdminBasicData({...adminBasicData, natureOfVendor: val})}>
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue placeholder="Select Nature" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manufacturer">Manufacturer</SelectItem>
                  <SelectItem value="Distributor">Distributor</SelectItem>
                  <SelectItem value="Service Provider">Service Provider</SelectItem>
                  <SelectItem value="Trader">Trader</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-700">Vendor Name <span className="text-red-500">*</span></Label>
              <Input 
                required
                placeholder="Enter Vendor Name"
                value={adminBasicData.vendorName}
                onChange={(e) => setAdminBasicData({...adminBasicData, vendorName: e.target.value})}
                className="bg-white border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-700">Vendor Email <span className="text-red-500">*</span></Label>
              <Input 
                required
                type="email"
                placeholder="abcsupplier@abc.com"
                value={adminBasicData.vendorEmail}
                onChange={(e) => setAdminBasicData({...adminBasicData, vendorEmail: e.target.value})}
                className="bg-white border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-700">Business partner Category <span className="text-red-500">*</span></Label>
              <Select value={adminBasicData.businessPartnerCategory} onValueChange={(val) => setAdminBasicData({...adminBasicData, businessPartnerCategory: val})}>
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Organization">Organization</SelectItem>
                  <SelectItem value="Person">Person</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-700">Contact Person Name <span className="text-red-500">*</span></Label>
              <Input 
                required
                placeholder="Enter Contact Person"
                value={adminBasicData.contactPersonName}
                onChange={(e) => setAdminBasicData({...adminBasicData, contactPersonName: e.target.value})}
                className="bg-white border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-700">Year of Incorporation/ Business Since <span className="text-red-500">*</span></Label>
              <Input 
                required
                placeholder="YYYY (e.g. 2018)"
                value={adminBasicData.yearOfIncorporation}
                onChange={(e) => setAdminBasicData({...adminBasicData, yearOfIncorporation: e.target.value})}
                className="bg-white border-gray-300"
              />
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t">
            <Button 
              type="submit"
              className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-8 py-2.5 font-medium text-sm rounded-lg"
            >
              Invite
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );

  const renderPendingReview = () => (
    <div className="space-y-6">
      {/* Controls bar */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search registrations..." className="pl-10" />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <div className="flex items-center border rounded-md">
            <Button
              variant={registrationViewMode === 'card' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setRegistrationViewMode('card')}
              className="rounded-r-none"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={registrationViewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setRegistrationViewMode('list')}
              className="rounded-none border-l border-r"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={registrationViewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setRegistrationViewMode('table')}
              className="rounded-l-none"
            >
              <Table className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Pending Registrations Table */}
      {registrationViewMode === 'table' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/40 text-xs font-semibold text-muted-foreground">
                  <th className="text-left p-4 font-medium">Company Details</th>
                  <th className="text-left p-4 font-medium">Contact Person</th>
                  <th className="text-left p-4 font-medium">Category</th>
                  <th className="text-left p-4 font-medium">Registration Date</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {registrationsList.filter((r: any) => r.status !== 'Approved').map((registration: any) => (
                  <tr key={registration.id} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <div>
                        <p className="font-semibold text-sm">{registration.companyName}</p>
                        <p className="text-xs text-muted-foreground">GSTIN: {registration.gstin}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-xs">{registration.contactPerson}</p>
                        <p className="text-xs text-muted-foreground">{registration.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">{registration.category}</Badge>
                    </td>
                    <td className="p-4">
                      <span className="text-xs">{registration.registrationDate}</span>
                    </td>
                    <td className="p-4">
                      <Badge variant={getStatusColor(registration.status)}>
                        {registration.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Button size="sm" variant="outline" onClick={() => handleReviewRegistration(registration)} className="gap-1 text-xs">
                        <Eye className="w-3.5 h-3.5" /> Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {registrationViewMode === 'list' && (
        <div className="space-y-3">
          {registrationsList.filter((r: any) => r.status !== 'Approved').map((registration: any) => (
            <Card key={registration.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-semibold">{registration.companyName}</p>
                    <Badge variant={getStatusColor(registration.status)}>
                      {registration.status}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {registration.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      <span>{registration.contactPerson}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      <span>{registration.email}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{registration.registrationDate}</span>
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleReviewRegistration(registration)}>
                  Review
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {registrationViewMode === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {registrationsList.filter((r: any) => r.status !== 'Approved').map((registration: any) => (
            <Card key={registration.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{registration.companyName}</h3>
                      <p className="text-xs text-muted-foreground">GSTIN: {registration.gstin}</p>
                    </div>
                  </div>
                  <Badge variant={getStatusColor(registration.status)}>
                    {registration.status}
                  </Badge>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>Contact: {registration.contactPerson}</p>
                  <p>Email: {registration.email}</p>
                  <p>Date: {registration.registrationDate}</p>
                </div>
              </div>
              <div className="pt-4 border-t mt-4 flex justify-end">
                <Button size="sm" variant="outline" onClick={() => handleReviewRegistration(registration)}>
                  Review Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // Registration Review Sheet
  const renderReviewModal = () => (
    <Drawer open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen} direction="right">
      <DrawerContent className="sm:max-w-4xl overflow-y-auto">
        <DrawerHeader>
          <DrawerTitle>Registration Review - {selectedRegistration?.companyName}</DrawerTitle>
          <DrawerDescription>
            Complete review of vendor registration details and documentation
          </DrawerDescription>
        </DrawerHeader>
        
        {selectedRegistration && (
          <div className="space-y-6 mt-4">
            {/* Basic Information */}
            <Card className="p-4">
              <h4 className="font-semibold mb-3">Basic Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Registration Date</p>
                  <p className="font-medium">{selectedRegistration.registrationDate}</p>
                </div>
              </div>
            </Card>

            {/* Verification Status */}
            <Card className="p-4">
              <h3 className="mb-4">Verification Checklist</h3>
              <div className="space-y-3">
                {verificationChecks.map((check) => (
                  <div key={check.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      {getVerificationStatusIcon(check.status)}
                      <span className="text-sm">{check.label}</span>
                    </div>
                    <Badge variant={
                      check.status === 'completed' ? 'default' :
                      check.status === 'pending' ? 'secondary' : 'destructive'
                    }>
                      {check.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            {/* Documents */}
            <Card className="p-4">
              <h3 className="mb-4">Document Review</h3>
              <div className="space-y-3">
                {selectedRegistration.documents.map((doc: string, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{doc}</span>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </div>
                ))}
                
                {selectedRegistration.missingDocuments.map((doc: string, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded border-red-200 bg-red-50">
                    <div className="flex items-center gap-3">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-600">{doc}</span>
                      <Badge variant="destructive" className="text-xs">Missing</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Risk Assessment */}
            <Card className="p-4">
              <h3 className="mb-4">Risk Assessment</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 border rounded">
                  <p className="text-sm text-muted-foreground">Overall Risk</p>
                  <p className={`font-semibold ${getRiskColor(selectedRegistration.riskLevel)}`}>
                    {selectedRegistration.riskLevel}
                  </p>
                </div>
                <div className="text-center p-3 border rounded">
                  <p className="text-sm text-muted-foreground">Compliance Score</p>
                  <p className="font-semibold text-green-600">85%</p>
                </div>
                <div className="text-center p-3 border rounded">
                  <p className="text-sm text-muted-foreground">Verification Status</p>
                  <p className="font-semibold text-blue-600">In Progress</p>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline">
                Request Additional Info
              </Button>
              <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                Reject Registration
              </Button>
              <Button className="gap-2">
                <CheckCircle className="w-4 h-4" />
                Approve Registration
              </Button>
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );

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
              <BreadcrumbPage>Supplier Onboarding</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span
                onClick={() => currentView !== 'overview' && setCurrentView('overview')}
                className={currentView !== 'overview' ? 'cursor-pointer hover:text-foreground text-muted-foreground transition-colors' : 'text-foreground font-semibold'}
              >
                Vendor Registration
              </span>
            </BreadcrumbItem>
            {currentView !== 'overview' && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {currentView === 'new-registration' ? 'New Registration' : 'Review Pending'}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center justify-between w-full">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
            {currentView === 'overview' && 'Vendor Registration Management'}
            {currentView === 'new-registration' && 'New Vendor Registration'}
            {currentView === 'review-pending' && 'Pending Registrations Review'}
          </h1>
          <div className="flex gap-3">
            {currentView === 'overview' && (
              <>
                <Button variant="outline" onClick={() => setCurrentView('review-pending')} className="h-10 px-4">
                  Review Pending ({registrationsList.filter((r: any) => r.status !== 'Approved').length})
                </Button>
                <Button onClick={() => setCurrentView('new-registration')} className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2">
                  <Plus className="w-4 h-4 text-white" /> New Registration
                </Button>
              </>
            )}
            {currentView !== 'overview' && (
              <Button onClick={() => setCurrentView('overview')} variant="outline" className="h-10 px-4">
                Back to Overview
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6 mt-4">
        {currentView === 'overview' && renderOverview()}
        {currentView === 'new-registration' && renderNewRegistration()}
        {currentView === 'review-pending' && renderPendingReview()}
      </div>
      {renderReviewModal()}
    </div>
  );
}