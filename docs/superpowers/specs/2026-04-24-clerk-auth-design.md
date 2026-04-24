# Clerk Auth Integration — Design Spec

**Date:** 2026-04-24
**Status:** Approved

---

## Overview

Integrate Clerk as the authentication provider for OpenSpeak. Auth is embedded in-app (no redirects). Public routes stay accessible to all; private practice features require login. The backend verifies Clerk JWTs without maintaining its own users table — Clerk user ID is the reference key for future user-specific data.

---

## Architecture

```
Frontend (ClerkProvider)
  ├── Public routes  → accessible to everyone
  └── Private routes → <SignedIn> guard
        └── If not signed in → show embedded <SignIn />

Backend (ClerkMiddleware)
  ├── Public endpoints  → no auth required
  └── Protected endpoints → verify Clerk JWT, extract clerkUserId
```

---

## Frontend

### Package
`@clerk/clerk-react`

### Route access
| Route | Access |
|-------|--------|
| `/` | Public |
| `/practice` | Private |
| `/settings` | Private |
| Future news/exercises pages | Public |

### Implementation
- Wrap `App.jsx` in `<ClerkProvider publishableKey={...}>`
- Create a `<PrivateRoute>` wrapper using Clerk's `<SignedIn>` / `<SignedOut>` components
- `<SignedOut>` renders embedded `<SignIn />` (no redirect)
- All API requests attach Clerk JWT via `useAuth().getToken()` → `Authorization: Bearer <token>`
- Remove Azure API key fields from `settingsStore.js` and `Settings.jsx`

### Env var
```
VITE_CLERK_PUBLISHABLE_KEY=pk_...
```

---

## Backend

### Package
`@clerk/backend`

### Changes
- Delete `backend/src/auth/` folder (partial JWT implementation, unused)
- Create `ClerkMiddleware` that verifies the Bearer token on protected routes using Clerk's `verifyToken()`
- Middleware attaches `clerkUserId` to the request object
- No users table — Clerk user ID used directly as user reference

### Protected vs public endpoints
| Endpoint | Access |
|----------|--------|
| `GET /api/health` | Public |
| `GET /api/words` | Public |
| `GET /api/collections` | Public |
| `POST /api/pronunciation/assess` (future) | Protected |

### Env var
```
CLERK_SECRET_KEY=sk_...
```

---

## What's Not In Scope

- Clerk webhook / user sync to PostgreSQL (add later when practice history is needed)
- Social login configuration (handled in Clerk dashboard, no code change)
- Subscription / paid tier gating (separate phase)
- Removing Azure Speech SDK from frontend (separate phase)

---

## Cleanup

- Remove `backend/src/auth/` (user.entity, auth.service, auth.controller, auth.module, jwt.strategy, jwt-auth.guard, dto/)
- Remove `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt` from backend deps
- Remove Azure key fields from `settingsStore.js` and the Settings page UI
