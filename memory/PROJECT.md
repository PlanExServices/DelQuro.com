# DelQuro.com project memory

## MFCC portfolio screenshot refresh — 2026-10-15

The user requested an updated project image on DelQuro.com. The MFCC mockup
now uses assets/client-mockups/mfcc-preview-2026-10-15.jpg, a fresh capture of
https://mfcc.delqurolabs.dev/ with the watermark removed. The JPEG is normalized
to the existing 1280 by 800 card dimensions and optimized for delivery. The
new filename prevents reuse of the prior cached, watermarked screenshot.
The old screenshot is removed; preview labels, link, dimensions and alt text
are preserved. Publication follows passing generation, catalog, link and
container CI checks. Retain all other catalog releases and product access gates.


## Verified automatic website deployments and Garden recheck — 2026-10-15

The owner requested fixing GitHub deployment webhooks and an independent agent
to remove the Garden 21+ card. Fresh direct requests to both apex and www
homepage/catalog/sitemap match the current generated files; Garden and PlotPerks
are absent and the old PlotPerks detail route returns 404. No additional catalog
edit or deployment was necessary.

**VERIFIED:** GitHub webhook `698684385` now sends JSON push events to
`https://coolify.delquro.com/webhooks/source/github/events/manual`, with SSL
verification, Active enabled, and the matching saved website GitHub secret.
Coolify website application `alzcv5djn75qglgxi0du9zyx` uses
`PlanExServices/DelQuro.com`, `main`, `HEAD`, and Deploy on push (webhooks).
The API deploy URL is a different integration and must not be substituted.

Fresh push `afe543d9722c2cf2c922410e58e3706c89f7d659` produced GitHub delivery
`d7f428f4-c8cd-11f1-9e80-896c43e57fef`, returning HTTP 200 with status success,
Deployment queued, and website deployment `do1gzoxivy0mkuxzcrepoaar`.
Coolify records source **Webhook** and completed the healthy rolling update at
19:23:50 UTC (3:23:50 PM Eastern). Both container CI jobs passed run
`38793452664`; generation/catalog/local links passed (924 references, 147
anchors), and production passed all 35 nginx checks and 79 crawled internal URLs.

The repository originally had no hook; early tests then failed due to the
mismatched secret. Using the copy button specifically for the website's saved
GitHub secret, followed by the owner's paste/save in GitHub, fixed the problem.
No secret value was displayed, entered, or submitted by the agent during that
transfer. An earlier exposed GitLab field was hidden and the owner was asked
to rotate that secret. Keep credentials out of project notes and chat.

Failure-analysis lessons: an HTTP 200 ping proves reachability only; inspect the
push response body and matching Webhook deployment. Coolify accepts shorthand
repository names. Its audit deduplicates similar signature failures across apps
for five minutes, so an AI Quest-only failure row does not prove the website was
skipped. Browser password values are redacted; never infer their actual length.

## Catalog artwork and William intro correction — 2026-10-15

**VERIFIED LIVE:** PR #12 merged as `4c51e199db3c6698841c39c907aa457afe158ae0`
after both container CI jobs passed run `38775985082` on reviewed head
`b8eedb38ab365bb5cdff7d6863ba1b41db8ea81b`. Manual Coolify deployment
`vgcrscpleah3bs6pu3actrzf` succeeded in 59 seconds. Production passed 35 nginx
checks, 79 internal URLs, and all 18 website browser tests. The live opening
poster matches the reviewed frame byte for byte. PlotPerks' former page and
both character-sheet assets return genuine 404s. Screenshots and receipts are
in the task's external `cards-video-2026-10-15` evidence folder.

The owner clarified that PlotPerks is not public. Remove it from the manifest,
homepage, catalog, sitemap, icons, and published detail pages; its now-empty
Garden category is removed too. Do not restore it because its URL responds.
The combined public catalog has 16 entries across six categories: two available,
six public previews, two clinic-access listings, and six in development.

Product cards now receive larger, distinct conceptual illustrations with an
accessible link to each product's details. Preserve honest stage labels and
limitations; the illustrations are not screenshots or claims of shipped UI.
Keep no-JavaScript navigation and static touch/reduced-motion presentations.

