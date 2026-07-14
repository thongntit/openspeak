# Production Learning Seed Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Ship six curated starter decks and a validated, transactional, idempotent backend import workflow that prepares local, dev, and production PostgreSQL databases without deleting learning history.

**Architecture:** Versioned JSON content lives under the NestJS backend source tree and is copied into dist as a build asset. A pure loader validates the complete content bundle before database access, then one TypeORM transaction upserts stable deck/card identities and retires removed managed content using publication flags. Local and Coolify environments use one explicit database-preparation command that runs pending migrations and imports content; normal production application startup does not seed.

**Tech Stack:** NestJS 11, TypeORM 0.3, PostgreSQL 16, Joi 18, Jest 30, Docker, GitHub Actions, Coolify Docker Compose services.

## Global Constraints

- Start execution in a fresh worktree based on origin/dev; the root checkout has unrelated user changes and is ahead/behind origin/dev.
- Implement GitHub issue #38 and preserve the production schema shipped by issue #36.
- Keep TypeORM synchronize disabled.
- Validate the complete content bundle before initializing a database mutation transaction.
- Use stable deck slugs and per-deck card content keys; reruns update rows instead of creating duplicates.
- Never hard-delete a deck or card referenced by enrollment, progress, or review history.
- Seeded content uses namespace starter and database content version starter@2026.07.1, which fits VARCHAR(40).
- Publish exactly six initial decks with exactly 20 reviewed cards per deck: 120 cards total across Vocabulary, Grammar, and Tips.
- Do not include pronunciation-coaching content.
- Use DATABASE_URL without committing credentials or environment-specific URLs.
- Run and verify the workflow against gramio-api-dev before production execution.
- Do not run content import on every ordinary application restart.

---

### Task 1: Versioned content contract, loader, and complete validation

**Files:**
- Create: backend/src/database/content/learning-content.types.ts
- Create: backend/src/database/content/learning-content.schema.ts
- Create: backend/src/database/content/learning-content.loader.ts
- Create: backend/src/database/content/learning-content.loader.spec.ts

**Interfaces:**
- Produces LearningContentManifest, LearningDeckSource, LearningCardSource, and LearningContentBundle.
- Produces validateLearningContent(manifest, deckDocuments): LearningContentBundle.
- Produces loadLearningContent(contentDirectory?): LearningContentBundle.
- Consumes Node fs/path and the existing joi dependency.

- [ ] **Step 1: Define the source contracts**

~~~ts
export type LearningContentType = 'vocab' | 'grammar' | 'tip';
export type LearningLevel = 'beginner' | 'intermediate' | 'advanced';

export interface LearningContentManifest {
  schemaVersion: 1;
  namespace: 'starter';
  contentVersion: string;
  deckFiles: string[];
}

export interface LearningCardSource {
  contentKey: string;
  type: LearningContentType;
  level: LearningLevel;
  front: string;
  answer: string;
  explanation: string;
  example: string;
  options?: string[];
  sortOrder: number;
}

export interface LearningDeckSource {
  slug: string;
  name: string;
  description: string;
  type: LearningContentType;
  level: LearningLevel;
  sortOrder: number;
  isPublished: boolean;
  cards: LearningCardSource[];
}

export interface LearningContentBundle {
  schemaVersion: 1;
  namespace: 'starter';
  contentVersion: string;
  databaseContentVersion: string;
  decks: LearningDeckSource[];
}
~~~

- [ ] **Step 2: Write failing validation tests**

Create table-driven tests that reject duplicate deck slugs, duplicate card keys, duplicate normalized prompts, missing answers in options, duplicate options, deck counts outside 5–8, card counts outside 20–50, blank required text, invalid stable keys, duplicate sort orders, and a database content version longer than 40 characters.

Build valid and malformed directory fixtures inside a temporary directory created by the test with Node fs.mkdtempSync. Write one manifest plus six generated twenty-card deck files, run the loader, and remove the directory in afterEach so test-only JSON is never packaged into the application image.

