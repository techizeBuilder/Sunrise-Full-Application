const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const config = {
    baseURL: 'http://localhost:5000'
};

async function testBothUnitHeads() {
    try {
        console.log('🔍 Testing Company Filtering for Different Unit Heads...\n');
        
        // Test 1: Login as unit_head (Bangalore)
        console.log('🏢 Testing Unit Head 1: unit_head (Bangalore)...');
        const uh1LoginResponse = await fetch(`${config.baseURL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'unit_head', password: '12345678' })
        });

        const uh1LoginData = await uh1LoginResponse.json();
        
        if (uh1LoginResponse.ok) {
            console.log('✅ Unit Head 1 Login successful!');
            console.log(`👤 User: ${uh1LoginData.user.username}`);
            console.log(`🏢 Company ID: ${uh1LoginData.user.companyId}`);
            console.log(`🌆 Company: ${uh1LoginData.user.company.name} - ${uh1LoginData.user.company.city}`);
            
            // Test Orders
            const uh1OrdersResponse = await fetch(`${config.baseURL}/api/unit-head/orders`, {
                headers: { 'Authorization': `Bearer ${uh1LoginData.token}` }
            });
            const uh1OrdersData = await uh1OrdersResponse.json();
            console.log(`📦 Orders Count: ${uh1OrdersData.data?.orders?.length || 0}`);
            
            // Test Sales Persons
            const uh1SalesResponse = await fetch(`${config.baseURL}/api/unit-head/sales-persons`, {
                headers: { 'Authorization': `Bearer ${uh1LoginData.token}` }
            });
            const uh1SalesData = await uh1SalesResponse.json();
            console.log(`👥 Sales Persons Count: ${uh1SalesData.salesPersons?.length || 0}`);
            
            if (uh1SalesData.salesPersons && uh1SalesData.salesPersons.length > 0) {
                console.log('   Sales Persons:');
                uh1SalesData.salesPersons.slice(0, 3).forEach(sp => {
                    console.log(`   - ${sp.username} (Company: ${sp.companyId})`);
                });
            }
        }
        
        console.log('\n' + '='.repeat(60) + '\n');
        
        // Test 2: Login as radhe (Hyderabad)
        console.log('🏢 Testing Unit Head 2: radhe (Hyderabad)...');
        const uh2LoginResponse = await fetch(`${config.baseURL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'radhe', password: '12345678' })
        });

        const uh2LoginData = await uh2LoginResponse.json();
        
        if (uh2LoginResponse.ok) {
            console.log('✅ Unit Head 2 Login successful!');
            console.log(`👤 User: ${uh2LoginData.user.username}`);
            console.log(`🏢 Company ID: ${uh2LoginData.user.companyId}`);
            console.log(`🌆 Company: ${uh2LoginData.user.company?.name || 'No company name'} - ${uh2LoginData.user.company?.city || 'No city'}`);
            
            // Test Orders
            const uh2OrdersResponse = await fetch(`${config.baseURL}/api/unit-head/orders`, {
                headers: { 'Authorization': `Bearer ${uh2LoginData.token}` }
            });
            const uh2OrdersData = await uh2OrdersResponse.json();
            console.log(`📦 Orders Count: ${uh2OrdersData.data?.orders?.length || 0}`);
            
            // Test Sales Persons
            const uh2SalesResponse = await fetch(`${config.baseURL}/api/unit-head/sales-persons`, {
                headers: { 'Authorization': `Bearer ${uh2LoginData.token}` }
            });
            const uh2SalesData = await uh2SalesResponse.json();
            console.log(`👥 Sales Persons Count: ${uh2SalesData.salesPersons?.length || 0}`);
            
            if (uh2SalesData.salesPersons && uh2SalesData.salesPersons.length > 0) {
                console.log('   Sales Persons:');
                uh2SalesData.salesPersons.slice(0, 3).forEach(sp => {
                    console.log(`   - ${sp.username} (Company: ${sp.companyId})`);
                });
            }
        }
        
        console.log('\n🎯 ANALYSIS:');
        if (uh1LoginData.user && uh2LoginData.user) {
            console.log(`Unit Head 1 Company: ${uh1LoginData.user.companyId} (${uh1LoginData.user.company.city})`);
            console.log(`Unit Head 2 Company: ${uh2LoginData.user.companyId} (${uh2LoginData.user.company?.city || 'Unknown'})`);
            
            if (uh1LoginData.user.companyId === uh2LoginData.user.companyId) {
                console.log('❌ ISSUE: Both users have SAME company ID - they should be different!');
            } else {
                console.log('✅ GOOD: Users have different company IDs');
                
                // Compare data counts
                const uh1OrderCount = uh1OrdersData.data?.orders?.length || 0;
                const uh2OrderCount = uh2OrdersData.data?.orders?.length || 0;
                const uh1SalesCount = uh1SalesData.salesPersons?.length || 0;
                const uh2SalesCount = uh2SalesData.salesPersons?.length || 0;
                
                console.log(`\nData Comparison:`);
                console.log(`Orders: UH1=${uh1OrderCount}, UH2=${uh2OrderCount}`);
                console.log(`Sales Persons: UH1=${uh1SalesCount}, UH2=${uh2SalesCount}`);
                
                if (uh1OrderCount === uh2OrderCount && uh1SalesCount === uh2SalesCount) {
                    console.log('❌ ISSUE: Same data counts - company filtering may not be working!');
                } else {
                    console.log('✅ GOOD: Different data counts - company filtering working correctly!');
                }
            }
        }
        
    } catch (error) {
        console.error('💥 Test Error:', error.message);
    }
}

testBothUnitHeads();