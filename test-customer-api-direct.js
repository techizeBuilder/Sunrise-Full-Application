// Test the unit head customer API
const fetch = require('node-fetch');

async function testCustomerAPI() {
    try {
        // You'll need to get a valid token from the browser and put it here
        const token = 'YOUR_TOKEN_HERE'; // Replace with actual token
        
        const response = await fetch('http://localhost:5000/api/unit-head/customers', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API Response:', JSON.stringify(data, null, 2));
            console.log('📊 Number of customers:', data.customers?.length || 0);
            
            // Check if customers have companyId
            if (data.customers && data.customers.length > 0) {
                data.customers.forEach((customer, index) => {
                    console.log(`Customer ${index + 1}:`, {
                        id: customer._id,
                        name: customer.name,
                        companyId: customer.companyId,
                        company: customer.company?.name || 'No company name'
                    });
                });
            }
        } else {
            console.log('❌ API Error:', response.status, response.statusText);
            const errorText = await response.text();
            console.log('Error details:', errorText);
        }
    } catch (error) {
        console.error('🔥 Network Error:', error.message);
    }
}

testCustomerAPI();