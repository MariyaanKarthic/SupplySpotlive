// Centralized type definitions for Supplier Spot application

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// User & Authentication Types
export interface User extends BaseEntity {
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
}

export type UserRole = 
  | 'admin' 
  | 'procurement_manager' 
  | 'finance_manager' 
  | 'ap_clerk' 
  | 'supplier'
  | 'viewer';

export interface ContactInfo {
  email: string;
  phone: string;
  address?: string;
  website?: string;
}

// Vendor Management Types
export interface Vendor extends BaseEntity {
  name: string;
  category: VendorCategory;
  contact: ContactInfo;
  status: VendorStatus;
  location: string;
  contracts: number;
  totalSpend: number;
  rating: number;
  onboardDate: string;
  taxId?: string;
  registrationNumber?: string;
  compliance: ComplianceInfo;
  documents: VendorDocument[];
  bankDetails?: BankDetails;
}

export type VendorCategory = 
  | 'technology' 
  | 'manufacturing' 
  | 'services' 
  | 'materials' 
  | 'logistics' 
  | 'consulting'
  | 'other';

export type VendorStatus = 
  | 'active' 
  | 'under_review' 
  | 'rejected' 
  | 'inactive' 
  | 'suspended';

export interface ComplianceInfo {
  certified: boolean;
  certifications: Certification[];
  lastAuditDate?: Date;
  nextAuditDate?: Date;
  riskScore: number;
  complianceScore: number;
}

export interface Certification {
  name: string;
  issuer: string;
  issueDate: Date;
  expiryDate: Date;
  documentUrl?: string;
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  accountType: 'checking' | 'savings';
  swiftCode?: string;
}

export interface VendorDocument {
  id: string;
  name: string;
  type: DocumentType;
  url: string;
  uploadedAt: Date;
  expiresAt?: Date;
  status: 'valid' | 'expired' | 'pending';
}

export type DocumentType = 
  | 'tax_certificate' 
  | 'business_license' 
  | 'insurance' 
  | 'w9_form' 
  | 'contract' 
  | 'other';

// Invoice Management Types
export interface Invoice extends BaseEntity {
  invoiceNumber: string;
  vendorId: string;
  vendor: Vendor;
  amount: number;
  taxAmount: number;
  netAmount: number;
  dueDate: Date;
  issueDate: Date;
  status: InvoiceStatus;
  description: string;
  paymentDate?: Date;
  approvedBy?: string;
  category: string;
  submissionMethod: SubmissionMethod;
  poNumber?: string;
  grnNumber?: string;
  matchingStatus: MatchingStatus;
  ocrConfidence?: number;
  extractedData: boolean;
  lineItems: InvoiceLineItem[];
  attachments: InvoiceAttachment[];
}

export type InvoiceStatus = 
  | 'draft' 
  | 'submitted' 
  | 'pending_approval' 
  | 'approved' 
  | 'rejected' 
  | 'paid' 
  | 'overdue';

export type SubmissionMethod = 
  | 'e_invoice' 
  | 'ocr_scan' 
  | 'manual_entry' 
  | 'email' 
  | 'portal';

export type MatchingStatus = 
  | 'matched' 
  | 'unmatched' 
  | 'pending_review' 
  | 'exception';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  poLineNumber?: string;
}

export interface InvoiceAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Date;
}

// Purchase Order Types
export interface PurchaseOrder extends BaseEntity {
  poNumber: string;
  vendorId: string;
  vendor: Vendor;
  items: POItem[];
  totalAmount: number;
  status: POStatus;
  orderDate: Date;
  deliveryDate: Date;
  shippingAddress: string;
  billingAddress: string;
  terms: string;
  notes?: string;
  approvals: POApproval[];
  attachments: POAttachment[];
}

export type POStatus = 
  | 'draft' 
  | 'pending_approval' 
  | 'approved' 
  | 'sent' 
  | 'acknowledged' 
  | 'partially_received' 
  | 'received' 
  | 'closed' 
  | 'cancelled';

export interface POItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  partNumber?: string;
  category: string;
  expectedDeliveryDate: Date;
}

export interface POApproval {
  id: string;
  approverId: string;
  approverName: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  timestamp: Date;
}

export interface POAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Date;
}

// RFQ Management Types
export interface RFQ extends BaseEntity {
  rfqNumber: string;
  title: string;
  description: string;
  category: string;
  deadline: Date;
  status: RFQStatus;
  createdBy: string;
  items: RFQItem[];
  responses: RFQResponse[];
  attachments: RFQAttachment[];
}

export type RFQStatus = 
  | 'draft' 
  | 'published' 
  | 'closed' 
  | 'awarded' 
  | 'cancelled';

export interface RFQItem {
  id: string;
  description: string;
  quantity: number;
  specifications?: string;
  category: string;
}

export interface RFQResponse {
  id: string;
  vendorId: string;
  vendor: Vendor;
  submittedAt: Date;
  status: 'submitted' | 'reviewed' | 'accepted' | 'rejected';
  totalAmount: number;
  items: RFQResponseItem[];
  attachments: RFQResponseAttachment[];
  notes?: string;
}

