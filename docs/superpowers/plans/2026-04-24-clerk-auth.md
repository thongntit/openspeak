# Clerk Auth Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Clerk as the auth provider — embedded sign-in on private routes, JWT verification on the backend, no users table.

**Architecture:** Frontend wraps private routes (`/practice`, `/settings`) with a `<PrivateRoute>` component that shows Clerk's embedded `<SignIn />` when signed out. Backend installs `@clerk/backend`, applies a `ClerkMiddleware` to protected routes that verifies the Bearer token and attaches `clerkUserId` to the request. Partial JWT auth files from a previous session are deleted.

**Tech Stack:** `@clerk/clerk-react` (frontend), `@clerk/backend` (backend), NestJS middleware, React Router DOM 7, Zustand

---

## File Map

### Backend — delete
- `backend/src/auth/` (entire folder: user.entity.ts, auth.service.ts, auth.controller.ts, auth.module.ts, jwt.strategy.ts, jwt-auth.guard.ts, dto/)

### Backend — create
- `backend/src/common/middleware/clerk.middleware.ts` — verifies Clerk JWT, attaches `clerkUserId` to request

### Backend — modify
- `backend/src/app.module.ts` — add `CLERK_SECRET_KEY` to Joi schema, apply `ClerkMiddleware` to protected routes
- `backend/.env.example` — add `CLERK_SECRET_KEY` placeholder
- `backend/package.json` — remove JWT/passport/bcrypt deps, add `@clerk/backend`

### Frontend — install
- `@clerk/clerk-react`

### Frontend — create
- `frontend/src/components/PrivateRoute.jsx` — shows `<SignIn />` when signed out, children when signed in

### Frontend — modify
- `frontend/src/main.jsx` — wrap tree in `<ClerkProvider>`
- `frontend/src/App.jsx` — wrap `/practice` and `/settings` routes with `<PrivateRoute>`
- `frontend/src/services/openspeakApi.js` — accept optional `token` param, attach as `Authorization: Bearer`
- `frontend/src/stores/settingsStore.js` — remove `azureApiKey`, `azureRegion`, related actions
- `frontend/src/pages/Settings.jsx` — remove Azure credential UI, keep page as shell for future settings
- `frontend/.env` — add `VITE_CLERK_PUBLISHABLE_KEY` placeholder
- `frontend/.env.example` (if exists) — same

---

## Task 1: Clean up partial backend auth files

**Files:**
- Delete: `backend/src/auth/` (entire folder)
- Modify: `backend/package.json`

- [ ] **Step 1: Remove the auth folder**

```bash
rm -rf backend/src/auth
```

- [ ] **Step 2: Uninstall unused packages**

```bash
cd backend && npm uninstall @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt && npm uninstall -D @types/passport-jwt @types/bcrypt
```

- [ ] **Step 3: Verify backend still builds**

```bash
cd backend && npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove partial JWT auth implementation"
```

---

## Task 2: Install Clerk on backend and create middleware

**Files:**
- Modify: `backend/package.json`
- Create: `backend/src/common/middleware/clerk.middleware.ts`

- [ ] **Step 1: Install `@clerk/backend`**

```bash
cd backend && npm install @clerk/backend
```

- [ ] **Step 2: Create `backend/src/common/middleware/clerk.middleware.ts`**

```typescript
import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClerkClient } from '@clerk/backend';
import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  clerkUserId: string;
}

@Injectable()
export class ClerkMiddleware implements NestMiddleware {
  private clerk;

  constructor(private readonly config: ConfigService) {
    this.clerk = createClerkClient({
      secretKey: this.config.getOrThrow<string>('CLERK_SECRET_KEY'),
    });
  }

  async use(req: Request, _res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Bearer token');
    }
    const token = authHeader.slice(7);
    try {
      const payload = await this.clerk.verifyToken(token);
      (req as AuthenticatedRequest).clerkUserId = payload.sub;
      next();
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd backend && npm run build
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(backend): add ClerkMiddleware for JWT verification"
```

---

## Task 3: Wire ClerkMiddleware and add env validation

**Files:**
- Modify: `backend/src/app.module.ts`
- Modify: `backend/.env.example`

- [ ] **Step 1: Update `backend/src/app.module.ts`**

Replace the entire file with:

