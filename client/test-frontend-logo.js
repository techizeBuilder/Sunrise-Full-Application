// Test frontend logo upload with FormData
const testFrontendLogoUpload = async () => {
  try {
    console.log('=== Testing Frontend Logo Upload ===');
    
    // Step 1: Login first
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
      console.error('Login failed:', loginData.message);
      return;
    }
    
    const token = loginData.token;
    console.log('Login successful');
    
    // Step 2: Create a test image file (simulate file input)
    const testContent = 'fake image content for testing';
    const blob = new Blob([testContent], { type: 'image/jpeg' });
    const file = new File([blob], 'test-logo.jpg', { type: 'image/jpeg' });
    
    console.log('Created test file:', file.name, file.size, file.type);
    
    // Step 3: Create FormData exactly like frontend does
    const formData = new FormData();
    formData.append('logo', file);
    
    console.log('FormData created, file:', formData.get('logo'));
    
    // Step 4: Upload using fetch (simulating the frontend apiRequest)
    console.log('Uploading file...');
    const uploadResponse = await fetch('http://localhost:5000/api/settings/company/logo', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
        // Note: No Content-Type header - let browser handle it for FormData
      },
      body: formData,
      credentials: 'include'
    });
    
    console.log('Upload response status:', uploadResponse.status);
    const responseText = await uploadResponse.text();
    console.log('Upload response:', responseText);
    
    if (uploadResponse.ok) {
      console.log('✅ Frontend logo upload working!');
    } else {
      console.log('❌ Frontend logo upload failed');
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
};

// Run in browser environment
if (typeof window !== 'undefined') {
  testFrontendLogoUpload();
} else {
  console.log('This test is for browser environment');
}