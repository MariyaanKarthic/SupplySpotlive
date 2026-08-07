import React from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FileText, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const monthlySpendData = [
  { month: 'Jan', amount: 45000 },
  { month: 'Feb', amount: 52000 },
  { month: 'Mar', amount: 48000 },
  { month: 'Apr', amount: 61000 },
  { month: 'May', amount: 55000 },
  { month: 'Jun', amount: 67000 },
];

const vendorPerformanceData = [
  { name: 'Excellent', value: 35, color: '#22c55e' },
  { name: 'Good', value: 45, color: '#3b82f6' },
  { name: 'Average', value: 15, color: '#f59e0b' },
  { name: 'Poor', value: 5, color: '#ef4444' },
];

const recentActivities = [
  { id: 1, action: 'New vendor registration', vendor: 'TechCorp Solutions', time: '2 hours ago', status: 'pending' },
  { id: 2, action: 'Invoice approved', vendor: 'Global Supplies Ltd', time: '4 hours ago', status: 'approved' },
  { id: 3, action: 'Contract renewed', vendor: 'Premium Services Inc', time: '6 hours ago', status: 'completed' },
  { id: 4, action: 'Payment processed', vendor: 'Digital Systems Co', time: '8 hours ago', status: 'completed' },
  { id: 5, action: 'Document uploaded', vendor: 'Quick Logistics', time: '1 day ago', status: 'review' },
];

export function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Dashboard</h1>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Total Vendors</p>
              <p className="text-xl font-bold text-foreground mt-0.5">284</p>
              <p className="text-[11px] text-emerald-600 font-medium">+12% growth</p>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Active Contracts</p>
              <p className="text-xl font-bold text-foreground mt-0.5">156</p>
              <p className="text-[11px] text-rose-600 font-medium">-3% vs target</p>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-lg">
              <FileText className="w-5 h-5 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Monthly Spend</p>
              <p className="text-xl font-bold text-foreground mt-0.5">$67K</p>
              <p className="text-[11px] text-emerald-600 font-medium">+8% spend rate</p>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Pending Approvals</p>
              <p className="text-xl font-bold text-foreground mt-0.5">23</p>
              <p className="text-[11px] text-rose-600 font-medium">Requires attention</p>
            </div>
            <div className="p-2.5 bg-rose-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Spending Trend */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Monthly Spending Trend</h3>
            <p className="text-sm text-muted-foreground">Vendor payments over the last 6 months</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={256} debounce={50}>
              <BarChart data={monthlySpendData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" />
                <YAxis />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Vendor Performance */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Vendor Performance</h3>
            <p className="text-sm text-muted-foreground">Performance rating distribution</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={256} debounce={50}>
              <PieChart>
                <Pie
                  data={vendorPerformanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                >
                  {vendorPerformanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            {vendorPerformanceData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm">{item.name}: {item.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Recent Activities</h3>
          <p className="text-sm text-muted-foreground">Latest updates and activities</p>
        </div>
        <div className="space-y-4">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-muted">
                  {activity.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {activity.status === 'pending' && <Clock className="w-4 h-4 text-yellow-500" />}
                  {activity.status === 'approved' && <CheckCircle className="w-4 h-4 text-blue-500" />}
                  {activity.status === 'review' && <AlertTriangle className="w-4 h-4 text-orange-500" />}
                </div>
                <div>
                  <p className="font-medium">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">{activity.vendor}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge 
                  variant={
                    activity.status === 'completed' ? 'default' :
                    activity.status === 'approved' ? 'secondary' :
                    activity.status === 'pending' ? 'outline' : 'destructive'
                  }
                >
                  {activity.status}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}