~~~ts
it('normalizes a complete valid bundle', () => {
  const bundle = validateLearningContent(validManifest, validDecks);
  expect(bundle.databaseContentVersion).toBe('starter@2026.07.1');
  expect(bundle.decks).toHaveLength(6);
  expect(bundle.decks.flatMap((deck) => deck.cards)).toHaveLength(120);
});
~~~

- [ ] **Step 3: Confirm the test fails**

Run from backend:

~~~bash
npm test -- --runInBand learning-content.loader.spec.ts
~~~

Expected: FAIL because the loader and validator do not exist.

- [ ] **Step 4: Implement strict Joi schemas and cross-document checks**

Use unknown(false) at every object level. Stable keys match /^[a-z0-9]+(?:-[a-z0-9]+)*$/. Content types are vocab, grammar, or tip. Levels are beginner, intermediate, or advanced.

The manifest requires schemaVersion 1, namespace starter, a nonblank version, and 5–8 unique JSON filenames. Decks require 20–50 cards, unique positive integer ordering, and complete metadata. Options are optional arrays containing 2–6 unique nonblank strings.

After Joi validation, reject unsafe paths, missing files, duplicate deck slugs, duplicate card keys or normalized prompts within a deck, options without the exact answer, missing content categories, duplicate ordering, or a combined database content version longer than 40 characters. Collect all validation messages into one error.

- [ ] **Step 5: Implement filesystem loading**

loadLearningContent defaults to path.join(__dirname, 'starter'). It reads manifest.json and exactly the listed deck files, parses them, validates the complete set, and returns a normalized bundle. Parse failures include the source filename but no environment configuration.

- [ ] **Step 6: Run and commit Task 1**

~~~bash
npm test -- --runInBand learning-content.loader.spec.ts
npx eslint "src/database/content/**/*.ts"
git diff --check
git add backend/src/database/content
git commit -m "feat(backend): validate versioned learning content"
~~~

Expected: focused tests, ESLint, and whitespace checks pass.

---

### Task 2: Transactional and idempotent deck/card importer

**Files:**
- Create: backend/src/database/seeds/learning-content.seeder.ts
- Create: backend/src/database/seeds/learning-content.seeder.spec.ts
- Reuse: backend/src/learning/entities/deck.entity.ts
- Reuse: backend/src/learning/entities/card.entity.ts

**Interfaces:**
- Consumes LearningContentBundle and a TypeORM DataSource.
- Produces seedLearningContent(dataSource, bundle): Promise<LearningContentSeedSummary>.

- [ ] **Step 1: Define the summary**

~~~ts
export interface LearningContentSeedSummary {
  contentVersion: string;
  decksUpserted: number;
  cardsUpserted: number;
  decksUnpublished: number;
  cardsDeactivated: number;
}
~~~

- [ ] **Step 2: Write failing importer tests**

Mock DataSource.transaction and repositories. Assert one transaction, deck upsert conflict path slug, card upsert conflict paths deck_id/content_key, content version starter@2026.07.1, and retirement queries scoped to content_version LIKE starter@%. Assert no delete or remove calls and rethrow transaction failures.

- [ ] **Step 3: Confirm the test fails**

~~~bash
npm test -- --runInBand learning-content.seeder.spec.ts
~~~

Expected: FAIL because the importer does not exist.

- [ ] **Step 4: Implement one transaction**

Within dataSource.transaction:

1. Upsert all deck fields by slug and set content_version from the bundle.
2. Read managed decks back by slug to resolve UUIDs.
3. Flatten and upsert cards by deck_id/content_key with is_active true.
4. For each present deck, deactivate starter-managed cards absent from the new source.
5. Unpublish starter-managed decks absent from the source and deactivate their managed cards.
6. Never mutate content whose content_version does not start with starter@.
7. Never issue DELETE SQL.

Use parameterized QueryBuilder conditions. Handle empty source lists without generating NOT IN ().

- [ ] **Step 5: Return deterministic counts**

Return source upsert counts and TypeORM update-result retirement counts. Log only counts and version, never card answers or explanations.

- [ ] **Step 6: Run and commit Task 2**

