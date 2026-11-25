// npm run lighthouse: mobile Lighthouse on the key pages. Fails if any category is under 95.
// Runs the server in production mode (NODE_ENV=production), the way it will run live.

import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { ROOT } from './site.mjs';

const PORT = 3027;
const base = `http://localhost:${PORT}`;
const PAGES = ['/', '/work-with-me', '/work', '/video', '/branding', '/work/charity-ops', '/work/kalid-nur-brand', '/about', '/notes', '/masterclass', '/work/sakina-films'];

const server = spawn(process.execPath, ['server/index.js'], {
  cwd: ROOT,
  env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' },
  stdio: ['ignore', 'ignore', 'inherit'],
});
for (let i = 0; i < 50; i++) {
  try {
    if ((await fetch(base + '/')).ok) break;
  } catch {}
  await new Promise((r) => setTimeout(r, 100));
}

const chrome = await chromeLauncher.launch({ chromePath: chromium.executablePath(), chromeFlags: ['--headless=new', '--no-sandbox'] });
let failed = 0;
try {
  for (const p of PAGES) {
    const { lhr } = await lighthouse(base + p, { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] });
    const scores = Object.values(lhr.categories).map((c) => [c.title, Math.round(c.score * 100)]);
    const low = scores.filter(([, s]) => s < 95);
    if (low.length) failed++;
    console.log(`${low.length ? 'FAIL' : 'PASS'}  ${p.padEnd(12)} ${scores.map(([t, s]) => `${t} ${s}`).join(' · ')}`);
    for (const [title] of low) {
      const cat = Object.values(lhr.categories).find((c) => c.title === title);
      for (const ref of cat.auditRefs) {
        const a = lhr.audits[ref.id];
        if (ref.weight > 0 && a.score !== null && a.score < 0.9) console.log(`        ${title}: ${a.title}${a.displayValue ? ` (${a.displayValue})` : ''}`);
      }
    }
  }
} finally {
  await chrome.kill();
  server.kill();
}
process.exit(failed ? 1 : 0);
