# Authenticated Library Content Integration

## Context

Issue #38 added a validated, transactional seed pipeline and six curated starter
decks with 20 cards each. The current Library does not read that data. It still
imports eight prototype decks and ten prototype cards from `srsData.js`, so deck
detail can show two, one, or zero cards even when its displayed total claims a
larger number.

This design delivers the smallest user-visible slice of issue #39 and advances
the Library MVP in issue #33. It proves that authenticated users can browse the
seeded learning content before the spaced-repetition loop is implemented.
Issue #37 remains the next major feature after this slice.

## Goals

- Require Clerk authentication before a user enters Library.
- Read published decks and active cards from the seeded `decks` and `cards`
  tables.
- Show the six starter decks and all 20 cards in each deck when the dev database
  contains `starter@2026.07.1`.
- Remove hardcoded deck totals and fake progress values from Library.
- Preserve Today's prototype counts/queue and Review behavior until issue #37
  and the remaining issue #39 work replace their prototype state. Today deck
  rows route to the real Library list without passing incompatible prototype
  deck IDs.
- Provide clear loading, empty, unauthorized, backend-unavailable, and retry
  behavior.

## Non-Goals

- Implementing spaced repetition, due-card calculation, enrollment, or review
  submission.
- Migrating Today or Review away from `srsData.js`.
- Showing `due`, `learning`, `mastered`, or other user-progress values in
  Library.
- Supporting deck creation, search, bookmarks, offline content caching, or
  user-authored decks.
- Reusing or deleting the legacy `collections`, `collection_words`, and `words`
  API model.
- Running the production seed command or changing production data as part of
  this feature.

## Chosen Approach

Add an authenticated learning-content API over the existing `Deck` and `Card`
entities. Library consumes that API with a Clerk token. The routes live under
`/api/content/decks` so they do not conflict with the approved progress-aware
`/api/decks` and `/api/decks/:id` contracts reserved for issues #37 and #39.
The legacy collections API remains separate because it represents a different
vocabulary model, and bundling the seed JSON into the frontend is rejected
because it would bypass the database and drift from deployed content.

## Backend Design

Create a focused learning-content controller and service under the existing
learning domain. The service owns read-only queries for published decks and
active cards. It does not read or synthesize user progress.

The existing global `ClerkAuthGuard` protects both endpoints. They must not use
`@Public()`. Unknown and unpublished deck slugs both return 404 so unpublished
content is not disclosed.

### `GET /api/content/decks`

Returns a standard paginated response. Defaults are `limit=20` and `offset=0`,
with the repository's existing validation conventions and a maximum limit of
100.

Only rows where `decks.is_published = true` are returned. Each deck includes a
count of cards where `cards.is_active = true`. Results are ordered by
`sort_order`, then `slug` for deterministic ties.

Each item has this public shape:

```json
{
  "id": "uuid",
  "slug": "articles-a-an-the",
  "name": "Articles: a, an, and the",
  "description": "...",
  "type": "grammar",
  "level": "beginner",
  "cardCount": 20
}
```

Internal fields such as `content_version`, publication flags, and timestamps
are not part of the response.

The client requests `limit=100` and follows `hasNext` until every page is
loaded. Filtering therefore covers the complete published catalog rather than
only the first page. The current six-deck bundle completes in one request, but
the contract remains correct if the catalog later exceeds 100 decks.

### `GET /api/content/decks/:slug/cards`

Returns a standard paginated response for a published deck. Defaults are
`limit=50` and `offset=0`, with a maximum limit of 200 so the current 20–50 card
content contract fits in one request.

Only active cards are returned, ordered by `sort_order`, then `content_key` for
deterministic ties. Each item contains:

```json
{
  "id": "uuid",
  "contentKey": "articles-001",
  "type": "grammar",
  "level": "beginner",
  "front": "...",
  "answer": "...",
  "explanation": "...",
  "example": null,
  "options": null
}
```

`example` is `string | null` and `options` is `string[] | null`, matching valid
database rows. Library's initial card rows show `front` and `answer`; nullable
examples and options are retained in the API for later content presentation
but are not required for this UI.

The content is authenticated but is not progress-aware. Card responses do not
include stage, due date, scheduler state, or review history.

## Frontend Design

Wrap `/library` with the existing `PrivateRoute`. A signed-out visitor sees the
existing Clerk sign-in experience; an environment without Clerk configuration
shows the existing authentication-not-configured state.

Add `getContentDecks` and `getContentDeckCards` functions to the API client.
Library obtains a Clerk token with `useAuth().getToken()` and passes it to every
request. Requests are cancelled on unmount and when a superseding deck
selection makes an older request irrelevant.

Split the current large Library page into focused presentation units:

- `Library` owns authentication-aware loading, type filtering, selected-deck
  state, and retry actions.
- `LibraryDeckRow` renders content metadata: name, type, level, and real card
  count.
