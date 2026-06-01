import http from 'http';

http.get('http://localhost:3000/modules/social.js', (res) => {
  console.log(`Status: ${res.statusCode}`);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Data length:', data.length, 'Starts with:', data.substring(0, 50)));
}).on('error', err => console.log('Error:', err.message));
