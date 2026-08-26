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
  { id: 'po-2026-0801', category: 'data', title: 'PO-2026-0801', subtitle: 'Steel Components Inc • $154,200.00 • In-Transit', targetSection: 'purchase-orders', iconName: 'ShoppingCart' },
  { id: 'po-2026-0802', category: 'data', title: 'PO-2026-0802', subtitle: 'Apex Industrial Solutions • $45,800.00 • Acknowledged', targetSection: 'purchase-orders', iconName: 'ShoppingCart' },
  { id: 'po-2026-0803', category: 'data', title: 'PO-2026-0803', subtitle: 'Global Logistics Co • $12,900.00 • Draft', targetSection: 'purchase-orders', iconName: 'ShoppingCart' },
  { id: 'inv-2026-001', category: 'data', title: 'INV-2026-001', subtitle: 'Steel Components Inc • $12,450.00 • Paid', targetSection: 'invoices', iconName: 'Receipt' },
  { id: 'inv-2026-002', category: 'data', title: 'INV-2026-002', subtitle: 'Apex Industrial Solutions • $8,200.00 • Pending', targetSection: 'invoices', iconName: 'Receipt' },
  { id: 'inv-2026-003', category: 'data', title: 'INV-2026-003', subtitle: 'Tashkent Metallurgical Plant • $15,100.00 • Draft', targetSection: 'invoices', iconName: 'Receipt' },
  { id: 'vendor-tech', category: 'data', title: 'Tech Solution Ltd', subtitle: 'john.smith@techcorp.com • Rating: 4.8 ★ • Active', targetSection: 'vendors', iconName: 'Users' },
  { id: 'vendor-global', category: 'data', title: 'Global Supplies Ltd', subtitle: 'maria.garcia@globalsupplies.com • Rating: 4.5 ★ • Active', targetSection: 'vendors', iconName: 'Users' },
  { id: 'vendor-premium', category: 'data', title: 'Premium Services Inc', subtitle: 'david.wilson@premium.com • Rating: 4.2 ★ • Under Review', targetSection: 'vendors', iconName: 'Users' },
  { id: 'vendor-quick', category: 'data', title: 'Quick Logistics', subtitle: 'sarah.johnson@quicklogistics.com • Rating: 3.8 ★ • Inactive', targetSection: 'vendors', iconName: 'Users' },
  { id: 'vendor-digital', category: 'data', title: 'Digital Systems Co', subtitle: 'michael.brown@digitalsystems.com • Rating: 4.9 ★ • Active', targetSection: 'vendors', iconName: 'Users' }
];
