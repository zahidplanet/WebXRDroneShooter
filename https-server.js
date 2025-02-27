const https = require('https');
const fs = require('fs');
const path = require('path');

const options = {
  key: fs.readFileSync('ssl/server.key'),
  cert: fs.readFileSync('ssl/server.crt')
};

const PORT = 8443;

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

  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './arcade-platform/index.html';
  }

  const extname = path.extname(filePath);
  let contentType = 'text/html';
  
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

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if(error.code === 'ENOENT') {
        fs.readFile('./arcade-platform/index.html', (error, content) => {
          if (error) {
            res.writeHead(500);
            res.end('Server Error: ' + error.code);
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content, 'utf-8');
        });
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + error.code);
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

const server = https.createServer(options, serverHandler);

server.listen(PORT, () => {
  console.log(`Server running at https://localhost:${PORT}/`);
  console.log(`For mobile devices, use: https://<YOUR_LOCAL_IP>:${PORT}/`);
}); 