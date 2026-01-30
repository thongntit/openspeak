## ADDED Requirements

### Requirement: Database file structure
The words.json database SHALL follow a standardized JSON structure with metadata and word entries.

#### Scenario: Valid database structure
- **WHEN** loading words.json
- **THEN** the file SHALL contain a root object with `version`, `total`, `wordsWithIpa`, `wordsMissingIpa`, `words`, and `sources` fields
- **AND** the `words` array SHALL contain exactly 3000 word entries

### Requirement: Word entry format
Each word entry SHALL contain an identifier, the word text, and pronunciation variants.

#### Scenario: Word entry structure
- **WHEN** accessing a word entry from the database
- **THEN** the entry SHALL have an `id` field in format "word-{index}"
- **AND** the entry SHALL have a `word` field containing the lowercase word text
- **AND** the entry SHALL have a `variants` array with at least one pronunciation variant

### Requirement: IPA variant format
Each pronunciation variant SHALL contain the IPA notation in standard format.

#### Scenario: Variant with IPA
- **WHEN** accessing a word's pronunciation variants
- **THEN** each variant SHALL have an `ipa` field
- **AND** the IPA SHALL be enclosed in forward slashes (e.g., "/ˈænd/")
- **AND** the IPA SHALL follow standard IPA notation for American English

#### Scenario: Multiple variants
- **WHEN** a word has multiple pronunciation variants
- **THEN** the `variants` array SHALL contain one entry per variant
- **AND** each variant SHALL have its own `ipa` field
- **AND** variants SHALL be ordered from most common to least common

### Requirement: Missing IPA handling
Words without IPA data SHALL have null variants field.

#### Scenario: Word without pronunciation data
- **WHEN** accessing a word that has no IPA in the source dictionary
- **THEN** the `variants` field SHALL be null
- **AND** the word SHALL still be included in the database
