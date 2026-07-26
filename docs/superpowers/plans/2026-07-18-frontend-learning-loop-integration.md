# Frontend Learning-Loop Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the preview Today → Review → Complete loop with the authenticated backend queue and retry-safe review submission defined in Issue #31.

**Architecture:** `openspeakApi.js` owns HTTP mechanics, while an in-memory Zustand `learningStore` owns the canonical Today snapshot and review request lifecycle. Clerk remains the sole token owner; protected route components pass a fresh `getToken` callback into store actions, and pages render only backend queue state.

**Tech Stack:** React 19, React Router 7, Zustand 5, Clerk React 5, Vite 7, Vitest, jsdom, React Testing Library, jest-dom, user-event, Bun.

## Global Constraints

- Today and Review are authenticated backend-only; never silently fall back to `frontend/src/data/srsData.js`.
- The frontend never computes scheduling, due dates, or interval predictions.
- Clerk tokens remain outside Zustand and local storage and are requested fresh for every protected request.
- Review retries reuse the exact `clientRequestId` and `clientReviewedAt` created for the original attempt.
- Every successful review, including `duplicate: true`, replaces the whole cached snapshot with `response.today`.
- Preserve the existing 375px mobile layout, touch targets, CSS variables, and dark mode.
- Do not change backend scheduler behavior, auto-merge, deploy, push, or open a pull request.

---

### Task 1: Test infrastructure and learning API contract

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/bun.lock`
- Create: `frontend/vitest.config.js`
- Create: `frontend/test/setup.js`
- Create: `frontend/test/learning-api.test.js`
- Modify: `frontend/src/services/openspeakApi.js`

**Interfaces:**
- Consumes: existing `ApiError`, public health API, and content API exports.
- Produces: `getToday({ token, signal } = {})`, `submitReview(payload, { token, signal } = {})`, and test scripts `test`/`test:watch`.

- [ ] **Step 1: Install the approved test dependencies and scripts**

Run:

```bash
cd frontend
bun add -d vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Then set the scripts in `frontend/package.json` to:

```json
{
  "test": "vitest run",
  "test:watch": "vitest"
}
```

Expected: `frontend/package.json` and `frontend/bun.lock` contain the five approved dev dependencies and both scripts.

- [ ] **Step 2: Add the Vitest environment**

Create `frontend/vitest.config.js`:

```js
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(rootDir, 'src') } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.js'],
    restoreMocks: true,
    clearMocks: true,
  },
});
```

Create `frontend/test/setup.js`:

```js
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => cleanup());
```

Expected: `bun run test -- --passWithNoTests` starts Vitest under jsdom.

- [ ] **Step 3: Write failing learning API tests**

Create `frontend/test/learning-api.test.js` with fetch-level behavior checks:

```js
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, getToday, submitReview } from '@/services/openspeakApi';

const TODAY = {
  queue: [], totalDue: 0, countsByType: {}, countsByDeck: {}, caughtUp: true,
  serverTimestamp: '2026-07-18T00:00:00.000Z',
};

afterEach(() => vi.unstubAllGlobals());

describe('learning API', () => {
  it('GETs Today with a bearer token', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(TODAY), { status: 200 }));
    vi.stubGlobal('fetch', fetch);
    await getToday({ token: 'clerk-token' });
    const [url, init] = fetch.mock.calls[0];
    expect(new URL(url).pathname).toBe('/api/today');
    expect(init).toMatchObject({ method: 'GET', headers: expect.objectContaining({ Authorization: 'Bearer clerk-token' }) });
  });

  it('POSTs the exact review JSON with a bearer token', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ today: TODAY }), { status: 201 }));
    vi.stubGlobal('fetch', fetch);
    const payload = {
      cardId: 'be7d7592-2e3d-4a41-8cf5-20f1ea90f4fd', rating: 'good',
      clientRequestId: 'a9ba9e4d-f965-48f6-8a66-1d6279e038d0',
      clientReviewedAt: '2026-07-18T00:00:00.000Z',
    };
    await submitReview(payload, { token: 'clerk-token' });
    const [, init] = fetch.mock.calls[0];
    expect(init).toMatchObject({
      method: 'POST',
      body: JSON.stringify(payload),
      headers: expect.objectContaining({ Authorization: 'Bearer clerk-token', 'Content-Type': 'application/json' }),
    });
  });

  it.each([401, 404, 500])('preserves status %s in ApiError', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'failure' }), { status })));
    await expect(getToday({ token: 'bad' })).rejects.toMatchObject({ name: 'ApiError', status });
  });
});
```