export interface RFQResponseItem {
  rfqItemId: string;
  unitPrice: number;
  totalAmount: number;
  leadTime: number;
  notes?: string;
}

export interface RFQAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Date;
}

export interface RFQResponseAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Date;
}

// Dispute Management Types
export interface Dispute extends BaseEntity {
  disputeNumber: string;
  title: string;
  description: string;
  category: DisputeCategory;
  priority: DisputePriority;
  status: DisputeStatus;
  submittedBy: DisputeParticipant;
  assignedTo?: DisputeParticipant;
  relatedDocuments: RelatedDocument[];
  messages: DisputeMessage[];
  attachments: DisputeAttachment[];
  resolution?: DisputeResolution;
  slaDetails: SLADetails;
  tags: string[];
}

export type DisputeCategory = 
  | 'invoice_discrepancy' 
  | 'payment_delay' 
  | 'delivery_issue' 
  | 'quality_issue' 
  | 'po_issue' 
  | 'contract_dispute' 
  | 'other';

export type DisputePriority = 
  | 'low' 
  | 'medium' 
  | 'high' 
  | 'critical';

export type DisputeStatus = 
  | 'submitted' 
  | 'assigned' 
  | 'investigating' 
  | 'pending_supplier' 
  | 'pending_internal' 
  | 'resolved' 
  | 'closed' 
  | 'escalated';

export interface DisputeParticipant {
  id: string;
  name: string;
  email: string;
  type: 'supplier' | 'internal';
  department?: string;
  company?: string;
  role?: string;
}

export interface RelatedDocument {
  type: 'po' | 'invoice' | 'asn' | 'contract' | 'delivery_note';
  number: string;
  amount?: number;
  currency?: string;
  url?: string;
}

export interface DisputeMessage {
  id: string;
  disputeId: string;
  sender: DisputeParticipant;
  message: string;
  isInternal: boolean;
  timestamp: Date;
  attachments?: string[];
  status: 'sent' | 'read' | 'replied';
}

export interface DisputeAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
  url: string;
}

export interface DisputeResolution {
  id: string;
  type: ResolutionType;
  description: string;
  financialAdjustment?: FinancialAdjustment;
  approvedBy: string;
  resolvedAt: Date;
  followUpRequired: boolean;
  preventiveActions: string[];
}

export type ResolutionType = 
  | 'full_credit' 
  | 'partial_credit' 
  | 'no_action' 
  | 'process_change' 
  | 'policy_update';

export interface FinancialAdjustment {
  amount: number;
  currency: string;
  creditNoteNumber?: string;
}

export interface SLADetails {
  targetResolution: Date;
  escalationDate: Date;
  isOverdue: boolean;
  hoursRemaining: number;
}

// Payment Management Types
export interface Payment extends BaseEntity {
  paymentNumber: string;
  invoiceId: string;
  invoice: Invoice;
  amount: number;
  status: PaymentStatus;
  paymentDate: Date;
  method: PaymentMethod;
  bankReference?: string;
  processedBy: string;
  approvedBy?: string;
  scheduledDate?: Date;
  currency: string;
  exchangeRate?: number;
}

export type PaymentStatus = 
  | 'scheduled' 
  | 'processing' 
  | 'processed' 
  | 'failed' 
  | 'cancelled';

export type PaymentMethod = 
  | 'ach' 
  | 'wire' 
  | 'check' 
  | 'credit_card' 
  | 'other';

// Analytics & Reporting Types
export interface AnalyticsData {
  totalVendors: number;
  activeVendors: number;
  totalInvoices: number;
  pendingInvoices: number;
  totalPayments: number;
  pendingPayments: number;
  avgProcessingTime: number;
  costSavings: number;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string;
  borderColor?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

// Form Types
export interface CreateVendorRequest {
  name: string;
  category: VendorCategory;
  contact: ContactInfo;
  taxId?: string;
  registrationNumber?: string;
  bankDetails?: BankDetails;
}

export interface CreateInvoiceRequest {
  vendorId: string;
  invoiceNumber: string;
  amount: number;
  taxAmount: number;
  dueDate: Date;
  description: string;
  lineItems: InvoiceLineItem[];
  poNumber?: string;
}

export interface CreatePORequest {
  vendorId: string;
  items: POItem[];
  deliveryDate: Date;
  shippingAddress: string;
  billingAddress: string;
  terms: string;
}

// Navigation Types (from App.tsx)
export type NavigationItem =
  | 'registration'
  | 'registration-review'
  | 'vendors'
  | 'contracts'
  | 'sourcing-rfx'
  | 'rfq'
  | 'purchase-orders'
  | 'goods-receipts'
  | 'procurement-collaboration'
  | 'invoices'
  | 'ap-automation'
  | 'payments'
  | 'documents'
  | 'analytics'
  | 'audit-trail'
  | 'regulatory-compliance'
  | 'delivery-slots'
  | 'dispute-management'
  | 'gate-entry'
  | 'supplier-dashboard'
  | 'databoards'
  | 'settings';

// UI State Types
export interface UIState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  notifications: Notification[];
  loading: Record<string, boolean>;
  errors: Record<string, string>;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}
