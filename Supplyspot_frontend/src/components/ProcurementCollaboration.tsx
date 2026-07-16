import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Calendar as CalendarComponent } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { toast } from 'sonner@2.0.3';
import { 
  MessageSquare, 
  FileText, 
  CheckCircle, 
  Clock, 
  Upload, 
  Send, 
  Bell, 
  Search,
  Download,
  Eye,
  AlertCircle,
  TrendingUp,
  Users,
  Calendar,
  Paperclip,
  X,
  Activity,
  UserPlus,
  Plus,
  Check,
  BarChart
} from 'lucide-react';
import { cn } from './ui/utils';

interface Message {
  id: string;
  sender: string;
  senderRole: 'procurement' | 'vendor';
  content: string;
  timestamp: string;
  attachments?: string[];
  read: boolean;
}

interface CollaborationItem {
  id: string;
  type: 'rfq' | 'bid' | 'quotation' | 'approval' | 'document';
  title: string;
  vendor: string;
  status: 'pending' | 'in-progress' | 'awaiting-response' | 'approved' | 'rejected';
  priority: 'high' | 'medium' | 'low';
  deadline: string;
  lastUpdate: string;
  unreadMessages: number;
  documents: number;
  assignedTo: string;
}

interface Notification {
  id: string;
  type: 'message' | 'approval' | 'document' | 'deadline';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface DocumentItem {
  name: string;
  size: string;
  uploadedBy: string;
  date: string;
  type: string;
}

export default function ProcurementCollaboration() {
  const [selectedItem, setSelectedItem] = useState<CollaborationItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [newMessage, setNewMessage] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  // Dialog states
  const [showQuickUpload, setShowQuickUpload] = useState(false);
  const [showViewDocument, setShowViewDocument] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showUploadQuotation, setShowUploadQuotation] = useState(false);
  const [showRequestClarification, setShowRequestClarification] = useState(false);
  const [showAssignTeam, setShowAssignTeam] = useState(false);
  const [showScheduleMeeting, setShowScheduleMeeting] = useState(false);
  const [showGenerateReport, setShowGenerateReport] = useState(false);
  const [showViewDetails, setShowViewDetails] = useState(false);
  
