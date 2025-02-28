/**
 * Simple HTTPS server for testing across devices on the same network
 * Run with: node use-local-network.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const express = require('express');
const qrcode = require('qrcode-terminal');
const ip = require('ip');

// Configuration
const PORT = 8445;
const HOSTNAME = '0.0.0.0'; // Listen on all interfaces

// Create Express app
const app = express();

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '/')));

// Add CORS headers for development
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Add a default route to the city shooter game
app.get('/', (req, res) => {
  res.redirect('/arcade-platform/games/city-shooter/index.html');
});

// Create HTTPS server with self-signed certificates
const server = https.createServer({
  key: fs.readFileSync(path.join(__dirname, 'certs/localhost.key')),
  cert: fs.readFileSync(path.join(__dirname, 'certs/localhost.crt'))
}, app);

// Start the server
server.listen(PORT, HOSTNAME, () => {
  const localUrl = `https://localhost:${PORT}`;
  const networkUrl = `https://${ip.address()}:${PORT}`;
  
  console.log('\n🚀 Server running at:');
  console.log(`🖥️  Local:    ${localUrl}`);
  console.log(`🌐 Network:  ${networkUrl}`);
  
  // Show URLs for regular and simple mode
  console.log(`\n🎮 Regular game URL: ${networkUrl}/arcade-platform/games/city-shooter/index.html`);
  console.log(`\n🚀 Simple mode URL: ${networkUrl}/arcade-platform/games/city-shooter/index.html?simple=true`);
  
  // Generate QR code for mobile access
  console.log('\n📱 Scan this QR code on your mobile device:');
  qrcode.generate(`${networkUrl}/arcade-platform/games/city-shooter/index.html`, {small: true});
  
  // Generate QR code for simple mode
  console.log('\n📱 Scan this QR code for SIMPLE mode on slower devices:');
  qrcode.generate(`${networkUrl}/arcade-platform/games/city-shooter/index.html?simple=true`, {small: true});
  
  console.log('\n📋 Press Ctrl+C to stop the server');
});

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server...');
  server.close();
  process.exit(0);
}); 