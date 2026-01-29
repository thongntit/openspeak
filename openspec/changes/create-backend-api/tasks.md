## 1. Backend Project Setup

- [ ] 1.1 Initialize NestJS project with TypeScript in `backend/` directory
- [ ] 1.2 Install core dependencies: @nestjs/core, @nestjs/common, @nestjs/platform-express
- [ ] 1.3 Install TypeORM dependencies: @nestjs/typeorm, typeorm, pg
- [ ] 1.4 Install validation dependencies: class-validator, class-transformer
- [ ] 1.5 Install config dependency: @nestjs/config
- [ ] 1.6 Configure TypeScript (tsconfig.json) with strict mode and decorators
- [ ] 1.7 Setup ESLint and Prettier for code quality
- [ ] 1.8 Create .env.example with required environment variables template
- [ ] 1.9 Add .gitignore for node_modules, dist, .env files

## 2. Database Configuration

- [ ] 2.1 Create database module with TypeORM configuration
- [ ] 2.2 Configure database connection using environment variables (DATABASE_URL)
- [ ] 2.3 Setup TypeORM CLI configuration for migrations
- [ ] 2.4 Create Word entity with TypeORM decorators (id, word, ipa, phonemes, difficulty, syllables, audio_url, example_sentence, timestamps)
- [ ] 2.5 Create Collection entity with TypeORM decorators (id, name, description, difficulty, tags, timestamps)
- [ ] 2.6 Create CollectionWord junction entity with composite primary key (collection_id, word_id, position)
- [ ] 2.7 Generate initial migration for all three tables
- [ ] 2.8 Add GIN index on words.phonemes column in migration
- [ ] 2.9 Add indexes for word, difficulty, and collection lookups
- [ ] 2.10 Test migration by running it locally against PostgreSQL

## 3. Words Module Implementation

- [ ] 3.1 Generate words module using NestJS CLI
- [ ] 3.2 Create GetWordsQueryDto with validation decorators (phoneme, startsWith, endsWith, difficulty, search, limit, offset)
- [ ] 3.3 Create WordResponseDto for consistent API response format
- [ ] 3.4 Implement WordsService with TypeORM repository injection
- [ ] 3.5 Implement findAll method with query builder for filtering and pagination
- [ ] 3.6 Add phoneme contains filter using JSONB @> operator
- [ ] 3.7 Add startsWith phoneme filter using jsonb_array_element(phonemes, 0)
- [ ] 3.8 Add endsWith phoneme filter using jsonb_array_element(phonemes, -1)
- [ ] 3.9 Add difficulty filter with enum validation
- [ ] 3.10 Add text search filter using ILIKE for word column
- [ ] 3.11 Implement pagination with limit/offset and metadata (total, hasNext, hasPrev)
- [ ] 3.12 Implement findOne method to get word by UUID
- [ ] 3.13 Create WordsController with GET /api/words endpoint
- [ ] 3.14 Create WordsController with GET /api/words/:id endpoint
- [ ] 3.15 Add validation pipe to controller to auto-validate DTOs
- [ ] 3.16 Handle 404 error when word not found
- [ ] 3.17 Handle 400 error for invalid query parameters

## 4. Collections Module Implementation

- [ ] 4.1 Generate collections module using NestJS CLI
- [ ] 4.2 Create GetCollectionsQueryDto with validation (difficulty, tag filters)
- [ ] 4.3 Create CollectionResponseDto with word_count field
- [ ] 4.4 Implement CollectionsService with TypeORM repositories
- [ ] 4.5 Implement findAll method with difficulty and tag filtering
- [ ] 4.6 Implement tag filtering using JSONB @> operator for arrays
- [ ] 4.7 Implement findOne method to get collection by UUID with word count
- [ ] 4.8 Implement findCollectionWords method with JOIN to get ordered words
- [ ] 4.9 Add pagination support for collection words endpoint
- [ ] 4.10 Create CollectionsController with GET /api/collections endpoint
- [ ] 4.11 Create CollectionsController with GET /api/collections/:id endpoint
- [ ] 4.12 Create CollectionsController with GET /api/collections/:id/words endpoint
- [ ] 4.13 Handle 404 error when collection not found
- [ ] 4.14 Ensure words in collection are ordered by position ascending

