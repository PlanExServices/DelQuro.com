#!/usr/bin/env node
// Inspect published HTML, not just the metadata builder's return values.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { movedPages, validateCatalog } from './catalog-model.mjs';
import { publicRoutes, SITE_ORIGIN } from './seo.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const data = JSON.parse(read('catalog/products.json'));
validateCatalog(data);
const routes = publicRoutes(data);
const canonicalUrls = routes.map(route => SITE_ORIGIN + route);
const fileForRoute = route => route === '/' ? 'index.html' : route.endsWith('/') ? `${route.slice(1)}index.html` : route.slice(1);
const decode = value => value.replace(/&(?:amp|quot|apos|lt|gt|#39|#\d+|#x[\da-f]+);/gi, entity => {
  const named = { '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>', '&#39;': "'" };
  return named[entity.toLowerCase()] ?? String.fromCodePoint(entity.toLowerCase().startsWith('&#x') ? parseInt(entity.slice(3, -1), 16) : Number(entity.slice(2, -1)));
});
const attributes = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)].map(([, name, , value]) => [name.toLowerCase(), decode(value)]));
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map(match => attributes(match[0]));
const textContent = html => decode(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
const titles = new Map();
const descriptions = new Map();
const documents = new Map();
const definitions = new Map();
const references = [];

function exactlyOne(values, message) {
  assert.equal(values.length, 1, message);
  return values[0];
}
function distinct(value, map, route, field) {
  assert(value.length > 0, `${route}: nonempty ${field}`);
  assert(!map.has(value), `${route}: ${field} duplicates ${map.get(value)}`);
  map.set(value, route);
}
function inspectSchema(value, route) {
  if (Array.isArray(value)) return value.forEach(entry => inspectSchema(entry, route));
  if (!value || typeof value !== 'object') return;
  for (const forbidden of ['aggregateRating', 'review', 'offers', 'price', 'priceCurrency']) assert(!(forbidden in value), `${route}: unsupported commercial or rating claim (${forbidden})`);
  assert(!['SoftwareApplication', 'Product', 'Review', 'FAQPage'].includes(value['@type']), `${route}: unsupported rich-result claim ${value['@type']}`);
  if (value['@id']) {
    assert.equal(new URL(value['@id']).origin, SITE_ORIGIN, `${route}: structured identifiers use the canonical host`);
    if (value['@type']) {
      assert(!definitions.has(value['@id']), `${route}: duplicate structured entity ${value['@id']}`);
      definitions.set(value['@id'], { node: value, route });
    } else references.push({ id: value['@id'], route });
  }
  Object.values(value).forEach(entry => inspectSchema(entry, route));
}

for (const route of routes) {
  const html = read(fileForRoute(route));
  documents.set(route, html);
  const head = exactlyOne([...html.matchAll(/<head\b[^>]*>([\s\S]*?)<\/head>/gi)], `${route}: exactly one head`)[1];
  const title = textContent(exactlyOne([...head.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)], `${route}: exactly one title`)[1]);
  const metas = tags(head, 'meta');
  const meta = (key, attribute = 'name') => exactlyOne(metas.filter(entry => entry[attribute] === key), `${route}: exactly one ${key}`).content;
  const description = meta('description');
  const canonical = exactlyOne(tags(head, 'link').filter(entry => entry.rel?.split(/\s+/).includes('canonical')), `${route}: exactly one canonical`).href;
  assert.equal(canonical, SITE_ORIGIN + route, `${route}: self-referencing canonical agrees with sitemap`);
  distinct(title, titles, route, 'title');
  distinct(description, descriptions, route, 'description');
  assert.match(html, /<html\b[^>]*\blang=["']en(?:-US)?["']/i, `${route}: document language`);
  const heading = exactlyOne([...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)], `${route}: exactly one primary heading`)[1];
  assert(textContent(heading), `${route}: nonempty primary heading`);
  assert(!/noindex|nofollow|none/i.test(meta('robots')), `${route}: public canonical remains indexable and followable`);
  assert.equal(meta('og:title', 'property'), title, `${route}: Open Graph title matches page`);
  assert.equal(meta('og:description', 'property'), description, `${route}: Open Graph description matches page`);
  assert.equal(meta('og:url', 'property'), canonical, `${route}: Open Graph canonical`);
  assert.equal(meta('og:site_name', 'property'), 'DelQuro Labs', `${route}: consistent site name`);
  assert.equal(meta('twitter:title'), title, `${route}: social title matches page`);
  assert.equal(meta('twitter:description'), description, `${route}: social description matches page`);
  assert.equal(meta('twitter:card'), 'summary_large_image', `${route}: social card format`);
  const ogImage = new URL(meta('og:image', 'property'));
  assert.equal(ogImage.origin, SITE_ORIGIN, `${route}: social image is locally owned`);
  assert(fs.existsSync(path.join(root, ogImage.pathname.slice(1))), `${route}: social image exists`);
  assert(meta('og:image:alt', 'property').trim(), `${route}: social image description`);
  const rawSchema = exactlyOne([...head.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)], `${route}: exactly one JSON-LD graph`)[1];
  const schema = JSON.parse(rawSchema);
  assert.equal(schema['@context'], 'https://schema.org', `${route}: schema context`);
  assert(Array.isArray(schema['@graph']), `${route}: a graph of identifiable entities`);
  inspectSchema(schema['@graph'], route);
  const page = schema['@graph'].find(node => node['@id'] === `${canonical}#webpage`);
  assert(page, `${route}: page entity exists`);
  assert.equal(page.url, canonical, `${route}: structured page URL`);
  assert.equal(page.name, title, `${route}: structured page title`);
  assert.equal(page.description, description, `${route}: structured description`);
  assert.equal(page.isPartOf?.['@id'], `${SITE_ORIGIN}/#website`, `${route}: website relationship`);
  assert.equal(page.publisher?.['@id'], `${SITE_ORIGIN}/#organization`, `${route}: publisher relationship`);
  if (route !== '/') {
    const breadcrumb = schema['@graph'].find(node => node['@type'] === 'BreadcrumbList');
    assert(breadcrumb, `${route}: breadcrumb hierarchy`);
    assert.equal(page.breadcrumb?.['@id'], breadcrumb['@id'], `${route}: page references its breadcrumb`);
    const items = breadcrumb.itemListElement;
    assert.equal(items[0]?.item, `${SITE_ORIGIN}/`, `${route}: hierarchy starts at home`);
    assert.equal(items.at(-1)?.item, canonical, `${route}: hierarchy ends on this page`);
    items.forEach((item, index) => {
      assert.equal(item.position, index + 1, `${route}: breadcrumb positions are sequential`);
      assert(item.name?.trim(), `${route}: breadcrumb names are present`);
      assert(canonicalUrls.includes(item.item), `${route}: breadcrumb destination is public and canonical`);
    });
  }
  assert(!/plot-?perks|Garden\s*(?:·|&middot;)?\s*21\+/i.test(html), `${route}: withdrawn private product remains absent`);
}

