## Context

The English learning app currently runs entirely in the browser with:
- Hardcoded word data in frontend JavaScript
- Azure Speech SDK loaded via CDN
- LocalStorage for user settings and progress
- No backend infrastructure

This design introduces a backend API to centralize word/collection management and enable phoneme-based queries. The backend ships as a Docker image published to GitHub Container Registry (`ghcr.io`); where the image runs in production (VM, Kubernetes, managed container platform) is out of scope — the deliverable is a published image plus run instructions.

**Current Frontend Stack:**
- React 19 + Vite + Tailwind CSS
- Zustand for state management
- Azure Speech SDK (client-side)
- LocalStorage for persistence

**Constraints:**
- Must ship as a portable Docker image (any Postgres 16 instance, any runtime host)
- Database must support JSON queries (for phonemes array)
- API must be CORS-enabled for frontend origin
- No authentication required for MVP (public read-only API)
- Frontend must work offline after initial data fetch

## Goals / Non-Goals

**Goals:**
- Create REST API for words and collections with full CRUD operations
- Enable phoneme-based word filtering (contains, startsWith, endsWith)
- Use PostgreSQL with JSONB for flexible phoneme storage
- Implement clean NestJS architecture with modules, controllers, services, DTOs
- Support pagination for large word lists
- Provide Dockerfile for containerized deployment
- Setup database migrations for schema versioning

**Non-Goals:**
- User authentication/authorization (future capability)
- Admin UI for managing words (use database directly or future admin API)
- Real-time updates (no WebSockets needed)
- Caching layer (Redis, etc.) - start simple, add if needed
- GraphQL API (REST is sufficient for MVP)
- Multi-language support (English only for now)

## Decisions

### Decision 1: NestJS vs Express

**Choice:** NestJS

**Rationale:**
- Built-in TypeScript support with decorators reduces boilerplate
- Dependency injection makes testing easier
- Module system enforces clean architecture boundaries
- Class-validator integration for DTO validation
- Swagger/OpenAPI generation out of the box
- User wants to learn NestJS (educational goal)

**Alternatives considered:**
- Express: Simpler, less structure, faster for small APIs but requires more manual setup
- Fastify: Faster than Express but less mature ecosystem

**Trade-off:** Slightly steeper learning curve and more boilerplate than Express, but better for maintainability as API grows.

### Decision 2: PostgreSQL vs MongoDB

**Choice:** PostgreSQL

**Rationale:**
- JSONB type supports flexible phoneme storage with GIN indexing
- Strong ACID guarantees for data integrity
- Better for relational data (words ↔ collections many-to-many)
- SQL is widely known and easier to query/debug
- Relational structure is clearer for word collection relationships

**Alternatives considered:**
- MongoDB: More flexible schema, native array queries, but weaker consistency and harder to model relationships
- SQLite: Simpler deployment but limited concurrent write performance and no JSON indexing

**Trade-off:** More rigid schema changes (migrations required), but better data integrity and query capabilities.

### Decision 3: TypeORM vs Prisma

**Choice:** TypeORM (NestJS default)

**Rationale:**
- First-class NestJS integration (`@nestjs/typeorm`)
- Decorator-based entity definitions match NestJS style
- Active Record pattern is intuitive for simple CRUD
- Built-in migration system
- Mature and stable

**Alternatives considered:**
- Prisma: Better TypeScript types, modern query API, but separate schema file (not decorators) and less idiomatic for NestJS
- Drizzle ORM: Lightweight and type-safe, but newer and less documentation

**Trade-off:** TypeORM has some rough edges (migration generation), but ecosystem maturity and NestJS integration win for MVP.

### Decision 4: Phoneme storage schema

**Choice:** Single `words` table with JSONB `phonemes` column

**Schema:**
```sql
CREATE TABLE words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word VARCHAR(100) NOT NULL UNIQUE,
  ipa VARCHAR(200) NOT NULL,
  phonemes JSONB NOT NULL,  -- ["h", "ə", "l", "oʊ"]
  difficulty VARCHAR(20),
  syllables INTEGER,
  audio_url VARCHAR(500),
  example_sentence TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_phonemes_gin ON words USING GIN (phonemes);
```

**Rationale:**
- JSONB with GIN index enables efficient `@>` (contains) queries
- Simple schema - no joins needed for basic queries
- Phoneme array order is preserved for startsWith/endsWith
- Easy to query: `WHERE phonemes @> '["θ"]'` for contains
- Can extract first/last element: `phonemes->0` and `phonemes->-1`

