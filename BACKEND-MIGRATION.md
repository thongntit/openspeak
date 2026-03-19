# OpenSpeak Backend Migration Plan

## Context

The current OpenSpeak app stores the Azure Speech API key directly in the browser's localStorage and calls Azure from the frontend using the Microsoft Speech SDK. This is a security risk (key exposed in bundle/network), bloats the bundle (~696 KB from the SDK), and prevents usage tracking.

The user wants to pivot to a proper **frontend + backend architecture** for single-user use (just themselves). The backend will hold the API key, proxy requests to Azure, serve the word database, and enforce a daily quota.

## Architecture

```
Browser (React PWA)
    │  POST /api/pronounce  (audio + word, httpOnly cookie sent automatically)
    ▼
Backend (Bun.serve — no framework)
    │  stores AZURE_SPEECH_KEY in env (never exposed)
    │  stores JWT in httpOnly cookie (JS cannot read — safe from XSS)
    ▼
Azure Speech REST API
```

### Runtime
- **Bun.serve** — no framework, no extra dependencies
- Deployed via Docker Compose with `oven/bun:2-alpine`
- Single container serves both API and frontend static files (no nginx needed)

### Auth Flow
1. User visits app → redirected to `/login`
2. Enters password → `POST /api/auth/token`
3. Backend validates → sets `httpOnly` cookie with JWT
4. All subsequent requests send the cookie automatically (same origin — no CORS issues)
5. `POST /api/auth/logout` clears the cookie

> **Dev vs Prod:** In local dev, Vite proxies `/api` to the backend server. In production, the backend serves everything from the same origin.

## File Map

### Files to CREATE

| File | Purpose |
|------|---------|
| `backend/src/index.ts` | Entry point — Bun.serve, all routes |
| `backend/src/routes/auth.ts` | POST /api/auth/token — password login → JWT in httpOnly cookie |
| `backend/src/routes/words.ts` | GET /api/words — serves words.json |
| `backend/src/routes/pronounce.ts` | POST /api/pronounce — proxies to Azure |
| `backend/src/routes/usage.ts` | GET /api/usage — daily quota status |
| `backend/src/services/azure.ts` | Azure REST API call |
| `backend/src/services/quota.ts` | In-memory daily quota tracking |
| `backend/src/middleware/auth.ts` | JWT verification from httpOnly cookie |
| `backend/.env.example` | Template for env vars |
| `backend/package.json` | Bun project (minimal deps: `jose` for JWT) |
| `Dockerfile` | `oven/bun:2-alpine` — serves API + frontend static files |
| `docker-compose.yml` | Runs app container + optional local dev override |
| `frontend/src/pages/Login.jsx` | Password login page |
| `frontend/src/pages/Logout.jsx` | Logout page (clears cookie) |

### Files to MODIFY

| File | Change |
|------|--------|
| `frontend/src/App.jsx` | Add Login + Logout routes + PrivateRoute wrapper |
| `frontend/src/pages/Home.jsx` | Remove `useSettingsStore` guard + Settings nav |
| `frontend/src/pages/Practice.jsx` | Replace `azureSpeech` call with `fetch` to backend; fix hardcoded `'85'` score |
| `frontend/src/services/wordService.js` | Sync from backend API instead of GitHub raw URL |
| `frontend/vite.config.js` | Add Vite proxy for `/api` → localhost:3001 |
| `frontend/package.json` | Remove `microsoft-cognitiveservices-speech-sdk` |
| `frontend/.env.development` | Add `VITE_API_URL=http://localhost:3001` |

### Files to DELETE

| File | Reason |
|------|--------|
| `frontend/src/services/azureSpeech.js` | Azure SDK wrapper — no longer needed |
| `frontend/src/stores/settingsStore.js` | API key/region store — no longer needed |
| `frontend/src/pages/Settings.jsx` | Settings page — replaced by Login page |

## Implementation Steps

### Phase 1: Backend

**Step 1.1** — Create `backend/` project with Bun (no framework)
```
backend/
├── src/
│   ├── index.ts           # Bun.serve entry point
│   ├── routes/
│   │   ├── auth.ts        # login/logout/me
│   │   ├── words.ts       # word database
│   │   ├── pronounce.ts   # Azure proxy
│   │   └── usage.ts       # quota status
│   ├── services/
│   │   ├── azure.ts       # Azure REST API call
│   │   └── quota.ts       # in-memory quota tracking
│   └── middleware/
│       └── auth.ts        # JWT from cookie verification
├── Dockerfile             # oven/bun:2-alpine
├── docker-compose.yml     # app + optional override for local dev
├── package.json           # only "jose" for JWT, everything else is Bun built-ins
├── .env.example
└── .gitignore
```

