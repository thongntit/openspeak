# Learning Content Release Runbook

This runbook covers the one-time release of the managed Gramio starter bundle,
`starter@2026.07.1`, to PostgreSQL. The release target is six published decks
and 120 active cards. Development must be completed and evidenced before any
production execution.

> Status as of 2026-07-14: this documentation phase is local-only. PostgreSQL CI,
> merge to `dev`, image publication, Coolify deployment, both dev executions,
> the live dev recovery rehearsal, production approval, and production
> execution are pending. Nothing in this document is evidence that an external
> operation has occurred.

The environment identifiers and historical deployment snapshot are recorded in
the [environment baseline](./environment-baseline.md).

## Safety rules

- Use the dev-first order in this runbook. Stop if CI, image publication,
  deployment, either one-time execution, a database check, or health fails.
- Do not print or copy database URLs, credentials, tokens, webhook URLs, card
  prompts, answers, explanations, examples, or options into release evidence.
- Verify content with aggregate counts and duplicate-group counts only.
- Do not run `migration:revert` or `migration:revert:prod` on a shared database
  that contains learning history. Application rollback and database recovery
  are separate operations.
- Do not claim authenticated learning-content API verification yet. Issues #37
  and #39 must first expose and consume those APIs.

## One-time command

Use the command that matches where it runs:

| Context                                        | Working directory | Command                   |
| ---------------------------------------------- | ----------------- | ------------------------- |
| Source checkout with development dependencies  | `backend/`        | `npm run db:prepare`      |
| Built runtime image or Coolify `api` container | `/app`            | `npm run db:prepare:prod` |

From a source checkout:

```bash
cd backend
npm run db:prepare
```

From the built runtime image, including a Coolify one-time command:

```bash
npm run db:prepare:prod
```

The source command runs
`src/database/prepare-learning-database.ts` through `ts-node`. The runtime
command runs `dist/database/prepare-learning-database.js`; it does not depend
on TypeScript or development dependencies.

Both commands perform the same sequence:

1. Load and validate the complete bundled manifest and all six deck documents
   before opening a database connection.
2. Initialize a TypeORM data source with query logging disabled.
3. Run pending TypeORM migrations.
4. Import the bundle in one transaction by upserting stable deck slugs and
   per-deck card content keys, publishing/activating source records, and
   unpublishing/deactivating managed starter records omitted from the source.
   User progress and review history are not deleted.
5. Close the data source, print `Database migrations complete.`, print a
   summary containing `contentVersion`, `decksUpserted`, `cardsUpserted`,
   `decksUnpublished`, and `cardsDeactivated`, then exit.

On failure, the entrypoint prints `Learning database preparation failed.` and
exits nonzero. Query logging is disabled for this task, so its evidence should
contain only the status and secret-free summary, never raw database or content
values.

The expected source summary includes `contentVersion: starter@2026.07.1`,
`decksUpserted: 6`, and `cardsUpserted: 120`. The database verification below,
not the source summary alone, proves the converged live state.

This is an explicit, idempotent release task. The production image starts with
`node dist/main.js`; an ordinary restart does not run this command and does not
seed content. Production application startup also has TypeORM automatic
migrations disabled, so this one-time command owns both pending migrations and
the starter import for a release.

## Release gates

Complete the gates in order. A later gate stays pending until all earlier gates
have evidence.

1. **PR CI — pending.** The reviewed branch must pass the PostgreSQL 16 PR job,
   including the compiled migration command, two compiled seed runs, the
   learning-content integration test, the full e2e suite, and the production
   asset checks. Task 5's PostgreSQL runtime proof is not complete until this CI
   job passes.
2. **Dev image and deployment — pending.** After review, merge through the
   protected flow into `dev`. Confirm GitHub Actions publishes the `:dev` and
   immutable `sha-*` image tags for that commit. Confirm Coolify deploys that
   image to `gramio-api-dev`. Stop on publication or deployment failure.
3. **Dev one-time execution — pending.** Run the task twice against the dev
   database and record both exit statuses and summaries.
4. **Dev verification and recovery — pending.** Prove the aggregate database
   state, zero duplicate stable identities, HTTP 200 health, and the recovery
   posture described below.
5. **Production approval — pending.** Confirm the exact production candidate,
   assets, environment isolation, and recovery posture, then obtain explicit
   user approval before any production command.
6. **Production execution — pending.** Run and verify production only after the
   approval gate is recorded.

## Dev execution

Target:

- Coolify service: `gramio-api-dev`
- Container/service: `api`
- Health URL: `https://gramio-api-dev.thongnt.dev/api/health`
- Expected content version: `starter@2026.07.1`

Before execution, record the reviewed Git commit, the immutable image tag and
digest/SHA actually deployed, and the successful PR CI run. In the deployed
`api` container, verify the bundled assets without printing their contents:

