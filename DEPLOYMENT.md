# DelQuro.com deployment notes

## Verified state on 2026-10-09

- `www.delquro.com` and the apex domain resolved to `13.140.43.0`.
- The live server reported `nginx/1.27.5` and served the same bytes as the `main` branch for sampled HTML, CSS, JavaScript, and image files.
- `/health` returned `200 ok`. Missing routes returned the homepage with HTTP 200, which matches the repository's root `nginx.conf` behavior.
- The root `Dockerfile` uses `nginx:1.27-alpine`, copies that root configuration, and serves static files on port 80. The older files under `deploy/nginx/` are not used by this Dockerfile.
- GitHub metadata reported Pages disabled for `PlanExServices/DelQuro.com`. The old GitHub Pages and DNS restoration instructions in this file no longer describe the live setup.

These observations identify the served source and web server configuration. They do **not** establish which Coolify application or other deployment system builds the image, whether it deploys automatically, or what the rollback procedure is.

## Before publishing a site change

1. In the deployment dashboard, confirm the application serving `www.delquro.com`, its Git repository, branch, Dockerfile path, automatic deploy setting, and rollback method.
2. Fetch the latest `main` and compare it with the live page. Resolve any differences before editing.
3. Make the change in a review branch and preview it locally with `python -m http.server 8000` or `docker compose up --build`.
4. Run `node scripts/check-links.mjs` and review any failures. Check the pages affected by the edit at desktop and mobile widths.
5. After approval, merge or publish through the verified deployment path. Confirm the expected version appears at the live domain and that key pages and `/health` respond as intended.

Do not change DNS, GitHub Pages, or the older website repositories as part of a content release unless the deployment connection has been confirmed. Do not force-push `main` or put a personal access token in a Git remote URL.

## Local nginx preview

```sh
docker compose up --build
```

The container listens on port 80; Compose maps it to `http://localhost:3000/`. Its health check uses `/health`. A plain static preview uses `python -m http.server 8000`.
