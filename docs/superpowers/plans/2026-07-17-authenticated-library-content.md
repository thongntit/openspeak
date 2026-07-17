# Authenticated Library Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Library's ten-card prototype source with authenticated, paginated reads of the six seeded backend decks and their 120 cards.

**Architecture:** Add a read-only `LearningContentModule` over the existing `Deck` and `Card` entities at `/api/content/decks`, keeping the future progress-aware `/api/decks` contract free for issues #37/#39. The frontend protects `/library`, loads every catalog page with a Clerk token, renders dedicated content-only deck components, and never falls back to `srsData.js`.

**Tech Stack:** NestJS 11, TypeORM 0.3, PostgreSQL, Jest/Supertest, React 19, React Router 7, Clerk React, Bun test, Vite, Tailwind CSS.

## Global Constraints

- JavaScript remains the frontend language; do not introduce TypeScript into `frontend/`.
- Backend learning-content routes require the existing global Clerk guard and must not use `@Public()`.
- Content routes are `/api/content/decks` and `/api/content/decks/:slug/cards`; `/api/decks` remains reserved for progress-aware SRS work.
- Deck queries return only `is_published = true`; card queries return only `is_active = true` for a published deck.
- Library shows real content metadata and no `due`, `learning`, `mastered`, `stage`, or scheduler values.
- Today keeps its prototype counts/queue and Review stays unchanged; Today deck rows navigate to `/library` without `openDeckId`.
- Library never falls back to `srsData.js` on loading, empty, authentication, or backend errors.
- Mobile layout supports 375px width, touch targets remain at least 44x44px, and every new visual state supports dark mode.
- Do not run a production seed, production deployment, or any external database mutation in this plan.

## File Structure

### Backend

- `backend/src/learning-content/learning-content.module.ts`: owns the authenticated content-read controller and service.
- `backend/src/learning-content/learning-content.controller.ts`: declares the two `/content/decks` HTTP routes.
- `backend/src/learning-content/learning-content.service.ts`: queries published decks and active cards and maps entities to public camelCase DTOs.
- `backend/src/learning-content/learning-content.service.spec.ts`: unit-tests query scope, ordering, public mapping, pagination, and 404 behavior.
- `backend/src/learning-content/dto/get-content-decks-query.dto.ts`: validates deck pagination (`20/0`, maximum 100).
- `backend/src/learning-content/dto/get-content-deck-cards-query.dto.ts`: validates card pagination (`50/0`, maximum 200).
- `backend/test/learning-content-api.e2e-spec.ts`: verifies route paths, global authentication, validation, and controller responses with a mocked service.
- `backend/src/app.module.ts`: imports `LearningContentModule`.
- `backend/src/app.module.spec.ts`: prevents the new module from being omitted.

### Frontend

- `frontend/src/services/openspeakApi.js`: exposes authenticated content-deck request functions.
- `frontend/src/lib/libraryContent.js`: owns pure filtering and all-page catalog loading.
- `frontend/src/components/LibraryDeckRow.jsx`: renders name, type, level, and real card count.
- `frontend/src/components/LibraryDeckDetail.jsx`: loads and renders ordered real cards with front and answer.
- `frontend/src/pages/Library.jsx`: owns Clerk token access, list state, filter state, selection, retry, and empty/error UI.
- `frontend/src/App.jsx`: protects `/library` with `PrivateRoute`.
- `frontend/src/pages/Today.jsx`: removes the incompatible prototype `openDeckId` navigation state.
- `frontend/test/content-api.test.js`: tests URL/query/token/error behavior with mocked `fetch`.
- `frontend/test/library-content.test.js`: tests filtering and multi-page loading.
- `frontend/test/library-source.test.js`: prevents Library from regaining static data, progress copy, or stale Today IDs.

---

### Task 1: Implement the published learning-content query service

**Files:**
- Create: `backend/src/learning-content/dto/get-content-decks-query.dto.ts`
- Create: `backend/src/learning-content/dto/get-content-deck-cards-query.dto.ts`
- Create: `backend/src/learning-content/learning-content.service.ts`
- Create: `backend/src/learning-content/learning-content.service.spec.ts`

