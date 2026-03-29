FROM oven/bun:1.3.10-alpine

WORKDIR /app

# Install only production deps
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

COPY src/ ./src/

# words.json should be alongside src/ at runtime
COPY words.json* ./

EXPOSE 3001

CMD ["bun", "src/index.ts"]
