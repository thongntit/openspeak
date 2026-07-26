# Issue 37 Learning Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver authenticated, server-owned Today and review APIs with deterministic versioned spaced-repetition scheduling.

**Architecture:** Keep scheduling pure in `backend/src/learning/scheduler`, so controller and database code only validate, authorize, lock, and persist state. `LearningService` owns a single deterministic due-card query/summary while `ReviewsService` owns an idempotent TypeORM transaction that locks a user's card progress, writes an immutable event, updates progress, and returns a refreshed summary.

**Tech Stack:** NestJS, TypeORM/PostgreSQL, class-validator, Jest, Supertest.

## Global Constraints

- All learning routes require the existing global Clerk guard and scope every query by `AuthenticatedPrincipal.id`.
- PostgreSQL remains the source of truth; do not use frontend prototype state or localStorage.
- Scheduler calculations are pure, fixed-clock deterministic, versioned, and contain no controller or repository access.
- Review events are append-only; repeated `(user_id, client_request_id)` requests return the original semantic result without another transition.
- Active enrollment/onboarding initializes `user_card_progress` rows for every active deck card. A missing progress row safely returns 404 from review submission; the review transaction must not attempt a null-row lock or unsafe lazy creation.
- The transaction locks `user_card_progress` before scheduling concurrent distinct requests for a card.
- Logs may include IDs, scheduler version, and outcome only; never learning answers, explanations, bearer tokens, or state snapshots.

---

### Task 1: Scheduler contract and deterministic transitions

**Files:**
- Create: `backend/src/learning/scheduler/scheduler.types.ts`
- Create: `backend/src/learning/scheduler/fsrs-scheduler.service.ts`
- Create: `backend/src/learning/scheduler/fsrs-scheduler.service.spec.ts`

**Interfaces:**
- Produces: `SchedulerState`, `scheduleReview(state, rating, now): SchedulerState`, and `SCHEDULER_VERSION`.

- [ ] **Step 1: Write failing fixed-clock tests** for every rating from `new`, `learning`, `review`, and `mastered`, asserting version, stage, due time, counters, and immutable input.
- [ ] **Step 2: Run** `cd backend && npm test -- fsrs-scheduler.service.spec.ts` and confirm the missing scheduler fails.
- [ ] **Step 3: Implement** explicit FSRS-style state transitions: Again relearns immediately, Hard keeps learning/review with a short interval, Good promotes learning and extends review, Easy promotes/retains review with the longest interval; stable deterministic constants are named in the scheduler.
- [ ] **Step 4: Run** the focused scheduler test and confirm it passes.

### Task 2: Today query and authenticated endpoint

**Files:**
- Create: `backend/src/learning/learning.service.ts`
- Create: `backend/src/learning/learning.controller.ts`
- Create: `backend/src/learning/learning.service.spec.ts`
- Modify: `backend/src/learning/learning-data.module.ts`

**Interfaces:**
- Consumes: current user UUID and the learning TypeORM repositories.
- Produces: `getToday(userId, now)` with `queue`, `totalDue`, `countsByType`, `countsByDeck`, `caughtUp`, and `serverTimestamp`.

- [ ] **Step 1: Write failing tests** requiring only active published/enrolled cards due at `now`, stable `due_at/card.sort_order/card.id` ordering, and counts derived from the same returned rows.
- [ ] **Step 2: Run** `cd backend && npm test -- learning.service.spec.ts` and confirm failure.
- [ ] **Step 3: Implement** the scoped query and `GET /api/today` controller using `@CurrentUser()`.
- [ ] **Step 4: Run** the focused Today tests and confirm pass.

### Task 3: Review DTO, transaction, idempotency, and logging

**Files:**
- Create: `backend/src/reviews/dto/submit-review.dto.ts`
- Create: `backend/src/reviews/reviews.service.ts`
- Create: `backend/src/reviews/reviews.controller.ts`
- Create: `backend/src/reviews/reviews.module.ts`
- Create: `backend/src/reviews/reviews.service.spec.ts`
- Modify: `backend/src/app.module.ts`

**Interfaces:**
- Consumes: `SubmitReviewDto { cardId, rating, clientRequestId, clientReviewedAt? }`, principal user ID, `FsrsSchedulerService`, `LearningService`, and TypeORM `DataSource`.
- Produces: `submit(userId, dto)` returning the review-event ID, card ID, previous/next due time, progress state, scheduler version, and fresh Today summary.

- [ ] **Step 1: Write failing tests** for DTO values, inaccessible/unpublished/unenrolled cards returning 404, a single transaction with pessimistic progress lock, immutable event plus progress update, duplicate replay, and safe audit log metadata.
- [ ] **Step 2: Run** `cd backend && npm test -- reviews.service.spec.ts` and confirm failure.
- [ ] **Step 3: Implement** validation, client timestamp skew validation, pre-lock and post-lock idempotency checks, scoped card/enrollment lookup, pessimistic lock, scheduler call, event insertion, progress update, fresh summary, and structured outcome-only logging.
- [ ] **Step 4: Implement** `POST /api/reviews` and module registration.
- [ ] **Step 5: Run** the focused review tests and confirm pass.

### Task 4: Integration contract coverage and verification

**Files:**
- Create: `backend/test/learning-loop.e2e-spec.ts`
- Modify: `backend/test/jest-e2e.json` only if required to include the new test.

- [ ] **Step 1: Write failing controller integration tests** using the existing guard pattern for 401, authenticated Today, validation failure, and an authenticated review submission contract.
- [ ] **Step 2: Run** `cd backend && npm run test:e2e -- learning-loop.e2e-spec.ts` and confirm failure.
- [ ] **Step 3: Add minimal Nest test module fakes** that exercise controller/auth boundaries without a live database.
- [ ] **Step 4: Run focused unit and e2e tests, then `npm test`, `npm run lint`, and `npm run build`; inspect `git diff --check` and `git status --short`.

## Self-Review

- Scheduler interface, version, every rating/stage, fixed clock: Task 1.
- Today queue/grouped counts and auth scope: Task 2.
- Review validation, transaction/lock, immutable event, idempotency, concurrency serialization semantics, and safe logs: Task 3.
- API boundary plus 401 and input validation coverage: Task 4.
- The plan uses the same DTO/property names across tasks and contains no placeholder steps.
