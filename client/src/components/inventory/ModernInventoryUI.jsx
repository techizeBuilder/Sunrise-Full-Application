import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useActionPermissions } from '@/components/permissions/ActionButton';
import { useToast } from '@/hooks/use-toast';
import apiService from '@/services/api';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Tag,
  Package2,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  FolderPlus,
  Tags,
  Users,
  Building2
} from 'lucide-react';

import SimpleInventoryForm from './SimpleInventoryForm';
import ViewItemModal from './ViewItemModal';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import CategoryManagement from './CategoryManagement';
import ExcelImportExport from './ExcelImportExport';

import { apiRequest } from '@/lib/queryClient';
import { showSmartToast } from '@/lib/toast-utils';

// Helper function to get role-based API path
function getInventoryApiPath(user) {
  if (!user) return '/api';
  
  switch (user.role) {
    case 'Super Admin':
      return '/api/super-admin/inventory';
    case 'Unit Head':
      return '/api/unit-head/inventory';
    default:
      return '/api';
  }
}

// Permission checking functions using the permissions system
function useInventoryPermissions() {
  const { user } = useAuth();
  const { canPerformAction } = usePermissions();

  // For Unit Head, permissions are stored under unitHead module with inventory as feature key
  // For other roles, it's under inventory module with items as feature key
  const moduleName = user?.role === 'Unit Head' ? 'unitHead' : 'inventory';
  const featureKey = user?.role === 'Unit Head' ? 'inventory' : 'items';

  return {
    canView: canPerformAction(moduleName, featureKey, 'view'),
    canAdd: canPerformAction(moduleName, featureKey, 'add'),
    canEdit: canPerformAction(moduleName, featureKey, 'edit'),
    canDelete: canPerformAction(moduleName, featureKey, 'delete'),
    canAlter: canPerformAction(moduleName, featureKey, 'alter')
  };
}

