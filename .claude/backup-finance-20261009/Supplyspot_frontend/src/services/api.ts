// Centralized API service for Supplier Spot application

import { API_CONFIG } from '../constants';

const API_BASE_URL = API_CONFIG.BASE_URL;

// Generic API client
class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get auth token from localStorage
    const token = localStorage.getItem('token');
    const headers = {
      ...this.defaultHeaders,
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = params ? `${endpoint}?${new URLSearchParams(params)}` : endpoint;
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async upload<T>(endpoint: string, file: File, additionalData?: Record<string, any>): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }
}

// Create API client instance
const api = new ApiClient(API_BASE_URL);

// Vendor Service
export const vendorService = {
  // Get all vendors with pagination and filters
  getVendors: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: string;
  }) => api.get('/vendors', params),

  // Get single vendor by ID
  getVendor: (id: string) => api.get(`/vendors/${id}`),

  // Create new vendor
  createVendor: (data: any) => api.post('/vendors', data),

  // Update vendor
  updateVendor: (id: string, data: any) => api.put(`/vendors/${id}`, data),

  // Delete/deactivate vendor
  deleteVendor: (id: string) => api.delete(`/vendors/${id}`),

  // Performance, scoring and risk for every vendor
  getPerformanceOverview: () => api.get('/vendors/performance/overview'),

  // Performance, analytics, scorecard, insights and actions for one vendor
  getVendorPerformance: (id: string) => api.get(`/vendors/${id}/performance`),

  // Upload vendor document
  uploadDocument: (vendorId: string, file: File, documentType: string) =>
    api.upload(`/vendors/${vendorId}/documents`, file, { documentType }),

  // Get vendor compliance info
  getCompliance: (id: string) => api.get(`/vendors/${id}/compliance`),

  // Update vendor compliance
  updateCompliance: (id: string, data: any) => api.put(`/vendors/${id}/compliance`, data),

  // Send vendor invite
  sendVendorInvite: (data: {
    email: string;
    role?: string;
    vendorType: 'company' | 'individual';
    companyCode: string;
    purchaseOrg: string;
    vendorName: string;
    natureOfVendor: string;
    businessPartnerCategory: string;
    contactPersonName: string;
    yearOfIncorporation: string;
  }) => api.post('/invites', { ...data, role: 'supplier' }),

  // Get vendor registration invite info by token
  getVendorRegistrationByToken: (token: string) => api.get(`/invites/verify/${token}`),

  // Submit complete vendor registration
  submitVendorRegistration: (data: any) => api.post('/vendors', data),
};

// Invoice Service
export const invoiceService = {
  // List invoices; status also accepts 'overdue' (unpaid and past due) and 'open' (unpaid)
  getInvoices: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    po_id?: string;
    grn_id?: string;
    vendor_id?: string;
    date_from?: string;
    date_to?: string;
    due_from?: string;
    due_to?: string;
  }) => api.get('/invoices', params),

  // Invoice with lines, payments, history and its PO / GRN
  getInvoice: (id: string) => api.get(`/invoices/${id}`),

  // Totals, paid and outstanding, plus a PO / GRN match check per line
  getPaymentSummary: (id: string) => api.get(`/invoices/${id}/payment-summary`),

  // Lines still left to bill on a PO or GRN, with suggested dates
  getPrefill: (params: { po_id?: string; grn_id?: string }) => api.get('/invoices/prefill', params),

  // Goods receipts with how much of each is already invoiced
  getBillableGrns: (params?: { po_id?: string }) => api.get('/invoices/grns', params),

  // Totals, recent invoices and payments for one vendor
  getVendorSummary: (vendorId: string) => api.get(`/invoices/vendor/${vendorId}/summary`),

  // Create a draft from a PO (poId), a GRN (grnId) or by hand (vendorId)
  createInvoice: (data: any) => api.post('/invoices', data),

  // Update a draft
  updateInvoice: (id: string, data: any) => api.put(`/invoices/${id}`, data),

  // Delete a draft
  deleteInvoice: (id: string) => api.delete(`/invoices/${id}`),

  // draft -> submitted
  submitInvoice: (id: string) => api.post(`/invoices/${id}/submit`),

  // submitted -> approved
  approveInvoice: (id: string, data?: { notes?: string }) => api.post(`/invoices/${id}/approve`, data),

  // submitted -> draft, with what needs correcting
  returnInvoice: (id: string, data: { reason: string }) => api.post(`/invoices/${id}/return`, data),

  // Record a payment; amount omitted = everything outstanding
  payInvoice: (id: string, data: { amount?: number; paymentDate?: string; method?: string; reference?: string; notes?: string }) =>
    api.post(`/invoices/${id}/pay`, data),

  // submitted / approved -> disputed
  disputeInvoice: (id: string, data: { reason: string }) => api.post(`/invoices/${id}/dispute`, data),

  // disputed -> submitted
  resolveDispute: (id: string, data?: { note?: string }) => api.post(`/invoices/${id}/resolve`, data),

  // Process invoice with OCR
  processOCR: (file: File) => api.upload('/invoices/ocr-process', file),
};

