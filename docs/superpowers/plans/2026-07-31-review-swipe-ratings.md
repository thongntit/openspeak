# Review Swipe Ratings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Let a learner dismiss an answered multiple-choice review card by swiping left or right, mapping the gesture to the existing FSRS rating request while retaining all four rating buttons.

**Architecture:** Add a small React pointer-gesture hook that only reports a deliberate horizontal touch/pen swipe. `Review` remains the owner of answer correctness, rating mapping, submit/retry state, and visible feedback; it passes the mapped action to the existing `submitRating` function. This keeps the API, Zustand store, and scheduler unchanged.

**Tech Stack:** React 19, React Testing Library + Vitest, Zustand, Tailwind CSS, native Pointer Events.

## Global Constraints

- Do not add a gesture dependency, database migration, backend endpoint, API contract, scheduler, or content change.
- Keep all four existing **Again**, **Hard**, **Good**, and **Easy** buttons visible after reveal as the keyboard, desktop, guided-recall, error, and fine-control fallback.
- Enable swipe only when a multiple-choice option was selected and the answer is revealed. A direct **Show answer** reveal and every guided-recall card must not submit from a swipe.
- Map left/right exactly as follows: correct selection = Easy/Hard; wrong selection = Good/Hard.
- Do not introduce a self-assessment step such as “I got it” / “I missed it.”
- Preserve vertical scrolling with `touch-action: pan-y`; a short or vertically-dominant drag must never rate a card.
- Block gestures while submitting or while a review error is present. Reuse the current `submitRating` single-flight/retry behavior instead of creating a second request path.
- Keep the interaction usable at a 375 px viewport in light and dark themes, with no interactive element below the 44 px touch-target minimum.

## File Structure

- Create: `frontend/src/hooks/useHorizontalSwipe.js` — dependency-free pointer gesture primitive with threshold, direction lock, and single-release callback.
- Modify: `frontend/src/pages/Review.jsx` — calculate eligibility/rating from `picked`, connect the hook to the card, and render transient feedback plus disabled-state guidance.
- Modify: `frontend/test/Review.test.jsx` — verify real Review gesture mapping, guardrails, and that normal rating controls still work.

## Task 1: Build the Swipe Contract Through the Review UI

**Files:**
- Create: `frontend/src/hooks/useHorizontalSwipe.js`
- Modify: `frontend/src/pages/Review.jsx`
- Modify: `frontend/test/Review.test.jsx`

- [ ] **Step 1: Add failing component-level gesture tests first.**

  Change the testing-library import and add these helpers beneath `revealAndRate` in `frontend/test/Review.test.jsx`:

  ```jsx
  import { act, fireEvent, render, screen } from '@testing-library/react';

  async function selectAndReveal(user, option) {
    await user.click(screen.getByRole('button', { name: option }));
    await screen.findByLabelText('Correct answer');
  }

  function swipeReviewCard({ fromX, toX, fromY = 180, toY = fromY }) {
    const card = screen.getByTestId('review-card');
    const pointer = { pointerId: 1, pointerType: 'touch' };
    fireEvent.pointerDown(card, { ...pointer, clientX: fromX, clientY: fromY });
    fireEvent.pointerMove(card, { ...pointer, clientX: toX, clientY: toY });
    fireEvent.pointerUp(card, { ...pointer, clientX: toX, clientY: toY });
  }
  ```

  Add focused tests that set `TODAY`, mock a successful `submitReview`, then assert the outgoing payload rating:

  ```jsx
  it('maps a correct selection: left to Easy and right to Hard', async () => {
    const user = userEvent.setup();
    useLearningStore.getState().replaceToday(TODAY);
    submitReview.mockResolvedValue({ duplicate: false, today: NEXT_TODAY });
    renderReview();

    await selectAndReveal(user, CARD.answer);
    swipeReviewCard({ fromX: 240, toX: 120 });

    await vi.waitFor(() => expect(submitReview).toHaveBeenCalled());
    expect(submitReview.mock.calls[0][0]).toEqual(
      expect.objectContaining({ cardId: CARD.id, rating: 'easy' }),
    );
  });
  ```

  Use independent renders for the remaining cases so each request can advance the queue: correct right = `hard`, wrong (`'work'`) left = `good`, and wrong right = `hard`. Add guard tests for all of the following:

  - before reveal;
  - direct **Show answer** reveal with `picked === null`;
  - the `NEXT_CARD` guided-recall card after its answer is shown;
  - a 20 px drag and a vertical-dominant drag;
  - a pending submit and a visible retryable review error.

  Preserve the existing test that confirms the four buttons are enabled in normal flow, and use an existing button in at least one gesture test to prove custom ratings remain functional.

