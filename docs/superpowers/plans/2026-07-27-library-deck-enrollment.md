# Library Deck Enrollment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Library action that enrolls every active card in a published
deck and immediately replaces the authenticated learner's Today queue.

**Architecture:** A dedicated Nest enrollment controller and service own the
idempotent transaction, while the existing content query projects durable
per-user enrollment state. The React deck detail calls the new API and writes
the returned canonical Today snapshot into the existing Zustand store.

**Tech Stack:** NestJS 11, TypeORM 0.3, PostgreSQL, Jest, React 19, Zustand 5,
Vitest, Testing Library, Tailwind CSS.

## Global Constraints

- Enroll every active card in the selected published deck; do not introduce a
  starter batch or daily release limit.
- Preserve existing progress and scheduling history on repeat enrollment.
- Use the existing `fsrs-v1` scheduler version for new progress.
- Keep all authenticated learning state server-backed.
- Keep touch targets at least 44px and support light and dark themes.
- Do not add a schema migration or new dependency.

---

### Task 1: Idempotent Backend Enrollment

**Files:**
- Create: `backend/src/learning/deck-enrollment.controller.ts`
- Create: `backend/src/learning/deck-enrollment.controller.spec.ts`
- Create: `backend/src/learning/deck-enrollment.service.ts`
- Create: `backend/src/learning/deck-enrollment.service.spec.ts`
- Modify: `backend/src/learning/learning-data.module.ts`

**Interfaces:**
- Consumes: `LearningService.getToday(userId: string, now?: Date)`,
  `SCHEDULER_VERSION`, and the existing learning entities.
- Produces:
  `DeckEnrollmentService.enroll(userId: string, deckId: string, now?: Date)`
  and authenticated `POST /api/decks/:deckId/enroll`.

- [x] **Step 1: Write failing controller and service tests**

Create controller coverage that requires HTTP 200 semantics and authenticated
ID forwarding:

```ts
it('forwards the authenticated user and deck ids', async () => {
  const enrollment = { enroll: jest.fn().mockResolvedValue({}) } as any;
  const controller = new DeckEnrollmentController(enrollment);

  await controller.enroll(
    { id: 'user-123' } as any,
    '22222222-2222-4222-8222-222222222222',
  );

  expect(enrollment.enroll).toHaveBeenCalledWith(
    'user-123',
    '22222222-2222-4222-8222-222222222222',
  );
});
```

Create service tests with a mocked `DataSource.transaction` manager. Assert
that the insert builder receives every active card, one common `due_at`,
`LearningStage.New`, and `SCHEDULER_VERSION`; assert `.orIgnore()` is called.
Also cover unknown/unpublished decks, empty active-card sets, enrollment upsert,
and the returned Today snapshot.

- [x] **Step 2: Run the new backend tests and confirm the red state**

Run:

```bash
cd backend
npm test -- --runInBand src/learning/deck-enrollment.controller.spec.ts src/learning/deck-enrollment.service.spec.ts
```

Expected: FAIL because the controller and service files do not exist.

- [x] **Step 3: Implement the enrollment service**

Implement the transaction with this public shape:

```ts
async enroll(userId: string, deckId: string, now = new Date()) {
  const enrolledCardCount = await this.data.transaction(async (manager) => {
    const deck = await manager.getRepository(Deck).findOneBy({
      id: deckId,
      is_published: true,
    });
    if (!deck) throw new NotFoundException('Deck not found');

    const cards = await manager.getRepository(Card).find({
      where: { deck_id: deckId, is_active: true },
      order: { sort_order: 'ASC', id: 'ASC' },
    });
    if (!cards.length) {
      throw new BadRequestException('Deck has no active cards');
    }

    await manager.getRepository(UserDeck).upsert(
      { user_id: userId, deck_id: deckId, is_active: true },
      {
        conflictPaths: ['user_id', 'deck_id'],
        skipUpdateIfNoValuesChanged: true,
      },
    );

    await manager
      .getRepository(UserCardProgress)
      .createQueryBuilder()
      .insert()
      .values(cards.map((card) => ({
        user_id: userId,
        card_id: card.id,
        stage: LearningStage.New,
        due_at: now,
        stability: 0,
        difficulty: 0,
        elapsed_days: 0,
        scheduled_days: 0,
        repetitions: 0,
        lapses: 0,
        last_reviewed_at: null,
        last_rating: null,
        scheduler_version: SCHEDULER_VERSION,
      })))
      .orIgnore()
      .execute();

    return cards.length;
  });

  return {
    deckId,
    isLearning: true,
    enrolledCardCount,
    today: await this.learning.getToday(userId, now),
  };
}
```

