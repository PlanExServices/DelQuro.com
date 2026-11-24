# DelQuro.com — the public static site only, with nginx's stable security fixes.
FROM nginx:1.30.7-alpine@sha256:caf4e1e032a20f9c3c5e28fc7f25ffd768ad8677b4975c54193075997b3a97e3

# Refresh installed Alpine packages when this pinned image is rebuilt.
RUN apk upgrade --no-cache

COPY nginx.conf /etc/nginx/conf.d/default.conf

# An allowlist prevents repository history, build scripts, project memory, and
# private configuration from entering the served image, even if ignore rules
# later change. The catalog source is build-time data; its HTML is committed.
COPY *.html *.css *.js favicon.ico robots.txt sitemap.xml site.webmanifest /usr/share/nginx/html/
COPY apps/ /usr/share/nginx/html/apps/
COPY assets/ /usr/share/nginx/html/assets/
COPY Sounds/ /usr/share/nginx/html/Sounds/

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O - http://127.0.0.1/health | grep -qx ok || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
