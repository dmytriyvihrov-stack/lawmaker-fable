import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';

// Serve the exact standalone deliverable, without Vite or hot reloading.
const file = new URL('../lawmaker-fable.html', import.meta.url);
// One copy of this can already be running from another desk, so the port is
// asked for rather than assumed: PORT wins, then 5182.
const port = Number(process.env.PORT) || 5182;
createServer((request, response) => {
  if (request.url?.split('?')[0] === '/favicon.ico') { response.writeHead(204).end(); return; }
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(readFileSync(file));
}).listen(port, '127.0.0.1', () => process.stdout.write(`Player copy: http://127.0.0.1:${port}/\n`));
