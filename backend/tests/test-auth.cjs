const http = require('http');

const registerData = JSON.stringify({
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123'
});

console.log('Testing Registration...\n');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': registerData.length
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
    
    // If registration successful, test login
    if (res.statusCode === 201 || res.statusCode === 400) {
      setTimeout(() => testLogin(), 500);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.write(registerData);
req.end();

function testLogin() {
  console.log('\n\nTesting Login...\n');
  
  const loginData = JSON.stringify({
    email: 'test@example.com',
    password: 'password123'
  });

  const loginOptions = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': loginData.length
    }
  };

  const loginReq = http.request(loginOptions, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Response:', data);
    });
  });

  loginReq.on('error', (error) => {
    console.error('Error:', error.message);
  });

  loginReq.write(loginData);
  loginReq.end();
}
