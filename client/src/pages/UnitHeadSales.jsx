import { useLocation } from 'wouter';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Filter,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Users,
  ShoppingCart,
  Package,
  Eye
} from 'lucide-react';
import { showSmartToast } from '@/lib/toast-utils';

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'username', label: 'Username' },
  { value: 'email', label: 'Email' },
  { value: 'totalOrders', label: 'Total Orders' }
];

export default function UnitHeadSales() {
  const [, setLocation] = useLocation();
  const [selectedSalesPerson, setSelectedSalesPerson] = useState(null);
  const [isOrdersDetailOpen, setIsOrdersDetailOpen] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Query for sales persons list
  const { data: salesPersonsData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/unit-head/sales-persons', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.append(key, value.toString());
        }
      });
      return apiRequest('GET', `/api/unit-head/sales-persons?${params.toString()}`);
    },
    retry: 1,
    onError: (error) => {
      showSmartToast(error, 'Failed to fetch sales persons');
    }
  });

  // Query for specific sales person orders
  const { data: ordersData, isLoading: isOrdersLoading } = useQuery({
    queryKey: ['/api/unit-head/sales-persons', selectedSalesPerson, 'orders', ordersPage],
    queryFn: () => apiRequest('GET', `/api/unit-head/sales-persons/${selectedSalesPerson}/orders?page=${ordersPage}&limit=10`),
    enabled: !!selectedSalesPerson,
    retry: 1
  });

  const salesPersons = salesPersonsData?.data?.salesPersons || [];
  const pagination = salesPersonsData?.data?.pagination || {};
  const summary = salesPersonsData?.data?.summary || {};
  const orders = ordersData?.data?.orders || [];
  const ordersStats = ordersData?.data?.statistics || {};

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value // Reset to page 1 when changing filters
    }));
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'pending': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'approved': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'in_production': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'completed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'cancelled': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'rejected': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };

    const statusLabels = {
      'pending': 'Pending',
      'approved': 'Approved', 
      'in_production': 'In Production',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'rejected': 'Rejected'
    };

    return (
      <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>
        {statusLabels[status] || status}
      </Badge>
    );
  };

  const handleViewOrders = (salesPerson) => {
    setSelectedSalesPerson(salesPerson._id);
    setOrdersPage(1);
    setIsOrdersDetailOpen(true);
  };

  const handleCloseOrdersDetail = () => {
    setSelectedSalesPerson(null);
    setIsOrdersDetailOpen(false);
    setOrdersPage(1);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>Error loading sales persons: {error?.message || 'Unknown error'}</p>
              <Button onClick={refetch} className="mt-4">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Unit Head Sales</h1>
          <p className="text-muted-foreground">
            Manage sales persons and track their performance and orders
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales Persons</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sales Persons</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.activeSalesPersons || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalOrders || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sales persons..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Sort By */}
            <Select
              value={filters.sortBy}
              onValueChange={(value) => handleFilterChange('sortBy', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Order */}
            <Select
              value={filters.sortOrder}
              onValueChange={(value) => handleFilterChange('sortOrder', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sales Persons Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Persons List</CardTitle>
          <CardDescription>
            {pagination.total ? `Showing ${(pagination.page - 1) * pagination.limit + 1} to ${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} sales persons` : 'No sales persons found'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading sales persons...</p>
            </div>
          ) : salesPersons.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No sales persons found</p>
            </div>
          ) : (
            <>
              {/* Mobile Cards View */}
              <div className="block md:hidden space-y-4">
                {salesPersons.map((salesPerson) => (
                  <Card key={salesPerson._id} className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{salesPerson.username}</p>
                          <p className="text-sm text-muted-foreground">
                            {salesPerson.email}
                          </p>
                        </div>
                        <Badge variant={salesPerson.active ? "default" : "secondary"}>
                          {salesPerson.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{salesPerson.totalOrders || 0} Orders</span>
                        <span className="font-semibold">
                          {formatCurrency(salesPerson.totalRevenue || 0)}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleViewOrders(salesPerson)}
                        className="w-full"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Orders
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sales Person</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Total Orders</TableHead>
                      <TableHead className="text-right">Total Revenue</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesPersons.map((salesPerson) => (
                      <TableRow key={salesPerson._id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <div>
                            <p className="font-medium">{salesPerson.username}</p>
                            <p className="text-sm text-muted-foreground">
                              ID: {salesPerson._id.slice(-6)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{salesPerson.email}</TableCell>
                        <TableCell>
                          <Badge variant={salesPerson.active ? "default" : "secondary"}>
                            {salesPerson.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {salesPerson.totalOrders || 0}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(salesPerson.totalRevenue || 0)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewOrders(salesPerson)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-6">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.pages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFilterChange('page', pagination.page - 1)}
                      disabled={pagination.page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFilterChange('page', pagination.page + 1)}
                      disabled={pagination.page >= pagination.pages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Sales Person Orders Detail Dialog */}
      <Dialog open={isOrdersDetailOpen} onOpenChange={setIsOrdersDetailOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sales Person Orders</DialogTitle>
            <DialogDescription>
              View all orders handled by this sales person
            </DialogDescription>
          </DialogHeader>
          
          {isOrdersLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading orders...</p>
            </div>
          ) : orders.length > 0 ? (
            <div className="space-y-4">
              {/* Orders Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Order Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order._id}>
                        <TableCell className="font-medium">{order.orderCode || order.orderNumber}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.customer?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {order.customer?.contactPerson}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(order.orderDate)}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(order.products?.reduce((sum, p) => sum + (p.quantity * p.price), 0))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Orders Pagination */}
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOrdersPage(Math.max(1, ordersPage - 1))}
                  disabled={ordersPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {ordersPage}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOrdersPage(ordersPage + 1)}
                  disabled={orders.length < 10}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No orders found for this sales person</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}