```bash
test -f dist/database/content/starter/manifest.json
test "$(find dist/database/content/starter -name '*.json' | wc -l | tr -d ' ')" = "7"
find dist/database/content/starter -name '*.json' -exec sha256sum {} \; | sort
```

The first two commands must exit zero: one manifest plus six deck documents are
required. Record the sorted path/checksum list without printing file contents;
use it later to prove production asset equivalence. Then use Coolify's one-time
command facility against the `api` container:

```bash
npm run db:prepare:prod
```

Record the exit status and summary. Run the same one-time command a second
time, and record it separately:

```bash
npm run db:prepare:prod
```

Both runs must exit zero. The second run is mandatory because a run-once
scheduler can execute more than once during cleanup. On a converged database,
the second summary should report the same version, six upserted decks, 120
upserted cards, zero decks unpublished, and zero cards deactivated. Investigate
any unexpected retirement count before continuing.

### Aggregate database verification

In the existing Coolify PostgreSQL console for the **dev database only**, run
the following read-only query. Do not display or reconstruct the connection
URL. This query returns counts and a version label; it does not select learning
content or user data.

```sql
SELECT
  'starter@2026.07.1' AS expected_content_version,
  (
    SELECT COUNT(*)
    FROM decks
    WHERE content_version = 'starter@2026.07.1'
      AND is_published = TRUE
  ) AS published_decks,
  (
    SELECT COUNT(*)
    FROM cards
    WHERE content_version = 'starter@2026.07.1'
      AND is_active = TRUE
  ) AS active_cards,
  (
    SELECT COUNT(*)
    FROM decks
    WHERE content_version LIKE 'starter@%'
      AND content_version <> 'starter@2026.07.1'
      AND is_published = TRUE
  ) AS published_other_starter_versions,
  (
    SELECT COUNT(*)
    FROM cards
    WHERE content_version LIKE 'starter@%'
      AND content_version <> 'starter@2026.07.1'
      AND is_active = TRUE
  ) AS active_other_starter_versions,
  (
    SELECT COUNT(*)
    FROM (
      SELECT slug
      FROM decks
      GROUP BY slug
      HAVING COUNT(*) > 1
    ) AS duplicate_decks
  ) AS duplicate_deck_slugs,
  (
    SELECT COUNT(*)
    FROM (
      SELECT deck_id, content_key
      FROM cards
      GROUP BY deck_id, content_key
      HAVING COUNT(*) > 1
    ) AS duplicate_cards
  ) AS duplicate_card_keys;
```

Expected single row:

| expected_content_version | published_decks | active_cards | published_other_starter_versions | active_other_starter_versions | duplicate_deck_slugs | duplicate_card_keys |
| ------------------------ | --------------: | -----------: | -------------------------------: | ----------------------------: | -------------------: | ------------------: |
| `starter@2026.07.1`      |               6 |          120 |                                0 |                             0 |                    0 |                   0 |

Verify health from an operator terminal without printing response data:

```bash
curl --fail --silent --show-error --output /dev/null --write-out '%{http_code}\n' \
  https://gramio-api-dev.thongnt.dev/api/health
```

Expected output: `200`.

## Failure and recovery

### Automated pre-connection regression coverage

The loader supports an injected content directory as a TypeScript interface,
and the tests use that interface to create invalid temporary assets. The
regression suite verifies that invalid content fails before data-source
initialization and leaves database counts unchanged. This evidence is
**pending** until the PostgreSQL 16 PR CI job passes.

### Live dev recovery rehearsal

The source and compiled command entrypoints do not accept a content-directory
argument. Therefore an `--invalid-content-path` command, environment variable,
or similar override must not be invented or used. Mutating assets inside the
deployed release image is also not an acceptable rehearsal.

The live invalid-asset rehearsal is **pending** until all of these gates are
met:

1. A reviewed mechanism or purpose-built test image can safely select invalid
   assets without altering the release image or exposing content.
2. Its pre-connection failure behavior has passed CI.
3. Dev Coolify execution is explicitly authorized.

When those gates exist, record a nonzero invalid-run status, confirm the
aggregate database state is unchanged, rerun the valid immutable image, repeat
the aggregate query, and verify health. Until then, the automated regression
and the live rehearsal must remain separate evidence items.

For any real one-time command failure:

1. Stop the release and preserve the command status and secret-free summary.
2. If validation failed, correct the reviewed content artifact; validation
   occurs before connection or mutation.
3. If migration or import failed, diagnose the environment or application
   fault and use the approved database backup/restore posture when required.
   A failed import does not justify reverting migrations that may already have
   completed.
4. Never run a migration revert against a shared, history-bearing database.
5. Rerun the valid command on the same intended environment, then repeat the
   aggregate and health checks. Do not continue to production without complete
   dev evidence.

