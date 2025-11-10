import mongoose from 'mongoose';
import Customer from './server/models/Customer.js';

const MONGODB_URI = 'mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manufacturing-erp';

const customers = [
  { name: 'Kolkata Retail Ltd', contactPerson: 'Subrata Chatterjee', designation: 'Purchase Manager', category: 'Distributor', categoryNote: 'Main distributor for eastern region', active: 'Yes', mobile: '9876789012', email: 'subrata@kolkataretail.com', gstin: "",
  { name: 'Chennai Manufacturing Co', contactPerson: 'Ravi Kumar', designation: 'Operations Head', category: 'Retailer', categoryNote: 'Large scale retailer in Tamil Nadu', active: 'Yes', mobile: '9876512345', email: 'ravi@chennaimanuf.com', gstin: "",
  { name: 'Technovision Systems', contactPerson: 'Amit Sharma', designation: 'Technical Director', category: 'End User', categoryNote: 'Technology solutions provider', active: 'Yes', mobile: '9988776655', email: 'amit@technovision.in', gstin: "",
  { name: 'Global Export House', contactPerson: 'Sunita Patel', designation: 'Export Manager', category: 'Wholesaler', categoryNote: 'International export specialist', active: 'Yes', mobile: '9445566778', email: 'sunita@globalexport.com', gstin: "",
  { name: 'Mumbai Traders Corp', contactPerson: 'Priya Mehta', designation: 'Business Head', category: 'Distributor', categoryNote: 'Leading trader in Maharashtra', active: 'Yes', mobile: '9123456789', email: 'priya@mumbaitraders.com', gstin: "",
  { name: 'Delhi Electronics Hub', contactPerson: 'Rajesh Gupta', designation: 'Store Manager', category: 'Retailer', categoryNote: 'Electronics retail chain', active: 'Yes', mobile: '9876543210', email: 'rajesh@delhielectronics.com', gstin: "",
  { name: 'Bangalore Software Solutions', contactPerson: 'Meera Iyer', designation: 'Project Manager', category: 'End User', categoryNote: 'Software development company', active: 'Yes', mobile: '9988554433', email: 'meera@bangaloresoftware.com', gstin: "",
  { name: 'Pune Auto Parts', contactPerson: 'Vikram Singh', designation: 'Purchase Officer', category: 'Wholesaler', categoryNote: 'Automotive parts wholesaler', active: 'Yes', mobile: '9876123456', email: 'vikram@puneautoparts.com', gstin: "",
  { name: 'Ahmedabad Textiles', contactPerson: 'Kiran Shah', designation: 'Production Head', category: 'Distributor', categoryNote: 'Textile manufacturing and distribution', active: 'Yes', mobile: '9445123789', email: 'kiran@ahmedabadtextiles.com', gstin: "",
  { name: 'Jaipur Handicrafts', contactPerson: 'Pooja Agarwal', designation: 'Creative Director', category: 'Retailer', categoryNote: 'Traditional handicrafts retailer', active: 'Yes', mobile: '9887654321', email: 'pooja@jaipurhandicrafts.com', gstin: "",
  { name: 'Cochin Spices Export', contactPerson: 'Suresh Nair', designation: 'Quality Manager', category: 'End User', categoryNote: 'Spices export business', active: 'Yes', mobile: '9876789123', email: 'suresh@cochinspices.com', gstin: "",
  { name: 'Lucknow Food Products', contactPerson: 'Anita Verma', designation: 'Operations Manager', category: 'Wholesaler', categoryNote: 'Food products wholesaler', active: 'Yes', mobile: '9123789456', email: 'anita@lucknowfood.com', gstin: "",
  { name: 'Chandigarh Electronics', contactPerson: 'Manpreet Kaur', designation: 'Store Owner', category: 'Distributor', categoryNote: 'Electronics distribution chain', active: 'Yes', mobile: '9988112233', email: 'manpreet@chandigarhelectronics.com', gstin: "",
  { name: 'Bhopal Chemical Works', contactPerson: 'Rahul Tiwari', designation: 'Plant Manager', category: 'Retailer', categoryNote: 'Chemical manufacturing unit', active: 'No', mobile: '9876543987', email: 'rahul@bhopalchemical.com', gstin: "",
  { name: 'Indore Pharma Ltd', contactPerson: 'Dr. Kavita Jain', designation: 'Research Head', category: 'End User', categoryNote: 'Pharmaceutical research company', active: 'Yes', mobile: '9445667788', email: 'kavita@indorepharma.com', gstin: "", salesContact: 'sales3' }
];

async function seedCustomers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    await Customer.deleteMany({});
    console.log('Cleared existing customers');
    
    const inserted = await Customer.insertMany(customers);
    console.log(`Successfully seeded ${inserted.length} customers`);
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedCustomers();