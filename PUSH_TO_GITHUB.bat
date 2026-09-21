@echo off
REM Windows CMD version — Push DelQuro.com to GitHub
REM Usage: PUSH_TO_GITHUB.bat ghp_xxxxxxxx
REM Or set env first: set GITHUB_PAT=ghp_xxx && PUSH_TO_GITHUB.bat

SETLOCAL

IF "%~1"=="" (
  IF "%GITHUB_PAT%"=="" (
    echo Usage: PUSH_TO_GITHUB.bat ghp_xxxxxxxx
    echo Or: set GITHUB_PAT=ghp_xxx && PUSH_TO_GITHUB.bat
    echo Create PAT at https://github.com/settings/tokens/new with repo scope
    exit /b 1
  ) ELSE (
    SET PAT=%GITHUB_PAT%
  )
) ELSE (
  SET PAT=%~1
)

SET REPO=PlanExServices/DelQuro.com
SET BRANCH=main

echo Pushing to https://github.com/%REPO% %BRANCH%...

IF NOT EXIST .git (
  git init
  git branch -M %BRANCH%
)

git add .
git commit -m "Rebuild DelQuro.com - exact clone of live 20-product orbit + 3 new live apps (Megatory Live 200, VMTA 200, JARVIS) + new navy #081F3A teal #0FE6C2 brand, no Commonwealth, 316KB" || echo nothing to commit

git remote remove origin 2>nul
git remote add origin https://%PAT%@github.com/%REPO%.git

git push -u origin %BRANCH% --force

echo Done. Now Coolify can clone.
echo In Coolify: Application -^> General -^> check Private Repository and paste same PAT
ENDLOCAL