The character sheet shown before William's video was the old poster image,
not a frame inside the clip. Inspection of the first 24 video frames confirms
the clip already begins with William in the studio. The replacement poster,
`assets/william-intro-poster.jpg`, is the actual first frame at 720 by 1280.
The unused character-sheet JPG/WebP are removed; video/audio timing is unchanged.
The new poster URL prevents reuse of the old cached opening image.

The generator, catalog, and local-link checks pass (885 references, 139 anchors).
All 18 browser cases passed across the full run and a targeted rerun after
correcting the artwork-hover target in the test. Independent visual review
covered all 15 illustrations, mobile overflow, privacy, and the opening poster.
The stylesheet is versioned to avoid mixing new markup with cached old CSS.
This follow-up was published under the existing website release authorization.
GitHub webhook delivery is still unverified; this release was manually deployed.
The Rollback view reported no retained images before this deployment, so a
rollback would require rebuilding a known prior revision rather than assuming
an immediately available image.

AI Quest's concurrently merged public listing is retained, with a matching
sixteenth illustration. Regenerate from the combined manifest when integrating
catalog work; do not overwrite unrelated product releases.

## AI Quest standalone public release — 2026-10-15

**VERIFIED:** `https://aiquest.delqurolabs.app` is live on a separate Coolify
application, `ndxae4qh1ehoudeinw7hxryh`, in DelQuro.com / production. Hosting
PR #10 merged as `86a7794ad7ce635869f9bfccd30f1286f9c92d25` after both CI jobs
passed run `38774669714` at reviewed head `19988712501eef21f90a55bd5bc6b6864dbc3e88`.
Deployment `jtj1jid4ohqtmlq9azgaohcs` built that merge and became healthy at
17:09:37 UTC, with a completed rolling update. The existing DNS already pointed
to the server; no DNS records were changed. Requested-domain HTTP redirects
302 to HTTPS, and normal TLS validation succeeds.

The live host passes all eight verification groups, including all 142 delivered
file hashes, MIME/cache rules, health, security headers, HEAD, and genuine 404s
for missing assets/private paths. The independent root website checker excludes
top-level deployment packages; AI Quest has its own full host checker. CI also
passes its three isolated learning/mobile/progress tests and the root website
suite. Learner progress remains browser/origin-local; transfer uses explicit
export/import. Existing private Sites and authenticated Warehouse deployments
are retained. This launch adds no paid provider dispatch or account sync.

All three fresh-context browser checks also pass against the public HTTPS host:
searchable illustrated library, 375px navigation without overflow, wrong/correct
lesson feedback, exactly 50 XP after reload, and official export/import to a
second fresh context. Desktop (1440px) and phone (375px) captures were reviewed.
No regular learner browser profile was used for completion tests.

The catalog publication adds one public available AI Quest entry with a unique
book/trail icon and illustrated preview, generated detail page and launch link.
The app's live checks precede that listing. All 17 local website browser tests,
generation/catalog/link checks pass; other product gates and all 16 prior
entries remain unchanged. The listing itself still needs its merged deployment
and live verification; do not infer those from this pre-publication receipt.

## AI Quest public hosting preparation — 2026-10-15

The user explicitly requested public AI Quest at `https://aiquest.delqurolabs.app`
on the existing Coolify server and a live DelQuro.com listing after verification.
This release starts from current main `dcb43fe992f160111142d01e8b5df0b11acd519e`;
the historical draft/older-live statements below describe earlier checkpoints.

`deploy/ai-quest/` is a separate standalone container with its own Dockerfile,
Dockerfile-specific context allowlist, nginx configuration, delivery manifest,
and public runtime snapshot. The root website image still excludes `deploy/`.
Canonical source remains the separate AI Quest project; this is a versioned
delivery snapshot, not a second editable curriculum. Source pin and reproducible
export/check instructions are in `deploy/ai-quest/README.md`.

Local verification: all 138 WebPs match canonical bytes; 142 allowlisted served
files and 170 source hashes; public maintenance metadata excludes private paths
and reviewer/candidate fields. All three isolated artifact browser tests pass,
including 375px navigation, lesson feedback, one-time XP after reload, and
official progress export/import into another fresh context. No learner profile
was read. Container HTTP checks and public HTTPS verification are release gates;
preparation alone does not establish live status. Preserve existing private
Sites/Warehouse deployments and explicit origin-to-origin progress transfers.

## Authorized release — 2026-10-15

