// One static metadata contract for the site's generated and hand-authored pages.
// Keep product publication decisions in catalog/products.json, not in SEO copy.
import { stages, validateCatalog } from './catalog-model.mjs';

export const SITE_ORIGIN = 'https://www.delquro.com';
export const SITE_NAME = 'DelQuro Labs';
const siteId = `${SITE_ORIGIN}/#website`;
const organizationId = `${SITE_ORIGIN}/#organization`;
const image = `${SITE_ORIGIN}/assets/og-image.jpg`;
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

const supportingPages = {
  '/about.html': {
    title: 'About the Studio — DelQuro Labs',
    description: 'Meet DelQuro Labs, an independent Virginia product studio building focused apps for everyday life, and William, our AI-rendered studio character.',
    name: 'About the studio', type: 'AboutPage',
  },
  '/resources.html': {
    title: 'Resources & Sound Library — DelQuro Labs',
    description: 'Explore DelQuro resources: a veterinary workflow survey, ambient sound clips, and links to public apps, previews, and product support.',
    name: 'Resources', type: 'CollectionPage',
  },
  '/support.html': {
    title: 'Product Support & Contact — DelQuro Labs',
    description: 'Contact DelQuro Labs for product help, feedback, clinic access questions, or account assistance. Find the details to include with your request.',
    name: 'Support', type: 'ContactPage',
  },
  '/privacy.html': {
    title: 'Privacy Policy — DelQuro Labs',
    description: 'Read how DelQuro Labs handles information across its websites and apps, including data use, service providers, retention, and privacy choices.',
    name: 'Privacy policy', type: 'WebPage',
  },
  '/terms.html': {
    title: 'Terms of Use — DelQuro Labs',
    description: 'Read the terms for DelQuro Labs websites, apps, and services, including acceptable use, accounts, subscriptions, and product limitations.',
    name: 'Terms of use', type: 'WebPage',
  },
  '/account-deletion.html': {
    title: 'Request Account Deletion — DelQuro Labs',
    description: 'Learn how to request deletion of a DelQuro account and associated data, what to include, and how deletion differs from canceling a subscription.',
    name: 'Account deletion', type: 'WebPage',
  },
  '/Sounds/': {
    title: 'Ambient Sound Library — DelQuro Labs',
    description: 'Listen to rain, ocean, forest, and other ambient clips in the DelQuro Sound Library. Choose a sound and control playback in your browser.',
    name: 'Sound Library', type: 'CollectionPage',
  },
  '/404.html': {
    title: 'Page Not Found — DelQuro Labs',
    description: 'The requested DelQuro Labs page could not be found. Return home or explore the current product catalog.',
    name: 'Page not found', type: 'WebPage', noindex: true,
  },
};

function normalizePath(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) throw new Error('SEO path must be a root-relative URL');
  const url = new URL(value, SITE_ORIGIN);
  if (url.origin !== SITE_ORIGIN || url.search || url.hash) throw new Error(`SEO canonical paths cannot include a host, query, or fragment: ${value}`);
  return url.pathname === '/index.html' ? '/' : url.pathname === '/Sounds/index.html' ? '/Sounds/' : url.pathname;
}

export function publicRoutes(catalog) {
  validateCatalog(catalog);
  return ['/', '/products.html', ...Object.keys(supportingPages).filter(route => route !== '/404.html'), ...catalog.products.map(product => `/${product.detail}`)];
}

export function resolveSeo({ path, title, description, catalog, canonicalPath, noindex }) {
  validateCatalog(catalog);
  const route = normalizePath(path);
  const product = catalog.products.find(entry => `/${entry.detail}` === route);
  const defaults = route === '/' ? {
    title: 'Useful Apps & Independent Product Studio — DelQuro Labs',
    description: 'Discover focused apps for families, veterinary teams, creators, and learners. Explore available tools, public previews, and clearly labeled projects.',
    name: SITE_NAME, type: 'WebPage',
  } : route === '/products.html' ? {
    title: 'Apps & Product Previews — DelQuro Labs',
    description: `Explore ${catalog.products.length} focused DelQuro projects for home, work, and learning. Find available apps, public previews, and clearly labeled work in progress.`,
    name: 'Products', type: 'CollectionPage',
  } : product ? {
    title: `${product.seoTitle} | DelQuro Labs`,
    description: `${product.description} ${stages[product.availability].label}.`,
    name: product.name, type: 'WebPage',
  } : supportingPages[route];
  if (!defaults && !(noindex && canonicalPath && title && description)) throw new Error(`No reviewed SEO metadata for ${route}`);
  const metadata = { ...defaults, path: route, product, title: title ?? defaults?.title, description: description ?? defaults?.description, noindex: noindex ?? defaults?.noindex ?? false };
  if (!metadata.title?.trim() || !metadata.description?.trim()) throw new Error(`SEO title and description are required for ${route}`);
  metadata.canonical = `${SITE_ORIGIN}${normalizePath(canonicalPath ?? route)}`;
  return metadata;
}

