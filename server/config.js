// The handful of values that change by hand. One place, so nothing is copied around.
// Anything still null shows as a [KALID: ...] placeholder on your machine, is left out of the
// live site, and makes `npm run checks:prod` fail until it's filled.

export const config = {
  // Where /book sends people. While null, /book shows a short page with the email address.
  bookingUrl: 'https://calendly.com/kal-eficiatech/reframe-discovery-call',
  email: 'kal@eficiatech.com',

  socials: {
    instagram: { label: 'Instagram', handle: '@analystkal', url: 'https://www.instagram.com/analystkal/' },
    x: { label: 'X', handle: '@sonofishmael_', url: 'https://x.com/sonofishmael_' },
    linkedin: { label: 'LinkedIn', handle: null, url: 'https://www.linkedin.com/in/kalid-nur-4a37231ab/' },
  },

  links: {
    excelia: 'https://excelia.eficiatech.com',
    eficiatech: 'https://eficiatech.com',
    mykayd: 'https://mykayd.com',
  },

  masterclass: {
    signupUrl: null, // [KALID: sign-up link]
    // The home panel disappears and /masterclass switches to "been and gone" after this moment.
    // 15 December 2026, 9pm UK (GMT, so the same as UTC).
    hideAfter: '2026-12-15T21:00:00Z',
  },

  timeZone: 'Europe/London',

  // "Ask Kalid's brain" (server/ask.js). Kept in the code but not mounted or linked since the
  // rebrand. Turn it off with ASK_ENABLED=false in .env.
  ask: {
    model: 'claude-opus-5-5', // approved by Kalid, 11 November 2026
    monthlyCapUsd: 25,
    perHour: 10,
    maxLength: 500,
  },
};

export const bookingHref = () => '/book';
export const masterclassOver = (now = new Date()) => now >= new Date(config.masterclass.hideAfter);
