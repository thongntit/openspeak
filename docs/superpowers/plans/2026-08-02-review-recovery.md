# Review card recovery implementation plan

> **For Codex:** Implement this plan on `agent/review-recovery`, test first, then open and merge a protected PR to `dev` for issue #75.

**Goal:** A learner can always leave Review or safely retry when loading the review queue, resolving its queue head, or transitioning to the next card fails.

**Architecture:** Keep retry and navigation in `Review.jsx`; the learning store remains the authority for pending-review state. Add a renderability guard before any card fields are read. Reuse the existing `loadToday` refresh path for recovery and navigate home without mutating state, so a retryable pending review survives an exit.

**Tech Stack:** React 19, React Router, Zustand, Vitest, Testing Library, Tailwind CSS.

---

### Task 1: Add failing Review recovery tests

**Files:**
- Modify: `frontend/test/Review.test.jsx`

1. Add an unusable queue-head fixture whose `card` is `null`.
2. Test that a failed initial queue request offers both Retry and Back to Today, and that Back navigates to `/`.
3. Test that an unusable queue head renders a recovery screen instead of attempting to render card fields, and that Retry reloads a valid replacement card.
4. Test that leaving a retryable review-submission error navigates to Today without clearing `pendingReview`.
5. Run `cd frontend && bun run test -- Review.test.jsx` and confirm these tests fail before production changes.

### Task 2: Make Review recoverable

**Files:**
- Modify: `frontend/src/pages/Review.jsx`

1. Pass the existing non-submitting `exitReview` handler to load and submission-error recovery UI.
2. Add a queue-head renderability guard after the empty/caught-up state and before calculations or JSX access `card.id`.
3. Render a clear unavailable-card state with Retry and Back to Today, using `refreshSession` so recovery reloads the session rather than manipulating review progress.
4. Add a Back to Today action alongside load-error Retry and review-error Retry/Refresh. Keep it disabled while a request is actively submitting.
5. Do not clear or alter `pendingReview` on exit.

### Task 3: Validate and merge issue #75

**Files:**
- Modify: `docs/superpowers/plans/2026-08-02-review-recovery.md`

1. Run focused Review tests, full frontend tests, lint, and production build.
2. Inspect the diff for no unrelated files and confirm `.codex/` remains untracked.
3. Commit with a conventional `fix:` message, push `agent/review-recovery`, open a ready PR that closes #75, wait for required checks, and merge it into protected `dev`.
4. Fetch `origin/dev` and verify the commit is an ancestor of it before proceeding to the next issue.
