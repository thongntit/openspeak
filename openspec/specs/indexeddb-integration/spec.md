# IndexedDB Integration

## Purpose

Define the IndexedDB schema and synchronization mechanism for offline word storage.

## Requirements

### Requirement: IndexedDB database schema
The frontend SHALL use IndexedDB with a specific schema for word storage.

#### Scenario: Database initialization
- **WHEN** initializing the word database in IndexedDB
- **THEN** the database SHALL be named "OpenSpeakDB"
- **AND** the database SHALL have version 1
- **AND** the store SHALL be named "words"

### Requirement: Word store structure
The words store SHALL match the database JSON structure.

#### Scenario: Storing word data
- **WHEN** storing a word in IndexedDB
- **THEN** the record SHALL have `id` as the primary key
- **AND** the record SHALL contain `word`, and `variants` fields
- **AND** the structure SHALL match the words.json format exactly

### Requirement: IndexedDB indexes
The words store SHALL have indexes for efficient querying.

#### Scenario: Creating indexes
- **WHEN** creating the words object store
- **THEN** an index SHALL be created on the `word` field (unique: false)
- **AND** the index SHALL enable case-insensitive searches

#### Scenario: Querying by word
- **WHEN** searching for a word by text
- **THEN** the query SHALL use the word index
- **AND** the query SHALL return the matching word entry
- **AND** the search SHALL be case-insensitive

### Requirement: Database synchronization
The frontend SHALL implement a sync mechanism to populate IndexedDB from the GitHub database.

#### Scenario: Full database sync
- **WHEN** syncing the database for the first time
- **THEN** the frontend SHALL fetch words.json from GitHub
- **AND** the frontend SHALL clear existing word data in IndexedDB
- **AND** the frontend SHALL insert all 3000 words in a single transaction
- **AND** the sync SHALL complete within 10 seconds

#### Scenario: Incremental update
- **WHEN** updating an existing database
- **THEN** the frontend SHALL only update changed records
- **AND** the frontend SHALL preserve user data (favorites, progress) during updates

### Requirement: Storage limits
The implementation SHALL handle IndexedDB storage constraints.

#### Scenario: Storage quota exceeded
- **WHEN** attempting to store data exceeds the browser quota
- **THEN** the application SHALL display a storage error
- **AND** the application SHALL suggest clearing other data or using a smaller word set
