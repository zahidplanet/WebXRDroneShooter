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

// Configuration
const PORT = process.env.PORT || 8443;
const HOSTNAME = '0.0.0.0'; // Listen on all interfaces

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
const server = https.createServer({
  key: fs.readFileSync(path.join(__dirname, 'certs/localhost.key')),
  cert: fs.readFileSync(path.join(__dirname, 'certs/localhost.crt'))
}, app);

// Start the server
server.listen(PORT, HOSTNAME, async () => {
  const localUrl = `https://localhost:${PORT}`;
  const networkUrl = `https://${ip.address()}:${PORT}`;
  
  console.log('\n🚀 Server running at:');
  console.log(`🖥️  Local:    ${localUrl}`);
  console.log(`🌐 Network:  ${networkUrl}`);
  
  try {
    // Start ngrok tunnel
    const ngrokUrl = await ngrok.connect({
      addr: PORT,
      proto: 'http', // ngrok will handle the HTTPS part
      region: 'us',
      hostname: process.env.NGROK_HOSTNAME, // Custom subdomain if you have a paid plan
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
    console.error(`❌ Error starting ngrok:`, err);
    console.log(`\n👉 Fallback to local testing with QR code:`);
    console.log('\n📱 Scan QR code with your mobile device:');
    qrcode.generate(networkUrl, {small: true});
  }
});

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  try {
    console.log('\n👋 Shutting down server and ngrok tunnel...');
    await ngrok.kill();
    server.close();
    process.exit(0);
  } catch (e) {
    process.exit(1);
  }
}); 