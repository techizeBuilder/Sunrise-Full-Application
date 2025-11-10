const API_BASE_URL = '/api';

class APIService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = { message: await response.text() };
      }
      
      if (!response.ok) {
        // Create a detailed error object with server response
        const error = new Error(data.message || `HTTP error! status: ${response.status}`);
        error.status = response.status;
        error.data = data;
        error.success = data.success || false;
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      
      // If it's a network error (no response), mark it as such
      if (!error.status && error.message.includes('fetch')) {
        error.isNetworkError = true;
        error.message = 'Unable to connect to the server. Please check your internet connection.';
        console.error('[NETWORK] Connection Problem:', error);
      }
      
      throw error;
    }
  }

  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Auth specific methods
  async login(credentials) {
    const response = await this.post('/auth/login', credentials);
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    return response;
  }

  async logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return this.post('/auth/logout');
  }

  async getCurrentUser() {
    return this.get('/auth/me');
  }

  // Profile methods
  async updateProfile(data) {
    return this.put('/profile', data);
  }

  async changePassword(data) {
    return this.put('/profile/password', data);
  }

  async uploadProfilePicture(file) {
    const formData = new FormData();
    formData.append('picture', file);
    return this.request('/profile/picture', {
      method: 'POST',
      body: formData,
      headers: { ...this.getAuthHeaders() }
    });
  }

  async resetUserPassword(userId, data) {
    return this.post(`/users/${userId}/reset-password`, data);
  }

  // Excel export methods - handle file downloads
  async exportCategoriesToExcel() {
    return this.downloadFile('/inventory/categories/export');
  }

  async exportCustomerCategoriesToExcel() {
    return this.downloadFile('/inventory/customer-categories/export');
  }

  async exportCustomersToExcel() {
    return this.downloadFile('/customers/export');
  }

  async importCustomersFromExcel(file) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request('/customers/import', {
      method: 'POST',
      body: formData,
      headers: { ...this.getAuthHeaders() }
    });
  }

  async exportSuppliersToExcel() {
    return this.downloadFile('/suppliers/export');
  }

  async importSuppliersFromExcel(file) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request('/suppliers/import', {
      method: 'POST',
      body: formData,
      headers: { ...this.getAuthHeaders() }
    });
  }

  async exportItemsToExcel() {
    return this.downloadFile('/inventory/items/export');
  }

  // File download method for Excel exports
  async downloadFile(endpoint) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'export.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      // Convert response to blob and trigger download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      return { success: true, message: 'File downloaded successfully' };
    } catch (error) {
      console.error('File download error:', error);
      throw error;
    }
  }

  // Data fetching methods for client-side Excel export
  async getItems() {
    return this.request('/items');
  }

  async getCategories() {
    return this.request('/categories');
  }

  async getCustomerCategories() {
    return this.request('/customer-categories');
  }

  async getCustomers() {
    return this.request('/customers');
  }

  async getSuppliers() {
    return this.request('/suppliers');
  }

  async importItemsFromExcel(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    // Don't set Content-Type manually, let browser set it with boundary
    const headers = { ...this.getAuthHeaders() };
    delete headers['Content-Type'];
    
    return this.request('/inventory/items/import', {
      method: 'POST',
      body: formData,
      headers
    });
  }

  async importCustomersFromExcel(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const headers = { ...this.getAuthHeaders() };
    delete headers['Content-Type'];
    
    return this.request('/customers/import', {
      method: 'POST',
      body: formData,
      headers
    });
  }

  async importSuppliersFromExcel(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const headers = { ...this.getAuthHeaders() };
    delete headers['Content-Type'];
    
    return this.request('/suppliers/import', {
      method: 'POST',
      body: formData,
      headers
    });
  }
}

export const api = new APIService();
export default api;