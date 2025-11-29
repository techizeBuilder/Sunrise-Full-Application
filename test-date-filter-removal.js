// Test script to verify date filter removal from Sales Product Summary API
// This tests both with date parameter and without date parameter

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3NGJiZDVlY2JjNTI2NjYxNjMyMjVhZCIsInJvbGUiOiJTdXBlciBBZG1pbiIsImNvbXBhbnlJZCI6bnVsbCwiaWF0IjoxNzMzMTU3NjgzLCJleHAiOjE3MzMxNjQ4ODN9.SV98VGiVoY8LWIvhKZ9Ol3Y5wNQ4OTQvC5dCXb_hnY4';

async function testProductSummaryAPI() {
  console.log('=== Testing Product Summary API ===\n');

  // Test 1: Without date parameter (should return all data)
  console.log('1. Testing WITHOUT date parameter:');
  try {
    const response1 = await fetch('http://localhost:5000/api/sales/product-summary', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data1 = await response1.json();
    console.log('✅ Status:', response1.status);
    console.log('✅ Success:', data1.success);
    console.log('✅ Total products found:', data1.products?.length || 0);
    if (data1.products && data1.products.length > 0) {
      console.log('✅ First product:', data1.products[0].productName);
      console.log('✅ Sample dates:', data1.products.slice(0, 3).map(p => p.date || 'no date'));
    }
  } catch (error) {
    console.error('❌ Error without date:', error.message);
  }

  console.log('\n' + '-'.repeat(50) + '\n');

  // Test 2: With date parameter (should still work)
  console.log('2. Testing WITH date parameter (2025-11-26):');
  try {
    const today = new Date().toISOString().split('T')[0];
    const response2 = await fetch(`http://localhost:5000/api/sales/product-summary?date=${today}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data2 = await response2.json();
    console.log('✅ Status:', response2.status);
    console.log('✅ Success:', data2.success);
    console.log('✅ Total products found:', data2.products?.length || 0);
    if (data2.products && data2.products.length > 0) {
      console.log('✅ First product:', data2.products[0].productName);
    }
  } catch (error) {
    console.error('❌ Error with date:', error.message);
  }

  console.log('\n=== Test Complete ===');
}

testProductSummaryAPI().catch(console.error);