for (const reference of references) assert(definitions.has(reference.id), `${reference.route}: unresolved structured entity ${reference.id}`);
const homeWebsite = definitions.get(`${SITE_ORIGIN}/#website`)?.node;
const homeOrganization = definitions.get(`${SITE_ORIGIN}/#organization`)?.node;
assert.equal(homeWebsite?.['@type'], 'WebSite', 'Homepage defines the website');
assert.equal(homeOrganization?.['@type'], 'Organization', 'Homepage defines the studio');
assert.equal(homeOrganization?.name, 'DelQuro Labs', 'Verified organization name');
assert.equal(homeOrganization?.foundingDate, '2022', 'Owner-confirmed founding year');
assert.equal(definitions.get(`${SITE_ORIGIN}/about.html#webpage`)?.node['@type'], 'AboutPage', 'About page schema');
assert.equal(definitions.get(`${SITE_ORIGIN}/support.html#webpage`)?.node['@type'], 'ContactPage', 'Support page schema');
const collection = definitions.get(`${SITE_ORIGIN}/products.html#webpage`)?.node;
assert.equal(collection?.['@type'], 'CollectionPage', 'Catalog schema');
const list = definitions.get(collection.mainEntity?.['@id'])?.node;
assert.equal(list?.['@type'], 'ItemList', 'Catalog references a product list');
assert.equal(list.numberOfItems, data.products.length, 'Structured product count matches public catalog');
assert.equal(list.itemListElement.length, data.products.length, 'Every public product has one structured list entry');
const visibleCardIds = [...documents.get('/products.html').matchAll(/<article\b(?=[^>]*\bdata-product(?:\s|>))[^>]*\bid="([^"]+)"[^>]*>/g)].map(match => match[1]);
assert.equal(visibleCardIds.length, data.products.length, 'Visible catalog contains each public product');
const visibleUrls = visibleCardIds.map(id => {
  const product = data.products.find(entry => entry.id === id);
  assert(product?.visibility === 'public', `Visible card is a reviewed public product: ${id}`);
  return `${SITE_ORIGIN}/${product.detail}#webpage`;
});
assert.deepEqual(list.itemListElement.map((entry, index) => {
  assert.equal(entry.position, index + 1, 'Structured catalog positions are sequential');
  return entry.item?.['@id'];
}), visibleUrls, 'Structured catalog follows the actual visible cards');

