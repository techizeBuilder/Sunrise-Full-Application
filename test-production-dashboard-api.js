const { MongoClient, ObjectId } = require('mongodb');

// Test Production Dashboard API to verify new batch calculation format
async function testProductionDashboardAPI() {
  console.log('🧪 Testing Production Dashboard API...\n');
  
  try {
    // Make request to production dashboard API
    const response = await fetch('http://localhost:5000/api/production/dashboard', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // You'll need to add a valid JWT token here
        'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE'
      }
    });

    if (!response.ok) {
      console.error('❌ API Request failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return;
    }

    const data = await response.json();
    
    console.log('✅ Production Dashboard API Response:');
    console.log(JSON.stringify(data, null, 2));
    
    // Verify the new format
    if (data.success && Array.isArray(data.data)) {
      console.log('\n✅ New format verified! Production Groups with Batch Counts:');
      data.data.forEach((item, index) => {
        console.log(`${index + 1}. ${item.productGroup}: ${item.noOfBatchesForProduction} batches`);
      });
    } else {
      console.log('\n⚠️ Response format might not be the expected new format');
    }

  } catch (error) {
    console.error('❌ Error testing Production Dashboard API:', error.message);
    
    // Also test database connection if API fails
    console.log('\n🔍 Testing database connection directly...');
    await testDatabaseDirectly();
  }
}

// Test database directly to see if ProductDailySummary data exists
async function testDatabaseDirectly() {
  let client;
  
  try {
    // Connect to MongoDB
    client = new MongoClient('mongodb://localhost:27017'); // Adjust connection string as needed
    await client.connect();
    
    const db = client.db('inventory'); // Adjust database name as needed
    
    console.log('✅ Connected to database');
    
    // Check ProductionGroup collection
    const productionGroups = await db.collection('productiongroups').find({}).limit(5).toArray();
    console.log(`\n📊 Found ${productionGroups.length} Production Groups:`);
    productionGroups.forEach((group, index) => {
      console.log(`${index + 1}. ${group.name} - ${group.items?.length || 0} items`);
    });
    
    // Check ProductDailySummary collection
    const dailySummaries = await db.collection('productdailysummaries').find({}).limit(5).toArray();
    console.log(`\n📈 Found ${dailySummaries.length} ProductDailySummary records:`);
    dailySummaries.forEach((summary, index) => {
      console.log(`${index + 1}. Product: ${summary.productId}, Batches: ${summary.productionFinalBatches || 0}`);
    });
    
    // Calculate sample batch counts
    if (productionGroups.length > 0 && dailySummaries.length > 0) {
      console.log('\n🧮 Sample calculation for first Production Group:');
      const firstGroup = productionGroups[0];
      if (firstGroup.items && firstGroup.items.length > 0) {
        const itemIds = firstGroup.items.map(item => typeof item === 'object' ? item.toString() : item);
        const groupSummaries = dailySummaries.filter(summary => 
          itemIds.includes(summary.productId?.toString())
        );
        const totalBatches = groupSummaries.reduce((total, summary) => 
          total + (summary.productionFinalBatches || 0), 0
        );
        
        console.log(`Group "${firstGroup.name}": ${totalBatches} total batches`);
        console.log(`- ${firstGroup.items.length} items in group`);
        console.log(`- ${groupSummaries.length} matching daily summaries found`);
      }
    }
    
  } catch (error) {
    console.error('❌ Database test error:', error.message);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the test
testProductionDashboardAPI();