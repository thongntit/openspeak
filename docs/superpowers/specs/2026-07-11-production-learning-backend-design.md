# Production Learning Backend Design

## Purpose

Replace Gramio's prototype-only static content and browser-owned review progress with an authenticated, server-owned learning platform. The first production slice must let a user log in, receive due cards, submit spaced-repetition ratings, and retrieve the same progress after refresh or from another device.

## Product Decisions

- Clerk login is mandatory before any learning feature is accessible.
- Only technical health/status endpoints are public.
- PostgreSQL is the source of truth for content, enrollment, progress, and review history.
- Scheduling runs on the backend and stores versioned spaced-repetition state.
- The backend remains a NestJS modular monolith.
- TypeORM entities and migrations remain in this repository.
- The frontend's `srsData.js` and localStorage review state are prototype references, not production sources of truth.

## Repository Boundary

Database migrations stay under `backend/src/database/migrations`. Application code and schema changes must be reviewed, released, and rolled back together. A separate database repository would introduce cross-repository ordering and compatibility problems without a separate database-owning service, so it is explicitly out of scope.

The repository keeps these deployable units:

- `backend`: NestJS API, TypeORM migrations, seed/import tooling, and backend tests.
- `frontend`: authenticated React PWA consuming backend contracts.

## Backend Modules

### AuthModule

Verify Clerk bearer tokens, extract the stable Clerk subject, and resolve an internal user UUID. Authentication is implemented as a reusable NestJS guard. A public-route decorator is allowed only for explicitly reviewed endpoints such as `GET /api/health`.

The guard attaches an application principal containing the internal user ID and Clerk user ID to the request. Controllers and services consume that principal rather than parsing tokens themselves.

### UsersModule

Provision an internal user on the first valid authenticated request and resolve existing users thereafter. Provisioning must be safe under concurrent first requests by relying on a unique Clerk user ID constraint and conflict-aware retry/read behavior.

### ContentModule

Own published decks, cards, ordering, content levels, card types, and content versions. Content reads return only published decks and active cards to ordinary users. Administrative content editing is not part of this slice; content enters through validated, repeatable seed/import tooling.

### LearningModule

Own deck enrollment and the authenticated Today query. The Today service selects due progress for the current user, joins published card content, orders the queue deterministically, and returns counts grouped by deck and card type from the same result set.

### SchedulerModule

Expose a pure scheduler interface that accepts the current stored scheduling state, rating, and server clock, then returns a new state. Controllers and repositories do not contain scheduling mathematics.

The initial implementation uses FSRS-style fields and transitions for Again, Hard, Good, and Easy. Every progress row stores a scheduler version. Scheduler unit tests use a fixed clock and deterministic parameter set.

### ReviewsModule

Validate and submit ratings. A review request is processed transactionally: resolve enrollment and card, lock current progress, check idempotency, calculate the next schedule, append an immutable review event, update progress, and return the resulting state plus refreshed Today counts.

## Data Model

### users

- `id`: UUID primary key.
- `clerk_user_id`: unique, non-null stable Clerk subject.
- `created_at`, `updated_at`: timestamps.

### decks

- `id`: UUID primary key.
- `slug`: unique stable content key.
- `name`, `description`: display content.
- `type`: vocabulary, grammar, or tip.
- `level`: normalized learning level.
- `content_version`: integer or version string used by imports.
- `sort_order`: deterministic ordering.
- `is_published`: publication flag.
- timestamps.

### cards

- `id`: UUID primary key.
- `deck_id`: foreign key to decks.
- `content_key`: stable key unique within a deck.
- `type`, `level`: normalized classification.
- `front`, `answer`, `explanation`, `example`: learning content.
- `options`: nullable JSON array for multiple-choice cards.
- `sort_order`: deterministic ordering.
- `content_version`: import version.
- `is_active`: safe publication/removal flag.
- timestamps.

### user_decks

- `id`: UUID primary key.
- `user_id`, `deck_id`: foreign keys with a composite unique enrollment constraint.
- `enrolled_at`: timestamp.
- `is_active`: whether the deck contributes to Today.

### user_card_progress

- `id`: UUID primary key.
- `user_id`, `card_id`: foreign keys with a composite unique progress constraint.
- `stage`: new, learning, review, or mastered.
- `due_at`: indexed due timestamp.
- `stability`, `difficulty`: scheduler state.
- `elapsed_days`, `scheduled_days`: scheduler intervals.
- `repetitions`, `lapses`: counters.
- `last_reviewed_at`: nullable timestamp.
- `last_rating`: nullable Again, Hard, Good, or Easy.
- `scheduler_version`: non-null version identifier.
- timestamps.

The primary due-query index begins with `user_id` and `due_at`. Additional indexes support active enrollment and published-content joins.

### review_events

- `id`: UUID primary key.
- `user_id`, `card_id`: immutable ownership and content references.
- `client_request_id`: unique per user for idempotency.
- `rating`: Again, Hard, Good, or Easy.
- `reviewed_at`: authoritative server review timestamp.
- `client_reviewed_at`: optional bounded client timestamp for diagnostics.
- `scheduler_version`: algorithm version used.
- `state_before`, `state_after`: JSON scheduling snapshots sufficient for audit and debugging.
- `created_at`: timestamp.

Review events are append-only. Content retirement must not delete review events or progress history.

## Authentication and Authorization

All `/api` learning routes require a valid Clerk token. `GET /api/health` is the only initially public route. Backend authorization always scopes queries by the internal user ID; user IDs supplied by clients are rejected or ignored.

