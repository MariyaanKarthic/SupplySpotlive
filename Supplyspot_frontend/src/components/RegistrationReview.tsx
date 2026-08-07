import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Alert, AlertDescription } from './ui/alert';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './ui/sheet';
import { DatePicker } from './ui/date-picker';
import { Separator } from './ui/separator';
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
  Calendar,
  Clock,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Send,
  UserCheck,
  FileCheck,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Star,
  ThumbsUp,
  ThumbsDown,
  Flag,
  History,
  User,
  Building,
  Scale,
  CreditCard,
  Globe,
  Zap,
  TrendingUp,
  BarChart3,
  Info,
  FileQuestion,
  Reply,
  ClipboardList,
  Timer,
  Users2,
  FileX,
  MessageCircle
} from 'lucide-react';

// Mock data for registrations pending review
const registrationsPendingReview = [
  {
    id: 'REG-2023-001',
    companyName: 'TechnoVate Solutions Pvt Ltd',
    gstin: '29ABCDE1234F1Z5',
    pan: 'ABCDE1234F',
    contactPerson: 'Rajesh Kumar',
    designation: 'Managing Director',
    email: 'rajesh@technovate.com',
    phone: '+91 9876543210',
    category: 'Technology',
    subcategory: 'Software Development',
    registrationDate: '2023-12-15',
    submissionDate: '2023-12-20',
    status: 'Pending Initial Review',
    priority: 'High',
    reviewStage: 'registration',
    completionPercentage: 95,
    riskLevel: 'Low',
    complianceScore: 88,
    businessType: 'Private Limited',
    yearEstablished: '2015',
    annualTurnover: '15 Crores',
    employeeCount: '75',
    address: {
      registered: '123 Tech Park, Electronic City, Bangalore, Karnataka - 560100',
      operational: '123 Tech Park, Electronic City, Bangalore, Karnataka - 560100',
      sameAsRegistered: true
    },
    banking: {
      bankName: 'HDFC Bank',
      accountNumber: '50200012345678',
      ifscCode: 'HDFC0001234',
      accountType: 'Current',
      branchAddress: 'Electronic City Branch, Bangalore'
    },
    documents: {
      uploaded: [
        { name: 'GST Registration Certificate', type: 'gst', status: 'verified', uploadDate: '2023-12-15', size: '2.4 MB' },
        { name: 'PAN Card', type: 'pan', status: 'verified', uploadDate: '2023-12-15', size: '1.2 MB' },
        { name: 'Bank Statement (Last 6 months)', type: 'bank', status: 'pending', uploadDate: '2023-12-16', size: '4.8 MB' },
        { name: 'Incorporation Certificate', type: 'incorporation', status: 'verified', uploadDate: '2023-12-16', size: '1.8 MB' },
        { name: 'Audited Financials (Last 2 years)', type: 'financials', status: 'pending', uploadDate: '2023-12-17', size: '12.3 MB' },
        { name: 'ISO 27001 Certificate', type: 'iso', status: 'verified', uploadDate: '2023-12-18', size: '3.1 MB' }
      ],
      required: [
        'GST Registration Certificate',
        'PAN Card', 
        'Bank Statement',
        'Incorporation Certificate',
        'Audited Financials',
        'Professional Tax Registration'
      ],
      missing: ['Professional Tax Registration']
    },
    verificationChecks: {
      gstin: { status: 'completed', result: 'valid', automated: true, lastChecked: '2023-12-20' },
      pan: { status: 'completed', result: 'valid', automated: true, lastChecked: '2023-12-20' },
      cin: { status: 'completed', result: 'valid', automated: true, lastChecked: '2023-12-20' },
      bank: { status: 'pending', result: null, automated: true, lastChecked: null },
      address: { status: 'not_started', result: null, automated: false, lastChecked: null },
      references: { status: 'not_started', result: null, automated: false, lastChecked: null },
      creditCheck: { status: 'pending', result: null, automated: true, lastChecked: null }
    },
    certifications: ['ISO 27001', 'ISO 9001', 'CMMI Level 3'],
    services: ['Custom Software Development', 'Mobile App Development', 'Cloud Solutions', 'Data Analytics'],
    clientReferences: [
      { name: 'Global Tech Corp', contact: 'tech@globalcorp.com', relationship: '3 years' },
      { name: 'Innovation Ltd', contact: 'procurement@innovation.com', relationship: '2 years' }
    ],
    reviewHistory: [
      { date: '2023-12-20', reviewer: 'John Smith', action: 'Initial Review Started', comments: 'Documents look complete, starting verification process.' },
      { date: '2023-12-19', reviewer: 'System', action: 'Auto-verification Completed', comments: 'GSTIN and PAN verified successfully.' }
    ],
    flags: [],
    notes: []
  },
  {
    id: 'REG-2023-002',
    companyName: 'Green Manufacturing Solutions',
    gstin: '27FGHIJ5678K2L9',
    pan: 'FGHIJ5678K',
    contactPerson: 'Priya Sharma',
    designation: 'Operations Director',
    email: 'priya@greenmanuf.com',
    phone: '+91 8765432109',
    category: 'Manufacturing',
    subcategory: 'Automotive Components',
    registrationDate: '2023-12-18',
    submissionDate: '2023-12-22',
    status: 'Document Review',
    priority: 'Medium',
    reviewStage: 'document',
    completionPercentage: 85,
    riskLevel: 'Medium',
    complianceScore: 75,
    businessType: 'Private Limited',
    yearEstablished: '2010',
    annualTurnover: '45 Crores',
    employeeCount: '125',
    address: {
      registered: '456 Industrial Area, Phase 2, Gurgaon, Haryana - 122001',
      operational: '789 Manufacturing Hub, Manesar, Haryana - 122050',
      sameAsRegistered: false
    },
    banking: {
      bankName: 'State Bank of India',
      accountNumber: '30123456789012',
      ifscCode: 'SBIN0012345',
      accountType: 'Current',
      branchAddress: 'Industrial Area Branch, Gurgaon'
    },
    documents: {
      uploaded: [
        { name: 'GST Registration Certificate', type: 'gst', status: 'verified', uploadDate: '2023-12-18', size: '2.1 MB' },
        { name: 'PAN Card', type: 'pan', status: 'verified', uploadDate: '2023-12-18', size: '1.1 MB' },
        { name: 'Factory License', type: 'factory', status: 'pending', uploadDate: '2023-12-19', size: '3.2 MB' },
        { name: 'Pollution Clearance Certificate', type: 'pollution', status: 'pending', uploadDate: '2023-12-19', size: '2.8 MB' },
        { name: 'ISO 9001 Certificate', type: 'iso', status: 'expired', uploadDate: '2023-12-20', size: '2.5 MB' }
      ],
      required: [
        'GST Registration Certificate',
        'PAN Card',
        'Factory License',
        'Pollution Clearance Certificate',
        'Labor License',
        'ISO 9001 Certificate',
        'Fire Safety Certificate'
      ],
      missing: ['Labor License', 'Fire Safety Certificate']
    },
    verificationChecks: {
      gstin: { status: 'completed', result: 'valid', automated: true, lastChecked: '2023-12-22' },
      pan: { status: 'completed', result: 'valid', automated: true, lastChecked: '2023-12-22' },
      cin: { status: 'completed', result: 'valid', automated: true, lastChecked: '2023-12-22' },
      bank: { status: 'completed', result: 'valid', automated: true, lastChecked: '2023-12-22' },
      address: { status: 'pending', result: null, automated: false, lastChecked: null },
      references: { status: 'pending', result: null, automated: false, lastChecked: null },
      creditCheck: { status: 'completed', result: 'good', automated: true, lastChecked: '2023-12-22' }
    },
    certifications: ['ISO 9001', 'TS 16949'],
    services: ['Automotive Components', 'Precision Manufacturing', 'Quality Testing'],
    clientReferences: [
      { name: 'AutoCorp India', contact: 'sourcing@autocorp.in', relationship: '5 years' },
      { name: 'Parts Plus Ltd', contact: 'vendor@partsplus.com', relationship: '3 years' }
    ],
    reviewHistory: [
      { date: '2023-12-22', reviewer: 'Sarah Johnson', action: 'Document Review In Progress', comments: 'ISO certificate expired, requesting renewal. Missing labor license.' },
      { date: '2023-12-21', reviewer: 'Mike Chen', action: 'Initial Review Completed', comments: 'Basic verification completed, moved to document review.' }
    ],
    flags: [
      { type: 'warning', message: 'ISO 9001 certificate expired', severity: 'medium' },
      { type: 'missing', message: 'Missing labor license', severity: 'high' }
    ],
    notes: [
      { date: '2023-12-22', author: 'Sarah Johnson', content: 'Company has strong manufacturing capabilities but needs to update certifications.' }
    ]
  }
];