```typescript
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { DatabaseModule } from './database/database.module';
import { WordsModule } from './words/words.module';
import { CollectionsModule } from './collections/collections.module';
import { ClerkMiddleware } from './common/middleware/clerk.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        PORT: Joi.number().default(3000),
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        CORS_ORIGIN: Joi.string().required(),
        CLERK_SECRET_KEY: Joi.string().required(),
      }),
    }),
    DatabaseModule,
    WordsModule,
    CollectionsModule,
  ],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply ClerkMiddleware to protected routes here as they are added.
    // Example (uncomment when pronunciation endpoint exists):
    // consumer
    //   .apply(ClerkMiddleware)
    //   .forRoutes({ path: 'pronunciation/assess', method: RequestMethod.POST });
  }
}
```

- [ ] **Step 2: Update `backend/.env.example`**

```
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/english_learning

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Clerk Auth
CLERK_SECRET_KEY=sk_test_...
```

- [ ] **Step 3: Add `CLERK_SECRET_KEY` to your local `backend/.env`**

Get the secret key from https://dashboard.clerk.com → your app → API Keys.

```
CLERK_SECRET_KEY=sk_test_YOUR_KEY_HERE
```

- [ ] **Step 4: Verify build**

```bash
cd backend && npm run build
```

Expected: succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(backend): wire ClerkMiddleware, add CLERK_SECRET_KEY validation"
```

---

## Task 4: Install Clerk on frontend and wrap app

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/src/main.jsx`
- Modify: `frontend/.env`

- [ ] **Step 1: Install `@clerk/clerk-react`**

```bash
cd frontend && bun add @clerk/clerk-react
```

- [ ] **Step 2: Add publishable key to `frontend/.env`**

Get the publishable key from https://dashboard.clerk.com → your app → API Keys.

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
VITE_OPENSPEAK_API_URL=https://openspeak-api.thongnt.dev/api
```

- [ ] **Step 3: Update `frontend/src/main.jsx`**

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.jsx'
import ReloadPrompt from './components/ReloadPrompt'
import AppLoader from './components/AppLoader'
import DatabaseErrorBoundary from './components/DatabaseErrorBoundary'
import OfflineIndicator from './components/OfflineIndicator'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
if (!PUBLISHABLE_KEY) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <DatabaseErrorBoundary>
        <ReloadPrompt />
        <AppLoader>
          <App />
        </AppLoader>
        <OfflineIndicator />
      </DatabaseErrorBoundary>
    </ClerkProvider>
  </StrictMode>
)
```

- [ ] **Step 4: Verify frontend starts without error**

```bash
cd frontend && bun run dev
```

Expected: dev server starts, no console errors about Clerk.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(frontend): install @clerk/clerk-react, wrap app in ClerkProvider"
```

---

## Task 5: Create PrivateRoute and protect routes

**Files:**
- Create: `frontend/src/components/PrivateRoute.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Create `frontend/src/components/PrivateRoute.jsx`**

```jsx
import { SignedIn, SignedOut, SignIn } from '@clerk/clerk-react'

export default function PrivateRoute({ children }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <div className="min-h-screen bg-gray-50 dark:bg-[#101922] flex items-center justify-center p-4">
          <SignIn routing="hash" />
        </div>
      </SignedOut>
    </>
  )
}
```

- [ ] **Step 2: Update `frontend/src/App.jsx`**

```jsx
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Practice from './pages/Practice';
import Settings from './pages/Settings';
import PrivateRoute from './components/PrivateRoute';
import { useThemeStore } from './stores/themeStore';

function App() {
  const { isDark } = useThemeStore();

  useEffect(() => {
    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen) {
      splashScreen.style.transition = 'opacity 0.5s ease';
      splashScreen.style.opacity = '0';
      setTimeout(() => { splashScreen.style.display = 'none'; }, 500);
    }
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', isDark ? '#101922' : '#f6f7f8');
    }
  }, [isDark]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/practice" element={<PrivateRoute><Practice /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
```

- [ ] **Step 3: Test in browser**

```bash
cd frontend && bun run dev
```

- Navigate to `http://localhost:5173/practice` while signed out → should show Clerk `<SignIn />` form
- Sign in → should show the Practice page
- Navigate to `http://localhost:5173/` → should show Home without requiring login

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(frontend): add PrivateRoute, protect /practice and /settings"
```

---

## Task 6: Attach Clerk token to API requests

**Files:**
- Modify: `frontend/src/services/openspeakApi.js`

- [ ] **Step 1: Update `frontend/src/services/openspeakApi.js`**

Replace the `request` function and update exports to accept an optional `token`:

```javascript
const DEFAULT_BASE = 'https://openspeak-api.thongnt.dev/api';

