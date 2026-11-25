// Inner pages: What I do, About, Masterclass, Book, 404. Copy from docs/rebrand/CONTENT.md.

import { layout, MARK_ALT } from './layout.js';
import { kicker, more, ph, esc, ext, PRODUCTION } from './html.js';
import { closingBand } from './home.js';
import { config, masterclassOver } from '../config.js';
import { creativeRow } from './work.js';

// The opening of every inner page: kicker, H1, lead.
export const pageHead = ({ k, title, lead, extra = '' }) => `
<header class="page-head">
  <div class="wrap">
    ${k ? kicker(k) : ''}
    <h1 class="page-head__title">${title}</h1>
    ${lead ? `<p class="lead page-head__lead">${lead}</p>` : ''}
    ${extra}
  </div>
</header>`;

// ---------- What I do ----------

const WAYS = [
  {
    n: '01',
    title: 'Find the gap',
    body: 'I look at how the work really gets done: the hand-offs, the copy and paste, the things one person keeps in their head. Then I tell you plainly where the time and money are leaking.',
    get: 'a short, ranked list of the gaps worth fixing, what each one costs you now, and what fixing it looks like.',
    suits: 'owners and leaders who know something’s off but can’t put a finger on it.',
  },
  {
    n: '02',
    title: 'Build the fix',
    body: 'I build the AI system, tool or automation that closes the gap, around the way your team already works. Fast, and in the open, so you see it working early.',
    get: 'a working system, and every account, key and line of it in your name.',
    suits: 'teams with a clear bottleneck and no time to wait months for it.',
  },
  {
    n: '03',
    title: 'Teach your team',
    body: 'Hands-on training built around your real work, not slides. Everyone builds something useful in the first session.',
    get: 'a team that uses AI properly and can build the next fix themselves.',
    suits: 'businesses, schools and creators who’ve been told to “use AI” and nobody’s shown them how.',
  },
];

export function renderWork() {
  const main = `
${pageHead({ k: 'What I do', title: 'Three ways to work together', lead: 'Most people start with one and end up doing all three. That’s fine. Each one stands on its own.' })}

<section class="band band--flush" aria-label="The three ways">
  <div class="wrap">
    <ol class="ways">
      ${WAYS.map(
        (w) => `
      <li class="way reveal" id="${w.title.toLowerCase().replace(/\s+/g, '-')}">
        <div class="way__head"><p class="num" aria-hidden="true">${w.n}</p><h2 class="way__title">${w.title}</h2></div>
        <div class="way__body">
          <p class="way__lead">${w.body}</p>
          <dl class="way__facts">
            <div><dt>You get</dt><dd>${w.get[0].toUpperCase()}${w.get.slice(1)}</dd></div>
            <div><dt>Suits</dt><dd>${w.suits[0].toUpperCase()}${w.suits.slice(1)}</dd></div>
          </dl>
        </div>
      </li>`,
      ).join('')}
    </ol>
    ${creativeRow('halves')}
  </div>
</section>

<section class="band band--ink reveal" aria-label="Schools and creators">
  <div class="wrap">
    <div class="pair">
      <div>
        <h2 class="pair__title">For schools</h2>
        <p>I train staff to use AI in their own work, and help schools keep students learning and thinking when AI’s in the room. The aim is kids who love AI and think harder because of it, not less.</p>
      </div>
      <div>
        <h2 class="pair__title">For creators</h2>
        <p>You’re the talent. With the right set-up, AI can be your researcher, editor, scheduler and analyst. I help you build that back room.</p>
      </div>
    </div>
  </div>
</section>

<section class="band band--close reveal" aria-labelledby="close-title">
  <div class="wrap close">
    <h2 class="close__title" id="close-title">Not sure which one you need?</h2>
    <p class="lead">That’s what the first call is for.</p>
    <p class="close__action"><a class="btn" href="/book">Book a call</a></p>
  </div>
</section>`;
  return layout({
    title: 'What I do · Kalid Nur',
    description: 'Three ways to work with Kalid Nur: find the gap, build the fix, and teach your team to run it.',
    main,
    path: '/work-with-me',
  });
}

// ---------- About ----------

const PRINCIPLES = [
  ['I build it before I sell it.', 'Everything I offer, I’ve made and used.'],
  ['You own what we build.', 'Every account, key and line of it.'],
  ['Speed is a feature.', 'If it takes months, something’s wrong.'],
  ['Make people love AI, not fear it.', 'Then teach them to think harder because of it.'],
  ['This site doesn’t track you.', 'No analytics, no cookies, no third-party scripts.'],
];

const link = (href, label) => (href ? `<a href="${esc(href)}"${ext(href)}>${label}</a>` : `${label} ${ph(`${label} URL`)}`);

