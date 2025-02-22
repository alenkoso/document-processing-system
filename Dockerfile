# Build stage
FROM node:20-alpine as builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies with node-linker=hoisted
RUN pnpm install --node-linker=hoisted

# Copy source code and public files
COPY src ./src
COPY tsconfig.json ./

# Ensure public directory exists in src
RUN mkdir -p src/public

# Build the application
RUN pnpm run build

# Copy public files to dist/public
RUN cp -r src/public dist/

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install pnpm and debugging tools
RUN npm install -g pnpm && \
    apk add --no-cache tree

# Copy built assets and public files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/src/public ./dist/public

# Create documents directory
RUN mkdir -p documents

# Install production dependencies
RUN pnpm install --prod --node-linker=hoisted

# Add debugging command to startup
CMD echo "Container starting..." && \
    echo "Directory structure:" && \
    tree /app && \
    echo "Starting server..." && \
    node dist/index.js 