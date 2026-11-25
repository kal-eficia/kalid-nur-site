# UX review loop (run at the end of every phase)

*Rebrand, Nov 2026: shots are taken at 1440, 768 and 390 wide; the states are listed in `scripts/site.mjs`; judge against `docs/rebrand/DESIGN.md` and `reference/rebrand/home-comp.png`. The newspaper-only checks (MCQ patterns, drop cap, Evening Edition) are retired.*

You can't judge a page from code. You judge it from pixels.

## 1. Screenshot script (build it in Phase 1)
`scripts/shots.mjs` (Playwright 1.47.2). `npm run shots` must:
- expect `npm run dev` to be running (start it if not),
- capture every state below at **1440 × 900** (desktop) and **390 × 844** (mobile), `deviceScaleFactor: 2`, full page,
- save to `shots/<phase>/<state>-<width>.png`,
- print console errors and page errors and fail if there are any.

States (add each as it comes into existence):
1. `front`: the front page
2. `front-evening`: Evening Edition (Phase 6)
3. `front-reader-business`, `front-reader-school`, `front-reader-parent` (Phase 6)
4. `editions`, `edition-past` (Phase 2)
5. `workshop`, `workshop-filtered`, `workshop-item`, `obituaries` (Phase 3)
6. `teaching`, `lesson-midway`, `lesson-done` (Phase 4)
7. `why-kids`, `principles`, `essay`, `work-with-me` (Phase 5)
8. `palette` (Phase 6)
9. `front-ar`, `why-kids-ar` (Phase 7)
10. `ask-empty`, `ask-answer`, `ask-refusal` (Phase 8)
11. `404` (Phase 10)
12. `focus`: keyboard focus on the primary action (Tab until it's there)
13. `nojs`: the front page and workshop with JavaScript disabled

## 2. Self-critique
Open each screenshot (read the PNGs) and check it against `docs/DESIGN.md` section 8, item by item. Then run the **ui-critic** subagent for an independent pass: give it the screenshot paths and DESIGN.md, not your opinion.

Write findings to `shots/<phase>/REVIEW.md`:

| # | Screen | Problem | Severity (must / should / nice) | Fix |
|---|---|---|---|---|

## 3. Fix and repeat
Fix every "must" and "should". Re-shoot. Repeat until the ui-critic returns no "must" or "should". Two rounds minimum.

## 4. Automated checks (`scripts/checks.mjs`, `npm run checks`)
- **Em dash lint:** fail if any file in `public/`, `content/`, `server/views/` or `docs/` contains U+2014.
- **Banned words:** fail if any visible text contains a word from `../../banned-words.md`.
- **Forbidden topics:** fail if any page text, metadata or alt text matches `/data analyst|transport for london|\bTfL\b/i`.
- **Placeholders:** `npm run checks:prod` fails if any rendered page contains `[KALID:`. The normal run lists them as a to-do for Kalid instead.
- **Colour lint:** fail on any hex colour in `public/css/` outside the `:root` token blocks.
- **Spacing lint:** fail on any margin, padding or gap outside the DESIGN.md scale.
- **No third parties:** load every page in Playwright and fail on any request to a host other than localhost.
- **Links:** every internal link returns 200.
- **Accessibility:** every page has one `h1`, every image has alt text, every interactive element is reachable by Tab, contrast AA for token pairs in both editions.
- **MCQ pattern check (Phase 4):** fail if correct-answer positions repeat back to back, run in sequence, or alternate.
- **Weight:** front page HTML + CSS + JS under 150 KB (fonts excluded).

## 5. Report to Kalid
End every phase with:
- the 3 or 4 most important screenshots (paths), desktop and mobile,
- the stop gate from SPEC.md, one line per clause, pass or fail,
- the list of `[KALID: ...]` placeholders still open,
- "Claude Code used": any feature used for the first time and why (one or two lines each),
- "Tip": one thing that would make Kalid faster next time,
- then **stop** and wait for "go".
