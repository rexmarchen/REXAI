# ==============================================================================
# REXION AI BACKEND — PRODUCTION DOCKERFILE
# ==============================================================================
FROM node:20-alpine AS base

WORKDIR /app

# Install native dependencies required for build/runtime tools
RUN apk add --no-cache dumb-init python3 make g++

FROM base AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Copy node_modules from dependency stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY package*.json ./
COPY server.js ./
COPY src/ ./src/
COPY data/ ./data/

# Create uploads directory and set permissions for node user
RUN mkdir -p uploads/emails && chown -R node:node /app

USER node

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:5000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
