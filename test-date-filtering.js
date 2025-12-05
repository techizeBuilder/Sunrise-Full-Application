/**
 * Test script to verify date filtering in sales summary API
 */

import fetch from 'node-fetch';

const baseURL = 'http://localhost:5000';

// Test different date scenarios
const testDates = [
  '2025-12-04', // Specific date from user request
  '2025-12-06', // Today's date
  null         // No date filter
];

const testSalesAPI = async () => {
  console.log('🧪 Testing Sales Summary API Date Filtering...\n');
  
  for (const testDate of testDates) {
    try {
      console.log(`\n📅 Testing ${testDate ? `date: ${testDate}` : 'no date filter'}`);
      console.log('─'.repeat(50));
      
      const url = testDate 
        ? `${baseURL}/api/sales/product-summary?date=${testDate}`
        : `${baseURL}/api/sales/product-summary`;
      
      console.log(`🌐 URL: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': 'Bearer your-token-here' // You may need to add a valid token
        }
      });
      
      console.log(`📡 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Success: ${data.success}`);
        console.log(`📊 Production Groups: ${data.productionGroups?.length || 0}`);
        console.log(`🔄 Ungrouped Products: ${data.ungroupedProducts?.length || 0}`);
        console.log(`📅 Response Date: ${data.date}`);
        
        // Show sample data if available
        if (data.productionGroups?.length > 0) {
          const firstGroup = data.productionGroups[0];
          console.log(`📋 First Group: ${firstGroup.groupName} (${firstGroup.products?.length || 0} products)`);
        }
        if (data.ungroupedProducts?.length > 0) {
          console.log(`📋 First Ungrouped Product: ${data.ungroupedProducts[0].productName}`);
        }
      } else {
        const errorData = await response.text();
        console.log(`❌ Error: ${errorData}`);
      }
      
    } catch (error) {
      console.error(`💥 Request failed:`, error.message);
    }
  }
};

console.log('⚠️  Note: Make sure the server is running on localhost:5000');
console.log('⚠️  You may need to update the Authorization token\n');

// Uncomment the line below to run the test
// testSalesAPI();

console.log('✅ Test script created successfully!');
console.log('📝 To run the test, start your server and uncomment the testSalesAPI() call');