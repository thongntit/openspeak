## Why

The current architecture requires hardcoding word data in the frontend, making it difficult to manage and update the word library. A backend API will centralize word and collection management, enable efficient word querying by phonetic properties, and provide a foundation for future features like user progress tracking.

## What Changes

- Add Node.js backend API using NestJS with TypeScript
- Create REST API endpoints for words and word collections with IPA phonetic data
- Design PostgreSQL database schema with JSONB phoneme storage optimized for contains/starts/ends queries
- Support phoneme-based word filtering (contains, starts with, ends with) for targeted pronunciation practice
- Update frontend to fetch words and collections from backend API
- Add Docker configuration and a CI pipeline that builds and publishes the backend image to GitHub Container Registry (ghcr.io)

## Capabilities

### New Capabilities
- `words-api`: REST API for managing words with IPA phonetic representations, supporting queries by phoneme (contains, starts with, ends with), difficulty level, and pagination
- `word-collections-api`: API for managing curated word collections (categories, difficulty levels, themed lists) with many-to-many word relationships

### Modified Capabilities
<!-- None - no existing specs -->

## Impact

**New Components:**
- `backend/` directory with NestJS application structure:
  - `src/words/` - Words module (controller, service, entity, DTOs)
  - `src/collections/` - Collections module (controller, service, entity, DTOs)
  - `src/database/` - Database module and migrations
  - `src/common/` - Shared utilities, filters, interceptors
- PostgreSQL database with tables:
  - `words` - word, IPA, phonemes (JSONB), difficulty, syllables, audio_url, example_sentence
  - `collections` - name, description, difficulty, tags (JSONB)
  - `collection_words` - junction table for many-to-many relationship
- Dockerfile (multi-stage) for the published image
- docker-compose.yml for local development (API + Postgres)
- GitHub Actions workflow that builds and pushes the image to `ghcr.io`
- Database migrations (TypeORM)

**Frontend Changes:**
- `frontend/src/services/wordsApi.js` (new): API client for fetching words and collections
- `frontend/src/components/WordSuggestions.jsx`: Fetch word suggestions from backend API instead of hardcoded data
- `frontend/src/stores/wordsStore.js` (new or modify existing): Zustand store for words/collections state
- Remove hardcoded word data from frontend codebase

**New API Endpoints:**
- `GET /api/words` - List words with query params (phoneme, startsWith, endsWith, difficulty, pagination)
- `GET /api/words/:id` - Get single word details
- `GET /api/collections` - List all word collections
- `GET /api/collections/:id` - Get collection details
- `GET /api/collections/:id/words` - Get words in a collection

**Infrastructure:**
- PostgreSQL database (user-supplied; any managed or self-hosted Postgres 16 instance)
- Docker image: `node:20-alpine` base with multi-stage build, published to `ghcr.io/<owner>/openspeak-backend`
- Environment variables consumed at runtime: `DATABASE_URL`, `PORT`, `NODE_ENV`, `CORS_ORIGIN`
- Where the image actually runs (VM, Kubernetes, managed container service) is out of scope for this change — the deliverable is a published image + run instructions

**Dependencies:**
- Backend: `@nestjs/core`, `@nestjs/typeorm`, `typeorm`, `pg`, `class-validator`, `@nestjs/config`
- Frontend: No new dependencies (use existing `fetch`)