Implement `DeckEnrollmentController` under `@Controller('decks')`, use
`ParseUUIDPipe`, `@Post(':deckId/enroll')`, and `@HttpCode(HttpStatus.OK)`.
Register both classes in `LearningDataModule`.

- [x] **Step 4: Run focused and full backend tests**

Run:

```bash
cd backend
npm test -- --runInBand src/learning/deck-enrollment.controller.spec.ts src/learning/deck-enrollment.service.spec.ts
npm test -- --runInBand
```

Expected: the focused suites pass, then all backend suites pass.

- [x] **Step 5: Commit the backend enrollment**

```bash
git add backend/src/learning
git commit -m "feat(backend): enroll library decks"
```

### Task 2: Durable Library Enrollment Status

**Files:**
- Modify: `backend/src/learning-content/learning-content.controller.ts`
- Modify: `backend/src/learning-content/learning-content.service.ts`
- Modify: `backend/src/learning-content/learning-content.service.spec.ts`
- Create: `backend/src/learning-content/learning-content.controller.spec.ts`

**Interfaces:**
- Consumes: `AuthenticatedPrincipal.id` and `UserDeck`.
- Produces: `ContentDeck.isLearning: boolean` on
  `GET /api/content/decks`.

- [x] **Step 1: Write failing status-projection tests**

Update service tests to call:

```ts
service.findPublishedDecks('user-123', { limit: 20, offset: 0 });
```

Require the deck query to join the user's enrollment and return:

```ts
expect(result.data[0]).toMatchObject({
  id: 'deck-1',
  isLearning: true,
});
expect(deckQuery.leftJoin).toHaveBeenCalledWith(
  UserDeck,
  'enrollment',
  'enrollment.deck_id = deck.id AND enrollment.user_id = :userId',
  { userId: 'user-123' },
);
```

Add a controller test proving `principal.id` is forwarded with pagination.

- [x] **Step 2: Run the content tests and confirm the red state**

Run:

```bash
cd backend
npm test -- --runInBand src/learning-content/learning-content.service.spec.ts src/learning-content/learning-content.controller.spec.ts
```

Expected: FAIL because the content service lacks the user-scoped status.

- [x] **Step 3: Add the user-scoped query projection**

Change the service signature to:

```ts
async findPublishedDecks(
  userId: string,
  query: GetContentDecksQueryDto,
): Promise<PaginatedResponse<ContentDeck>>
```

Add `isLearning: boolean` to `ContentDeck`, then add this selection and join:

```ts
'COALESCE(enrollment.is_active, false) AS "isLearning"',
```

```ts
.leftJoin(
  UserDeck,
  'enrollment',
  'enrollment.deck_id = deck.id AND enrollment.user_id = :userId',
  { userId },
)
```

Group by `enrollment.is_active`. Update the controller to accept
`@CurrentUser() principal` and call:

```ts
return this.content.findPublishedDecks(principal.id, query);
```

- [x] **Step 4: Run focused and full backend verification**

Run:

```bash
cd backend
npm test -- --runInBand src/learning-content/learning-content.service.spec.ts src/learning-content/learning-content.controller.spec.ts
npm test -- --runInBand
npm run build
```

Expected: all tests pass and Nest compiles successfully.

- [x] **Step 5: Commit the status projection**

```bash
git add backend/src/learning-content
git commit -m "feat(backend): expose deck learning status"
```

### Task 3: Library Learn Action and Today Refresh

**Files:**
- Modify: `frontend/src/services/openspeakApi.js`
- Modify: `frontend/src/components/LibraryDeckDetail.jsx`
- Modify: `frontend/src/pages/Library.jsx`
- Modify: `frontend/test/content-api.test.js`
- Create: `frontend/test/LibraryDeckDetail.test.jsx`

**Interfaces:**
- Consumes:
  `POST /api/decks/:deckId/enroll` and
  `useLearningStore.getState().replaceToday(today)`.
- Produces:
  `enrollDeck(deckId, opts)`,
  `LibraryDeckDetail({ deck, getToken, onBack, onEnrolled })`, and local
  Library propagation of `isLearning: true`.