export function renderAbout() {
  const main = `
${pageHead({ k: 'About', title: 'Analyst. Builder. Teacher.', lead: 'I help people use AI to get to the top of their field: businesses, schools and creators first, and one day a whole generation of young problem solvers.' })}

<section class="band band--flush reveal" aria-label="The story">
  <div class="wrap story">
    <figure class="story__art">
      <div class="mark-panel"><img src="/brand/nur-mark-white.svg" alt="${MARK_ALT}" width="248" height="248" loading="lazy"></div>
      <figcaption>${ph('optional photo, e.g. the one from behind used on carousels')}</figcaption>
    </figure>
    <div class="story__text prose">
      <h2>The short version</h2>
      <p>I’m an analyst at heart. It’s how I sense where the opportunity is, spot the gap nobody’s named yet, and work out what’s actually worth fixing. Then I build the fix, fast, and teach people to build their own.</p>
      <p>I’ve trained teams at a company turning over more than £300 million a year, worked with schools, and taught CEOs and business owners one to one. I run eficiatech, my technology and systems company, and I’m a cofounder of MyKayd.</p>
      <h2>Where I’m from</h2>
      <p>Born in Holland, raised in London from about six. Somali heritage, Muslim, fluent in Arabic. I work across the UK, Saudi Arabia and the UAE.</p>
      <h2 id="the-mark">The mark</h2>
      <p>My name is in the logo. <span lang="ar">نور</span> means light, written here in square Kufic, a style built on a grid like the patterns on old mosque walls. There’s one brass square: the dot of the nun. I think of it as the gap where the light gets in. That’s the job: find the gap, let the light in.</p>
      <h2>Why I do this</h2>
      <p>I want to raise a generation of problem solvers and thinkers who can build and thrive in the AI age, starting with kids who grew up like I did, as minorities in the West. Everything else I do funds and sharpens that. ${ph('optional, add a few lines in your own words')}</p>
    </div>
  </div>
</section>

<section class="band band--ink reveal" id="principles" aria-labelledby="principles-title">
  <div class="wrap">
    <h2 class="band__title" id="principles-title">Principles</h2>
    <ol class="principles">
      ${PRINCIPLES.map(([h, p], i) => `<li><p class="num" aria-hidden="true">0${i + 1}</p><p><strong>${h}</strong> ${p}</p></li>`).join('\n      ')}
    </ol>
  </div>
</section>

<section class="band reveal" aria-labelledby="elsewhere-title">
  <div class="wrap">
    ${kicker('Elsewhere', { tag: 'h2', id: 'elsewhere-title' })}
    <ul class="cols elsewhere">
      <li><h3 class="cols__title">${link(config.links.excelia, 'Excelia')}</h3><p>Coding and AI for 11 to 18 year olds.</p></li>
      <li><h3 class="cols__title">${link(config.links.eficiatech, 'eficiatech')}</h3><p>My technology and systems company.</p></li>
      <li><h3 class="cols__title">${link(config.links.mykayd, 'MyKayd')}</h3><p>The company I cofounded.</p></li>
    </ul>
  </div>
</section>
${closingBand({ title: 'Got a gap you can’t name yet?', text: 'That’s exactly what the call is for. You’ll leave knowing what to fix first.', button: 'Book a call' })}`;
  return layout({
    title: 'About · Kalid Nur',
    description: 'Kalid Nur is an analyst, builder and teacher who helps people use AI to get to the top of their field.',
    main,
    path: '/about',
  });
}

// ---------- Masterclass ----------

const DETAILS = ['Tuesday 15 December 2026', '7pm UK', 'Live on Zoom', 'Free'];

export function renderMasterclass() {
  const over = masterclassOver();
  const signup = config.masterclass.signupUrl
    ? `<a class="btn btn--brass" href="${esc(config.masterclass.signupUrl)}"${ext(config.masterclass.signupUrl)}>Save my seat</a>`
    : ph('sign-up link');
  const action = over
    ? `<p class="lead">This one’s been and gone. Want the next one?</p><p class="actions"><a class="btn" href="/book">Book a call</a></p>`
    : `<p class="actions">${signup}</p>`;
  const main = `
${pageHead({
  k: 'Free masterclass',
  title: 'Team of One',
  lead: 'You’re the talent. Hire the back room.',
  extra: `<ul class="receipts receipts--details" aria-label="When and where">${DETAILS.map((d) => `<li>${d}</li>`).join('')}</ul>`,
})}

<section class="band band--flush reveal" aria-label="About the session">
  <div class="wrap">
    <div class="mc mc--page">
      <div class="measure">
        <p class="lead">Creators used to have to hire for every job: an editor, a researcher, someone on the schedule, someone on the numbers. Now you can build that back room with AI.</p>
        <p class="lead">In this free live session I’ll show you how, using my own set-up, with live questions at the end.</p>
      </div>
      <div class="mc__side">${action}</div>
    </div>
  </div>
</section>`;
  return layout({
    title: 'Team of One · Kalid Nur',
    description: 'Team of One, a free live masterclass for creators with Kalid Nur. Tuesday 15 December 2026, 7pm UK, on Zoom.',
    main,
    path: '/masterclass',
  });
}

// ---------- Book (shown only while BOOKING_URL isn't set) ----------

export function renderBook() {
  const email = config.email ? `<a href="mailto:${esc(config.email)}">${esc(config.email)}</a>` : ph('email address');
  // On the live site, a line with nothing in it yet is left out rather than shown half-empty.
  const lines = [
    `<p>${ph('booking link')}</p>`,
    config.email || !PRODUCTION ? `<p><span class="book-ways__label">Email</span> ${email}</p>` : email,
  ];
  const main = `
${pageHead({
  k: '',
  title: 'Book a call',
  lead: 'Tell me where the work feels stuck. You’ll leave the call knowing what to fix first.',
  extra: `<div class="book-ways">${PRODUCTION ? lines.map((l) => l.replace(/^<p>(<!--[^>]*-->)<\/p>$/, '$1')).join('') : lines.join('')}</div>`,
})}`;
  return layout({
    title: 'Book a call · Kalid Nur',
    description: 'Book a call with Kalid Nur. Tell him where the work feels stuck, and leave knowing what to fix first.',
    main,
    path: '/book',
    bodyClass: 'short',
  });
}

// ---------- 404 ----------

export function renderNotFound(path) {
  const main = `
${pageHead({
  k: 'Not found',
  title: 'This page isn’t here.',
  lead: 'Plenty of other gaps to fix, though.',
  extra: `<div class="actions"><a class="btn" href="/book">Book a call</a>${more('/', 'Home')}</div>`,
})}`;
  return layout({ title: 'Not found · Kalid Nur', description: 'This page isn’t here.', main, path, noindex: true, bodyClass: 'short' });
}
