import fetch from 'node-fetch';
import fs from 'fs';

const testDifferentDates = async () => {
  try {
    console.log('🔐 Attempting login...');
    
    // Login first
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'unit_manager',
        password: '12345678'
      })
    });

    const loginResult = await loginResponse.json();
    if (!loginResult.success || !loginResult.token) {
      console.error('❌ Login failed');
      return;
    }

    // Test product summary for different dates
    const dates = ['2025-11-22', '2025-11-24', '2025-11-25', '2025-11-26'];
    
    for (const date of dates) {
      console.log(`\n📊 Testing Product Summary for ${date}...`);
      const response = await fetch(`http://localhost:5000/api/sales/product-summary?date=${date}`, {
        headers: {
          'Authorization': `Bearer ${loginResult.token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      console.log(`📈 Status: ${response.status}`);
      
      if (result.success && result.products) {
        // Look for PAV-200 specifically as it has orders
        const pav200 = result.products.find(p => p.productName === 'PAV-200');
        if (pav200) {
          console.log(`   PAV-200 Sales Breakdown:`, pav200.salesBreakdown);
          console.log(`   PAV-200 Total Indent:`, pav200.summary.totalIndent);
        } else {
          console.log(`   PAV-200 not found in results`);
        }
      } else {
        console.log(`   Error:`, result.message || result.error);
      }
    }

  } catch (error) {
    console.error('🚨 Test error:', error);
  }
};

testDifferentDates();