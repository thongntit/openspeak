# Recoverable App Entry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the app render its authenticated shell even when the backend health endpoint is unavailable.

**Architecture:** Remove the root-level `AppLoader` availability gate. Today remains the authority for learning-data loading and already presents the retryable unavailable state. The offline indicator remains mounted as non-blocking feedback.

**Tech Stack:** React 19, React Router, Node test runner, Vitest.

## Global Constraints

- Do not cache or fabricate learning data when the backend is unavailable.
- Preserve Clerk provider behavior and the existing offline indicator.
- Keep unavailable-state copy user-facing and retryable.

---

### Task 1: Remove the blocking startup health gate

**Files:**
- Create: `frontend/test/app-entry.test.js`
- Modify: `frontend/src/main.jsx`
- Delete: `frontend/src/components/AppLoader.jsx`

**Interfaces:**
- Consumes: `App`, `DatabaseErrorBoundary`, `ReloadPrompt`, and `OfflineIndicator` from the existing root entry.
- Produces: a root entry that renders routes without an `AppLoader` wrapper.

- [ ] **Step 1: Write the failing regression test**

```js
test('root entry does not block routes behind a health loader', () => {
  const source = readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /AppLoader/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/app-entry.test.js`

Expected: FAIL because `main.jsx` imports and renders `AppLoader`.

- [ ] **Step 3: Write the minimal implementation**

```jsx
const inner = (
  <DatabaseErrorBoundary>
    <ReloadPrompt />
    <App />
    <OfflineIndicator />
  </DatabaseErrorBoundary>
);
```

Delete `frontend/src/components/AppLoader.jsx` because the root entry is its
only consumer.

- [ ] **Step 4: Run focused test to verify it passes**

Run: `node --test test/app-entry.test.js`

Expected: PASS.

- [ ] **Step 5: Run verification and commit**

Run: `bun run test && bun run lint && bun run build`

Expected: all commands exit zero.

```bash
git add frontend/src/main.jsx frontend/src/components/AppLoader.jsx frontend/test/app-entry.test.js
git commit -m "fix(frontend): keep app entry recoverable"
```
