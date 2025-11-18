import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Package,
  Search,
  Eye,
  Package2,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  Filter,
  Tag,
  RefreshCw
} from 'lucide-react';

import ViewItemModal from './ViewItemModal';
import { useToast } from '@/hooks/use-toast';

// Modern Stats Component for Unit Head (Read-only)
function UnitHeadStats({ stats, isLoading }) {
  // Extract stats values with proper fallbacks and debug logging
  console.log('=== STATS COMPONENT ===');
  console.log('Stats received:', stats);
  
  const totalItems = stats?.overview?.totalItems || 0;
  const totalValue = stats?.overview?.totalValue || 0;
  const lowStockItems = stats?.overview?.lowStockCount || stats?.overview?.lowStockItems || 0; // Handle both field names
  const totalCategories = stats?.categoryStats?.length || 0;
  
  console.log('Extracted values:', {
    totalItems,
    totalValue,
    lowStockItems,
    totalCategories
  });

  const statsCards = [
    {
      title: 'Total Items',
      value: totalItems,
      icon: Package2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Total Value',
      value: `₹${totalValue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Low Stock Items',
      value: lowStockItems,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
    },
    {
      title: 'Categories',
      value: totalCategories,
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 sm:p-6">
              <div className="h-12 sm:h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
      {statsCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 truncate">
                    {stat.title}
                  </p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 truncate">
                    {typeof stat.value === 'object' ? String(stat.value || 0) : stat.value}
                  </p>
                </div>
                <div className={`p-2 sm:p-3 rounded-xl ${stat.bgColor} flex-shrink-0 ml-2`}>
                  <IconComponent className={`h-4 w-4 sm:h-6 sm:w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function UnitHeadInventoryView() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State management (read-only)
  const [viewItem, setViewItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStore, setSelectedStore] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Data fetching with React Query (Unit Head specific endpoints)
  const { data: itemsData, isLoading: itemsLoading, refetch: refetchItems, error: itemsError } = useQuery({
    queryKey: ['/api/unit-head/inventory/items'],
    queryFn: () => apiRequest('GET', '/api/unit-head/inventory/items'),
    retry: 1,
    onError: (error) => {
      console.error('Failed to fetch items:', error);
    }
  });

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['/api/unit-head/inventory/stats'],
    queryFn: () => apiRequest('GET', '/api/unit-head/inventory/stats'),
    retry: 1,
    onError: (error) => {
      console.error('Failed to fetch stats:', error);
    }
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['/api/unit-head/inventory/categories'],
    queryFn: () => apiRequest('GET', '/api/unit-head/inventory/categories'),
    retry: 1,
    onError: (error) => {
      console.error('Failed to fetch categories:', error);
    }
  });

  // Fetch current user profile to get company info
  const { data: profile } = useQuery({
    queryKey: ['/api/profile'],
    queryFn: () => apiRequest('GET', '/api/profile'),
    retry: 1,
    onError: (error) => {
      console.error('Failed to fetch profile:', error);
    }
  });

  // Debug logging
  console.log('=== API RESPONSES ===');
  console.log('Items Data:', itemsData);
  console.log('Items Error:', itemsError);
  console.log('Stats Data:', stats);
  console.log('Profile Data:', profile);

  // Auto-set store filter when profile loads  
  useEffect(() => {
    // Keep store filter as 'all' initially to show all items
    if (profile?.company?.name && selectedStore === 'all') {
      console.log('Profile company available:', profile.company.name, 'keeping store filter as "all" to show all items');
      // Don't auto-select company store - let user choose
    }
  }, [profile, selectedStore]);

  // Extract arrays from API response - handle different response structures
  let items = [];
  let categories = [];
  
  // Try different possible response structures for items
  if (itemsData) {
    if (Array.isArray(itemsData.data?.items)) {
      items = itemsData.data.items;
    } else if (Array.isArray(itemsData.data?.data)) {
      items = itemsData.data.data;
    } else if (Array.isArray(itemsData.items)) {
      items = itemsData.items;
    } else if (Array.isArray(itemsData.data)) {
      items = itemsData.data;
    } else if (Array.isArray(itemsData)) {
      items = itemsData;
    }
  }
  
  // Try different possible response structures for categories
  if (categoriesData) {
    if (Array.isArray(categoriesData.data?.categories)) {
      categories = categoriesData.data.categories;
    } else if (Array.isArray(categoriesData.categories)) {
      categories = categoriesData.categories;
    } else if (Array.isArray(categoriesData.data)) {
      categories = categoriesData.data;
    } else if (Array.isArray(categoriesData)) {
      categories = categoriesData;
    }
  }

  // Debug logging for extracted data
  console.log('=== EXTRACTED DATA ===');
  console.log('Extracted items:', items.length, 'items');
  if (items.length > 0) {
    console.log('Sample item:', items[0]);
  }
  console.log('Extracted categories:', categories.length, 'categories');


  console.log('Processed items:', items);
  console.log('Processed categories:', categories);
  console.log('Items count:', items.length);

  // Filter and sort items (read-only view) - Simplified filtering
  const filteredItems = (items || []).filter(item => {
    // Search filter - only apply if user has typed something
    const matchesSearch = !searchTerm || searchTerm.trim() === '' ||
      String(item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.storeLocation || item.store || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category filter - only apply if not 'all'
    const matchesCategory = selectedCategory === 'all' || 
      String(item.category || '').toLowerCase().includes(String(selectedCategory || '').toLowerCase());
    
    // Store filter - only apply if not 'all' and be very flexible
    const matchesStore = selectedStore === 'all' || !selectedStore ||
      String(item.storeLocation || item.store || '').toLowerCase().includes(String(selectedStore || '').toLowerCase()) ||
      String(selectedStore || '').toLowerCase().includes(String(item.storeLocation || item.store || '').toLowerCase());
    
    const result = matchesSearch && matchesCategory && matchesStore;
    
    return result;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.name || '').localeCompare(b.name || '');
      case 'category':
        return (a.category || '').localeCompare(b.category || '');
      case 'qty':
        return (b.qty || 0) - (a.qty || 0);
      case 'store':
        return (a.storeLocation || a.store || '').localeCompare(b.storeLocation || b.store || '');
      case 'newest':
      default:
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
  });

  console.log('=== FILTERING RESULTS ===');
  console.log('Total items before filtering:', items.length);
  console.log('Total items after filtering:', filteredItems.length);
  console.log('Current filters:', { searchTerm, selectedCategory, selectedStore });
  if (filteredItems.length > 0) {
    console.log('Sample filtered item:', filteredItems[0]);
  }

  // Pagination logic
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedStore, sortBy]);

  const handleView = (item) => {
    setViewItem(item);
  };

  const handleRefresh = () => {
    refetchItems();
    refetchStats();
    toast({
      title: "Refreshed",
      description: "Inventory data has been refreshed",
    });
  };

  return (
    <div className="w-full min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 sm:gap-3">
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
              <span className="break-words">Inventory Monitor</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
              Monitor and view inventory items across all store locations (Read-only access)
            </p>
          </div>
          {/* <div className="flex items-center gap-4">
            <Button 
              onClick={handleRefresh} 
              variant="outline"
              className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div> */}
        </div>

        {/* Stats */}
        <UnitHeadStats stats={stats} isLoading={statsLoading} />

        {/* Search and Filters */}
        <Card className="border-gray-200 dark:border-gray-700 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-4">
              <div className="w-full relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search items by name, description, or store location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 text-sm sm:text-base"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 w-full">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400">
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
                      <SelectItem key={category._id || category.name} value={category.name || ''}>
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          {category.name || 'Unnamed Category'}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedStore} onValueChange={setSelectedStore}>
                  <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400">
                    <Package2 className="h-4 w-4 mr-2 text-gray-400" />
                    <SelectValue placeholder="All Stores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Package2 className="h-4 w-4" />
                        All Stores
                      </div>
                    </SelectItem>
                    {profile?.company ? (
                      <SelectItem value={String(profile.company.name || '')}>
                        <div className="flex items-center gap-2">
                          <Package2 className="h-4 w-4" />
                          {String(profile.company.name || '')} 
                          {profile.company.city && (
                            <span className="text-gray-500">- {String(profile.company.city)}</span>
                          )}
                        </div>
                      </SelectItem>
                    ) : (
                      <SelectItem value="loading" disabled>
                        <div className="flex items-center gap-2">
                          <Package2 className="h-4 w-4" />
                          Loading company info...
                        </div>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400">
                    <BarChart3 className="h-4 w-4 mr-2 text-gray-400" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                    <SelectItem value="store">Store Location</SelectItem>
                    <SelectItem value="qty">Stock Quantity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-gray-600 dark:text-gray-400">
          <p className="text-xs sm:text-sm">
            Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} items
            {searchTerm && ` for "${String(searchTerm)}"`}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="border-gray-300 dark:border-gray-600 text-xs px-2 py-1 h-8"
              >
                Previous
              </Button>
              <span className="px-2 sm:px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-md text-xs font-medium whitespace-nowrap">
                {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="border-gray-300 dark:border-gray-600 text-xs px-2 py-1 h-8"
              >
                Next
              </Button>
            </div>
          )}
        </div>

        {/* Items Table */}
        <Card className="border-gray-200 dark:border-gray-700 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="min-w-[800px] w-full">
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100 w-16 sm:w-20">Image</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100 min-w-[120px]">Name</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100 min-w-[100px]">Category</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100 min-w-[140px]">Store Location</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100 min-w-[80px]">Stock</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100 min-w-[80px]">Price</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100 min-w-[80px]">Status</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100 w-16">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemsLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Loading items...
                      </TableCell>
                    </TableRow>
                  ) : itemsError ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-red-500">
                        Error loading items: {String(itemsError?.message || 'Unknown error')}
                      </TableCell>
                    </TableRow>
                  ) : filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No items found. {searchTerm ? 'Try adjusting your search terms.' : 'No inventory items available.'}
                        <br />
                        <small className="text-xs text-gray-400">
                          API Response: {items.length} items loaded
                        </small>
                      </TableCell>
                    </TableRow>
                  ) : (
                    (paginatedItems || []).map((item, index) => (
                      <TableRow 
                        key={item._id || `item-${index}`} 
                        className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                          index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/20'
                        }`}
                      >
                        <TableCell className="py-3 px-2 sm:px-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                            {item.image ? (
                              <img 
                                src={item.image} 
                                alt={String(item.name || 'Item image')} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNiAxNkMyMC40MTgzIDE2IDI0IDE5LjU4MTcgMjQgMjRTMjAuNDE4MyAzMiAxNiAzMlM4IDI4LjQxODMgOCAyNFMxMS41ODE3IDE2IDE2IDE2WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                                }}
                              />
                            ) : (
                              <Package className="h-4 w-4 sm:h-6 sm:w-6 text-gray-400" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-2 sm:px-4">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">{item.name || 'Unknown Item'}</div>
                            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{item.type || 'No type'}</div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-2 sm:px-4">
                          <div>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800 text-xs">
                              {(item.category || 'Uncategorized').length > 12 ? (item.category || 'Uncategorized').substring(0, 12) + '...' : (item.category || 'Uncategorized')}
                            </Badge>
                            {item.subCategory && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                                {item.subCategory.length > 15 ? item.subCategory.substring(0, 15) + '...' : item.subCategory}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-2 sm:px-4">
                          <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800 text-xs max-w-[140px] truncate">
                            {(item.storeLocation || item.store || 'No location').length > 20 ? (item.storeLocation || item.store || 'No location').substring(0, 20) + '...' : (item.storeLocation || item.store || 'No location')}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 px-2 sm:px-4">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">{item.qty || 0} {(item.unit || 'units').substring(0, 4)}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Min: {item.minStock || 0}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-2 sm:px-4">
                          <span className="font-medium text-green-600 dark:text-green-400 text-sm">
                            ₹{typeof item.salePrice === 'number' ? (item.salePrice > 999 ? (item.salePrice/1000).toFixed(1) + 'K' : item.salePrice.toString()) : (item.salePrice || 0)}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 px-2 sm:px-4">
                          <Badge 
                            variant={(item.qty || 0) <= (item.minStock || 0) ? 'destructive' : 'default'}
                            className={
                              `text-xs ${
                                (item.qty || 0) <= (item.minStock || 0) 
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
                                  : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              }`
                            }
                          >
                            {(item.qty || 0) <= (item.minStock || 0) ? 'Low' : 'Stock'}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 px-1 sm:px-4">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleView(item)}
                            className="h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                            title="View Details"
                          >
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        </div>

        {/* View Item Modal - Read Only */}
        <ViewItemModal 
          item={viewItem || null} 
          isOpen={!!viewItem} 
          onClose={() => setViewItem(null)} 
        />
      </div>
    </div>
  );
}