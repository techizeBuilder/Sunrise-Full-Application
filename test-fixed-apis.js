import fs from 'fs';

async function testFixes() {
  try {
    // Read token
    const token = fs.readFileSync('token.txt', 'utf8').trim();
    
    console.log('🧪 Testing Fixed APIs...\n');
    
    // Test 1: Available Items API (should have NO pagination)
    console.log('📋 Test 1: Available Items API');
    const availableResponse = await fetch('http://localhost:5000/api/unit-head/production-groups/items/available', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (availableResponse.status === 200) {
      const availableData = await availableResponse.json();
      console.log('✅ Available items loaded:', {
        itemCount: availableData.data?.items?.length || 0,
        totalItems: availableData.data?.totalItems || 0,
        hasImages: availableData.data?.items?.filter(item => item.image).length || 0
      });
      
      if (availableData.data?.items?.length > 0) {
        console.log('🖼️ Sample item with image:', {
          name: availableData.data.items[0].name,
          image: availableData.data.items[0].image
        });
      }
    } else {
      console.log('❌ Available items API failed:', availableResponse.status);
    }
    
    // Test 2: Production Group Details API
    console.log('\n📋 Test 2: Production Group Details');
    const groupId = '69282ff604abfe9cb49b3e17';
    const groupResponse = await fetch(`http://localhost:5000/api/unit-head/production-groups/${groupId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (groupResponse.status === 200) {
      const groupData = await groupResponse.json();
      console.log('✅ Group details loaded:', {
        groupName: groupData.data?.name,
        itemCount: groupData.data?.items?.length || 0,
        hasImages: groupData.data?.items?.filter(item => item.image).length || 0
      });
      
      if (groupData.data?.items?.length > 0) {
        console.log('🖼️ Sample assigned item:', {
          name: groupData.data.items[0].name,
          image: groupData.data.items[0].image
        });
      }
    } else {
      console.log('❌ Group details API failed:', groupResponse.status);
    }
    
    // Test 3: Available Items with Exclusion (for edit mode)
    console.log('\n📋 Test 3: Available Items with Group Exclusion');
    const excludeResponse = await fetch(`http://localhost:5000/api/unit-head/production-groups/items/available?excludeGroupId=${groupId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (excludeResponse.status === 200) {
      const excludeData = await excludeResponse.json();
      console.log('✅ Available items with exclusion:', {
        itemCount: excludeData.data?.items?.length || 0,
        assignedCount: excludeData.data?.assignedItemsCount || 0
      });
    } else {
      console.log('❌ Exclusion API failed:', excludeResponse.status);
    }
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('🚨 Test error:', error.message);
  }
}

testFixes();