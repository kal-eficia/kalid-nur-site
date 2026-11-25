// Reads content/ and validates it with zod. Since the rebrand the only content files are the
// Notes in content/essays/ (the folder name is kept so nothing breaks). Page copy lives in the
// views, word for word from docs/rebrand/CONTENT.md. Retired newspaper files are in content/_archive/.
// A bad file stops the server with a message naming the file and the field.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { z } from 'zod';

export const CONTENT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'content');

const isoDate = z
  .union([z.date(), z.string()])
  .transform((v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v))
  .pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be a date like 2026-11-16'));
const text = z.string().trim().min(1, 'must not be empty');

// `standfirst` is the one-line summary shown in the Notes list.
const noteSchema = z.object({ title: text, date: isoDate, published: z.boolean().default(false), standfirst: text }).strict();

// Work items (docs/rebrand/WORK-SPEC.md). `public: false` hides an item on the live site; `needsPermission`
// marks client work that `npm run checks:prod` lists until Kalid confirms the client is happy.
export const WORK_TYPES = { systems: 'Systems & AI', video: 'Video', brand: 'Brand & logo' };
const workSchema = z
  .object({
    title: text,
    type: z.enum(['systems', 'video', 'brand']),
    summary: text,
    client: text,
    year: z.union([z.string(), z.number()]).transform(String).optional(),
    tags: z.array(text).default([]),
    link: z.string().url().optional(),
    media: z.array(text).optional(),
    poster: text.optional(),
    sources: z.array(text).optional(),
    labels: z.array(text).optional(),
    excerpt: z.number().int().positive().optional(),
    posterAt: z.number().nonnegative().optional(),
    badge: text.optional(),
    screenshot: z.boolean().default(true),
    cardSource: z.number().int().nonnegative().optional(),
    cardFit: z.enum(['crop', 'contain']).optional(),
    cardFile: text.optional(),
    cardBg: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    sourceBg: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    // A short looping animation shown inside a brand case study ({{motion}} in the body).
    motion: z.array(text).optional(),
    motionPosterAt: z.number().nonnegative().optional(),
    motionAlt: text.optional(),
    // A card that belongs to another item's case study (the ROOB reel links to /work/roob).
    caseStudyLink: z.string().regex(/^[a-z0-9-]+$/).optional(),
    cardCrop: z.array(z.number().int().nonnegative()).length(4).optional(),
    alts: z.array(text).optional(),
    workOrder: z.number().int().optional(),
    notes: z.array(text).default([]),
    caseStudy: z.boolean().default(false),
    public: z.boolean().default(true),
    needsPermission: z.boolean().default(false),
    order: z.number().int(),
    stats: z.array(z.object({ n: text, label: text }).strict()).optional(),
    quote: z.object({ text, by: text, confirmed: z.boolean().default(false) }).strict().optional(),
  })
  .strict();

class ContentError extends Error {}

function readFile(rel) {
  try {
    return matter(fs.readFileSync(path.join(CONTENT_DIR, rel), 'utf8'));
  } catch (err) {
    throw new ContentError(`content/${rel}: could not read or parse front matter (${err.reason ?? err.message})`);
  }
}

function validate(schema, data, rel) {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  const lines = result.error.issues.map((i) => `  - ${i.path.join('.') || '(top level)'}: ${i.message}`);
  throw new ContentError(`content/${rel} has ${lines.length} problem(s):\n${lines.join('\n')}`);
}

const listMd = (dir) =>
  fs.existsSync(path.join(CONTENT_DIR, dir)) ? fs.readdirSync(path.join(CONTENT_DIR, dir)).filter((f) => f.endsWith('.md')).sort() : [];

// About 220 words a minute, never less than one.
export const readingMinutes = (body) => Math.max(1, Math.ceil(body.split(/\s+/).filter(Boolean).length / 220));

export function loadContent() {
  const notes = listMd('essays')
    .map((file) => {
      const rel = `essays/${file}`;
      const f = readFile(rel);
      const body = f.content.trim();
      if (!body) throw new ContentError(`content/${rel}: the note body is empty`);
      return { slug: file.replace(/\.md$/, ''), ...validate(noteSchema, f.data, rel), body, minutes: readingMinutes(body) };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
  // Media built by `npm run work-media` (posters, re-encoded videos, screenshots).
  const mediaFile = path.join(CONTENT_DIR, '..', 'public', 'work', 'media.json');
  const media = fs.existsSync(mediaFile) ? JSON.parse(fs.readFileSync(mediaFile, 'utf8')) : {};
  const typeOrder = Object.keys(WORK_TYPES);
  const work = listMd('work')
    .map((file) => {
      const rel = `work/${file}`;
      const f = readFile(rel);
      const slug = file.replace(/\.md$/, '');
      const item = validate(workSchema, f.data, rel);
      if (item.caseStudy && !f.content.trim()) throw new ContentError(`content/${rel}: a case study needs a body ("## The problem", "## What I built")`);
      return { slug, ...item, body: f.content.trim(), media: media[slug] ?? null };
    })
    .sort((a, b) => typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type) || a.order - b.order);
  for (const w of work)
    if (w.caseStudyLink && !work.some((x) => x.slug === w.caseStudyLink && x.caseStudy))
      throw new ContentError(`content/work/${w.slug}.md: caseStudyLink "${w.caseStudyLink}" isn't a case study`);
  return { notes, work };
}

export function loadOrExit() {
  try {
    return loadContent();
  } catch (err) {
    if (err instanceof ContentError) {
      console.error(`\nThe site can't start because of a content problem.\n\n${err.message}\n`);
      process.exit(1);
    }
    throw err;
  }
}
