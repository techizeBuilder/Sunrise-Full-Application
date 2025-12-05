// Test script to validate the production group update API fix

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

async function testProductionGroupUpdate() {
    try {
        console.log('🧪 Testing Production Group Update Fix');
        
        const testData = {
            "name": "group p",
            "description": "",
            "items": [
                "692ecd7b30ebd58185d49936", // These are the IDs from your request
                "692ecd7b30ebd58185d4993d"
            ]
        };
        
        // Replace with actual group ID and auth token
        const groupId = "REPLACE_WITH_ACTUAL_GROUP_ID";
        const authToken = "REPLACE_WITH_AUTH_TOKEN";
        
        console.log('🔍 Request Data:', JSON.stringify(testData, null, 2));
        
        const response = await fetch(`${BASE_URL}/unit-head/production-groups/${groupId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(testData)
        });
        
        console.log('📡 Response Status:', response.status);
        console.log('📡 Response Headers:', Object.fromEntries(response.headers));
        
        const result = await response.json();
        console.log('📋 Response Body:', JSON.stringify(result, null, 2));
        
        if (result.success) {
            console.log('✅ Test PASSED - Production group update successful');
        } else {
            console.log('❌ Test FAILED - Production group update failed');
            console.log('Error:', result.message);
        }
        
    } catch (error) {
        console.error('💥 Test Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Uncomment to run the test
// testProductionGroupUpdate();

export { testProductionGroupUpdate };