FROM node:20-slim AS base
WORKDIR /app

# Install dependencies based on the monorepo structure
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
RUN npm install -w apps/api

# Build the application
COPY . .
RUN npm run build -w apps/api

# Production stage
FROM node:20-slim AS runner
WORKDIR /app
COPY --from=base /app/package.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/api/package.json ./apps/api/
COPY --from=base /app/apps/api/dist ./apps/api/dist

EXPOSE 3001
CMD ["node", "apps/api/dist/index.js"]
