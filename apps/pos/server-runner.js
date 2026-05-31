// server-runner.js
const http = require('http');
const { parse } = require('url');
const path = require('path');

// Disable telemetry & enforce production environment
process.env.NEXT_TELEMETRY_DISABLED = '1';
process.env.NODE_ENV = 'production';

try {
  const next = require('next');
  const PORT = process.env.PORT || 3002;
  const dir = process.env.NEXT_DIR || __dirname;

  console.log(`Starting Next.js server in child process for dir: ${dir} on port: ${PORT}`);
  
  const nextApp = next({ dev: false, dir });
  const handle = nextApp.getRequestHandler();

  nextApp.prepare().then(() => {
    const server = http.createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    });

    server.listen(PORT, '0.0.0.0', (err) => {
      if (err) {
        console.error('Server listen error:', err);
        process.exit(1);
      }
      console.log(`Next.js server programmatically listening on all interfaces at http://0.0.0.0:${PORT}`);
    });
  }).catch(err => {
    console.error('Next.js prepare error:', err);
    process.exit(1);
  });
} catch (err) {
  console.error('Failed to require next inside child process:', err);
  process.exit(1);
}