~~~bash
npm test -- --runInBand learning-content.seeder.spec.ts
npx eslint "src/database/seeds/learning-content*.ts"
git diff --check
git add backend/src/database/seeds/learning-content.seeder.ts backend/src/database/seeds/learning-content.seeder.spec.ts
git commit -m "feat(backend): add idempotent learning content importer"
~~~

---

### Task 3: Seed commands, migration orchestration, and JSON packaging

**Files:**
- Create: backend/src/database/seeds/seed-learning-content.ts
- Create: backend/src/database/prepare-learning-database.ts
- Create: backend/src/database/prepare-learning-database.spec.ts
- Create: backend/src/database/migration-startup.ts
- Create: backend/src/database/migration-startup.spec.ts
- Modify: backend/nest-cli.json
- Modify: backend/package.json
- Modify: backend/src/database/database.module.ts
- Modify: backend/README.md

**Interfaces:**
- Consumes loadLearningContent and seedLearningContent.
- Produces seed:learning, seed:learning:prod, db:prepare, and db:prepare:prod.
- Produces JSON assets under dist/database/content/starter.

- [ ] **Step 1: Write failing orchestration tests**

~~~ts
it('validates, connects, migrates, seeds, and closes in order', async () => {
  await prepareLearningDatabase({ load, dataSource, seed });
  expect(callOrder).toEqual([
    'load-content',
    'initialize',
    'run-migrations',
    'seed-content',
    'destroy',
  ]);
});

it('does not connect when content is invalid', async () => {
  load.mockImplementation(() => { throw new Error('invalid content'); });
  await expect(prepareLearningDatabase({ load, dataSource, seed }))
    .rejects.toThrow('invalid content');
  expect(dataSource.initialize).not.toHaveBeenCalled();
});
~~~

Also verify destroy runs after migration or seed failure.

- [ ] **Step 2: Confirm the orchestration test fails**

~~~bash
npm test -- --runInBand prepare-learning-database.spec.ts
~~~

- [ ] **Step 3: Implement the standalone seed entrypoint**

Load and validate before initializing the DataSource. Run seedLearningContent, print the summary, destroy in finally, and exit nonzero on failure.

- [ ] **Step 4: Implement the combined preparation entrypoint**

~~~ts
const bundle = load();
await dataSource.initialize();
try {
  await dataSource.runMigrations();
  return await seed(dataSource, bundle);
} finally {
  await dataSource.destroy();
}
~~~

The executable wrapper prints migration and seed summaries and exits nonzero on failure.

- [ ] **Step 5: Add explicit package scripts**

~~~json
"migration:revert:prod": "typeorm migration:revert -d dist/data-source.js",
"seed:learning": "ts-node -r tsconfig-paths/register src/database/seeds/seed-learning-content.ts",
"seed:learning:prod": "node dist/database/seeds/seed-learning-content.js",
"db:prepare": "ts-node -r tsconfig-paths/register src/database/prepare-learning-database.ts",
"db:prepare:prod": "node dist/database/prepare-learning-database.js"
~~~

Keep the legacy seed and seed:prod commands unchanged for words/collections.

- [ ] **Step 6: Configure Nest JSON assets**

~~~json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true,
    "assets": [
      {
        "include": "database/content/starter/**/*.json",
        "outDir": "dist"
      }
    ]
  }
}
~~~

The Dockerfile already copies the complete dist directory; do not add another Docker COPY.

- [ ] **Step 7: Disable automatic production migration startup**

Extract shouldRunMigrationsOnStart(nodeEnv) and test development/test true, production false. Configure:

~~~ts
migrationsRun: shouldRunMigrationsOnStart(
  configService.get<string>('NODE_ENV'),
),
~~~

This keeps local/test convenience and makes db:prepare:prod the single production release task.

- [ ] **Step 8: Document command behavior**

~~~bash
# First local setup or after schema/content changes
npm run db:prepare
npm run start:dev

# Content-only rerun
npm run seed:learning

# Coolify one-time task
npm run db:prepare:prod
~~~

State that ordinary restarts do not seed.

- [ ] **Step 9: Verify and commit Task 3**

