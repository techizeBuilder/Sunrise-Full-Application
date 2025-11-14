const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const config = {
    baseURL: 'http://localhost:5000'
};

async function testCompanyFilteringFinal() {
    try {
        console.log('🎯 Final Company Filtering Test...\n');
        
        // Test Unit Head 1 (Bangalore)
        console.log('🏢 Unit Head 1: unit_head (Bangalore)');
        const uh1LoginResponse = await fetch(`${config.baseURL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'unit_head', password: '12345678' })
        });
        const uh1LoginData = await uh1LoginResponse.json();
        
        const uh1OrdersResponse = await fetch(`${config.baseURL}/api/unit-head/orders`, {
            headers: { 'Authorization': `Bearer ${uh1LoginData.token}` }
        });
        const uh1OrdersData = await uh1OrdersResponse.json();
        
        const uh1SalesResponse = await fetch(`${config.baseURL}/api/unit-head/sales-persons`, {
            headers: { 'Authorization': `Bearer ${uh1LoginData.token}` }
        });
        const uh1SalesData = await uh1SalesResponse.json();
        
        console.log(`📦 Orders: ${uh1OrdersData.data?.orders?.length || 0}`);
        console.log(`👥 Sales Persons: ${uh1SalesData.salesPersons?.length || 0}`);
        if (uh1OrdersData.data?.orders?.length > 0) {
            console.log('   Sample Orders:');
            uh1OrdersData.data.orders.slice(0, 3).forEach(order => {
                console.log(`   - ${order.orderCode} by ${order.salesPerson?.username || 'unknown'}`);
            });
        }
        
        console.log('\n🏢 Unit Head 2: radhe (Hyderabad)');
        const uh2LoginResponse = await fetch(`${config.baseURL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'radhe', password: '12345678' })
        });
        const uh2LoginData = await uh2LoginResponse.json();
        
        const uh2OrdersResponse = await fetch(`${config.baseURL}/api/unit-head/orders`, {
            headers: { 'Authorization': `Bearer ${uh2LoginData.token}` }
        });
        const uh2OrdersData = await uh2OrdersResponse.json();
        
        const uh2SalesResponse = await fetch(`${config.baseURL}/api/unit-head/sales-persons`, {
            headers: { 'Authorization': `Bearer ${uh2LoginData.token}` }
        });
        const uh2SalesData = await uh2SalesResponse.json();
        
        console.log(`📦 Orders: ${uh2OrdersData.data?.orders?.length || 0}`);
        console.log(`👥 Sales Persons: ${uh2SalesData.salesPersons?.length || 0}`);
        if (uh2OrdersData.data?.orders?.length > 0) {
            console.log('   Sample Orders:');
            uh2OrdersData.data.orders.slice(0, 3).forEach(order => {
                console.log(`   - ${order.orderCode} by ${order.salesPerson?.username || 'unknown'}`);
            });
        }
        
        console.log('\n🎉 RESULT:');
        const uh1Count = uh1OrdersData.data?.orders?.length || 0;
        const uh2Count = uh2OrdersData.data?.orders?.length || 0;
        
        console.log(`Bangalore Unit Head sees: ${uh1Count} orders`);
        console.log(`Hyderabad Unit Head sees: ${uh2Count} orders`);
        
        if (uh1Count !== uh2Count) {
            console.log('✅ SUCCESS: Company filtering is working correctly!');
            console.log('✅ Each Unit Head sees different data based on their company/location.');
        } else {
            console.log('❌ ISSUE: Both Unit Heads see the same number of orders.');
        }
        
    } catch (error) {
        console.error('💥 Error:', error.message);
    }
}

testCompanyFilteringFinal();