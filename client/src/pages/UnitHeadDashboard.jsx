import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Calendar,
  MapPin,
  Eye,
  RefreshCw,
  Package
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

export default function UnitHeadDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');
  const { toast } = useToast();

  // Period options for the dashboard
  const periodOptions = [
    { value: 'current-month', label: 'This Month', icon: Calendar },
    { value: 'current-quarter', label: 'This Quarter', icon: Calendar },
    { value: 'current-year', label: 'This Year', icon: Calendar }
  ];

  // Query for dashboard data with period parameter
  const { data: dashboardData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/unit-head/dashboard', selectedPeriod],
    queryFn: () => apiRequest('GET', `/api/unit-head/dashboard?period=${selectedPeriod}`),
    retry: 1,
    refetchInterval: 300000, // Refetch every 5 minutes
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch dashboard data",
        variant: "destructive"
      });
    }
  });

  const dashboard = dashboardData?.data || {};
  const recentOrders = dashboard.recentOrders || [];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'processing': return 'default';
      case 'completed': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="p-3 sm:p-6 space-y-4">
        <div className="animate-pulse">
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/2 sm:w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-20 sm:h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 sm:h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-3 sm:px-6 py-3 sm:py-4 rounded-lg">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
              <span className="truncate">Unit Head Dashboard</span>
            </h1>
            <p className="text-purple-100 mt-1 text-sm sm:text-base">
              Real-time overview of unit operations and performance metrics - {periodOptions.find(p => p.value === selectedPeriod)?.label}
            </p>
            {dashboard.unitLocation && (
              <div className="flex items-center gap-1 mt-2 text-purple-200">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm truncate">{dashboard.unitLocation}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2 sm:gap-3 items-center flex-shrink-0">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-36 sm:w-48 bg-white text-gray-900 text-sm">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={() => refetch()} 
              variant="outline" 
              size="sm"
              className="bg-white text-purple-600 hover:bg-purple-50 px-2 sm:px-3"
            >
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Monthly Orders</CardTitle>
            <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold">{dashboard.monthlyOrders || 0}</div>
            <p className="text-xs text-muted-foreground">Orders this month from your unit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold">{formatCurrency(dashboard.monthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">Revenue generated this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold">{dashboard.totalCustomers || 0}</div>
            <p className="text-xs text-muted-foreground">Active customers in your unit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Active Sales</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold">{dashboard.activeSalesPersons || 0}</div>
            <p className="text-xs text-muted-foreground">Active sales persons in unit</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Section */}
      <Card>
        <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
            <div className="min-w-0 flex-1">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="text-sm sm:text-base">Recent Orders</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Latest orders from your unit location</CardDescription>
            </div>
            <Badge variant="outline" className="text-xs w-fit">
              {recentOrders.length} orders
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          {recentOrders.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-gray-500">
              <Package className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-4 text-gray-300" />
              <p className="text-base sm:text-lg font-medium">No recent orders</p>
              <p className="text-xs sm:text-sm">Orders from your unit will appear here</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order Code</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Sales Person</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((order) => (
                      <TableRow key={order._id}>
                        <TableCell className="font-mono text-sm">
                          {order.orderCode || order._id.slice(-6)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.customer?.name || 'Unknown'}</div>
                            {order.customer?.email && (
                              <div className="text-sm text-gray-500">{order.customer.email}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {order.salesPerson?.username || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(order.status)}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {order.itemsCount || 0}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(order.totalAmount)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(order.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              // Navigate to order details or open modal
                              window.location.href = `/unit-head/orders`;
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="block lg:hidden space-y-3">
                {recentOrders.map((order) => (
                  <Card key={order._id} className="border border-gray-200">
                    <CardContent className="p-3">
                      <div className="space-y-3">
                        {/* Header Row */}
                        <div className="flex items-center justify-between">
                          <div className="font-mono text-sm font-medium">
                            #{order.orderCode || order._id.slice(-6)}
                          </div>
                          <Badge variant={getStatusVariant(order.status)} className="text-xs">
                            {order.status}
                          </Badge>
                        </div>
                        
                        {/* Customer & Sales Info */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-600">Customer</p>
                            <p className="font-medium truncate">{order.customer?.name || 'Unknown'}</p>
                            {order.customer?.email && (
                              <p className="text-xs text-gray-500 truncate">{order.customer.email}</p>
                            )}
                          </div>
                          <div>
                            <p className="text-gray-600">Sales Person</p>
                            <p className="font-medium">{order.salesPerson?.username || 'N/A'}</p>
                          </div>
                        </div>

                        {/* Items & Amount */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-600">Items</p>
                            <p className="font-medium">{order.itemsCount || 0}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Amount</p>
                            <p className="font-medium">{formatCurrency(order.totalAmount)}</p>
                          </div>
                        </div>

                        {/* Date & Action */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="text-xs text-gray-500">
                            {formatDate(order.createdAt)}
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              // Navigate to order details or open modal
                              window.location.href = `/unit-head/orders`;
                            }}
                            className="text-xs px-2 py-1"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};