import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

// Test logo upload API
const testLogoUpload = async () => {
  try {
    // First login to get token
    console.log('=== Step 1: Login ===');
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
    console.log('Login success:', loginData.success);
    console.log('User role:', loginData.user?.role);
    
    if (!loginData.success) {
      console.error('Login failed:', loginData.message);
      return;
    }
    
    const token = loginData.token;
    
    // Test logo upload endpoint
    console.log('\n=== Step 2: Test Logo Upload ===');
    
    // Create a simple test image file (create a minimal test file)
    const testImageContent = 'test image content';
    const formData = new FormData();
    formData.append('logo', Buffer.from(testImageContent), {
      filename: 'test-logo.jpg',
      contentType: 'image/jpeg'
    });
    
    console.log('Sending logo upload request...');
    const logoResponse = await fetch('http://localhost:5000/api/settings/company/logo', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      },
      body: formData
    });
    
    const logoResult = await logoResponse.text();
    console.log('Logo upload status:', logoResponse.status);
    console.log('Logo upload response:', logoResult);
    
    // Also test if uploads directory exists
    console.log('\n=== Step 3: Check Upload Directory ===');
    try {
      const uploadsExists = fs.existsSync('./uploads');
      console.log('Uploads directory exists:', uploadsExists);
      if (!uploadsExists) {
        console.log('Creating uploads directory...');
        fs.mkdirSync('./uploads', { recursive: true });
        console.log('Uploads directory created');
      }
    } catch (dirError) {
      console.error('Directory check error:', dirError);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
};

testLogoUpload();