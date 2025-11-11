import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Shield, 
  Users, 
  Plus, 
  Edit, 
  Trash2,
  Eye,
  UserPlus,
  Settings,
  Lock,
  EyeOff,
  Building2,
  UserCheck
} from 'lucide-react';
import { showSuccessToast, showSmartToast } from '@/lib/toast-utils';

// Unit Manager specific modules and permissions - Only the essential ones
const UNIT_MANAGER_MODULES = [
  {
    name: 'unitManager',
    label: 'Unit Manager',
    features: [
      { key: 'salesApproval', label: 'Sales Approval' },
      { key: 'salesOrderList', label: 'Sales Order List' }
    ]
  }
];

const PERMISSION_ACTIONS = ['view', 'add', 'edit', 'delete'];

// Convert database permission format to UI format
const convertDBPermissionsToUI = (dbPermissions) => {
  const uiPermissions = {};
  
  // Initialize the UI permission structure
  UNIT_MANAGER_MODULES.forEach(module => {
    uiPermissions[module.name] = {};
    module.features.forEach(feature => {
      uiPermissions[module.name][feature.key] = {
        view: false,
        add: false,
        edit: false,
        delete: false
      };
    });
  });
  
  // If the database has module permissions, map them to UI structure
  if (dbPermissions?.modules && Array.isArray(dbPermissions.modules)) {
    dbPermissions.modules.forEach(modulePermission => {
      if (modulePermission.name && uiPermissions[modulePermission.name]) {
        if (modulePermission.features && Array.isArray(modulePermission.features)) {
          modulePermission.features.forEach(feature => {
            if (uiPermissions[modulePermission.name][feature.key]) {
              uiPermissions[modulePermission.name][feature.key] = {
                view: feature.view || false,
                add: feature.add || false,
                edit: feature.edit || false,
                delete: feature.delete || false
              };
            }
          });
        }
      }
    });
  }
  
  return uiPermissions;
};

// Convert UI permission format back to database format
const convertUIPermissionsToDB = (uiPermissions) => {
  const modules = [];
  
  Object.keys(uiPermissions).forEach(moduleName => {
    const moduleFeatures = [];
    const modulePermissions = uiPermissions[moduleName];
    
    Object.keys(modulePermissions).forEach(featureKey => {
      moduleFeatures.push({
        key: featureKey,
        view: modulePermissions[featureKey].view || false,
        add: modulePermissions[featureKey].add || false,
        edit: modulePermissions[featureKey].edit || false,
        delete: modulePermissions[featureKey].delete || false
      });
    });
    
    modules.push({
      name: moduleName,
      features: moduleFeatures
    });
  });
  
  return {
    role: 'unit_manager',
    canAccessAllUnits: false,
    modules
  };
};

