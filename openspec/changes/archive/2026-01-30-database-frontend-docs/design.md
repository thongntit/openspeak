## Context

The OpenSpeak project is a mobile-first PWA for English pronunciation assessment using Azure Speech Services. The project has recently created a static word database containing 3,000 most common English words with IPA pronunciation variants, hosted on GitHub for raw file access.

**Current State:**
- Database: `database/words.json` (449 KB) with 3,000 words
- Each word has an ID, text, and array of IPA pronunciation variants
- 2,929 words have IPA data, 71 are missing (abbreviations, codes)
- Frontend currently uses a hardcoded array of 3,000 words in `wordService.js`
- No IndexedDB integration yet for offline storage
- No documentation exists for the database format or integration approach

**Constraints:**
- Mobile-first PWA requiring offline capability
- Must work with Azure Speech Services for pronunciation assessment
- GitHub raw URLs have rate limits (60 req/hour unauthenticated)
- IndexedDB storage limits vary by browser (typically 50-250MB)

## Goals / Non-Goals

**Goals:**
- Document the database structure and format for developers
- Define the GitHub raw URL access pattern for loading data
- Design IndexedDB schema for efficient word storage and querying
- Create a word service API that abstracts database operations
- Enable offline-first word access after initial sync
- Provide clear integration path for frontend implementation

**Non-Goals:**
- Modifying the existing database format (documentation only)
- Implementing user progress tracking or favorites (future feature)
- Adding new words or modifying IPA data
- Creating a backend API (staying with static GitHub hosting)
- Real-time database updates or synchronization

## Decisions

### Decision: Single-file database vs. chunked approach
**Choice:** Keep single `words.json` file (449 KB)

**Rationale:**
- 449 KB is well within IndexedDB storage limits and GitHub raw URL constraints
- Single fetch is simpler than managing multiple chunks
- Mobile users on slow connections can handle 449 KB download
- No need for complex chunk management logic

**Alternative considered:** Chunking into 3 files of 1000 words each
- Rejected: Adds complexity without significant benefit at this scale

### Decision: IndexedDB as primary storage with GitHub as source
**Choice:** Use IndexedDB as the primary word storage, GitHub as the authoritative source

**Rationale:**
- Enables offline-first functionality required for PWA
- Reduces dependency on network availability
- GitHub provides free, reliable hosting with version control
- ETag support allows efficient update checking

**Implementation approach:**
1. On first load: Fetch from GitHub → Store in IndexedDB
2. On subsequent loads: Use IndexedDB, check for updates in background
3. On update available: Download new version → Replace IndexedDB content

### Decision: Word ID format
**Choice:** Use sequential IDs (`word-1`, `word-2`, ..., `word-3000`)

**Rationale:**
- Matches the frequency ranking (word-1 = most common)
- Simple, predictable format
- Easy to generate and reference
- Allows for future expansion (word-3001, etc.)

**Alternative considered:** UUIDs or word-based IDs
- Rejected: Sequential IDs provide implicit ordering by frequency

### Decision: Store all IPA variants
**Choice:** Store all pronunciation variants from the source data

**Rationale:**
- Some words have multiple valid pronunciations (e.g., "the": /ˈðə/, /ðə/, /ði/)
- Azure Speech Services can handle multiple pronunciations for assessment
- Provides flexibility for future features (dialect selection, etc.)
- Source data already provides variants, no extra processing needed

**Implementation:** Each word has a `variants` array:
```json
{
  "variants": [
    { "ipa": "/ˈænd/" },
    { "ipa": "/ənd/" }
  ]
}
```

### Decision: No phoneme breakdown in database
**Choice:** Store only IPA strings, not individual phonemes

**Rationale:**
- IPA parsing is complex and error-prone
- Azure Speech Services handles phoneme-level assessment internally
- Reduces database size and complexity
- Can be added later if needed for visualization features

### Decision: IndexedDB indexes
**Choice:** Create index on `word` field for text-based lookups

**Rationale:**
- Primary use case is looking up words by text (user input or search)
- ID-based lookups use the primary key (already indexed)
- No need for complex queries (no filtering by difficulty, frequency, etc. in MVP)

**Schema:**
```javascript
{
  id: "word-{index}",  // Primary key
  word: "hello",       // Indexed
  variants: [...]
}
```

## Risks / Trade-offs

**[Risk] GitHub rate limiting blocks new users**
→ **Mitigation:** Implement aggressive caching; once downloaded, words persist in IndexedDB indefinitely. Only new installs or explicit refresh triggers GitHub fetch.

**[Risk] 71 words missing IPA data**
→ **Mitigation:** Service layer filters out words without variants when selecting random words for practice. Search still returns all words.

**[Risk] Database updates require full re-download**
→ **Mitigation:** Document that updates should be infrequent (quarterly). Current 449 KB size makes this acceptable. Future: consider delta updates if database grows.

**[Risk] IndexedDB storage quota exceeded on user device**
→ **Mitigation:** 449 KB is minimal; most devices have 50+ MB available. Add error handling to detect quota issues and provide user guidance.

**[Trade-off] Offline-first vs. real-time updates**
→ Users see cached data until they explicitly refresh or app updates. Acceptable for static word data that rarely changes.

## Migration Plan

This is a documentation-only change with no migration needed. The implementation phase will:

1. Create documentation files in `/docs/` directory
2. Update `database/README.md` with comprehensive guide
3. Implement word service in frontend following documented API
4. Test IndexedDB integration with sample data

**Rollback:** Not applicable - documentation can be updated independently.

## Open Questions

1. **Should we implement ETag-based update checking?**
   - GitHub raw URLs support ETags
   - Could reduce bandwidth by checking before downloading
   - Trade-off: Extra HTTP request vs. potential full download

2. **How to handle words with missing IPA in practice mode?**
   - Option A: Filter them out entirely (never show for practice)
   - Option B: Show but skip pronunciation assessment
   - Option C: Use Azure's best-effort recognition without reference

3. **Should we add frequency/difficulty fields back to the database?**
   - Previously had these fields but removed for simplicity
   - Could enable filtering by difficulty level
   - Trade-off: Database size vs. feature capability
