import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { packingService } from '../api/packingService';

export default function PackingSheet() {
  const [packingData, setPackingData] = useState([]);
  const [groupTimings, setGroupTimings] = useState({});
  const [loading, setLoading] = useState(true);

  // Sample data that matches your image structure
  const sampleData = [
    {
      slNo: 1,
      productGroup: 'PM 400',
      items: [
        { name: 'GT Milk 400', indentQty: '', producedQty: '', packedQty: '', notes: '' },
        { name: 'RRL Milk', indentQty: '', producedQty: '', packedQty: '', notes: '' },
        { name: 'DMart - Milk', indentQty: '', producedQty: '', packedQty: '', notes: '' },
        { name: 'District Milk', indentQty: '', producedQty: '', packedQty: '', notes: '' }
      ]
    },
    {
      slNo: 2,
      productGroup: 'SW 400',
      items: [
        { name: 'RRL SW', indentQty: '', producedQty: '', packedQty: '', notes: '' },
        { name: 'GT SW', indentQty: '', producedQty: '', packedQty: '', notes: '' }
      ]
    },
    {
      slNo: 3,
      productGroup: 'Brown',
      items: [
        { name: 'RRL Brown', indentQty: '', producedQty: '', packedQty: '', notes: '' },
        { name: 'GT Brown', indentQty: '', producedQty: '', packedQty: '', notes: '' }
      ]
    },
    {
      slNo: 4,
      productGroup: 'SW-800',
      items: [
        { name: 'SW-800', indentQty: '', producedQty: '', packedQty: '', notes: '' }
      ]
    },
    {
      slNo: 5,
      productGroup: 'PAV-200',
      items: [
        { name: 'PAV-200', indentQty: '', producedQty: '', packedQty: '', notes: '' }
      ]
    }
  ];

  useEffect(() => {
    loadPackingData();
  }, []);

  const loadPackingData = async () => {
    try {
      setLoading(true);
      // Call the backend API to get production groups
      const response = await packingService.getProductionGroupsForPacking();
      
      if (response.success && response.data.productionGroups) {
        // Transform API data to match our component structure
        const transformedData = response.data.productionGroups.map((group, index) => ({
          slNo: index + 1,
          productGroup: group.name,
          items: group.items.map(item => ({
            name: item.name,
            indentQty: item.indentQty || '',
            producedQty: item.producedQty || '',
            packedQty: '',
            notes: ''
          }))
        }));
        
        setPackingData(transformedData);
      } else {
        // Fallback to sample data if API fails
        console.warn('API response not successful, using sample data');
        setPackingData(sampleData);
      }
    } catch (error) {
      console.error('Failed to load packing data from API:', error);
      // Fallback to sample data
      console.log('Using sample data as fallback');
      setPackingData(sampleData);
    } finally {
      setLoading(false);
    }
  };

  const handlePunchIn = async (groupIndex) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    
    // Update local state
    setGroupTimings(prev => ({
      ...prev,
      [groupIndex]: {
        ...prev[groupIndex],
        startTime: timeString,
        punchedIn: true
      }
    }));
    
    try {
      // Try to save punch-in time to backend
      const packingSheetData = {
        productionGroupName: packingData[groupIndex].productGroup,
        packingStartTime: now.toISOString(),
        items: packingData[groupIndex].items.map(item => ({
          productName: item.name,
          indentQty: parseFloat(item.indentQty) || 0,
          producedQty: parseFloat(item.producedQty) || 0,
          packedQty: parseFloat(item.packedQty) || 0,
          notes: item.notes || ''
        }))
      };
      
      const response = await packingService.createPackingSheet(packingSheetData);
      
      if (response.success) {
        console.log('Punch-in time saved successfully');
      } else {
        console.warn('Failed to save punch-in time:', response.message);
      }
    } catch (error) {
      console.error('Error saving punch-in time:', error);
      // Don't block UI if backend fails
    }
  };

  const formatCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const handleItemChange = (groupIndex, itemIndex, field, value) => {
    setPackingData(prev => {
      const newData = [...prev];
      newData[groupIndex].items[itemIndex][field] = value;
      return newData;
    });
    
    // Auto-save after 1 second of no changes
    clearTimeout(window.autoSaveTimer);
    window.autoSaveTimer = setTimeout(async () => {
      try {
        console.log('Auto-saving packing data...');
        
        // Prepare data for API call
        const packingSheetData = {
          productionGroupName: packingData[groupIndex].productGroup,
          items: packingData[groupIndex].items.map(item => ({
            productName: item.name,
            indentQty: parseFloat(item.indentQty) || 0,
            producedQty: parseFloat(item.producedQty) || 0,
            packedQty: parseFloat(item.packedQty) || 0,
            notes: item.notes || ''
          }))
        };
        
        // Try to save to backend
        const response = await packingService.createPackingSheet(packingSheetData);
        
        if (response.success) {
          console.log('Data auto-saved successfully');
        } else {
          console.warn('Auto-save failed:', response.message);
        }
      } catch (error) {
        console.error('Auto-save error:', error);
        // Don't show error to user for auto-save, just log it
      }
    }, 1000);
  };



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading packing sheet...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Packing Sheet</h1>
        </div>

        {/* Main Table */}
        <div className="border border-gray-900 rounded-lg overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-yellow-300">
                <th className="border border-gray-900 px-4 py-3 text-center font-bold">SL NO.</th>
                <th className="border border-gray-900 px-4 py-3 text-center font-bold">
                  Product Group<br />with Product
                </th>
                <th className="border border-gray-900 px-4 py-3 text-center font-bold">Indent Qty</th>
                <th className="border border-gray-900 px-4 py-3 text-center font-bold">Produced Qty</th>
                <th className="border border-gray-900 px-4 py-3 text-center font-bold">
                  Packing Start<br />time
                </th>
                <th className="border border-gray-900 px-4 py-3 text-center font-bold">Packing loss</th>
                <th className="border border-gray-900 px-4 py-3 text-center font-bold">Qty Packed</th>
                <th className="border border-gray-900 px-4 py-3 text-center font-bold">Notes</th>
              </tr>
            </thead>
            <tbody>
              {packingData.map((group, groupIndex) => (
                <React.Fragment key={groupIndex}>
                  {group.items.map((item, itemIndex) => (
                    <tr key={`${groupIndex}-${itemIndex}`} className="hover:bg-gray-50">
                      {/* SL NO. - only show for first item of each group */}
                      <td className="border border-gray-900 px-4 py-2 text-center">
                        {itemIndex === 0 ? group.slNo : ''}
                      </td>
                      
                      {/* Product Group with Product */}
                      <td className="border border-gray-900 px-4 py-2">
                        {itemIndex === 0 ? (
                          <div>
                            <div className="font-semibold text-center mb-1">
                              {group.productGroup}
                            </div>
                            <div className="text-sm">{item.name}</div>
                          </div>
                        ) : (
                          <div className="text-sm pl-4">{item.name}</div>
                        )}
                      </td>
                      
                      {/* Indent Qty */}
                      <td className="border border-gray-900 px-2 py-2">
                        <Input
                          type="number"
                          value={item.indentQty}
                          onChange={(e) => handleItemChange(groupIndex, itemIndex, 'indentQty', e.target.value)}
                          className="w-full text-center border-0 focus:ring-1 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </td>
                      
                      {/* Produced Qty */}
                      <td className="border border-gray-900 px-2 py-2">
                        <Input
                          type="number"
                          value={item.producedQty}
                          onChange={(e) => handleItemChange(groupIndex, itemIndex, 'producedQty', e.target.value)}
                          className="w-full text-center border-0 focus:ring-1 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </td>
                      
                      {/* Packing Start time - show timing for first item of each group */}
                      <td className="border border-gray-900 px-2 py-2 text-center">
                        {itemIndex === 0 ? (
                          groupTimings[groupIndex]?.punchedIn ? (
                            <span className="text-green-600 font-medium">
                              {groupTimings[groupIndex].startTime}
                            </span>
                          ) : (
                            <button
                              onClick={() => handlePunchIn(groupIndex)}
                              className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
                            >
                              Punch In
                            </button>
                          )
                        ) : ''}
                      </td>
                      
                      {/* Packing loss - show loss for first item of each group */}
                      <td className="border border-gray-900 px-2 py-2 text-center">
                        {itemIndex === 0 ? '0' : ''}
                      </td>
                      
                      {/* Qty Packed */}
                      <td className="border border-gray-900 px-2 py-2">
                        <Input
                          type="number"
                          value={item.packedQty}
                          onChange={(e) => handleItemChange(groupIndex, itemIndex, 'packedQty', e.target.value)}
                          className="w-full text-center border-0 focus:ring-1 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </td>
                      
                      {/* Notes */}
                      <td className="border border-gray-900 px-2 py-2">
                        <Input
                          type="text"
                          value={item.notes}
                          onChange={(e) => handleItemChange(groupIndex, itemIndex, 'notes', e.target.value)}
                          className="w-full border-0 focus:ring-1 focus:ring-blue-500"
                          placeholder="Enter notes..."
                        />
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Auto-save indicator */}
        <div className="flex justify-center mt-6">
          <div className="text-sm text-gray-500">
            Changes are automatically saved
          </div>
        </div>
      </div>
    </div>
  );
}