## 5. Global Configuration and Middleware

- [ ] 5.1 Setup ConfigModule with @nestjs/config and load environment variables
- [ ] 5.2 Create config validation schema using Joi for required env vars
- [ ] 5.3 Enable global ValidationPipe in main.ts with whitelist and transform options
- [ ] 5.4 Configure CORS middleware with CORS_ORIGIN environment variable
- [ ] 5.5 Create global exception filter for standardized error responses
- [ ] 5.6 Add timestamp and path fields to error response format
- [ ] 5.7 Hide internal error details in production environment
- [ ] 5.8 Add request logging interceptor for debugging
- [ ] 5.9 Set global API prefix to /api in main.ts
- [ ] 5.10 Configure app to listen on PORT from environment (default 3000)

## 6. Database Seeding

- [ ] 6.1 Create database/seeds directory structure
- [ ] 6.2 Create seed script to populate initial word data (~500 common English words)
- [ ] 6.3 Add IPA and phoneme data to seed words (use CMU Dict or manual curation)
- [ ] 6.4 Add difficulty levels to seed words (beginner/intermediate/advanced)
- [ ] 6.5 Create seed data for default collections (e.g., "Common Greetings", "Difficult Consonants", "Vowel Practice")
- [ ] 6.6 Link words to collections with proper position ordering
- [ ] 6.7 Make seed script idempotent using upsert (findOrCreate pattern)
- [ ] 6.8 Add npm run seed command to package.json
- [ ] 6.9 Test seed script on clean database
- [ ] 6.10 Document seed data sources and IPA conventions in README

## 7. Docker Configuration

- [ ] 7.1 Create Dockerfile with multi-stage build (builder + production)
- [ ] 7.2 Use node:20-alpine as base image for both stages
- [ ] 7.3 Configure builder stage to install dependencies and compile TypeScript
- [ ] 7.4 Configure production stage to copy dist/ and node_modules only
- [ ] 7.5 Expose port 3000 in Dockerfile
- [ ] 7.6 Set CMD to run compiled main.js
- [ ] 7.7 Create docker-compose.yml with app and postgres services
- [ ] 7.8 Configure postgres service with persistent volume
- [ ] 7.9 Add health check for database in docker-compose
- [ ] 7.10 Test Docker build locally with docker build
- [ ] 7.11 Test docker-compose up with migrations and seed
- [ ] 7.12 Add .dockerignore to exclude node_modules, dist, .git

## 8. API Testing and Validation

- [ ] 8.1 Start backend locally and verify server starts without errors
- [ ] 8.2 Run migrations and seed data
- [ ] 8.3 Test GET /api/words without filters returns paginated words
- [ ] 8.4 Test GET /api/words?phoneme=θ returns words containing /θ/
- [ ] 8.5 Test GET /api/words?startsWith=s returns words starting with /s/
- [ ] 8.6 Test GET /api/words?endsWith=t returns words ending with /t/
- [ ] 8.7 Test GET /api/words?difficulty=beginner filters correctly
- [ ] 8.8 Test GET /api/words?search=cat returns matching words
- [ ] 8.9 Test GET /api/words?limit=10&offset=20 pagination works
- [ ] 8.10 Test GET /api/words/:id with valid UUID returns word
- [ ] 8.11 Test GET /api/words/:id with invalid UUID returns 400
- [ ] 8.12 Test GET /api/words/:id with non-existent UUID returns 404
- [ ] 8.13 Test GET /api/collections returns all collections
- [ ] 8.14 Test GET /api/collections?difficulty=beginner filters correctly
- [ ] 8.15 Test GET /api/collections?tag=greetings filters by tag
- [ ] 8.16 Test GET /api/collections/:id returns collection with word_count
- [ ] 8.17 Test GET /api/collections/:id/words returns ordered words
- [ ] 8.18 Test CORS headers are present for configured origin
- [ ] 8.19 Test error responses have consistent format (statusCode, message, timestamp, path)
- [ ] 8.20 Test validation errors return 400 with detailed error messages

