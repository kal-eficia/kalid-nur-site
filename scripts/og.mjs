// npm run og: renders every social card (1200 x 630) into public/og/<key>.png.
// Run it after changing a headline, a page title or a build. The PNGs are committed.

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { ROOT, ensureServer } from './site.mjs';

const outDir = path.join(ROOT, 'public', 'og');
fs.mkdirSync(outDir, { recursive: true });
const { base, stop } = await ensureServer();
const browser = await chromium.launch();
try {
  const keys = await (await fetch(`${base}/_og`)).json();
  const context = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, colorScheme: 'light' });
  const page = await context.newPage();
  for (const key of keys) {
    await page.goto(`${base}/_og/${key}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.locator('.og').screenshot({ path: path.join(outDir, `${key}.png`) });
    console.log(`  public/og/${key}.png`);
  }
} finally {
  await browser.close();
  stop();
}
