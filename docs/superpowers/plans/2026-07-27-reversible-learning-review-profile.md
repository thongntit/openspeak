# Reversible Learning, Reachable Review Controls, and Truthful Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a learner stop learning a deck, complete any revealed review card on mobile, and see authenticated learning metrics on Profile.

**Architecture:** `DeckEnrollmentService` owns reversible active-state changes and returns the same canonical Today payload used by enrollment. `UsersService` owns a small read-only summary that counts persisted learning records under the shared visibility condition. Frontend API helpers and Zustand keep Today consistent while Library/Profile render server and Clerk data without static fallbacks.

**Tech Stack:** NestJS, TypeORM, PostgreSQL query builders, React 19, Clerk React, Zustand, Vitest/Testing Library, Jest.

## Global Constraints

- Preserve `user_card_progress` and `review_events` when stopping a deck.
- Use `LEARNING_VISIBILITY_CONDITION` for the due count.
- Keep authentication, UUID validation, API error handling, and session-epoch behavior consistent with existing enrollment code.
- Do not render static learning metrics or controls that imply unavailable settings.
- Maintain 44px-or-larger mobile targets and light/dark Tailwind styling.

---

### Task 1: Add a reversible enrollment API

**Files:**
- Modify: `backend/src/learning/deck-enrollment.controller.ts`
- Modify: `backend/src/learning/deck-enrollment.service.ts`
- Modify: `backend/src/learning/deck-enrollment.controller.spec.ts`
- Modify: `backend/src/learning/deck-enrollment.service.spec.ts`

**Interfaces:**
- Consumes: `DeckEnrollmentService.enroll(userId, deckId, now)` and `LearningService.getToday(userId, now)`.
- Produces: `DeckEnrollmentService.stopLearning(userId, deckId, now)` and `DELETE /decks/:deckId/enrollment` returning `{ deckId, isLearning: false, today }`.

- [ ] **Step 1: Write failing service and controller tests**

```ts
await expect(service.stopLearning(userId, deckId, now)).resolves.toEqual({
  deckId,
  isLearning: false,
  today,
});
expect(enrollmentRepository.update).toHaveBeenCalledWith(
  { user_id: userId, deck_id: deckId },
  { is_active: false },
);
expect(controller.stopLearning(user, deckId)).toEqual(
  enrollment.stopLearning(user.id, deckId),
);
```

- [ ] **Step 2: Run the focused tests and confirm they fail because `stopLearning` is absent**

Run: `npm test -- --runInBand src/learning/deck-enrollment.service.spec.ts src/learning/deck-enrollment.controller.spec.ts`

- [ ] **Step 3: Implement idempotent deactivation**

```ts
async stopLearning(userId: string, deckId: string, now = new Date()) {
  await this.data.transaction(async (manager) => {
    const deck = await manager.getRepository(Deck).findOneBy({ id: deckId, is_published: true });
    if (!deck) throw new NotFoundException('Deck not found');
    await manager.getRepository(UserDeck).update({ user_id: userId, deck_id: deckId }, { is_active: false });
  });
  return { deckId, isLearning: false, today: await this.learning.getToday(userId, now) };
}
```

Expose it with `@Delete(':deckId/enrollment')`, `@HttpCode(HttpStatus.OK)`, `@CurrentUser`, and the existing UUID pipe.

- [ ] **Step 4: Run focused backend tests and confirm pass**

Run: `npm test -- --runInBand src/learning/deck-enrollment.service.spec.ts src/learning/deck-enrollment.controller.spec.ts`

### Task 2: Add the authenticated learning summary

**Files:**
- Modify: `backend/src/users/users.module.ts`
- Modify: `backend/src/users/users.service.ts`
- Modify: `backend/src/users/users.controller.ts`
- Modify: `backend/src/users/users.service.spec.ts`
- Modify: `backend/src/users/users.controller.spec.ts`

**Interfaces:**
- Consumes: `UserDeck`, `UserCardProgress`, `ReviewEvent`, and `LEARNING_VISIBILITY_CONDITION`.
- Produces: `UsersService.getProfileSummary(userId, now)` and `GET /me/summary` returning `{ reviewsCompleted, learningDecks, dueNow }`.

- [ ] **Step 1: Write failing summary tests**

```ts
await expect(service.getProfileSummary(userId, now)).resolves.toEqual({
  reviewsCompleted: 17,
  learningDecks: 2,
  dueNow: 4,
});
expect(dueQuery.andWhere).toHaveBeenCalledWith(LEARNING_VISIBILITY_CONDITION);
```

- [ ] **Step 2: Run focused users tests and confirm the missing method fails**

Run: `npm test -- --runInBand src/users/users.service.spec.ts src/users/users.controller.spec.ts`

- [ ] **Step 3: Implement summary repositories and endpoint**

```ts
const [reviewsCompleted, learningDecks, dueNow] = await Promise.all([
  this.reviews.countBy({ user_id: userId }),
  this.decks.countBy({ user_id: userId, is_active: true }),
  this.progress.createQueryBuilder('progress') /* joins card, deck, enrollment; applies due and visibility conditions */.getCount(),
]);
return { reviewsCompleted, learningDecks, dueNow };
```

