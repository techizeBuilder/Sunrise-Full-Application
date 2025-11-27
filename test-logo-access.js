import fetch from 'node-fetch';

// Test if logo is accessible via static URL
const testLogoAccess = async () => {
  try {
    console.log('Testing logo static file access...');
    const response = await fetch('http://localhost:5000/uploads/company-logo-1764230955238-459571633.jpg');
    console.log('Logo access status:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));
    console.log('Content-Length:', response.headers.get('content-length'));
    
    if (response.ok) {
      console.log('✅ Logo is accessible via static URL');
    } else {
      console.log('❌ Logo access failed');
    }
  } catch (error) {
    console.error('Logo access error:', error);
  }
};

testLogoAccess();