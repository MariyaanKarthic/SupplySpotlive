import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { toast } from 'sonner@2.0.3';
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  AlertTriangle,
  Calendar,
  Bell,
  Send,
  FileText,
  Building,
  Target,
  BarChart3,
  CheckCircle2,
  Settings,
  Zap,
  AlertCircle,
  RefreshCw,
  User,
  TrendingDown,
  Copy,
  PlayCircle,
  X as XIcon
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

// Interfaces
interface Condition {
  field: string;
  operator: string;
  value: string | number;
}

interface Approver {
  level: number;
  role: string;
  amount: number;
  email?: string;
}

interface ApprovalRule {
  id: number;
  name: string;
  description: string;
  conditions: Condition[];
  approvers: Approver[];
  isActive: boolean;
  department?: string;
  priority?: number;
  notifyOnTrigger?: boolean;
  escalationDays?: number;
}

// Mock data for pending approvals
const pendingApprovals = [
  {
    id: 1,
    invoiceNumber: 'INV-2023-001',
    vendor: 'TechCorp Solutions',
    amount: 12500,
    department: 'IT',
    submittedDate: '2023-11-15',
    dueDate: '2023-12-15',
    approver: 'John Smith',
    priority: 'High',
    status: 'Pending Approval',
    discrepancies: [],
    costCenter: 'CC-001',
    project: 'Infrastructure Upgrade'
  },
  {
    id: 2,
    invoiceNumber: 'INV-2023-002',
    vendor: 'Global Supplies Ltd',
    amount: 8900,
    department: 'Operations',
    submittedDate: '2023-11-20',
    dueDate: '2023-12-20',
    approver: 'Sarah Johnson',
    priority: 'Medium',
    status: 'First Approval',
    discrepancies: ['Amount Mismatch'],
    costCenter: 'CC-002',
    project: 'Office Supplies'
  },
  {
    id: 3,
    invoiceNumber: 'INV-2023-003',
    vendor: 'Premium Services Inc',
    amount: 25000,
    department: 'Marketing',
    submittedDate: '2023-11-18',
    dueDate: '2023-12-25',
    approver: 'Mike Wilson',
    priority: 'High',
    status: 'Second Approval',
    discrepancies: [],
    costCenter: 'CC-003',
    project: 'Campaign Launch'
  },
  {
    id: 4,
    invoiceNumber: 'INV-2023-004',
    vendor: 'Quick Logistics',
    amount: 3200,
    department: 'Operations',
    submittedDate: '2023-11-01',
    dueDate: '2023-11-30',
    approver: 'Emily Davis',
    priority: 'Urgent',
    status: 'Overdue',
    discrepancies: ['Missing PO', 'Duplicate Invoice'],
    costCenter: 'CC-004',
    project: 'Transportation'
  }
];

// Mock payment schedule data
const paymentSchedule = [
  { date: '2023-12-01', amount: 45000, count: 12, type: 'Due Today' },
  { date: '2023-12-02', amount: 32000, count: 8, type: 'Due Tomorrow' },
  { date: '2023-12-03', amount: 28000, count: 6, type: 'Due This Week' },
  { date: '2023-12-08', amount: 67000, count: 15, type: 'Due Next Week' },
  { date: '2023-12-15', amount: 89000, count: 22, type: 'Due This Month' }
];

// Mock cash flow forecast data
const cashFlowForecast = [
  { month: 'Dec 2023', inflow: 450000, outflow: 380000, net: 70000 },
  { month: 'Jan 2024', inflow: 520000, outflow: 420000, net: 100000 },
  { month: 'Feb 2024', inflow: 480000, outflow: 440000, net: 40000 },
  { month: 'Mar 2024', inflow: 560000, outflow: 480000, net: 80000 }
];

// Mock vendor performance data
const vendorPerformance = [
  {
    vendor: 'TechCorp Solutions',
    invoicesCount: 24,
    totalAmount: 340000,
    avgPaymentDays: 28,
    onTimeDelivery: 96,
    qualityScore: 9.2,
    discrepancyRate: 2.1
  },
  {
    vendor: 'Global Supplies Ltd',
    invoicesCount: 18,
    totalAmount: 180000,
    avgPaymentDays: 32,
    onTimeDelivery: 88,
    qualityScore: 8.7,
    discrepancyRate: 4.3
  },
  {
    vendor: 'Premium Services Inc',
    invoicesCount: 12,
    totalAmount: 280000,
    avgPaymentDays: 25,
    onTimeDelivery: 92,
    qualityScore: 9.0,
    discrepancyRate: 1.8
  }
];

