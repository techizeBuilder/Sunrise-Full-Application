// Test customer filtering API
const http = require('http');

async function testCustomerFiltering() {
  console.log('Testing customer filtering API...');
  
  try {
    // Login first to get token
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

    console.log('✅ Login successful');

    // Test different filter combinations
    const testCases = [
      { 
        description: 'All customers', 
        query: '' 
      },
      { 
        description: 'Active customers', 
        query: 'status=active' 
      },
      { 
        description: 'Inactive customers', 
        query: 'status=inactive' 
      },
      { 
        description: 'City filter (surat)', 
        query: 'city=surat' 
      },
      { 
        description: 'Combined filter (city=surat, status=inactive)', 
        query: 'city=surat&status=inactive' 
      },
      { 
        description: 'Search filter', 
        query: 'search=test' 
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n🧪 Testing: ${testCase.description}`);
      
      const testOptions = {
        hostname: 'localhost',
        port: 5000,
        path: `/api/super-admin/customers?${testCase.query}`,
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

      if (result.status === 200) {
        const customers = result.data.data?.customers || [];
        const summary = result.data.data?.summary || {};
        console.log(`   ✅ Success: ${customers.length} customers returned`);
        console.log(`   📊 Summary: ${summary.totalCustomers} total, ${summary.activeCustomers} active`);
        
        if (customers.length > 0) {
          const sampleCustomer = customers[0];
          console.log(`   🔍 Sample: ${sampleCustomer.name} (${sampleCustomer.city}, ${sampleCustomer.active})`);
        }
      } else {
        console.log(`   ❌ Failed: Status ${result.status}`);
        console.log(`   Error: ${JSON.stringify(result.data)}`);
      }
    }

    console.log('\n🎉 Customer filter testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testCustomerFiltering();