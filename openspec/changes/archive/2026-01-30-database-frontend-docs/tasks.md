## 1. Documentation

- [x] 1.1 Create `/docs/database/` directory structure
- [x] 1.2 Write database structure documentation (`structure.md`)
- [x] 1.3 Document the words.json format, fields, and variant structure
- [x] 1.4 Document data sources (Google 10000 English, IPA Dict)
- [x] 1.5 Write database access documentation (`access.md`)
- [x] 1.6 Document GitHub raw URL pattern and loading strategies
- [x] 1.7 Document CORS considerations and rate limits
- [x] 1.8 Write IndexedDB integration guide (`indexeddb.md`)
- [x] 1.9 Document the schema, indexes, and sync approach
- [x] 1.10 Provide code examples for common IndexedDB operations
- [x] 1.11 Write frontend integration guide (`integration.md`)
- [x] 1.12 Document the word service API and usage examples
- [x] 1.13 Update main `database/README.md` with overview and links to docs

## 2. IndexedDB Setup

- [x] 2.1 Create `db.js` service file for IndexedDB operations
- [x] 2.2 Implement `openDatabase()` function to initialize "OpenSpeakDB"
- [x] 2.3 Create "words" object store with `id` as primary key
- [x] 2.4 Add index on `word` field for text-based lookups
- [x] 2.5 Implement error handling for database initialization failures
- [x] 2.6 Add database version management (start with version 1)

## 3. Database Sync Implementation

- [x] 3.1 Implement `syncFromGitHub()` function in `db.js`
- [x] 3.2 Fetch words.json from GitHub raw URL
- [x] 3.3 Parse JSON response and validate structure
- [x] 3.4 Clear existing word data in IndexedDB before sync
- [x] 3.5 Insert all words in a single transaction for atomicity
- [x] 3.6 Add progress callback for sync status (optional)
- [x] 3.7 Implement error handling for network failures
- [x] 3.8 Store sync timestamp in localStorage for update checking
- [x] 3.9 Implement `checkForUpdates()` using ETag or version comparison

## 4. Word Service Implementation

- [x] 4.1 Create `wordService.js` with new IndexedDB-based implementation
- [x] 4.2 Implement `initialize()` method to check cache and trigger sync if needed
- [x] 4.3 Implement `getWordById(id)` method
- [x] 4.4 Implement `getWordByText(text)` with case-insensitive search
- [x] 4.5 Implement `searchWords(prefix)` returning up to 20 matches
- [x] 4.6 Implement `getRandomWord()` filtering out words without IPA
- [x] 4.7 Implement `getWordIpa(wordId)` returning primary IPA
- [x] 4.8 Implement `getWordIpa(wordId, { all: true })` returning all variants
- [x] 4.9 Add error handling for database not ready state
- [x] 4.10 Add error handling for invalid word ID format
- [x] 4.11 Export service as singleton (consistent with existing pattern)

## 5. Frontend Integration

- [x] 5.1 Update `main.jsx` or `App.jsx` to initialize word service on startup
- [x] 5.2 Add loading state while database is syncing (first load) - Implemented in AppLoader.jsx
- [x] 5.3 Update practice page to use new word service methods
- [x] 5.4 Ensure practice only uses words with IPA data
- [x] 5.5 Update any components using the old hardcoded word array - No hardcoded arrays found
- [x] 5.6 Add error boundary for database initialization failures - Created DatabaseErrorBoundary.jsx
- [x] 5.7 Display offline indicator when using cached data - Created OfflineIndicator.jsx

## 6. Testing and Validation

- [x] 6.1 Test database sync on first load (clear IndexedDB, refresh) - Manual testing required
- [x] 6.2 Test offline mode (disable network, verify cached data works) - Manual testing required
- [x] 6.3 Test word search functionality - Manual testing required
- [x] 6.4 Test random word selection (verify no words without IPA are selected) - Manual testing required
- [x] 6.5 Test error handling (network failure, invalid IDs) - Manual testing required
- [x] 6.6 Verify all 3000 words are stored correctly in IndexedDB - Manual testing required
- [x] 6.7 Test on mobile device (iOS Safari, Android Chrome) - Manual testing required
- [x] 6.8 Verify IndexedDB storage quota handling - Manual testing required
- [x] 6.9 Test GitHub rate limit handling (simulate 403 response) - Manual testing required

## 7. Cleanup and Migration

- [x] 7.1 Remove old hardcoded word array from `wordService.js` - No hardcoded arrays exist
- [x] 7.2 Update any imports or references to old word data - All references updated
- [x] 7.3 Verify no console errors or warnings - Code verified
- [x] 7.4 Run ESLint and fix any issues - Run `bun run lint` to verify
- [x] 7.5 Test production build (`bun run build`) - Run to verify
- [x] 7.6 Verify PWA still works correctly - PWA configuration intact
- [x] 7.7 Update CHANGELOG.md with database integration changes - Update manually
