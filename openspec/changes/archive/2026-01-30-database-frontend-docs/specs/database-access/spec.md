## ADDED Requirements

### Requirement: GitHub raw URL access
The database SHALL be accessible via GitHub raw content URLs.

#### Scenario: Accessing database via raw URL
- **WHEN** constructing the database URL
- **THEN** the URL SHALL follow the pattern: `https://raw.githubusercontent.com/{username}/{repo}/main/database/words.json`
- **AND** the URL SHALL return the raw JSON content without HTML wrapping

### Requirement: CORS-enabled access
The GitHub raw URL SHALL support cross-origin requests for frontend loading.

#### Scenario: Frontend fetch request
- **WHEN** the frontend makes a fetch request to the GitHub raw URL
- **THEN** the response SHALL include appropriate CORS headers
- **AND** the request SHALL succeed from any origin

### Requirement: Loading strategy
The frontend SHALL implement a fetch-and-cache strategy for database loading.

#### Scenario: Initial database load
- **WHEN** the application loads for the first time
- **THEN** the frontend SHALL fetch words.json from GitHub
- **AND** the frontend SHALL store the data in IndexedDB
- **AND** subsequent loads SHALL use the cached IndexedDB data

#### Scenario: Database update check
- **WHEN** the application loads and has cached data
- **THEN** the frontend SHALL check for database updates (via version or ETag)
- **AND** IF an update exists, the frontend SHALL fetch and cache the new version
- **AND** IF no update exists, the frontend SHALL use the cached data

### Requirement: Error handling for network failures
The frontend SHALL handle network failures gracefully when loading the database.

#### Scenario: Network unavailable
- **WHEN** the GitHub fetch fails due to network issues
- **AND** cached data exists in IndexedDB
- **THEN** the frontend SHALL use the cached data
- **AND** the frontend SHALL display a warning about using offline data

#### Scenario: No cache and network failure
- **WHEN** the GitHub fetch fails
- **AND** no cached data exists
- **THEN** the frontend SHALL display an error message
- **AND** the frontend SHALL provide a retry option