// Mock exception reports
const exceptionReports = [
  {
    id: 1,
    type: 'Amount Mismatch',
    invoiceNumber: 'INV-2023-007',
    vendor: 'ABC Corp',
    description: 'Invoice amount $5,500 vs PO amount $5,000',
    severity: 'Medium',
    assignedTo: 'AP Manager',
    createdDate: '2023-11-20'
  },
  {
    id: 2,
    type: 'Missing PO',
    invoiceNumber: 'INV-2023-008',
    vendor: 'XYZ Services',
    description: 'No matching purchase order found',
    severity: 'High',
    assignedTo: 'Procurement Team',
    createdDate: '2023-11-19'
  },
  {
    id: 3,
    type: 'Duplicate Invoice',
    invoiceNumber: 'INV-2023-009',
    vendor: 'Tech Solutions',
    description: 'Potential duplicate of INV-2023-005',
    severity: 'High',
    assignedTo: 'AP Analyst',
    createdDate: '2023-11-18'
  },
  {
    id: 4,
    type: 'Late Approval',
    invoiceNumber: 'INV-2023-010',
    vendor: 'Office Supplies Co',
    description: 'Invoice pending approval for 7+ days',
    severity: 'Medium',
    assignedTo: 'Department Head',
    createdDate: '2023-11-17'
  }
];

