// Test data structure matching for frontend
console.log('🧪 Testing Frontend Data Access...\n');

// Your actual API response
const apiResponse = {
    "success": true,
    "message": "Production dashboard data fetched successfully",
    "data": [
        {
            "productGroup": "realcode",
            "noOfBatchesForProduction": 32
        },
        {
            "productGroup": "aaaa",
            "noOfBatchesForProduction": 0
        },
        {
            "productGroup": "freeServer1",
            "noOfBatchesForProduction": 0
        },
        {
            "productGroup": "jeet",
            "noOfBatchesForProduction": 0
        },
        {
            "productGroup": "moto g85 5G",
            "noOfBatchesForProduction": 514
        },
        {
            "productGroup": "freeServer",
            "noOfBatchesForProduction": 0
        }
    ],
    "stats": {
        "totalGroups": 6,
        "totalItems": 8
    }
};

console.log('📡 API Response:', JSON.stringify(apiResponse, null, 2));

// Test the old (incorrect) data access
const oldAccess = apiResponse?.data?.data || [];
console.log('\n❌ Old Access (dashboardData?.data?.data):', oldAccess);
console.log('Length:', oldAccess.length);

// Test the new (correct) data access  
const newAccess = apiResponse?.data || [];
console.log('\n✅ New Access (dashboardData?.data):', newAccess);
console.log('Length:', newAccess.length);

// Test stats access
const statsAccess = apiResponse?.stats || {};
console.log('\n📊 Stats Access (dashboardData?.stats):', statsAccess);

console.log('\n🎯 Frontend should now show:');
newAccess.forEach((group, index) => {
  console.log(`${index + 1}. ${group.productGroup}: ${group.noOfBatchesForProduction} batches`);
});

console.log('\n📈 Stats cards should show:');
console.log(`Total Production Groups: ${statsAccess.totalGroups}`);
console.log(`Total Items in Production: ${statsAccess.totalItems}`);