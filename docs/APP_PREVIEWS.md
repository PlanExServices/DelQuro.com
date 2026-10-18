# Product preview images

The catalog's `preview` object controls each card and its native product-page gallery. Readiness remains in `availability`; a screenshot never upgrades a release stage.

## Image types

- **App screenshot:** a real public interface, including prototypes with their existing limitations.
- **Demo screenshot:** an explicitly public demo with sample data (ChoreMouse and What List).
- **Access screen:** Megatory Live's clinic clock registration gate. It is not an inventory dashboard.
- **Offline build preview:** S.O.L.A.R. build 2026.07.30-5, captured locally without starting a quest. Public hosting remains unavailable.
- **Concept preview:** original vector artwork for Connect, VetForm GO, VMTA and Note Thyme. These are illustrations, not screenshots of private or released UI.

## October 18, 2026 captures

Seventeen images cover nine products: AI Quest, ChoreMouse, PlainSlang, What List, DelQuro Zen, Cat's Journey, Megatory Live, AI Scripts Library and S.O.L.A.R. The first eight were captured from their public app, demo or access interface; AI Scripts uses this site's unchanged template interactions. S.O.L.A.R. uses its isolated offline setup screen. No login, registration, payment, progress edit, patient record or staff screen was captured for publication.

The source destinations are the approved public launch URLs already in `catalog/products.json`, the site's own AI Scripts page, and S.O.L.A.R.'s versioned static source. Screens and capture dates are explicitly captioned. PlainSlang's empty outer page margins were cropped; its interface was preserved.

## Asset rules

- Approved WebP files live in `assets/app-previews/`. Full images total about 583 KB; each also has a smaller card variant.
- Preserve the entire captured interface: frames and galleries use `object-fit: contain`. Use original width/height, descriptive captions, lazy loading and local paths.
- Raw captures and private provenance receipts remain outside the public repository. Never copy an authenticated clinic session or a screen containing actual patient/staff records into this folder.
- Do not manufacture a screenshot to fill a gap. Use the explicit concept type until an approved screenshot exists.
- Update the manifest first, then run `node scripts/generate-site.mjs`. Product pages and cards share `scripts/product-previews.mjs` and `app-store.css`.
- Galleries are ordinary image links in a keyboard-focusable scrolling region. They work without JavaScript and respect reduced motion.
- Run the generator, catalog, links, SEO, browser and container checks before publishing. `tests/app-previews.spec.mjs` verifies preview types, image loading, keyboard enlargement, phone layout and clinic gates.

The preview refresh preserves all owner release decisions, private-product exclusions, clinic access gates, legal content, William's media and AI Scripts interactions. It adds no ratings, download counts, purchases or tracking.
