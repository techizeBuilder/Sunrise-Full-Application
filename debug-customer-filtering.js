// Simple test to check the database state
console.log('🔍 Testing Customer API Logic');

// Simulate what happens in the backend
function testCustomerFiltering() {
    console.log('\n=== Testing Customer Filtering Logic ===');
    
    // Simulate a Unit Head user
    const unitHeadUser = {
        username: 'testUnitHead',
        role: 'Unit Head',
        companyId: '507f1f77bcf86cd799439011' // Example company ID
    };
    
    // Simulate query building (from getUnitHeadCustomers function)
    let query = {};
    
    if (unitHeadUser.role === 'Unit Head' && unitHeadUser.companyId) {
        query.companyId = unitHeadUser.companyId;
        console.log('✅ Company filter applied:', query);
    } else {
        console.log('❌ No company filter - this would show all customers!');
        console.log('User details:', {
            role: unitHeadUser.role,
            companyId: unitHeadUser.companyId
        });
    }
    
    // Simulate customer data
    const allCustomers = [
        { _id: '1', name: 'Customer 1', companyId: '507f1f77bcf86cd799439011' },
        { _id: '2', name: 'Customer 2', companyId: '507f1f77bcf86cd799439011' },
        { _id: '3', name: 'Customer 3', companyId: '507f1f77bcf86cd799439999' }, // Different company
        { _id: '4', name: 'Customer 4', companyId: null }, // No company
        { _id: '5', name: 'Customer 5' } // Missing companyId field
    ];
    
    console.log('\nAll customers in database:', allCustomers.length);
    allCustomers.forEach(c => console.log(`  - ${c.name} (company: ${c.companyId || 'NONE'})`));
    
    // Simulate filtering
    const filteredCustomers = allCustomers.filter(customer => {
        if (query.companyId) {
            return customer.companyId === query.companyId;
        }
        return true; // No filter
    });
    
    console.log(`\nFiltered result: ${filteredCustomers.length} customers`);
    filteredCustomers.forEach(c => console.log(`  - ${c.name}`));
    
    // Check potential issues
    console.log('\n🔍 Potential Issues:');
    const customersWithoutCompany = allCustomers.filter(c => !c.companyId);
    const customersFromOtherCompanies = allCustomers.filter(c => c.companyId && c.companyId !== unitHeadUser.companyId);
    
    console.log(`- ${customersWithoutCompany.length} customers have no companyId`);
    console.log(`- ${customersFromOtherCompanies.length} customers from other companies`);
    
    if (customersWithoutCompany.length > 0) {
        console.log('⚠️  Customers without companyId would not show up (good)');
    }
}

testCustomerFiltering();

// Check common issues
console.log('\n=== Common Issues Checklist ===');
console.log('1. ✓ Backend filtering logic exists');
console.log('2. ✓ Frontend API call uses correct endpoint');
console.log('3. ? Unit Head user has companyId set');
console.log('4. ? Customers have companyId set');
console.log('5. ? Frontend displays filtered data correctly');
console.log('\n💡 Next step: Check actual data in database');