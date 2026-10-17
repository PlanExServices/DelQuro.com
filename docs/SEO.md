# DelQuro website SEO framework

Implementation and source review: October 15, 2026.

This framework makes the existing static site easier to understand, navigate,
share, and maintain. It does not establish indexing, rankings, traffic growth,
or product readiness. Record deployment and live verification separately in
`memory/PROJECT.md`.

## Page purpose and visitor intent

| Page | Visitor's task | Content to keep clear |
| --- | --- | --- |
| Home | Understand the studio and find a useful next step | What DelQuro builds; available apps; honest previews; website concepts |
| Products | Compare the public collection | Useful descriptions, categories, release stages, limitations, and detail links |
| Product detail | Decide whether the product fits | The actual purpose, current stage, release note, and permitted next action |
| About | Understand who is behind the work | Independent studio identity and the disclosed AI-rendered William character |
| Resources / Sound Library | Find a specific resource | Descriptive links and usable content without requiring JavaScript |
| Support / policies | Get help or understand account terms | Clear contact path, request instructions, and the existing policy text |

Product and audience language should describe the actual content. Avoid creating
near-identical keyword pages, padding descriptions, inventing customer outcomes,
or labeling previews as production software. Product titles and visible headings
should help people identify what a page contains. Google may choose a different
title or snippet for a particular search. [Title guidance](https://developers.google.com/search/docs/appearance/title-link),
[snippet guidance](https://developers.google.com/search/docs/appearance/snippet).

## Single metadata contract

`scripts/seo.mjs` owns canonical URLs, metadata, and structured data. The catalog
remains the authority for public product membership and release stages.

```js
import { renderSeo, applySeo, renderBreadcrumbs, publicRoutes, SITE_ORIGIN } from './seo.mjs';

// Generated page: place this inside <head>, without duplicate old SEO tags.
const metadata = renderSeo({
  path: '/products.html',
  catalog: catalogData,
  // title and description are optional, reviewed page-specific overrides.
});

// Existing content: preserves the body, scripts, icons, and non-SEO head tags.
html = applySeo(html, { path: '/about.html', catalog: catalogData });

// Optional matching visible hierarchy; style .seo-breadcrumbs in shared CSS.
const breadcrumb = renderBreadcrumbs({ path: '/apps/choremouse.html', catalog: catalogData });

// Generate sitemap <loc> entries using the same canonical route inventory.
const sitemapUrls = publicRoutes(catalogData).map(route => SITE_ORIGIN + route);
```

Every canonical page receives a unique title and description, an absolute
canonical, consistent Open Graph and social-card metadata, and one JSON-LD
graph. The framework emits these in the HTML; search engines and visitors do
not need to execute JavaScript to obtain the content.

Supporting-page defaults are in `scripts/seo.mjs`. Product `seoTitle` fields
combine the product name and factual purpose; stage labels remain visible in
the page and description. Audience and use-case copy also lives in the catalog.
Edit generated page copy in
`scripts/generate-site.mjs`, and product content in `catalog/products.json`.
Then regenerate and commit the resulting HTML. Do not edit generated metadata
by hand. Keep one clear H1 on each canonical page; the checker enforces this as
a project quality rule, not as a claim about Google's ranking requirements.

### Canonical URLs and crawler discovery

The preferred origin remains `https://www.delquro.com`. `/` and `/Sounds/` are
the canonical directory routes. Redirect aliases and the 404 page remain
`noindex` and are absent from the sitemap. Legacy aliases retain their current
destinations. A withdrawn private app must be removed from delivered files;
`noindex` and robots rules are not access controls.

The sitemap contains only reviewed, canonical public pages and is advertised
in `robots.txt`. No synthetic daily `lastmod`, `priority`, or `changefreq` values
are emitted. Google's sitemap documentation recommends accurate canonical
URLs and meaningful modification dates when available.
[Canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls),
[sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

The nginx configuration permanently redirects the apex host to www, preserving
the requested path and query. Container checks exercise that rule while local
health-check hosts keep their normal behavior. Verify the deployed redirect
before reporting it as live; no DNS change is part of this framework.

### Structured data with factual limits

| Surface | Schema | What it describes |
| --- | --- | --- |
| Homepage | Organization, WebSite, WebPage | Studio identity, owner-confirmed 2022 founding year, and canonical website |
| Catalog | CollectionPage, ItemList | The exact public cards, in their visible order, linking to internal detail pages |
| About | AboutPage | The page and its relationship to the studio |
| Support | ContactPage | The public help/contact page |
| Other canonical pages | WebPage or CollectionPage | Page title, description, URL, website, and publisher |
| Interior pages | BreadcrumbList | Home, the relevant parent when applicable, and the current page |

Graph references connect to the homepage's website and organization entities.
The catalog list references the public detail-page entities. The library does
not publish hidden app URLs, invented prices, reviews, ratings, business
addresses, software offers, or blanket SoftwareApplication claims. It does not
add FAQ markup to ordinary marketing questions. Generic WebPage and ItemList
markup describes the site; it is not a promise of a Google rich result.
[Structured-data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies),
[organization guidance](https://developers.google.com/search/docs/appearance/structured-data/organization),
[site-name guidance](https://developers.google.com/search/docs/appearance/site-names),
[breadcrumb guidance](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb).

Connect retains clinic-access contact actions. VMTA stays outside the public
catalog until its access/security release is explicitly confirmed. Private
PlotPerks and Garden 21+ remain excluded. A responsive endpoint alone does not
authorize a public listing or establish readiness.

## Release checks

Run generation consistency, catalog validation, local links, and
`node scripts/check-seo.mjs` before a release. Continue running the repository's
browser and nginx/container checks.

The SEO check inspects the produced HTML, not only the metadata helper. It
checks all canonical pages for unique titles/descriptions, one H1, canonical
and social consistency, parseable connected JSON-LD, a catalog list matching
the visible cards, sitemap coverage, crawler rules, noindex aliases, and public
app membership. It rejects unsupported commercial/rating schema and withdrawn
private catalog content. This is a local contract check, not Google's validator.

After an authorized deployment, inspect the live homepage, catalog, one
available product, one preview, and support. Confirm status 200, correct
canonical HTML, working links, and a genuine 404 for removed paths. Use Google's
Rich Results Test for supported schema and Search Console URL Inspection for
Google's view of the live page. A successful build is not proof of indexing.

Keep graphics dimensioned, lazy-load below-the-fold media, avoid autoplaying
heavy hero media, and preserve keyboard, reduced-motion, mobile, and
no-JavaScript behavior. Check real performance rather than claiming that a
visual style guarantees SEO. Core Web Vitals describe loading, responsiveness,
and layout stability; good scores alone do not guarantee a top ranking.
[Core Web Vitals guidance](https://developers.google.com/search/docs/appearance/core-web-vitals).

## Practical measurement plan

Search Console access and current traffic have not been verified as part of
this code change. Do not insert made-up baseline or improvement numbers.

1. At release, save the revision, deployment time, changed pages, and live
   checks in project memory. With owner account access, inspect the sitemap
   and a few representative URLs in Search Console. Submit the canonical
   sitemap only if it is not already submitted.
2. Export the preceding 28 complete days of Search Console query/page results:
   impressions, clicks, click-through rate, and average position. Split branded
   searches from discovery searches, and mobile from desktop. Keep the export
   outside the public repository.
3. During the first week, check indexing/canonical errors and crawl failures.
   Diagnose a discrepancy before requesting recrawls; a sitemap submission
   does not guarantee that every page will be indexed.
4. After 28 complete days, compare equivalent windows by page and query intent.
   Note small samples, release-date changes, and seasonality. Use organic
   discovery and successful visitor actions together; avoid interpreting a
   ranking change as proof that the redesign caused it.
5. Review field Core Web Vitals in Search Console/PageSpeed Insights where data
   exists. Otherwise record repeatable mobile lab measurements as lab data,
   keeping them distinct from real-user performance.
6. Improve one observed friction point at a time: unclear search wording, a
   missing answer on a product page, a broken destination, or a slow asset.
   Product click/contact measurement requires a separately reviewed analytics
   plan; this framework adds no tracking or cookies.

Search Console exposes crawl/indexing information, search queries and pages,
and real-user performance reports. Those observations should determine the next
iteration. [Search Console guidance](https://developers.google.com/search/docs/monitor-debug/search-console-start).
