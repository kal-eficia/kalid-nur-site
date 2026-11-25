// Social cards (1200 x 630): ink ground, white mark, Cinzel title. `npm run og` screenshots these
// into public/og/. Only served on Kalid's machine; the live site serves the saved PNGs.

import { esc } from './html.js';
import { CSS_VERSION } from './layout.js';

export const OG_CARDS = {
  home: { kicker: 'Analyst · Builder · Teacher', title: 'I find the gap.<br>Then I build the fix.' },
  'work-with-me': { kicker: 'What I do', title: 'Three ways to work together' },
  about: { kicker: 'About', title: 'Analyst. Builder. Teacher.' },
  notes: { kicker: 'Notes', title: 'Finding gaps, building fixes' },
  masterclass: { kicker: 'Free masterclass · Tue 15 Dec · 7pm UK', title: 'Team of One' },
  book: { kicker: 'Book a call', title: 'Got a gap you can’t name yet?' },
  work: { kicker: 'Work', title: 'Things I’ve built' },
  video: { kicker: 'Video', title: 'Cut fast. Cut clean.' },
  branding: { kicker: 'Brand & logo', title: 'A logo that means something.' },
};

export function renderOgCard(key) {
  const card = OG_CARDS[key];
  if (!card) return null;
  return `<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Card: ${esc(key)}</title>
<link rel="stylesheet" href="/css/bundle.css?v=${CSS_VERSION}"></head>
<body class="og-body">
<div class="og">
  <img class="og__mark" src="/brand/nur-mark-white.svg" alt="" width="300" height="300">
  <div class="og__text">
    <p class="kicker"><span class="kicker__sq" aria-hidden="true"></span>${card.kicker}</p>
    <p class="og__title">${card.title}</p>
    <p class="og__name">Kalid Nur</p>
  </div>
</div>
</body></html>`;
}
