/**
 * Enhanced test server with ngrok for easy cross-device testing
 * Run with: node test-server.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const express = require('express');
const ngrok = require('ngrok');
const qrcode = require('qrcode-terminal');
const ip = require('ip');
const net = require('net');

// Configuration
const START_PORT = 8445;
const MAX_PORT = 8455;
const HOSTNAME = '0.0.0.0'; // Listen on all interfaces

// Function to check if a port is available
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', () => {
      resolve(false);
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    
    server.listen(port);
  });
}

// Function to find an available port
async function findAvailablePort(startPort, endPort) {
  for (let port = startPort; port <= endPort; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available ports in range ${startPort}-${endPort}`);
}

// Create Express app
const app = express();

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '/')));

// Optional: Add CORS headers for development
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Optional: Add a default route to the city shooter game
app.get('/', (req, res) => {
  res.redirect('/arcade-platform/games/city-shooter/index.html');
});

// Create HTTPS server with self-signed certificates
const serverOptions = {
  key: fs.readFileSync(path.join(__dirname, 'certs/localhost.key')),
  cert: fs.readFileSync(path.join(__dirname, 'certs/localhost.crt'))
};

// Start the server with port hunting
async function startServer() {
  try {
    // Find an available port
    const PORT = await findAvailablePort(START_PORT, MAX_PORT);
    console.log(`\nFound available port: ${PORT}`);
    
    // Create and start the server
    const server = https.createServer(serverOptions, app);
    
    server.listen(PORT, HOSTNAME, async () => {
      const localUrl = `https://localhost:${PORT}`;
      const networkUrl = `https://${ip.address()}:${PORT}`;
      
      console.log('\n🚀 Server running at:');
      console.log(`🖥️  Local:    ${localUrl}`);
      console.log(`🌐 Network:  ${networkUrl}`);
      
      // Log the QR code for local network access
      console.log('\n📱 Scan QR code for local network access:');
      qrcode.generate(networkUrl, {small: true});
      
      try {
        console.log('\nStarting ngrok tunnel...');
        // Start ngrok tunnel using the module
        const ngrokUrl = await ngrok.connect({
          addr: PORT,
          proto: 'http', // ngrok will handle the HTTPS
        });
        
        console.log(`\n🔗 Public URL (share this for testing):`);
        console.log(`✨ ${ngrokUrl}/arcade-platform/games/city-shooter/index.html`);
        
        // Generate QR code for the public URL
        console.log('\n📱 Scan QR code with your mobile device:');
        qrcode.generate(`${ngrokUrl}/arcade-platform/games/city-shooter/index.html`, {small: true});
        
        // Add URL for simple mode testing
        console.log('\n🚀 For slower devices, use Simple Mode:');
        console.log(`✨ ${ngrokUrl}/arcade-platform/games/city-shooter/index.html?simple=true`);
        
        console.log('\n⌛ Testing URLs will expire after 2 hours (free ngrok plan)');
        console.log('📋 Press Ctrl+C to stop the server');
        
        // Log how many players are connected (assuming you have a room.clients array)
        setInterval(() => {
          try {
            console.log(`👥 Connected players: ${global.connectedPlayers || 0}`);
          } catch (e) {
            // Silent fail
          }
        }, 30000); // every 30 seconds
        
      } catch (err) {
        console.error(`❌ Error starting ngrok: ${err.message}`);
        console.log('\n👉 You can still use local network testing:');
        console.log(`\n🌐 URL for devices on your network: ${networkUrl}/arcade-platform/games/city-shooter/index.html`);
        console.log(`\n🚀 Simple mode URL: ${networkUrl}/arcade-platform/games/city-shooter/index.html?simple=true`);
      }
    });
    
    // Handle shutdown gracefully
    process.on('SIGINT', async () => {
      try {
        console.log('\n👋 Shutting down server and ngrok...');
        await ngrok.kill();
        server.close();
        process.exit(0);
      } catch (e) {
        console.error('Error during shutdown:', e);
        process.exit(1);
      }
    });
    
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Start the server
startServer(); 