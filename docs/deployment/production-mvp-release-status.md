# Production MVP Release Status

Runtime evidence captured: 2026-07-26 (Asia/Ho_Chi_Minh)
Candidate reconciliation: 2026-07-26 (Asia/Ho_Chi_Minh), after fetching
`origin/dev`

This document records a secret-free runtime baseline. It is not evidence that
the one-time database-preparation workers have run.

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
- No database-preparation worker was invoked and no production data was
  modified.

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
- Tasks 2 and 3 remain pending: worker command/target validation, two dev
  preparations, aggregate database proof, authenticated browser smoke testing,
  and any production promotion/execution.

## Task 2 dev database/content proof (2026-07-26)

### Configuration validation

- Authorized dev worker: `gramio-db-prepare-dev`
  (`e25dix66p3rz54zpnwyoytp2`), separate from the production worker.
- Masked service definition: image `ghcr.io/thongntit/openspeak-backend:dev`,
  command `npm run db:prepare:prod`, `restart: no`, and the isolated dev
  PostgreSQL host on the `kjduvgi7sin5hmly73l8za2f` network.
- Masked environment-variable presence: `POSTGRES_PASSWORD` only. No values
  were requested or recorded.

### Execution evidence and stop condition

- A manual Coolify start request was issued for the dev worker. The service
  returned to `exited`, but the available Compose-service API did not expose an
  exit code or stdout. This is not treated as a successful preparation run.
- A service-scoped Coolify one-time command for `npm run db:prepare:prod` then
  timed out after 90 seconds without producing an execution and was removed by
  Coolify. No retry or third preparation run was attempted.
- Consequently, this task has no terminal summary proving
  `starter@2026.07.1`, six deck upserts, or 120 card upserts. Do not proceed to
  production on this evidence.

### Read-only checks completed

- Dev health recheck: `https://gramio-api-dev.thongnt.dev/api/health` returned
  HTTP `200` without saving a response body.
- Unauthenticated access was rejected: `/api/today`, `/api/content/decks`, and
  `/api/content/decks/starter/cards` each returned HTTP `401` without an
  authorization header.

### Remaining Task 2 blockers

- Coolify's available connector routes reject log/deployment reads for the
  Compose subservice, so the first manual execution has no inspectable terminal
  result. Obtain an operator-visible, read-only worker-log/exit-status route
  before deciding whether a new two-run verification sequence is needed.
- The Coolify connector exposes no database-console or SQL-query capability, so
  the required read-only aggregate query has not been run.
- The existing browser session had no Gramio tab, and the documented dev
  frontend URL returned HTTP `410 Gone` at the required 375px viewport. No
  authenticated Today/Library/review, light/dark, or unavailable-state proof
  was performed.