function breadcrumbs(metadata) {
  if (metadata.path === '/' || metadata.noindex) return [];
  const entries = [{ name: 'Home', url: `${SITE_ORIGIN}/` }];
  if (metadata.product) entries.push({ name: 'Products', url: `${SITE_ORIGIN}/products.html` });
  if (metadata.path === '/Sounds/') entries.push({ name: 'Resources', url: `${SITE_ORIGIN}/resources.html` });
  entries.push({ name: metadata.name, url: metadata.canonical });
  return entries;
}

export function renderBreadcrumbs(options) {
  const entries = breadcrumbs(resolveSeo(options));
  if (!entries.length) return '';
  return `<nav class="seo-breadcrumbs" aria-label="Breadcrumb"><ol>${entries.map((entry, index) => `<li>${index === entries.length - 1 ? `<span aria-current="page">${escapeHtml(entry.name)}</span>` : `<a href="${escapeHtml(new URL(entry.url).pathname)}">${escapeHtml(entry.name)}</a>`}</li>`).join('')}</ol></nav>`;
}

function structuredData(metadata, catalog) {
  if (metadata.noindex) return null;
  const graph = [];
  if (metadata.path === '/') {
    graph.push({
      '@type': 'Organization', '@id': organizationId,
      name: SITE_NAME, legalName: 'DelQuro Labs, LLC', url: `${SITE_ORIGIN}/`,
      logo: { '@type': 'ImageObject', url: `${SITE_ORIGIN}/assets/dq-mark.png` },
      email: 'info@delquro.com', foundingDate: '2022',
    }, {
      '@type': 'WebSite', '@id': siteId,
      url: `${SITE_ORIGIN}/`, name: SITE_NAME, alternateName: 'DelQuro',
      publisher: { '@id': organizationId }, inLanguage: 'en-US',
    });
  }
  const page = {
    '@type': metadata.type, '@id': `${metadata.canonical}#webpage`,
    url: metadata.canonical, name: metadata.title, description: metadata.description,
    isPartOf: { '@id': siteId }, publisher: { '@id': organizationId }, inLanguage: 'en-US',
  };
  if (metadata.path === '/about.html') page.mainEntity = { '@id': organizationId };
  const trail = breadcrumbs(metadata);
  if (trail.length) {
    const breadcrumbId = `${metadata.canonical}#breadcrumb`;
    page.breadcrumb = { '@id': breadcrumbId };
    graph.push({
      '@type': 'BreadcrumbList', '@id': breadcrumbId,
      itemListElement: trail.map((entry, index) => ({ '@type': 'ListItem', position: index + 1, name: entry.name, item: entry.url })),
    });
  }
  if (metadata.path === '/products.html') {
    const listId = `${metadata.canonical}#products`;
    page.mainEntity = { '@id': listId };
    const ordered = [...catalog.products].sort((a, b) => stages[a.availability].order - stages[b.availability].order || a.name.localeCompare(b.name, 'en'));
    graph.push({
      '@type': 'ItemList', '@id': listId, name: 'DelQuro public product catalog',
      numberOfItems: ordered.length,
      itemListElement: ordered.map((product, index) => ({
        '@type': 'ListItem', position: index + 1,
        item: { '@id': `${SITE_ORIGIN}/${product.detail}#webpage` },
      })),
    });
  }
  graph.push(page);
  return { '@context': 'https://schema.org', '@graph': graph };
}

export function renderSeo(options) {
  const metadata = resolveSeo(options);
  const schema = structuredData(metadata, options.catalog);
  const title = escapeHtml(metadata.title);
  const description = escapeHtml(metadata.description);
  const canonical = escapeHtml(metadata.canonical);
  return `<title>${title}</title><meta name="description" content="${description}"><meta name="robots" content="${metadata.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}"><link rel="canonical" href="${canonical}"><meta property="og:type" content="website"><meta property="og:site_name" content="${SITE_NAME}"><meta property="og:locale" content="en_US"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${image}"><meta property="og:image:alt" content="DelQuro Labs — focused software for everyday life"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${description}"><meta name="twitter:image" content="${image}"><meta name="twitter:image:alt" content="DelQuro Labs — focused software for everyday life">${schema ? `<script type="application/ld+json" data-seo-schema>${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>` : ''}`;
}

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'))?.[2] ?? '';
}

export function applySeo(html, options) {
  if (!/<head\b[^>]*>[\s\S]*?<\/head>/i.test(html)) throw new Error(`Missing document head: ${options.path}`);
  return html.replace(/(<head\b[^>]*>)([\s\S]*?)(<\/head>)/i, (match, opening, head, closing) => {
    const clean = head.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '')
      .replace(/<meta\b[^>]*>/gi, tag => /^(?:description|robots|twitter:.*)$/i.test(attribute(tag, 'name')) || /^og:/i.test(attribute(tag, 'property')) ? '' : tag)
      .replace(/<link\b[^>]*>/gi, tag => attribute(tag, 'rel').toLowerCase().split(/\s+/).includes('canonical') ? '' : tag)
      .replace(/<script\b[^>]*data-seo-schema[^>]*>[\s\S]*?<\/script>/gi, '');
    return opening + clean + renderSeo(options) + closing;
  });
}
