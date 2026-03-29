## ADDED Requirements

### Requirement: Words endpoint serves word database to authenticated users
The backend SHALL serve the word database from `words.json` to authenticated clients.

#### Scenario: Authenticated word fetch
- **WHEN** a GET request is made to `/api/words` with a valid JWT cookie
- **THEN** the backend SHALL read `words.json` from disk at runtime and respond with HTTP 200 and the JSON content as the body

#### Scenario: Unauthenticated word fetch
- **WHEN** a GET request is made to `/api/words` without a valid JWT cookie
- **THEN** the backend SHALL respond with HTTP 401 and body `{ "error": "Unauthorized" }`

#### Scenario: words.json not found
- **WHEN** a GET request is made to `/api/words` and `words.json` does not exist on disk
- **THEN** the backend SHALL respond with HTTP 500 and body `{ "error": "Word database unavailable" }`
