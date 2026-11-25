// Work, Video, Branding and case studies (docs/rebrand/WORK-SPEC.md). Copy from that spec, word for word.

import { layout } from './layout.js';
import { kicker, more, ph, esc, ext, inline, prose, plain, PRODUCTION } from './html.js';
import { pageHead } from './pages.js';
import { closingBand } from './home.js';
import { WORK_TYPES } from '../content.js';

// ---------- visibility ----------

// `public: false` items exist only on Kalid's machine. Client items carry a reminder that
// `npm run checks:prod` picks up (an HTML comment, so it never shows), plus a small visible tag in development.
export const visibleWork = (content) => content.work.filter((w) => w.public || !PRODUCTION);
export const findCaseStudy = (content, slug) => visibleWork(content).find((w) => w.slug === slug && w.caseStudy) ?? null;
const permission = (w) =>
  w.needsPermission ? `<!-- [KALID: confirm ${esc(plain(w.client) || 'the client')} is happy for "${esc(w.title)}" to be shown] -->` : '';
// Notes in a work file ("notes:") are reminders for Kalid: hidden in the page, listed by the checks.
const notes = (w) => w.notes.map((n) => `<!-- [KALID: ${esc(n)}] -->`).join('');
const devFlags = (w) =>
  PRODUCTION
    ? ''
    : [w.public ? '' : '<span class="flag">Hidden on the live site</span>', w.needsPermission ? '<span class="flag">Confirm with client before launch</span>' : '']
        .filter(Boolean)
        .join('');

const host = (url) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');
const live = (w) =>
  w.link ? `<a class="live" href="${esc(w.link)}"${ext(w.link)}><span class="live__sq" aria-hidden="true"></span>Live<span class="visually-hidden">: ${esc(w.title)} at ${esc(host(w.link))}</span></a>` : '';
const versions = (w) => (w.media?.videos?.length > 1 ? `${w.media.videos.length} versions` : '');
const meta = (w) => [inline(w.client), w.year ? inline(w.year) : '', versions(w)].filter(Boolean).join('<span aria-hidden="true"> · </span>');

// ---------- media ----------

const ratioClass = (w, h) => {
  if (!w || !h) return 'r-16x10';
  const r = w / h;
  if (r < 0.7) return 'r-9x16';
  if (r > 0.95 && r < 1.05) return 'r-1x1';
  if (r > 1.7) return 'r-16x9';
  return r > 1 ? 'r-16x10' : 'r-4x5';
};

// The clean ink card for systems work with no live link to screenshot. Never a fake screenshot.
const inkCard = (w, tag = 'p') => `<div class="ink-card r-16x10" aria-hidden="true"><span class="ink-card__sq"></span><${tag} class="ink-card__title">${esc(w.title)}</${tag}></div>`;

// Player data: what the full-screen player shows when a tile is opened.
const playerData = (w) =>
  esc(
    JSON.stringify(
      w.type === 'video'
        ? { kind: 'video', title: w.title, items: w.media.videos.map((v, n) => ({ src: v.src, label: v.label, w: v.w, h: v.h, poster: n ? null : w.media.poster })) }
        : { kind: 'image', title: w.title, items: w.media.images.map((i, n) => ({ src: i.src, w: i.w, h: i.h, alt: w.alts?.[n] ?? null })) },
    ),
  );

function videoTile(w, { eager = false } = {}) {
  const m = w.media;
  if (!m?.videos?.length) return `<div class="tile-missing r-9x16">${ph(`run npm run work-media for ${w.slug}`)}</div>`;
  const v = m.videos[0];
  const len = '';
  return `
  <div class="vtile ${ratioClass(m.w, m.h)}">
    <a class="vtile__open" href="${esc(v.src)}" data-player="${playerData(w)}" aria-label="Play ${esc(w.title)}">
      <img src="${esc(m.poster)}" alt="" width="${m.w}" height="${m.h}"${eager ? '' : ' loading="lazy"'} decoding="async">
      <video muted loop playsinline preload="none" data-src="${esc(v.src)}" aria-hidden="true" tabindex="-1"></video>
      <span class="vtile__play" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M8 5v14l11-7z"/></svg></span>
    </a>
    ${len}
    <button class="vtile__sound" type="button" aria-pressed="false" hidden><span class="visually-hidden">Sound for the preview of ${esc(w.title)}</span><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M4 9h4l5-4v14l-5-4H4z"/><path class="vtile__wave" d="M16 9a4 4 0 010 6"/><path class="vtile__mute" d="M16 9l5 6M21 9l-5 6"/></svg></button>
  </div>`;
}

