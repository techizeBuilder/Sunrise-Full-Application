const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const config = {
    baseURL: 'http://localhost:5000'
};

async function debugCompanyFiltering() {
    try {
        console.log('🔍 Debugging Company Filtering...\n');
        
        // Login as Unit Manager
        console.log('🔑 Logging in as Unit Manager (unit_manager01)...');
        const umLoginResponse = await fetch(`${config.baseURL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'unit_manager01', password: '12345678' })
        });

        const umLoginData = await umLoginResponse.json();
        
        if (!umLoginResponse.ok) {
            console.log('❌ Unit Manager login failed:', umLoginData);
            return;
        }
        
        console.log('✅ Unit Manager logged in successfully');
        console.log(`👤 User: ${umLoginData.user.username}`);
        console.log(`🏢 Company: ${umLoginData.user.companyId}`);
        console.log(`🎯 Role: ${umLoginData.user.role}`);
        
        // Test Unit Manager orders with debug
        console.log('\n📊 Testing Unit Manager Orders...');
        const umOrdersResponse = await fetch(`${config.baseURL}/api/unit-manager/orders`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${umLoginData.token}`
            }
        });

        const umOrdersData = await umOrdersResponse.json();
        console.log(`📡 Status: ${umOrdersResponse.status}`);
        console.log(`📊 Response:`, JSON.stringify(umOrdersData, null, 2));
        
        console.log('\n' + '='.repeat(60) + '\n');
        
        // Login as Unit Head
        console.log('🔑 Logging in as Unit Head (radhe)...');
        const uhLoginResponse = await fetch(`${config.baseURL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'radhe', password: '12345678' })
        });

        const uhLoginData = await uhLoginResponse.json();
        
        if (!uhLoginResponse.ok) {
            console.log('❌ Unit Head login failed:', uhLoginData);
            return;
        }
        
        console.log('✅ Unit Head logged in successfully');
        console.log(`👤 User: ${uhLoginData.user.username}`);
        console.log(`🏢 Company: ${uhLoginData.user.companyId}`);
        console.log(`🎯 Role: ${uhLoginData.user.role}`);
        
        // Test Unit Head orders with debug
        console.log('\n📊 Testing Unit Head Orders (direct route)...');
        const uhOrdersResponse = await fetch(`${config.baseURL}/unit-head/orders`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${uhLoginData.token}`
            }
        });

        const uhOrdersData = await uhOrdersResponse.json();
        console.log(`📡 Status: ${uhOrdersResponse.status}`);
        console.log(`📊 Response:`, JSON.stringify(uhOrdersData, null, 2));
        
        // Test API route too
        console.log('\n📊 Testing Unit Head Orders (API route)...');
        const uhApiOrdersResponse = await fetch(`${config.baseURL}/api/unit-head/orders`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${uhLoginData.token}`
            }
        });

        const uhApiOrdersData = await uhApiOrdersResponse.json();
        console.log(`📡 Status: ${uhApiOrdersResponse.status}`);
        console.log(`📊 Response:`, JSON.stringify(uhApiOrdersData, null, 2));
        
    } catch (error) {
        console.error('💥 Debug Error:', error.message);
    }
}

debugCompanyFiltering();