**Step 1.2** — Auth: password → JWT in httpOnly cookie (24h expiry)
- `POST /api/auth/token` — body: `{ password }` → sets `httpOnly` cookie + returns `{ expiresIn }`
- `JWT_SECRET` + `AUTH_PASSWORD` in env
- Cookie: `httpOnly: true`, `secure: true` (prod), `sameSite: lax`, `path: /`
- `POST /api/auth/logout` — clears cookie
- `GET /api/auth/me` — returns `{ ok: true }` (used to check if logged in)
- Static password only — no user database

**Step 1.3** — Word serving
- `GET /api/words` — returns `words.json` (reads from `./words.json` at runtime)
- Authenticated endpoint

**Step 1.4** — Azure proxy
- `POST /api/pronounce` — multipart: `audio` (webm blob) + `word` (string)
- Calls Azure Speech REST API (`/speech/recognition/interactive/cognitiveservices/v1`)
- Returns `{ score, feedback: { accuracyScore, fluencyScore, ... }, words }`
- Increments usage counter on success

**Step 1.5** — Quota
- 15 requests/day default (`DAILY_LIMIT` env)
- In-memory `Map<string, { count, resetAt }>`
- `GET /api/usage` — returns `{ used, limit, resetAt }`
- Returns `429` on `/api/pronounce` when exceeded

**Step 1.6** — Serve frontend static files
- Built frontend in `../frontend/dist/` served at `/`
- All `/api/*` routes handled first, fallback to static file serve
- No CORS issues — same origin

**Step 1.7** — Docker setup
- `Dockerfile`: `oven/bun:2-alpine` — install deps, copy backend + frontend build, expose ports
- `docker-compose.yml`: app container + optional `.local.yml` override for mounting source code during dev
- Test: `docker compose up --build`

**Step 1.8** — Test all endpoints with curl

### Phase 2: Frontend Cuts Over

**Step 2.1** — Add `VITE_API_URL` env var (for local dev Vite proxy)

**Step 2.2** — Create `Login.jsx`
- Password input → `POST /api/auth/token`
- On success → backend sets httpOnly cookie → redirect to `/`
- On failure → show error
- No client-side token storage needed — cookie is handled by the browser automatically

**Step 2.3** — Create `Logout.jsx`
- `POST /api/auth/logout` → clears httpOnly cookie
- Redirect to `/login`

**Step 2.4** — Update `App.jsx`
- Add `/login` and `/logout` routes
- Wrap `/` and `/practice` with `PrivateRoute` (redirects to `/login` if no valid session)
- Auth check: `GET /api/auth/me` (or just try `/api/usage`) — if 401, redirect to login

**Step 2.5** — Update `Practice.jsx`
- Remove `useSettingsStore`, `azureSpeech` import
- Remove `azureSpeech.initialize()` useEffect
- Replace `azureSpeech.assessPronunciation()` with:
  ```js
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  formData.append('word', wordData.word);
  const res = await fetch(`${API_URL}/api/pronounce`, {
    credentials: 'include',  // sends httpOnly cookie automatically
    body: formData,
  });
  ```
- Fix score display: `{result.score ?? '--'}` instead of hardcoded `'85'`
- Handle 429 (quota exceeded) with clear error message

**Step 2.6** — Update `Home.jsx`
- Remove `useSettingsStore` import
- Remove `hasSettings` guard and yellow warning banner
- Replace Settings button with Logout button in nav bar

**Step 2.7** — Update `wordService.js`
- `syncFromBackend()` → `GET /api/words` with `credentials: 'include'`
- Falls back to existing IndexedDB cache if backend unreachable
- Background sync check every 1 hour

### Phase 3: Cleanup

**Step 3.1** — Remove from `frontend/package.json`: `microsoft-cognitiveservices-speech-sdk`
**Step 3.2** — Delete `azureSpeech.js`, `settingsStore.js`, `Settings.jsx`
**Step 3.3** — Run `bun run build` in frontend, verify bundle size drops

## Verification

**Local dev:**
1. Start backend: `cd backend && bun src/index.ts` (port 3001)
2. Start frontend: `cd frontend && bun run dev` (port 5173, Vite proxies `/api` → 3001)
3. Login at `http://localhost:5173/login`
4. Practice: pick a word → record → see real score
5. Check quota: `curl http://localhost:3001/api/usage`
6. Hit quota → verify 429 error surfaces in UI

**Docker:**
1. `docker compose up --build`
2. App at `http://localhost:3000`
3. Run through login → practice → score flow
4. Check `docker compose logs -f backend`

**Build check:**
- Frontend bundle after removing SDK: should drop from ~1.2 MB to ~450 KB

## Optional (Post-MVP)

- Add rate limiting middleware
- HTTPS (traefik/Caddy reverse proxy in front of Docker Compose)
- Database-backed quota (SQLite) for persistence across restarts
- PWA offline strategy for `/api/words`
- Mobile app (React Native)