const sitemap = read('sitemap.xml');
const listedUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => decode(match[1]));
assert.equal(new Set(listedUrls).size, listedUrls.length, 'Sitemap has no duplicate URLs');
assert.deepEqual([...listedUrls].sort(), [...canonicalUrls].sort(), 'Sitemap contains every public canonical and no aliases, errors, or private routes');
const robots = read('robots.txt');
assert.match(robots, /^User-agent:\s*\*\s*$/im, 'Robots rules include general crawlers');
assert.match(robots, /^Sitemap:\s*https:\/\/www\.delquro\.com\/sitemap\.xml\s*$/im, 'Robots points to canonical sitemap');
for (const [, disallow] of robots.matchAll(/^Disallow:\s*(\S+)\s*$/gim)) {
  assert(!routes.some(route => route.startsWith(disallow)), `robots.txt does not block canonical public pages: ${disallow}`);
}
const aliases = { ...movedPages, 'index-inline.html': '/', 'apps/ai-agent-scripts.html': '/apps/ai-scripts.html', 'apps/ai-prompt-scripts.html': '/apps/ai-scripts.html' };
for (const [file, destination] of Object.entries(aliases)) {
  const html = read(file);
  const metas = tags(html, 'meta');
  const robotsTag = exactlyOne(metas.filter(meta => meta.name === 'robots'), `${file}: one robots directive`);
  assert.match(robotsTag.content, /noindex/, `${file}: redirect aliases stay out of the index`);
  const canonical = exactlyOne(tags(html, 'link').filter(link => link.rel === 'canonical'), `${file}: one canonical`);
  assert.equal(canonical.href, SITE_ORIGIN + destination.split('#')[0], `${file}: canonical points to the surviving page`);
}
assert(tags(read('404.html'), 'meta').some(meta => meta.name === 'robots' && /noindex/.test(meta.content)), 'Error page remains noindex');
const allowedAppFiles = new Set([...data.products.map(product => product.detail), ...Object.keys(aliases).filter(file => file.startsWith('apps/'))]);
for (const entry of fs.readdirSync(path.join(root, 'apps'), { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith('.html')) assert(allowedAppFiles.has(`apps/${entry.name}`), `No unlisted app page may ship: ${entry.name}`);
}

console.log(`SEO verified: ${routes.length} unique canonical pages; matching titles, descriptions, social cards, connected schema, public product list, sitemap, and alias rules.`);
