#!/bin/bash
set -e
# Usage: ./PUSH_TO_GITHUB.sh <github-pat>
# Or set GITHUB_PAT env var

PAT=${1:-$GITHUB_PAT}
if [ -z "$PAT" ]; then
  echo "Usage: GITHUB_PAT=ghp_xxx ./PUSH_TO_GITHUB.sh"
  echo "Create PAT at https://github.com/settings/tokens/new with repo scope"
  exit 1
fi

REPO="PlanExServices/DelQuro.com"
BRANCH="main"

cd "$(dirname "$0")"

if [ ! -d .git ]; then
  git init
  git branch -M $BRANCH
fi

git add .
git commit -m "Rebuild DelQuro.com — exact clone of live 20-product orbit + 3 new live apps (Megatory Live 200, VMTA 200, JARVIS) + new navy #081F3A teal #0FE6C2 brand, no Commonwealth, 316KB" || echo "nothing to commit"

# Remove old remote if exists
git remote remove origin 2>/dev/null || true
git remote add origin https://$PAT@github.com/$REPO.git

echo "Pushing to https://github.com/$REPO $BRANCH..."
git push -u origin $BRANCH --force

echo "Done. Now Coolify can clone."
echo "In Coolify: Application -> General -> Git Repository -> check Private Repository and paste same PAT, or use GitHub App."