~~~bash
npm test -- --runInBand prepare-learning-database.spec.ts migration-startup.spec.ts
npm run build
npx eslint "src/database/**/*.ts"
git diff --check
git add backend/nest-cli.json backend/package.json backend/src/database backend/README.md
git commit -m "feat(backend): add explicit learning database preparation"
~~~

---

### Task 4: Six curated starter decks and editorial evidence

**Files:**
- Create: backend/src/database/content/starter/manifest.json
- Create: backend/src/database/content/starter/essential-everyday-vocabulary.json
- Create: backend/src/database/content/starter/work-and-daily-routines.json
- Create: backend/src/database/content/starter/articles-a-an-the.json
- Create: backend/src/database/content/starter/present-simple-vs-continuous.json
- Create: backend/src/database/content/starter/common-prepositions.json
- Create: backend/src/database/content/starter/natural-english-tips.json
- Create: docs/content/starter-content-review.md
- Modify: backend/src/database/content/learning-content.loader.spec.ts

**Interfaces:**
- Consumes the Task 1 source contract.
- Produces starter@2026.07.1, six published decks, and 120 cards.

- [ ] **Step 1: Create the manifest**

~~~json
{
  "schemaVersion": 1,
  "namespace": "starter",
  "contentVersion": "2026.07.1",
  "deckFiles": [
    "essential-everyday-vocabulary.json",
    "work-and-daily-routines.json",
    "articles-a-an-the.json",
    "present-simple-vs-continuous.json",
    "common-prepositions.json",
    "natural-english-tips.json"
  ]
}
~~~

- [ ] **Step 2: Author the exact catalog**

| Slug | Type | Level | Sort | Cards | Key range |
|---|---|---|---:|---:|---|
| essential-everyday-vocabulary | vocab | beginner | 10 | 20 | everyday-001 through everyday-020 |
| work-and-daily-routines | vocab | beginner | 20 | 20 | routine-001 through routine-020 |
| articles-a-an-the | grammar | beginner | 30 | 20 | articles-001 through articles-020 |
| present-simple-vs-continuous | grammar | intermediate | 40 | 20 | present-tense-001 through present-tense-020 |
| common-prepositions | grammar | beginner | 50 | 20 | prepositions-001 through prepositions-020 |
| natural-english-tips | tip | beginner | 60 | 20 | tip-001 through tip-020 |

Vocabulary cards test meaning or contextual usage. Grammar prompts contain one unambiguous context and answers contain the complete expected phrase or sentence. Tips cover contractions, polite requests, common collocations, avoiding word-for-word translation, and concise conversational responses. Multiple-choice cards use 2–4 plausible unique options containing the exact answer; free-recall cards omit options.

Every deck contains 20 complete entries shaped like:

~~~json
{
  "contentKey": "everyday-001",
  "type": "vocab",
  "level": "beginner",
  "front": "What does “available” mean in “Is this seat available?”",
  "answer": "Free to use or not occupied.",
  "explanation": "“Available” describes something that can be used, obtained, or chosen.",
  "example": "The meeting room is available after 2 p.m.",
  "sortOrder": 10
}
~~~

- [ ] **Step 3: Add production-bundle acceptance tests**

~~~ts
const bundle = loadLearningContent();

expect(bundle.databaseContentVersion).toBe('starter@2026.07.1');
expect(bundle.decks.map((deck) => deck.slug)).toEqual([
  'essential-everyday-vocabulary',
  'work-and-daily-routines',
  'articles-a-an-the',
  'present-simple-vs-continuous',
  'common-prepositions',
  'natural-english-tips',
]);
expect(bundle.decks.every((deck) => deck.cards.length === 20)).toBe(true);
expect(bundle.decks.flatMap((deck) => deck.cards)).toHaveLength(120);
~~~

- [ ] **Step 4: Complete editorial review evidence**

In docs/content/starter-content-review.md, record each deck's reviewer/date and completed gates for correctness, unique answer support, explanation consistency, natural examples, level consistency, duplicate scan, option/answer consistency, and card count. Record changes made during review. Do not mark a deck reviewed until every card has been read.

