## ADDED Requirements

### Requirement: Word service API
The frontend SHALL provide a word service with a consistent API for word operations.

#### Scenario: Service initialization
- **WHEN** initializing the word service
- **THEN** the service SHALL check for cached data in IndexedDB
- **AND** IF no cache exists, the service SHALL trigger a sync from GitHub
- **AND** the service SHALL return a ready state when data is available

### Requirement: Get word by ID
The service SHALL provide a method to retrieve a word by its identifier.

#### Scenario: Retrieve specific word
- **WHEN** calling `getWordById(id)`
- **THEN** the service SHALL query IndexedDB for the word with matching id
- **AND** the service SHALL return the word object with all variants
- **AND** IF the word is not found, the service SHALL return null

### Requirement: Get word by text
The service SHALL provide a method to retrieve a word by its text.

#### Scenario: Retrieve word by text
- **WHEN** calling `getWordByText(text)`
- **THEN** the service SHALL query IndexedDB using the word index
- **AND** the search SHALL be case-insensitive
- **AND** the service SHALL return the first matching word
- **AND** IF no match exists, the service SHALL return null

### Requirement: Search words
The service SHALL provide a search function for finding words by partial match.

#### Scenario: Search by prefix
- **WHEN** calling `searchWords(prefix)`
- **THEN** the service SHALL return words that start with the given prefix
- **AND** the search SHALL be case-insensitive
- **AND** the service SHALL return up to 20 matching words
- **AND** results SHALL be ordered alphabetically

#### Scenario: Empty search
- **WHEN** calling `searchWords('')` or with whitespace only
- **THEN** the service SHALL return an empty array

### Requirement: Get random word
The service SHALL provide a method to get a random word for practice.

#### Scenario: Random word selection
- **WHEN** calling `getRandomWord()`
- **THEN** the service SHALL select a random word from the database
- **AND** the service SHALL return the complete word object
- **AND** the word SHALL have at least one pronunciation variant (ipa not null)

#### Scenario: Random word with filter
- **WHEN** calling `getRandomWord(filter)`
- **THEN** the service SHALL only consider words matching the filter criteria
- **AND** the filter SHALL support difficulty levels (easy, medium, hard)

### Requirement: Get word IPA
The service SHALL provide a method to get the primary IPA for a word.

#### Scenario: Primary pronunciation
- **WHEN** calling `getWordIpa(wordId)`
- **THEN** the service SHALL return the IPA from the first variant
- **AND** the returned IPA SHALL include the forward slashes

#### Scenario: All pronunciations
- **WHEN** calling `getWordIpa(wordId, { all: true })`
- **THEN** the service SHALL return an array of all IPA variants

### Requirement: Service error handling
The service SHALL handle errors gracefully.

#### Scenario: Database not ready
- **WHEN** calling a service method before the database is initialized
- **THEN** the service SHALL throw an error with message "Database not initialized"
- **AND** the error SHALL include a code property with value "DB_NOT_READY"

#### Scenario: Invalid word ID
- **WHEN** calling `getWordById` with an invalid ID format
- **THEN** the service SHALL throw an error with message "Invalid word ID format"
