## 1. Documentation

- [ ] 1.1 Create `/docs/database/` directory structure
- [ ] 1.2 Write database structure documentation (`structure.md`)
- [ ] 1.3 Document the words.json format, fields, and variant structure
- [ ] 1.4 Document data sources (Google 10000 English, IPA Dict)
- [ ] 1.5 Write database access documentation (`access.md`)
- [ ] 1.6 Document GitHub raw URL pattern and loading strategies
- [ ] 1.7 Document CORS considerations and rate limits
- [ ] 1.8 Write IndexedDB integration guide (`indexeddb.md`)
- [ ] 1.9 Document the schema, indexes, and sync approach
- [ ] 1.10 Provide code examples for common IndexedDB operations
- [ ] 1.11 Write frontend integration guide (`integration.md`)
- [ ] 1.12 Document the word service API and usage examples
- [ ] 1.13 Update main `database/README.md` with overview and links to docs

## 2. IndexedDB Setup

- [ ] 2.1 Create `db.js` service file for IndexedDB operations
- [ ] 2.2 Implement `openDatabase()` function to initialize "OpenSpeakDB"
- [ ] 2.3 Create "words" object store with `id` as primary key
- [ ] 2.4 Add index on `word` field for text-based lookups
- [ ] 2.5 Implement error handling for database initialization failures
- [ ] 2.6 Add database version management (start with version 1)

## 3. Database Sync Implementation

- [ ] 3.1 Implement `syncFromGitHub()` function in `db.js`
- [ ] 3.2 Fetch words.json from GitHub raw URL
- [ ] 3.3 Parse JSON response and validate structure
- [ ] 3.4 Clear existing word data in IndexedDB before sync
- [ ] 3.5 Insert all words in a single transaction for atomicity
- [ ] 3.6 Add progress callback for sync status (optional)
- [ ] 3.7 Implement error handling for network failures
- [ ] 3.8 Store sync timestamp in localStorage for update checking
- [ ] 3.9 Implement `checkForUpdates()` using ETag or version comparison

## 4. Word Service Implementation

- [ ] 4.1 Create `wordService.js` with new IndexedDB-based implementation
- [ ] 4.2 Implement `initialize()` method to check cache and trigger sync if needed
- [ ] 4.3 Implement `getWordById(id)` method
- [ ] 4.4 Implement `getWordByText(text)` with case-insensitive search
- [ ] 4.5 Implement `searchWords(prefix)` returning up to 20 matches
- [ ] 4.6 Implement `getRandomWord()` filtering out words without IPA
- [ ] 4.7 Implement `getRandomWord(filter)` with difficulty filtering
- [ ] 4.8 Implement `getWordIpa(wordId)` returning primary IPA
- [ ] 4.9 Implement `getWordIpa(wordId, { all: true })` returning all variants
- [ ] 4.10 Add error handling for database not ready state
- [ ] 4.11 Add error handling for invalid word ID format
- [ ] 4.12 Export service as singleton (consistent with existing pattern)

## 5. Frontend Integration

- [ ] 5.1 Update `main.jsx` or `App.jsx` to initialize word service on startup
- [ ] 5.2 Add loading state while database is syncing (first load)
- [ ] 5.3 Update practice page to use new word service methods
- [ ] 5.4 Ensure practice only uses words with IPA data
- [ ] 5.5 Update any components using the old hardcoded word array
- [ ] 5.6 Add error boundary for database initialization failures
- [ ] 5.7 Display offline indicator when using cached data

## 6. Testing and Validation

- [ ] 6.1 Test database sync on first load (clear IndexedDB, refresh)
- [ ] 6.2 Test offline mode (disable network, verify cached data works)
- [ ] 6.3 Test word search functionality
- [ ] 6.4 Test random word selection (verify no words without IPA are selected)
- [ ] 6.5 Test error handling (network failure, invalid IDs)
- [ ] 6.6 Verify all 3000 words are stored correctly in IndexedDB
- [ ] 6.7 Test on mobile device (iOS Safari, Android Chrome)
- [ ] 6.8 Verify IndexedDB storage quota handling
- [ ] 6.9 Test GitHub rate limit handling (simulate 403 response)

## 7. Cleanup and Migration

- [ ] 7.1 Remove old hardcoded word array from `wordService.js`
- [ ] 7.2 Update any imports or references to old word data
- [ ] 7.3 Verify no console errors or warnings
- [ ] 7.4 Run ESLint and fix any issues
- [ ] 7.5 Test production build (`bun run build`)
- [ ] 7.6 Verify PWA still works correctly
- [ ] 7.7 Update CHANGELOG.md with database integration changes
