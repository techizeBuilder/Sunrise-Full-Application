// Test company assignment fix

const testFixUserCompany = async () => {
  try {
    console.log('🔍 CHECKING USER COMPANY ASSIGNMENT...');
    
    // Check unit_manager01 company assignment
    const checkResponse = await fetch('http://localhost:3000/api/admin/check-user-company/unit_manager01');
    const checkData = await checkResponse.json();
    
    console.log('User company check result:');
    console.log(JSON.stringify(checkData, null, 2));
    
    if (!checkData.hasCompany && checkData.availableCompanies?.length > 0) {
      console.log('\n🔧 ASSIGNING COMPANY TO USER...');
      
      // Find Sunrize Bakery or use first available company
      const sunrizeCompany = checkData.availableCompanies.find(c => 
        c.name.includes('Sunrize') || c.name.includes('Bakery')
      ) || checkData.availableCompanies[0];
      
      console.log('Assigning company:', sunrizeCompany);
      
      const assignResponse = await fetch('http://localhost:3000/api/admin/assign-company/unit_manager01', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: sunrizeCompany.id })
      });
      
      const assignData = await assignResponse.json();
      console.log('\nCompany assignment result:');
      console.log(JSON.stringify(assignData, null, 2));
      
      if (assignData.success) {
        console.log('\n✅ COMPANY ASSIGNED! Now test login...');
        
        // Test login again
        const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'unit_manager01',
            password: 'password123'
          })
        });
        
        const loginData = await loginResponse.json();
        console.log('\nLogin test result:');
        console.log(JSON.stringify(loginData, null, 2));
        
        if (loginData.user?.company) {
          console.log('\n🎉 SUCCESS! Company info now included in login response:');
          console.log('Company:', loginData.user.company.name);
          console.log('Location:', loginData.user.company.location);
        } else {
          console.log('\n❌ Company still not included in login response');
        }
      }
    } else if (checkData.hasCompany) {
      console.log('\n✅ User already has company assigned!');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

console.log(`
🎯 USER COMPANY ASSIGNMENT FIX
============================

This script will:
1. Check if unit_manager01 has a company assigned
2. If not, assign Sunrize Bakery company 
3. Test login to verify company info is included

The issue you're experiencing is that the user doesn't have
a companyId assigned, so the login response doesn't include
company location information.

🔧 SOLUTION:
- Check user company assignment via admin API
- Assign company if missing
- Verify login response includes company info

Run testFixUserCompany() to execute the fix.
`);

if (typeof window !== 'undefined') {
  window.testFixUserCompany = testFixUserCompany;
} else {
  testFixUserCompany();
}