- [ ] **Step 2: Run the focused test to establish the failing contract.**

  Run from `frontend`:

  ```bash
  bunx vitest run test/Review.test.jsx
  ```

  Expected: the new tests fail before implementation because `review-card` and pointer handling do not yet exist; unrelated existing Review tests remain green.

- [ ] **Step 3: Create the reusable, native pointer hook.**

  Create `frontend/src/hooks/useHorizontalSwipe.js`. It must handle only `touch` and `pen` pointers, lock direction after 12 px of movement, cap visual drag at 120 px, and invoke exactly one callback only when the absolute horizontal release distance is at least 80 px.

  Implement this API and behavior:

  ```jsx
  import { useCallback, useEffect, useRef, useState } from 'react';

  const DIRECTION_LOCK_PX = 12;
  const MAX_DRAG_PX = 120;
  const SWIPE_THRESHOLD_PX = 80;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  export default function useHorizontalSwipe({ enabled, onSwipeLeft, onSwipeRight }) {
    const [dragX, setDragX] = useState(0);
    const startRef = useRef(null);
    const axisRef = useRef(null);
    const committedRef = useRef(false);

    const clearGesture = useCallback(() => {
      startRef.current = null;
      axisRef.current = null;
      setDragX(0);
    }, []);

    useEffect(() => {
      if (!enabled) clearGesture();
    }, [clearGesture, enabled]);

    const onPointerDown = useCallback((event) => {
      if (!enabled || !['touch', 'pen'].includes(event.pointerType)) return;
      startRef.current = {
        pointerId: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY,
      };
      axisRef.current = null;
      committedRef.current = false;
    }, [enabled]);

    const onPointerMove = useCallback((event) => {
      const start = startRef.current;
      if (!enabled || !start || start.pointerId !== event.pointerId) return;

      const deltaX = event.clientX - start.clientX;
      const deltaY = event.clientY - start.clientY;
      if (!axisRef.current && Math.max(Math.abs(deltaX), Math.abs(deltaY)) >= DIRECTION_LOCK_PX) {
        axisRef.current = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
        if (axisRef.current === 'horizontal') {
          event.currentTarget.setPointerCapture?.(event.pointerId);
        }
      }
      if (axisRef.current === 'horizontal') {
        setDragX(clamp(deltaX, -MAX_DRAG_PX, MAX_DRAG_PX));
      }
    }, [enabled]);

    const finishPointer = useCallback((event) => {
      const start = startRef.current;
      if (!start || start.pointerId !== event.pointerId) return;
      const deltaX = event.clientX - start.clientX;
      const shouldCommit = axisRef.current === 'horizontal'
        && Math.abs(deltaX) >= SWIPE_THRESHOLD_PX
        && !committedRef.current;
      clearGesture();
      if (!shouldCommit) return;

      committedRef.current = true;
      if (deltaX < 0) onSwipeLeft();
      else onSwipeRight();
    }, [clearGesture, onSwipeLeft, onSwipeRight]);

    return {
      dragX,
      direction: dragX === 0 ? null : dragX < 0 ? 'left' : 'right',
      pointerHandlers: { onPointerDown, onPointerMove, onPointerUp: finishPointer, onPointerCancel: clearGesture },
    };
  }
  ```

  Do not call `preventDefault`; the card will declare `touchAction: 'pan-y'`, preserving the parent scroller for vertically-intended gestures.

