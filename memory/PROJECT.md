# DelQuro.com project memory

## Refresh — 2026-10-11

User approved a separate checkout from main, incorporating PR #8's 30-entry
product map without merging #8 or #7. Base main is
`86e7a133b3247140ac5458324ea3976a86166209`; catalog reference is PR #8 at
`be07b229f5bbefb77ab9f027b04962b311e10bca`.

The source of truth is `catalog/products.json`. There are 30 entries across seven
categories, including nine directly launchable apps and two studio entries.
DelQuro Connect and VMTA offer detail/contact actions pending security releases.
S.O.L.A.R. is a K–12 learning game. Megatory Live serves veterinary inventory.
Do not copy unshipped veterinary feature claims from PR #7.

Keep dark teal DQ branding, plain language, and the existing static architecture.
React Bits' four treatments have native website-specific adaptations; keep the
full source notice in `assets/react-bits-LICENSE.txt`.

Global preferences were saved to `C:\Users\plane\.codex\AGENTS.md`. A fresh
ephemeral, read-only Codex session received both preferences without them being
included in its prompt. Evidence is saved outside the repository at
`C:\Users\plane\Nexus-Forge\shared-preferences-verification.txt`.

Production deployment, merging, DNS, and linked-app changes are excluded.

## Delivery state

Draft PR: https://github.com/PlanExServices/DelQuro.com/pull/9 on
`codex/delquro-refresh`. The first container CI run successfully built the pinned
nginx image and passed all response/publication checks. Browser CI also verifies
touch, no-JavaScript browsing, reduced motion, media playback/seek, and aliases.
See the PR's latest checks for final status rather than assuming a stored result.

The main-branch AI Scripts page was an inert placeholder despite advertising
controls. It now contains eight original, editable local templates, with search,
type/recommended filters, random selection, copy, and a selectable-text fallback.
It remains a prototype, without a hosted AI service. All templates remain readable
without JavaScript. The existing introduction video still has no captions or
transcript; that limitation is recorded for future media work.

Local preview: `node scripts/preview.mjs` at http://127.0.0.1:4173/.
Screenshots and the final verification report are saved outside the published
repository in `C:\Users\plane\Nexus-Forge\delquro-com-refresh-evidence`.

## Logo and founding-year follow-up — 2026-10-11

The user confirmed the founding year is 2022. The homepage hero reads
`DQ / EST. 2022`. An attempted flat vector substitution changed the identity
of the original dimensional DQ mark, and the user rejected it. Preserve the
original logo artwork. The original PNG sources have cleaner edges than the
lossy WebP versions; use `dq-lockup.png` in the hero and `dq-mark.png` in
navigation, footer, and the 404 page. Do not substitute the flat vector mark.