- `LibraryDeckDetail` loads and renders the selected deck's real cards. Each
  card row shows the front as primary text and the answer as secondary text;
  it does not invent a learning stage.

The existing `DeckRow` remains unchanged for Today because Today still expects
prototype progress fields. Library stops importing `DECKS` and `CARDS` from
`srsData.js`. This avoids inventing progress and prevents changes in this slice
from silently altering Today.

Today currently deep-links with prototype IDs such as `d1`, which cannot
identify backend decks. In this slice its deck-row click opens `/library`
without `openDeckId`. This preserves a useful route into Library without an
incorrect ID mapping. Issue #37/#39 will restore exact deck navigation when
Today uses backend deck IDs.

The All, Vocabulary, Grammar, and Tips filters operate client-side over the six
loaded decks. Hide the non-functional Search control and Create deck CTA in
this slice. No visible copy may describe the screen as a prototype.

## UI States

- **Loading decks:** show a stable Library skeleton or compact loading state;
  do not flash the old static decks.
- **Empty Library:** explain that no published learning decks are available and
  offer Retry. This is an operational signal that the database may not have
  been seeded.
- **Loading cards:** keep the selected deck header visible and show a card-list
  loading state.
- **Empty deck:** show that the deck currently has no active cards; do not fall
  back to static cards.
- **Unauthorized:** rely on `PrivateRoute` for signed-out access. If an API
  request still returns 401 because a session expires, show a sign-in/session
  recovery message instead of cached content.
- **Backend unavailable:** show a retryable error without replacing real data
  with prototype data.
- **Stale request:** ignore or cancel a response belonging to a previously
  selected deck.

## Data Flow

1. The user opens `/library`.
2. `PrivateRoute` requires a Clerk session.
3. Library obtains the session token and calls
   `GET /api/content/decks?limit=100&offset=0`, following additional pages while
   `hasNext` is true.
4. The backend guard verifies the token and resolves the canonical user.
5. The learning-content service returns published decks with active-card
   counts.
6. The user selects a deck and Library calls
   `GET /api/content/decks/:slug/cards?limit=50&offset=0`.
7. The backend returns the deck's ordered active cards.
8. Library renders those cards and never consults `srsData.js` as a fallback.

## Testing

Backend tests cover:

- Published-only deck queries and active-card counts.
- Deterministic deck and card ordering.
- Active-only card queries.
- Pagination validation and response metadata.
- Correct page boundaries when published decks exceed the requested limit.
- 404 behavior for unknown and unpublished slugs.
- 401 behavior without a Clerk bearer token.
- The seeded integration result of six published decks and 20 active cards per
  deck when the seed fixture is loaded.

Frontend tests remain bounded to the current Bun-based setup:

- API client paths, query parameters, bearer-token attachment, and error
  propagation with a mocked `fetch`.
- Multi-page catalog loading so filters cover more than 100 published decks.
- Pure Library filtering and response-mapping behavior.
- Today deck rows no longer pass prototype `openDeckId` values into Library.
- A regression assertion that Library no longer imports static `DECKS` or
  `CARDS`.
- Existing frontend tests, lint, and production build.

Browser verification covers signed-out gating, signed-in deck loading, all four
filters, opening every deck, 20 visible cards per seeded deck, retry behavior,
the 375px viewport, and light/dark modes.

## Deployment and Verification

Deploy and verify dev before any production action:

1. Merge through the protected PR flow into `dev`.
2. Confirm backend and frontend dev deployments use the dev API and Clerk
   environments.
3. Confirm issue #38's one-time dev preparation has produced six published
   decks and 120 active cards. If it has not, follow the existing learning
   content release runbook; do not improvise a startup seed.
4. Call both endpoints with a dev Clerk token and verify six decks and 20 cards
   per deck.
5. Verify the same counts through the dev Library UI.

Production remains a separate approval and release step. This design does not
authorize a production seed or deployment.

## Acceptance Criteria

- A signed-out user cannot enter Library.
- A signed-in user sees only published backend decks.
- With `starter@2026.07.1` loaded, Library shows six decks and each deck detail
  shows its 20 active cards.
- Library displays real card counts and no fake due, learning, mastered, or
  stage values.
- Library never falls back to `srsData.js` when loading fails or returns empty.
- Unknown and unpublished deck slugs return 404; missing authentication returns
  401.
- Loading, empty, unauthorized, unavailable, and retry states are usable at
  375px in light and dark modes.
- Today retains its prototype counts and queue, but deck rows open the Library
  list without an incompatible prototype ID. Review retains its current
  behavior.
- Backend tests, frontend tests, lint, build, and dev browser verification pass.

## Follow-Up Sequence

1. Implement issue #37: scheduler, persisted progress, `GET /api/today`, and
   idempotent `POST /api/reviews`.
2. Finish issue #39: connect Today and Review to those APIs and remove
   `srsData.js` as the remaining authoritative learning source.
3. Verify the complete authenticated Today → Review → Complete loop before
   treating the MVP learning experience as functional.
