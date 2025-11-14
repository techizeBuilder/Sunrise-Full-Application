const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const config = {
    baseURL: 'http://localhost:5000'
};

async function testUnitHeadOrdersAPI() {
    try {
        console.log('🔑 Logging in as Unit Head (radhe)...\n');
        
        // Login to get fresh token
        const loginResponse = await fetch(`${config.baseURL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'radhe', password: '12345678' })
        });

        const loginData = await loginResponse.json();
        
        if (!loginResponse.ok) {
            console.log('❌ Login failed:', loginData);
            return;
        }
        
        console.log('✅ Login successful!');
        console.log(`👤 User: ${loginData.user.username} (${loginData.user.role})`);
        console.log(`🏢 Company: ${loginData.user.companyId}`);
        
        // Test the exact frontend API call
        console.log('\n📊 Testing Unit Head Orders API with frontend parameters...');
        const ordersResponse = await fetch(`${config.baseURL}/api/unit-head/orders?page=1&limit=10&sortBy=createdAt&sortOrder=desc`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${loginData.token}`
            }
        });

        console.log(`📡 Response Status: ${ordersResponse.status} ${ordersResponse.statusText}`);

        const ordersData = await ordersResponse.json();
        
        if (ordersResponse.ok) {
            console.log('✅ Orders API Response Successful!');
            console.log(`📊 Total Orders: ${ordersData.data?.orders?.length || 0}`);
            
            if (ordersData.data?.orders && ordersData.data.orders.length > 0) {
                console.log('\n📝 First 3 Orders with Customer and Sales Person Details:');
                ordersData.data.orders.slice(0, 3).forEach((order, index) => {
                    console.log(`\n🛍️ Order ${index + 1}: ${order.orderCode}`);
                    console.log(`   Order Date: ${order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'No date'}`);
                    console.log(`   Status: ${order.status || 'Unknown'}`);
                    console.log(`   Total: ₹${order.totalAmount || 0}`);
                    
                    // Check Customer details
                    if (order.customer) {
                        console.log(`   👤 Customer: ${order.customer.name || 'No name'}`);
                        console.log(`      Contact: ${order.customer.contactPerson || 'No contact'}`);
                        console.log(`      Email: ${order.customer.email || 'No email'}`);
                        console.log(`      Location: ${order.customer.city || 'No city'}, ${order.customer.state || 'No state'}`);
                    } else {
                        console.log(`   👤 Customer: ❌ null/empty`);
                    }
                    
                    // Check Sales Person details
                    if (order.salesPerson) {
                        console.log(`   👨‍💼 Sales Person: ${order.salesPerson.username || 'No username'} (${order.salesPerson.fullName || 'No full name'})`);
                        console.log(`      Role: ${order.salesPerson.role || 'No role'}`);
                        console.log(`      Email: ${order.salesPerson.email || 'No email'}`);
                        if (order.salesPerson.companyId) {
                            console.log(`      Company: ${order.salesPerson.companyId.name || 'No company name'} - ${order.salesPerson.companyId.city || 'No city'}`);
                        } else {
                            console.log(`      Company: ❌ No company info`);
                        }
                    } else {
                        console.log(`   👨‍💼 Sales Person: ❌ null/empty`);
                    }
                    
                    // Check if products are populated
                    if (order.products && order.products.length > 0) {
                        console.log(`   📦 Products: ${order.products.length} items`);
                        order.products.slice(0, 2).forEach((product, pIndex) => {
                            if (product.product) {
                                console.log(`      ${pIndex + 1}. ${product.product.name || 'No name'} (${product.product.code || 'No code'}) - Qty: ${product.quantity}, Price: ₹${product.price}`);
                            } else {
                                console.log(`      ${pIndex + 1}. ❌ Product data missing - Qty: ${product.quantity}, Price: ₹${product.price}`);
                            }
                        });
                    } else {
                        console.log(`   📦 Products: ❌ No products`);
                    }
                });
                
                // Summary of what's missing
                console.log('\n📋 Data Quality Summary:');
                const customersWithData = ordersData.data.orders.filter(order => order.customer && order.customer.name).length;
                const salesPersonsWithData = ordersData.data.orders.filter(order => order.salesPerson && order.salesPerson.username).length;
                const productsWithData = ordersData.data.orders.filter(order => order.products && order.products.length > 0).length;
                
                console.log(`   Customers with data: ${customersWithData}/${ordersData.data.orders.length}`);
                console.log(`   Sales persons with data: ${salesPersonsWithData}/${ordersData.data.orders.length}`);
                console.log(`   Orders with products: ${productsWithData}/${ordersData.data.orders.length}`);
                
                if (customersWithData === 0) {
                    console.log('   🔍 Issue: All customer fields are null - need to check customer assignments in orders');
                }
                if (salesPersonsWithData === 0) {
                    console.log('   🔍 Issue: All sales person fields are null - need to check sales person assignments');
                }
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

testUnitHeadOrdersAPI();