**Interfaces:**
- Consumes: TypeORM repositories for existing `Deck` and `Card` entities; `buildPaginated` from `backend/src/common/dto/paginated-response.dto.ts`.
- Produces: `LearningContentService.findPublishedDecks(query): Promise<PaginatedResponse<ContentDeck>>` and `findPublishedDeckCards(slug, query): Promise<PaginatedResponse<ContentCard>>`.
- Produces: public `ContentDeck` and `ContentCard` interfaces exported from `learning-content.service.ts`.

- [ ] **Step 1: Write failing service tests for published deck mapping and pagination**

Create a chainable deck query-builder stub and assert the public response exactly:

```ts
it('returns only published decks with active-card counts in public shape', async () => {
  deckQuery.getRawMany.mockResolvedValue([
    {
      id: 'deck-1',
      slug: 'articles-a-an-the',
      name: 'Articles: a, an, and the',
      description: 'Choose English articles naturally.',
      type: DeckType.Grammar,
      level: 'beginner',
      cardCount: 20,
    },
  ]);
  deckRepository.count.mockResolvedValue(1);

  await expect(
    service.findPublishedDecks({ limit: 20, offset: 0 }),
  ).resolves.toEqual({
    data: [
      {
        id: 'deck-1',
        slug: 'articles-a-an-the',
        name: 'Articles: a, an, and the',
        description: 'Choose English articles naturally.',
        type: DeckType.Grammar,
        level: 'beginner',
        cardCount: 20,
      },
    ],
    total: 1,
    limit: 20,
    offset: 0,
    hasNext: false,
    hasPrev: false,
  });
  expect(deckQuery.leftJoin).toHaveBeenCalledWith(
    Card,
    'card',
    'card.deck_id = deck.id AND card.is_active = :isActive',
    { isActive: true },
  );
  expect(deckQuery.where).toHaveBeenCalledWith(
    'deck.is_published = :isPublished',
    { isPublished: true },
  );
  expect(deckQuery.orderBy).toHaveBeenCalledWith('deck.sort_order', 'ASC');
  expect(deckQuery.addOrderBy).toHaveBeenCalledWith('deck.slug', 'ASC');
});
```

Add a second assertion with `total=101`, `limit=100`, and `offset=0` expecting `hasNext: true`.

- [ ] **Step 2: Write failing card-query tests**

Cover a published deck, active-only ordering/mapping, nullable fields, and the unpublished/unknown 404 contract:

```ts
it('returns active cards in deterministic public shape', async () => {
  deckRepository.findOneBy.mockResolvedValue({
    id: 'deck-1',
    slug: 'articles-a-an-the',
    is_published: true,
  } as Deck);
  cardQuery.getManyAndCount.mockResolvedValue([
    [
      {
        id: 'card-1',
        content_key: 'articles-001',
        type: DeckType.Grammar,
        level: 'beginner',
        front: 'She is ___ honest person.',
        answer: 'an',
        explanation: 'Use an before a vowel sound.',
        example: null,
        options: ['a', 'an', 'the'],
      } as Card,
    ],
    1,
  ]);

  const result = await service.findPublishedDeckCards(
    'articles-a-an-the',
    { limit: 50, offset: 0 },
  );

  expect(result.data[0]).toEqual({
    id: 'card-1',
    contentKey: 'articles-001',
    type: DeckType.Grammar,
    level: 'beginner',
    front: 'She is ___ honest person.',
    answer: 'an',
    explanation: 'Use an before a vowel sound.',
    example: null,
    options: ['a', 'an', 'the'],
  });
  expect(cardQuery.andWhere).toHaveBeenCalledWith(
    'card.is_active = :isActive',
    { isActive: true },
  );
  expect(cardQuery.orderBy).toHaveBeenCalledWith('card.sort_order', 'ASC');
  expect(cardQuery.addOrderBy).toHaveBeenCalledWith(
    'card.content_key',
    'ASC',
  );
});

it('hides unknown and unpublished decks behind the same 404', async () => {
  deckRepository.findOneBy.mockResolvedValue(null);
  await expect(
    service.findPublishedDeckCards('hidden-deck', { limit: 50, offset: 0 }),
  ).rejects.toEqual(new NotFoundException('Deck hidden-deck not found'));
});
```

