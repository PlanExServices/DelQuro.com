# Windows Fix — GITHUB_PAT not recognized

You are on Windows CMD. `GITHUB_PAT=xxx ./script.sh` is Linux syntax.

## Use Git Bash (Easiest — Recommended)

Git Bash understands Linux syntax.

1. Install Git for Windows if not installed: https://git-scm.com/download/win
2. Right-click inside `delquro-site` folder → **Git Bash Here**
3. Then run:

```bash
GITHUB_PAT=ghp_xxxxxxxx ./PUSH_TO_GITHUB.sh
```

Replace `ghp_xxxxxxxx` with your real token from https://github.com/settings/tokens/new (Classic, scope: repo)

## OR Use Windows CMD with .bat file

I added `PUSH_TO_GITHUB.bat` for CMD.

1. Open CMD inside `delquro-site` folder
2. Run:

```cmd
PUSH_TO_GITHUB.bat ghp_xxxxxxxx
```

Replace with your real token.

## OR Use PowerShell

1. Open PowerShell inside `delquro-site`
2. Run:

```powershell
$env:GITHUB_PAT="ghp_xxxxxxxx"
.\PUSH_TO_GITHUB.bat
```

Or:

```powershell
$env:GITHUB_PAT="ghp_xxxxxxxx"; git init; git branch -M main; git add .; git commit -m "Rebuild DelQuro.com"; git remote remove origin 2>$null; git remote add origin https://$env:GITHUB_PAT@github.com/PlanExServices/DelQuro.com.git; git push -u origin main --force
```

## After push

1. Check https://github.com/PlanExServices/DelQuro.com — should show files
2. In Coolify:
   - Application DelQuro.com → General
   - Check "Private Repository" / "Is Private?"
   - Paste same PAT `ghp_xxxxxxxx`
   - Build Pack: Dockerfile
   - Port: 80
   - Deploy
