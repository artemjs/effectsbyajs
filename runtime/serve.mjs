// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Bohdanov
// Tiny static server on a random free localhost port + "open in browser".
// ES modules do not load from file:// — films, showcases and the renderer all go through this.

import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4',
  '.ts': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8'
};

/**
 * Serves `root`. routes: { '/path': (req, res) => void } override files.
 * Picks a random port in [20000, 60000); if it is taken, tries another.
 * Returns { url, port, close }.
 */
export async function serve(root, routes = {}) {
  root = path.resolve(root);
  const server = http.createServer(async (req, res) => {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (routes[p]) return routes[p](req, res);
    if (p === '/favicon.ico') { res.writeHead(204).end(); return; }
    const file = path.join(root, p.endsWith('/') ? p + 'index.html' : p);
    if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
    try {
      if (!(await stat(file)).isFile()) throw new Error('not a file');
      res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
      createReadStream(file).pipe(res);
    } catch { res.writeHead(404).end('not found: ' + p); }
  });
  for (let attempt = 0; ; attempt++) {
    const port = 20000 + Math.floor(Math.random() * 40000);
    try {
      await new Promise((ok, fail) => { server.once('error', fail); server.listen(port, '127.0.0.1', ok); });
      return { url: `http://localhost:${port}`, port, close: () => server.close() };
    } catch (e) {
      if (e.code !== 'EADDRINUSE' || attempt > 20) throw e;
    }
  }
}

/** Opens a URL in the default browser. */
export function openBrowser(url) {
  const [cmd, args] = process.platform === 'darwin' ? ['open', [url]]
    : process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]] : ['xdg-open', [url]];
  spawn(cmd, args, { stdio: 'ignore', detached: true }).unref();
}
