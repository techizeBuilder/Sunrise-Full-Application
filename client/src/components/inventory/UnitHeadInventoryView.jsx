import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  const statsCards = [
    {
      title: 'Total Items',
      value: stats?.overview?.totalItems || 0,
      icon: Package2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Total Value',
      value: `₹${stats?.overview?.totalValue?.toLocaleString() || 0}`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Low Stock Items',
      value: stats?.overview?.lowStockItems || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
    },
    {
      title: 'Categories',
      value: stats?.overview?.totalCategories || 0,
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <IconComponent className={`h-6 w-6 ${stat.color}`} />
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
  const { data: itemsData, isLoading: itemsLoading, refetch: refetchItems } = useQuery({
    queryKey: ['/api/unit-head/inventory/items'],
  });

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['/api/unit-head/inventory/stats'],
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['/api/unit-head/inventory/categories'],
  });

  // Extract arrays from API response
  const items = Array.isArray(itemsData?.items) ? itemsData.items : [];
  const categories = Array.isArray(categoriesData?.categories) ? categoriesData.categories : [];

  // Filter and sort items (read-only view)
  const filteredItems = items.filter(item => {
    const matchesSearch = !searchTerm || 
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.store?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || selectedCategory === 'all' || item.category === selectedCategory;
    const matchesStore = !selectedStore || selectedStore === 'all' || item.store === selectedStore;
    
    return matchesSearch && matchesCategory && matchesStore;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.name || '').localeCompare(b.name || '');
      case 'category':
        return (a.category || '').localeCompare(b.category || '');
      case 'qty':
        return (b.qty || 0) - (a.qty || 0);
      case 'store':
        return (a.store || '').localeCompare(b.store || '');
      case 'newest':
      default:
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
    <div className="p-6 space-y-8 bg-gray-50/50 dark:bg-gray-900/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <Package className="h-8 w-8 text-blue-600" />
              Inventory Monitor
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
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
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search items by name, description, or store location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[200px] border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400">
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
                <Select value={selectedStore} onValueChange={setSelectedStore}>
                  <SelectTrigger className="w-[180px] border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400">
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
                    <SelectItem value="Hyderabad">
                      <div className="flex items-center gap-2">
                        <Package2 className="h-4 w-4" />
                        Hyderabad
                      </div>
                    </SelectItem>
                    <SelectItem value="Bengaluru">
                      <div className="flex items-center gap-2">
                        <Package2 className="h-4 w-4" />
                        Bengaluru
                      </div>
                    </SelectItem>
                    <SelectItem value="Tirupati">
                      <div className="flex items-center gap-2">
                        <Package2 className="h-4 w-4" />
                        Tirupati
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[150px] border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400">
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
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <p>
            Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} items
            {searchTerm && ` for "${searchTerm}"`}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="border-gray-300 dark:border-gray-600"
              >
                Previous
              </Button>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-md text-xs font-medium">
                {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="border-gray-300 dark:border-gray-600"
              >
                Next
              </Button>
            </div>
          )}
        </div>

        {/* Items Table */}
        <Card className="border-gray-200 dark:border-gray-700 shadow-sm">
          <CardContent className="p-0">
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
                    <TableHead className="w-[80px] font-semibold text-gray-900 dark:text-gray-100">Action</TableHead>
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
                        No items found. {searchTerm ? 'Try adjusting your search terms.' : 'No inventory items available.'}
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
                            {item.store || 'No location'}
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
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleView(item)}
                            className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
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
        item={viewItem} 
        isOpen={!!viewItem} 
        onClose={() => setViewItem(null)} 
      />
    </div>
  );
}