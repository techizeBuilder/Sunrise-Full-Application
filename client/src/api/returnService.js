import { apiRequest } from './index';

export const returnApi = {
  // Get all returns with filtering and pagination
  getAll: (params = {}) => {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    return apiRequest(`/returns${queryString ? `?${queryString}` : ''}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  // Get single return by ID
  getById: (id) => {
    const token = localStorage.getItem('token');
    return apiRequest(`/returns/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  // Create new return
  create: (returnData) => {
    const token = localStorage.getItem('token');
    return apiRequest('/returns', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(returnData)
    });
  },

  // Update return
  update: (id, updateData) => {
    const token = localStorage.getItem('token');
    return apiRequest(`/returns/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });
  },

  // Update return status only
  updateStatus: (id, status) => {
    const token = localStorage.getItem('token');
    return apiRequest(`/returns/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
  },

  // Delete return
  delete: (id) => {
    const token = localStorage.getItem('token');
    return apiRequest(`/returns/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  // Get return statistics
  getStats: () => {
    const token = localStorage.getItem('token');
    return apiRequest('/returns/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }
};

export default returnApi;