// Purchase Order Service
export const purchaseOrderService = {
  // Get all purchase orders
  getPurchaseOrders: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    vendorId?: string;
  }) => api.get('/purchase-orders', params),

  // Get single PO
  getPurchaseOrder: (id: string) => api.get(`/purchase-orders/${id}`),

  // Create PO
  createPurchaseOrder: (data: any) => api.post('/purchase-orders', data),

  // Update PO
  updatePurchaseOrder: (id: string, data: any) => api.put(`/purchase-orders/${id}`, data),

  // Submit a draft PO for approval
  submitPO: (id: string) => api.post(`/purchase-orders/${id}/submit`),

  // Send PO to vendor
  sendToVendor: (id: string) => api.post(`/purchase-orders/${id}/send`),

  // Approve PO
  approvePO: (id: string, data: { comments?: string } = {}) =>
    api.post(`/purchase-orders/${id}/approve`, data),

  // Record the vendor's acknowledgment
  acknowledgePO: (id: string) => api.post(`/purchase-orders/${id}/acknowledge`),

  // Receive goods; items are cumulative received quantities per line index, omit to receive everything
  receiveGoods: (id: string, data: { items?: { index: number; receivedQuantity: number }[] } = {}) =>
    api.post(`/purchase-orders/${id}/receive-goods`, data),

  // Close a received PO
  closePO: (id: string) => api.post(`/purchase-orders/${id}/close`),

  // Cancel PO
  cancelPO: (id: string) => api.post(`/purchase-orders/${id}/cancel`),
};

// Shipment tracking Service
export const shipmentService = {
  // List shipments; status 'delayed' also matches shipments past their expected date, 'open' = not delivered/cancelled
  getShipments: (params?: {
    po_id?: string;
    vendor_id?: string;
    status?: string;
    search?: string;
    due_from?: string;
    due_to?: string;
    overdue?: string;
    limit?: number;
  }) => api.get('/shipments', params),

  // Counts per status plus delivery performance (on-time rate); pass vendor_id for one vendor
  getStats: (params?: { vendor_id?: string }) => api.get('/shipments/stats', params),

  // Shipment with tracking events, GRNs and its PO
  getShipment: (id: string) => api.get(`/shipments/${id}`),

  // What is still left to ship on a PO (prefills the create form)
  getRemainingForPO: (poId: string) => api.get(`/shipments/po/${poId}/remaining`),

  // Create a shipment for a PO; items omitted = everything still outstanding
  createShipment: (data: any) => api.post('/shipments', data),

  // Update carrier, tracking number, dates, addresses, notes
  updateShipment: (id: string, data: any) => api.put(`/shipments/${id}`, data),

  // Add a tracking event (picked_up, in_transit, out_for_delivery, delivered, exception)
  addTrackingEvent: (id: string, data: any) => api.post(`/shipments/${id}/track`, data),

  // Record part of the shipment arriving; quantities are what arrived in this delivery
  partialReceive: (id: string, data: any) => api.post(`/shipments/${id}/partial-receive`, data),

  // Receive the rest and close the shipment; writes a GRN
  receive: (id: string, data: any) => api.post(`/shipments/${id}/receive`, data),

  // Cancel a shipment that has nothing received
  cancelShipment: (id: string, reason?: string) => api.post(`/shipments/${id}/cancel`, { reason }),

  // Goods receipt note data; receipt_id picks one GRN
  getGRN: (id: string, receiptId?: string) => api.get(`/shipments/${id}/grn`, receiptId ? { receipt_id: receiptId } : undefined),
};

