# Frontend Learning-Loop Integration Design

Issue: #31 — MVP: make Today → Review → Complete the core learning loop

## Goal

Replace the preview-only Today → Review → Complete experience with the authenticated backend learning loop: Today reads the server queue, Review submits ratings to the scheduler, and the returned server state immediately becomes the next UI state.

## Non-goals

- Do not implement scheduling, due-date calculation, or interval prediction in the frontend.
- Do not keep a silent `srsData` fallback for Today or Review.
- Do not persist review requests or server state in local storage.
- Do not redesign Library, create decks, add pronunciation, or alter backend DTOs.
- Do not deploy, auto-merge, push, or open a pull request as part of this work.

`frontend/src/data/srsData.js` remains available for the existing Library/shared visual metadata during this slice. It is no longer a learning-loop data source; this design does not expand into removing or migrating that separate dependency.

## Architecture

The server is authoritative for the learning queue and every scheduling transition. `GET /api/today` supplies the initial queue and summary. `POST /api/reviews` accepts a rating and returns a complete replacement `today` snapshot after the backend scheduler commits the transition.

Add a Zustand `learningStore` as an in-memory server-state cache and request coordinator. It stores normalized Today data, request status, and the retryable pending review metadata. It never receives a Clerk token, never stores a token, and never derives scheduling state. React components obtain a fresh Clerk token with `getToken()` immediately before each protected request and pass it to an API function.

### Data ownership

| Concern | Owner | Rule |
| --- | --- | --- |
| Authentication token | Clerk hook/component boundary | Fetch fresh for each protected request; never put it in Zustand or local storage. |
| Due queue, counts, caught-up state | Backend `GET /api/today` or `POST /api/reviews` response | Replace the whole cached Today snapshot; do not decrement locally. |
| Scheduler / intervals / card progress | Backend | Frontend only renders returned values. |
| Review request identity | Learning store | Generate one UUID per selected rating, keep it until success or a non-retryable error, and reuse it on transient retry. |
| Page-only UI state | Today/Review components | Reveal state, selected MCQ option, navigation, and completion animation remain local. |

## Exact frontend shape

### API client

Extend `frontend/src/services/openspeakApi.js` so the internal request function accepts `method` and JSON `body`, sets `Content-Type: application/json` when a body is present, and continues attaching `Authorization: Bearer <token>` only when supplied.

Export:

```js
getToday({ token, signal } = {})
submitReview({ cardId, rating, clientRequestId, clientReviewedAt }, { token, signal } = {})
```

`getToday` performs `GET /today`. `submitReview` performs `POST /reviews` with exactly the supplied JSON body. Existing public health and content API behavior must remain unchanged.

### DTO mapping

The frontend consumes the following server contracts.

```js
// GET /api/today
{
  queue: [{
    card: {
      id, deck_id, type, level, front, answer, explanation, example, options,
      content_key, content_version, sort_order,
    },
    progress: {
      stage, due_at, stability, difficulty, elapsed_days, scheduled_days,
      repetitions, lapses, last_reviewed_at, last_rating, scheduler_version,
    },
  }],
  totalDue,
  countsByType,
  countsByDeck,
  caughtUp,
  serverTimestamp,
}

// POST /api/reviews request
{
  cardId: 'UUID',
  rating: 'again' | 'hard' | 'good' | 'easy',
  clientRequestId: 'UUID',
  clientReviewedAt: 'ISO-8601 timestamp',
}

// POST /api/reviews response (relevant fields)
{
  reviewEventId, duplicate, cardId, previousDueAt, nextDueAt,
  schedulerVersion, progress, today,
}
```

The review card adapter renders `card.front`, `card.answer`, `card.explanation`, `card.example`, `card.options`, and `card.type`. The existing UI name `back` maps to backend `explanation`; no frontend-only `pos` or `ipa` fields are assumed. The static rating labels and colors may remain visual constants, but their displayed intervals must not claim frontend-calculated scheduling outcomes.

### Zustand store

Create `frontend/src/stores/learningStore.js` with this state:

```js
{
  today: null,
  loadStatus: 'idle' | 'loading' | 'ready' | 'error',
  loadError: null,
  reviewStatus: 'idle' | 'submitting' | 'retryable-error' | 'error',
  reviewError: null,
  pendingReview: null,
}
```

`pendingReview` is either `null` or:

```js
{ cardId, rating, clientRequestId, clientReviewedAt }
```

Required actions and invariants:

