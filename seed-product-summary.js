import mongoose from 'mongoose';
import { config } from './server/config/environment.js';
import connectDB from './server/config/database.js';
import ProductDailySummary from './server/models/ProductDailySummary.js';
import ProductionGroup from './server/models/ProductionGroup.js';
import { Company } from './server/models/Company.js';
import { Item } from './server/models/Inventory.js';

async function seedProductDailySummary() {
  try {
    console.log('🌱 Seeding ProductDailySummary data...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');

    // Get all companies
    const companies = await Company.find({});
    console.log(`📊 Found ${companies.length} companies`);

    // Get all production groups with their items
    const productionGroups = await ProductionGroup.find({ isActive: true })
      .populate('items', 'name')
      .populate('company', 'name');
    
    console.log(`📊 Found ${productionGroups.length} production groups`);

    // Today's date
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    let createdCount = 0;

    for (const group of productionGroups) {
      if (!group.items || group.items.length === 0) {
        console.log(`⚠️  Skipping group "${group.name}" - no items`);
        continue;
      }

      console.log(`\n📦 Processing group: ${group.name} (${group.items.length} items)`);
      console.log(`🏢 Company: ${group.company?.name || 'Unknown'} (${group.company})`);

      for (const item of group.items) {
        try {
          // Check if summary already exists
          const existing = await ProductDailySummary.findOne({
            date: today,
            companyId: group.company,
            productId: item._id
          });

          if (existing) {
            console.log(`   ✅ ${item.name}: Already exists (qtyPerBatch: ${existing.qtyPerBatch})`);
            continue;
          }

          // Create new summary with sample data
          const summary = new ProductDailySummary({
            date: today,
            companyId: group.company,
            productId: item._id,
            productName: item.name,
            qtyPerBatch: Math.floor(Math.random() * 50) + 10, // Random between 10-60
            packing: Math.floor(Math.random() * 30) + 5,     // Random between 5-35
            physicalStock: Math.floor(Math.random() * 200) + 50, // Random between 50-250
            totalIndent: Math.floor(Math.random() * 300) + 100   // Random between 100-400
          });

          // Calculate derived fields
          summary.calculateFormulas();
          
          await summary.save();
          console.log(`   ✅ ${item.name}: Created (qtyPerBatch: ${summary.qtyPerBatch})`);
          createdCount++;

        } catch (error) {
          console.log(`   ❌ ${item.name}: Error - ${error.message}`);
        }
      }
    }

    console.log(`\n🎉 Seeding completed! Created ${createdCount} ProductDailySummary records`);

    // Show sample data
    const samples = await ProductDailySummary.find({})
      .populate('companyId', 'name')
      .limit(5)
      .sort({ createdAt: -1 });
    
    console.log('\n📋 Sample records created:');
    samples.forEach(sample => {
      console.log(`   ${sample.productName}: qtyPerBatch=${sample.qtyPerBatch}, Company=${sample.companyId?.name || sample.companyId}`);
    });

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from database');
  }
}

// Run the seeding
seedProductDailySummary();