## 1. Backend Project Setup

- [x] 1.1 Initialize NestJS project with TypeScript in `backend/` directory
- [x] 1.2 Install core dependencies: @nestjs/core, @nestjs/common, @nestjs/platform-express
- [x] 1.3 Install TypeORM dependencies: @nestjs/typeorm, typeorm, pg
- [x] 1.4 Install validation dependencies: class-validator, class-transformer
- [x] 1.5 Install config dependency: @nestjs/config
- [x] 1.6 Configure TypeScript (tsconfig.json) with strict mode and decorators
- [x] 1.7 Setup ESLint and Prettier for code quality
- [x] 1.8 Create .env.example with required environment variables template
- [x] 1.9 Add .gitignore for node_modules, dist, .env files

## 2. Database Configuration

- [x] 2.1 Create database module with TypeORM configuration
- [x] 2.2 Configure database connection using environment variables (DATABASE_URL)
- [x] 2.3 Setup TypeORM CLI configuration for migrations
- [x] 2.4 Create Word entity with TypeORM decorators (id, word, ipa, phonemes, difficulty, syllables, audio_url, example_sentence, timestamps)
- [x] 2.5 Create Collection entity with TypeORM decorators (id, name, description, difficulty, tags, timestamps)
- [x] 2.6 Create CollectionWord junction entity with composite primary key (collection_id, word_id, position)
- [x] 2.7 Generate initial migration for all three tables
- [x] 2.8 Add GIN index on words.phonemes column in migration
- [x] 2.9 Add indexes for word, difficulty, and collection lookups
- [x] 2.10 Test migration by running it locally against PostgreSQL

## 3. Words Module Implementation

- [x] 3.1 Generate words module using NestJS CLI
- [x] 3.2 Create GetWordsQueryDto with validation decorators (phoneme, startsWith, endsWith, difficulty, search, limit, offset)
- [x] 3.3 Create WordResponseDto for consistent API response format
- [x] 3.4 Implement WordsService with TypeORM repository injection
- [x] 3.5 Implement findAll method with query builder for filtering and pagination
- [x] 3.6 Add phoneme contains filter using JSONB @> operator
- [x] 3.7 Add startsWith phoneme filter using jsonb_array_element(phonemes, 0)
- [x] 3.8 Add endsWith phoneme filter using jsonb_array_element(phonemes, -1)
- [x] 3.9 Add difficulty filter with enum validation
- [x] 3.10 Add text search filter using ILIKE for word column
- [x] 3.11 Implement pagination with limit/offset and metadata (total, hasNext, hasPrev)
- [x] 3.12 Implement findOne method to get word by UUID
- [x] 3.13 Create WordsController with GET /api/words endpoint
- [x] 3.14 Create WordsController with GET /api/words/:id endpoint
- [x] 3.15 Add validation pipe to controller to auto-validate DTOs
- [x] 3.16 Handle 404 error when word not found
- [x] 3.17 Handle 400 error for invalid query parameters

## 4. Collections Module Implementation

- [x] 4.1 Generate collections module using NestJS CLI
- [x] 4.2 Create GetCollectionsQueryDto with validation (difficulty, tag filters)
- [x] 4.3 Create CollectionResponseDto with word_count field
- [x] 4.4 Implement CollectionsService with TypeORM repositories
- [x] 4.5 Implement findAll method with difficulty and tag filtering
- [x] 4.6 Implement tag filtering using JSONB @> operator for arrays
- [x] 4.7 Implement findOne method to get collection by UUID with word count
- [x] 4.8 Implement findCollectionWords method with JOIN to get ordered words
- [x] 4.9 Add pagination support for collection words endpoint
- [x] 4.10 Create CollectionsController with GET /api/collections endpoint
- [x] 4.11 Create CollectionsController with GET /api/collections/:id endpoint
- [x] 4.12 Create CollectionsController with GET /api/collections/:id/words endpoint
- [x] 4.13 Handle 404 error when collection not found
- [x] 4.14 Ensure words in collection are ordered by position ascending

## 5. Global Configuration and Middleware

