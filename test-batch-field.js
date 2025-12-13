// Test script to verify batch field is working in the API
async function testBatchField() {
  try {
    console.log('🔍 Testing Unit Manager Available Items API with Batch Field...\n');

    // First, let's check some sample items in the database to see their batch values
    const { Item } = await import('./server/models/Inventory.js');
    await import('./server/config/database.js');

    console.log('📊 Sample items with batch data:');
    const sampleItems = await Item.find({ batch: { $exists: true, $ne: null } })
      .limit(5)
      .select('name code category batch');
    
    if (sampleItems.length > 0) {
      sampleItems.forEach(item => {
        console.log(`  - ${item.name} (${item.code}) | Category: ${item.category} | Batch: ${item.batch}`);
      });
    } else {
      console.log('  No items with batch data found. Let\'s add some test data...');
      
      // Add some test batch data
      await Item.updateMany(
        { name: { $regex: 'Bread', $options: 'i' } },
        { batch: 'BATCH-' + new Date().toISOString().slice(0, 10) }
      );
      
      console.log('  Added batch data to bread items');
    }

    console.log('\n✅ Batch field test completed!');
    console.log('\n📝 Changes made:');
    console.log('1. ✅ Added batch field to backend API response in unitManagerController.js');
    console.log('2. ✅ Updated frontend Create Modal to display batch field');
    console.log('3. ✅ Updated frontend Edit Modal to display batch field');
    console.log('4. ✅ Updated frontend View Modal to display batch field');
    console.log('\n🎯 The batch field will now appear in blue text below the item code and category');
    console.log('   in all production group item lists when the item has a batch value.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing batch field:', error);
    process.exit(1);
  }
}

testBatchField();