export function APAutomation() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isEditRuleModalOpen, setIsEditRuleModalOpen] = useState(false);
  const [isTestRuleModalOpen, setIsTestRuleModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRule, setSelectedRule] = useState<ApprovalRule | null>(null);

  // Rule form states
  const [ruleName, setRuleName] = useState('');
  const [ruleDescription, setRuleDescription] = useState('');
  const [ruleDepartment, setRuleDepartment] = useState('');
  const [ruleEscalationDays, setRuleEscalationDays] = useState('3');
  const [ruleNotifyOnTrigger, setRuleNotifyOnTrigger] = useState(true);
  const [ruleIsActive, setRuleIsActive] = useState(true);
  const [conditions, setConditions] = useState<Condition[]>([
    { field: '', operator: '', value: '' }
  ]);
  const [approvers, setApprovers] = useState<Approver[]>([
    { level: 1, role: '', amount: 0, email: '' }
  ]);

  // Test invoice data for rule testing
  const [testInvoiceAmount, setTestInvoiceAmount] = useState('');
  const [testInvoiceDepartment, setTestInvoiceDepartment] = useState('');
  const [testInvoiceVendor, setTestInvoiceVendor] = useState('');
  const [testResult, setTestResult] = useState<any>(null);

  // Approval rules state
  const [approvalRules, setApprovalRules] = useState<ApprovalRule[]>([
    {
      id: 1,
      name: 'Small Purchases',
      description: 'Invoices under $1,000',
      conditions: [{ field: 'amount', operator: 'less than', value: 1000 }],
      approvers: [{ level: 1, role: 'Supervisor', amount: 1000 }],
      isActive: true,
      department: 'All',
      priority: 1,
      notifyOnTrigger: true,
      escalationDays: 3
    },
    {
      id: 2,
      name: 'Medium Purchases',
      description: 'Invoices $1,000 - $10,000',
      conditions: [
        { field: 'amount', operator: 'greater than or equal', value: 1000 },
        { field: 'amount', operator: 'less than or equal', value: 10000 }
      ],
      approvers: [
        { level: 1, role: 'Manager', amount: 5000 },
        { level: 2, role: 'Director', amount: 10000 }
      ],
      isActive: true,
      department: 'All',
      priority: 2,
      notifyOnTrigger: true,
      escalationDays: 5
    },
    {
      id: 3,
      name: 'Large Purchases',
      description: 'Invoices over $10,000',
      conditions: [{ field: 'amount', operator: 'greater than', value: 10000 }],
      approvers: [
        { level: 1, role: 'Manager', amount: 5000 },
        { level: 2, role: 'Director', amount: 10000 },
        { level: 3, role: 'VP Finance', amount: 25000 }
      ],
      isActive: true,
      department: 'All',
      priority: 3,
      notifyOnTrigger: true,
      escalationDays: 7
    },
    {
      id: 4,
      name: 'IT Department Expenses',
      description: 'All IT department invoices',
      conditions: [{ field: 'department', operator: 'equals', value: 'IT' }],
      approvers: [
        { level: 1, role: 'IT Manager', amount: 5000 },
        { level: 2, role: 'CTO', amount: 15000 }
      ],
      isActive: true,
      department: 'IT',
      priority: 2,
      notifyOnTrigger: true,
      escalationDays: 4
    }
  ]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'destructive';
      case 'High': return 'default';
      case 'Medium': return 'secondary';
      case 'Low': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'default';
      case 'Pending Approval': return 'outline';
      case 'First Approval': return 'secondary';
      case 'Second Approval': return 'secondary';
      case 'Rejected': return 'destructive';
      case 'Overdue': return 'destructive';
      default: return 'outline';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High': return 'destructive';
      case 'Medium': return 'default';
      case 'Low': return 'secondary';
      default: return 'outline';
    }
  };

  const handleApprove = (approvalId: number) => {
    toast.success('Invoice approved successfully');
  };

  const handleReject = (approvalId: number) => {
    toast.error('Invoice rejected');
  };

  const filteredApprovals = pendingApprovals.filter(approval =>
    approval.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    approval.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    approval.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Rule Management Functions
  const handleAddCondition = () => {
    setConditions([...conditions, { field: '', operator: '', value: '' }]);
  };

  const handleRemoveCondition = (index: number) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter((_, i) => i !== index));
    } else {
      toast.error('At least one condition is required');
    }
  };

  const handleUpdateCondition = (index: number, field: keyof Condition, value: any) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setConditions(newConditions);
  };

  const handleAddApprover = () => {
    const newLevel = approvers.length + 1;
    setApprovers([...approvers, { level: newLevel, role: '', amount: 0, email: '' }]);
  };

  const handleRemoveApprover = (index: number) => {
    if (approvers.length > 1) {
      setApprovers(approvers.filter((_, i) => i !== index));
    } else {
      toast.error('At least one approver is required');
    }
  };

  const handleUpdateApprover = (index: number, field: keyof Approver, value: any) => {
    const newApprovers = [...approvers];
    newApprovers[index] = { ...newApprovers[index], [field]: value };
    setApprovers(newApprovers);
  };

  const resetRuleForm = () => {
    setRuleName('');
    setRuleDescription('');
    setRuleDepartment('');
    setRuleEscalationDays('3');
    setRuleNotifyOnTrigger(true);
    setRuleIsActive(true);
    setConditions([{ field: '', operator: '', value: '' }]);
    setApprovers([{ level: 1, role: '', amount: 0, email: '' }]);
    setSelectedRule(null);
  };

  const validateRuleForm = () => {
    if (!ruleName.trim()) {
      toast.error('Rule name is required');
      return false;
    }
    if (!ruleDescription.trim()) {
      toast.error('Rule description is required');
      return false;
    }
    if (conditions.some(c => !c.field || !c.operator || c.value === '')) {
      toast.error('All condition fields must be filled');
      return false;
    }
    if (approvers.some(a => !a.role || a.amount <= 0)) {
      toast.error('All approver fields must be filled with valid values');
      return false;
    }
    return true;
  };

  const handleCreateRule = () => {
    if (!validateRuleForm()) return;

    const newRule: ApprovalRule = {
      id: approvalRules.length + 1,
      name: ruleName,
      description: ruleDescription,
      conditions: conditions,
      approvers: approvers.map((a, idx) => ({ ...a, level: idx + 1 })),
      isActive: ruleIsActive,
      department: ruleDepartment || 'All',
      priority: approvalRules.length + 1,
      notifyOnTrigger: ruleNotifyOnTrigger,
      escalationDays: parseInt(ruleEscalationDays)
    };

    setApprovalRules([...approvalRules, newRule]);
    toast.success('Approval rule created successfully');
    setIsRulesModalOpen(false);
    resetRuleForm();
  };

  const handleEditRule = (rule: ApprovalRule) => {
    setSelectedRule(rule);
    setRuleName(rule.name);
    setRuleDescription(rule.description);
    setRuleDepartment(rule.department || '');
    setRuleEscalationDays(rule.escalationDays?.toString() || '3');
    setRuleNotifyOnTrigger(rule.notifyOnTrigger ?? true);
    setRuleIsActive(rule.isActive);
    setConditions(rule.conditions);
    setApprovers(rule.approvers);
    setIsEditRuleModalOpen(true);
  };

  const handleUpdateRule = () => {
    if (!validateRuleForm() || !selectedRule) return;

    const updatedRules = approvalRules.map(rule =>
      rule.id === selectedRule.id
        ? {
            ...rule,
            name: ruleName,
            description: ruleDescription,
            conditions: conditions,
            approvers: approvers.map((a, idx) => ({ ...a, level: idx + 1 })),
            isActive: ruleIsActive,
            department: ruleDepartment || 'All',
            notifyOnTrigger: ruleNotifyOnTrigger,
            escalationDays: parseInt(ruleEscalationDays)
          }
        : rule
    );

    setApprovalRules(updatedRules);
    toast.success('Approval rule updated successfully');
    setIsEditRuleModalOpen(false);
    resetRuleForm();
  };

  const handleDeleteRule = (ruleId: number) => {
    setApprovalRules(approvalRules.filter(rule => rule.id !== ruleId));
    toast.success('Approval rule deleted successfully');
  };

  const handleToggleRule = (ruleId: number, isActive: boolean) => {
    const updatedRules = approvalRules.map(rule =>
      rule.id === ruleId ? { ...rule, isActive } : rule
    );
    setApprovalRules(updatedRules);
    toast.success(`Rule ${isActive ? 'activated' : 'deactivated'} successfully`);
  };

  const handleDuplicateRule = (rule: ApprovalRule) => {
    const newRule: ApprovalRule = {
      ...rule,
      id: approvalRules.length + 1,
      name: `${rule.name} (Copy)`,
      priority: approvalRules.length + 1
    };
    setApprovalRules([...approvalRules, newRule]);
    toast.success('Rule duplicated successfully');
  };

  const handleTestRule = (rule: ApprovalRule) => {
    setSelectedRule(rule);
    setTestInvoiceAmount('');
    setTestInvoiceDepartment('');
    setTestInvoiceVendor('');
    setTestResult(null);
    setIsTestRuleModalOpen(true);
  };

  const handleRunRuleTest = () => {
    if (!selectedRule) return;

    const amount = parseFloat(testInvoiceAmount);
    const department = testInvoiceDepartment;

    let matches = true;
    const matchedConditions: string[] = [];
    const failedConditions: string[] = [];

    selectedRule.conditions.forEach(condition => {
      let conditionMet = false;
      
      if (condition.field === 'amount') {
        const conditionValue = Number(condition.value);
        switch (condition.operator) {
          case 'less than':
            conditionMet = amount < conditionValue;
            break;
          case 'greater than':
            conditionMet = amount > conditionValue;
            break;
          case 'less than or equal':
            conditionMet = amount <= conditionValue;
            break;
          case 'greater than or equal':
            conditionMet = amount >= conditionValue;
            break;
          case 'equals':
            conditionMet = amount === conditionValue;
            break;
        }
      } else if (condition.field === 'department') {
        conditionMet = condition.operator === 'equals' 
          ? department === condition.value 
          : department.includes(String(condition.value));
      }

      if (conditionMet) {
        matchedConditions.push(`${condition.field} ${condition.operator} ${condition.value}`);
      } else {
        failedConditions.push(`${condition.field} ${condition.operator} ${condition.value}`);
        matches = false;
      }
    });

    const matchingApprovers = matches ? selectedRule.approvers.filter(a => amount <= a.amount) : [];

    setTestResult({
      matches,
      matchedConditions,
      failedConditions,
      approvers: matches ? selectedRule.approvers : [],
      matchingApprovers,
      escalationDays: selectedRule.escalationDays
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>AP Automation</h1>
          <p className="text-muted-foreground">Automated validation, approval workflows, and AP analytics</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => {
              resetRuleForm();
              setIsRulesModalOpen(true);
            }}
          >
            <Settings className="w-4 h-4" />
            Configure Rules
          </Button>
          <Button className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            AP Dashboard
          </TabsTrigger>
          <TabsTrigger value="approvals" className="gap-2">
            <CheckCircle className="w-4 h-4" />
            Approval Workflow
          </TabsTrigger>
          <TabsTrigger value="exceptions" className="gap-2">
            <AlertTriangle className="w-4 h-4" />
            Exception Reports
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-2">
            <Settings className="w-4 h-4" />
            Approval Rules
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Approvals</p>
                  <p className="text-2xl font-semibold">{pendingApprovals.length}</p>
                  <p className="text-xs text-muted-foreground">
                    ${pendingApprovals.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Due Today</p>
                  <p className="text-2xl font-semibold">12</p>
                  <p className="text-xs text-muted-foreground">$45,000</p>
                </div>
                <Calendar className="w-8 h-8 text-red-500" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Exceptions</p>
                  <p className="text-2xl font-semibold">{exceptionReports.length}</p>
                  <p className="text-xs text-red-500">3 High Priority</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Processing Time</p>
                  <p className="text-2xl font-semibold">2.4</p>
                  <p className="text-xs text-green-500">-0.3 days</p>
                </div>
                <TrendingDown className="w-8 h-8 text-green-500" />
              </div>
            </Card>
          </div>

          {/* Payment Schedule & Cash Flow */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="p-4 border-b">
                <h3>Payment Schedule</h3>
              </div>
              <div className="p-4 space-y-4">
                {paymentSchedule.map((payment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded">
                    <div>
                      <p className="font-medium">{payment.type}</p>
                      <p className="text-sm text-muted-foreground">{payment.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${payment.amount.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">{payment.count} invoices</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="p-4 border-b">
                <h3>Cash Flow Forecast</h3>
              </div>
              <div className="p-4 space-y-4">
                {cashFlowForecast.map((forecast, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{forecast.month}</span>
                      <span className={`font-semibold ${forecast.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {forecast.net >= 0 ? '+' : ''}${forecast.net.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>In: ${forecast.inflow.toLocaleString()}</span>
                      <span>Out: ${forecast.outflow.toLocaleString()}</span>
                    </div>
                    <Progress 
                      value={(forecast.inflow / (forecast.inflow + forecast.outflow)) * 100} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Vendor Performance Metrics */}
          <Card>
            <div className="p-4 border-b">
              <h3>Vendor Performance Metrics</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Vendor</th>
                    <th className="text-left p-4 font-medium">Invoices</th>
                    <th className="text-left p-4 font-medium">Total Amount</th>
                    <th className="text-left p-4 font-medium">Avg Payment Days</th>
                    <th className="text-left p-4 font-medium">On-Time Delivery</th>
                    <th className="text-left p-4 font-medium">Quality Score</th>
                    <th className="text-left p-4 font-medium">Discrepancy Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorPerformance.map((vendor, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{vendor.vendor}</span>
                        </div>
                      </td>
                      <td className="p-4">{vendor.invoicesCount}</td>
                      <td className="p-4">${vendor.totalAmount.toLocaleString()}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span>{vendor.avgPaymentDays} days</span>
                          <Badge variant={vendor.avgPaymentDays <= 30 ? 'default' : 'destructive'}>
                            {vendor.avgPaymentDays <= 30 ? 'Good' : 'Slow'}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span>{vendor.onTimeDelivery}%</span>
                          <Progress value={vendor.onTimeDelivery} className="w-16 h-2" />
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span>{vendor.qualityScore}/10</span>
                          <Badge variant={vendor.qualityScore >= 9 ? 'default' : 'secondary'}>
                            {vendor.qualityScore >= 9 ? 'Excellent' : 'Good'}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={vendor.discrepancyRate < 3 ? 'text-green-600' : 'text-red-600'}>
                          {vendor.discrepancyRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-6">
          {/* Approval Workflow Header */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3>Approval Workflow Management</h3>
                <p className="text-muted-foreground">Auto-routing and validation of invoice approvals</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2">
                  <Bell className="w-4 h-4" />
                  Send Reminders
                </Button>
                <Button className="gap-2">
                  <Zap className="w-4 h-4" />
                  Bulk Approve
                </Button>
              </div>
            </div>
          </Card>

          {/* Search and Filters */}
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search approvals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending Approval</SelectItem>
                  <SelectItem value="first">First Approval</SelectItem>
                  <SelectItem value="second">Second Approval</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Pending Approvals Table */}
          <Card>
            <div className="p-4 border-b">
              <h3>Pending Approvals</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Invoice Details</th>
                    <th className="text-left p-4 font-medium">Vendor</th>
                    <th className="text-left p-4 font-medium">Amount</th>
                    <th className="text-left p-4 font-medium">Department</th>
                    <th className="text-left p-4 font-medium">Approver</th>
                    <th className="text-left p-4 font-medium">Priority</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApprovals.map((approval) => (
                    <tr key={approval.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{approval.invoiceNumber}</p>
                          <p className="text-sm text-muted-foreground">{approval.project}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {approval.submittedDate}
                            </Badge>
                            {approval.discrepancies.length > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {approval.discrepancies.length} Issues
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{approval.vendor}</p>
                          <p className="text-sm text-muted-foreground">{approval.costCenter}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold">${approval.amount.toLocaleString()}</p>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">{approval.department}</Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{approval.approver}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={getPriorityColor(approval.priority)}>
                          {approval.priority}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant={getStatusColor(approval.status)}>
                          {approval.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedApproval(approval);
                              setIsApprovalModalOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Review
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleApprove(approval.id)}>
                                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleReject(approval.id)}>
                                <XCircle className="w-4 h-4 mr-2 text-red-500" />
                                Reject
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Send className="w-4 h-4 mr-2" />
                                Send Reminder
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Reassign
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="exceptions" className="space-y-6">
          {/* Exception Reports Header */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3>Exception Reports</h3>
                <p className="text-muted-foreground">Unmatched invoices, discrepancies, and delayed approvals</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
                <Button className="gap-2">
                  <Download className="w-4 h-4" />
                  Export Report
                </Button>
              </div>
            </div>
          </Card>

          {/* Exception Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Exceptions</p>
                  <p className="text-2xl font-semibold">{exceptionReports.length}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">High Severity</p>
                  <p className="text-2xl font-semibold">
                    {exceptionReports.filter(e => e.severity === 'High').length}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Amount Mismatches</p>
                  <p className="text-2xl font-semibold">
                    {exceptionReports.filter(e => e.type === 'Amount Mismatch').length}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-yellow-500" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Missing POs</p>
                  <p className="text-2xl font-semibold">
                    {exceptionReports.filter(e => e.type === 'Missing PO').length}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-orange-500" />
              </div>
            </Card>
          </div>

          {/* Exception Reports Table */}
          <Card>
            <div className="p-4 border-b">
              <h3>Current Exceptions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Type</th>
                    <th className="text-left p-4 font-medium">Invoice</th>
                    <th className="text-left p-4 font-medium">Vendor</th>
                    <th className="text-left p-4 font-medium">Description</th>
                    <th className="text-left p-4 font-medium">Severity</th>
                    <th className="text-left p-4 font-medium">Assigned To</th>
                    <th className="text-left p-4 font-medium">Created</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {exceptionReports.map((exception) => (
                    <tr key={exception.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <Badge variant="outline">{exception.type}</Badge>
                      </td>
                      <td className="p-4">
                        <span className="font-medium">{exception.invoiceNumber}</span>
                      </td>
                      <td className="p-4">{exception.vendor}</td>
                      <td className="p-4">
                        <p className="text-sm">{exception.description}</p>
                      </td>
                      <td className="p-4">
                        <Badge variant={getSeverityColor(exception.severity)}>
                          {exception.severity}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{exception.assignedTo}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">{exception.createdDate}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Resolve
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          {/* Approval Rules Header */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3>Approval Rules Configuration</h3>
                <p className="text-muted-foreground">Define automatic routing rules based on amount, department, and cost center</p>
              </div>
              <Button 
                className="gap-2" 
                onClick={() => {
                  resetRuleForm();
                  setIsRulesModalOpen(true);
                }}
              >
                <Plus className="w-4 h-4" />
                Add Rule
              </Button>
            </div>
          </Card>

          {/* Active Rules Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Rules</p>
                  <p className="text-2xl font-semibold">{approvalRules.length}</p>
                </div>
                <Settings className="w-8 h-8 text-blue-500" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Rules</p>
                  <p className="text-2xl font-semibold">
                    {approvalRules.filter(r => r.isActive).length}
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Inactive Rules</p>
                  <p className="text-2xl font-semibold">
                    {approvalRules.filter(r => !r.isActive).length}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-gray-500" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Departments</p>
                  <p className="text-2xl font-semibold">
                    {new Set(approvalRules.map(r => r.department)).size}
                  </p>
                </div>
                <Building className="w-8 h-8 text-purple-500" />
              </div>
            </Card>
          </div>

          {/* Approval Rules List */}
          <div className="space-y-4">
            {approvalRules.map((rule) => (
              <Card key={rule.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4>{rule.name}</h4>
                      <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {rule.department && (
                        <Badge variant="outline" className="text-xs">
                          {rule.department}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{rule.description}</p>
                    
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Conditions:</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {rule.conditions.map((condition, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {condition.field} {condition.operator} {condition.value}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-muted-foreground">Approval Levels:</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {rule.approvers.map((approver, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              L{approver.level}: {approver.role} (${approver.amount.toLocaleString()})
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {rule.escalationDays && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Escalate after {rule.escalationDays} days</span>
                          </div>
                        )}
                        {rule.notifyOnTrigger && (
                          <div className="flex items-center gap-1">
                            <Bell className="w-3 h-3" />
                            <span>Notifications enabled</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={rule.isActive}
                      onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditRule(rule)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Rule
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTestRule(rule)}>
                          <PlayCircle className="w-4 h-4 mr-2" />
                          Test Rule
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateRule(rule)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate Rule
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteRule(rule.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Rule
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Approval Review Modal */}
      <Dialog open={isApprovalModalOpen} onOpenChange={setIsApprovalModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Review Invoice Approval</DialogTitle>
            <DialogDescription>
              Review invoice details and validation results before approval
            </DialogDescription>
          </DialogHeader>
          {selectedApproval && (
            <div className="space-y-6">
              {/* Invoice Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Invoice Number</Label>
                  <p className="text-sm mt-1">{selectedApproval.invoiceNumber}</p>
                </div>
                <div>
                  <Label>Vendor</Label>
                  <p className="text-sm mt-1">{selectedApproval.vendor}</p>
                </div>
                <div>
                  <Label>Amount</Label>
                  <p className="text-lg font-semibold mt-1">${selectedApproval.amount.toLocaleString()}</p>
                </div>
                <div>
                  <Label>Department</Label>
                  <p className="text-sm mt-1">{selectedApproval.department}</p>
                </div>
                <div>
                  <Label>Project</Label>
                  <p className="text-sm mt-1">{selectedApproval.project}</p>
                </div>
                <div>
                  <Label>Cost Center</Label>
                  <p className="text-sm mt-1">{selectedApproval.costCenter}</p>
                </div>
              </div>

              {/* Validation Results */}
              <div className="space-y-3">
                <Label>Validation Results</Label>
                {selectedApproval.discrepancies.length === 0 ? (
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-green-800">All validations passed</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedApproval.discrepancies.map((discrepancy: string, index: number) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-red-50 rounded">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <span className="text-red-800">{discrepancy}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Comments */}
              <div className="space-y-2">
                <Label>Approval Comments</Label>
                <Textarea placeholder="Add comments for this approval..." rows={3} />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button 
                  className="gap-2"
                  onClick={() => {
                    handleApprove(selectedApproval.id);
                    setIsApprovalModalOpen(false);
                  }}
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </Button>
                <Button 
                  variant="destructive" 
                  className="gap-2"
                  onClick={() => {
                    handleReject(selectedApproval.id);
                    setIsApprovalModalOpen(false);
                  }}
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </Button>
                <Button variant="outline" className="gap-2">
                  <Send className="w-4 h-4" />
                  Request More Info
                </Button>
                <Button variant="outline" onClick={() => setIsApprovalModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Rule Modal */}
      <Dialog open={isRulesModalOpen} onOpenChange={setIsRulesModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Approval Rule</DialogTitle>
            <DialogDescription>
              Create a new approval rule to automate invoice routing
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rule Name *</Label>
                <Input 
                  placeholder="e.g., Marketing Expenses" 
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={ruleDepartment} onValueChange={setRuleDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Departments</SelectItem>
                    <SelectItem value="IT">IT</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="HR">Human Resources</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Input 
                placeholder="Brief description of the rule" 
                value={ruleDescription}
                onChange={(e) => setRuleDescription(e.target.value)}
              />
            </div>
            
            {/* Conditions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Conditions *</Label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={handleAddCondition}
                >
                  <Plus className="w-4 h-4" />
                  Add Condition
                </Button>
              </div>
              {conditions.map((condition, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <Select
                    value={condition.field}
                    onValueChange={(value) => handleUpdateCondition(index, 'field', value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="amount">Amount</SelectItem>
                      <SelectItem value="department">Department</SelectItem>
                      <SelectItem value="costCenter">Cost Center</SelectItem>
                      <SelectItem value="vendor">Vendor</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={condition.operator}
                    onValueChange={(value) => handleUpdateCondition(index, 'operator', value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Operator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="less than">Less than</SelectItem>
                      <SelectItem value="greater than">Greater than</SelectItem>
                      <SelectItem value="less than or equal">Less than or equal</SelectItem>
                      <SelectItem value="greater than or equal">Greater than or equal</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input 
                    placeholder="Value" 
                    className="flex-1"
                    value={condition.value}
                    onChange={(e) => handleUpdateCondition(index, 'value', e.target.value)}
                  />
                  {conditions.length > 1 && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleRemoveCondition(index)}
                    >
                      <XIcon className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Approval Levels */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Approval Levels *</Label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={handleAddApprover}
                >
                  <Plus className="w-4 h-4" />
                  Add Level
                </Button>
              </div>
              {approvers.map((approver, index) => (
                <div key={index} className="space-y-2 p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Level {index + 1}</Label>
                    {approvers.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRemoveApprover(index)}
                      >
                        <XIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Input 
                      placeholder="Role (e.g., Manager)" 
                      value={approver.role}
                      onChange={(e) => handleUpdateApprover(index, 'role', e.target.value)}
                    />
                    <Input 
                      type="number"
                      placeholder="Max Amount" 
                      value={approver.amount || ''}
                      onChange={(e) => handleUpdateApprover(index, 'amount', parseFloat(e.target.value) || 0)}
                    />
                    <Input 
                      type="email"
                      placeholder="Email (optional)" 
                      value={approver.email || ''}
                      onChange={(e) => handleUpdateApprover(index, 'email', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Additional Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Escalation Days</Label>
                <Input 
                  type="number"
                  placeholder="Days before escalation" 
                  value={ruleEscalationDays}
                  onChange={(e) => setRuleEscalationDays(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={ruleNotifyOnTrigger}
                  onCheckedChange={setRuleNotifyOnTrigger}
                />
                <Label>Send notification when rule is triggered</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  checked={ruleIsActive}
                  onCheckedChange={setRuleIsActive}
                />
                <Label>Activate rule immediately</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsRulesModalOpen(false);
              resetRuleForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateRule}>
              <Plus className="w-4 h-4 mr-2" />
              Create Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Rule Modal */}
      <Dialog open={isEditRuleModalOpen} onOpenChange={setIsEditRuleModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Approval Rule</DialogTitle>
            <DialogDescription>
              Update the approval rule configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Same form as Add Rule Modal */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rule Name *</Label>
                <Input 
                  placeholder="e.g., Marketing Expenses" 
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={ruleDepartment} onValueChange={setRuleDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Departments</SelectItem>
                    <SelectItem value="IT">IT</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="HR">Human Resources</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Input 
                placeholder="Brief description of the rule" 
                value={ruleDescription}
                onChange={(e) => setRuleDescription(e.target.value)}
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Conditions *</Label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={handleAddCondition}
                >
                  <Plus className="w-4 h-4" />
                  Add Condition
                </Button>
              </div>
              {conditions.map((condition, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <Select
                    value={condition.field}
                    onValueChange={(value) => handleUpdateCondition(index, 'field', value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="amount">Amount</SelectItem>
                      <SelectItem value="department">Department</SelectItem>
                      <SelectItem value="costCenter">Cost Center</SelectItem>
                      <SelectItem value="vendor">Vendor</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={condition.operator}
                    onValueChange={(value) => handleUpdateCondition(index, 'operator', value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Operator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="less than">Less than</SelectItem>
                      <SelectItem value="greater than">Greater than</SelectItem>
                      <SelectItem value="less than or equal">Less than or equal</SelectItem>
                      <SelectItem value="greater than or equal">Greater than or equal</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input 
                    placeholder="Value" 
                    className="flex-1"
                    value={condition.value}
                    onChange={(e) => handleUpdateCondition(index, 'value', e.target.value)}
                  />
                  {conditions.length > 1 && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleRemoveCondition(index)}
                    >
                      <XIcon className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Approval Levels *</Label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={handleAddApprover}
                >
                  <Plus className="w-4 h-4" />
                  Add Level
                </Button>
              </div>
              {approvers.map((approver, index) => (
                <div key={index} className="space-y-2 p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Level {index + 1}</Label>
                    {approvers.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRemoveApprover(index)}
                      >
                        <XIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Input 
                      placeholder="Role (e.g., Manager)" 
                      value={approver.role}
                      onChange={(e) => handleUpdateApprover(index, 'role', e.target.value)}
                    />
                    <Input 
                      type="number"
                      placeholder="Max Amount" 
                      value={approver.amount || ''}
                      onChange={(e) => handleUpdateApprover(index, 'amount', parseFloat(e.target.value) || 0)}
                    />
                    <Input 
                      type="email"
                      placeholder="Email (optional)" 
                      value={approver.email || ''}
                      onChange={(e) => handleUpdateApprover(index, 'email', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Escalation Days</Label>
                <Input 
                  type="number"
                  placeholder="Days before escalation" 
                  value={ruleEscalationDays}
                  onChange={(e) => setRuleEscalationDays(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={ruleNotifyOnTrigger}
                  onCheckedChange={setRuleNotifyOnTrigger}
                />
                <Label>Send notification when rule is triggered</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  checked={ruleIsActive}
                  onCheckedChange={setRuleIsActive}
                />
                <Label>Activate rule immediately</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditRuleModalOpen(false);
              resetRuleForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRule}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Update Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Rule Modal */}
      <Dialog open={isTestRuleModalOpen} onOpenChange={setIsTestRuleModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Test Approval Rule</DialogTitle>
            <DialogDescription>
              Test "{selectedRule?.name}" with sample invoice data
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Invoice Amount</Label>
                <Input 
                  type="number"
                  placeholder="Enter amount" 
                  value={testInvoiceAmount}
                  onChange={(e) => setTestInvoiceAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={testInvoiceDepartment} onValueChange={setTestInvoiceDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IT">IT</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="HR">Human Resources</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vendor</Label>
                <Input 
                  placeholder="Vendor name" 
                  value={testInvoiceVendor}
                  onChange={(e) => setTestInvoiceVendor(e.target.value)}
                />
              </div>
            </div>

            <Button onClick={handleRunRuleTest} className="w-full">
              <PlayCircle className="w-4 h-4 mr-2" />
              Run Test
            </Button>

            {testResult && (
              <div className="space-y-4 mt-4">
                <div className={`p-4 rounded-lg ${testResult.matches ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {testResult.matches ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-green-900">Rule Matches</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span className="font-semibold text-red-900">Rule Does Not Match</span>
                      </>
                    )}
                  </div>
                </div>

                {testResult.matchedConditions.length > 0 && (
                  <div>
                    <Label className="text-sm text-green-700">Matched Conditions:</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {testResult.matchedConditions.map((condition: string, index: number) => (
                        <Badge key={index} variant="outline" className="bg-green-50 text-green-700 border-green-300">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {testResult.failedConditions.length > 0 && (
                  <div>
                    <Label className="text-sm text-red-700">Failed Conditions:</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {testResult.failedConditions.map((condition: string, index: number) => (
                        <Badge key={index} variant="outline" className="bg-red-50 text-red-700 border-red-300">
                          <XCircle className="w-3 h-3 mr-1" />
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {testResult.matches && (
                  <div>
                    <Label className="text-sm">Required Approvers:</Label>
                    <div className="space-y-2 mt-2">
                      {testResult.approvers.map((approver: Approver, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Level {approver.level}: {approver.role}</p>
                            <p className="text-sm text-muted-foreground">
                              Max approval amount: ${approver.amount.toLocaleString()}
                            </p>
                          </div>
                          {testResult.matchingApprovers.some((a: Approver) => a.level === approver.level) && (
                            <Badge variant="default">Required</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-900">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Escalation after {testResult.escalationDays} days
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTestRuleModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
