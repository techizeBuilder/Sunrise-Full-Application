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
      <div className="p-6 space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-6 py-4 rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" />
              Unit Head Dashboard
            </h1>
            <p className="text-purple-100 mt-1">
              Real-time overview of unit operations and performance metrics - {periodOptions.find(p => p.value === selectedPeriod)?.label}
            </p>
            {dashboard.unitLocation && (
              <div className="flex items-center gap-1 mt-2 text-purple-200">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{dashboard.unitLocation}</span>
              </div>
            )}
          </div>
          <div className="flex gap-3 items-center">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-48 bg-white text-gray-900">
                <Calendar className="h-4 w-4 mr-2" />
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
              className="bg-white text-purple-600 hover:bg-purple-50"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.monthlyOrders || 0}</div>
            <p className="text-xs text-muted-foreground">Orders this month from your unit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboard.monthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">Revenue generated this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.totalCustomers || 0}</div>
            <p className="text-xs text-muted-foreground">Active customers in your unit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.activeSalesPersons || 0}</div>
            <p className="text-xs text-muted-foreground">Active sales persons in unit</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Recent Orders
              </CardTitle>
              <CardDescription>Latest orders from your unit location</CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              {recentOrders.length} orders
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No recent orders</p>
              <p className="text-sm">Orders from your unit will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};