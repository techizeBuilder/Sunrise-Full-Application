import { Company } from './server/models/Company.js';
import connectDB from './server/config/database.js';

async function clearAndSeedCompanies() {
  try {
    await connectDB();
    
    console.log('🗑️ Clearing existing companies...');
    await Company.deleteMany({});
    
    console.log('✅ Cleared all companies');
    
    // Now run the seed
    const { seedCompanyData } = await import('./server/seed/seedCompaniesNew.js');
    const result = await seedCompanyData();
    
    console.log('📊 Seeding result:', result);
    
    // Verify the results
    const companies = await Company.find({}, 'name city companyType gst').sort({ createdAt: 1 });
    console.log(`\n✅ Final result - ${companies.length} companies in database:`);
    companies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name} - ${company.city} (${company.companyType})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error clearing and seeding companies:', error);
    process.exit(1);
  }
}

clearAndSeedCompanies();