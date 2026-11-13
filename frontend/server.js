// Production server for cPanel (Application startup file: server.js). Run `npm run build` first.
const { createServer } = require('http');
const next = require('next');

const port = parseInt(process.env.PORT || '3000', 10);
const API_URL = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();

// The browser calls /api/* and /uploads/* on this domain. They are forwarded to the backend here rather
// than by the rewrite in next.config.mjs: behind cPanel's LiteSpeed, Next's own proxy sometimes delivers
// small replies (such as the login reply) with an empty body, which breaks logging in. Each reply is read
// in full and sent on with its exact length.
const SKIP = new Set([
  'connection', 'keep-alive', 'transfer-encoding', 'te', 'trailer', 'upgrade', 'proxy-authorization',
  'proxy-authenticate', 'host', 'content-length', 'content-encoding', 'accept-encoding',
]);
const isBackendPath = (url) => url === '/api' || url.startsWith('/api/') || url.startsWith('/api?') || url.startsWith('/uploads/');

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function forward(req, res) {
  try {
    const headers = {};
    for (const [k, v] of Object.entries(req.headers)) {
      if (!SKIP.has(k) && v !== undefined) headers[k] = Array.isArray(v) ? v.join(', ') : v;
    }
    headers['x-forwarded-for'] = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    headers['x-forwarded-host'] = req.headers.host || '';
    headers['accept-encoding'] = 'identity';

    const body = req.method === 'GET' || req.method === 'HEAD' ? null : await readBody(req);
    const upstream = await fetch(API_URL + req.url, {
      method: req.method,
      headers,
      body: body && body.length ? body : undefined,
      redirect: 'manual',
      signal: AbortSignal.timeout(30000),
    });
    const buf = Buffer.from(await upstream.arrayBuffer());

    const out = {};
    upstream.headers.forEach((v, k) => { if (!SKIP.has(k) && k !== 'set-cookie') out[k] = v; });
    const cookies = upstream.headers.getSetCookie ? upstream.headers.getSetCookie() : [];
    if (cookies.length) out['set-cookie'] = cookies;
    out['content-length'] = String(buf.length);
    res.writeHead(upstream.status, out);
    res.end(req.method === 'HEAD' ? undefined : buf);
  } catch (e) {
    console.error('[proxy]', req.method, req.url, e.message);
    if (!res.headersSent) res.writeHead(502, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ message: 'Could not reach the shop server. Please try again.' }));
  }
}

// Right after start-up, open the home page once and ask for its first photos, so they are already
// resized and cached when the first visitor (or a speed test after a fresh deploy) arrives.
async function warmUp() {
  const base = `http://127.0.0.1:${port}`;
  try {
    const html = await (await fetch(base + '/', { signal: AbortSignal.timeout(60000) })).text();
    const urls = new Set();
    const add = (set) => set.split(',').forEach((part) => {
      const u = part.trim().split(/\s+/)[0].replace(/&amp;/g, '&');
      // the sizes phones and laptops actually ask for
      if (u.startsWith('/_next/image') && /[?&]w=(128|200|256|320|360|480|640|768|1024)(&|$)/.test(u)) urls.add(u);
    });
    for (const m of html.matchAll(/<link[^>]+rel="preload"[^>]+as="image"[^>]*>/gi)) {
      const set = m[0].match(/imageSrcSet="([^"]+)"/i);
      if (set) add(set[1]);
    }
    let imgs = 0;
    for (const m of html.matchAll(/<img[^>]+srcset="([^"]+)"/gi)) {
      add(m[1]);
      if (++imgs >= 24) break;
    }
    const list = [...urls].slice(0, 160);
    for (let i = 0; i < list.length; i += 2) {
      await Promise.all(list.slice(i, i + 2).map((u) => fetch(base + u).then((r) => r.arrayBuffer()).catch(() => null)));
    }
    console.log(`Warm-up done: ${list.length} images ready`);
  } catch (e) {
    console.warn('[warm-up]', e.message);
  }
}

app.prepare().then(() => {
  createServer((req, res) => (isBackendPath(req.url || '') ? forward(req, res) : handle(req, res))).listen(port, () => {
    console.log(`Storefront ready on port ${port}`);
    setTimeout(warmUp, 1500);
  });
});