- [ ] **Step 5: Verify and commit Task 4**

~~~bash
npm test -- --runInBand learning-content.loader.spec.ts
npm run build
test "$(find dist/database/content/starter -name '*.json' | wc -l | tr -d ' ')" = "7"
git diff --check
git add backend/src/database/content/starter backend/src/database/content/learning-content.loader.spec.ts docs/content/starter-content-review.md
git commit -m "feat(content): add curated Gramio starter decks"
~~~

Expected: six decks, 120 cards, seven packaged JSON files, and completed editorial evidence.

---

### Task 5: PostgreSQL idempotency and retirement integration tests

**Files:**
- Create: backend/test/learning-content-seed.e2e-spec.ts
- Modify: .github/workflows/ci-backend-pr.yml
- Modify: frontend/test/deployment-config.test.js

**Interfaces:**
- Consumes PostgreSQL 16 CI, production migrations, loader, and importer.
- Produces database-backed proof of clean seed, rerun safety, updates, and history preservation.

- [ ] **Step 1: Test clean seed and rerun**

Use DATABASE_URL, initialize a dedicated DataSource, run migrations, truncate production learning tables in dependency order, and seed twice.

~~~ts
expect(await deckRepo.count()).toBe(6);
expect(await cardRepo.count()).toBe(120);
expect(await deckRepo.countBy({ slug: 'essential-everyday-vocabulary' })).toBe(1);
expect(await cardRepo.countBy({
  deck_id: essentialDeck.id,
  content_key: 'everyday-001',
})).toBe(1);
~~~

- [ ] **Step 2: Test safe updates and retirement**

Create a second bundle version changing one answer, replacing one existing card key with one new card key so the deck remains at twenty cards, and omitting one deck so the bundle remains at five decks. Before importing, insert a user, enrollment, progress row, and review event referencing the replaced card. After import, assert the answer updates, the replaced card is inactive, the new card is active, the omitted deck is unpublished, and progress/review rows still exist. Insert an unrelated admin@1 deck and assert it is untouched.

- [ ] **Step 3: Test invalid input before mutation**

Capture counts, pass an invalid content directory, assert validation rejects before DataSource.initialize, and confirm counts remain unchanged with a separate verification connection.

- [ ] **Step 4: Run the focused PostgreSQL test**

~~~bash
env DATABASE_URL=postgresql://openspeak:openspeak@localhost:5432/openspeak_test npm run test:e2e -- --runInBand learning-content-seed.e2e-spec.ts
~~~

Expected: clean seed, rerun, retirement, and invalid-input cases pass.

- [ ] **Step 5: Add compiled-production CI rehearsal**

After unit tests, build the backend and rehearse the compiled production migration and seed entrypoints before the general e2e suite:

~~~yaml
      - name: Build production backend
        run: npm run build

      - name: Rehearse production migrations on ephemeral CI database
        run: npm run migration:run:prod

      - name: Rehearse learning content seed twice
        run: |
          npm run seed:learning:prod
          npm run seed:learning:prod

      - name: Verify learning content integration
        run: npm run test:e2e -- --runInBand learning-content-seed.e2e-spec.ts
~~~

Update the deployment configuration regression test so the current PR workflow must build first, run migration:run:prod, and run seed:learning:prod twice. Remove the stale assertions that require the dev-time migration command and reject a production build.

- [ ] **Step 6: Run full verification and commit Task 5**

~~~bash
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run build
npx eslint "{src,test}/**/*.ts"
git diff --check
git add backend/test/learning-content-seed.e2e-spec.ts .github/workflows/ci-backend-pr.yml frontend/test/deployment-config.test.js
git commit -m "test(backend): rehearse learning content seed"
~~~

---

### Task 6: Coolify dev-first one-time execution and operations

**Files:**
- Create: docs/deployment/learning-content-release.md
- Modify: docs/deployment/environment-baseline.md
- No secret files are created or modified.

**Interfaces:**
- Consumes published dev/latest backend images and npm run db:prepare:prod.
- Produces a repeatable dev-to-production procedure and execution evidence.