- [ ] **Step 4: Run the API tests and verify RED**

Run: `cd frontend && bun run test -- test/learning-api.test.js`

Expected: FAIL because `getToday` and `submitReview` are not exported and the request helper does not support JSON POST.

- [ ] **Step 5: Implement the minimal API support**

Change the environment read and request signature in `frontend/src/services/openspeakApi.js`:

```js
function apiBase() {
  const env = import.meta.env?.VITE_OPENSPEAK_API_URL;
  return (env && env.replace(/\/$/, '')) || DEFAULT_BASE;
}

async function request(path, { params, signal, token, method = 'GET', body } = {}) {
  // preserve query construction
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(url, {
    method,
    signal,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  // preserve current parsing and ApiError conversion
}

export function getToday(opts = {}) {
  return request('/today', opts);
}

export function submitReview(payload, opts = {}) {
  return request('/reviews', { ...opts, method: 'POST', body: payload });
}
```

Expected: existing content functions continue to call the same helper without method/body.

- [ ] **Step 6: Verify GREEN and regressions**

Run:

```bash
cd frontend
bun run test -- test/learning-api.test.js test/content-api.test.js
```

Expected: all API tests pass with no warnings.

- [ ] **Step 7: Commit Task 1**

```bash
git add frontend/package.json frontend/bun.lock frontend/vitest.config.js frontend/test/setup.js frontend/test/learning-api.test.js frontend/src/services/openspeakApi.js
git commit -m "test(frontend): add learning API test foundation"
```

### Task 2: In-memory learning store and retry-safe request lifecycle

**Files:**
- Create: `frontend/test/learning-store.test.js`
- Create: `frontend/src/stores/learningStore.js`

**Interfaces:**
- Consumes: `getToday`, `submitReview`, `ApiError`; injected `getToken()` callback.
- Produces: `useLearningStore` with `today`, status/error fields, `loadToday`, `replaceToday`, `beginReview`, `submitPendingReview`, `retryPendingReview`, `clearReviewError`, `resetLearning`.

- [ ] **Step 1: Write failing store transition tests**

Create `frontend/test/learning-store.test.js` with a complete Today fixture and module-level API mocks:

```js
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, getToday, submitReview } from '@/services/openspeakApi';
import { useLearningStore } from '@/stores/learningStore';

vi.mock('@/services/openspeakApi', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, getToday: vi.fn(), submitReview: vi.fn() };
});

const CARD = {
  id: 'be7d7592-2e3d-4a41-8cf5-20f1ea90f4fd', deck_id: '9bb9dfab-3572-44c0-a6cf-bd49edc30563',
  type: 'grammar', level: 'A1', front: 'She ___ here.', answer: 'works',
  explanation: 'Present simple.', example: 'She works here.', options: ['work', 'works'],
  content_key: 'present-simple-1', content_version: 'v1', sort_order: 1,
};
const TODAY = {
  queue: [{ card: CARD, progress: { stage: 'new', due_at: '2026-07-18T00:00:00.000Z' } }],
  totalDue: 1, countsByType: { grammar: 1 }, countsByDeck: { [CARD.deck_id]: 1 },
  caughtUp: false, serverTimestamp: '2026-07-18T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  useLearningStore.getState().resetLearning();
});

it('loads a fresh token and replaces the whole Today snapshot', async () => {
  getToday.mockResolvedValue(TODAY);
  await useLearningStore.getState().loadToday(() => Promise.resolve('fresh-token'));
  expect(getToday).toHaveBeenCalledWith({ token: 'fresh-token' });
  expect(useLearningStore.getState()).toMatchObject({ today: TODAY, loadStatus: 'ready', loadError: null });
});

it('reuses one request identity after a transient failure', async () => {
  useLearningStore.getState().replaceToday(TODAY);
  vi.spyOn(crypto, 'randomUUID').mockReturnValue('a9ba9e4d-f965-48f6-8a66-1d6279e038d0');
  useLearningStore.getState().beginReview(CARD.id, 'good');
  const original = useLearningStore.getState().pendingReview;
  submitReview.mockRejectedValueOnce(new ApiError(0, { message: 'Network error' }, '/reviews'));
  await useLearningStore.getState().submitPendingReview(() => Promise.resolve('token'));
  expect(useLearningStore.getState()).toMatchObject({ reviewStatus: 'retryable-error', pendingReview: original });
  submitReview.mockResolvedValueOnce({ duplicate: true, today: { ...TODAY, queue: [], totalDue: 0, caughtUp: true } });
  await useLearningStore.getState().retryPendingReview(() => Promise.resolve('new-token'));
  expect(submitReview.mock.calls[1][0]).toEqual(original);
  expect(useLearningStore.getState()).toMatchObject({ reviewStatus: 'idle', pendingReview: null, today: { totalDue: 0, caughtUp: true } });
});

it('rejects a pending request that no longer matches the queue head', async () => {
  useLearningStore.getState().replaceToday(TODAY);
  useLearningStore.getState().beginReview(CARD.id, 'hard');
  useLearningStore.getState().replaceToday({ ...TODAY, queue: [{ ...TODAY.queue[0], card: { ...CARD, id: '22a4cd0f-768f-4446-90e6-62aa019a1490' } }] });
  await useLearningStore.getState().submitPendingReview(() => Promise.resolve('token'));
  expect(submitReview).not.toHaveBeenCalled();
  expect(useLearningStore.getState().reviewStatus).toBe('error');
});

it('resets cached learning state on 401', async () => {
  useLearningStore.getState().replaceToday(TODAY);
  getToday.mockRejectedValue(new ApiError(401, { message: 'Authentication required' }, '/today'));
  await useLearningStore.getState().loadToday(() => Promise.resolve('expired'));
  expect(useLearningStore.getState()).toMatchObject({ today: null, loadStatus: 'error', loadError: { status: 401 } });
});
```

