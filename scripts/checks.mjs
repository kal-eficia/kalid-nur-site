// npm run checks: the automated checks in docs/UX-REVIEW.md section 4.
// npm run checks:prod: same, but any [KALID: ...] placeholder is a failure.

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { ROOT, PAGES, ensureServer } from './site.mjs';

const PRODUCTION = process.argv.includes('--production');
const results = [];
const record = (name, problems, note = '') => results.push({ name, problems, note });

// ---------- helpers ----------

function walk(dir, exts) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs, { withFileTypes: true }).flatMap((e) => {
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) return walk(rel, exts);
    return exts.includes(path.extname(e.name)) ? [rel] : [];
  });
}

const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function hexToLum(hex) {
  const h = hex.length === 4 ? '#' + [...hex.slice(1)].map((c) => c + c).join('') : hex;
  const ch = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const [r, g, b] = ch.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a, b) => {
  const [x, y] = [hexToLum(a), hexToLum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

// ---------- banned words, from ../../banned-words.md ----------

function bannedPatterns() {
  const file = path.resolve(ROOT, '..', '..', 'banned-words.md');
  if (!fs.existsSync(file)) return { patterns: [], missing: true };
  const md = fs.readFileSync(file, 'utf8');
  const section = (title) => {
    const m = md.match(new RegExp(`## ${escRe(title)}\\n([\\s\\S]*?)(?=\\n## |$)`));
    return m ? m[1] : '';
  };
  const patterns = [];

  // Vocabulary: comma and slash separated, parentheticals and "Replace with" notes removed.
  for (let line of section('Banned Vocabulary').split('\n')) {
    line = line.replace(/\*\*[^*]*\*\*/g, '').replace(/Replace with:.*$/i, '').replace(/\([^)]*\)/g, '');
    for (let term of line.split(/[,/]/)) {
      term = term.trim().replace(/\.$/, '').replace(/^"|"$/g, '');
      if (!term) continue;
      patterns.push({ label: term, re: new RegExp(`\\b${escRe(term)}\\b`, 'i') });
    }
  }

  // Phrases: X, Y and [bracketed] slots become wildcards. "From X to Y" is skipped:
  // as a plain pattern it matches ordinary English.
  for (const m of section('Banned Phrases').matchAll(/^- "([^"]+)"(.*)$/gm)) {
    const [, raw, note] = m;
    if (/^From X to Y$/i.test(raw)) continue;
    const opener = /starter|opener/i.test(note);
    for (let alt of raw.split(' / ')) {
      alt = alt.replace(/\.\.\.$/, '').replace(/\.\.\./g, ' ').trim();
      let src = escRe(alt)
        .replace(/\\\[[^\]]*\\\]/g, '.{1,40}?')
        .replace(/\bX\b|\bY\b/g, '.{1,40}?')
        .replace(/'/g, "['’]");
      src = opener ? `(?:^|[.!?]\\s+)${src}` : `\\b${src}`;
      patterns.push({ label: alt, re: new RegExp(src, 'im') });
    }
  }

  // Openers: only at the start of a sentence.
  for (const m of section('Banned Sentence/Paragraph Openers').matchAll(/^- "([^"]+)"/gm)) {
    const alt = m[1].replace(/\.\.\.$/, '').trim();
    const src = escRe(alt).replace(/'/g, "['’]");
    patterns.push({ label: alt, re: new RegExp(`(?:^|[.!?]\\s+)${src}`, 'im') });
  }
  return { patterns, missing: false };
}

// ---------- file checks ----------

function checkEmDashes() {
  const files = [
    ...walk('public', ['.html', '.css', '.js', '.svg', '.txt']),
    ...walk('content', ['.md', '.json', '.yml', '.yaml']),
    ...walk('server/views', ['.js', '.html']),
    ...walk('docs', ['.md']),
  ];
  const problems = [];
  for (const f of files) {
    fs.readFileSync(path.join(ROOT, f), 'utf8')
      .split('\n')
      .forEach((line, i) => line.includes('—') && problems.push(`${f}:${i + 1}`));
  }
  record('Em dash lint', problems, `${files.length} files`);
}

