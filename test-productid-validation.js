// Test script to verify productId validation fix
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testProductIdValidation() {
  console.log('🧪 Testing ProductId Validation Fix...\n');

  // Test data - simulating what the frontend sends
  const testCases = [
    {
      name: 'String ProductId',
      data: {
        productId: '67635c4ab07e5c15a37b5b00',
        date: '2025-01-03',
        packing: 150,
        physicalStock: 200
      }
    },
    {
      name: 'Object ProductId (Frontend format)',
      data: {
        productId: {
          _id: '67635c4ab07e5c15a37b5b00',
          name: 'Test Product',
          category: 'Test Category',
          subCategory: 'Test SubCategory'
        },
        date: '2025-01-03',
        packing: 150,
        physicalStock: 200
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`📝 Testing: ${testCase.name}`);
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/sales/update-product-summary`,
        testCase.data,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(`✅ ${testCase.name}: SUCCESS`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Message: ${response.data.message}\n`);
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ ${testCase.name}: ERROR`);
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Error: ${error.response.data.message || error.response.data.error}\n`);
      } else {
        console.log(`❌ ${testCase.name}: NETWORK ERROR`);
        console.log(`   ${error.message}\n`);
      }
    }
  }
}

// Run the test
if (require.main === module) {
  testProductIdValidation().catch(console.error);
}

module.exports = { testProductIdValidation };