- [ ] **Step 3: Run the focused test and confirm RED**

Run: `cd backend && npm test -- --runInBand learning-content.service.spec.ts`

Expected: FAIL because `LearningContentService` and its DTO files do not exist.

- [ ] **Step 4: Implement exact pagination DTOs**

`get-content-decks-query.dto.ts`:

```ts
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class GetContentDecksQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @IsOptional()
  @IsInt()
  @Min(0)
  offset: number = 0;
}
```

Create the card DTO with the same imports and fields, but `limit = 50` and `@Max(200)`.

- [ ] **Step 5: Implement the minimal service**

Use these public interfaces and mapping rules:

```ts
export interface ContentDeck {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  type: DeckType;
  level: string;
  cardCount: number;
}

export interface ContentCard {
  id: string;
  contentKey: string;
  type: DeckType;
  level: string;
  front: string;
  answer: string;
  explanation: string;
  example: string | null;
  options: string[] | null;
}
```

`findPublishedDecks` must select only the public deck columns plus
`COUNT(card.id)::int AS "cardCount"`, group by `deck.id`, order by
`deck.sort_order` then `deck.slug`, apply `limit/offset`, count only published
decks, and return `buildPaginated(rows, total, limit, offset)`.

`findPublishedDeckCards` must call:

```ts
const deck = await this.deckRepository.findOneBy({
  slug,
  is_published: true,
});
if (!deck) throw new NotFoundException(`Deck ${slug} not found`);
```

Then query `card.deck_id = :deckId` and `card.is_active = true`, order by
`sort_order/content_key`, apply `take(limit).skip(offset)`, and map snake_case
entity fields to the `ContentCard` interface before `buildPaginated`.

- [ ] **Step 6: Run focused and full backend unit tests**

Run: `cd backend && npm test -- --runInBand learning-content.service.spec.ts`

Expected: PASS for all new service tests.

Run: `cd backend && npm test -- --runInBand`

Expected: 15 test suites pass with the new suite included; no existing test regresses.

- [ ] **Step 7: Commit the service slice**

```bash
git add backend/src/learning-content
git commit -m "feat(backend): add learning content read service"
```

---

### Task 2: Expose the protected content API

**Files:**
- Create: `backend/src/learning-content/learning-content.controller.ts`
- Create: `backend/src/learning-content/learning-content.module.ts`
- Create: `backend/test/learning-content-api.e2e-spec.ts`
- Modify: `backend/src/app.module.ts`
- Modify: `backend/src/app.module.spec.ts`

**Interfaces:**
- Consumes: `LearningContentService` from Task 1.
- Produces: authenticated `GET /api/content/decks` and `GET /api/content/decks/:slug/cards`.

- [ ] **Step 1: Write failing module-wiring and route tests**

Update `app.module.spec.ts` so its `arrayContaining` includes
`LearningContentModule`.

Create an e2e test module with `LearningContentController`, a mocked
`LearningContentService`, the real `ClerkAuthGuard`, mocked
`ClerkTokenVerifier`/`UsersService`, and `{ provide: APP_GUARD, useExisting:
ClerkAuthGuard }`. Configure the same global prefix and `ValidationPipe` as
`main.ts`.

The route tests must include:

