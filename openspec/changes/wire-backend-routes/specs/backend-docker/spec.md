## ADDED Requirements

### Requirement: Docker image runs on oven/bun:2-alpine
The backend SHALL be packaged in a Docker image using `oven/bun:2-alpine`.

#### Scenario: Dockerfile builds successfully
- **WHEN** `docker build` is run in the `backend/` directory
- **THEN** the resulting image SHALL contain the backend source, installed dependencies, and be able to run `bun src/index.ts`

### Requirement: Docker Compose runs the app container
The backend SHALL be deployable via `docker compose up`.

#### Scenario: docker compose up starts the backend
- **WHEN** `docker compose up --build` is run
- **THEN** the backend container SHALL start, bind to port 3000, and serve the API and frontend static files

#### Scenario: Backend serves frontend static files
- **WHEN** the built frontend exists at `../frontend/dist/` relative to the backend directory
- **THEN** the container SHALL serve those files at `/` (catch-all after API routes)

### Requirement: Environment variables are configured at runtime
The backend SHALL read all secrets and config from environment variables.

#### Scenario: Required env vars
- **WHEN** the container starts
- **THEN** the following env vars SHALL be present: `AUTH_PASSWORD`, `JWT_SECRET`, `AZURE_SPEECH_KEY`, `AZURE_REGION`, and optionally `DAILY_LIMIT` (default 15)

#### Scenario: Missing required env var
- **WHEN** the container starts without a required env var
- **THEN** the backend SHALL log the missing variable name and exit with a non-zero status

### Requirement: Dev override via docker-compose
The backend SHALL support an optional `.local.yml` override for mounting source code during local development.

#### Scenario: Local dev override
- **WHEN** `docker compose -f docker-compose.yml -f .local.yml up` is run
- **THEN** the backend source directory SHALL be mounted into the container for hot-reload
