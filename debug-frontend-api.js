// Debug test to check actual API calls in browser

// Test the frontend API calling mechanism
console.log('🔍 DEBUGGING FRONTEND API CALLS');

// Simulate what ProductSelector should do
const testFrontendAPICall = () => {
  // Get the token like the components do
  const token = localStorage.getItem('token');
  console.log('Token exists:', !!token);
  
  // Import the apiRequest function (this will work in browser console)
  const apiRequest = (method, url, data) => {
    console.log(`API Request: ${method} ${url}`, data || '(no data)');
    console.log('Token available:', token ? 'Yes' : 'No');

    return fetch(`/api${url}`, {
      method,
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...(token && { "Authorization": `Bearer ${token}` })
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
  };
  
  // Test the sales items call
  console.log('🧪 Testing apiRequest call...');
  return apiRequest('GET', '/sales/items')
    .then(res => {
      console.log('✅ Response status:', res.status);
      console.log('✅ Response URL:', res.url);
      return res.json();
    })
    .then(data => {
      console.log('✅ Response data:', data);
      return data;
    })
    .catch(error => {
      console.error('❌ Error:', error);
      throw error;
    });
};

// Instructions for testing
console.log(`
🎯 DEBUGGING INSTRUCTIONS:

1. Open browser console on localhost:5000
2. Login as sales user (priyansh/12345678)  
3. Run: testFrontendAPICall()
4. Check the Network tab for the actual URL being called

Expected URL: http://localhost:5000/api/sales/items
If you see: http://localhost:5000/sales/items (missing /api)
Then there's a different apiRequest being used.

Copy this to browser console:
`);

// Make available globally for browser testing
if (typeof window !== 'undefined') {
  window.testFrontendAPICall = testFrontendAPICall;
}

console.log('testFrontendAPICall =', testFrontendAPICall.toString());