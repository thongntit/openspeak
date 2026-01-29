## ADDED Requirements

### Requirement: List all word collections

The system SHALL provide an endpoint to retrieve all word collections with metadata.

#### Scenario: Retrieve all collections

- **WHEN** client requests `GET /api/collections`
- **THEN** system returns array of all collections
- **AND** each collection includes id, name, description, difficulty, tags, created_at, updated_at
- **AND** collections do not include word details (only metadata)

#### Scenario: Empty collections list

- **WHEN** client requests `GET /api/collections` and no collections exist
- **THEN** system returns empty array with 200 OK
- **AND** response is valid JSON array

### Requirement: Filter collections by difficulty

The system SHALL support filtering collections by difficulty level.

#### Scenario: Filter by beginner difficulty

- **WHEN** client requests `GET /api/collections?difficulty=beginner`
- **THEN** system returns only beginner-level collections
- **AND** intermediate and advanced collections are excluded

#### Scenario: Invalid difficulty filter

- **WHEN** client requests `GET /api/collections?difficulty=invalid`
- **THEN** system returns 400 Bad Request
- **AND** response includes valid difficulty values

### Requirement: Filter collections by tag

The system SHALL support filtering collections by tags.

#### Scenario: Filter by single tag

- **WHEN** client requests `GET /api/collections?tag=greetings`
- **THEN** system returns collections containing "greetings" in their tags array
- **AND** collections without this tag are excluded

#### Scenario: Filter by multiple tags

- **WHEN** client requests `GET /api/collections?tag=greetings&tag=social`
- **THEN** system returns collections containing both "greetings" AND "social" tags
- **AND** collections with only one of the tags are excluded

### Requirement: Retrieve single collection details

The system SHALL provide an endpoint to retrieve detailed information for a specific collection by ID.

#### Scenario: Get collection by valid ID

- **WHEN** client requests `GET /api/collections/{id}` with valid UUID
- **THEN** system returns complete collection object
- **AND** response includes id, name, description, difficulty, tags, word_count, created_at, updated_at
- **AND** response does not include word details (use separate endpoint)

#### Scenario: Get collection with non-existent ID

- **WHEN** client requests `GET /api/collections/{id}` with non-existent UUID
- **THEN** system returns 404 Not Found
- **AND** response includes error message

#### Scenario: Get collection with invalid ID format

- **WHEN** client requests `GET /api/collections/not-a-uuid`
- **THEN** system returns 400 Bad Request
- **AND** response indicates UUID format required

### Requirement: Retrieve words in a collection

The system SHALL provide an endpoint to retrieve all words within a specific collection, ordered by position.

#### Scenario: Get words from collection

- **WHEN** client requests `GET /api/collections/{id}/words` with valid collection ID
- **THEN** system returns array of word objects in the collection
- **AND** words are ordered by position in collection (ascending)
- **AND** each word includes all standard word fields (id, word, IPA, phonemes, etc.)

#### Scenario: Get words from empty collection

- **WHEN** client requests `GET /api/collections/{id}/words` for collection with no words
- **THEN** system returns empty array with 200 OK
- **AND** response is valid JSON array

#### Scenario: Get words with pagination

- **WHEN** client requests `GET /api/collections/{id}/words?limit=10&offset=0`
- **THEN** system returns up to 10 words from the collection
- **AND** response includes pagination metadata
- **AND** words maintain collection position ordering

#### Scenario: Get words from non-existent collection

- **WHEN** client requests `GET /api/collections/{invalid-id}/words`
- **THEN** system returns 404 Not Found
- **AND** response indicates collection not found

### Requirement: Collection response format

The system SHALL return collections in a consistent JSON format.

#### Scenario: Collection object structure

- **WHEN** system returns a collection in any response
- **THEN** collection object includes all required fields:
  - `id` (UUID string)
  - `name` (string)
  - `description` (string or null)
  - `difficulty` (string: "beginner", "intermediate", or "advanced", or null)
  - `tags` (array of strings, can be empty)
  - `word_count` (integer, number of words in collection)
  - `created_at` (ISO 8601 timestamp)
  - `updated_at` (ISO 8601 timestamp)

#### Scenario: Collection list response structure

- **WHEN** client requests `GET /api/collections`
- **THEN** response is a JSON array of collection objects
- **AND** each collection follows the standard object structure

### Requirement: Collection word ordering

The system SHALL maintain explicit ordering of words within collections using position values.

#### Scenario: Words ordered by position

- **WHEN** client retrieves words from a collection
- **THEN** words are returned in ascending order by position field
- **AND** position values start from 0 or 1 consistently

#### Scenario: Position values are unique per collection

- **WHEN** collection contains multiple words
- **THEN** each word has a unique position value within that collection
- **AND** no two words share the same position in a collection

### Requirement: Many-to-many word-collection relationships

The system SHALL support the same word appearing in multiple collections.

#### Scenario: Word in multiple collections

- **WHEN** word exists in multiple collections
- **THEN** retrieving each collection returns the word with collection-specific position
- **AND** modifying word in one collection does not affect other collections

#### Scenario: Collection contains duplicate word references

- **WHEN** attempting to add same word to collection twice
- **THEN** system prevents duplicate by primary key constraint
- **AND** returns appropriate error (409 Conflict or similar)

### Requirement: Collection metadata accuracy

The system SHALL maintain accurate word_count for each collection.

#### Scenario: Word count reflects actual words

- **WHEN** client retrieves collection details
- **THEN** word_count field matches the actual number of words in the collection
- **AND** count is updated when words are added or removed

#### Scenario: Empty collection has zero count

- **WHEN** collection has no words
- **THEN** word_count field is 0

### Requirement: CORS support for collections API

The system SHALL allow cross-origin requests from the configured frontend origin for collection endpoints.

#### Scenario: Preflight request for collections endpoint

- **WHEN** browser sends OPTIONS request to collections endpoint
- **THEN** system returns appropriate CORS headers
- **AND** Access-Control-Allow-Origin matches frontend origin

### Requirement: Error handling for collections

The system SHALL provide clear error messages for invalid collection requests.

#### Scenario: Invalid query parameter combination

- **WHEN** client requests `GET /api/collections?difficulty=invalid&tag=`
- **THEN** system returns 400 Bad Request
- **AND** response includes specific validation errors

#### Scenario: Server error during collection retrieval

- **WHEN** database error occurs during collection fetch
- **THEN** system returns 500 Internal Server Error
- **AND** response includes generic error message
- **AND** detailed error is logged server-side