```ts
it('requires authentication for the content catalog', async () => {
  await request(app.getHttpServer())
    .get('/api/content/decks')
    .expect(401)
    .expect(({ body }) => {
      expect(body.message).toBe('Authentication required');
    });
});

it('passes validated pagination to the deck service', async () => {
  await request(app.getHttpServer())
    .get('/api/content/decks?limit=100&offset=0')
    .set('Authorization', 'Bearer valid')
    .expect(200);
  expect(service.findPublishedDecks).toHaveBeenCalledWith({
    limit: 100,
    offset: 0,
  });
});

it('encodes a slug route and passes card pagination', async () => {
  await request(app.getHttpServer())
    .get('/api/content/decks/articles-a-an-the/cards?limit=50&offset=0')
    .set('Authorization', 'Bearer valid')
    .expect(200);
  expect(service.findPublishedDeckCards).toHaveBeenCalledWith(
    'articles-a-an-the',
    { limit: 50, offset: 0 },
  );
});

it('rejects invalid and unknown pagination', async () => {
  await request(app.getHttpServer())
    .get('/api/content/decks?limit=101')
    .set('Authorization', 'Bearer valid')
    .expect(400);
  await request(app.getHttpServer())
    .get('/api/content/decks?foo=bar')
    .set('Authorization', 'Bearer valid')
    .expect(400);
});
```

- [ ] **Step 2: Run route tests and confirm RED**

Run: `cd backend && npm run test:e2e -- --runInBand learning-content-api.e2e-spec.ts`

Expected: FAIL because the controller/module are missing and AppModule does not import the module.

- [ ] **Step 3: Implement the controller and module**

Controller:

```ts
@Controller('content/decks')
export class LearningContentController {
  constructor(private readonly content: LearningContentService) {}

  @Get()
  findAll(@Query() query: GetContentDecksQueryDto) {
    return this.content.findPublishedDecks(query);
  }

  @Get(':slug/cards')
  findCards(
    @Param('slug') slug: string,
    @Query() query: GetContentDeckCardsQueryDto,
  ) {
    return this.content.findPublishedDeckCards(slug, query);
  }
}
```

Module:

```ts
@Module({
  imports: [LearningDataModule],
  controllers: [LearningContentController],
  providers: [LearningContentService],
})
export class LearningContentModule {}
```

Import `LearningContentModule` in `AppModule` after `LearningDataModule`. Do not
add `@Public()` to either route.

- [ ] **Step 4: Run API, unit, and build checks**

Run: `cd backend && npm run test:e2e -- --runInBand learning-content-api.e2e-spec.ts`

Expected: PASS for auth, routing, and validation tests.

Run: `cd backend && npm test -- --runInBand`

Expected: all unit suites pass, including AppModule wiring.

Run: `cd backend && npm run build`

Expected: Nest production build exits 0.

- [ ] **Step 5: Commit the protected API slice**

```bash
git add backend/src/app.module.ts backend/src/app.module.spec.ts backend/src/learning-content backend/test/learning-content-api.e2e-spec.ts
git commit -m "feat(backend): expose authenticated content catalog"
```

---

### Task 3: Add the frontend content client and all-page loader

**Files:**
- Modify: `frontend/src/services/openspeakApi.js`
- Create: `frontend/src/lib/libraryContent.js`
- Create: `frontend/test/content-api.test.js`
- Create: `frontend/test/library-content.test.js`

**Interfaces:**
- Consumes: API response `{ data, total, limit, offset, hasNext, hasPrev }` from Task 2.
- Produces: `getContentDecks(params, opts)`, `getContentDeckCards(slug, params, opts)`, `loadAllContentDecks(fetchPage)`, and `filterLibraryDecks(decks, filter)`.

- [ ] **Step 1: Write failing API-client tests**

Mock `globalThis.fetch` and restore it in `afterEach`. Assert that:

```js
test('getContentDecks sends pagination and bearer token', async () => {
  let captured;
  globalThis.fetch = async (url, init) => {
    captured = { url: String(url), init };
    return new Response(JSON.stringify({
      data: [], total: 0, limit: 100, offset: 0,
      hasNext: false, hasPrev: false,
    }), { status: 200 });
  };

  await getContentDecks(
    { limit: 100, offset: 0 },
    { token: 'clerk-token' },
  );

  const url = new URL(captured.url);
  assert.equal(url.pathname, '/api/content/decks');
  assert.equal(url.searchParams.get('limit'), '100');
  assert.equal(url.searchParams.get('offset'), '0');
  assert.equal(captured.init.headers.Authorization, 'Bearer clerk-token');
});
```

