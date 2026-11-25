// Home: built to reference/rebrand/home-comp.png, copy from docs/rebrand/CONTENT.md.

import { layout, MARK_ALT, siteOrigin } from './layout.js';
import { kicker, more } from './html.js';
import { config, masterclassOver } from '../config.js';
import { creativeRow } from './work.js';

const WHAT = [
  ['01', 'Find the gap', 'A clear look at how your work actually runs. You get a short list of the gaps worth fixing, in order, and what fixing each one is worth to you.'],
  ['02', 'Build the fix', 'Working AI systems, tools and automations, built around your real work. Built in hours and days, not months. You own every account, key and line of it.'],
  ['03', 'Teach your team', 'Hands-on training where your people build something real on day one, and leave knowing how to build the next one without me.'],
];

const STEPS = [
  ['Step 1', 'Look', 'I sit with the people doing the work and watch where the hours go. The gap is usually somewhere nobody’s looking.'],
  ['Step 2', 'Build', 'We build the fix fast, live and together, so you see it working before anyone writes a spec.'],
  ['Step 3', 'Hand over', 'You own it. Your team knows how to run it and how to build the next one. No lock-in, no mystery.'],
];

const WHO = [
  ['Businesses', 'Teams who’ve been told to “use AI” and nobody’s shown them how.'],
  ['Schools', 'Staff and students using AI without switching their thinking off.'],
  ['Creators', 'You’re the talent. AI can be the back room.'],
];

export const RECEIPTS = ['Trained teams at a £300m+ company', 'Schools', 'CEOs one to one'];

function personLd() {
  const sameAs = Object.values(config.socials).map((s) => s.url).filter(Boolean);
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Kalid Nur',
    jobTitle: 'AI consultant, builder and trainer',
    url: `${siteOrigin()}/`,
    image: `${siteOrigin()}/brand/og-avatar.png`,
    sameAs,
  };
  // `<` escaped so the JSON can never close the script element.
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>\n`;
}

// The closing ink band, shared with the inner pages.
export const closingBand = ({ title, text = '', button = 'Book a call', id = 'cta-title' }) => `
<section class="band band--ink band--cta reveal" aria-labelledby="${id}">
  <div class="wrap">
    <h2 class="band--cta__title" id="${id}">${title}</h2>
    ${text ? `<p class="lead band--cta__lead">${text}</p>` : ''}
    <p class="band--cta__action"><a class="btn btn--on-dark" href="/book">${button}</a></p>
  </div>
</section>`;

export const masterclassPanel = () => `
<div class="wrap mc-wrap reveal">
  <section class="mc" aria-labelledby="mc-title">
    <div>
      ${kicker('Free masterclass<span class="kicker__dot"> · </span><span class="kicker__nw">Tue 15 Dec · 7pm UK</span>')}
      <h2 class="mc__title" id="mc-title">Team of One</h2>
      <p class="lead mc__lead">You’re the talent. Hire the back room.</p>
    </div>
    <a class="btn btn--brass" href="/masterclass">Save my seat</a>
  </section>
</div>`;

export function renderHome() {
  const main = `
<section class="hero">
  <div class="wrap hero__grid">
    <div class="hero__text">
      ${kicker('Analyst · Builder · Teacher')}
      <h1 class="hero__title"><span class="line">I find the gap.</span> <span class="line">Then I build the fix.</span></h1>
      <p class="lead hero__lead">I help businesses, schools and creators use AI properly. I look at how your work really gets done, find where time and money leak, then build the system that closes the gap and train your people to run it.</p>
      <div class="actions hero__actions">
        <a class="btn" href="/book" data-primary-cta>Book a call</a>
        ${more('#how', 'See how I work')}
      </div>
      <ul class="receipts" aria-label="Some of the work so far">${RECEIPTS.map((r) => `<li>${r}</li>`).join('')}</ul>
    </div>
    <div class="hero__art"><img src="/brand/nur-mark.svg" alt="${MARK_ALT}" width="400" height="400" fetchpriority="high"></div>
  </div>
</section>

<section class="band reveal" aria-labelledby="what-title">
  <div class="wrap">
    ${kicker('What I do')}
    <h2 class="band__title" id="what-title">Three ways to work together</h2>
    <ol class="cols cols--ruled">
      ${WHAT.map(([n, t, p]) => `<li><p class="num" aria-hidden="true">${n}</p><h3 class="cols__title">${t}</h3><p>${p}</p></li>`).join('\n      ')}
    </ol>
    <p class="band__more band__more--close">${more('/work-with-me', 'More on working together')}</p>
    ${creativeRow()}
  </div>
</section>

<section class="band band--ink reveal" id="how" aria-labelledby="how-title" tabindex="-1">
  <div class="wrap">
    ${kicker('How I work')}
    <h2 class="band__title" id="how-title">We start with your week, not the tech</h2>
    <ol class="steps">
      ${STEPS.map(([s, t, p]) => `<li><p class="num">${s}</p><h3 class="steps__title">${t}</h3><p>${p}</p></li>`).join('\n      ')}
    </ol>
  </div>
</section>

<section class="band reveal" aria-labelledby="who-title">
  <div class="wrap">
    ${kicker('Who I work with', { tag: 'h2', id: 'who-title' })}
    <ul class="cols who">
      ${WHO.map(([t, p]) => `<li><h3 class="who__title">${t}</h3><p>${p}</p></li>`).join('\n      ')}
    </ul>
  </div>
</section>

<section class="band reveal" aria-labelledby="about-title">
  <div class="wrap about-teaser">
    <div class="mark-panel"><img src="/brand/nur-mark-white.svg" alt="${MARK_ALT}" width="248" height="248" loading="lazy"></div>
    <div>
      ${kicker('About')}
      <h2 class="band__title band__title--tight" id="about-title">Nur means light</h2>
      <p class="lead">My name is in the logo: <span lang="ar">نور</span>, written in square Kufic. The one brass square is the dot of the nun. To me it’s the gap where the light gets in.</p>
      <p class="lead">I’m an analyst at heart. I notice where things leak, then I build the fix and teach people to build their own. Born in Holland, raised in London, working across the UK, Saudi Arabia and the UAE.</p>
      <p class="band__more band__more--close">${more('/about', 'More about me')}</p>
    </div>
  </div>
</section>
${masterclassOver() ? '' : masterclassPanel()}
${closingBand({ title: 'Got a gap you can’t name yet?', text: 'That’s exactly what the call is for. You’ll leave knowing what to fix first.', button: 'Book a call with Kalid' })}`;

  return layout({
    title: 'Kalid Nur · I find the gap. Then I build the fix.',
    description:
      'Kalid Nur helps businesses, schools and creators use AI properly: he finds the gap in how the work gets done, builds the fix, and trains your team to run it.',
    main,
    path: '/',
    head: personLd(),
    bodyClass: 'home',
  });
}

