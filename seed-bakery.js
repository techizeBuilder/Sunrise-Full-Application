import mongoose from 'mongoose';
import { seedBakeryCategories } from './server/seed/seedBakeryCategories.js';
import { seedBakeryInventory } from './server/seed/seedBakeryInventory.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manufacturing-erp';

const seedBakery = async () => {
  try {
    console.log('🚀 Starting bakery data seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');
    
    // Seed categories first
    await seedBakeryCategories();
    
    // Then seed inventory items
    await seedBakeryInventory();
    
    console.log('🎉 Bakery data seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
};

seedBakery();