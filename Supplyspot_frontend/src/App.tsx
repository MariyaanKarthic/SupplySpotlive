import React, { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { HomeScreen } from "./components/HomeScreen";
import { VendorRegistration } from "./components/VendorRegistration";
import { VendorManagement } from "./components/VendorManagement";
import { ContractManagement } from "./components/ContractManagement";
import { RFQManagement } from "./components/RFQManagement";
import { PurchaseOrderManagement } from "./components/PurchaseOrderManagement";
import { GoodsReceipts } from "./components/GoodsReceipts";
import { InvoiceManagement } from "./components/InvoiceManagement";
import { APAutomation } from "./components/APAutomation";
import { PaymentManagement } from "./components/PaymentManagement";
import { DocumentManagement } from "./components/DocumentManagement";
import { Analytics } from "./components/Analytics";
import { Settings } from "./components/Settings";
import { AuditTrail } from "./components/AuditTrail";
import { SourcingRFx } from "./components/SourcingRFx";
import { RegulatoryCompliance } from "./components/RegulatoryCompliance";
import { DeliverySlots } from "./components/DeliverySlots";
import { DisputeManagement } from "./components/DisputeManagement";
import { GateEntryIntegration } from "./components/GateEntryIntegration";
import { SupplierDashboard } from "./components/SupplierDashboard";
import { Databoards } from "./components/Databoards";
import { RegistrationReview } from "./components/RegistrationReview";
import ProcurementCollaboration from "./components/ProcurementCollaboration";
import { PurchaseRequisitions } from "@/components/PurchaseRequisitions";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
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