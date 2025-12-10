// Test script for Priority Products API endpoints
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testPriorityProductsAPI() {
  try {
    console.log('🧪 Testing Sales Priority Products API...\n');

    // You'll need to get a valid token for a Sales user
    const token = 'YOUR_SALES_JWT_TOKEN'; // Replace with actual token

    // Test 1: Get Priority Products
    console.log('1️⃣ Testing GET /api/sales/priority-products');
    const response1 = await fetch(`${BASE_URL}/api/sales/priority-products`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data1 = await response1.json();
    console.log('Response:', response1.status, data1.success ? '✅' : '❌');
    console.log('Priority Products Count:', data1.data?.products?.length || 0);
    console.log('');

    // Test 2: Add Priority Product (replace with actual product ID)
    const testProductId = '675696e9e48de0173a31faeb'; // Replace with actual product ID
    console.log('2️⃣ Testing POST /api/sales/priority-products');
    const response2 = await fetch(`${BASE_URL}/api/sales/priority-products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        productId: testProductId,
        priority: 1
      })
    });

    const data2 = await response2.json();
    console.log('Response:', response2.status, data2.success ? '✅' : '❌');
    console.log('Message:', data2.message);
    console.log('');

    // Test 3: Get Priority Products Again (should show the added product)
    console.log('3️⃣ Testing GET /api/sales/priority-products (after adding)');
    const response3 = await fetch(`${BASE_URL}/api/sales/priority-products`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data3 = await response3.json();
    console.log('Response:', response3.status, data3.success ? '✅' : '❌');
    console.log('Priority Products Count:', data3.data?.products?.length || 0);
    if (data3.data?.products?.length > 0) {
      console.log('Sample Product:', data3.data.products[0]);
    }
    console.log('');

    // Test 4: Remove Priority Product (if one exists)
    if (data3.data?.products?.length > 0) {
      const priorityId = data3.data.products[0].priorityId;
      console.log('4️⃣ Testing DELETE /api/sales/priority-products/:id');
      const response4 = await fetch(`${BASE_URL}/api/sales/priority-products/${priorityId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data4 = await response4.json();
      console.log('Response:', response4.status, data4.success ? '✅' : '❌');
      console.log('Message:', data4.message);
    }

  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

// Instructions for running the test
console.log('📋 Instructions for Testing:');
console.log('1. Make sure the server is running on port 5000');
console.log('2. Get a valid JWT token for a Sales user');
console.log('3. Replace YOUR_SALES_JWT_TOKEN with the actual token');
console.log('4. Replace the testProductId with an actual product ID from your database');
console.log('5. Run: node test-priority-products.js\n');

// Uncomment this line after adding the token
// testPriorityProductsAPI();

console.log('⚠️ Please add a valid Sales user JWT token and product ID before running tests');