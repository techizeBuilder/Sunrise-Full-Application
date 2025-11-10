import React, { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '../../api/orderService';
import { customerApi } from '../../api/customerService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import ProductSelector from '@/components/products/ProductSelector';
import EditOrderForm from '@/components/EditOrderForm';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Plus, 
  RefreshCw, 
  Eye, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  FileCheck,
  Check,
  ChevronsUpDown,
  ChevronDown,
  ChevronRight,
  RotateCcw
} from 'lucide-react';

const MyOrders = () => {
  const { hasFeatureAccess, canPerformAction } = usePermissions();
  
  // Check if user has access to orders feature (check sales.orders, sales.myIndent, and orders.indent)
  const hasOrdersAccess = hasFeatureAccess('sales', 'orders', 'view') || hasFeatureAccess('sales', 'myIndent', 'view') || hasFeatureAccess('orders', 'indent', 'view');
  
  if (!hasOrdersAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">You don't have permission to view My Orders.</p>
        </div>
      </div>
    );
  }
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [viewOrderDetails, setViewOrderDetails] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [editCustomerOpen, setEditCustomerOpen] = useState(false);
  const [productSearchOpen, setProductSearchOpen] = useState(false);


  // Form data state
  const [formData, setFormData] = useState({
    customerName: '',
    orderDate: new Date().toISOString().split('T')[0],
    remarks: '',
    selectedProducts: [] // Will store selected products from ProductSelector
  });

  const [formErrors, setFormErrors] = useState({});

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Status update mutation
  const statusUpdateMutation = useMutation({
    mutationFn: ({ id, status }) => orderApi.updateStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/orders'] });
      toast({
        title: "Status Updated",
        description: data.message || "Order status updated successfully",
        variant: "success"
      });
    },
    onError: (error) => {
      console.error('Status update error:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update order status",
        variant: "destructive"
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => orderApi.delete(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "Order Deleted",
        description: data.message || "Order deleted successfully",
        variant: "success"
      });
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete order",
        variant: "destructive"
      });
    }
  });

  // Handle status update
  const handleStatusUpdate = (orderId, newStatus) => {
    statusUpdateMutation.mutate({ id: orderId, status: newStatus });
  };

  // Product selection handlers
  const handleProductSelect = (product) => {
    setFormData(prev => ({
      ...prev,
      selectedProducts: [...prev.selectedProducts, product]
    }));
    // Clear product error when product is added
    setFormErrors(prev => ({ ...prev, selectedProducts: '' }));
  };

  const handleProductRemove = (productId) => {
    setFormData(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.filter(p => p._id !== productId)
    }));
  };

  const handleQuantityChange = (productId, quantity) => {
    setFormData(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.map(product => 
        product._id === productId 
          ? { ...product, quantity, totalPrice: product.price * quantity }
          : product
      )
    }));
    // Clear product error when quantity is updated
    if (quantity > 0) {
      setFormErrors(prev => ({ ...prev, selectedProducts: '' }));
    }
  };



  // Fetch orders from API with pagination
  const { data: ordersResponse, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['/api/orders', currentPage, itemsPerPage, searchTerm, statusFilter],
    queryFn: () => orderApi.getAll({
      page: currentPage,
      limit: itemsPerPage,
      search: searchTerm,
      status: statusFilter === 'all' ? '' : statusFilter,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
  });

  const orders = ordersResponse?.orders || [];
  const pagination = ordersResponse?.pagination || {};

  // Fetch customers from API
  const { data: customersResponse, isLoading: customersLoading } = useQuery({
    queryKey: ['/api/customers'],
    queryFn: () => customerApi.getAll()
  });

  const customersList = customersResponse?.customers || [];



  // Handle search and filter changes to reset pagination
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const totalPages = pagination.totalPages || 0;
  const totalItems = pagination.totalOrders || 0;

  const resetForm = () => {
    setFormData({
      customerName: '',
      orderDate: new Date().toISOString().split('T')[0],
      remarks: '',
      selectedProducts: []
    });
    setFormErrors({});
  };

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: orderApi.create,
    onSuccess: (data) => {
      console.log('Order creation response:', data);
      if (data.status || data.success) {
        toast({
          title: "Success",
          description: data.message || "Order created successfully",
        });
        // Reset form first, then close modal
        resetForm();
        setIsCreateModalOpen(false);
        // Refresh orders list
        queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
        refetchOrders();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create order",
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      console.error('Order creation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create order",
        variant: "destructive"
      });
    }
  });

  const validateForm = () => {
    const errors = {};
    
    if (!formData.customerName.trim()) {
      errors.customerName = "Please select a customer";
    }
    
    if (!formData.orderDate) {
      errors.orderDate = "Please select an order date";
    }
    
    if (formData.selectedProducts.length === 0) {
      errors.selectedProducts = "Please select at least one product";
    } else {
      // Check if all products have valid quantities
      const invalidProducts = formData.selectedProducts.filter(p => !p.quantity || p.quantity <= 0);
      if (invalidProducts.length > 0) {
        errors.selectedProducts = "All products must have a valid quantity";
      }
    }
    
    // Find customer ID by name
    if (formData.customerName.trim()) {
      const customer = customersList.find(c => c.name.toLowerCase() === formData.customerName.toLowerCase());
      if (!customer) {
        errors.customerName = "Please select a valid customer from the list";
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the form errors and try again",
        variant: "destructive"
      });
      return;
    }

    // Find customer ID by name
    const customer = customersList.find(c => c.name.toLowerCase() === formData.customerName.toLowerCase());

    const orderData = {
      customerId: customer._id,
      orderDate: formData.orderDate,
      notes: formData.remarks,
      products: formData.selectedProducts.map(p => ({
        productId: p._id,
        quantity: p.quantity
      }))
    };

    createOrderMutation.mutate(orderData);
  };

  // Add new product row
  const addProductRow = () => {
    setFormData({
      ...formData,
      products: [...formData.products, { productId: '', productName: '', quantity: '' }]
    });
  };

  // Remove product row
  const removeProductRow = (index) => {
    if (formData.products.length > 1) {
      const updatedProducts = formData.products.filter((_, i) => i !== index);
      setFormData({ ...formData, products: updatedProducts });
    }
  };

  // Update product in specific row
  const updateProductRow = (index, field, value) => {
    const updatedProducts = formData.products.map((product, i) => {
      if (i === index) {
        if (field === 'productId') {
          return {
            ...product,
            productId: value,
            productName: 'Product Name' // This will be handled by ProductSelector
          };
        } else {
          return { ...product, [field]: value };
        }
      }
      return product;
    });
    setFormData({ ...formData, products: updatedProducts });
  };

  const handleEdit = (order) => {
    setSelectedOrder(order);
    setIsEditModalOpen(true);
  };

  const handleUpdateOld = () => {
    if (!editFormData.customerName || !editFormData.orderDate) {
      return;
    }
    
    const validProducts = editFormData.products.filter(p => p.productId && p.quantity);
    if (validProducts.length === 0) {
      return;
    }
    
    const totalQuantity = validProducts.reduce((sum, product) => sum + (parseInt(product.quantity) || 0), 0);
    const updatedOrder = {
      ...selectedOrder,
      customerName: editFormData.customerName,
      orderDate: editFormData.orderDate,
      remarks: editFormData.remarks,
      products: validProducts,
      totalQuantity: totalQuantity,
      // Update for display purposes - showing first product
      selectedProduct: validProducts[0] ? productsList.find(p => p.id === validProducts[0].productId)?.name : '',
      productQuantity: totalQuantity
    };
    
    const updatedOrders = orders.map(order => 
      order.id === selectedOrder.id ? updatedOrder : order
    );
    setOrders(updatedOrders);
    setIsEditModalOpen(false);
    setEditFormData({
      customerName: '',
      orderDate: '',
      remarks: '',
      products: [{ productId: '', quantity: '' }]
    });
    setEditProductDropdownStates([false]);
    setSelectedOrder(null);
  };

  const handleView = async (order) => {
    try {
      // Fetch detailed order data
      const detailsResponse = await orderApi.getById(order._id);
      if (detailsResponse.success) {
        setViewOrderDetails(detailsResponse.order);
        setIsViewModalOpen(true);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch order details",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch order details",
        variant: "destructive"
      });
    }
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this order?')) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'Draft': return 'secondary';
      case 'Pending': return 'default';
      case 'Approved': return 'success';
      case 'Processing': return 'default';
      case 'Completed': return 'success';
      case 'Rejected': return 'destructive';
      case 'Cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Draft': return <FileCheck className="h-3 w-3" />;
      case 'Pending': return <Clock className="h-3 w-3" />;
      case 'Approved': return <CheckCircle className="h-3 w-3" />;
      case 'Processing': return <Clock className="h-3 w-3" />;
      case 'Completed': return <CheckCircle className="h-3 w-3" />;
      case 'Rejected': return <XCircle className="h-3 w-3" />;
      case 'Cancelled': return <XCircle className="h-3 w-3" />;
      default: return <FileCheck className="h-3 w-3" />;
    }
  };

  // Simple create form component using ProductSelector
  const CreateOrderForm = React.memo(() => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="customerName">Customer Name *</Label>
            <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={customerSearchOpen}
                  className={`w-full justify-between ${formErrors.customerName ? 'border-red-500' : ''}`}
                >
                  {formData.customerName || "Select customer..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search customer..." />
                  <CommandEmpty>No customer found.</CommandEmpty>
                  <CommandGroup>
                    {customersLoading ? (
                      <CommandItem disabled>Loading customers...</CommandItem>
                    ) : customersList.map((customer) => (
                      <CommandItem
                        key={customer._id}
                        value={customer.name}
                        onSelect={(currentValue) => {
                          const selectedCustomer = customersList.find(c => c.name.toLowerCase() === currentValue.toLowerCase());
                          if (selectedCustomer) {
                            setFormData({ 
                              ...formData, 
                              customerName: selectedCustomer.name
                            });
                            // Clear error when customer is selected
                            setFormErrors({ ...formErrors, customerName: '' });
                          }
                          setCustomerSearchOpen(false);
                        }}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            formData.customerName?.toLowerCase() === customer.name.toLowerCase() ? "opacity-100" : "opacity-0"
                          }`}
                        />
                        {customer.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            {formErrors.customerName && (
              <p className="text-sm text-red-500 mt-1">{formErrors.customerName}</p>
            )}
          </div>
          <div>
            <Label htmlFor="orderDate">Order Date *</Label>
            <Input
              id="orderDate"
              type="date"
              value={formData.orderDate}
              onChange={(e) => {
                setFormData({ ...formData, orderDate: e.target.value });
                // Clear error when date is selected
                setFormErrors({ ...formErrors, orderDate: '' });
              }}
              className={formErrors.orderDate ? 'border-red-500' : ''}
            />
            {formErrors.orderDate && (
              <p className="text-sm text-red-500 mt-1">{formErrors.orderDate}</p>
            )}
          </div>
        </div>

        {/* Product Selection */}
        <div>
          <ProductSelector
            selectedProducts={formData.selectedProducts}
            onProductSelect={handleProductSelect}
            onProductRemove={handleProductRemove}
            onQuantityChange={handleQuantityChange}
          />
          {formErrors.selectedProducts && (
            <p className="text-sm text-red-500 mt-1">{formErrors.selectedProducts}</p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
          <Button 
            variant="outline" 
            onClick={() => {
              setIsCreateModalOpen(false);
              resetForm();
            }}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreate}
            disabled={createOrderMutation.isPending || !formData.customerName || !formData.orderDate || formData.selectedProducts.length === 0}
            className="w-full sm:w-auto"
          >
            {createOrderMutation.isPending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Order'
            )}
          </Button>
        </div>
      </div>
    );
  });



  // Update order mutation
  const updateOrderMutation = useMutation({
    mutationFn: ({ orderId, orderData }) => {
      console.log('Updating order:', orderId, 'with data:', orderData);
      return orderApi.update(orderId, orderData);
    },
    onSuccess: (response) => {
      console.log('Update successful:', response);
      toast({
        title: "Success",
        description: "Order updated successfully",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      setIsEditModalOpen(false);
      setSelectedOrder(null);
    },
    onError: (error) => {
      console.error('Update order error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update order",
        variant: "destructive"
      });
    }
  });

  // Handle update function
  const handleUpdate = (updatedData) => {
    if (!selectedOrder?._id) {
      toast({
        title: "Error",
        description: "No order selected for update",
        variant: "destructive"
      });
      return;
    }

    // Find customer ID by name
    const customer = customersList.find(c => c.name.toLowerCase() === updatedData.customerName.toLowerCase());
    if (!customer) {
      toast({
        title: "Validation Error",
        description: "Please select a valid customer",
        variant: "destructive"
      });
      return;
    }

    const orderData = {
      customerId: customer._id,
      orderDate: updatedData.orderDate,
      notes: updatedData.remarks || '',
      products: updatedData.selectedProducts.map(p => ({
        productId: p._id,
        quantity: p.quantity
      }))
    };

    updateOrderMutation.mutate({ 
      orderId: selectedOrder._id, 
      orderData 
    });
  };

  // EditOrderFormComponent - Internal component for editing orders
  const EditOrderFormComponent = ({ initialData, onSubmit, onCancel }) => {
    const [localFormData, setLocalFormData] = useState({
      customerName: '',
      orderDate: '',
      selectedProducts: []
    });
    const [localCustomerOpen, setLocalCustomerOpen] = useState(false);

    // Initialize form data from initialData
    useEffect(() => {
      if (initialData) {
        // Initialize edit form with order data
        
        // Format the order date properly
        let formattedDate = '';
        if (initialData.orderDate) {
          const date = new Date(initialData.orderDate);
          formattedDate = date.toISOString().split('T')[0];
        }

        // Convert products to selectedProducts format for ProductSelector
        const convertedProducts = (initialData.products || []).filter(orderProduct => {
          // Only include products that have valid product references
          return orderProduct.product && orderProduct.product._id;
        }).map(orderProduct => {
          // Convert order product to selector format
          
          return {
            _id: orderProduct.product._id,
            name: orderProduct.product.name || 'Unknown Product',
            price: orderProduct.product.salePrice || orderProduct.product.price || orderProduct.price || 0,
            quantity: orderProduct.quantity || 1,
            totalPrice: (orderProduct.product.salePrice || orderProduct.product.price || orderProduct.price || 0) * (orderProduct.quantity || 1),
            brand: orderProduct.product.brand || 'Unknown Brand',
            image: orderProduct.product.image || 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=150&h=150&fit=crop'
          };
        });

        // Products converted successfully
        
        // Products loaded successfully - no warning needed

        setLocalFormData({
          customerName: initialData.customer?.name || initialData.customerName || '',
          orderDate: formattedDate,
          selectedProducts: convertedProducts
        });
      }
    }, [initialData]);

    // Product selection handlers (same as create form)
    const handleEditProductSelect = (product) => {
      setLocalFormData(prev => ({
        ...prev,
        selectedProducts: [...prev.selectedProducts, product]
      }));
    };

    const handleEditProductRemove = (productId) => {
      setLocalFormData(prev => ({
        ...prev,
        selectedProducts: prev.selectedProducts.filter(p => p._id !== productId)
      }));
    };

    const handleEditQuantityChange = (productId, quantity) => {
      setLocalFormData(prev => ({
        ...prev,
        selectedProducts: prev.selectedProducts.map(product => 
          product._id === productId 
            ? { ...product, quantity, totalPrice: product.price * quantity }
            : product
        )
      }));
    };

    const handleEditSubmit = () => {
      if (!localFormData.customerName || !localFormData.orderDate || localFormData.selectedProducts.length === 0) {
        toast({
          title: "Validation Error",
          description: "Please fill all required fields and select at least one product",
          variant: "destructive"
        });
        return;
      }
      
      onUpdate({
        ...localFormData,
        remarks: '' // Add remarks field if needed
      });
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="editCustomerName">Customer Name *</Label>
            <Popover open={localCustomerOpen} onOpenChange={setLocalCustomerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={localCustomerOpen}
                  className="w-full justify-between"
                >
                  {localFormData.customerName || "Select customer..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" side="bottom" align="start">
                <Command>
                  <CommandInput placeholder="Search customers..." />
                  <CommandEmpty>No customer found.</CommandEmpty>
                  <CommandGroup>
                    {customersLoading ? (
                      <CommandItem disabled>Loading customers...</CommandItem>
                    ) : customersList.map((customer) => (
                      <CommandItem
                        key={customer._id}
                        value={customer.name}
                        onSelect={(currentValue) => {
                          setLocalFormData({
                            ...localFormData,
                            customerName: currentValue === localFormData.customerName?.toLowerCase() ? "" : currentValue
                          });
                          setLocalCustomerOpen(false);
                        }}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            localFormData.customerName?.toLowerCase() === customer.name.toLowerCase() ? "opacity-100" : "opacity-0"
                          }`}
                        />
                        {customer.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label htmlFor="editOrderDate">Order Date *</Label>
            <Input
              id="editOrderDate"
              type="date"
              value={localFormData.orderDate}
              onChange={(e) => setLocalFormData({ ...localFormData, orderDate: e.target.value })}
            />
          </div>
        </div>

        {/* Product Selection using ProductSelector component */}
        <ProductSelector
          selectedProducts={localFormData.selectedProducts}
          onProductSelect={handleEditProductSelect}
          onProductRemove={handleEditProductRemove}
          onQuantityChange={handleEditQuantityChange}
        />

        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleEditSubmit}
            disabled={!localFormData.customerName || !localFormData.orderDate || localFormData.selectedProducts.length === 0}
            className="w-full sm:w-auto"
          >
            Update Order
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="px-2 py-2 sm:p-4 lg:p-6 space-y-3 sm:space-y-6">
      {/* Header */}
      <div className="bg-blue-600 text-white px-3 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-md mx-0 sm:mx-0">
        {/* Mobile Layout */}
        <div className="flex sm:hidden items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <h1 className="text-lg font-semibold">My Orders</h1>
          </div>
          <div className="flex items-center space-x-2">
            {(canPerformAction('sales', 'orders', 'add') || canPerformAction('sales', 'myIndent', 'add') || canPerformAction('orders', 'indent', 'add')) && (
              <Button 
                variant="secondary" 
                className="bg-white text-blue-600 hover:bg-blue-50 text-sm px-3 py-2"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
            <Button 
              variant="outline" 
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-sm px-3 py-2"
              onClick={() => refetchOrders()}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Desktop Layout */}
        <div className="hidden sm:flex sm:items-center sm:justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6" />
            <h1 className="text-xl font-semibold">My Orders</h1>
            <span className="hidden lg:inline text-blue-100 text-sm">Manage and track your sales orders</span>
          </div>
          <div className="flex items-center space-x-3">
            {(canPerformAction('sales', 'orders', 'add') || canPerformAction('sales', 'myIndent', 'add') || canPerformAction('orders', 'indent', 'add')) && (
              <Button 
                variant="secondary" 
                className="bg-white text-blue-600 hover:bg-blue-50 text-sm px-3 py-2"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                <span>Create Order</span>
              </Button>
            )}
            <Button 
              variant="outline" 
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-sm px-3 py-2"
              onClick={() => refetchOrders()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}


      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-lg p-3 sm:p-6 mx-0 sm:mx-0">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Processing">Processing</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-lg p-3 sm:p-6 mx-0 sm:mx-0">
        <h3 className="text-lg font-medium mb-3 sm:mb-4 px-0 sm:px-0">Order List</h3>
        
        {/* Mobile Card View */}
        <div className="block sm:hidden">
          {ordersLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-16 rounded-lg"></div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No orders found</p>
            </div>
          ) : (
            <>
              {/* Mobile Table Header */}
              <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-t-lg border-b border-gray-200 dark:border-gray-600 text-xs font-medium text-gray-600 dark:text-gray-400">
                <span className="flex-1">CUSTOMER</span>
                <span className="w-20 text-center">STATUS</span>
                <span className="w-24 text-center">ACTIONS</span>
              </div>
              
              {/* Mobile Cards */}
              <div className="space-y-0 border border-gray-200 dark:border-gray-700 border-t-0 rounded-b-lg overflow-hidden">
                {orders.map((order, index) => (
              <div key={order._id} className={`p-2 ${index !== orders.length - 1 ? 'border-b border-gray-200 dark:border-gray-600' : ''} bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700`}>
                <div className="flex justify-between items-center">
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                      {order.customer?.name || 'Unknown Customer'}
                    </div>
                    <div className="text-xs text-gray-500 font-mono mb-1">
                      {order.orderCode || order._id}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(order.orderDate).toLocaleDateString()} • Qty: {order.products?.reduce((sum, p) => sum + (p.quantity || 0), 0) || 0}
                    </div>
                  </div>
                  <div className="w-20 flex justify-center">
                    <Badge variant={getStatusVariant(order.status)} className="text-xs">
                      {order.status}
                    </Badge>
                  </div>
                  <div className="w-24 flex justify-center items-center gap-0.5">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      onClick={() => handleView(order)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    {(canPerformAction('sales', 'orders', 'edit') || canPerformAction('sales', 'myIndent', 'edit') || canPerformAction('orders', 'indent', 'edit')) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0"
                        onClick={() => handleEdit(order)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}

                    {(canPerformAction('sales', 'orders', 'delete') || canPerformAction('sales', 'myIndent', 'delete') || canPerformAction('orders', 'indent', 'delete')) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(order._id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>


            </>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          {ordersLoading ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center space-x-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No orders found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Order ID</TableHead>
                  <TableHead className="min-w-[150px]">Customer</TableHead>
                  <TableHead className="min-w-[120px]">Date</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="min-w-[80px]">Qty</TableHead>
                  {(canPerformAction('sales', 'orders', 'edit') || canPerformAction('sales', 'myIndent', 'edit') || canPerformAction('orders', 'indent', 'edit') || canPerformAction('sales', 'orders', 'delete') || canPerformAction('sales', 'myIndent', 'delete') || canPerformAction('orders', 'indent', 'delete')) && (
                    <TableHead className="text-right min-w-[120px]">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                <TableRow key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <TableCell className="font-medium text-sm font-mono">{order.orderCode || order._id}</TableCell>
                  <TableCell className="text-sm">
                    <div className="font-medium">{order.customer?.name || 'Unknown Customer'}</div>
                  </TableCell>
                  <TableCell className="text-sm">{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(order.status)} className="text-xs">
                      {getStatusIcon(order.status)}
                      <span className="ml-1">{order.status}</span>
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{order.products?.reduce((sum, p) => sum + (p.quantity || 0), 0) || 0}</TableCell>
                  {(canPerformAction('sales', 'orders', 'edit') || canPerformAction('sales', 'myIndent', 'edit') || canPerformAction('orders', 'indent', 'edit') || canPerformAction('sales', 'orders', 'delete') || canPerformAction('sales', 'myIndent', 'delete') || canPerformAction('orders', 'indent', 'delete')) && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleView(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(canPerformAction('sales', 'orders', 'edit') || canPerformAction('sales', 'myIndent', 'edit') || canPerformAction('orders', 'indent', 'edit')) && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleEdit(order)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {(canPerformAction('sales', 'orders', 'delete') || canPerformAction('sales', 'myIndent', 'delete') || canPerformAction('orders', 'indent', 'delete')) && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(order._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 sm:mb-0">
              Showing page {currentPage} of {totalPages} ({totalItems} total orders)
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm"
              >
                Previous
              </Button>
              
              {/* Page numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Show first page, last page, current page, and pages around current
                    return page === 1 || 
                           page === totalPages || 
                           Math.abs(page - currentPage) <= 1;
                  })
                  .map((page, index, array) => {
                    // Add ellipsis if there's a gap
                    const prevPage = array[index - 1];
                    const showEllipsis = prevPage && page - prevPage > 1;
                    
                    return (
                      <div key={page}>
                        {showEllipsis && (
                          <span className="px-2 py-1 text-sm text-gray-500">...</span>
                        )}
                        <Button
                          variant={page === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className="px-3 py-1 text-sm min-w-[40px]"
                        >
                          {page}
                        </Button>
                      </div>
                    );
                  })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsEditModalOpen(false);
          setSelectedOrder(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Edit Order</DialogTitle>
            <DialogDescription>
              Update the order details below.
            </DialogDescription>
          </DialogHeader>
          <EditOrderForm 
            initialData={selectedOrder}
            onUpdate={handleUpdate}
            onCancel={() => {
              setIsEditModalOpen(false);
              setSelectedOrder(null);
            }}
            customersList={customersList}
          />
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsViewModalOpen(false);
          setViewOrderDetails(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">View Order Details</DialogTitle>
            <DialogDescription>
              Complete details of the selected order.
            </DialogDescription>
          </DialogHeader>
          {viewOrderDetails && (
            <div className="space-y-6">
              {/* Order Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Customer Name</Label>
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{viewOrderDetails.customer?.name || 'Unknown Customer'}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Order Date</Label>
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{new Date(viewOrderDetails.orderDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Product Details - Organized by Categories like Add Order Form */}
              {viewOrderDetails.products && viewOrderDetails.products.length > 0 && (
                <div>
                  <div className="mb-4">
                    <Label className="text-base font-semibold text-gray-700 dark:text-gray-300">Selected Products by Category</Label>
                    <p className="text-sm text-gray-500 mt-1">Products ordered from our bakery categories</p>
                  </div>
                  
                  {/* Group products by category */}
                  {(() => {
                    const groupedOrderProducts = viewOrderDetails.products.reduce((acc, orderProduct) => {
                      const product = orderProduct.product;
                      if (product) {
                        const category = product.category || 'Other';
                        if (!acc[category]) {
                          acc[category] = [];
                        }
                        acc[category].push({
                          ...product,
                          quantity: orderProduct.quantity
                        });
                      } else {
                        // Handle products with null references
                        const category = 'Unavailable Products';
                        if (!acc[category]) {
                          acc[category] = [];
                        }
                        acc[category].push({
                          _id: orderProduct._id,
                          name: 'Product No Longer Available',
                          salePrice: orderProduct.price || 0,
                          price: orderProduct.price || 0,
                          brand: 'Unknown',
                          image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=150&h=150&fit=crop',
                          quantity: orderProduct.quantity
                        });
                      }
                      return acc;
                    }, {});

                    const toggleCategory = (category) => {
                      setExpandedCategories(prev => {
                        const isCurrentlyExpanded = prev[category];
                        // Accordion behavior: close all others, open clicked one
                        const newState = {};
                        if (!isCurrentlyExpanded) {
                          newState[category] = true;
                        }
                        return newState;
                      });
                    };

                    return Object.keys(groupedOrderProducts).map((category) => {
                      const isExpanded = expandedCategories[category] ?? true; // Default expanded
                      return (
                        <div key={category} className="border rounded-lg mb-4 overflow-hidden">
                          {/* Category Header */}
                          <button 
                            onClick={() => toggleCategory(category)}
                            className={`w-full flex items-center justify-between p-3 transition-colors ${
                              category === 'Unavailable Products' 
                                ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border-red-200' 
                                : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                              )}
                              <span className={`font-medium text-sm ${
                                category === 'Unavailable Products' 
                                  ? 'text-red-900 dark:text-red-100' 
                                  : 'text-gray-900 dark:text-gray-100'
                              }`}>{category}</span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {groupedOrderProducts[category].length} items
                            </Badge>
                          </button>
                          
                          {/* Category Products - Collapsible */}
                          {isExpanded && (
                            <div className="border-t">
                              {/* Header Row */}
                              <div className="hidden sm:flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-400">
                                <span>ITEM NAME</span>
                                <span className="w-16 text-center">QUANTITY</span>
                              </div>
                              
                              {/* Product Rows */}
                              <div className="divide-y">
                                {groupedOrderProducts[category].map((product) => (
                                  <div key={product._id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800">
                                    {/* Product Image */}
                                    <div className="flex-shrink-0">
                                      <img 
                                        src={product.image} 
                                        alt={product.name}
                                        className="w-12 h-12 sm:w-10 sm:h-10 rounded-lg object-cover"
                                        onError={(e) => {
                                          e.target.src = 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=150&h=150&fit=crop';
                                        }}
                                      />
                                    </div>
                                    
                                    {/* Product Info */}
                                    <div className="flex-1 min-w-0 w-full sm:w-auto">
                                      <h4 className={`text-sm font-medium mb-1 ${
                                        category === 'Unavailable Products' 
                                          ? 'text-red-900 dark:text-red-100' 
                                          : 'text-gray-900 dark:text-gray-100'
                                      }`}>{product.name}</h4>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant="outline" className="text-xs">
                                          {product.brand}
                                        </Badge>
                                        <span className="text-xs text-gray-500">₹{product.salePrice || product.price || 0} each</span>
                                      </div>
                                    </div>
                                    
                                    {/* Quantity and Total - Mobile/Desktop responsive */}
                                    <div className="flex items-center justify-between w-full sm:w-auto sm:gap-4">
                                      {/* Quantity Display */}
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500 sm:hidden">Qty:</span>
                                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded px-2 py-1 border border-blue-200 dark:border-blue-800">
                                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{product.quantity}</span>
                                        </div>
                                      </div>
                                      
                                      {/* Total Price */}
                                      <div className="text-right">
                                        <div className="text-sm font-medium">₹{((product.salePrice || product.price || 0) * parseInt(product.quantity)).toLocaleString()}</div>
                                        <div className="text-xs text-gray-500">total</div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                  
                  {/* Order Summary */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Order Summary</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{viewOrderDetails.products.length} product types selected</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg text-blue-600 dark:text-blue-400">
                          {viewOrderDetails.products.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Total Units</div>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Total Order Value:</span>
                        <span className="font-bold text-green-600 dark:text-green-400">
                          ₹{viewOrderDetails.products.reduce((sum, p) => {
                            const price = p.product?.salePrice || p.product?.price || p.price || 0;
                            const quantity = parseInt(p.quantity) || 0;
                            return sum + (price * quantity);
                          }, 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Order ID</Label>
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                    <span className="font-mono text-sm text-gray-900 dark:text-gray-100">{viewOrderDetails.orderCode || viewOrderDetails._id}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                    <Badge variant={getStatusVariant(viewOrderDetails.status)} className="flex items-center gap-1 w-fit">
                      {getStatusIcon(viewOrderDetails.status)}
                      {viewOrderDetails.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Created Date</Label>
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                    <span className="text-sm text-gray-900 dark:text-gray-100">{new Date(viewOrderDetails.createdAt || viewOrderDetails.orderDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              {viewOrderDetails.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Remarks</Label>
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                    <p className="text-sm text-gray-900 dark:text-gray-100">{viewOrderDetails.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Order Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateModalOpen(false);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Create New Order</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new production order.
            </DialogDescription>
          </DialogHeader>
          <CreateOrderForm />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyOrders;