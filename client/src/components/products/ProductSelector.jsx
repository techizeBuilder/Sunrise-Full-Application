import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Search, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { useAuthContext } from '../../contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';

const ProductSelector = React.memo(({ 
  selectedProducts = [], 
  onProductSelect, 
  onProductRemove, 
  onQuantityChange,
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [expandedBrands, setExpandedBrands] = useState({});
  const [localQuantities, setLocalQuantities] = useState({});
  const quantityRefs = useRef({});
  const { toast } = useToast();
  const { user } = useAuthContext();

  // Determine which API endpoint to use based on user role
  const getItemsEndpoint = () => {
    if (!user) return '/api/items';
    
    switch (user.role) {
      case 'Super Admin':
        return '/api/super-admin/inventory/items';
      case 'Unit Head':
        return '/api/unit-head/inventory/items';
      case 'Unit Manager':
        return '/api/unit-manager/inventory/items';
      case 'Sales':
        return '/api/sales/items';
      default:
        return '/api/items';
    }
  };

  // Fetch inventory items using appropriate endpoint
  const { data: itemsResponse, isLoading: itemsLoading, error: itemsError } = useQuery({
    queryKey: [getItemsEndpoint()],
    queryFn: async () => {
      console.log('🔍 ProductSelector: Fetching items from:', getItemsEndpoint());
      try {
        const response = await apiRequest('GET', getItemsEndpoint());
        console.log('✅ ProductSelector: API Response:', response);
        
        // Filter items to only show type = "Product" on frontend as well
        if (response?.items) {
          const originalCount = response.items.length;
          response.items = response.items.filter(item => item.type === 'Product');
          console.log(`🎯 ProductSelector: Filtered ${originalCount} items to ${response.items.length} Product items`);
        }
        
        return response;
      } catch (error) {
        console.error('❌ ProductSelector: API Error:', error);
        throw error;
      }
    },
    onError: (error) => {
      console.error('❌ ProductSelector: Query Error:', error);
      toast({
        title: "Error",
        description: "Failed to load inventory items",
        variant: "destructive"
      });
    }
  });

  const items = itemsResponse?.items || [];
  
  // Debug logging
  React.useEffect(() => {
    console.log('📦 ProductSelector Debug:', {
      itemsResponse,
      itemsArray: items,
      itemsCount: items.length,
      itemsError,
      isLoading: itemsLoading
    });
  }, [itemsResponse, items, itemsError, itemsLoading]);

  // Group inventory items by category (treat as brands for UI consistency)
  const productsByBrand = React.useMemo(() => {
    const grouped = {};
    
    // Filter items based on search term
    const filteredItems = items.filter(item => 
      searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filteredItems.forEach(item => {
      const categoryName = item.category || 'Uncategorized';
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      // Transform inventory item to match expected product format
      grouped[categoryName].push({
        _id: item._id,
        name: item.name,
        price: item.salePrice || 0,
        image: item.image || null,
        brand: categoryName,
        stock: item.qty || 0,
        unit: item.unit || 'pcs',
        code: item.code || ''
      });
    });
    return grouped;
  }, [items, searchTerm]);

  // Track categories that have quantities (should stay locked open)
  const brandsWithQuantities = React.useMemo(() => {
    const brandsSet = new Set();
    selectedProducts.forEach(product => {
      if (product.quantity > 0) {
        brandsSet.add(product.brand);
      }
    });
    return brandsSet;
  }, [selectedProducts]);

  // Auto-expand all brands when products are loaded and keep them expanded for navigation
  React.useEffect(() => {
    if (Object.keys(productsByBrand).length > 0) {
      setExpandedBrands(prev => {
        const newExpanded = { ...prev };
        // Auto-expand all brands so navigation works across categories
        Object.keys(productsByBrand).forEach(brandName => {
          newExpanded[brandName] = true;
        });
        return newExpanded;
      });
    }
  }, [productsByBrand]);

  const toggleBrandExpansion = (brandName) => {
    setExpandedBrands(prev => ({
      ...prev,
      [brandName]: !prev[brandName]
    }));
  };

  const handleProductToggle = (product) => {
    const isSelected = selectedProducts.some(p => p._id === product._id);
    
    if (isSelected) {
      onProductRemove(product._id);
    } else {
      onProductSelect({
        ...product,
        quantity: 1
      });
    }
  };

  // Handle local quantity changes to prevent focus loss
  const handleLocalQuantityChange = (productId, value) => {
    setLocalQuantities(prev => ({
      ...prev,
      [productId]: value
    }));
  };

  // Handle quantity submission/blur to update parent
  const handleQuantityUpdate = (productId, value) => {
    const numQuantity = parseInt(value) || 0;
    
    // Clear local quantity
    setLocalQuantities(prev => {
      const newState = { ...prev };
      delete newState[productId];
      return newState;
    });
    
    if (numQuantity <= 0) {
      onProductRemove(productId);
    } else {
      // Check if product already selected
      const existingProduct = selectedProducts.find(p => p._id === productId);
      if (existingProduct) {
        onQuantityChange(productId, numQuantity);
      } else {
        // Add new product with quantity - find from all grouped products
        let foundProduct = null;
        Object.values(productsByBrand).forEach(brandProducts => {
          const product = brandProducts.find(p => p._id === productId);
          if (product) foundProduct = product;
        });
        
        if (foundProduct) {
          onProductSelect({
            ...foundProduct,
            quantity: numQuantity
          });
        }
      }
    }
  };

  // Get all visible product IDs in order across all brands (regardless of expansion state for navigation)
  const getAllVisibleProductIds = React.useMemo(() => {
    const allIds = [];
    Object.entries(productsByBrand)
      .filter(([categoryName]) => selectedBrand === 'all' || categoryName === selectedBrand)
      .forEach(([brandName, brandProducts]) => {
        // Include ALL products for navigation, regardless of expansion state
        brandProducts.forEach(product => {
          allIds.push(product._id);
        });
      });
    console.log('🚀 All navigation product IDs:', allIds);
    return allIds;
  }, [productsByBrand, selectedBrand]);

  // Handle Enter key navigation to next quantity input across all visible products
  const handleKeyDown = (e, productId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      
      console.log('🔍 Enter key pressed for product:', productId);
      console.log('📝 All visible product IDs:', getAllVisibleProductIds);
      
      // Submit current quantity
      const currentValue = e.target.value;
      handleQuantityUpdate(productId, currentValue);
      
      // Find current product index in the global list
      const currentGlobalIndex = getAllVisibleProductIds.indexOf(productId);
      const nextGlobalIndex = currentGlobalIndex + 1;
      
      console.log('📊 Current index:', currentGlobalIndex, 'Next index:', nextGlobalIndex);
      
      // Move to next product across all visible products
      if (nextGlobalIndex < getAllVisibleProductIds.length) {
        const nextProductId = getAllVisibleProductIds[nextGlobalIndex];
        
        console.log('➡️ Moving to next product:', nextProductId);
        
        // Focus the next input with a short delay
        setTimeout(() => {
          const nextInput = quantityRefs.current[nextProductId];
          console.log('🎯 Next input element:', nextInput);
          
          if (nextInput) {
            try {
              nextInput.focus();
              nextInput.select();
              console.log('✅ Successfully focused next input');
            } catch (error) {
              console.error('❌ Error focusing next input:', error);
            }
          } else {
            console.log('❌ Next input not found in refs');
          }
        }, 150);
      } else {
        console.log('🏁 Reached end of product list');
      }
    }
  };

  const getDisplayQuantity = (productId) => {
    // Use local quantity if available (user is typing), otherwise use selected quantity
    if (localQuantities.hasOwnProperty(productId)) {
      return localQuantities[productId];
    }
    const selectedProduct = selectedProducts.find(p => p._id === productId);
    return selectedProduct?.quantity || '';
  };

  if (itemsError) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Failed to load inventory data. Please try again.
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
          Select Products
        </CardTitle>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedBrand} onValueChange={setSelectedBrand}>
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.keys(productsByBrand).map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {itemsLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-20 bg-gray-100 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(productsByBrand)
              .filter(([categoryName]) => selectedBrand === 'all' || categoryName === selectedBrand)
              .map(([brandName, brandProducts]) => {
              const hasQuantities = brandsWithQuantities.has(brandName);
              const isExpanded = expandedBrands[brandName];
              
              return (
              <div key={brandName} className="border rounded-lg">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleBrandExpansion(brandName);
                  }}
                  className={`w-full flex items-center justify-between p-3 transition-colors ${
                    hasQuantities && isExpanded 
                      ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  type="button"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant={hasQuantities ? "default" : "secondary"}>
                      {brandName}
                    </Badge>
                    {hasQuantities && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        Selected
                      </Badge>
                    )}
                    <span className="text-sm text-gray-600">
                      {brandProducts.length} products
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className={`h-4 w-4 ${hasQuantities ? 'text-blue-500' : ''}`} />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                {expandedBrands[brandName] && (
                  <div className="border-t">
                    {/* Header Row */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-400">
                      <span>ITEM NAME</span>
                      <span className="w-20 text-center">QUANTITY</span>
                    </div>
                    
                    {/* Product Rows */}
                    <div className="space-y-0 divide-y">
                      {brandProducts.map((product, productIndex) => {
                        const displayQuantity = getDisplayQuantity(product._id);
                        const isSelected = selectedProducts.some(p => p._id === product._id && p.quantity > 0);

                      return (
                        <div
                          key={product._id}
                          className={`flex items-center justify-between p-3 rounded border transition-colors ${
                            isSelected ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-12 h-12 rounded object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className={`w-12 h-12 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${product.image ? 'hidden' : 'flex'}`}
                            >
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                            <div>
                              <h4 className="font-medium">{product.name}</h4>
                              <p className="text-sm text-green-600 font-semibold">
                                ₹{product.price} / {product.unit}
                              </p>
                              <p className="text-xs text-gray-500">
                                Code: {product.code}
                              </p>
                            </div>
                          </div>

                          <div className="w-20" onClick={(e) => e.stopPropagation()}>
                            <Input
                              ref={(el) => {
                                if (el) {
                                  quantityRefs.current[product._id] = el;
                                }
                              }}
                              type="number"
                              min="0"
                              placeholder="0"
                              value={displayQuantity}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleLocalQuantityChange(product._id, e.target.value);
                              }}
                              onFocus={(e) => {
                                e.stopPropagation();
                                e.target.placeholder = '';
                                // Select all text on focus for easy editing
                                setTimeout(() => e.target.select(), 0);
                              }}
                              onBlur={(e) => {
                                e.stopPropagation();
                                if (!e.target.value) {
                                  e.target.placeholder = "0";
                                }
                                // Submit quantity on blur
                                handleQuantityUpdate(product._id, e.target.value);
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              onKeyDown={(e) => {
                                e.stopPropagation();
                                handleKeyDown(e, product._id);
                              }}
                              className="w-full text-center text-sm h-8"
                            />
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </div>
                )}
              </div>
              );
            })}

            {Object.keys(productsByBrand).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm || selectedBrand ? 'No products found matching your search.' : 'No products available.'}
              </div>
            )}
          </div>
        )}

        {/* Selected Products Summary */}
        {selectedProducts.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="font-medium mb-3">Selected Products ({selectedProducts.length})</h4>
            <div className="space-y-2">
              {selectedProducts.map(product => (
                <div key={product._id} className="flex items-center justify-between text-sm">
                  <span>{product.name}</span>
                  <span className="font-medium">
                    {product.quantity}x ₹{product.price || 0} = ₹{(product.quantity * (product.price || 0)).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between font-semibold text-base pt-2 border-t">
                <span>Total Amount:</span>
                <span>₹{selectedProducts.reduce((sum, p) => sum + ((p.quantity || 0) * (p.price || 0)), 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default ProductSelector;