// Centralized API service for Supplier Spot application

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

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
    const token = localStorage.getItem('auth_token');
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
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
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

    const token = localStorage.getItem('auth_token');
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
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
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

  // Upload vendor document
  uploadDocument: (vendorId: string, file: File, documentType: string) =>
    api.upload(`/vendors/${vendorId}/documents`, file, { documentType }),

  // Get vendor compliance info
  getCompliance: (id: string) => api.get(`/vendors/${id}/compliance`),

  // Update vendor compliance
  updateCompliance: (id: string, data: any) => api.put(`/vendors/${id}/compliance`, data),
};

// Invoice Service
export const invoiceService = {
  // Get all invoices
  getInvoices: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    vendorId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => api.get('/invoices', params),

  // Get single invoice
  getInvoice: (id: string) => api.get(`/invoices/${id}`),

  // Create invoice
  createInvoice: (data: any) => api.post('/invoices', data),

  // Update invoice
  updateInvoice: (id: string, data: any) => api.put(`/invoices/${id}`, data),

  // Approve invoice
  approveInvoice: (id: string, data?: { notes?: string }) =>
    api.post(`/invoices/${id}/approve`, data),

  // Reject invoice
  rejectInvoice: (id: string, data: { reason: string }) =>
    api.post(`/invoices/${id}/reject`, data),

  // Process invoice with OCR
  processOCR: (file: File) => api.upload('/invoices/ocr-process', file),

  // Upload invoice attachment
  uploadAttachment: (invoiceId: string, file: File) =>
    api.upload(`/invoices/${invoiceId}/attachments`, file),

  // Match invoice with PO
  matchWithPO: (id: string, poNumber: string) =>
    api.post(`/invoices/${id}/match-po`, { poNumber }),
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

  // Send PO to vendor
  sendToVendor: (id: string) => api.post(`/purchase-orders/${id}/send`),

  // Approve PO
  approvePO: (id: string, data: { comments?: string }) =>
    api.post(`/purchase-orders/${id}/approve`, data),

  // Receive goods
  receiveGoods: (id: string, data: { items: any[] }) =>
    api.post(`/purchase-orders/${id}/receive-goods`, data),
};

// RFQ Service
export const rfqService = {
  // Get all RFQs
  getRFQs: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    category?: string;
  }) => api.get('/rfqs', params),

  // Get single RFQ
  getRFQ: (id: string) => api.get(`/rfqs/${id}`),

  // Create RFQ
  createRFQ: (data: any) => api.post('/rfqs', data),

  // Update RFQ
  updateRFQ: (id: string, data: any) => api.put(`/rfqs/${id}`, data),

  // Publish RFQ
  publishRFQ: (id: string) => api.post(`/rfqs/${id}/publish`),

  // Submit RFQ response
  submitResponse: (id: string, data: any) => api.post(`/rfqs/${id}/responses`, data),

  // Get RFQ responses
  getResponses: (id: string) => api.get(`/rfqs/${id}/responses`),

  // Award RFQ
  awardRFQ: (id: string, responseId: string) =>
    api.post(`/rfqs/${id}/award`, { responseId }),
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
    const token = localStorage.getItem('auth_token');
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
