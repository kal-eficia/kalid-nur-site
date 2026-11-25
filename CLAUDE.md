# Kalid Nur personal site: project memory

You are building **Kalid Nur's personal site**: a calm, professional personal site for an analyst who builds with AI and teaches others to. Its main job is to get the right businesses, schools and creators to book a call.

**Rebrand (Nov 2026):** the newspaper concept is retired. The brief is **TASK-REBRAND.md** and the locked docs are in **docs/rebrand/** (SPEC, DESIGN, CONTENT). They win over the older docs below. The original brief (TASK.md) and docs/SPEC.md are history.

## Read before every phase
1. `docs/rebrand/SPEC.md`: site map, what to keep and retire, build order, what "done" means.
2. `docs/rebrand/DESIGN.md`: the design system. Every pixel decision comes from here. (The broadsheet `docs/DESIGN.md` is archived in `_archive/newspaper/`.)
3. `docs/rebrand/CONTENT.md`: every word on every page. `docs/CONTENT.md` still holds the facts and the "never on the site" rules.
4. `docs/UX-REVIEW.md`: the review loop you run before calling a phase done.

## Reference files (read, never edit)
- `reference/portfolio-context.md`: export of Kalid's old Replit portfolio. Useful for project names and history. Its positioning ("AI engineer and consultant", data background) is **out of date**: CONTENT.md wins.
- `../../banned-words.md` and `../../eficiatech/voice-dna.md`: his voice and banned words. Apply them to every word on screen.

## Commands
- `npm install`, then `npx playwright install chromium` (once)
- `npm run dev`: server with auto-restart on http://localhost:3000
- `npm run shots`: screenshots of every page state into `shots/` (you build this in Phase 1)
- `npm run checks`: the automated checks in docs/UX-REVIEW.md
- `/phase N`: build phase N of the spec, then the review loop
- `/ui-review`: screenshot and critique the current UI against DESIGN.md

## Kalid is learning Claude Code with this build
- The first time you use a Claude Code feature in this project (plan mode, a subagent, a slash command, hooks, `/compact`, checkpoints, permissions), add one or two plain lines to your report: what you used and why. No lectures.
- When Kalid could have done something faster himself (a shortcut, a command, a better prompt), tell him in one line at the end of the phase under "Tip".

## Rules that override everything
- **Never invent facts about Kalid.** No made-up numbers, clients, testimonials, quotes, dates or project statuses. If copy needs something that isn't in `docs/CONTENT.md`, write a visible placeholder in the form `[KALID: what's needed]`. The production check fails while any remain.
- **Never mention his past as a data analyst, or Transport for London**, anywhere on the site, in metadata or in alt text.
- **No family details.** No partner, children, or family names, ages or circumstances. No student names, ever (real or made up) on public pages.
- **Clients are named only if CONTENT.md says so.** Otherwise describe them ("a company turning over more than £300m a year").
- **Imagery:** no drawings, icons or illustrations of people or animals. Geometry, objects, architecture, light, paper, ink and calligraphy are fine. The only human image is Kalid's own photo from behind, which he supplies.
- **No tracking.** No analytics, no third-party scripts, no external fonts or CDNs at runtime. Fonts are self-hosted. The only outbound calls are the Anthropic API (server side, Phase 8) and links Kalid clicks.
- **Pinned dependencies.** Use exactly the versions in `package.json`. Never upgrade. Ask Kalid before adding anything.
- **One phase at a time.** Build the phase, run the review loop, show Kalid the screenshots, then stop and wait for "go".
- **British English** everywhere. **No em dashes** (U+2014), anywhere: use a colon, a comma or a full stop.
- Plain HTML, CSS and JavaScript on the front end. No framework, no Tailwind, no icon fonts. Icons are inline SVG.
- **Use CSS logical properties** (`margin-inline-start`, `padding-block`, `inset-inline-end`) from Phase 1, so the Arabic edition (Phase 7) is a direction switch, not a rewrite.
- Accessibility is part of done: WCAG 2.2 AA contrast, full keyboard use, visible focus, `prefers-reduced-motion` respected.

## Who is who
- **Kalid**: the owner. He decides. Address him as Kalid.
- **Visitors**: business owners, school leaders, parents, Replit people, GCC clients, and curious people from Instagram, X and LinkedIn. Most arrive on a phone.
