## 1. Project Setup

- [x] 1.1 Add `jose` dependency to `backend/package.json`
- [x] 1.2 Create `backend/.env.example` with `AUTH_PASSWORD`, `JWT_SECRET`, `AZURE_SPEECH_KEY`, `AZURE_REGION`, `DAILY_LIMIT` (default 15), `PORT` (default 3001)
- [x] 1.3 Create `backend/.gitignore` (node_modules, .env, dist, data/)

## 2. Auth Middleware

- [x] 2.1 Implement `middleware/auth.ts` — `verifyToken` function that reads `token` cookie, verifies JWT with `jose`, returns `401 { error: "Unauthorized" }` if missing/expired/invalid; exports `requireAuth` helper

## 3. Auth Routes

- [x] 3.1 Implement `POST /api/auth/token` in `routes/auth.ts` — validate `password` field against `AUTH_PASSWORD`, sign JWT (24h expiry, `jti` for quota key), set httpOnly cookie (`sameSite: lax`, `path: /`, `secure` in prod), return `{ ok: true, expiresIn: 86400 }`; handle missing password (400), wrong password (401)
- [x] 3.2 Implement `POST /api/auth/logout` in `routes/auth.ts` — clear `token` cookie (`Max-Age=0`), return 200
- [x] 3.3 Implement `GET /api/auth/me` in `routes/auth.ts` — use `requireAuth`, return `{ ok: true }`

## 4. Quota Service & Usage Route

- [x] 4.1 Verify `InMemoryQuotaStore` in `services/storage/memory.ts` handles midnight UTC reset in `get()` — reset `resetAt` to next midnight and `count` to 0 if `resetAt` has passed
- [x] 4.2 Implement `QuotaService` in `services/quota.ts` — `checkAndIncrement(sessionKey)` returns `{ allowed: boolean, used, limit, resetAt }`; `get(sessionKey)` returns usage
- [x] 4.3 Implement `GET /api/usage` in `routes/usage.ts` — `requireAuth`, call `quotaService.get(sessionKey)`, return `{ used, limit, resetAt }`

## 5. Words Route

- [x] 5.1 Implement `GET /api/words` in `routes/words.ts` — `requireAuth`, read `words.json` from disk, return as JSON; handle missing file (500) and auth errors

## 6. Azure Service & Pronounce Route

- [x] 6.1 Implement `services/azure.ts` — `assessPronunciation(audioBuffer, word, region, key)` calls Azure Speech REST API at `https://<region>.stt.speech.microsoft.com/speech/recognition/interactive/cognitiveservices/v1?format=detailed` with `Ocp-Apim-Subscription-Key` header, returns parsed JSON; handles non-200 responses
- [x] 6.2 Implement `POST /api/pronounce` in `routes/pronounce.ts` — `requireAuth`, parse multipart `audio` + `word`, call `quotaService.checkAndIncrement(sessionKey)`, return 429 if exceeded, call `azureService.assessPronunciation()`, increment quota on success, return Azure result; validate audio (400) and word (400) presence

## 7. Wire index.ts Composition Root

- [x] 7.1 Replace `Bun.serve` in `index.ts` — create `deps: AppDeps` with `quotaStore: new InMemoryQuotaStore()`, wire all routes; URL pattern matching (prefix-based); serve static files from `../frontend/dist/` at `/` as fallback
- [x] 7.2 Add env validation — log and exit if `AUTH_PASSWORD`, `JWT_SECRET`, `AZURE_SPEECH_KEY`, `AZURE_REGION` are missing

## 8. Docker Setup

- [x] 8.1 Create `backend/Dockerfile` — `FROM oven/bun:2-alpine`, copy backend files, `bun install`, set `CMD ["bun", "src/index.ts"]`
- [x] 8.2 Create `backend/docker-compose.yml` — service `app`, build from `.`, ports `3000:3000`, env from `.env` file (prod), restart policy
- [x] 8.3 Create `backend/.local.yml` — optional compose override that mounts `./src` as a volume for hot-reload dev

## 9. Verification

- [x] 9.1 Test `POST /api/auth/token` with wrong password → 401 ✅
- [x] 9.2 Test `POST /api/auth/token` with correct password → 200 + httpOnly cookie set ✅
- [x] 9.3 Test `GET /api/auth/me` without cookie → 401 ✅
- [x] 9.4 Test `GET /api/auth/me` with valid cookie → 200 `{ ok: true }` ✅
- [x] 9.5 Test `GET /api/usage` unauthenticated → 401 ✅
- [x] 9.6 Test `GET /api/usage` authenticated → 200 `{ used, limit, resetAt }` ✅
- [x] 9.7 Test `GET /api/words` unauthenticated → 401 ✅
- [x] 9.8 Test `GET /api/words` authenticated → 200 (word list) ✅
- [x] 9.9 Test `POST /api/pronounce` without audio → 400 ✅
- [x] 9.10 Test `POST /api/pronounce` without word → 400 ✅
- [x] 9.11 Test `POST /api/pronounce` exceeding quota → 429 ✅
- [x] 9.12 Test Docker build: `docker build -t openspeak-backend backend/` ✅ (built successfully with podman, oven/bun:1.3.10-alpine)
- [x] 9.13 Test Docker Compose: `docker compose -f backend/docker-compose.yml up --build` ✅ (container running with all endpoints verified)
