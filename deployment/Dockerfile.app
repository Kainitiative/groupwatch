FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY artifacts/app/package.json ./artifacts/app/
RUN pnpm install --frozen-lockfile

FROM deps AS builder
COPY . .
RUN pnpm --filter @workspace/app run build

FROM nginx:alpine AS runner
COPY --from=builder /app/artifacts/app/dist /usr/share/nginx/html
COPY deployment/nginx-spa.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