function cssFiles() {
  return walk('public/css', ['.css']).map((f) => ({ f, css: fs.readFileSync(path.join(ROOT, f), 'utf8') }));
}

function checkColours() {
  const problems = [];
  for (const { f, css } of cssFiles()) {
    const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/:root[^{]*\{[^}]*\}/g, '');
    for (const m of stripped.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) problems.push(`${f}: ${m[0]}`);
    for (const m of stripped.matchAll(/\b(?:rgba?|hsla?)\([^)]*\)/g)) problems.push(`${f}: ${m[0]}`);
  }
  record('Colour lint', problems);
}

// docs/rebrand/DESIGN.md: 40 px sides, 96 px sections, the comp's 20/56/80 steps. Odd one-offs are tokens.
const SPACE_SCALE = new Set([0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96]);
function checkSpacing() {
  const problems = [];
  const prop = /(?:^|[;{\s])((?:margin|padding)(?:-[a-z-]+)?|gap|row-gap|column-gap)\s*:\s*([^;}]+)/g;
  for (const { f, css } of cssFiles()) {
    const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of clean.matchAll(prop)) {
      const value = m[2].replace(/!important/, '').replace(/var\([^)]*\)/g, 'V');
      for (const n of value.matchAll(/(-?\d*\.?\d+)([a-z%]+)/gi)) {
        const [num, unit] = [Math.abs(parseFloat(n[1])), n[2].toLowerCase()];
        if (num === 0) continue;
        if (unit !== 'px' || !SPACE_SCALE.has(num)) problems.push(`${f}: ${m[1]}: ${m[2].trim()}`);
      }
    }
  }
  record('Spacing lint', problems);
}

