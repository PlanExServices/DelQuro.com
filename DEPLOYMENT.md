# Deploying delquro.com to your own server with Coolify

This repo is a **pure static site** — hand-written HTML/CSS/JS, no build step, no
backend, no dependencies. Moving it off GitHub Pages onto a server you control is
mostly a packaging job plus a DNS change.

This document is the runbook. Everything needed in the repo is already committed.

---

## 0. The site is down right now — restore it first

**`www.delquro.com` is currently unreachable, and it is not a build problem.**
GitHub Pages is healthy: the latest build is from commit `a11ab39`, it succeeded
on 2026-08-22, HTTPS is enforced, and the certificate covers both
`www.delquro.com` and `delquro.com` until 2026-10-20.

The problem is DNS. Both records point somewhere that isn't GitHub:

```
delquro.com       A     13.140.43.0      <- wrong
www.delquro.com   A     13.140.43.0      <- wrong
```

GitHub Pages needs these instead (confirmed against GitHub's own docs and by
resolving `planexservices.github.io`):

Do this in **Porkbun → Domain Management → DNS Records** for `delquro.com`:

| Type | Host | Value |
| --- | --- | --- |
| `A` | `@` | `185.199.108.153` |
| `A` | `@` | `185.199.109.153` |
| `A` | `@` | `185.199.110.153` |
| `A` | `@` | `185.199.111.153` |
| `CNAME` | `www` | `planexservices.github.io` |

Optional, for IPv6 (GitHub recommends keeping the `A` records too):

| Type | Host | Value |
| --- | --- | --- |
| `AAAA` | `@` | `2606:50c0:8000::153` |
| `AAAA` | `@` | `2606:50c0:8001::153` |
| `AAAA` | `@` | `2606:50c0:8002::153` |
| `AAAA` | `@` | `2606:50c0:8003::153` |

Delete the two existing `13.140.43.0` `A` records first — GitHub's docs
specifically warn to remove any default record the provider set.

> ### ⚠️ Leave these records alone
> They are unrelated to the website and something depends on them:
>
> - `MX` → `fwd1.porkbun.com` (10), `fwd2.porkbun.com` (20) — this is what makes
>   `info@delquro.com` receive mail. That address is linked from the footer of
>   every page.
> - `TXT` → `v=spf1 include:_spf.porkbun.com ~all`
> - `TXT` → `apple-domain-verification=oOWBaDdIKvHbStvm`

Verify after a few minutes:

```bash
dig delquro.com +short -t A          # expect the four 185.199.x.153 addresses
dig www.delquro.com +short -t CNAME  # expect planexservices.github.io
curl -sI https://www.delquro.com/ | head -3
```

Because Pages already has a valid certificate, this restores the site on its
own — usually within 5–15 minutes. **Do this before anything else below.** It
takes the pressure off the migration: once the site is back up on Pages, moving
to Coolify becomes a controlled cutover rather than a race.

Note that `https://planexservices.github.io/` returns "Site not found". That is
expected and not a fault — GitHub stops serving the `github.io` URL once a
custom domain is configured. The site is only reachable at `www.delquro.com`.

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

## 2. Install Coolify (fresh server)

Walkthrough for a clean Ubuntu 24.04 box. SSH in as root, or as a sudo user.

**2a. Update the machine first.** A fresh image often has pending security
updates, and the installer wants working `curl`, `git`, `jq` and `openssl`.

```bash
apt update && apt upgrade -y
apt install -y curl git
reboot   # only if the upgrade installed a new kernel; reconnect after
```

**2b. Confirm nothing is already holding ports 80/443.** A stock Ubuntu cloud
image sometimes ships Apache preinstalled, which will fight Traefik for those
ports.

```bash
ss -ltnp | grep -E ':80 |:443 ' || echo "ports 80/443 free"
systemctl disable --now apache2 2>/dev/null || true
```

**2c. Firewall.** Open what Coolify needs and nothing more:

```bash
ufw allow OpenSSH
ufw allow 80,443/tcp
ufw allow 8000/tcp    # dashboard - close to the public once it has its own domain
ufw allow 6001,6002/tcp
ufw enable
ufw status numbered
```

