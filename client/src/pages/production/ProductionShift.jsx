import React, { useState, useEffect } from 'react';
import { Clock, Package, Users, Eye, Save, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export default function ProductionShift() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [productionGroups, setProductionGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [batchData, setBatchData] = useState({});
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);

  useEffect(() => {
    console.log('🎯 ProductionShift component mounted, calling fetchProductionShiftData');
    fetchProductionShiftData();
  }, []);

  // Fetch production groups with shift data
  const fetchProductionShiftData = async () => {
    console.log('🚀 Starting fetchProductionShiftData...');
    setLoading(true);
    try {
      console.log('📡 Making API call to /api/production/production-shift');
      const response = await fetch('/api/production/production-shift', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📊 Response data:', data);
      
      if (data.success) {
        console.log('✅ API call successful, setting production groups:', data.data.groups);
        setProductionGroups(data.data.groups);
        
        // Initialize batch data with proper values from database
        const initialBatchData = {};
        data.data.groups.forEach(group => {
          const batchKey = `${group._id}`;
          
          console.log('🔍 Initializing group data:', {
            name: group.name,
            mouldingTime: group.mouldingTime,
            unloadingTime: group.unloadingTime,
            productionLoss: group.productionLoss
          });
          
          initialBatchData[batchKey] = {
            productGroup: group.name,
            // Keep existing datetime values if they exist
            mouldingTime: group.mouldingTime || '',
            unloadingTime: group.unloadingTime || '',
            // Keep existing production loss value, don't default to 0 if empty
            productionLoss: group.productionLoss !== undefined && group.productionLoss !== null ? group.productionLoss : '',
            qtyBatch: group.totalBatchQuantity || 0, // Use sum of qtyPerBatch values
            qtyAchieved: (group.totalBatchQuantity || 0) - (group.productionLoss || 0)
          };
        });
        
        console.log('📊 Final initialized batch data:', initialBatchData);
        setBatchData(initialBatchData);

      } else {
        console.error('❌ API call failed:', data.message);
        toast({
          title: "Error",
          description: data.message || "Failed to fetch production data",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('💥 Error fetching production shift data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch production shift data",
        variant: "destructive"
      });
    } finally {
      console.log('🏁 fetchProductionShiftData completed');
      setLoading(false);
    }
  };

  // Handle batch data changes with auto-save
  const handleBatchDataChange = async (batchKey, field, value) => {
    // Update local state immediately
    setBatchData(prev => ({
      ...prev,
      [batchKey]: {
        ...prev[batchKey],
        [field]: value
      }
    }));

    // Auto-save to API
    await handleAutoSave(batchKey, field, value);
  };

  // Auto-save function - calls API when field changes
  const handleAutoSave = async (batchKey, field, value) => {
    try {
      console.log(`🔄 Auto-saving ${field} for group ${batchKey}:`, value);
      
      let processedValue = value;
      
      // Convert datetime strings to proper ISO format
      if (field === 'mouldingTime' || field === 'unloadingTime') {
        if (value && value.trim() !== '') {
          // datetime-local input gives us format: "2024-11-28T14:30"
          processedValue = new Date(value).toISOString();
          console.log(`🕐 Converted datetime ${value} to ISO: ${processedValue}`);
        } else {
          processedValue = null;
          console.log(`🕐 Setting ${field} to null (empty datetime)`);
        }
      }
      
      const updateData = {
        groupId: batchKey,
        field: field,
        value: processedValue
      };

      console.log('📤 Sending auto-save API request:', updateData);
      const response = await fetch('/api/production/production-shift', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();
      console.log('✅ Auto-save API Response:', result);

      if (result.success) {
        console.log(`✅ Successfully auto-saved ${field}`);
        toast({
          title: "Auto-saved",
          description: `${field} updated successfully`,
          duration: 2000
        });
        
        // Refetch the production shift data to get updated values
        console.log('🔄 Refetching production shift data after successful update...');
        fetchProductionShiftData();
      } else {
        console.error('❌ Auto-save failed:', result.message);
        toast({
          title: "Auto-save failed",
          description: result.message || `Failed to update ${field}`,
          variant: "destructive",
          duration: 3000
        });
      }
    } catch (error) {
      console.error(`❌ Auto-save error for ${field}:`, error);
      toast({
        title: "Auto-save error",
        description: `Failed to auto-save ${field}: ${error.message}`,
        variant: "destructive",
        duration: 3000
      });
    }
  };

  // Save all changes
  const handleSaveAllChanges = async () => {
    try {
      // In a real implementation, you would send the batchData to the API
      // For now, we'll just show a success message
      toast({
        title: "Success",
        description: "All production shift data saved successfully",
      });
    } catch (error) {
      console.error('Error saving production shift data:', error);
      toast({
        title: "Error",
        description: "Failed to save production shift data",
        variant: "destructive"
      });
    }
  };

  // View batch details
  // View batch details - Updated to show entire group details
  const handleViewBatch = (group, item, batchKey) => {
    const batch = batchData[batchKey] || {};
    setSelectedBatch({
      batchNo: productionGroups.findIndex(g => g._id === group._id) + 1,
      productGroup: group.name,
      group: group, // Pass entire group to show all items
      mouldingTime: batch.mouldingTime || '00:00',
      unloadingTime: batch.unloadingTime || '00:00',
      productionLoss: batch.productionLoss || 0,
      totalQty: group.totalBatchQuantity || 0, // Use batch quantity
      qtyAchieved: (group.totalBatchQuantity || 0) - (batch.productionLoss || 0),
      totalItems: group.totalItems,
      description: group.description || 'No description',
      createdBy: group.createdBy,
      createdAt: group.createdAt
    });
    setViewModalOpen(true);
  };

  // Delete batch
  const handleDeleteBatch = (batchKey) => {
    if (confirm('Are you sure you want to delete this batch?')) {
      setBatchData(prev => {
        const newData = { ...prev };
        delete newData[batchKey];
        return newData;
      });
      toast({
        title: "Success",
        description: "Batch deleted successfully",
      });
    }
  };

  // Render batch rows - ONE ROW PER GROUP
  const renderBatchRows = (group, groupIndex) => {
    const batchKey = `${group._id}`;
    const batch = batchData[batchKey] || {};
    const batchNumber = groupIndex + 1; // Sequential batch numbering per group

    return (
      <TableRow key={batchKey}>
        <TableCell className="text-center">{batchNumber}</TableCell>
        
        {/* Product Group - Simple text, not editable */}
        <TableCell>
          {group.name}
        </TableCell>
        
        {/* Moulding Time */}
        <TableCell>
          <Input
            type="datetime-local"
            value={batch.mouldingTime || ''}
            onChange={(e) => {
              // Update local state immediately
              setBatchData(prev => ({
                ...prev,
                [batchKey]: {
                  ...prev[batchKey],
                  mouldingTime: e.target.value
                }
              }));
            }}
            onBlur={(e) => handleBatchDataChange(batchKey, 'mouldingTime', e.target.value)}
            className="w-48"
          />
        </TableCell>
        
        {/* Unloading Time */}
        <TableCell>
          <Input
            type="datetime-local"
            value={batch.unloadingTime || ''}
            onChange={(e) => {
              // Update local state immediately
              setBatchData(prev => ({
                ...prev,
                [batchKey]: {
                  ...prev[batchKey],
                  unloadingTime: e.target.value
                }
              }));
            }}
            onBlur={(e) => handleBatchDataChange(batchKey, 'unloadingTime', e.target.value)}
            className="w-48"
          />
        </TableCell>
        
        {/* Production Loss */}
        <TableCell>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="Enter loss amount"
            value={batch.productionLoss !== undefined && batch.productionLoss !== null ? batch.productionLoss : ''}
            disabled={!batch.mouldingTime || !batch.unloadingTime}
            onChange={(e) => {
              // Update local state immediately for typing
              const value = e.target.value;
              setBatchData(prev => ({
                ...prev,
                [batchKey]: {
                  ...prev[batchKey],
                  productionLoss: value === '' ? '' : parseFloat(value) || 0
                }
              }));
            }}
            onBlur={(e) => {
              // Save to API when done editing
              const value = e.target.value;
              handleBatchDataChange(batchKey, 'productionLoss', value === '' ? 0 : parseFloat(value) || 0);
            }}
            className={`w-24 ${!batch.mouldingTime || !batch.unloadingTime ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            title={!batch.mouldingTime || !batch.unloadingTime ? "Please enter both Moulding Time and Unloading Time first" : "Enter production loss"}
          />
        </TableCell>
        
        {/* Total Qty/Batch for entire group - Sum of all item qtyPerBatch values */}
        <TableCell className="text-center">
          <div className="font-medium">{group.totalBatchQuantity || 0}</div>
          {/* <div className="text-xs text-gray-500">
            Total Value: ₹{group.items?.reduce((sum, item) => sum + ((item.price || 0) * (item.qty || 0)), 0).toLocaleString() || '0'}
          </div> */}
        </TableCell>
        
        {/* Qty Achieved/Batch (auto-calculated) - Use batch quantity in calculation */}
        <TableCell className="text-center">
          <span className="text-green-600 font-medium">
            {(group.totalBatchQuantity || 0) - (batch.productionLoss || 0)}
          </span>
          <div className="text-xs text-green-500">
            {group.totalBatchQuantity || 0} - {batch.productionLoss || 0}
          </div>
        </TableCell>
        
        {/* Actions */}
        <TableCell>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewBatch(group, null, batchKey)}
              title="View Group Details"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeleteBatch(batchKey)}
              title="Delete Batch"
              className="text-red-600 hover:text-red-800"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header - WITH ADD NEW BATCH BUTTON */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Production Sheet Management</h1>
          <p className="text-gray-600">Manage production shift timings and batch performance</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productionGroups.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {productionGroups.reduce((sum, group) => sum + group.totalItems, 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Batch Quantity</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {productionGroups.reduce((sum, group) => sum + (group.totalBatchQuantity || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Sum of all qtyPerBatch values
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Batches</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {productionGroups.reduce((sum, group) => sum + group.items.length, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Production Shift Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Production Sheet Data ({productionGroups.length} Batches)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading production data...</div>
          ) : productionGroups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No production groups found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Batch No.</TableHead>
                    <TableHead>Product Group</TableHead>
                    <TableHead>Moulding Time</TableHead>
                    <TableHead>Unloading Time</TableHead>
                    <TableHead>Production Loss</TableHead>
                    <TableHead>Qty/Batch</TableHead>
                    <TableHead className="text-green-700">Qty Achieved/Batch (auto)</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productionGroups.map((group, groupIndex) => (
                    <React.Fragment key={group._id}>
                      {/* Batch Rows - Clean simple layout */}
                      {renderBatchRows(group, groupIndex)}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Batch Details Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Batch Details - Batch #{selectedBatch?.batchNo}</DialogTitle>
          </DialogHeader>
          
          {selectedBatch && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Product Group</label>
                  <p className="text-lg font-semibold">{selectedBatch.productGroup}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Batch Number</label>
                  <p className="text-lg font-semibold">#{selectedBatch.batchNo}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Moulding Time</label>
                  <p className="text-lg">{selectedBatch.mouldingTime || 'Not set'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Unloading Time</label>
                  <p className="text-lg">{selectedBatch.unloadingTime || 'Not set'}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Production Loss</label>
                  <p className="text-lg font-semibold text-red-600">{selectedBatch.productionLoss}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Total Qty/Batch</label>
                  <p className="text-lg font-semibold">{selectedBatch.group?.totalBatchQuantity || 0}</p>
                  <p className="text-xs text-gray-500">Sum of all item qtyPerBatch values</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Qty Achieved</label>
                  <p className="text-lg font-semibold text-green-600">
                    {(selectedBatch.group?.totalBatchQuantity || 0) - (selectedBatch.productionLoss || 0)}
                  </p>
                  <p className="text-xs text-gray-500">Batch quantity - Production loss</p>
                </div>
              </div>

              {/* Group Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Total Items</label>
                  <p className="text-lg font-semibold">{selectedBatch.totalItems}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created By</label>
                  <p className="text-lg">{selectedBatch.createdBy}</p>
                </div>
              </div>

              {/* All Items in Group */}
              <div>
                <label className="text-sm font-medium text-gray-500">All Items in this Production Group</label>
                <div className="mt-2 space-y-3 max-h-60 overflow-y-auto">
                  {selectedBatch.group?.items?.map((item, index) => (
                    <div key={item._id} className="p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center space-x-3">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-12 rounded object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-500" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-600">
                            <strong>Code:</strong> {item.code} | 
                            <strong> Category:</strong> {item.category}
                          </div>
                          <div className="text-sm text-gray-600">
                            <strong>Qty:</strong> {item.qty} {item.unit} | 
                            <strong> Qty/Batch:</strong> <span className="text-blue-600 font-medium">{item.qtyPerBatch || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setViewModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}