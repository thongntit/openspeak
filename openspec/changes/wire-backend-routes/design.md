## Context

The OpenSpeak backend (`backend/src/`) has a complete directory structure with all files stubbed out:

- Route stubs in `routes/` (`auth.ts`, `words.ts`, `pronounce.ts`, `usage.ts`) — contain only comments describing what they'll do
- Service stubs in `services/` (`azure.ts`, `quota.ts`) — contain only comments
- Storage interfaces in `types/storage.ts` (`IQuotaStore`, `IHistoryStore`) — fully defined
- `AppDeps` interface in `types/deps.ts` — defined, not yet used
- Auth middleware stub in `middleware/auth.ts` — empty

The single `index.ts` currently returns `501` for all requests. This phase wires everything together and adds Docker.

## Goals / Non-Goals

**Goals:**
- Functional backend API: auth, word serving, Azure proxy, quota checking
- `AppDeps` composition root in `index.ts` — one-line swap from `InMemoryQuotaStore` → `SqliteQuotaStore`
- JWT in httpOnly cookie (no client-side JS access)
- Single Docker container serving both API and frontend static files
- No framework — Bun built-ins only except `jose`

**Non-Goals:**
- SQLite persistence (Phase 2)
- Rate limiting middleware beyond daily quota
- Frontend changes (Phase 2)
- HTTPS reverse proxy (post-MVP)
- User database — static password only

## Decisions

### No framework, Bun built-ins only

**Decision:** Use `Bun.serve` directly, `Bun.file()` for static files, `Headers`, `Request`, `Response` — no router library.

**Rationale:** Bun's built-in HTTP APIs are sufficient for 4 routes. Adding a router adds a dependency for negligible benefit.

**Alternative considered:** `hono` or `elysia` — adds deps, increases attack surface, not needed for 4 endpoints.

### JWT library: `jose`

**Decision:** Use the `jose` npm package for JWT signing/verification.

**Rationale:** Pure Web API implementation, no native deps, works in Bun. Bun's built-in `Crypto` APIs could be used directly but `jose` is more ergonomic and battle-tested.

**Alternative considered:** `jsonwebtoken` — requires Node.js `crypto` module, adds Node compatibility risk in Bun.

### Auth: httpOnly cookie + `credentials: include`

**Decision:** JWT stored in `httpOnly` cookie, sent automatically with `credentials: 'include'` on frontend fetch calls.

**Rationale:** No XSS access to token, no manual token storage needed on client, no CORS issues (same-origin in prod, Vite proxy in dev).

### Cookie security: `sameSite: 'lax'`

**Decision:** Cookie: `httpOnly: true`, `secure: true` (prod), `sameSite: 'lax'`, `path: '/'`.

**Rationale:** `sameSite: 'strict'` would break Vite dev proxy flow. `lax` is appropriate — token in POST body is not vulnerable since it's httpOnly anyway.

### Storage swap pattern: `AppDeps` composition root

**Decision:** `index.ts` is the only place that instantiates `InMemoryQuotaStore`. Swap to `SqliteQuotaStore` by changing one line.

**Rationale:** Explicit in the plan, enables Phase 2 without touching any route files.

### Serving frontend static files

**Decision:** Built frontend at `../frontend/dist/` served at `/` (catch-all after API routes).

**Rationale:** No nginx needed — Bun can serve static files. Single container, single origin, no CORS.

## Risks / Trade-offs

**[Risk] In-memory quota resets on container restart**
→ **Mitigation:** Acceptable for single-user personal use. SQLite migration is Phase 2.

**[Risk] Static password in environment variable**
→ **Mitigation:** `AUTH_PASSWORD` is a strong random string set at deploy time, not checked into source control (`.env.example` as template only).

**[Risk] No CSRF protection**
→ **Mitigation:** Not needed — `httpOnly` cookie with `sameSite: lax` prevents CSRF from reading the token; POST requires the cookie which browsers send automatically for same-origin requests.

**[Risk] Vite dev proxy needs cookie domain handling**
→ **Mitigation:** In dev, both Vite (5173) and Bun (3001) are localhost — cookies work fine. Vite proxies `/api` transparently. Frontend code uses relative URLs.

## Migration Plan

**Local dev verification:**
1. `cd backend && bun src/index.ts` (port 3001)
2. `cd frontend && bun run dev` (port 5173, Vite proxies `/api` → 3001)
3. Login at `http://localhost:5173/login` → check cookie set
4. `curl -b cookies.txt http://localhost:3001/api/usage` → verify auth
5. `curl -X POST http://localhost:3001/api/pronounce -F audio=@test.webm -F word=hello` → test Azure proxy (needs mock or real key)

**Docker verification:**
1. `docker compose up --build`
2. App at `http://localhost:3000`
3. Login → practice → score flow end-to-end
4. `docker compose logs -f backend` — inspect logs

**Rollback:** Disable the new container, restart old frontend-only deployment. No database migration needed in Phase 1.
