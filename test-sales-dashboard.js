// Test the sales recent orders API endpoint
const testSalesAPI = async () => {
  try {
    console.log('🧪 Testing /api/sales/recent-orders...');
    
    // You'll need to get a valid token first
    const response = await fetch('http://localhost:5000/api/sales/recent-orders?limit=5', {
      headers: {
        'Authorization': `Bearer YOUR_TOKEN_HERE`, // Replace with actual token
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status);
    
    if (response.status === 401) {
      console.log('⚠️ Authentication required. Please get a valid token first.');
      console.log('\nTo get a token, use the browser console:');
      console.log('localStorage.getItem("token")');
    } else if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:', JSON.stringify(data, null, 2));
    } else {
      const errorData = await response.text();
      console.log('❌ Error:', errorData);
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Make sure the server is running: npm run dev');
    }
  }
};

// For browser console testing
console.log(`
🌐 For Browser Console Testing:

fetch('/api/sales/recent-orders?limit=5', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('📦 Recent Orders:', data);
  if (data.success && data.orders) {
    console.log(\`Found \${data.orders.length} orders:\`);
    data.orders.forEach(order => {
      console.log(\`- \${order.orderCode}: \${order.customerName} - \${order.status} - ₹\${order.totalAmount}\`);
    });
  }
})
.catch(error => console.error('Error:', error));
`);

testSalesAPI();