// Purchase Request Service
export const purchaseRequestService = {
  getPurchaseRequests: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    priority?: string;
    department?: string;
    mine?: boolean;
  }) => api.get('/purchase-requests', params),

  getPurchaseRequest: (id: string) => api.get(`/purchase-requests/${id}`),

  // Creates a draft; pass submit: true to send it straight for approval
  createPurchaseRequest: (data: any) => api.post('/purchase-requests', data),

  // Drafts only
  updatePurchaseRequest: (id: string, data: any) => api.put(`/purchase-requests/${id}`, data),

  // Drafts only
  deletePurchaseRequest: (id: string) => api.delete(`/purchase-requests/${id}`),

  submitPR: (id: string) => api.post(`/purchase-requests/${id}/submit`),

  approvePR: (id: string, data: { comment?: string } = {}) => api.post(`/purchase-requests/${id}/approve`, data),

  rejectPR: (id: string, data: { reason: string }) => api.post(`/purchase-requests/${id}/reject`, data),

  // Reopens a rejected request as a draft
  revisePR: (id: string) => api.post(`/purchase-requests/${id}/revise`),

  // Turns an approved request into a draft RFQ
  createRFQ: (id: string, data: { dueDate: string; title?: string; description?: string }) =>
    api.post(`/purchase-requests/${id}/create-rfq`, data),
};

// RFQ Service (lifecycle: draft → sent → quotations_received → under_review → awarded → closed)
export const rfqService = {
  getRFQs: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    purchase_request_id?: string;
    vendor_id?: string;
  }) => api.get('/rfqs', params),

  // Includes the RFQ's quotations
  getRFQ: (id: string) => api.get(`/rfqs/${id}`),

  // From an approved purchase request: { purchaseRequestId, dueDate, title?, notes?, vendorIds?, send? }
  createRFQ: (data: any) => api.post('/rfqs', data),

  // Drafts only
  updateRFQ: (id: string, data: any) => api.put(`/rfqs/${id}`, data),

  deleteRFQ: (id: string) => api.delete(`/rfqs/${id}`),

  sendRFQ: (id: string, data: { vendorIds?: string[] } = {}) => api.post(`/rfqs/${id}/send`, data),

  startReview: (id: string) => api.post(`/rfqs/${id}/start-review`),

  closeRFQ: (id: string, data: { reason?: string } = {}) => api.post(`/rfqs/${id}/close`, data),

  getComparison: (id: string) => api.get(`/rfqs/${id}/comparison`),
};

// Quotation Service
export const quotationService = {
  getQuotations: (params?: { rfq_id?: string; vendor_id?: string; status?: string; include_archived?: boolean }) =>
    api.get('/quotations', params),

  getQuotation: (id: string) => api.get(`/quotations/${id}`),

  // { rfqId, vendorId, items: [{ rfqItemIndex?, description?, quantity?, unitPrice }], deliveryDate, paymentTerms?, validUntil?, notes? }
  submitQuotation: (data: any) => api.post('/quotations', data),

  reviewQuotation: (id: string) => api.post(`/quotations/${id}/review`),

  // Awards the RFQ and creates a draft purchase order; the response carries purchase_order { id, po_number }
  acceptQuotation: (id: string, data: { notes?: string } = {}) => api.post(`/quotations/${id}/accept`, data),

  rejectQuotation: (id: string, data: { reason: string }) => api.post(`/quotations/${id}/reject`, data),

  archiveQuotation: (id: string) => api.post(`/quotations/${id}/archive`),

  unarchiveQuotation: (id: string) => api.post(`/quotations/${id}/unarchive`),
};

// Dispute Service
export const disputeService = {
  // Get all disputes
  getDisputes: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    category?: string;
    priority?: string;
    assignedTo?: string;
  }) => api.get('/disputes', params),

  // Get single dispute
  getDispute: (id: string) => api.get(`/disputes/${id}`),

  // Create dispute
  createDispute: (data: any) => api.post('/disputes', data),

  // Update dispute
  updateDispute: (id: string, data: any) => api.put(`/disputes/${id}`, data),

  // Assign dispute
  assignDispute: (id: string, assigneeId: string) =>
    api.post(`/disputes/${id}/assign`, { assigneeId }),

  // Add message to dispute
  addMessage: (id: string, data: { message: string; isInternal?: boolean }) =>
    api.post(`/disputes/${id}/messages`, data),

  // Resolve dispute
  resolveDispute: (id: string, data: any) => api.post(`/disputes/${id}/resolve`, data),

  // Escalate dispute
  escalateDispute: (id: string, data: { reason: string; escalateTo: string }) =>
    api.post(`/disputes/${id}/escalate`, data),

  // Upload dispute attachment
  uploadAttachment: (disputeId: string, file: File) =>
    api.upload(`/disputes/${disputeId}/attachments`, file),
};

