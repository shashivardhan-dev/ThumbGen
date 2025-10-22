# ---------- STAGE 1: BUILDER ----------
FROM node:20-bullseye AS builder
WORKDIR /app

# Copy package files first for caching
COPY package*.json ./

# Install all deps (cached unless package.json changes)
RUN npm ci

# Copy the rest of your source
COPY . .

# Build your TypeScript/Next.js app
RUN npm run build

# Generate Prisma Client
RUN npx prisma generate


# ---------- STAGE 2: RUNNER ----------
FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy only what's needed
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.* ./
COPY --from=builder /app/tsconfig.json ./ 

# Make sure Prisma client is ready
RUN npx prisma generate

# Expose app port
EXPOSE 3000

# Run DB migrations, start server and worker in parallel
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js & node dist/workers/thumbnailWorker.js && wait"]