- [ ] **Step 1: Document the one-time task**

Document command npm run db:prepare:prod. It validates bundled content, initializes TypeORM, runs pending migrations, imports starter@2026.07.1, prints counts, and exits. It is idempotent but not part of normal startup.

- [ ] **Step 2: Publish and deploy dev**

Merge through review into dev. Confirm GitHub Actions publishes the dev image and Coolify deploys it to gramio-api-dev. Stop on image or deployment failure.

- [ ] **Step 3: Run the Coolify dev task twice**

Target service gramio-api-dev, container api, command:

~~~bash
npm run db:prepare:prod
~~~

Capture execution status and summary. Run it again and prove six decks/120 cards with no duplicate stable identities. Idempotency is mandatory because Coolify run-once scheduling may execute more than once during cleanup.

- [ ] **Step 4: Verify dev**

Record content version starter@2026.07.1, six published decks, 120 active cards, zero duplicate slugs, zero duplicate deck/card keys, and GET /api/health returning 200. Do not claim authenticated content API verification before issues #37/#39 expose and consume those APIs.

- [ ] **Step 5: Rehearse failure recovery in dev**

Run the seed entrypoint with an invalid content path and confirm nonzero exit before mutation. Rerun the valid task and confirm unchanged six/120 state. Do not revert migrations on a shared database containing history.

- [ ] **Step 6: Gate production**

Confirm the production recovery posture, matching image assets, correct production environment variables, target gramio-api-production, and explicit user approval.

- [ ] **Step 7: Execute production after approval**

Run npm run db:prepare:prod against gramio-api-production, record the same version/count checks, and verify https://gramio-api.thongnt.dev/api/health returns 200.

- [ ] **Step 8: Update evidence and issue #38**

Record timestamps, image SHA, content version, counts, and verification results. Update only completed issue checklist items and leave blocked production operations unchecked.

- [ ] **Step 9: Commit operations documentation**

~~~bash
git diff --check
git add docs/deployment/learning-content-release.md docs/deployment/environment-baseline.md
git commit -m "docs: document learning content release workflow"
~~~

---

## Issue #38 Coverage

| Requirement | Covered by |
|---|---|
| CONTENT-01 versioned source format | Task 1 |
| CONTENT-02 5–8 decks across Vocabulary, Grammar, and Tips | Task 4 |
| CONTENT-03 20–50 reviewed cards per deck | Task 4 |
| CONTENT-04 complete fields and deterministic ordering | Tasks 1 and 4 |
| CONTENT-05 pedagogically appropriate options | Tasks 1 and 4 |
| CONTENT-06 correctness, duplicates, ambiguity, and level review | Task 4 |
| SEED-01 idempotent backend import command | Tasks 2 and 3 |
| SEED-02 stable slugs and content keys | Tasks 1, 2, and 5 |
| SEED-03 content version and publication state | Tasks 1, 2, and 4 |
| SEED-04 safe unpublish/deactivation without history deletion | Tasks 2 and 5 |
| TEST-01 source and database validation | Tasks 1 and 5 |
| OPS-01 local, dev, and production procedures | Tasks 3 and 6 |

---

## Final Verification Gate

Run from backend with a disposable PostgreSQL 16 database:

~~~bash
npm ci --registry=https://registry.npmjs.org/ --replace-registry-host=always
npm test -- --runInBand
npm run build
npm run migration:run:prod
npm run seed:learning:prod
npm run seed:learning:prod
npm run test:e2e -- --runInBand
test -f dist/database/content/starter/manifest.json
test "$(find dist/database/content/starter -name '*.json' | wc -l | tr -d ' ')" = "7"
npx eslint "{src,test}/**/*.ts"
git diff --check
~~~

Required evidence:

- Unit and e2e suites report zero failures.
- Migration executes against PostgreSQL 16.
- Two seed runs leave six published decks and 120 active cards with no duplicates.
- Retirement tests preserve progress and review history.
- The production build contains the manifest and six deck files.
- Dev Coolify one-time execution succeeds before production is considered.
- No secrets, database URLs, or generated environment files are committed.
