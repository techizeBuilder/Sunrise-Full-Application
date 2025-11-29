// Test data to verify the realcode group calculation
console.log('🧮 Testing realcode group batch calculation...\n');

// Mock your data structure based on what you mentioned
const mockProductGroups = [
  {
    name: 'realcode',
    items: [
      { _id: 'pizaa_item_1', name: 'PIZAA' },
      { _id: 'pizaa_item_2', name: 'PIZAA' },
      { _id: 'other_item_1', name: 'Other Item' }
    ]
  }
];

const mockProductDailySummary = [
  { productId: 'pizaa_item_1', productionFinalBatches: 32 },
  { productId: 'pizaa_item_2', productionFinalBatches: 450 },
  { productId: 'other_item_1', productionFinalBatches: 0 }
];

console.log('📊 Production Groups:', mockProductGroups);
console.log('📈 Product Daily Summary:', mockProductDailySummary);

// Calculate like the API does
const dashBoardData = [];

for (const group of mockProductGroups) {
  if (!group.items || group.items.length === 0) {
    dashBoardData.push({
      productGroup: group.name,
      noOfBatchesForProduction: 0
    });
    continue;
  }

  // Get all item IDs from this production group
  const itemIds = group.items.map(item => item._id);
  
  // Find matching summaries for items in this group
  const productSummaries = mockProductDailySummary.filter(summary => 
    itemIds.includes(summary.productId)
  );
  
  // Calculate total productionFinalBatches for all items in this group
  const totalBatches = productSummaries.reduce((total, summary) => {
    return total + (summary.productionFinalBatches || 0);
  }, 0);
  
  dashBoardData.push({
    productGroup: group.name,
    noOfBatchesForProduction: totalBatches
  });
  
  console.log(`\n✅ Group "${group.name}": ${group.items.length} items, ${totalBatches} total batches`);
  console.log(`   - PIZAA item 1: ${mockProductDailySummary[0].productionFinalBatches} batches`);
  console.log(`   - PIZAA item 2: ${mockProductDailySummary[1].productionFinalBatches} batches`);
  console.log(`   - Total: ${mockProductDailySummary[0].productionFinalBatches} + ${mockProductDailySummary[1].productionFinalBatches} = ${totalBatches}`);
}

console.log('\n🎯 Final API Response would be:');
const apiResponse = {
  success: true,
  message: 'Production dashboard data fetched successfully',
  data: dashBoardData,
  stats: {
    totalGroups: mockProductGroups.length,
    totalItems: mockProductGroups.reduce((total, group) => total + group.items.length, 0)
  }
};

console.log(JSON.stringify(apiResponse, null, 2));

console.log('\n📋 Frontend Table would show:');
dashBoardData.forEach((item, index) => {
  console.log(`${index + 1}. ${item.productGroup}: ${item.noOfBatchesForProduction} batches`);
});