**Alternatives considered:**
- Separate `word_phonemes` table (word_id, phoneme, position): Better for complex sequence queries but overkill for MVP and requires joins
- Plain TEXT field with delimited phonemes: No indexing, no type safety

**Trade-off:** Complex phoneme sequence queries (e.g., "find /str/ cluster") require array operations or full table scans. Acceptable for MVP; can add `word_phonemes` table later if needed.

### Decision 5: API versioning strategy

**Choice:** No versioning for MVP (direct `/api/words` paths)

**Rationale:**
- Single internal client (our frontend)
- No public API consumers yet
- Can add `/api/v1/` prefix when breaking changes needed
- Simpler URL structure for now

**Trade-off:** Breaking changes will require frontend updates, but acceptable since we control both sides.

### Decision 6: Docker image structure

**Choice:** Multi-stage build with node:20-alpine

**Dockerfile approach:**
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 3000
CMD ["node", "dist/main"]
```

**Rationale:**
- Multi-stage keeps final image small (~150MB)
- Alpine Linux reduces attack surface
- Copying built dist/ folder avoids dev dependencies in production
- Works on any Docker host (image is portable across providers)

**Alternatives considered:**
- Single-stage build: Simpler but larger image with dev dependencies
- Distroless image: Even smaller but harder to debug

**Trade-off:** Slightly more complex Dockerfile, but 50% smaller image size.

### Decision 7: Environment configuration

**Choice:** Use `@nestjs/config` with .env file and validation

**Environment variables:**
```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
PORT=3000
NODE_ENV=development|production
CORS_ORIGIN=http://localhost:5173
```

**Rationale:**
- Single source of truth for config
- Type-safe config service with validation (Joi schema)
- Supports .env files locally and environment variables in Docker
- Fails fast on missing required config

**Trade-off:** Requires passing env vars to Docker container, but standard practice.

### Decision 8: Error handling strategy

**Choice:** Global exception filter with standardized error responses

**Error format:**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "difficulty", "message": "must be one of: beginner, intermediate, advanced" }
  ],
  "timestamp": "2026-01-29T10:30:00.000Z",
  "path": "/api/words"
}
```

**Rationale:**
- Consistent error format across all endpoints
- Client can parse errors programmatically
- Hides internal error details in production (security)
- Logs full error details server-side for debugging

**Trade-off:** Custom exception filter adds code, but improves API usability.

### Decision 9: Validation approach

**Choice:** class-validator DTOs with automatic validation pipe

**Example:**
```typescript
class GetWordsQueryDto {
  @IsOptional()
  @IsString()
  phoneme?: string;

  @IsOptional()
  @IsIn(['beginner', 'intermediate', 'advanced'])
  difficulty?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
```

**Rationale:**
- Declarative validation with decorators
- Auto-generated Swagger docs from decorators
- Type safety in TypeScript
- Global ValidationPipe transforms and validates automatically

**Trade-off:** More decorators to write, but clearer contract and better error messages.

### Decision 10: Database seeding strategy

**Choice:** Create seed script with common English words + IPA data

**Approach:**
- Add `npm run seed` command that runs TypeORM seeder
- Include ~500 common words with IPA from open dataset
- Create default collections (e.g., "Common Greetings", "Difficult Consonants")
- Idempotent seeding (use upsert to avoid duplicates)

**Data source:**
- CMU Pronouncing Dictionary (convert ARPAbet to IPA)
- Or manually curated list for MVP

**Rationale:**
- Frontend needs real data to test against
- Seeding script can be reused for testing/demo environments
- Having pre-populated collections shows value immediately

**Trade-off:** Seed data must be maintained, but essential for usable MVP.

## Risks / Trade-offs

### Risk: JSONB phoneme queries may be slow at scale

**Scenario:** With 100k+ words, GIN index on JSONB might not be fast enough for complex queries.

**Mitigation:**
- Monitor query performance with `EXPLAIN ANALYZE`
- If slow, add normalized `word_phonemes` table for complex queries
- Current scope (~5000 words max) should be fine with GIN index

### Risk: Docker image size impacts pull time

**Scenario:** Larger images take longer to pull on the eventual host and push from CI.

**Mitigation:**
- Use multi-stage build (already decided)
- Consider distroless image if pull/start time becomes an issue
- Use `docker/build-push-action` caching (GHA registry cache) in CI

### Risk: No authentication means API is public

