import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API, formatApiErrorDetail } from '../App';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Skeleton } from '../components/ui/skeleton';
import { Plus, Trash, User, UserGear, Shield } from '@phosphor-icons/react';

const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'user'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get(`${API}/users`);
      setUsers(data);
    } catch (e) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/users`, formData);
      toast.success('User created successfully');
      setDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/users/${userToDelete.id}`);
      toast.success('User deleted successfully');
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      name: '',
      role: 'user'
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917]">User Management</h1>
          <p className="text-[#78716C]">Manage system users and their roles</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-[#6AAF35] hover:bg-[#5C982E]" data-testid="create-user-btn">
              <Plus size={20} className="mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter full name"
                  required
                  data-testid="user-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@example.com"
                  required
                  data-testid="user-email-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Password *</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  data-testid="user-password-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                  <SelectTrigger data-testid="user-role-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-[#78716C]">
                  Users can create campaigns and add entries. Admins have full access.
                </p>
              </div>

              <DialogFooter className="gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" className="bg-[#6AAF35] hover:bg-[#5C982E]" data-testid="save-user-btn">
                  Create User
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Table */}
      <Card className="border-stone-200">
        <CardContent className="p-0">
          <div className="table-container">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-[#78716C]">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.role === 'admin' ? 'bg-[#F5A623]/10' : 'bg-[#6AAF35]/10'}`}>
                            {user.role === 'admin' ? (
                              <Shield size={20} className="text-[#F5A623]" />
                            ) : (
                              <User size={20} className="text-[#6AAF35]" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-[#1C1917]">{user.name}</p>
                            {user.id === currentUser?.id && (
                              <span className="text-xs text-[#78716C]">(You)</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-[#44403C]">{user.email}</TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={user.role === 'admin' ? 'default' : 'secondary'}
                          className={user.role === 'admin' ? 'bg-[#F5A623]' : ''}
                        >
                          {user.role === 'admin' ? 'Admin' : 'User'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[#78716C]">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN') : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {user.id !== currentUser?.id && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500 hover:text-red-700"
                            onClick={() => { setUserToDelete(user); setDeleteDialogOpen(true); }}
                            data-testid={`delete-user-${user.id}`}
                          >
                            <Trash size={18} />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Role Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-stone-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#6AAF35]/10 flex items-center justify-center">
                <User size={20} className="text-[#6AAF35]" />
              </div>
              <div>
                <p className="font-medium text-[#1C1917]">User Role</p>
              </div>
            </div>
            <ul className="text-sm text-[#44403C] space-y-1">
              <li>• Create campaigns</li>
              <li>• Add daily entries</li>
              <li>• View dashboards and reports</li>
              <li>• Cannot edit/delete campaigns or entries</li>
              <li>• Cannot access settings or user management</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-stone-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#F5A623]/10 flex items-center justify-center">
                <Shield size={20} className="text-[#F5A623]" />
              </div>
              <div>
                <p className="font-medium text-[#1C1917]">Admin Role</p>
              </div>
            </div>
            <ul className="text-sm text-[#44403C] space-y-1">
              <li>• All user permissions</li>
              <li>• Edit and delete campaigns</li>
              <li>• Edit and delete entries</li>
              <li>• Manage monthly settlements</li>
              <li>• Manage system settings</li>
              <li>• Manage users</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          <p className="text-[#44403C]">
            Are you sure you want to delete <strong>{userToDelete?.name}</strong> ({userToDelete?.email})? This action cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} data-testid="confirm-delete-user-btn">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
