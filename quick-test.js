// Quick test to verify the API with proper auth token
import fetch from 'node-fetch';

async function testAPI() {
  try {
    console.log('Testing /api/sales/product-summary without date...');
    
    const response = await fetch('http://localhost:5000/api/sales/product-summary', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3NGJiZDVlY2JjNTI2NjYxNjMyMjVhZCIsInJvbGUiOiJTdXBlciBBZG1pbiIsImNvbXBhbnlJZCI6bnVsbCwiaWF0IjoxNzMzMTU3NjgzLCJleHAiOjE3MzMxNjQ4ODN9.SV98VGiVoY8LWIvhKZ9Ol3Y5wNQ4OTQvC5dCXb_hnY4',
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.success && data.products) {
      console.log('Total products found:', data.products.length);
      console.log('Date in response:', data.date);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();