- [ ] **Step 4: Integrate the hook into `Review` without changing submissions.**

  Add the hook import and these derived values immediately after `hasMCQ` in `frontend/src/pages/Review.jsx`:

  ```jsx
  const swipeEnabled = Boolean(
    hasMCQ && revealed && picked && !isSubmitting && !reviewError,
  );
  const leftSwipeRating = picked === card.answer ? 'easy' : 'good';
  const { dragX, direction: swipeDirection, pointerHandlers } = useHorizontalSwipe({
    enabled: swipeEnabled,
    onSwipeLeft: () => void submitRating(leftSwipeRating),
    onSwipeRight: () => void submitRating('hard'),
  });
  const swipeRating = swipeDirection === 'left'
    ? leftSwipeRating
    : swipeDirection === 'right' ? 'hard' : null;
  ```

  Keep this declaration order: `swipeDirection` must be read only after the hook return is destructured.

  On the existing keyed card `<div>`, add `data-testid="review-card"`, spread `pointerHandlers`, and apply the motion only while a swipe is eligible:

  ```jsx
  <div
    key={card.id}
    data-testid="review-card"
    {...pointerHandlers}
    style={{
      touchAction: swipeEnabled ? 'pan-y' : undefined,
      transform: dragX ? `translateX(${dragX}px) rotate(${dragX / 30}deg)` : undefined,
    }}
    className="relative flex min-h-[calc(100dvh-190px)] w-full flex-col rounded-[22px] border border-[var(--border-soft)] bg-[var(--bg-card)] p-6 shadow-[0_6px_20px_rgba(15,22,32,0.04)] transition-transform duration-150 dark:shadow-[0_6px_20px_rgba(0,0,0,0.3)]"
  >
  ```

  Render a `pointer-events-none`, `aria-hidden` rating label inside this relative card only when `swipeRating` exists. It must say **Easy**, **Good**, or **Hard** and use the same blue, green, or amber semantic color already used by the matching bottom action. It should not replace, obscure, or move card content.

  Beneath the revealed answer, add one short neutral status message only in the two swipe-ineligible revealed states:

  ```jsx
  {revealed && hasMCQ && !picked && (
    <p role="status" className="mt-3 text-center text-sm text-[var(--text-2)]">
      Choose an answer to swipe, or use a rating below.
    </p>
  )}
  {revealed && !hasMCQ && (
    <p role="status" className="mt-3 text-center text-sm text-[var(--text-2)]">
      Use a rating button below to continue.
    </p>
  )}
  ```

  Do not alter `submitRating`, `retryReview`, `pick`, the `REVIEW_BUTTONS` array, the review API payload, or the store. The hook callbacks must call the current `submitRating` so a swipe uses the exact existing begin/submit/retry lifecycle.

- [ ] **Step 5: Re-run the focused contract and fix only real failures.**

  ```bash
  bunx vitest run test/Review.test.jsx
  ```

  Expected: every existing Review behavior and every added swipe mapping/guard test passes. A qualifying gesture produces one `submitReview` call; disabled, short, and vertical gestures produce none.

- [ ] **Step 6: Commit the implementation.**

  ```bash
  git add frontend/src/hooks/useHorizontalSwipe.js frontend/src/pages/Review.jsx frontend/test/Review.test.jsx
  git commit -m "feat: add review swipe ratings"
  ```

  Do not stage `.codex/config.toml`; it is repository-local tooling configuration, not product source.

## Task 2: Run Regression and Mobile Interaction Verification

**Files:**
- Verify only: `frontend/src/hooks/useHorizontalSwipe.js`
- Verify only: `frontend/src/pages/Review.jsx`
- Verify only: `frontend/test/Review.test.jsx`

- [ ] **Step 1: Run the full automated frontend checks from `frontend`.**

  ```bash
  bun run test
  bun run lint
  bun run build
  ```

  Expected: all Node/Vitest tests, ESLint, and the production Vite build exit successfully. If a check fails, make the smallest focused correction, rerun the failed command and then the full three-command sequence before amending the implementation commit.

- [ ] **Step 2: Perform a 375 px interaction pass in both themes.**

  Start the app with `bun run dev`, open the Review route with a real due multiple-choice card, and test at a 375 px-wide viewport:

  1. Select the correct answer, then swipe left and right in separate cards; confirm the card feedback reads Easy and Hard respectively, and the server-returned next card appears.
  2. Select a wrong answer, then swipe left and right; confirm the feedback reads Good and Hard respectively.
  3. Verify a direct **Show answer** reveal and a guided-recall card show their short guidance, do not swipe-submit, and still expose the four rating buttons.
  4. Confirm a short drag and a vertically-dominant drag leave the card in place and normal vertical page scrolling still works.
  5. Toggle dark mode and confirm feedback contrast, card content, and rating buttons remain legible and touchable.

  Expected: gesture feedback is transient and supplementary, not a modal or a replacement for the controls. No browser-console errors occur.

- [ ] **Step 3: Inspect the final diff and repository boundary.**

  ```bash
  git diff origin/dev...HEAD --check
  git status --short
  ```

  Expected: only the approved design/plan and the three implementation files are committed; `.codex/` remains untracked and unstaged.

## Final Acceptance Criteria

- An answered MCQ supports a deliberate left/right touch or pen swipe, submits once, and advances with the existing server response.
- Correct: left = Easy, right = Hard. Wrong: left = Good, right = Hard.
- No swipe request is possible before selection/reveal, after direct Show answer, on guided recall, during submit, or during a review error.
- Short and vertical gestures do not rate; vertical scrolling remains native.
- The four manual rating buttons and current retry/error behavior remain intact.
- `bun run test`, `bun run lint`, and `bun run build` pass, followed by the 375 px light/dark manual interaction check.
