# Kalid Nur: design system (rebrand, locked)

This replaces the broadsheet design in `docs/DESIGN.md`. Where the two disagree, this file wins.

The reference for the look is `reference/rebrand/home-comp.png` (render of `reference/rebrand/home-comp.html`). Build to that standard: calm, precise, professional, a lot of space. It should feel like a serious consultancy run by one person who builds.

## 1. The one job
A business owner, school leader or creator lands on the site. Within ten seconds they know:
1. **What he does:** finds the gap in how work gets done, builds the AI fix, and teaches the team to run it.
2. **That it's real:** a few plain receipts, no hype.
3. **What to do next:** book a call.

## 2. The mark
- `public/brand/nur-mark.svg`: نور (light) in square Kufic on a 13 × 13 grid. Nur is Kalid's name. The single brass square is the dot of the nun: "the gap where the light gets in". It's the brand idea in one detail.
- Use the mark as is. Never redraw, stretch, rotate, recolour the letters, or add effects.
- Ink on light grounds (`nur-mark.svg`), paper on dark grounds (`nur-mark-white.svg`). The square is always brass.
- Clear space: one grid cell (1/13 of the mark's width) on every side, at least.
- Minimum size: 24 px for the mark, 140 px wide for the horizontal logo.

### Logo files (all in `public/brand/`)
| File | Use |
|---|---|
| `kalid-nur-logo-no-tagline.svg` | Site header |
| `kalid-nur-logo.svg` | With "Analyst · Builder · Teacher": hero areas, documents |
| `kalid-nur-logo-reversed.svg` | Footer and any dark ground |
| `kalid-nur-logo-stacked.svg` / `-stacked-reversed.svg` | Narrow spaces, mobile menus |
| `nur-mark.svg` / `nur-mark-white.svg` | Hero art, favicons, section art |
| `favicon.svg`, `favicon-*.png` | Favicons and app icons (180 = apple-touch-icon) |

## 3. Tokens
CSS custom properties on `:root`. Never hard-code a colour, size or duration outside this list.

### Colour
| Token | Hex | Use |
|---|---|---|
| `--ink` | #16140F | Text, dark sections, primary buttons |
| `--ink-2` | #4A453C | Body copy on paper, secondary text |
| `--ink-3` | #6B6357 | Captions, small print |
| `--paper` | #F4EFE4 | Page background |
| `--paper-2` | #EBE4D6 | Panels and callouts (e.g. the masterclass box) |
| `--rule` | #CFC5B3 | Hairlines and dividers |
| `--brass` | #7A5C23 | The one accent on light: small squares, labels, link underlines, focus ring |
| `--brass-light` | #C9A45C | The accent on dark: labels, rules, the primary button on dark |
| `--on-dark-2` | #BDB4A3 | Body text on ink |

Brass is an accent, never a large fill except a single button. One brass thing per view is the rule of thumb.

### Type (self-hosted WOFF2 in `public/brand/fonts/`)
| Role | Face | Spec |
|---|---|---|
| Headlines, section titles, big statements | **Cinzel** 600 | All caps by design. Short lines only (under ~45 characters). H1 64 px desktop / 40 px mobile, line height 1.08. H2 50 / 32. H3 30 / 24. |
| Body, UI, buttons | **Inter Tight** 400/500/600/700 | Body 18 px, lead 23 px desktop / 19 px mobile, line height 1.55 to 1.6, measure 60 to 72 characters |
| Labels and kickers | Inter Tight 600 | 13 to 15 px, uppercase, letter spacing 0.32em, brass, preceded by a small brass square (7 px) |

Never set long text in Cinzel. Never use more than these two faces.

### Space and layout
- Content width 1200 px, side padding 40 px (20 px on mobile).
- Section padding 96 px top and bottom (64 px on mobile). Sections are separated by a 1 px `--rule` hairline or by switching to an ink section.
- Rhythm alternates paper and ink sections, as in the comp. Never two ink sections in a row.
- Three-column rows use hairline dividers, not cards. No drop shadows, no rounded corners (radius 0 everywhere), no gradients.

### Components
- **Primary button:** ink fill, paper text, 600, 16 to 17 px, padding 16 × 26, square corners. On dark sections: brass-light fill, ink text.
- **Text link:** ink text with a 2 px brass underline offset 3 px, and an arrow (→) for "more" links.
- **Kicker:** small brass square + tracked uppercase label.
- **Numbered columns:** Cinzel brass numerals (01, 02, 03), title in Cinzel, body in Inter Tight.
- **Receipts line:** small brass squares + plain facts, ink-3, 15 px.

### Motion
Subtle and quick: 150 to 250 ms ease-out. Fade and lift sections 12 px on first scroll into view. Respect `prefers-reduced-motion`. Nothing loops, nothing bounces.

### Accessibility
WCAG AA for every text pair (check brass on paper at small sizes). Visible focus ring: 2 px brass, offset 3 px. Every image has alt text; the mark's alt text is "Kalid Nur logo: نور (light) in square Kufic".

## 4. Avoid
Glowing brains, neural-network art, stock photos, gradient blobs, glassmorphism, emoji, card soup, drop shadows, rounded corners, "AI consultant" template tropes, and anything from the old newspaper design (mastheads, editions, classifieds, obituaries, column rules).

## Decisions made during the build
(Add each decision here with the date.)

**24 November 2026 (rebrand build)**
1. **Fluid type between the two sizes in section 3.** H1, H2, H3 and lead scale smoothly from their mobile size at 390 wide to their desktop size at 1280 (`clamp()` in `tokens.css`), so the 768 tablet gets in-between sizes instead of a jump.
2. **Two sizes taken from the comp, not the type table.** "Who I work with" titles are Cinzel 52 px (the comp) rather than H3 30 px, and the closing "Got a gap you can't name yet?" is 58 px rather than H2 50 px. Both scale down to 32 px on phones. The comp wins on the home page.
3. **Hero H1 stays on two lines on desktop** (no wrapping from 1100 px up, as in the comp; the H1 may run past the 640 px copy column). Below that each sentence is its own balanced block, so phones get "Then I build / the fix." rather than a lone "fix.". The mark is top-aligned so its top edge sits on the H1 cap line, as in the comp.
4. **Header nav collapses below 960 px**, not 768: the four links plus the button don't fit beside the logo at tablet width. Tablet and phone get logo, "Book a call" and a menu button. Header logo is 58 px tall on desktop, 48 px below 960 (148 px wide, above the 140 px minimum).
5. **Mobile menu works without JavaScript.** The menu button is a link to `#menu` and the menu opens with `:target`; with JavaScript it becomes a proper dialog (focus kept inside, Escape closes, page scroll locked). Its top-left mark is `nur-mark-white.svg` at 40 px, since there is no reversed logo without the tagline and the tagline is unreadable at header size.
6. **Hero mark by width:** 400 px beside the text on desktop, 220 px beside it from 720 to 1099 px (tablet keeps two columns), and under the receipts at 160 px on phones, left-aligned, so the call to action stays above the fold.
7. **Spacing scale** for the lint: 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96. One-off values from the spec (button 26 px sides, link underline gap 3 px, logo clear-space bleed) are tokens.
8. **Strong rules** (top of the numbered columns, the ways list, the notes list) are 1.5 px ink, as in the comp. On ink, the step rules are 1.5 px brass-light.
9. **Brass on light:** used for kickers, numerals, receipts squares, link underlines, focus ring, and the single masterclass button. All text pairs checked by `npm run checks`: brass on paper 5.4:1, brass on paper-2 4.9:1, ink-3 on paper-2 4.7:1.
10. **Inner page rhythm.** Every inner page opens with the same paper head (kicker, H1 at 64 px, lead). What I do and About end on the ink closing band; About reuses the home page's closing line, since CONTENT.md gives it only the button. Never two ink sections in a row except the closing band into the footer, as in the comp.
11. **What I do layout:** each of the three ways is a row (numeral and Cinzel title left, body plus "You get" and "Suits" right, hairlines between), not cards. "For schools" and "For creators" sit side by side on ink.
12. **About:** the story runs beside a sticky ink mark panel (stacks on phones). It holds the photo placeholder until Kalid supplies one. Principles are a numbered list on ink. "Elsewhere" (a structural label, not copy) introduces the three links.
13. **Placeholders** are dashed brass tags on Kalid's machine and HTML comments on the live site. A line that would be empty without its placeholder (LinkedIn in the footer, the email line on /book) is left out entirely in production rather than shown half-finished.
14. **Motion:** sections after the hero fade and lift 12 px over 250 ms the first time they scroll into view. Anything already on screen at load doesn't animate, and nothing moves with reduced motion. Buttons and links change over 200 ms. The "→" on more-links nudges 4 px on hover.
15. **Notes** keep the old essay renderer's pull quotes (brass rule on the inline-start side) and footnotes as sidenotes in the right margin from 1180 px up, under the paragraph below that. The drop cap is retired with the newspaper.
16. **Social cards** (1200 × 630): ink ground, white mark at 300 px, brass-light kicker, Cinzel title, "Kalid Nur" in Inter Tight. One per page; notes use the Notes card.
17. **Old addresses redirect** (301): /essays to /notes, /workshop and /teaching to /work-with-me, /why-kids and /principles to /about, /editions and /obituaries to /notes, /ar and /ask to home.
18. **Measure:** every column body is capped at 64ch, so stacked columns on tablet don't run to 90 characters. Paragraphs use `text-wrap: pretty`; centred leads use `balance`.
19. **Hover on the ink button is brass** (a state, not a resting fill, so the one-brass-thing rule still holds at rest). The brass masterclass button hovers to ink; the brass-light button on dark hovers to paper.
20. **The page canvas is ink** (`html` background) and the body is paper. On a short page the space under the footer reads as more footer. This replaced pinning the footer with a flex column, which made the footer shift on font load on /book (Lighthouse CLS 0.175, now 0).
21. **Footer** is right-aligned beside the logo from 1024 px up, as in the comp, and one left-aligned column below that.
22. **ui-critic suggestions not taken,** with reasons: hiding the hero mark on phones (SPEC.md says it stacks, smaller); new kickers on Notes, Book and Principles (would be invented copy); hyphenating "11 to 18 year olds" (Kalid's wording); a button-shaped booking placeholder (a button that goes nowhere is worse than an honest placeholder).

**24 November 2026 (Work, Video and Branding pages, per docs/rebrand/WORK-SPEC.md)**
23. **Naming apps is now allowed.** CONTENT.md said not to name apps; WORK-SPEC.md is Kalid's newer, locked instruction and names them. The checks still block the old newspaper-era names and everything on the spec's "Leave out" list.
24. **Header collapses below 1080 px** (was 960), because six links and the button need more room. From 1080 to 1239 the link gaps tighten to 32 px.
25. **/work "All" view interleaves** systems, video and brand (one of each, then round again), each kind in its own `order`. A column masonry otherwise reads as three separate lists. Filtered Systems and Brand views, and the /branding grid, use a row-ordered grid (every tile in them has the same ratio, so rows end level). All and Video stay masonry, as the spec asks for native ratios.
26. **Cards:** picture, then a type line in ink-3 (not brass, to keep brass down to the "Live" square and link underlines), Cinzel title at 24 px, one-line summary, client · year · versions. "You're looking at it" is part of the type line, not a chip. No borders or shadows.
27. **Video tiles:** poster image first (lazy), a `<video preload="none">` that only gets a source on first hover. Muted preview on hover with a mouse only, with a sound toggle; nothing plays by itself, and nothing previews with reduced motion. On touch, a tap opens the player. Without JavaScript the tile is a link to the file. 9:16 tiles are capped at 440 px tall on phones in the mixed list.
30. **Systems pictures:** a 1440 × 900 screenshot of each live link. No link means the ink title card, never a fake screenshot. Case studies with no screenshot open on the stats row instead of an ink block repeating the title.
33. **Closing bands:** /video and /branding close on their own titles with no lead line (the home lead is about fixing gaps, not footage or logos). Brand case studies use the /branding close.
34. **Client permission:** `needsPermission: true` items show a "Confirm with client before launch" tag on Kalid's machine only, carry a hidden reminder in the page, and fail `npm run checks:prod` until set to false. `public: false` hides an item on the live site and tags it "Hidden on the live site" locally.
35. **Case studies with a story** (25 Nov 2026, ROOB and Hifz): the body can place media between its sections with one marker per line: `{{image N}}` (full width), `{{gallery N N …}}` (2 to 4 across, two across on phones), `{{motion}}` and `{{quote}}`. The first image is the hero. Older case studies, with no markers, are unchanged.
36. **Logo animation** (ROOB): silent, looping, shown at full width. The markup has no autoplay: site.js starts it once it's on screen, unless the visitor prefers reduced motion, so they (and anyone without JavaScript) see the poster frame only. It has a "Pause animation" button, since it loops for longer than five seconds.
37. **Arabic in copy:** `{{ar:…}}` in any work file becomes a span with `lang="ar"` and `dir="rtl"`, set in the site's Arabic font stack. On a line of its own it becomes a large display line. Arabic is never an image of text, except the logo itself and the client's review card.
38. **Newest first on /work:** a negative `workOrder` puts an item ahead of the mixed grid. ROOB, the ROOB reel and the Hifz logo lead /work. On /branding they sit second and third, after your own rebrand. On /video the reel goes last, so the existing order stays as it was.
