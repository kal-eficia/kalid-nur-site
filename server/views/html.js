// Small shared helpers. Template literals only, no template library.

import { marked } from 'marked';

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

export const PRODUCTION = process.env.NODE_ENV === 'production';

// Something Kalid still has to supply. On his machine it shows as a visible tag; on the live
// site it's an HTML comment, so a visitor never sees it but `npm run checks:prod` still finds it.
export const ph = (what) => (PRODUCTION ? `<!-- [KALID: ${esc(what)}] -->` : `<span class="kalid">[KALID: ${esc(what)}]</span>`);

// The arrow on "more" links (DESIGN.md: text link). A character, so it inherits colour and size.
export const more = (href, label, attrs = '') =>
  `<a class="more" href="${esc(href)}"${attrs}>${label}<span class="more__arrow" aria-hidden="true">&nbsp;→</span></a>`;

// Kicker: small brass square and a tracked uppercase label. `tag` lets a kicker be a heading.
export const kicker = (label, { tag = 'p', id = '' } = {}) =>
  `<${tag} class="kicker"${id ? ` id="${id}"` : ''}><span class="kicker__sq" aria-hidden="true"></span>${label}</${tag}>`;

export const ext = (url) => (/^https?:/.test(url) ? ' rel="noopener"' : '');

// ---------- prose (Notes) ----------

marked.use({ gfm: true, breaks: false });

// Straight quotes to curly, outside code spans and URLs.
export function typo(s) {
  return String(s)
    .split(/(`[^`]*`|\]\([^)]*\)|https?:\/\/\S+)/)
    .map((part, i) =>
      i % 2
        ? part
        : part
            .replace(/(^|[\s([{-])"/g, '$1“')
            .replace(/"/g, '”')
            .replace(/(\w)'(\w)/g, '$1’$2')
            .replace(/(^|[\s([{-])'/g, '$1‘')
            .replace(/'/g, '’'),
    )
    .join('');
}

const PH = /\[KALID:([^\]]*)\]/g;
function guard(s) {
  const saved = [];
  const out = String(s).replace(PH, (m, what) => {
    saved.push(what.trim());
    return `\u0000${saved.length - 1}\u0000`;
  });
  return { out, restore: (html) => html.replace(/\u0000(\d+)\u0000/g, (_, n) => ph(saved[n])) };
}
// Arabic in copy: {{ar:...}} becomes a span with lang="ar" and dir="rtl" (the site's Arabic font
// setup keys off [lang='ar']). On a line of its own it becomes a large display line.
const AR = /\{\{ar:([^}]*)\}\}/g;
const arabic = (html) =>
  html.replace(/<p>\{\{ar:([^}]*)\}\}<\/p>/g, '<p class="arabic-line" lang="ar" dir="rtl">$1</p>').replace(AR, '<span lang="ar" dir="rtl">$1</span>');
const externalRel = (html) => html.replace(/<a href="(https?:\/\/[^"]+)"/g, '<a href="$1" rel="noopener"');

export function inline(s) {
  const { out, restore } = guard(typo(s));
  return restore(arabic(externalRel(marked.parseInline(out))));
}
export function block(s) {
  const { out, restore } = guard(typo(s));
  return restore(arabic(externalRel(marked.parse(out))));
}
// Plain text for attributes and titles.
export const plain = (s) => typo(s).replace(AR, '$1').replace(PH, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`]/g, '').trim();

// A note's body: Markdown, with blockquotes as pull quotes and [^1] footnotes as sidenotes
// (in the margin on wide screens, under the paragraph on phones).
export function prose(md) {
  const notes = new Map();
  const body = md.replace(/^\[\^([\w-]+)\]:[ \t]*(.+)$/gm, (_, id, note) => {
    notes.set(id, note.trim());
    return '';
  });
  let n = 0;
  const marked1 = body.replace(/\[\^([\w-]+)\]/g, (m, id) => (notes.has(id) ? `\u0001${++n}\u0002${id}\u0003` : m));
  let html = block(marked1);
  html = html.replace(/\u0001(\d+)\u0002([\w-]+)\u0003/g, (_, num, id) => {
    const note = block(notes.get(id)).replace(/^<p>|<\/p>\s*$/g, '');
    return `<sup class="fn" id="fnref-${num}"><a href="#sn-${num}" aria-describedby="sn-${num}">${num}</a></sup><span class="sidenote" id="sn-${num}" role="note"><span class="sidenote__n">${num}</span> ${note}</span>`;
  });
  return html.replace(/<blockquote>/g, '<blockquote class="pull">');
}

// "16 November 2026"
export const longDate = (iso) =>
  new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`));