function brandTile(w) {
  const m = w.media;
  if (!m?.images?.length) return `<div class="tile-missing r-1x1">${ph(`run npm run work-media for ${w.slug}`)}</div>`;
  return `
  <a class="btile r-1x1" href="${esc(m.images[0].src)}" data-player="${playerData(w)}" aria-label="View ${esc(w.title)}, ${m.images.length} image${m.images.length > 1 ? 's' : ''}">
    <img src="${esc(m.poster)}" alt="" width="800" height="800" loading="lazy" decoding="async">
  </a>`;
}

function systemsMedia(w) {
  const m = w.media;
  const img = m?.poster
    ? `<img class="r-16x10" src="${esc(m.poster)}" alt="" width="960" height="600" loading="lazy" decoding="async">`
    : inkCard(w);
  // A plain picture: the title (case study) and "Live" are the links, so each destination is one Tab stop.
  return `<div class="stile">${img}</div>`;
}

// ---------- cards ----------

export function card(w, { headingTag = 'h3', eager = false } = {}) {
  const media = w.type === 'video' ? videoTile(w, { eager }) : w.type === 'brand' ? brandTile(w) : systemsMedia(w);
  // Its own case study, or (caseStudyLink) the case study it belongs to.
  const caseSlug = w.caseStudy ? w.slug : w.caseStudyLink;
  const title = caseSlug ? `<a href="/work/${caseSlug}">${esc(w.title)}</a>` : esc(w.title);
  const actions = [live(w), caseSlug ? more(`/work/${caseSlug}`, 'Case study', ` aria-label="${w.caseStudy ? 'Case study: ' : 'Case study for '}${esc(w.title)}"`) : ''].filter(Boolean).join('');
  return `
<li class="card card--${w.type}" data-type="${w.type}">${permission(w)}${notes(w)}
  ${media}
  <div class="card__body">
    <p class="card__type">${[WORK_TYPES[w.type], w.tags.includes('In production') ? 'In production' : '', w.badge ? esc(w.badge) : ''].filter(Boolean).join('<span aria-hidden="true"> · </span>')}</p>
    <${headingTag} class="card__title">${title}</${headingTag}>
    <p class="card__summary">${inline(w.summary)}</p>
    <p class="card__meta">${meta(w)}</p>
    ${actions ? `<p class="card__actions">${actions}</p>` : ''}
    ${devFlags(w)}
  </div>
</li>`;
}

export const grid = (items, cls = '', opts) => `<ul class="work-grid ${cls}">${items.map((w, i) => card(w, { ...opts, eager: i < 2 && opts?.eagerFirst })).join('')}</ul>`;

// The full-screen player, on ink. One per page; filled by site.js.
export const playerDialog = () => `
<dialog class="player" id="player" aria-labelledby="player-title">
  <div class="player__bar">
    <p class="player__title" id="player-title"></p>
    <div class="player__versions" role="group" aria-label="Versions"></div>
    <button class="player__close" type="button" aria-label="Close"><svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path d="M5 5l14 14M19 5L5 19"/></svg></button>
  </div>
  <div class="player__stage"></div>
</dialog>`;

// ---------- /work ----------

const FILTERS = [['', 'All'], ['systems', WORK_TYPES.systems], ['video', WORK_TYPES.video], ['brand', WORK_TYPES.brand]];

// "All" mixes the three kinds (one systems, one video, one brand, and round again) so the masonry
// doesn't read as three separate lists. Within each kind, the `order` field still decides.
function interleave(items) {
  // `workOrder` lets an item lead its kind on /work without changing its place on /video or /branding.
  const rank = (w) => w.workOrder ?? w.order;
  // A negative `workOrder` marks the newest work: it leads /work, in that order, before the mix.
  const lead = items.filter((w) => w.workOrder < 0).sort((a, b) => a.workOrder - b.workOrder);
  items = items.filter((w) => !(w.workOrder < 0));
  const byType = Object.keys(WORK_TYPES).map((t) => items.filter((w) => w.type === t).sort((a, b) => rank(a) - rank(b)));
  const out = [...lead];
  const total = lead.length + items.length;
  for (let i = 0; out.length < total; i++) for (const list of byType) if (list[i]) out.push(list[i]);
  return out;
}

export function renderWork(content, type) {
  const all = interleave(visibleWork(content));
  const items = type ? all.filter((w) => w.type === type) : all;
  const filters = FILTERS.map(
    ([key, label]) =>
      `<li><a href="/work${key ? `?type=${key}` : ''}" data-filter="${key}"${(type ?? '') === key ? ' aria-current="page"' : ''}>${label}</a></li>`,
  ).join('');
  const main = `
${pageHead({ k: 'Work', title: 'Things I’ve built', lead: 'Systems, videos and brands. Real work for real people, plus a few of my own.' })}
<section class="band band--flush" aria-label="All work">
  <div class="wrap">
    <nav class="filters" aria-label="Filter work by type"><ul>${filters}</ul></nav>
    <p class="visually-hidden" aria-live="polite" data-filter-status>${items.length} items</p>
    ${grid(all, 'work-grid--index', { eagerFirst: true, headingTag: 'h2' }).replace('<ul class="work-grid work-grid--index">', `<ul class="work-grid work-grid--index" data-showing="${type ?? 'all'}">`).replace(/<li class="card card--(\w+)" data-type="\w+">/g, (m, t) => (type && t !== type ? m.replace('<li ', '<li hidden ') : m))}
  </div>
</section>
${playerDialog()}`;
  return layout({
    title: type ? `${WORK_TYPES[type]} · Work · Kalid Nur` : 'Work · Kalid Nur',
    description: 'Things Kalid Nur has built: systems and AI tools, video edits, and brands and logos. Real work for real people, plus a few of his own.',
    main,
    path: '/work',
    noindex: Boolean(type),
  });
}

// ---------- /work/:slug ----------

// One case-study image: 1600 px with an 800 px copy for phones.
const caseImg = (w, n, { sizes = '(max-width: 1200px) 100vw, 1120px', cls = '', eager = false } = {}) => {
  const i = w.media?.images?.[n];
  if (!i) return ph(`image ${n} for ${w.slug}: run npm run work-media`);
  const alt = w.alts?.[n] ?? `${w.title}: ${n ? 'part of the brand kit' : 'the brand board'}`;
  return `<img${cls ? ` class="${cls}"` : ''} src="${esc(i.src)}"${i.small ? ` srcset="${esc(i.small)} 800w, ${esc(i.src)} ${i.w}w" sizes="${sizes}"` : ''} alt="${esc(alt)}" width="${i.w}" height="${i.h}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">`;
};

// The looping logo animation. No autoplay in the markup: site.js starts it unless the visitor
// prefers reduced motion, so they (and anyone without JavaScript) see the poster frame only.
const motionFigure = (w) => {
  const mo = w.media?.motion;
  if (!mo) return ph(`motion for ${w.slug}: run npm run work-media`);
  return `
<figure class="case__fig motion">
  <video class="motion__video" src="${esc(mo.src)}" poster="${esc(mo.poster)}" width="${mo.w}" height="${mo.h}" muted loop playsinline preload="none" role="img" aria-label="${esc(w.motionAlt ?? `${w.title}: logo animation`)}" data-motion></video>
  <button class="motion__toggle" type="button" hidden>Pause animation</button>
</figure>`;
};

// A case-study body can place media between its sections, one marker per line:
//   {{image N}}  {{gallery N N ...}}  {{motion}}  {{quote}}   (N = position in `sources`, from 0)
const MARKER = /^\{\{(image|gallery|motion|quote)((?:\s+\d+)*)\s*\}\}\s*$/m;
const hasMarkers = (body) => MARKER.test(body);

function caseBody(w, quote) {
  const parts = w.body.split(new RegExp(MARKER.source, 'gm'));
  let out = '';
  let quoted = false;
  for (let i = 0; i < parts.length; i += 3) {
    if (parts[i].trim()) out += `<div class="case__body prose">${prose(parts[i].trim())}</div>`;
    const kind = parts[i + 1];
    if (!kind) continue;
    const nums = parts[i + 2].trim().split(/\s+/).filter(Boolean).map(Number);
    if (kind === 'image') out += `<figure class="case__fig">${caseImg(w, nums[0])}</figure>`;
    else if (kind === 'gallery') {
      const sizes = `(max-width: 767px) 50vw, ${Math.round(1120 / nums.length)}px`;
      out += `<div class="case__gallery case__gallery--${nums.length}">${nums.map((n) => caseImg(w, n, { sizes })).join('')}</div>`;
    } else if (kind === 'motion') out += motionFigure(w);
    else if (kind === 'quote') {
      out += quote;
      quoted = true;
    }
  }
  return { html: out, quoted };
}

