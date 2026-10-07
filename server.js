const express = require('express');
const https = require('https');
const http = require('http');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND = 'https://script.google.com/macros/s/AKfycbwMUuAQJY-hMh72KkZTz0LF0DrbVGhI-WllDFPthZ5VV_WbAblpTa3-35QEDsGwU4mnuA/exec';

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

function proxy(url, method, body, n) {
  if (n > 10) return Promise.reject(new Error('Too many redirects'));
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const u = new URL(url);
    const opt = {
      hostname: u.hostname, path: u.pathname + u.search, method,
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json', 'Content-Type': 'application/json' }
    };
    if (body) opt.headers['Content-Length'] = Buffer.byteLength(body);
    const r = lib.request(opt, res => {
      if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location) {
        const next = res.headers.location.startsWith('http') ? res.headers.location : u.origin + res.headers.location;
        const nm = (res.statusCode===307||res.statusCode===308) ? method : 'GET';
        return proxy(next, nm, nm==='GET' ? null : body, n+1).then(resolve).catch(reject);
      }
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(d));
    });
    r.on('error', reject);
    if (body) r.write(body);
    r.end();
  });
}

app.all('/api/proxy', async (req, res) => {
  try {
    const p = req.query || {};
    const method = req.method === 'POST' ? 'POST' : 'GET';
    const qs = Object.keys(p).map(k => k + '=' + encodeURIComponent(p[k])).join('&');
    const url = BACKEND + (qs ? '?' + qs : '');
    const body = method === 'POST' ? JSON.stringify(req.body) : null;
    const data = await proxy(url, method, body, 0);
    res.setHeader('Content-Type', 'application/json');
    res.send(data);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));
app.listen(PORT, () => console.log('ALO Proxy corriendo en puerto ' + PORT));
