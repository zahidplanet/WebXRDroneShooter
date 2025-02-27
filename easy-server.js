const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const qrcode = require('qrcode-terminal');

// Get local IP address
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Configuration
const localIp = getLocalIp();
const startPort = 8443;
const maxPortTries = 10;

// SSL options
const options = {
  key: fs.readFileSync('ssl/server.key'),
  cert: fs.readFileSync('ssl/server.crt')
};

// Server handler function
const serverHandler = (req, res) => {
  // Set CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Normalize path
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './arcade-platform/index.html';
  }

  // Handle path for arcade platform
  if (!filePath.includes('/arcade-platform/') && !filePath.includes('.well-known')) {
    filePath = './arcade-platform' + filePath;
  }

  // Get file extension
  const extname = path.extname(filePath);
  let contentType = 'text/html';
  
  // Set content type based on file extension
  switch (extname) {
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
      contentType = 'image/jpg';
      break;
    case '.svg':
      contentType = 'image/svg+xml';
      break;
    case '.webmanifest':
    case '.manifest':
      contentType = 'application/manifest+json';
      break;
  }

  // Try to read the file
  fs.readFile(filePath, (error, content) => {
    if (error) {
      console.log(`Error reading ${filePath}: ${error.code}`);
      
      if(error.code === 'ENOENT') {
        // File not found, try serving index.html
        fs.readFile('./arcade-platform/index.html', (error, content) => {
          if (error) {
            res.writeHead(500);
            res.end(`Server Error: ${error.code}`);
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content, 'utf-8');
        });
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      // Add special headers for service workers
      if (filePath.endsWith('service-worker.js')) {
        res.setHeader('Service-Worker-Allowed', '/');
        res.setHeader('Cache-Control', 'no-cache');
      }
      
      // Add cache headers for static assets
      if (['.css', '.js', '.png', '.jpg', '.svg'].includes(extname)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
      }
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
};

// Try to start server on available port
function startServer(port) {
  const server = https.createServer(options, serverHandler);
  
  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      if (port < startPort + maxPortTries) {
        console.log(`Port ${port} is busy, trying ${port + 1}...`);
        startServer(port + 1);
      } else {
        console.error(`Could not find an available port after ${maxPortTries} attempts.`);
      }
    } else {
      console.error(`Server error: ${e}`);
    }
  });
  
  server.listen(port, () => {
    const mainUrl = `https://${localIp}:${port}/arcade-platform/index.html`;
    
    console.log(`
╔════════════════════════════════════════════════════╗
║              AR-CADE SERVER RUNNING                ║
╠════════════════════════════════════════════════════╣
║ Local URL:  https://localhost:${port}              ${port < 10000 ? '  ' : ' '}║
║ Network:    ${mainUrl} ${' '.repeat(Math.max(0, 38 - mainUrl.length))}║
╚════════════════════════════════════════════════════╝
`);
    
    console.log('QR CODE FOR MOBILE ACCESS:');
    qrcode.generate(mainUrl, {small: true});
    
    console.log('\nOn your mobile device:');
    console.log('1. Scan the QR code above');
    console.log('2. Accept the certificate warning');
    console.log('3. Add to home screen for app-like experience');
    console.log('\nPress Ctrl+C to stop the server');
  });
}

// Check if qrcode-terminal is installed
try {
  require.resolve('qrcode-terminal');
  startServer(startPort);
} catch (e) {
  console.log('Installing qrcode-terminal package for better user experience...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install qrcode-terminal', { stdio: 'inherit' });
    console.log('Package installed successfully! Starting server...');
    try {
      require.resolve('qrcode-terminal');
      startServer(startPort);
    } catch (e) {
      console.error('Error requiring package after install. Starting without QR code support.');
      qrcode = { generate: () => console.log('QR code generation not available.') };
      startServer(startPort);
    }
  } catch (e) {
    console.error('Error installing package. Starting without QR code support.');
    qrcode = { generate: () => console.log('QR code generation not available.') };
    startServer(startPort);
  }
} 