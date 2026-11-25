// npm run work-media: builds every file the Work pages show, from the `sources` in content/work/*.md.
//   video:  H.264 720p (720 wide for 9:16), CRF 28, veryfast, AAC 96k, +faststart -> public/work/video/<slug>[-n].mp4
//           plus a poster JPEG from `posterAt` seconds. Long films (`excerpt: 60`) become a 60-second excerpt,
//           since a full talk can't be under 6 MB at CRF 28.
//   brand:  images resized to 1600 wide (JPEG) plus a square card -> public/work/brand/
//   systems: a 1440 x 900 screenshot of the live link (Playwright) -> public/work/systems/
// Writes public/work/media.json, which the server reads. Originals stay where they are: never copy them into the repo.
// Usage: npm run work-media [-- slug ...]   (no slugs = everything; existing outputs are skipped unless --force)

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import matter from 'gray-matter';
import { ROOT } from './site.mjs';

const args = process.argv.slice(2);
const force = args.includes('--force');
const only = args.filter((a) => !a.startsWith('--'));
const OUT = path.join(ROOT, 'public', 'work');
const MANIFEST = path.join(OUT, 'media.json');
const LIMIT = 6 * 1024 * 1024;
const home = (p) => p.replace(/^~(?=\/)/, os.homedir());
const run = (cmd, a) => execFileSync(cmd, a, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
const probe = (file) => {
  const [w, h] = run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file]).trim().split(',').map(Number);
  const duration = Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).trim());
  return { w, h, duration };
};
// Pillow does the image work (installed with the system Python); keeps package.json unchanged.
const py = (code, ...a) => run('python3', ['-c', code, ...a]).trim();

const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {};
const items = fs
  .readdirSync(path.join(ROOT, 'content', 'work'))
  .filter((f) => f.endsWith('.md'))
  .map((f) => ({ slug: f.slice(0, -3), ...matter.read(path.join(ROOT, 'content', 'work', f)).data }))
  .filter((i) => !only.length || only.includes(i.slug));

for (const dir of ['video', 'brand', 'systems']) fs.mkdirSync(path.join(OUT, dir), { recursive: true });

