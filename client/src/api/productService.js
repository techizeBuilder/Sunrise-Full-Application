import { apiRequest } from '../lib/queryClient';

// Product API service
export const productsApi = {
  // Get all products with filtering and pagination
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.brandId) queryParams.append('brandId', params.brandId);
    if (params.search) queryParams.append('search', params.search);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    
    const queryString = queryParams.toString();
    return apiRequest('GET', `/api/products${queryString ? `?${queryString}` : ''}`);
  },
  
  // Get single product
  getById: (id) => apiRequest('GET', `/api/products/${id}`),
  
  // Create new product
  create: (productData) => apiRequest('POST', '/api/products', productData),
  
  // Update product
  update: (id, productData) => apiRequest('PUT', `/api/products/${id}`, productData),
  
  // Delete product
  delete: (id) => apiRequest('DELETE', `/api/products/${id}`),
  
  // Get products by brand
  getByBrand: (brandId) => apiRequest('GET', `/api/brands/${brandId}/products`)
};

export default productsApi;