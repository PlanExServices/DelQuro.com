# Product preview images

Catalog `preview` data drives each card and its native product-page gallery. All 13 products have two real screenshots (26 total); no public card uses concept art or an access screen. Availability remains separate from screenshot type.

## Image types and sources

- **App screenshot:** actual public interfaces: AI Quest, PlainSlang, AI Scripts Library, DelQuro Zen, Cat’s Journey and S.O.L.A.R.
- **Demo screenshot:** ChoreMouse and What List public demos, plus isolated actual Connect and VetForm GO interfaces with synthetic team data or empty demo storage.
- **Offline build preview:** Megatory’s archived September 2026 inventory build, VMTA’s isolated development frontend, and Note Thyme’s current Expo development source. These do not establish production readiness or equivalence to a live deployment.

Captured October 18, 2026. Connect shows team huddle and time-off planning. VetForm GO shows its built-in clinical form library and empty dashboard. VMTA shows synthetic voicemail triage and rules; messages, scores and status indicators are demonstration data. Note Thyme shows a synthetic meal plan and grocery list and remains Coming soon.

Megatory shows actual sample inventory and add-item workflows instead of the clock/PIN access screen. Its archived build automatically seeds fictional sample stock. Only the tenant header was replaced with Demo clinic in the temporary capture response. The original source and live app were unchanged. Its gallery discloses that the current public destination still opens at clinic clock/PIN entry.

## Veterinary suite

The homepage and catalog group Megatory Live with Connect, VetForm GO and VMTA. Megatory retains Public preview; the other three retain Clinic access and have no public launch buttons. Catalog grouping and SEO ItemList ordering share `scripts/catalog-model.mjs`. Every product appears once in the catalog. Filters and the full listing work without JavaScript.

## Asset and capture rules

- Real optimized WebPs live in `assets/app-previews/`, with separate card thumbnails. Old versioned assets may remain for previously opened pages; only manifest-referenced images appear in current cards.
- Preserve the complete captured screen with `object-fit: contain`, true dimensions, descriptive captions, local paths, lazy loading and native image links.
- ChoreMouse, S.O.L.A.R., Megatory and Note Thyme use explicit `preview.device: "phone"`. Captures use a genuine 390×844 viewport at 2× density; decorative speaker/home indicators stay outside the image. Phone framing does not claim native-platform or store availability.
- Fresh disposable contexts and isolated local builds keep existing accounts and real records out of captures. Do not publish real patient/staff information, tenant identities, credentials or production progress. Use synthetic demo fixtures, documented outside the public repository.
- Raw captures, source hashes, temporary local app copies, fixture data and private provenance receipts remain outside the published tree. This release’s evidence folder is `all-product-screens-2026-10-18` in the task visualization workspace.
- Never invent a product interface. Obtain real source or an approved demo before listing a new screenshot card. `scripts/check-catalog.mjs` rejects cards without a useful screenshot.
- Edit the manifest, then run `node scripts/generate-site.mjs`. Product cards/galleries share `scripts/product-previews.mjs` and `app-store.css`.
- Run generation consistency, catalog, links, SEO, browser and container checks before publishing. Verify the deployed revision and live image loading after deployment Success.

This refresh preserves release stages, private-product exclusions, clinic gates, legal content, William’s media and AI Scripts interactions. It changes no linked application, account, backend or DNS setting.
