import { apiRequest } from './index';

export const salesApi = {
  // Get sales dashboard summary
  getDashboardSummary: () => {
    const token = localStorage.getItem('token');
    return apiRequest('/sales/summary', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  // Get recent orders for sales dashboard
  getRecentOrders: (limit = 5) => {
    const token = localStorage.getItem('token');
    return apiRequest(`/sales/recent-orders?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  // Get sales person orders (company-filtered)
  getMyOrders: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    const token = localStorage.getItem('token');
    return apiRequest(`/sales/orders${queryString ? `?${queryString}` : ''}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  // Get sales person customers (company-filtered)
  getMyCustomers: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    const token = localStorage.getItem('token');
    return apiRequest(`/sales/my-customers${queryString ? `?${queryString}` : ''}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  // Get sales customers (unified endpoint for sales personnel)
  getCustomers: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    const token = localStorage.getItem('token');
    return apiRequest(`/sales/customers${queryString ? `?${queryString}` : ''}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  // Get sales person deliveries (company-filtered)
  getMyDeliveries: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    const token = localStorage.getItem('token');
    return apiRequest(`/sales/my-deliveries${queryString ? `?${queryString}` : ''}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  // Get sales person invoices (company-filtered)
  getMyInvoices: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    const token = localStorage.getItem('token');
    return apiRequest(`/sales/my-invoices${queryString ? `?${queryString}` : ''}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  // Get sales person refund/returns (company-filtered)
  getMyRefundReturns: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    const token = localStorage.getItem('token');
    return apiRequest(`/sales/refund-return${queryString ? `?${queryString}` : ''}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  // Get sales person items (company-filtered)
  getMyItems: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    const token = localStorage.getItem('token');
    return apiRequest(`/api/sales/items${queryString ? `?${queryString}` : ''}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }
};