// Modern Stats Component
function ModernStats({ stats, isLoading }) {
  const statsCards = [
    {
      title: 'Total Items',
      value: stats?.stats?.totalItems || 0,
      icon: Package2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      change: '+12%'
    },
    {
      title: 'Total Value',
      value: `₹${stats?.stats?.totalValue?.toLocaleString() || 0}`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      change: '+8%'
    },
    {
      title: 'Low Stock',
      value: stats?.stats?.lowStockCount || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      change: '-3%'
    },
    {
      title: 'Categories',
      value: stats?.stats?.totalCategories || 0,
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      change: '+2%'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsCards.map((stat, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-muted-foreground">{stat.title}</div>
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  ) : (
                    stat.value
                  )}
                </div>
                <div className="text-xs text-green-600 font-medium">{stat.change}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function ModernInventoryUI() {
  const { user } = useAuth();
  const { canPerformAction } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get role-based API path
  const apiBasePath = getInventoryApiPath(user);
  
  // Check inventory permissions based on user role
  const moduleName = user?.role === 'Unit Head' ? 'unitHead' : 'inventory';
  const featureKey = user?.role === 'Unit Head' ? 'inventory' : 'items';
  
  const inventoryPermissions = {
    canView: canPerformAction(moduleName, featureKey, 'view'),
    canAdd: canPerformAction(moduleName, featureKey, 'add'),
    canEdit: canPerformAction(moduleName, featureKey, 'edit'),
    canDelete: canPerformAction(moduleName, featureKey, 'delete'),
    canAlter: canPerformAction(moduleName, featureKey, 'alter')
  };
  
  // State management
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, item: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStore, setSelectedStore] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [categoryManagementOpen, setCategoryManagementOpen] = useState(false);
  const [showCustomerCategoryModal, setShowCustomerCategoryModal] = useState(false);

  // Data fetching with React Query
  const { data: itemsData, isLoading: itemsLoading } = useQuery({
    queryKey: [`${apiBasePath}/items`],
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: [`${apiBasePath}/stats`],
    queryFn: () => apiService.getInventoryStats()
  });

  const { data: categoriesData } = useQuery({
    queryKey: [`${apiBasePath}/categories`],
  });

  const { data: customerCategoriesData } = useQuery({
    queryKey: [`${apiBasePath}/customer-categories`],
  });

  // Fetch companies for location dropdown - use authenticated endpoint
  const { data: companiesData } = useQuery({
    queryKey: ['companies-dropdown'],
    queryFn: () => apiRequest('GET', '/api/companies/dropdown'),
  });

  // Extract arrays from API response
  const items = Array.isArray(itemsData?.items) ? itemsData.items : [];
  const categories = Array.isArray(categoriesData?.categories) ? categoriesData.categories : [];
  const customerCategories = Array.isArray(customerCategoriesData?.customerCategories) ? customerCategoriesData.customerCategories : [];
  const companies = Array.isArray(companiesData?.companies) ? companiesData.companies : [];

  console.log('Companies data:', companies);

  // Mutations
  const deleteItemMutation = useMutation({
    mutationFn: (id) => apiRequest('DELETE', `${apiBasePath}/items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries([`${apiBasePath}/items`]);
      queryClient.invalidateQueries([`${apiBasePath}/stats`]);
      setDeleteConfirm({ isOpen: false, item: null });
      toast({
        title: "Item Deleted",
        description: "Inventory item has been deleted successfully",
      });
    },
    onError: (error) => {
      showSmartToast(error, 'Delete Item');
    }
  });

  const createItemMutation = useMutation({
    mutationFn: (data) => apiRequest('POST', `${apiBasePath}/items`, data),
    onSuccess: () => {
      queryClient.invalidateQueries([`${apiBasePath}/items`]);
      queryClient.invalidateQueries([`${apiBasePath}/stats`]);
      setShowForm(false);
      setEditingItem(null);
      toast({
        title: "Item Created",
        description: "New inventory item has been created successfully",
      });
    },
    onError: (error) => {
      console.error('Create item error details:', error);
      
      // DON'T close the modal on error - let user fix the issue
      // Show proper validation error message
      if (error.status === 400 && error.message) {
        // Check for duplicate item error
        if (error.message.includes('Duplicate item detected') || error.message.includes('already exists')) {
          toast({
            title: "⚠️ Duplicate Item",
            description: error.message.replace(/[\n\r]/g, ' '), // Clean line breaks
            variant: "destructive",
            duration: 10000 // Longer duration for reading
          });
        } else {
          toast({
            title: "❌ Validation Error",
            description: error.message,
            variant: "destructive",
            duration: 6000
          });
        }
      } else if (error.message) {
        toast({
          title: "❌ Create Item Failed",
          description: error.message,
          variant: "destructive",
          duration: 6000
        });
      } else {
        showSmartToast(error, 'Create Item');
      }
    }
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }) => apiRequest('PUT', `${apiBasePath}/items/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries([`${apiBasePath}/items`]);
      queryClient.invalidateQueries([`${apiBasePath}/stats`]);
      setShowForm(false);
      setEditingItem(null);
      toast({
        title: "Item Updated",
        description: "Inventory item has been updated successfully",
      });
    },
    onError: (error) => {
      // Show proper validation error message
      if (error.status === 400 && error.message) {
        toast({
          title: "Update Item: Validation Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        showSmartToast(error, 'Update Item');
      }
    }
  });

  // Handlers
  const handleFormSubmit = async (data) => {
    if (editingItem) {
      return await updateItemMutation.mutateAsync({ id: editingItem._id, data });
    } else {
      return await createItemMutation.mutateAsync(data);
    }
  };

  const handleView = (item) => {
    setViewItem(item);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = (item) => {
    setDeleteConfirm({ 
      isOpen: true, 
      item,
      title: "Delete Item",
      description: `Are you sure you want to delete this inventory item?`,
      itemName: item.name
    });
  };

  const confirmDelete = () => {
    if (deleteConfirm.item) {
      deleteItemMutation.mutate(deleteConfirm.item._id);
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries([`${apiBasePath}/items`]);
    queryClient.invalidateQueries([`${apiBasePath}/categories`]);
    queryClient.invalidateQueries([`${apiBasePath}/customer-categories`]);
    queryClient.invalidateQueries([`${apiBasePath}/stats`]);
    toast({
      title: "Refreshed",
      description: "Inventory data has been refreshed successfully",
    });
  };

  // Filter and sort items (newest first by default)
  const filteredItems = items.filter(item => {
    const matchesSearch = !searchTerm || 
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.store?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.storeLocation?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || selectedCategory === 'all' || item.category === selectedCategory;
    const matchesStore = !selectedStore || selectedStore === 'all' || item.store === selectedStore;
    
    // Match location by company ID or store field
    const matchesLocation = !selectedLocation || selectedLocation === 'all' || 
      item.companyId === selectedLocation || 
      item.store === selectedLocation ||
      item.location === selectedLocation;
    
    return matchesSearch && matchesCategory && matchesStore && matchesLocation;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.name || '').localeCompare(b.name || '');
      case 'code':
        return (a.code || '').localeCompare(b.code || '');
      case 'category':
        return (a.category || '').localeCompare(b.category || '');
      case 'qty':
        return (b.qty || 0) - (a.qty || 0);
      case 'newest':
      default:
        // Default: newest items first (by creation date)
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
  });

  // Pagination logic
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedStore, selectedLocation, sortBy]);

  // Auto-select location for Unit Head users
  useEffect(() => {
    if (user?.role === 'Unit Head' && companies.length === 1) {
      // If Unit Head has only one company (their assigned one), auto-select it
      setSelectedLocation(companies[0].value);
    }
  }, [companies, user?.role]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      <ModernStats stats={stats} isLoading={statsLoading} />
      
      {/* Modern Action Bar */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex flex-col">
              <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100">
                {!inventoryPermissions.canAdd && !inventoryPermissions.canEdit && !inventoryPermissions.canDelete ? 'Inventory Monitoring' : 'Quick Actions'}
              </h2>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                {!inventoryPermissions.canAdd && !inventoryPermissions.canEdit && !inventoryPermissions.canDelete 
                  ? 'Monitor inventory levels, view item details and track stock status'
                  : 'Manage your inventory efficiently with these actions'
                }
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {inventoryPermissions.canAdd && (
                <Button 
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              )}
              {(inventoryPermissions.canAdd || inventoryPermissions.canEdit) && (
                <>
                  <Button 
                    onClick={() => setCategoryManagementOpen(true)}
                    variant="outline"
                    className="border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-950/30"
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    Categories
                  </Button>
                  <Button 
                    onClick={() => setShowCustomerCategoryModal(true)}
                    variant="outline"
                    className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-600 dark:text-green-300 dark:hover:bg-green-950/30"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Customer Category
                  </Button>
                </>
              )}
              
              {/* Excel Import/Export - Available to all users with view permissions */}
              {inventoryPermissions.canView && (
                <ExcelImportExport type="items" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Area */}
      <Card className="shadow-sm border-gray-200 dark:border-gray-700">
        <CardHeader className="bg-gray-50 dark:bg-gray-800/50">
          <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
            <Package className="h-5 w-5" />
            Inventory Management
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search items by name, code, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-[200px] border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400">
                    <Filter className="h-4 w-4 mr-2 text-gray-400" />
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Package2 className="h-4 w-4" />
                        All Categories
                      </div>
                    </SelectItem>
                    {categories.length > 0 && categories.map((category) => (
                      <SelectItem key={category._id || category.name} value={category.name}>
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="w-full sm:w-[280px] border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400">
                    <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        All Locations
                      </div>
                    </SelectItem>
                    {companies.length > 0 && companies.map((company) => (
                      <SelectItem key={company.value} value={company.value}>
                        <div className="flex items-center gap-2 max-w-[240px]">
                          <Building2 className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate" title={company.label}>
                            {company.label}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[150px] border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400">
                    <BarChart3 className="h-4 w-4 mr-2 text-gray-400" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                    <SelectItem value="code">Code</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                    <SelectItem value="qty">Quantity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Image</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Name</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Category</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Store Location</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Stock</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Price</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Status</TableHead>
                    <TableHead className="w-[100px] font-semibold text-gray-900 dark:text-gray-100">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemsLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Loading items...
                      </TableCell>
                    </TableRow>
                  ) : filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No items found. Add your first inventory item to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedItems.map((item, index) => (
                      <TableRow 
                        key={item._id} 
                        className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                          index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/20'
                        }`}
                      >
                        <TableCell className="py-4">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            {item.image ? (
                              <img 
                                src={item.image} 
                                alt={item.name} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNiAxNkMyMC40MTgzIDE2IDI0IDE5LjU4MTcgMjQgMjRTMjAuNDE4MyAzMiAxNiAzMlM4IDI4LjQxODMgOCAyNFMxMS41ODE3IDE2IDE2IDE2WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                                }}
                              />
                            ) : (
                              <Package className="h-6 w-6 text-gray-400" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">{item.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{item.type}</div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800">
                              {item.category}
                            </Badge>
                            {item.subCategory && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {item.subCategory}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800">
                            {item.storeLocation || item.store || 'No location'}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">{item.qty} {item.unit}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Min: {item.minStock} {item.unit}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="font-medium text-green-600 dark:text-green-400">
                            ₹{item.salePrice?.toLocaleString() || 0}
                          </span>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge 
                            variant={(item.qty || 0) <= (item.minStock || 0) ? 'destructive' : 'default'}
                            className={
                              (item.qty || 0) <= (item.minStock || 0) 
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
                                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            }
                          >
                            {(item.qty || 0) <= (item.minStock || 0) ? 'Low Stock' : 'In Stock'}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleView(item)}
                              className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4 text-blue-600" />
                            </Button>
                            {(inventoryPermissions.canEdit || inventoryPermissions.canDelete) && (
                              <>
                                {inventoryPermissions.canEdit && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleEdit(item)}
                                    className="h-8 w-8 p-0 hover:bg-green-50 dark:hover:bg-green-900/30"
                                    title="Edit Item"
                                  >
                                    <Edit className="h-4 w-4 text-green-600" />
                                  </Button>
                                )}
                                {inventoryPermissions.canDelete && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleDelete(item)}
                                    className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/30"
                                    title="Delete Item"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                                )}                        </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-2 py-4">
                <div className="text-sm text-gray-500">
                  Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} items
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    );
                  })}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Forms and Modals - Show based on permissions */}
      {(inventoryPermissions.canAdd || inventoryPermissions.canEdit) && (
        <SimpleInventoryForm
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          item={editingItem}
          categories={categories}
          customerCategories={customerCategories}
          companies={companies}
          onSubmit={handleFormSubmit}
          isLoading={createItemMutation.isPending || updateItemMutation.isPending}
          onOpenCategoryManagement={() => setCategoryManagementOpen(true)}
        />
      )}

      <ViewItemModal
        isOpen={!!viewItem}
        onClose={() => setViewItem(null)}
        item={viewItem}
      />

      {inventoryPermissions.canDelete && (
        <DeleteConfirmDialog
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, item: null })}
          onConfirm={confirmDelete}
          title="Delete Inventory Item"
          description="Are you sure you want to delete this inventory item?"
          itemName={deleteConfirm.item?.name}
          isLoading={deleteItemMutation.isPending}
        />
      )}

      {/* Category Management Modals - Show based on permissions */}
      {(inventoryPermissions.canAdd || inventoryPermissions.canEdit) && (
        <>
          <CategoryManagement 
            isOpen={categoryManagementOpen}
            onClose={() => setCategoryManagementOpen(false)}
            initialTab="product"
          />
          
          <CategoryManagement 
            isOpen={showCustomerCategoryModal}
            onClose={() => setShowCustomerCategoryModal(false)}
            initialTab="customer"
          />
        </>
      )}
    </div>
  );
}