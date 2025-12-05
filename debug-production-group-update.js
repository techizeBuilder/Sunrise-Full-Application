const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000/api';

async function testProductionGroupUpdate() {
  try {
    console.log('🧪 Testing Production Group Update API');
    
    // First, let's check if the items exist
    console.log('\n1. Checking if items exist in database...');
    const itemsToCheck = ["692ecd7b30ebd58185d49936", "692ecd7b30ebd58185d4993d"];
    
    for (const itemId of itemsToCheck) {
      console.log(`Checking item: ${itemId}`);
      
      // Check in Items collection
      try {
        const itemResponse = await fetch(`${BASE_URL}/items/${itemId}`, {
          headers: {
            'Authorization': 'Bearer YOUR_TOKEN_HERE'
          }
        });
        console.log(`Item ${itemId} status: ${itemResponse.status}`);
        if (itemResponse.ok) {
          const itemData = await itemResponse.json();
          console.log(`Item found: ${itemData.name || 'Unknown'}`);
        }
      } catch (error) {
        console.log(`Error checking item ${itemId}:`, error.message);
      }
    }
    
    console.log('\n2. Testing the actual update request...');
    
    // Test the update request
    const updateData = {
      "name": "group p",
      "description": "",
      "items": [
        "692ecd7b30ebd58185d49936",
        "692ecd7b30ebd58185d4993d"
      ]
    };
    
    // You'll need to replace GROUP_ID with an actual group ID
    const groupId = "REPLACE_WITH_ACTUAL_GROUP_ID";
    
    const response = await fetch(`${BASE_URL}/unit-head/production-groups/${groupId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN_HERE'
      },
      body: JSON.stringify(updateData)
    });
    
    console.log('Response status:', response.status);
    const result = await response.json();
    console.log('Response data:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testProductionGroupUpdate();