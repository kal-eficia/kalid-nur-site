// npm run shots: full-page screenshots of every state at 1440, 768 and 390,
// into shots/<phase>/<state>-<width>.png. Fails on any console or page error.

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { ROOT, PHASE, STATES, VIEWPORTS, ensureServer } from './site.mjs';

const outDir = path.join(ROOT, 'shots', process.argv[2] ?? PHASE);
fs.mkdirSync(outDir, { recursive: true });

const { base: BASE, stop } = await ensureServer();
// Real Google Chrome when it's installed: Playwright's own Chromium has no H.264 decoder, so it can't play
// the Work videos that every real browser can. Falls back to the bundled Chromium.
const browser = await chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch());
const errors = [];

try {
  for (const state of STATES) {
    for (const vp of VIEWPORTS) {
      if (state.only && !state.only.includes(vp.width)) continue;
      const context = await browser.newContext({
        viewport: vp,
        deviceScaleFactor: 2,
        javaScriptEnabled: state.javaScriptEnabled ?? true,
        reducedMotion: 'reduce',
        colorScheme: state.colorScheme ?? 'light',
        // Phone shots behave like a phone: touch, no hover.
        ...(vp.width < 768 ? { isMobile: true, hasTouch: true } : {}),
      });
      const page = await context.newPage();
      const tag = `${state.name}-${vp.width}`;
      page.on('console', (m) => {
        if (m.type() !== 'error') return;
        if (state.name === '404' && /status of 404/.test(m.text())) return; // the 404 page is meant to be a 404
        errors.push(`${tag}: console: ${m.text()}`);
      });
      page.on('pageerror', (e) => errors.push(`${tag}: page error: ${e.message}`));
      page.on('requestfailed', (r) => {
        // A video still streaming when the shot ends is aborted on purpose; that isn't an error.
        if (/\.mp4$/.test(r.url()) && /ERR_ABORTED/.test(r.failure()?.errorText ?? '')) return;
        errors.push(`${tag}: request failed: ${r.url()} (${r.failure()?.errorText})`);
      });

      const response = await page.goto(BASE + state.path, { waitUntil: 'networkidle' });
      if (!response || (response.status() >= 400 && state.name !== '404')) errors.push(`${tag}: ${state.path} returned ${response?.status()}`);
      await page.evaluate(() => document.fonts.ready);
      // Scroll through once so lazy images load, as they would for a visitor, then back to the top.
      if ((state.fullPage ?? true) && state.javaScriptEnabled !== false) {
        await page.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += innerHeight / 2) {
            scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 40));
          }
          scrollTo(0, 0);
          const loads = Promise.all([...document.images].filter((i) => !i.complete).map((i) => new Promise((r) => { i.onload = i.onerror = r; })));
          await Promise.race([loads, new Promise((r) => setTimeout(r, 3000))]);
        });
      }
      if (state.prepare) await state.prepare(page);
      if (!state.keepPointer) await page.mouse.move(0, 0); // no hover leaking into a shot

      const file = path.join(outDir, `${tag}.png`);
      await page.screenshot({ path: file, fullPage: state.fullPage ?? true });
      console.log(`  ${path.relative(ROOT, file)}`);
      await context.close();
    }
  }
} finally {
  await browser.close();
  stop();
}

if (errors.length) {
  console.error(`\n${errors.length} error(s):\n` + errors.map((e) => `  ${e}`).join('\n'));
  process.exit(1);
}
console.log('\nShots done, no console or page errors.');