## 9. Documentation

- [ ] 9.1 Create backend/README.md with project overview
- [ ] 9.2 Document all API endpoints with request/response examples
- [ ] 9.3 Document environment variables required for deployment
- [ ] 9.4 Document database schema with entity relationships
- [ ] 9.5 Document IPA phoneme conventions used in seed data
- [ ] 9.6 Add instructions for running migrations
- [ ] 9.7 Add instructions for seeding database
- [ ] 9.8 Document Docker build and run commands
- [ ] 9.9 Add troubleshooting section for common issues
- [ ] 9.10 Document deployment steps for fly.io

## 10. Deployment to fly.io

- [ ] 10.1 Install fly.io CLI and authenticate
- [ ] 10.2 Run fly launch to create new app
- [ ] 10.3 Provision fly.io Postgres database with fly postgres create
- [ ] 10.4 Attach database to app with fly postgres attach
- [ ] 10.5 Set environment variables using fly secrets set
- [ ] 10.6 Configure fly.toml with correct port and health check
- [ ] 10.7 Deploy app using fly deploy
- [ ] 10.8 Run migrations on production database (fly ssh console + npm run migration:run)
- [ ] 10.9 Run seed script on production database
- [ ] 10.10 Test production API endpoints with curl/Postman
- [ ] 10.11 Verify CORS works with frontend origin
- [ ] 10.12 Monitor fly.io logs for errors with fly logs

## 11. Frontend Integration

- [ ] 11.1 Create frontend/src/services/wordsApi.js API client
- [ ] 11.2 Add getWords function with query parameter support
- [ ] 11.3 Add getWordById function
- [ ] 11.4 Add getCollections function
- [ ] 11.5 Add getCollectionById function
- [ ] 11.6 Add getCollectionWords function
- [ ] 11.7 Configure API base URL from environment variable
- [ ] 11.8 Add error handling for network failures
- [ ] 11.9 Create or update frontend/src/stores/wordsStore.js Zustand store
- [ ] 11.10 Add state for words, collections, loading, error
- [ ] 11.11 Add actions to fetch words with filters
- [ ] 11.12 Add LocalStorage caching for offline support
- [ ] 11.13 Update WordSuggestions component to use API instead of hardcoded data
- [ ] 11.14 Add loading spinner while fetching words
- [ ] 11.15 Add error message display if API fails
- [ ] 11.16 Test frontend with backend running locally
- [ ] 11.17 Update service worker to cache API responses
- [ ] 11.18 Remove hardcoded word data from frontend
- [ ] 11.19 Update frontend README with backend API setup instructions
- [ ] 11.20 Test frontend with production backend URL

## 12. Final Verification

- [ ] 12.1 Run backend linter and fix any issues
- [ ] 12.2 Verify all environment variables are documented
- [ ] 12.3 Test full flow: deploy backend → migrate → seed → frontend fetch
- [ ] 12.4 Verify phoneme queries return correct results for all filter types
- [ ] 12.5 Verify pagination works correctly with large datasets
- [ ] 12.6 Verify error handling returns appropriate status codes
- [ ] 12.7 Check Docker image size is reasonable (<200MB)
- [ ] 12.8 Verify backend starts within 5 seconds locally
- [ ] 12.9 Test offline mode in frontend PWA after initial data fetch
- [ ] 12.10 Update root README.md with backend section and architecture diagram
