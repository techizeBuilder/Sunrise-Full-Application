import fs from 'fs';

async function testProductionGroupView() {
  try {
    console.log('🧪 Testing Production Group View API...');
    
    // Read token
    const token = fs.readFileSync('token.txt', 'utf8').trim();
    
    // Test the specific production group
    const groupId = '69282ff604abfe9cb49b3e17';
    
    console.log(`📝 Testing group ID: ${groupId}`);
    
    // Make API call
    const response = await fetch(`http://localhost:5000/api/unit-head/production-groups/${groupId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('📡 Response status:', response.status);
    
    const result = await response.json();
    console.log('📋 Response body:', JSON.stringify(result, null, 2));
    
    if (result.success && result.data) {
      console.log('✅ Production group found!');
      console.log('📊 Items count:', result.data.items?.length || 0);
      if (result.data.items && result.data.items.length > 0) {
        console.log('🔍 Sample item:', {
          id: result.data.items[0]._id,
          name: result.data.items[0].name,
          image: result.data.items[0].image
        });
      }
    } else {
      console.log('❌ Error or no data:', result.message);
    }
    
  } catch (error) {
    console.error('🚨 Test error:', error.message);
  }
}

async function testAvailableItems() {
  try {
    console.log('\n🧪 Testing Available Items API...');
    
    // Read token
    const token = fs.readFileSync('token.txt', 'utf8').trim();
    
    // Make API call
    const response = await fetch('http://localhost:5000/api/unit-head/production-groups/items/available', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('📡 Response status:', response.status);
    
    const result = await response.json();
    console.log('📋 Available items count:', result.data?.items?.length || 0);
    console.log('📋 Assigned items count:', result.data?.assignedItemsCount || 0);
    
    if (result.data?.items?.length > 0) {
      const sampleItem = result.data.items[0];
      console.log('🔍 Sample available item:', {
        id: sampleItem._id,
        name: sampleItem.name,
        image: sampleItem.image
      });
    }
    
  } catch (error) {
    console.error('🚨 Test error:', error.message);
  }
}

// Run both tests
testProductionGroupView().then(() => testAvailableItems());