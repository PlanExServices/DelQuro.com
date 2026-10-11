# DelQuro.com

Static HTML, CSS, and native JavaScript. No application framework or runtime npm
dependency is required. The published image contains only public site files.

## Catalog and shared layout

Edit `catalog/products.json`, then run `node scripts/generate-site.mjs`. Commit the
generated HTML. The generator produces the homepage, catalog, detail pages,
availability sections, sitemap, and shared navigation/footer. Supporting-page
bodies and the interactive AI Scripts library stay hand authored.

Product availability and approved launch URLs are separate from project existence.
Connect and VMTA have detail/contact actions only, pending confirmed security
releases. Do not add unshipped feature claims. Source map: PR #8 at
`be07b229f5bbefb77ab9f027b04962b311e10bca`; this branch does not merge #8 or #7.

## Preview and verification

Run `node scripts/preview.mjs` and open http://127.0.0.1:4173/. This local review
server does not replace production nginx verification.

Run `npm run check` for generated-file consistency, catalog gates, local assets,
and anchors. These checks use Node only and do not require npm installation.
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
`memory/PROJECT.md`. Deployment, merges, DNS, and linked-app changes require a
separate request.
