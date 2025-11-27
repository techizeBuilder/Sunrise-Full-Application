import fs from 'fs';

async function testUpdateAPI() {
  try {
    // Read token
    const token = fs.readFileSync('token.txt', 'utf8').trim();
    
    console.log('🧪 Testing Update API...\n');
    
    const groupId = '69282e3cac4004176d1fb2a1';
    
    // Test update
    console.log('📝 Testing group update');
    const updateResponse = await fetch(`http://localhost:5000/api/unit-head/production-groups/${groupId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: "freeServer Updated",
        description: "dadas updated",
        items: [
          "691ebdd29481411b974a12d5",
          "68bff35e71ef51a68b5d7ab6"
        ]
      })
    });
    
    console.log('📡 Update response status:', updateResponse.status);
    
    if (updateResponse.status === 200) {
      const updateData = await updateResponse.json();
      console.log('✅ Update successful:', {
        success: updateData.success,
        message: updateData.message
      });
    } else {
      const errorText = await updateResponse.text();
      console.log('❌ Update failed:', errorText);
    }
    
  } catch (error) {
    console.error('🚨 Test error:', error.message);
  }
}

testUpdateAPI();