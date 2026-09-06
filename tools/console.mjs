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

/**
 * The reign simulator, run as a child process and handed back as JSON.
 *
 * It is spawned rather than imported because it is TypeScript that imports the
 * game engine, so it needs vite-node to run at all, and because a simulator
 * that hangs must not take the console down with it. Only the flags below are
 * ever passed on, each one checked here, so nothing a page sends can turn into
 * an argument this file did not write.
 */
const NEWLINE = String.fromCharCode(10);
const VITE_NODE = join(projectRoot, 'node_modules', 'vite-node', 'vite-node.mjs');
const PLAYER_IDS = ['best', 'comfortable', 'human', 'random', 'first', 'middle', 'last'];

function reignArgs(body) {
  const out = ['--json'];
  const players = Array.isArray(body.players)
    ? body.players.filter((p) => PLAYER_IDS.includes(p))
    : [];
  if (players.length > 0) out.push('--player', players.join(','));
  const seeds = String(body.seeds ?? '').trim();
  if (/^[0-9]{1,6}$/.test(seeds)) out.push('--seeds', seeds);
  else if (/^[0-9]{1,6}-[0-9]{1,6}$/.test(seeds)) out.push('--seeds', seeds);
  if (['all', 'half', 'none'].includes(body.moments)) out.push('--moments', body.moments);
  for (const [name, min, max] of [['mistake', 0, 1], ['speed', 1, 4], ['read', 0.1, 4]]) {
    const value = Number(body[name]);
    if (Number.isFinite(value) && value >= min && value <= max) {
      out.push('--' + name, String(value));
    }
  }
  out.push(body.timeline === false ? '--no-timeline' : '--timeline');
  return out;
}

function runReign(body) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [VITE_NODE, 'tools/reign.ts', ...reignArgs(body)], {
      cwd: projectRoot,
    });
    let out = '';
    let err = '';
    const stop = setTimeout(() => child.kill(), 120000);
    child.stdout.on('data', (c) => {
      out += c;
    });
    child.stderr.on('data', (c) => {
      err += c;
    });
    child.on('error', (e) => {
      clearTimeout(stop);
      resolve({ error: String(e) });
    });
    child.on('close', () => {
      clearTimeout(stop);
      // vite prints its own lines first; the report is the last one that parses
      const line = out.split(NEWLINE).reverse().find((l) => l.trim().startsWith('{'));
      if (!line) {
        return resolve({ error: (err || out || 'the simulator said nothing').slice(-4000) });
      }
      try {
        resolve(JSON.parse(line));
      } catch (e) {
        resolve({ error: 'could not read the report: ' + String(e) });
      }
    });
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

    if (req.method === 'POST' && url.pathname === '/api/reign') {
      const body = JSON.parse(await readBody(req));
      const result = await runReign(body);
      if (result.error) return send(res, 500, JSON.stringify({ error: result.error }));
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
  console.log('The Reign tab plays whole reigns through the engine and changes nothing.');
  if (OPEN) {
    if (process.platform === 'win32') spawn('cmd', ['/c', 'start', '', url], { detached: true });
    else if (process.platform === 'darwin') spawn('open', [url], { detached: true });
    else spawn('xdg-open', [url], { detached: true });
  }
});
