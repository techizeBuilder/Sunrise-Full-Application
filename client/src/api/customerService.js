import { apiRequest } from './index';

export const customerApi = {
  // Get all customers
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    const token = localStorage.getItem('token');
    return apiRequest(`/customers${queryString ? `?${queryString}` : ''}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  // Get single customer by ID
  getById: (id) => {
    const token = localStorage.getItem('token');
    return apiRequest(`/customers/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  // Create new customer
  create: (customerData) => {
    const token = localStorage.getItem('token');
    return apiRequest('/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(customerData)
    });
  },

  // Update customer
  update: (id, updateData) => {
    const token = localStorage.getItem('token');
    return apiRequest(`/customers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });
  },

  // Delete customer
  delete: (id) => {
    const token = localStorage.getItem('token');
    return apiRequest(`/customers/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }
};