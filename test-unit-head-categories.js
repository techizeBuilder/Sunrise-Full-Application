const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const { Category } = require('./server/models/Inventory.js');
const { Item } = require('./server/models/Inventory.js');
const User = require('./server/models/User.js');

async function testUnitHeadCategories() {
  try {
    console.log('🔍 Testing Unit Head Categories Issue...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📊 Connected to database');
    
    // Find a unit head user
    const unitHead = await User.findOne({ role: 'Unit Head' }).populate('companyId');
    if (!unitHead) {
      console.log('❌ No Unit Head found');
      return;
    }
    
    console.log('👤 Found Unit Head:', {
      username: unitHead.username,
      companyId: unitHead.companyId?._id,
      companyName: unitHead.companyId?.name
    });
    
    // Get all categories
    const allCategories = await Category.find().sort({ createdAt: -1, name: 1 });
    console.log(`📋 Total categories in database: ${allCategories.length}`);
    
    // Check each category for products in the unit head's company
    console.log('\n🔍 Checking categories with products...');
    for (const category of allCategories) {
      const productCount = await Item.countDocuments({ 
        category: category.name,
        store: unitHead.companyId?._id 
      });
      
      console.log(`📊 Category "${category.name}" - Products: ${productCount} (Company: ${unitHead.companyId?.name || 'No Company'})`);
      
      if (productCount === 0) {
        console.log(`  ⚠️  Category "${category.name}" has 0 products in this company`);
      }
    }
    
    // Check if there are any categories without names or with null values
    const categoriesWithIssues = allCategories.filter(cat => !cat.name || cat.name === null || cat.name === '');
    if (categoriesWithIssues.length > 0) {
      console.log('\n❌ Categories with null/empty names found:');
      categoriesWithIssues.forEach(cat => {
        console.log(`  - Category ID: ${cat._id}, Name: "${cat.name}", Description: "${cat.description}"`);
      });
    }
    
    // Test the exact same logic as the controller
    console.log('\n🧪 Testing controller logic...');
    const categoriesWithCount = await Promise.all(
      allCategories.map(async (category) => {
        const productCount = await Item.countDocuments({ 
          category: category.name,
          store: unitHead.companyId?._id 
        });
        const categoryObj = category.toObject();
        categoryObj.productCount = productCount;
        return categoryObj;
      })
    );
    
    const nullCategories = categoriesWithCount.filter(cat => !cat.name);
    if (nullCategories.length > 0) {
      console.log('❌ Found categories with null names in result:');
      nullCategories.forEach(cat => console.log(`  - ${JSON.stringify(cat)}`));
    }
    
    console.log(`✅ Result would return ${categoriesWithCount.length} categories`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testUnitHeadCategories();