| Action | Inputs | Required behavior |
| --- | --- | --- |
| `loadToday(getToken)` | fresh-token callback | Set `loadStatus` to `loading`, obtain a token, call `getToday`, replace `today`, then set `ready`. An `AbortError` caused by unmount must not show an error. |
| `replaceToday(today)` | validated Today DTO | Replace the complete snapshot, rather than patching queue/counts. |
| `beginReview(cardId, rating)` | current queue-head card and rating | If no request is active, create the pending payload with `crypto.randomUUID()` and current ISO time. If retrying the same payload, preserve the existing UUID and timestamp. |
| `submitPendingReview(getToken)` | fresh-token callback | Submit the pending payload. On HTTP success, replace `today` with `response.today`, clear pending data/error, and set `reviewStatus` to `idle`; `duplicate: true` is successful. |
| `retryPendingReview(getToken)` | fresh-token callback | Submit exactly the existing pending payload; never generate another UUID. |
| `clearReviewError()` | none | Clear only presentation error state; retain `pendingReview` when retry is permitted. |
| `resetLearning()` | none | Clear in-memory data on Clerk identity change/sign-out; do not write storage. |

The component calling a store async action supplies `getToken` rather than a raw token. The store must reject a submit if `pendingReview.cardId` does not equal `today.queue[0].card.id`; this prevents posting a stale card after a refresh or state replacement.

## Auth boundary

Today and Review are authenticated backend-only routes. Add an auth boundary that uses the existing Clerk provider/configuration behavior:

- With Clerk configured and a signed-in session, render the learning routes and obtain `getToken` from Clerk.
- With Clerk configured but signed out, show the existing sign-in UI instead of any fixture queue.
- Without `VITE_CLERK_PUBLISHABLE_KEY`, show the explicit “authentication is not configured” state; do not call protected endpoints and do not fabricate a demo flow.
- A 401 from either API invalidates the learning display, resets in-memory learning state, and asks the user to sign in again. It must not silently retry with the same token.

`AppLoader` may continue checking public health, but it is not an authenticated-learning readiness check. Route-level loading/error state remains necessary after health succeeds.

## Page behavior

### Today

On authenticated mount and after a hard refresh, Today calls `loadToday(getToken)`.

- Loading: retain the mobile shell and show a compact loading card/skeleton in the existing color-variable and dark-mode system.
- Ready with `totalDue > 0`: render the existing due card and type chips from `today.totalDue` and `today.countsByType`; use `countsByDeck` only where a server-backed deck label can be established. Start Review navigates to `/review`; it does not pass a copied queue through navigation state.
- Ready with `caughtUp === true` or empty queue: render a positive caught-up state and no enabled “Start review session” control.
- Load error: show a retry action. A network/5xx error retries `GET /api/today`; a 404 is treated as a deployment/routing error and displayed distinctly instead of treating the user as caught up.

The streak visual remains non-authoritative preview decoration until a server contract exists; it must not be presented as persisted backend progress.

### Review

Review reads `today.queue[0]` as the only active card. Direct navigation or a hard refresh at `/review` with no loaded snapshot calls `loadToday(getToken)` before rendering a card.

- The reveal/MCQ interaction stays local. The answer panel renders backend `answer` and `explanation`; options are shown only when the backend supplies an array.
- Rating creates/reuses `pendingReview`, disables all rating controls, and posts it. The UI must not advance the card until the response succeeds.
- On success, the store replaces its full Today snapshot with `response.today`. The next render reads the new queue head. If it is empty or `caughtUp`, show Complete.
- Complete shows the existing rewarding completion treatment. “Back to Today” navigates to `/`, where the already-replaced cache renders caught-up state; a later refresh fetches again.
- Exit returns to Today without inventing local progress. A pending request blocks exit only while it is actively submitting; after a retryable error, the user can stay and retry or leave, with the pending request kept in memory for that mounted session.

## Error and retry semantics

| Condition | Today behavior | Review behavior |
| --- | --- | --- |
| 401 | Reset store and show sign-in/reauth UI. | Reset store and show sign-in/reauth UI; do not replay automatically. |
| 404 | Show route/data-unavailable state with retry; do not call it caught up. | Refresh Today once because card visibility/enrollment may have changed; if still unavailable, return to the explicit unavailable state. |
| Network error or 5xx | Show retry; retain no fake snapshot as truth. | Keep `pendingReview` and offer retry using its same UUID/timestamp; never advance the queue. |
| 400 or 409 | Display the server message; do not retry automatically. 409 requires the user to refresh Today before a new rating. | Display the server message; preserve enough context to explain the action was not applied, then require refresh before another rating. |
| Duplicate successful replay | Not applicable. | Treat `duplicate: true` exactly as success and replace with `response.today`. |

The backend permits client clock skew only within seven days. Reusing `clientReviewedAt` on retry is therefore required along with reusing `clientRequestId`.

