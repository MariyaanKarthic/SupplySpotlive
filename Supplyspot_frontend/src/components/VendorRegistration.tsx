import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Checkbox } from './ui/checkbox';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { vendorService } from '../services/api';
import { Logo } from './Logo';
import { 
  Building2,
  FileText,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Upload,
  Download,
  Eye,
  Phone,
  Mail,
  MapPin,
  Globe,
  Calendar,
  CreditCard,
  Truck,
  Factory,
  Award,
  Users,
  DollarSign,
  Clock,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Send,
  UserCheck,
  Grid,
  List,
  Table,
  FileCheck,
  Banknote as Bank,
  Scale,
  Zap,
  Settings,
  Star,
  TrendingUp,
  BarChart3,
  User
} from 'lucide-react';

// Registration steps configuration
const registrationSteps = [
  { id: 'basic', title: 'Basic Information', icon: Building2, completed: false },
  { id: 'legal', title: 'Legal & Compliance', icon: Scale, completed: false },
  { id: 'financial', title: 'Financial Details', icon: Bank, completed: false },
  { id: 'capabilities', title: 'Capabilities & Services', icon: Factory, completed: false },
  { id: 'documents', title: 'Document Upload', icon: FileText, completed: false },
  { id: 'verification', title: 'Verification', icon: Shield, completed: false }
];

// Mock data for pending registrations
const pendingRegistrations = [
  {
    id: 1,
    companyName: 'TechnoVate Solutions Pvt Ltd',
    gstin: '29ABCDE1234F1Z5',
    contactPerson: 'Rajesh Kumar',
    email: 'rajesh@technovate.com',
    phone: '+91 9876543210',
    category: 'Technology',
    registrationDate: '2023-09-10',
    status: 'Pending Verification',
    completionPercentage: 85,
    riskLevel: 'Low',
    documents: ['GST Certificate', 'PAN Card', 'Bank Statement'],
    missingDocuments: ['ISO Certificate']
  },
  {
    id: 2,
    companyName: 'Global Manufacturing Co.',
    gstin: '27FGHIJ5678K2L9',
    contactPerson: 'Priya Sharma',
    email: 'priya@globalmanuf.com',
    phone: '+91 8765432109',
    category: 'Manufacturing',
    registrationDate: '2023-09-12',
    status: 'Under Review',
    completionPercentage: 70,
    riskLevel: 'Medium',
    documents: ['GST Certificate', 'Factory License'],
    missingDocuments: ['PAN Card', 'Pollution Clearance', 'Labor License']
  },
  {
    id: 3,
    companyName: 'Swift Logistics Services',
    gstin: '19MNOPQ9012R3S4',
    contactPerson: 'Amit Patel',
    email: 'amit@swiftlogistics.in',
    phone: '+91 7654321098',
    category: 'Transportation',
    registrationDate: '2023-09-14',
    status: 'Approved',
    completionPercentage: 100,
    riskLevel: 'Low',
    documents: ['GST Certificate', 'PAN Card', 'Transport License', 'Insurance Certificate'],
    missingDocuments: []
  }
];

// Verification checklist
const verificationChecks = [
  { id: 'gstin', label: 'GSTIN Verification', status: 'completed', automated: true },
  { id: 'pan', label: 'PAN Verification', status: 'completed', automated: true },
  { id: 'bank', label: 'Bank Account Verification', status: 'pending', automated: true },
  { id: 'address', label: 'Address Verification', status: 'pending', automated: false },
  { id: 'references', label: 'Reference Verification', status: 'not_started', automated: false },
  { id: 'site_visit', label: 'Site Visit (if required)', status: 'not_started', automated: false }
];