The frontend route guard improves experience but is not a security boundary. Clearing browser state, changing route URLs, or calling APIs directly must not bypass backend authentication.

Authentication errors return a stable 401 response without exposing Clerk configuration, token contents, or backend stack traces. Authenticated users accessing unavailable content receive 404 rather than ownership details.

## API Contracts

### GET /api/me/bootstrap

Return the internal user identity needed by the client, enabled product capabilities, and lightweight learning summary. This endpoint provisions the internal user when necessary.

### GET /api/today

Return:

- due-card queue with card content and current progress version;
- total due count;
- counts grouped by card type and deck;
- server timestamp;
- an empty queue and explicit caught-up state when nothing is due.

The queue and counts are produced by one server query/service operation so they cannot disagree.

### GET /api/decks

Return published decks with enrolled state and user-specific due, learning, and mastered counts.

### GET /api/decks/:id

Return published deck metadata and active cards visible to the authenticated user. Progress summaries are scoped to that user.

### POST /api/decks/:id/enroll

Idempotently enroll the current user and initialize progress for active cards. Repeated enrollment requests return the existing enrollment.

### POST /api/reviews

Request fields:

- `cardId`: required UUID.
- `rating`: Again, Hard, Good, or Easy.
- `clientRequestId`: required UUID generated once per user action and reused on retries.
- `clientReviewedAt`: optional ISO timestamp within defined clock-skew bounds.

Response fields:

- accepted review-event ID;
- card ID and new progress state;
- previous and next due timestamps;
- scheduler version;
- refreshed Today summary.

The response for a repeated idempotency key is semantically identical to the original accepted result and does not schedule the card twice.

## Scheduling Behavior

Newly enrolled active cards start in `new` with an immediately eligible due time. The scheduler transitions cards using the stored state, selected rating, configured parameter set, and authoritative server time.

Scheduler parameters and implementation version are explicit configuration, not hidden constants in controllers. Changing scheduler versions requires a documented compatibility or migration strategy. Historical events retain the version that produced them.

The scheduler is pure and side-effect free. Persistence, locking, authorization, and idempotency remain responsibilities of ReviewsModule.

## Transaction and Concurrency Rules

Review submission runs in a PostgreSQL transaction.

1. Resolve the authenticated user and published, enrolled card.
2. Look up the user/request idempotency key; return the stored result if it already exists.
3. Lock the `user_card_progress` row for the user/card.
4. Re-check idempotency after acquiring the lock.
5. Calculate the new schedule using server time.
6. Insert the immutable review event.
7. Update the progress row.
8. Commit and return the stored result plus refreshed counts.

The unique `(user_id, client_request_id)` constraint is the final defense against duplicate submissions. Concurrent different request IDs for the same card serialize through the progress-row lock.

## Content Import and Seeding

Starter content lives in a versioned source format inside the backend scope. The importer validates the complete dataset before opening a mutation transaction. Stable deck slugs and card content keys allow reruns to update records without duplication.

Removing content from a new source version unpublishes or deactivates records; it does not hard-delete content referenced by progress or review history. The seed workflow must work against clean local, staging, and production databases using documented commands.

## Error Handling

- 400: malformed identifiers, ratings, timestamps, or request IDs.
- 401: missing, invalid, or expired authentication.
- 404: unpublished, unknown, or inaccessible deck/card.
- 409: incompatible stale progress only when the server cannot safely serialize the request; ordinary duplicates use idempotent success.
- 500: unexpected server error with a stable public message and correlated structured log.

Logs may include internal user ID, card ID, request ID, scheduler version, status, and latency. Logs must not contain bearer tokens, Clerk secrets, answers, explanations, or full review-state snapshots.

## Migration and Deployment

TypeORM `synchronize` remains disabled. Every schema change has an explicit reversible migration. Deployment order is:

1. Back up or verify recovery posture.
2. Run backward-compatible migrations.
3. Run validated content import when required.
4. Deploy compatible backend code.
5. Verify health, authentication, Today, and review submission.
6. Deploy frontend code after backend contracts are available.

Destructive cleanup migrations occur only in later releases after old application versions are no longer running. Rollback documentation distinguishes application rollback from schema rollback when review events have already been written.

## Testing Strategy

### Unit tests

- Clerk principal mapping and public-route metadata.
- Pure scheduler transitions with fixed time for every stage/rating.
- content validation and normalization.
- Today grouping and deterministic queue ordering.

### Integration tests

- migrate up/down against PostgreSQL;
- constraints, indexes, cascades, and content retirement;
- 401 without token and success with verified test principal;
- first-request user provisioning under concurrency;
- enrollment idempotency;
- review transaction, history, and progress update;
- duplicate request replay;
- concurrent review submissions;
- cross-user isolation.

### End-to-end tests

- login, enroll, fetch Today, review all due cards, refresh, and observe persisted counts;
- logout/login and another-device restoration;
- retry a failed review request with the same request ID;
- 375px light/dark learning flow using backend data;
- clean database migration and seed rehearsal.

## Delivery Order

1. Issue #36: authenticated schema, migrations, Clerk guard, and user provisioning.
2. Issues #37 and #38 may proceed after the schema contracts stabilize.
3. Issue #39 replaces prototype frontend sources after authenticated APIs and seed data are available.
4. Issue #34 closes only after the clean-environment release rehearsal succeeds.

## Out of Scope

- Separate database repository.
- Microservices or event streaming.
- Anonymous learning progress.
- User-created decks.
- Administrative content UI.
- Social features.
- Pronunciation coaching.
