# Stage 1: Dependencies
FROM node:20-alpine AS deps

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build application (dummy envs for build-time module evaluation)
ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ARG BETTER_AUTH_SECRET="dummy_secret_for_build"
ARG STRIPE_SECRET_KEY="dummy_stripe_key_for_build"
ENV DATABASE_URL=$DATABASE_URL
ENV BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET
ENV STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
RUN pnpm build

# Stage 3: Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install pnpm
RUN npm install -g pnpm

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package.json ./package.json

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start application
CMD ["node", "server.js"]