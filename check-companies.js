import { Company } from './server/models/Company.js';
import connectDB from './server/config/database.js';

async function checkCompanies() {
  try {
    await connectDB();
    
    console.log('🔍 Checking companies in database...');
    
    const companies = await Company.find({}, 'name city companyType gst').sort({ createdAt: 1 });
    
    console.log(`\n📊 Found ${companies.length} companies in database:`);
    companies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name} - ${company.city} (${company.companyType}) [${company.gst}]`);
    });
    
    // Check for the specific companies we want
    const targetCompanies = [
      'Sunrise Foods - Hyderabad',
      'Akshaya Foods - Hyderabad', 
      'Sunrise Foods - Bengaluru',
      'Sunrise Foods (Bangalore) - Bengaluru',
      'Sunrise Foods (Tirupati) - Tirupati'
    ];
    
    console.log('\n🎯 Checking for required companies:');
    targetCompanies.forEach(target => {
      const [name, city] = target.split(' - ');
      const found = companies.find(c => 
        c.name.toLowerCase().includes(name.toLowerCase()) && 
        c.city.toLowerCase() === city.toLowerCase()
      );
      console.log(`${found ? '✅' : '❌'} ${target}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking companies:', error);
    process.exit(1);
  }
}

checkCompanies();