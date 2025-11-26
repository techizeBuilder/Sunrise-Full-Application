// Test duplicate prevention with proper companyId
async function testDuplicatePrevention() {
  try {
    console.log('🧪 Testing duplicate prevention with PIZAA item...');
    
    console.log('📋 Test Instructions:');
    console.log('');
    console.log('1. ✅ Login as Unit Head (unit_head) in the web interface');
    console.log('2. ✅ Open browser developer tools (F12)');
    console.log('3. ✅ Go to Network tab');
    console.log('4. ✅ Try creating a new item named "PIZAA"');
    console.log('5. ✅ Look for the API call to see what data is being sent');
    console.log('');
    console.log('🔧 Expected Results:');
    console.log('✅ Store Location should auto-select to Unit Head\'s company');
    console.log('✅ If Store Location is empty, should show validation error');
    console.log('✅ If "PIZAA" already exists, should show duplicate error');
    console.log('✅ CompanyId should be properly set in the request');
    console.log('');
    console.log('🐛 Debug Information:');
    console.log('- Check console logs for "📝 Received item data" messages');
    console.log('- Check console logs for "👤 User info" messages');
    console.log('- Check console logs for "Duplicate check query" messages');
    console.log('- Verify companyId is not null in the logs');
    console.log('');
    console.log('🚀 Server is running - ready for testing!');
    
  } catch (error) {
    console.error('❌ Test setup failed:', error.message);
  }
}

testDuplicatePrevention();