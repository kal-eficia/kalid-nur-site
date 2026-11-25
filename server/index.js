import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import zlib from 'node:zlib';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { loadOrExit } from './content.js';
import { config } from './config.js';
import { setRequest, setCssVersion } from './views/layout.js';
import { renderHome } from './views/home.js';
import { renderWork, renderAbout, renderMasterclass, renderBook, renderNotFound } from './views/pages.js';
import { renderNotes, renderNote, findNote, renderFeed } from './views/notes.js';
import { renderOgCard, OG_CARDS } from './views/og.js';
import { renderWork as renderWorkIndex, renderCaseStudy, findCaseStudy, renderVideo, renderBranding, visibleWork } from './views/work.js';

// "Ask Kalid's brain" (server/ask.js) stays in the code but isn't mounted since the rebrand
// (docs/rebrand/SPEC.md). Its corpus builder still expects the newspaper content shape, so it
// needs updating before it's switched back on.

const root = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3000;
const PRODUCTION = process.env.NODE_ENV === 'production';

// Content is read and validated once at startup. `npm run dev` restarts on any change in content/.
const content = loadOrExit();

app.disable('x-powered-by');
app.set('trust proxy', 1);

// Security headers. Everything is same-origin: no third parties, no inline scripts.
app.use((req, res, next) => {
  res.set({
    'Content-Security-Policy':
      "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'self'; manifest-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Site': 'kalid-nur',
    ...(PRODUCTION ? { 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains' } : {}),
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  });
  next();
});

// ---------- Compression and the CSS bundle (Node's own zlib: no extra packages) ----------
const PUBLIC = path.join(root, '..', 'public');
const cssBundle = ['fonts.css', 'tokens.css', 'site.css'].map((f) => fs.readFileSync(path.join(PUBLIC, 'css', f), 'utf8')).join('\n');
setCssVersion(createHash('sha256').update(cssBundle).digest('hex').slice(0, 10));
const packed = (buf) => ({ raw: buf, br: zlib.brotliCompressSync(buf), gzip: zlib.gzipSync(buf) });
const cssPacked = packed(Buffer.from(cssBundle));

function sendCompressed(req, res, p, type) {
  const accept = req.get('accept-encoding') ?? '';
  res.type(type);
  res.vary('Accept-Encoding');
  if (/\bbr\b/.test(accept)) return res.set('Content-Encoding', 'br').send(p.br);
  if (/\bgzip\b/.test(accept)) return res.set('Content-Encoding', 'gzip').send(p.gzip);
  return res.send(p.raw);
}
app.get('/css/bundle.css', (req, res) => {
  res.set('Cache-Control', req.query.v ? 'public, max-age=31536000, immutable' : 'no-cache');
  sendCompressed(req, res, cssPacked, 'text/css');
});
// Scripts, SVGs and the manifest are compressed once and kept in memory.
const textCache = new Map();
const TYPES = { '.js': 'application/javascript', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
app.get(/^\/(js\/[\w-]+\.js|brand\/[\w-]+\.svg|site\.webmanifest)$/, (req, res, next) => {
  const file = path.join(PUBLIC, req.path);
  if (!textCache.has(file)) {
    if (!fs.existsSync(file)) return next();
    textCache.set(file, packed(fs.readFileSync(file)));
  }
  res.set('Cache-Control', 'public, max-age=86400');
  sendCompressed(req, res, textCache.get(file), TYPES[path.extname(file)]);
});
app.get('/favicon.ico', (req, res) => res.redirect(301, '/brand/favicon-32.png'));

// Pages are compressed as they're sent.
app.use((req, res, next) => {
  const send = res.send.bind(res);
  res.send = (body) => {
    if (typeof body === 'string' && body.length > 1024 && /html|xml|json/.test(res.get('Content-Type') ?? '')) {
      const accept = req.get('accept-encoding') ?? '';
      res.vary('Accept-Encoding');
      if (/\bbr\b/.test(accept)) {
        res.set('Content-Encoding', 'br');
        return send(zlib.brotliCompressSync(body, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } }));
      }
      if (/\bgzip\b/.test(accept)) {
        res.set('Content-Encoding', 'gzip');
        return send(zlib.gzipSync(body));
      }
    }
    return send(body);
  };
  next();
});

app.use(
  express.static(PUBLIC, {
    index: false,
    redirect: false, // public/work/ is a folder; /work is a page
    setHeaders(res, filePath) {
      if (filePath.includes(`${path.sep}fonts${path.sep}`)) res.set('Cache-Control', 'public, max-age=31536000, immutable');
      else if (filePath.includes(`${path.sep}brand${path.sep}`) || filePath.includes(`${path.sep}og${path.sep}`) || filePath.includes(`${path.sep}work${path.sep}`)) res.set('Cache-Control', 'public, max-age=86400');
    },
  }),
);

// Note the address and path being served, for canonical links and social cards.
app.use((req, res, next) => {
  setRequest(`${req.protocol}://${req.get('host')}`, req.path);
  next();
});

const sendPage = (res, html) => {
  // Short cache: the masterclass panel switches itself off on a date.
  res.set('Cache-Control', 'public, max-age=300');
  res.type('html').send(html);
};

app.get('/', (req, res) => sendPage(res, renderHome()));
app.get('/work-with-me', (req, res) => sendPage(res, renderWork()));
app.get('/about', (req, res) => sendPage(res, renderAbout()));
app.get('/masterclass', (req, res) => sendPage(res, renderMasterclass()));
app.get('/work', (req, res) => {
  const type = ['systems', 'video', 'brand'].includes(req.query.type) ? req.query.type : null;
  sendPage(res, renderWorkIndex(content, type));
});
app.get('/work/:slug', (req, res, next) => {
  const item = findCaseStudy(content, req.params.slug);
  if (!item) return next();
  sendPage(res, renderCaseStudy(content, item));
});
app.get('/video', (req, res) => sendPage(res, renderVideo(content)));
app.get('/branding', (req, res) => sendPage(res, renderBranding(content)));
app.get('/notes', (req, res) => sendPage(res, renderNotes(content)));
app.get('/notes/:slug', (req, res, next) => {
  const note = findNote(content, req.params.slug);
  if (!note) return next();
  sendPage(res, renderNote(content, note));
});
app.get('/book', (req, res) => {
  if (config.bookingUrl) return res.redirect(302, config.bookingUrl);
  sendPage(res, renderBook());
});

// The newspaper's old addresses, so any link already shared still lands somewhere sensible.
const MOVED = [
  [/^\/essays\/([\w-]+)\/?$/, (m) => `/notes/${m[1]}`],
  [/^\/essays\/?$/, () => '/notes'],
  [/^\/(editions|obituaries)(\/.*)?$/, () => '/notes'],
  [/^\/workshop(\/.*)?$/, () => '/work'],
  [/^\/teaching(\/.*)?$/, () => '/work-with-me'],
  [/^\/why-kids\/?$/, () => '/about'],
  [/^\/principles\/?$/, () => '/about#principles'],
  [/^\/(ar|ask)(\/.*)?$/, () => '/'],
];
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  for (const [re, to] of MOVED) {
    const m = req.path.match(re);
    if (m) return res.redirect(301, to(m));
  }
  next();
});

