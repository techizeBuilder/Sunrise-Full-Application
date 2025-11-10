import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Tag, Users, Package, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export default function QuickAddCategory({ type, onCategoryAdded, children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subcategories, setSubcategories] = useState(['']);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getConfig = () => {
    switch (type) {
      case 'category':
        return {
          title: 'Add New Category',
          icon: Tag,
          endpoint: '/api/categories',
          queryKey: '/api/categories',
          showSubcategories: true
        };
      case 'customer-category':
        return {
          title: 'Add New Customer Category',
          icon: Users,
          endpoint: '/api/customer-categories',
          queryKey: '/api/customer-categories',
          showSubcategories: false
        };
      default:
        return {
          title: 'Add New Category',
          icon: Package,
          endpoint: '/api/categories',
          queryKey: '/api/categories',
          showSubcategories: true
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  const createMutation = useMutation({
    mutationFn: (data) => apiRequest('POST', config.endpoint, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [config.queryKey] });
      toast({
        title: "Success",
        description: `${config.title.replace('Add New ', '')} created successfully`,
      });
      
      // Call callback with new category - handle different response formats
      const newCategory = response.category || response.customerCategory || response;
      if (onCategoryAdded && newCategory) {
        onCategoryAdded(newCategory);
      }
      
      // Reset and close
      setName('');
      setDescription('');
      setSubcategories(['']);
      setIsOpen(false);
    },
    onError: (error) => {
      console.error('Category creation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create category",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }

    const data = {
      name: name.trim(),
      description: description.trim(),
    };

    if (config.showSubcategories) {
      data.subcategories = subcategories.filter(sub => sub.trim() !== '');
    }

    createMutation.mutate(data);
  };

  const addSubcategory = () => {
    setSubcategories([...subcategories, '']);
  };

  const removeSubcategory = (index) => {
    if (subcategories.length > 1) {
      setSubcategories(subcategories.filter((_, i) => i !== index));
    }
  };

  const updateSubcategory = (index, value) => {
    const updated = [...subcategories];
    updated[index] = value;
    setSubcategories(updated);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button type="button" variant="outline" size="sm" className="h-9">
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <Icon className="h-5 w-5 text-blue-600" />
            {config.title}
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            {config.showSubcategories 
              ? "Create a new category with optional subcategories for better organization"
              : "Create a new customer category for classification"
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4" onClick={(e) => e.stopPropagation()}>
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              Category Name *
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter category name"
              className="h-10 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a brief description (optional)"
              rows={3}
              className="resize-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {config.showSubcategories && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">Subcategories</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addSubcategory();
                  }}
                  className="h-8 px-3 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {subcategories.map((subcategory, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      value={subcategory}
                      onChange={(e) => updateSubcategory(index, e.target.value)}
                      placeholder={`Subcategory ${index + 1}`}
                      className="flex-1 h-9 text-sm"
                    />
                    {subcategories.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeSubcategory(index);
                        }}
                        className="h-9 w-9 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {subcategories.length === 0 && (
                <p className="text-xs text-gray-500 italic">No subcategories added yet</p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="flex-1 h-10"
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || !name.trim()}
              className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              {createMutation.isPending ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Create Category
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}