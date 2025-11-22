// Test customer data in MongoDB directly
import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/inventory_management';

async function checkCustomerData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    
    // Get all customers
    const customers = await db.collection('customers').find({}).toArray();
    console.log(`📊 Total customers in database: ${customers.length}`);
    
    // Get all companies
    const companies = await db.collection('companies').find({}).toArray();
    console.log(`🏢 Total companies in database: ${companies.length}`);
    
    // Get Unit Head users
    const unitHeads = await db.collection('users').find({ role: 'Unit Head' }).toArray();
    console.log(`👥 Unit Head users: ${unitHeads.length}`);
    
    console.log('\n🔍 Customer Data Analysis:');
    const customersByCompany = {};
    
    customers.forEach(customer => {
      const companyId = customer.companyId ? customer.companyId.toString() : 'No Company';
      if (!customersByCompany[companyId]) {
        customersByCompany[companyId] = [];
      }
      customersByCompany[companyId].push(customer);
    });
    
    console.log('\n📋 Customers by Company:');
    for (const [companyId, companyCustomers] of Object.entries(customersByCompany)) {
      const company = companies.find(c => c._id.toString() === companyId);
      const companyName = company ? company.name : companyId;
      console.log(`📍 ${companyName}: ${companyCustomers.length} customers`);
      
      // Show first few customer names
      if (companyCustomers.length > 0) {
        const customerNames = companyCustomers.slice(0, 3).map(c => c.name);
        console.log(`   👤 Customers: ${customerNames.join(', ')}${companyCustomers.length > 3 ? '...' : ''}`);
      }
    }
    
    console.log('\n👥 Unit Head Company Assignments:');
    unitHeads.forEach(unitHead => {
      const company = companies.find(c => c._id.toString() === unitHead.companyId?.toString());
      const companyName = company ? company.name : 'No Company Assigned';
      const customerCount = customersByCompany[unitHead.companyId?.toString()] ? customersByCompany[unitHead.companyId?.toString()].length : 0;
      console.log(`👤 ${unitHead.username} (${unitHead.email}): ${companyName} - ${customerCount} customers`);
    });
    
  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await client.close();
  }
}

checkCustomerData();