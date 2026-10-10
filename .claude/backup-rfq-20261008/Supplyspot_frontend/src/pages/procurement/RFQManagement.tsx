import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useApi } from '@/hooks/useApi';
import { rfqService } from '@/services/api';
import { rfqData, quotationData, clarificationData } from '@/data/rfqMockData';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DatePicker } from '@/components/ui/date-picker';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
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
import { DraggableTableRow, DraggableTableHeader } from '@/components/ui/draggable-table-row';

// Mock datasets imported from '@/data/rfqMockData'



interface RFQManagementProps {
  onNavigate?: (section: any) => void;
}

export function RFQManagement({ onNavigate }: RFQManagementProps) {
  const [activeTab, setActiveTab] = useState('rfqs');
  const [rfqs, setRFQs] = useState(rfqData);
  const { data: rfqApiData } = useApi(
    useCallback(() => rfqService.getRFQs({ page: 1, limit: 100 }) as any, [])
  );

  useEffect(() => {
    const rawRFQs = (rfqApiData as any)?.rfqs || [];
    if (rawRFQs.length > 0) {
      const fetchedRFQs = rawRFQs.map((rfq: any) => ({
        id: rfq.id,
        rfqNumber: rfq.rfq_number || rfq.rfqNumber || 'RFQ-000',
        title: rfq.title || 'Untitled RFQ',
        buyer: rfq.buyer_name || 'Buyer',
        description: rfq.description || '',
        category: rfq.category || 'General',
        budget: Number(rfq.budget) || 0,
        currency: rfq.currency || 'USD',
        issuedDate: rfq.issue_date ? new Date(rfq.issue_date).toISOString().split('T')[0] : '',
        dueDate: rfq.due_date ? new Date(rfq.due_date).toISOString().split('T')[0] : '',
        status: rfq.status === 'published' || rfq.status === 'open' ? 'Open'
          : rfq.status === 'closed' ? 'Closed'
            : rfq.status === 'awarded' ? 'Awarded'
              : rfq.status === 'cancelled' ? 'Cancelled'
                : 'Draft',
        priority: rfq.priority || 'Medium',
        suppliers: typeof rfq.target_vendors === 'string' ? JSON.parse(rfq.target_vendors || '[]') : (rfq.target_vendors || []),
        quotationsReceived: Number(rfq.responses_count) || 0,
        totalQuotations: 5,
        attachments: [],
        clarifications: 0,
      }));
      setRFQs(fetchedRFQs);
    }
  }, [rfqApiData]);
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
                <BreadcrumbPage>Procurement</BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>RFQ Management</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center justify-between w-full">
            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">RFQ Management</h1>

          </div>
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

  const renderModernStatusBadge = (status: string) => {
    switch (status) {
      case 'Open':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Open
          </span>
        );
      case 'Under Review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            Under Review
          </span>
        );
      case 'Awarded':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/60 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            Awarded
          </span>
        );
      case 'Closed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 shadow-sm">
            <span className="inline-flex rounded-full h-2 w-2 bg-slate-400"></span>
            Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 shadow-sm">
            <span className="inline-flex rounded-full h-2 w-2 bg-slate-400"></span>
            {status}
          </span>
        );
    }
  };

  const renderModernPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200 uppercase tracking-wider">
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-200 uppercase tracking-wider">
            Medium
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
            Low
          </span>
        );
    }
  };

  const [selectedRFQIds, setSelectedRFQIds] = useState<number[]>([]);

  const toggleSelectAllRFQs = useCallback((filteredList: any[]) => {
    setSelectedRFQIds(prev => 
      prev.length === filteredList.length ? [] : filteredList.map(r => r.id)
    );
  }, []);

  const toggleSelectRFQ = useCallback((id: number) => {
    setSelectedRFQIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'destructive';
      case 'Medium': return 'default';
      case 'Low': return 'secondary';
      default: return 'outline';
    }
  };

  const filteredRFQs = useMemo(() => {
    return rfqs.filter(rfq => {
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
  }, [rfqs, searchTerm, statusFilter, sortConfig]);

  const filteredQuotations = useMemo(() => {
    return quotations.filter(quo => {
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
  }, [quotations, quotationSearchTerm, quotationStatusFilter, quotationSortConfig]);

  const pagedRFQs = useMemo(() => {
    return filteredRFQs.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredRFQs, currentPage, itemsPerPage]);

  const pagedQuotations = useMemo(() => {
    return filteredQuotations.slice(
      (quotationPage - 1) * itemsPerPage,
      quotationPage * itemsPerPage
    );
  }, [filteredQuotations, quotationPage, itemsPerPage]);

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
              <BreadcrumbPage>Procurement</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>RFQ Management</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center justify-between w-full">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">RFQ Management</h1>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2 h-10 border-slate-200" onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Active RFQs</p>
              <p className="text-xl font-bold text-foreground mt-0.5">{rfqData.filter(r => r.status === 'Open').length}</p>
              <p className="text-[11px] text-blue-600 font-medium">Open for bidding</p>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-lg">
              <Quote className="w-5 h-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Pending Quotations</p>
              <p className="text-xl font-bold text-foreground mt-0.5">{quotationData.filter(q => q.status === 'Submitted').length}</p>
              <p className="text-[11px] text-amber-600 font-medium">Awaiting review</p>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-lg">
              <FileText className="w-5 h-5 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Awards Won</p>
              <p className="text-xl font-bold text-foreground mt-0.5">{rfqData.filter(r => r.status === 'Awarded').length}</p>
              <p className="text-[11px] text-emerald-600 font-medium">This month</p>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-lg">
              <Award className="w-5 h-5 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Success Rate</p>
              <p className="text-xl font-bold text-foreground mt-0.5">67%</p>
              <p className="text-[11px] text-purple-600 font-medium">+5% from last month</p>
            </div>
            <div className="p-2.5 bg-purple-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-fit">
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
                          <th className="p-4 w-10 text-center sticky left-0 z-30 bg-[#f8fafc] border-b">
                            <Checkbox 
                              checked={filteredRFQs.length > 0 && selectedRFQIds.length === filteredRFQs.length} 
                              onCheckedChange={() => toggleSelectAllRFQs(filteredRFQs)} 
                            />
                          </th>
                          {visibleColumns.includes('rfqNumber') && (
                            <th className="text-left p-4 font-semibold text-slate-600 text-sm sticky left-8 z-30 bg-[#f8fafc] border-b shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] whitespace-nowrap min-w-[200px]">
                              <Button variant="ghost" onClick={() => requestSort('rfqNumber')} className="h-auto p-0 hover:bg-transparent font-semibold text-slate-600 hover:text-primary text-sm flex items-center gap-1 transition-colors">
                                RFQ Details
                                <ArrowUpDown className={`w-3.5 h-3.5 ${sortConfig.key === 'rfqNumber' ? 'text-primary' : 'text-slate-400'}`} />
                              </Button>
                            </th>
                          )}
                          {visibleColumns.includes('buyer') && (
                            <th className="text-left p-4 font-semibold text-slate-600 text-sm whitespace-nowrap min-w-[150px]">
                              <Button variant="ghost" onClick={() => requestSort('buyer')} className="h-auto p-0 hover:bg-transparent font-semibold text-slate-600 hover:text-primary text-sm flex items-center gap-1 transition-colors">
                                Buyer
                                <ArrowUpDown className={`w-3.5 h-3.5 ${sortConfig.key === 'buyer' ? 'text-primary' : 'text-slate-400'}`} />
                              </Button>
                            </th>
                          )}
                          {visibleColumns.includes('category') && (
                            <th className="text-left p-4 font-semibold text-slate-600 text-sm whitespace-nowrap">
                              <Button variant="ghost" onClick={() => requestSort('category')} className="h-auto p-0 hover:bg-transparent font-semibold text-slate-600 hover:text-primary text-sm flex items-center gap-1 transition-colors">
                                Category
                                <ArrowUpDown className={`w-3.5 h-3.5 ${sortConfig.key === 'category' ? 'text-primary' : 'text-slate-400'}`} />
                              </Button>
                            </th>
                          )}
                          {visibleColumns.includes('priority') && (
                            <th className="text-left p-4 font-semibold text-slate-600 text-sm whitespace-nowrap">
                              <Button variant="ghost" onClick={() => requestSort('priority')} className="h-auto p-0 hover:bg-transparent font-semibold text-slate-600 hover:text-primary text-sm flex items-center gap-1 transition-colors">
                                Priority
                                <ArrowUpDown className={`w-3.5 h-3.5 ${sortConfig.key === 'priority' ? 'text-primary' : 'text-slate-400'}`} />
                              </Button>
                            </th>
                          )}
                          {visibleColumns.includes('budget') && (
                            <th className="text-left p-4 font-semibold text-slate-600 text-sm whitespace-nowrap">
                              <Button variant="ghost" onClick={() => requestSort('budget')} className="h-auto p-0 hover:bg-transparent font-semibold text-slate-600 hover:text-primary text-sm flex items-center gap-1 transition-colors">
                                Budget
                                <ArrowUpDown className={`w-3.5 h-3.5 ${sortConfig.key === 'budget' ? 'text-primary' : 'text-slate-400'}`} />
                              </Button>
                            </th>
                          )}
                          {visibleColumns.includes('dueDate') && (
                            <th className="text-left p-4 font-semibold text-slate-600 text-sm whitespace-nowrap">
                              <Button variant="ghost" onClick={() => requestSort('dueDate')} className="h-auto p-0 hover:bg-transparent font-semibold text-slate-600 hover:text-primary text-sm flex items-center gap-1 transition-colors">
                                Due Date
                                <ArrowUpDown className={`w-3.5 h-3.5 ${sortConfig.key === 'dueDate' ? 'text-primary' : 'text-slate-400'}`} />
                              </Button>
                            </th>
                          )}
                          {visibleColumns.includes('status') && (
                            <th className="text-left p-4 font-semibold text-slate-600 text-sm whitespace-nowrap">
                              <Button variant="ghost" onClick={() => requestSort('status')} className="h-auto p-0 hover:bg-transparent font-semibold text-slate-600 hover:text-primary text-sm flex items-center gap-1 transition-colors">
                                Status
                                <ArrowUpDown className={`w-3.5 h-3.5 ${sortConfig.key === 'status' ? 'text-primary' : 'text-slate-400'}`} />
                              </Button>
                            </th>
                          )}
                          {visibleColumns.includes('progress') && (
                            <th className="text-left p-4 font-semibold text-slate-600 text-sm whitespace-nowrap min-w-[120px]">
                              <Button variant="ghost" onClick={() => requestSort('progress')} className="h-auto p-0 hover:bg-transparent font-semibold text-slate-600 hover:text-primary text-sm flex items-center gap-1 transition-colors">
                                Progress
                                <ArrowUpDown className={`w-3.5 h-3.5 ${sortConfig.key === 'progress' ? 'text-primary' : 'text-slate-400'}`} />
                              </Button>
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
                                <td className="p-4 w-10 text-center sticky left-0 z-20 bg-white group-hover:bg-slate-50 transition-colors">
                                  <Checkbox 
                                    checked={selectedRFQIds.includes(rfq.id)} 
                                    onCheckedChange={() => toggleSelectRFQ(rfq.id)} 
                                  />
                                </td>
                                {visibleColumns.includes('rfqNumber') && (
                                  <td className="p-4 sticky left-8 z-20 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-slate-50 transition-colors whitespace-nowrap">
                                    <div>
                                      <p className="font-bold text-slate-900 font-mono text-sm leading-tight tracking-tight">{rfq.rfqNumber}</p>
                                      <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-0.5">{rfq.title}</p>
                                    </div>
                                  </td>
                                )}
                                {visibleColumns.includes('buyer') && (
                                  <td className="p-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                                        <Building className="w-3.5 h-3.5 text-slate-600" />
                                      </div>
                                      <span className="font-semibold text-xs text-slate-800">{rfq.buyer}</span>
                                    </div>
                                  </td>
                                )}
                                {visibleColumns.includes('category') && (
                                  <td className="p-4 whitespace-nowrap">
                                    <Badge variant="outline" className="text-xs font-medium border-slate-200 bg-slate-50 text-slate-700">
                                      {rfq.category}
                                    </Badge>
                                  </td>
                                )}
                                {visibleColumns.includes('priority') && (
                                  <td className="p-4 whitespace-nowrap">
                                    {renderModernPriorityBadge(rfq.priority)}
                                  </td>
                                )}
                                {visibleColumns.includes('budget') && (
                                  <td className="p-4 whitespace-nowrap">
                                    <p className="font-semibold text-slate-900 font-mono text-sm tracking-tight">{rfq.currency} {rfq.budget.toLocaleString()}</p>
                                  </td>
                                )}
                                {visibleColumns.includes('dueDate') && (
                                  <td className="p-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2 text-slate-600 text-xs">
                                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                      <span className="font-medium">{rfq.dueDate}</span>
                                    </div>
                                  </td>
                                )}
                                {visibleColumns.includes('status') && (
                                  <td className="p-4 whitespace-nowrap">
                                    {renderModernStatusBadge(rfq.status)}
                                  </td>
                                )}
                                {visibleColumns.includes('progress') && (
                                  <td className="p-4">
                                    <div className="space-y-1.5 w-full min-w-[110px]">
                                      <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                                        <span>Bids</span>
                                        <span className="font-mono text-blue-600 font-bold">{rfq.quotationsReceived}/{rfq.totalQuotations}</span>
                                      </div>
                                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                                        <div 
                                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300" 
                                          style={{ width: `${Math.min(100, (rfq.quotationsReceived / rfq.totalQuotations) * 100)}%` }} 
                                        />
                                      </div>
                                    </div>
                                  </td>
                                )}
                                <td className="p-4 sticky right-0 z-20 bg-white shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-slate-50 transition-colors whitespace-nowrap text-center">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-slate-100">
                                        <MoreHorizontal className="w-4 h-4 text-slate-600" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-44">
                                      <DropdownMenuItem onClick={() => { setSelectedRFQ(rfq); setIsRFQModalOpen(true); }} className="gap-2 text-xs cursor-pointer">
                                        <Eye className="w-3.5 h-3.5 text-blue-600" /> View Details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleSubmitQuotation(rfq.id)} className="gap-2 text-xs cursor-pointer">
                                        <Send className="w-3.5 h-3.5 text-emerald-600" /> Submit Quote
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleClarificationRequest(rfq.id)} className="gap-2 text-xs cursor-pointer">
                                        <MessageSquare className="w-3.5 h-3.5 text-amber-600" /> Clarification
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                              </DraggableTableRow>
                            ))}
                          </SortableContext>
                        </DndContext>
                      </tbody>
                    </table>
                  </div>

                  {/* Floating Bulk Action Bar */}
                  {selectedRFQIds.length > 0 && (
                    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-4 border border-slate-700 animate-in fade-in slide-in-from-bottom-5 duration-200">
                      <span className="text-xs font-semibold bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                        {selectedRFQIds.length} Selected
                      </span>
                      <div className="h-4 w-px bg-slate-700" />
                      <Button size="sm" variant="ghost" onClick={handleExportCSV} className="text-xs text-slate-200 hover:text-white hover:bg-slate-800 h-8 gap-1.5">
                        <Download className="w-3.5 h-3.5" /> Export Selected
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => {
                        setRFQs(prev => prev.map(r => selectedRFQIds.includes(r.id) ? {...r, status: 'Closed'} : r));
                        setSelectedRFQIds([]);
                      }} className="text-xs text-amber-300 hover:text-amber-200 hover:bg-slate-800 h-8 gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" /> Close RFQs
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => {
                        setRFQs(prev => prev.filter(r => !selectedRFQIds.includes(r.id)));
                        setSelectedRFQIds([]);
                      }} className="text-xs text-rose-400 hover:text-rose-300 hover:bg-slate-800 h-8 gap-1.5">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setSelectedRFQIds([])} className="text-xs text-slate-400 hover:text-white h-8">
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}

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
                              <Button variant="ghost" onClick={() => requestQuotationSort('quotationNumber')} className="h-auto p-0 hover:bg-transparent font-semibold text-slate-600 hover:text-primary text-sm flex items-center gap-1 transition-colors">
                                Quotation Details
                                <ArrowUpDown className={`w-3.5 h-3.5 ${quotationSortConfig.key === 'quotationNumber' ? 'text-primary' : 'text-slate-400'}`} />
                              </Button>
                            </th>
                          )}
                          {visibleQuotationColumns.includes('rfqNumber') && (
                            <th className="text-left p-4 font-semibold text-slate-600 text-sm whitespace-nowrap min-w-[150px]">
                              <Button variant="ghost" onClick={() => requestQuotationSort('rfqNumber')} className="h-auto p-0 hover:bg-transparent font-semibold text-slate-600 hover:text-primary text-sm flex items-center gap-1 transition-colors">
                                RFQ Number
                                <ArrowUpDown className={`w-3.5 h-3.5 ${quotationSortConfig.key === 'rfqNumber' ? 'text-primary' : 'text-slate-400'}`} />
                              </Button>
                            </th>
                          )}
                          {visibleQuotationColumns.includes('amount') && (
                            <th className="text-left p-4 font-semibold text-slate-600 text-sm whitespace-nowrap">
                              <Button variant="ghost" onClick={() => requestQuotationSort('amount')} className="h-auto p-0 hover:bg-transparent font-semibold text-slate-600 hover:text-primary text-sm flex items-center gap-1 transition-colors">
                                Amount
                                <ArrowUpDown className={`w-3.5 h-3.5 ${quotationSortConfig.key === 'amount' ? 'text-primary' : 'text-slate-400'}`} />
                              </Button>
                            </th>
                          )}
                          {visibleQuotationColumns.includes('submittedDate') && (
                            <th className="text-left p-4 font-semibold text-slate-600 text-sm whitespace-nowrap">
                              <Button variant="ghost" onClick={() => requestQuotationSort('submittedDate')} className="h-auto p-0 hover:bg-transparent font-semibold text-slate-600 hover:text-primary text-sm flex items-center gap-1 transition-colors">
                                Submitted Date
                                <ArrowUpDown className={`w-3.5 h-3.5 ${quotationSortConfig.key === 'submittedDate' ? 'text-primary' : 'text-slate-400'}`} />
                              </Button>
                            </th>
                          )}
                          {visibleQuotationColumns.includes('validUntil') && (
                            <th className="text-left p-4 font-semibold text-slate-600 text-sm whitespace-nowrap">
                              <Button variant="ghost" onClick={() => requestQuotationSort('validUntil')} className="h-auto p-0 hover:bg-transparent font-semibold text-slate-600 hover:text-primary text-sm flex items-center gap-1 transition-colors">
                                Valid Until
                                <ArrowUpDown className={`w-3.5 h-3.5 ${quotationSortConfig.key === 'validUntil' ? 'text-primary' : 'text-slate-400'}`} />
                              </Button>
                            </th>
                          )}
                          {visibleQuotationColumns.includes('status') && (
                            <th className="text-left p-4 font-semibold text-slate-600 text-sm whitespace-nowrap">
                              <Button variant="ghost" onClick={() => requestQuotationSort('status')} className="h-auto p-0 hover:bg-transparent font-semibold text-slate-600 hover:text-primary text-sm flex items-center gap-1 transition-colors">
                                Status
                                <ArrowUpDown className={`w-3.5 h-3.5 ${quotationSortConfig.key === 'status' ? 'text-primary' : 'text-slate-400'}`} />
                              </Button>
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

      {/* RFQ Details Sheet */}
      <Sheet open={isRFQModalOpen} onOpenChange={setIsRFQModalOpen}>
        <SheetContent className="sm:max-w-4xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>RFQ Details</SheetTitle>
            <SheetDescription>
              Review RFQ requirements and submit your quotation
            </SheetDescription>
          </SheetHeader>
          {selectedRFQ && (
            <div className="space-y-6 mt-4">
              {/* RFQ Header */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>RFQ Number</Label>
                  <p className="text-sm mt-1">{selectedRFQ.rfqNumber}</p>
                </div>
                <div>
                  <Label>Category</Label>
                  <p className="text-sm mt-1">{selectedRFQ.category}</p>
                </div>
                <div>
                  <Label>Issued Date</Label>
                  <p className="text-sm mt-1">{selectedRFQ.issuedDate}</p>
                </div>
                <div>
                  <Label>Submission Deadline</Label>
                  <p className="text-sm mt-1">{selectedRFQ.submissionDeadline}</p>
                </div>
                <div>
                  <Label>Estimated Value</Label>
                  <p className="text-lg font-semibold mt-1">{selectedRFQ.currency} {selectedRFQ.estimatedValue?.toLocaleString()}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(selectedRFQ.status)}>
                      {selectedRFQ.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label>Description</Label>
                <p className="text-sm mt-1">{selectedRFQ.description}</p>
              </div>

              {/* Requirements */}
              <div>
                <Label>Requirements</Label>
                <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                  {selectedRFQ.requirements?.map((req: string, idx: number) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>

              {/* Attachments */}
              {selectedRFQ.attachments && selectedRFQ.attachments.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold text-slate-700">Attachments</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedRFQ.attachments.map((attachment: string, index: number) => (
                      <Badge key={index} variant="outline" className="gap-1 p-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span>{attachment}</span>
                      </Badge>
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
        </SheetContent>
      </Sheet>

      {/* Quotation Details Sheet */}
      <Sheet open={isQuotationModalOpen} onOpenChange={setIsQuotationModalOpen}>
        <SheetContent className="sm:max-w-4xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Quotation Details</SheetTitle>
            <SheetDescription>
              Review your submitted quotation
            </SheetDescription>
          </SheetHeader>
          {selectedQuotation && (
            <div className="space-y-6 mt-4">
              {/* Quotation Header */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quotation Number</Label>
                  <p className="text-sm font-semibold mt-1">{selectedQuotation.quotationNumber}</p>
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
        </SheetContent>
      </Sheet>

      {/* Clarification Request Sheet */}
      <Sheet open={isClarificationModalOpen} onOpenChange={setIsClarificationModalOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Request Clarification</SheetTitle>
            <SheetDescription>
              Ask questions about the RFQ requirements
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-4">
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
        </SheetContent>
      </Sheet>
      {/* Quotation Form Sheet (Create/Edit) */}
      <Sheet open={isQuotationFormModalOpen} onOpenChange={setIsQuotationFormModalOpen}>
        <SheetContent className="sm:max-w-3xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{quotationFormMode === 'create' ? 'Submit New Quotation' : 'Edit Quotation'}</SheetTitle>
            <SheetDescription>
              {quotationFormMode === 'create' ? 'Fill in the details to submit your proposal' : 'Update the details of your submitted quotation'}
            </SheetDescription>
          </SheetHeader>
          {currentQuotationForForm && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>RFQ Number</Label>
                  <Input value={currentQuotationForForm.rfqNumber} readOnly className="bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <Label>Valid Until</Label>
                  <DatePicker
                    value={currentQuotationForForm.validUntil}
                    onChange={(e) => setCurrentQuotationForForm({ ...currentQuotationForForm, validUntil: e.target.value })}
                    placeholder="Select expiration date"
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
                      setCurrentQuotationForForm({ ...currentQuotationForForm, lineItems: items });
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
                                setCurrentQuotationForForm({ ...currentQuotationForForm, lineItems: newItems });
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
                                setCurrentQuotationForForm({ ...currentQuotationForForm, lineItems: newItems, totalAmount: newTotal });
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
                                setCurrentQuotationForForm({ ...currentQuotationForForm, lineItems: newItems, totalAmount: newTotal });
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
                                  setCurrentQuotationForForm({ ...currentQuotationForForm, lineItems: newItems, totalAmount: newTotal });
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
                  onChange={(e) => setCurrentQuotationForForm({ ...currentQuotationForForm, notes: e.target.value })}
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
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Sheet */}
      <Sheet open={isDeleteQuotationConfirmOpen} onOpenChange={setIsDeleteQuotationConfirmOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Cancel Quotation</SheetTitle>
            <SheetDescription>
              Are you sure you want to cancel this quotation? This action cannot be undone.
            </SheetDescription>
          </SheetHeader>
          <div className="flex justify-end gap-3 pt-6">
            <Button variant="outline" onClick={() => setIsDeleteQuotationConfirmOpen(false)}>No, Keep it</Button>
            <Button variant="destructive" onClick={handleDeleteQuotation}>Yes, Cancel Proposal</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}