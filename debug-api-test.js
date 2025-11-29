// Test the API with curl commands to debug the issue
// Test both with and without date parameters

const token = 'your-actual-token-here'; // Replace with actual token

console.log('Testing Product Summary API...\n');

// Test without date
console.log('1. Testing WITHOUT date parameter:');
console.log('curl -H "Authorization: Bearer [token]" http://localhost:5000/api/sales/product-summary\n');

// Test with specific date (like 28th)
console.log('2. Testing WITH date parameter (2025-11-28):');
console.log('curl -H "Authorization: Bearer [token]" http://localhost:5000/api/sales/product-summary?date=2025-11-28\n');

// Test with today's date
console.log('3. Testing WITH today\'s date (2025-11-29):');
console.log('curl -H "Authorization: Bearer [token]" http://localhost:5000/api/sales/product-summary?date=2025-11-29\n');

console.log('Expected behavior:');
console.log('- Without date: Should return ALL data from all dates');
console.log('- With date: Should return data for that specific date only');
console.log('');
console.log('Current issue: Without date returns empty array, but with date=2025-11-28 returns data');
console.log('This suggests the filter logic is correct, but there might be an issue with how "all dates" is being interpreted');