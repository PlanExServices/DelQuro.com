# DelQuro.com

The canonical editing home for [DelQuro Labs](https://www.delquro.com/) is
[PlanExServices/DelQuro.com](https://github.com/PlanExServices/DelQuro.com).
The site uses static HTML, CSS, and native JavaScript. No application framework
or runtime npm dependency is required. The published image contains only public
site files.

## Catalog and shared layout

Edit `catalog/products.json`, then run `node scripts/generate-site.mjs`. Commit
the generated HTML. The generator produces the homepage, catalog, detail pages,
availability sections, sitemap, and shared navigation/footer. Supporting-page
bodies and the interactive AI Scripts library stay hand authored. Homepage
sections, including client website mockups, are defined in the generator.

As reviewed on October 15, 2026, `catalog/products.json` is a curated,
public-only manifest of 16 entries. Its four availability stages are
`available` (2), `preview` (6), `limited-access` (2), and `in-development`
(6). A listing describes what visitors can currently access; it does not by
itself certify a production release. Keep the private project inventory
outside this repository. Add a public listing only when its identity, access
path, and release wording have been reviewed. Do not add unshipped feature
claims or infer a launch from the existence of a repository or working URL.

## Preview and verification

Run `node scripts/preview.mjs` and open http://127.0.0.1:4173/. This local review
server does not replace production nginx verification.

Run `npm run check` for generated-file consistency, catalog gates, local assets,
and anchors. These checks use Node only and do not require dependency installation.
Run `npm run check:external` to make read-only GET identity checks of linked
product destinations. This confirms the responses observed at check time; it
does not establish product release readiness, application security, or that a
service is suitable for unrestricted public use.
Browser verification uses the development-only Playwright dependency:
`npm ci`, `npx playwright install chromium`, and `SITE_URL` pointing to the site
under test (default http://127.0.0.1:8080), then `npm run test:browser`.

GitHub CI builds the image, validates nginx, and tests actual response statuses,
headers, caching, redirects, publication boundaries, media ranges, and browser
behavior. Run the same container checks with
`node scripts/check-nginx.mjs http://127.0.0.1:8080`.

React Bits adaptations and source revision are recorded in
`THIRD_PARTY_NOTICES.md`; the full license ships at
`assets/react-bits-LICENSE.txt`. Persistent project context lives in
`memory/PROJECT.md`.

## Publishing and repository history

Read [DEPLOYMENT.md](DEPLOYMENT.md) before a release. The user approved the
website release on October 15 and PR #9 was merged into main at `dcb43fe`.
The owner manually deployed `56b0581` through Coolify; the refreshed live site
passed its server, internal-link, and browser checks. Coolify Auto deploy is on,
but GitHub webhook delivery still needs verification; see the deployment notes.
The approval covers this website release only. DNS and linked-app changes remain
outside scope. Do not force-push or put a token in a remote URL.

`PlanExServices/delquro-site` is an older marketing site;
`PlanExServices/DelQuroLabs` is a separate site concept; and
`DelQuroLabs/DelQuroLabs.app` is a different product launchpad. Confirm hosting
connections before archiving or removing any repository.
