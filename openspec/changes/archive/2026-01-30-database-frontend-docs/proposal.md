## Why

The project now has a static word database (3,000 words with IPA pronunciation variants) hosted on GitHub, but lacks documentation for developers. Without clear documentation, future contributors won't understand the database structure, data sources, or how to integrate it with the frontend's IndexedDB storage. This documentation will establish the contract between the database format and frontend implementation.

## What Changes

- Create comprehensive database documentation explaining the structure, format, and data sources
- Document the GitHub raw URL access pattern for loading the database into the frontend
- Define the IndexedDB schema and sync strategy for offline-first word storage
- Provide code examples for common operations (loading words, querying by difficulty, searching)
- Document the IPA variant format and how to handle multiple pronunciations
- Create integration guide showing how the frontend word service should consume the database

## Capabilities

### New Capabilities
- `database-structure`: Document the words.json format, fields, and variant structure
- `database-access`: Document GitHub raw URL pattern and loading strategies
- `indexeddb-integration`: Define IndexedDB schema, indexes, and sync approach for word storage
- `frontend-word-service`: Document how the frontend service consumes and queries the database

### Modified Capabilities
<!-- No existing specs are being modified - this is purely documentation -->

## Impact

- **Documentation**: New docs in `/docs/` or `database/README.md`
- **Frontend**: Updates to `wordService.js` to implement the documented integration pattern
- **No Breaking Changes**: This is documentation-only; existing code continues to work
- **Dependencies**: None - documentation can be written independently of implementation