function apiBase() {
  const env = import.meta.env.VITE_OPENSPEAK_API_URL;
  return (env && env.replace(/\/$/, '')) || DEFAULT_BASE;
}

export class ApiError extends Error {
  constructor(status, body, path) {
    super(body?.message || `Request failed: ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
    this.path = path;
  }
}

async function request(path, { params, signal, token } = {}) {
  const url = new URL(`${apiBase()}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === '') continue;
      url.searchParams.set(k, String(v));
    }
  }

  const headers = { Accept: 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(url, { signal, headers });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError(0, { message: `Network error: ${err.message}` }, path);
  }

  let body = null;
  const text = await res.text();
  if (text) {
    try { body = JSON.parse(text); }
    catch { body = { message: text }; }
  }
  if (!res.ok) throw new ApiError(res.status, body, path);
  return body;
}

export function getWords(params = {}, opts = {}) {
  return request('/words', { params, ...opts });
}

export function getWordById(id, opts = {}) {
  return request(`/words/${encodeURIComponent(id)}`, opts);
}

export function getCollections(params = {}, opts = {}) {
  return request('/collections', { params, ...opts });
}

export function getCollectionById(id, opts = {}) {
  return request(`/collections/${encodeURIComponent(id)}`, opts);
}

export function getCollectionWords(id, params = {}, opts = {}) {
  return request(`/collections/${encodeURIComponent(id)}/words`, { params, ...opts });
}

export function getHealth(opts = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeout ?? 5000);
  return request('/health', { ...opts, signal: opts.signal ?? controller.signal }).finally(
    () => clearTimeout(timer),
  );
}
```

- [ ] **Step 2: Verify app still loads words on home page**

```bash
cd frontend && bun run dev
```

Navigate to `http://localhost:5173/` — featured words should still load (public endpoint, no token needed).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(frontend): support Authorization header in API requests"
```

---

## Task 7: Clean up Azure credential settings

**Files:**
- Modify: `frontend/src/stores/settingsStore.js`
- Modify: `frontend/src/pages/Settings.jsx`

- [ ] **Step 1: Update `frontend/src/stores/settingsStore.js`**

```javascript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSettingsStore = create(
  persist(
    (_set) => ({}),
    { name: 'openspeak-settings' }
  )
);
```

- [ ] **Step 2: Update `frontend/src/pages/Settings.jsx`**

```jsx
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '@clerk/clerk-react';

export default function Settings() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#101922]">
      <div className="max-w-lg mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="mb-6 text-[#137fec] font-medium"
        >
          ← Back
        </button>
        <UserProfile routing="hash" />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Fix any Practice page references to `azureApiKey`/`azureRegion` from settingsStore**

Open `frontend/src/pages/Practice.jsx`. Remove the import of `useSettingsStore` and any usage of `azureApiKey`/`azureRegion`. The Azure speech init will need the key from the backend eventually — for now, leave the SDK init broken or commented with a TODO noting it will come from the backend.

- [ ] **Step 4: Verify no build errors**

```bash
cd frontend && bun run build
```

Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(frontend): replace Azure settings with Clerk UserProfile, clean settingsStore"
```

---

## Task 8: New branch, push, open PR

- [ ] **Step 1: Create branch from dev**

```bash
git checkout dev && git pull && git checkout -b feat/clerk-auth
```

- [ ] **Step 2: Cherry-pick or rebase the commits from this work onto the branch**

If you worked directly on `dev`, reset and re-branch:

```bash
# Already on feat/clerk-auth after checkout
git rebase dev
```

- [ ] **Step 3: Push**

```bash
git push -u origin feat/clerk-auth
```

- [ ] **Step 4: Open PR on GitHub targeting `dev`**

Title: `feat: integrate Clerk authentication`

Body:
```
## What
- Embedded Clerk SignIn on private routes (/practice, /settings)
- ClerkMiddleware on backend ready to protect future paid endpoints
- Removed partial JWT auth files
- Removed user-supplied Azure credential fields from Settings

## Test
- [ ] Visit /practice signed out → see Clerk SignIn
- [ ] Sign in → reach Practice page
- [ ] Visit / → no login required
- [ ] Backend builds with CLERK_SECRET_KEY in env
```
