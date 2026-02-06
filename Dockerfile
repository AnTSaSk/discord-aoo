# syntax=docker/dockerfile:1
# Multi-stage build for discord-bot-aoo
# Stage 1: Build
FROM node:24-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules and enable pnpm
# hadolint ignore=DL3018
RUN apk add --no-cache python3 make g++ && \
    corepack enable pnpm

# Copy package files first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install all dependencies (including dev for build)
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Copy source code and config files
COPY tsconfig.json .sapphirerc.json ./
COPY src ./src
COPY scripts ./scripts

# Build TypeScript with tsc-alias and prune dev dependencies
RUN pnpm build && \
    pnpm prune --prod

# Stage 2: Production
FROM node:24-alpine AS production

WORKDIR /app

# Create non-root user (matching infra-vps convention: UID 1001)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs botuser

# Copy from builder
COPY --from=builder --chown=botuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=botuser:nodejs /app/package.json ./
COPY --from=builder --chown=botuser:nodejs /app/dist ./dist
COPY --from=builder --chown=botuser:nodejs /app/.sapphirerc.json ./

# Set environment
ENV NODE_ENV=production

# Switch to non-root user
USER botuser

# Health check - verify Node.js process can run
# (No HTTP endpoint for Discord bots)
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD node -e "process.exit(0)" || exit 1

# Start the bot
CMD ["node", "dist/src/main.js"]
