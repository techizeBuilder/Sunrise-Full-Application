import fetch from 'node-fetch';

async function testUsersAPI() {
  try {
    console.log('Testing /api/users endpoint...');
    
    // First, let's test without authentication to see the error
    const response1 = await fetch('http://localhost:5000/api/users');
    const result1 = await response1.text();
    console.log('Response without auth:', response1.status, result1);
    
    // Since we need authentication, let's check the database directly
    console.log('\nChecking database directly...');
    
  } catch (error) {
    console.error('Error testing API:', error.message);
  }
}

testUsersAPI();