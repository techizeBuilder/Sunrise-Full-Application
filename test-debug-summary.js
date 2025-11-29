import fetch from 'node-fetch';
import fs from 'fs';

async function testDebugSummary() {
  try {
    console.log('🔍 Testing debug summary endpoint...');
    
    // Read token
    const token = fs.readFileSync('token.txt', 'utf8').trim();
    
    const response = await fetch('http://localhost:5000/api/production/debug-summary', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    console.log('\n📊 Debug Summary Results:');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('\n📈 Analysis:');
      console.log(`Company ID: ${data.data.companyId}`);
      console.log(`Company-specific summaries: ${data.data.companySummaries.length}`);
      console.log(`Total summaries in DB: ${data.data.allSummaries.length}`);
      console.log(`Production group items: ${data.data.productionGroupItems.length}`);
      console.log(`Matching items: ${data.data.matches.length}`);
      
      if (data.data.companySummaries.length > 0) {
        console.log('\n📋 Company Summary Sample:');
        console.log(data.data.companySummaries.slice(0, 3));
      }
      
      if (data.data.matches.length > 0) {
        console.log('\n✅ Matching Items:');
        data.data.matches.forEach(match => {
          console.log(`  ${match.productName}: qtyPerBatch=${match.qtyPerBatch}`);
        });
      } else {
        console.log('\n❌ No matches found between production items and summaries');
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing debug summary:', error);
  }
}

testDebugSummary();