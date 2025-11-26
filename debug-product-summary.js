import fetch from 'node-fetch';
import fs from 'fs';

const testProductSummary = async () => {
  try {
    // Read token
    const token = fs.readFileSync('token.txt', 'utf8').trim();
    console.log('🔑 Using token:', token ? 'Token found' : 'No token');

    // Test product summary API
    console.log('\n📊 Testing Product Summary API...');
    const response = await fetch('http://localhost:5000/api/sales/product-summary?date=2025-11-26', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📈 Status:', response.status);
    console.log('📈 Headers:', response.headers.raw());
    
    const result = await response.json();
    console.log('📊 Response:', JSON.stringify(result, null, 2));

    if (!result.success) {
      console.log('\n❌ Error details:', result.error);
    }

  } catch (error) {
    console.error('🚨 Test error:', error);
  }
};

testProductSummary();