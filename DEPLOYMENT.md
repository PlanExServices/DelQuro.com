# Deploying delquro.com to your own server with Coolify

This repo is a **pure static site** — hand-written HTML/CSS/JS, no build step, no
backend, no dependencies. Moving it off GitHub Pages onto a server you control is
mostly a packaging job plus a DNS change.

This document is the runbook. Everything needed in the repo is already committed.

---

## What was added

| Path | Purpose |
| --- | --- |
| `Dockerfile` | Packages the site into an `nginx:stable-alpine` image. |
| `.dockerignore` | Keeps `.git` (~75 MB) and repo tooling out of the build and the image. |
| `deploy/nginx/nginx.conf` | Routing, caching, gzip, 404 page, apex→www redirect, health check. |
| `deploy/nginx/security-headers.conf` | CSP and the usual hardening headers. |
| `docker-compose.yml` | Local smoke test only — Coolify uses the `Dockerfile`. |
| `scripts/check-links.mjs` | Verifies every link before and after the move. |

Nothing about the site's content or markup changed. `CNAME` and `nojekyll` are
left in place so GitHub Pages keeps working as a rollback path until you decide
to switch it off.

### Why nginx in a container rather than Coolify's "static site" option

Coolify can also serve static output through Nixpacks. The Dockerfile route was
chosen because this site has requirements that need explicit config:

- a custom `404.html` that must return a **real 404 status** (not a soft 200),
- `/Sounds/` — 30 files with spaces in their names, needing URL decoding, long
  cache TTLs, `Accept-Ranges` for audio seeking, and gzip **disabled** (gzipping
  an MP3 breaks range requests),
- `delquro.com` → `www.delquro.com`, because every `<link rel="canonical">` and
  the sitemap point at the www host,
- a CSP tuned to what the pages actually load.

---

## 1. Provision the server

Coolify's documented minimums are **2 CPU cores, 2 GB RAM, 10–30 GB disk**;
4 GB RAM is the comfortable figure once you are also running builds. A fresh
64-bit Linux install is recommended — Ubuntu 24.04 LTS is the best-tested.

Open these ports in the firewall / cloud security group:

| Port | Purpose |
| --- | --- |
| 22 | SSH |
| 80 | HTTP — Traefik, and Let's Encrypt HTTP-01 validation |
| 443 | HTTPS — Traefik |
| 8000 | Coolify dashboard (close to the public once you have a dashboard domain) |
| 6001 | Coolify realtime |
| 6002 | Coolify terminal |

Ports 80 and 443 must be reachable from the internet or certificate issuance
will fail.

## 2. Install Coolify

SSH in as root (or with sudo) and run the official installer:

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

It installs Docker Engine if needed, sets up `/data/coolify`, and starts the
control plane. When it finishes, open `http://YOUR_SERVER_IP:8000` and create
the first (admin) account.

> Give Coolify its own hostname, e.g. `coolify.delquro.com` → A record to the
> server IP, then set it under **Coolify → Settings → Instance Domain**. You get
> HTTPS on the dashboard and can then close 8000/6001/6002 to the public.

## 3. Connect GitHub

The repo `PlanExServices/DelQuro.com` is **public**, so you have two options:

- **Public Repository** — no GitHub connection at all. Fastest, but deploys are
  manual (or driven by a deploy webhook you call yourself).
- **GitHub App** *(recommended)* — **Coolify → Settings → GitHub → Install
  GitHub App**. Grant it access to `PlanExServices/DelQuro.com` only. This gives
  you **automatic deploys on every push**, which is the whole point of the move.

## 4. Create the application

**Project → + New Resource → Application**, then pick the GitHub repo and branch
`main`. Set exactly these:

