#!/usr/bin/env node

/**
 * Simple local server for testing the OpenSpeak database
 * Serves the database file with proper CORS headers for local development
 * 
 * Usage:
 *   bun scripts/serve-db.js [port]
 *   OR
 *   bun run serve-db
 * 
 * Default port: 3001
 * 
 * Then in your frontend .env file:
 *   VITE_DATABASE_URL=http://localhost:3001/words.json
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.argv[2] || 3001;
const DB_PATH = path.join(__dirname, '..', 'database', 'words.json');

// Check if database file exists
if (!fs.existsSync(DB_PATH)) {
  console.error('❌ Database file not found:', DB_PATH);
  console.error('Please run: node database/generate.js');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  // Enable CORS for all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Expose-Headers', 'ETag, Last-Modified');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Only serve GET/HEAD requests
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }
  
  // Serve the database file
  if (req.url === '/words.json' || req.url === '/') {
    try {
      const stats = fs.statSync(DB_PATH);
      const etag = `"${stats.mtime.getTime().toString(16)}-${stats.size.toString(16)}"`;
      
      // Check If-None-Match header for caching
      const ifNoneMatch = req.headers['if-none-match'];
      if (ifNoneMatch === etag) {
        res.writeHead(304);
        res.end();
        return;
      }
      
      // Read and serve the file
      const data = fs.readFileSync(DB_PATH, 'utf8');
      
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'ETag': etag,
        'Last-Modified': stats.mtime.toUTCString(),
        'Cache-Control': 'public, max-age=300'
      });
      
      if (req.method === 'HEAD') {
        res.end();
      } else {
        res.end(data);
      }
      
      console.log(`✓ ${req.method} ${req.url} - 200 (${stats.size} bytes)`);
      
    } catch (error) {
      console.error('Error serving file:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`
🚀 Local database server running

📁 Serving: ${DB_PATH}
🌐 URL: http://localhost:${PORT}/words.json

To use in frontend:
1. Create frontend/.env file with:
   VITE_DATABASE_URL=http://localhost:${PORT}/words.json

2. Start your frontend dev server:
   cd frontend && bun run dev

3. The app will fetch from the local server instead of GitHub

Press Ctrl+C to stop
`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server...');
  server.close(() => {
    process.exit(0);
  });
});
