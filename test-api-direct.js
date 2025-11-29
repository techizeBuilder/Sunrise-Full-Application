import fetch from 'node-fetch';

// Test the Unit Manager API directly
async function testUnitManagerAPI() {
  try {
    console.log('🧪 Testing Unit Manager Order Status Update API...\n');
    
    const orderId = '692ac59a0af12d60809a609c';
    const url = `http://localhost:5000/api/unit-manager/orders/${orderId}/status`;
    
    // You need to replace this with a real token from your login
    const token = 'YOUR_AUTH_TOKEN_HERE'; // ← Replace this with actual token
    
    console.log('📋 API Call Details:');
    console.log(`URL: ${url}`);
    console.log('Method: PATCH');
    console.log('Headers: Authorization, Content-Type');
    console.log('Body: { "status": "approved", "notes": "Order approved" }');
    console.log('');
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        status: 'approved',
        notes: 'Order approved via API test'
      })
    });
    
    console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    console.log('📄 Response Data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ API call successful!');
      
      // Now check if ProductDailySummary was created
      console.log('\n🔍 Checking ProductDailySummary in database...');
      
      // Import database modules
      const mongoose = await import('mongoose');
      const ProductDailySummary = (await import('./server/models/ProductDailySummary.js')).default;
      
      // Connect to MongoDB
      await mongoose.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory');
      
      const summaries = await ProductDailySummary.find({}).lean();
      console.log(`Found ${summaries.length} ProductDailySummary entries`);
      
      if (summaries.length > 0) {
        console.log('✅ ProductDailySummary entries found:');
        summaries.forEach((summary, index) => {
          console.log(`${index + 1}. Product: ${summary.productName || summary.productId}`);
          console.log(`   Batches: ${summary.productionFinalBatches}`);
          console.log(`   Date: ${summary.date}`);
        });
      } else {
        console.log('❌ NO ProductDailySummary entries found!');
      }
      
      await mongoose.default.disconnect();
    } else {
      console.log('❌ API call failed!');
      console.log('Error details:', data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 POSSIBLE ISSUES:');
    console.log('1. Server is not running on http://localhost:5000');
    console.log('2. Authentication token is invalid or missing');
    console.log('3. Order ID does not exist');
    console.log('4. User does not have Unit Manager role');
    console.log('5. MongoDB connection issue');
  }
}

console.log('⚠️  IMPORTANT: You need to:');
console.log('1. Start the server: npm start');
console.log('2. Get a valid auth token by logging in');
console.log('3. Replace YOUR_AUTH_TOKEN_HERE with the real token');
console.log('4. Run this test again');
console.log('');

// Uncomment the line below and add a real token to test
// testUnitManagerAPI();