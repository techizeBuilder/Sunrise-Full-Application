// Test the sales API fix
const http = require('http');

async function testSalesAPI() {
  console.log('Testing sales API fix...');
  
  try {
    // First, login to get a token
    const loginData = JSON.stringify({ username: 'dsad', password: 'dsad' });
    
    const loginOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
      }
    };

    const token = await new Promise((resolve, reject) => {
      const req = http.request(loginOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.token) {
              resolve(response.token);
            } else {
              reject(new Error('No token in response: ' + data));
            }
          } catch (e) {
            reject(new Error('Failed to parse login response: ' + data));
          }
        });
      });
      
      req.on('error', reject);
      req.write(loginData);
      req.end();
    });

    console.log('✅ Login successful, token obtained');

    // Now test the sales customers API
    const testOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/sales/my-customers',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const result = await new Promise((resolve, reject) => {
      const req = http.request(testOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve({ status: res.statusCode, data: response });
          } catch (e) {
            resolve({ status: res.statusCode, data: data });
          }
        });
      });
      
      req.on('error', reject);
      req.end();
    });

    console.log('📊 Sales customers API test result:', {
      status: result.status,
      success: result.status === 200,
      dataType: typeof result.data,
      hasError: result.data.message && result.data.message.includes('error')
    });

    if (result.status !== 200 || (result.data.message && result.data.message.includes('error'))) {
      console.log('❌ API Error:', result.data);
      return false;
    } else {
      console.log('✅ Sales customers API is working correctly!');
      return true;
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
testSalesAPI().then(success => {
  console.log(success ? '🎉 All tests passed!' : '💥 Tests failed');
  process.exit(success ? 0 : 1);
});