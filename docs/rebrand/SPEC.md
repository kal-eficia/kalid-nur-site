# Kalid Nur site: rebrand spec (locked)

The weekly-newspaper concept is retired. This is a fresh structure: a calm, professional personal site for an analyst who builds with AI and teaches others to. Its job is to get the right businesses, schools and creators to book a call.

Read alongside:
- `docs/rebrand/DESIGN.md`: the design system (wins over `docs/DESIGN.md`)
- `docs/rebrand/CONTENT.md`: every word on every page (wins over `docs/CONTENT.md` for copy; the "Never on the site" rules in both still apply)
- `reference/rebrand/home-comp.png`: the homepage, designed. Match it closely on desktop and make it excellent on mobile.

## Keep from the current project
- The Express server, `content/` markdown loading, `scripts/` (shots, checks, lighthouse), the Fly.io config and Dockerfile.
- `docs/UX-REVIEW.md` review loop and the `ui-critic` subagent: run them after each phase, against the new DESIGN.md.
- Essays in `content/essays/` (they become **Notes**).
- The "Ask" feature in `server/ask.js` stays in the code but is **not linked** from the new navigation for now.

## Retire
Editions, masthead, classifieds, obituaries, workshop shelf, Arabic edition switch, "Who's reading?" switch, newspaper ornaments and the Morning/Evening Edition palettes. Don't delete their content files: move them to `content/_archive/` so nothing is lost.

## Site map
| Route | Page | Purpose |
|---|---|---|
| `/` | Home | The comp. Hero, what I do, how I work, who I work with, about teaser, masterclass, final call to action |
| `/work-with-me` | What I do | The three ways to work together in more depth, plus who each suits and what you get |
| `/about` | About | The story, the mark, principles |
| `/notes` and `/notes/:slug` | Notes | Short writing (existing essays) |
| `/masterclass` | Team of One | Free masterclass details and the sign-up link |
| `/book` | Book a call | Redirects to the booking link in `server/config.js` (`BOOKING_URL`); until it's set, shows a short page with the email address |
| 404 | Not found | Branded, with links home and to book |

Navigation: What I do · How I work (anchor on home) · About · Notes · **Book a call** (button). Mobile: logo + "Book a call" + menu button; full-screen menu on ink.

Footer (ink): reversed logo, the nav again, socials (Instagram @analystkal, X @sonofishmael_, LinkedIn: `[KALID: LinkedIn URL]`), "Teaching 11 to 18 year olds? See Excelia →" linking to excelia.eficiatech.com, "© 2026 Kalid Nur · No trackers".

## SEO and sharing
- Title pattern: "Page · Kalid Nur". Home title: "Kalid Nur · I find the gap. Then I build the fix."
- Meta description per page from CONTENT.md.
- Open Graph image per page, generated with the existing `scripts/og` approach, restyled to the new brand: ink ground, white mark, Cinzel title.
- Favicons from `public/brand/` (svg + 32 png + 180 apple-touch-icon + 192/512 manifest icons). Theme colour #16140F.
- JSON-LD `Person` on home: name Kalid Nur, jobTitle "AI consultant, builder and trainer", sameAs the socials.
- No analytics, no cookies, no third-party scripts. Fonts are self-hosted.

## Build order
Kalid's instruction: **build it all in one go, without stopping for approval between phases.** After each phase, run the review loop (`npm run shots`, look at every screenshot at 390, 768 and 1440 wide, fix what's off, `npm run checks`), log decisions in DESIGN.md, then carry on.

1. **Foundation.** New tokens, fonts, favicons, base layout, header, footer, mobile menu. Archive the retired content and routes.
2. **Home.** Build to the comp, section by section, with the copy from CONTENT.md.
3. **Inner pages.** What I do, About, Notes (list and article), Masterclass, Book, 404.
4. **Polish.** Motion, focus states, OG images, JSON-LD, meta, Lighthouse (aim for 95+ on all four scores, mobile), accessibility pass, a final full screenshot review against the comp.

## Done means
- Every page matches DESIGN.md, and the home page is a close match to the comp at 1440 wide.
- No placeholder is shown as if it were real: anything marked `[KALID: ...]` in CONTENT.md renders as a visible placeholder only in development, and `npm run checks:prod` lists them.
- `npm run checks` passes, Lighthouse mobile is 95+.
- `docs/rebrand/REPORT.md` written: what was built, screenshots, decisions, and the list of `[KALID: ...]` items still open.
- **Do not deploy.** Kalid deploys once he has filled the placeholders.
