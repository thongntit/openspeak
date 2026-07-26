# Issue #29 Pronunciation Cleanup Design

**Status:** Approved

**Date:** 2026-07-17

**Issue:** [#29 Product cleanup: remove legacy pronunciation-first experience from Gramio MVP](https://github.com/thongntit/gramio/issues/29)

## Context

Gramio is now a grammar and vocabulary spaced-repetition product. The active application already routes users only to Today, Review, Library, and Profile, but the repository still contains an unreachable pronunciation application inherited from the earlier OpenSpeak direction. That dead implementation includes full pages, client state, Azure Speech integration, phoneme scoring helpers, and an SDK dependency.

Keeping that code creates ambiguity about the supported product, adds dependency and maintenance cost, and makes future work more likely to reconnect obsolete flows accidentally. The product decision is to remove it completely. If pronunciation becomes a priority later, it will be designed and implemented again from current requirements.

## Goals

- Remove all unreachable pronunciation-first frontend implementation from the Gramio MVP codebase.
- Keep the active Today, Review, Library, and Profile experience unchanged.
- Remove the unused Azure Speech SDK and its example configuration.
- Add an automated product-boundary test that prevents obsolete routes, files, imports, or dependencies from returning unnoticed.
- Satisfy issue #29 without expanding into unrelated backend, deployment, or compatibility migrations.

## Non-goals

- Renaming the internal `openspeakApi.js` module or `VITE_OPENSPEAK_API_URL` environment variable.
- Migrating the persisted `pronounce-theme` or `openspeak_*` browser-storage keys.
- Renaming database users, databases, container images, deployment resources, or historical documentation.
- Removing backend word and collection APIs used by the current or planned learning experience.
- Preserving, archiving, or feature-flagging the old pronunciation implementation.
- Designing a future pronunciation feature.

## Current Product Boundary

`frontend/src/App.jsx` registers four authenticated application routes:

- `/` renders Today.
- `/review` renders Review.
- `/library` renders Library.
- `/profile` renders Profile.

`frontend/src/components/TabBar.jsx` exposes the same four destinations. Neither `/practice` nor `/progress` is registered, so the old pages are unreachable dead code rather than supported hidden features.

## Deletion Boundary

The implementation will delete these pronunciation-only or unreachable modules:

- `frontend/src/pages/Home.jsx`
- `frontend/src/pages/Practice.jsx`
- `frontend/src/pages/Progress.jsx`
- `frontend/src/stores/pronunciationStore.js`
- `frontend/src/services/azureSpeech.js`
- `frontend/src/services/wordService.js`
- `frontend/src/components/ui/PhonemeChip.jsx`
- `frontend/src/lib/score.js`

The implementation will also:

- Remove `microsoft-cognitiveservices-speech-sdk` from `frontend/package.json`.
- Regenerate `frontend/bun.lock` through Bun so the dependency graph remains valid.
- Remove Azure Speech example variables from `frontend/.env.example`.

No replacement route, placeholder page, archive folder, or experimental flag will be introduced.

## Retained Compatibility Infrastructure

The active `AppLoader` still uses `frontend/src/services/openspeakApi.js` for the backend health check. Its filename and `VITE_OPENSPEAK_API_URL` are legacy internal identifiers, but changing them would require coordinated Vercel environment updates and is not necessary to remove the pronunciation product experience.

Existing browser-storage keys remain unchanged to preserve user settings and avoid a storage migration. Operational names in Docker, CI, GHCR, and database configuration also remain unchanged because they are not visible product surfaces and may be referenced by deployed infrastructure.

## Behavior After Cleanup

- Application routing and navigation remain exactly as they are today.
- Direct visits to obsolete `/practice` or `/progress` paths continue to have no matching application route.
- No shipped source page offers microphone recording, pronunciation assessment, phoneme scores, or speech coaching.
- The frontend no longer installs or configures the Azure Speech SDK.
- PWA name, description, and install metadata remain Gramio-focused.
- A future pronunciation initiative starts with a new issue, design, dependency decision, and implementation.

## Regression Test Design

Add `frontend/test/product-scope.test.js` using the repository's existing `node:test` pattern. The test will verify the product boundary from tracked source rather than rendering implementation details:

1. `App.jsx` registers exactly the four MVP routes and does not register `/practice` or `/progress`.
2. `TabBar.jsx` exposes exactly Today, Review, Library, and Profile and does not expose practice or progress navigation.
3. The eight legacy runtime files in the deletion boundary do not exist.
4. `frontend/package.json` does not depend on `microsoft-cognitiveservices-speech-sdk`.
5. `frontend/.env.example` does not advertise Azure Speech configuration.
6. Both PWA manifest sources continue to use Gramio and grammar/vocabulary copy.

The test must be written and run before deletion so it fails for the expected legacy-file, dependency, and environment-variable reasons. After the minimal cleanup, the same test and the full frontend test suite must pass.

## Verification

Completion requires all of the following:

- `bun test` passes in `frontend`.
- `bun run build` passes in `frontend`.
- `git diff --check` passes.
- A scoped search confirms there is no user-facing OpenSpeak, Pronounce, pronunciation-coach, Azure Speech, microphone-assessment, or phoneme-scoring surface in active frontend runtime code.
- Existing unrelated lint failures are reported honestly; this issue does not broaden into unrelated lint repair.

## Acceptance Criteria Mapping

- **No user-facing legacy copy:** the prior branding cleanup is retained and the remaining dead pronunciation pages are deleted.
- **Legacy routes removed or parked:** obsolete pages and their supporting implementation are deleted; no experimental route remains.
- **MVP-only navigation:** the existing four-route `App.jsx` and four-tab `TabBar.jsx` contract is locked by a regression test.
- **Tests and manifests align with Gramio:** product-boundary tests cover both manifest sources and the removal contract.
- **Future pronunciation scope is separate:** no old implementation is preserved; future work must begin from a separate product decision.

## Delivery

Implementation will be developed on `codex/issue-29-full-cleanup`, reviewed against this design, and submitted in a pull request containing `Closes #29`. Merging that pull request into `dev` will close the issue.
