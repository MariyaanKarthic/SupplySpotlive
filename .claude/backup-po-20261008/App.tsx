import React, { useState, lazy } from "react";
import { Sidebar } from "./components/Sidebar";
import { HomeScreen } from "./pages/home/HomeScreen";

// Lazy-loaded routes for code-splitting & fast initial bundle loading
const VendorRegistration = lazy(() => import("./pages/vendor/VendorRegistration").then(m => ({ default: m.VendorRegistration })));
const VendorManagement = lazy(() => import("./pages/vendor/VendorManagement").then(m => ({ default: m.VendorManagement })));
const ContractManagement = lazy(() => import("./pages/procurement/ContractManagement").then(m => ({ default: m.ContractManagement })));
const RFQManagement = lazy(() => import("./pages/procurement/RFQManagement").then(m => ({ default: m.RFQManagement })));
const PurchaseOrderManagement = lazy(() => import("./pages/procurement/PurchaseOrderManagement").then(m => ({ default: m.PurchaseOrderManagement })));
const GoodsReceipts = lazy(() => import("./pages/procurement/GoodsReceipts").then(m => ({ default: m.GoodsReceipts })));
const InvoiceManagement = lazy(() => import("./pages/finance/InvoiceManagement").then(m => ({ default: m.InvoiceManagement })));
const APAutomation = lazy(() => import("./pages/finance/APAutomation").then(m => ({ default: m.APAutomation })));
const PaymentManagement = lazy(() => import("./pages/finance/PaymentManagement").then(m => ({ default: m.PaymentManagement })));
const DocumentManagement = lazy(() => import("./pages/documents/DocumentManagement").then(m => ({ default: m.DocumentManagement })));
const Analytics = lazy(() => import("./pages/analytics/Analytics").then(m => ({ default: m.Analytics })));
const SettingsConfiguration = lazy(() => import("./pages/settings/SettingsConfiguration").then(m => ({ default: m.SettingsConfiguration })));
const AuditTrail = lazy(() => import("./pages/compliance/AuditTrail").then(m => ({ default: m.AuditTrail })));
const SourcingRFx = lazy(() => import("./pages/procurement/SourcingRFx").then(m => ({ default: m.SourcingRFx })));
const RegulatoryCompliance = lazy(() => import("./pages/compliance/RegulatoryCompliance").then(m => ({ default: m.RegulatoryCompliance })));
const DeliverySlots = lazy(() => import("./pages/operations/DeliverySlots").then(m => ({ default: m.DeliverySlots })));
const DisputeManagement = lazy(() => import("./pages/operations/DisputeManagement").then(m => ({ default: m.DisputeManagement })));
const GateEntryIntegration = lazy(() => import("./pages/operations/GateEntryIntegration").then(m => ({ default: m.GateEntryIntegration })));
const SupplierDashboard = lazy(() => import("./pages/supplier/SupplierDashboard").then(m => ({ default: m.SupplierDashboard })));
const Databoards = lazy(() => import("./pages/analytics/Databoards").then(m => ({ default: m.Databoards })));
const RegistrationReview = lazy(() => import("./pages/vendor/RegistrationReview").then(m => ({ default: m.RegistrationReview })));
const ProcurementCollaboration = lazy(() => import("./pages/procurement/ProcurementCollaboration"));
const PurchaseRequisitions = lazy(() => import("./pages/procurement/PurchaseRequisitions").then(m => ({ default: m.PurchaseRequisitions })));

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import Register from './components/Register';
import { PageSkeleton } from "./components/PageSkeleton";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";

export type NavigationItem =
  | "home"
  | "registration"
  | "registration-review"
  | "vendors"
  | "contracts"
  | "sourcing-rfx"
  | "rfq"
  | "purchase-orders"
  | "goods-receipts"
  | "purchase-requisitions"
  | "procurement-collaboration"
  | "invoices"
  | "ap-automation"
  | "payments"
  | "documents"
  | "analytics"
  | "audit-trail"
  | "regulatory-compliance"
  | "delivery-slots"
  | "dispute-management"
  | "gate-entry"
  | "supplier-dashboard"
  | "databoards"
  | "settings";

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./components/ui/breadcrumb";

