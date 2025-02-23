# Build stage
FROM node:20-alpine as builder
RUN apk update && apk upgrade
WORKDIR /app
RUN npm install -g pnpm@8.15.1
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --node-linker=hoisted

COPY src ./src
COPY tsconfig.json ./

# Ensure public directory exists and is copied
RUN mkdir -p src/public
COPY src/public ./src/public

RUN pnpm run build
RUN cp -r src/public dist/

FROM node:20-alpine

RUN apk update && apk upgrade && \
    addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./

RUN npm install -g pnpm@8.15.1 && \
    pnpm install --frozen-lockfile --prod --node-linker=hoisted && \
    mkdir -p documents && \
    chown -R appuser:appgroup /app

USER appuser

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "dist/index.js"] 