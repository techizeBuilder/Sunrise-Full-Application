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
  EyeOff
} from 'lucide-react';
import { showSuccessToast, showSmartToast } from '@/lib/toast-utils';

// Role and Module Configuration
const ROLES = [
  { value: 'Super User', label: 'Super User' },
  { value: 'Unit Head', label: 'Unit Head' },
  { value: 'Unit Manager', label: 'Unit Manager' },
  { value: 'Production', label: 'Production' },
  { value: 'Packing', label: 'Packing' },
  { value: 'Dispatch', label: 'Dispatch' },
  { value: 'Sales', label: 'Sales' },
  { value: 'Accounts', label: 'Accounts' }
];

const UNITS = [
  { value: 'Unit A', label: 'Unit A' },
  { value: 'Unit B', label: 'Unit B' },
  { value: 'Unit C', label: 'Unit C' },
  { value: 'Main Office', label: 'Main Office' }
];

const MODULES = [
  {
    name: 'unitManager',
    label: 'Unit Manager',
    features: [
      { key: 'salesApproval', label: 'Sales Approval' },
      { key: 'salesOrderList', label: 'Sales Order List' }
    ]
  },
  {
    name: 'unitHead',
    label: 'Unit Head',
    features: [
      { key: 'dashboard', label: 'Dashboard' },
      { key: 'orders', label: 'Orders' },
      { key: 'sales', label: 'Sales' },
      { key: 'dispatches', label: 'Dispatches' },
      { key: 'accounts', label: 'Accounts' },
      { key: 'inventory', label: 'Inventory' },
      { key: 'customers', label: 'Customers' },
      { key: 'suppliers', label: 'Suppliers' },
      { key: 'purchases', label: 'Purchases' },
      { key: 'manufacturing', label: 'Manufacturing' },
      { key: 'production', label: 'Production' },
    ]
  },
  {
    name: 'dashboard',
    label: 'Dashboard',
    features: [
      { key: 'overview', label: 'Overview' },
      { key: 'analytics', label: 'Analytics' },
      { key: 'reports', label: 'Reports' }
    ]
  },
  {
    name: 'orders',
    label: 'Orders',
    features: [
      { key: 'allOrders', label: 'All Orders' },
      { key: 'createOrder', label: 'Create Order' },
      { key: 'orderReports', label: 'Order Reports' }
    ]
  },
  {
    name: 'purchases',
    label: 'Purchases',
    features: [
      { key: 'allPurchases', label: 'All Purchases' },
      { key: 'createPurchase', label: 'Create Purchase' },
      { key: 'purchaseReports', label: 'Purchase Reports' }
    ]
  },
  {
    name: 'sales',
    label: 'Sales',
    features: [
      { key: 'orders', label: 'My Orders' },
      { key: 'myCustomers', label: 'My Customers' },
      { key: 'myDeliveries', label: 'My Dispatches' },
      { key: 'myInvoices', label: 'My Payments' },
      { key: 'refundReturn', label: 'Return/Damage' }
    ]
  },
  {
    name: 'dispatches',
    label: 'Dispatches',
    features: [
      { key: 'allDispatches', label: 'All Dispatches' },
      { key: 'createDispatch', label: 'Create Dispatch' },
      { key: 'trackingInfo', label: 'Tracking Info' }
    ]
  },
  {
    name: 'production',
    label: 'Production',
    features: [
      { key: 'todaysIndents', label: 'Today\'s Indents' },
      { key: 'summaryPanel', label: 'Summary Panel' },
      { key: 'submitData', label: 'Submit Production Data' },
      { key: 'submissionHistory', label: 'Submission History' }
    ]
  },
  {
    name: 'manufacturing',
    label: 'Manufacturing',
    features: [
      { key: 'allJobs', label: 'All Jobs' },
      { key: 'productionSchedule', label: 'Production Schedule' },
      { key: 'qualityControl', label: 'Quality Control' }
    ]
  },
  {
    name: 'accounts',
    label: 'Accounts',
    features: [
      { key: 'transactions', label: 'Transactions' },
      { key: 'balanceSheet', label: 'Balance Sheet' },
      { key: 'reports', label: 'Financial Reports' }
    ]
  },
  {
    name: 'inventory',
    label: 'Inventory',
    features: [
      { key: 'items', label: 'Items' },
      { key: 'categories', label: 'Categories' },
      { key: 'stockIn', label: 'Stock In' },
      { key: 'stockOut', label: 'Stock Out' }
    ]
  },
  {
    name: 'customers',
    label: 'Customers',
    features: [
      { key: 'allCustomers', label: 'All Customers' },
      { key: 'createCustomer', label: 'Create Customer' },
      { key: 'customerReports', label: 'Customer Reports' }
    ]
  },
  {
    name: 'suppliers',
    label: 'Suppliers',
    features: [
      { key: 'allSuppliers', label: 'All Suppliers' },
      { key: 'createSupplier', label: 'Create Supplier' },
      { key: 'supplierReports', label: 'Supplier Reports' }
    ]
  },
  {
    name: 'settings',
    label: 'Settings',
    features: [
      { key: 'general', label: 'General Settings' },
      { key: 'users', label: 'User Management' },
      { key: 'system', label: 'System Configuration' }
    ]
  }
];

