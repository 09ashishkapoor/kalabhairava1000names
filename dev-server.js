/**
 * Fast local dev server — zero external dependencies, no Python overhead.
 *
 * Usage:
 *   node dev-server.js            # default port 8000
 *   node dev-server.js --port 3000
 *   node dev-server.js --open     # auto-open browser
 *
 * Features:
 * - Static file serving with correct MIME types
 * - Directory index (index.html) for all paths
 * - SPA fallback (serves index.html for unknown routes)
 * - No-cache headers for development
 * - Auto-detects free port
 * - Windows CTRL_CLOSE_EVENT handler
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

/* ─── MIME types ─────────────────────────────────────────────── */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.txt':  'text/plain; charset=utf-8',
  '.xml':  'application/xml',
  '.webmanifest': 'application/manifest+json',
};

const ROOT = __dirname;

/* ─── Parse CLI flags ────────────────────────────────────────── */
const args = process.argv.slice(2);
let desiredPort = 8000;
let openBrowser = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' && args[i + 1]) {
    desiredPort = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === '--open') {
    openBrowser = true;
  }
}

/* ─── Find a free port ───────────────────────────────────────── */
function findFreePort(start, maxAttempts = 20) {
  const net = require('net');
  for (let port = start; port < start + maxAttempts; port++) {
    const server = net.createServer();
    try {
      server.listen(port, '127.0.0.1');
      server.close();
      return port;
    } catch { continue; }
  }
  throw new Error(`No free port in range ${start}-${start + maxAttempts - 1}`);
}

/* ─── Request handler ────────────────────────────────────────── */
function handler(req, res) {
  // Normalise the URL path
  let urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);

  // Strip trailing slash (unless it's root)
  if (urlPath.length > 1 && urlPath.endsWith('/')) {
    urlPath = urlPath.slice(0, -1);
  }

  // Default to index.html
  let filePath = urlPath === '' || urlPath === '/'
    ? path.join(ROOT, 'index.html')
    : path.join(ROOT, urlPath);

  // Try the exact path first
  serveFile(filePath, req, res, () => {
    // Not found — try adding .html
    serveFile(filePath + '.html', req, res, () => {
      // Try index.html inside directory
      serveFile(path.join(filePath, 'index.html'), req, res, () => {
        // SPA fallback — serve index.html
        serveFile(path.join(ROOT, 'index.html'), req, res, () => {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
        });
      });
    });
  });
}

function serveFile(filePath, req, res, onNotFound) {
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) return onNotFound();

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Last-Modified': stats.mtime.toUTCString(),
    });

    fs.createReadStream(filePath).pipe(res);
  });
}

/* ─── Start server ───────────────────────────────────────────── */
const port = findFreePort(desiredPort);

const server = http.createServer(handler);
server.listen(port, '127.0.0.1', () => {
  console.log('');
  console.log('='.repeat(56));
  console.log('  🔥 Dev server started');
  console.log('='.repeat(56));
  console.log(`  Local:   http://127.0.0.1:${port}`);
  console.log(`  Network: http://${getLocalIP()}:${port}`);
  console.log('='.repeat(56));
  console.log('  Press Ctrl+C to stop');
  console.log('='.repeat(56));
  console.log('');

  if (openBrowser) {
    const { exec } = require('child_process');
    const url = `http://127.0.0.1:${port}`;
    if (process.platform === 'win32') {
      exec(`start ${url}`);
    } else if (process.platform === 'darwin') {
      exec(`open ${url}`);
    } else {
      exec(`xdg-open ${url}`);
    }
  }
});

/* ─── Graceful shutdown ──────────────────────────────────────── */
function shutdown() {
  console.log('\n  Server stopped.');
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Windows: handle CTRL_CLOSE_EVENT (console window close)
if (process.platform === 'win32') {
  const rl = require('readline').createInterface({ input: process.stdin, output: process.stdout });
  rl.on('SIGINT', shutdown);
}

/* ─── Utility: get LAN IP ────────────────────────────────────── */
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    if (!iface) continue;
    for (const addr of iface) {
      if (addr.family === 'IPv4' && !addr.internal) return addr.address;
    }
  }
  return '127.0.0.1';
}
