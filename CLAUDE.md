# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenSpeak is a mobile-first PWA for English pronunciation assessment using Azure Speech Services. Currently migrating from a client-side-only architecture (API key in localStorage) to a **frontend + backend** architecture (API key secured in backend env).

## Architecture

### Current State (In Migration)

**Frontend (complete):** React 19 PWA with Azure Speech SDK calling Azure directly from the browser.

**Backend (in progress):** Bun.serve with all route files created but not wired yet — `index.ts` returns `501 Not implemented`.

```
Current:
Browser → Azure Speech SDK (API key in localStorage) ⚠️

Target:
Browser → Backend (Bun) → Azure Speech REST API
         (API key in env, JWT in httpOnly cookie)
```

### Frontend Architecture

- **React 19** + Vite + Tailwind CSS (mobile-first)
- **State:** Zustand stores in `frontend/src/stores/`
- **Routing:** React Router v7 with routes `/`, `/practice`, `/settings`
- **PWA:** vite-plugin-pwa auto-generates service worker
- **Components:** `frontend/src/components/` (Splash, ThemeToggle, ReloadPrompt, AppLoader)
- **Stores:**
  - `pronunciationStore.js` — recording state, results
  - `settingsStore.js` — API key/region (will be deleted in migration)
  - `themeStore.js` — dark mode toggle

### Backend Architecture

- **Runtime:** Bun.serve (no framework, minimal deps)
- **TypeScript** with dependency injection via `AppDeps`
- **Auth:** JWT in httpOnly cookie (24h expiry, static password)
- **Storage:** `IQuotaStore` interface — `InMemoryQuotaStore` now, swap to `SqliteQuotaStore` in one line later
- **Files:** All route/service files exist in `backend/src/`, wired together in `index.ts` (composition root)

```
backend/src/
├── index.ts              # Composition root — wires routes with deps
├── types/
│   ├── deps.ts           # AppDeps interface
│   └── storage.ts        # IQuotaStore, IHistoryStore interfaces
├── routes/
│   ├── auth.ts           # /api/auth/token, /logout, /me
│   ├── words.ts          # /api/words
│   ├── pronounce.ts      # /api/pronounce (Azure proxy)
│   └── usage.ts          # /api/usage
├── services/
│   ├── azure.ts          # Azure Speech REST API call
│   ├── quota.ts          # QuotaService
│   └── storage/
│       ├── memory.ts     # InMemoryQuotaStore
│       └── sqlite.ts     # SqliteQuotaStore (stub)
└── middleware/
    └── auth.ts           # JWT verification from cookie
```

## Migration Plan

See `BACKEND-MIGRATION.md` for full details. High-level:

1. **Phase 1:** Wire backend routes, Docker setup
2. **Phase 2:** Frontend cuts over — Login/Logout pages, backend API calls
3. **Phase 3:** Remove Azure SDK from frontend bundle (saves ~696 KB)

## Key Conventions

- **Frontend:** JavaScript `.jsx`/`.js`, see `AGENTS.md` for code style
- **Backend:** TypeScript `.ts`, composition root pattern, routes receive `AppDeps`
- **DI pattern:** `backend/src/index.ts` is the only place that instantiates dependencies — routes never import storage directly
- **SQLite swap:** Change one line in `index.ts`:
  ```ts
  quotaStore: new InMemoryQuotaStore()  // current
  quotaStore: new SqliteQuotaStore('./data/openspeak.db')  // future
  ```

## Important Notes

- `AGENTS.md` contains detailed code style, naming conventions, and frontend patterns — reference it for implementation details
- The `backend/` directory exists but routes need to be wired in `backend/src/index.ts`
- `frontend/src/services/wordService.js` currently fetches from GitHub — will be updated to use backend API
- No tests are currently configured for this project
