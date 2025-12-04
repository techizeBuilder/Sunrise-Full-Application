// Test the actual PUT API call
const testUpdateAPI = async () => {
  try {
    console.log('🧪 Testing PUT /api/orders/69310803bc21db646ad64a7b');
    
    const updateData = {
      "customerId": "693107f5bc21db646ad64993",
      "orderDate": "2025-12-04",
      "notes": "",
      "products": [
        {
          "productId": "692eafb6bc5d787593b620b0",
          "quantity": 32
        },
        {
          "productId": "68bff35e71ef51a68b5d7ab6",
          "quantity": 21  // Updated from 2 to 21
        }
      ]
    };

    console.log('📤 Sending update request...');
    console.log('Request body:', JSON.stringify(updateData, null, 2));

    // Test without authentication first to see the response
    const response = await fetch('http://localhost:5000/api/orders/69310803bc21db646ad64a7b', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    console.log('📡 Response status:', response.status);
    const responseText = await response.text();
    console.log('📋 Response:', responseText);

    if (response.status === 401) {
      console.log('\n⚠️ Authentication required. Test this in browser console with token:');
      console.log(`
fetch('/api/orders/69310803bc21db646ad64a7b', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  },
  body: JSON.stringify(${JSON.stringify(updateData)})
})
.then(response => response.json())
.then(data => console.log('Update result:', data))
.catch(error => console.error('Error:', error));
      `);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Make sure server is running on http://localhost:5000');
    }
  }
};

testUpdateAPI();