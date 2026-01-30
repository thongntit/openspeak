# Database Structure

This document describes the structure and format of the OpenSpeak word database.

## Overview

The OpenSpeak database is a static JSON file containing 3,000 most common English words with IPA pronunciation data. It's designed to be hosted on GitHub and loaded into the frontend's IndexedDB for offline access.

**File:** `database/words.json`  
**Size:** ~449 KB  
**Format:** JSON  
**Words:** 3,000  
**Words with IPA:** 2,929 (97.6%)  

## Root Object Structure

```json
{
  "version": "1.0.0",
  "total": 3000,
  "wordsWithIpa": 2929,
  "wordsMissingIpa": 71,
  "words": [...],
  "sources": [...],
  "generatedAt": "2026-01-30T06:54:00.000Z"
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `version` | string | Database version (semver) |
| `total` | number | Total number of words in the database |
| `wordsWithIpa` | number | Count of words that have pronunciation data |
| `wordsMissingIpa` | number | Count of words without pronunciation data |
| `words` | array | Array of word entries (see below) |
| `sources` | array | Data sources used to generate the database |
| `generatedAt` | string | ISO 8601 timestamp of generation |

## Word Entry Structure

Each word in the `words` array follows this format:

```json
{
  "id": "word-1",
  "word": "the",
  "variants": [
    { "ipa": "/ˈðə/" },
    { "ipa": "/ðə/" },
    { "ipa": "/ði/" }
  ]
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier in format `word-{index}` (1-3000) |
| `word` | string | The English word in lowercase |
| `variants` | array\|null | Array of pronunciation variants (null if no IPA data) |

## IPA Variant Format

Each pronunciation variant contains:

```json
{
  "ipa": "/ˈænd/"
}
```

### IPA Notation Standards

- **Enclosed in forward slashes** (e.g., `/ˈænd/`)
- **Primary stress marker:** `ˈ` (Unicode U+02C8)
- **Secondary stress marker:** `ˌ` (Unicode U+02CC)
- **Follows standard IPA** for American English pronunciation
- **Multiple variants** represent different pronunciations (stressed, unstressed, dialectal)

### Common IPA Symbols

| Symbol | Example | Sound |
|--------|---------|-------|
| `ˈ` | /ˈænd/ | Primary stress |
| `ˌ` | /ˌɪnˈfɔɹm/ | Secondary stress |
| `ð` | /ðə/ | voiced th (the) |
| `θ` | /θɪŋ/ | voiceless th (thing) |
| `ʃ` | /ʃip/ | sh (ship) |
| `ʒ` | /ʒɑn/ | zh (genre) |
| `tʃ` | /tʃeɪnʤ/ | ch (change) |
| `dʒ` | /dʒɑb/ | j (job) |
| `ŋ` | /sɪŋ/ | ng (sing) |
| `ə` | /əbɑʊt/ | schwa (about) |
| `ɚ` | /ɝli/ | r-colored schwa (early) |
| `ɝ` | /bɝd/ | r-colored vowel (bird) |
| `aɪ` | /taɪm/ | long i (time) |
| `aʊ` | /haʊs/ | ow (house) |
| `eɪ` | /deɪ/ | long a (day) |
| `oʊ` | /goʊ/ | long o (go) |

## Words Without IPA

Some words have `variants: null` because they don't have IPA entries in the source dictionary. These are typically:

- Abbreviations ("ap", "ny", "km", "ft")
- Codes and identifiers ("usr", "eur", "com")
- Rare or technical terms not in the IPA dictionary

**Count:** 71 words (2.4% of database)

**Example:**
```json
{
  "id": "word-1019",
  "word": "pics",
  "variants": null
}
```

## Data Sources

The database is generated from two primary sources:

### 1. Google 10000 English
- **Repository:** https://github.com/first20hours/google-10000-english
- **License:** Public Domain
- **Description:** Top 10,000 most common English words by frequency from Google's Trillion Word Corpus
- **Usage:** First 3,000 words from this list

### 2. IPA Dict (en_US)
- **Repository:** https://github.com/open-dict-data/ipa-dict
- **License:** MIT
- **Description:** American English IPA pronunciation dictionary with ~125,000 words
- **Usage:** IPA lookup for each word in the Google list

## Generation Process

1. Fetch word list from Google 10000 English (first 3,000 words)
2. Fetch IPA data from IPA Dict (en_US.txt)
3. Match each word to its IPA pronunciation(s)
4. Split multiple pronunciations into separate variants
5. Generate sequential IDs (word-1 to word-3000)
6. Output as JSON with metadata

## Versioning

The database uses semantic versioning:
- **Major:** Breaking format changes
- **Minor:** New words or significant data updates
- **Patch:** Corrections to existing data

## GitHub Raw URL

Once pushed to GitHub, access the database via:

```
https://raw.githubusercontent.com/{username}/openspeak/main/database/words.json
```

Replace `{username}` with your GitHub username.

## File Size Considerations

- **Uncompressed:** ~449 KB
- **Gzipped (transfer):** ~120 KB
- **IndexedDB storage:** ~450 KB
- **Memory footprint:** Minimal (loaded on-demand)

The single-file approach is suitable for:
- Fast initial download (449 KB)
- Simple caching strategy
- Mobile networks (3G/4G/5G)
- IndexedDB storage limits (typically 50-250MB available)

See [access.md](./access.md) for loading strategies and [indexeddb.md](./indexeddb.md) for storage implementation.