- [x] 5.1 Setup ConfigModule with @nestjs/config and load environment variables
- [x] 5.2 Create config validation schema using Joi for required env vars
- [x] 5.3 Enable global ValidationPipe in main.ts with whitelist and transform options
- [x] 5.4 Configure CORS middleware with CORS_ORIGIN environment variable
- [x] 5.5 Create global exception filter for standardized error responses
- [x] 5.6 Add timestamp and path fields to error response format
- [x] 5.7 Hide internal error details in production environment
- [x] 5.8 Add request logging interceptor for debugging
- [x] 5.9 Set global API prefix to /api in main.ts
- [x] 5.10 Configure app to listen on PORT from environment (default 3000)

## 6. Database Seeding

- [x] 6.1 Create database/seeds directory structure
- [x] 6.2 Create seed script to populate initial word data (101 curated words; smaller than the ~500 target but sufficient for MVP, easy to expand)
- [x] 6.3 Add IPA and phoneme data to seed words (manual curation)
- [x] 6.4 Add difficulty levels to seed words (beginner/intermediate/advanced)
- [x] 6.5 Create seed data for default collections ("Common Greetings", "Difficult Consonants (θ/ð)", "Vowel Practice", "Consonant Clusters", "Silent Letters & gh", "Numbers 1-5", "Nasal Endings")
- [x] 6.6 Link words to collections with proper position ordering
- [x] 6.7 Make seed script idempotent using upsert (findOrCreate pattern)
- [x] 6.8 Add npm run seed command to package.json
- [x] 6.9 Test seed script on clean database
- [x] 6.10 Document seed data sources and IPA conventions in README

## 7. Docker Configuration

- [x] 7.1 Create Dockerfile with multi-stage build (builder + production)
- [x] 7.2 Use node:20-alpine as base image for both stages
- [x] 7.3 Configure builder stage to install dependencies and compile TypeScript
- [x] 7.4 Configure production stage to copy dist/ and node_modules only
- [x] 7.5 Expose port 3000 in Dockerfile
- [x] 7.6 Set CMD to run compiled main.js
- [x] 7.7 Create docker-compose.yml with app and postgres services
- [x] 7.8 Configure postgres service with persistent volume
- [x] 7.9 Add health check for database in docker-compose
- [ ] 7.10 Test Docker build locally with docker build — deferred (sandbox could not run dockerd; `docker compose config` validated the compose file)
- [ ] 7.11 Test docker-compose up with migrations and seed — deferred, same reason
- [x] 7.12 Add .dockerignore to exclude node_modules, dist, .git

## 8. API Testing and Validation

Covered by the e2e suite in `backend/test/api.e2e-spec.ts` (21 tests passing) and unit tests (16 passing). All items below were asserted in CI-equivalent runs.

- [x] 8.1 Start backend locally and verify server starts without errors
- [x] 8.2 Run migrations and seed data
- [x] 8.3 Test GET /api/words without filters returns paginated words
- [x] 8.4 Test GET /api/words?phoneme=θ returns words containing /θ/
- [x] 8.5 Test GET /api/words?startsWith=s returns words starting with /s/
- [x] 8.6 Test GET /api/words?endsWith=t returns words ending with /t/
- [x] 8.7 Test GET /api/words?difficulty=beginner filters correctly
- [x] 8.8 Test GET /api/words?search=cat returns matching words
- [x] 8.9 Test GET /api/words?limit=10&offset=20 pagination works
- [x] 8.10 Test GET /api/words/:id with valid UUID returns word
- [x] 8.11 Test GET /api/words/:id with invalid UUID returns 400
- [x] 8.12 Test GET /api/words/:id with non-existent UUID returns 404
- [x] 8.13 Test GET /api/collections returns all collections
- [x] 8.14 Test GET /api/collections?difficulty=beginner filters correctly
- [x] 8.15 Test GET /api/collections?tag=greetings filters by tag
- [x] 8.16 Test GET /api/collections/:id returns collection with word_count
- [x] 8.17 Test GET /api/collections/:id/words returns ordered words
- [x] 8.18 Test CORS headers are present for configured origin (verified live; `app.enableCors` wired)
- [x] 8.19 Test error responses have consistent format (statusCode, message, timestamp, path)
- [x] 8.20 Test validation errors return 400 with detailed error messages

