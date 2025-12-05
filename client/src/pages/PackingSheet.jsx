import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { config } from '@/config/environment';
import { useToast } from '@/hooks/use-toast';

export default function PackingSheet() {
  const { toast } = useToast();
  const [packingData, setPackingData] = useState([]);
  const [groupTimings, setGroupTimings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPackingData();
  }, []);

  const loadPackingData = async () => {
    try {
      setLoading(true);
      
      console.log('🔄 Loading production groups for packing sheet...');
      
      // Fetch production groups from the correct API
      const response = await fetch(`${config.baseURL}/api/packing/production-groups`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('📦 Production groups API response:', result);
      
      if (result.success && result.data.productionGroups) {
        // Transform API data to match packing sheet structure
        const transformedData = result.data.productionGroups.map((group, index) => ({
          slNo: index + 1,
          productGroup: group.name,
          groupDescription: group.description || '',
          groupId: group._id,
          // Group-level quantities (main totals)
          groupIndentQty: group.qtyPerBatch || 0,
          groupProducedQty: group.qtyAchievedPerBatch || 0,
          items: group.items.map(item => ({
            name: item.name,
            id: item._id,
            // Use item-specific quantities from the API
            indentQty: item.producedQty || 0, // This maps to qtyPerBatch from group
            producedQty: item.achievedQty || 0, // This maps to qtyAchievedPerBatch from group
            packedQty: item.packedQty || 0,
            notes: item.notes || '',
            currentStock: item.currentStock || 0
          }))
        }));
        
        console.log('✅ Transformed packing data:', transformedData);
        setPackingData(transformedData);
        
        toast({
          title: 'Success',
          description: `Loaded ${transformedData.length} production groups for packing`,
        });
      } else {
        throw new Error(result.message || 'Failed to fetch production groups');
      }
    } catch (error) {
      console.error('❌ Failed to load packing data from API:', error);
      
      toast({
        title: 'Error',
        description: 'Failed to load packing data. Please refresh and try again.',
        variant: 'destructive'
      });
      
      // Set empty data instead of sample data
      setPackingData([]);
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
      console.log('🔄 Saving punch-in time for group:', packingData[groupIndex].productGroup);
      
      // Save punch-in time to backend
      const packingSheetData = {
        productionGroupId: packingData[groupIndex].groupId,
        productionGroupName: packingData[groupIndex].productGroup,
        packingStartTime: now.toISOString(),
        status: 'in_progress',
        items: packingData[groupIndex].items.map(item => ({
          productId: item.id,
          productName: item.name,
          indentQty: parseFloat(item.indentQty) || 0,
          producedQty: parseFloat(item.producedQty) || 0,
          packedQty: parseFloat(item.packedQty) || 0,
          packingLoss: 0,
          notes: item.notes || ''
        }))
      };
      
      const response = await fetch(`${config.baseURL}/api/packing/packing-sheets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(packingSheetData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Punch-in time saved successfully:', result);
        toast({
          title: 'Success',
          description: `Punch-in recorded for ${packingData[groupIndex].productGroup}`,
        });
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error saving punch-in time:', error);
      toast({
        title: 'Warning',
        description: 'Punch-in recorded locally, but could not save to server',
        variant: 'destructive'
      });
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
    
    // Auto-save after 2 seconds of no changes
    clearTimeout(window.autoSaveTimer);
    window.autoSaveTimer = setTimeout(async () => {
      try {
        console.log('🔄 Auto-saving packing data for group:', packingData[groupIndex].productGroup);
        
        // Prepare data for API call
        const packingSheetData = {
          productionGroupId: packingData[groupIndex].groupId,
          productionGroupName: packingData[groupIndex].productGroup,
          status: 'in_progress',
          items: packingData[groupIndex].items.map(item => ({
            productId: item.id,
            productName: item.name,
            indentQty: parseFloat(item.indentQty) || 0,
            producedQty: parseFloat(item.producedQty) || 0,
            packedQty: parseFloat(item.packedQty) || 0,
            packingLoss: 0,
            notes: item.notes || ''
          }))
        };
        
        // Save to backend using the correct API
        const response = await fetch(`${config.baseURL}/api/packing/packing-sheets`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(packingSheetData)
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ Data auto-saved successfully:', result);
        } else {
          console.warn('⚠️ Auto-save failed with status:', response.status);
        }
      } catch (error) {
        console.error('❌ Auto-save error:', error);
        // Don't show error to user for auto-save, just log it
      }
    }, 2000);
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-full mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Packing Sheet</h1>
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-lg text-gray-600">Loading production groups...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 lg:p-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Packing Sheet</h1>
            <button
              onClick={loadPackingData}
              disabled={loading}
              className="bg-blue-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2 text-sm sm:text-base"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Main Table */}
        {packingData.length === 0 ? (
          <div className="text-center py-8 sm:py-12 border-2 border-dashed border-gray-300 rounded-lg bg-white mx-2 sm:mx-0">
            <svg className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V6a1 1 0 00-1-1H7a1 1 0 00-1 1v1m12 0H5" />
            </svg>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Production Groups Found</h3>
            <p className="text-sm sm:text-base text-gray-500 mb-4 px-4">
              No production groups are available for packing. Please check if production groups have been created.
            </p>
            <button
              onClick={loadPackingData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm sm:text-base"
            >
              Refresh Data
            </button>
          </div>
        ) : (
          /* Responsive Table Container */
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {/* Mobile/Tablet: Horizontal Scroll */}
            <div className="overflow-x-auto">
              <div className="min-w-[800px]"> {/* Minimum width for proper table display */}
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-yellow-300">
                      <th className="border border-gray-900 px-2 sm:px-4 py-2 sm:py-3 text-center font-bold text-xs sm:text-sm">
                        SL NO.
                      </th>
                      <th className="border border-gray-900 px-2 sm:px-4 py-2 sm:py-3 text-center font-bold text-xs sm:text-sm min-w-[120px] sm:min-w-[150px]">
                        Product Group<br />with Product
                      </th>
                      <th className="border border-gray-900 px-2 sm:px-4 py-2 sm:py-3 text-center font-bold text-xs sm:text-sm min-w-[80px] sm:min-w-[100px]">
                        Indent Qty
                      </th>
                      <th className="border border-gray-900 px-2 sm:px-4 py-2 sm:py-3 text-center font-bold text-xs sm:text-sm min-w-[80px] sm:min-w-[100px]">
                        Produced Qty
                      </th>
                      <th className="border border-gray-900 px-2 sm:px-4 py-2 sm:py-3 text-center font-bold text-xs sm:text-sm min-w-[100px] sm:min-w-[120px]">
                        Packing Start<br />time
                      </th>
                      <th className="border border-gray-900 px-2 sm:px-4 py-2 sm:py-3 text-center font-bold text-xs sm:text-sm min-w-[80px] sm:min-w-[100px]">
                        Packing loss
                      </th>
                      <th className="border border-gray-900 px-2 sm:px-4 py-2 sm:py-3 text-center font-bold text-xs sm:text-sm min-w-[80px] sm:min-w-[100px]">
                        Qty Packed
                      </th>
                      <th className="border border-gray-900 px-2 sm:px-4 py-2 sm:py-3 text-center font-bold text-xs sm:text-sm min-w-[100px] sm:min-w-[120px]">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody>{/* Table content */}
              {packingData.map((group, groupIndex) => (
                <React.Fragment key={groupIndex}>
                  {group.items.map((item, itemIndex) => (
                    <tr key={`${groupIndex}-${itemIndex}`} className="hover:bg-gray-50 border-b border-gray-200">
                      {/* SL NO. - only show for first item of each group */}
                      <td className="border border-gray-900 px-2 sm:px-4 py-2 text-center text-xs sm:text-sm">
                        {itemIndex === 0 ? group.slNo : ''}
                      </td>
                      
                      {/* Product Group with Product */}
                      <td className="border border-gray-900 px-2 sm:px-4 py-2">
                        {itemIndex === 0 ? (
                          <div>
                            <div className="font-semibold text-center mb-1 text-xs sm:text-sm">
                              {group.productGroup}
                            </div>
                            <div className="text-xs">{item.name}</div>
                          </div>
                        ) : (
                          <div className="text-xs pl-2 sm:pl-4">{item.name}</div>
                        )}
                      </td>
                      
                      {/* Indent Qty */}
                      <td className="border border-gray-900 px-1 sm:px-2 py-2">
                        <div className="w-full text-center bg-gray-100 px-2 py-1 rounded text-xs sm:text-sm min-h-[32px] flex items-center justify-center text-gray-600">
                          {item.indentQty || 0}
                        </div>
                      </td>
                      
                      {/* Produced Qty */}
                      <td className="border border-gray-900 px-1 sm:px-2 py-2">
                        <div className="w-full text-center bg-gray-100 px-2 py-1 rounded text-xs sm:text-sm min-h-[32px] flex items-center justify-center text-gray-600">
                          {item.producedQty || 0}
                        </div>
                      </td>
                      
                      {/* Packing Start time - show timing for first item of each group */}
                      <td className="border border-gray-900 px-1 sm:px-2 py-2 text-center">
                        {itemIndex === 0 ? (
                          groupTimings[groupIndex]?.punchedIn ? (
                            <span className="text-green-600 font-medium text-xs sm:text-sm">
                              {groupTimings[groupIndex].startTime}
                            </span>
                          ) : (
                            <button
                              onClick={() => handlePunchIn(groupIndex)}
                              className="bg-blue-500 text-white px-2 sm:px-3 py-1 rounded text-xs hover:bg-blue-600 transition-colors whitespace-nowrap"
                            >
                              Punch In
                            </button>
                          )
                        ) : ''}
                      </td>
                      
                      {/* Packing loss - editable for each item */}
                      <td className="border border-gray-900 px-1 sm:px-2 py-2">
                        <Input
                          type="number"
                          value={item.packingLoss || 0}
                          onChange={(e) => handleItemChange(groupIndex, itemIndex, 'packingLoss', e.target.value)}
                          className="w-full text-center border-0 focus:ring-1 focus:ring-blue-500 text-xs sm:text-sm min-h-[32px]"
                          placeholder="0"
                        />
                      </td>
                      
                      {/* Qty Packed */}
                      <td className="border border-gray-900 px-1 sm:px-2 py-2">
                        <div className="w-full text-center bg-gray-100 px-2 py-1 rounded text-xs sm:text-sm min-h-[32px] flex items-center justify-center text-gray-600">
                          {item.packedQty || 0}
                        </div>
                      </td>
                      
                      {/* Notes */}
                      <td className="border border-gray-900 px-1 sm:px-2 py-2">
                        <Input
                          type="text"
                          value={item.notes}
                          onChange={(e) => handleItemChange(groupIndex, itemIndex, 'notes', e.target.value)}
                          className="w-full border-0 focus:ring-1 focus:ring-blue-500 text-xs sm:text-sm min-h-[32px]"
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
            </div>
          </div>
        )}

        {/* Auto-save indicator - only show when there's data */}
        {packingData.length > 0 && (
          <div className="flex justify-center mt-6">
            <div className="text-sm text-gray-500">
              Changes are automatically saved
            </div>
          </div>
        )}
      </div>
    </div>
  );
}