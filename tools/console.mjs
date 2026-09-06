/**
 * The design console: a local page that reads the game content out of
 * src/content and src/engine/config.ts, draws how it hangs together, and writes
 * single values back into the sources.
 *
 *   node tools/console.mjs [--port 5180] [--no-open]
 *
 * Nothing outside src/content and src/engine/config.ts is ever written, every
 * write keeps a copy of the previous file in tools/.backups, and the console
 * has no dependencies beyond Node itself.
 */
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContent } from './lib/content.mjs';
import { applyPatch } from './lib/patch.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(here, '..');

const args = process.argv.slice(2);
const portArg = args.indexOf('--port');
const PORT = portArg === -1 ? 5180 : Number(args[portArg + 1]) || 5180;
const OPEN = !args.includes('--no-open');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
};

function send(res, code, body, type) {
  res.writeHead(code, {
    'Content-Type': type || 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => {
      data += c;
      if (data.length > 4_000_000) reject(new Error('body too large'));
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function runScript(script) {
  return new Promise((resolve) => {
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const child = spawn(npm, ['run', script], { cwd: projectRoot, shell: process.platform === 'win32' });
    let out = '';
    child.stdout.on('data', (c) => {
      out += c;
    });
    child.stderr.on('data', (c) => {
      out += c;
    });
    child.on('error', (err) => resolve({ ok: false, output: String(err) }));
    child.on('close', (code) =>
      resolve({ ok: code === 0, output: out.replace(/\[[0-9;]*m/g, '').slice(-20000) }),
    );
  });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      const html = readFileSync(join(here, 'ui', 'index.html'), 'utf8');
      return send(res, 200, html, MIME['.html']);
    }

    if (req.method === 'GET' && /^\/ui\/[a-z0-9.-]+$/i.test(url.pathname)) {
      const file = join(here, url.pathname.replace(/^\//, ''));
      const body = readFileSync(file, 'utf8');
      return send(res, 200, body, MIME[extname(file)] || 'text/plain; charset=utf-8');
    }

    if (req.method === 'GET' && url.pathname === '/api/model') {
      return send(res, 200, JSON.stringify(loadContent(projectRoot)));
    }

    if (req.method === 'POST' && url.pathname === '/api/patch') {
      const body = JSON.parse(await readBody(req));
      const ops = Array.isArray(body.ops) ? body.ops : [];
      if (ops.length === 0) return send(res, 400, JSON.stringify({ error: 'no ops' }));
      const touched = applyPatch(projectRoot, ops);
      return send(res, 200, JSON.stringify({ touched, model: loadContent(projectRoot) }));
    }

    if (req.method === 'POST' && url.pathname === '/api/run') {
      const body = JSON.parse(await readBody(req));
      const script = body.script === 'test' ? 'test' : 'validate';
      const result = await runScript(script);
      return send(res, 200, JSON.stringify(result));
    }

    return send(res, 404, JSON.stringify({ error: 'not found' }));
  } catch (err) {
    return send(res, 500, JSON.stringify({ error: String(err && err.message ? err.message : err) }));
  }
});

server.listen(PORT, () => {
  const url = 'http://localhost:' + PORT + '/';
  console.log('Lawmaker design console on ' + url);
  console.log('Reads and writes: src/content/*, src/engine/config.ts. Backups in tools/.backups.');
  if (OPEN) {
    if (process.platform === 'win32') spawn('cmd', ['/c', 'start', '', url], { detached: true });
    else if (process.platform === 'darwin') spawn('open', [url], { detached: true });
    else spawn('xdg-open', [url], { detached: true });
  }
});
