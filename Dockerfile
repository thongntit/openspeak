# Stage 1: build frontend
FROM oven/bun:1.3.10-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/bun.lock* ./
RUN bun install --frozen-lockfile
COPY frontend/ ./
RUN bun run build

# Stage 2: build backend + serve everything
FROM oven/bun:1.3.10-alpine AS app
WORKDIR /app/backend
COPY backend/package.json backend/bun.lock* ./
RUN bun install --frozen-lockfile --production
COPY backend/ ./
COPY --from=frontend-build /app/frontend/dist ../frontend/dist
COPY database/words.json ./words.json
EXPOSE 3001
CMD ["bun", "src/index.ts"]
