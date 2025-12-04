// Simple test script to check packing API and database
import fetch from 'node-fetch';

const testPackingAPI = async () => {
  try {
    console.log('Testing Packing API...');
    
    // Test without auth first to see if endpoint exists
    const response = await fetch('http://localhost:5000/api/packing/production-groups', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response:', responseText);
    
    if (response.status === 401) {
      console.log('\n❗ API requires authentication. This is expected.');
      console.log('✅ Route exists and is working (authentication required)');
    } else if (response.status === 200) {
      console.log('✅ API working without auth');
    } else {
      console.log('❌ API not working, status:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Server is not running. Start the server with: npm run dev');
    }
  }
};

// Test the API
testPackingAPI();