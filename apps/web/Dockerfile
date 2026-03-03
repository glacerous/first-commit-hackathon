FROM node:20-slim AS base
WORKDIR /apps/web

# Install dependencies based on the monorepo structure
COPY package.json ./
RUN npm install

# Build the application
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production stage
FROM node:20-slim AS runner
WORKDIR /apps/web
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=base /apps/web/package.json ./
COPY --from=base /apps/web/package.json ./apps/web/
COPY --from=base /apps/web/.next ./apps/web/.next
COPY --from=base /apps/web/public ./apps/web/public
COPY --from=base /apps/web/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "run", "dev", "-w", "apps/web"]