const UnitHeadRolePermissionManagement = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    permissions: convertDBPermissionsToUI({}), // Initialize with proper structure
    isActive: true
  });

  const queryClient = useQueryClient();

  // Get Unit Managers under this Unit Head
  const { data: unitManagersData, isLoading, error } = useQuery({
    queryKey: ['unit-managers', searchTerm, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: searchTerm,
        status: statusFilter,
        limit: 100
      });
      
      const response = await apiRequest('GET', `/api/unit-head/unit-managers?${params}`);
      return response;
    }
  });

  // Get available modules
  const { data: modulesData } = useQuery({
    queryKey: ['unit-manager-modules'],
    queryFn: () => apiRequest('GET', '/api/unit-head/modules')
  });

  // Create Unit Manager mutation
  const createUserMutation = useMutation({
    mutationFn: (userData) => apiRequest('POST', '/api/unit-head/unit-managers', userData),
    onSuccess: () => {
      queryClient.invalidateQueries(['unit-managers']);
      showSuccessToast('Unit Manager created successfully!');
      setIsAddingUser(false);
      resetForm();
    },
    onError: (error) => {
      showSmartToast(error.message || 'Failed to create Unit Manager', 'error');
    }
  });

  // Update Unit Manager mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ userId, userData }) => apiRequest('PUT', `/api/unit-head/unit-managers/${userId}`, userData),
    onSuccess: () => {
      queryClient.invalidateQueries(['unit-managers']);
      showSuccessToast('Unit Manager updated successfully!');
      setIsEditingUser(false);
      setSelectedUser(null);
      resetForm();
    },
    onError: (error) => {
      showSmartToast(error.message || 'Failed to update Unit Manager', 'error');
    }
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: ({ userId, newPassword }) => apiRequest('PUT', `/api/unit-head/unit-managers/${userId}/password`, { newPassword }),
    onSuccess: () => {
      showSuccessToast('Password updated successfully!');
      setIsChangingPassword(false);
      setSelectedUser(null);
      resetForm();
    },
    onError: (error) => {
      showSmartToast(error.message || 'Failed to update password', 'error');
    }
  });

  // Delete Unit Manager mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId) => apiRequest('DELETE', `/api/unit-head/unit-managers/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['unit-managers']);
      showSuccessToast('Unit Manager deactivated successfully!');
    },
    onError: (error) => {
      showSmartToast(error.message || 'Failed to deactivate Unit Manager', 'error');
    }
  });

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      fullName: '',
      password: '',
      confirmPassword: '',
      permissions: convertDBPermissionsToUI({}), // Initialize with proper structure
      isActive: true
    });
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      permissions: convertDBPermissionsToUI(user.permissions || {}),
      isActive: user.isActive,
      password: '',
      confirmPassword: ''
    });
    setIsEditingUser(true);
  };

  const handlePermissionChange = (module, feature, action, checked) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...prev.permissions[module],
          [feature]: {
            ...prev.permissions[module]?.[feature],
            [action]: checked
          }
        }
      }
    }));
  };

  const hasPermission = (module, feature, action) => {
    return formData.permissions[module]?.[feature]?.[action] || false;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.password && formData.password !== formData.confirmPassword) {
      showSmartToast('Passwords do not match', 'error');
      return;
    }

    if (isAddingUser) {
      // Prepare the data with proper permissions structure
      const userData = {
        ...formData,
        permissions: convertUIPermissionsToDB(formData.permissions)
      };
      createUserMutation.mutate(userData);
    } else if (isEditingUser) {
      const updateData = { ...formData };
      delete updateData.password;
      delete updateData.confirmPassword;
      
      // Convert UI permissions back to database format
      if (updateData.permissions) {
        updateData.permissions = convertUIPermissionsToDB(updateData.permissions);
      }
      
      updateUserMutation.mutate({ userId: selectedUser._id, userData: updateData });
    }
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    
    if (!formData.password || formData.password.length < 6) {
      showSmartToast('Password must be at least 6 characters long', 'error');
      return;
    }
    
    updatePasswordMutation.mutate({ 
      userId: selectedUser._id, 
      newPassword: formData.password 
    });
  };

  const unitManagers = unitManagersData?.data?.users || [];
  const summary = unitManagersData?.data?.summary || {};
  const currentUnit = unitManagersData?.data?.unit || '';

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            Error loading data: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Unit Manager Management</h1>
          <p className="text-gray-600">Manage Unit Managers and their permissions for {currentUnit}</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsAddingUser(true);
          }}
          className="flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add Unit Manager
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Unit Managers</p>
                <p className="text-2xl font-bold">{summary.totalManagers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Managers</p>
                <p className="text-2xl font-bold text-green-600">{summary.activeManagers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Building2 className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Current Unit</p>
                <p className="text-xl font-bold text-orange-600">{currentUnit}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name, username, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unit Managers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Unit Managers
          </CardTitle>
          <CardDescription>
            Manage Unit Managers under your supervision
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading Unit Managers...</p>
            </div>
          ) : unitManagers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No Unit Managers found</p>
              <Button
                onClick={() => {
                  resetForm();
                  setIsAddingUser(true);
                }}
                className="mt-4"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add First Unit Manager
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {unitManagers.map((user) => (
                <div 
                  key={user._id} 
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{user.fullName}</h3>
                        <p className="text-sm text-gray-600">@{user.username} • {user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">Unit Manager</Badge>
                          <Badge 
                            variant={user.isActive ? "default" : "secondary"}
                            className={user.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setFormData({ ...formData, password: '', confirmPassword: '' });
                          setIsChangingPassword(true);
                        }}
                      >
                        <Lock className="w-4 h-4 mr-1" />
                        Password
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to deactivate ${user.fullName}?`)) {
                            deleteUserMutation.mutate(user._id);
                          }
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Deactivate
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unit Manager Role Permissions Matrix */}
    
      {/* Add User Dialog */}
      <Dialog open={isAddingUser} onOpenChange={setIsAddingUser}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Add New Unit Manager
            </DialogTitle>
            <DialogDescription>
              Create a new Unit Manager for your unit with specific permissions
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2 col-span-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  required
                />
              </div>
            </div>

            <Separator />

            {/* Permissions Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Module Permissions
              </h3>
              
              <div className="bg-white border rounded-lg">
                {/* Permission Matrix */}
                <div className="p-4">
                  {/* Table Header */}
                  <div className="grid grid-cols-5 gap-4 mb-4 pb-2 border-b">
                    <div className="font-medium text-sm text-gray-600">Feature</div>
                    <div className="text-center font-medium text-sm text-gray-600 flex items-center justify-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </div>
                    <div className="text-center font-medium text-sm text-gray-600 flex items-center justify-center gap-1">
                      <Plus className="w-4 h-4" />
                      <span>Add</span>
                    </div>
                    <div className="text-center font-medium text-sm text-gray-600 flex items-center justify-center gap-1">
                      <Edit className="w-4 h-4" />
                      <span>Edit</span>
                    </div>
                    <div className="text-center font-medium text-sm text-gray-600 flex items-center justify-center gap-1">
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </div>
                  </div>
                  
                  {/* Permission Rows */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {UNIT_MANAGER_MODULES.flatMap(module => 
                      module.features.map(feature => (
                        <div key={`${module.name}-${feature.key}`} className="grid grid-cols-5 gap-4 items-center py-2 hover:bg-gray-50 rounded">
                          <div className="font-medium text-sm">{feature.label}</div>
                          <div className="flex justify-center">
                            <Switch
                              checked={hasPermission(module.name, feature.key, 'view')}
                              onCheckedChange={(checked) => 
                                handlePermissionChange(module.name, feature.key, 'view', checked)
                              }
                              className="data-[state=checked]:bg-blue-600"
                            />
                          </div>
                          <div className="flex justify-center">
                            <Switch
                              checked={hasPermission(module.name, feature.key, 'add')}
                              onCheckedChange={(checked) => 
                                handlePermissionChange(module.name, feature.key, 'add', checked)
                              }
                              className="data-[state=checked]:bg-blue-600"
                            />
                          </div>
                          <div className="flex justify-center">
                            <Switch
                              checked={hasPermission(module.name, feature.key, 'edit')}
                              onCheckedChange={(checked) => 
                                handlePermissionChange(module.name, feature.key, 'edit', checked)
                              }
                              className="data-[state=checked]:bg-blue-600"
                            />
                          </div>
                          <div className="flex justify-center">
                            <Switch
                              checked={hasPermission(module.name, feature.key, 'delete')}
                              onCheckedChange={(checked) => 
                                handlePermissionChange(module.name, feature.key, 'delete', checked)
                              }
                              className="data-[state=checked]:bg-blue-600"
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
              />
              <Label>Active User</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddingUser(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending ? 'Creating...' : 'Create Unit Manager'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditingUser} onOpenChange={setIsEditingUser}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit Unit Manager
            </DialogTitle>
            <DialogDescription>
              Update Unit Manager details and permissions
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editFullName">Full Name *</Label>
                <Input
                  id="editFullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="editUsername">Username *</Label>
                <Input
                  id="editUsername"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2 col-span-2">
                <Label htmlFor="editEmail">Email *</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
            </div>

            <Separator />

            {/* Permissions Section - Same as Add */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Module Permissions
              </h3>
              
              <div className="bg-white border rounded-lg">
                {/* Permission Matrix */}
                <div className="p-4">
                  {/* Table Header */}
                  <div className="grid grid-cols-5 gap-4 mb-4 pb-2 border-b">
                    <div className="font-medium text-sm text-gray-600">Feature</div>
                    <div className="text-center font-medium text-sm text-gray-600 flex items-center justify-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </div>
                    <div className="text-center font-medium text-sm text-gray-600 flex items-center justify-center gap-1">
                      <Plus className="w-4 h-4" />
                      <span>Add</span>
                    </div>
                    <div className="text-center font-medium text-sm text-gray-600 flex items-center justify-center gap-1">
                      <Edit className="w-4 h-4" />
                      <span>Edit</span>
                    </div>
                    <div className="text-center font-medium text-sm text-gray-600 flex items-center justify-center gap-1">
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </div>
                  </div>
                  
                  {/* Permission Rows */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {UNIT_MANAGER_MODULES.flatMap(module => 
                      module.features.map(feature => (
                        <div key={`${module.name}-${feature.key}`} className="grid grid-cols-5 gap-4 items-center py-2 hover:bg-gray-50 rounded">
                          <div className="font-medium text-sm">{feature.label}</div>
                          <div className="flex justify-center">
                            <Switch
                              checked={hasPermission(module.name, feature.key, 'view')}
                              onCheckedChange={(checked) => 
                                handlePermissionChange(module.name, feature.key, 'view', checked)
                              }
                              className="data-[state=checked]:bg-blue-600"
                            />
                          </div>
                          <div className="flex justify-center">
                            <Switch
                              checked={hasPermission(module.name, feature.key, 'add')}
                              onCheckedChange={(checked) => 
                                handlePermissionChange(module.name, feature.key, 'add', checked)
                              }
                              className="data-[state=checked]:bg-blue-600"
                            />
                          </div>
                          <div className="flex justify-center">
                            <Switch
                              checked={hasPermission(module.name, feature.key, 'edit')}
                              onCheckedChange={(checked) => 
                                handlePermissionChange(module.name, feature.key, 'edit', checked)
                              }
                              className="data-[state=checked]:bg-blue-600"
                            />
                          </div>
                          <div className="flex justify-center">
                            <Switch
                              checked={hasPermission(module.name, feature.key, 'delete')}
                              onCheckedChange={(checked) => 
                                handlePermissionChange(module.name, feature.key, 'delete', checked)
                              }
                              className="data-[state=checked]:bg-blue-600"
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
              />
              <Label>Active User</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditingUser(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateUserMutation.isPending}
              >
                {updateUserMutation.isPending ? 'Updating...' : 'Update Unit Manager'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={isChangingPassword} onOpenChange={setIsChangingPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Change Password
            </DialogTitle>
            <DialogDescription>
              Update the password for {selectedUser?.fullName}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password *</Label>
              <Input
                id="newPassword"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Enter new password (min 6 characters)"
                required
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsChangingPassword(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updatePasswordMutation.isPending}
              >
                {updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UnitHeadRolePermissionManagement;