- [ ] **Step 2: Run store tests and verify RED**

Run: `cd frontend && bun run test -- test/learning-store.test.js`

Expected: FAIL because `frontend/src/stores/learningStore.js` does not exist.

- [ ] **Step 3: Implement the minimal store**

Create `frontend/src/stores/learningStore.js` using `create` from Zustand, these constants, and exact classification:

```js
const INITIAL_STATE = {
  today: null,
  loadStatus: 'idle',
  loadError: null,
  reviewStatus: 'idle',
  reviewError: null,
  pendingReview: null,
};

const toStatusError = (error) => ({
  status: error?.status ?? 0,
  message: error?.message || 'Request failed',
});

const isRetryable = (error) => !error?.status || error.status >= 500;
```

Implement actions so `loadToday` obtains `await getToken()` immediately before `getToday({ token })`; `beginReview` creates `{ cardId, rating, clientRequestId: crypto.randomUUID(), clientReviewedAt: new Date().toISOString() }`; submission checks `today.queue[0].card.id`, obtains another fresh token, and passes the unchanged pending payload. A 401 clears `today`; network/5xx keeps `pendingReview`; 400/404/409 clear it only after exposing an explicit non-retryable error. `retryPendingReview` delegates to the same submission logic without regenerating identity.

- [ ] **Step 4: Verify GREEN and refactor**

Run:

```bash
cd frontend
bun run test -- test/learning-store.test.js test/learning-api.test.js
```

Expected: store and API suites pass; confirm no state property contains the token or scheduler-derived interval.

- [ ] **Step 5: Commit Task 2**

```bash
git add frontend/src/stores/learningStore.js frontend/test/learning-store.test.js
git commit -m "feat(frontend): add learning session state"
```

### Task 3: Authentication boundary and Today server states

