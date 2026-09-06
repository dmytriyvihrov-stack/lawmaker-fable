import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { createServer } from 'vite';

/**
 * Starts this build's dev server from anywhere, so the variant can be launched
 * side by side with the main project without borrowing its root.
 * Port comes from --port, or 5174.
 */
const here = dirname(fileURLToPath(import.meta.url));
const portArg = process.argv.indexOf('--port');
const port = portArg > -1 ? Number(process.argv[portArg + 1]) : 5174;

process.chdir(here);

const server = await createServer({
  root: here,
  configFile: `${here}/vite.config.ts`,
  server: { port, strictPort: true },
});

await server.listen();
server.printUrls();
