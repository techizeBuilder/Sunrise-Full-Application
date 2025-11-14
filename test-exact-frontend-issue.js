const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testExactFrontendScenario() {
    try {
        console.log('🎯 Testing Exact Frontend Scenario - Unit Head Sales Page\n');
        
        console.log('Testing the exact URLs shown in screenshots...\n');
        
        // Test 1: Login as unit_head (shown in first screenshot)
        console.log('👤 Testing user: unit_head (Bangalore - shown in first screenshot)');
        const uh1LoginResponse = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'unit_head', password: '12345678' })
        });
        const uh1LoginData = await uh1LoginResponse.json();
        
        if (uh1LoginResponse.ok) {
            console.log(`✅ Logged in: ${uh1LoginData.user.username}`);
            console.log(`🏢 Company: ${uh1LoginData.user.company?.name} (${uh1LoginData.user.companyId})`);
            
            // Test the sales persons endpoint (what the frontend is likely calling)
            const uh1SalesPersonsResponse = await fetch('http://localhost:5000/api/unit-head/sales-persons', {
                headers: { 'Authorization': `Bearer ${uh1LoginData.token}` }
            });
            const uh1SalesPersonsData = await uh1SalesPersonsResponse.json();
            
            console.log('\n📊 Sales Persons Data:');
            console.log(`Total Sales Persons: ${uh1SalesPersonsData.data?.summary?.totalSalesPersons || 0}`);
            console.log(`Total Orders: ${uh1SalesPersonsData.data?.summary?.totalOrders || 0}`);
            console.log(`Total Revenue: ₹${uh1SalesPersonsData.data?.summary?.totalRevenue || 0}`);
            
            if (uh1SalesPersonsData.data?.salesPersons) {
                console.log('\nSales Persons List:');
                uh1SalesPersonsData.data.salesPersons.forEach(sp => {
                    console.log(`  - ${sp.username}: ${sp.totalOrders} orders`);
                });
            }
        }
        
        console.log('\n' + '='.repeat(70) + '\n');
        
        // Test 2: Login as radhe (shown in second screenshot)
        console.log('👤 Testing user: radhe (Hyderabad - shown in second screenshot)');
        const uh2LoginResponse = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'radhe', password: '12345678' })
        });
        const uh2LoginData = await uh2LoginResponse.json();
        
        if (uh2LoginResponse.ok) {
            console.log(`✅ Logged in: ${uh2LoginData.user.username}`);
            console.log(`🏢 Company: ${uh2LoginData.user.company?.name} (${uh2LoginData.user.companyId})`);
            
            // Test the same sales persons endpoint
            const uh2SalesPersonsResponse = await fetch('http://localhost:5000/api/unit-head/sales-persons', {
                headers: { 'Authorization': `Bearer ${uh2LoginData.token}` }
            });
            const uh2SalesPersonsData = await uh2SalesPersonsResponse.json();
            
            console.log('\n📊 Sales Persons Data:');
            console.log(`Total Sales Persons: ${uh2SalesPersonsData.data?.summary?.totalSalesPersons || 0}`);
            console.log(`Total Orders: ${uh2SalesPersonsData.data?.summary?.totalOrders || 0}`);
            console.log(`Total Revenue: ₹${uh2SalesPersonsData.data?.summary?.totalRevenue || 0}`);
            
            if (uh2SalesPersonsData.data?.salesPersons) {
                console.log('\nSales Persons List:');
                uh2SalesPersonsData.data.salesPersons.forEach(sp => {
                    console.log(`  - ${sp.username}: ${sp.totalOrders} orders`);
                });
            }
        }
        
        // Compare the results to see if they match the screenshots
        console.log('\n🔍 ANALYSIS:');
        const uh1Revenue = uh1LoginData && uh1SalesPersonsData.data?.summary?.totalRevenue || 0;
        const uh2Revenue = uh2LoginData && uh2SalesPersonsData.data?.summary?.totalRevenue || 0;
        const uh1Orders = uh1LoginData && uh1SalesPersonsData.data?.summary?.totalOrders || 0;
        const uh2Orders = uh2LoginData && uh2SalesPersonsData.data?.summary?.totalOrders || 0;
        
        console.log(`\nScreenshots show both having: ₹1,39,343.00 revenue and 18 orders`);
        console.log(`Backend actually returns:`);
        console.log(`  unit_head (Bangalore): ₹${uh1Revenue.toLocaleString()}, ${uh1Orders} orders`);
        console.log(`  radhe (Hyderabad): ₹${uh2Revenue.toLocaleString()}, ${uh2Orders} orders`);
        
        if (uh1Revenue === 139343 && uh2Revenue === 139343) {
            console.log('\n❌ BACKEND ISSUE: Backend is still returning the same data!');
            console.log('The company filtering is not working correctly.');
        } else if (uh1Revenue !== uh2Revenue) {
            console.log('\n✅ BACKEND WORKING: Different data returned by backend');
            console.log('❌ FRONTEND ISSUE: Frontend is showing cached/wrong data');
            console.log('Solutions:');
            console.log('1. Clear browser cache');
            console.log('2. Hard refresh (Ctrl+F5)');
            console.log('3. Check if frontend is making fresh API calls');
            console.log('4. Verify token refresh on user switch');
        }
        
    } catch (error) {
        console.error('💥 Error:', error.message);
    }
}

testExactFrontendScenario();