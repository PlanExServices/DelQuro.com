# syntax=docker/dockerfile:1

# =============================================================================
#  DelQuro Labs - static site image for Coolify
# =============================================================================
#  The site is plain HTML/CSS/JS with no build step, so the image is just
#  nginx plus the files. Two stages share one base image, so only one image is
#  ever pulled:
#
#    1. "site"   - assembles a clean, publishable web root
#    2. runtime  - nginx serving that web root on port 80
#
#  Coolify's Traefik proxy terminates TLS and forwards plain HTTP here, so this
#  container only listens on :80. Set "Ports Exposes" to 80 in Coolify.
# =============================================================================


# --- Stage 1: assemble the web root -----------------------------------------
FROM nginx:stable-alpine AS site

WORKDIR /site

# .dockerignore already keeps .git (~75 MB) and the repo's own tooling out of
# the build context, so this is a small copy.
COPY . .

# Belt and braces: make sure no repository tooling can end up publicly served.
# `rm -rf` is used deliberately so a path that is already absent cannot fail
# the build.
RUN rm -rf \
        deploy \
        scripts \
        Dockerfile \
        .dockerignore \
        .gitignore \
        docker-compose.yml \
        DEPLOYMENT.md \
        README.md \
        CNAME \
        nojekyll


# --- Stage 2: runtime --------------------------------------------------------
FROM nginx:stable-alpine

# Config changes rarely, so copy it before the (large) site layer to keep
# rebuilds cheap.
COPY deploy/nginx/nginx.conf            /etc/nginx/nginx.conf
COPY deploy/nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf

# Roughly 76 MB of this image is the ambient MP3 library under Sounds/.
# That is expected - the files live in git and ship with the site.
COPY --from=site /site /usr/share/nginx/html

EXPOSE 80

# wget is a BusyBox applet in the Alpine base image; curl is not installed.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
