// Environment-based configuration for frontend
const getEnvironmentConfig = () => {
  // In production, Vite replaces import.meta.env with actual values
  const isDevelopment = import.meta.env.VITE_NODE_ENV === 'development' || 
                       import.meta.env.DEV || 
                       !import.meta.env.VITE_NODE_ENV;
  
  // Get base URL from environment or determine automatically
  let baseURL;
  
  if (import.meta.env.VITE_API_BASE_URL) {
    // Use explicit environment variable if set
    baseURL = import.meta.env.VITE_API_BASE_URL;
  } else if (isDevelopment) {
    // Development: use localhost
    baseURL = 'http://localhost:5000';
  } else {
    // Production: use current origin or fallback to production URL
    baseURL = window.location.origin.includes('localhost') 
      ? 'http://localhost:5000' 
      : 'https://sunrize.shrawantravels.com';
  }
  
  return {
    isDevelopment,
    isProduction: !isDevelopment,
    baseURL,
    apiURL: `${baseURL}/api`,
  };
};

export const config = getEnvironmentConfig();
export default config;