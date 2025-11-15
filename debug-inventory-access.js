// Debug script to check inventory item assignments and Unit Head access
import mongoose from 'mongoose';
import { Item } from './server/models/Inventory.js';
import User from './server/models/User.js';
import { Company } from './server/models/Company.js';

const MONGODB_URI = 'mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manufacturing-erp';

async function debugInventoryAccess() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check Unit Head users
    const unitHeads = await User.find({ role: 'Unit Head' });
    console.log('\n👨‍💼 Unit Head Users:');
    unitHeads.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.username}`);
      console.log(`      Company ID: ${user.companyId}`);
    });

    // Check all companies
    const companies = await Company.find();
    console.log('\n🏢 Companies:');
    companies.forEach((company, index) => {
      console.log(`   ${index + 1}. ${company.name} (${company._id})`);
    });

    // Check all inventory items
    const allItems = await Item.find().limit(10);
    console.log('\n📦 Sample Inventory Items:');
    allItems.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.name} (Code: ${item.code})`);
      console.log(`      Store: ${item.store}`);
      console.log(`      Category: ${item.category}`);
    });

    // Check items by store (company)
    const itemsByStore = await Item.aggregate([
      {
        $group: {
          _id: '$store',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('\n📊 Items by Store/Company:');
    for (const storeGroup of itemsByStore) {
      const storeId = storeGroup._id;
      const count = storeGroup.count;
      
      if (storeId && storeId.match(/^[0-9a-fA-F]{24}$/)) {
        const company = await Company.findById(storeId);
        console.log(`   ${company?.name || 'Unknown Company'} (${storeId}): ${count} items`);
      } else {
        console.log(`   ${storeId || 'No Store'}: ${count} items`);
      }
    }

    // Test filtering for a specific Unit Head (jeetu01)
    const jeetuUser = await User.findOne({ username: 'jeetu01' });
    if (jeetuUser) {
      console.log(`\n🧪 Testing filter for Unit Head: ${jeetuUser.username}`);
      console.log(`   Company ID: ${jeetuUser.companyId}`);
      
      if (jeetuUser.companyId) {
        const filteredItems = await Item.find({ store: jeetuUser.companyId });
        console.log(`   Items visible to this Unit Head: ${filteredItems.length}`);
        
        if (filteredItems.length > 0) {
          console.log('   Sample items:');
          filteredItems.slice(0, 3).forEach((item, index) => {
            console.log(`     ${index + 1}. ${item.name} (${item.code})`);
          });
        } else {
          console.log('   ❌ No items found for this company!');
          
          // Check if there are items in similar company names
          const companies = await Company.find();
          const sunriseCompanies = companies.filter(c => c.name.includes('Sunrise'));
          console.log('\n   🔍 Checking similar companies:');
          for (const company of sunriseCompanies) {
            const itemCount = await Item.countDocuments({ store: company._id });
            console.log(`     ${company.name} (${company._id}): ${itemCount} items`);
          }
        }
      } else {
        console.log('   ❌ Unit Head has no company assignment!');
      }
    }

    // Also test the original unithead user
    if (unitHeads.length > 0) {
      const testUnitHead = unitHeads.find(u => u.username === 'unithead') || unitHeads[0];
      console.log(`\n🧪 Testing filter for Unit Head: ${testUnitHead.username}`);
      console.log(`   Company ID: ${testUnitHead.companyId}`);
      
      if (testUnitHead.companyId) {
        const filteredItems = await Item.find({ store: testUnitHead.companyId });
        console.log(`   Items visible to this Unit Head: ${filteredItems.length}`);
        
        if (filteredItems.length > 0) {
          console.log('   Sample items:');
          filteredItems.slice(0, 3).forEach((item, index) => {
            console.log(`     ${index + 1}. ${item.name} (${item.code})`);
          });
        }
      } else {
        console.log('   ❌ Unit Head has no company assignment!');
      }
    }

  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugInventoryAccess();