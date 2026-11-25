// Notes: short writing (the old essays). Drafts (published: false) show only on Kalid's machine.

import { layout } from './layout.js';
import { esc, inline, plain, prose, longDate, more, PRODUCTION } from './html.js';
import { pageHead } from './pages.js';

export const visibleNotes = (content) => content.notes.filter((n) => n.published || !PRODUCTION);
export const findNote = (content, slug) => visibleNotes(content).find((n) => n.slug === slug) ?? null;

const meta = (n) =>
  `<time datetime="${n.date}">${esc(longDate(n.date))}</time><span aria-hidden="true"> · </span>${n.minutes} min read${n.published ? '' : '<span aria-hidden="true"> · </span><span class="draft">Draft, only on your machine</span>'}`;

export function renderNotes(content) {
  const notes = visibleNotes(content);
  const list = notes.length
    ? `<ol class="notes">${notes
        .map(
          (n) => `
      <li class="note-item">
        <p class="note-item__meta">${meta(n)}</p>
        <h2 class="note-item__title"><a href="/notes/${n.slug}">${inline(n.title)}</a></h2>
        <p class="note-item__summary">${inline(n.standfirst)}</p>
      </li>`,
        )
        .join('')}
    </ol>`
    : '<p class="lead notes-empty">First notes coming soon.</p>';
  const main = `
${pageHead({ k: 'Notes', title: 'Notes', lead: 'Short things I’ve learned finding gaps and building fixes.' })}
<section class="band band--flush" aria-label="All notes">
  <div class="wrap">${list}</div>
</section>`;
  return layout({
    title: 'Notes · Kalid Nur',
    description: 'Short notes from Kalid Nur on finding the gap and building the fix with AI.',
    main,
    path: '/notes',
  });
}

export function renderNote(content, n) {
  const main = `
<article class="article">
  <header class="page-head page-head--article">
    <div class="wrap">
      <p class="kicker"><span class="kicker__sq" aria-hidden="true"></span><a href="/notes">Notes</a></p>
      <h1 class="article__title">${inline(n.title)}</h1>
      <p class="lead article__lead">${inline(n.standfirst)}</p>
      <p class="article__meta">By Kalid Nur<span aria-hidden="true"> · </span>${meta(n)}</p>
    </div>
  </header>
  <div class="wrap">
    <div class="article__body prose">${prose(n.body)}</div>
    <p class="article__end">${more('/notes', 'All notes')}</p>
  </div>
</article>`;
  return layout({
    title: `${plain(n.title) || 'Note'} · Kalid Nur`,
    description: plain(n.standfirst) || 'A note from Kalid Nur.',
    main,
    path: `/notes/${n.slug}`,
    current: '/notes',
    noindex: !n.published,
  });
}

export function renderFeed(content, origin) {
  const items = content.notes
    .filter((n) => n.published)
    .map(
      (n) => `  <item>
    <title>${esc(plain(n.title))}</title>
    <link>${origin}/notes/${n.slug}</link>
    <guid>${origin}/notes/${n.slug}</guid>
    <pubDate>${new Date(`${n.date}T09:00:00Z`).toUTCString()}</pubDate>
    <description>${esc(plain(n.standfirst))}</description>
  </item>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>Notes from Kalid Nur</title>
  <link>${origin}/notes</link>
  <description>Short notes on finding the gap and building the fix with AI.</description>
  <language>en-gb</language>
${items}
</channel>
</rss>
`;
}
