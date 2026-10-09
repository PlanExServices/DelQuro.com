# DelQuro.com website

This repository is the editing home for the public [DelQuro Labs website](https://www.delquro.com/). On 2026-10-09, the live homepage, Products, About, Resources, CSS, JavaScript, a product page, and a logo asset matched this repository's `main` branch byte for byte. Fetch `main` before starting a new edit.

The site is plain HTML, CSS, and JavaScript. It has no application build step or package dependencies. The repository also contains a Dockerfile for serving the files through nginx.

## Where to edit

| Area | Files |
| --- | --- |
| Homepage and navigation | `index.html`, `site.js`, `style.css` |
| Product library | `products.html`, `apps/*.html` |
| Company and support | `about.html`, `resources.html`, `support.html` |
| Legal and account help | `privacy.html`, `terms.html`, `account-deletion.html` |
| Images and logos | `assets/` |
| Web server | `Dockerfile`, root `nginx.conf`, `docker-compose.yml` |

The homepage currently describes a 23-app library. Product pages and catalog entries are hand-written; update related links and navigation when changing them.

## Preview and check

From the repository root:

```sh
python -m http.server 8000
```

Open `http://localhost:8000/`. To check local relative links, run:

```sh
node scripts/check-links.mjs
```

As of 2026-10-09, that check reports two existing missing assets: `assets/dq-sun.svg` referenced from `Sounds/index.html`, and `assets/William_DelQuro_Intro.webm` referenced from `about.html`. Verify them during the next content edit.

For an nginx preview, `docker compose up --build` serves the site at `http://localhost:3000/`.

## Releasing

Read [DEPLOYMENT.md](DEPLOYMENT.md) before publishing. The live server currently behaves like the root `Dockerfile` and `nginx.conf`, but the deployment dashboard and automatic deploy trigger have not been verified. A Git push must not be assumed to deploy the site. Do not use force-push or embed a GitHub token in a remote URL.

`PlanExServices/delquro-site` is an older marketing site; `PlanExServices/DelQuroLabs` is a separate site concept. `DelQuroLabs/DelQuroLabs.app` is a different product launchpad. Confirm deployment links before archiving any of them.
