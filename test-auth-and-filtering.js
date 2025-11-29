// Test Unit Head Authentication and Company Assignment
const API_URL = 'http://localhost:5000';

async function testUnitHeadAuth() {
  console.log('🔍 Testing Unit Head Authentication and Company Assignment...\n');
  
  // This would need to be replaced with actual token from login
  const testToken = 'YOUR_ACTUAL_UNIT_HEAD_TOKEN';
  
  if (testToken === 'YOUR_ACTUAL_UNIT_HEAD_TOKEN') {
    console.log('⚠️  TESTING STEPS NEEDED:');
    console.log('1. Login as Unit Head in browser');
    console.log('2. Open browser console');
    console.log('3. Run: localStorage.getItem("token")');
    console.log('4. Copy the token value');
    console.log('5. Replace testToken in this script');
    console.log('6. Run this test again\n');
    
    console.log('🧪 MANUAL BROWSER TEST:');
    console.log('Open browser console and run:');
    console.log('```javascript');
    console.log('// Test 1: Check token exists');
    console.log('const token = localStorage.getItem("token");');
    console.log('console.log("Token exists:", !!token);');
    console.log('');
    console.log('// Test 2: Check user data');
    console.log('const user = JSON.parse(localStorage.getItem("user") || "{}");');
    console.log('console.log("User data:", user);');
    console.log('console.log("Role:", user.role);');
    console.log('console.log("Company ID:", user.companyId);');
    console.log('');
    console.log('// Test 3: Test API call');
    console.log('fetch("/api/unit-head/customers", {');
    console.log('  headers: { "Authorization": `Bearer ${token}` }');
    console.log('})');
    console.log('.then(res => res.json())');
    console.log('.then(data => {');
    console.log('  console.log("API Response:", data);');
    console.log('  if (data.success) {');
    console.log('    console.log("Customers count:", data.data?.customers?.length || 0);');
    console.log('    console.log("Total customers:", data.data?.summary?.totalCustomers || 0);');
    console.log('  }');
    console.log('});');
    console.log('```\n');
    
    return;
  }
  
  try {
    console.log('🧪 Testing with provided token...');
    
    const response = await fetch(`${API_URL}/api/unit-head/customers`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('\n✅ SUCCESS - Filtering is working!');
      console.log('Customers returned:', data.data?.customers?.length || 0);
      console.log('Total customers in company:', data.data?.summary?.totalCustomers || 0);
    } else {
      console.log('\n❌ ERROR:', data.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Common issues checklist
console.log('🔧 COMMON ISSUES TO CHECK:');
console.log('1. Server running? (npm start)');
console.log('2. Unit Head logged in?');
console.log('3. Unit Head has companyId assigned?');
console.log('4. Correct API endpoint? (/api/unit-head/customers)');
console.log('5. Valid JWT token?');
console.log('6. Browser cache cleared?');
console.log('');

testUnitHeadAuth();