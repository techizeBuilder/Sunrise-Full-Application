import fetch from 'node-fetch';

// Test settings API endpoints
const testSettingsAPI = async () => {
  try {
    // First test login
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin', // Use your admin credentials
        email: 'admin@company.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (!loginData.success) {
      console.error('Login failed:', loginData.message);
      return;
    }
    
    const token = loginData.token;
    console.log('Token:', token);
    
    // Test settings endpoint
    console.log('\n=== Testing Settings API ===');
    const settingsResponse = await fetch('http://localhost:5000/api/settings', {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const settingsData = await settingsResponse.text();
    console.log('Settings response status:', settingsResponse.status);
    console.log('Settings response:', settingsData);
    
    // Test company settings endpoint
    console.log('\n=== Testing Company Settings API ===');
    const companyResponse = await fetch('http://localhost:5000/api/settings/company', {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test Company Name'
      })
    });
    
    const companyData = await companyResponse.text();
    console.log('Company response status:', companyResponse.status);
    console.log('Company response:', companyData);
    
  } catch (error) {
    console.error('Test error:', error);
  }
};

testSettingsAPI();