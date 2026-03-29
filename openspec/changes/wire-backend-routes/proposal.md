## Why

The OpenSpeak backend has all route files and services stubbed out, but `index.ts` currently returns `501 Not implemented` for every request. The routes need to be wired into Bun.serve so the API is functional before the frontend cut-over can begin.

## What Changes

- Wire all route handlers (`auth`, `words`, `pronounce`, `usage`) into `index.ts` using the `AppDeps` composition root pattern
- Implement JWT auth middleware (`middleware/auth.ts`) — reads httpOnly cookie, returns 401 on invalid/expired
- Implement the `auth` route handlers (`/api/auth/token`, `/api/auth/logout`, `/api/auth/me`)
- Implement the `words` route handler (`GET /api/words`)
- Implement the `pronounce` route handler (`POST /api/pronounce` Azure proxy)
- Implement the `usage` route handler (`GET /api/usage`)
- Add static file serving for the built frontend (`../frontend/dist/`) at `/`
- Add Docker setup (`Dockerfile`, `docker-compose.yml`)
- Write a `.env.example` template
- Add `.gitignore`

## Capabilities

### New Capabilities
- `backend-auth`: JWT issued from static password login, stored in httpOnly cookie. Three endpoints: token issuance, logout (cookie clear), and session check.
- `backend-pronunciation-assessment`: Proxies recorded audio + word to Azure Speech REST API, returns structured score/feedback. Increments daily usage counter.
- `backend-quota-tracking`: In-memory daily request counter per session, with configurable `DAILY_LIMIT` (default 15). Enforces 429 on `/api/pronounce` when exceeded.
- `backend-word-database`: Serves `words.json` from disk to authenticated clients.
- `backend-docker`: Single-container Docker deployment using `oven/bun:2-alpine`, serves both API and frontend static files from same origin.

### Modified Capabilities
*(none — Phase 1 of an existing migration)*

## Impact

- **Backend:** `index.ts` becomes the composition root; all route files move from stubs to implementations; new middleware file created
- **New files:** `Dockerfile`, `docker-compose.yml`, `.env.example`, `.gitignore` in `backend/`
- **Dependencies:** `jose` added to `backend/package.json` (JWT); all other deps are Bun built-ins
- **Frontend:** Unchanged in this phase — frontend still uses Azure SDK directly (Phase 2)
