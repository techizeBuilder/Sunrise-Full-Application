const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const config = {
    baseURL: 'http://localhost:5000'
};

async function testBothEndpoints() {
    try {
        // Test Unit Manager (we know this works)
        console.log('🔑 Testing Unit Manager (unit_manager01)...\n');
        
        const umLoginResponse = await fetch(`${config.baseURL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'unit_manager01', password: '12345678' })
        });

        const umLoginData = await umLoginResponse.json();
        
        if (umLoginResponse.ok) {
            console.log('✅ Unit Manager Login successful!');
            console.log(`👤 User: ${umLoginData.user.username} (${umLoginData.user.role})`);
            console.log(`🏢 Company: ${umLoginData.user.companyId}`);
            
            // Test Unit Manager Orders
            const umOrdersResponse = await fetch(`${config.baseURL}/api/unit-manager/orders`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${umLoginData.token}`
                }
            });

            const umOrdersData = await umOrdersResponse.json();
            
            if (umOrdersResponse.ok) {
                console.log(`📊 Unit Manager Orders: ${umOrdersData.orders?.length || 0}`);
                if (umOrdersData.orders && umOrdersData.orders.length > 0) {
                    console.log('✅ Unit Manager has orders from company:', umLoginData.user.companyId);
                }
            }
        }
        
        console.log('\n' + '='.repeat(60) + '\n');
        
        // Test Unit Head
        console.log('🔑 Testing Unit Head (radhe)...\n');
        
        const uhLoginResponse = await fetch(`${config.baseURL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'radhe', password: '12345678' })
        });

        const uhLoginData = await uhLoginResponse.json();
        
        if (uhLoginResponse.ok) {
            console.log('✅ Unit Head Login successful!');
            console.log(`👤 User: ${uhLoginData.user.username} (${uhLoginData.user.role})`);
            console.log(`🏢 Company: ${uhLoginData.user.companyId}`);
            
            // Test both Unit Head endpoints
            console.log('\n📋 Testing /unit-head/orders (direct route)...');
            const uhOrders1Response = await fetch(`${config.baseURL}/unit-head/orders`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${uhLoginData.token}`
                }
            });
            
            const uhOrders1Data = await uhOrders1Response.json();
            console.log(`   Status: ${uhOrders1Response.status}, Orders: ${uhOrders1Data.orders?.length || 0}`);
            
            console.log('\n📋 Testing /api/unit-head/orders (API route)...');
            const uhOrders2Response = await fetch(`${config.baseURL}/api/unit-head/orders`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${uhLoginData.token}`
                }
            });
            
            const uhOrders2Data = await uhOrders2Response.json();
            console.log(`   Status: ${uhOrders2Response.status}, Orders: ${uhOrders2Data.orders?.length || 0}`);
            
            // Test Sales Persons endpoint
            console.log('\n👥 Testing Unit Head Sales Persons...');
            const uhSalesResponse = await fetch(`${config.baseURL}/api/unit-head/sales-persons`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${uhLoginData.token}`
                }
            });
            
            const uhSalesData = await uhSalesResponse.json();
            console.log(`   Status: ${uhSalesResponse.status}`);
            if (uhSalesResponse.ok && uhSalesData.salesPersons) {
                console.log(`   Sales Persons: ${uhSalesData.salesPersons.length}`);
                uhSalesData.salesPersons.forEach(sp => {
                    console.log(`   - ${sp.username} (${sp.role}) - Company: ${sp.companyId}`);
                });
            }
        }
        
        console.log('\n🎯 Summary:');
        if (umLoginData?.user && uhLoginData?.user) {
            console.log(`Unit Manager Company: ${umLoginData.user.companyId}`);
            console.log(`Unit Head Company: ${uhLoginData.user.companyId}`);
            
            if (umLoginData.user.companyId === uhLoginData.user.companyId) {
                console.log('✅ Both users are in the SAME company - should see same orders');
            } else {
                console.log('🔄 Users are in DIFFERENT companies - orders will be filtered separately');
            }
        }
        
    } catch (error) {
        console.error('💥 Test Error:', error.message);
    }
}

testBothEndpoints();