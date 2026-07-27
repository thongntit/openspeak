# Reversible learning, reachable review controls, and truthful profile design

## Goal

Remove the three ways the learning loop can mislead or trap a learner: a deck enrollment must be reversible, rating controls must remain reachable after an answer is revealed, and Profile must show authenticated data rather than placeholders.

## Decisions

### Reversible deck learning

The existing `user_decks.is_active` flag is the enrollment source of truth. Add an idempotent `DELETE /decks/:deckId/enrollment` action that verifies the published deck, sets only that user's enrollment inactive, and returns canonical Today. It does not delete `user_card_progress` or `review_events`; a later Learn action reactivates the deck and reuses preserved progress.

Library shows `Learn deck` only for inactive decks and an enabled `Stop learning` action for active decks. The action is single-flight, returns to its prior state on an error, and updates both Library and the shared Today cache after success.

### Review layout

Review is a normal vertically flowing document inside AppShell's scroll container. The card has a viewport-based minimum height for the unrevealed state but does not use a fixed height after answer content expands. Rating controls remain after the card in document flow, so an explanation can push them down without occupying the same space; normal scrolling reaches every control at 375px width.

### Truthful profile

`GET /me/summary` returns data derived from the authenticated application's records:

- `reviewsCompleted`: count of accepted `review_events` for the user.
- `learningDecks`: count of active `user_decks` for the user.
- `dueNow`: count of due `user_card_progress` rows that satisfy the shared active-enrollment/card/published-deck visibility rule.

Profile continues to obtain the signed-in user's name, email, and optional Clerk image from Clerk. It renders loading and unavailable states instead of placeholder statistics, and removes preference/help rows that currently advertise settings with no behavior.

## Boundaries and errors

- Deck enrollment actions require the existing authenticated principal and UUID validation.
- Unknown or unpublished decks remain a 404; stopping an already inactive known deck is a successful no-op.
- The frontend maps 401 errors to the existing session-expired copy. Other failures leave the prior Library state in place and show a retryable message.
- Profile never substitutes static metrics. A failed summary request shows an explicit unavailable state with Retry.

## Verification

- Backend unit tests cover controller delegation, idempotent deactivation, canonical Today refresh, and each profile-summary count/query condition.
- Frontend tests cover API method/path, stop-learning state propagation and failure recovery, profile loading/error/real values, and a revealed card with every rating actionable.
- Run backend Jest, frontend tests, lint, build, and a 375px browser pass through the affected flows.