## Files for implementation

| Path | Change |
| --- | --- |
| `frontend/src/App.jsx` | Apply the learning auth boundary to Today and Review routes. |
| `frontend/src/services/openspeakApi.js` | Add protected Today/review API calls and JSON POST support. |
| `frontend/src/stores/learningStore.js` | Create in-memory server-state cache, load/review/retry/reset actions. |
| `frontend/src/pages/Today.jsx` | Replace static due data with authenticated server states. |
| `frontend/src/pages/Review.jsx` | Read queue head from store, submit ratings, retry safely, and render backend fields. |
| `frontend/src/components/PrivateRoute.jsx` or a new learning auth component | Share explicit Clerk configured/signed-out/unconfigured behavior without calling Clerk hooks outside a provider. |
| `frontend/src/data/srsData.js` | Retain for existing Library/shared visual metadata; remove Today/Review dependencies rather than deleting it. |
| `frontend/test/learning-api.test.js` | Add API authorization/body/error tests. |
| `frontend/test/learning-store.test.js` | Add store replacement, transition, stale-head, retry UUID, and duplicate-success tests. |
| `frontend/test/Today.test.jsx` | Add signed-in loading/error/due/caught-up tests. |
| `frontend/test/Review.test.jsx` | Add queue-head, submit/disable/retry/complete tests. |
| `frontend/test/learning-auth-boundary.test.jsx` | Add configured signed-out and unconfigured boundary tests. |
| `frontend/package.json` and `frontend/bun.lock` | Add test scripts and approved test dependencies. |
| `frontend/vitest.config.js` and `frontend/test/setup.js` | Create jsdom and jest-dom setup. |

## Testing stack and coverage

Implementation adds Vitest, jsdom, React Testing Library, `@testing-library/jest-dom`, and `@testing-library/user-event`. The test command must run the Node-compatible existing tests and the new Vitest suite explicitly; do not assume a package script exists today.

Required coverage:

- API: bearer header, POST method/body, token omission only for public calls, `ApiError` preservation for 401/404/5xx.
- Store: full Today replacement, only queue-head submission, no local scheduling, UUID/timestamp reuse after transient failure, duplicate response success, stale-card guard, reset on auth failure.
- Today: signed-in loading, due summary, caught-up empty state, retryable load error, unauthenticated boundary.
- Review: backend card field mapping, rating disables controls, successful response moves to returned queue head, transient failure retains same request for retry, response-empty queue produces Complete, 404 refresh path.
- Auth: configured signed-out sign-in state and unconfigured explicit configuration state, with no protected API call in either case.
- Manual browser QA: authenticated account on a 375px-wide viewport in light and dark modes; complete at least one real review and verify refreshed Today; test refresh at `/review`; verify the deployed backend route, Clerk token acceptance, CORS, and production API URL.

## Acceptance criteria

- Today and Review never display `srsData` cards/counts as a fallback.
- Every displayed due count and review queue comes from the authenticated backend.
- Every submitted rating includes a fresh Clerk bearer token and valid UUID client request ID.
- A transient failure cannot produce duplicate scheduler transitions because retry reuses the exact request payload.
- Success, including duplicate replay success, replaces the entire in-memory Today state from the backend response.
- Hard refresh at Today or Review refetches the authoritative queue.
- Caught-up state is explicit, rewarding, responsive at 375px, and preserves light/dark styling.
- 401, 404, network, 5xx, 400, and 409 behavior matches the error table without silently substituting demo data.
- Existing Library/shared visual metadata dependencies on `srsData` remain intact; this slice removes only Today/Review dependencies.
- Automated coverage and authenticated browser/deployment verification pass before review is requested.

## Deployment risks

- Both learning endpoints require a valid Clerk token; production needs `VITE_CLERK_PUBLISHABLE_KEY` and backend Clerk verification configured consistently.
- The frontend defaults to `https://gramio-api.thongnt.dev/api`; the deployed backend must include merged PRs #55 and #56 and expose `/api/today` and `/api/reviews`.
- Successful `/health` does not prove authenticated CORS, database enrollment, published decks, or card progress are ready.
- `GET /api/today` can legitimately be empty for a new user or unavailable because enrollment/published-card data is missing. QA must distinguish caught-up data from a 404 routing/deployment failure.
- Browser verification requires a seeded/enrolled authenticated user who has due cards; API-only verification is insufficient for the full product loop.

## Delivery boundary

Target branch: `dev`. Reference Issue #31 in the eventual pull request. The implementation work may add only the listed frontend code, test setup, and tests after this design is approved for execution. It must not auto-merge, deploy, or modify backend scheduler contracts. Push and PR creation remain separate approval boundaries.