| Setting | Value |
| --- | --- |
| **Build Pack** | `Dockerfile` |
| **Base Directory** | `/` |
| **Dockerfile Location** | `/Dockerfile` |
| **Ports Exposes** | `80` |
| **Domains** | `https://www.delquro.com`, `https://delquro.com` |
| **Health Check** | path `/health` (or rely on the image's own HEALTHCHECK) |
| **Auto Deploy** | on, branch `main` |

> If Coolify pre-selects **Docker Compose** because it sees `docker-compose.yml`
> in the root, switch it back to **Dockerfile**. That compose file is only for
> local testing.

Add **both** domains. The apex entry is what lets nginx 301 `delquro.com` →
`www.delquro.com`; without it the request never reaches the container. Traefik
will issue a certificate covering both.

The container must listen on `0.0.0.0:80` — the provided config does.

## 5. Point DNS at your server

DNS for `delquro.com` is currently hosted at **Porkbun**
(`salvador/curitiba/fortaleza/maceio.ns.porkbun.com`). In Porkbun → Domain
Management → DNS Records:

| Type | Host | Value |
| --- | --- | --- |
| `A` | `@` | `YOUR_SERVER_IP` |
| `A` | `www` | `YOUR_SERVER_IP` |

Replace whatever those two records currently point to.

> ### ⚠️ Do not delete the other records
> The domain has live mail and verification records that must survive the change:
>
> - `MX` → `fwd1.porkbun.com` (10), `fwd2.porkbun.com` (20) — this is what makes
>   `info@delquro.com` work. It appears throughout the site.
> - `TXT` → `v=spf1 include:_spf.porkbun.com ~all`
> - `TXT` → `apple-domain-verification=oOWBaDdIKvHbStvm`
>
> Only edit the two `A` records.

### ⚠️ Something looks off with the current DNS — check this first

At the time of writing, `delquro.com` and `www.delquro.com` both resolve to
`13.140.43.0`. That is **not** GitHub Pages — Pages would be
`185.199.108–111.153`, which is what `planexservices.github.io` resolves to.
GitHub still reports the Pages site as `built` with CNAME `www.delquro.com`, so
the Pages build exists but DNS is not pointing at it.

Before you cut over, confirm in the Porkbun dashboard what those `A` records
actually are and whether the live site is currently serving correctly. If the
domain is already parked or forwarded somewhere else, the cutover is simply
setting them to your server IP — and you may be fixing an existing outage rather
than causing one.

### Lower the TTL first

A day before the change, set the TTL on both `A` records to **300 s** (5 min).
Otherwise a stale record can be cached for up to the current TTL and the site
will appear to flap.

## 6. Deploy and verify

Hit **Deploy**, then:

```bash
# from the repo root
node scripts/check-links.mjs                      # sanity-check the source
node scripts/check-links.mjs https://www.delquro.com   # verify the live site
```

The live run walks every internal link and asserts 200s for real pages, a real
`404` status for missing ones, the `/Sounds` → `/Sounds/` redirect, the security
headers, and `Accept-Ranges: bytes` on MP3s.

Or spot-check by hand:

```bash
curl -sI https://www.delquro.com/            | head -5   # 200, text/html
curl -sI https://www.delquro.com/products    | head -5   # 200 (clean URL)
curl -sI https://www.delquro.com/Sounds      | head -5   # 301 -> /Sounds/
curl -sI https://www.delquro.com/Sounds/     | head -5   # 200
curl -sI https://www.delquro.com/missing     | head -5   # 404
curl -sI https://delquro.com/                | head -5   # 301 -> https://www...
curl -s  https://www.delquro.com/health                  # ok
curl -sI "https://www.delquro.com/Sounds/Lake%20Lapping%20Bark.mp3" | head -8
```

Test in a real browser too: load `/Sounds/`, play a clip, and confirm the
Cloudflare Web Analytics beacon still fires (DevTools → Network → `rum`).

## 7. Retire GitHub Pages

Only once the new server is confirmed good and DNS has fully propagated:

1. **GitHub → repo → Settings → Pages → Build and deployment →** set the source
   to *None* / disable Pages.
2. Optionally delete `CNAME` and `nojekyll` from the repo. They are already
   excluded from the Docker image, so they are inert either way.

Until you do this, Pages keeps a valid certificate for both hostnames and the
old build stays live on `planexservices.github.io` — which is your rollback.

## Rollback

While the Pages site still exists, rollback is a DNS change: point both `A`
records back at `185.199.108.153`, `185.199.109.153`, `185.199.110.153`,
`185.199.111.153` (or restore whatever they were before). At a 300 s TTL that is
a ~5 minute recovery.

Coolify also keeps previous deployments — **Application → Deployments** lets you
redeploy an older commit without touching DNS.

---

## Local testing

```bash
docker compose up --build
# http://localhost:8080
# http://localhost:8080/Sounds/
# http://localhost:8080/health
```

This builds the identical image Coolify will build. Note that locally you will
see HTTP on port 8080 and no apex→www redirect (that only triggers when the
`Host` header is exactly `delquro.com`):

```bash
curl -sI -H 'Host: delquro.com' http://localhost:8080/   # 301 -> https://www...
```

---

## Operating notes

**Deploys.** With the GitHub App connected, every push to `main` builds and
swaps the container automatically. HTML is served `no-cache`, so a deploy is
visible on the next request. CSS/JS are cached for one hour with revalidation,
so a styling change can take up to an hour to reach everyone — see below if that
ever matters.

**Image size.** About 76 MB of the image is the MP3 library under `Sounds/`.
Every rebuild ships it. If that becomes annoying, the options are to move the
audio to a Coolify volume or object storage, or to compress the files — `brown.mp3`
(19 MB), `fire.mp3` (9.5 MB), `pink.mp3` (9.6 MB) and `forest.mp3` (6.8 MB) are
~45 MB of the total between them and look like they could be re-encoded at a
lower bitrate without anyone noticing.

**Cache busting.** If you want instant CSS/JS updates, raise
`max-age=3600` in `deploy/nginx/nginx.conf` only after adding version query
strings (`style.css?v=2`) or hashed filenames to the templates. Do not bump the
TTL on its own.

**Logs.** In Coolify: **Application → Logs**. Or on the server:
`docker logs <container>`. nginx access logs are inside the container at
`/var/log/nginx/access.log`.

**TLS.** Fully owned by Coolify/Traefik via Let's Encrypt, auto-renewed. Never
add `listen 443 ssl` or certificate paths to `deploy/nginx/nginx.conf` — the
container only ever sees plain HTTP on port 80.

**CSP.** `deploy/nginx/security-headers.conf` ships a real (not report-only)
Content-Security-Policy matched to what the site loads today: system fonts only,
one external script origin (`static.cloudflareinsights.com`), and
`style-src 'unsafe-inline'` because the templates use ~48 inline `style="..."`
attributes. If you add a font CDN, a video embed, another analytics provider or
a form `action`, extend the relevant directive. To debug without risk, rename
the header to `Content-Security-Policy-Report-Only` temporarily.

**Cloudflare.** If you later put Cloudflare in front of the server, set SSL/TLS
mode to **Full (strict)** and leave 80/443 open on the origin — Let's Encrypt
still needs to reach Traefik for renewals.
