#!/usr/bin/env node

/**
 * Test script to verify quantity validation in production groups
 */

const BASE_URL = 'http://localhost:5000/api';

// Test data - you'll need to replace these with actual item IDs from your database
const TEST_ITEMS_SAME_QTY = [
  '688739ae5d51fd4eaf23b969', // Item with qty 234
  '68873aab5d51fd4eaf23cdfc'  // Item with qty 234
];

const TEST_ITEMS_DIFFERENT_QTY = [
  '688739ae5d51fd4eaf23b969', // Item with qty 234
  '68873aab5d51fd4eaf23cdfc'  // Item with qty 235 (different)
];

async function testQuantityValidation() {
  console.log('🧪 Testing Production Group Quantity Validation\n');

  // Get auth token (you'll need to login first)
  const token = 'your-auth-token-here'; // Replace with actual token

  try {
    console.log('1️⃣ Testing UNIT HEAD - Items with SAME quantities (should succeed)');
    const successResponse = await fetch(`${BASE_URL}/unit-head/production-groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Test Group - Same Qty',
        description: 'Testing same quantities',
        items: TEST_ITEMS_SAME_QTY
      })
    });

    const successResult = await successResponse.json();
    console.log('✅ Same quantities result:', {
      success: successResult.success,
      message: successResult.message
    });

    console.log('\n2️⃣ Testing UNIT HEAD - Items with DIFFERENT quantities (should fail)');
    const failResponse = await fetch(`${BASE_URL}/unit-head/production-groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Test Group - Different Qty',
        description: 'Testing different quantities',
        items: TEST_ITEMS_DIFFERENT_QTY
      })
    });

    const failResult = await failResponse.json();
    console.log('❌ Different quantities result:', {
      success: failResult.success,
      message: failResult.message
    });

    console.log('\n3️⃣ Testing UNIT MANAGER - Items with SAME quantities (should succeed)');
    const unitManagerSuccessResponse = await fetch(`${BASE_URL}/unit-manager/production-groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Unit Manager Test Group - Same Qty',
        description: 'Testing same quantities',
        items: TEST_ITEMS_SAME_QTY
      })
    });

    const unitManagerSuccessResult = await unitManagerSuccessResponse.json();
    console.log('✅ Unit Manager same quantities result:', {
      success: unitManagerSuccessResult.success,
      message: unitManagerSuccessResult.message
    });

    console.log('\n4️⃣ Testing UNIT MANAGER - Items with DIFFERENT quantities (should fail)');
    const unitManagerFailResponse = await fetch(`${BASE_URL}/unit-manager/production-groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Unit Manager Test Group - Different Qty',
        description: 'Testing different quantities',
        items: TEST_ITEMS_DIFFERENT_QTY
      })
    });

    const unitManagerFailResult = await unitManagerFailResponse.json();
    console.log('❌ Unit Manager different quantities result:', {
      success: unitManagerFailResult.success,
      message: unitManagerFailResult.message
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Instructions
console.log(`
📋 INSTRUCTIONS:
1. Make sure your server is running on http://localhost:5000
2. Update the TEST_ITEMS arrays with actual item IDs from your database
3. Update the token variable with a valid auth token
4. Run: node test-quantity-validation.js

🎯 EXPECTED BEHAVIOR:
- Same quantities: Should create production group successfully
- Different quantities: Should return error with message showing actual quantities found
  Example: "Items have different batch quantities and cannot be grouped together. 
          Found quantities: Item A: 234, Item B: 235. All items in a production group 
          must have the same batch quantity."
`);

if (process.argv[2] === 'run') {
  testQuantityValidation();
}