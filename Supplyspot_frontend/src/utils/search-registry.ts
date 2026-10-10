import { NavigationItem } from '../App';

export interface SearchItem {
  id: string;
  category: 'modules' | 'submodules' | 'data';
  title: string;
  subtitle?: string;
  targetSection: NavigationItem;
  iconName: string;
  actionContext?: any;
}

export const searchItems: SearchItem[] = [
  // Modules
  { id: 'home', category: 'modules', title: 'Home', subtitle: 'Overview & Main Dashboard', targetSection: 'home', iconName: 'Home' },
  { id: 'registration', category: 'modules', title: 'Vendor Registration', subtitle: 'New supplier onboarding forms', targetSection: 'registration', iconName: 'UserPlus' },
  { id: 'registration-review', category: 'modules', title: 'Registration Review', subtitle: 'Approve and audit pending onboarding requests', targetSection: 'registration-review', iconName: 'FileCheck' },
  { id: 'vendors', category: 'modules', title: 'Vendor Management', subtitle: 'View profile profiles, status, ratings', targetSection: 'vendors', iconName: 'Users' },
  { id: 'supplier-dashboard', category: 'modules', title: 'Supplier Dashboard', subtitle: 'Portal overview for registered vendors', targetSection: 'supplier-dashboard', iconName: 'Monitor' },
  { id: 'sourcing-rfx', category: 'modules', title: 'Sourcing & RFx', subtitle: 'Bidding events and RFx materials', targetSection: 'sourcing-rfx', iconName: 'Target' },
  { id: 'rfq', category: 'modules', title: 'RFQ Management', subtitle: 'Requests for quotations and bidding sheets', targetSection: 'rfq', iconName: 'Quote' },
  { id: 'purchase-orders', category: 'modules', title: 'Purchase Orders', subtitle: 'Issued PO contracts and tracking', targetSection: 'purchase-orders', iconName: 'ShoppingCart' },
  { id: 'purchase-requisitions', category: 'modules', title: 'Purchase Requisitions', subtitle: 'Internal procurement demands', targetSection: 'purchase-requisitions', iconName: 'ClipboardList' },
  { id: 'goods-receipts', category: 'modules', title: 'Goods Receipts', subtitle: 'Inbound delivery inspections & logs', targetSection: 'goods-receipts', iconName: 'PackageCheck' },
  { id: 'procurement-collaboration', category: 'modules', title: 'Collaboration Dashboard', subtitle: 'Procurement discussions & task sharing', targetSection: 'procurement-collaboration', iconName: 'Users2' },
  { id: 'contracts', category: 'modules', title: 'Contracts', subtitle: 'Active master agreements & renewals', targetSection: 'contracts', iconName: 'FileText' },
  { id: 'compliance', category: 'modules', title: 'Compliance Dashboard', subtitle: 'Vendor certifications, expiring certificates, audits due and compliance issues', targetSection: 'compliance', iconName: 'ShieldCheck' },
  { id: 'reports', category: 'modules', title: 'Reports', subtitle: 'Spend, supplier, delivery, approval, payment and compliance reports with CSV/PDF export', targetSection: 'reports', iconName: 'FileBarChart2' },
  { id: 'finance', category: 'modules', title: 'Finance Dashboard', subtitle: 'Spending, outstanding and overdue invoices, payments and aging', targetSection: 'finance', iconName: 'LayoutDashboard' },
  { id: 'invoices', category: 'modules', title: 'Invoices', subtitle: 'Supplier billing & payment triggers', targetSection: 'invoices', iconName: 'Receipt' },
  { id: 'ap-automation', category: 'modules', title: 'AP Automation', subtitle: 'Automated invoice matching & OCR processing', targetSection: 'ap-automation', iconName: 'Zap' },
  { id: 'payments', category: 'modules', title: 'Payments', subtitle: 'Remittances and accounts payable history', targetSection: 'payments', iconName: 'CreditCard' },
  { id: 'delivery-slots', category: 'modules', title: 'Smart Delivery Slots', subtitle: 'AI load balancing & inbound dock booking', targetSection: 'delivery-slots', iconName: 'Truck' },
  { id: 'gate-entry', category: 'modules', title: 'Gate Entry Integration', subtitle: 'Gate pass clearance & truck arrival logs', targetSection: 'gate-entry', iconName: 'UserCheck' },
  { id: 'dispute-management', category: 'modules', title: 'Dispute & Query Management', subtitle: 'Support ticket resolution center', targetSection: 'dispute-management', iconName: 'MessageSquare' },
  { id: 'documents', category: 'modules', title: 'Documents', subtitle: 'Compliance registry and file explorer', targetSection: 'documents', iconName: 'FolderOpen' },
  { id: 'databoards', category: 'modules', title: 'Databoards', subtitle: 'Interactive SQL tables and visual reports', targetSection: 'databoards', iconName: 'Database' },
  { id: 'analytics', category: 'modules', title: 'Analytics', subtitle: 'Spend trends and delivery SLA KPIs', targetSection: 'analytics', iconName: 'BarChart3' },
  { id: 'audit-trail', category: 'modules', title: 'Audit Trail', subtitle: 'Compliance logs and action logs', targetSection: 'audit-trail', iconName: 'Shield' },
  { id: 'regulatory-compliance', category: 'modules', title: 'Regulatory & Sustainability', subtitle: 'ESG checklists and compliance policies', targetSection: 'regulatory-compliance', iconName: 'ShieldCheck' },
  { id: 'settings', category: 'modules', title: 'Settings', subtitle: 'General system settings & configurations', targetSection: 'settings', iconName: 'Settings' },

  // Sub-Modules & Actions
  { id: 'new-requisition', category: 'submodules', title: 'Create Purchase Requisition', subtitle: 'Draft a new internal buying request', targetSection: 'purchase-requisitions', iconName: 'ClipboardList', actionContext: { action: 'create' } },
  { id: 'new-rfq', category: 'submodules', title: 'Create New RFQ Event', subtitle: 'Publish pricing request to bidders', targetSection: 'rfq', iconName: 'Quote', actionContext: { action: 'create' } },
  { id: 'upload-invoice', category: 'submodules', title: 'Submit Digital Invoice', subtitle: 'Upload PDF invoice for OCR matching', targetSection: 'invoices', iconName: 'Receipt', actionContext: { action: 'upload' } },
  { id: 'dispatch-clearance', category: 'submodules', title: 'Dispatch Gate Clearance', subtitle: 'Authorize gate entry for in-bound fleet', targetSection: 'delivery-slots', iconName: 'UserCheck', actionContext: { action: 'dispatch' } },
  { id: 'compliance-upload', category: 'submodules', title: 'Upload Compliance Document', subtitle: 'Submit ISO or security certificate', targetSection: 'documents', iconName: 'Upload', actionContext: { action: 'upload' } },
  { id: 'route-optimize', category: 'submodules', title: 'Smart Route Optimization', subtitle: 'Recompute active fleet waypoints', targetSection: 'delivery-slots', iconName: 'Zap', actionContext: { action: 'optimize' } },

  // Mock Data Records
  // Purchase Orders
  { id: 'po-2025-001', category: 'data', title: 'PO-2025-001', subtitle: 'TechCorp Inc. • $60,000.00 • High Priority • Executive Office Desk', targetSection: 'purchase-orders', iconName: 'ShoppingCart' },
  { id: 'po-2023-001', category: 'data', title: 'PO-2023-001', subtitle: 'TechCorp Inc. • $47,500.00 • High Priority • HP EliteBook Laptops', targetSection: 'purchase-orders', iconName: 'ShoppingCart' },
  { id: 'po-2023-002', category: 'data', title: 'PO-2023-002', subtitle: 'StartupCorp • $22,000.00 • Medium Priority • Office 365 E3 Licenses', targetSection: 'purchase-orders', iconName: 'ShoppingCart' },
  { id: 'po-2023-003', category: 'data', title: 'PO-2023-003', subtitle: 'EventCorp • $12,500.00 • High Priority • Corporate Catering', targetSection: 'purchase-orders', iconName: 'ShoppingCart' },
  { id: 'po-2023-004', category: 'data', title: 'PO-2023-004', subtitle: 'BuildCorp • $68,000.00 • High Priority • Steel Beams Grade A', targetSection: 'purchase-orders', iconName: 'ShoppingCart' },

  // RFQs
  { id: 'rfq-2025-001', category: 'data', title: 'RFQ-2025-001', subtitle: 'Office Furniture Supply RFQ • Budget: $60,000 • High Priority', targetSection: 'rfq', iconName: 'Quote' },
  { id: 'rfq-2025-002', category: 'data', title: 'RFQ-2025-002', subtitle: 'Raw Materials Sourcing • Budget: $150,000 • Awarded', targetSection: 'rfq', iconName: 'Quote' },
  { id: 'rfq-2023-001', category: 'data', title: 'RFQ-2023-001', subtitle: 'Office Equipment Procurement • Budget: $50,000 • Open', targetSection: 'rfq', iconName: 'Quote' },
  { id: 'rfq-2023-002', category: 'data', title: 'RFQ-2023-002', subtitle: 'Software Licensing • Budget: $25,000 • Under Review', targetSection: 'rfq', iconName: 'Quote' },
  { id: 'rfq-2023-003', category: 'data', title: 'RFQ-2023-003', subtitle: 'Catering Services • Budget: $15,000 • Awarded', targetSection: 'rfq', iconName: 'Quote' },

  // Goods Receipts
  { id: 'gr-2024-001', category: 'data', title: 'GR-2024-001', subtitle: 'Tech Solutions Ltd. • PO-2023-001 • Completed • 3-Way Matched', targetSection: 'goods-receipts', iconName: 'PackageCheck' },
  { id: 'gr-2024-002', category: 'data', title: 'GR-2024-002', subtitle: 'Global Supplies Inc. • PO-2023-002 • Pending Inspection', targetSection: 'goods-receipts', iconName: 'PackageCheck' },
  { id: 'gr-2024-003', category: 'data', title: 'GR-2024-003', subtitle: 'Industrial Parts Co. • PO-2023-003 • Partial • Issues Found', targetSection: 'goods-receipts', iconName: 'PackageCheck' },

  // Smart Delivery Slots & Bookings
  { id: 'book-001', category: 'data', title: 'BOOK-001 (In-Transit)', subtitle: 'Steel Components Inc • PO-2026-0801 • Dock 03 • Semi-Trailer', targetSection: 'delivery-slots', iconName: 'Truck' },
  { id: 'book-002', category: 'data', title: 'BOOK-002 (Confirmed)', subtitle: 'Apex Logistics • PO-2026-0802 • Dock 01 • Box Truck', targetSection: 'delivery-slots', iconName: 'Truck' },
  { id: 'book-003', category: 'data', title: 'BOOK-003 (Delivered)', subtitle: 'Global Electronics • PO-2026-0803 • Dock Cleanroom 02', targetSection: 'delivery-slots', iconName: 'Truck' },
  { id: 'book-004', category: 'data', title: 'BOOK-004 (Delayed)', subtitle: 'EcoPolymer Synthetics • PO-2026-0804 • Dock 05 • Hazmat', targetSection: 'delivery-slots', iconName: 'Truck' },
  { id: 'book-005', category: 'data', title: 'BOOK-005 (High)', subtitle: 'ThermalTech Heat Exchangers • PO-2026-0805 • Confirmed', targetSection: 'delivery-slots', iconName: 'Truck' },

  // Invoices
  { id: 'inv-2023-001', category: 'data', title: 'INV-2023-001', subtitle: 'TechCorp Solutions • $12,500.00 • Paid • john.smith@techcorp.com', targetSection: 'invoices', iconName: 'Receipt' },
  { id: 'inv-2023-002', category: 'data', title: 'INV-2023-002', subtitle: 'Global Supplies Ltd • $8,900.00 • Pending Approval • maria.garcia@globalsupplies.com', targetSection: 'invoices', iconName: 'Receipt' },
  { id: 'inv-2023-003', category: 'data', title: 'INV-2023-003', subtitle: 'Premium Services Inc • $4,500.00 • Approved • david.wilson@premium.com', targetSection: 'invoices', iconName: 'Receipt' },
  { id: 'inv-2023-004', category: 'data', title: 'INV-2023-004', subtitle: 'Quick Logistics • $3,200.00 • Overdue • sarah.johnson@quicklogistics.com', targetSection: 'invoices', iconName: 'Receipt' },
  { id: 'inv-2023-005', category: 'data', title: 'INV-2023-005', subtitle: 'Digital Systems Co • $15,600.00 • OCR Processing • michael.brown@digitalsystems.com', targetSection: 'invoices', iconName: 'Receipt' },

  // Disputes
  { id: 'disp-100', category: 'data', title: 'DISP-100 (High)', subtitle: 'Amount Mismatch ($750 Freight Charge) • INV-AF-2024-089 • PO-2024-123', targetSection: 'dispute-management', iconName: 'MessageSquare' },
  { id: 'disp-101', category: 'data', title: 'DISP-101 (Medium)', subtitle: 'Missing PO Reference • INV-TC-445 • David Rodriguez', targetSection: 'dispute-management', iconName: 'MessageSquare' },

  // Vendors
  { id: 'vendor-tech', category: 'data', title: 'Tech Solution Ltd', subtitle: 'john.smith@techcorp.com • Rating: 4.8 ★ • Active', targetSection: 'vendors', iconName: 'Users' },
  { id: 'vendor-global', category: 'data', title: 'Global Supplies Ltd', subtitle: 'maria.garcia@globalsupplies.com • Rating: 4.5 ★ • Active', targetSection: 'vendors', iconName: 'Users' },
  { id: 'vendor-premium', category: 'data', title: 'Premium Services Inc', subtitle: 'david.wilson@premium.com • Rating: 4.2 ★ • Under Review', targetSection: 'vendors', iconName: 'Users' },
  { id: 'vendor-quick', category: 'data', title: 'Quick Logistics', subtitle: 'sarah.johnson@quicklogistics.com • Rating: 3.8 ★ • Inactive', targetSection: 'vendors', iconName: 'Users' },
  { id: 'vendor-digital', category: 'data', title: 'Digital Systems Co', subtitle: 'michael.brown@digitalsystems.com • Rating: 4.9 ★ • Active', targetSection: 'vendors', iconName: 'Users' }
];