The user explicitly approved publishing the website fixes after seeing the old
live links. This supersedes the earlier no-live-changes boundary for this website
release only; linked apps and DNS are still outside scope.

PR #9 was marked ready and merged with its reviewed head pinned to `e07a237`.
The merge commit is `dcb43fe992f160111142d01e8b5df0b11acd519e`; main-branch
CI run `38771875231` passed. The local editing home now follows `main`.

Publication was subsequently VERIFIED after the owner started manual deployment
`a8oqbjwilglxbkzsdpcmx9bp` of `56b0581`. The authenticated Coolify browser
identified project DelQuro.com, environment production, and application
`alzcv5djn75qglgxi0du9zyx`, using Public GitHub source
`PlanExServices/DelQuro.com` on main. Six sampled live files match the reviewed
release after line-ending normalization. Production passed all 31 nginx checks,
78 crawled internal URLs, and all 17 browser tests. The new product cards,
ChoreMouse preview link, and MFCC section are live at www.delquro.com.

Coolify Advanced > Deployment > Auto deploy is already set to Deploy on push
(webhooks). The application uses Public GitHub, so repository event delivery
requires a manual GitHub webhook. The observed provider URL is
`https://coolify.delquro.com/webhooks/source/github/events/manual`.
Configure the matching private secret directly in Coolify and GitHub, JSON
payloads, push events, active, and SSL verification enabled. Do not store the
secret in the repository or chat. GitHub hook existence/delivery has not yet
been verified; a future main push must create a webhook deployment to prove it.

The apex still serves HTTP 200 rather than redirecting to www. The recording's
caption/transcript gap remains. Evidence is in live-release-verification.json
outside the published tree. Release approval is already granted for this
website; linked apps and DNS remain outside scope.

## Current catalog — 2026-10-15

This section supersedes the historical 30-entry catalog and availability claims
below. The user requested current destinations, honest readiness/access labels,
and removal of private products from the public site. This work was prepared in
PR #9 on `codex/delquro-refresh`; see the authorized-release update above for
the later merge and current publication status.

The public-only manifest now contains 16 listings: one available guide, seven
public previews (including the on-site AI Scripts templates), two clinic-access
products, and six projects in development. Seven listings have verified external
destinations. PlainSlang is available; its public glossary search was exercised.
ChoreMouse links to `https://choremouse.app/` as a preview and distinguishes its
demo from the trial and subsequent paid subscription. What List uses sample
imports and does not save lists between sessions. DelQuro Zen is a sleep-sounds
prototype; Cat's Journey is an FE/PE Civil study app. PlotPerks belongs in
Garden · 21+, with on-device storage and backup limitations disclosed.

Connect and VetForm GO are clinic-access listings with contact actions only.
The Veterinary Workflow Survey is a resource, and the studio belongs under
About. Their former detail routes redirect to those public destinations.
Restricted tools, uncertain product identities, and unverified placeholders
were withheld. The detailed inventory and evidence stay outside this public
repository in the task's `catalog-audit-2026-10-15` evidence folder.

`scripts/catalog-model.mjs` defines the four stages and checks explicit public
visibility declarations. These are structural checks, not proof of release or
marketing approval. The generator stops before writing if it finds an unlisted
app page; review such files explicitly. Removed listings must also be absent
from published detail pages, icons, sitemap, and supporting-page references.
Preserve the interactive AI Scripts library and its two public aliases.

Run `npm run check:external` for opt-in HTTPS GET and page-identity checks.
Some healthy apps reject HEAD; do not classify them from HEAD alone. A working
URL, private/public source repo, login screen, health response, or successful
build does not establish production readiness or intended public access.

The candidate passed generation/catalog checks, 896 internal references,
141 anchors, and all 17 browser tests, including clinic gates, preview labels,
mobile, no-JavaScript, reduced motion, aliases, media, and AI Scripts. Critics
reviewed classifications, public surfaces, generator behavior, and screenshots.
Check the PR's exact-commit CI for nginx/container results; Docker is unavailable
on this Windows host. The live site remains the older main-branch version.

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
category-tile scenes were subsequently replaced by contained emblems. Motion
starts on hover or keyboard focus
for fine pointers, while touch and reduced-motion presentations are static.
The generated HTML contains all card content without JavaScript. The original
dimensional DQ logo remains unchanged.

## Category emblems and complete available-app previews — 2026-10-11

