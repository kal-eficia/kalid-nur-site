---
description: Build one phase of the site spec, then run the UX review loop and stop at the gate
argument-hint: <phase number>
---

Build **Phase $ARGUMENTS** of `docs/SPEC.md`.

1. Re-read `CLAUDE.md`, the Phase $ARGUMENTS section of `docs/SPEC.md`, `docs/DESIGN.md`, `docs/CONTENT.md` and `docs/UX-REVIEW.md`.
2. Reply first with: the files you'll create or change, any ambiguity (with your recommended option), and how you'll prove the stop gate. Then carry on unless something needs Kalid's decision.
3. Build only this phase. The stop gate's "absent" list is binding.
4. Run `npm run checks` and fix every failure.
5. Run the UX review loop (screenshots, self-critique, the `ui-critic` subagent, fix, repeat, two rounds minimum).
6. Add anything you decided to `docs/DESIGN.md` "Decisions made during the build".
7. Report to Kalid as in UX-REVIEW.md section 5, then stop and wait for "go".
