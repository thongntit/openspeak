# OpenSpeak MVP - Implementation Complete

## Current Status

**Frontend MVP is complete.** The React PWA with Azure Speech SDK integration is working.

**Next step:** Backend migration to secure the API key and add usage quotas.

See [BACKEND-MIGRATION.md](../BACKEND-MIGRATION.md) for the full plan.

## What's Built

| Component | Status | Location |
|-----------|--------|----------|
| React PWA | ✅ Working | `frontend/` |
| Azure Speech integration | ✅ Working | `frontend/src/services/azureSpeech.js` |
| Settings page | ✅ Working | `frontend/src/pages/Settings.jsx` |
| Practice page | ✅ Working | `frontend/src/pages/Practice.jsx` |
| Home page | ✅ Working | `frontend/src/pages/Home.jsx` |
| Word database (IndexedDB) | ✅ Working | `frontend/src/services/wordService.js` |

## Current Architecture

```
Browser → Azure Speech SDK (API key in localStorage) ⚠️
```

## Target Architecture

```
Browser → Backend (Bun) → Azure Speech REST API
         (API key in env)
```

## Migration Tasks

See [BACKEND-MIGRATION.md](../BACKEND-MIGRATION.md) for detailed steps.

### High-level overview:

1. **Backend** (Phase 1)
   - Auth with JWT in httpOnly cookie
   - Azure proxy with daily quota (15/day)
   - Serve word database

2. **Frontend cuts over** (Phase 2)
   - Login/logout pages
   - Backend API calls instead of Azure SDK

3. **Cleanup** (Phase 3)
   - Remove Azure SDK from bundle (saves ~696 KB)
   - Remove `settingsStore.js`, `Settings.jsx`
