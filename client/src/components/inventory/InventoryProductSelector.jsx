import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Search, Package, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

const InventoryProductSelector = React.memo(({ 
  selectedProducts = [], 
  onProductSelect, 
  onProductRemove, 
  onQuantityChange,
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const { toast } = useToast();

  // Fetch inventory items
  const { data: itemsResponse, isLoading: itemsLoading, error: itemsError } = useQuery({
    queryKey: ['/api/items'],
    queryFn: () => apiRequest('/api/items'),
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to load inventory items",
        variant: "destructive"
      });
    }
  });

  // Fetch categories for proper organization
  const { data: categoriesResponse, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: () => apiRequest('/api/categories'),
  });

  const items = itemsResponse?.items || [];
  const categories = categoriesResponse?.categories || [];

  // Filter items based on search term
  const filteredItems = React.useMemo(() => {
    return items.filter(item => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        item.name?.toLowerCase().includes(searchLower) ||
        item.code?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower) ||
        item.category?.toLowerCase().includes(searchLower)
      );
    });
  }, [items, searchTerm]);

  // Group items by category
  const itemsByCategory = React.useMemo(() => {
    const grouped = {};
    
    // Initialize with existing categories
    categories.forEach(cat => {
      grouped[cat.name] = [];
    });
    
    // Add uncategorized for items without category
    grouped['Uncategorized'] = [];
    
    filteredItems.forEach(item => {
      const categoryName = item.category || 'Uncategorized';
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      grouped[categoryName].push(item);
    });
    
    // Remove empty categories
    Object.keys(grouped).forEach(key => {
      if (grouped[key].length === 0) {
        delete grouped[key];
      }
    });
    
    return grouped;
  }, [filteredItems, categories]);

  // Track categories that have quantities (should stay locked open)
  const categoriesWithQuantities = React.useMemo(() => {
    const categoriesSet = new Set();
    selectedProducts.forEach(product => {
      if (product.quantity > 0) {
        const productData = items.find(p => p._id === product._id);
        if (productData) {
          const categoryName = productData.category || 'Uncategorized';
          categoriesSet.add(categoryName);
        }
      }
    });
    return categoriesSet;
  }, [selectedProducts, items]);

  const toggleCategoryExpansion = (categoryName) => {
    setExpandedCategories(prev => {
      const isCurrentlyExpanded = prev[categoryName];
      const newExpanded = {};
      
      // Always keep categories with quantities open
      categoriesWithQuantities.forEach(category => {
        newExpanded[category] = true;
      });
      
      // Accordion behavior: if clicked category is not currently expanded, open it and close all others
      if (!isCurrentlyExpanded) {
        newExpanded[categoryName] = true;
      }
      
      return newExpanded;
    });
  };

  const handleProductToggle = (item) => {
    const isSelected = selectedProducts.some(p => p._id === item._id);
    
    if (isSelected) {
      onProductRemove(item._id);
    } else {
      // Check if item has stock
      if (item.qty <= 0) {
        toast({
          title: "Out of Stock",
          description: `${item.name} is currently out of stock`,
          variant: "destructive"
        });
        return;
      }
      
      onProductSelect({
        ...item,
        quantity: 1,
        totalPrice: item.salePrice || 0,
        availableQty: item.qty
      });
    }
  };

  const handleQuantityUpdate = (productId, value) => {
    const numQuantity = parseInt(value) || 0;
    const item = items.find(p => p._id === productId);
    
    if (numQuantity <= 0) {
      onProductRemove(productId);
      return;
    }
    
    // Check against available quantity
    if (item && numQuantity > item.qty) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${item.qty} ${item.unit || 'units'} available for ${item.name}`,
        variant: "destructive"
      });
      return;
    }
    
    onQuantityChange(productId, numQuantity);
  };

  const getSelectedProductQuantity = (productId) => {
    const selected = selectedProducts.find(p => p._id === productId);
    return selected ? selected.quantity : 0;
  };

  const isProductSelected = (productId) => {
    return selectedProducts.some(p => p._id === productId);
  };

  const getStockStatus = (item) => {
    if (item.qty <= 0) return { status: 'out', color: 'text-red-600', bg: 'bg-red-100' };
    if (item.qty <= item.minStock) return { status: 'low', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { status: 'in', color: 'text-green-600', bg: 'bg-green-100' };
  };

  if (itemsLoading || categoriesLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Package className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">Loading inventory items...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Select Products from Inventory
        </CardTitle>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search inventory items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {Object.keys(itemsByCategory).length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">No inventory items found</p>
          </div>
        ) : (
          Object.entries(itemsByCategory).map(([categoryName, categoryItems]) => {
            const isExpanded = expandedCategories[categoryName];
            const hasQuantities = categoriesWithQuantities.has(categoryName);
            
            return (
              <div key={categoryName} className="border rounded-lg overflow-hidden">
                <Button
                  variant="ghost"
                  onClick={() => toggleCategoryExpansion(categoryName)}
                  className="w-full justify-between p-4 h-auto font-medium"
                >
                  <div className="flex items-center gap-2">
                    <span>{categoryName}</span>
                    <Badge variant="secondary" className="text-xs">
                      {categoryItems.length}
                    </Badge>
                    {hasQuantities && (
                      <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">
                        Selected
                      </Badge>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
                
                {isExpanded && (
                  <div className="border-t bg-gray-50/50">
                    <div className="p-4 space-y-3">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 font-medium">ITEM NAME</th>
                              <th className="text-left py-2 font-medium">STOCK</th>
                              <th className="text-left py-2 font-medium">PRICE</th>
                              <th className="text-right py-2 font-medium">QUANTITY</th>
                            </tr>
                          </thead>
                          <tbody>
                            {categoryItems.map((item) => {
                              const stockStatus = getStockStatus(item);
                              const selectedQty = getSelectedProductQuantity(item._id);
                              const isSelected = isProductSelected(item._id);
                              
                              return (
                                <tr key={item._id} className="border-b hover:bg-gray-50">
                                  <td className="py-3">
                                    <div className="flex items-center gap-3">
                                      {item.image && (
                                        <img 
                                          src={item.image} 
                                          alt={item.name}
                                          className="w-10 h-10 object-cover rounded"
                                        />
                                      )}
                                      <div>
                                        <div className="font-medium">{item.name}</div>
                                        <div className="text-xs text-gray-500">{item.code}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className={`${stockStatus.bg} ${stockStatus.color} border-0`}>
                                        {item.qty} {item.unit}
                                      </Badge>
                                      {stockStatus.status === 'out' && (
                                        <AlertTriangle className="h-4 w-4 text-red-500" />
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3">
                                    <span className="font-medium">₹{(item.salePrice || 0).toLocaleString()}</span>
                                  </td>
                                  <td className="py-3 text-right">
                                    <div className="flex items-center gap-2 justify-end">
                                      {isSelected ? (
                                        <>
                                          <Input
                                            type="number"
                                            min="1"
                                            max={item.qty}
                                            value={selectedQty}
                                            onChange={(e) => handleQuantityUpdate(item._id, e.target.value)}
                                            className="w-20 text-center"
                                          />
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onProductRemove(item._id)}
                                            className="text-red-600 hover:text-red-700"
                                          >
                                            Remove
                                          </Button>
                                        </>
                                      ) : (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleProductToggle(item)}
                                          disabled={item.qty <= 0}
                                          className="text-blue-600 hover:text-blue-700"
                                        >
                                          {item.qty <= 0 ? 'Out of Stock' : 'Add'}
                                        </Button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        
        {/* Summary */}
        {selectedProducts.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Order Summary</h4>
            <div className="text-sm text-blue-700">
              Total Items: {selectedProducts.reduce((sum, p) => sum + p.quantity, 0)} units
            </div>
            <div className="text-sm text-blue-700">
              Total Value: ₹{selectedProducts.reduce((sum, p) => sum + (p.totalPrice || 0), 0).toLocaleString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

InventoryProductSelector.displayName = 'InventoryProductSelector';

export default InventoryProductSelector;