# Isolated Dev and Production Deployments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Gramio isolated dev and production backend environments with branch-specific deployments and matching Vercel frontend configuration.

**Architecture:** Preserve the existing Coolify service and PostgreSQL volume as dev, then create a second Coolify Compose service with a fresh production database. GitHub Actions publishes branch-specific GHCR tags and invokes a matching Coolify webhook; Vercel scopes the dev and production API URLs to their corresponding frontend deployments.

**Tech Stack:** GitHub Actions, GHCR, Coolify Docker Compose services, PostgreSQL 16, NestJS, Vercel, Vite

## Global Constraints

- Dev branch is exactly `dev`; production branch is exactly `main`.
- Dev backend is `https://gramio-api-dev.thongnt.dev` using `ghcr.io/thongntit/openspeak-backend:dev`.
- Production backend is `https://gramio-api.thongnt.dev` using `ghcr.io/thongntit/openspeak-backend:latest`.
- The existing Coolify PostgreSQL volume remains dev data and must not be deleted, copied, or attached to production.
- Production receives a new PostgreSQL database and persistent volume.
- Dev and production must not share database URLs, volumes, Clerk secrets, CORS values, or deployment hooks.
- Secrets and webhook URLs must remain in Coolify, Vercel, or GitHub Secrets and must never be committed.
- Migrations run against dev before production and must follow issues #34 and #36.
- Record rollback state before every external mutation.

---

### Task 1: Capture the Infrastructure Baseline

**Files:**
- Create: `docs/deployment/environment-baseline.md`

**Interfaces:**
- Consumes: Coolify service `kjduvgi7sin5hmly73l8za2f`, Vercel project `thongntit-team/gramio`, GitHub repository `thongntit/gramio`
- Produces: A secret-free rollback record containing resource identifiers, image tags, domains, storage identifiers, masked variable names, and current deployment state

- [ ] **Step 1: Capture the current Git and workflow state**

Run:

```bash
git status --short --branch
git rev-parse HEAD
git remote -v
sed -n '1,260p' .github/workflows/ci-backend.yml
```

Expected: current branch and commit are recorded; the workflow shows one shared `COOLIFY_WEBHOOK_URL` deployment step.

- [ ] **Step 2: Capture the Coolify baseline without revealing secret values**

Use the Coolify service, environment-variable, storage, deployment, and diagnostics reads for service `kjduvgi7sin5hmly73l8za2f`. Keep environment values masked.

Expected baseline facts:

```text
service: openspeak-api
service uuid: kjduvgi7sin5hmly73l8za2f
api image: ghcr.io/thongntit/openspeak-backend:${BACKEND_IMAGE_TAG:-dev}
domain: openspeak-api.thongnt.dev
database: postgres
database volume: kjduvgi7sin5hmly73l8za2f_openspeak-pg
health endpoint: /api/health
```

- [ ] **Step 3: Capture the Vercel baseline**

Inspect the Vercel project overview, deployments, and environment-variable settings. Record variable names and scopes only; never copy secret values into the repository.

Expected:

```text
production branch: main
production domain: openspeak.thongnt.dev
stable dev preview: https://openspeak-git-dev-thongntit-team.vercel.app
```

- [ ] **Step 4: Write the rollback record**

Create `docs/deployment/environment-baseline.md` with this structure and the observed identifiers:

```markdown
# Gramio Environment Baseline

Captured: 2026-07-11
Issue: https://github.com/thongntit/gramio/issues/40

## Coolify Dev Source Service

- Service name and UUID
- API subresource UUID
- Database subresource UUID
- Persistent storage UUID and volume name
- Current image expression and resolved deployment image
- Current domain
- Health status and latest successful deployment UUID
- Environment variable names with values recorded as `managed externally`

## Vercel

- Project and production branch
- Production domain
- Stable `dev` preview domain
- Environment variable names and scopes with values recorded as `managed externally`

## GitHub Actions

- Current commit SHA
- Existing webhook secret name
- Current branch trigger behavior

## Rollback Baseline

- Previous immutable backend image SHA/tag for dev
- Previous domain mapping
- Previous workflow commit SHA
```

- [ ] **Step 5: Verify and commit the baseline**

Run:

```bash
rg -n "password|secret|token|postgresql://|webhook" docs/deployment/environment-baseline.md
git diff --check -- docs/deployment/environment-baseline.md
git add docs/deployment/environment-baseline.md
git commit -m "docs: capture deployment environment baseline"
```

Expected: any `rg` matches contain only masked labels such as `managed externally`; commit contains only the baseline file.

---

### Task 2: Split and Validate the Backend CI Deployment Paths

**Files:**
- Modify: `.github/workflows/ci-backend.yml`
- Create: `frontend/test/deployment-config.test.js`

**Interfaces:**
- Consumes: branches `dev` and `main`; GitHub Secrets `COOLIFY_DEV_WEBHOOK_URL`, `COOLIFY_PROD_WEBHOOK_URL`, and `COOLIFY_TOKEN`
- Produces: validated branch-to-image and branch-to-webhook routing; an automated repository guard for frontend API defaults

- [ ] **Step 1: Write a failing deployment configuration test**

Create `frontend/test/deployment-config.test.js`:

```js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync(
  new URL('../../.github/workflows/ci-backend.yml', import.meta.url),
  'utf8',
);
const apiService = readFileSync(
  new URL('../src/services/openspeakApi.js', import.meta.url),
  'utf8',
);

test('backend workflow has isolated branch deployment hooks', () => {
  assert.match(workflow, /COOLIFY_DEV_WEBHOOK_URL/);
  assert.match(workflow, /COOLIFY_PROD_WEBHOOK_URL/);
  assert.match(workflow, /github\.ref == 'refs\/heads\/dev'/);
  assert.match(workflow, /github\.ref == 'refs\/heads\/main'/);
  assert.doesNotMatch(workflow, /secrets\.COOLIFY_WEBHOOK_URL/);
});

test('frontend API default points to production Gramio backend', () => {
  assert.match(apiService, /https:\/\/gramio-api\.thongnt\.dev\/api/);
  assert.doesNotMatch(apiService, /openspeak-api\.thongnt\.dev/);
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
cd frontend
node --test test/deployment-config.test.js
```

Expected: FAIL because the workflow still references `COOLIFY_WEBHOOK_URL` and the frontend fallback still references `openspeak-api.thongnt.dev`.

- [ ] **Step 3: Split CI validation, publishing, and deployment jobs**

Modify `.github/workflows/ci-backend.yml` so:

```yaml
jobs:
  backend:
    name: Backend
    runs-on: ubuntu-latest
    # Run for both pull requests and protected branch pushes.

  publish-backend-image:
    name: Publish backend image to ghcr.io
    needs: [backend]
    if: >-
      github.event_name == 'push' &&
      (github.ref == 'refs/heads/main' ||
       github.ref == 'refs/heads/dev' ||
       startsWith(github.ref, 'refs/tags/v'))

  deploy-dev:
    name: Deploy dev backend
    needs: [publish-backend-image]
    if: github.ref == 'refs/heads/dev'
    steps:
      - name: Trigger dev Coolify redeploy
        run: |
          curl --fail-with-body --silent --show-error \
            -X GET "${{ secrets.COOLIFY_DEV_WEBHOOK_URL }}" \
            -H "Authorization: Bearer ${{ secrets.COOLIFY_TOKEN }}"

  deploy-production:
    name: Deploy production backend
    needs: [publish-backend-image]
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Trigger production Coolify redeploy
        run: |
          curl --fail-with-body --silent --show-error \
            -X GET "${{ secrets.COOLIFY_PROD_WEBHOOK_URL }}" \
            -H "Authorization: Bearer ${{ secrets.COOLIFY_TOKEN }}"
```

Remove the existing unconditional `deploy` job and its fixed sleep. Keep Docker metadata rules so `dev` publishes `:dev` and the default branch publishes `:latest`.

- [ ] **Step 4: Update the production API fallback**

In `frontend/src/services/openspeakApi.js`, replace:

```js
const DEFAULT_BASE = 'https://openspeak-api.thongnt.dev/api';
```

with:

```js
const DEFAULT_BASE = 'https://gramio-api.thongnt.dev/api';
```

- [ ] **Step 5: Run automated checks**

Run:

```bash
cd frontend
node --test test/deployment-config.test.js
bun run lint
bun run build
cd ../backend
npm run lint
npm test -- --ci
npm run build
```

Expected: all commands exit `0`; deployment tests report two passing tests.

- [ ] **Step 6: Commit CI routing and fallback changes**

Run:

```bash
git add .github/workflows/ci-backend.yml frontend/src/services/openspeakApi.js frontend/test/deployment-config.test.js
git commit -m "ci: isolate dev and production deployments"
```

Expected: commit includes only the three listed files.

---

### Task 3: Convert the Existing Coolify Service to Dev

**Files:**
- Modify: Coolify service `kjduvgi7sin5hmly73l8za2f` through the Coolify API
- Update: `docs/deployment/environment-baseline.md` with the resulting dev identifiers

**Interfaces:**
- Consumes: existing Compose service, database, volume, and masked environment-variable inventory
- Produces: healthy dev API at `https://gramio-api-dev.thongnt.dev/api/health` using the existing dev database

- [ ] **Step 1: Verify domain configuration syntax against the installed Coolify version**

Search Coolify documentation for Docker Compose service domains and `SERVICE_FQDN_*` variables. Use only syntax confirmed for the installed Coolify API version.

Expected: a documented method for assigning `gramio-api-dev.thongnt.dev` to the `api` subservice.

- [ ] **Step 2: Prepare the dev Compose update**

Preserve the existing `postgres` service and volume. Ensure the API image is fixed to:

```yaml
api:
  image: ghcr.io/thongntit/openspeak-backend:dev
```

Keep the existing health check:

```yaml
healthcheck:
  test: ["CMD-SHELL", "wget -qO- http://localhost:3000/api/health || exit 1"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 15s
```

- [ ] **Step 3: Update the dev service metadata and domain**

Rename the Coolify service to `gramio-api-dev`, update its Compose definition with the confirmed domain configuration, and retain service UUID `kjduvgi7sin5hmly73l8za2f` and volume `kjduvgi7sin5hmly73l8za2f_openspeak-pg`.

Expected: Coolify reports the service configuration with the `:dev` image and the new domain; the storage UUID is unchanged.

- [ ] **Step 4: Update dev runtime variables**

Set these values in Coolify without printing their plaintext values:

```text
BACKEND_IMAGE_TAG=dev
CORS_ORIGIN=https://openspeak-git-dev-thongntit-team.vercel.app
CLERK_SECRET_KEY=<development Clerk secret>
POSTGRES_USER=<existing dev value>
POSTGRES_DB=<existing dev value>
POSTGRES_PASSWORD=<existing dev value>
```

Expected: the variable inventory contains these keys, all scoped to dev, with values masked in subsequent reads.

- [ ] **Step 5: Deploy and verify dev**

Redeploy the dev service and wait for a terminal deployment status. Then run:

```bash
curl --fail --silent --show-error https://gramio-api-dev.thongnt.dev/api/health
```

Expected:

```json
{"status":"ok","db":"up"}
```

The response may include additional fields such as uptime.

- [ ] **Step 6: Record the dev result**

Append the new service name, domain, deployment UUID, health status, and immutable resolved image tag to `docs/deployment/environment-baseline.md`. Do not record secret values.

Run:

```bash
git add docs/deployment/environment-baseline.md
git commit -m "docs: record dev deployment environment"
```

---

### Task 4: Create the Isolated Production Coolify Service

**Files:**
- Create: a Coolify Compose service named `gramio-api-production`
- Update: `docs/deployment/environment-baseline.md` with production resource identifiers

**Interfaces:**
- Consumes: the validated Compose structure from Task 3 and independent production credentials
- Produces: healthy production API at `https://gramio-api.thongnt.dev/api/health` with a fresh PostgreSQL volume

- [ ] **Step 1: Generate independent production credentials**

Generate a new high-entropy PostgreSQL password locally and transmit it only to Coolify. Use the production Clerk secret already managed by the user. Do not print either value or store either in shell history, logs, repository files, or plan checkboxes.

Expected: production credentials are different from dev credentials.

- [ ] **Step 2: Create the production Compose service**

Create `gramio-api-production` in the same Coolify project and server as dev, with this logical Compose structure:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-gramio}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-gramio}
    volumes:
      - gramio_prod_pg:/var/lib/postgresql/data

  api:
    image: ghcr.io/thongntit/openspeak-backend:latest
    restart: unless-stopped
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-gramio}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-gramio}
      PORT: "3000"
      NODE_ENV: production
      CORS_ORIGIN: ${CORS_ORIGIN}
      CLERK_SECRET_KEY: ${CLERK_SECRET_KEY}
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:3000/api/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 15s

volumes:
  gramio_prod_pg:
```

Add the confirmed Coolify domain configuration for `gramio-api.thongnt.dev` without adding a host port that conflicts with dev.

- [ ] **Step 3: Set production runtime variables**

Create these production-only variables:

```text
POSTGRES_USER=gramio
POSTGRES_DB=gramio
POSTGRES_PASSWORD=<new production value>
CORS_ORIGIN=https://openspeak.thongnt.dev
CLERK_SECRET_KEY=<production Clerk secret>
```

Expected: subsequent masked reads show each key exists; no value matches or references the dev service.

- [ ] **Step 4: Deploy the fresh production service**

Deploy and wait for the terminal status. Confirm the production database volume name and UUID differ from `kjduvgi7sin5hmly73l8za2f_openspeak-pg` and `rpjgsyfvsfgkrz8298ksh9a0`.

Expected: API may be unhealthy until migrations create the schema; PostgreSQL itself must be running.

- [ ] **Step 5: Run production migrations and the current idempotent seed**

Use a one-off Coolify task on the production API container:

```text
npm run migration:run
```

Run the repository's current idempotent seed so the fresh production database contains the existing word and collection content:

```text
npm run seed
```

Expected: migrations finish successfully against the production `DATABASE_URL`; no command targets the dev service.

Issue #36 remains responsible for the future authenticated learning schema. When its migrations land, repeat the dev-first promotion sequence instead of treating this infrastructure rollout as implementation of that schema.

- [ ] **Step 6: Verify production health and isolation**

Run:

```bash
curl --fail --silent --show-error https://gramio-api.thongnt.dev/api/health
```

Expected:

```json
{"status":"ok","db":"up"}
```

Read both storage inventories and confirm production and dev have different UUIDs, volume names, and service UUIDs.

- [ ] **Step 7: Record production identifiers**

Append the production service UUID, API subresource UUID, database UUID, storage UUID, volume name, domain, deployment UUID, and immutable resolved image tag to `docs/deployment/environment-baseline.md`.

Run:

```bash
git add docs/deployment/environment-baseline.md
git commit -m "docs: record production deployment environment"
```

---

### Task 5: Configure Branch-Specific Hooks and Vercel Variables

**Files:**
- Modify: GitHub repository secrets for `thongntit/gramio`
- Modify: Vercel project `thongntit-team/gramio` environment-variable scopes
- Create: `docs/deployment/promotion-and-rollback.md`

**Interfaces:**
- Consumes: dev and production Coolify deployment hooks and backend URLs
- Produces: branch-specific automatic deployment routing and a documented operator runbook

- [ ] **Step 1: Obtain distinct Coolify deployment hooks**

Read or create the deployment hook for each Coolify service. Verify the hook identifiers differ. Do not expose either URL in repository files or task output.

Expected:

```text
dev hook -> gramio-api-dev only
production hook -> gramio-api-production only
```

- [ ] **Step 2: Create branch-specific GitHub Secrets**

In `thongntit/gramio`, set:

```text
COOLIFY_DEV_WEBHOOK_URL=<dev hook>
COOLIFY_PROD_WEBHOOK_URL=<production hook>
COOLIFY_TOKEN=<existing Coolify token>
```

Delete or leave unused the legacy `COOLIFY_WEBHOOK_URL` only after the new workflow is merged and verified. Never display secret values during verification.

- [ ] **Step 3: Configure Vercel dev API routing**

Set `VITE_OPENSPEAK_API_URL` to:

```text
https://gramio-api-dev.thongnt.dev/api
```

Scope it to Preview for Git branch `dev`. Preserve any separate preview configuration for other branches unless it conflicts with issue #40.

- [ ] **Step 4: Configure Vercel production API routing**

Set `VITE_OPENSPEAK_API_URL` to:

```text
https://gramio-api.thongnt.dev/api
```

Scope it to Production. Trigger fresh dev and production frontend deployments so Vite embeds the new values.

- [ ] **Step 5: Write the promotion and rollback runbook**

Create `docs/deployment/promotion-and-rollback.md` containing:

```markdown
# Gramio Promotion and Rollback

## Promote
1. Merge feature work into `dev`.
2. Verify backend CI, dev Coolify deployment, dev migrations, and Vercel dev preview.
3. Run dev smoke tests for health, CORS, authentication, database access, and one authenticated learning request.
4. Merge tested `dev` into `main`.
5. Verify backend CI and the `:latest` image.
6. Run approved production migrations.
7. Verify production Coolify and Vercel deployments.
8. Run the production smoke tests.

## Application Rollback
1. Stop further promotions.
2. Redeploy the previous immutable image tag in the affected environment only.
3. Restore the recorded domain or hook mapping if routing changed.
4. Repeat smoke tests.

## Migration Rollback
1. Do not assume an image rollback reverses schema changes.
2. Use `npm run migration:revert` only for a migration whose revert was tested in dev.
3. For destructive migrations, restore the verified production backup according to the database backup procedure.
4. Verify schema version, row counts, health, and an authenticated learning request.

## Ownership and Secret Locations
- Coolify: runtime variables, PostgreSQL credentials, Clerk secrets, service domains.
- GitHub Secrets: Coolify hook URLs and API token.
- Vercel: frontend API URLs and frontend Clerk publishable keys.
- Git: secret-free configuration and this runbook only.
```

- [ ] **Step 6: Verify and commit the runbook**

Run:

```bash
rg -n "https://.*hook|postgresql://|sk_live|sk_test|Bearer " docs/deployment
git diff --check -- docs/deployment/promotion-and-rollback.md
git add docs/deployment/promotion-and-rollback.md
git commit -m "docs: add deployment promotion and rollback runbook"
```

Expected: secret scan returns no secret values; commit contains only the runbook.

---

### Task 6: Execute End-to-End Isolation and Rollback Verification

**Files:**
- Modify: `docs/deployment/environment-baseline.md` with verification evidence
- Update: GitHub issue #40 checklist after evidence is collected

**Interfaces:**
- Consumes: completed dev and production environments, CI workflows, Vercel deployments, and rollback runbook
- Produces: evidence that every acceptance criterion in issue #40 is satisfied

- [ ] **Step 1: Verify the dev branch path**

Push a harmless backend change or explicitly dispatch the dev workflow from `dev`. Observe GitHub Actions and Coolify.

Expected:

```text
backend validation: pass
published image: openspeak-backend:dev
dev Coolify deployment: new deployment UUID
production Coolify deployment: unchanged
```

- [ ] **Step 2: Verify the dev frontend path**

Open `https://openspeak-git-dev-thongntit-team.vercel.app`, inspect a real API request, and verify its origin is:

```text
https://gramio-api-dev.thongnt.dev/api
```

Perform health, CORS, authentication, database access, and one authenticated learning request.

- [ ] **Step 3: Verify database isolation**

Record a non-production marker or migration state in dev using an approved reversible operation. Query production independently.

Expected: the dev change exists only in dev; production schema and data counts remain unchanged.

- [ ] **Step 4: Verify the production branch path**

After dev approval, merge `dev` into `main` or dispatch the production workflow at the approved `main` commit.

Expected:

```text
backend validation: pass
published image: openspeak-backend:latest
production Coolify deployment: new deployment UUID
dev Coolify deployment: unchanged
```

- [ ] **Step 5: Verify the production frontend path**

Open `https://openspeak.thongnt.dev`, inspect a real API request, and verify its origin is:

```text
https://gramio-api.thongnt.dev/api
```

Perform health, CORS, authentication, database access, and one authenticated learning request.

- [ ] **Step 6: Rehearse application rollback**

For dev, redeploy the previously recorded immutable image, verify health, then redeploy the current `:dev` image and verify health again.

Expected: only dev changes during the rehearsal; production deployment UUID and data remain unchanged.

- [ ] **Step 7: Record evidence and audit isolation**

Append a dated verification table to `docs/deployment/environment-baseline.md`:

```markdown
| Check | Dev evidence | Production evidence | Result |
| --- | --- | --- | --- |
| Branch-specific deployment | workflow and deployment UUID | unchanged deployment UUID | Pass |
| Frontend API routing | request URL | request URL | Pass |
| Database isolation | schema/data marker | unchanged schema/data | Pass |
| Health and authentication | response summary | response summary | Pass |
| Rollback rehearsal | before/after deployment UUIDs | unchanged deployment UUID | Pass |
```

Do not include tokens, cookies, database URLs, or secret values.

- [ ] **Step 8: Run final repository verification**

Run:

```bash
cd frontend
node --test test/deployment-config.test.js
bun run lint
bun run build
cd ../backend
npm run lint
npm test -- --ci
npm run build
cd ..
git diff --check
git status --short
```

Expected: all checks exit `0`; only the intended evidence documentation is uncommitted.

- [ ] **Step 9: Commit evidence and update issue #40**

Run:

```bash
git add docs/deployment/environment-baseline.md
git commit -m "docs: verify isolated deployment environments"
```

Update issue #40 checkboxes only where the corresponding evidence was actually collected. Add a concise final issue comment linking the workflow runs, deployment identifiers, frontend URLs, and repository documentation without including secrets.

Expected: every checked acceptance criterion has direct evidence, and unresolved items remain unchecked.