Add these slug-encoding and error tests:

```js
test('getContentDeckCards encodes the slug', async () => {
  let capturedUrl;
  globalThis.fetch = async (url) => {
    capturedUrl = String(url);
    return new Response(JSON.stringify({
      data: [], total: 0, limit: 50, offset: 0,
      hasNext: false, hasPrev: false,
    }), { status: 200 });
  };

  await getContentDeckCards(
    'tips / tricks',
    { limit: 50, offset: 0 },
    { token: 'clerk-token' },
  );

  assert.equal(
    new URL(capturedUrl).pathname,
    '/api/content/decks/tips%20%2F%20tricks/cards',
  );
});

test('content requests preserve API errors', async () => {
  globalThis.fetch = async () => new Response(
    JSON.stringify({ message: 'Authentication required' }),
    { status: 401 },
  );
  await assert.rejects(
    getContentDecks({}, { token: 'expired' }),
    (error) => error instanceof ApiError && error.status === 401,
  );
});
```

- [ ] **Step 2: Write failing pure loader/filter tests**

```js
test('loadAllContentDecks follows every page', async () => {
  const offsets = [];
  const decks = await loadAllContentDecks(async ({ limit, offset }) => {
    offsets.push(offset);
    return {
      data: [{ id: `deck-${offset}` }],
      total: 101,
      limit,
      offset,
      hasNext: offset === 0,
      hasPrev: offset > 0,
    };
  });
  assert.deepEqual(offsets, [0, 100]);
  assert.deepEqual(decks.map((deck) => deck.id), ['deck-0', 'deck-100']);
});

test('filterLibraryDecks supports all content types', () => {
  const decks = [
    { id: 'v', type: 'vocab' },
    { id: 'g', type: 'grammar' },
    { id: 't', type: 'tip' },
  ];
  assert.equal(filterLibraryDecks(decks, 'all').length, 3);
  assert.deepEqual(filterLibraryDecks(decks, 'grammar'), [decks[1]]);
});
```

- [ ] **Step 3: Run tests and confirm RED**

Run: `cd frontend && bun test test/content-api.test.js test/library-content.test.js`

Expected: FAIL because the new functions/files do not exist.

- [ ] **Step 4: Implement the API functions**

Append to `openspeakApi.js`:

```js
export function getContentDecks(params = {}, opts = {}) {
  return request('/content/decks', { params, ...opts });
}

export function getContentDeckCards(slug, params = {}, opts = {}) {
  return request(`/content/decks/${encodeURIComponent(slug)}/cards`, {
    params,
    ...opts,
  });
}
```

- [ ] **Step 5: Implement the pure Library helpers**

```js
export const CONTENT_DECK_PAGE_LIMIT = 100;

export function filterLibraryDecks(decks, filter) {
  return filter === 'all'
    ? decks
    : decks.filter((deck) => deck.type === filter);
}

export async function loadAllContentDecks(fetchPage) {
  const decks = [];
  let offset = 0;
  let hasNext = true;

  while (hasNext) {
    const page = await fetchPage({
      limit: CONTENT_DECK_PAGE_LIMIT,
      offset,
    });
    decks.push(...page.data);
    hasNext = page.hasNext;
    offset += page.data.length;
    if (hasNext && page.data.length === 0) {
      throw new Error('Content deck pagination did not advance');
    }
  }

  return decks;
}
```

- [ ] **Step 6: Run frontend tests**

Run: `cd frontend && bun test test/content-api.test.js test/library-content.test.js`

Expected: all new client/helper tests pass.

Run: `cd frontend && bun test`

Expected: existing 7 tests plus the new tests pass.

- [ ] **Step 7: Commit the frontend data slice**