// Payment Service
export const paymentService = {
  // Get all payments
  getPayments: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    method?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => api.get('/payments', params),

  // Get single payment
  getPayment: (id: string) => api.get(`/payments/${id}`),

  // Process payment
  processPayment: (data: {
    invoiceIds: string[];
    method: string;
    scheduledDate?: string;
  }) => api.post('/payments/process', data),

  // Schedule payment
  schedulePayment: (data: {
    invoiceId: string;
    amount: number;
    scheduledDate: string;
    method: string;
  }) => api.post('/payments/schedule', data),

  // Cancel payment
  cancelPayment: (id: string) => api.delete(`/payments/${id}`),

  // Get payment history
  getPaymentHistory: (invoiceId: string) => api.get(`/payments/invoice/${invoiceId}`),
};

// Analytics Service
export const analyticsService = {
  // Get dashboard analytics
  getDashboardAnalytics: () => api.get('/analytics/dashboard'),

  // Get vendor analytics
  getVendorAnalytics: (params?: { vendorId?: string; period?: string }) =>
    api.get('/analytics/vendors', params),

  // Get invoice analytics
  getInvoiceAnalytics: (params?: { period?: string; status?: string }) =>
    api.get('/analytics/invoices', params),

  // Get spending analytics
  getSpendingAnalytics: (params?: { period?: string; category?: string }) =>
    api.get('/analytics/spending', params),

  // Get dispute analytics
  getDisputeAnalytics: (params?: { period?: string; category?: string }) =>
    api.get('/analytics/disputes', params),

  // Export report
  exportReport: (type: string, params?: any) =>
    api.get(`/analytics/export/${type}`, params),
};

// Document Service
export const documentService = {
  // Get documents
  getDocuments: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    category?: string;
  }) => api.get('/documents', params),

  // Upload document
  uploadDocument: (file: File, metadata: {
    type: string;
    category?: string;
    description?: string;
    vendorId?: string;
    invoiceId?: string;
  }) => api.upload('/documents', file, metadata),

  // Get document
  getDocument: (id: string) => api.get(`/documents/${id}`),

  // Update document
  updateDocument: (id: string, data: any) => api.put(`/documents/${id}`, data),

  // Delete document
  deleteDocument: (id: string) => api.delete(`/documents/${id}`),

  // Download document
  downloadDocument: (id: string) => {
    const token = localStorage.getItem('token');
    const url = `${API_BASE_URL}/documents/${id}/download`;
    const link = document.createElement('a');
    link.href = url;
    link.download = '';
    if (token) {
      link.setAttribute('Authorization', `Bearer ${token}`);
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};

// Authentication Service
export const authService = {
  // Login
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),

  // Logout
  logout: () => api.post('/auth/logout'),

  // Refresh token
  refreshToken: () => api.post('/auth/refresh'),

  // Get current user
  getCurrentUser: () => api.get('/auth/me'),

  // Update profile
  updateProfile: (data: any) => api.put('/auth/profile', data),

  // Change password
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),
};

// Notification Service
export const notificationService = {
  // Get notifications
  getNotifications: (params?: { unreadOnly?: boolean; limit?: number }) =>
    api.get('/notifications', params),

  // Mark notification as read
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),

  // Mark all notifications as read
  markAllAsRead: () => api.patch('/notifications/read-all'),

  // Delete notification
  deleteNotification: (id: string) => api.delete(`/notifications/${id}`),
};

// Settings Service
export const settingsService = {
  // Get system settings
  getSettings: () => api.get('/settings'),

  // Update system settings
  updateSettings: (data: any) => api.put('/settings', data),

  // Get user preferences
  getUserPreferences: () => api.get('/settings/preferences'),

  // Update user preferences
  updateUserPreferences: (data: any) => api.put('/settings/preferences', data),
};

export default api;