const sectionTitles: Record<NavigationItem, string> = {
  home: "Home",
  registration: "Vendor Registration",
  "registration-review": "Registration Review",
  vendors: "Vendor Management",
  contracts: "Contract Management",
  "sourcing-rfx": "Sourcing & RFx",
  rfq: "RFQ Management",
  "purchase-orders": "Purchase Orders",
  "goods-receipts": "Goods Receipts",
  "purchase-requisitions": "Purchase Requisitions",
  "procurement-collaboration": "Procurement Collaboration",
  invoices: "Invoice Management",
  "ap-automation": "Ap Automation",
  payments: "Payment Management",
  documents: "Document Management",
  analytics: "Analytics",
  "audit-trail": "Audit Trail",
  "regulatory-compliance": "Regulatory Compliance",
  "delivery-slots": "Delivery Slots",
  "dispute-management": "Dispute Management",
  "gate-entry": "Gate Entry Integration",
  "supplier-dashboard": "Supplier Dashboard",
  databoards: "Databoards",
  settings: "Settings",
};

function Dashboard() {
  const [activeSection, setActiveSection] =
    useState<NavigationItem>("home");

  const renderContent = () => {
    switch (activeSection) {
      case "home":
        return <HomeScreen onNavigate={setActiveSection} />;
      case "registration":
        return <VendorRegistration onNavigate={setActiveSection} />;
      case "registration-review":
        return <RegistrationReview onNavigate={setActiveSection} />;
      case "vendors":
        return (
          <VendorManagement
            onNavigate={setActiveSection}
            onNavigateToRegistration={() =>
              setActiveSection("registration")
            }
          />
        );
      case "contracts":
        return <ContractManagement onNavigate={setActiveSection} />;
      case "sourcing-rfx":
        return <SourcingRFx onNavigate={setActiveSection} />;
      case "rfq":
        return <RFQManagement onNavigate={setActiveSection} />;
      case "purchase-orders":
        return <PurchaseOrderManagement onNavigate={setActiveSection} />;
      case "goods-receipts":
        return <GoodsReceipts onNavigate={setActiveSection} />;
      case "purchase-requisitions":
        return <PurchaseRequisitions onNavigate={setActiveSection} />;
      case "procurement-collaboration":
        return <ProcurementCollaboration onNavigate={setActiveSection} />;
      case "invoices":
        return <InvoiceManagement onNavigate={setActiveSection} />;
      case "ap-automation":
        return <APAutomation onNavigate={setActiveSection} />;
      case "payments":
        return <PaymentManagement onNavigate={setActiveSection} />;
      case "documents":
        return <DocumentManagement onNavigate={setActiveSection} />;
      case "analytics":
        return <Analytics onNavigate={setActiveSection} />;
      case "audit-trail":
        return <AuditTrail onNavigate={setActiveSection} />;
      case "regulatory-compliance":
        return <RegulatoryCompliance onNavigate={setActiveSection} />;
      case "delivery-slots":
        return <DeliverySlots onNavigate={setActiveSection} />;
      case "dispute-management":
        return <DisputeManagement onNavigate={setActiveSection} />;
      case "gate-entry":
        return <GateEntryIntegration onNavigate={setActiveSection} />;
      case "supplier-dashboard":
        return <SupplierDashboard onNavigate={setActiveSection} />;
      case "databoards":
        return <Databoards onNavigate={setActiveSection} />;
      case "settings":
        return <SettingsConfiguration onNavigate={setActiveSection} />;
      default:
        return <VendorManagement onNavigate={setActiveSection} />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      <main className="flex-1 overflow-hidden flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto">
          <React.Suspense fallback={<PageSkeleton />}>
            {renderContent()}
          </React.Suspense>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/signup" element={<Navigate to="/register" replace />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
      <VercelAnalytics />
    </AuthProvider>
  );
}