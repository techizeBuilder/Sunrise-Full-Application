import { apiRequest } from '../lib/queryClient';

// Brand API service
export const brandsApi = {
  // Get all brands
  getAll: () => apiRequest('GET', '/api/brands'),
  
  // Create new brand
  create: (brandData) => apiRequest('POST', '/api/brands', brandData),
  
  // Update brand
  update: (id, brandData) => apiRequest('PUT', `/api/brands/${id}`, brandData),
  
  // Delete brand
  delete: (id) => apiRequest('DELETE', `/api/brands/${id}`),
  
  // Get products by brand
  getProducts: (brandId) => apiRequest('GET', `/api/brands/${brandId}/products`)
};

export default brandsApi;