export function renderCaseStudy(content, w) {
  const m = w.media;
  const placed = hasMarkers(w.body);
  let hero;
  if (w.type === 'systems') {
    // No screenshot: no hero. The stats lead instead of an ink block repeating the title.
    hero = m?.hero ? `<img src="${esc(m.hero)}" alt="${esc(w.title)}, the live app" width="1440" height="900" fetchpriority="high">` : '';
  } else if (w.type === 'brand' && m?.images?.length && placed) {
    // The body places the rest of the images itself; the first one is the hero.
    const i = m.images[0];
    hero = caseImg(w, 0, { cls: i.w / i.h >= 1.2 ? 'wide' : 'solo', eager: true });
  } else if (w.type === 'brand' && m?.images?.length) {
    // Wide images (a brand sheet) run full width; a portrait left alone on its row is centred.
    const wide = (i) => i.w / i.h > 1.6;
    const narrow = m.images.filter((i) => !wide(i));
    const solo = narrow.length % 2 ? narrow[narrow.length - 1] : null;
    hero = m.images
      .map((i, n) => `<img${wide(i) ? ' class="wide"' : i === solo ? ' class="solo"' : ''} src="${esc(i.src)}"${i.small ? ` srcset="${esc(i.small)} 800w, ${esc(i.src)} ${i.w}w" sizes="(max-width: 1200px) 100vw, 1120px"` : ''} alt="${esc(w.alts?.[n] ?? `${w.title}: ${n ? 'part of the brand kit' : 'the brand board'}`)}" width="${i.w}" height="${i.h}"${n ? ' loading="lazy"' : ' fetchpriority="high"'}>`)
      .join('');
  } else if (w.type === 'video' && m?.videos?.length) {
    hero = videoTile(w, { eager: true });
  } else hero = ph(`media for ${w.slug}`);

  const stats = w.stats?.length
    ? `<ul class="stats" aria-label="In numbers">${w.stats.map((s) => `<li><span class="stats__n">${esc(s.n)}</span><span class="stats__label">${esc(s.label)}</span></li>`).join('')}</ul>`
    : '';
  // A quote shows only once Kalid confirms it's real and OK to use.
  const quote = w.quote
    ? w.quote.confirmed
      ? `<figure class="quote"><blockquote><p>“${esc(w.quote.text)}”</p></blockquote><figcaption>${esc(w.quote.by)}</figcaption></figure>`
      : `<p class="quote-pending">${ph(`confirm this quote is real and OK to use: “${w.quote.text}”, ${w.quote.by}`)}</p>`
    : '';
  const body = placed ? caseBody(w, quote) : { html: `<div class="case__body prose">${prose(w.body)}</div>`, quoted: false };

  const main = `
<article class="case">
  ${permission(w)}
  <header class="page-head">
    <div class="wrap">
      <p class="kicker"><span class="kicker__sq" aria-hidden="true"></span><a href="/work?type=${w.type}">${WORK_TYPES[w.type]}</a></p>
      <h1 class="page-head__title case__title">${esc(w.title)}</h1>
      <p class="lead page-head__lead">${inline(w.summary)}</p>
      <p class="case__meta">${inline(w.client)}<span aria-hidden="true"> · </span>${w.year ? inline(w.year) : ph('year')}</p>
      ${devFlags(w) ? `<p>${devFlags(w)}</p>` : ''}
    </div>
  </header>
  <div class="wrap">
    ${hero ? `<div class="case__hero case__hero--${w.type}">${hero}</div>` : ''}
    ${stats}
    ${body.html}
    ${body.quoted ? '' : quote}
    ${w.link ? `<p class="case__link">${more(w.link, `See it live at ${esc(host(w.link))}`, ext(w.link))}</p>` : ''}
    <p class="case__back">${more('/work', 'All work')}</p>
  </div>
</article>
${w.type === 'brand'
    ? closingBand({ title: 'Starting something, or outgrown your logo?', button: 'Book a call' })
    : closingBand({ title: 'Got a similar problem?', text: 'That’s exactly what the call is for. You’ll leave knowing what to fix first.', button: 'Book a call' })}
${w.type === 'video' ? playerDialog() : ''}`;
  return layout({ title: `${w.title} · Kalid Nur`, description: plain(w.summary), main, path: `/work/${w.slug}`, current: '/work', noindex: !w.public });
}

// ---------- /video ----------