function checkTokenContrast() {
  const css = fs.readFileSync(path.join(ROOT, 'public/css/tokens.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const vars = Object.fromEntries([...css.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{3,6})\b/g)].map((v) => [v[1], v[2]]));
  // [text, ground, minimum]. Text pairs need 4.5:1; the focus ring and rules on light need 3:1.
  const pairs = [
    ...['ink', 'ink-2', 'ink-3', 'brass'].flatMap((t) => ['paper', 'paper-2'].map((g) => [t, g, 4.5])),
    ['paper', 'brass', 4.5], // the brass button
    ['paper', 'ink-2', 4.5], // the ink button on hover
    ...['paper', 'on-dark-2', 'brass-light'].map((t) => [t, 'ink', 4.5]),
    ['ink', 'brass-light', 4.5], // the button on dark
  ];
  const problems = [];
  for (const [t, g, min] of pairs) {
    if (!vars[t] || !vars[g]) {
      problems.push(`missing token --${!vars[t] ? t : g}`);
      continue;
    }
    const r = contrast(vars[t], vars[g]);
    if (r < min) problems.push(`--${t} on --${g} is ${r.toFixed(2)}:1 (need ${min})`);
  }
  record('Contrast AA (token pairs)', problems, `${pairs.length} pairs`);
}

// The Notes renderer must turn plain Markdown into a pull quote and a sidenote.
async function checkProse() {
  const { prose } = await import('../server/views/html.js');
  const html = prose('First paragraph with a note.[^a]\n\n> A pull quote.\n\nMore text.\n\n[^a]: The note.');
  const problems = [];
  if (!html.includes('class="pull"')) problems.push('blockquote did not become a pull quote');
  if (!html.includes('class="sidenote"')) problems.push('footnote did not become a sidenote');
  if (html.includes('[^a]')) problems.push('footnote marker left in the text');
  record('Notes renderer', problems);
}

// ---------- page checks ----------

async function checkPages() {
  const { patterns, missing } = bannedPatterns();
  const { base: BASE, stop } = await ensureServer();
  const browser = await chromium.launch();
  const banned = [];
  const forbidden = [];
  const placeholders = new Map();
  const thirdParty = [];
  const links = [];
  const a11y = [];
  const weight = [];
  const forbiddenRe = /data analyst|transport for london|\bTfL\b/i;
  // docs/rebrand/CONTENT.md: no named apps, no certifications, nothing from the newspaper.
  // WORK-SPEC.md "Leave out": the old site's government work, Power BI, the certification, the tech-stack list, old prices.
  const retiredRe = /\b(Lock In|Excelia Live|Gradus|Stepping Stones|Skills Hub|School Brain|Red Pen|certifi\w*|Master Builder|edition|masthead|classified|obituar\w*|workshop|Power BI|government institutions?|tech stack)\b/i;
  const retired = [];

  try {
    for (const p of PAGES) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      page.on('request', (req) => {
        const host = new URL(req.url()).hostname;
        if (!['localhost', '127.0.0.1'].includes(host) && !req.url().startsWith('data:')) thirdParty.push(`${p}: ${req.url()}`);
      });
      const res = await page.goto(BASE + p, { waitUntil: 'networkidle' });
      if (!res || res.status() !== 200) links.push(`${p} returned ${res?.status()}`);
      const html = await page.content();
      const rawHtml = await (await fetch(BASE + p)).text(); // includes HTML comments
      const text = await page.evaluate(() => document.body.innerText);

      for (const { label, re } of patterns) if (re.test(text)) banned.push(`${p}: "${label}"`);
      const rm = text.match(retiredRe);
      if (rm) retired.push(`${p}: "${rm[0]}"`);
      const fm = rawHtml.match(forbiddenRe);
      if (fm) forbidden.push(`${p}: "${fm[0]}"`);
      for (const m of rawHtml.matchAll(/\[KALID:[^\]]*\]/g)) {
        const k = m[0].replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
        placeholders.set(k, [...new Set([...(placeholders.get(k) ?? []), p])]);
      }

      // Links: internal ones must return 200; same-page anchors must exist.
      const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
      for (const href of new Set(hrefs)) {
        if (href.startsWith('#')) {
          if (href.length > 1 && !(await page.$(`[id="${href.slice(1)}"]`))) links.push(`${p}: missing anchor ${href}`);
          continue;
        }
        const url = new URL(href, BASE + p);
        if (url.origin !== new URL(BASE).origin) continue; // outbound links are Kalid's to click, not ours to fetch
        // Not followed: a redirect to an outside site (e.g. /book to the booking page) is fine and isn't ours to fetch.
        const r = await fetch(url.href.split('#')[0], { redirect: 'manual' });
        const outbound = r.status >= 300 && r.status < 400 && new URL(r.headers.get('location') ?? '/', BASE).origin !== new URL(BASE).origin;
        if (r.status !== 200 && !outbound) links.push(`${p}: ${href} returned ${r.status}`);
      }

      // Accessibility basics.
      const h1s = await page.$$eval('h1', (els) => els.length);
      if (h1s !== 1) a11y.push(`${p}: ${h1s} h1 elements (want 1)`);
      const noAlt = await page.$$eval('img:not([alt])', (els) => els.map((e) => e.src));
      noAlt.forEach((s) => a11y.push(`${p}: img without alt: ${s}`));
      const unlabelledSvg = await page.$$eval('svg:not([aria-hidden="true"])', (els) =>
        els.filter((e) => !e.getAttribute('aria-label') && !e.querySelector('title')).length,
      );
      if (unlabelledSvg) a11y.push(`${p}: ${unlabelledSvg} svg(s) neither hidden nor labelled`);

      // Every interactive element reachable by Tab.
      // Radio buttons in one group share a single Tab stop (arrow keys move inside the group).
      const focusable = await page.$$eval(
        'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
        (els) => {
          const seenGroups = new Set();
          return els.filter((e) => {
            if (!e.getClientRects().length || getComputedStyle(e).visibility === 'hidden') return false;
            if (e.type === 'radio') {
              if (seenGroups.has(e.name)) return false;
              seenGroups.add(e.name);
            }
            return true;
          }).length;
        },
      );
      await page.evaluate(() => document.querySelectorAll('[data-tab-seen]').forEach((e) => e.removeAttribute('data-tab-seen')));
      for (let i = 0; i < focusable + 5; i++) {
        await page.keyboard.press('Tab');
        await page.evaluate(() => document.activeElement?.setAttribute('data-tab-seen', ''));
      }
      const seen = await page.$$eval('[data-tab-seen]', (els) => els.length);
      if (seen < focusable) a11y.push(`${p}: ${focusable - seen} of ${focusable} interactive elements not reached by Tab`);

      // Weight of the front page: HTML + CSS + JS, fonts excluded.
      if (p === '/') {
        const assets = await page.$$eval('link[rel="stylesheet"], script[src]', (els) => els.map((e) => e.href || e.src));
        let bytes = Buffer.byteLength(rawHtml);
        for (const a of assets) bytes += (await (await fetch(a)).arrayBuffer()).byteLength;
        const kb = bytes / 1024;
        if (kb >= 150) weight.push(`front page is ${kb.toFixed(1)} KB (limit 150)`);
        record('Weight', weight, `front page ${kb.toFixed(1)} KB of 150 KB`);
      }
      await context.close();
    }
  } finally {
    await browser.close();
    stop();
  }

  // RSS feed of published notes: present and well-formed (it may be empty until the first note).
  {
    const { base, stop: stopFeed } = await ensureServer();
    const problems = [];
    try {
      const r = await fetch(base + '/feed.xml');
      const xml = await r.text();
      if (r.status !== 200) problems.push(`/feed.xml returned ${r.status}`);
      if (!/rss\+xml/.test(r.headers.get('content-type') ?? '')) problems.push('/feed.xml is not served as application/rss+xml');
      if (!/^<\?xml[^>]*\?>\s*<rss[\s\S]*<\/rss>\s*$/.test(xml)) problems.push('/feed.xml is not a complete RSS document');
      if (xml.includes('\u2014')) problems.push('/feed.xml contains an em dash');
    } finally {
      stopFeed();
    }
    record('RSS feed', problems);
  }

  record('Banned words', banned, missing ? 'banned-words.md not found' : `${patterns.length} patterns`);
  record('Forbidden topics', forbidden);
  record('Retired and unnamed', retired);
  record('No third parties', thirdParty);
  record('Links', links);
  record('Accessibility', a11y, `${PAGES.length} page(s)`);
  return placeholders;
}

