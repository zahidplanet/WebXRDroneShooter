/**
 * ULTRA SIMPLE HTTP SERVER FOR TESTING
 * No HTTPS, no certificates, no complexity
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const os = require('os');

// Get IP address
function getIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return alias.address;
      }
    }
  }
  return '127.0.0.1';
}

// Configuration
const PORT = 8080;
const IP = getIPAddress();

// Create basic HTTP server
const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Parse URL
  let pathname = url.parse(req.url).pathname;
  
  // Default to index.html
  if (pathname === '/') {
    pathname = '/arcade-platform/games/city-shooter/index.html';
  }
  
  // Map the URL path to the local file path
  const filePath = path.join(process.cwd(), pathname);
  
  // Read the file
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // If file not found
      res.writeHead(404, { 'Content-Type': 'text/html' });
      return res.end('404 Not Found');
    }
    
    // Set the content type based on file extension
    const ext = path.extname(filePath);
    let contentType = 'text/html';
    
    switch (ext) {
      case '.js':
        contentType = 'text/javascript';
        break;
      case '.css':
        contentType = 'text/css';
        break;
      case '.json':
        contentType = 'application/json';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
    }
    
    // Add CORS headers to allow all origins
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    
    return res.end(data);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log('\n🚀 SUPER SIMPLE SERVER STARTED!\n');
  console.log(`🖥️  Desktop URL: http://localhost:${PORT}/arcade-platform/games/city-shooter/index.html`);
  console.log(`📱 Mobile URL:   http://${IP}:${PORT}/arcade-platform/games/city-shooter/index.html`);
  console.log(`\n📱 For simple mode on slower devices, add "?simple=true" to the URL`);
  console.log(`\n👉 Mobile instructions: Connect to the same WiFi and enter the Mobile URL in your browser`);
  console.log(`\n🛑 Press Ctrl+C to stop the server`);
}); 