const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const port = Number(process.env.PORT) || 3000;
const root = __dirname;
const dataDirectory = path.join(root, 'data');
const assessmentFile = path.join(dataDirectory, 'assessment.json');
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', chunk => { body += chunk; if (body.length > 1_000_000) request.destroy(); });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

async function handleApi(request, response, requestUrl) {
  if (requestUrl.pathname !== '/api/assessment') return false;
  if (request.method === 'GET') {
    if (!fs.existsSync(assessmentFile)) return sendJson(response, 200, null);
    return sendJson(response, 200, JSON.parse(fs.readFileSync(assessmentFile, 'utf8')));
  }
  if (request.method === 'POST') {
    try {
      const assessment = JSON.parse(await readBody(request));
      if (!assessment || typeof assessment !== 'object' || !Array.isArray(assessment.attribution)) return sendJson(response, 400, { error: 'Invalid assessment payload' });
      fs.mkdirSync(dataDirectory, { recursive: true });
      fs.writeFileSync(assessmentFile, JSON.stringify(assessment, null, 2));
      return sendJson(response, 201, { saved: true });
    } catch {
      return sendJson(response, 400, { error: 'Request body must be valid JSON' });
    }
  }
  response.setHeader('Allow', 'GET, POST');
  sendJson(response, 405, { error: 'Method not allowed' });
  return true;
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  if (requestUrl.pathname.startsWith('/api/')) {
    await handleApi(request, response, requestUrl);
    return;
  }
  const requestedPath = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname;
  const filePath = path.resolve(root, `.${requestedPath}`);
  if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }
  response.writeHead(200, { 'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(response);
});

server.listen(port, () => console.log(`Responsible Robotics Studio running at http://localhost:${port}`));