const reviewStages = [
  { 
    id: 'registration', 
    title: 'Registration Review', 
    description: 'Review basic company information and initial verification',
    icon: Building2 
  },
  { 
    id: 'document', 
    title: 'Document Review', 
    description: 'Verify uploaded documents and compliance requirements',
    icon: FileText 
  },
  { 
    id: 'verification', 
    title: 'Final Verification', 
    description: 'Complete verification checks and risk assessment',
    icon: Shield 
  },
  { 
    id: 'approval', 
    title: 'Approval Decision', 
    description: 'Make final approval or rejection decision',
    icon: CheckCircle 
  }
];

// Request templates for common information requests
const requestTemplates = [
  {
    id: 'missing-documents',
    title: 'Missing Documents',
    category: 'Documentation',
    description: 'Request missing required documents',
    template: 'We have reviewed your registration and found the following documents are missing. Please upload these documents to complete your registration:',
    requiredFields: ['documents'],
    priority: 'high'
  },
  {
    id: 'expired-certificates',
    title: 'Expired Certificates',
    category: 'Compliance',
    description: 'Request renewal of expired certificates',
    template: 'Some of your certificates have expired or are nearing expiry. Please provide updated certificates:',
    requiredFields: ['certificates'],
    priority: 'high'
  },
  {
    id: 'banking-verification',
    title: 'Banking Information Verification',
    category: 'Financial',
    description: 'Request additional banking verification',
    template: 'We need additional information to verify your banking details. Please provide:',
    requiredFields: ['bankingInfo'],
    priority: 'medium'
  },
  {
    id: 'address-verification',
    title: 'Address Verification',
    category: 'Basic Information',
    description: 'Request address verification documents',
    template: 'We need to verify your registered address. Please provide:',
    requiredFields: ['addressProof'],
    priority: 'medium'
  },
  {
    id: 'capacity-details',
    title: 'Capacity & Capability Details',
    category: 'Technical',
    description: 'Request detailed capacity information',
    template: 'Please provide more detailed information about your manufacturing/service capacity:',
    requiredFields: ['capacityDetails'],
    priority: 'low'
  },
  {
    id: 'reference-contacts',
    title: 'Reference Verification',
    category: 'References',
    description: 'Request additional reference contacts',
    template: 'We need to verify your business references. Please provide contact details for:',
    requiredFields: ['references'],
    priority: 'medium'
  },
  {
    id: 'custom',
    title: 'Custom Request',
    category: 'Other',
    description: 'Create a custom information request',
    template: '',
    requiredFields: ['customMessage'],
    priority: 'medium'
  }
];

