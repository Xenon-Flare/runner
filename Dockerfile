# Xenonflare runner — Node 22, non-root user.

FROM node:22-bookworm-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production

RUN groupadd --system --gid 10001 runner \
  && useradd --system --uid 10001 --gid runner runner

COPY --from=builder --chown=runner:runner /app/node_modules ./node_modules
COPY --from=builder --chown=runner:runner /app/dist ./dist
COPY --from=builder --chown=runner:runner /app/package.json ./package.json

USER runner

CMD ["node", "dist/index.js"]
