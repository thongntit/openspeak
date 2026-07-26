# Production MVP Release Status

Captured: 2026-07-26 (Asia/Ho_Chi_Minh)

This document records a secret-free runtime baseline. It is not evidence that
the one-time database-preparation workers have run.

## Candidate revisions

- `dev`: `9892d551a88542ee0e682def19d444732200ce7c`
- `main`: `19c9d3eafc165c1a6c3348de038815b4da59190d`

## Runtime baseline

| Environment | Coolify service | API state | Image reference | Public domain | Health code |
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