**Files:**
- Create: `frontend/test/learning-auth-boundary.test.jsx`
- Create: `frontend/test/Today.test.jsx`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/components/PrivateRoute.jsx`
- Modify: `frontend/src/pages/Today.jsx`

**Interfaces:**
- Consumes: Clerk `SignedIn`, `SignedOut`, `SignIn`, `useAuth`; `useLearningStore` load state/actions.
- Produces: protected Today/Review routes and Today loading/due/caught-up/error views.

- [ ] **Step 1: Write failing auth-boundary tests**

Create `frontend/test/learning-auth-boundary.test.jsx` that mocks only Clerk primitives and renders the real boundary:

```jsx
import { render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';

const clerk = vi.hoisted(() => ({ configured: true, signedIn: false }));
vi.mock('@clerk/clerk-react', () => ({
  SignedIn: ({ children }) => clerk.signedIn ? children : null,
  SignedOut: ({ children }) => clerk.signedIn ? null : children,
  SignIn: () => <div>Clerk sign in</div>,
}));

beforeEach(() => { clerk.configured = true; clerk.signedIn = false; });

it('shows sign in instead of protected content when signed out', async () => {
  const { default: PrivateRoute } = await import('@/components/PrivateRoute');
  render(<PrivateRoute isConfigured><div>Protected queue</div></PrivateRoute>);
  expect(screen.getByText('Clerk sign in')).toBeInTheDocument();
  expect(screen.queryByText('Protected queue')).not.toBeInTheDocument();
});

it('shows an explicit configuration state without Clerk configuration', async () => {
  const { default: PrivateRoute } = await import('@/components/PrivateRoute');
  render(<PrivateRoute isConfigured={false}><div>Protected queue</div></PrivateRoute>);
  expect(screen.getByText(/authentication is not configured/i)).toBeInTheDocument();
  expect(screen.queryByText('Protected queue')).not.toBeInTheDocument();
});
```

Update `PrivateRoute` to accept `isConfigured = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)` so tests can exercise both branches without mutating Vite build-time environment.

- [ ] **Step 2: Write failing Today behavior tests**

Create `frontend/test/Today.test.jsx`. Render the real Today inside `MemoryRouter`, mock Clerk `useAuth` to return `getToken`, and set the real store before each test. Cover:

```jsx
it('loads and renders backend due counts', async () => {
  getToday.mockResolvedValue(TODAY);
  render(<MemoryRouter><Today /></MemoryRouter>);
  expect(screen.getByText(/loading today/i)).toBeInTheDocument();
  expect(await screen.findByText('1')).toBeInTheDocument();
  expect(screen.getByText('1 grammar')).toBeInTheDocument();
});

it('renders caught up without a start button', async () => {
  getToday.mockResolvedValue({ ...TODAY, queue: [], totalDue: 0, caughtUp: true });
  render(<MemoryRouter><Today /></MemoryRouter>);
  expect(await screen.findByText(/caught up/i)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /start review/i })).not.toBeInTheDocument();
});

it.each([[404, /learning route is unavailable/i], [500, /today is unavailable/i]])('renders status %s explicitly', async (status, message) => {
  getToday.mockRejectedValue(new ApiError(status, { message: 'failure' }, '/today'));
  render(<MemoryRouter><Today /></MemoryRouter>);
  expect(await screen.findByText(message)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
});
```

- [ ] **Step 3: Run auth and Today tests and verify RED**

Run: `cd frontend && bun run test -- test/learning-auth-boundary.test.jsx test/Today.test.jsx`

Expected: auth test fails because configuration is module-only; Today tests fail because it still reads `srsData` and never loads the store.

- [ ] **Step 4: Implement the auth boundary and protect routes**

Update `PrivateRoute` signature:

```jsx
export default function PrivateRoute({ children, isConfigured = HAS_CLERK }) {
  if (!isConfigured) return <AuthenticationNotConfigured />;
  return <><SignedIn>{children}</SignedIn><SignedOut><SignInState /></SignedOut></>;
}
```

Wrap both `/` and `/review` route elements in `frontend/src/App.jsx` with `PrivateRoute`, matching the Library/Profile route pattern.

- [ ] **Step 5: Implement Today using focused selectors**

Use separate selectors for `today`, `loadStatus`, `loadError`, and `loadToday`; call `loadToday(getToken)` only when state is `idle`, and reset on authenticated identity changes at the auth boundary. Render:

```jsx
if (loadStatus === 'loading' || loadStatus === 'idle') return <TodayLoading />;
if (loadStatus === 'error') return <TodayError error={loadError} onRetry={() => loadToday(getToken)} />;
if (!today || today.caughtUp || today.queue.length === 0) return <TodayCaughtUp />;
```

For the ready view, set `due = today.totalDue`, `byType = today.countsByType`, remove `DECKS`, `totalDue`, `totalNew`, and `dueByType` imports, remove the prototype deck list and learning-count sentence, and navigate to `/review` without route state.

- [ ] **Step 6: Verify GREEN and regressions**

Run:

```bash
cd frontend
bun run test -- test/learning-auth-boundary.test.jsx test/Today.test.jsx test/library-source.test.js test/product-scope.test.js
```

Expected: auth/Today behavior passes; product route and Library source assertions remain green.

- [ ] **Step 7: Commit Task 3**

```bash
git add frontend/src/App.jsx frontend/src/components/PrivateRoute.jsx frontend/src/pages/Today.jsx frontend/test/learning-auth-boundary.test.jsx frontend/test/Today.test.jsx
git commit -m "feat(frontend): load authenticated Today queue"
```

### Task 4: Review submission, retry, next-card, and completion

**Files:**
- Create: `frontend/test/Review.test.jsx`
- Modify: `frontend/src/pages/Review.jsx`
- Modify: `frontend/src/data/srsData.js`

**Interfaces:**
- Consumes: `useAuth().getToken`; `useLearningStore` Today/review state and actions; backend card DTO.
- Produces: server-queue-only Review experience with retry-safe POST and Complete state.

- [ ] **Step 1: Write failing Review tests**

Create `frontend/test/Review.test.jsx` using real Review/store behavior, a mocked network boundary, `MemoryRouter`, and `userEvent`. Cover the complete DTO and these behaviors:

```jsx
it('renders the backend queue head and answer fields', async () => {
  useLearningStore.getState().replaceToday(TODAY);
  renderReview();
  expect(screen.getByText(CARD.front)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /show answer/i }));
  expect(screen.getByText(CARD.answer)).toBeInTheDocument();
  expect(screen.getByText(CARD.explanation)).toBeInTheDocument();
});

