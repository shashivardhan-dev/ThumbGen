# ---------- STAGE 1: BUILDER ----------
FROM node:20-bullseye AS builder
WORKDIR /app

# Copy package files first for caching
COPY package*.json ./

# Install all deps (cached unless package.json changes)
RUN npm ci || cat /root/.npm/_logs/*.log

# Copy the rest of your source
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Accept build arguments
ARG NEXTAUTH_SECRET
ARG NEXTAUTH_URL
ARG DATABASE_URL
ARG DIRECT_URL
ARG NODE_ENV
ARG FRONTEND_URL
ARG DOCKERHUB_USERNAME
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG CLERK_SECRET_KEY
ARG GEMINI_AI_API_KEY
ARG AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY
ARG AWS_REGION
ARG S3_BUCKET
ARG SUGGESTION_OPENAI_KEY
ARG REDIS_HOST
ARG REDIS_PORT
ARG REDIS_PASSWORD
ARG REDIS_USERNAME

# Set as environment variables
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET \
    NEXTAUTH_URL=$NEXTAUTH_URL \
    DATABASE_URL=$DATABASE_URL \
    DIRECT_URL=$DIRECT_URL \
    NODE_ENV=$NODE_ENV \
    FRONTEND_URL=$FRONTEND_URL \
    DOCKERHUB_USERNAME=$DOCKERHUB_USERNAME \
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY \
    CLERK_SECRET_KEY=$CLERK_SECRET_KEY \
    GEMINI_AI_API_KEY=$GEMINI_AI_API_KEY \
    AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
    AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
    AWS_REGION=$AWS_REGION \
    S3_BUCKET=$S3_BUCKET \
    SUGGESTION_OPENAI_KEY=$SUGGESTION_OPENAI_KEY \
    REDIS_HOST=$REDIS_HOST \
    REDIS_PORT=$REDIS_PORT \
    REDIS_PASSWORD=$REDIS_PASSWORD \
    REDIS_USERNAME=$REDIS_USERNAME

    
# Build your TypeScript/Next.js app
RUN npm run build

RUN npm run build:server

RUN npm run build:workers


# ---------- STAGE 2: RUNNER ----------
FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy only what's needed
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.* ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/build ./build 
COPY --from=builder /app/.next ./.next
# Make sure Prisma client is ready
RUN npx prisma generate

# Expose app port
EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node build/workers/thumbnailWorker.js & node build/server.js"]
