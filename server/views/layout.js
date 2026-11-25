// The page shell: head, header, mobile menu, footer.

import { esc, ph, ext, PRODUCTION } from './html.js';
import { config } from '../config.js';

export const MARK_ALT = 'Kalid Nur logo: نور (light) in square Kufic';

// One stylesheet for the browser: fonts, tokens and site CSS joined at startup.
export let CSS_VERSION = '0';
export const setCssVersion = (v) => {
  CSS_VERSION = v;
};

// Rendering is synchronous, so the request being served can be noted here for one render.
let origin = '';
let requestPath = '/';
export const setRequest = (o, p) => {
  origin = process.env.SITE_URL?.replace(/\/$/, '') || o;
  requestPath = p;
};
export const siteOrigin = () => origin;

// docs/rebrand/WORK-SPEC.md: What I do · Work · Video · Branding · About · Notes · Book a call.
export const NAV = [
  { label: 'What I do', href: '/work-with-me' },
  { label: 'Work', href: '/work' },
  { label: 'Video', href: '/video' },
  { label: 'Branding', href: '/branding' },
  { label: 'About', href: '/about' },
  { label: 'Notes', href: '/notes' },
];

// Which social card a page uses (made by `npm run og`, saved in public/og/).
export function ogKey(path = '/') {
  const first = path.split('/')[1] || 'home';
  return ['work-with-me', 'work', 'video', 'branding', 'about', 'notes', 'masterclass', 'book'].includes(first) ? first : 'home';
}

const isCurrent = (href, current) => current === href || current.startsWith(`${href}/`);

function header(current) {
  const links = NAV.map(
    (n) => `<li><a href="${n.href}"${isCurrent(n.href, current) ? ' aria-current="page"' : ''}>${n.label}</a></li>`,
  ).join('');
  return `
<header class="site-header">
  <div class="wrap"><div class="site-header__inner">
    <a class="site-header__logo" href="/" aria-label="Kalid Nur, home"><img src="/brand/kalid-nur-logo-no-tagline.svg" alt="${MARK_ALT}" width="180" height="58"></a>
    <nav class="site-nav" aria-label="Main">
      <ul class="site-nav__list">${links}</ul>
      <a class="btn site-nav__cta" href="/book">Book a call</a>
      <a class="menu-btn" href="#menu" aria-controls="menu" aria-expanded="false" aria-label="Open menu">
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path d="M3 8h18M3 16h18"/></svg>
      </a>
    </nav>
  </div></div>
</header>
<div class="menu" id="menu" role="dialog" aria-label="Menu">
  <div class="wrap menu__inner">
    <div class="menu__top">
      <img src="/brand/nur-mark-white.svg" alt="${MARK_ALT}" width="40" height="40">
      <a class="menu__close" href="#top" aria-label="Close menu"><svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path d="M5 5l14 14M19 5L5 19"/></svg></a>
    </div>
    <ul class="menu__list">${NAV.map((n) => `<li><a href="${n.href}">${n.label}</a></li>`).join('')}</ul>
    <a class="btn btn--on-dark menu__cta" href="/book">Book a call</a>
  </div>
</div>`;
}

function socials() {
  return Object.values(config.socials)
    // A missing link is a visible placeholder on Kalid's machine and left out entirely on the live site.
    .map((s) => (s.url ? `<li><a href="${esc(s.url)}" rel="noopener me">${s.label}${s.handle ? ` ${esc(s.handle)}` : ''}</a></li>` : PRODUCTION ? ph(`${s.label} URL`) : `<li>${s.label} ${ph(`${s.label} URL`)}</li>`))
    .join('');
}

function footer() {
  return `
<footer class="site-footer" id="site-footer">
  <div class="wrap site-footer__inner">
    <a class="site-footer__logo" href="/" aria-label="Kalid Nur, home"><img src="/brand/kalid-nur-logo-reversed.svg" alt="${MARK_ALT}" width="371" height="120"></a>
    <div class="site-footer__text">
      <nav aria-label="Footer"><ul class="site-footer__nav">${NAV.map((n) => `<li><a href="${n.href}">${n.label}</a></li>`).join('')}<li><a href="/book">Book a call</a></li></ul></nav>
      <ul class="site-footer__social">${socials()}</ul>
      <p><a href="${config.links.excelia}"${ext(config.links.excelia)}>Teaching 11 to 18 year olds? See Excelia<span aria-hidden="true">&nbsp;→</span></a></p>
      <p class="site-footer__small">© 2026 Kalid Nur · No trackers</p>
    </div>
  </div>
</footer>`;
}

export function layout({ title, description, main, path = requestPath, current = path, noindex = false, head = '', bodyClass = '' }) {
  const url = `${origin}${path}`;
  const image = `${origin}/og/${ogKey(path)}.png`;
  return `<!doctype html>
<html lang="en-GB" id="top">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(url)}">
${noindex ? '<meta name="robots" content="noindex">\n' : ''}<meta property="og:type" content="website">
<meta property="og:site_name" content="Kalid Nur">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="The نور mark with the words: ${esc(title)}">
<meta property="og:locale" content="en_GB">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#16140F">
<meta name="color-scheme" content="light">
<link rel="icon" href="/brand/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/brand/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/brand/favicon-180.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="/brand/fonts/cinzel-latin-600-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/brand/fonts/inter-tight-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="alternate" type="application/rss+xml" title="Notes from Kalid Nur" href="/feed.xml">
<link rel="stylesheet" href="/css/bundle.css?v=${CSS_VERSION}">
${head}</head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}>
<a class="skip" href="#main">Skip to content</a>
${header(current)}
<main id="main" tabindex="-1">
${main}
</main>
${footer()}
<script src="/js/site.js" defer></script>
</body>
</html>
`;
}
