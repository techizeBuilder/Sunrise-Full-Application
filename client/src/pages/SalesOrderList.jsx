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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Eye, 
  Filter, 
  RefreshCw,
  Package,
  Calendar,
  User,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Edit,
  Settings
} from 'lucide-react';
import { showSuccessToast, showSmartToast } from '@/lib/toast-utils';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  in_production: 'bg-blue-100 text-blue-800',
  completed: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-gray-100 text-gray-800'
};

const statusIcons = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
  in_production: Package,
  completed: Truck,
  cancelled: XCircle
};

const statusOptions = [
  { value: 'pending', label: 'Pending', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'approved', label: 'Approved', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  { value: 'rejected', label: 'Rejected', icon: XCircle, color: 'bg-red-100 text-red-800' },
  { value: 'in_production', label: 'Move to Production', icon: Package, color: 'bg-blue-100 text-blue-800' }
];

export default function SalesOrderList() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: 'all',
    search: '',
    dateFrom: '',
    dateTo: ''
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isStatusUpdateOpen, setIsStatusUpdateOpen] = useState(false);
  const [statusUpdateForm, setStatusUpdateForm] = useState({
    orderId: null,
    newStatus: '',
    notes: ''
  });
  const queryClient = useQueryClient();

  // Fetch orders
  const { data: ordersResponse, isLoading, error } = useQuery({
    queryKey: ['/api/unit-manager/all-orders', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') params.append(key, value);
      });
      return apiRequest('GET', `/api/unit-manager/all-orders?${params.toString()}`);
    },
    retry: 1
  });

  // Fetch single order details
  const { data: orderDetailsResponse, isLoading: isDetailsLoading } = useQuery({
    queryKey: ['/api/unit-manager/orders', selectedOrder],
    queryFn: () => apiRequest('GET', `/api/unit-manager/orders/${selectedOrder}`),
    enabled: !!selectedOrder
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status, notes }) => 
      apiRequest('PUT', `/api/unit-manager/orders/${orderId}/status`, { status, notes }),
    onSuccess: () => {
      showSuccessToast('Success', 'Order status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['/api/unit-manager/all-orders'] });
      setIsDetailsOpen(false);
      setIsStatusUpdateOpen(false);
      setSelectedOrder(null);
      setStatusUpdateForm({ orderId: null, newStatus: '', notes: '' });
    },
    onError: (error) => {
      showSmartToast(error, 'Failed to update order status');
    }
  });

  const orders = ordersResponse?.data?.orders || [];
  const pagination = ordersResponse?.data?.pagination || {};
  const summary = ordersResponse?.data?.summary || {};
  const orderDetails = orderDetailsResponse?.data || null;

  const handleViewOrder = (orderId) => {
    setSelectedOrder(orderId);
    setIsDetailsOpen(true);
  };

  const handleOpenStatusUpdate = (orderId, currentStatus) => {
    setStatusUpdateForm({
      orderId: orderId,
      newStatus: currentStatus,
      notes: ''
    });
    setIsStatusUpdateOpen(true);
  };

  const handleStatusUpdateSubmit = () => {
    if (statusUpdateForm.orderId && statusUpdateForm.newStatus) {
      updateStatusMutation.mutate({
        orderId: statusUpdateForm.orderId,
        status: statusUpdateForm.newStatus,
        notes: statusUpdateForm.notes
      });
    }
  };

  const handleStatusUpdate = (newStatus, notes = '') => {
    if (selectedOrder) {
      updateStatusMutation.mutate({
        orderId: selectedOrder,
        status: newStatus,
        notes
      });
    }
  };

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }));
  };

  const handleStatusFilter = (status) => {
    setFilters(prev => ({ ...prev, status, page: 1 }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>Error loading orders: {error.message}</p>
              <Button 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/unit-manager/all-orders'] })}
                className="mt-4"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Sales Order List
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and track all sales orders
          </p>
        </div>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/unit-manager/all-orders'] })}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{summary.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{summary.pending || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold">{summary.approved || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Production</p>
                <p className="text-2xl font-bold">{summary.in_production || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Truck className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold">{summary.completed || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Disapproved</p>
                <p className="text-2xl font-bold">{summary.disapproved || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search orders..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filters.status} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="in_production">In Production</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>
            {pagination.totalItems || 0} orders found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[100px]">Order #</TableHead>
                    <TableHead className="min-w-[120px]">Customer</TableHead>
                    <TableHead className="min-w-[100px]">Date</TableHead>
                    <TableHead className="min-w-[80px]">Amount</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[120px]">Salesperson</TableHead>
                    <TableHead className="min-w-[140px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    const StatusIcon = statusIcons[order.status] || Clock;
                    return (
                      <TableRow key={order._id}>
                        <TableCell className="font-medium text-xs lg:text-sm">
                          {order.orderCode || order._id.slice(-6)}
                        </TableCell>
                        <TableCell className="text-xs lg:text-sm">
                          <div>
                            <p className="font-medium">{order.customer?.name || 'N/A'}</p>
                            <p className="text-xs text-gray-500">{order.customer?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs lg:text-sm">{formatDate(order.createdAt)}</TableCell>
                        <TableCell className="text-xs lg:text-sm">{formatCurrency(order.totalAmount || 0)}</TableCell>
                        <TableCell>
                          <Badge className={`${statusColors[order.status]} flex items-center gap-1 text-xs`}>
                            <StatusIcon className="h-3 w-3" />
                            {order.status?.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs lg:text-sm">{order.salesPerson?.fullName || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 lg:gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewOrder(order._id)}
                              className="text-xs px-2 py-1 lg:px-3 lg:py-2"
                            >
                              <Eye className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenStatusUpdate(order._id, order.status)}
                              className="text-xs px-2 py-1 lg:px-3 lg:py-2 text-blue-600 hover:text-blue-700"
                            >
                              <Settings className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                              Update
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
            {pagination.totalItems} results
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrev}
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNext}
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Order Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              View and manage order information
            </DialogDescription>
          </DialogHeader>
          
          {isDetailsLoading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : orderDetails ? (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Order Number</label>
                  <p className="font-medium">{orderDetails.orderCode || orderDetails._id.slice(-6)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Date</label>
                  <p className="font-medium">{formatDate(orderDetails.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Total Amount</label>
                  <p className="font-medium">{formatCurrency(orderDetails.totalAmount || 0)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Current Status</label>
                  <div className="mt-1">
                    <Badge className={statusColors[orderDetails.status]}>
                      {orderDetails.status?.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name</label>
                      <p>{orderDetails.customer?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p>{orderDetails.customer?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p>{orderDetails.customer?.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Address</label>
                      <p>{orderDetails.customer?.address || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              {orderDetails.products && orderDetails.products.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Order Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderDetails.products.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.product?.name || item.productName || 'N/A'}</p>
                                <p className="text-sm text-gray-500">{item.product?.code}</p>
                              </div>
                            </TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{formatCurrency(item.price || 0)}</TableCell>
                            <TableCell>{formatCurrency((item.quantity * item.price) || 0)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Status Update Actions */}
              {/* <Card>
                <CardHeader>
                  <CardTitle>Update Order Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {orderDetails.status === 'Pending' && (
                      <>
                        <Button
                          onClick={() => handleStatusUpdate('Approved')}
                          disabled={updateStatusMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve Order
                        </Button>
                        <Button
                          onClick={() => handleStatusUpdate('Disapproved')}
                          disabled={updateStatusMutation.isPending}
                          variant="destructive"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Disapprove Order
                        </Button>
                      </>
                    )}
                    {orderDetails.status === 'Approved' && (
                      <Button
                        onClick={() => handleStatusUpdate('In_Production')}
                        disabled={updateStatusMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Move to Production
                      </Button>
                    )}
                    {orderDetails.status === 'In_Production' && (
                      <Button
                        onClick={() => handleStatusUpdate('Completed')}
                        disabled={updateStatusMutation.isPending}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        Mark Completed
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card> */}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={isStatusUpdateOpen} onOpenChange={setIsStatusUpdateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Select a new status for the order and add optional notes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">New Status</Label>
              <Select 
                value={statusUpdateForm.newStatus} 
                onValueChange={(value) => setStatusUpdateForm(prev => ({ ...prev, newStatus: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => {
                    const IconComponent = status.icon;
                    return (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          <span>{status.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this status change..."
                value={statusUpdateForm.notes}
                onChange={(e) => setStatusUpdateForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsStatusUpdateOpen(false)}
              disabled={updateStatusMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleStatusUpdateSubmit}
              disabled={updateStatusMutation.isPending || !statusUpdateForm.newStatus}
            >
              {updateStatusMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Update Status
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}