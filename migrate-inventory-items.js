// Migration script to assign unassigned inventory items to companies
import mongoose from 'mongoose';
import { Item } from './server/models/Inventory.js';
import { Company } from './server/models/Company.js';

const MONGODB_URI = 'mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manufacturing-erp';

async function migrateInventoryItems() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all companies
    const companies = await Company.find();
    if (companies.length === 0) {
      console.error('No companies found. Please create companies first.');
      process.exit(1);
    }

    console.log('Available companies:');
    companies.forEach((company, index) => {
      console.log(`   ${index + 1}. ${company.name} (${company._id})`);
    });

    // Find items without store assignment
    const unassignedItems = await Item.find({
      $or: [
        { store: { $exists: false } },
        { store: null },
        { store: '' }
      ]
    });

    console.log(`\nFound ${unassignedItems.length} items without store assignment`);

    if (unassignedItems.length === 0) {
      console.log('No items need migration.');
      return;
    }

    // Distribute items across companies evenly
    // For demo purposes, we'll assign them to different companies based on category
    const companyAssignments = {
      'Breads': companies[0]?._id, // Akshaya Foods
      'NRB': companies[1]?._id,    // Sunrise Foods
      'Dairy': companies[2]?._id,  // Sunrise Foods (Bangalore)
      'Bakery': companies[3]?._id, // Sunrise Foods (Tirupati)
    };

    // Default company for unknown categories
    const defaultCompany = companies[0]._id; // Akshaya Foods

    for (const item of unassignedItems) {
      // Assign based on category, or use default
      const assignedCompanyId = companyAssignments[item.category] || defaultCompany;
      
      await Item.updateOne(
        { _id: item._id },
        { $set: { store: assignedCompanyId } }
      );

      const company = companies.find(c => c._id.toString() === assignedCompanyId.toString());
      console.log(`✅ Assigned item "${item.name}" (${item.code}) to ${company?.name}`);
    }

    // Show final distribution
    console.log('\n--- Final Distribution ---');
    for (const company of companies) {
      const itemCount = await Item.countDocuments({ store: company._id });
      console.log(`${company.name}: ${itemCount} items`);
    }

    // Show total assigned items
    const totalAssigned = await Item.countDocuments({ 
      store: { $exists: true, $ne: null, $ne: '' } 
    });
    const totalItems = await Item.countDocuments();
    
    console.log(`\n📊 Migration Summary:`);
    console.log(`   Total items: ${totalItems}`);
    console.log(`   Assigned items: ${totalAssigned}`);
    console.log(`   Unassigned items: ${totalItems - totalAssigned}`);
    
    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
migrateInventoryItems();