**Scenario:** Anyone can query the API, potential for abuse.

**Mitigation:**
- Rate limiting with `@nestjs/throttler` (100 req/min per IP)
- Read-only API has limited abuse potential
- Add API key or OAuth when user accounts are added
- Monitor for unusual traffic patterns

### Risk: Frontend offline mode requires caching strategy

**Scenario:** Users expect PWA to work offline, but data comes from backend.

**Mitigation:**
- Frontend should cache fetched words in LocalStorage/IndexedDB
- Use service worker to cache API responses
- Implement stale-while-revalidate pattern
- Consider pagination: fetch commonly used words first

### Risk: Database migrations in production could fail

**Scenario:** Schema changes might break running app or lose data.

**Mitigation:**
- Test migrations in staging environment
- Use TypeORM migration system (reversible migrations)
- Backup database before running migrations
- Design additive migrations when possible (add columns, not drop)

### Risk: IPA notation inconsistency across data sources

**Scenario:** Different IPA representations for same phoneme (e.g., /ɑ/ vs /a/).

**Mitigation:**
- Normalize IPA notation in seed script
- Document IPA conventions in README
- Use consistent phoneme inventory (e.g., American English ARPABET mapping)
- Validate IPA format in DTO (regex pattern)

## Migration Plan

### Phase 1: Backend Setup (Week 1)

1. Initialize NestJS project with TypeScript
2. Configure PostgreSQL connection with TypeORM
3. Create entities (Word, Collection, CollectionWord)
4. Write and run initial migration
5. Implement words module (controller, service, DTOs)
6. Implement collections module
7. Add global exception filter and validation pipe
8. Configure CORS for local frontend
9. Create seed script with sample data

### Phase 2: Docker & Image Publish (Week 1-2)

1. Write Dockerfile with multi-stage build
2. Create docker-compose.yml for local dev (app + postgres)
3. Test Docker build locally with `docker compose up --build`
4. Add GitHub Actions job that builds and pushes the image to `ghcr.io`:
   - Log in with `GITHUB_TOKEN` (`packages: write` permission)
   - Use `docker/build-push-action@v5` with BuildKit cache
   - Tag strategy: `latest` + short SHA for pushes to `main`, and `v*` for tag pushes
5. Consumers pull the image and run it with their own Postgres instance
6. Migrations + seed are run by the consumer against their database (documented in README)

### Phase 3: Frontend Integration (Week 2)

1. Create `frontend/src/services/wordsApi.js`
2. Update WordSuggestions component to fetch from API
3. Add loading states and error handling
4. Implement LocalStorage caching for offline support
5. Update service worker to cache API responses
6. Remove hardcoded word data from frontend

### Rollback Strategy

If a published image has critical bugs:

1. **Immediate:** Frontend can fall back to hardcoded word data (keep old code temporarily)
2. **Database rollback:** Run TypeORM `migration:revert`
3. **Image rollback:** Re-deploy a previous image tag (immutable SHA tag) from `ghcr.io`
4. **Proxy/Ingress:** If the API endpoint is broken, return 503 at the ingress (frontend handles gracefully)

### Monitoring

- Log all API errors to stdout (container host captures logs)
- Monitor database connection pool usage
- Track API response times (logging interceptor records per-request duration)
- Resource monitoring (CPU, memory, requests/sec) is the responsibility of whoever runs the image

## Open Questions

### Q1: What phoneme inventory should we use?

**Options:**
- Full IPA (international standard, complex)
- Simplified ARPABET → IPA mapping (easier for seed data)
- Custom phoneme set for English learners (focus on common confusions)

**Decision needed:** Before implementing seed script

### Q2: Should we add GraphQL later?

**Consideration:** If frontend needs complex nested queries (e.g., "collections with words containing /θ/"), GraphQL might be better than multiple REST calls.

**Decision:** Defer to post-MVP based on frontend needs

### Q3: How to handle audio files for pronunciation?

**Options:**
- Store URLs in `audio_url` field (external CDN)
- Upload to cloud storage (S3, Cloudflare R2)
- Generate TTS on-demand (Azure Speech)
- No audio for MVP (null field)

**Decision needed:** Before designing audio feature

### Q4: Should collections support nesting (sub-collections)?

**Example:** "Consonants" → "Fricatives" → "Voiceless Fricatives"

**Current design:** Flat collections only
**Future:** Could add `parent_collection_id` for hierarchy

**Decision:** Flat collections for MVP, revisit if needed
