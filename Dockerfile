# ── Stage 1: Install dependencies ─────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY lib/db/package.json ./lib/db/
COPY lib/db/src ./lib/db/src
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/api-zod/src ./lib/api-zod/src
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/app/package.json ./artifacts/app/

RUN pnpm install --frozen-lockfile

# ── Stage 2: Build frontend ────────────────────────────────────────────────────
FROM deps AS frontend-build
COPY artifacts/app ./artifacts/app
COPY lib ./lib

ARG VITE_API_URL=/api
ENV PORT=3000

RUN pnpm --filter @workspace/app run build

# ── Stage 3: Build API server ──────────────────────────────────────────────────
FROM deps AS api-build
COPY artifacts/api-server ./artifacts/api-server
COPY lib ./lib

RUN pnpm --filter @workspace/api-server run build

# ── Stage 4: Production image ──────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

ENV NODE_ENV=production
ENV PORT=8080

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY lib/db/package.json ./lib/db/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY artifacts/api-server/package.json ./artifacts/api-server/

RUN pnpm install --frozen-lockfile --prod

# Copy built API server
COPY --from=api-build /app/artifacts/api-server/dist ./artifacts/api-server/dist

# Copy uploads dir placeholder
RUN mkdir -p ./artifacts/api-server/uploads

WORKDIR /app/artifacts/api-server

# Copy frontend static files into API server's public dir (cwd-relative)
COPY --from=frontend-build /app/artifacts/app/dist ./public

EXPOSE 8080

CMD ["node", "dist/index.cjs"]
