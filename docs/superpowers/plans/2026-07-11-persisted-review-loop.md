# Persisted Review Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete issue #31 with a Today -> Review -> Complete loop backed by locally persisted, internally consistent card progress.

**Architecture:** Keep static deck and card content in `srsData.js`, add a pure review-state model for scheduling and reconciliation, and wrap that model in a persisted Zustand store. Today and Review consume the store so due counts, queues, and rating updates share one source of truth.

**Tech Stack:** React 19, Zustand 5 persist middleware, React Router 7, Node test runner, Vite, Tailwind CSS.

## Global Constraints

- JavaScript only; do not add TypeScript.
- Mobile-first UI must work at 375px and include dark-mode styling.
- Progress must survive page refresh through versioned localStorage.
- The change must not require login or backend availability.
- Do not expand into deck creation, pronunciation, account sync, or starter-content expansion.

---

### Task 1: Pure review scheduling model

**Files:**
- Create: `frontend/src/lib/reviewState.js`
- Create: `frontend/test/reviewState.test.js`
- Modify: `frontend/package.json`

**Interfaces:**
- Consumes: static `CARDS` and `DECKS` records.
- Produces: `createInitialReviewState(cards, now)`, `reconcileReviewState(saved, cards, now)`, `getDueCardIds(reviewState, cards, now)`, `rateCard(reviewState, cardId, rating, now)`, and `summarizeDue(reviewState, cards, decks, now)`.

- [ ] **Step 1: Add the Node test script and failing model tests**

Cover starter-state creation, stable due ordering, all rating intervals, due totals by type and deck, unknown saved IDs, missing new cards, malformed timestamps, and an empty due queue. Use fixed ISO timestamps so assertions are deterministic.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `cd frontend && bun test test/reviewState.test.js`

Expected: FAIL because `src/lib/reviewState.js` does not exist.

- [ ] **Step 3: Implement the minimal pure model**

Use serializable objects keyed by card ID:

```js
{
  c1: {
    stage: 'review',
    dueAt: '2026-07-11T00:00:00.000Z',
    lastRating: null,
  },
}
```

Treat starter cards as due on initialization. Apply intervals of zero, six minutes, one day, and four days for `again`, `hard`, `good`, and `easy`. Return new objects rather than mutating inputs.

- [ ] **Step 4: Run the focused test and verify success**

Run: `cd frontend && bun test test/reviewState.test.js`

Expected: all review-state tests pass.

### Task 2: Persisted Zustand review store

**Files:**
- Create: `frontend/src/stores/reviewStore.js`
- Create: `frontend/test/reviewStoreSource.test.js`

**Interfaces:**
- Consumes: review-model functions and static content.
- Produces: `useReviewStore`, `selectDueCardIds(state)`, `selectDueSummary(state)`, plus actions `rateCard(cardId, rating)` and `resetProgress()`.

- [ ] **Step 1: Write a failing source-contract test**

Verify the store uses Zustand `persist`, storage key `gramio-review-progress`, version `1`, partializes to review data only, and reconciles persisted data through `merge`.

- [ ] **Step 2: Run the store test and verify failure**

Run: `cd frontend && bun test test/reviewStoreSource.test.js`

Expected: FAIL because `src/stores/reviewStore.js` does not exist.

- [ ] **Step 3: Implement the persisted store**

Initialize from `CARDS`, persist only `reviewByCardId`, reconcile during hydration, and expose derived selectors. Inject the current time only inside selectors/actions so the persisted payload remains serializable.

- [ ] **Step 4: Run model and store tests**

Run: `cd frontend && bun test test/reviewState.test.js test/reviewStoreSource.test.js`

Expected: both test files pass.

### Task 3: Connect Today to real due state

**Files:**
- Modify: `frontend/src/pages/Today.jsx`
- Create: `frontend/test/todayReviewIntegration.test.js`

**Interfaces:**
- Consumes: `selectDueCardIds`, `selectDueSummary`, static deck metadata.
- Produces: navigation to `/review` with a queue of due card IDs and an explicit caught-up state.

- [ ] **Step 1: Write a failing integration source test**

Assert Today imports the review store, removes `totalDue`, `totalNew`, and `dueByType`, navigates with `queueIds`, and renders caught-up copy when `due === 0`.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `cd frontend && bun test test/todayReviewIntegration.test.js`

Expected: FAIL against the hardcoded `srsData` totals.

- [ ] **Step 3: Update Today**

Derive counts from the store. Compute deck rows from actual due card IDs. Pass the queue snapshot to Review. When due is zero, show `All caught up` and a non-interactive completion treatment instead of starting Review.

- [ ] **Step 4: Run the focused and model tests**

Run: `cd frontend && bun test test/todayReviewIntegration.test.js test/reviewState.test.js`

Expected: all selected tests pass.

### Task 4: Persist ratings from Review

**Files:**
- Modify: `frontend/src/pages/Review.jsx`
- Modify: `frontend/test/todayReviewIntegration.test.js`

**Interfaces:**
- Consumes: `queueIds` from navigation, `CARDS`, and the store's `rateCard` action.
- Produces: persisted rating transitions and navigation back to `/` after completion.

- [ ] **Step 1: Extend the failing integration test**

Assert Review maps `queueIds` to static cards, calls the store action for each rating, and completion uses a deterministic navigation to `/` rather than history-back.

- [ ] **Step 2: Run the integration test and verify failure**

Run: `cd frontend && bun test test/todayReviewIntegration.test.js`

Expected: FAIL because Review still owns transient rating state only.

- [ ] **Step 3: Update Review**

Build the queue from passed IDs or the current due selector, ignore unknown IDs, call `rateCard(card.id, rating)` before advancing, and use `navigate('/')` for both exit and completion. Preserve the current reveal, multiple-choice, progress, and summary UI.

- [ ] **Step 4: Run all tests**

Run: `cd frontend && bun test`

Expected: all tests pass.

### Task 5: Quality gates and browser acceptance

**Files:**
- Modify only files required to fix errors introduced or directly exposed by this feature.

**Interfaces:**
- Consumes: completed implementation.
- Produces: verified issue #31 acceptance evidence.

- [ ] **Step 1: Run static and build checks**

Run: `cd frontend && bun run lint`

Run: `cd frontend && bun run build`

Expected: both exit with status 0. If unrelated baseline lint errors remain, document them separately and do not bundle unrelated refactors.

- [ ] **Step 2: Start the isolated frontend**

Run: `cd frontend && bun run dev --host 127.0.0.1 --port 5174`

Expected: Vite reports `http://127.0.0.1:5174/` ready.

- [ ] **Step 3: Verify issue #31 at 375px**

In the in-app browser, confirm Today shows a due count matching the review queue. Complete every card using `Good`, return to Today, verify the caught-up state, reload, and verify it remains caught up.

- [ ] **Step 4: Verify dark mode and reset path**

Toggle dark mode before one review interaction and confirm controls remain readable and reachable. Use localStorage reset only as test cleanup, then verify starter due cards return.

- [ ] **Step 5: Review the final diff and commit**

Run: `git diff --check`

Run: `git status --short`

Commit only issue #31 files with: `feat: persist review progress`
