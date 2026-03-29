## ADDED Requirements

### Requirement: Daily request quota is configurable and enforced
The backend SHALL enforce a daily request limit configurable via `DAILY_LIMIT` env var (default: 15).

#### Scenario: Quota not exceeded
- **WHEN** a user with an authenticated session makes a request and their daily count is below the limit
- **THEN** the request SHALL be processed normally and the counter SHALL be incremented

#### Scenario: Quota exceeded returns 429
- **WHEN** a user with an authenticated session makes a request and their daily count equals or exceeds the limit
- **THEN** the backend SHALL respond with HTTP 429 and body `{ "error": "Daily quota exceeded", "used": <n>, "limit": <n>, "resetAt": <unix_ms> }`

### Requirement: Quota resets at midnight UTC
The backend SHALL reset the daily counter at midnight UTC.

#### Scenario: Counter resets at midnight
- **WHEN** a user's `resetAt` timestamp has passed the current Unix ms
- **THEN** the counter SHALL be treated as 0 and `resetAt` SHALL be set to the next midnight UTC

### Requirement: Usage endpoint returns current quota status
The backend SHALL expose the user's current usage via `/api/usage`.

#### Scenario: Authenticated usage check
- **WHEN** a GET request is made to `/api/usage` by an authenticated user
- **THEN** the backend SHALL respond with HTTP 200 and body `{ "used": <n>, "limit": <n>, "resetAt": <unix_ms> }`

#### Scenario: Unauthenticated usage check
- **WHEN** a GET request is made to `/api/usage` without a valid JWT cookie
- **THEN** the backend SHALL respond with HTTP 401 and body `{ "error": "Unauthorized" }`

### Requirement: Quota is per-session (stable key derived from JWT)
The backend SHALL use a stable session key derived from the JWT payload (e.g., `jti` claim or full token hash) as the quota store key.

#### Scenario: Same session has consistent quota
- **WHEN** an authenticated user makes multiple requests within the same day
- **THEN** all requests SHALL use the same quota key so counts accumulate correctly
