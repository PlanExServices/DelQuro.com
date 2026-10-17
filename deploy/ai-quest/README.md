# Public AI Quest container

This directory holds the original standalone AI Quest 1.9.0 build for `https://aiquest.delqurolabs.app`. It is separate from the existing private Sites version and the authenticated Warehouse snapshot. It contains 180 lessons, 30 worlds, 749 resources, 420 decisions, 60 bespoke scenes and 138 responsive WebPs.

Only `site/index.html`, `site/maintenance.json`, hashed `site/assets/` bundles and `site/art/` WebPs enter the served image. `release-manifest.json`, this document, configuration, exporter scripts, canonical source, project memory and artwork prompt/provenance files are not served. The public maintenance report excludes source snapshot paths, reviewer identity, local candidate identifiers and raw fetch errors.

## Rebuild and verify

From the repository root, with the canonical AI Quest checkout and its existing dependencies installed:

```powershell
node scripts/export-ai-quest.mjs --source ../ai-quest
node scripts/export-ai-quest.mjs --source ../ai-quest --check
node scripts/check-ai-quest-host.mjs --static
```

The exporter refuses dirty canonical runtime inputs and checks that its 170 source hashes remain unchanged during export. TypeScript and Vite run against the original source with a fresh temporary output directory; no route, storage, font or source adaptation is made. It copies only allowlisted delivery files and verifies every artwork hash against canonical input bytes. Repeating this export produced identical output hashes and manifest. The 1.9.0 count/version checks are intentional; review and update them for a later content release.

## Container and HTTP verification

Build from the repository root; the Dockerfile-specific ignore is required because the root website image excludes this deployment:

```sh
docker build --file deploy/ai-quest/Dockerfile --tag delquro-aiquest:review .
docker run --rm -d --name delquro-aiquest-review -p 127.0.0.1:8081:80 delquro-aiquest:review
docker exec delquro-aiquest-review nginx -t
node scripts/check-ai-quest-host.mjs http://127.0.0.1:8081
docker stop delquro-aiquest-review
```

Coolify build context: repository root. Dockerfile: `/deploy/ai-quest/Dockerfile`. Container port: **80**. Health path: **/health**, expecting HTTP 200 and `ok`. No application environment variable or API key is needed. The root website Dockerfile and deployment are separate.

The HTTP checker verifies all 142 delivery bodies, MIME types, caching and security headers, hash-route entry pages, health, HEAD and genuine 404s for missing/private paths. HTML and maintenance JSON require revalidation; hashed JS/CSS are immutable for one year; stable artwork filenames revalidate after one day. Missing assets never receive index HTML or immutable caching.

## Public behavior and boundaries

Navigation uses URL fragments, so `/#course` and `/#library` work without server-side SPA fallback. The bundle makes no provider API calls. The original Google Fonts CSS import remains: CSP permits styles from `fonts.googleapis.com` and fonts from `fonts.gstatic.com`; application connections remain same-origin. Browsers can use local fallback fonts if those hosts are unavailable.

Learner progress, notes and preferences stay in this browser and origin. This public domain starts with its own storage, distinct from Sites and Warehouse; users transfer progress explicitly through validated export/import. No learner storage, account credential or live database was read during preparation.

## Local evidence — 2026-10-15

- Canonical source commit: `0c4ba03f8fd7064a7cb94a1930e27485cab28543`, with the same 1.9.0 runtime inputs as `1b69db6feab35c199b6eaba98ea99bd0372bfbad`.
- Registry SHA-256: `ef396085dfa758848af0548f5c2dfa574c807e5ae7878925406156e58c7dfce9`.
- Release-manifest SHA-256: `8cd6792d5b4abaef4e4fb1cc232a600f1efddc362870828725e02bd645d3a044`.
- 170 input hashes, 142 served files, **6,558,735 bytes**, all 138 WebPs byte-identical to canonical and fully raw-decoded.
- Two full exports produced identical manifest/delivery hashes. TypeScript, Vite production build, exporter check, structural host check and owned-file whitespace checks pass. Vite's existing large-chunk advisory remains.
- Docker is unavailable on this Windows host. Container build, `nginx -t` and the real nginx HTTP checks are **not run locally**; CI must supply those results before hosting. Structural checks do not claim live verification. Hosting/account changes, commits/pushes and publication are coordinator-owned.

## Verified public release — 2026-10-15

Hosting PR #10 merged as `86a7794ad7ce635869f9bfccd30f1286f9c92d25` after CI run `38774669714` passed both container jobs at reviewed head `19988712501eef21f90a55bd5bc6b6864dbc3e88`. That CI supplies the Docker build, nginx configuration, actual HTTP and isolated browser verification omitted locally.

Coolify application `ndxae4qh1ehoudeinw7hxryh` uses this Dockerfile on main, context `/`, port 80 and the requested HTTPS domain. Deployment `jtj1jid4ohqtmlq9azgaohcs` built the merge above and became healthy at 17:09:37 UTC. The existing DNS matched the server without a record change. `https://aiquest.delqurolabs.app` passes all eight host-check groups, including all 142 byte hashes and private/missing-path exclusions. HTTP redirects 302 to the same HTTPS address; TLS verification succeeds normally. Preserve this separately hosted public version alongside the original private and Warehouse versions.

All three launch browser tests pass against the public HTTPS domain using fresh Edge contexts. They verify the 1.9.0 dashboard and illustrated search, 375px navigation without overflow, lesson feedback, one-time XP across reload, and official progress export/import into a second fresh context. Independently reviewed 1440px desktop and 375px phone screenshots confirm the deployed layout. Completion tests did not use a normal learner profile.
