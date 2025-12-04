// Test order update API
const testOrderUpdate = async () => {
  try {
    const orderId = '69310803bc21db646ad64a7b'; // From your example
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
          "quantity": 21  // Changed from 2 to 21 to test update
        }
      ]
    };

    console.log('🧪 Testing order update...');
    console.log('Order ID:', orderId);
    console.log('Update data:', JSON.stringify(updateData, null, 2));

    const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` // You'll need a valid token
      },
      body: JSON.stringify(updateData)
    });

    console.log('Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Update successful:', JSON.stringify(result, null, 2));
      
      if (result.order && result.order.products) {
        console.log('\n📦 Updated products:');
        result.order.products.forEach((product, index) => {
          console.log(`${index + 1}. ${product.product?.name || 'Unknown'} - Quantity: ${product.quantity}`);
        });
      }
    } else {
      const error = await response.text();
      console.log('❌ Update failed:', error);
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Make sure the server is running: npm run dev');
    }
  }
};

// For browser console testing
console.log(`
🌐 For Browser Console Testing:

const orderId = '69310803bc21db646ad64a7b';
const updateData = {
  "customerId": "693107f5bc21db646ad64993",
  "orderDate": "2025-12-04", 
  "products": [
    { "productId": "692eafb6bc5d787593b620b0", "quantity": 32 },
    { "productId": "68bff35e71ef51a68b5d7ab6", "quantity": 25 }
  ]
};

fetch(\`/api/orders/\${orderId}\`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  },
  body: JSON.stringify(updateData)
})
.then(response => response.json())
.then(data => {
  console.log('Update result:', data);
  if (data.order) {
    data.order.products.forEach(p => 
      console.log(\`Product: \${p.product?.name}, Quantity: \${p.quantity}\`)
    );
  }
})
.catch(error => console.error('Error:', error));
`);

testOrderUpdate();