const DEFAULT_PERMISSIONS = {
  role: '',
  unit: '',
  canAccessAllUnits: false,
  modules: []
};

const PERMISSION_ACTIONS = ['view', 'add', 'edit', 'delete'];

export default function RolePermissionManagement() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    role: '',
    unit: '',
    isActive: true,
    permissions: { ...DEFAULT_PERMISSIONS }
  });

  const queryClient = useQueryClient();

  // Fetch users
  const { data: usersResponse, isLoading } = useQuery({
    queryKey: ['/api/users'],
    enabled: true,
    retry: 1
  });

  const users = usersResponse?.users || [];

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (userData) => apiRequest('POST', '/api/users', userData),
    onSuccess: () => {
      showSuccessToast('User Created', 'User has been created successfully');
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      showSmartToast(error, 'Failed to create user');
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, ...userData }) => apiRequest('PUT', `/api/users/${id}`, userData),
    onSuccess: () => {
      showSuccessToast('User Updated', 'User has been updated successfully');
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsEditDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      showSmartToast(error, 'Failed to update user');
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId) => apiRequest('DELETE', `/api/users/${userId}`),
    onSuccess: () => {
      showSuccessToast('User Deleted', 'User has been deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error) => {
      showSmartToast(error, 'Failed to delete user');
    }
  });

  const resetForm = () => {
    const newFormData = {
      username: '',
      email: '',
      password: '',
      fullName: '',
      role: '',
      unit: '',
      isActive: true,
      permissions: { 
        role: '',
        unit: '',
        canAccessAllUnits: false,
        modules: []
      }
    };
    setFormData(newFormData);
    setSelectedUser(null);
  };

  const handleCreateUser = () => {
    // Validate required fields
    if (!formData.username || !formData.email || !formData.password || !formData.role) {
      showSmartToast({ message: 'Username, email, password, and role are required' }, 'Validation Error');
      return;
    }

    // Ensure permissions structure is properly formatted
    const userData = {
      ...formData,
      permissions: {
        role: formData.role.toLowerCase().replace(' ', '_'),
        unit: formData.unit || '',
        canAccessAllUnits: formData.permissions.canAccessAllUnits,
        modules: formData.permissions.modules || []
      }
    };

    createUserMutation.mutate(userData);
  };

  const handleUpdateUser = () => {
    // Validate required fields
    if (!formData.username || !formData.email || !formData.role) {
      showSmartToast({ message: 'Username, email, and role are required' }, 'Validation Error');
      return;
    }

    const updateData = { ...formData };
    if (!updateData.password) {
      delete updateData.password;
    }
    
    updateUserMutation.mutate({ id: selectedUser._id, ...updateData });
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      fullName: user.fullName || '',
      role: user.role,
      unit: user.unit || '',
      isActive: user.isActive,
      permissions: user.permissions || { ...DEFAULT_PERMISSIONS }
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteUser = (user) => {
    if (window.confirm(`Are you sure you want to delete user "${user.username}"?`)) {
      deleteUserMutation.mutate(user._id);
    }
  };

  // Handle password update dialog
  const handlePasswordUpdate = (user) => {
    setSelectedUser(user);
    setPasswordForm({ newPassword: '', confirmPassword: '' });
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setIsPasswordDialogOpen(true);
  };

  // Handle password form submission
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      showValidationToast([
        { path: ['newPassword'], message: 'New password is required' },
        { path: ['confirmPassword'], message: 'Password confirmation is required' }
      ], 'Password Update');
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showValidationToast([
        { path: ['confirmPassword'], message: 'Passwords do not match' }
      ], 'Password Update');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      showValidationToast([
        { path: ['newPassword'], message: 'Password must be at least 6 characters long' }
      ], 'Password Update');
      return;
    }
    
    updatePasswordMutation.mutate({ 
      userId: selectedUser._id, 
      newPassword: passwordForm.newPassword 
    });
  };

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: ({ userId, newPassword }) => apiRequest('PUT', `/api/users/${userId}/password`, { newPassword }),
    onSuccess: () => {
      showSuccessToast('Password Updated', 'User password has been updated successfully');
      setIsPasswordDialogOpen(false);
      setSelectedUser(null);
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    },
    onError: (error) => {
      showSmartToast(error, 'Failed to update password');
    }
  });

  const setRoleDefaultPermissions = (role) => {
    // Set default permissions based on role
    const rolePermissions = {
      role: role.toLowerCase().replace(' ', '_'),
      unit: formData.unit,
      canAccessAllUnits: role === 'Super User',
      modules: getDefaultModulesForRole(role)
    };
    
    setFormData(prevData => ({
      ...prevData,
      role: role,
      permissions: rolePermissions
    }));
  };

  const getDefaultModulesForRole = (role) => {
    // Return default modules based on role
    switch (role) {
      case 'Super User':
        return MODULES.map(module => ({
          name: module.name,
          dashboard: true,
          features: module.features.map(feature => ({
            key: feature.key,
            view: true,
            add: true,
            edit: true,
            delete: true
          }))
        }));
      case 'Unit Head':
        return [
          {
            name: 'unitHead',
            dashboard: true,
            features: [
              { key: 'dashboard', view: true, add: false, edit: false, delete: false, alter: false },
              { key: 'orders', view: true, add: false, edit: false, delete: false, alter: false },
              { key: 'sales', view: true, add: false, edit: false, delete: false, alter: false },
              { key: 'dispatches', view: true, add: false, edit: false, delete: false, alter: false },
              { key: 'accounts', view: true, add: false, edit: false, delete: false, alter: false },
              { key: 'inventory', view: true, add: false, edit: false, delete: false, alter: false },
              { key: 'customers', view: true, add: false, edit: false, delete: false, alter: false },
              { key: 'suppliers', view: true, add: false, edit: false, delete: false, alter: false },
              { key: 'purchases', view: true, add: false, edit: false, delete: false, alter: false },
              { key: 'manufacturing', view: true, add: false, edit: false, delete: false, alter: false },
              { key: 'production', view: true, add: false, edit: false, delete: false, alter: false },
              { key: 'settings', view: true, add: false, edit: false, delete: false, alter: false }
            ]
          }
        ];
      case 'Unit Manager':
        return [
          {
            name: 'unitManager',
            dashboard: true,
            features: [
              { key: 'salesApproval', view: true, add: true, edit: true, delete: true, alter: false },
              { key: 'salesOrderList', view: true, add: true, edit: true, delete: true, alter: false }
            ]
          }
        ];
      case 'Sales':
        return [
          {
            name: 'sales',
            dashboard: true,
            features: [
              { key: 'orders', view: true, add: true, edit: true, delete: true, alter: true },
              { key: 'myCustomers', view: true, add: true, edit: true, delete: true, alter: true },
              { key: 'myDeliveries', view: true, add: false, edit: false, delete: false, alter: false },
              { key: 'myInvoices', view: true, add: false, edit: false, delete: false, alter: false },
              { key: 'refundReturn', view: true, add: true, edit: true, delete: true, alter: true }
            ]
          }
        ];
      default:
        return [];
    }
  };

  const updateModulePermission = (moduleName, enabled) => {
    if (enabled) {
      // When enabling a module, add it with all features enabled
      const newModule = {
        name: moduleName,
        dashboard: true,
        features: MODULES.find(m => m.name === moduleName)?.features.map(f => ({
          key: f.key,
          view: true,
          add: true,
          edit: true,
          delete: true
        })) || []
      };
      
      const updatedModules = [...formData.permissions.modules.filter(m => m.name !== moduleName), newModule];
      
      setFormData({
        ...formData,
        permissions: {
          ...formData.permissions,
          modules: updatedModules
        }
      });
    } else {
      // When disabling a module, remove it completely
      const updatedModules = formData.permissions.modules.filter(m => m.name !== moduleName);
      
      setFormData({
        ...formData,
        permissions: {
          ...formData.permissions,
          modules: updatedModules
        }
      });
    }
  };

  const updateFeaturePermission = (moduleName, featureKey, action, value) => {
    const updatedModules = formData.permissions.modules.map(module => {
      if (module.name === moduleName) {
        return {
          ...module,
          features: module.features.map(feature => {
            if (feature.key === featureKey) {
              return { ...feature, [action]: value };
            }
            return feature;
          })
        };
      }
      return module;
    });

    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        modules: updatedModules
      }
    });
  };

  const isModuleEnabled = (moduleName) => {
    return formData.permissions.modules.some(m => m.name === moduleName);
  };

  const getFeaturePermission = (moduleName, featureKey, action) => {
    const module = formData.permissions.modules.find(m => m.name === moduleName);
    const feature = module?.features.find(f => f.key === featureKey);
    return feature?.[action] || false;
  };

  const handleCanAccessAllUnitsChange = (checked) => {
    if (checked) {
      // Enable all modules with full permissions
      const allModulesWithFullPermissions = MODULES.map(module => ({
        name: module.name,
        dashboard: true,
        features: module.features.map(feature => ({
          key: feature.key,
          view: true,
          add: true,
          edit: true,
          delete: true
        }))
      }));
      
      setFormData({
        ...formData,
        permissions: {
          ...formData.permissions,
          canAccessAllUnits: true,
          modules: allModulesWithFullPermissions
        }
      });
    } else {
      // Disable all modules
      setFormData({
        ...formData,
        permissions: {
          ...formData.permissions,
          canAccessAllUnits: false,
          modules: []
        }
      });
    }
  };

  const giveAllPermissions = () => {
    // Enable all modules with all permissions
    const allModulesWithFullPermissions = MODULES.map(module => ({
      name: module.name,
      dashboard: true,
      features: module.features.map(feature => ({
        key: feature.key,
        view: true,
        add: true,
        edit: true,
        delete: true
      }))
    }));

    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        canAccessAllUnits: true,
        modules: allModulesWithFullPermissions
      }
    });
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'Super User': return 'default';
      case 'Unit Head': return 'secondary';
      case 'Production': return 'outline';
      case 'Sales': return 'destructive';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6 p-2 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Role & Permission Management</h1>
          <p className="text-muted-foreground">
            View user roles and permission structures. Use User Management to create and edit users.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
              <UserPlus className="h-4 w-4 mr-2" />
              Create New User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Create New User
              </DialogTitle>
              <DialogDescription>
                Configure user details and module-level permissions
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    placeholder="test"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="test@gmail.com"
                  />
                </div>
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    placeholder="test"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value) => {
                      setFormData({...formData, role: value});
                      setRoleDefaultPermissions(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                </div>
              </div>

              {/* Can Access All Units */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="canAccessAllUnits"
                  checked={formData.permissions.canAccessAllUnits}
                  onCheckedChange={handleCanAccessAllUnitsChange}
                />
                <Label htmlFor="canAccessAllUnits">Can Access All Units</Label>
              </div>

              {/* Module Permissions */}
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Module Permissions</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={giveAllPermissions}
                    className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Give All Permissions
                  </Button>
                </div>
                <div className="space-y-4 mt-4">
                  {MODULES.map((module) => {
                    const moduleEnabled = isModuleEnabled(module.name);
                    return (
                      <Card key={module.name} className={moduleEnabled ? 'border-blue-200' : 'border-gray-200'}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={moduleEnabled}
                                onCheckedChange={(checked) => updateModulePermission(module.name, checked)}
                              />
                              <Label className="text-base font-medium capitalize">{module.label}</Label>
                            </div>
                          </div>
                        </CardHeader>
                        
                        {moduleEnabled && (
                          <CardContent className="pt-0">
                            <div className="space-y-3">
                              <div className="hidden lg:grid grid-cols-5 gap-4 text-sm font-medium text-center border-b pb-2">
                                <div>Feature</div>
                                <div className="flex flex-col items-center">
                                  <Eye className="h-4 w-4 mb-1" />
                                  <span>View</span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <Plus className="h-4 w-4 mb-1" />
                                  <span>Add</span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <Edit className="h-4 w-4 mb-1" />
                                  <span>Edit</span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <Trash2 className="h-4 w-4 mb-1" />
                                  <span>Delete</span>
                                </div>
                              </div>
                              
                              {/* Mobile Header */}
                              <div className="lg:hidden text-sm font-medium text-center border-b pb-2">
                                Module Permissions
                              </div>
                              
                              {module.features.map((feature) => (
                                <div key={feature.key}>
                                  {/* Desktop Layout */}
                                  <div className="hidden lg:grid grid-cols-5 gap-4 items-center py-2">
                                    <div className="text-sm font-medium">{feature.label}</div>
                                    {PERMISSION_ACTIONS.map((action) => (
                                      <div key={action} className="flex justify-center">
                                        <Switch
                                          checked={getFeaturePermission(module.name, feature.key, action)}
                                          onCheckedChange={(checked) => 
                                            updateFeaturePermission(module.name, feature.key, action, checked)
                                          }
                                          size="sm"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                  
                                  {/* Mobile Layout */}
                                  <div className="lg:hidden border border-gray-200 dark:border-gray-700 rounded-lg p-3 mb-3">
                                    <div className="font-medium text-sm mb-2">{feature.label}</div>
                                    <div className="grid grid-cols-2 gap-3">
                                      {PERMISSION_ACTIONS.map((action) => (
                                        <div key={action} className="flex items-center justify-between">
                                          <span className="text-sm capitalize">{action}</span>
                                          <Switch
                                            checked={getFeaturePermission(module.name, feature.key, action)}
                                            onCheckedChange={(checked) => 
                                              updateFeaturePermission(module.name, feature.key, action, checked)
                                            }
                                            size="sm"
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateUser} 
                  disabled={createUserMutation.isPending || !formData.username || !formData.email || !formData.password || !formData.role}
                  className="w-full sm:w-auto"
                >
                  {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                </Button>
              </div>
              

            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users & Permissions Overview
          </CardTitle>
          <CardDescription>
            Review user accounts with their role-based permission structures
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-sm">User</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Module Permissions</th>
                  <th className="text-center py-3 px-4 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <div className="font-medium text-sm">{user.fullName || user.username}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                        {user.role}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={user.isActive ? "default" : "secondary"} className="text-xs">
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {user.permissions && user.permissions.modules ? (
                          user.permissions.modules.slice(0, 4).map((module) => (
                            <Badge key={module.name} variant="outline" className="text-xs">
                              {module.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500">Role-based permissions</span>
                        )}
                        {user.permissions?.modules?.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{user.permissions.modules.length - 4} more
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePasswordUpdate(user)}
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Update Password"
                        >
                          <Lock className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                          title="Edit User"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-3">
            {users.map((user) => (
              <div key={user._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                <div className="space-y-3">
                  {/* User Info */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                        {user.fullName || user.username}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                        {user.email}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePasswordUpdate(user)}
                        className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        title="Update Password"
                      >
                        <Lock className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                        title="Edit User"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user)}
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Role and Status */}
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                      {user.role}
                    </Badge>
                    <Badge variant={user.isActive ? "default" : "secondary"} className="text-xs">
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  {/* Module Permissions */}
                  <div>
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Module Permissions
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {user.permissions && user.permissions.modules ? (
                        user.permissions.modules.slice(0, 4).map((module) => (
                          <Badge key={module.name} variant="outline" className="text-xs">
                            {module.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Role-based permissions
                        </span>
                      )}
                      {user.permissions?.modules?.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{user.permissions.modules.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit User: {selectedUser?.fullName || selectedUser?.username}
            </DialogTitle>
            <DialogDescription>
              Update user details and module-level permissions
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-username">Username</Label>
                <Input
                  id="edit-username"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-fullName">Full Name</Label>
                <Input
                  id="edit-fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-password">Password (leave empty to keep current)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-role">Role</Label>
                <Select value={formData.role} onValueChange={(value) => {
                  setFormData({...formData, role: value});
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                />
                <Label htmlFor="edit-active">Active</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-canAccessAllUnits"
                  checked={formData.permissions.canAccessAllUnits}
                  onCheckedChange={handleCanAccessAllUnitsChange}
                />
                <Label htmlFor="edit-canAccessAllUnits">Can Access All Units</Label>
              </div>
            </div>

            {/* Module Permissions - Same as create form */}
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Module Permissions</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={giveAllPermissions}
                  className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Give All Permissions
                </Button>
              </div>
              <div className="space-y-4 mt-4">
                {MODULES.map((module) => {
                  const moduleEnabled = isModuleEnabled(module.name);
                  return (
                    <Card key={module.name} className={moduleEnabled ? 'border-blue-200' : 'border-gray-200'}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={moduleEnabled}
                              onCheckedChange={(checked) => updateModulePermission(module.name, checked)}
                            />
                            <Label className="text-base font-medium capitalize">{module.label}</Label>
                          </div>
                        </div>
                      </CardHeader>
                      
                      {moduleEnabled && (
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            <div className="hidden lg:grid grid-cols-5 gap-4 text-sm font-medium text-center border-b pb-2">
                              <div>Feature</div>
                              <div className="flex flex-col items-center">
                                <Eye className="h-4 w-4 mb-1" />
                                <span>View</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <Plus className="h-4 w-4 mb-1" />
                                <span>Add</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <Edit className="h-4 w-4 mb-1" />
                                <span>Edit</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <Trash2 className="h-4 w-4 mb-1" />
                                <span>Delete</span>
                              </div>
                            </div>
                            
                            {/* Mobile Header */}
                            <div className="lg:hidden text-sm font-medium text-center border-b pb-2">
                              Module Permissions
                            </div>
                            
                            {module.features.map((feature) => (
                              <div key={feature.key}>
                                {/* Desktop Layout */}
                                <div className="hidden lg:grid grid-cols-5 gap-4 items-center py-2">
                                  <div className="text-sm font-medium">{feature.label}</div>
                                  {PERMISSION_ACTIONS.map((action) => (
                                    <div key={action} className="flex justify-center">
                                      <Switch
                                        checked={getFeaturePermission(module.name, feature.key, action)}
                                        onCheckedChange={(checked) => 
                                          updateFeaturePermission(module.name, feature.key, action, checked)
                                        }
                                        size="sm"
                                      />
                                    </div>
                                  ))}
                                </div>
                                
                                {/* Mobile Layout */}
                                <div className="lg:hidden border border-gray-200 dark:border-gray-700 rounded-lg p-3 mb-3">
                                  <div className="font-medium text-sm mb-2">{feature.label}</div>
                                  <div className="grid grid-cols-2 gap-3">
                                    {PERMISSION_ACTIONS.map((action) => (
                                      <div key={action} className="flex items-center justify-between">
                                        <span className="text-sm capitalize">{action}</span>
                                        <Switch
                                          checked={getFeaturePermission(module.name, feature.key, action)}
                                          onCheckedChange={(checked) => 
                                            updateFeaturePermission(module.name, feature.key, action, checked)
                                          }
                                          size="sm"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button onClick={handleUpdateUser} disabled={updateUserMutation.isPending} className="w-full sm:w-auto">
                {updateUserMutation.isPending ? 'Updating...' : 'Update User'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Update Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Update Password
            </DialogTitle>
            <DialogDescription>
              Update password for {selectedUser?.fullName || selectedUser?.username}
              <br />
              <span className="text-sm text-gray-500">({selectedUser?.email})</span>
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value
                  })}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({
                    ...passwordForm,
                    confirmPassword: e.target.value
                  })}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsPasswordDialogOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updatePasswordMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              >
                {updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}