// Mock data for information requests history
const informationRequests = [
  {
    id: 'REQ-001',
    registrationId: 'REG-2023-001',
    requestType: 'missing-documents',
    title: 'Missing Professional Tax Registration',
    description: 'Professional Tax Registration certificate is required for Technology category vendors.',
    requestedBy: 'Sarah Johnson',
    requestDate: '2023-12-22',
    dueDate: '2023-12-29',
    status: 'pending',
    priority: 'high',
    items: ['Professional Tax Registration Certificate'],
    response: null,
    responseDate: null
  },
  {
    id: 'REQ-002',
    registrationId: 'REG-2023-002',
    requestType: 'expired-certificates',
    title: 'ISO Certificate Renewal Required',
    description: 'ISO 9001 certificate has expired. Please provide renewed certificate.',
    requestedBy: 'Mike Chen',
    requestDate: '2023-12-21',
    dueDate: '2023-12-28',
    status: 'overdue',
    priority: 'high',
    items: ['ISO 9001 Certificate (Renewed)'],
    response: null,
    responseDate: null
  }
];

export function RegistrationReview() {
  const [selectedRegistration, setSelectedRegistration] = useState<any>(registrationsPendingReview[0]);
  const [activeStage, setActiveStage] = useState('registration');
  const [reviewComments, setReviewComments] = useState('');
  const [documentReviewNotes, setDocumentReviewNotes] = useState('');
  const [verificationDecisions, setVerificationDecisions] = useState('');
  const [finalDecision, setFinalDecision] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  
  // Request Additional Info Modal State
  const [isRequestInfoModalOpen, setIsRequestInfoModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [requestTitle, setRequestTitle] = useState('');
  const [requestDescription, setRequestDescription] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [requestDueDate, setRequestDueDate] = useState('');
  const [requestPriority, setRequestPriority] = useState('medium');
  const [requestItems, setRequestItems] = useState<string[]>([]);
  const [newRequestItem, setNewRequestItem] = useState('');
  const [activeRequestsView, setActiveRequestsView] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending initial review':
        return 'secondary';
      case 'document review':
        return 'outline';
      case 'final verification':
        return 'outline';
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'on hold':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low':
        return 'text-green-600 bg-green-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'high':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getVerificationIcon = (status: string, result?: string) => {
    if (status === 'completed') {
      return result === 'valid' || result === 'good' ? 
        <CheckCircle className="w-4 h-4 text-green-600" /> : 
        <XCircle className="w-4 h-4 text-red-600" />;
    } else if (status === 'pending') {
      return <Clock className="w-4 h-4 text-yellow-600" />;
    } else if (status === 'failed') {
      return <XCircle className="w-4 h-4 text-red-600" />;
    }
    return <Clock className="w-4 h-4 text-gray-400" />;
  };

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'rejected':
      case 'expired':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const moveToNextStage = () => {
    const currentIndex = reviewStages.findIndex(stage => stage.id === activeStage);
    if (currentIndex < reviewStages.length - 1) {
      setActiveStage(reviewStages[currentIndex + 1].id);
    }
  };

  const moveToPreviousStage = () => {
    const currentIndex = reviewStages.findIndex(stage => stage.id === activeStage);
    if (currentIndex > 0) {
      setActiveStage(reviewStages[currentIndex - 1].id);
    }
  };

  const handleApproveRegistration = () => {
    // Implementation for approval
    console.log('Approving registration:', selectedRegistration.id);
  };

  const handleRejectRegistration = () => {
    // Implementation for rejection
    console.log('Rejecting registration:', selectedRegistration.id);
  };

  const handleRequestMoreInfo = () => {
    setIsRequestInfoModalOpen(true);
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = requestTemplates.find(t => t.id === templateId);
    if (template) {
      setRequestTitle(template.title);
      setRequestDescription(template.description);
      setRequestMessage(template.template);
      setRequestPriority(template.priority);
      setRequestItems([]);
    }
  };

  const addRequestItem = () => {
    if (newRequestItem.trim() && !requestItems.includes(newRequestItem.trim())) {
      setRequestItems([...requestItems, newRequestItem.trim()]);
      setNewRequestItem('');
    }
  };

  const removeRequestItem = (item: string) => {
    setRequestItems(requestItems.filter(i => i !== item));
  };

  const resetRequestForm = () => {
    setSelectedTemplate('');
    setRequestTitle('');
    setRequestDescription('');
    setRequestMessage('');
    setRequestDueDate('');
    setRequestPriority('medium');
    setRequestItems([]);
    setNewRequestItem('');
  };

  const handleSubmitRequest = () => {
    const newRequest = {
      id: `REQ-${Date.now()}`,
      registrationId: selectedRegistration.id,
      requestType: selectedTemplate,
      title: requestTitle,
      description: requestDescription,
      message: requestMessage,
      requestedBy: 'Current User', // Would be from auth context
      requestDate: new Date().toISOString().split('T')[0],
      dueDate: requestDueDate,
      status: 'pending',
      priority: requestPriority,
      items: requestItems,
      response: null,
      responseDate: null
    };
    
    // Here you would typically send this to your backend
    console.log('Submitting information request:', newRequest);
    
    // Close modal and reset form
    setIsRequestInfoModalOpen(false);
    resetRequestForm();
    
    // Show success message (you could use a toast notification)
    alert('Information request sent successfully!');
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'medium':
        return <Info className="w-4 h-4 text-yellow-600" />;
      case 'low':
        return <MessageCircle className="w-4 h-4 text-blue-600" />;
      default:
        return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRequestStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'responded':
        return 'default';
      case 'overdue':
        return 'destructive';
      case 'closed':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const filteredRegistrations = registrationsPendingReview.filter(reg => {
    const matchesSearch = reg.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reg.gstin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reg.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || reg.status.toLowerCase().includes(filterStatus.toLowerCase());
    const matchesPriority = filterPriority === 'all' || reg.priority.toLowerCase() === filterPriority.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const renderRegistrationReview = () => (
    <div className="space-y-4 text-xs">
      <Card className="p-4 sm:p-5 shadow-sm border-slate-200">
        <h3 className="text-sm font-bold text-foreground">Company Information Review</h3>
        <Separator className="my-3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Company Name</Label>
              <p className="font-semibold text-foreground text-xs mt-0.5">{selectedRegistration.companyName}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Business Type</Label>
              <p className="font-medium text-xs mt-0.5">{selectedRegistration.businessType}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Year Established</Label>
              <p className="font-medium text-xs mt-0.5">{selectedRegistration.yearEstablished}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Category</Label>
              <p className="font-medium text-xs mt-0.5">{selectedRegistration.category} - {selectedRegistration.subcategory}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Annual Turnover</Label>
              <p className="font-medium text-xs mt-0.5">₹{selectedRegistration.annualTurnover}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Employee Count</Label>
              <p className="font-medium text-xs mt-0.5">{selectedRegistration.employeeCount}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">GSTIN</Label>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="font-mono font-bold text-xs">{selectedRegistration.gstin}</p>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">PAN</Label>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="font-mono font-bold text-xs">{selectedRegistration.pan}</p>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Submission Date</Label>
              <p className="font-medium text-xs mt-0.5">{selectedRegistration.submissionDate}</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 sm:p-5 shadow-sm border-slate-200">
          <h3 className="text-sm font-bold text-foreground">Contact Information</h3>
          <Separator className="my-3" />
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Contact Person</Label>
              <p className="font-semibold text-xs mt-0.5">{selectedRegistration.contactPerson}</p>
              <p className="text-xs text-muted-foreground">{selectedRegistration.designation}</p>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs">{selectedRegistration.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs">{selectedRegistration.phone}</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 shadow-sm border-slate-200">
          <h3 className="text-sm font-bold text-foreground">Address Information</h3>
          <Separator className="my-3" />
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Registered Address</Label>
              <p className="text-xs mt-0.5">{selectedRegistration.address.registered}</p>
            </div>
            {!selectedRegistration.address.sameAsRegistered && (
              <div>
                <Label className="text-xs text-muted-foreground">Operational Address</Label>
                <p className="text-xs mt-0.5">{selectedRegistration.address.operational}</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-4 sm:p-5 shadow-sm border-slate-200">
        <h3 className="text-sm font-bold text-foreground">Banking Information</h3>
        <Separator className="my-3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Bank Name</Label>
            <p className="font-semibold text-xs mt-0.5">{selectedRegistration.banking.bankName}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Account Number</Label>
            <p className="font-mono font-medium text-xs mt-0.5">{selectedRegistration.banking.accountNumber}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">IFSC Code</Label>
            <p className="font-mono font-medium text-xs mt-0.5">{selectedRegistration.banking.ifscCode}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Account Type</Label>
            <p className="font-medium text-xs mt-0.5">{selectedRegistration.banking.accountType}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4">Services & Capabilities</h3>
        <div className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground">Primary Services</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedRegistration.services.map((service: string, index: number) => (
                <Badge key={index} variant="outline">{service}</Badge>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Certifications</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedRegistration.certifications.map((cert: string, index: number) => (
                <Badge key={index} variant="secondary">{cert}</Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {renderActiveRequests()}

      <Card className="p-6">
        <h3 className="mb-4">Review Comments</h3>
        <Textarea
          placeholder="Add your review comments for this registration..."
          value={reviewComments}
          onChange={(e) => setReviewComments(e.target.value)}
          rows={4}
        />
        <div className="flex justify-between gap-2 mt-4">
          <Button variant="outline" onClick={handleRequestMoreInfo} className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Request Additional Info
          </Button>
          <div className="flex gap-2">
            <Button variant="outline">Save Draft</Button>
            <Button onClick={moveToNextStage}>Proceed to Document Review</Button>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderDocumentReview = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="mb-4">Document Verification Status</h3>
        <div className="space-y-4">
          {selectedRegistration.documents.uploaded.map((doc: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">{doc.name}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-sm text-muted-foreground">Uploaded: {doc.uploadDate}</span>
                    <span className="text-sm text-muted-foreground">Size: {doc.size}</span>
                    <Badge variant={doc.status === 'verified' ? 'default' : doc.status === 'pending' ? 'secondary' : 'destructive'}>
                      {doc.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                {doc.status === 'pending' && (
                  <>
                    <Button variant="outline" size="sm" className="text-green-600">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600">
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {selectedRegistration.documents.missing.length > 0 && (
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-red-800 mb-2">Missing Documents</h3>
              <ul className="space-y-1">
                {selectedRegistration.documents.missing.map((doc: string, index: number) => (
                  <li key={index} className="text-sm text-red-600">• {doc}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {selectedRegistration.flags.length > 0 && (
        <Card className="p-6">
          <h3 className="mb-4 flex items-center gap-2">
            <Flag className="w-5 h-5 text-yellow-600" />
            Review Flags
          </h3>
          <div className="space-y-3">
            {selectedRegistration.flags.map((flag: any, index: number) => (
              <Alert key={index}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <span className="font-medium">{flag.type.toUpperCase()}:</span> {flag.message}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="mb-4">Document Review Notes</h3>
        <Textarea
          placeholder="Add specific notes about document verification..."
          value={documentReviewNotes}
          onChange={(e) => setDocumentReviewNotes(e.target.value)}
          rows={4}
        />
        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={moveToPreviousStage}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Registration Review
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRequestMoreInfo} className="gap-2">
              <FileQuestion className="w-4 h-4" />
              Request Additional Documents
            </Button>
            <Button onClick={moveToNextStage}>Proceed to Verification</Button>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderVerificationReview = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="mb-4">Automated Verification Checks</h3>
        <div className="space-y-4">
          {Object.entries(selectedRegistration.verificationChecks).map(([key, check]: [string, any]) => (
            <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getVerificationIcon(check.status, check.result)}
                <div>
                  <p className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()} Verification</p>
                  <p className="text-sm text-muted-foreground">
                    {check.automated ? 'Automated check' : 'Manual verification required'}
                    {check.lastChecked && ` • Last checked: ${check.lastChecked}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {check.result && (
                  <Badge variant={check.result === 'valid' || check.result === 'good' ? 'default' : 'destructive'}>
                    {check.result}
                  </Badge>
                )}
                {check.automated && (
                  <Button variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Re-verify
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${getRiskColor(selectedRegistration.riskLevel)}`}>
              <Shield className="w-6 h-6" />
            </div>
            <p className="text-sm text-muted-foreground">Risk Level</p>
            <p className="text-xl font-semibold">{selectedRegistration.riskLevel}</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 bg-blue-50">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm text-muted-foreground">Compliance Score</p>
            <p className="text-xl font-semibold">{selectedRegistration.complianceScore}%</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 bg-green-50">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm text-muted-foreground">Completion</p>
            <p className="text-xl font-semibold">{selectedRegistration.completionPercentage}%</p>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="mb-4">Client References</h3>
        <div className="space-y-3">
          {selectedRegistration.clientReferences.map((ref: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded">
              <div>
                <p className="font-medium">{ref.name}</p>
                <p className="text-sm text-muted-foreground">{ref.contact} • {ref.relationship}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Contact
                </Button>
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4">Final Verification Notes</h3>
        <Textarea
          placeholder="Add your final verification assessment..."
          value={verificationDecisions}
          onChange={(e) => setVerificationDecisions(e.target.value)}
          rows={4}
        />
        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={moveToPreviousStage}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Document Review
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRequestMoreInfo} className="gap-2">
              <Users2 className="w-4 h-4" />
              Request Reference Verification
            </Button>
            <Button onClick={moveToNextStage}>Proceed to Final Decision</Button>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderRequestInfoModal = () => (
    <Sheet open={isRequestInfoModalOpen} onOpenChange={setIsRequestInfoModalOpen}>
      <SheetContent className="sm:max-w-4xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Request Additional Information</SheetTitle>
          <SheetDescription>
            Request specific information or documents from {selectedRegistration?.companyName}
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-6 mt-4">
          {/* Template Selection */}
          <Card className="p-4">
            <h3 className="mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Request Template
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {requestTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedTemplate === template.id 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleTemplateChange(template.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{template.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {template.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                      {getPriorityIcon(template.priority)}
                      <span className="text-xs capitalize">{template.priority}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Request Details */}
          <Card className="p-4">
            <h3 className="mb-4 flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Request Details
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Request Title *</Label>
                  <Input
                    value={requestTitle}
                    onChange={(e) => setRequestTitle(e.target.value)}
                    placeholder="Enter request title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={requestPriority} onValueChange={setRequestPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High - Urgent</SelectItem>
                      <SelectItem value="medium">Medium - Standard</SelectItem>
                      <SelectItem value="low">Low - When convenient</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={requestDescription}
                  onChange={(e) => setRequestDescription(e.target.value)}
                  placeholder="Brief description of what's needed"
                />
              </div>

              <div className="space-y-2">
                <Label>Due Date</Label>
                <DatePicker
                  value={requestDueDate}
                  onChange={(e) => setRequestDueDate(e.target.value)}
                  placeholder="Select due date"
                />
              </div>

              <div className="space-y-2">
                <Label>Request Message *</Label>
                <Textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="Detailed message explaining what information is needed"
                  rows={4}
                />
              </div>
            </div>
          </Card>

          {/* Specific Items Requested */}
          <Card className="p-4">
            <h3 className="mb-4 flex items-center gap-2">
              <FileQuestion className="w-5 h-5" />
              Specific Items Required
            </h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newRequestItem}
                  onChange={(e) => setNewRequestItem(e.target.value)}
                  placeholder="Add specific document or information needed"
                  onKeyPress={(e) => e.key === 'Enter' && addRequestItem()}
                />
                <Button onClick={addRequestItem} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {requestItems.length > 0 && (
                <div className="space-y-2">
                  <Label>Items to be provided:</Label>
                  <div className="space-y-2">
                    {requestItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">{item}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRequestItem(item)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Preview */}
          <Card className="p-4 bg-muted/50">
            <h3 className="mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Preview
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <strong>To:</strong> {selectedRegistration?.companyName} ({selectedRegistration?.email})
              </div>
              <div>
                <strong>Subject:</strong> Additional Information Required - {requestTitle}
              </div>
              <div>
                <strong>Priority:</strong> 
                <Badge variant={requestPriority === 'high' ? 'destructive' : requestPriority === 'medium' ? 'secondary' : 'outline'} className="ml-2">
                  {requestPriority.toUpperCase()}
                </Badge>
              </div>
              {requestDueDate && (
                <div>
                  <strong>Due Date:</strong> {requestDueDate}
                </div>
              )}
              <div className="border-t pt-3">
                <p>{requestMessage}</p>
                {requestItems.length > 0 && (
                  <div className="mt-3">
                    <strong>Required Items:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {requestItems.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => setIsRequestInfoModalOpen(false)}>
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetRequestForm}>
                Reset Form
              </Button>
              <Button 
                onClick={handleSubmitRequest}
                disabled={!requestTitle || !requestMessage}
                className="gap-2"
              >
                <Send className="w-4 h-4" />
                Send Request
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  const renderActiveRequests = () => (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Active Information Requests
        </h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setActiveRequestsView(!activeRequestsView)}
        >
          {activeRequestsView ? 'Hide' : 'Show'} Requests ({informationRequests.length})
        </Button>
      </div>
      
      {activeRequestsView && (
        <div className="space-y-3">
          {informationRequests.map((request) => (
            <div key={request.id} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3">
                  {getPriorityIcon(request.priority)}
                  <div>
                    <p className="font-medium">{request.title}</p>
                    <p className="text-sm text-muted-foreground">{request.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getRequestStatusColor(request.status)}>
                    {request.status.toUpperCase()}
                  </Badge>
                  {request.status === 'overdue' && (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Requested by:</span>
                  <p>{request.requestedBy}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Request Date:</span>
                  <p>{request.requestDate}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Due Date:</span>
                  <p className={request.status === 'overdue' ? 'text-red-600 font-medium' : ''}>
                    {request.dueDate}
                  </p>
                </div>
              </div>
              
              {request.items.length > 0 && (
                <div className="mt-3">
                  <span className="text-sm text-muted-foreground">Requested Items:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {request.items.map((item, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-2 mt-3">
                <Button variant="outline" size="sm">
                  <Reply className="w-4 h-4 mr-2" />
                  Follow Up
                </Button>
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </div>
            </div>
          ))}
          
          {informationRequests.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileQuestion className="w-8 h-8 mx-auto mb-2" />
              <p>No active information requests</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );

  const renderApprovalDecision = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="mb-4">Registration Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center p-4 border rounded-lg">
            <Building className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <p className="font-medium">{selectedRegistration.companyName}</p>
            <p className="text-sm text-muted-foreground">{selectedRegistration.category}</p>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <p className="font-medium">Documents Verified</p>
            <p className="text-sm text-muted-foreground">
              {selectedRegistration.documents.uploaded.filter((d: any) => d.status === 'verified').length} / {selectedRegistration.documents.uploaded.length}
            </p>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <Shield className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <p className="font-medium">Risk Assessment</p>
            <p className="text-sm text-muted-foreground">{selectedRegistration.riskLevel} Risk</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4">Review History</h3>
        <div className="space-y-3">
          {selectedRegistration.reviewHistory.map((entry: any, index: number) => (
            <div key={index} className="flex items-start gap-3 p-3 border rounded">
              <History className="w-4 h-4 text-muted-foreground mt-1" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{entry.action}</p>
                  <span className="text-sm text-muted-foreground">{entry.date}</span>
                </div>
                <p className="text-sm text-muted-foreground">By: {entry.reviewer}</p>
                <p className="text-sm mt-1">{entry.comments}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4">Final Decision</h3>
        <div className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground mb-2">Decision</Label>
            <Select value={finalDecision} onValueChange={setFinalDecision}>
              <SelectTrigger>
                <SelectValue placeholder="Select final decision" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approve">Approve Registration</SelectItem>
                <SelectItem value="conditional">Conditional Approval</SelectItem>
                <SelectItem value="reject">Reject Registration</SelectItem>
                <SelectItem value="hold">Put on Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-sm text-muted-foreground mb-2">Final Comments</Label>
            <Textarea
              placeholder="Add final decision comments..."
              rows={4}
            />
          </div>

          {finalDecision === 'conditional' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please specify the conditions that must be met for full approval.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex justify-between">
          <Button variant="outline" onClick={moveToPreviousStage}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Verification
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRequestMoreInfo} className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Request More Info
            </Button>
            <Button variant="outline" className="text-red-600" onClick={handleRejectRegistration}>
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button className="gap-2" onClick={handleApproveRegistration}>
              <CheckCircle className="w-4 h-4" />
              Approve Registration
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="p-3 sm:p-5 space-y-4 w-full max-w-full overflow-x-hidden">
      {/* Top Header with Horizontal Divider Line */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
            Registration Review Workflow
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          <Badge variant="secondary" className="px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            {filteredRegistrations.length} Pending Reviews
          </Badge>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Main Content Grid with Vertical Column Divider */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Panel: Registration Search & List Sidebar (3 cols with Vertical Border Divider) */}
        <div className="lg:col-span-3 lg:pr-5 lg:border-r border-slate-200 dark:border-slate-800 space-y-3">
          <Card className="p-3 shadow-sm border-slate-200">
            <div className="space-y-2.5">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search registrations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-8 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">All Status</SelectItem>
                    <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                    <SelectItem value="document" className="text-xs">Document Review</SelectItem>
                    <SelectItem value="verification" className="text-xs">Verification</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">All Priority</SelectItem>
                    <SelectItem value="high" className="text-xs">High</SelectItem>
                    <SelectItem value="medium" className="text-xs">Medium</SelectItem>
                    <SelectItem value="low" className="text-xs">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <div className="space-y-2.5 max-h-[calc(100vh-210px)] overflow-y-auto pr-1">
            {filteredRegistrations.map((registration) => (
              <Card 
                key={registration.id} 
                className={`p-3 cursor-pointer transition-all border ${
                  selectedRegistration?.id === registration.id 
                    ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-sm' 
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-900/50'
                }`}
                onClick={() => setSelectedRegistration(registration)}
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-1">
                    <p className="font-semibold text-xs text-foreground leading-tight">{registration.companyName}</p>
                    <Badge variant={getStatusColor(registration.status)} className="text-[10px] px-1.5 py-0">
                      {registration.status.split(' ')[0]}
                    </Badge>
                  </div>
                  <p className="text-[11px] font-mono text-muted-foreground">{registration.id}</p>
                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <span className={`text-[11px] font-medium ${getPriorityColor(registration.priority)}`}>
                      {registration.priority} Priority
                    </span>
                    <span className="text-[11px] font-mono font-semibold text-muted-foreground">
                      {registration.completionPercentage}%
                    </span>
                  </div>
                  <Progress value={registration.completionPercentage} className="h-1" />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Panel: Review Content (9 cols) */}
        <div className="lg:col-span-9 lg:pl-1 space-y-4">
          {selectedRegistration && (
            <>
              {/* Stage Navigation Header */}
              <Card className="p-4 sm:p-5 shadow-sm border-slate-200">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <h2 className="text-lg font-bold text-foreground">{selectedRegistration.companyName}</h2>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(selectedRegistration.status)} className="text-xs">
                      {selectedRegistration.status}
                    </Badge>
                    <Badge variant="outline" className={`text-xs ${getPriorityColor(selectedRegistration.priority)}`}>
                      {selectedRegistration.priority} Priority
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {reviewStages.map((stage, index) => (
                    <div key={stage.id} className="flex items-center gap-2">
                      <div 
                        className={`flex-1 p-2.5 rounded-lg border transition-all cursor-pointer flex items-center gap-2.5 ${
                          activeStage === stage.id 
                            ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                        }`}
                        onClick={() => setActiveStage(stage.id)}
                      >
                        <div className={`p-1.5 rounded-md shrink-0 ${
                          activeStage === stage.id ? 'bg-primary text-primary-foreground' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}>
                          <stage.icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate leading-tight">{stage.title}</p>
                          <p className="text-[10px] text-muted-foreground truncate mt-0.5">{stage.description}</p>
                        </div>
                      </div>
                      {index < reviewStages.length - 1 && (
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0 hidden md:block" />
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Stage Content */}
              {activeStage === 'registration' && renderRegistrationReview()}
              {activeStage === 'document' && renderDocumentReview()}
              {activeStage === 'verification' && renderVerificationReview()}
              {activeStage === 'approval' && renderApprovalDecision()}
            </>
          )}
        </div>
      </div>
      
      {/* Request Additional Info Modal */}
      {renderRequestInfoModal()}
    </div>
  );
}