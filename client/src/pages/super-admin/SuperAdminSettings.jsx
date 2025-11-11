import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings,
  Building2,
  Mail,
  Shield,
  Users,
  Database,
  Bell,
  Palette,
  Globe,
  Lock,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Upload
} from 'lucide-react';
import { showSmartToast } from '@/lib/toast-utils';

export default function SuperAdminSettings() {
  const [activeTab, setActiveTab] = useState('company');
  const [isLogoUploadOpen, setIsLogoUploadOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch current settings
  const { data: settingsData, isLoading, error, refetch } = useQuery({
    queryKey: ['settings'],
    queryFn: () => apiRequest('GET', '/api/settings'),
    retry: 1
  });

  const settings = settingsData?.data || {};

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: ({ section, data }) => 
      apiRequest('PUT', `/api/settings/${section}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['settings']);
      showSmartToast('success', 'Settings updated successfully');
    },
    onError: (error) => {
      showSmartToast('error', `Failed to update settings: ${error.message}`);
    }
  });

  // Company logo upload mutation
  const logoUploadMutation = useMutation({
    mutationFn: (formData) => 
      apiRequest('POST', '/api/settings/company/logo', formData, {
        'Content-Type': 'multipart/form-data'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['settings']);
      setIsLogoUploadOpen(false);
      showSmartToast('success', 'Company logo updated successfully');
    },
    onError: (error) => {
      showSmartToast('error', `Failed to upload logo: ${error.message}`);
    }
  });

  const handleUpdateSettings = (section, data) => {
    updateSettingsMutation.mutate({ section, data });
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('logo', file);
      logoUploadMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading settings...</span>
      </div>
    );
  }

  const tabs = [
    { id: 'company', label: 'Company', icon: Building2 },
    { id: 'system', label: 'System', icon: Database },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'modules', label: 'Modules', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Super Admin - System Settings</h1>
          <p className="text-muted-foreground">Configure system-wide settings and preferences</p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Settings Navigation */}
        <div className="w-full lg:w-64">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Settings Categories</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <Button
                      key={tab.id}
                      variant={activeTab === tab.id ? 'secondary' : 'ghost'}
                      className="w-full justify-start h-10"
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {tab.label}
                    </Button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="flex-1 space-y-6">
          {/* Company Settings */}
          {activeTab === 'company' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  Company Information
                </CardTitle>
                <CardDescription>
                  Manage your company's basic information and branding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input 
                      value={settings.company?.name || ''} 
                      placeholder="Enter company name"
                      onChange={(e) => {
                        const updatedSettings = {
                          ...settings.company,
                          name: e.target.value
                        };
                        handleUpdateSettings('company', updatedSettings);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input 
                      type="email"
                      value={settings.company?.email || ''} 
                      placeholder="company@example.com"
                      onChange={(e) => {
                        const updatedSettings = {
                          ...settings.company,
                          email: e.target.value
                        };
                        handleUpdateSettings('company', updatedSettings);
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Address</Label>
                  <Textarea 
                    value={settings.company?.address || ''} 
                    placeholder="Enter company address"
                    onChange={(e) => {
                      const updatedSettings = {
                        ...settings.company,
                        address: e.target.value
                      };
                      handleUpdateSettings('company', updatedSettings);
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input 
                      value={settings.company?.phone || ''} 
                      placeholder="Enter phone number"
                      onChange={(e) => {
                        const updatedSettings = {
                          ...settings.company,
                          phone: e.target.value
                        };
                        handleUpdateSettings('company', updatedSettings);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Website</Label>
                    <Input 
                      value={settings.company?.website || ''} 
                      placeholder="https://www.example.com"
                      onChange={(e) => {
                        const updatedSettings = {
                          ...settings.company,
                          website: e.target.value
                        };
                        handleUpdateSettings('company', updatedSettings);
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Company Logo</Label>
                  <div className="flex items-center space-x-4">
                    {settings.company?.logo && (
                      <img 
                        src={settings.company.logo} 
                        alt="Company Logo" 
                        className="h-16 w-16 object-contain border rounded"
                      />
                    )}
                    <Button onClick={() => setIsLogoUploadOpen(true)}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Logo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Settings */}
          {activeTab === 'system' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  System Configuration
                </CardTitle>
                <CardDescription>
                  Configure system-wide settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select value={settings.system?.timezone || 'UTC'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="Asia/Kolkata">Asia/Kolkata</SelectItem>
                        <SelectItem value="America/New_York">America/New_York</SelectItem>
                        <SelectItem value="Europe/London">Europe/London</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date Format</Label>
                    <Select value={settings.system?.dateFormat || 'DD/MM/YYYY'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={settings.system?.maintenanceMode || false}
                    onCheckedChange={(checked) => {
                      const updatedSettings = {
                        ...settings.system,
                        maintenanceMode: checked
                      };
                      handleUpdateSettings('system', updatedSettings);
                    }}
                  />
                  <Label>Maintenance Mode</Label>
                  <Badge variant={settings.system?.maintenanceMode ? 'destructive' : 'secondary'}>
                    {settings.system?.maintenanceMode ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Module Settings */}
          {activeTab === 'modules' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Module Management
                </CardTitle>
                <CardDescription>
                  Enable or disable system modules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    'Dashboard',
                    'Orders',
                    'Purchases',
                    'Manufacturing',
                    'Production',
                    'Dispatches',
                    'Sales',
                    'Accounts',
                    'Inventory',
                    'Customers',
                    'Suppliers',
                    'Companies',
                    'Settings'
                  ].map((module) => (
                    <div key={module} className="flex items-center justify-between p-4 border rounded">
                      <div>
                        <h4 className="font-medium">{module}</h4>
                        <p className="text-sm text-muted-foreground">
                          {module} module functionality
                        </p>
                      </div>
                      <Switch 
                        checked={settings.modules?.[module.toLowerCase()] !== false}
                        onCheckedChange={(checked) => {
                          const updatedModules = {
                            ...settings.modules,
                            [module.toLowerCase()]: checked
                          };
                          handleUpdateSettings('modules', updatedModules);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Other tabs can be implemented similarly */}
          {activeTab !== 'company' && activeTab !== 'system' && activeTab !== 'modules' && (
            <Card>
              <CardHeader>
                <CardTitle>Coming Soon</CardTitle>
                <CardDescription>
                  This settings section is under development.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} settings will be available soon.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Logo Upload Dialog */}
      <Dialog open={isLogoUploadOpen} onOpenChange={setIsLogoUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Company Logo</DialogTitle>
            <DialogDescription>
              Select an image file to use as your company logo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              disabled={logoUploadMutation.isLoading}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLogoUploadOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
