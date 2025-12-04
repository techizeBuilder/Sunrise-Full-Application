import { apiRequest } from '../lib/queryClient';

export const packingService = {
  // Get production groups with item details for packing
  getProductionGroupsForPacking: async () => {
    try {
      return await apiRequest('GET', '/api/packing/production-groups');
    } catch (error) {
      console.error('Error fetching production groups for packing:', error);
      throw error;
    }
  },

  // Get all packing sheets (with optional filters)
  getPackingSheets: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const url = `/api/packing/sheets${queryParams ? `?${queryParams}` : ''}`;
      return await apiRequest('GET', url);
    } catch (error) {
      console.error('Error fetching packing sheets:', error);
      throw error;
    }
  },

  // Get specific packing sheet by ID
  getPackingSheetById: async (packingSheetId) => {
    try {
      return await apiRequest('GET', `/api/packing/sheets/${packingSheetId}`);
    } catch (error) {
      console.error('Error fetching packing sheet:', error);
      throw error;
    }
  },

  // Create a new packing sheet
  createPackingSheet: async (packingData) => {
    try {
      return await apiRequest('POST', '/api/packing/sheets', packingData);
    } catch (error) {
      console.error('Error creating packing sheet:', error);
      throw error;
    }
  },

  // Start packing timing (punch in)
  startPackingTiming: async (packingSheetId) => {
    try {
      return await apiRequest('POST', `/api/packing/sheets/${packingSheetId}/start`);
    } catch (error) {
      console.error('Error starting packing timing:', error);
      throw error;
    }
  },

  // Stop packing timing (punch out)
  stopPackingTiming: async (packingSheetId) => {
    try {
      return await apiRequest('POST', `/api/packing/sheets/${packingSheetId}/stop`);
    } catch (error) {
      console.error('Error stopping packing timing:', error);
      throw error;
    }
  },

  // Update packing loss (manual entry)
  updatePackingLoss: async (packingSheetId, packingLoss) => {
    try {
      return await apiRequest('PUT', `/api/packing/sheets/${packingSheetId}/loss`, {
        packingLoss
      });
    } catch (error) {
      console.error('Error updating packing loss:', error);
      throw error;
    }
  },

  // Update item quantities in packing sheet
  updatePackingQuantities: async (packingSheetId, items) => {
    try {
      return await apiRequest('PUT', `/api/packing/sheets/${packingSheetId}/quantities`, {
        items
      });
    } catch (error) {
      console.error('Error updating packing quantities:', error);
      throw error;
    }
  },

  // Get packing statistics
  getPackingStats: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const url = `/api/packing/stats${queryParams ? `?${queryParams}` : ''}`;
      return await apiRequest('GET', url);
    } catch (error) {
      console.error('Error fetching packing stats:', error);
      throw error;
    }
  }
};

export default packingService;