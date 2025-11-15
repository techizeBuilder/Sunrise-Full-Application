// Script to assign PAV-400 item to jeetu01's company
import mongoose from 'mongoose';
import { Item } from './server/models/Inventory.js';
import User from './server/models/User.js';

const MONGODB_URI = 'mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manufacturing-erp';

async function assignItemToJeetu() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find jeetu01 user
    const jeetuUser = await User.findOne({ username: 'jeetu01' });
    if (!jeetuUser) {
      console.error('User jeetu01 not found!');
      return;
    }

    console.log(`User jeetu01 details:`);
    console.log(`  Company ID: ${jeetuUser.companyId}`);

    // Find PAV-400 item
    const pavItem = await Item.findOne({ code: 'SPA0001' }); // PAV-400
    if (!pavItem) {
      console.error('PAV-400 item not found!');
      return;
    }

    console.log(`\nPAV-400 item details:`);
    console.log(`  Name: ${pavItem.name}`);
    console.log(`  Code: ${pavItem.code}`);
    console.log(`  Current Store: ${pavItem.store}`);
    console.log(`  Category: ${pavItem.category}`);

    // Update the item to belong to jeetu01's company
    await Item.updateOne(
      { _id: pavItem._id },
      { $set: { store: jeetuUser.companyId } }
    );

    console.log(`\n✅ Successfully moved PAV-400 to jeetu01's company!`);
    console.log(`  From: ${pavItem.store}`);
    console.log(`  To: ${jeetuUser.companyId}`);

    // Verify the change
    const updatedItem = await Item.findById(pavItem._id);
    console.log(`\n🔍 Verification:`);
    console.log(`  PAV-400 now belongs to store: ${updatedItem.store}`);

    // Check how many items jeetu01 can see now
    const jeetuItems = await Item.find({ store: jeetuUser.companyId });
    console.log(`\n📊 Items visible to jeetu01: ${jeetuItems.length}`);
    jeetuItems.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.name} (${item.code})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

assignItemToJeetu();