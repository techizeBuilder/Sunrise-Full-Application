// Test Environment Configuration
// This script tests the environment setup for both development and production

console.log('=== Environment Configuration Test ===\n');

// Test backend configuration
try {
  // Load the environment config
  const envModule = await import('./server/config/environment.js');
  const config = envModule.config || envModule.default;
  
  console.log('✅ Backend Environment Configuration:');
  console.log(`   NODE_ENV: ${config.NODE_ENV}`);
  console.log(`   PORT: ${config.PORT}`);
  console.log(`   Database: ${config.MONGODB_URI.split('/').pop()}`);
  console.log(`   CORS Origins: ${JSON.stringify(config.CORS_ORIGINS)}`);
  console.log(`   API Base URL: ${config.API_BASE_URL}\n`);
  
} catch (error) {
  console.error('❌ Backend configuration error:', error.message);
}

// Test if environment files exist
import { existsSync } from 'fs';

console.log('📁 Environment Files Check:');
console.log(`   .env exists: ${existsSync('.env') ? '✅' : '❌'}`);
console.log(`   .env.production exists: ${existsSync('.env.production') ? '✅' : '❌'}\n`);

console.log('🚀 To test production environment:');
console.log('   1. Run: NODE_ENV=production node test-environment.js');
console.log('   2. Or use: npm run build && npm start\n');

console.log('💡 Frontend config will be available when the client loads.');
console.log('   Check browser console for API service initialization logs.');

export {};