import assert from 'node:assert/strict';

export const stages = {
  available: { label: 'Available', action: 'Open app', order: 0 },
  preview: { label: 'Public preview', action: 'Try preview', order: 1 },
  'limited-access': { label: 'Clinic access', action: 'Ask about access', order: 2 },
  'in-development': { label: 'In development', action: 'Ask about progress', order: 3 },
};

// Public pages moved out of the product grid retain useful destinations.
export const movedPages = {
  'apps/vet-survey.html': '/resources.html#veterinary-workflow-survey',
  'apps/delquro-labs.html': '/about.html',
};

// This public repository contains only the reviewed public listing. Keep the
// private inventory and unresolved audience decisions outside this repository.
export function validateCatalog({products, categories, reviewedOn}) {
  assert.match(reviewedOn || '', /^\d{4}-\d{2}-\d{2}$/);
  assert(products.length > 0, 'The public catalog must not be empty');
  assert.equal(new Set(products.map(p => p.id)).size, products.length, 'Unique product IDs');
  assert.equal(new Set(products.map(p => p.detail)).size, products.length, 'Unique detail paths');
  for (const p of products) {
    assert.equal(p.visibility, 'public', `Explicit public visibility required: ${p.id}`);
    assert(stages[p.availability], `Unsupported release stage: ${p.id}`);
    assert(p.description && p.releaseNote, `Description and release context required: ${p.id}`);
    assert.match(p.reviewedOn || '', /^\d{4}-\d{2}-\d{2}$/);
    assert.match(p.id, /^[a-z0-9-]+$/);
    assert.match(p.detail, /^apps\/[a-z0-9-]+\.html$/);
    assert(categories.some(c => c.id === p.category), `Category required: ${p.id}`);
    if (p.launch) {
      assert(['available', 'preview'].includes(p.availability), `Restricted/development projects cannot launch: ${p.id}`);
      assert.equal(new URL(p.launch).protocol, 'https:');
      assert(p.linkCheck?.titleIncludes?.length > 2, `Destination identity required: ${p.id}`);
    }
    if (p.availability === 'available') assert(p.launch, `Available release needs a verified destination: ${p.id}`);
    if (p.highlight) assert(p.launch, `Homepage highlights need a public destination: ${p.id}`);
  }
  for (const c of categories) assert(products.some(p => p.category === c.id), `Empty category: ${c.id}`);
}
