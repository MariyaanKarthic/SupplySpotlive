import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { 
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  CreditCard,
  Users,
  Mail,
  Database,
  Globe,
  Palette,
  Trash2,
  Plus,
  Edit,
  Eye,
  EyeOff
} from 'lucide-react';

const userRoles = [
  { id: 1, name: 'John Smith', email: 'john.smith@company.com', role: 'Admin', status: 'Active', lastLogin: '2023-12-10' },
  { id: 2, name: 'Sarah Johnson', email: 'sarah.johnson@company.com', role: 'Manager', status: 'Active', lastLogin: '2023-12-09' },
  { id: 3, name: 'Mike Wilson', email: 'mike.wilson@company.com', role: 'Viewer', status: 'Active', lastLogin: '2023-12-08' },
  { id: 4, name: 'Emily Davis', email: 'emily.davis@company.com', role: 'Editor', status: 'Inactive', lastLogin: '2023-12-05' }
];

export function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'users', label: 'Users & Roles', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'integrations', label: 'Integrations', icon: Database },
    { id: 'billing', label: 'Billing', icon: CreditCard }
  ];

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Company Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name</Label>
            <Input id="company-name" defaultValue="ACME Corporation" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-email">Contact Email</Label>
            <Input id="company-email" type="email" defaultValue="admin@acme.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-phone">Phone Number</Label>
            <Input id="company-phone" defaultValue="+1 (555) 123-4567" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-website">Website</Label>
            <Input id="company-website" defaultValue="https://acme.com" />
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="company-address">Address</Label>
            <Textarea id="company-address" defaultValue="123 Business Ave, Suite 100, City, State 12345" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">System Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Currency</Label>
              <p className="text-sm text-muted-foreground">Default currency for financial calculations</p>
            </div>
            <Select defaultValue="usd">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usd">USD ($)</SelectItem>
                <SelectItem value="eur">EUR (€)</SelectItem>
                <SelectItem value="gbp">GBP (£)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Date Format</Label>
              <p className="text-sm text-muted-foreground">How dates are displayed throughout the system</p>
            </div>
            <Select defaultValue="mm-dd-yyyy">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mm-dd-yyyy">MM/DD/YYYY</SelectItem>
                <SelectItem value="dd-mm-yyyy">DD/MM/YYYY</SelectItem>
                <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Timezone</Label>
              <p className="text-sm text-muted-foreground">System timezone for schedules and reports</p>
            </div>
            <Select defaultValue="est">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="est">Eastern Time (EST)</SelectItem>
                <SelectItem value="pst">Pacific Time (PST)</SelectItem>
                <SelectItem value="cst">Central Time (CST)</SelectItem>
                <SelectItem value="utc">UTC</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderUsersSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">User Management</h3>
          <p className="text-sm text-muted-foreground">Manage user accounts and permissions</p>
        </div>
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Add a new user to the system by entering their details below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user-name">Full Name</Label>
                  <Input id="user-name" placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-email">Email</Label>
                  <Input id="user-email" type="email" placeholder="john@company.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-role">Role</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-department">Department</Label>
                  <Input id="user-department" placeholder="Finance" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>Cancel</Button>
                <Button onClick={() => setIsAddUserOpen(false)}>Add User</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-medium">User</th>
                <th className="text-left p-4 font-medium">Role</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Last Login</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {userRoles.map((user) => (
                <tr key={user.id} className="border-b hover:bg-muted/50">
                  <td className="p-4">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant="outline">{user.role}</Badge>
                  </td>
                  <td className="p-4">
                    <Badge variant={user.status === 'Active' ? 'default' : 'secondary'}>
                      {user.status}
                    </Badge>
                  </td>
                  <td className="p-4">{user.lastLogin}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Email Notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>New Vendor Registration</Label>
              <p className="text-sm text-muted-foreground">Get notified when new vendors register</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Contract Expiration</Label>
              <p className="text-sm text-muted-foreground">Alerts 30 days before contract expiration</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Payment Failures</Label>
              <p className="text-sm text-muted-foreground">Immediate notification for failed payments</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Weekly Reports</Label>
              <p className="text-sm text-muted-foreground">Weekly spending and performance summary</p>
            </div>
            <Switch />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">In-App Notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Invoice Approval Requests</Label>
              <p className="text-sm text-muted-foreground">Show notifications for pending approvals</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Document Updates</Label>
              <p className="text-sm text-muted-foreground">Notify when documents are uploaded or updated</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>System Maintenance</Label>
              <p className="text-sm text-muted-foreground">Alerts about system updates and maintenance</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </Card>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Authentication</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">Require 2FA for all users</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Session Timeout</Label>
              <p className="text-sm text-muted-foreground">Automatic logout after inactivity</p>
            </div>
            <Select defaultValue="30">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="240">4 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Password Requirements</Label>
              <p className="text-sm text-muted-foreground">Enforce strong password policy</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">API Security</h3>
        <div className="space-y-4">
          <div>
            <Label>API Key</Label>
            <div className="flex items-center gap-2 mt-2">
              <Input 
                type={showApiKey ? "text" : "password"}
                value="sk_test_1234567890abcdef"
                readOnly
                className="font-mono"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button variant="outline" size="sm">
                Regenerate
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Rate Limiting</Label>
              <p className="text-sm text-muted-foreground">Limit API requests per hour</p>
            </div>
            <Select defaultValue="1000">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="100">100/hour</SelectItem>
                <SelectItem value="500">500/hour</SelectItem>
                <SelectItem value="1000">1000/hour</SelectItem>
                <SelectItem value="5000">5000/hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderIntegrationsSettings = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Payment Integrations</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Stripe</p>
                <p className="text-sm text-muted-foreground">Payment processing</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default">Connected</Badge>
              <Button variant="outline" size="sm">Configure</Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">QuickBooks</p>
                <p className="text-sm text-muted-foreground">Accounting integration</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Not Connected</Badge>
              <Button variant="outline" size="sm">Connect</Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Communication</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">SendGrid</p>
                <p className="text-sm text-muted-foreground">Email delivery</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default">Connected</Badge>
              <Button variant="outline" size="sm">Configure</Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="font-medium">Slack</p>
                <p className="text-sm text-muted-foreground">Team notifications</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Not Connected</Badge>
              <Button variant="outline" size="sm">Connect</Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderBillingSettings = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Current Plan</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xl font-semibold">Professional Plan</p>
            <p className="text-sm text-muted-foreground">Up to 100 vendors, unlimited contracts</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold">$99/month</p>
            <Button variant="outline" size="sm" className="mt-2">
              Upgrade Plan
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Usage</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Vendors</span>
              <span className="text-sm">284 / 1000</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: '28.4%' }} />
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Storage</span>
              <span className="text-sm">2.4 GB / 10 GB</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: '24%' }} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">API Calls</span>
              <span className="text-sm">45,230 / 100,000</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: '45.23%' }} />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6" />
            <div>
              <p className="font-medium">•••• •••• •••• 4242</p>
              <p className="text-sm text-muted-foreground">Expires 12/25</p>
            </div>
          </div>
          <Button variant="outline" size="sm">Update</Button>
        </div>
      </Card>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general': return renderGeneralSettings();
      case 'users': return renderUsersSettings();
      case 'notifications': return renderNotificationSettings();
      case 'security': return renderSecuritySettings();
      case 'integrations': return renderIntegrationsSettings();
      case 'billing': return renderBillingSettings();
      default: return renderGeneralSettings();
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Settings</h1>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "secondary" : "ghost"}
                className="w-full justify-start gap-3"
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1">
          {renderTabContent()}
          
          <div className="mt-8 pt-6 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Changes are automatically saved
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">Reset to Defaults</Button>
                <Button>Save Changes</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}