const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const config = {
    baseURL: 'http://localhost:5000',
    unitHeadToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTBjNDJkZjM1YjgyMThhYzM2MTFmZmMiLCJ1c2VybmFtZSI6InJhZGhlIiwicm9sZSI6IlVuaXQgSGVhZCIsImNvbXBhbnlJZCI6IjY5MTQwOTAxMThjZjg1ZjgwYWQ4NTZiOSIsImlhdCI6MTczMTU4OTI1MywiZXhwIjoxNzMxNjc1NjUzfQ.cF6q6J6PlOZ-5NfqHo59wc1Lep1dZJKSfzJPZGOSkTk'
};

async function testUnitHeadOrders() {
    try {
        console.log('🧪 Testing Unit Head Orders Endpoint...\n');
        
        const response = await fetch(`${config.baseURL}/unit-head/orders`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.unitHeadToken}`
            }
        });

        console.log(`📡 Response Status: ${response.status} ${response.statusText}`);

        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Unit Head Orders Retrieved Successfully!');
            console.log(`📊 Total Orders: ${data.orders?.length || 0}`);
            
            if (data.orders && data.orders.length > 0) {
                console.log('\n📝 Sample Orders:');
                data.orders.slice(0, 3).forEach((order, index) => {
                    console.log(`\n🛍️ Order ${index + 1}:`);
                    console.log(`   ID: ${order._id}`);
                    console.log(`   Customer: ${order.customer?.name || 'Unknown'} (${order.customer?.location || 'No location'})`);
                    console.log(`   Sales Person: ${order.salesPerson?.username || 'Unknown'} (${order.salesPerson?.role || 'Unknown role'})`);
                    console.log(`   Company: ${order.salesPerson?.companyId || 'No company'}`);
                    console.log(`   Total: ₹${order.totalAmount || 0}`);
                    console.log(`   Status: ${order.status || 'Unknown'}`);
                    console.log(`   Date: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Unknown'}`);
                });
                
                // Check if all orders are from the same company
                const companyIds = [...new Set(data.orders.map(order => order.salesPerson?.companyId).filter(Boolean))];
                console.log(`\n🏢 Companies found in orders: ${companyIds.length}`);
                if (companyIds.length === 1) {
                    console.log('✅ Company filtering working correctly - all orders from same company!');
                } else {
                    console.log('❌ Company filtering issue - orders from multiple companies found');
                    console.log('Companies:', companyIds);
                }
            } else {
                console.log('📋 No orders found for this Unit Head\'s company');
            }
            
        } else {
            console.log('❌ Error Response:');
            console.log(JSON.stringify(data, null, 2));
        }
        
    } catch (error) {
        console.error('💥 Test Error:', error.message);
    }
}

testUnitHeadOrders();