it('disables ratings until POST resolves then renders the returned next card', async () => {
  useLearningStore.getState().replaceToday(TODAY);
  const deferred = Promise.withResolvers();
  submitReview.mockReturnValue(deferred.promise);
  renderReview();
  await revealAndRate('Good');
  expect(screen.getByRole('button', { name: /good/i })).toBeDisabled();
  deferred.resolve({ duplicate: false, today: NEXT_TODAY });
  expect(await screen.findByText(NEXT_CARD.front)).toBeInTheDocument();
});

it('retries a transient failure with the identical request', async () => {
  useLearningStore.getState().replaceToday(TODAY);
  submitReview.mockRejectedValueOnce(new ApiError(500, { message: 'failure' }, '/reviews'))
    .mockResolvedValueOnce({ duplicate: true, today: CAUGHT_UP });
  renderReview();
  await revealAndRate('Good');
  const firstPayload = submitReview.mock.calls[0][0];
  await userEvent.click(await screen.findByRole('button', { name: /retry review/i }));
  expect(submitReview.mock.calls[1][0]).toEqual(firstPayload);
  expect(await screen.findByText(/session complete/i)).toBeInTheDocument();
});

it('hard-refreshes Today state before showing a direct review route', async () => {
  getToday.mockResolvedValue(TODAY);
  renderReview();
  expect(await screen.findByText(CARD.front)).toBeInTheDocument();
  expect(getToday).toHaveBeenCalledOnce();
});
```

Add a separate 404 submission test: first POST returns 404, then `getToday` is called once and the refreshed queue is rendered or explicit unavailable state is shown.

- [ ] **Step 2: Run Review tests and verify RED**

Run: `cd frontend && bun run test -- test/Review.test.jsx`

Expected: FAIL because Review still uses `getDueCards`, local index/count progression, and no API/store submission.

- [ ] **Step 3: Implement Review against the queue head**

Remove `useLocation`, `getDueCards`, and static queue/index state. Keep only visual rating metadata (move it to a local `REVIEW_BUTTONS` constant or retain `SRS_BUTTONS` solely as metadata without interval text). Select:

```js
const today = useLearningStore((state) => state.today);
const loadStatus = useLearningStore((state) => state.loadStatus);
const reviewStatus = useLearningStore((state) => state.reviewStatus);
const reviewError = useLearningStore((state) => state.reviewError);
const beginReview = useLearningStore((state) => state.beginReview);
const submitPendingReview = useLearningStore((state) => state.submitPendingReview);
const retryPendingReview = useLearningStore((state) => state.retryPendingReview);
const loadToday = useLearningStore((state) => state.loadToday);
const card = today?.queue?.[0]?.card;
```

On missing snapshot call `loadToday(getToken)`. On rate, call `beginReview(card.id, rating)` followed by `submitPendingReview(getToken)`. Disable all reveal/rating/exit controls while `reviewStatus === 'submitting'`. Reset local `revealed` and `picked` when `card.id` changes.

Render backend `answer`, `explanation`, and `example` separately. Do not render fake duration labels. If `today.caughtUp` or queue is empty after a loaded snapshot, render `ReviewDone`; its Back button uses `navigate('/', { replace: true })`.

For review errors: network/5xx shows `Retry review` calling `retryPendingReview(getToken)`; 401 shows reauth copy; 404 calls `loadToday(getToken)` once and shows explicit unavailable UI if refresh fails; 400/409 offers `Refresh session` rather than resubmitting a new rating.

- [ ] **Step 4: Verify GREEN and full learning-loop suite**

Run:

```bash
cd frontend
bun run test -- test/Review.test.jsx test/Today.test.jsx test/learning-store.test.js test/learning-api.test.js test/learning-auth-boundary.test.jsx
```

Expected: all learning-loop tests pass with no React act warnings.

- [ ] **Step 5: Commit Task 4**

```bash
git add frontend/src/pages/Review.jsx frontend/src/data/srsData.js frontend/test/Review.test.jsx
git commit -m "feat(frontend): submit backend learning reviews"
```

### Task 5: CI, production verification, and delivery audit

**Files:**
- Modify: `.github/workflows/ci-frontend.yml`
- Modify only if tests expose a defect: frontend files already listed in Tasks 1–4.

**Interfaces:**
- Consumes: package scripts and all frontend test suites.
- Produces: PR CI that runs tests, lint, and production build before merge.

- [ ] **Step 1: Write the CI expectation before changing workflow**

Add a native source assertion to `frontend/test/deployment-config.test.js`:

```js
test('frontend CI runs tests, lint, and build', () => {
  const workflow = readFileSync('../.github/workflows/ci-frontend.yml', 'utf8');
  assert.match(workflow, /bun run test/);
  assert.match(workflow, /bun run lint/);
  assert.match(workflow, /bun run build/);
});
```

- [ ] **Step 2: Run the CI assertion and verify RED**

Run: `cd frontend && node --test test/deployment-config.test.js`

Expected: FAIL because CI currently installs and builds only.

- [ ] **Step 3: Add CI test and lint steps**

Update `.github/workflows/ci-frontend.yml` after install:

```yaml
      - name: Test
        run: bun run test

      - name: Lint
        run: bun run lint

      - name: Build
        run: bun run build
