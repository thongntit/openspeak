# Gramio Environment Baseline

Captured: 2026-07-11
Issue: https://github.com/thongntit/gramio/issues/40
Baseline commit: `286b4b8b5530c9ca474f27641e25e1ce30aa03d9`

## Coolify Dev Source Service

- Project: `Life Assistant` (`yow0cggk48gs0gkcwooowgco`)
- Environment: `production` (Coolify environment ID `5`)
- Server: `localhost` (`og4404cgo8k4scso00kc84s4`)
- Service: `openspeak-api` (`kjduvgi7sin5hmly73l8za2f`)
- API subresource: `api` (`rf10704u24crbps0x0ffghjj`)
- Database subresource: `postgres` (`dqpidnvhytlgof51riuosvts`)
- Persistent storage: `rpjgsyfvsfgkrz8298ksh9a0`
- Persistent volume: `kjduvgi7sin5hmly73l8za2f_openspeak-pg`
- Mount: `/var/lib/postgresql/data`
- Image expression: `ghcr.io/thongntit/openspeak-backend:${BACKEND_IMAGE_TAG:-dev}`
- Resolved immutable image: unavailable from the Coolify service and deployment-history APIs
- Domain: `https://openspeak-api.thongnt.dev`
- Health endpoint: `/api/health`
- API status: `running:healthy`
- Service status: `running:unknown` because the Compose database has no health check
- Latest successful deployment UUID: unavailable from the Coolify deployment-history API
- Configuration hash: `8f0867a26b17b10472fdb7ea0ac8082c`
- Environment variables: `POSTGRES_USER`, `POSTGRES_DB`, `POSTGRES_PASSWORD`, `CORS_ORIGIN`, and `CLERK_SECRET_KEY`; values are managed externally and were read masked

## Vercel

- Team/project: `thongntit-team/gramio`
- Git repository: `thongntit/gramio`
- Root directory: `frontend`
- Production branch: `main`
- Production domain: `https://openspeak.thongnt.dev`
- Production deployment at capture: `openspeak-bz8r1tck2-thongntit-team.vercel.app`
- Production commit at capture: `60804d33d184c776f06e1d347f231b32ab4ffce9`
- Stable `dev` preview: `https://openspeak-git-dev-thongntit-team.vercel.app`
- Project environment variables: none listed at capture

## GitHub Actions

- Local checkout remote: `git@github.com:thongntit/openspeak.git`; this is stale and must not be used to infer the canonical repository
- Canonical repository: `thongntit/gramio`
- Workflow: `.github/workflows/ci-backend.yml`
- Existing webhook secret name: `COOLIFY_WEBHOOK_URL`
- Existing token secret name: `COOLIFY_TOKEN`
- Current behavior: pushes to `dev`, `main`, `master`, and version tags publish images, then one shared deployment job invokes `COOLIFY_WEBHOOK_URL`
- Current validation gap: backend tests run only for pull requests, not protected-branch pushes

## Baseline Verification

- Frontend dependency install: passed
- Frontend lint: failed before issue #40 changes with three unrelated errors in `Library.jsx` and `Practice.jsx`
- Backend dependency install: passed
- Backend lint: passed
- Backend unit tests: 16 passed
- Backend build: passed

## Rollback Baseline

- Previous service UUID: `kjduvgi7sin5hmly73l8za2f`
- Previous storage UUID: `rpjgsyfvsfgkrz8298ksh9a0`
- Previous database UUID: `dqpidnvhytlgof51riuosvts`
- Previous image expression: `ghcr.io/thongntit/openspeak-backend:${BACKEND_IMAGE_TAG:-dev}`
- Previous immutable backend image: unavailable; capture a resolvable immutable `sha-*` image before the rollback rehearsal
- Previous domain mapping: `https://openspeak-api.thongnt.dev` to API subresource `rf10704u24crbps0x0ffghjj`
- Previous workflow commit: `286b4b8b5530c9ca474f27641e25e1ce30aa03d9`
- Previous workflow hook: `COOLIFY_WEBHOOK_URL`, managed as a GitHub secret

No secret values, database URLs, tokens, or webhook URLs are stored in this document.

## Dev Environment Result

Configured: 2026-07-11

- Service: `gramio-api-dev` (`kjduvgi7sin5hmly73l8za2f`)
- API subresource: `rf10704u24crbps0x0ffghjj`
- Database subresource preserved: `dqpidnvhytlgof51riuosvts`
- Storage preserved: `rpjgsyfvsfgkrz8298ksh9a0`
- Volume preserved: `kjduvgi7sin5hmly73l8za2f_openspeak-pg`
- Image pinned to: `ghcr.io/thongntit/openspeak-backend:dev`
- Dev domain: `https://gramio-api-dev.thongnt.dev`
- Temporary rollback alias: `https://openspeak-api.thongnt.dev`
- CORS origin: `https://openspeak-git-dev-thongntit-team.vercel.app`
- Configuration hash: `361359ddbd1d7224afe38150f661a17d`
- Health verification: both the dev domain and rollback alias returned `status=ok` and `db=up`
- Immutable image digest: not available because the host has no Docker client and Coolify does not expose the pulled digest through its service API

The dev domain is provided by an explicit Traefik Compose label because Coolify 4.1.2 does not expose domain updates for Compose subresources through its public API. The legacy domain remains available until end-to-end verification is complete.

## Learning Content Release Readiness

Updated locally: 2026-07-14

The dev-first one-time execution, verification queries, recovery constraints,
production approval gate, and evidence format are defined in the
[learning content release runbook](./learning-content-release.md).

- Content version: `starter@2026.07.1`
- Expected converged state: six published decks and 120 active cards with zero
  duplicate deck slugs or per-deck card content keys
- Dev target: Coolify service `gramio-api-dev`, container/service `api`, using
  `npm run db:prepare:prod` twice before aggregate and health verification
- Production target: Coolify service `gramio-api-production`, container/service
  `api`, gated on the dev evidence, matching image/source/assets, masked
  production environment checks, recovery posture, and explicit user approval
- Dev health URL: `https://gramio-api-dev.thongnt.dev/api/health`
- Production health URL: `https://gramio-api.thongnt.dev/api/health`

Local documentation does not establish runtime evidence. PostgreSQL PR CI,
merge to `dev`, image publication, Coolify dev deployment, both dev one-time
executions, dev aggregate/health checks, the live recovery rehearsal, all
production gates, and production execution remain pending. No Coolify,
deployment, production, or issue-tracker operation was performed for this
update.
