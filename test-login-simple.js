// Simple login test for company info

fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'unit_manager01',
    password: 'password123'
  })
})
.then(response => response.json())
.then(data => {
  console.log('=== LOGIN RESPONSE ===');
  console.log(JSON.stringify(data, null, 2));
  
  if (data.success) {
    console.log('\n✅ Login successful');
    console.log('User:', data.user.username);
    console.log('Role:', data.user.role);
    
    if (data.user.company) {
      console.log('🏢 Company Info:');
      console.log('  Name:', data.user.company.name);
      console.log('  Location:', data.user.company.location);
      console.log('  City:', data.user.company.city);
      console.log('  State:', data.user.company.state);
      console.log('\n🎉 SUCCESS: Company location info is now included!');
    } else {
      console.log('❌ No company information in response');
      if (data.user.companyId) {
        console.log('User has companyId but company object is null');
      } else {
        console.log('User has no companyId assigned');
      }
    }
  } else {
    console.log('❌ Login failed:', data.message);
  }
})
.catch(error => {
  console.error('❌ Request failed:', error.message);
});

console.log('🧪 Testing login with company location info...');
console.log('If this runs in browser console, it will test the endpoint.');
console.log('Make sure the server is running on http://localhost:3000');