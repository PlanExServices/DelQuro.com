# DelQuro Labs — delquro.com

Modern high-tech startup site ("DQ/OS" design system, v5) — ink charcoal `#060C12` + circuit teal `#2FD9BC` + brushed silver, monospace engineering accents, engineering grid backdrop, terminal-style library index. Vision: *"One studio. A library of small, focused apps."*

All static references are cache-busted (`?v=5`) — deploys take effect immediately and stale-CSS rendering bugs cannot recur. nginx serves HTML as `no-cache` and versioned statics as 30-day immutable.

## Brand (Sep 2026 redesign)
- Palette matched to the adopted logo: ink `#0B1218`, teal `#2FD9BC`, silver `#C9CFCE`
- `assets/logo-mark.svg` — flat transparent monogram derived from the master art "DQ Labs logo.png" (used site-wide in topbar, CTA, footers)
- `assets/wordmark-light.svg` / `wordmark.svg` — two-tone "DelQuro Labs" text lockups
- `assets/dq-lockup.png` (59KB) — flat adopted logo lockup (monogram + wordmark, dark-bg variant), centerpiece of the home hero
- `assets/dq-mark.png` (10KB) — transparent monogram used in topbar, CTA, and every footer
- `assets/og-image.jpg` (34KB) — social card from the adopted end card
- `assets/apple-touch-icon.png`, `favicon.png`, `favicon.ico` — D-with-circuits from the flat mark
- `assets/app-icon.svg` — rounded-chip vector icon (site favicon)

## Pages
- `index.html` — centered brand hero (logo plate), library metrics (23 / 4 live / 1 studio), 6 featured volumes, category chips, principles, CTA
- `products.html` — "The Library": 23-product catalog in 7 shelves (Family, Veterinary, AI, Inventory, Create, Sleep, Build & learn, Studio)
- `apps/` — 6 expanded product pages (note-thyme, choremouse, delquro-connect, megatory-live, vmta, jarvis)
- `privacy.html` (incl. COPPA / children section), `terms.html`, `support.html`, `resources.html`, `account-deletion.html`

## Notes
- Live volumes: PlainSlang (plainslang.com), S.O.L.A.R. (solar.delquro.com), Megatory Live (megatory-live.delqurolabs.app), VMTA (vmta.delqurolabs.app)
- Catalog cards for unreleased volumes link to `apps/*.html` pages that are not yet built (they 404 until written — same as the previous release)
- No JavaScript framework; single `style.css` + `site.js` (reveal-on-scroll, sticky topbar, mobile menu)

## Deployable size
≈460KB total · largest single file is `products.html` at 56KB

## Deploy
### Coolify (Docker)
- Build pack: **Dockerfile** (nginx:1.27-alpine) · Port: **80**
- Private repo: add a GitHub PAT or GitHub App in Coolify → see `COOLIFY_FIX.md`
- Or upload these files directly to the repo's `main` branch

### Cloudflare Pages
1. `wrangler pages deploy . --project-name=delquro-com --branch=main`
2. Custom domains: delquro.com + www.delquro.com

### Manual preview
`python3 -m http.server 8000` → http://localhost:8000/
