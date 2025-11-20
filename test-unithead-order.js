// Test Unit Head order creation with proper field mapping
import fetch from 'node-fetch';

const testData = {
  customerId: "691c57032b31ba4ccf736b4d", // Example customer ID from your logs
  orderDate: "2025-11-19",
  products: [
    {
      product: "67403e5ea42c2ce57e3b1b5a", // Example product ID - you'll need to replace with actual
      quantity: 1,
      unitPrice: 100
    }
  ],
  notes: "Test order from API"
};

async function testOrderCreation() {
  try {
    console.log('Testing Unit Head order creation...');
    console.log('Test data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:5000/api/unit-head/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: You'll need to add proper authorization headers
        'Authorization': 'Bearer YOUR_TOKEN_HERE'
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testOrderCreation();