# DelQuro.com deployment notes

## Live site and review branch

The canonical source is `PlanExServices/DelQuro.com`. On 2026-10-09 the sampled
live HTML, CSS, JavaScript, and images matched main at `86e7a13` byte for byte
after normalizing text line endings. The October 15 audit still observed the
older 23-app homepage, nginx 1.27.5, and homepage responses for missing routes.

The refreshed site is proposed in draft PR #9 on `codex/delquro-refresh`.
It is not merged or deployed. Its Dockerfile pins nginx 1.30.5 by digest and
copies only public site files. Its root `nginx.conf` returns genuine 404s,
preserves response headers, and uses revalidating asset caches. The older
configuration under `deploy/nginx/` is not used by that Dockerfile.

The observed live server does not establish the hosting application's source
branch, automatic deploy setting, or rollback method. GitHub Pages was disabled
when checked on October 9. A successful push to a review branch is not evidence
of a production deployment.

## Release procedure

1. Confirm the deployment application, repository, branch, Dockerfile path,
   automatic deploy setting, and rollback method in the hosting dashboard.
2. Fetch remote branches and compare the candidate with main and live content.
3. Run `npm run check` for generation, catalog, local asset, and anchor checks.
4. Preview with `node scripts/preview.mjs` at http://127.0.0.1:4173/. Check desktop,
   mobile, keyboard, reduced motion, and no-JavaScript behavior.
5. Require passing container CI on the exact candidate commit. It builds the
   image, runs `nginx -t`, `scripts/check-nginx.mjs`, live-mode link checks, and
   the Playwright browser suite against the container.
6. After an explicit release request, merge or publish through the confirmed
   deployment path. Verify new content, important routes, `/health`, HTTPS,
   and response headers at the public domain.

Do not change DNS, GitHub Pages, or older repositories as part of a content edit.
Do not force-push main or embed tokens in Git remote URLs. Keep review work on
its review branch until an explicit release request authorizes publication.

## Local nginx preview

`docker compose up --build` serves the candidate at http://localhost:3000/.
The container listens on port 80 and its health check uses `/health`. Run
`node scripts/check-nginx.mjs http://localhost:3000` and
`node scripts/check-links.mjs http://localhost:3000` against it. Set
`SITE_URL=http://localhost:3000` before `npm run test:browser`.

A plain local preview validates content and interactions, but does not prove
nginx configuration, image publication boundaries, or live hosting behavior.
