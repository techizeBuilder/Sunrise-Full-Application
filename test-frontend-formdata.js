import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

// Create a real image file for testing
const createTestImage = () => {
  // Create a minimal valid JPEG file header (just for testing)
  const jpegHeader = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xD9
  ]);
  return jpegHeader;
};

const testFrontendFormData = async () => {
  try {
    console.log('=== Testing FormData Logo Upload (Node.js simulation) ===');
    
    // Step 1: Login
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        email: 'admin@company.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    if (!loginData.success) {
      console.error('Login failed');
      return;
    }
    
    const token = loginData.token;
    console.log('✅ Login successful');
    
    // Step 2: Create FormData with a real image buffer
    const imageBuffer = createTestImage();
    const formData = new FormData();
    formData.append('logo', imageBuffer, {
      filename: 'frontend-test.jpg',
      contentType: 'image/jpeg'
    });
    
    console.log('📁 FormData created with image buffer');
    
    // Step 3: Upload
    console.log('⬆️  Uploading...');
    const uploadResponse = await fetch('http://localhost:5000/api/settings/company/logo', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders() // This adds the boundary header
      },
      body: formData
    });
    
    const result = await uploadResponse.text();
    console.log('📋 Upload status:', uploadResponse.status);
    console.log('📋 Upload response:', result);
    
    if (uploadResponse.ok) {
      console.log('✅ FormData upload working!');
    } else {
      console.log('❌ FormData upload failed');
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
};

testFrontendFormData();