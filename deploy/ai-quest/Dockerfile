# Standalone public AI Quest only. Same reviewed nginx digest as the root site.
FROM nginx:1.30.6-alpine@sha256:901e593c95dc85f5a729f5765516321366ef4ac401821431d408897e95287d0a
# Refresh installed Alpine packages when this pinned image is rebuilt.
RUN apk upgrade --no-cache

COPY deploy/ai-quest/nginx.conf /etc/nginx/conf.d/default.conf
# Explicit allowlist: no manifest, scripts, docs, canonical source or provenance.
COPY deploy/ai-quest/site/index.html deploy/ai-quest/site/maintenance.json /usr/share/nginx/ai-quest/
COPY deploy/ai-quest/site/assets/ /usr/share/nginx/ai-quest/assets/
COPY deploy/ai-quest/site/art/ /usr/share/nginx/ai-quest/art/
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O - http://127.0.0.1/health | grep -qx ok || exit 1
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
