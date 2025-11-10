import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ProductSelector from '@/components/products/ProductSelector';

const EditOrderForm = ({ initialData, onUpdate, onCancel, customersList }) => {
  const { toast } = useToast();
  const [editData, setEditData] = useState({
    customerName: '',
    orderDate: '',
    selectedProducts: []
  });
  const [customerOpen, setCustomerOpen] = useState(false);

  // Load order data when initialData changes
  useEffect(() => {
    if (initialData) {
      const orderDate = initialData.orderDate ? new Date(initialData.orderDate).toISOString().split('T')[0] : '';
      
      // Convert existing order products to editable format  
      const existingProducts = (initialData.products || []).map(orderProduct => {
        const productData = orderProduct.product;
        
        if (productData && productData._id) {
          // Valid product reference
          return {
            _id: productData._id,
            name: productData.name,
            price: productData.salePrice || orderProduct.price || 0,
            quantity: orderProduct.quantity,
            totalPrice: (productData.salePrice || orderProduct.price || 0) * orderProduct.quantity,
            brand: productData.brand || 'Unknown',
            image: productData.image || 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=150&h=150&fit=crop'
          };
        } else {
          // Missing product reference - create editable placeholder
          return {
            _id: `placeholder-${Date.now()}-${Math.random()}`,
            name: `Original Item: ${orderProduct.quantity} units @ ₹${orderProduct.price}`,
            price: orderProduct.price || 0,
            quantity: orderProduct.quantity,
            totalPrice: (orderProduct.price || 0) * orderProduct.quantity,
            brand: 'Replace Required',
            image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=150&h=150&fit=crop',
            isPlaceholder: true
          };
        }
      });

      setEditData({
        customerName: initialData.customer?.name || '',
        orderDate: orderDate,
        selectedProducts: existingProducts
      });
    }
  }, [initialData]);

  const handleProductSelect = (product) => {
    setEditData(prev => ({
      ...prev,
      selectedProducts: [...prev.selectedProducts, product]
    }));
  };

  const handleProductRemove = (productId) => {
    setEditData(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.filter(p => p._id !== productId)
    }));
  };

  const handleQuantityChange = (productId, quantity) => {
    setEditData(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.map(product => 
        product._id === productId 
          ? { ...product, quantity, totalPrice: product.price * quantity }
          : product
      )
    }));
  };

  const handleSubmit = () => {
    if (!editData.customerName) {
      toast({
        title: "Error",
        description: "Please select a customer",
        variant: "destructive"
      });
      return;
    }

    if (!editData.orderDate) {
      toast({
        title: "Error", 
        description: "Please select order date",
        variant: "destructive"
      });
      return;
    }

    // Only send valid products, filter out placeholders
    const validProducts = editData.selectedProducts.filter(p => !p.isPlaceholder);
    
    if (validProducts.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one product",
        variant: "destructive"
      });
      return;
    }

    onUpdate({
      customerName: editData.customerName,
      orderDate: editData.orderDate,
      selectedProducts: validProducts
    });
  };

  return (
    <div className="space-y-6">
      {/* Customer and Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Customer Name *</label>
          <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between mt-1">
                {editData.customerName || "Select customer..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search customers..." />
                <CommandList>
                  <CommandEmpty>No customers found.</CommandEmpty>
                  <CommandGroup>
                    {customersList.map((customer) => (
                      <CommandItem
                        key={customer._id}
                        onSelect={() => {
                          setEditData(prev => ({ ...prev, customerName: customer.name }));
                          setCustomerOpen(false);
                        }}
                      >
                        <Check className={`mr-2 h-4 w-4 ${editData.customerName === customer.name ? "opacity-100" : "opacity-0"}`} />
                        {customer.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <label className="text-sm font-medium">Order Date *</label>
          <Input
            type="date"
            value={editData.orderDate}
            onChange={(e) => setEditData(prev => ({ ...prev, orderDate: e.target.value }))}
            className="mt-1"
          />
        </div>
      </div>

      {/* Product Selection */}
      <ProductSelector
        selectedProducts={editData.selectedProducts}
        onProductSelect={handleProductSelect}
        onProductRemove={handleProductRemove}
        onQuantityChange={handleQuantityChange}
      />

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button onClick={handleSubmit} className="flex-1">Update Order</Button>
      </div>
    </div>
  );
};

export default EditOrderForm;