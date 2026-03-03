FROM node:20-slim AS base
WORKDIR /apps/worker

# Install dependencies based on the monorepo structure
COPY package.json ./
RUN npm install

# Build the application
COPY . .
RUN npm run build

# Production stage
FROM node:20-slim AS runner
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*
WORKDIR /apps/worker
COPY --from=base /apps/worker/package.json ./
COPY --from=base /apps/worker/node_modules ./node_modules
COPY --from=base /apps/worker/dist ./dist

CMD ["npm", "run", "dev", "-w", "apps/worker"]
