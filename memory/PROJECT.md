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

## Radar integration — 2026-10-11

The user supplied React Bits' JavaScript/CSS Radar component. This site remains
static, so `radar.js` adapts the supplied WebGL renderer without adding React.
It loads only on the homepage, only when the decorative panel approaches the
viewport, and falls back to a small Canvas 2D scope where WebGL2 is unavailable.
The HTML/CSS scope remains visible without JavaScript or with reduced motion;
the animation pauses offscreen or in a hidden tab. The panel follows the
available-app section and leaves the original DQ logo artwork unchanged.
`radar.css` and `radar.js` carry source notices; the full React Bits license is
still published at `/assets/react-bits-LICENSE.txt`.

## Homepage logo GlitchText adaptation — 2026-10-11

The user requested React Bits' GlitchText treatment for the main homepage logo.
Keep the original `/assets/dq-lockup.png` image as the visible foreground; CSS
in `glitch-logo.css` adds clipped, offset copies only on hover or keyboard focus.
The effect is disabled for reduced motion and coarse touch pointers. The hero
logo is a home link so keyboard users can reach the effect. The nav/footer marks
and founding-year label remain untouched. No React runtime is needed for this
static-site adaptation. The CSS carries a source notice and links to the full
published React Bits notice.

## Useful starts here TechText adaptation — 2026-10-11

The user supplied React Bits' JavaScript/CSS TechText component and requested
it on the homepage, preferably at “Useful starts here.” The real `h2` text is
kept in generated HTML. `tech-text.js` draws the text on Canvas 2D only when
motion and canvas are available, with a one-time selection sweep, dashed
active-letter outline, frame, specks, and label. Pointer, touch, and keyboard
input can select letters; the native heading remains readable without JS or
with reduced motion/forced colors. The script is homepage-only, has no React
runtime, and stops its sweep offscreen. Source notices are in `tech-text.js`
and `tech-text.css`; the full React Bits notice remains published.

## Catalog icon and mini-card refresh — 2026-10-11

The user asked for more polished icons and interactive backgrounds on the mini
cards. Product emoji were replaced with original, consistent line artwork in
`assets/product-icons.svg`; the generator uses the manifest icon key for both
catalog cards and generated detail pages. The DelQuro Labs product continues to
use the original dimensional `dq-mark.png`, and the homepage logo is unchanged.
`refresh.css` gives product and category cards a restrained grid and a
product-colored spotlight that follows a fine pointer. Keyboard focus gets a
centered highlight; touch and reduced-motion visitors see a static surface.
The browser test verifies icon coverage, pointer/focus response, and the existing
touch and reduced-motion checks. The nginx check verifies the SVG sprite is
served with the correct content type and cache headers.

## Purpose-led card motion — 2026-10-11

Each product and category now declares a `motion` family in the catalog
manifest. The generator adds a decorative SVG-backed card scene; category
tiles use their own neutral category symbols in `assets/product-icons.svg`.
Nine motion families cover sequences, signals, swaying, scanning, building,
orbits, gliding, sparks, and breathing. They are assigned by product purpose
rather than availability. Fine-pointer movement gives a small card tilt and
positions the existing spotlight; the product-specific scene animates only
while hovered or keyboard-focused. Touch, reduced-motion, and forced-colors
presentations remain still and readable, and narrow screens show quieter
artwork. Scenes are decorative, so product text and actions stay in the
committed HTML and remain available without JavaScript. The product-card
background art was subsequently replaced by the contained previews below.

## Contained card previews — 2026-10-11

After reviewing the large icon backgrounds, the user asked for a further card
improvement. Product cards now use a 72px preview above their text, so artwork
does not run behind descriptions. Six featured apps have original, task-specific
SVG scenes: chores, a script storyboard, assistant connections, inventory rows,
plain-language exchange, and a phone form. Remaining catalog entries use a
small icon-and-progress motif tied to their manifest motion family. The
existing category-tile scenes remain. Motion starts on hover or keyboard focus
for fine pointers, while touch and reduced-motion presentations are static.
The generated HTML contains all card content without JavaScript. The original
dimensional DQ logo remains unchanged.
