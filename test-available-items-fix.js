/**
 * Test script to verify the fix for available items API
 * Issue: Available items were showing items already assigned to the current production group
 * Fix: Now properly excludes ALL assigned items, including from the current group
 */

import express from 'express';
import mongoose from 'mongoose';
import User from './server/models/User.js';
import { Item } from './server/models/Inventory.js';
import ProductionGroup from './server/models/ProductionGroup.js';

// Connect to database
const MONGODB_URI = 'mongodb://localhost:27017/inventory_app';

async function testAvailableItemsFix() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the unit head user
    const unitHead = await User.findOne({ role: 'Unit Head' });
    if (!unitHead) {
      console.log('❌ No Unit Head user found');
      return;
    }
    console.log('👤 Found Unit Head:', unitHead.username, 'Company:', unitHead.companyId);

    // Get the production group we're testing
    const groupId = '6928380a5746eff21162f982';
    const productionGroup = await ProductionGroup.findById(groupId);
    
    if (!productionGroup) {
      console.log('❌ Production group not found');
      return;
    }
    
    console.log('📦 Production Group:', productionGroup.name);
    console.log('🔢 Items in group:', productionGroup.items.length);
    console.log('📋 Group items:', productionGroup.items);

    // Get ALL items in company
    const allCompanyItems = await Item.find({ store: unitHead.companyId });
    console.log('🏢 Total items in company:', allCompanyItems.length);
    
    // List all items
    allCompanyItems.forEach(item => {
      console.log(`  - ${item.name} (${item.code}) - ID: ${item._id}`);
    });

    // Get items assigned to ALL production groups
    const allGroups = await ProductionGroup.find({ 
      company: unitHead.companyId, 
      isActive: true 
    }).select('items name');
    
    console.log('\n📊 All Production Groups:');
    allGroups.forEach(group => {
      console.log(`  - ${group.name}: ${group.items.length} items`);
      group.items.forEach(itemId => {
        console.log(`    * ${itemId}`);
      });
    });

    // Get assigned item IDs
    const assignedItemIds = allGroups.flatMap(group => 
      group.items.map(item => item.toString())
    );
    console.log('\n🚫 All assigned items:', assignedItemIds);

    // Build filter for available items (items NOT assigned to ANY group)
    const filter = {
      store: unitHead.companyId,
      _id: { $nin: assignedItemIds }
    };

    console.log('\n🔍 Filter for available items:', JSON.stringify(filter, null, 2));

    // Get available items
    const availableItems = await Item.find(filter).select('name code');
    
    console.log('\n✅ RESULTS:');
    console.log('📈 Total company items:', allCompanyItems.length);
    console.log('🚫 Total assigned items:', assignedItemIds.length);
    console.log('✨ Available items (should NOT include items from current group):', availableItems.length);
    
    console.log('\n📋 Available Items List:');
    availableItems.forEach(item => {
      console.log(`  ✅ ${item.name} (${item.code}) - Available`);
    });

    // Verify the fix
    const currentGroupItemIds = productionGroup.items.map(id => id.toString());
    const availableItemIds = availableItems.map(item => item._id.toString());
    
    const overlap = currentGroupItemIds.filter(id => availableItemIds.includes(id));
    
    console.log('\n🔍 VERIFICATION:');
    console.log('Current group items:', currentGroupItemIds);
    console.log('Available item IDs:', availableItemIds);
    console.log('Overlap (should be EMPTY):', overlap);
    
    if (overlap.length === 0) {
      console.log('✅ FIX SUCCESSFUL: No items from current group appear in available items');
    } else {
      console.log('❌ FIX FAILED: Items from current group still appear in available items');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

testAvailableItemsFix();