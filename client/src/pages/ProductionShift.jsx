import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Package, Settings, Save, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ProductionShift = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Sample dummy data
  const [productionData, setProductionData] = useState([
    {
      id: 1,
      batchNo: 1,
      productGroup: 'PM 400',
      qtyPerBatch: 100,
      mouldingTime: '',
      unloadingTime: '',
      productionLoss: 0,
      qtyAchievedPerBatch: 100
    },
    {
      id: 2,
      batchNo: 2,
      productGroup: 'SW 400',
      qtyPerBatch: 150,
      mouldingTime: '',
      unloadingTime: '',
      productionLoss: 0,
      qtyAchievedPerBatch: 150
    },
    {
      id: 3,
      batchNo: 3,
      productGroup: 'Brown',
      qtyPerBatch: 200,
      mouldingTime: '',
      unloadingTime: '',
      productionLoss: 0,
      qtyAchievedPerBatch: 200
    },
    {
      id: 4,
      batchNo: 4,
      productGroup: 'SW-800',
      qtyPerBatch: 80,
      mouldingTime: '',
      unloadingTime: '',
      productionLoss: 0,
      qtyAchievedPerBatch: 80
    },
    {
      id: 5,
      batchNo: 5,
      productGroup: 'PAV-200',
      qtyPerBatch: 120,
      mouldingTime: '',
      unloadingTime: '',
      productionLoss: 0,
      qtyAchievedPerBatch: 120
    }
  ]);

  // Auto-calculate qtyAchievedPerBatch when productionLoss changes
  const updateProductionLoss = (id, value) => {
    const numValue = value === '' ? 0 : parseFloat(value) || 0;
    
    setProductionData(prev => prev.map(item => {
      if (item.id === id) {
        const qtyAchievedPerBatch = Math.max(0, item.qtyPerBatch - numValue);
        return {
          ...item,
          productionLoss: numValue,
          qtyAchievedPerBatch: qtyAchievedPerBatch
        };
      }
      return item;
    }));
  };

  // Update other fields
  const updateField = (id, field, value) => {
    setProductionData(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Add new batch
  const addNewBatch = () => {
    const newId = Math.max(...productionData.map(item => item.id)) + 1;
    const newBatchNo = Math.max(...productionData.map(item => item.batchNo)) + 1;
    
    const newBatch = {
      id: newId,
      batchNo: newBatchNo,
      productGroup: '',
      qtyPerBatch: 0,
      mouldingTime: '',
      unloadingTime: '',
      productionLoss: 0,
      qtyAchievedPerBatch: 0
    };
    
    setProductionData(prev => [...prev, newBatch]);
  };

  // Save all data
  const saveData = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: 'Success',
        description: 'Production shift data saved successfully!'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save production shift data',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-3 lg:p-6 bg-gray-50 min-h-screen">
      <div className="mb-4 lg:mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Production Shift Management</h1>
        <p className="text-sm lg:text-base text-gray-600">Manage production shift timings and batch performance</p>
      </div>

      <div className="mb-4 lg:mb-6 flex gap-3">
        <Button onClick={addNewBatch} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add New Batch
        </Button>
        <Button onClick={saveData} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Production Shift Data
            <Badge variant="secondary">{productionData.length} Batches</Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-3 text-left border-r">Batch No.</th>
                  <th className="p-3 text-left border-r">Product Group</th>
                  <th className="p-3 text-center border-r">Moulding Time</th>
                  <th className="p-3 text-center border-r">Unloading Time</th>
                  <th className="p-3 text-center border-r">Production Loss</th>
                  <th className="p-3 text-center border-r">Qty/Batch</th>
                  <th className="p-3 text-center border-r text-green-600">Qty Achieved/Batch (auto)</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              
              <tbody>
                {productionData.map((item, index) => (
                  <tr key={item.id} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="p-3 border-r">
                      <Badge variant="outline">{item.batchNo}</Badge>
                    </td>
                    <td className="p-3 border-r">
                      <Input
                        value={item.productGroup}
                        onChange={(e) => updateField(item.id, 'productGroup', e.target.value)}
                        placeholder="Enter product group"
                      />
                    </td>
                    <td className="p-3 border-r">
                      <Input
                        value={item.mouldingTime}
                        onChange={(e) => updateField(item.id, 'mouldingTime', e.target.value)}
                        placeholder="00:00"
                        className="text-center"
                      />
                    </td>
                    <td className="p-3 border-r">
                      <Input
                        value={item.unloadingTime}
                        onChange={(e) => updateField(item.id, 'unloadingTime', e.target.value)}
                        placeholder="00:00"
                        className="text-center"
                      />
                    </td>
                    <td className="p-3 border-r">
                      <Input
                        type="number"
                        value={item.productionLoss}
                        onChange={(e) => updateProductionLoss(item.id, e.target.value)}
                        placeholder="0"
                        min="0"
                        className="text-center"
                      />
                    </td>
                    <td className="p-3 border-r">
                      <Input
                        type="number"
                        value={item.qtyPerBatch}
                        onChange={(e) => {
                          const newQty = parseFloat(e.target.value) || 0;
                          const newAchieved = Math.max(0, newQty - item.productionLoss);
                          setProductionData(prev => prev.map(prevItem => 
                            prevItem.id === item.id 
                              ? { ...prevItem, qtyPerBatch: newQty, qtyAchievedPerBatch: newAchieved }
                              : prevItem
                          ));
                        }}
                        placeholder="0"
                        min="0"
                        className="text-center"
                      />
                    </td>
                    <td className="p-3 border-r">
                      <div className="bg-green-50 border border-green-200 rounded p-2 text-center">
                        <span className="font-bold text-green-700">{item.qtyAchievedPerBatch}</span>
                        <div className="text-xs text-green-600">{item.qtyPerBatch} - {item.productionLoss}</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setProductionData(prev => prev.filter(prevItem => prevItem.id !== item.id))}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductionShift;