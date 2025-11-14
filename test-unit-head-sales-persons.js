const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testUnitHeadSalesPersons() {
    try {
        console.log('🧪 Testing Unit Head Sales Persons Filtering...\n');
        
        // Test Unit Head 1 (Bangalore)
        console.log('🏢 Testing Unit Head 1: unit_head (Bangalore)');
        const uh1LoginResponse = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'unit_head', password: '12345678' })
        });
        const uh1LoginData = await uh1LoginResponse.json();
        
        if (uh1LoginResponse.ok) {
            console.log(`✅ Login successful: ${uh1LoginData.user.username}`);
            console.log(`📍 Company: ${uh1LoginData.user.company?.name} (${uh1LoginData.user.companyId})`);
            
            const uh1SalesResponse = await fetch('http://localhost:5000/api/unit-head/sales-persons?page=1&limit=10&sortBy=createdAt&sortOrder=desc', {
                headers: { 'Authorization': `Bearer ${uh1LoginData.token}` }
            });
            
            if (uh1SalesResponse.ok) {
                const uh1SalesData = await uh1SalesResponse.json();
                console.log('Raw response:', JSON.stringify(uh1SalesData, null, 2));
                console.log(`👥 Sales Persons: ${uh1SalesData.data?.salesPersons?.length || 0}`);
                
                if (uh1SalesData.data?.salesPersons) {
                    uh1SalesData.data.salesPersons.forEach(sp => {
                        console.log(`   - ${sp.username} (${sp.fullName || 'No name'}) - Company: ${sp.company?.name || 'No company'}`);
                    });
                } else {
                    console.log('   No sales persons found in response data');
                }
            } else {
                const errorData = await uh1SalesResponse.text();
                console.log('❌ Sales persons request failed:', uh1SalesResponse.status, errorData);
            }
        }
        
        console.log('\n' + '='.repeat(60) + '\n');
        
        // Test Unit Head 2 (Hyderabad) 
        console.log('🏢 Testing Unit Head 2: radhe (Hyderabad)');
        const uh2LoginResponse = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'radhe', password: '12345678' })
        });
        const uh2LoginData = await uh2LoginResponse.json();
        
        if (uh2LoginResponse.ok) {
            console.log(`✅ Login successful: ${uh2LoginData.user.username}`);
            console.log(`📍 Company: ${uh2LoginData.user.company?.name} (${uh2LoginData.user.companyId})`);
            
            const uh2SalesResponse = await fetch('http://localhost:5000/api/unit-head/sales-persons?page=1&limit=10&sortBy=createdAt&sortOrder=desc', {
                headers: { 'Authorization': `Bearer ${uh2LoginData.token}` }
            });
            
            if (uh2SalesResponse.ok) {
                const uh2SalesData = await uh2SalesResponse.json();
                console.log('Raw response:', JSON.stringify(uh2SalesData, null, 2));
                console.log(`👥 Sales Persons: ${uh2SalesData.data?.salesPersons?.length || 0}`);
                
                if (uh2SalesData.data?.salesPersons) {
                    uh2SalesData.data.salesPersons.forEach(sp => {
                        console.log(`   - ${sp.username} (${sp.fullName || 'No name'}) - Company: ${sp.company?.name || 'No company'}`);
                    });
                } else {
                    console.log('   No sales persons found in response data');
                }
            } else {
                const errorData = await uh2SalesResponse.text();
                console.log('❌ Sales persons request failed:', uh2SalesResponse.status, errorData);
            }
        }
        
    } catch (error) {
        console.error('💥 Error:', error.message);
    }
}

testUnitHeadSalesPersons();