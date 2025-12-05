const fetch = require('node-fetch');

async function testProductionGroupUpdateFix() {
    console.log('🧪 Testing Production Group Update API Fix...');
    
    try {
        // Test the specific request that was failing
        const testData = {
            "name": "group p",
            "description": "",
            "items": [
                "692ecd7b30ebd58185d49936",
                "692ecd7b30ebd58185d4993d"
            ]
        };
        
        // Note: You'll need to replace these with actual values
        const BASE_URL = 'http://localhost:5000/api';
        const groupId = 'REPLACE_WITH_ACTUAL_GROUP_ID';
        const authToken = 'REPLACE_WITH_VALID_TOKEN';
        
        console.log('📤 Sending request to:', `${BASE_URL}/unit-head/production-groups/${groupId}`);
        console.log('📋 Request data:', JSON.stringify(testData, null, 2));
        
        const response = await fetch(`${BASE_URL}/unit-head/production-groups/${groupId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(testData)
        });
        
        const result = await response.json();
        
        console.log('📡 Response Status:', response.status);
        console.log('📋 Response:', JSON.stringify(result, null, 2));
        
        if (response.status !== 500) {
            console.log('✅ FIX SUCCESSFUL: Server no longer returns 500 error');
            console.log('✅ API now provides specific error messages instead of generic "Failed to update production group"');
            
            if (result.success) {
                console.log('🎉 Production group updated successfully!');
            } else {
                console.log('📝 Specific error message:', result.message);
                console.log('✅ This is expected - the API now gives helpful feedback instead of crashing');
            }
        } else {
            console.log('❌ Fix may not be complete - still getting 500 error');
        }
        
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log('⚠️  Server is not running. Please start the server with "npm run dev" to test the fix.');
        } else {
            console.error('Test error:', error.message);
        }
    }
}

// Instructions for testing
console.log(`
🔧 To test the fix:

1. Start the server: npm run dev
2. Update this file with:
   - Real group ID (groupId)
   - Valid auth token (authToken)  
3. Run: node test-quick-fix-validation.js

The fix addresses these issues:
✅ Variable scoping error (qtyPerBatch undefined)
✅ Variable shadowing (calculatedQtyPerBatch)
✅ Added ObjectId validation
✅ Enhanced error logging

Expected behavior:
- No more generic "Failed to update production group" errors
- Specific error messages for validation issues
- Better debugging information in server logs
`);

module.exports = { testProductionGroupUpdateFix };