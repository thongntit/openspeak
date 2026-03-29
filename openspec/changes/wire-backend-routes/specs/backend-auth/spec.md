## ADDED Requirements

### Requirement: Static password login issues JWT in httpOnly cookie
The backend SHALL accept a static password from `AUTH_PASSWORD` env var and issue a JWT on successful login.

#### Scenario: Successful login
- **WHEN** a POST request is made to `/api/auth/token` with body `{ "password": "<correct password>" }`
- **THEN** the backend SHALL respond with `{ "ok": true, "expiresIn": 86400 }` and set an `httpOnly` cookie named `token` containing the JWT, with `sameSite: lax`, `path: /`, and `secure: true` in production

#### Scenario: Failed login with wrong password
- **WHEN** a POST request is made to `/api/auth/token` with body `{ "password": "<wrong password>" }`
- **THEN** the backend SHALL respond with HTTP 401 and body `{ "error": "Invalid credentials" }`

#### Scenario: Failed login with missing password
- **WHEN** a POST request is made to `/api/auth/token` with a missing or empty password field
- **THEN** the backend SHALL respond with HTTP 400 and body `{ "error": "Password required" }`

### Requirement: Logout clears the auth cookie
The backend SHALL clear the JWT cookie on logout.

#### Scenario: Successful logout
- **WHEN** a POST request is made to `/api/auth/logout` by an authenticated user
- **THEN** the backend SHALL respond with HTTP 200 and clear the `token` cookie by setting `token=; Max-Age=0; path=/`

### Requirement: Authenticated session check
The backend SHALL allow clients to verify whether they have a valid session.

#### Scenario: Valid session
- **WHEN** a GET request is made to `/api/auth/me` with a valid, non-expired JWT cookie
- **THEN** the backend SHALL respond with HTTP 200 and body `{ "ok": true }`

#### Scenario: Missing or invalid session
- **WHEN** a GET request is made to `/api/auth/me` with no cookie, an expired JWT, or a malformed token
- **THEN** the backend SHALL respond with HTTP 401 and body `{ "error": "Unauthorized" }`

### Requirement: Protected routes require valid JWT
The backend SHALL enforce authentication on `/api/words`, `/api/pronounce`, and `/api/usage`.

#### Scenario: Request to protected route with valid cookie
- **WHEN** a request is made to a protected endpoint with a valid JWT cookie
- **THEN** the request SHALL be processed normally

#### Scenario: Request to protected route without cookie
- **WHEN** a request is made to a protected endpoint without the `token` cookie
- **THEN** the backend SHALL respond with HTTP 401 and body `{ "error": "Unauthorized" }`

#### Scenario: Request to protected route with expired cookie
- **WHEN** a request is made to a protected endpoint with an expired JWT cookie
- **THEN** the backend SHALL respond with HTTP 401 and body `{ "error": "Unauthorized" }`