```

- [ ] **Step 4: Verify CI assertion GREEN**

Run: `cd frontend && node --test test/deployment-config.test.js`

Expected: all deployment configuration assertions pass.

- [ ] **Step 5: Run fresh complete frontend verification**

Run:

```bash
cd frontend
bun run test
bun run lint
bun run build
```

Expected: Vitest reports zero failed tests, ESLint exits 0, and Vite production build exits 0.

- [ ] **Step 6: Run backend learning contract verification**

Run:

```bash
cd backend
npm test -- --runInBand src/learning/learning.service.spec.ts src/learning/learning.controller.spec.ts src/reviews/reviews.service.spec.ts src/learning/scheduler/fsrs-scheduler.service.spec.ts
npm run test:e2e -- --runInBand test/learning-loop.e2e-spec.ts
```

Expected: targeted backend learning service, scheduler, controller, review, and HTTP contract tests report zero failures. If environment validation blocks the e2e command, record the exact missing runtime requirement and retain unit/contract evidence.

- [ ] **Step 7: Perform local-safe browser and deployment QA**

Run `bun run dev -- --host 127.0.0.1` and inspect at 375px in light and dark modes. Use mocked/local-safe request data when no authenticated seeded account is available; do not submit a production review. Verify loading, due, reveal, disabled submit, retry, next card, Complete, caught-up Today, hard refresh at `/review`, sign-in state, and no fixture fallback. Read-only inspect production `/api/health`, `/api/today`, and `/api/reviews`; record expected unauthenticated 401 versus unexpected 404/CORS/network blockers.

- [ ] **Step 8: Audit requirements and diff**

Run:

```bash
rg -n "srsData|getDueCards|totalDue\(|dueByType" frontend/src/pages/Today.jsx frontend/src/pages/Review.jsx
rg -n "token" frontend/src/stores/learningStore.js
git diff --check origin/dev...HEAD
git status --short
git diff --stat origin/dev...HEAD
```

Expected: no learning-page fixture imports, no persisted token field, no whitespace errors, and only approved plan/frontend/CI files changed.

- [ ] **Step 9: Commit Task 5**

```bash
git add .github/workflows/ci-frontend.yml frontend/test/deployment-config.test.js
git commit -m "ci: verify frontend learning loop"
```

- [ ] **Step 10: Re-run the complete verification after the final commit**

Run frontend tests/lint/build and the targeted backend commands again, then inspect `git status --short` and the commit list. Expected: all available checks pass and the worktree is clean; no push or PR exists.