app.get('/feed.xml', (req, res) => {
  const origin = process.env.SITE_URL?.replace(/\/$/, '') || `${req.protocol}://${req.get('host')}`;
  res.set('Cache-Control', 'public, max-age=3600');
  res.type('application/rss+xml').send(renderFeed(content, origin));
});

app.get('/robots.txt', (req, res) => {
  const o = process.env.SITE_URL?.replace(/\/$/, '') || `${req.protocol}://${req.get('host')}`;
  res.type('text').send(`User-agent: *\nAllow: /\n\nSitemap: ${o}/sitemap.xml\n`);
});
app.get('/sitemap.xml', (req, res) => {
  const o = process.env.SITE_URL?.replace(/\/$/, '') || `${req.protocol}://${req.get('host')}`;
  const paths = [
    '/', '/work-with-me', '/work', '/video', '/branding', '/about', '/notes', '/masterclass',
    ...visibleWork(content).filter((w) => w.caseStudy && w.public).map((w) => `/work/${w.slug}`),
    ...content.notes.filter((n) => n.published).map((n) => `/notes/${n.slug}`),
  ];
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${o}${p}</loc></url>`).join('\n')}
</urlset>
`);
});

if (!PRODUCTION) {
  app.get('/_og/:key', (req, res, next) => {
    const html = renderOgCard(req.params.key);
    if (!html) return next();
    res.type('html').send(html);
  });
  app.get('/_og', (req, res) => res.json(Object.keys(OG_CARDS)));
}

app.use((req, res) => {
  res.status(404);
  sendPage(res, renderNotFound(req.path));
});

app.listen(PORT, () => {
  console.log(`Kalid Nur site on http://localhost:${PORT}`);
});

