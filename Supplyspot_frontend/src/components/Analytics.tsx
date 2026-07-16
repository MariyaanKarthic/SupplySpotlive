import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  FileText, 
  Clock,
  BarChart3,
  Download,
  Filter
} from 'lucide-react';

const spendingTrendData = [
  { month: 'Jan', amount: 45000, vendors: 12 },
  { month: 'Feb', amount: 52000, vendors: 15 },
  { month: 'Mar', amount: 48000, vendors: 14 },
  { month: 'Apr', amount: 61000, vendors: 18 },
  { month: 'May', amount: 55000, vendors: 16 },
  { month: 'Jun', amount: 67000, vendors: 20 },
  { month: 'Jul', amount: 72000, vendors: 22 },
  { month: 'Aug', amount: 68000, vendors: 21 },
  { month: 'Sep', amount: 75000, vendors: 24 },
  { month: 'Oct', amount: 82000, vendors: 26 },
  { month: 'Nov', amount: 79000, vendors: 25 },
  { month: 'Dec', amount: 89000, vendors: 28 }
];

const categorySpendData = [
  { category: 'Technology', amount: 245000, percentage: 35, color: '#3b82f6' },
  { category: 'Manufacturing', amount: 189000, percentage: 27, color: '#10b981' },
  { category: 'Services', amount: 126000, percentage: 18, color: '#f59e0b' },
  { category: 'Transportation', amount: 98000, percentage: 14, color: '#ef4444' },
  { category: 'Others', amount: 42000, percentage: 6, color: '#8b5cf6' }
];

const vendorPerformanceData = [
  { vendor: 'TechCorp Solutions', score: 4.8, spend: 125000, contracts: 3, onTime: 95 },
  { vendor: 'Digital Systems Co', score: 4.9, spend: 156000, contracts: 4, onTime: 98 },
  { vendor: 'Global Supplies Ltd', score: 4.5, spend: 89000, contracts: 2, onTime: 92 },
  { vendor: 'Premium Services Inc', score: 4.2, spend: 45000, contracts: 1, onTime: 88 },
  { vendor: 'Quick Logistics', score: 3.8, spend: 32000, contracts: 0, onTime: 85 }
];

const paymentTrendData = [
  { month: 'Jan', onTime: 85, late: 12, failed: 3 },
  { month: 'Feb', onTime: 88, late: 10, failed: 2 },
  { month: 'Mar', onTime: 90, late: 8, failed: 2 },
  { month: 'Apr', onTime: 87, late: 11, failed: 2 },
  { month: 'May', onTime: 92, late: 6, failed: 2 },
  { month: 'Jun', onTime: 94, late: 5, failed: 1 }
];

export function Analytics() {
  const [timeRange, setTimeRange] = useState('12months');
  const [selectedMetric, setSelectedMetric] = useState('spending');

  const totalSpend = categorySpendData.reduce((sum, item) => sum + item.amount, 0);
  const avgVendorScore = vendorPerformanceData.reduce((sum, vendor) => sum + vendor.score, 0) / vendorPerformanceData.length;
  const activeVendors = vendorPerformanceData.filter(v => v.contracts > 0).length;
  const avgPaymentTime = 12.5; // days

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Analytics & Reports</h1>
          <p className="text-muted-foreground">Analyze vendor performance and spending patterns</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="12months">Last 12 Months</SelectItem>
              <SelectItem value="24months">Last 24 Months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Spend</p>
              <p className="text-2xl font-semibold">${(totalSpend / 1000).toFixed(0)}K</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-500">+15.2%</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Vendors</p>
              <p className="text-2xl font-semibold">{activeVendors}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-500">+8.3%</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Vendor Score</p>
              <p className="text-2xl font-semibold">{avgVendorScore.toFixed(1)}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-yellow-500">★</span>
                <span className="text-sm text-muted-foreground">Out of 5.0</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Payment Time</p>
              <p className="text-2xl font-semibold">{avgPaymentTime} days</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingDown className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-500">-2.1 days</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Trend */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Spending Trend</h3>
            <p className="text-sm text-muted-foreground">Monthly spending and vendor count</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={320} debounce={50}>
              <AreaChart data={spendingTrendData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" />
                <YAxis />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))"
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Category Distribution */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Spending by Category</h3>
            <p className="text-sm text-muted-foreground">Distribution of spending across categories</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={320} debounce={50}>
              <PieChart>
                <Pie
                  data={categorySpendData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  dataKey="amount"
                  label={({ category, percentage }) => `${category}: ${percentage}%`}
                >
                  {categorySpendData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Payment Performance */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Payment Performance</h3>
            <p className="text-sm text-muted-foreground">On-time vs late payments trend</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={320} debounce={50}>
              <BarChart data={paymentTrendData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" />
                <YAxis />
                <Bar dataKey="onTime" fill="#10b981" name="On Time" />
                <Bar dataKey="late" fill="#f59e0b" name="Late" />
                <Bar dataKey="failed" fill="#ef4444" name="Failed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Vendor Performance */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Top Vendor Performance</h3>
            <p className="text-sm text-muted-foreground">Performance scores and spending</p>
          </div>
          <div className="space-y-4">
            {vendorPerformanceData.slice(0, 5).map((vendor, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex-1">
                  <p className="font-medium text-sm">{vendor.vendor}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-muted-foreground">
                      Score: {vendor.score} ★
                    </span>
                    <span className="text-xs text-muted-foreground">
                      On-time: {vendor.onTime}%
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">${vendor.spend.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{vendor.contracts} contracts</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Category Breakdown</h3>
            <p className="text-sm text-muted-foreground">Detailed spending by category</p>
          </div>
          <div className="space-y-3">
            {categorySpendData.map((category, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{category.category}</span>
                  <span className="text-sm">${(category.amount / 1000).toFixed(0)}K</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${category.percentage}%`,
                      backgroundColor: category.color 
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{category.percentage}% of total</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Insights */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Key Insights</h3>
            <p className="text-sm text-muted-foreground">Important findings and recommendations</p>
          </div>
          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Cost Savings</span>
              </div>
              <p className="text-sm text-green-700">
                15% reduction in average payment processing time this quarter
              </p>
            </div>
            
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Vendor Growth</span>
              </div>
              <p className="text-sm text-blue-700">
                Added 12 new high-performing vendors this month
              </p>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Action Required</span>
              </div>
              <p className="text-sm text-yellow-700">
                3 contracts expiring within the next 30 days
              </p>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Quick Actions</h3>
            <p className="text-sm text-muted-foreground">Generate reports and analysis</p>
          </div>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start gap-2">
              <Download className="w-4 h-4" />
              Vendor Performance Report
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2">
              <FileText className="w-4 h-4" />
              Spending Analysis Report
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2">
              <BarChart3 className="w-4 h-4" />
              Contract Renewal Forecast
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2">
              <DollarSign className="w-4 h-4" />
              Payment Trends Report
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2">
              <Users className="w-4 h-4" />
              Vendor Risk Assessment
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}