The seven homepage category tiles now use contained vector emblems and subtle
manifest-defined accent colors. This removes oversized artwork from behind
their descriptions while preserving the pointer spotlight, small tilt, and
purpose-linked icon motion. Mobile tiles keep enough vertical space for the
emblem and title; touch and reduced-motion layouts remain static.

PlotPerks, Veterinary Workflow Survey, and Coloring Book Forge now have
specific garden-care, survey, and coloring-page previews. All nine launchable
apps therefore have distinct previews in the catalog. Unreleased projects
continue to use abstract icon motifs without implying unshipped features.

## TechText heading clarity — 2026-10-11

The TechText adaptation on “Useful starts here.” now leaves the native HTML
heading visible and sharp. Its canvas draws only the interactive selection
frame and small technical accents. Pointer movement skips repainting while
the selected letter is unchanged. Keyboard and touch behavior, the one-time
entrance sweep, source notice, and reduced-motion/forced-colors fallbacks
remain in place.

## CI action runtime — 2026-10-11

The site-check workflow moved GitHub-maintained checkout, setup-node, and
artifact actions from v4 to v7 after the hosted runner warned that their
Node 20 runtime was deprecated. The site's verification still uses Node 22,
the pinned nginx container, and Chromium browser checks. This changes CI
tooling only, not the public site.
The runner is pinned to Ubuntu 24.04 so the announced `ubuntu-latest`
migration to Ubuntu 26.04 does not silently change container and browser
verification.

## Consolidation, client mockups, and audit — 2026-10-15

The user requested pushing unpushed website work, an audit with critics, and an
MFCC entry in a Client website mockups section. The earlier no-live-changes
boundary remains in effect. Continue in draft PR #9 on `codex/delquro-refresh`;
do not merge to main or deploy without a release request.

Consolidated cleanup commit `32438e1` with the existing refresh at `73f92b8`.
Preserved the refresh Docker allowlist and generated catalog workflow, reconciled
README/deployment notes, and removed obsolete token/force-push helper guides.
The separate Nexus-Forge refresh checkout was clean at `73f92b8` when inspected.

The new homepage section is generated by `scripts/generate-site.mjs` at
`/#client-websites`. Hero and shared footer links make it discoverable. MFCC is
Midlothian Family Chiropractic Center; `https://mfcc.delqurolabs.dev/` is a design
preview prepared for practice review. Keep the mockup label and keep it outside
app availability totals. `assets/client-mockups/mfcc-preview.jpg` is a real
1280-by-800 screenshot captured October 15 (118,543 bytes), including the existing
DelQuro preview watermark. Refresh the screenshot if the preview changes.

Independent critics reviewed integration, technical/accessibility behavior, and
UX/content. Their redirect finding led to `absolute_redirect off` and a container
assertion that `/Sounds` returns relative `Location: /Sounds/` behind a TLS proxy.
The local candidate passed generation/catalog checks, 1,366 local references,
214 anchors, and all 14 browser tests, including the MFCC section without JS.
Check exact-commit container CI on GitHub; local Windows has no Docker CLI.

The live site still matched main `86e7a13` across eight sampled files on October
15. Live issues include outdated counts/statuses, a soft 404, missing assets,
public obsolete helper files, missing security headers, and a directory redirect
to HTTP. The candidate addresses these; it is not live. The apex domain still
serves a separate 200 response, and the intro video still lacks captions or a
transcript. Confirm hosting and rollback details before any eventual release.

Detailed audit evidence and desktop/mobile screenshots are stored outside the
published tree in the task's `website-audit-2026-10-15` evidence folder under
`C:\Users\plane\.codex\visualizations\2026\10\09\01a1229a-a7af-7db1-937c-a44abf15faa4`.


## MFCC PNG proof-of-concept gallery — 2026-10-15

At the user's request, only the Midlothian project gains four real PNG captures:
desktop homepage, doctors, patient resources and mobile homepage. Their source
URLs and dimensions live in catalog/client-previews.json. Every gallery image
links to its matching live MFCC page; the primary button opens the live preview.
The four original PNGs and a local HTML sheet with live links are bundled in
assets/client-mockups/mfcc-proof-of-concept-2026-10-15.zip for sharing. Preserve
the Design preview label, no watermark, no checked dates and unchanged product
catalog. The gallery is static HTML and supports no-JavaScript navigation.
