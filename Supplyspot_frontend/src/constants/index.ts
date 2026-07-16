// Application constants for Supplier Spot

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZES: [10, 25, 50, 100],
  MAX_PAGE_SIZE: 100,
};

// Status Options
export const VENDOR_STATUS = {
  ACTIVE: 'active',
  UNDER_REVIEW: 'under_review',
  REJECTED: 'rejected',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
} as const;

export const INVOICE_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PAID: 'paid',
  OVERDUE: 'overdue',
} as const;

export const PO_STATUS = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  SENT: 'sent',
  ACKNOWLEDGED: 'acknowledged',
  PARTIALLY_RECEIVED: 'partially_received',
  RECEIVED: 'received',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
} as const;

export const DISPUTE_STATUS = {
  SUBMITTED: 'submitted',
  ASSIGNED: 'assigned',
  INVESTIGATING: 'investigating',
  PENDING_SUPPLIER: 'pending_supplier',
  PENDING_INTERNAL: 'pending_internal',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
  ESCALATED: 'escalated',
} as const;

export const PAYMENT_STATUS = {
  SCHEDULED: 'scheduled',
  PROCESSING: 'processing',
  PROCESSED: 'processed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export const PAYMENT_METHODS = {
  ACH: 'ach',
  WIRE: 'wire',
  CHECK: 'check',
  CREDIT_CARD: 'credit_card',
  OTHER: 'other',
} as const;

// Priority Levels
export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

// Categories
export const VENDOR_CATEGORIES = {
  TECHNOLOGY: 'technology',
  MANUFACTURING: 'manufacturing',
  SERVICES: 'services',
  MATERIALS: 'materials',
  LOGISTICS: 'logistics',
  CONSULTING: 'consulting',
  OTHER: 'other',
} as const;

export const DISPUTE_CATEGORIES = {
  INVOICE_DISCREPANCY: 'invoice_discrepancy',
  PAYMENT_DELAY: 'payment_delay',
  DELIVERY_ISSUE: 'delivery_issue',
  QUALITY_ISSUE: 'quality_issue',
  PO_ISSUE: 'po_issue',
  CONTRACT_DISPUTE: 'contract_dispute',
  OTHER: 'other',
} as const;

// Document Types
export const DOCUMENT_TYPES = {
  TAX_CERTIFICATE: 'tax_certificate',
  BUSINESS_LICENSE: 'business_license',
  INSURANCE: 'insurance',
  W9_FORM: 'w9_form',
  CONTRACT: 'contract',
  INVOICE: 'invoice',
  PURCHASE_ORDER: 'purchase_order',
  RECEIPT: 'receipt',
  OTHER: 'other',
} as const;

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  PROCUREMENT_MANAGER: 'procurement_manager',
  FINANCE_MANAGER: 'finance_manager',
  AP_CLERK: 'ap_clerk',
  SUPPLIER: 'supplier',
  VIEWER: 'viewer',
} as const;

// File Upload
export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  ALLOWED_EXTENSIONS: ['.pdf', '.jpg', '.jpeg', '.png', '.xls', '.xlsx', '.doc', '.docx'],
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  INPUT: 'yyyy-MM-dd',
  API: 'yyyy-MM-dd',
  DATETIME_DISPLAY: 'MMM dd, yyyy HH:mm',
  DATETIME_API: "yyyy-MM-dd'T'HH:mm:ss",
};

// Currency
export const CURRENCY = {
  DEFAULT: 'USD',
  SYMBOLS: {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
  },
};

// Validation Rules
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^\+?[\d\s\-\(\)]+$/,
  TAX_ID_REGEX: /^\d{2}-\d{7}$/,
  MIN_PASSWORD_LENGTH: 8,
  MAX_FILE_NAME_LENGTH: 255,
};

// UI Constants
export const UI = {
  SIDEBAR_WIDTH: {
    EXPANDED: 256,
    COLLAPSED: 64,
  },
  HEADER_HEIGHT: 64,
  FOOTER_HEIGHT: 48,
  CONTAINER_MAX_WIDTH: 1200,
  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    '2XL': 1536,
  },
};

// Notification Types
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
} as const;

// Theme Colors
export const THEME_COLORS = {
  PRIMARY: {
    50: '#eff6ff',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },
  SUCCESS: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
  },
  WARNING: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
  },
  ERROR: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
  },
};

// Feature Flags
export const FEATURES = {
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  ENABLE_REAL_TIME: import.meta.env.VITE_ENABLE_REAL_TIME === 'true',
  ENABLE_ADVANCED_SEARCH: import.meta.env.VITE_ENABLE_ADVANCED_SEARCH === 'true',
  ENABLE_BULK_OPERATIONS: import.meta.env.VITE_ENABLE_BULK_OPERATIONS === 'true',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access forbidden. You do not have permission.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  FILE_TOO_LARGE: 'File size exceeds the maximum allowed limit.',
  INVALID_FILE_TYPE: 'Invalid file type. Please upload a valid file.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  VENDOR_CREATED: 'Vendor created successfully.',
  VENDOR_UPDATED: 'Vendor updated successfully.',
  INVOICE_APPROVED: 'Invoice approved successfully.',
  PAYMENT_PROCESSED: 'Payment processed successfully.',
  DISPUTE_RESOLVED: 'Dispute resolved successfully.',
  FILE_UPLOADED: 'File uploaded successfully.',
  SETTINGS_SAVED: 'Settings saved successfully.',
};

// Loading Messages
export const LOADING_MESSAGES = {
  DEFAULT: 'Loading...',
  SAVING: 'Saving...',
  UPLOADING: 'Uploading...',
  PROCESSING: 'Processing...',
  DELETING: 'Deleting...',
  SEARCHING: 'Searching...',
};

// Export all constants as a single object for easy importing
export const CONSTANTS = {
  API_CONFIG,
  PAGINATION,
  VENDOR_STATUS,
  INVOICE_STATUS,
  PO_STATUS,
  DISPUTE_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  PRIORITY_LEVELS,
  VENDOR_CATEGORIES,
  DISPUTE_CATEGORIES,
  DOCUMENT_TYPES,
  USER_ROLES,
  FILE_UPLOAD,
  DATE_FORMATS,
  CURRENCY,
  VALIDATION,
  UI,
  NOTIFICATION_TYPES,
  THEME_COLORS,
  FEATURES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  LOADING_MESSAGES,
} as const;
