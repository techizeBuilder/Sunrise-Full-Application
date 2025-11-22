// Environment-based configuration for frontend
const getEnvironmentConfig = () => {
  // Get environment variables from .env files
  const nodeEnv = import.meta.env.VITE_NODE_ENV || import.meta.env.MODE;
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  
  // Determine environment
  const isProduction = nodeEnv === 'production' || 
                      import.meta.env.PROD ||
                      window.location.hostname === 'sunrize.shrawantravels.com' ||
                      window.location.hostname.includes('shrawantravels.com');
  
  const isDevelopment = !isProduction;
  
  // Use environment variable for base URL, with fallback logic
  let baseURL;
  
  if (apiBaseUrl) {
    baseURL = apiBaseUrl;
    console.log('🔧 Using VITE_API_BASE_URL from .env:', baseURL);
  } else if (isProduction) {
    baseURL = 'https://sunrize.shrawantravels.com';
    console.log('🌐 Production environment, using:', baseURL);
  } else {
    baseURL = 'http://localhost:5000';
    console.log('🔧 Development environment, using:', baseURL);
  }
  
  const config = {
    isDevelopment,
    isProduction,
    nodeEnv,
    baseURL,
    apiURL: `${baseURL}/api`,
    envSource: apiBaseUrl ? 'env file' : 'fallback detection'
  };
  
  console.log('🚀 Environment Config:', config);
  return config;
};

export const config = getEnvironmentConfig();
export default config;