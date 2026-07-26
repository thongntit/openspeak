# Production MVP Release Status

Runtime evidence captured: 2026-07-26 (Asia/Ho_Chi_Minh)
Candidate reconciliation: 2026-07-26 (Asia/Ho_Chi_Minh), after fetching
`origin/dev`

This document records a secret-free runtime baseline and subsequent release
evidence. The baseline section alone is not evidence that a one-time
database-preparation worker ran; the Task 2 section records the separately
verified dev-only fallback executions.

## Candidate revisions

- `dev`: `56e60d6c7f8f0f83bf2dca894338ec0960b953d8`
- `main`: `19c9d3eafc165c1a6c3348de038815b4da59190d`

The health observations below were collected before this document's candidate
SHA reconciliation/fetch to `56e60d6`. They were not re-run after that
reconciliation, which updates the release candidate reference only and does
not represent a new runtime observation.

## Runtime baseline

| Environment | Coolify service | API state | Image reference | Public domain | Health code at baseline capture |
| --- | --- | --- | --- | --- | ---: |
| Dev | `gramio-api-dev` (`kjduvgi7sin5hmly73l8za2f`) | `running:healthy` | `ghcr.io/thongntit/openspeak-backend:dev` | `https://gramio-api-dev.thongnt.dev` | 200 |
| Production | `gramio-api-production` (`ea2xn2x5i6y6gvs0bmpzdp4a`) | `running:healthy` | `ghcr.io/thongntit/openspeak-backend:latest` | `https://gramio-api.thongnt.dev` | 200 |

Coolify exposed image tags, but not an immutable image digest, for either
service. The parent Compose service is `running:unknown` because its PostgreSQL
container has no health check; the API application state above is the relevant
runtime signal.

## Masked configuration checklist

Only names and masked-presence state were read.

| Environment | Present names |
| --- | --- |
| Dev | `POSTGRES_USER`, `POSTGRES_DB`, `POSTGRES_PASSWORD`, `CORS_ORIGIN`, `CLERK_SECRET_KEY` |
| Production | `SERVICE_PASSWORD_64_POSTGRES`, `POSTGRES_PASSWORD`, `CORS_ORIGIN`, `CLERK_SECRET_KEY` |

## Checks completed

- Coolify service definitions read for both API services; each exposes port
  `3000` and has an internal `/api/health` health check.
- Masked environment-variable reads completed for both services; no values were
  requested or recorded.
- Public endpoint checks completed without saving response bodies:
  - `https://gramio-api-dev.thongnt.dev/api/health` returned `200`.
  - `https://gramio-api.thongnt.dev/api/health` returned `200`.
- During this Task 1 baseline phase, no database-preparation worker was invoked
  and no production data was modified. Subsequent Task 2 dev-only fallback
  executions are recorded separately below.

## Log and remediation outcome

The Coolify connector's application-log endpoint rejected both service UUIDs
and the API subresource identifiers with `Application not found`; it therefore
did not supply a latest runtime error class. This connector limitation is not a
confirmed application failure: both API applications were concurrently reported
healthy and both public health checks returned `200`.

No source or deployment configuration defect was observed, so no remediation,
external configuration mutation, or code regression test was required for this
baseline task.

## Remaining blockers

- Capture the deployed immutable image digest/SHA before release promotion; the
  Coolify service API currently exposes tags only.
- Obtain a usable read-only API-subresource log route (or equivalent Coolify UI
  evidence) before relying on this document for a latest-error-class assertion.
- Task 2 still requires authenticated browser smoke evidence. Task 3 remains
  entirely pending: promotion, production configuration confirmation,
  production preparation, production aggregate proof, and production UI smoke
  testing.

## Task 2 dev database/content proof (2026-07-26)

### Configuration validation

- Authorized dev worker: `gramio-db-prepare-dev`
  (`e25dix66p3rz54zpnwyoytp2`), separate from the production worker.
- Masked service definition: image `ghcr.io/thongntit/openspeak-backend:dev`,
  command `npm run db:prepare:prod`, `restart: no`, and the isolated dev
  PostgreSQL host on the `kjduvgi7sin5hmly73l8za2f` network.
- Masked environment-variable presence: `POSTGRES_PASSWORD` only. No values
  were requested or recorded.

### Worker limitation and authorized API-container fallback

- A manual Coolify start request was issued for the dev worker. The service
  returned to `exited`, but the available Compose-service API did not expose an
  exit code or stdout. This is not treated as a successful preparation run.
- A service-scoped Coolify one-time command for `npm run db:prepare:prod` then
  timed out after 90 seconds without producing an execution and was removed by
  Coolify. The worker itself therefore could not supply terminal evidence.
- Under the documented observability fallback, the same compiled command ran
  twice as Coolify one-time tasks in the already-running dev API container
  (`kjduvgi7sin5hmly73l8za2f`, `api`). Both terminal results were `success` and
  reported `starter@2026.07.1`, `decksUpserted: 6`, `cardsUpserted: 120`,
  `decksUnpublished: 0`, and `cardsDeactivated: 0`.
- Task UUIDs were `c1360yjk1e894ertpw9i0k0k` and
  `mkpm926grv7eza7d6icn3zn5`; Coolify deleted each temporary one-time task
  after its terminal result.

### Read-only checks completed

- Dev health recheck: `https://gramio-api-dev.thongnt.dev/api/health` returned
  HTTP `200` without saving a response body.
- Unauthenticated access was rejected: `/api/today`, `/api/content/decks`, and
  `/api/content/decks/starter/cards` each returned HTTP `401` without an
  authorization header.
- The corrected short read-only aggregate command in the dev API container
  returned `d: 6`, `c: 120`, `dd: 0`, and `dc: 0`, respectively: published
  decks, active cards, duplicate deck slugs, and duplicate card identities.
  It selected no learning content or secret values.
- Two additional read-only API-container queries completed with terminal
  `success`: `d: 0` older published starter decks and `c: 0` older active
  starter cards, where `content_version` begins with `starter@` but differs
  from `starter@2026.07.1`.

### Remaining Task 2 blockers

- The dedicated Compose worker still lacks an inspectable terminal-log route,
  but the approved same-image/same-database API-container fallback supplied the
  required two terminal results and aggregate proof.
- Authenticated 375px UI verification remains pending. Vercel SSO and the lack
  of an existing signed-in Gramio browser session prevent access; no attempt was
  made to authenticate or fabricate UI proof.