// ---------- run ----------

checkEmDashes();
checkColours();
checkSpacing();
checkTokenContrast();
await checkProse();
const placeholders = await checkPages();

const order = ['Em dash lint', 'RSS feed', 'Banned words', 'Forbidden topics', 'Retired and unnamed', 'Colour lint', 'Spacing lint', 'No third parties', 'Links', 'Accessibility', 'Contrast AA (token pairs)', 'Notes renderer', 'Weight'];
results.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));

let failed = 0;
for (const { name, problems, note } of results) {
  const ok = problems.length === 0;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${note ? `  (${note})` : ''}`);
  for (const pr of problems) console.log(`        ${pr}`);
}

// Client work flagged needsPermission: listed every run, a failure in production until each is confirmed.
const { loadContent } = await import('../server/content.js');
const needs = loadContent().work.filter((w) => w.public && w.needsPermission);
const phList = [...placeholders.entries()].filter(([k]) => !/^\[KALID: confirm .* is happy for /.test(k));
if (PRODUCTION) {
  if (needs.length) failed++;
  console.log(`${needs.length ? 'FAIL' : 'PASS'}  Client permission${needs.length ? `  (${needs.length} to confirm before launch; set needsPermission: false once each client says yes)` : ''}`);
} else console.log(`TODO  Client permission: ${needs.length} to confirm before launch`);
for (const w of needs) console.log(`        ${w.client.padEnd(20)} ${w.title}  (content/work/${w.slug}.md)`);
if (PRODUCTION) {
  const ok = phList.length === 0;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  Placeholders${ok ? '' : `  (${phList.length} still open)`}`);
  for (const [k, pages] of phList) console.log(`        ${k}  on ${pages.join(', ')}`);
} else {
  console.log(`TODO  Placeholders for Kalid: ${phList.length} open`);
  for (const [k, pages] of phList) console.log(`        ${k}  on ${pages.join(', ')}`);
}

console.log(failed ? `\n${failed} check(s) failed.` : '\nAll checks passed.');
process.exit(failed ? 1 : 0);
