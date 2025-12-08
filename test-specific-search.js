/**
 * Test Script for Specific Search Issue
 * =====================================
 * 
 * Testing search for: "Everyday PremiumSoft Milk Bread 400g (RRL)"
 * Database item name: "Everyday PremiumSoft Milk Bread 400g (RRL)"
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Simple Item schema for testing
const ItemSchema = new mongoose.Schema({
  name: String,
  code: String,
  category: String,
  description: String
}, { 
  collection: 'items',
  strict: false
});

const Item = mongoose.model('TestItem', ItemSchema);

async function testSpecificSearch() {
  try {
    console.log('🔍 Testing Specific Search Issue');
    console.log('================================\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Test exact item name search
    const searchTerm = "Everyday PremiumSoft Milk Bread 400g (RRL)";
    console.log(`🎯 Searching for: "${searchTerm}"`);
    
    // Test different search patterns
    const searchPatterns = [
      {
        name: "Exact match",
        pattern: searchTerm
      },
      {
        name: "Without parentheses",
        pattern: "Everyday PremiumSoft Milk Bread 400g RRL"
      },
      {
        name: "First few words",
        pattern: "Everyday PremiumSoft Milk"
      },
      {
        name: "Just Everyday PremiumSoft",
        pattern: "Everyday PremiumSoft"
      },
      {
        name: "Case variations",
        pattern: "everyday premiumsoft"
      }
    ];
    
    for (const test of searchPatterns) {
      console.log(`\n📝 Testing: ${test.name}`);
      console.log(`   Pattern: "${test.pattern}"`);
      
      try {
        // Split search into words for better matching
        const searchWords = test.pattern.trim().split(/\s+/).filter(word => word.length > 0);
        let query = {};
        
        if (searchWords.length === 1) {
          // Single word search
          const escapedSearch = searchWords[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          query.$or = [
            { name: { $regex: escapedSearch, $options: 'i' } },
            { code: { $regex: escapedSearch, $options: 'i' } },
            { description: { $regex: escapedSearch, $options: 'i' } }
          ];
        } else {
          // Multi-word search
          const wordRegexes = searchWords.map(word => ({
            name: { $regex: word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
          }));
          
          const exactPhrase = test.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          
          query.$or = [
            { $and: wordRegexes },
            { name: { $regex: exactPhrase, $options: 'i' } },
            { code: { $regex: exactPhrase, $options: 'i' } },
            { description: { $regex: exactPhrase, $options: 'i' } }
          ];
        }
        
        const results = await Item.find(query).limit(5);
        console.log(`   ✅ Found ${results.length} items`);
        
        if (results.length > 0) {
          results.forEach((item, index) => {
            console.log(`      ${index + 1}. ${item.name} (${item.code || 'No Code'})`);
          });
        }
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
    
    // Also test the exact database query
    console.log('\n📊 Direct Database Query Test:');
    console.log('===============================');
    
    // Find items containing "Everyday" and "PremiumSoft"
    const directQuery = {
      $and: [
        { name: { $regex: 'Everyday', $options: 'i' } },
        { name: { $regex: 'PremiumSoft', $options: 'i' } }
      ]
    };
    
    const directResults = await Item.find(directQuery);
    console.log(`Found ${directResults.length} items with Everyday + PremiumSoft:`);
    
    directResults.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.name}`);
      console.log(`      Code: ${item.code || 'No Code'}`);
      console.log(`      Category: ${item.category || 'No Category'}`);
    });
    
    // Test for items with similar names
    console.log('\n🔎 Finding similar items:');
    const similarQuery = { name: { $regex: 'Everyday.*Milk.*Bread', $options: 'i' } };
    const similarResults = await Item.find(similarQuery);
    console.log(`Found ${similarResults.length} items matching pattern:`);
    
    similarResults.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\n🔌 Disconnected from MongoDB');
    }
  }
}

testSpecificSearch().catch(console.error);