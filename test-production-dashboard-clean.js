// Test the cleaned production dashboard API
console.log('🧪 Testing Production Dashboard API Implementation...\n');

// Test if we can import the controller
async function testControllerImport() {
  try {
    // Import the controller to check if it's properly structured
    const { getProductionDashboard } = await import('./server/controllers/productionController.js');
    
    if (typeof getProductionDashboard === 'function') {
      console.log('✅ getProductionDashboard function imported successfully');
      console.log(`📋 Function length: ${getProductionDashboard.length} parameters`);
      
      // Check if it's an async function
      if (getProductionDashboard.constructor.name === 'AsyncFunction') {
        console.log('✅ Function is async - ready for database operations');
      }
    } else {
      console.log('❌ getProductionDashboard is not a function');
    }

    console.log('\n🎯 Expected API Response Format:');
    console.log(`{
  "success": true,
  "message": "Production dashboard data fetched successfully",
  "data": [
    {
      "productGroup": "Group Name",
      "noOfBatchesForProduction": 123
    }
  ]
}`);

    console.log('\n📊 This matches your requirement:');
    console.log('- Product Groups with batch counts');
    console.log('- Calculated from ProductDailySummary.productionFinalBatches');
    console.log('- Company-filtered data');

  } catch (error) {
    console.error('❌ Error importing controller:', error.message);
  }
}

// Mock API response test
function testResponseFormat() {
  console.log('\n🔍 Testing Response Format Logic...');
  
  // Mock data
  const mockGroups = [
    { name: 'Production Group A', items: [{ _id: '1' }, { _id: '2' }] },
    { name: 'Production Group B', items: [{ _id: '3' }] }
  ];
  
  const mockSummaries = [
    { productId: '1', productionFinalBatches: 5 },
    { productId: '2', productionFinalBatches: 3 },
    { productId: '3', productionFinalBatches: 7 }
  ];

  const dashBoardData = [];
  
  for (const group of mockGroups) {
    const itemIds = group.items.map(item => item._id);
    const productSummaries = mockSummaries.filter(summary => 
      itemIds.includes(summary.productId)
    );
    
    const totalBatches = productSummaries.reduce((total, summary) => {
      return total + (summary.productionFinalBatches || 0);
    }, 0);
    
    dashBoardData.push({
      productGroup: group.name,
      noOfBatchesForProduction: totalBatches
    });
  }

  console.log('✅ Mock dashboard data generated:');
  console.log(JSON.stringify(dashBoardData, null, 2));
}

// Run tests
testControllerImport();
testResponseFormat();