/**
 * Test Script for Search Query Issue
 * ===================================
 * 
 * This script tests the problematic search query to identify the issue
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';

async function testSearchQueries() {
  console.log('🧪 Testing Search Query Issues');
  console.log('==============================\n');

  const testQueries = [
    {
      name: 'Simple search',
      url: `${API_BASE}/api/super-admin/inventory/items?search=bread`
    },
    {
      name: 'Search with parentheses (problematic)',
      url: `${API_BASE}/api/super-admin/inventory/items?search=Every+Day+Bombay+PAV+200g+%28RRL%29`
    },
    {
      name: 'Search with encoding',
      url: `${API_BASE}/api/super-admin/inventory/items?page=1&limit=100&search=${encodeURIComponent('Every Day Bombay PAV 200g (RRL)')}`
    },
    {
      name: 'Search without parentheses',
      url: `${API_BASE}/api/super-admin/inventory/items?search=Every+Day+Bombay+PAV+200g`
    },
    {
      name: 'Search with special characters escaped',
      url: `${API_BASE}/api/super-admin/inventory/items?search=Every+Day+Bombay+PAV`
    }
  ];

  for (const test of testQueries) {
    console.log(`🔍 Testing: ${test.name}`);
    console.log(`   URL: ${test.url}`);
    
    try {
      const response = await fetch(test.url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Success: ${data.items?.length || 0} items found`);
        if (data.items?.length > 0) {
          console.log(`   📝 Sample: ${data.items[0].name}`);
        }
      } else {
        const errorData = await response.text();
        console.log(`   ❌ Failed: ${response.status} - ${errorData}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
  }
}

console.log('PROBLEMATIC URL ANALYSIS:');
console.log('=========================');
console.log('Original: http://localhost:5000/api/super-admin/inventory/items?page=1&limit=100&search=Every+Day+Bombay+PAV+200g+%28RRL');
console.log('Issue: Missing closing parenthesis in URL');
console.log('Corrected: http://localhost:5000/api/super-admin/inventory/items?page=1&limit=100&search=Every+Day+Bombay+PAV+200g+%28RRL%29');
console.log('');

testSearchQueries().catch(console.error);