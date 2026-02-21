FROM node:20-slim AS base
WORKDIR /app

# Install dependencies based on the monorepo structure
COPY package.json package-lock.json ./
COPY apps/worker/package.json ./apps/worker/
RUN npm install -w apps/worker

# Build the application
COPY . .
RUN npm run build -w apps/worker

# Production stage
FROM node:20-slim AS runner
WORKDIR /app
COPY --from=base /app/package.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/worker/package.json ./apps/worker/
COPY --from=base /app/apps/worker/dist ./apps/worker/dist

CMD ["node", "apps/worker/dist/index.js"]
