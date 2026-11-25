// Shared by shots.mjs and checks.mjs: which phase we're on, which pages exist,
// and how to make sure the dev server is up.

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const PHASE = 'rebrand';
const DEFAULT_BASE = process.env.SITE_URL ?? 'http://localhost:3000';
const FALLBACK_PORT = 3017; // used when something else (e.g. Excelia Live) already has 3000

// Every page that exists, plus every note (drafts included, so a draft is checked before Kalid publishes it).
const notePages = () =>
  fs.readdirSync(path.join(ROOT, 'content', 'essays'))
    .filter((f) => f.endsWith('.md'))
    .map((f) => `/notes/${f.slice(0, -3)}`);

// Case studies: every work item with caseStudy: true.
const casePages = () =>
  fs.readdirSync(path.join(ROOT, 'content', 'work'))
    .filter((f) => f.endsWith('.md') && /^caseStudy:\s*true/m.test(fs.readFileSync(path.join(ROOT, 'content', 'work', f), 'utf8')))
    .map((f) => `/work/${f.slice(0, -3)}`);

import { config } from '../server/config.js';
// /book is a page only while there's no booking link; once there is, it redirects to the booking site.
const BOOK = config.bookingUrl ? [] : ['/book'];
export const PAGES_STATIC = ['/', '/work-with-me', '/work', '/work?type=systems', '/work?type=video', '/work?type=brand', '/video', '/branding', '/about', '/notes', '/masterclass', ...BOOK];
export const PAGES = [...new Set([...PAGES_STATIC, ...casePages(), ...notePages()])];

// Screenshot states (docs/UX-REVIEW.md section 1). `prepare` runs before the shot.
export const STATES = [
  { name: 'home', path: '/' },
  {
    name: 'focus',
    path: '/',
    fullPage: false,
    async prepare(page) {
      for (let i = 0; i < 40; i++) {
        await page.keyboard.press('Tab');
        const hit = await page.evaluate(() => document.activeElement?.hasAttribute('data-primary-cta'));
        if (hit) return;
      }
      throw new Error('Tabbing never reached the primary call to action');
    },
  },
  {
    name: 'hover',
    path: '/',
    fullPage: false,
    keepPointer: true,
    async prepare(page) {
      await page.hover('[data-primary-cta]');
    },
  },
  {
    name: 'menu',
    path: '/',
    fullPage: false,
    only: [390, 768],
    async prepare(page) {
      await page.click('.menu-btn');
      await page.waitForSelector('.menu.is-open');
    },
  },
  {
    name: 'menu-nojs',
    path: '/#menu',
    fullPage: false,
    only: [390],
    javaScriptEnabled: false,
  },
  { name: 'nojs', path: '/', javaScriptEnabled: false, only: [390, 1440] },
  { name: 'work-with-me', path: '/work-with-me' },
  { name: 'work', path: '/work' },
  { name: 'work-video', path: '/work?type=video', only: [390] },
  {
    name: 'work-filtered-js',
    path: '/work',
    only: [1440],
    async prepare(page) {
      await page.click('[data-filter="brand"]');
      await page.waitForFunction(() => location.search === '?type=brand');
    },
  },
  { name: 'case-charity-ops', path: '/work/charity-ops' },
  { name: 'case-weblab', path: '/work/weblab', only: [1440, 390] },
  { name: 'case-kalid-nur-brand', path: '/work/kalid-nur-brand', only: [1440, 390] },
  { name: 'case-sakina-films', path: '/work/sakina-films' },
  { name: 'case-roob', path: '/work/roob', only: [1440, 390] },
  { name: 'case-hifz-app-logo', path: '/work/hifz-app-logo', only: [1440, 390] },
  { name: 'video', path: '/video' },
  {
    name: 'video-player',
    path: '/video',
    fullPage: false,
    async prepare(page) {
      await page.click('.vtile__open >> nth=5');
      await page.waitForSelector('dialog.player[open] video');
    },
  },
  { name: 'branding', path: '/branding' },
  {
    name: 'branding-viewer',
    path: '/branding',
    fullPage: false,
    only: [1440, 390],
    async prepare(page) {
      await page.click('.btile >> nth=1');
      await page.waitForSelector('dialog.player[open] img');
    },
  },
  { name: 'about', path: '/about' },
  { name: 'notes', path: '/notes' },
  { name: 'note', path: '/notes/first-column' },
  { name: 'masterclass', path: '/masterclass' },
  ...(config.bookingUrl ? [] : [{ name: 'book', path: '/book' }]),
  { name: '404', path: '/this-page-never-ran' },
];

export const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
];

// True only if the server at `base` is this site (it sends X-Site: kalid-nur).
async function isOurs(base) {
  try {
    const res = await fetch(base + '/', { signal: AbortSignal.timeout(1500) });
    return res.ok && res.headers.get('x-site') === 'kalid-nur';
  } catch {
    return false;
  }
}

async function portTaken(base) {
  try {
    await fetch(base + '/', { signal: AbortSignal.timeout(1500) });
    return true;
  } catch {
    return false;
  }
}

// Returns { base, stop }. Uses a running dev server if it's ours; otherwise starts one.
// stop() only stops a server this function started.
export async function ensureServer() {
  if (await isOurs(DEFAULT_BASE)) return { base: DEFAULT_BASE, stop: () => {} };
  let base = DEFAULT_BASE;
  if (await portTaken(DEFAULT_BASE)) {
    base = `http://localhost:${FALLBACK_PORT}`;
    console.log(`Port ${new URL(DEFAULT_BASE).port} is in use by another app. Starting this site on ${base}.`);
    if (await isOurs(base)) return { base, stop: () => {} };
  }
  const child = spawn(process.execPath, ['server/index.js'], {
    cwd: ROOT,
    // Ask answers come from canned test replies, so screenshots never call the real API.
    env: { ...process.env, PORT: new URL(base).port, ASK_MOCK: process.env.ASK_MOCK ?? '1' },
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  for (let i = 0; i < 50; i++) {
    if (await isOurs(base)) return { base, stop: () => child.kill() };
    await new Promise((r) => setTimeout(r, 100));
  }
  child.kill();
  throw new Error(`Server did not start on ${base}`);
}
