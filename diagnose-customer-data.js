// Debug Customer API Issue - Check actual database data
import mongoose from 'mongoose';
import User from './server/models/User.js';
import Customer from './server/models/Customer.js';
import { Company } from './server/models/Company.js';

async function diagnoseCustomerIssue() {
    try {
        // Connect to database
        await mongoose.connect('mongodb://localhost:27017/inventory_db');
        console.log('✅ Connected to database');

        console.log('\n=== CHECKING UNIT HEAD USERS ===');
        const unitHeads = await User.find({ role: 'Unit Head' }).populate('companyId', 'name');
        console.log(`Found ${unitHeads.length} Unit Head users:`);
        
        unitHeads.forEach((user, index) => {
            console.log(`${index + 1}. ${user.username} (${user.email})`);
            console.log(`   - CompanyId: ${user.companyId?._id || 'NOT SET'}`);
            console.log(`   - Company: ${user.companyId?.name || 'NO COMPANY'}`);
            console.log('');
        });

        console.log('\n=== CHECKING ALL CUSTOMERS ===');
        const customers = await Customer.find({}).populate('companyId', 'name').limit(10);
        console.log(`Found ${customers.length} customers (showing first 10):`);
        
        customers.forEach((customer, index) => {
            console.log(`${index + 1}. ${customer.name}`);
            console.log(`   - CompanyId: ${customer.companyId?._id || 'NOT SET'}`);
            console.log(`   - Company: ${customer.companyId?.name || 'NO COMPANY'}`);
            console.log('');
        });

        console.log('\n=== CHECKING COMPANIES ===');
        const companies = await Company.find({});
        console.log(`Found ${companies.length} companies:`);
        companies.forEach((company, index) => {
            console.log(`${index + 1}. ${company.name} (ID: ${company._id})`);
        });

        console.log('\n=== SUMMARY ===');
        const customersWithoutCompany = await Customer.countDocuments({ $or: [{ companyId: null }, { companyId: { $exists: false } }] });
        const unitHeadsWithoutCompany = await User.countDocuments({ 
            role: 'Unit Head', 
            $or: [{ companyId: null }, { companyId: { $exists: false } }] 
        });

        console.log(`❌ ${customersWithoutCompany} customers have no company assigned`);
        console.log(`❌ ${unitHeadsWithoutCompany} Unit Heads have no company assigned`);

        if (unitHeadsWithoutCompany > 0) {
            console.log('\n🔧 FIX NEEDED: Assign companies to Unit Head users');
        }
        if (customersWithoutCompany > 0) {
            console.log('🔧 FIX NEEDED: Assign companies to customers');
        }

        mongoose.disconnect();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        mongoose.disconnect();
    }
}

diagnoseCustomerIssue();