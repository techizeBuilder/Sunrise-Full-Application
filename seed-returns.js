// Seed script for return/damage entries
import './server/db.js';
import Return from './server/models/Return.js';

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
  }
];

async function seedReturns() {
  try {
    // Clear existing data
    await Return.deleteMany({});
    
    // Insert dummy data
    await Return.insertMany(dummyReturns);
    
    console.log('✓ Successfully seeded return/damage entries');
    console.log('Total entries:', await Return.countDocuments());
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding returns:', error);
    process.exit(1);
  }
}

seedReturns();