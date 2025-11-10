import { Company } from '../models/Company.js';

const sampleCompanies = [
  {
    unitName: 'Manufacturing Unit A',
    name: 'TechCorp Industries',
    mobile: '+91-9876543210',
    email: 'contact@techcorp.com',
    address: '123 Industrial Area, Sector 15',
    locationPin: '110001',
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
    gst: '07AABCT1234H1Z5',
    fssai: '10019022000135',
    orderCutoffTime: '18:00'
  },
  {
    unitName: 'Production Facility B',
    name: 'Global Manufacturing Co.',
    mobile: '+91-9876543211',
    email: 'info@globalmanuf.com',
    address: '456 Tech Park, Phase 2',
    locationPin: '560001',
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    gst: '29AABCG1234H2Z6',
    fssai: '10019022000136',
    orderCutoffTime: '17:30'
  },
  {
    unitName: 'Assembly Unit C',
    name: 'Precision Engineering Ltd.',
    mobile: '+91-9876543212',
    email: 'admin@precision.com',
    address: '789 Engineering Complex, Block A',
    locationPin: '400001',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    gst: '27AABCP1234H3Z7',
    fssai: '10019022000137',
    orderCutoffTime: '19:00'
  },
  {
    unitName: 'Quality Control Unit',
    name: 'SafeGuard Systems Pvt Ltd',
    mobile: '+91-9876543213',
    email: 'quality@safeguard.com',
    address: '321 Quality Street, Industrial Zone',
    locationPin: '600001',
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    gst: '33AABCS1234H4Z8',
    fssai: '10019022000138',
    orderCutoffTime: '18:30'
  },
  {
    unitName: 'Research & Development',
    name: 'Innovation Labs India',
    mobile: '+91-9876543214',
    email: 'research@innovationlabs.com',
    address: '654 R&D Campus, Technology Park',
    locationPin: '500001',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    gst: '36AABCI1234H5Z9',
    fssai: '10019022000139',
    orderCutoffTime: '17:00'
  },
  {
    unitName: 'Packaging Unit',
    name: 'EcoPackage Solutions',
    mobile: '+91-9876543215',
    email: 'packaging@ecopackage.com',
    address: '987 Green Zone, Eco Industrial Area',
    locationPin: '302001',
    city: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    gst: '08AABCE1234H6ZA',
    fssai: '10019022000140',
    orderCutoffTime: '16:30'
  },
  {
    unitName: 'Logistics Hub',
    name: 'SwiftMove Logistics',
    mobile: '+91-9876543216',
    email: 'logistics@swiftmove.com',
    address: '147 Transport Nagar, Logistics Park',
    locationPin: '700001',
    city: 'Kolkata',
    state: 'West Bengal',
    country: 'India',
    gst: '19AABCS1234H7ZB',
    fssai: '',
    orderCutoffTime: '20:00'
  },
  {
    unitName: 'Testing Laboratory',
    name: 'Accurate Testing Services',
    mobile: '+91-9876543217',
    email: 'lab@accuratetest.com',
    address: '258 Science City, Lab Complex',
    locationPin: '380001',
    city: 'Ahmedabad',
    state: 'Gujarat',
    country: 'India',
    gst: '24AABCA1234H8ZC',
    fssai: '10019022000141',
    orderCutoffTime: '18:00'
  }
];

export const seedCompanyData = async () => {
  try {
    console.log('Seeding company data...');
    
    // Check if companies already exist
    const existingCount = await Company.countDocuments();
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing companies, skipping seed`);
      return;
    }

    // Insert sample companies
    const companies = await Company.insertMany(sampleCompanies);
    console.log(`Created ${companies.length} companies successfully!`);

    return companies;
  } catch (error) {
    console.error('Error seeding company data:', error);
    throw error;
  }
};