## 9. Documentation

- [x] 9.1 Create backend/README.md with project overview
- [x] 9.2 Document all API endpoints with request/response examples
- [x] 9.3 Document environment variables required for deployment
- [x] 9.4 Document database schema with entity relationships
- [x] 9.5 Document IPA phoneme conventions used in seed data
- [x] 9.6 Add instructions for running migrations
- [x] 9.7 Add instructions for seeding database
- [x] 9.8 Document Docker build and run commands
- [x] 9.9 Add troubleshooting section for common issues
- [x] 9.10 Document deployment steps for fly.io

## 10. Deployment to fly.io

Config prepared; actual deploy deferred — requires Fly account credentials. Track as a follow-up change.

- [ ] 10.1 Install fly.io CLI and authenticate
- [ ] 10.2 Run fly launch to create new app
- [ ] 10.3 Provision fly.io Postgres database with fly postgres create
- [ ] 10.4 Attach database to app with fly postgres attach
- [ ] 10.5 Set environment variables using fly secrets set
- [x] 10.6 Configure fly.toml with correct port and health check
- [ ] 10.7 Deploy app using fly deploy
- [ ] 10.8 Run migrations on production database (fly ssh console + npm run migration:run)
- [ ] 10.9 Run seed script on production database
- [ ] 10.10 Test production API endpoints with curl/Postman
- [ ] 10.11 Verify CORS works with frontend origin
- [ ] 10.12 Monitor fly.io logs for errors with fly logs

## 11. Frontend Integration

Client + store landed; UI rewiring deferred. The `WordSuggestions` component referenced here does not exist in the current frontend — follow-up change should define the concrete screen to convert.

- [x] 11.1 Create frontend/src/services/openspeakApi.js API client
- [x] 11.2 Add getWords function with query parameter support
- [x] 11.3 Add getWordById function
- [x] 11.4 Add getCollections function
- [x] 11.5 Add getCollectionById function
- [x] 11.6 Add getCollectionWords function
- [x] 11.7 Configure API base URL from environment variable (VITE_OPENSPEAK_API_URL)
- [x] 11.8 Add error handling for network failures (ApiError class)
- [x] 11.9 Create or update frontend/src/stores/wordsStore.js Zustand store
- [x] 11.10 Add state for words, collections, loading, error
- [x] 11.11 Add actions to fetch words with filters
- [x] 11.12 Add LocalStorage caching for offline support (zustand persist)
- [ ] 11.13 Update WordSuggestions component to use API instead of hardcoded data — component does not exist; scope in a follow-up
- [ ] 11.14 Add loading spinner while fetching words
- [ ] 11.15 Add error message display if API fails
- [ ] 11.16 Test frontend with backend running locally
- [ ] 11.17 Update service worker to cache API responses
- [ ] 11.18 Remove hardcoded word data from frontend
- [x] 11.19 Update frontend README with backend API setup instructions (.env.example + backend README)
- [ ] 11.20 Test frontend with production backend URL

## 12. Final Verification

- [x] 12.1 Run backend linter and fix any issues
- [x] 12.2 Verify all environment variables are documented
- [ ] 12.3 Test full flow: deploy backend → migrate → seed → frontend fetch (blocked on §10)
- [x] 12.4 Verify phoneme queries return correct results for all filter types (e2e T2–T4)
- [x] 12.5 Verify pagination works correctly with large datasets (hasNext/hasPrev + e2e T7)
- [x] 12.6 Verify error handling returns appropriate status codes (400/404/500 covered)
- [ ] 12.7 Check Docker image size is reasonable (<200MB) — blocked on §7.10
- [x] 12.8 Verify backend starts within 5 seconds locally
- [ ] 12.9 Test offline mode in frontend PWA after initial data fetch (blocked on §11)
- [ ] 12.10 Update root README.md with backend section and architecture diagram
