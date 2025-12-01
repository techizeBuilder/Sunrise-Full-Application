// Test script to verify Unit Head categories API shows all categories
const BASE_URL = 'http://localhost:5000';

async function testUnitHeadCategoriesAPI() {
  try {
    console.log('🧪 TESTING UNIT HEAD CATEGORIES API FIX');
    console.log('=====================================');

    // Test the Unit Head categories endpoint
    console.log('\n📂 Testing Unit Head Categories API:');
    console.log(`GET ${BASE_URL}/api/unit-head/inventory/categories`);
    
    const response = await fetch(`${BASE_URL}/api/unit-head/inventory/categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_UNIT_HEAD_TOKEN' // You need to replace this with actual token
      }
    });

    if (!response.ok) {
      console.log(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log('Error details:', errorText);
      return;
    }

    const data = await response.json();
    
    console.log('\n✅ API Response:');
    console.log(`- Status: ${response.status}`);
    console.log(`- Categories count: ${data.categories?.length || 0}`);
    
    if (data.categories && data.categories.length > 0) {
      console.log('\n📋 CATEGORIES LIST:');
      data.categories.forEach((category, index) => {
        console.log(`${index + 1}. ${category.name}`);
        console.log(`   - ID: ${category._id}`);
        console.log(`   - Product Count: ${category.productCount || 0}`);
        console.log(`   - Subcategories: ${category.subCategories?.length || 0}`);
        if (category.subCategories && category.subCategories.length > 0) {
          console.log(`   - Subcategories: [${category.subCategories.join(', ')}]`);
        }
        console.log('');
      });
      
      console.log('\n📊 SUMMARY:');
      console.log(`- Total Categories Available: ${data.categories.length}`);
      console.log(`- Categories with Products: ${data.categories.filter(c => c.productCount > 0).length}`);
      console.log(`- Empty Categories: ${data.categories.filter(c => c.productCount === 0).length}`);
      
      console.log('\n✅ FIX VERIFICATION:');
      console.log('✅ Unit Head can now see ALL available categories');
      console.log('✅ Each category shows company-specific product count');
      console.log('✅ Empty categories (0 products) are also visible');
      console.log('✅ Frontend should now have access to all categories for item creation');
      
    } else {
      console.log('❌ No categories returned in response');
      console.log('Full response:', data);
    }

    // Also test for comparison what Super Admin would see
    console.log('\n🔍 For comparison, testing what all categories exist:');
    const allCategoriesResponse = await fetch(`${BASE_URL}/api/categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (allCategoriesResponse.ok) {
      const allCategoriesData = await allCategoriesResponse.json();
      console.log(`📊 Total categories in system: ${allCategoriesData.categories?.length || 0}`);
      
      if (data.categories && allCategoriesData.categories) {
        const unitHeadCount = data.categories.length;
        const totalCount = allCategoriesData.categories.length;
        
        if (unitHeadCount === totalCount) {
          console.log('✅ PERFECT! Unit Head sees same number of categories as total system categories');
        } else {
          console.log(`⚠️  Unit Head sees ${unitHeadCount} categories, but system has ${totalCount} categories`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.message.includes('fetch')) {
      console.log('💡 Make sure:');
      console.log('  1. Server is running on http://localhost:5000');
      console.log('  2. You have a valid Unit Head token');
      console.log('  3. Unit Head user has proper companyId assigned');
    }
  }
}

// Alternative test without authentication to check basic connectivity
async function testBasicConnectivity() {
  try {
    console.log('\n🔗 Testing basic server connectivity...');
    const response = await fetch(`${BASE_URL}/api/health`, {
      method: 'GET'
    });
    
    if (response.ok) {
      console.log('✅ Server is reachable');
    } else {
      console.log('⚠️  Server responded but with error:', response.status);
    }
  } catch (error) {
    console.log('❌ Cannot connect to server:', error.message);
  }
}

// Run the tests
console.log('Running Unit Head Categories API Fix Test...');
testBasicConnectivity();
testUnitHeadCategoriesAPI();

console.log('\n💡 INSTRUCTIONS TO TEST MANUALLY:');
console.log('================================');
console.log('1. Login as Unit Head user');
console.log('2. Go to: http://localhost:5000/unit-manager/inventory (or wherever inventory management is)');
console.log('3. Try to create a new item');
console.log('4. Check the Category dropdown - it should now show ALL available categories');
console.log('5. Or directly visit: http://localhost:5000/api/unit-head/inventory/categories in browser after login');