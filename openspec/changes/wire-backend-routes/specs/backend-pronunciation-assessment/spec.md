## ADDED Requirements

### Requirement: Azure proxy accepts audio and word, returns assessment
The backend SHALL proxy pronunciation assessment requests to the Azure Speech REST API and return structured results.

#### Scenario: Successful pronunciation assessment
- **WHEN** a POST request is made to `/api/pronounce` with `multipart/form-data` containing `audio` (webm blob) and `word` (string) fields, and the user is authenticated and within quota
- **THEN** the backend SHALL call Azure Speech REST API at `https://<AZURE_REGION>.stt.speech.microsoft.com/speech/recognition/interactive/cognitiveservices/v1?format=detailed` with the audio and `Ocp-Apim-Subscription-Key: <AZURE_SPEECH_KEY>` header
- **AND** the backend SHALL return the Azure response body as JSON: `{ "score": <number>, "feedback": { ... }, "words": [...] }`

#### Scenario: Pronounce request without audio
- **WHEN** a POST request is made to `/api/pronounce` with missing `audio` field
- **THEN** the backend SHALL respond with HTTP 400 and body `{ "error": "audio is required" }`

#### Scenario: Pronounce request without word
- **WHEN** a POST request is made to `/api/pronounce` with missing `word` field
- **THEN** the backend SHALL respond with HTTP 400 and body `{ "error": "word is required" }`

#### Scenario: Pronounce request unauthenticated
- **WHEN** a POST request is made to `/api/pronounce` without a valid JWT cookie
- **THEN** the backend SHALL respond with HTTP 401 and body `{ "error": "Unauthorized" }`

#### Scenario: Pronounce request when quota exceeded
- **WHEN** a POST request is made to `/api/pronounce` when the user's daily request count has reached the limit
- **THEN** the backend SHALL respond with HTTP 429 and body `{ "error": "Daily quota exceeded", "used": <n>, "limit": <n>, "resetAt": <unix_ms> }`

### Requirement: Usage counter increments on successful Azure call
The backend SHALL increment the user's daily usage counter after a successful Azure response.

#### Scenario: Counter increments on success
- **WHEN** a POST request to `/api/pronounce` results in a successful Azure response
- **THEN** the quota store SHALL be updated to increment the user's daily request count

### Requirement: Azure errors are surfaced to the client
The backend SHALL return Azure API errors as meaningful HTTP responses.

#### Scenario: Azure returns error
- **WHEN** Azure Speech REST API returns an error response
- **THEN** the backend SHALL respond with HTTP 502 and body `{ "error": "Azure error: <message>" }`