Do this through the cloud provider's security group / firewall panel too — the
provider's rules sit outside the VM and will silently block traffic even when
`ufw` is correct.

**2d. Run the installer:**

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

It installs Docker Engine if absent, creates `/data/coolify`, generates the SSH
keys Coolify uses to manage the server, and starts the control plane. Takes a
few minutes. You can pre-seed the admin account if you would rather not do it in
the browser:

```bash
env ROOT_USERNAME=yourname \
    ROOT_USER_EMAIL=you@example.com \
    ROOT_USER_PASSWORD='a-long-unique-password' \
    bash -c 'curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash'
```

**2e. First login.** Open `http://YOUR_SERVER_IP:8000` and create the admin
account. Log out and back in once to confirm the credentials work *before* you
touch any firewall rule.

> **Give the dashboard its own hostname.** Add e.g. `coolify.delquro.com` as an
> `A` record → your server IP, then set it under **Coolify → Settings →
> Instance Domain**. Coolify issues a Let's Encrypt certificate for it, and once
> HTTPS on the dashboard is proven you can close 8000/6001/6002 to the public
> and leave them open only to your own IP. Don't close them until you have
> confirmed dashboard access over the new domain from a separate network —
> locking yourself out here is the most common Coolify mistake.

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
| **Domains** | `https://www.delquro.com`, `https://delquro.com` (+ `https://test.delquro.com` temporarily — see step 5) |
| **Health Check** | path `/health` (or rely on the image's own HEALTHCHECK) |
| **Auto Deploy** | on, branch `main` |

> If Coolify pre-selects **Docker Compose** because it sees `docker-compose.yml`
> in the root, switch it back to **Dockerfile**. That compose file is only for
> local testing.

Add **both** domains. The apex entry is what lets nginx 301 `delquro.com` →
`www.delquro.com`; without it the request never reaches the container. Traefik
will issue a certificate covering both.

The container must listen on `0.0.0.0:80` — the provided config does.

## 5. Deploy and verify — before touching DNS

The point of doing this before the cutover is that GitHub Pages keeps serving
real traffic while you prove the new server works.

There is a chicken-and-egg problem: Traefik can only get a Let's Encrypt
certificate for `www.delquro.com` once that name resolves to your server. So
verify against a **throwaway hostname** first.

**5a. Add a temporary DNS record** in Porkbun:

| Type | Host | Value |
| --- | --- | --- |
| `A` | `test` | `YOUR_SERVER_IP` |

**5b. Add `https://test.delquro.com` as an extra domain on the Coolify app**,
alongside the two real ones, and hit **Deploy**. Traefik will fail the challenge
for `www.delquro.com` and `delquro.com` (expected — DNS still points at GitHub)
but will issue a valid certificate for `test.delquro.com`. The container runs
either way.

The nginx config handles this hostname without changes: the main server block is
`default_server` with `server_name _`, so it answers for any host. The
apex→www redirect only fires when the `Host` header is exactly `delquro.com`.

> Coolify may also generate its own temporary URL for the app on the
> **General** page. If it does, you can use that instead of 5a/5b — but a real
> hostname under your own domain is more faithful, because it exercises
> Traefik's TLS path exactly as production will.

**5c. Run the checks against the test hostname:**

```bash
node scripts/check-links.mjs                            # sanity-check the source tree
node scripts/check-links.mjs https://test.delquro.com    # verify the deployment
```

The live run walks every internal link and asserts 200s for real pages, a real
`404` status for missing ones, the `/Sounds` → `/Sounds/` redirect, the security
headers, and `Accept-Ranges: bytes` on MP3s. It exits non-zero on any failure.

Or spot-check by hand:

```bash
B=https://test.delquro.com
curl -sI $B/                | head -5   # 200, text/html
curl -sI $B/products        | head -5   # 200 (clean URL)
curl -sI $B/Sounds          | head -5   # 301 -> /Sounds/
curl -sI $B/Sounds/         | head -5   # 200
curl -sI $B/missing         | head -5   # 404 (not 200)
curl -s  $B/health                      # ok
curl -sI "$B/Sounds/Lake%20Lapping%20Bark.mp3" | head -8   # 200, audio/mpeg, Accept-Ranges: bytes
curl -sI -H 'Host: delquro.com' $B/     | head -5   # 301 -> https://www.delquro.com/
```

**5d. Test in a real browser.** Load `/Sounds/`, play a clip, scrub through it
(that exercises range requests), and confirm the Cloudflare Web Analytics beacon
still fires — DevTools → Network → look for a `rum` request. Check the console
for CSP violations; there should be none.

Only continue once all of this passes.

## 6. Cut DNS over to your server

DNS for `delquro.com` is hosted at **Porkbun**
(`salvador/curitiba/fortaleza/maceio.ns.porkbun.com`).

### Lower the TTL first

The day before you cut over, set the TTL on the `@` and `www` records to
**300 s** (5 min). Otherwise a stale record can be cached for the full previous
TTL and the site will appear to flap — half your visitors on GitHub, half on
your server. Raise it again afterwards; a permanent 300 s TTL means needless DNS
chatter.

### The change

Replace the GitHub Pages records from step 0 with:

| Type | Host | Value |
| --- | --- | --- |
| `A` | `@` | `YOUR_SERVER_IP` |
| `A` | `www` | `YOUR_SERVER_IP` |

Remove the four `185.199.x.153` `A` records, any `AAAA` records, and the `www`
`CNAME` to `planexservices.github.io`. Coolify's Traefik answers for both
hostnames on one IP, so plain `A` records are all you need. Delete the temporary
`test` record too, and remove `https://test.delquro.com` from the app's domains
in Coolify.

> ### ⚠️ Do not delete the other records
> The domain has live mail and verification records that must survive the change:
>
> - `MX` → `fwd1.porkbun.com` (10), `fwd2.porkbun.com` (20) — this is what makes
>   `info@delquro.com` work. It appears throughout the site.
> - `TXT` → `v=spf1 include:_spf.porkbun.com ~all`
> - `TXT` → `apple-domain-verification=oOWBaDdIKvHbStvm`
>
> Only change the records that point at the website.

### Immediately after

Traefik can now reach Let's Encrypt for the real hostnames. Expect a short
window (usually under two minutes) where HTTPS for `www.delquro.com` is still
being issued — Coolify retries automatically. Watch the deployment log, then
re-run everything from step 5 against the production URL:

```bash
node scripts/check-links.mjs https://www.delquro.com
curl -sI https://delquro.com/ | head -5      # 301 -> https://www.delquro.com/
curl -sI https://www.delquro.com/ | head -5  # 200
```

If something is wrong, see **Rollback** below — with a 300 s TTL you are back on
GitHub Pages in about five minutes.

## 7. Retire GitHub Pages

Only once the new server is confirmed good and DNS has fully propagated:

1. **GitHub → repo → Settings → Pages → Build and deployment →** set the source
   to *None* / disable Pages.
2. Optionally delete `CNAME` and `nojekyll` from the repo. They are already
   excluded from the Docker image, so they are inert either way.

Until you do this, Pages keeps a valid certificate for both hostnames and stays
ready to serve the moment DNS points back at it — which is your rollback.

(Note that `https://planexservices.github.io/` shows "Site not found". That is
expected: GitHub stops serving the `github.io` URL once a custom domain is
configured. The Pages build is still there and still deployable — it is only
reachable via `www.delquro.com`.)

## Rollback

While the Pages site still exists, rollback is purely a DNS change. Restore the
records from step 0:

| Type | Host | Value |
| --- | --- | --- |
| `A` | `@` | `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` |
| `CNAME` | `www` | `planexservices.github.io` |

At a 300 s TTL that is roughly a five-minute recovery, and no rebuild is needed
— GitHub still has the site built from `main`.

Do **not** roll back to `13.140.43.0`, which is what the records pointed at
before this work. That address is not GitHub Pages and is the reason the site was
down in the first place.

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
