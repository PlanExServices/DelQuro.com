# DelQuro.com — static site via nginx
FROM nginx:1.27-alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy site files
COPY . /usr/share/nginx/html

# Ensure correct permissions and remove unnecessary files for prod
RUN rm -f /usr/share/nginx/html/Dockerfile /usr/share/nginx/html/docker-compose.yml /usr/share/nginx/html/README.md /usr/share/nginx/html/*.zip && \
    ls -lh /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