## Production gate and execution

Production remains blocked until every item below is recorded:

- Dev PR CI, image deployment, two one-time runs, aggregate checks, and health
  are complete.
- The candidate's reviewed Git commit and immutable image tag/digest/SHA are
  recorded. The production candidate must match the dev-tested release source
  and bundled asset set. If the production workflow rebuilds the image, record
  both image identities, verify the same seven asset paths/checksums, and
  rehearse the exact candidate in dev before approval.
- The runtime image contains
  `dist/database/prepare-learning-database.js`,
  `dist/database/content/starter/manifest.json`, and exactly six bundled deck
  documents.
- Production runtime variables are present and scoped to production, including
  `DATABASE_URL`, `NODE_ENV=production`, `CORS_ORIGIN`, and
  `CLERK_SECRET_KEY`. Confirm only variable names and masked presence; do not
  expose values. Production must not share the dev database, volume,
  credentials, or deployment hook.
- A current backup/restore or equivalent recovery posture is identified, the
  previous immutable application image is recorded, and operators agree not to
  revert shared database migrations.
- Target service `gramio-api-production` and container/service `api` are
  confirmed.
- The user gives explicit approval for the production one-time command.

Only after the gate is complete, run against `gramio-api-production`:

```bash
npm run db:prepare:prod
```

Record the command status and summary, run the same aggregate SQL against the
production database, and verify production health:

```bash
curl --fail --silent --show-error --output /dev/null --write-out '%{http_code}\n' \
  https://gramio-api.thongnt.dev/api/health
```

Expected output: `200`. A production failure stops the release; it does not
authorize a migration revert.

## Issue #38 evidence and checklist closeout

Keep [Issue #38](https://github.com/thongntit/gramio/issues/38) open until
every required release gate has observed evidence. After each authorized gate,
attach or link the relevant PR CI evidence and dev or production evidence to
the issue. Update only the checklist item(s) supported by that observed proof;
leave production, recovery, or any other blocked or pending item unchecked.
Do not treat this runbook, expected values, or a planned command as evidence of
completion.

For every issue update, record the issue reference/status, the evidence links
or attachments, and the checklist items completed and still pending in the
evidence template below. Before closing the issue, confirm that all required
CI, dev, recovery, approval, and production gates have concrete evidence.

## Evidence template

Copy this template for each environment. Keep every unexecuted field marked
`PENDING`; do not prefill expected values as observed results.

```text
Learning content release evidence

Environment: dev | production
Target service: gramio-api-dev | gramio-api-production
Container/service: api
Issue #38 update status/reference: PENDING
Issue #38 PR CI evidence link/attachment: PENDING
Issue #38 dev/production evidence link/attachment: PENDING
Issue #38 checklist items completed with observed proof: PENDING
Issue #38 checklist items pending/blocked: PENDING
Reviewed Git commit: PENDING
Published image tag: PENDING
Deployed immutable image digest/SHA: PENDING
PR CI run/status: PENDING
Asset manifest present: PENDING
Bundled JSON file count (expected 7): PENDING
Asset checksum/equivalence result: PENDING

One-time command run 1:
  command: npm run db:prepare:prod
  timestamp (UTC): PENDING
  exit status: PENDING
  contentVersion: PENDING
  decksUpserted: PENDING
  cardsUpserted: PENDING
  decksUnpublished: PENDING
  cardsDeactivated: PENDING

One-time command run 2 (required for dev):
  command: npm run db:prepare:prod
  timestamp (UTC): PENDING
  exit status: PENDING
  contentVersion: PENDING
  decksUpserted: PENDING
  cardsUpserted: PENDING
  decksUnpublished: PENDING
  cardsDeactivated: PENDING

Aggregate verification:
  timestamp (UTC): PENDING
  published decks (expected 6): PENDING
  active cards (expected 120): PENDING
  published other starter versions (expected 0): PENDING
  active other starter versions (expected 0): PENDING
  duplicate deck slugs (expected 0): PENDING
  duplicate card identities (expected 0): PENDING

Recovery evidence:
  timestamp (UTC): PENDING
  automated pre-connection regression/CI: PENDING
  live invalid-asset dev rehearsal: PENDING - no safe CLI injection interface
  valid rerun and unchanged-state result: PENDING
  backup/restore posture checked: PENDING
  previous immutable application image: PENDING

Health verification:
  URL: PENDING
  HTTP status (expected 200): PENDING
  timestamp (UTC): PENDING

Production only:
  dev evidence reference: PENDING
  matching image/source/assets check: PENDING
  masked production variable-presence check: PENDING
  explicit user approval reference: PENDING

Secrets/content-answer redaction review and operator signoff: PENDING
Operator notes: PENDING
```
