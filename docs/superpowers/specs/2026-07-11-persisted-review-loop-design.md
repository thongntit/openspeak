# Persisted Review Loop Design

## Goal

Complete GitHub issue #31 by making Today, Review, and session completion share one local source of truth whose progress survives a page refresh.

## Scope

This change covers the existing starter cards and the Today -> Review -> Complete loop. It does not add accounts, backend synchronization, deck creation, pronunciation features, or the larger starter-content expansion tracked by issue #34.

## Architecture

Add a Zustand store persisted to versioned localStorage. Static learning content remains in `srsData.js`; the store owns per-card review state. Pages select derived data from the store instead of reading hardcoded deck due totals.

The persisted state for each card contains its stage, due timestamp, and most recent rating. Store actions expose a due-card queue and record one of the four existing review ratings. Derived selectors calculate due totals and group them by deck and card type.

## Review Scheduling

- `again`: keep the card in learning and make it due immediately.
- `hard`: keep the card in learning and schedule it six minutes ahead.
- `good`: move the card to review and schedule it one day ahead.
- `easy`: move the card to review and schedule it four days ahead.

The session queue is a snapshot taken when Review opens. Rating a card updates persisted state but does not mutate the remaining queue. This avoids surprising reordering during a session.

## User Flow

Today displays counts derived from actual starter cards. Starting a review opens the current due queue. The user reveals or answers each card and rates it. The completion screen summarizes the session. Returning to Today immediately shows the new due count.

When no cards are due, Today displays an explicit caught-up state and does not start an empty review. Review also handles a directly opened empty queue with the same successful completion state.

## Persistence and Recovery

The localStorage payload is versioned. Persist only review state, not static card content or functions. On hydration, missing cards receive their starter defaults and unknown saved card IDs are ignored. Invalid timestamps or malformed state fall back to starter state without blocking the application.

## Testing

Use Node's existing test runner for pure review-model tests. Cover initial due-card derivation, all four rating transitions, grouped counts, empty queues, and reconciliation of malformed or stale persisted data. Run the existing branding tests, ESLint, and the production build.

Browser verification uses a 375px viewport in light and dark modes. It covers Today -> Review -> reveal/answer -> rate -> complete -> Today, then refreshes to verify the updated count remains.

## Acceptance Criteria Mapping

- Today due count comes from the same card state used by Review.
- Start review opens the derived due queue.
- Answers can be revealed and cards can be rated.
- Completion shows a clear summary.
- Returning to Today reflects ratings immediately.
- Progress survives refresh in localStorage.
- Empty due state is clear and safe.
- The complete flow is usable at 375px.
