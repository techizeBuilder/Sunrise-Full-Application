// Test script for the new approved product summaries API
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

// Test the new API endpoint
async function testApprovedProductSummariesAPI() {
  try {
    console.log('🧪 Testing Unit Manager Approved Product Summaries API...\n');

    // You'll need to get a valid token for a Unit Manager user
    const token = 'YOUR_UNIT_MANAGER_JWT_TOKEN'; // Replace with actual token

    const response = await fetch(`${BASE_URL}/api/unit-manager/product-summaries/approved`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ API Response Success:');
      console.log('Status:', response.status);
      console.log('Success:', data.success);
      console.log('Message:', data.message);
      console.log('Total Approved with Batches:', data.data?.stats?.totalApprovedWithBatches || 0);
      console.log('Current Page Count:', data.data?.stats?.currentPageCount || 0);
      
      if (data.data?.summaries?.length > 0) {
        console.log('\n📦 Sample Product Summaries:');
        data.data.summaries.slice(0, 3).forEach((summary, index) => {
          console.log(`${index + 1}. ${summary.productName}`);
          console.log(`   Code: ${summary.productCode}`);
          console.log(`   Category: ${summary.category}`);
          console.log(`   Production Final Batches: ${summary.productionFinalBatches}`);
          console.log(`   Batch Adjusted: ${summary.batchAdjusted}`);
          console.log(`   Status: ${summary.status}`);
          console.log('');
        });
      } else {
        console.log('\n📦 No approved product summaries with available batches found');
      }
    } else {
      console.log('❌ API Response Error:');
      console.log('Status:', response.status);
      console.log('Error:', data.message || 'Unknown error');
      console.log('Full response:', data);
    }

  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

// Test with query parameters
async function testWithParameters() {
  try {
    console.log('\n🔍 Testing with search and pagination parameters...\n');

    const token = 'YOUR_UNIT_MANAGER_JWT_TOKEN'; // Replace with actual token

    const response = await fetch(`${BASE_URL}/api/unit-manager/product-summaries/approved?page=1&limit=5&search=product`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Parameterized API Test Success:');
      console.log('Pagination Info:', data.data?.pagination);
      console.log('Results:', data.data?.summaries?.length || 0, 'summaries');
    } else {
      console.log('❌ Parameterized API Test Error:', data.message);
    }

  } catch (error) {
    console.error('❌ Parameterized Test Error:', error.message);
  }
}

// Instructions for running the test
console.log('📋 Instructions for Testing:');
console.log('1. Make sure the server is running on port 5000');
console.log('2. Get a valid JWT token for a Unit Manager user');
console.log('3. Replace YOUR_UNIT_MANAGER_JWT_TOKEN with the actual token');
console.log('4. Run: node test-approved-product-summaries.js\n');

// Uncomment these lines after adding the token
// testApprovedProductSummariesAPI();
// setTimeout(() => testWithParameters(), 2000);

console.log('⚠️ Please add a valid Unit Manager JWT token before running tests');