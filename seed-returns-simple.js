import mongoose from 'mongoose';

const returnSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, required: true },
  customerName: { type: String, required: true },
  returnDate: { type: Date, required: true },
  reason: { type: String, required: true },
  type: { type: String, enum: ['refund', 'damage'], required: true },
  status: { type: String, enum: ['pending', 'approved', 'completed', 'rejected'], default: 'pending' },
  items: [{
    productName: { type: String, required: true },
    brandName: { type: String, required: true },
    pricePerUnit: { type: Number, required: true },
    quantity: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  totalQuantity: { type: Number, required: true }
}, { timestamps: true });

const Return = mongoose.model('Return', returnSchema);

async function seedReturns() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://manuerpshashankrai:OMjLJMsKnPXJmBBj@cluster0.by2xy6x.mongodb.net/manufacturing-erp?retryWrites=true&w=majority');
    
    console.log('Connected to MongoDB');

    const dummyReturns = [
      {
        customerId: '687b2e61cdba7ae1dc5b8c4f',
        customerName: 'Bhopal Chemical Works',
        returnDate: new Date('2025-01-15'),
        reason: 'Damaged packaging during transport',
        type: 'damage',
        status: 'pending',
        items: [{
          productName: 'Britannia Good Day Cashew',
          brandName: 'Britannia',
          pricePerUnit: 25,
          quantity: 10
        }],
        totalAmount: 250,
        totalQuantity: 10
      },
      {
        customerId: '687b2e61cdba7ae1dc5b8c50',
        customerName: 'Mumbai Food Distributors',
        returnDate: new Date('2025-01-16'),
        reason: 'Customer complaint about taste',
        type: 'refund',
        status: 'approved',
        items: [{
          productName: 'Parle-G Biscuits',
          brandName: 'Parle',
          pricePerUnit: 15,
          quantity: 20
        }],
        totalAmount: 300,
        totalQuantity: 20
      },
      {
        customerId: '687b2e61cdba7ae1dc5b8c51',
        customerName: 'Delhi Bakery Supplies',
        returnDate: new Date('2025-01-17'),
        reason: 'Expiry date too close',
        type: 'refund',
        status: 'completed',
        items: [{
          productName: 'Oreo Original Cookies',
          brandName: 'Oreo',
          pricePerUnit: 35,
          quantity: 5
        }],
        totalAmount: 175,
        totalQuantity: 5
      },
      {
        customerId: '687b2e61cdba7ae1dc5b8c52',
        customerName: 'Chennai Snacks Hub',
        returnDate: new Date('2025-01-18'),
        reason: 'Wrong product delivered',
        type: 'refund',
        status: 'pending',
        items: [{
          productName: 'McVities Digestive',
          brandName: 'McVitie\'s',
          pricePerUnit: 65,
          quantity: 8
        }],
        totalAmount: 520,
        totalQuantity: 8
      },
      {
        customerId: '687b2e61cdba7ae1dc5b8c53',
        customerName: 'Kolkata Foods Ltd',
        returnDate: new Date('2025-01-19'),
        reason: 'Quality issue reported by customer',
        type: 'damage',
        status: 'approved',
        items: [{
          productName: 'Sunfeast Dark Fantasy',
          brandName: 'Sunfeast',
          pricePerUnit: 50,
          quantity: 12
        }],
        totalAmount: 600,
        totalQuantity: 12
      },
      {
        customerId: '687b2e61cdba7ae1dc5b8c54',
        customerName: 'Pune Retail Network',
        returnDate: new Date('2025-01-20'),
        reason: 'Broken packaging seal',
        type: 'damage',
        status: 'rejected',
        items: [{
          productName: 'Unibic Butter Cookies',
          brandName: 'Unibic',
          pricePerUnit: 55,
          quantity: 6
        }],
        totalAmount: 330,
        totalQuantity: 6
      }
    ];
    
    // Clear existing data
    await Return.deleteMany({});
    console.log('Cleared existing returns');
    
    // Insert dummy data
    const result = await Return.insertMany(dummyReturns);
    console.log(`✓ Successfully seeded ${result.length} return/damage entries`);
    
    // Display summary
    const totalEntries = await Return.countDocuments();
    const pendingCount = await Return.countDocuments({ status: 'pending' });
    const approvedCount = await Return.countDocuments({ status: 'approved' });
    const completedCount = await Return.countDocuments({ status: 'completed' });
    const rejectedCount = await Return.countDocuments({ status: 'rejected' });
    
    console.log('\n=== SEEDING SUMMARY ===');
    console.log(`Total entries: ${totalEntries}`);
    console.log(`Pending: ${pendingCount}`);
    console.log(`Approved: ${approvedCount}`);
    console.log(`Completed: ${completedCount}`);
    console.log(`Rejected: ${rejectedCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding returns:', error);
    process.exit(1);
  }
}

seedReturns();