# ==============================================================================
# REXION AI FRONTEND — PRODUCTION DOCKERFILE (Vite + Nginx Alpine)
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build Vite static bundle
RUN npm run build

# Production static server stage
FROM nginx:alpine AS runner

# Copy built static assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom SPA fallback Nginx config with production security headers
RUN printf 'server {\n\
    listen 80;\n\
    server_name localhost;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
        add_header X-Content-Type-Options "nosniff" always;\n\
    }\n\
    add_header X-Frame-Options "DENY" always;\n\
    add_header X-Content-Type-Options "nosniff" always;\n\
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;\n\
    add_header Content-Security-Policy "default-src \\'self\\'; script-src \\'self\\' \\'unsafe-inline\\' \\'unsafe-eval\\'; style-src \\'self\\' \\'unsafe-inline\\'; img-src \\'self\\' data: https:; font-src \\'self\\' data: https:; connect-src \\'self\\' https: wss:;" always;\n\
    gzip on;\n\
    gzip_types text/plain text/css application/json application/javascript text/xml image/svg+xml;\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --spider -q http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
