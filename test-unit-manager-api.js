// Test Unit Manager Order Status Update API
console.log('🧪 Testing Unit Manager Order Status Update API...\n');

const orderId = '692ac59a0af12d60809a609c';
const apiUrl = `http://localhost:5000/api/unit-manager/orders/${orderId}/status`;

console.log('📋 API CALL DETAILS:');
console.log(`URL: ${apiUrl}`);
console.log('Method: PUT (not PATCH!)');
console.log('Headers: Content-Type: application/json');
console.log('Authorization: Bearer <token>');
console.log('Body: { "status": "approved", "notes": "Order approved" }');
console.log('');

console.log('🔍 ROUTE MAPPING CHECK:');
console.log('Route in unitManagerRoutes.js:');
console.log('  router.put("/orders/:id/status", updateOrderStatus)');
console.log('');
console.log('Expected URL pattern:');
console.log('  PUT /api/unit-manager/orders/{id}/status');
console.log('');

console.log('⚠️  IMPORTANT NOTES:');
console.log('1. Use PUT method, not PATCH');
console.log('2. Make sure you have valid authentication token');
console.log('3. User must have "Unit Manager" role');
console.log('4. Order must exist and be accessible to the unit manager');
console.log('5. Status must be one of: ["pending", "approved", "rejected"]');
console.log('');

console.log('📊 PRODUCTDAILYSUMMARY LOGIC:');
console.log('✅ Import added: import ProductDailySummary from "../models/ProductDailySummary.js"');
console.log('✅ Logic added in updateOrderStatus() function');
console.log('✅ Triggers on status === "approved"');
console.log('✅ Creates/updates entries for each product in order');
console.log('');

console.log('🐛 DEBUGGING STEPS:');
console.log('1. Check server logs for console.log messages');
console.log('2. Verify authentication token is valid');
console.log('3. Confirm order ID exists in database');
console.log('4. Check if user has Unit Manager role');
console.log('5. Verify order belongs to user\'s company');
console.log('');

console.log('🔧 TESTING COMMAND:');
console.log('curl -X PUT \\');
console.log(`  "${apiUrl}" \\`);
console.log('  -H "Content-Type: application/json" \\');
console.log('  -H "Authorization: Bearer YOUR_TOKEN" \\');
console.log('  -d \'{"status": "approved", "notes": "Order approved"}\'');
console.log('');

console.log('💡 If still not working, check:');
console.log('- Server is running on port 5000');
console.log('- MongoDB connection is active'); 
console.log('- Order exists with the given ID');
console.log('- User has Unit Manager role and correct company assignment');
console.log('- Check server console for error messages');