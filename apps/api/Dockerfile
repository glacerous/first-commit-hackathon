FROM node:20-slim AS base
WORKDIR /apps/api

# Install dependencies based on the monorepo structure
COPY package.json ./
RUN npm install

# Build the application
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production stage
FROM node:20-slim AS runner
WORKDIR /apps/api
COPY --from=base /apps/api/package.json ./
COPY --from=base /apps/api/node_modules ./node_modules
COPY --from=base /apps/api/dist ./dist



EXPOSE 3001
CMD ["npm", "run", "start", "-w", "apps/api"]
