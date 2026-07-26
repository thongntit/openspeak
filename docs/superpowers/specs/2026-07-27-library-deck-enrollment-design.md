# Library Deck Enrollment Design

## Goal

Let an authenticated learner open any published Library deck, press **Learn
deck**, and add every active card in that deck to Gramio's server-backed review
queue immediately.

## Confirmed Product Behavior

- The action enrolls the whole deck. There is no starter batch or daily-release
  limit in this feature.
- Every active card that does not yet have user progress receives new progress
  with a due time of the enrollment request, so it appears in Today immediately.
- Previously reviewed progress is preserved. Repeating the action or
  reactivating an enrollment never resets scheduling history or pulls
  future-due cards forward.
- A successfully enrolled deck is presented as **Learning** after the action and
  after a later Library reload.
- The learner stays on the deck detail screen. The returned Today snapshot is
  written into the shared learning store, so Today and Review use the new queue
  without another request.

## Backend Design

Add an authenticated, idempotent endpoint:

```http
POST /api/decks/:deckId/enroll
Authorization: Bearer <Clerk token>
```

Successful requests return HTTP 200:

```json
{
  "deckId": "deck UUID",
  "isLearning": true,
  "enrolledCardCount": 20,
  "today": {
    "queue": [],
    "totalDue": 20,
    "countsByType": { "grammar": 20 },
    "countsByDeck": { "deck UUID": 20 },
    "caughtUp": false,
    "serverTimestamp": "2026-07-27T00:00:00.000Z"
  }
}
```

The service performs one database transaction:

1. Resolve the deck by UUID and require `is_published = true`.
2. Read every active card in deterministic `sort_order`, then `id`, order.
3. Reject a published deck with no active cards.
4. Insert or reactivate the unique `(user_id, deck_id)` enrollment.
5. Insert one new-stage progress row for every missing `(user_id, card_id)`
   pair. Conflict-ignore semantics preserve existing progress.
6. Commit, then build the canonical Today response using the same request time.

New progress uses the existing `fsrs-v1` scheduler version and the entity's
new-card defaults. No schema migration is required.

Errors use the existing global error shape:

- malformed deck UUID: 400;
- unknown or unpublished deck: 404;
- published deck without active cards: 400;
- missing or invalid authentication: 401;
- unexpected transaction failure: 500 with no partial enrollment.

## Library Enrollment Status

The authenticated `GET /api/content/decks` response gains an `isLearning`
boolean for each published deck. The query left-joins the current user's
`user_decks` row and reports true only when the enrollment is active. This lets
the Library render durable state without a second per-deck request.

## Frontend Design

The deck detail header gains a full-width, mobile-friendly action:

- **Learn deck** while the deck is not enrolled;
- **Adding deck…** while the request is in flight;
- **Learning** after success, disabled to prevent duplicate clicks.

Supporting copy states that all active cards will be added to Today. The action:

1. obtains a fresh Clerk token;
2. calls `POST /decks/:deckId/enroll`;
3. replaces the Zustand Today snapshot with `response.today`;
4. updates the selected deck and Library list item to `isLearning: true`.

The button remains in place on network or server failure and shows a concise
inline alert with a retryable action. Network and server failures preserve the
existing Today snapshot. A 401 uses session-expired copy and clears the
user-specific learning snapshot through the existing session boundary. The
request is single-flight while the button is busy, and the control remains at
least 44px tall with light and dark theme styling.

## Testing

Backend tests cover:

- controller forwarding of authenticated user and deck IDs;
- insertion of progress for every active card with a common due time;
- active enrollment upsert;
- conflict-ignore behavior that preserves existing progress;
- canonical Today response passthrough;
- unpublished/unknown and empty-deck errors;
- per-user `isLearning` projection in Library content.

Frontend tests cover:

- encoded enrollment URL, POST method, and bearer token;
- Learn button success, single-flight behavior, persistent Learning state, and
  shared Today replacement;
- enrollment error copy and retry;
- Library propagation of the updated enrollment flag.

The final gate runs backend tests, backend build, frontend tests, frontend lint,
and frontend production build.

## Out of Scope

- pausing or removing a deck;
- daily new-card limits or staged card release;
- creating personal words or grammar cards;
- resetting existing review progress;
- automatic navigation into Review after enrollment.

## Acceptance Criteria

1. From a caught-up account, learning a 20-card deck makes all 20 active cards
   due in Today immediately.
2. Pressing the endpoint repeatedly creates no duplicate enrollment or progress
   rows and does not reset reviewed cards.
3. The deck remains marked Learning after the Library is reloaded.
4. A retryable network or server failure leaves both the Library state and
   Today snapshot unchanged; a 401 clears authenticated learning state.
5. Existing authenticated Today and Review behavior remains passing.
