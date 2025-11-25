import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, ArrowRight, Package, User, Settings, Clock, TrendingUp, AlertTriangle, BarChart, Calendar, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SalesApproval = () => {
  const [orders, setOrders] = useState([]); // Product-grouped data for grid
  const [individualOrders, setIndividualOrders] = useState([]); // Individual orders for status counting
  const [products, setProducts] = useState([]);
  const [salesPersons, setSalesPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gridData, setGridData] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProductOrders, setSelectedProductOrders] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);
  
  // Production calculation states
  const [productionData, setProductionData] = useState({});
  // Structure: { productName: { packing: 0, physicalStock: 0, batchAdjusted: 0, qtyPerBatch: 0, toBeProducedDay: 0 } }
  const { toast } = useToast();

  // Initialize production data for a product
  const initializeProductionData = (productName) => {
    if (!productionData[productName]) {
      setProductionData(prev => ({
        ...prev,
        [productName]: {
          packing: 0,
          physicalStock: 0,
          batchAdjusted: 0,
          qtyPerBatch: 0, // Default value changed to 0
          toBeProducedDay: 0
        }
      }));
    }
  };

  // Get production data with fallback values
  const getProductionData = (productName) => {
    return productionData[productName] || {
      packing: 0,
      physicalStock: 0,
      batchAdjusted: 0,
      qtyPerBatch: 0,
      toBeProducedDay: 0
    };
  };

  // Update production data field
  const updateProductionField = (productName, field, value) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    setProductionData(prev => ({
      ...prev,
      [productName]: {
        ...prev[productName],
        [field]: isNaN(numValue) ? 0 : numValue
      }
    }));
  };

  // Calculate Production with final batches = Batch_Adjusted * Qty_per_Batch
  const getProductionWithFinalBatches = (productName) => {
    const data = getProductionData(productName);
    return Math.round((data.batchAdjusted * data.qtyPerBatch) * 100) / 100;
  };

  // Calculate Expiry/Shortage = Production_with_final_batches - To_be_produced_day
  const getExpiryShortage = (productName) => {
    const data = getProductionData(productName);
    const productionWithFinalBatches = getProductionWithFinalBatches(productName);
    return Math.round((productionWithFinalBatches - data.toBeProducedDay) * 100) / 100;
  };

  // Calculate Balance with final batches = Production_with_final_batches - Packing
  const getBalanceWithFinalBatches = (productName) => {
    const data = getProductionData(productName);
    const productionWithFinalBatches = getProductionWithFinalBatches(productName);
    return Math.round((productionWithFinalBatches - data.packing) * 100) / 100;
  };

  // Calculate To be produced/Batches = To_be_produced_day / Qty_per_Batch
  const getToBeProducedBatches = (productName) => {
    const data = getProductionData(productName);
    if (data.qtyPerBatch === 0) return 0;
    return Math.round((data.toBeProducedDay / data.qtyPerBatch) * 100) / 100; // Round to 2 decimals
  };

  // Filter orders by date range
  const filterOrdersByDate = (orders) => {
    if (!dateFrom && !dateTo) return orders;
    
    return orders.filter(order => {
      const orderDate = new Date(order.orderDate);
      const fromDate = dateFrom ? new Date(dateFrom) : null;
      const toDate = dateTo ? new Date(dateTo) : null;
      
      if (fromDate && orderDate < fromDate) return false;
      if (toDate && orderDate > toDate) return false;
      return true;
    });
  };

  // Update filtered orders when date range or orders change
  useEffect(() => {
    const filtered = filterOrdersByDate(individualOrders);
    setFilteredOrders(filtered);
  }, [individualOrders, dateFrom, dateTo]);

  // Initialize production data when products change
  useEffect(() => {
    products.forEach(product => {
      initializeProductionData(product);
    });
  }, [products]);

  // Get dynamic status counts
  const getStatusCounts = () => {
    return {
      pending: filteredOrders.filter(order => order.status === 'pending').length,
      approved: filteredOrders.filter(order => order.status === 'approved').length,
      in_production: filteredOrders.filter(order => order.status === 'in_production').length,
      rejected: filteredOrders.filter(order => order.status === 'rejected').length
    };
  };

  // Helper function to extract sales person name consistently
  const getSalesPersonName = (order, userMap = {}) => {
    console.log('getSalesPersonName called with order:', {
      orderId: order._id || order.orderCode,
      salesPerson: order.salesPerson,
      createdBy: order.createdBy
    });

    if (order.salesPerson) {
      if (typeof order.salesPerson === 'object' && order.salesPerson._id) {
        // Check for duplicate names in productSalesData to determine if we need username
        const duplicateNames = productSalesData?.data?.flatMap(p => p.salesPersons)
          .filter(sp => sp.fullName === order.salesPerson.fullName) || [];
        
        const name = duplicateNames.length > 1 
          ? `${order.salesPerson.fullName || order.salesPerson.username} (${order.salesPerson.username})`
          : order.salesPerson.fullName || order.salesPerson.username || 'Unknown';
        
        console.log('Extracted name from populated salesPerson:', name);
        return name;
      }
      // If it's an ID, look it up
      const name = userMap[order.salesPerson] || order.salesPerson || 'Unknown';
      console.log('Extracted name from salesPerson ID:', name);
      return name;
    }
    // Fallback to createdBy
    if (order.createdBy) {
      const name = userMap[order.createdBy] || order.createdBy || 'Unknown';
      console.log('Extracted name from createdBy:', name);
      return name;
    }
    console.log('No sales person found, returning Unknown');
    return 'Unknown';
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch comprehensive unit-manager data for grid display
      const ordersResponse = await fetch('/api/unit-manager/orders', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Fetch individual orders for status counting
      const individualOrdersResponse = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (ordersResponse.ok && individualOrdersResponse.ok) {
        const responseData = await ordersResponse.json();
        const individualOrdersData = await individualOrdersResponse.json();
        
        console.log('=== COMPREHENSIVE API RESPONSE ===');
        console.log('Response structure:', Object.keys(responseData));
        console.log('Data array length:', responseData.data?.length || 0);
        console.log('Metadata:', responseData.metadata);
        console.log('=== INDIVIDUAL ORDERS ===');
        console.log('Individual orders count:', individualOrdersData.orders?.length || 0);
        console.log('Sample order statuses:', individualOrdersData.orders?.slice(0, 5)?.map(o => o.status) || []);
        console.log('=== END API RESPONSE ===');
        
        // Set individual orders for status counting
        if (individualOrdersData.success && individualOrdersData.orders) {
          setIndividualOrders(individualOrdersData.orders);
        }
        
        if (responseData.success && responseData.data) {
          // Set the comprehensive data for detailed display
          setOrders(responseData.data);
          
          // Extract products and sales persons from the comprehensive response
          const products = responseData.data.map(item => item.productName);
          const allSalesPersons = new Map(); // Use Map to store unique salespeople with full info
          
          responseData.data.forEach(product => {
            product.salesPersons.forEach(sp => {
              // Create unique key using ID to avoid duplicates
              if (!allSalesPersons.has(sp._id)) {
                allSalesPersons.set(sp._id, {
                  id: sp._id,
                  fullName: sp.fullName,
                  username: sp.username
                });
              }
            });
          });
          
          // Convert to array and create display names
          const salesPersonsArray = Array.from(allSalesPersons.values());
          const salesPersonsWithDisplayNames = salesPersonsArray.map(sp => {
            // Check if there are multiple people with the same fullName
            const duplicateNames = salesPersonsArray.filter(p => p.fullName === sp.fullName);
            const displayName = duplicateNames.length > 1 
              ? `${sp.fullName || sp.username} (${sp.username})`
              : sp.fullName || sp.username || 'Unknown';
            
            return {
              ...sp,
              displayName
            };
          });
          
          setProducts(products);
          setSalesPersons(salesPersonsWithDisplayNames.map(sp => sp.displayName));
          
          console.log('Products found:', products);
          console.log('Sales persons found:', salesPersonsWithDisplayNames.map(sp => sp.displayName));
          
          // Create grid data structure for frontend display
          const grid = {};
          responseData.data.forEach(product => {
            grid[product.productName] = {};
            
            // Initialize all sales persons for this product using display names
            salesPersonsWithDisplayNames.forEach(salesPersonObj => {
              grid[product.productName][salesPersonObj.displayName] = [];
            });
            
            // Fill in actual data from the API response using display names
            product.salesPersons.forEach(sp => {
              // Find the display name for this salesperson
              const salesPersonObj = salesPersonsWithDisplayNames.find(spObj => spObj.id === sp._id);
              const displayName = salesPersonObj ? salesPersonObj.displayName : sp.fullName;
              
              if (grid[product.productName][displayName]) {
                grid[product.productName][displayName] = sp.orders || [];
              }
            });
          });
          
          // Store the product data separately for total calculations
          const productData = {};
          responseData.data.forEach(product => {
            productData[product.productName] = {
              totalQuantity: product.totalQuantity,
              totalOrders: product.totalOrders
            };
          });
          
          setGridData(grid);
          
          // Store product totals for easy access
          window.productTotals = productData;
          
          console.log('=== FINAL GRID STRUCTURE ===');
          Object.entries(grid).forEach(([productName, salesData]) => {
            const productInfo = productData[productName];
            console.log(`Product: ${productName} - Total: ${productInfo.totalQuantity} qty, ${productInfo.totalOrders} orders`);
            Object.entries(salesData).forEach(([salesPerson, orders]) => {
              const totalQuantity = orders.reduce((sum, order) => sum + (order.quantity || 0), 0);
              console.log(`  ${salesPerson}: ${orders.length} orders, ${totalQuantity} total quantity`);
            });
          });
          console.log('=== END GRID STRUCTURE ===');
        }
      } else {
        throw new Error('Failed to fetch data');
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBulkStatusUpdate = async () => {
    if (!selectedProductOrders.length || !selectedStatus) return;
    
    try {
      setUpdating(true);
      
      // Update all orders for the selected product
      const updatePromises = selectedProductOrders.map(order => 
        fetch(`/api/unit-manager/orders/${order._id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ 
            status: selectedStatus,
            notes: `Bulk status update for ${selectedProduct} via Sales Approval dashboard`
          })
        })
      );

      const responses = await Promise.all(updatePromises);
      const results = await Promise.all(responses.map(res => res.json()));
      
      // Check if all updates were successful
      const allSuccessful = responses.every(res => res.ok);
      
      if (allSuccessful) {
        toast({
          title: 'Success',
          description: `Updated ${selectedProductOrders.length} orders for ${selectedProduct} to ${selectedStatus.replace('_', ' ')}`
        });
        
        setIsModalOpen(false);
        setSelectedOrder(null);
        setSelectedProduct(null);
        setSelectedProductOrders([]);
        setSelectedStatus('');
        fetchData(); // Refresh data
      } else {
        const failedCount = results.filter(result => !result.success).length;
        toast({
          title: 'Partial Success',
          description: `Updated ${selectedProductOrders.length - failedCount} orders, ${failedCount} failed`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  const openProductStatusModal = (product, productOrders) => {
    setSelectedProduct(product);
    setSelectedProductOrders(productOrders);
    setSelectedStatus(productOrders[0]?.status || 'pending');
    setIsModalOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'Disapproved': return 'bg-red-100 text-red-800 border-red-200';
      case 'In_Production': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-600">Loading sales approval grid...</div>
      </div>
    );
  }

  return (
    <div className="p-2 lg:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-3 lg:mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Sales Approval Dashboard</h1>
        <p className="text-sm lg:text-base text-gray-600">Manage product orders by sales person</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4 mb-4 lg:mb-6">
        <Card>
          <CardContent className="p-3 lg:p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg lg:text-2xl font-bold text-yellow-600">
                  {getStatusCounts().pending}
                </div>
                <div className="text-xs lg:text-sm text-gray-600">Pending Approval</div>
              </div>
              <div className="p-2 lg:p-3 bg-yellow-100 rounded-full">
                <Clock className="h-4 w-4 lg:h-6 lg:w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 lg:p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg lg:text-2xl font-bold text-green-600">
                  {getStatusCounts().approved}
                </div>
                <div className="text-xs lg:text-sm text-gray-600">Approved</div>
              </div>
              <div className="p-2 lg:p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-4 w-4 lg:h-6 lg:w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 lg:p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg lg:text-2xl font-bold text-blue-600">
                  {getStatusCounts().in_production}
                </div>
                <div className="text-xs lg:text-sm text-gray-600">In Production</div>
              </div>
              <div className="p-2 lg:p-3 bg-blue-100 rounded-full">
                <TrendingUp className="h-4 w-4 lg:h-6 lg:w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 lg:p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg lg:text-2xl font-bold text-red-600">
                  {getStatusCounts().rejected}
                </div>
                <div className="text-xs lg:text-sm text-gray-600">Rejected</div>
              </div>
              <div className="p-2 lg:p-3 bg-red-100 rounded-full">
                <XCircle className="h-4 w-4 lg:h-6 lg:w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid Container */}
      <Card className="shadow-sm border-0">
        <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Product Sales Management
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Responsive Table - Same UI for Mobile and Desktop */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              {/* Header Row with Sales Persons */}
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="bg-gray-50 p-1 lg:p-2 text-left font-semibold text-gray-900 border-r min-w-[100px] lg:min-w-[160px]">
                    <div className="flex items-center gap-1 lg:gap-2">
                      <Package className="h-3 w-3 lg:h-4 lg:w-4" />
                      <span className="text-xs lg:text-sm">Products</span>
                    </div>
                  </th>
                  {/* Packing Column */}
                  <th className="bg-gray-50 p-1 lg:p-2 text-center font-semibold text-gray-900 border-r min-w-[70px] lg:min-w-[90px]">
                    <div className="flex flex-col items-center gap-1">
                      <Package className="h-3 w-3 lg:h-4 lg:w-4 text-blue-600" />
                      <div className="text-xs font-semibold text-gray-900">Packing</div>
                    </div>
                  </th>
                  {/* Expiry/Shortage Column */}
                  <th className="bg-gray-50 p-1 lg:p-2 text-center font-semibold text-gray-900 border-r min-w-[80px] lg:min-w-[100px]">
                    <div className="flex flex-col items-center gap-1">
                      <Package className="h-3 w-3 lg:h-4 lg:w-4 text-red-600" />
                      <div className="text-xs font-semibold text-gray-900">Expiry/</div>
                      <div className="text-xs font-semibold text-gray-900">Shortage</div>
                    </div>
                  </th>
                  {/* Production with final batches Column */}
                  <th className="bg-gray-50 p-1 lg:p-2 text-center font-semibold text-gray-900 border-r min-w-[90px] lg:min-w-[110px]">
                    <div className="flex flex-col items-center gap-1">
                      <Package className="h-3 w-3 lg:h-4 lg:w-4 text-green-600" />
                      <div className="text-xs font-semibold text-gray-900">Production</div>
                      <div className="text-xs font-semibold text-gray-900">with final</div>
                      <div className="text-xs font-semibold text-gray-900">batches</div>
                    </div>
                  </th>
                  {/* Balance with final batches Column */}
                  <th className="bg-gray-50 p-1 lg:p-2 text-center font-semibold text-gray-900 border-r min-w-[90px] lg:min-w-[110px]">
                    <div className="flex flex-col items-center gap-1">
                      <Package className="h-3 w-3 lg:h-4 lg:w-4 text-purple-600" />
                      <div className="text-xs font-semibold text-gray-900">Balance</div>
                      <div className="text-xs font-semibold text-gray-900">with final</div>
                      <div className="text-xs font-semibold text-gray-900">batches</div>
                    </div>
                  </th>
                  {/* To be produced/Batches Column */}
                  <th className="bg-gray-50 p-1 lg:p-2 text-center font-semibold text-gray-900 border-r min-w-[90px] lg:min-w-[110px]">
                    <div className="flex flex-col items-center gap-1">
                      <Package className="h-3 w-3 lg:h-4 lg:w-4 text-orange-600" />
                      <div className="text-xs font-semibold text-gray-900">To be</div>
                      <div className="text-xs font-semibold text-gray-900">produced/</div>
                      <div className="text-xs font-semibold text-gray-900">Batches</div>
                    </div>
                  </th>
                  {/* Physical Stock Column */}
                  <th className="bg-gray-50 p-1 lg:p-2 text-center font-semibold text-gray-900 border-r min-w-[80px] lg:min-w-[100px]">
                    <div className="flex flex-col items-center gap-1">
                      <Package className="h-3 w-3 lg:h-4 lg:w-4 text-indigo-600" />
                      <div className="text-xs font-semibold text-gray-900">Physical</div>
                      <div className="text-xs font-semibold text-gray-900">Stock</div>
                    </div>
                  </th>
                  {/* Batch Adjusted Column */}
                  <th className="bg-gray-50 p-1 lg:p-2 text-center font-semibold text-gray-900 border-r min-w-[80px] lg:min-w-[100px]">
                    <div className="flex flex-col items-center gap-1">
                      <Package className="h-3 w-3 lg:h-4 lg:w-4 text-cyan-600" />
                      <div className="text-xs font-semibold text-gray-900">Batch</div>
                      <div className="text-xs font-semibold text-gray-900">Adjusted</div>
                    </div>
                  </th>
                  {/* To be Produced/Day Column */}
                  <th className="bg-gray-50 p-1 lg:p-2 text-center font-semibold text-gray-900 border-r min-w-[90px] lg:min-w-[110px]">
                    <div className="flex flex-col items-center gap-1">
                      <Package className="h-3 w-3 lg:h-4 lg:w-4 text-amber-600" />
                      <div className="text-xs font-semibold text-gray-900">To be Prod.</div>
                      <div className="text-xs font-semibold text-gray-900">/Day</div>
                    </div>
                  </th>
                
                  {salesPersons.slice(0, 8).map((salesPerson) => {
                    const personOrderCount = orders.filter(order => {
                      const orderSalesPersonName = getSalesPersonName(order);
                      return orderSalesPersonName === salesPerson;
                    }).length;

                    return (
                      <th key={salesPerson} className="p-1 lg:p-2 text-center font-semibold text-gray-900 border-r min-w-[120px] lg:min-w-[150px]">
                        <div className="flex flex-col items-center gap-1">
                          <User className="h-3 w-3 lg:h-4 lg:w-4 text-gray-600" />
                          <div className="text-xs font-semibold text-gray-900 text-center leading-tight" title={salesPerson}>
                            {salesPerson}
                          </div>
                        </div>
                      </th>
                    );
                  })}
                  {salesPersons.length > 8 && (
                    <th className="p-4 text-center font-semibold text-gray-900 border-r min-w-[130px]">
                      <div className="flex flex-col items-center gap-1">
                        <div className="text-sm font-semibold text-gray-600">
                          +{salesPersons.length - 8} more
                        </div>
                        <div className="text-xs text-gray-500 font-normal">
                          sales persons
                        </div>
                      </div>
                    </th>
                  )}
                  
                  {/* Total Indent Column */}
                  <th className="p-1 lg:p-2 text-center font-semibold text-gray-900 border-r min-w-[90px] lg:min-w-[120px] bg-gradient-to-r from-green-50 to-green-100">
                    <div className="flex flex-col items-center gap-1">
                      <Package className="h-3 w-3 lg:h-4 lg:w-4 text-green-600" />
                      <div className="text-xs font-bold text-gray-900">Total Indent</div>
                      <div className="text-xs text-gray-600 font-normal">
                        Salesman
                      </div>
                    </div>
                  </th>
                  
                  {/* Qty/Batch Column */}
                  <th className="bg-gray-50 p-1 lg:p-2 text-center font-semibold text-gray-900 border-r min-w-[80px] lg:min-w-[100px]">
                    <div className="flex flex-col items-center gap-1">
                      <Package className="h-3 w-3 lg:h-4 lg:w-4 text-teal-600" />
                      <div className="text-xs font-semibold text-gray-900">Qty/</div>
                      <div className="text-xs font-semibold text-gray-900">Batch</div>
                    </div>
                  </th>
                </tr>
                
              </thead>

              <tbody>
                {products.map((product) => {
                  // Get product data from our new API structure
                  const productData = orders.find(p => p.productName === product);
                  const totalQuantity = productData ? productData.totalQuantity : 0;
                  const totalOrderCount = productData ? productData.totalOrders : 0;
                  
                  // Get all orders for this product from all sales persons for modal functionality
                  const productOrders = productData ? 
                    productData.salesPersons.flatMap(sp => sp.orders || []) : [];

                  return (
                    <tr key={product} className="border-b hover:bg-gray-50/50 transition-colors">
                      {/* Product Name (Left Column) */}
                      <td className="bg-white p-1 lg:p-2 font-medium text-gray-900 border-r max-w-[100px] lg:max-w-[160px]">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-gray-900 leading-tight break-words">{product}</span>
                          <span className="text-xs text-gray-500">
                            Total Qty: {totalQuantity} ({totalOrderCount} orders)
                          </span>
                        </div>
                      </td>

                      {/* Packing Column */}
                      <td className="bg-white p-1 lg:p-2 border-r text-center align-middle">
                        <div className="text-center">
                          <Input
                            type="number"
                            value={getProductionData(product).packing}
                            onChange={(e) => updateProductionField(product, 'packing', e.target.value)}
                            className="w-16 h-8 text-center text-sm font-bold text-blue-600 border-none bg-transparent focus:ring-1 focus:ring-blue-300"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </td>

                      {/* Expiry/Shortage Column */}
                      <td className="bg-white p-1 lg:p-2 border-r text-center align-middle">
                        <div className="text-center">
                          <div className="text-base lg:text-lg font-bold text-red-600">
                            {getExpiryShortage(product)}
                          </div>
                        </div>
                      </td>

                      {/* Production with final batches Column */}
                      <td className="bg-white p-1 lg:p-2 border-r text-center align-middle">
                        <div className="text-center">
                          <div className="text-base lg:text-lg font-bold text-green-600">
                            {getProductionWithFinalBatches(product)}
                          </div>
                        </div>
                      </td>

                      {/* Balance with final batches Column */}
                      <td className="bg-white p-1 lg:p-2 border-r text-center align-middle">
                        <div className="text-center">
                          <div className="text-base lg:text-lg font-bold text-purple-600">
                            {getBalanceWithFinalBatches(product)}
                          </div>
                        </div>
                      </td>

                      {/* To be produced/Batches Column */}
                      <td className="bg-white p-1 lg:p-2 border-r text-center align-middle">
                        <div className="text-center">
                          <div className="text-base lg:text-lg font-bold text-orange-600">
                            {getToBeProducedBatches(product)}
                          </div>
                        </div>
                      </td>

                      {/* Physical Stock Column */}
                      <td className="bg-white p-1 lg:p-2 border-r text-center align-middle">
                        <div className="text-center">
                          <Input
                            type="number"
                            value={getProductionData(product).physicalStock}
                            onChange={(e) => updateProductionField(product, 'physicalStock', e.target.value)}
                            className="w-16 h-8 text-center text-sm font-bold text-indigo-600 border-none bg-transparent focus:ring-1 focus:ring-indigo-300"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </td>

                      {/* Batch Adjusted Column */}
                      <td className="bg-white p-1 lg:p-2 border-r text-center align-middle">
                        <div className="text-center">
                          <Input
                            type="number"
                            value={getProductionData(product).batchAdjusted}
                            onChange={(e) => updateProductionField(product, 'batchAdjusted', e.target.value)}
                            className="w-16 h-8 text-center text-sm font-bold text-cyan-600 border-none bg-transparent focus:ring-1 focus:ring-cyan-300"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </td>

                      {/* To be Produced/Day Column */}
                      <td className="bg-white p-1 lg:p-2 border-r text-center align-middle">
                        <div className="text-center">
                          <Input
                            type="number"
                            value={getProductionData(product).toBeProducedDay}
                            onChange={(e) => updateProductionField(product, 'toBeProducedDay', e.target.value)}
                            className="w-18 h-8 text-center text-sm font-bold text-amber-600 border-none bg-transparent focus:ring-1 focus:ring-amber-300"
                            min="0"
                            step="1"
                          />
                        </div>
                      </td>

                      {/* Grid Cells for each Sales Person - Show only COUNT */}
                      {salesPersons.slice(0, 8).map((salesPerson) => {
                        const cellOrders = gridData[product]?.[salesPerson] || [];
                        
                        return (
                          <td key={`${product}-${salesPerson}`} className="p-1 lg:p-2 border-r text-center align-middle">
                            {cellOrders.length === 0 ? (
                              <span className="text-gray-400 text-sm lg:text-base">0</span>
                            ) : (
                              <div className="text-center">
                                <div className="text-base lg:text-lg font-bold text-blue-600">
                                  {cellOrders.reduce((sum, order) => sum + (order.quantity || 0), 0)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {cellOrders.length} order{cellOrders.length !== 1 ? 's' : ''}
                                </div>
                              </div>
                            )}
                          </td>
                        );
                      })}

                      {/* Additional sales persons indicator */}
                      {salesPersons.length > 8 && (
                        <td className="p-4 border-r text-center align-middle">
                          <div className="text-center">
                            <div className="text-lg font-bold text-gray-600">
                              {salesPersons.slice(8).reduce((total, salesPerson) => {
                                return total + (gridData[product]?.[salesPerson]?.length || 0);
                              }, 0)}
                            </div>
                            <div className="text-xs text-gray-500">others</div>
                          </div>
                        </td>
                      )}

                      {/* Total Indent Column */}
                      <td className="p-3 border-r align-middle bg-gray-50">
                        <div className="flex flex-col items-center space-y-2">
                          {/* Main Total Display */}
                          <div className="text-center pb-2 w-full">
                            <div className="text-xl font-bold text-blue-600">
                              {totalQuantity}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Qty/Batch Column */}
                      <td className="bg-white p-1 lg:p-2 border-r text-center align-middle">
                        <div className="text-center">
                          <Input
                            type="number"
                            value={getProductionData(product).qtyPerBatch === 0 ? '' : getProductionData(product).qtyPerBatch}
                            onChange={(e) => updateProductionField(product, 'qtyPerBatch', e.target.value)}
                            className="w-16 h-8 text-center text-sm font-bold text-teal-600 border-none bg-transparent focus:ring-1 focus:ring-teal-300"
                            min="0"
                            step="1"
                            placeholder=""
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Empty State */}
            {products.length === 0 || salesPersons.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-2">No data available</div>
                <div className="text-gray-400 text-sm">
                  {products.length === 0 ? 'No products found' : 'No sales persons found'}
                </div>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Status Update Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update Product Orders Status</DialogTitle>
          </DialogHeader>
          
          {selectedProduct && selectedProductOrders.length > 0 && (
            <div className="space-y-4">
              {/* Product Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Product</div>
                    <div className="font-semibold">{selectedProduct}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total Orders</div>
                    <div className="font-semibold">{selectedProductOrders.length} orders</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm text-gray-600 mb-2">Current Status Distribution</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(
                        selectedProductOrders.reduce((acc, order) => {
                          acc[order.status] = (acc[order.status] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([status, count]) => (
                        <Badge key={status} className={`text-xs ${getStatusColor(status)}`}>
                          {count} {status.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Orders Summary */}
              <div className="bg-blue-50 rounded-lg p-4 max-h-32 overflow-y-auto">
                <div className="text-sm text-blue-800 font-medium mb-2">Orders to be updated:</div>
                <div className="space-y-1">
                  {selectedProductOrders.slice(0, 5).map((order) => (
                    <div key={order._id} className="text-xs text-blue-700">
                      #{order.orderCode || order._id.slice(-6)} - {order.customer?.name || 'Unknown'} - ₹{order.totalAmount?.toLocaleString() || '0'}
                    </div>
                  ))}
                  {selectedProductOrders.length > 5 && (
                    <div className="text-xs text-blue-600">
                      +{selectedProductOrders.length - 5} more orders...
                    </div>
                  )}
                </div>
              </div>

              {/* Status Selection Dropdown */}
              <div className="space-y-3">
                <div className="text-sm font-medium text-gray-700">Select New Status for All Orders:</div>
                
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        Pending Approval
                      </div>
                    </SelectItem>
                    <SelectItem value="Approved">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Approved
                      </div>
                    </SelectItem>
                    <SelectItem value="Disapproved">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        Rejected
                      </div>
                    </SelectItem>
                    <SelectItem value="In_Production">
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-blue-600" />
                        In Production
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Status Change Warning */}
                {selectedStatus && (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="text-sm text-amber-800">
                      <strong>Warning:</strong> This will update the status of all {selectedProductOrders.length} orders 
                      for "{selectedProduct}" to "<span className="font-medium">{selectedStatus.replace('_', ' ')}</span>".
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsModalOpen(false)}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleBulkStatusUpdate}
              disabled={updating || !selectedStatus}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updating ? `Updating ${selectedProductOrders.length} Orders...` : `Update All ${selectedProductOrders.length} Orders`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesApproval;