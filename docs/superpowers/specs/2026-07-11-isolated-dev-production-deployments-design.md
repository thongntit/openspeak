# Isolated Dev and Production Deployments

## Context

Gramio needs a safe `dev` to `main` promotion path. Vercel already deploys `main` as production and provides a stable preview for `dev`. The backend currently has one Coolify service, `openspeak-api`, which uses the `openspeak-backend:dev` image, the `openspeak-api.thongnt.dev` domain, and the only PostgreSQL volume.

This design implements GitHub issue #40. The existing backend database is preserved as dev data. Production starts with a new service, database, storage volume, domain, credentials, and deploy hook.

## Environment Architecture

| Concern | Dev | Production |
| --- | --- | --- |
| Git branch | `dev` | `main` |
| Backend image | `ghcr.io/thongntit/openspeak-backend:dev` | `ghcr.io/thongntit/openspeak-backend:latest` |
| Backend domain | `gramio-api-dev.thongnt.dev` | `gramio-api.thongnt.dev` |
| Coolify service | Existing service, renamed for dev | New production service |
| PostgreSQL | Existing database and volume | New database and volume |
| Clerk | Development credentials and origins | Production credentials and origins |
| Frontend | Vercel `dev` preview | Vercel production deployment |
| Frontend API variable | `VITE_OPENSPEAK_API_URL=https://gramio-api-dev.thongnt.dev/api` | `VITE_OPENSPEAK_API_URL=https://gramio-api.thongnt.dev/api` |
| Deployment hook | Dev-only Coolify hook | Production-only Coolify hook |

Dev and production must not share database URLs, PostgreSQL volumes, Clerk secrets, CORS configuration, or deployment hooks.

## Deployment Flow

### Dev

1. Changes are pushed to `dev`.
2. GitHub Actions validates the backend and publishes `openspeak-backend:dev`.
3. The workflow invokes only the dev Coolify deployment hook.
4. Coolify pulls the dev image and redeploys the dev backend.
5. Vercel builds the `dev` preview with the dev API URL.
6. Database migrations are run against the dev database before functional verification.
7. Health, authentication, CORS, database access, and an authenticated learning request are smoke-tested.

### Production

1. A tested change is merged from `dev` into `main`.
2. GitHub Actions validates the backend and publishes `openspeak-backend:latest`.
3. Production migrations are run against only the production database.
4. The workflow invokes only the production Coolify deployment hook.
5. Coolify pulls the production image and redeploys the production backend.
6. Vercel deploys `main` with the production API URL.
7. The same backend and frontend smoke tests are run in production.

The branch-specific workflow conditions and separate hooks ensure a push to `dev` cannot redeploy production and a push to `main` cannot overwrite dev data.

## Coolify Changes

Before mutation, record the existing service UUID, raw Compose configuration, masked environment-variable inventory, storage UUID and mount, domain, health status, and latest successful deployment. This snapshot is the rollback baseline.

The existing `openspeak-api` service becomes the dev service. Its PostgreSQL database and persistent volume remain attached. Its backend image stays on `:dev`, and its public domain changes to `gramio-api-dev.thongnt.dev`.

A new production service is created from the same Compose structure. It uses `:latest`, a fresh PostgreSQL database, a fresh persistent volume, independent secrets, and `gramio-api.thongnt.dev`. Production is migrated and seeded intentionally; no dev volume is copied or mounted.

## CORS and Frontend Configuration

Each backend receives an exact allowlist of its matching frontend origins. Dev allows the stable Vercel `dev` preview origin and explicitly approved local origins if needed. Production allows only the production frontend domain. Because the backend accepts a comma-separated `CORS_ORIGIN`, each environment can declare more than one exact origin without allowing arbitrary Vercel previews.

Vercel environment variables are scoped by environment. Preview builds for `dev` use the dev API URL; production builds use the production API URL. After configuration, each deployed frontend is verified through its browser network behavior and a backend request, not only by inspecting settings.

## Database Migration Safety

Migration commands must use an environment-specific `DATABASE_URL`. Dev migrations run and are verified first. Production migrations run only after promotion approval and immediately before the production application deployment when the migration is backward-compatible.

If a migration requires coordinated downtime or is not backward-compatible, deployment stops and a dedicated expand-and-contract migration plan is required. Schema changes must remain consistent with issues #34 and #36.

## Error Handling and Rollback

If a dev deployment fails, the dev service is rolled back to the previously recorded immutable image tag. Production is not touched.

If production application smoke tests fail, Coolify rolls the production service back to the previous immutable image tag. Domain routing and deployment hooks are restored from the recorded baseline if either was changed incorrectly.

Database rollback is handled separately from application rollback. A reversible migration may use its tested revert operation. A destructive or data-changing migration requires a verified backup and restore procedure before production execution; an image rollback alone must not be treated as a schema rollback.

No existing service, volume, secret, or hook is deleted until both environments pass validation and the rollback rehearsal succeeds.

## Verification

The implementation is complete when all of the following are demonstrated:

- A push to `dev` redeploys only the dev backend.
- The Vercel `dev` deployment calls `gramio-api-dev.thongnt.dev`.
- A dev migration does not change production schema or data.
- A merge to `main` redeploys only production.
- The production frontend calls `gramio-api.thongnt.dev`.
- Both environments pass health, authentication, CORS, database connectivity, and one authenticated learning request.
- Dev and production have distinct services, databases, volumes, domains, secrets, and hooks.
- Application and migration rollback steps have been executed or rehearsed successfully.

## Out of Scope

- Per-pull-request backend environments.
- Sharing or cloning dev data into production.
- Renaming the existing GHCR package from `openspeak-backend`.
- General backend schema work beyond what is required to deploy migrations safely.