const rows = (list) => `<ol class="cols cols--ruled">${list.map(([t, p], i) => `<li><p class="num" aria-hidden="true">0${i + 1}</p><h3 class="cols__title">${t}</h3><p>${p}</p></li>`).join('')}</ol>`;
const steps = (list) => `<ol class="steps steps--${list.length}">${list.map(([t, p], i) => `<li><p class="num">Step ${i + 1}</p><h3 class="steps__title">${t}</h3><p>${p}</p></li>`).join('')}</ol>`;

export function renderVideo(content) {
  const items = visibleWork(content).filter((w) => w.type === 'video');
  const main = `
${pageHead({ k: 'Video', title: 'Cut fast. Cut clean.', lead: 'I edit reels, YouTube videos and motion intros with an AI-powered studio I built myself. Same eye for detail, a fraction of the turnaround.' })}

<section class="band band--flush reveal" aria-labelledby="v-what">
  <div class="wrap">
    ${kicker('What I do', { tag: 'h2', id: 'v-what' })}
    ${rows([
      ['Short-form', 'Reels, TikToks and Shorts, captioned and cut for the first second.'],
      ['Long-form', 'Talks, sessions and interviews edited down to what’s worth watching, plus the clips.'],
      ['Motion', 'Logo intros, outros and simple animated graphics in your brand.'],
    ])}
  </div>
</section>

<section class="band band--ink reveal" aria-labelledby="v-how">
  <div class="wrap">
    ${kicker('How it works', { tag: 'h2', id: 'v-how' })}
    ${steps([
      ['Send the footage.', 'Raw clips, a recording, a script, whatever you’ve got.'],
      ['I cut it.', 'First edit back fast, in your style or levelled up.'],
      ['You choose.', 'Pick a version, ask for changes, and get files ready to post.'],
    ])}
    <p class="band__note">Music-free edits with sound effects only are available on request. ${ph('confirm you want this line')}</p>
  </div>
</section>

<section class="band reveal" aria-labelledby="v-reel">
  <div class="wrap">
    ${kicker('The reel', { tag: 'h2', id: 'v-reel' })}
    ${grid(items, 'work-grid--video')}
  </div>
</section>
${closingBand({ title: 'Got footage sitting on your phone?', button: 'Book a call' })}
${playerDialog()}`;
  return layout({
    title: 'Video · Kalid Nur',
    description: 'Video editing by Kalid Nur: reels, YouTube edits and motion intros, cut fast and cut clean.',
    main,
    path: '/video',
  });
}

// ---------- /branding ----------

export function renderBranding(content) {
  const items = visibleWork(content).filter((w) => w.type === 'brand');
  const main = `
${pageHead({ k: 'Brand & logo', title: 'A logo that means something.', lead: 'I design logos and full brand kits: the mark, the type, the colours, and every file you’ll need, from profile pictures to proposals.' })}

<section class="band band--ink reveal" aria-labelledby="b-how">
  <div class="wrap">
    ${kicker('How a logo gets made', { tag: 'h2', id: 'b-how' })}
    ${steps([
      ['Brief.', 'A short form about you, your audience and what you want people to feel.'],
      ['Concepts.', 'A wide set of directions, explored fast, so you can react to real options.'],
      ['Lock-in.', 'The chosen concept rebuilt as exact vector geometry, never a traced sketch.'],
      ['The kit.', 'Logo versions, icons, colours, fonts, social templates and a brand sheet.'],
    ])}
  </div>
</section>

<section class="band band--flush-top reveal" aria-labelledby="b-work">
  <div class="wrap">
    ${kicker('Projects', { tag: 'h2', id: 'b-work' })}
    ${grid(items, 'work-grid--brand')}
  </div>
</section>
${closingBand({ title: 'Starting something, or outgrown your logo?', button: 'Book a call' })}
${playerDialog()}`;
  return layout({
    title: 'Branding · Kalid Nur',
    description: 'Brand and logo design by Kalid Nur: logos and full brand kits, from first concept to finished files.',
    main,
    path: '/branding',
  });
}

// ---------- the "And the creative side" row (home and What I do) ----------

export const creativeRow = (variant = '') => `
<div class="creative${variant ? ` creative--${variant}` : ''}">
  <h3 class="creative__title">And the creative side</h3>
  <ul class="creative__links">
    <li><p class="creative__name">${more('/video', 'Video editing')}</p><p>Reels, YouTube edits and motion intros, cut fast and cut clean.</p></li>
    <li><p class="creative__name">${more('/branding', 'Brand &amp; logo')}</p><p>Logos and full brand kits, from first concept to finished files.</p></li>
  </ul>
</div>`;