// Document requirements by category
const documentRequirements = {
  'Technology': [
    'GST Registration Certificate',
    'PAN Card',
    'Bank Account Details',
    'Incorporation Certificate',
    'ISO 27001 Certificate (if applicable)',
    'STPI Registration (if applicable)'
  ],
  'Manufacturing': [
    'GST Registration Certificate',
    'PAN Card',
    'Bank Account Details',
    'Factory License',
    'Pollution Clearance Certificate',
    'Labor License',
    'ISO 9001 Certificate',
    'Safety Compliance Certificate'
  ],
  'Transportation': [
    'GST Registration Certificate',
    'PAN Card',
    'Bank Account Details',
    'Transport License',
    'Vehicle Registration Documents',
    'Insurance Certificate',
    'Driver License Details'
  ],
  'Services': [
    'GST Registration Certificate',
    'PAN Card',
    'Bank Account Details',
    'Professional Tax Registration',
    'Service Tax Registration (if applicable)',
    'Professional Certifications'
  ]
};

export function VendorRegistration() {
  const [currentView, setCurrentView] = useState<'overview' | 'new-registration' | 'review-pending'>('overview');
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [registrationViewMode, setRegistrationViewMode] = useState<'card' | 'list' | 'table'>('table');
  const [registrationData, setRegistrationData] = useState({
    basic: {
      companyName: '',
      category: 'technology',
      contactPerson: '',
      email: '',
      phone: ''
    },
    legal: {},
    financial: {},
    capabilities: {},
    documents: {},
    verification: {}
  });

  const handleBasicChange = (field: string, value: string) => {
    setRegistrationData(prev => ({
      ...prev,
      basic: { ...prev.basic, [field]: value }
    }));
  };

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
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const handleReviewRegistration = (registration: any) => {
    setSelectedRegistration(registration);
    setIsReviewModalOpen(true);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vendor Registration Management</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setCurrentView('review-pending')}>
            Review Pending ({pendingRegistrations.filter(r => r.status !== 'Approved').length})
          </Button>
          <Button onClick={() => setCurrentView('new-registration')} className="gap-2">
            <Plus className="w-4 h-4" />
            New Registration
          </Button>
        </div>
      </div>

      {/* Registration Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Registrations</p>
              <p className="text-2xl font-semibold">156</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-2xl font-semibold">142</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-semibold">12</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rejected</p>
              <p className="text-2xl font-semibold">2</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Key Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3>Clean & Verified Master</h3>
              <p className="text-sm text-muted-foreground">Ensures only genuine and compliant suppliers</p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Automated GSTIN & PAN verification</li>
            <li>• Duplicate vendor code prevention</li>
            <li>• Bank detail verification</li>
            <li>• Capability assessment</li>
          </ul>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3>Compliance & Risk</h3>
              <p className="text-sm text-muted-foreground">Regulatory compliance and risk management</p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• GST/TDS/VAT compliance</li>
            <li>• Document expiry tracking</li>
            <li>• Audit trail maintenance</li>
            <li>• ESG requirements</li>
          </ul>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3>P2P Efficiency</h3>
              <p className="text-sm text-muted-foreground">Streamlined procure-to-pay cycle</p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Direct RFQ participation</li>
            <li>• Digital invoice submission</li>
            <li>• Payment status tracking</li>
            <li>• Faster sourcing process</li>
          </ul>
        </Card>
      </div>

      {/* Recent Registrations */}
      <Card>
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3>Recent Registrations</h3>
            <Button variant="outline" size="sm">View All</Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-medium">Company</th>
                <th className="text-left p-4 font-medium">Category</th>
                <th className="text-left p-4 font-medium">Registration Date</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Progress</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingRegistrations.slice(0, 5).map((registration) => (
                <tr key={registration.id} className="border-b hover:bg-muted/50">
                  <td className="p-4">
                    <div>
                      <p className="font-medium">{registration.companyName}</p>
                      <p className="text-sm text-muted-foreground">GSTIN: {registration.gstin}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant="outline">{registration.category}</Badge>
                  </td>
                  <td className="p-4">{registration.registrationDate}</td>
                  <td className="p-4">
                    <Badge variant={getStatusColor(registration.status)}>
                      {registration.status}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{registration.completionPercentage}%</span>
                        <span className={getRiskColor(registration.riskLevel)}>
                          {registration.riskLevel} Risk
                        </span>
                      </div>
                      <Progress value={registration.completionPercentage} className="h-2" />
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleReviewRegistration(registration)}
                      >
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
    </div>
  );

  const renderNewRegistration = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => setCurrentView('overview')}>
          ← Back
        </Button>
        <div>
          <h1>New Vendor Registration</h1>
        </div>
      </div>

      {/* Progress Steps */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          {registrationSteps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center gap-2 ${index <= currentStep ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`p-2 rounded-lg ${index <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <step.icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">{step.title}</span>
              </div>
              {index < registrationSteps.length - 1 && (
                <div className={`w-12 h-0.5 mx-4 ${index < currentStep ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>
        <Progress value={(currentStep / (registrationSteps.length - 1)) * 100} className="h-2" />
      </Card>

      {/* Registration Form */}
      <Card className="p-6">
        {currentStep === 0 && (
          <div className="space-y-6">
            <h3>Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company Name *</Label>
                <Input placeholder="Enter company name" value={registrationData.basic.companyName} onChange={e => handleBasicChange('companyName', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Business Category *</Label>
                <Select value={registrationData.basic.category} onValueChange={(v: string) => handleBasicChange('category', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="services">Services</SelectItem>
                    <SelectItem value="transportation">Transportation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Contact Person *</Label>
                <Input placeholder="Full name" value={registrationData.basic.contactPerson} onChange={e => handleBasicChange('contactPerson', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Designation</Label>
                <Input placeholder="Job title" />
              </div>
              <div className="space-y-2">
                <Label>Email Address *</Label>
                <Input type="email" placeholder="contact@company.com" value={registrationData.basic.email} onChange={e => handleBasicChange('email', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone Number *</Label>
                <Input placeholder="+91 9876543210" value={registrationData.basic.phone} onChange={e => handleBasicChange('phone', e.target.value)} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Registered Address *</Label>
                <Textarea placeholder="Complete registered address" rows={3} />
              </div>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-6">
            <h3>Legal & Compliance Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>GSTIN *</Label>
                <div className="flex gap-2">
                  <Input placeholder="29ABCDE1234F1Z5" />
                  <Button variant="outline" size="sm">Verify</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>PAN Number *</Label>
                <div className="flex gap-2">
                  <Input placeholder="ABCDE1234F" />
                  <Button variant="outline" size="sm">Verify</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>CIN/LLPIN</Label>
                <Input placeholder="Company identification number" />
              </div>
              <div className="space-y-2">
                <Label>Incorporation Date</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>MSME Registration</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select MSME category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="micro">Micro</SelectItem>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="not-applicable">Not Applicable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Annual Turnover (₹)</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select turnover range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="below-1cr">Below 1 Crore</SelectItem>
                    <SelectItem value="1-10cr">1-10 Crores</SelectItem>
                    <SelectItem value="10-50cr">10-50 Crores</SelectItem>
                    <SelectItem value="above-50cr">Above 50 Crores</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <h3>Financial Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bank Name *</Label>
                <Input placeholder="Bank name" />
              </div>
              <div className="space-y-2">
                <Label>Account Number *</Label>
                <Input placeholder="Account number" />
              </div>
              <div className="space-y-2">
                <Label>IFSC Code *</Label>
                <div className="flex gap-2">
                  <Input placeholder="IFSC code" />
                  <Button variant="outline" size="sm">Verify</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Account Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Current</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                    <SelectItem value="cc-od">CC/OD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Branch Address</Label>
                <Textarea placeholder="Bank branch address" rows={2} />
              </div>
            </div>

            <div className="space-y-4">
              <h4>Payment Terms Preference</h4>
              <RadioGroup defaultValue="30-days">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="15-days" id="15-days" />
                  <Label htmlFor="15-days">15 Days</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="30-days" id="30-days" />
                  <Label htmlFor="30-days">30 Days</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="45-days" id="45-days" />
                  <Label htmlFor="45-days">45 Days</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="60-days" id="60-days" />
                  <Label htmlFor="60-days">60 Days</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <h3>Capabilities & Services</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Primary Products/Services *</Label>
                <Textarea placeholder="Describe your primary products or services" rows={3} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Years in Business</Label>
                  <Input type="number" placeholder="Number of years" />
                </div>
                <div className="space-y-2">
                  <Label>Number of Employees</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10</SelectItem>
                      <SelectItem value="11-50">11-50</SelectItem>
                      <SelectItem value="51-100">51-100</SelectItem>
                      <SelectItem value="101-500">101-500</SelectItem>
                      <SelectItem value="500+">500+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Certifications (Select all that apply)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['ISO 9001', 'ISO 14001', 'ISO 45001', 'ISO 27001', 'CE Marking', 'ROHS Compliance'].map((cert) => (
                    <div key={cert} className="flex items-center space-x-2">
                      <Checkbox id={cert} />
                      <Label htmlFor={cert} className="text-sm">{cert}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Manufacturing/Service Capacity</Label>
                <Textarea placeholder="Describe your production capacity or service capability" rows={2} />
              </div>

              <div className="space-y-2">
                <Label>Key Equipment/Technology</Label>
                <Textarea placeholder="List major equipment or technology used" rows={2} />
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <h3>Document Upload</h3>
            <div className="space-y-4">
              <div className="p-4 border-2 border-dashed rounded-lg">
                <div className="text-center space-y-2">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                  <p className="font-medium">Required Documents</p>
                  <p className="text-sm text-muted-foreground">Upload the following documents based on your category</p>
                </div>
              </div>

              <div className="space-y-3">
                {documentRequirements['Technology'].map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm">{doc}</span>
                      <Badge variant="outline" className="text-xs">Required</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">Upload</Button>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-6">
            <h3>Verification Status</h3>
            <div className="space-y-4">
              {verificationChecks.map((check) => (
                <div key={check.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getVerificationStatusIcon(check.status)}
                    <div>
                      <p className="font-medium">{check.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {check.automated ? 'Automated verification' : 'Manual verification required'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {check.automated && (
                      <Button variant="outline" size="sm" className="gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Re-verify
                      </Button>
                    )}
                    <Badge variant={
                      check.status === 'completed' ? 'default' :
                      check.status === 'pending' ? 'secondary' :
                      check.status === 'failed' ? 'destructive' : 'outline'
                    }>
                      {check.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border rounded-lg bg-green-50">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">Registration Complete!</p>
                  <p className="text-sm text-green-600">
                    Your vendor registration has been submitted successfully. You will receive an email confirmation shortly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          
          {currentStep < registrationSteps.length - 1 ? (
            <Button onClick={() => setCurrentStep(currentStep + 1)}>
              Next
            </Button>
          ) : (
            <Button className="gap-2" onClick={async () => {
              try {
                // Connect to the backend!
                await vendorService.createVendor({
                  name: registrationData.basic.companyName || 'Unknown Vendor',
                  category: registrationData.basic.category || 'technology',
                  contact: {
                    email: registrationData.basic.email,
                    phone: registrationData.basic.phone,
                    name: registrationData.basic.contactPerson
                  }
                });
                alert('Registration successfully submitted and saved to Database!');
                setCurrentStep(0);
                setCurrentView('overview');
              } catch (error: any) {
                alert('Database Error: ' + error.message);
              }
            }}>
              <Send className="w-4 h-4" />
              Submit Registration
            </Button>
          )}
        </div>
      </Card>
    </div>
  );

  const renderPendingReview = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => setCurrentView('overview')}>
          ← Back
        </Button>
        <div>
          <h1>Pending Registrations Review</h1>
        </div>
      </div>

      {/* Filters */}
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

      {/* Pending Registrations */}
      {registrationViewMode === 'table' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Company Details</th>
                  <th className="text-left p-4 font-medium">Contact Person</th>
                  <th className="text-left p-4 font-medium">Category</th>
                  <th className="text-left p-4 font-medium">Registration Date</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingRegistrations.filter(r => r.status !== 'Approved').map((registration) => (
                  <tr key={registration.id} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{registration.companyName}</p>
                        <p className="text-sm text-muted-foreground">GSTIN: {registration.gstin}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{registration.contactPerson}</p>
                        <p className="text-sm text-muted-foreground">{registration.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">{registration.category}</Badge>
                    </td>
                    <td className="p-4">
                      <span className="text-sm">{registration.registrationDate}</span>
                    </td>
                    <td className="p-4">
                      <Badge className={getStatusColor(registration.status)}>
                        {registration.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => {
                          setSelectedRegistration(registration);
                          setIsReviewModalOpen(true);
                        }}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm">Review</Button>
                      </div>
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
          {pendingRegistrations.filter(r => r.status !== 'Approved').map((registration) => (
            <Card key={registration.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-semibold">{registration.companyName}</p>
                    <Badge className={getStatusColor(registration.status)}>
                      {registration.status}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {registration.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{registration.contactPerson}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      <span>{registration.email}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{registration.registrationDate}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => {
                    setSelectedRegistration(registration);
                    setIsReviewModalOpen(true);
                  }}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button size="sm">Review</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {registrationViewMode === 'card' && (
        <div className="space-y-4">
          {pendingRegistrations.filter(r => r.status !== 'Approved').map((registration) => (
            <Card key={registration.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3>{registration.companyName}</h3>
                    <p className="text-sm text-muted-foreground">GSTIN: {registration.gstin}</p>
                    <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{registration.email}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{registration.phone}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge variant={getStatusColor(registration.status)}>
                  {registration.status}
                </Badge>
                <span className={`text-sm font-medium ${getRiskColor(registration.riskLevel)}`}>
                  {registration.riskLevel} Risk
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Registration Progress</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Completed</span>
                    <span>{registration.completionPercentage}%</span>
                  </div>
                  <Progress value={registration.completionPercentage} className="h-2" />
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">Documents Status</p>
                <div className="flex gap-2">
                  <Badge variant="default" className="text-xs">
                    {registration.documents.length} Uploaded
                  </Badge>
                  {registration.missingDocuments.length > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {registration.missingDocuments.length} Missing
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleReviewRegistration(registration)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Review Details
              </Button>
              <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                Reject
              </Button>
              <Button size="sm" className="gap-2">
                <CheckCircle className="w-4 h-4" />
                Approve
              </Button>
            </div>
          </Card>
        ))}
      </div>
      )}
    </div>
  );

  // Registration Review Modal
  const renderReviewModal = () => (
    <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registration Review - {selectedRegistration?.companyName}</DialogTitle>
          <DialogDescription>
            Complete review of vendor registration details and documentation
          </DialogDescription>
        </DialogHeader>
        
        {selectedRegistration && (
          <div className="space-y-6">
            {/* Basic Information */}
            <Card className="p-4">
              <h3 className="mb-4">Company Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Company Name</p>
                  <p className="font-medium">{selectedRegistration.companyName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{selectedRegistration.category}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">GSTIN</p>
                  <p className="font-medium">{selectedRegistration.gstin}</p>
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
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="p-6">
      {currentView === 'overview' && renderOverview()}
      {currentView === 'new-registration' && renderNewRegistration()}
      {currentView === 'review-pending' && renderPendingReview()}
      {renderReviewModal()}
    </div>
  );
}