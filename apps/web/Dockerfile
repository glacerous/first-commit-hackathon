FROM node:20-slim AS base
WORKDIR /app

# Install dependencies based on the monorepo structure
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
RUN npm install -w apps/web

# Build the application
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build -w apps/web

# Production stage
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=base /app/package.json ./
COPY --from=base /app/apps/web/package.json ./apps/web/
COPY --from=base /app/apps/web/.next ./apps/web/.next
COPY --from=base /app/apps/web/public ./apps/web/public
COPY --from=base /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "start", "-w", "apps/web"]
