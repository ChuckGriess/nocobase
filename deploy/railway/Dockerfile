# ─────────────────────────────────────────────────────────────────────────────
# NocoBase LMS — Railway Deployment Dockerfile
#
# Build context: repository root
#   docker build -f deploy/railway/Dockerfile .
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: dependencies + build ────────────────────────────────────────────
FROM node:20-bookworm AS builder

WORKDIR /app

# System deps needed for native addons
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ git \
    && rm -rf /var/lib/apt/lists/*

# Copy workspace manifests first (improves Docker layer cache)
COPY package.json yarn.lock ./
COPY packages/ packages/

# Install all deps (dev included — needed for the build step)
RUN yarn install --frozen-lockfile --network-timeout 600000

# Full source copy
COPY . .

# Build all packages (client bundles + server transpile)
RUN yarn build

# ── Stage 2: lean runtime image ───────────────────────────────────────────────
FROM node:20-bookworm-slim AS runtime

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    tini \
    && rm -rf /var/lib/apt/lists/*

# Copy built output and runtime node_modules from builder
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Persistent storage directory — mount a Railway volume here
RUN mkdir -p /app/storage/uploads && chmod 777 /app/storage/uploads

ENV NODE_ENV=production
ENV STORAGE_PATH=/app/storage

EXPOSE 13000

ENTRYPOINT ["/usr/bin/tini", "--"]
# --quickstart skips interactive setup and runs upgrade on each boot
CMD ["node", "node_modules/.bin/nocobase", "start", "--quickstart"]