function encode(item) {
  const videos = [];
  item.sources.forEach((s, n) => {
    const src = home(s);
    if (!fs.existsSync(src)) throw new Error(`${item.slug}: missing source ${src}`);
    const { w, h } = probe(src);
    const portrait = h > w;
    const name = `${item.slug}${n ? `-${n + 1}` : ''}.mp4`;
    const out = path.join(OUT, 'video', name);
    if (force || !fs.existsSync(out)) {
      const base = ['-y', '-v', 'error', ...(item.excerpt ? ['-t', String(item.excerpt)] : []), '-i', src];
      const enc = (crf) =>
        run('ffmpeg', [...base, '-vf', portrait ? 'scale=720:-2' : 'scale=-2:720', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', String(crf), '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', out]);
      enc(28);
      // Over the 6 MB target at CRF 28: step the quality down a little at a time, and say so.
      for (let crf = 30; fs.statSync(out).size > LIMIT && crf <= 34; crf += 2) {
        console.log(`  ${name}: over 6 MB at CRF ${crf - 2}, trying CRF ${crf}`);
        enc(crf);
      }
    }
    const meta = probe(out);
    videos.push({ src: `/work/video/${name}`, w: meta.w, h: meta.h, seconds: Math.round(meta.duration), bytes: fs.statSync(out).size, label: item.labels?.[n] ?? null });
    console.log(`  ${name}  ${meta.w}x${meta.h}  ${(fs.statSync(out).size / 1048576).toFixed(1)} MB`);
  });
  const poster = path.join(OUT, 'video', `${item.slug}.jpg`);
  if (force || !fs.existsSync(poster)) {
    run('ffmpeg', ['-y', '-v', 'error', '-ss', String(item.posterAt ?? 1), '-i', path.join(OUT, 'video', path.basename(videos[0].src)), '-frames:v', '1', '-q:v', '4', poster]);
  }
  return { videos, poster: `/work/video/${item.slug}.jpg`, w: videos[0].w, h: videos[0].h };
}

const IMG = `
import sys
from PIL import Image
src, out, width, square, fit = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4] == '1', sys.argv[5]
crop = [int(v) for v in sys.argv[6].split(',')] if len(sys.argv) > 6 and sys.argv[6] else None
bg = tuple(int(sys.argv[7][i:i + 2], 16) for i in (1, 3, 5)) if len(sys.argv) > 7 and sys.argv[7] else (244, 239, 228)
im = Image.open(src)
if im.mode in ('RGBA', 'LA', 'P'):
    im = im.convert('RGBA')
    flat = Image.new('RGB', im.size, bg)  # paper (or the item's cardBg) under any transparency
    flat.paste(im, mask=im.split()[-1])
    im = flat
im = im.convert('RGB')
if crop:
    im = im.crop(tuple(crop))
if square and fit == 'contain':
    # Centre the whole image on a square of its own background colour (the top-left pixel), with a margin.
    side = round(max(im.width, im.height) * 1.25)
    sq = Image.new('RGB', (side, side), bg if len(sys.argv) > 7 and sys.argv[7] else im.getpixel((0, 0)))
    sq.paste(im, ((side - im.width) // 2, (side - im.height) // 2))
    im = sq
elif square:
    side = min(im.width, im.height)
    im = im.crop(((im.width - side) // 2, 0, (im.width - side) // 2 + side, side))
if im.width > width:
    im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
im.save(out, 'JPEG', quality=82, optimize=True, progressive=True)
print(im.width, im.height)
`;

function images(item) {
  const files = [];
  item.sources.forEach((s, n) => {
    const src = home(s);
    if (!fs.existsSync(src)) throw new Error(`${item.slug}: missing source ${src}`);
    if (src.endsWith('.svg')) {
      // Vector logos are copied as they are, after a check that they hold no script or external reference.
      const svg = fs.readFileSync(src, 'utf8');
      if (/<script|href="http|xlink:href="http|onload=/i.test(svg)) throw new Error(`${item.slug}: ${src} has script or external refs`);
      const name = `${item.slug}-${n + 1}.svg`;
      fs.writeFileSync(path.join(OUT, 'brand', name), svg);
      const vb = svg.match(/viewBox="[\d.\s-]*?([\d.]+)\s+([\d.]+)"/);
      files.push({ src: `/work/brand/${name}`, w: vb ? Math.round(+vb[1]) : 1600, h: vb ? Math.round(+vb[2]) : 1000 });
      return;
    }
    const name = `${item.slug}-${n + 1}.jpg`;
    const bg = item.sourceBg ?? '';
    const [w, h] = py(IMG, src, path.join(OUT, 'brand', name), '1600', '0', '', '', bg).split(' ').map(Number);
    // An 800-wide copy for phones (srcset), so a tall board doesn't cost a phone the full 1600 px file.
    const small = name.replace(/\.jpg$/, '-800.jpg');
    py(IMG, src, path.join(OUT, 'brand', small), '800', '0', '', '', bg);
    files.push({ src: `/work/brand/${name}`, small: `/work/brand/${small}`, w, h });
  });
  const card = path.join(OUT, 'brand', `${item.slug}-card.jpg`);
  // The square card: a chosen file and crop where the board itself doesn't crop well to a square.
  py(IMG, home(item.cardFile ?? item.sources[item.cardSource ?? 0]), card, '800', '1', item.cardFit ?? 'crop', (item.cardCrop ?? []).join(','), item.cardBg ?? '');
  return { images: files, poster: `/work/brand/${item.slug}-card.jpg`, w: 800, h: 800, ...(item.motion ? { motion: motion(item) } : {}) };
}

// A short logo animation for a brand case study: silent, kept at its own size (it's tiny), plus a poster frame.
function motion(item) {
  const src = home(item.motion[0]);
  if (!fs.existsSync(src)) throw new Error(`${item.slug}: missing motion source ${src}`);
  const out = path.join(OUT, 'video', `${item.slug}-motion.mp4`);
  const poster = out.replace(/\.mp4$/, '.jpg');
  if (force || !fs.existsSync(out)) {
    run('ffmpeg', ['-y', '-v', 'error', '-i', src, '-vf', 'scale=-2:min(1080\\,ih)', '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '24', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out]);
    run('ffmpeg', ['-y', '-v', 'error', '-ss', String(item.motionPosterAt ?? 0), '-i', out, '-frames:v', '1', '-q:v', '3', poster]);
  }
  const meta = probe(out);
  console.log(`  ${path.basename(out)}  ${meta.w}x${meta.h}  ${(fs.statSync(out).size / 1024).toFixed(0)} KB`);
  return { src: `/work/video/${item.slug}-motion.mp4`, poster: `/work/video/${item.slug}-motion.jpg`, w: meta.w, h: meta.h };
}

async function screenshots(list) {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  try {
    for (const item of list) {
      const full = path.join(OUT, 'systems', `${item.slug}.jpg`);
      if (!force && fs.existsSync(full)) {
        manifest[item.slug] = { ...(manifest[item.slug] ?? {}), poster: `/work/systems/${item.slug}-card.jpg`, hero: `/work/systems/${item.slug}.jpg`, w: 960, h: 600 };
        continue;
      }
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
      try {
        await page.goto(item.link, { waitUntil: 'networkidle', timeout: 45000 });
        await page.waitForTimeout(2500); // let a sleeping app finish waking and fonts settle
        const png = full.replace(/\.jpg$/, '.png');
        await page.screenshot({ path: png });
        py(IMG, png, full, '1440', '0', '');
        py(IMG, png, full.replace(/\.jpg$/, '-card.jpg'), '960', '0', '');
        fs.unlinkSync(png);
        manifest[item.slug] = { poster: `/work/systems/${item.slug}-card.jpg`, hero: `/work/systems/${item.slug}.jpg`, w: 960, h: 600 };
        console.log(`  ${item.slug}: screenshot of ${item.link}`);
      } catch (e) {
        console.log(`  ${item.slug}: could not screenshot ${item.link} (${e.message.split('\n')[0]}); the card falls back to the ink title card`);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
}

for (const item of items) {
  if (item.type === 'video') {
    console.log(item.slug);
    manifest[item.slug] = encode(item);
  } else if (item.type === 'brand') {
    console.log(item.slug);
    manifest[item.slug] = images(item);
  }
}
// `screenshot: false`: the live link doesn't show this product, so the card uses the ink title card instead.
for (const i of items.filter((x) => x.type === 'systems' && x.screenshot === false)) delete manifest[i.slug];
await screenshots(items.filter((i) => i.type === 'systems' && i.link && i.screenshot !== false));

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
const over = Object.entries(manifest).flatMap(([slug, m]) => (m.videos ?? []).filter((v) => v.bytes > LIMIT).map((v) => `${v.src} (${(v.bytes / 1048576).toFixed(1)} MB)`));
console.log(over.length ? `\nStill over 6 MB:\n  ${over.join('\n  ')}` : '\nAll videos under 6 MB.');
