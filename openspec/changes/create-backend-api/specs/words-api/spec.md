## ADDED Requirements

### Requirement: List words with pagination

The system SHALL provide an endpoint to retrieve a paginated list of words with their phonetic data.

#### Scenario: Retrieve words without filters

- **WHEN** client requests `GET /api/words` without query parameters
- **THEN** system returns up to 20 words with default pagination
- **AND** response includes word, IPA, phonemes array, difficulty, syllables, audio_url, example_sentence
- **AND** response includes pagination metadata (total, limit, offset)

#### Scenario: Retrieve words with custom pagination

- **WHEN** client requests `GET /api/words?limit=50&offset=100`
- **THEN** system returns up to 50 words starting from offset 100
- **AND** response includes pagination metadata reflecting the request

#### Scenario: Pagination limit exceeds maximum

- **WHEN** client requests `GET /api/words?limit=1000`
- **THEN** system returns maximum of 100 words (enforced limit)
- **AND** response indicates the enforced limit

### Requirement: Filter words by phoneme content

The system SHALL support filtering words that contain a specific phoneme anywhere in the word.

#### Scenario: Filter by single phoneme

- **WHEN** client requests `GET /api/words?phoneme=θ`
- **THEN** system returns only words containing the /θ/ phoneme in their phonemes array
- **AND** words like "think", "both", "math" are included
- **AND** words without /θ/ phoneme are excluded

#### Scenario: Filter by phoneme with no matches

- **WHEN** client requests `GET /api/words?phoneme=ʘ` (rare phoneme)
- **THEN** system returns empty array
- **AND** response includes pagination metadata with total=0

#### Scenario: Invalid phoneme parameter

- **WHEN** client requests `GET /api/words?phoneme=invalid123`
- **THEN** system returns 400 Bad Request
- **AND** response includes error message explaining valid phoneme format

### Requirement: Filter words by starting phoneme

The system SHALL support filtering words that start with a specific phoneme.

#### Scenario: Filter by word-initial phoneme

- **WHEN** client requests `GET /api/words?startsWith=s`
- **THEN** system returns only words where the first phoneme is /s/
- **AND** words like "see", "sit", "sun" are included
- **AND** words like "pass", "case" (ending with /s/) are excluded

#### Scenario: Combine startsWith with pagination

- **WHEN** client requests `GET /api/words?startsWith=t&limit=10`
- **THEN** system returns up to 10 words starting with /t/ phoneme
- **AND** pagination metadata reflects filtered total count

### Requirement: Filter words by ending phoneme

The system SHALL support filtering words that end with a specific phoneme.

#### Scenario: Filter by word-final phoneme

- **WHEN** client requests `GET /api/words?endsWith=t`
- **THEN** system returns only words where the last phoneme is /t/
- **AND** words like "cat", "hit", "boat" are included
- **AND** words like "top", "take" (starting with /t/) are excluded

#### Scenario: Combine endsWith with difficulty filter

- **WHEN** client requests `GET /api/words?endsWith=d&difficulty=beginner`
- **THEN** system returns only beginner-level words ending with /d/ phoneme
- **AND** intermediate/advanced words are excluded

### Requirement: Filter words by difficulty level

The system SHALL support filtering words by difficulty level (beginner, intermediate, advanced).

#### Scenario: Filter by beginner difficulty

- **WHEN** client requests `GET /api/words?difficulty=beginner`
- **THEN** system returns only words marked as beginner difficulty
- **AND** intermediate and advanced words are excluded

#### Scenario: Invalid difficulty value

- **WHEN** client requests `GET /api/words?difficulty=expert`
- **THEN** system returns 400 Bad Request
- **AND** response includes valid difficulty values (beginner, intermediate, advanced)

### Requirement: Search words by text

The system SHALL support searching words by partial text match (case-insensitive).

#### Scenario: Search by word prefix

- **WHEN** client requests `GET /api/words?search=hel`
- **THEN** system returns words starting with "hel" (hello, help, helmet)
- **AND** search is case-insensitive

#### Scenario: Search by word substring

- **WHEN** client requests `GET /api/words?search=tion`
- **THEN** system returns words containing "tion" (nation, action, station)

#### Scenario: Combine search with other filters

- **WHEN** client requests `GET /api/words?search=cat&difficulty=beginner`
- **THEN** system returns beginner words matching "cat" (cat, catch, category)
- **AND** all filters are applied with AND logic

### Requirement: Retrieve single word details

The system SHALL provide an endpoint to retrieve detailed information for a specific word by ID.

#### Scenario: Get word by valid ID

- **WHEN** client requests `GET /api/words/{id}` with valid UUID
- **THEN** system returns complete word object with all fields
- **AND** response includes id, word, IPA, phonemes, difficulty, syllables, audio_url, example_sentence

#### Scenario: Get word with non-existent ID

- **WHEN** client requests `GET /api/words/{id}` with non-existent UUID
- **THEN** system returns 404 Not Found
- **AND** response includes error message

#### Scenario: Get word with invalid ID format

- **WHEN** client requests `GET /api/words/invalid-id`
- **THEN** system returns 400 Bad Request
- **AND** response indicates UUID format required

### Requirement: Words response format

The system SHALL return words in a consistent JSON format with all phonetic data.

#### Scenario: Word object structure

- **WHEN** system returns a word in any response
- **THEN** word object includes all required fields:
  - `id` (UUID string)
  - `word` (string)
  - `ipa` (string with IPA notation)
  - `phonemes` (array of phoneme strings)
  - `difficulty` (string: "beginner", "intermediate", or "advanced")
  - `syllables` (integer)
  - `audio_url` (string URL or null)
  - `example_sentence` (string or null)
  - `created_at` (ISO 8601 timestamp)
  - `updated_at` (ISO 8601 timestamp)

#### Scenario: List response structure

- **WHEN** client requests list endpoint `GET /api/words`
- **THEN** response includes:
  - `data` (array of word objects)
  - `pagination` object with `total`, `limit`, `offset`, `hasNext`, `hasPrev`

### Requirement: CORS support for frontend

The system SHALL allow cross-origin requests from the configured frontend origin.

#### Scenario: Preflight request from allowed origin

- **WHEN** browser sends OPTIONS request with Origin header matching CORS_ORIGIN
- **THEN** system returns 200 OK with appropriate CORS headers
- **AND** Access-Control-Allow-Origin header matches the frontend origin

#### Scenario: Request from disallowed origin

- **WHEN** request comes from origin not matching CORS_ORIGIN
- **THEN** system does not include Access-Control-Allow-Origin header
- **AND** browser blocks the response

### Requirement: Error handling and validation

The system SHALL provide clear error messages for invalid requests.

#### Scenario: Multiple validation errors

- **WHEN** client requests `GET /api/words?difficulty=invalid&limit=-5`
- **THEN** system returns 400 Bad Request
- **AND** response includes array of all validation errors

#### Scenario: Server error with safe message

- **WHEN** database connection fails during word retrieval
- **THEN** system returns 500 Internal Server Error
- **AND** response includes generic error message without exposing internal details
- **AND** error is logged with full details server-side