  // Form states
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadCategory, setUploadCategory] = useState('');
  const [approvalComments, setApprovalComments] = useState('');
  const [clarificationMessage, setClarificationMessage] = useState('');
  const [selectedTeamMember, setSelectedTeamMember] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState<Date>();
  const [meetingTime, setMeetingTime] = useState('');
  const [reportType, setReportType] = useState('');
  const [statusUpdate, setStatusUpdate] = useState('');
  const [statusNote, setStatusNote] = useState('');

  // Mock data for collaboration items
  const [collaborationItems, setCollaborationItems] = useState<CollaborationItem[]>([
    {
      id: 'RFQ-2025-001',
      type: 'rfq',
      title: 'Office Furniture Supply RFQ',
      vendor: 'Premium Office Solutions',
      status: 'awaiting-response',
      priority: 'high',
      deadline: '2025-10-15',
      lastUpdate: '2 hours ago',
      unreadMessages: 3,
      documents: 5,
      assignedTo: 'Sarah Johnson'
    },
    {
      id: 'BID-2025-042',
      type: 'bid',
      title: 'IT Equipment Procurement Bid',
      vendor: 'TechSource Corp',
      status: 'in-progress',
      priority: 'high',
      deadline: '2025-10-12',
      lastUpdate: '30 minutes ago',
      unreadMessages: 1,
      documents: 8,
      assignedTo: 'Michael Chen'
    },
    {
      id: 'QUO-2025-089',
      type: 'quotation',
      title: 'Cleaning Services Quotation Review',
      vendor: 'CleanPro Services',
      status: 'pending',
      priority: 'medium',
      deadline: '2025-10-18',
      lastUpdate: '1 day ago',
      unreadMessages: 0,
      documents: 3,
      assignedTo: 'Sarah Johnson'
    },
    {
      id: 'APR-2025-023',
      type: 'approval',
      title: 'Contract Amendment Approval',
      vendor: 'Global Logistics Ltd',
      status: 'pending',
      priority: 'high',
      deadline: '2025-10-11',
      lastUpdate: '4 hours ago',
      unreadMessages: 2,
      documents: 4,
      assignedTo: 'David Martinez'
    },
    {
      id: 'DOC-2025-156',
      type: 'document',
      title: 'Compliance Certificate Submission',
      vendor: 'SafetyFirst Suppliers',
      status: 'in-progress',
      priority: 'medium',
      deadline: '2025-10-20',
      lastUpdate: '3 hours ago',
      unreadMessages: 1,
      documents: 2,
      assignedTo: 'Sarah Johnson'
    },
    {
      id: 'RFQ-2025-002',
      type: 'rfq',
      title: 'Raw Materials Sourcing',
      vendor: 'MaterialSource Inc',
      status: 'approved',
      priority: 'low',
      deadline: '2025-10-25',
      lastUpdate: '2 days ago',
      unreadMessages: 0,
      documents: 6,
      assignedTo: 'Michael Chen'
    }
  ]);

  // Mock data for messages
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'Sarah Johnson',
      senderRole: 'procurement',
      content: 'Hello, we need the updated quotation with the revised delivery terms by end of day.',
      timestamp: '2025-10-10 09:30 AM',
      read: true
    },
    {
      id: '2',
      sender: 'John Smith (Premium Office Solutions)',
      senderRole: 'vendor',
      content: 'Thank you for the clarification. We\'ll send the revised quotation within 2 hours.',
      timestamp: '2025-10-10 10:15 AM',
      read: true
    },
    {
      id: '3',
      sender: 'John Smith (Premium Office Solutions)',
      senderRole: 'vendor',
      content: 'Please find attached the revised quotation with updated delivery terms.',
      timestamp: '2025-10-10 12:45 PM',
      attachments: ['Revised_Quotation_v2.pdf', 'Delivery_Schedule.xlsx'],
      read: false
    },
    {
      id: '4',
      sender: 'Sarah Johnson',
      senderRole: 'procurement',
      content: 'Can you also include the warranty details in the quotation?',
      timestamp: '2025-10-10 01:30 PM',
      read: false
    }
  ]);

  // Mock data for notifications
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'message',
      title: 'New message from Premium Office Solutions',
      description: 'Revised quotation has been submitted',
      timestamp: '10 minutes ago',
      read: false,
      priority: 'high'
    },
    {
      id: '2',
      type: 'deadline',
      title: 'Approaching Deadline',
      description: 'Contract Amendment Approval due in 1 day',
      timestamp: '2 hours ago',
      read: false,
      priority: 'high'
    },
    {
      id: '3',
      type: 'approval',
      title: 'Approval Required',
      description: 'New bid submission awaiting your review',
      timestamp: '4 hours ago',
      read: true,
      priority: 'medium'
    },
    {
      id: '4',
      type: 'document',
      title: 'Document Uploaded',
      description: 'TechSource Corp uploaded compliance certificate',
      timestamp: '1 day ago',
      read: true,
      priority: 'low'
    }
  ]);

  const documents: DocumentItem[] = [
    { name: 'RFQ_Requirements.pdf', size: '2.4 MB', uploadedBy: 'Sarah Johnson', date: '2025-10-08', type: 'pdf' },
    { name: 'Technical_Specifications.docx', size: '1.8 MB', uploadedBy: 'Sarah Johnson', date: '2025-10-08', type: 'docx' },
    { name: 'Quotation_v1.pdf', size: '856 KB', uploadedBy: 'Premium Office Solutions', date: '2025-10-09', type: 'pdf' },
    { name: 'Revised_Quotation_v2.pdf', size: '912 KB', uploadedBy: 'Premium Office Solutions', date: '2025-10-10', type: 'pdf' },
    { name: 'Delivery_Schedule.xlsx', size: '124 KB', uploadedBy: 'Premium Office Solutions', date: '2025-10-10', type: 'xlsx' }
  ];

  const teamMembers = [
    'Sarah Johnson',
    'Michael Chen',
    'David Martinez',
    'Emily Wong',
    'Robert Brown'
  ];

  const getStatusColor = (status: string) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
      'awaiting-response': 'bg-orange-100 text-orange-800 border-orange-200',
      'approved': 'bg-green-100 text-green-800 border-green-200',
      'rejected': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'high': 'bg-red-100 text-red-800 border-red-200',
      'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'low': 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      'rfq': FileText,
      'bid': TrendingUp,
      'quotation': FileText,
      'approval': CheckCircle,
      'document': Paperclip
    };
    const Icon = icons[type as keyof typeof icons] || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const filteredItems = collaborationItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || item.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        sender: 'You',
        senderRole: 'procurement',
        content: newMessage,
        timestamp: new Date().toLocaleString(),
        read: true
      };
      setMessages([...messages, message]);
      setNewMessage('');
      toast.success('Message sent successfully');
    }
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const handleQuickUpload = () => {
    if (uploadFiles.length === 0 || !uploadCategory) {
      toast.error('Please select files and category');
      return;
    }
    toast.success(`${uploadFiles.length} file(s) uploaded successfully to ${uploadCategory}`);
    setUploadFiles([]);
    setUploadCategory('');
    setShowQuickUpload(false);
  };

  const handleApproveRequest = () => {
    if (!approvalComments.trim()) {
      toast.error('Please add approval comments');
      return;
    }
    if (selectedItem) {
      setCollaborationItems(collaborationItems.map(item =>
        item.id === selectedItem.id ? { ...item, status: 'approved' } : item
      ));
      toast.success('Request approved successfully');
      setApprovalComments('');
      setShowApproveDialog(false);
    }
  };

  const handleUploadQuotation = () => {
    if (uploadFiles.length === 0) {
      toast.error('Please select quotation files');
      return;
    }
    toast.success('Quotation uploaded successfully');
    setUploadFiles([]);
    setShowUploadQuotation(false);
  };

  const handleRequestClarification = () => {
    if (!clarificationMessage.trim()) {
      toast.error('Please enter clarification message');
      return;
    }
    const message: Message = {
      id: Date.now().toString(),
      sender: 'You',
      senderRole: 'procurement',
      content: clarificationMessage,
      timestamp: new Date().toLocaleString(),
      read: true
    };
    setMessages([...messages, message]);
    toast.success('Clarification request sent');
    setClarificationMessage('');
    setShowRequestClarification(false);
  };

  const handleAssignTeamMember = () => {
    if (!selectedTeamMember) {
      toast.error('Please select a team member');
      return;
    }
    if (selectedItem) {
      setCollaborationItems(collaborationItems.map(item =>
        item.id === selectedItem.id ? { ...item, assignedTo: selectedTeamMember } : item
      ));
      toast.success(`Assigned to ${selectedTeamMember}`);
      setSelectedTeamMember('');
      setShowAssignTeam(false);
    }
  };

  const handleScheduleMeeting = () => {
    if (!meetingTitle || !meetingDate || !meetingTime) {
      toast.error('Please fill in all meeting details');
      return;
    }
    toast.success('Meeting scheduled successfully');
    setMeetingTitle('');
    setMeetingDate(undefined);
    setMeetingTime('');
    setShowScheduleMeeting(false);
  };

  const handleGenerateReport = () => {
    if (!reportType) {
      toast.error('Please select a report type');
      return;
    }
    toast.success(`${reportType} report generated successfully`);
    setReportType('');
    setShowGenerateReport(false);
  };

  const handleStatusUpdate = () => {
    if (!statusUpdate || !statusNote.trim()) {
      toast.error('Please select status and add a note');
      return;
    }
    if (selectedItem) {
      setCollaborationItems(collaborationItems.map(item =>
        item.id === selectedItem.id 
          ? { ...item, status: statusUpdate as any, lastUpdate: 'Just now' } 
          : item
      ));
      toast.success('Status updated successfully');
      setStatusUpdate('');
      setStatusNote('');
    }
  };

  const handleViewDocument = (doc: DocumentItem) => {
    setSelectedDocument(doc);
    setShowViewDocument(true);
  };

  const handleDownloadDocument = (docName: string) => {
    toast.success(`Downloading ${docName}`);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadFiles(Array.from(e.target.files));
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;
  const unreadMessages = messages.filter(m => !m.read).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900">Procurement Collaboration</h1>
          <p className="text-slate-600 mt-1">
            Manage ongoing requests, approvals, and vendor communications
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Notifications Dialog */}
          <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
            <DialogTrigger asChild>
              <Button variant="outline" className="relative">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
                {unreadNotifications > 0 && (
                  <Badge className="ml-2 bg-red-500">{unreadNotifications}</Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Notifications</DialogTitle>
                <DialogDescription>
                  Stay updated with your collaboration activities
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border cursor-pointer hover:bg-slate-50 transition-colors ${
                        notification.read ? 'bg-white' : 'bg-blue-50 border-blue-200'
                      }`}
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {notification.type === 'message' && <MessageSquare className="h-4 w-4 text-blue-600" />}
                            {notification.type === 'approval' && <CheckCircle className="h-4 w-4 text-green-600" />}
                            {notification.type === 'document' && <FileText className="h-4 w-4 text-purple-600" />}
                            {notification.type === 'deadline' && <Clock className="h-4 w-4 text-orange-600" />}
                            <span className="text-slate-900">{notification.title}</span>
                          </div>
                          <p className="text-slate-600 text-sm">{notification.description}</p>
                          <p className="text-slate-400 text-xs mt-1">{notification.timestamp}</p>
                        </div>
                        <Badge className={getPriorityColor(notification.priority)}>
                          {notification.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>

          {/* Quick Upload Dialog */}
          <Dialog open={showQuickUpload} onOpenChange={setShowQuickUpload}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Quick Upload
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Quick Upload Documents</DialogTitle>
                <DialogDescription>
                  Upload documents to the current collaboration
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Document Category</Label>
                  <Select value={uploadCategory} onValueChange={setUploadCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rfq">RFQ Documents</SelectItem>
                      <SelectItem value="quotation">Quotations</SelectItem>
                      <SelectItem value="technical">Technical Specifications</SelectItem>
                      <SelectItem value="compliance">Compliance Documents</SelectItem>
                      <SelectItem value="contract">Contract Documents</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Select Files</Label>
                  <Input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="cursor-pointer"
                  />
                  {uploadFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {uploadFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-slate-600" />
                            <span className="text-sm text-slate-900">{file.name}</span>
                          </div>
                          <span className="text-xs text-slate-500">{(file.size / 1024).toFixed(2)} KB</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <Label>Description (Optional)</Label>
                  <Textarea placeholder="Add a description for these documents..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowQuickUpload(false)}>
                  Cancel
                </Button>
                <Button onClick={handleQuickUpload}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Active Requests</p>
                <p className="text-slate-900 text-2xl mt-1">
                  {collaborationItems.filter(i => i.status !== 'approved' && i.status !== 'rejected').length}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Unread Messages</p>
                <p className="text-slate-900 text-2xl mt-1">{unreadMessages}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Pending Approvals</p>
                <p className="text-slate-900 text-2xl mt-1">
                  {collaborationItems.filter(i => i.status === 'pending').length}
                </p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">High Priority</p>
                <p className="text-slate-900 text-2xl mt-1">
                  {collaborationItems.filter(i => i.priority === 'high').length}
                </p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Collaboration Items List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Active Collaborations</CardTitle>
              <CardDescription>Ongoing requests and discussions</CardDescription>
              
              {/* Search and Filters */}
              <div className="space-y-3 pt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by title, vendor, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="awaiting-response">Awaiting Response</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                        selectedItem?.id === item.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-blue-300'
                      }`}
                      onClick={() => setSelectedItem(item)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(item.type)}
                          <span className="text-slate-900 text-sm">{item.id}</span>
                        </div>
                        <Badge className={getPriorityColor(item.priority)}>
                          {item.priority}
                        </Badge>
                      </div>
                      <h4 className="text-slate-900 mb-1">{item.title}</h4>
                      <p className="text-slate-600 text-sm mb-2">{item.vendor}</p>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className={getStatusColor(item.status)} variant="outline">
                          {item.status.replace('-', ' ')}
                        </Badge>
                        <div className="flex items-center gap-1 text-slate-500 text-xs">
                          <Calendar className="h-3 w-3" />
                          <span>Due: {item.deadline}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Updated {item.lastUpdate}</span>
                        <div className="flex items-center gap-3">
                          {item.unreadMessages > 0 && (
                            <div className="flex items-center gap-1 text-blue-600">
                              <MessageSquare className="h-3 w-3" />
                              <span>{item.unreadMessages}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Paperclip className="h-3 w-3" />
                            <span>{item.documents}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Details and Actions */}
        <div className="lg:col-span-2">
          {selectedItem ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle>{selectedItem.title}</CardTitle>
                      <Badge className={getPriorityColor(selectedItem.priority)}>
                        {selectedItem.priority} priority
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span>{selectedItem.id}</span>
                      <span>•</span>
                      <span>{selectedItem.vendor}</span>
                      <span>•</span>
                      <span>Assigned to {selectedItem.assignedTo}</span>
                    </div>
                  </div>
                  <Badge className={getStatusColor(selectedItem.status)}>
                    {selectedItem.status.replace('-', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="messages">
                      Messages
                      {unreadMessages > 0 && (
                        <Badge className="ml-2 bg-blue-500">{unreadMessages}</Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="actions">Actions</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-slate-600 text-sm mb-1">Deadline</p>
                        <p className="text-slate-900">{selectedItem.deadline}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-slate-600 text-sm mb-1">Last Update</p>
                        <p className="text-slate-900">{selectedItem.lastUpdate}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-slate-600 text-sm mb-1">Type</p>
                        <p className="text-slate-900 capitalize">{selectedItem.type}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-slate-600 text-sm mb-1">Assigned To</p>
                        <p className="text-slate-900">{selectedItem.assignedTo}</p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-slate-900 mb-3">Quick Actions</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="justify-start" onClick={() => setShowViewDetails(true)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View {selectedItem.type.toUpperCase()}
                        </Button>
                        <Button variant="outline" className="justify-start" onClick={() => toast.success('Downloading all documents')}>
                          <Download className="h-4 w-4 mr-2" />
                          Download All Docs
                        </Button>
                        <Button variant="outline" className="justify-start" onClick={() => setShowUploadQuotation(true)}>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Response
                        </Button>
                        <Button variant="outline" className="justify-start" onClick={() => setActiveTab('messages')}>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Send Message
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-slate-900 mb-3">Activity Timeline</h4>
                      <div className="space-y-4">
                        {[
                          { action: 'Document uploaded by vendor', time: '2 hours ago', user: selectedItem.vendor },
                          { action: 'Message sent', time: '4 hours ago', user: selectedItem.assignedTo },
                          { action: 'Status updated to In Progress', time: '1 day ago', user: selectedItem.assignedTo },
                          { action: 'Request created', time: '3 days ago', user: selectedItem.assignedTo }
                        ].map((activity, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                            </div>
                            <div className="flex-1">
                              <p className="text-slate-900 text-sm">{activity.action}</p>
                              <p className="text-slate-500 text-xs">{activity.user} • {activity.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="messages" className="space-y-4">
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.senderRole === 'procurement' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[80%] ${message.senderRole === 'procurement' ? 'order-2' : ''}`}>
                              <div className="flex items-center gap-2 mb-1">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {message.sender.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-slate-900 text-sm">{message.sender}</span>
                                <span className="text-slate-400 text-xs">{message.timestamp}</span>
                              </div>
                              <div
                                className={`p-3 rounded-lg ${
                                  message.senderRole === 'procurement'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 text-slate-900'
                                }`}
                              >
                                <p className="text-sm">{message.content}</p>
                                {message.attachments && message.attachments.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {message.attachments.map((attachment, index) => (
                                      <div
                                        key={index}
                                        className={`flex items-center gap-2 p-2 rounded ${
                                          message.senderRole === 'procurement'
                                            ? 'bg-blue-700'
                                            : 'bg-slate-200'
                                        }`}
                                      >
                                        <Paperclip className="h-3 w-3" />
                                        <span className="text-xs flex-1">{attachment}</span>
                                        <Download className="h-3 w-3 cursor-pointer" onClick={() => handleDownloadDocument(attachment)} />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    <Separator />

                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="min-h-[80px]"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <div className="flex flex-col gap-2">
                        <Button size="icon" variant="outline" onClick={() => document.getElementById('message-file-input')?.click()}>
                          <Paperclip className="h-4 w-4" />
                        </Button>
                        <input
                          id="message-file-input"
                          type="file"
                          multiple
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                        <Button size="icon" onClick={handleSendMessage}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="documents" className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-slate-900">Shared Documents ({documents.length})</h4>
                      <Button onClick={() => setShowQuickUpload(true)}>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Document
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {documents.map((doc, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-blue-100 rounded flex items-center justify-center">
                              <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-slate-900 text-sm">{doc.name}</p>
                              <p className="text-slate-500 text-xs">
                                {doc.size} • Uploaded by {doc.uploadedBy} on {doc.date}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" onClick={() => handleViewDocument(doc)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDownloadDocument(doc.name)}>
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="actions" className="space-y-4">
                    <div className="space-y-4">
                      {/* Primary Actions */}
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="text-slate-900 mb-2">Primary Actions</h4>
                        <div className="space-y-2">
                          <Button 
                            className="w-full justify-start" 
                            variant="default"
                            onClick={() => setShowApproveDialog(true)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve Request
                          </Button>
                          <Button 
                            className="w-full justify-start" 
                            variant="outline"
                            onClick={() => setShowUploadQuotation(true)}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Quotation Response
                          </Button>
                          <Button 
                            className="w-full justify-start" 
                            variant="outline"
                            onClick={() => setShowRequestClarification(true)}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Request Clarification
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      {/* Collaboration Tools */}
                      <div>
                        <h4 className="text-slate-900 mb-3">Collaboration Tools</h4>
                        <div className="space-y-2">
                          <Button 
                            variant="outline" 
                            className="w-full justify-start"
                            onClick={() => setShowAssignTeam(true)}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            Assign Team Member
                          </Button>
                          <Button 
                            variant="outline" 
                            className="w-full justify-start"
                            onClick={() => setShowScheduleMeeting(true)}
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Schedule Meeting
                          </Button>
                          <Button 
                            variant="outline" 
                            className="w-full justify-start"
                            onClick={() => setShowGenerateReport(true)}
                          >
                            <BarChart className="h-4 w-4 mr-2" />
                            Generate Report
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      {/* Status Management */}
                      <div>
                        <h4 className="text-slate-900 mb-3">Status Management</h4>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-slate-700 text-sm mb-2 block">Update Status</Label>
                            <Select value={statusUpdate} onValueChange={setStatusUpdate}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select new status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="in-progress">In Progress</SelectItem>
                                <SelectItem value="awaiting-response">Awaiting Response</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-slate-700 text-sm mb-2 block">Add Note</Label>
                            <Textarea 
                              placeholder="Add status update note..." 
                              className="min-h-[100px]"
                              value={statusNote}
                              onChange={(e) => setStatusNote(e.target.value)}
                            />
                          </div>
                          <Button className="w-full" onClick={handleStatusUpdate}>
                            Update Status
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-12">
                <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-slate-900 mb-2">Select a Collaboration Item</h3>
                <p className="text-slate-600">
                  Choose an item from the list to view details and take actions
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* View Document Dialog */}
      <Dialog open={showViewDocument} onOpenChange={setShowViewDocument}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
            <DialogDescription>
              {selectedDocument?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-slate-100 rounded-lg p-8 flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">Document preview not available</p>
                <p className="text-slate-500 text-sm mt-2">
                  {selectedDocument?.name} • {selectedDocument?.size}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="text-slate-900 text-sm">Uploaded by {selectedDocument?.uploadedBy}</p>
                <p className="text-slate-500 text-xs">on {selectedDocument?.date}</p>
              </div>
              <Button onClick={() => selectedDocument && handleDownloadDocument(selectedDocument.name)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approve Request Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Request</DialogTitle>
            <DialogDescription>
              Review and approve {selectedItem?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-900">Ready to approve</span>
              </div>
              <p className="text-green-700 text-sm">
                This action will approve the request and notify the vendor.
              </p>
            </div>
            <div>
              <Label>Approval Comments</Label>
              <Textarea
                placeholder="Add your approval comments..."
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApproveRequest}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Quotation Dialog */}
      <Dialog open={showUploadQuotation} onOpenChange={setShowUploadQuotation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Quotation Response</DialogTitle>
            <DialogDescription>
              Upload quotation documents for {selectedItem?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Quotation Files</Label>
              <Input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              {uploadFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  {uploadFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-600" />
                        <span className="text-sm text-slate-900">{file.name}</span>
                      </div>
                      <span className="text-xs text-slate-500">{(file.size / 1024).toFixed(2)} KB</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label>Comments</Label>
              <Textarea placeholder="Add any comments about the quotation..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadQuotation(false)}>
              Cancel
            </Button>
            <Button onClick={handleUploadQuotation}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Quotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Clarification Dialog */}
      <Dialog open={showRequestClarification} onOpenChange={setShowRequestClarification}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Clarification</DialogTitle>
            <DialogDescription>
              Send a clarification request to {selectedItem?.vendor}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Clarification Message</Label>
              <Textarea
                placeholder="Enter your clarification request..."
                value={clarificationMessage}
                onChange={(e) => setClarificationMessage(e.target.value)}
                className="min-h-[150px]"
              />
            </div>
            <div>
              <Label>Template (Optional)</Label>
              <Select onValueChange={(value) => setClarificationMessage(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Please provide more details about the delivery timeline.">Delivery Timeline</SelectItem>
                  <SelectItem value="We need clarification on the pricing structure mentioned in your quotation.">Pricing Clarification</SelectItem>
                  <SelectItem value="Could you provide additional technical specifications?">Technical Specs</SelectItem>
                  <SelectItem value="Please clarify the payment terms and conditions.">Payment Terms</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestClarification(false)}>
              Cancel
            </Button>
            <Button onClick={handleRequestClarification}>
              <Send className="h-4 w-4 mr-2" />
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Team Member Dialog */}
      <Dialog open={showAssignTeam} onOpenChange={setShowAssignTeam}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Team Member</DialogTitle>
            <DialogDescription>
              Assign a team member to {selectedItem?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Team Member</Label>
              <Select value={selectedTeamMember} onValueChange={setSelectedTeamMember}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a team member" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member} value={member}>
                      {member}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Assignment Note (Optional)</Label>
              <Textarea placeholder="Add a note for the team member..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignTeam(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignTeamMember}>
              <UserPlus className="h-4 w-4 mr-2" />
              Assign Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Meeting Dialog */}
      <Dialog open={showScheduleMeeting} onOpenChange={setShowScheduleMeeting}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule Meeting</DialogTitle>
            <DialogDescription>
              Schedule a meeting with {selectedItem?.vendor}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Meeting Title</Label>
              <Input
                placeholder="Enter meeting title..."
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="mr-2 h-4 w-4" />
                      {meetingDate ? meetingDate.toLocaleDateString() : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={meetingDate}
                      onSelect={setMeetingDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Time</Label>
                <Input
                  type="time"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Participants</Label>
              <Input placeholder="Enter email addresses separated by commas..." />
            </div>
            <div>
              <Label>Agenda</Label>
              <Textarea placeholder="Enter meeting agenda..." className="min-h-[100px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleMeeting(false)}>
              Cancel
            </Button>
            <Button onClick={handleScheduleMeeting}>
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Meeting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Report Dialog */}
      <Dialog open={showGenerateReport} onOpenChange={setShowGenerateReport}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Report</DialogTitle>
            <DialogDescription>
              Generate a detailed report for {selectedItem?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Collaboration Summary">Collaboration Summary</SelectItem>
                  <SelectItem value="Communication History">Communication History</SelectItem>
                  <SelectItem value="Document Inventory">Document Inventory</SelectItem>
                  <SelectItem value="Timeline Report">Timeline Report</SelectItem>
                  <SelectItem value="Complete Audit Trail">Complete Audit Trail</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" placeholder="From" />
                <Input type="date" placeholder="To" />
              </div>
            </div>
            <div>
              <Label>Format</Label>
              <Select defaultValue="pdf">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                  <SelectItem value="csv">CSV File</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateReport(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateReport}>
              <BarChart className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog - Comprehensive for RFQ/BID/Quotation/Approval */}
      <Dialog open={showViewDetails} onOpenChange={setShowViewDetails}>
        <DialogContent className="max-w-5xl w-[90vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedItem?.type === 'rfq' && 'RFQ Details'}
              {selectedItem?.type === 'bid' && 'BID Details'}
              {selectedItem?.type === 'quotation' && 'Quotation Details'}
              {selectedItem?.type === 'approval' && 'Approval Workflow'}
            </DialogTitle>
            <DialogDescription>
              Complete details for {selectedItem?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-6">
              {/* Header Information */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-xs text-slate-500 mb-1">ID</p>
                  <p className="font-semibold text-slate-900">{selectedItem.id}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Status</p>
                  <Badge className={getStatusColor(selectedItem.status)}>
                    {selectedItem.status.replace('-', ' ')}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Priority</p>
                  <Badge className={getPriorityColor(selectedItem.priority)}>
                    {selectedItem.priority}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Deadline</p>
                  <p className="font-medium text-slate-900">{selectedItem.deadline}</p>
                </div>
              </div>

              {/* RFQ Specific Content */}
              {selectedItem.type === 'rfq' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-slate-700">Vendor</Label>
                        <p className="mt-1 text-slate-900">{selectedItem.vendor}</p>
                      </div>
                      <div>
                        <Label className="text-slate-700">Project Title</Label>
                        <p className="mt-1 text-slate-900">{selectedItem.title}</p>
                      </div>
                      <div>
                        <Label className="text-slate-700">Assigned To</Label>
                        <p className="mt-1 text-slate-900">{selectedItem.assignedTo}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-slate-700">Budget Estimate</Label>
                        <p className="mt-1 text-slate-900 text-lg font-semibold">$125,000 - $150,000</p>
                      </div>
                      <div>
                        <Label className="text-slate-700">Expected Vendors</Label>
                        <p className="mt-1 text-slate-900">5 vendors invited</p>
                      </div>
                      <div>
                        <Label className="text-slate-700">Response Deadline</Label>
                        <p className="mt-1 text-slate-900">{selectedItem.deadline}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-slate-700">Requirements</Label>
                    <div className="mt-2 p-4 bg-slate-50 rounded-lg space-y-2">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-900">Modern ergonomic office furniture for 50 workstations</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-900">Adjustable height desks with cable management</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-900">Ergonomic chairs with lumbar support</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-900">Installation and setup services included</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-900">3-year warranty on all furniture items</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-700">Evaluation Criteria</Label>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-600">Price</span>
                          <span className="text-sm font-semibold text-slate-900">40%</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 w-[40%]"></div>
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-600">Quality</span>
                          <span className="text-sm font-semibold text-slate-900">30%</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-green-600 w-[30%]"></div>
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-600">Delivery Time</span>
                          <span className="text-sm font-semibold text-slate-900">20%</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-600 w-[20%]"></div>
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-600">Warranty</span>
                          <span className="text-sm font-semibold text-slate-900">10%</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-600 w-[10%]"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* BID Specific Content */}
              {selectedItem.type === 'bid' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-slate-700">Vendor</Label>
                        <p className="mt-1 text-slate-900">{selectedItem.vendor}</p>
                      </div>
                      <div>
                        <Label className="text-slate-700">Bid Title</Label>
                        <p className="mt-1 text-slate-900">{selectedItem.title}</p>
                      </div>
                      <div>
                        <Label className="text-slate-700">Bid Amount</Label>
                        <p className="mt-1 text-slate-900 text-lg font-semibold text-green-600">$247,500</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-slate-700">Submitted Date</Label>
                        <p className="mt-1 text-slate-900">2025-10-05</p>
                      </div>
                      <div>
                        <Label className="text-slate-700">Valid Until</Label>
                        <p className="mt-1 text-slate-900">2025-11-05</p>
                      </div>
                      <div>
                        <Label className="text-slate-700">Evaluator</Label>
                        <p className="mt-1 text-slate-900">{selectedItem.assignedTo}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-slate-700">Bid Components</Label>
                    <div className="mt-2 border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-slate-50 border-b">
                            <th className="text-left p-3 text-sm font-medium text-slate-700">Item</th>
                            <th className="text-right p-3 text-sm font-medium text-slate-700">Quantity</th>
                            <th className="text-right p-3 text-sm font-medium text-slate-700">Unit Price</th>
                            <th className="text-right p-3 text-sm font-medium text-slate-700">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="p-3 text-sm text-slate-900">Dell Latitude 5430 Laptops</td>
                            <td className="p-3 text-sm text-slate-900 text-right">150</td>
                            <td className="p-3 text-sm text-slate-900 text-right">$1,200</td>
                            <td className="p-3 text-sm font-semibold text-slate-900 text-right">$180,000</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-3 text-sm text-slate-900">Dell UltraSharp Monitors 27"</td>
                            <td className="p-3 text-sm text-slate-900 text-right">150</td>
                            <td className="p-3 text-sm text-slate-900 text-right">$350</td>
                            <td className="p-3 text-sm font-semibold text-slate-900 text-right">$52,500</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-3 text-sm text-slate-900">Docking Stations</td>
                            <td className="p-3 text-sm text-slate-900 text-right">150</td>
                            <td className="p-3 text-sm text-slate-900 text-right">$80</td>
                            <td className="p-3 text-sm font-semibold text-slate-900 text-right">$12,000</td>
                          </tr>
                          <tr className="border-b bg-slate-50">
                            <td className="p-3 text-sm text-slate-900" colSpan={3}>Installation & Setup Services</td>
                            <td className="p-3 text-sm font-semibold text-slate-900 text-right">$3,000</td>
                          </tr>
                          <tr className="bg-slate-100">
                            <td className="p-3 text-sm font-semibold text-slate-900" colSpan={3}>Total Bid Amount</td>
                            <td className="p-3 text-lg font-bold text-green-600 text-right">$247,500</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-700">Terms & Conditions</Label>
                    <div className="mt-2 p-4 bg-slate-50 rounded-lg text-sm text-slate-700 space-y-2">
                      <p>• Payment terms: Net 30 days from delivery</p>
                      <p>• Delivery timeframe: 4-6 weeks from purchase order</p>
                      <p>• Warranty: 3 years parts and labor</p>
                      <p>• Installation included at no additional cost</p>
                      <p>• Price valid for 30 days from submission</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-700">Evaluation Score</Label>
                    <div className="mt-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-700 font-medium">Overall Score</span>
                        <span className="text-2xl font-bold text-green-600">87/100</span>
                      </div>
                      <div className="space-y-2 text-sm text-slate-600">
                        <div className="flex justify-between">
                          <span>Price Competitiveness: 42/50</span>
                          <span>Technical Compliance: 45/50</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quotation Specific Content */}
              {selectedItem.type === 'quotation' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-slate-700">Vendor</Label>
                        <p className="mt-1 text-slate-900">{selectedItem.vendor}</p>
                      </div>
                      <div>
                        <Label className="text-slate-700">Service Description</Label>
                        <p className="mt-1 text-slate-900">{selectedItem.title}</p>
                      </div>
                      <div>
                        <Label className="text-slate-700">Quotation Number</Label>
                        <p className="mt-1 text-slate-900 font-mono">QUO-{selectedItem.id}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-slate-700">Quoted Amount</Label>
                        <p className="mt-1 text-slate-900 text-lg font-semibold text-blue-600">$8,750/month</p>
                      </div>
                      <div>
                        <Label className="text-slate-700">Contract Duration</Label>
                        <p className="mt-1 text-slate-900">12 months</p>
                      </div>
                      <div>
                        <Label className="text-slate-700">Reviewer</Label>
                        <p className="mt-1 text-slate-900">{selectedItem.assignedTo}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-slate-700">Service Breakdown</Label>
                    <div className="mt-2 border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-slate-50 border-b">
                            <th className="text-left p-3 text-sm font-medium text-slate-700">Service</th>
                            <th className="text-center p-3 text-sm font-medium text-slate-700">Frequency</th>
                            <th className="text-right p-3 text-sm font-medium text-slate-700">Monthly Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="p-3 text-sm text-slate-900">Office Deep Cleaning</td>
                            <td className="p-3 text-sm text-slate-900 text-center">Weekly</td>
                            <td className="p-3 text-sm font-semibold text-slate-900 text-right">$4,000</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-3 text-sm text-slate-900">Restroom Maintenance</td>
                            <td className="p-3 text-sm text-slate-900 text-center">Daily</td>
                            <td className="p-3 text-sm font-semibold text-slate-900 text-right">$2,500</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-3 text-sm text-slate-900">Window Cleaning</td>
                            <td className="p-3 text-sm text-slate-900 text-center">Bi-weekly</td>
                            <td className="p-3 text-sm font-semibold text-slate-900 text-right">$1,250</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-3 text-sm text-slate-900">Carpet Cleaning</td>
                            <td className="p-3 text-sm text-slate-900 text-center">Monthly</td>
                            <td className="p-3 text-sm font-semibold text-slate-900 text-right">$1,000</td>
                          </tr>
                          <tr className="bg-slate-100">
                            <td className="p-3 text-sm font-semibold text-slate-900" colSpan={2}>Total Monthly Cost</td>
                            <td className="p-3 text-lg font-bold text-blue-600 text-right">$8,750</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-700">Additional Services Available</Label>
                      <div className="mt-2 p-3 bg-slate-50 rounded-lg text-sm text-slate-700 space-y-1">
                        <p>• Emergency cleaning: $150/hour</p>
                        <p>• Deep carpet shampooing: $500/service</p>
                        <p>• Event cleanup: $200/event</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-slate-700">Payment Terms</Label>
                      <div className="mt-2 p-3 bg-slate-50 rounded-lg text-sm text-slate-700 space-y-1">
                        <p>• Billing: Monthly in advance</p>
                        <p>• Payment: Net 15 days</p>
                        <p>• Auto-renewal: Yes (60-day notice)</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Approval Workflow Content */}
              {selectedItem.type === 'approval' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-slate-700">Approval Request</Label>
                        <p className="mt-1 text-slate-900">{selectedItem.title}</p>
                      </div>
                      <div>
                        <Label className="text-slate-700">Vendor</Label>
                        <p className="mt-1 text-slate-900">{selectedItem.vendor}</p>
                      </div>
                      <div>
                        <Label className="text-slate-700">Requested By</Label>
                        <p className="mt-1 text-slate-900">{selectedItem.assignedTo}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-slate-700">Request Date</Label>
                        <p className="mt-1 text-slate-900">2025-10-08</p>
                      </div>
                      <div>
                        <Label className="text-slate-700">Amount</Label>
                        <p className="mt-1 text-slate-900 text-lg font-semibold text-orange-600">$45,000</p>
                      </div>
                      <div>
                        <Label className="text-slate-700">Approval Deadline</Label>
                        <p className="mt-1 text-slate-900">{selectedItem.deadline}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-slate-700">Approval Workflow</Label>
                    <div className="mt-2 space-y-3">
                      {/* Step 1 - Approved */}
                      <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="h-10 w-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-slate-900">Department Manager Approval</p>
                            <Badge className="bg-green-100 text-green-700 border-green-300">Approved</Badge>
                          </div>
                          <p className="text-sm text-slate-600 mb-1">Sarah Johnson</p>
                          <p className="text-sm text-slate-700">Approved on Oct 9, 2025 at 10:30 AM</p>
                          <p className="text-sm text-slate-600 italic mt-2">"Contract terms are acceptable. Proceeding to finance review."</p>
                        </div>
                      </div>

                      {/* Step 2 - Approved */}
                      <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="h-10 w-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-slate-900">Finance Review</p>
                            <Badge className="bg-green-100 text-green-700 border-green-300">Approved</Badge>
                          </div>
                          <p className="text-sm text-slate-600 mb-1">Michael Chen</p>
                          <p className="text-sm text-slate-700">Approved on Oct 9, 2025 at 2:15 PM</p>
                          <p className="text-sm text-slate-600 italic mt-2">"Budget allocation confirmed. Amendment aligns with financial policies."</p>
                        </div>
                      </div>

                      {/* Step 3 - Pending */}
                      <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="h-10 w-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Clock className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-slate-900">Legal Review</p>
                            <Badge className="bg-orange-100 text-orange-700 border-orange-300">Pending</Badge>
                          </div>
                          <p className="text-sm text-slate-600 mb-1">David Martinez</p>
                          <p className="text-sm text-slate-700">Awaiting review</p>
                          <p className="text-sm text-slate-600 mt-2">Legal department needs to review contract amendments and compliance requirements.</p>
                        </div>
                      </div>

                      {/* Step 4 - Not Started */}
                      <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg opacity-60">
                        <div className="h-10 w-10 bg-slate-400 rounded-full flex items-center justify-center flex-shrink-0">
                          <Clock className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-slate-900">Executive Approval</p>
                            <Badge variant="outline" className="bg-slate-100 text-slate-600">Not Started</Badge>
                          </div>
                          <p className="text-sm text-slate-600 mb-1">CEO/CFO</p>
                          <p className="text-sm text-slate-700">Pending previous approvals</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-700">Amendment Details</Label>
                    <div className="mt-2 p-4 bg-slate-50 rounded-lg text-sm text-slate-700 space-y-2">
                      <p><strong>Original Contract Value:</strong> $120,000/year</p>
                      <p><strong>Amended Contract Value:</strong> $165,000/year (+37.5%)</p>
                      <p><strong>Reason for Amendment:</strong> Additional service coverage for new warehouse facility</p>
                      <p><strong>Effective Date:</strong> November 1, 2025</p>
                      <p><strong>Contract Extension:</strong> 24 months from effective date</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Common Documents Section */}
              <Separator />
              <div>
                <Label className="text-slate-700 mb-3 block">Attached Documents ({selectedItem.documents})</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: 'Requirements.pdf', size: '2.4 MB', date: '2025-10-05' },
                    { name: 'Technical_Specs.xlsx', size: '1.1 MB', date: '2025-10-05' },
                    { name: 'Terms_Conditions.pdf', size: '856 KB', date: '2025-10-06' },
                    { name: 'Vendor_Proposal.pdf', size: '3.2 MB', date: '2025-10-08' }
                  ].slice(0, selectedItem.documents).map((doc, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors">
                      <FileText className="h-8 w-8 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{doc.name}</p>
                        <p className="text-xs text-slate-500">{doc.size} • {doc.date}</p>
                      </div>
                      <Download className="h-4 w-4 text-slate-400 hover:text-slate-600 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowViewDetails(false)}>
              Close
            </Button>
            <Button variant="outline" onClick={() => toast.success('Downloaded all documents')}>
              <Download className="h-4 w-4 mr-2" />
              Download All
            </Button>
            {selectedItem?.type === 'approval' && selectedItem.status === 'pending' && (
              <Button onClick={() => {
                setShowViewDetails(false);
                setShowApproveDialog(true);
              }}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Review & Approve
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
