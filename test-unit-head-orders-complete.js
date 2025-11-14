const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const config = {
    baseURL: 'http://localhost:5000'
};

async function loginAndTestUnitHead() {
    try {
        console.log('🔑 Logging in as Unit Head (radhe)...\n');
        
        // Login to get fresh token
        const loginResponse = await fetch(`${config.baseURL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'radhe',
                password: '12345678'
            })
        });

        const loginData = await loginResponse.json();
        
        if (!loginResponse.ok) {
            console.log('❌ Login failed:');
            console.log(JSON.stringify(loginData, null, 2));
            return;
        }
        
        console.log('✅ Login successful!');
        console.log(`👤 User: ${loginData.user.username} (${loginData.user.role})`);
        console.log(`🏢 Company: ${loginData.user.companyId}`);
        
        const token = loginData.token;
        
        // Test Unit Head Orders
        console.log('\n🧪 Testing Unit Head Orders Endpoint...\n');
        
        const ordersResponse = await fetch(`${config.baseURL}/unit-head/orders`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        console.log(`📡 Response Status: ${ordersResponse.status} ${ordersResponse.statusText}`);

        const ordersData = await ordersResponse.json();
        
        if (ordersResponse.ok) {
            console.log('✅ Unit Head Orders Retrieved Successfully!');
            console.log(`📊 Total Orders: ${ordersData.orders?.length || 0}`);
            
            if (ordersData.orders && ordersData.orders.length > 0) {
                console.log('\n📝 Sample Orders:');
                ordersData.orders.slice(0, 5).forEach((order, index) => {
                    console.log(`\n🛍️ Order ${index + 1}:`);
                    console.log(`   ID: ${order._id}`);
                    console.log(`   Customer: ${order.customer?.name || 'Unknown'} (${order.customer?.location || 'No location'})`);
                    console.log(`   Sales Person: ${order.salesPerson?.username || 'Unknown'} (${order.salesPerson?.role || 'Unknown role'})`);
                    console.log(`   Sales Company: ${order.salesPerson?.companyId || 'No company'}`);
                    console.log(`   Total: ₹${order.totalAmount || 0}`);
                    console.log(`   Status: ${order.status || 'Unknown'}`);
                    console.log(`   Date: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Unknown'}`);
                });
                
                // Check company filtering
                const companyIds = [...new Set(ordersData.orders.map(order => order.salesPerson?.companyId).filter(Boolean))];
                console.log(`\n🏢 Companies found in orders: ${companyIds.length}`);
                console.log(`🎯 Expected company: ${loginData.user.companyId}`);
                
                if (companyIds.length === 1 && companyIds[0] === loginData.user.companyId) {
                    console.log('✅ Company filtering working correctly - all orders from same company!');
                } else {
                    console.log('❌ Company filtering issue');
                    console.log('Found companies:', companyIds);
                    console.log('Expected:', loginData.user.companyId);
                }
                
                // Check if customers and sales persons have details
                const hasCustomerDetails = ordersData.orders.some(order => order.customer?.name);
                const hasSalesPersonDetails = ordersData.orders.some(order => order.salesPerson?.username);
                
                console.log(`\n📋 Customer Details: ${hasCustomerDetails ? '✅ Present' : '❌ Missing'}`);
                console.log(`👤 Sales Person Details: ${hasSalesPersonDetails ? '✅ Present' : '❌ Missing'}`);
                
            } else {
                console.log('📋 No orders found for this Unit Head\'s company');
            }
            
        } else {
            console.log('❌ Error Response:');
            console.log(JSON.stringify(ordersData, null, 2));
        }
        
    } catch (error) {
        console.error('💥 Test Error:', error.message);
    }
}

loginAndTestUnitHead();