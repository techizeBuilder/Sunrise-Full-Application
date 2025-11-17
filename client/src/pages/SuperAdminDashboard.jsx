import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Building2,
  Package,
  ShoppingCart,
  TrendingUp,
  UserCheck,
  Eye,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Activity
} from 'lucide-react';

export default function SuperAdminDashboard() {
  // Fetch Super Admin dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['super-admin-dashboard'],
    queryFn: () => apiRequest('GET', '/api/super-admin/dashboard'),
    retry: 1
  });

  const dashboard = dashboardData?.data || {};
  const overview = dashboard.overview || {};
  const recentOrders = dashboard.recentOrders || [];
  const recentCustomers = dashboard.recentCustomers || [];
  const recentSalesPersons = dashboard.recentSalesPersons || [];
  const companies = dashboard.companies || [];

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

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: 'outline', color: 'text-yellow-600 border-yellow-200' },
      approved: { variant: 'outline', color: 'text-green-600 border-green-200' },
      in_production: { variant: 'outline', color: 'text-blue-600 border-blue-200' },
      completed: { variant: 'outline', color: 'text-emerald-600 border-emerald-200' },
      cancelled: { variant: 'outline', color: 'text-red-600 border-red-200' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {status?.replace('_', ' ').toUpperCase() || 'PENDING'}
      </Badge>
    );
  };

  if (dashboardLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground">System overview and recent activities</p>
        </div>
      </div>

      {/* System Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overview.totalOrders || 0}</p>
                <p className="text-sm text-muted-foreground">Total Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(overview.totalRevenue)}</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overview.totalUsers || 0}</p>
                <p className="text-sm text-muted-foreground">System Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <UserCheck className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overview.totalCustomers || 0}</p>
                <p className="text-sm text-muted-foreground">Total Customers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-pink-100 rounded-lg">
                <Building2 className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overview.totalCompanies || 0}</p>
                <p className="text-sm text-muted-foreground">Companies</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Data Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order Code</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.slice(0, 5).map((order) => (
                    <TableRow key={order._id}>
                      <TableCell className="font-medium">
                        {order.orderCode || `ORD-${order._id.slice(-6)}`}
                      </TableCell>
                      <TableCell>
                        {order.customer?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(order.totalAmount)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(order.status)}
                      </TableCell>
                      <TableCell>
                        {formatDate(order.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {recentOrders.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No recent orders</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Customers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Recent Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCustomers.slice(0, 5).map((customer) => (
                <div key={customer._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-semibold">{customer.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {customer.contactPerson || 'No contact person'}
                    </p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {customer.email}
                      </span>
                      {customer.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {customer.city}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={customer.active === 'Yes' ? 'outline' : 'secondary'}>
                      {customer.active === 'Yes' ? 'Active' : 'Inactive'}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(customer.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {recentCustomers.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No recent customers</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales Persons & Companies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales Persons */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Sales Persons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSalesPersons.slice(0, 5).map((person) => (
                <div key={person._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-semibold">{person.fullName || person.username}</p>
                    <p className="text-sm text-muted-foreground">{person.email}</p>
                    {person.companyId && (
                      <p className="text-xs text-muted-foreground">
                        {person.companyId.name} - {person.companyId.city}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">Sales</Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(person.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {recentSalesPersons.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No recent sales persons</p>
            )}
          </CardContent>
        </Card>

        {/* Companies List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Companies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {companies.slice(0, 5).map((company) => (
                <div key={company._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-semibold">{company.name}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {company.city}
                      </span>
                      {company.email && (
                        <span>{company.email}</span>
                      )}
                    </div>
                    {company.mobile && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" />
                        {company.mobile}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">Active</Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(company.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {companies.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No companies found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}