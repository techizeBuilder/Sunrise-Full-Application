// Test Unit Head Production Groups API
const token = 'YOUR_TOKEN_HERE'; // Replace with actual token from localStorage

// Test 1: Get available items
fetch('http://localhost:5000/api/unit-head/production-groups/items/available?page=1&limit=20', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(response => response.json())
.then(data => {
  console.log('🔍 Available Items API Response:', data);
  console.log('Items count:', data.data?.items?.length || 0);
  if (data.data?.items?.length > 0) {
    console.log('Sample item:', data.data.items[0]);
  }
})
.catch(error => console.error('Error:', error));

// Test 2: Get production groups
fetch('http://localhost:5000/api/unit-head/production-groups?page=1&limit=10', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(response => response.json())
.then(data => {
  console.log('🔍 Production Groups API Response:', data);
  console.log('Groups count:', data.data?.groups?.length || 0);
})
.catch(error => console.error('Error:', error));