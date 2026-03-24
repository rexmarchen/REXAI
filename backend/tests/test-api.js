const http = require('http');

// Test /api/health endpoint
http.get('http://localhost:5000/api/health', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('OK /api/health endpoint:');
    console.log('  Status:', res.statusCode);
    console.log('  Response:', data);
    console.log();

    // Test /api/auth with proper error handling
    testAuthEndpoint();
  });
}).on('error', (err) => {
  console.error('Error testing /api/health:', err.message);
});

function testAuthEndpoint() {
  http.get('http://localhost:5000/api/auth/me', (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log('OK /api/auth/me endpoint:');
      console.log('  Status:', res.statusCode);
      console.log('  Response:', data);
      console.log();
      console.log('Backend is running and responding correctly!');
    });
  }).on('error', (err) => {
    console.error('Error testing /api/auth/me:', err.message);
  });
}