- [x] **Step 1: Write failing API and component tests**

Add an API test requiring:

```js
await enrollDeck('deck / id', { token: 'clerk-token' });

expect(new URL(captured.url).pathname)
  .toBe('/api/decks/deck%20%2F%20id/enroll');
expect(captured.init).toMatchObject({
  method: 'POST',
  headers: expect.objectContaining({
    Authorization: 'Bearer clerk-token',
  }),
});
```

In `LibraryDeckDetail.test.jsx`, mock card loading and the enrollment request.
Render an unenrolled 20-card deck, click **Learn deck**, and require:

```jsx
expect(enrollDeck).toHaveBeenCalledWith('deck-1', {
  token: 'fresh-token',
});
expect(onEnrolled).toHaveBeenCalledWith('deck-1');
expect(useLearningStore.getState().today).toBe(TODAY);
expect(screen.getByRole('button', { name: /learning/i })).toBeDisabled();
```

Use a deferred request in a second test to prove a second click cannot submit
another enrollment. Add 401 and 500 cases that keep **Learn deck** available
and render the appropriate inline alert.

- [x] **Step 2: Run the frontend tests and confirm the red state**

Run:

```bash
cd frontend
bun run vitest run test/LibraryDeckDetail.test.jsx
node --test test/content-api.test.js
```

Expected: FAIL because the API function and Learn action do not exist.

- [x] **Step 3: Add the enrollment API function**

Add:

```js
export function enrollDeck(deckId, opts = {}) {
  return request(`/decks/${encodeURIComponent(deckId)}/enroll`, {
    ...opts,
    method: 'POST',
  });
}
```

- [x] **Step 4: Add the deck detail action**

Add local `isLearning`, `enrollStatus`, and `enrollError` state. The click
handler must obtain a fresh token, perform one request, replace Today, and
notify the parent:

```js
async function handleEnroll() {
  if (isLearning || enrollStatus === 'loading') return;
  setEnrollStatus('loading');
  setEnrollError(null);
  try {
    const token = await getToken();
    if (!token) {
      throw new ApiError(
        401,
        { message: 'Authentication required' },
        `/decks/${deck.id}/enroll`,
      );
    }
    const response = await enrollDeck(deck.id, { token });
    replaceToday(response.today);
    setIsLearning(true);
    setEnrollStatus('success');
    onEnrolled(deck.id);
  } catch (requestError) {
    setEnrollStatus('error');
    setEnrollError(
      requestError.status === 401
        ? 'Your session expired. Please sign in again.'
        : 'Could not add this deck. Try again.',
    );
  }
}
```

Render a minimum-44px full-width button with **Learn deck**,
**Adding deck…**, or **Learning**. Add supporting all-card copy and an
`aria-live` inline error. In `Library.jsx`, update both `decks` and
`selectedDeck` in `onEnrolled`.

- [x] **Step 5: Run focused and full frontend verification**

Run:

```bash
cd frontend
bun run vitest run test/LibraryDeckDetail.test.jsx
node --test test/content-api.test.js
bun run test
bun run lint
bun run build
```

Expected: all tests and lint pass; Vite completes the production build.

- [x] **Step 6: Commit the frontend action**

```bash
git add frontend/src frontend/test
git commit -m "feat(frontend): learn decks from library"
```

### Task 4: Cross-Layer Completion Verification

**Files:**
- Verify only; modify a task-owned file only if a failing gate identifies a
  feature regression.

**Interfaces:**
- Consumes: all Task 1-3 deliverables.
- Produces: release-ready evidence for the feature branch.

- [x] **Step 1: Run all static and automated gates from a clean shell**

```bash
cd backend
npm test -- --runInBand
npm run build
cd ../frontend
bun run test
bun run lint
bun run build
```

Expected: every command exits 0.

- [x] **Step 2: Review the complete diff**

Run:

```bash
git diff --check origin/dev...HEAD
git diff --stat origin/dev...HEAD
git status --short --branch
```

Confirm the diff contains no schema migration, dependency change, unrelated
file, secret, placeholder, or debug logging.

- [ ] **Step 3: Publish for integration**

```bash
git push -u origin codex/library-learn-enroll-all
```

Open a normal pull request targeting `dev` with the acceptance behavior and
the exact verification results. Do not merge or deploy as part of this plan.