Register the three TypeORM entities in `UsersModule`, and delegate `GET /me/summary` from `UsersController` using the current principal id.

- [ ] **Step 4: Run focused users tests and confirm pass**

Run: `npm test -- --runInBand src/users/users.service.spec.ts src/users/users.controller.spec.ts`

### Task 3: Wire reversible Library state and profile data

**Files:**
- Modify: `frontend/src/services/openspeakApi.js`
- Modify: `frontend/src/stores/learningStore.js`
- Modify: `frontend/src/components/LibraryDeckDetail.jsx`
- Modify: `frontend/src/pages/Library.jsx`
- Modify: `frontend/src/pages/Profile.jsx`
- Modify: `frontend/test/content-api.test.js`
- Modify: `frontend/test/LibraryDeckDetail.test.jsx`
- Modify: `frontend/test/Library.test.jsx`
- Create: `frontend/test/Profile.test.jsx`

**Interfaces:**
- Consumes: `DELETE /decks/:deckId/enrollment` and `GET /me/summary`.
- Produces: `unenrollDeck(deckId, opts)`, `getProfileSummary(opts)`, Zustand `unenrollDeck`, `onLearningChanged(deckId, isLearning)`, and truthful Profile cards.

- [ ] **Step 1: Write failing frontend tests**

```jsx
await user.click(screen.getByRole('button', { name: /stop learning/i }));
expect(unenrollDeck).toHaveBeenCalledWith(DECK.id, { token: 'fresh-token' });
expect(screen.getByRole('button', { name: /learn deck/i })).toBeEnabled();

expect(await screen.findByText('17')).toBeInTheDocument();
expect(screen.getByText('Reviews')).toBeInTheDocument();
expect(screen.queryByText('438')).not.toBeInTheDocument();
```

- [ ] **Step 2: Run the selected frontend tests and confirm each fails for the new API or UI**

Run: `bunx vitest run test/content-api.test.js test/LibraryDeckDetail.test.jsx test/Library.test.jsx test/Profile.test.jsx`

- [ ] **Step 3: Implement API, store, and UI updates**

```js
export function unenrollDeck(deckId, opts = {}) {
  return request(`/decks/${encodeURIComponent(deckId)}/enrollment`, { ...opts, method: 'DELETE' });
}
export function getProfileSummary(opts = {}) { return request('/me/summary', opts); }
```

Use the same session-epoch and Today replacement behavior as enrollment. Keep `Stop learning` enabled when `deck.isLearning` is true, show an in-flight disabled state, and propagate `false` back to Library. In Profile, fetch the summary with a Clerk token, use `user.imageUrl` when present, display real values only after success, and remove nonfunctional settings rows.

- [ ] **Step 4: Run selected frontend tests and confirm pass**

Run: `bunx vitest run test/content-api.test.js test/LibraryDeckDetail.test.jsx test/Library.test.jsx test/Profile.test.jsx`

### Task 4: Keep revealed Review controls in normal flow

**Files:**
- Modify: `frontend/src/pages/Review.jsx`
- Modify: `frontend/test/Review.test.jsx`

**Interfaces:**
- Consumes: current Review backend queue and rating submission behavior.
- Produces: a vertically scrollable revealed-card layout where the explanation cannot occupy rating controls.

- [ ] **Step 1: Write a failing interaction test for the revealed state**

```jsx
await user.click(screen.getByRole('button', { name: /show answer/i }));
for (const label of ['Again', 'Hard', 'Good', 'Easy']) {
  expect(screen.getByRole('button', { name: label })).toBeEnabled();
}
await user.click(screen.getByRole('button', { name: 'Good' }));
expect(submitReview).toHaveBeenCalledOnce();
```

- [ ] **Step 2: Run the focused review test and confirm failure before the regression fix**

Run: `bunx vitest run test/Review.test.jsx`

- [ ] **Step 3: Remove the fixed-height card constraint**

```jsx
<div className="flex min-h-full flex-col animate-screen-fade-in">
  <div className="px-4 pb-3">
    <div className="relative">
      <div className="relative flex min-h-[calc(100dvh-190px)] w-full flex-col ...">
```

Keep ratings after the card in normal document flow; do not use `h-full`, a fixed bottom offset, or a sticky overlay for revealed content.

- [ ] **Step 4: Run the focused review test and confirm pass**

Run: `bunx vitest run test/Review.test.jsx`

### Task 5: Verify the integrated behavior

**Files:**
- Verify only.

- [ ] **Step 1: Run backend verification**

Run: `npm test && npm run build`
Expected: all Jest suites pass and Nest compiles.

- [ ] **Step 2: Run frontend verification**

Run: `bun run test && bun run lint && bun run build`
Expected: all Node/Vitest suites, lint, and Vite build pass.

- [ ] **Step 3: Run mobile browser acceptance at 375px**

Verify: an active deck exposes Stop learning and returns to Learn deck after success; revealed answer can scroll without obscuring Again/Hard/Good/Easy; Profile shows Clerk identity plus real summary values or an explicit unavailable state.

- [ ] **Step 4: Inspect and commit the focused diff**

Run: `git diff --check && git status --short`

Commit: `git add backend frontend docs && git commit -m "feat: make learning enrollment reversible"`