```bash
git add frontend/src/services/openspeakApi.js frontend/src/lib/libraryContent.js frontend/test/content-api.test.js frontend/test/library-content.test.js
git commit -m "feat(frontend): add authenticated content client"
```

---

### Task 4: Replace the Library prototype UI with authenticated backend content

**Files:**
- Create: `frontend/src/components/LibraryDeckRow.jsx`
- Create: `frontend/src/components/LibraryDeckDetail.jsx`
- Modify: `frontend/src/pages/Library.jsx`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/pages/Today.jsx`
- Create: `frontend/test/library-source.test.js`

**Interfaces:**
- Consumes: Task 3 API functions/helpers and Clerk `useAuth().getToken()`.
- Produces: authenticated Library list/detail UI with explicit loading, empty, session-expired, backend-error, and retry states.

- [ ] **Step 1: Write failing source-boundary regression tests**

Read `Library.jsx`, both new Library components, `App.jsx`, and `Today.jsx`
with `node:fs`. Use an `existsSync`-guarded reader so the first run fails on the
existing prototype source rather than stopping on the not-yet-created component
files. Assert:

```js
test('Library no longer uses prototype learning data or progress copy', () => {
  assert.doesNotMatch(librarySource, /from ['"]@\/data\/srsData['"]/);
  assert.doesNotMatch(librarySource, /\b(DECKS|CARDS)\b/);
  assert.doesNotMatch(librarySource, /deck\.(due|learning|mastered)/);
  assert.doesNotMatch(librarySource, /(card|c)\.stage/);
  assert.match(librarySource, /Try again/);
});

test('Library is protected and Today does not pass a prototype deck id', () => {
  assert.match(appSource, /<PrivateRoute>\s*<Library\s*\/>\s*<\/PrivateRoute>/);
  assert.doesNotMatch(todaySource, /openDeckId/);
  assert.match(todaySource, /navigate\(['"]\/library['"]\)/);
});
```

- [ ] **Step 2: Run the regression test and confirm RED**

Run: `cd frontend && bun test test/library-source.test.js`

Expected: FAIL because Library imports `DECKS/CARDS`, is unprotected, and Today passes `openDeckId`.

- [ ] **Step 3: Implement `LibraryDeckRow`**

Render one full-width 44px-minimum button. It receives `{ deck, onClick }` and
shows:

```jsx
<span className="block text-[15px] font-bold text-[var(--text-1)]">
  {deck.name}
</span>
<span className="block text-xs text-[var(--text-2)] mt-0.5">
  {deck.level} · {deck.cardCount} cards
</span>
```

Use the existing vocabulary/grammar/tip icon and color mapping. Do not import
progress data or render a progress bar.

- [ ] **Step 4: Implement `LibraryDeckDetail`**

The component receives `{ deck, getToken, onBack }`. On `deck.slug` changes it
creates an `AbortController`, obtains a token, and calls:

```js
getContentDeckCards(
  deck.slug,
  { limit: 50, offset: 0 },
  { token, signal: controller.signal },
)
```

Ignore `AbortError`; map 401 to `Your session expired. Please sign in again.`;
map all other failures to `Library cards are unavailable right now.`. Keep the
deck header visible while loading. Render `Cards in this deck (N)` and every
card's `front` plus `answer`. Empty data renders `This deck has no active cards.`
with Retry. There is no settings button, review button, progress grid, stage
chip, or static fallback.

- [ ] **Step 5: Rewrite `Library.jsx` around authenticated data**

Import `ApiError` and `getContentDecks` from `openspeakApi.js`, then use
`const { getToken } = useAuth()`. On mount/retry:

```js
const token = await getToken();
if (!token) throw new ApiError(401, { message: 'Authentication required' }, '/content/decks');
const nextDecks = await loadAllContentDecks((params) =>
  getContentDecks(params, { token, signal: controller.signal }),
);
```

Keep `decks`, `filter`, `selectedDeck`, `status`, and `error` state. Ignore
aborted requests. Use `filterLibraryDecks(decks, filter)`. Render only the
Library title, four type filters, real `LibraryDeckRow` values, and the selected
`LibraryDeckDetail`. Hide Search and Create deck completely.

Exact list-state copy:

- empty: `No published learning decks are available.`
- 401: `Your session expired. Please sign in again.`
- other error: `Library is unavailable right now.`
- retry button: `Try again`

- [ ] **Step 6: Protect Library and remove stale Today state**

In `App.jsx`, change the Library route to:

```jsx
<Route
  path="/library"
  element={
    <PrivateRoute>
      <Library />
    </PrivateRoute>
  }
/>
```

In `Today.jsx`, change each deck-row handler to:

```jsx
onClick={() => navigate('/library')}
```

Do not change Today counts, queue construction, or Review.

- [ ] **Step 7: Run focused tests, lint, and build**

Run: `cd frontend && bun test test/library-source.test.js test/content-api.test.js test/library-content.test.js`

Expected: all Library/client tests pass.

Run: `cd frontend && bun run lint`

Expected: exit 0 with no ESLint errors.

Run: `cd frontend && bun run build`

Expected: production Vite build exits 0 and emits `dist/`.

- [ ] **Step 8: Commit the authenticated Library UI**

```bash
git add frontend/src/App.jsx frontend/src/pages/Library.jsx frontend/src/pages/Today.jsx frontend/src/components/LibraryDeckRow.jsx frontend/src/components/LibraryDeckDetail.jsx frontend/test/library-source.test.js
git commit -m "feat(frontend): load real authenticated library content"
```

---

### Task 5: Full verification and dev handoff

**Files:**
- Verify only; no source changes expected.

**Interfaces:**
- Consumes: Tasks 1–4.
- Produces: local verification evidence and an explicit list of external dev checks that remain pending until deployment.

- [ ] **Step 1: Run the complete backend verification set**

Run: `cd backend && npm test -- --runInBand`

Expected: all unit suites pass.

Run: `cd backend && npm run test:e2e -- --runInBand learning-content-api.e2e-spec.ts`

Expected: the protected API e2e suite passes without a live Clerk call or database mutation.

Run: `cd backend && npm run build`

Expected: Nest production build exits 0.

- [ ] **Step 2: Re-run the existing seed contract without mutating an external database**

Run: `cd backend && npm test -- --runInBand learning-content.loader.spec.ts learning-content.seeder.spec.ts`

Expected: loader/importer unit tests pass and continue enforcing 5–8 decks and 20–50 cards per deck.

Do not run `db:prepare`, `db:prepare:prod`, `seed:learning`, or
`seed:learning:prod` unless a disposable/local PostgreSQL target is explicitly
confirmed.

- [ ] **Step 3: Run the complete frontend verification set**

Run: `cd frontend && bun test`

Expected: every existing and new Bun test passes.

Run: `cd frontend && bun run lint`

Expected: exit 0.

Run: `cd frontend && bun run build`

Expected: production build exits 0.

- [ ] **Step 4: Run local browser smoke verification**

Run: `cd frontend && bun run dev -- --host 127.0.0.1`

Verify at 375px in light and dark modes:

- without `VITE_CLERK_PUBLISHABLE_KEY`, `/library` shows the existing
  authentication-not-configured state;
- Today still renders and its deck rows route to `/library` without stale
  navigation state;
- the browser console has no new runtime errors.

Stop the dev server after verification. Do not claim signed-in six-deck/120-card
verification from this local smoke unless a real dev Clerk session and seeded
dev API were actually used.

- [ ] **Step 5: Record pending dev-deployment checks in the handoff**

After merge/deployment, the remaining external verification is:

1. sign in on the dev frontend;
2. verify `/api/content/decks` returns six published starter decks;
3. open every deck and verify 20 active cards;
4. verify all four filters, retry UI, 375px, and dark mode;
5. record whether issue #38's dev one-time seed execution was required.

Production seed/deployment remains blocked on separate explicit approval.
