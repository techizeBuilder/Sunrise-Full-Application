// Test both endpoints to compare data
const testBothEndpoints = async () => {
  try {
    console.log('🔍 Testing both order endpoints...');
    
    const orderId = '69310803bc21db646ad64a7b';
    
    // Test 1: Direct order endpoint (no auth for now)
    console.log('\n1️⃣ Testing /api/orders/:id...');
    try {
      const directResponse = await fetch(`http://localhost:5000/api/orders/${orderId}`);
      console.log('Direct endpoint status:', directResponse.status);
      
      if (directResponse.status === 401) {
        console.log('⚠️ Direct endpoint requires auth');
      } else if (directResponse.ok) {
        const directData = await directResponse.json();
        console.log('✅ Direct endpoint data:', {
          id: directData.order?._id,
          products: directData.order?.products?.length || 0,
          totalAmount: directData.order?.totalAmount
        });
        
        if (directData.order?.products) {
          console.log('📦 Direct endpoint products:');
          directData.order.products.forEach((p, i) => {
            console.log(`  ${i+1}. Qty: ${p.quantity}, Price: ${p.price}`);
          });
        }
      }
    } catch (err) {
      console.log('❌ Direct endpoint error:', err.message);
    }
    
    // Test 2: Sales endpoint (no auth for now)
    console.log('\n2️⃣ Testing /api/sales/orders...');
    try {
      const salesResponse = await fetch('http://localhost:5000/api/sales/orders?limit=50');
      console.log('Sales endpoint status:', salesResponse.status);
      
      if (salesResponse.status === 401) {
        console.log('⚠️ Sales endpoint requires auth');
        console.log('\n🌐 Browser console test for sales endpoint:');
        console.log(`
fetch('/api/sales/orders?limit=50', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
})
.then(response => response.json())
.then(data => {
  console.log('📊 Sales orders:', data);
  const targetOrder = data.orders?.find(o => o._id === '${orderId}');
  if (targetOrder) {
    console.log('🎯 Found target order in sales list:', {
      id: targetOrder._id,
      products: targetOrder.products?.length || 0,
      totalAmount: targetOrder.totalAmount
    });
    if (targetOrder.products) {
      targetOrder.products.forEach((p, i) => {
        console.log(\`  \${i+1}. Qty: \${p.quantity}, Price: \${p.price}\`);
      });
    }
  } else {
    console.log('❌ Target order not found in sales list');
  }
})
.catch(error => console.error('Error:', error));
        `);
      }
    } catch (err) {
      console.log('❌ Sales endpoint error:', err.message);
    }
    
    console.log('\n💡 The issue might be:');
    console.log('1. Frontend caching - try hard refresh (Ctrl+F5)');
    console.log('2. Different data sources between endpoints');
    console.log('3. Sales endpoint filtering out the order');
    console.log('4. Need to authenticate both endpoints to compare');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

testBothEndpoints();