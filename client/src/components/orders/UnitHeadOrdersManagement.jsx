import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getOrders, 
  createOrder, 
  updateOrder, 
  updateOrderStatus,
  deleteOrder, 
  getItems,
  getOrderById
} from '@/services/api';
import { unitHeadCustomerApi } from '@/api/customerService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import ProductSelector from '@/components/products/ProductSelector';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, Eye, Edit, Trash2, MoreHorizontal, FileText, Clock, CheckCircle, XCircle, Save, Loader2
} from 'lucide-react';

const UnitHeadOrdersManagement = () => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewOrderDetails, setViewOrderDetails] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    salesPersonId: '',
    orderDate: new Date().toISOString().split('T')[0],
    remarks: '',
    selectedProducts: []
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' }
  ];

  // Queries
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['unit-head-orders', { page: currentPage, search: searchTerm, status: statusFilter }],
    queryFn: async () => {
      const params = {
        page: currentPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      };
      return await getOrders(params);
    },
    keepPreviousData: true
  });

  const { data: customersData } = useQuery({
    queryKey: ['unit-head-customers'],
    queryFn: () => unitHeadCustomerApi.getCustomers()
  });

  // Sales persons query
  const { 
    data: salesPersonsData, 
    isLoading: isLoadingSalesPersons 
  } = useQuery({
    queryKey: ['unit-head-sales-persons'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/unit-head/sales-persons', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch sales persons');
      return response.json();
    }
  });

  // Debug logging to check what data is being returned
  console.log('🔍 Customers API Response:', customersData);
  console.log('🔍 User Info:', user);

  const orders = ordersData?.data?.orders || [];
  const customersList = customersData?.data?.customers || customersData?.customers || [];
  const salesPersonsList = salesPersonsData?.data?.salesPersons || salesPersonsData?.salesPersons || [];
  
  // Debug the data lists
  console.log('🔍 Processed customers list:', customersList);
  console.log('🔍 Processed sales persons list:', salesPersonsList);
  console.log('🔍 Sales persons raw data:', salesPersonsData);
  console.log('🔍 Sales persons loading state:', isLoadingSalesPersons);

  // Mutations
  const createOrderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      toast({ title: "Success", description: "Order created successfully" });
      resetForm();
      setIsCreateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['unit-head-orders'] });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to create order", variant: "destructive" });
    }
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ orderId, orderData }) => {
      console.log('📡 API: Updating order', orderId, orderData);
      return updateOrder(orderId, orderData);
    },
    onSuccess: () => {
      console.log('✅ Update order successful');
      toast({ title: "Success", description: "Order updated successfully" });
      setIsEditModalOpen(false);
      setSelectedOrder(null);
      queryClient.invalidateQueries({ queryKey: ['unit-head-orders'] });
    },
    onError: (error) => {
      console.error('❌ Update order failed:', error);
      toast({ title: "Error", description: error.message || "Failed to update order", variant: "destructive" });
    }
  });

  const deleteOrderMutation = useMutation({
    mutationFn: (id) => {
      console.log('📡 API: Deleting order', id);
      return deleteOrder(id);
    },
    onSuccess: () => {
      console.log('✅ Delete order successful');
      toast({ title: "Success", description: "Order deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['unit-head-orders'] });
    },
    onError: (error) => {
      console.error('❌ Delete order failed:', error);
      toast({ title: "Error", description: error.message || "Failed to delete order", variant: "destructive" });
    }
  });

  const statusUpdateMutation = useMutation({
    mutationFn: ({ id, status }) => {
      console.log('📡 API: Updating status', id, 'to', status);
      return updateOrderStatus(id, { status });
    },
    onSuccess: () => {
      console.log('✅ Status update successful');
      toast({ title: "Status Updated", description: "Order status updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['unit-head-orders'] });
    },
    onError: (error) => {
      console.error('❌ Status update failed:', error);
      toast({ title: "Error", description: error.message || "Failed to update status", variant: "destructive" });
    }
  });

  // Helper functions
  const resetForm = () => {
    setFormData({
      customerId: '',
      customerName: '',
      salesPersonId: '',
      orderDate: new Date().toISOString().split('T')[0],
      remarks: '',
      selectedProducts: []
    });
  };

  const handleCreate = () => {
    if (!formData.customerId || !formData.salesPersonId || formData.selectedProducts.length === 0) {
      toast({ 
        title: "Validation Error", 
        description: "Please select a customer, sales person and products", 
        variant: "destructive" 
      });
      return;
    }

    const orderData = {
      customerId: formData.customerId,
      salesPersonId: formData.salesPersonId,
      orderDate: formData.orderDate,
      products: formData.selectedProducts.map(p => ({
        product: p._id,
        quantity: parseInt(p.quantity),
        unitPrice: parseFloat(p.price) || parseFloat(p.unitPrice) || 0
      })),
      notes: formData.remarks
    };

    createOrderMutation.mutate(orderData);
  };

  const handleProductSelect = (product) => {
    const existingIndex = formData.selectedProducts.findIndex(p => p._id === product._id);
    if (existingIndex >= 0) {
      const updatedProducts = [...formData.selectedProducts];
      updatedProducts[existingIndex] = {
        ...updatedProducts[existingIndex],
        quantity: (parseInt(updatedProducts[existingIndex].quantity) + 1).toString()
      };
      setFormData({ ...formData, selectedProducts: updatedProducts });
    } else {
      setFormData({ 
        ...formData, 
        selectedProducts: [...formData.selectedProducts, { 
          ...product, 
          quantity: '1',
          price: product.price || product.sellingPrice || 0,
          unitPrice: product.price || product.sellingPrice || 0
        }] 
      });
    }
  };

  const handleQuantityChange = (productId, quantity) => {
    const updatedProducts = formData.selectedProducts.map(p =>
      p._id === productId ? { ...p, quantity } : p
    );
    setFormData({ ...formData, selectedProducts: updatedProducts });
  };

  const handleProductRemove = (productId) => {
    setFormData({
      ...formData,
      selectedProducts: formData.selectedProducts.filter(p => p._id !== productId)
    });
  };

  const handleView = async (order) => {
    console.log('🔍 View button clicked for order:', order._id);
    try {
      // Fetch complete order details from API
      console.log('📡 Fetching order details for:', order._id);
      const orderDetails = await getOrderById(order._id);
      console.log('✅ Order details fetched:', orderDetails);
      
      // Use the fetched details or fallback to the order from table
      setViewOrderDetails(orderDetails.data || orderDetails || order);
      setIsViewModalOpen(true);
    } catch (error) {
      console.error('❌ Failed to fetch order details:', error);
      // Fallback to showing the order from table
      setViewOrderDetails(order);
      setIsViewModalOpen(true);
      toast({ 
        title: "Warning", 
        description: "Could not fetch complete details, showing basic info", 
        variant: "destructive" 
      });
    }
  };

  const handleEdit = async (order) => {
    console.log('✏️ Edit button clicked for order:', order._id, order);
    try {
      // Fetch fresh order data from API to ensure we have latest info
      console.log('📡 Fetching fresh order data for editing:', order._id);
      const freshOrderData = await getOrderById(order._id);
      console.log('✅ Fresh order data fetched:', freshOrderData);
      
      const orderToEdit = freshOrderData.data || freshOrderData || order;
      
      // Prepare order data exactly like Create Order format
      const orderForEdit = {
        ...orderToEdit,
        customerId: orderToEdit.customer?._id || orderToEdit.customerId,
        customerName: orderToEdit.customer?.name || orderToEdit.customerName,
        salesPersonId: orderToEdit.salesPerson?._id || orderToEdit.salesPersonId,
        selectedProducts: orderToEdit.products?.map(p => ({
          _id: p.product?._id || p._id || p.productId,
          name: p.product?.name || p.productName || p.name || 'Product',
          code: p.product?.code || p.code || '',
          price: p.unitPrice || p.price || 0,
          unitPrice: p.unitPrice || p.price || 0,
          quantity: (p.quantity || 1).toString(),
          sellingPrice: p.unitPrice || p.price || 0
        })) || []
      };
      
      console.log('📝 Order prepared for editing:', orderForEdit);
      console.log('📝 Customer ID:', orderForEdit.customerId);
      console.log('📝 Selected products:', orderForEdit.selectedProducts);
      setSelectedOrder(orderForEdit);
      setIsEditModalOpen(true);
    } catch (error) {
      console.error('❌ Failed to fetch fresh order data:', error);
      // Fallback to using the order from table
      const orderForEdit = {
        ...order,
        customerId: order.customer?._id || order.customerId,
        customerName: order.customer?.name || order.customerName,
        salesPersonId: order.salesPerson?._id || order.salesPersonId,
        selectedProducts: order.products?.map(p => ({
          _id: p.product?._id || p._id || p.productId,
          name: p.product?.name || p.productName || p.name || 'Product',
          code: p.product?.code || p.code || '',
          price: p.unitPrice || p.price || 0,
          unitPrice: p.unitPrice || p.price || 0,
          quantity: (p.quantity || 1).toString(),
          sellingPrice: p.unitPrice || p.price || 0
        })) || []
      };
      console.log('📝 Fallback order prepared:', orderForEdit);
      setSelectedOrder(orderForEdit);
      setIsEditModalOpen(true);
      
      toast({ 
        title: "Warning", 
        description: "Using cached data for editing. Some info might be outdated.", 
        variant: "destructive" 
      });
    }
  };

  const handleDelete = (orderId) => {
    console.log('🗑️ Delete button clicked for order:', orderId);
    if (window.confirm('Are you sure you want to delete this order?')) {
      console.log('🗑️ Delete confirmed, calling API...');
      deleteOrderMutation.mutate(orderId);
    }
  };

  const handleStatusUpdate = (orderId, newStatus) => {
    console.log('🔄 Status update clicked:', orderId, 'to', newStatus);
    statusUpdateMutation.mutate({ id: orderId, status: newStatus });
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'approved': return <CheckCircle className="h-3 w-3" />;
      case 'rejected': return <XCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-blue-600 text-white px-6 py-4 rounded-md">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <FileText className="h-6 w-6" />
            <h1 className="text-xl font-semibold">Unit Head Orders</h1>
          </div>
          <Button 
            onClick={() => setIsCreateModalOpen(true)} 
            className="bg-white text-blue-600 hover:bg-gray-100"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Order
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Search orders..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order Code</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordersLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order._id}>
                  <TableCell className="font-mono text-sm">{order.orderCode || order._id}</TableCell>
                  <TableCell>{order.customer?.name || order.customerName || 'Unknown'}</TableCell>
                  <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Badge 
                          variant={getStatusVariant(order.status)} 
                          className="cursor-pointer hover:opacity-80"
                        >
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{order.status}</span>
                        </Badge>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {statusOptions.filter(s => s.value !== 'all' && s.value !== order.status).map((status) => (
                          <DropdownMenuItem 
                            key={status.value} 
                            onClick={() => handleStatusUpdate(order._id, status.value)}
                          >
                            Change to {status.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell>{order.products?.length || 0}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(order)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(order)}
                        title="Edit Order"
                      >
                        <Edit className="h-4 w-4 text-orange-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(order._id)}
                        title="Delete Order"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Order Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Order</DialogTitle>
            <DialogDescription>Fill in the details to create a new order.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="customer">Customer Name *</Label>
                <Select 
                  value={formData.customerId || ''} 
                  onValueChange={(value) => {
                    const customer = customersList.find(c => c._id === value);
                    setFormData({
                      ...formData, 
                      customerId: value,
                      customerName: customer?.name || ''
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customersList.map((customer) => (
                      <SelectItem key={customer._id} value={customer._id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="salesPerson">Sales Person *</Label>
                <Select 
                  value={formData.salesPersonId || ''} 
                  onValueChange={(value) => {
                    setFormData({
                      ...formData, 
                      salesPersonId: value
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingSalesPersons ? "Loading sales persons..." : "Select sales person"} />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingSalesPersons ? (
                      <SelectItem value="" disabled>Loading...</SelectItem>
                    ) : salesPersonsList.length === 0 ? (
                      <SelectItem value="" disabled>No sales persons found</SelectItem>
                    ) : (
                      salesPersonsList.map((salesperson) => (
                        <SelectItem key={salesperson._id} value={salesperson._id}>
                          {salesperson.fullName || salesperson.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="orderDate">Order Date *</Label>
                <Input
                  id="orderDate"
                  type="date"
                  value={formData.orderDate}
                  onChange={(e) => setFormData({...formData, orderDate: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label>Select Products *</Label>
              <ProductSelector
                onProductSelect={handleProductSelect}
                selectedProducts={formData.selectedProducts}
                onQuantityChange={handleQuantityChange}
                onProductRemove={handleProductRemove}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleCreate}
                disabled={createOrderMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {createOrderMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Order
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Order Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-blue-600">View Order Details</DialogTitle>
            <DialogDescription>Complete details of the selected order.</DialogDescription>
          </DialogHeader>
          {viewOrderDetails && (
            <div className="space-y-6">
              {/* Basic Order Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Order Code</Label>
                  <div className="mt-1 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <span className="font-mono text-blue-700">{viewOrderDetails.orderCode || viewOrderDetails._id}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Order Status</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg border">
                    <Badge variant={getStatusVariant(viewOrderDetails.status)}>
                      {getStatusIcon(viewOrderDetails.status)}
                      <span className="ml-1 capitalize">{viewOrderDetails.status}</span>
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Customer & Date Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Customer Name</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg border">
                    {viewOrderDetails.customer?.name || viewOrderDetails.customerName || 'Unknown Customer'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Order Date</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg border">
                    {new Date(viewOrderDetails.orderDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
              
              {/* Products Section */}
              <div>
                <Label className="text-sm font-medium text-gray-500 mb-3 block">Products Ordered</Label>
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 font-medium text-gray-700 border-b">
                    Product Details ({viewOrderDetails.products?.length || 0} items)
                  </div>
                  <div className="space-y-0">
                    {viewOrderDetails.products?.length > 0 ? (
                      viewOrderDetails.products.map((product, index) => (
                        <div key={index} className="p-4 border-b last:border-b-0 hover:bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {product.productName || product.name || product.product?.name || 'Product'}
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                SKU: {product.product?.code || product.code || 'N/A'}
                              </div>
                              {product.product?.category && (
                                <div className="text-xs text-gray-400 mt-1">
                                  Category: {product.product.category}
                                </div>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <div className="text-sm text-gray-600">
                                Qty: <span className="font-medium">{product.quantity}</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                Price: <span className="font-medium">₹{(product.price || product.unitPrice || 0).toFixed(2)}</span>
                              </div>
                              <div className="text-sm font-semibold text-gray-800 border-t mt-1 pt-1">
                                Total: <span className="text-blue-600">₹{(product.total || (product.quantity * (product.price || product.unitPrice || 0))).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        No products found in this order
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Order Total */}
                {viewOrderDetails.products?.length > 0 && (
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Order Total Amount:</span>
                      <span className="text-xl font-bold text-blue-600">
                        ₹{viewOrderDetails.totalAmount || 
                          viewOrderDetails.products.reduce((sum, p) => 
                            sum + (p.total || (p.quantity * (p.price || p.unitPrice || 0))), 0
                          ).toFixed(2)
                        }
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Additional Information */}
              <div className="grid grid-cols-2 gap-6">
                {viewOrderDetails.notes && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Notes</Label>
                    <div className="mt-1 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      {viewOrderDetails.notes}
                    </div>
                  </div>
                )}
                
                <div>
                  <Label className="text-sm font-medium text-gray-500">Order Information</Label>
                  <div className="mt-1 space-y-2">
                    <div className="p-2 bg-gray-50 rounded text-xs">
                      <span className="font-medium">Created:</span> {viewOrderDetails.createdAt ? new Date(viewOrderDetails.createdAt).toLocaleString() : 'N/A'}
                    </div>
                    <div className="p-2 bg-gray-50 rounded text-xs">
                      <span className="font-medium">Last Updated:</span> {viewOrderDetails.updatedAt ? new Date(viewOrderDetails.updatedAt).toLocaleString() : 'N/A'}
                    </div>
                    {viewOrderDetails.salesPerson && (
                      <div className="p-2 bg-gray-50 rounded text-xs">
                        <span className="font-medium">Sales Person:</span> {viewOrderDetails.salesPerson.username || 'N/A'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Close Button */}
              <div className="flex justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Order Modal - Same as Create Order */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
            <DialogDescription>Update the order details below.</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-customer">Customer Name *</Label>
                  <Select 
                    value={selectedOrder.customerId || ''} 
                    onValueChange={(value) => {
                      const customer = customersList.find(c => c._id === value);
                      setSelectedOrder({
                        ...selectedOrder, 
                        customerId: value,
                        customerName: customer?.name || ''
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customersList.map((customer) => (
                        <SelectItem key={customer._id} value={customer._id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-salesPerson">Sales Person *</Label>
                  <Select 
                    value={selectedOrder.salesPersonId || ''} 
                    onValueChange={(value) => {
                      setSelectedOrder({
                        ...selectedOrder, 
                        salesPersonId: value
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingSalesPersons ? "Loading sales persons..." : "Select sales person"} />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingSalesPersons ? (
                        <SelectItem value="" disabled>Loading...</SelectItem>
                      ) : salesPersonsList.length === 0 ? (
                        <SelectItem value="" disabled>No sales persons found</SelectItem>
                      ) : (
                        salesPersonsList.map((salesperson) => (
                          <SelectItem key={salesperson._id} value={salesperson._id}>
                            {salesperson.fullName || salesperson.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-date">Order Date *</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={selectedOrder.orderDate ? new Date(selectedOrder.orderDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setSelectedOrder({...selectedOrder, orderDate: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <Label>Select Products *</Label>
                <ProductSelector
                  onProductSelect={(product) => {
                    const updatedProducts = selectedOrder.selectedProducts || [];
                    const existingIndex = updatedProducts.findIndex(p => p._id === product._id);
                    if (existingIndex >= 0) {
                      updatedProducts[existingIndex] = {
                        ...updatedProducts[existingIndex],
                        quantity: (parseInt(updatedProducts[existingIndex].quantity) + 1).toString()
                      };
                    } else {
                      updatedProducts.push({
                        ...product,
                        quantity: '1',
                        price: product.price || product.sellingPrice || 0
                      });
                    }
                    setSelectedOrder({...selectedOrder, selectedProducts: updatedProducts});
                  }}
                  selectedProducts={selectedOrder.selectedProducts || []}
                  onQuantityChange={(productId, quantity) => {
                    const updatedProducts = (selectedOrder.selectedProducts || []).map(p =>
                      p._id === productId ? { ...p, quantity } : p
                    );
                    setSelectedOrder({...selectedOrder, selectedProducts: updatedProducts});
                  }}
                  onProductRemove={(productId) => {
                    const updatedProducts = (selectedOrder.selectedProducts || []).filter(p => p._id !== productId);
                    setSelectedOrder({...selectedOrder, selectedProducts: updatedProducts});
                  }}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={() => {
                    if (!selectedOrder.customerId || !selectedOrder.salesPersonId || !selectedOrder.selectedProducts?.length) {
                      toast({ 
                        title: "Validation Error", 
                        description: "Please select a customer, sales person and products", 
                        variant: "destructive" 
                      });
                      return;
                    }
                    
                    console.log('💾 Save Edit clicked, order data:', selectedOrder);
                    updateOrderMutation.mutate({
                      orderId: selectedOrder._id,
                      orderData: {
                        customerId: selectedOrder.customerId,
                        salesPersonId: selectedOrder.salesPersonId,
                        orderDate: selectedOrder.orderDate,
                        products: (selectedOrder.selectedProducts || []).map(p => ({
                          product: p._id,
                          quantity: parseInt(p.quantity),
                          unitPrice: parseFloat(p.price || p.unitPrice || 0)
                        }))
                      }
                    });
                  }}
                  disabled={updateOrderMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {updateOrderMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Order
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UnitHeadOrdersManagement;