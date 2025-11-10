import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  ShoppingCart,
  Package,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Award,
  Calendar,
  BarChart3,
  MapPin,
  Star,
  Eye,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { showSmartToast } from '@/lib/toast-utils';

export default function UnitHeadDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');

  // Query for dashboard data
  const { data: dashboardData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/unit-head/dashboard'],
    queryFn: () => apiRequest('GET', '/api/unit-head/dashboard'),
    retry: 1,
    refetchInterval: 300000, // Refetch every 5 minutes
    onError: (error) => {
      showSmartToast(error, 'Failed to fetch dashboard data');
    }
  });

  const dashboard = dashboardData?.data || {};
  const overview = dashboard.overview || {};
  const orders = dashboard.orders || {};
  const sales = dashboard.sales || {};
  const customers = dashboard.customers || {};
  const salesPersons = dashboard.salesPersons || [];

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

  const getGrowthIcon = (growth) => {
    const numGrowth = parseFloat(growth);
    if (numGrowth > 0) {
      return <ArrowUpRight className="h-3 w-3 text-green-500" />;
    } else if (numGrowth < 0) {
      return <ArrowDownRight className="h-3 w-3 text-red-500" />;
    }
    return null;
  };

  const getGrowthColor = (growth) => {
    const numGrowth = parseFloat(growth);
    if (numGrowth > 0) return "text-green-600";
    if (numGrowth < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getStatusColor = (status) => {
    const statusMap = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-blue-100 text-blue-800',
      'in_production': 'bg-purple-100 text-purple-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'rejected': 'bg-gray-100 text-gray-800'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  };

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>Error loading dashboard: {error?.message || 'Unknown error'}</p>
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
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Users className="h-10 w-10" />
              Unit Head Dashboard
            </h1>
            <p className="text-purple-100 mt-2">
              Real-time overview of unit operations and performance metrics
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={refetch}
              disabled={isLoading}
            >
              <Calendar className="h-4 w-4 mr-2" />
              {isLoading ? 'Loading...' : 'Refresh'}
            </Button>
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <BarChart3 className="h-4 w-4 mr-2" />
              Reports
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalOrders || 0}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {getGrowthIcon(overview.orderGrowth)}
                <span className={getGrowthColor(overview.orderGrowth)}>
                  {Math.abs(parseFloat(overview.orderGrowth || 0)).toFixed(1)}% from last month
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(overview.monthlyRevenue)}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {getGrowthIcon(overview.revenueGrowth)}
                <span className={getGrowthColor(overview.revenueGrowth)}>
                  {Math.abs(parseFloat(overview.revenueGrowth || 0)).toFixed(1)}% from last month
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalCustomers || 0}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {getGrowthIcon(overview.customerGrowth)}
                <span className={getGrowthColor(overview.customerGrowth)}>
                  {Math.abs(parseFloat(overview.customerGrowth || 0)).toFixed(1)}% from last month
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Customers</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.activeCustomers || 0}</div>
              <p className="text-xs text-muted-foreground">
                {overview.totalSalesPersons || 0} sales persons active
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Order Status & Sales Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Status Distribution
            </CardTitle>
            <CardDescription>
              Current orders breakdown by status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {orders.byStatus?.length > 0 ? orders.byStatus.map((status) => (
                  <div key={status._id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(status._id)}>
                          {status._id}
                        </Badge>
                        <span className="text-sm font-medium">{status.count} orders</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {formatCurrency(status.totalAmount)}
                      </span>
                    </div>
                    <Progress 
                      value={(status.count / overview.totalOrders) * 100} 
                      className="h-2" 
                    />
                  </div>
                )) : (
                  <p className="text-muted-foreground text-center py-4">No orders found</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Sales Persons */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Top Sales Persons
            </CardTitle>
            <CardDescription>
              Best performing sales team members
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="animate-pulse flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {salesPersons?.length > 0 ? salesPersons.map((person, index) => (
                  <div key={person._id} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {person.username.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {person.username}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{person.totalOrders} orders</span>
                        <span>{formatCurrency(person.totalRevenue)}</span>
                      </div>
                    </div>
                    <Badge variant="outline">
                      #{index + 1}
                    </Badge>
                  </div>
                )) : (
                  <p className="text-muted-foreground text-center py-4">No sales persons found</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders & Customer Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Recent Orders
            </CardTitle>
            <CardDescription>
              Latest orders in your unit
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="animate-pulse flex space-x-3">
                    <div className="h-4 bg-gray-200 rounded flex-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {orders.recent?.length > 0 ? orders.recent.map((order) => (
                  <div key={order._id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {order.orderCode || order.orderNumber}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{order.customer}</span>
                        <Badge className={getStatusColor(order.status)} size="sm">
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{formatCurrency(order.totalAmount)}</p>
                      <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-muted-foreground text-center py-4">No recent orders</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Distribution by City */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Customer Distribution
            </CardTitle>
            <CardDescription>
              Top cities by customer count
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="flex justify-between mb-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-8"></div>
                    </div>
                    <div className="h-2 bg-gray-200 rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {customers.byCity?.length > 0 ? customers.byCity.map((city) => (
                  <div key={city._id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{city._id || 'Unknown'}</span>
                      <Badge variant="outline">{city.count} customers</Badge>
                    </div>
                    <Progress 
                      value={(city.count / overview.totalCustomers) * 100} 
                      className="h-2" 
                    />
                  </div>
                )) : (
                  <p className="text-muted-foreground text-center py-4">No customer data available</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}