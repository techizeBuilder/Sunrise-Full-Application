import fetch from 'node-fetch';

// Test debug endpoint
const testDebugEndpoint = async () => {
  try {
    console.log('=== Testing Debug Endpoint ===');
    const response = await fetch('http://localhost:5000/api/settings/debug');
    const data = await response.text();
    console.log('Debug response status:', response.status);
    console.log('Debug response:', data);
  } catch (error) {
    console.error('Debug test error:', error);
  }
};

testDebugEndpoint();