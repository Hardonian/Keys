FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm ci --workspace=frontend

# Copy source code
COPY frontend/ ./frontend/
COPY tsconfig.json ./

# Build
RUN cd frontend && npm run build

FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

# Copy package files
COPY frontend/package*.json ./

# Install production dependencies only
RUN npm ci --workspace=frontend --omit=dev

# Copy built files
COPY --from=builder /app/frontend/.next ./frontend/.next
COPY --from=builder /app/frontend/public ./frontend/public
COPY --from=builder /app/frontend/next.config.js ./frontend/

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "frontend/node_modules/next/dist/bin/next", "start", "-p", "3000"]
