import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { 
  Loader2, 
  Plus, 
  Copy, 
  Trash2, 
  Users, 
  Mail, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  ExternalLink,
  Download
} from 'lucide-react';

interface Invite {
  id: string;
  invite_code: string;
  email?: string;
  role: string;
  status: 'active' | 'used' | 'expired';
  max_uses: number;
  times_used: number;
  expires_at?: string;
  used_at?: string;
  notes?: string;
  created_at: string;
  inviteLink: string;
}

interface InviteStats {
  total_invites: number;
  active_invites: number;
  used_invites: number;
  expired_invites: number;
  total_users_registered: number;
}

interface NewInviteData {
  email?: string;
  role: string;
  maxUses: number;
  expiresAt?: string;
  notes?: string;
}

export default function InviteManager() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [stats, setStats] = useState<InviteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newInvite, setNewInvite] = useState<NewInviteData>({
    role: 'supplier',
    maxUses: 1
  });

  useEffect(() => {
    fetchInvites();
    fetchStats();
  }, []);

  const fetchInvites = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:3001/api/invites', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        setInvites(result.data || []);
      } else {
        setError('Failed to fetch invites');
      }
    } catch (err) {
      setError('Network error while fetching invites');
      console.error('Fetch invites error:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:3001/api/invites/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        setStats(result.data);
      }
    } catch (err) {
      console.error('Fetch stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:3001/api/invites', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newInvite),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Invite created successfully!');
        setShowCreateDialog(false);
        setNewInvite({ role: 'supplier', maxUses: 1 });
        await fetchInvites();
        await fetchStats();
        
        // Copy invite link to clipboard
        if (result.data?.inviteLink) {
          await navigator.clipboard.writeText(result.data.inviteLink);
          setSuccess(prev => prev + ' Invite link copied to clipboard!');
        }
      } else {
        setError(result.error || 'Failed to create invite');
      }
    } catch (err) {
      setError('Network error while creating invite');
      console.error('Create invite error:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteInvite = async (inviteId: string) => {
    setDeleting(inviteId);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:3001/api/invites/${inviteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Invite deleted successfully');
        await fetchInvites();
        await fetchStats();
      } else {
        setError(result.error || 'Failed to delete invite');
      }
    } catch (err) {
      setError('Network error while deleting invite');
      console.error('Delete invite error:', err);
    } finally {
      setDeleting(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess('Link copied to clipboard!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'used':
        return <Badge className="bg-blue-100 text-blue-800">Used</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-800',
      procurement_manager: 'bg-orange-100 text-orange-800',
      finance_manager: 'bg-green-100 text-green-800',
      ap_clerk: 'bg-blue-100 text-blue-800',
      supplier: 'bg-yellow-100 text-yellow-800',
      viewer: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={colors[role] || 'bg-gray-100 text-gray-800'}>
        {role.replace('_', ' ')}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Invite Management</h1>
          <p className="text-gray-600 mt-1">Create and manage user invitations</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Invite
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Invite</DialogTitle>
              <DialogDescription>
                Generate a new invite code for user registration
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={newInvite.email || ''}
                  onChange={(e) => setNewInvite(prev => ({ ...prev, email: e.target.value }))}
                />
                <p className="text-sm text-gray-500">
                  Leave empty to allow anyone with the code to register
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={newInvite.role}
                  onValueChange={(value: string) => setNewInvite(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="procurement_manager">Procurement Manager</SelectItem>
                    <SelectItem value="finance_manager">Finance Manager</SelectItem>
                    <SelectItem value="ap_clerk">AP Clerk</SelectItem>
                    <SelectItem value="supplier">Supplier</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxUses">Maximum Uses</Label>
                <Input
                  id="maxUses"
                  type="number"
                  min="1"
                  max="100"
                  value={newInvite.maxUses}
                  onChange={(e) => setNewInvite(prev => ({ ...prev, maxUses: parseInt(e.target.value) || 1 }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={newInvite.expiresAt || ''}
                  onChange={(e) => setNewInvite(prev => ({ ...prev, expiresAt: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  placeholder="Internal notes about this invite"
                  value={newInvite.notes || ''}
                  onChange={(e) => setNewInvite(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Invite'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.total_invites}</p>
                  <p className="text-sm text-gray-600">Total Invites</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.active_invites}</p>
                  <p className="text-sm text-gray-600">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Mail className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.used_invites}</p>
                  <p className="text-sm text-gray-600">Used</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.expired_invites}</p>
                  <p className="text-sm text-gray-600">Expired</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.total_users_registered}</p>
                  <p className="text-sm text-gray-600">Users Registered</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invites Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Invites</CardTitle>
          <CardDescription>
            Manage your invitation codes and track their usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invites.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No invites yet</h3>
              <p className="text-gray-600 mb-4">Create your first invite to start inviting users</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Invite
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Code</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Role</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Usage</th>
                    <th className="text-left p-2">Expires</th>
                    <th className="text-left p-2">Created</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invites.map((invite) => (
                    <tr key={invite.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <div className="flex items-center space-x-2">
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                            {invite.invite_code}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(invite.inviteLink)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="p-2">
                        {invite.email || (
                          <span className="text-gray-400 text-sm">Anyone</span>
                        )}
                      </td>
                      <td className="p-2">{getRoleBadge(invite.role)}</td>
                      <td className="p-2">
                        {getStatusBadge(invite.status)}
                        {invite.status === 'active' && isExpired(invite.expires_at) && (
                          <Badge className="bg-red-100 text-red-800 ml-1">Expired</Badge>
                        )}
                      </td>
                      <td className="p-2">
                        <div className="flex items-center space-x-1">
                          <span className="text-sm">
                            {invite.times_used}/{invite.max_uses}
                          </span>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${(invite.times_used / invite.max_uses) * 100}%`
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-2">
                        {invite.expires_at ? (
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">
                              {formatDate(invite.expires_at)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Never</span>
                        )}
                      </td>
                      <td className="p-2">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">
                            {formatDate(invite.created_at)}
                          </span>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(invite.inviteLink, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                          {invite.status === 'active' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteInvite(invite.id)}
                              disabled={deleting === invite.id}
                            >
                              {deleting === invite.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
