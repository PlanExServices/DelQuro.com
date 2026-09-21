# Coolify Deployment Failed — Fix for PlanExServices/DelQuro.com

## Error you saw
```
Deployment failed: Command execution failed (exit code 128):
docker exec ... git ls-remote 'https://github.com/PlanExServices/DelQuro.com' 'refs/heads/main'
fatal: could not read Username for 'https://github.com': No such device or address
```

**Root cause:** Repo `PlanExServices/DelQuro.com` is **private** (GitHub returns 404 for unauthenticated) and Coolify tried to clone via https without credentials. `GIT_TERMINAL_PROMPT=0` so it can't ask for username.

## Fix — 2 steps

### Step 1: Push the rebuilt site to GitHub (repo currently 404 / empty)

On your local machine where you have the `delquro-site` folder:

```bash
cd delquro-site

# Create PAT: https://github.com/settings/tokens/new
# Classic token, scope: repo (full)
# Copy token ghp_xxx

GITHUB_PAT=ghp_xxx ./PUSH_TO_GITHUB.sh
```

This will:
- `git init`, `git add .`, commit with message about 23 products + new brand
- Add remote `https://<PAT>@github.com/PlanExServices/DelQuro.com.git`
- Force push to `main`

Verify: https://github.com/PlanExServices/DelQuro.com should now show files (index.html, style.css, apps/, etc.)

### Step 2: Tell Coolify how to clone private repo

**Option A — GitHub App (recommended):**
1. Coolify Dashboard → Sources → GitHub → Add GitHub App → Install on PlanExServices
2. Application `DelQuro.com` → General → Git Repository → Source: select your GitHub App, repo `PlanExServices/DelQuro.com`, branch `main`
3. Redeploy

**Option B — PAT in Coolify:**
1. Application → General → Check `Private Repository (with GitHub PAT)` or `Is Private?`
2. Paste same `ghp_xxx` token
3. Repository URL: `https://github.com/PlanExServices/DelQuro.com.git`
4. Branch: `main`
5. Build Pack: `Dockerfile` (since we added Dockerfile + nginx.conf)
6. Port: `80` (nginx listens 80, Coolify maps)
7. Redeploy

**Option C — Make public temporarily:**
1. GitHub repo → Settings → General → Danger Zone → Change visibility → Public
2. Deploy in Coolify (no auth needed)
3. After successful deploy, make private again + add PAT as in Option B

## Dockerfile added

We added for Coolify Docker 29.8.1 + BuildKit:

- `Dockerfile` — `FROM nginx:1.27-alpine`, copies site to `/usr/share/nginx/html`, uses custom `nginx.conf`
- `nginx.conf` — gzip, cache 30d for assets, security headers, `try_files` fallback
- `docker-compose.yml` — for local `docker compose up` → http://localhost:3000
- `.dockerignore` — excludes .git, .env, etc.

Coolify will detect Dockerfile automatically if Build Pack = Dockerfile. Port is 80.

## Verify after deploy

```bash
curl -I https://delquro.com/
curl -I https://delquro.com/products.html
curl -I https://delquro.com/apps/megatory-live.html
```

All should be 200. Live apps:
- https://megatory-live.delqurolabs.app/ 200
- https://vmta.delqurolabs.app/ 200
- https://choremouse.delqurolabs.app/ 302→404 (exists)
- https://choremouse.com no server

## If still fails

Check Coolify logs:
- Resources → Your server → Logs
- Application → Logs → Deployment logs

Ensure Docker is running: `docker ps` on localhost deployment server.

If `git ls-remote` still fails, ensure PAT has `repo` scope and hasn't expired, and that repo name is exactly `PlanExServices/DelQuro.com` (case-sensitive).

