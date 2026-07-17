# Issue #29 Pronunciation Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the unreachable pronunciation-first frontend implementation and Azure Speech dependency while locking Gramio to its four MVP surfaces.

**Architecture:** Preserve the current `App.jsx` and `TabBar.jsx` product boundary, delete the dead feature tree behind the former practice/progress experience, and enforce the boundary with a static `node:test` contract. Keep active backend-health compatibility identifiers and operational infrastructure unchanged.

**Tech Stack:** React 19, React Router 7, Bun, Vite, Node-compatible `node:test` and `node:assert`.

## Global Constraints

- Active application surfaces remain exactly Today, Review, Library, and Profile.
- Delete the old pronunciation implementation; do not archive or feature-flag it.
- Do not rename `openspeakApi.js`, `VITE_OPENSPEAK_API_URL`, persisted browser-storage keys, backend APIs, databases, container images, or deployment resources.
- Do not add TypeScript or a new test framework.
- Use `apply_patch` for source-file creation, edits, and deletion; use Bun only for dependency and lockfile maintenance.
- Do not fix unrelated lint behavior in `Library.jsx` as part of issue #29.

---

### Task 1: Lock and remove the legacy pronunciation runtime

**Files:**
- Create: `frontend/test/product-scope.test.js`
- Delete: `frontend/src/pages/Home.jsx`
- Delete: `frontend/src/pages/Practice.jsx`
- Delete: `frontend/src/pages/Progress.jsx`
- Delete: `frontend/src/stores/pronunciationStore.js`
- Delete: `frontend/src/services/azureSpeech.js`
- Delete: `frontend/src/services/wordService.js`
- Delete: `frontend/src/components/ui/PhonemeChip.jsx`
- Delete: `frontend/src/lib/score.js`
- Modify: `frontend/package.json`
- Modify: `frontend/bun.lock`
- Modify: `frontend/.env.example`

**Interfaces:**
- Consumes: the route JSX in `frontend/src/App.jsx`, tab declarations in `frontend/src/components/TabBar.jsx`, both PWA manifest sources, and the existing Bun dependency graph.
- Produces: a repository-level product contract in `frontend/test/product-scope.test.js`; a frontend source tree with no pronunciation runtime; a dependency graph with no Azure Speech SDK.

- [ ] **Step 1: Write the failing product-boundary test**

Create `frontend/test/product-scope.test.js` with this exact content:

```js
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const read = (relativePath) =>
  readFileSync(new URL(relativePath, import.meta.url), 'utf8');

const appSource = read('../src/App.jsx');
const tabBarSource = read('../src/components/TabBar.jsx');
const frontendPackage = JSON.parse(read('../package.json'));
const bunLock = read('../bun.lock');
const envExample = read('../.env.example');
const staticManifest = JSON.parse(
  read('../public/assets/manifest.webmanifest'),
);
const viteConfig = read('../vite.config.mjs');

const legacyRuntimeFiles = [
  '../src/pages/Home.jsx',
  '../src/pages/Practice.jsx',
  '../src/pages/Progress.jsx',
  '../src/stores/pronunciationStore.js',
  '../src/services/azureSpeech.js',
  '../src/services/wordService.js',
  '../src/components/ui/PhonemeChip.jsx',
  '../src/lib/score.js',
];

test('registered routes and tabs expose only Gramio MVP surfaces', () => {
  const routes = [...appSource.matchAll(/<Route\b[^>]*\bpath="([^"]+)"/gs)]
    .map((match) => match[1]);
  const tabs = [
    ...tabBarSource.matchAll(/\{\s*to: '([^']+)',\s*label: '([^']+)'/g),
  ].map((match) => ({ to: match[1], label: match[2] }));

  assert.deepEqual(routes, ['/', '/review', '/library', '/profile']);
  assert.deepEqual(tabs, [
    { to: '/', label: 'Today' },
    { to: '/review', label: 'Review' },
    { to: '/library', label: 'Library' },
    { to: '/profile', label: 'Profile' },
  ]);
});

test('legacy pronunciation runtime files are absent', () => {
  const remainingFiles = legacyRuntimeFiles.filter((relativePath) =>
    existsSync(new URL(relativePath, import.meta.url)),
  );

  assert.deepEqual(remainingFiles, []);
});

test('frontend dependency graph excludes Azure Speech', () => {
  assert.equal(
    frontendPackage.dependencies?.['microsoft-cognitiveservices-speech-sdk'],
    undefined,
  );
  assert.doesNotMatch(bunLock, /microsoft-cognitiveservices-speech-sdk/);
});

test('environment template excludes Azure Speech configuration', () => {
  assert.doesNotMatch(envExample, /VITE_AZURE_SPEECH_(KEY|REGION)/);
});

test('both PWA manifest sources describe Gramio', () => {
  assert.equal(staticManifest.name, 'Gramio');
  assert.equal(staticManifest.short_name, 'Gramio');
  assert.match(staticManifest.description, /grammar and vocabulary/i);
  assert.match(viteConfig, /name: 'Gramio'/);
  assert.match(viteConfig, /short_name: 'Gramio'/);
  assert.match(viteConfig, /grammar and vocabulary/i);
});
```

- [ ] **Step 2: Run the new test and verify the RED state**

Run from `frontend`:

```bash
bun test test/product-scope.test.js
```

Expected: the route/tab and manifest tests pass; the legacy-file, Azure dependency, and Azure environment tests fail because the cleanup has not happened yet. If the command errors for syntax or path resolution instead, fix the test and rerun until it fails only for those three expected product-boundary violations.

- [ ] **Step 3: Delete the eight dead runtime modules**

Use `apply_patch` delete-file patches for every file in `legacyRuntimeFiles`. Do not replace them with redirects, stubs, archives, or experimental modules.

- [ ] **Step 4: Remove the Azure Speech dependency with Bun**

Run from `frontend`:

```bash
bun remove microsoft-cognitiveservices-speech-sdk
```

Expected: `frontend/package.json` no longer lists the SDK and `frontend/bun.lock` no longer contains its package entry or Azure-only transitive dependency entries that are not required elsewhere.

- [ ] **Step 5: Remove Azure Speech example configuration**

Use `apply_patch` to delete only these lines from `frontend/.env.example`:

```dotenv
# Azure Speech Service (required for pronunciation assessment)
# VITE_AZURE_SPEECH_KEY=your_azure_speech_key_here
# VITE_AZURE_SPEECH_REGION=your_azure_region_here
```

Keep `VITE_OPENSPEAK_API_URL` and the remaining Gramio/database comments unchanged.

- [ ] **Step 6: Run the focused test and verify the GREEN state**

Run from `frontend`:

```bash
bun test test/product-scope.test.js
```

Expected: 5 tests pass and 0 fail.

- [ ] **Step 7: Run full frontend verification**

Run from `frontend`:

```bash
bun test
bun run build
bun run lint
```

Expected: all tests pass and the production build succeeds. Lint may remain nonzero only for the pre-existing `react-hooks/set-state-in-effect` finding in `src/pages/Library.jsx`; the deleted `Practice.jsx` lint findings must disappear.

Run from the repository root:

```bash
git diff --check
rg -n -i "VITE_AZURE_SPEECH|microsoft-cognitiveservices-speech-sdk|assessPronunciation|PronunciationAssessment|PhonemeChip|pronunciationStore|azureSpeech" frontend/src frontend/package.json frontend/.env.example frontend/bun.lock
```

Expected: `git diff --check` exits successfully and the scoped search returns no matches.

- [ ] **Step 8: Commit the complete implementation**

Stage only the test, dependency/config updates, and deleted runtime files, then commit:

```bash
git add frontend/test/product-scope.test.js frontend/package.json frontend/bun.lock frontend/.env.example frontend/src/pages/Home.jsx frontend/src/pages/Practice.jsx frontend/src/pages/Progress.jsx frontend/src/stores/pronunciationStore.js frontend/src/services/azureSpeech.js frontend/src/services/wordService.js frontend/src/components/ui/PhonemeChip.jsx frontend/src/lib/score.js
git commit -m "refactor(frontend): remove legacy pronunciation runtime"
```

Expected: the commit contains only issue #29 implementation files. The previously committed design and plan remain separate documentation commits.

---

### Task 2: Verify issue #29 completion and prepare delivery

**Files:**
- Read: `docs/superpowers/specs/2026-07-17-issue-29-pronunciation-cleanup-design.md`
- Read: `frontend/test/product-scope.test.js`
- Read: all files changed or deleted by Task 1

**Interfaces:**
- Consumes: Task 1's green test contract and cleaned frontend dependency graph.
- Produces: review evidence that each issue #29 acceptance criterion is satisfied and a pull request ready to close the issue.

- [ ] **Step 1: Review the implementation against the approved spec**

Confirm each acceptance-criteria mapping in the design has direct evidence in the diff or `product-scope.test.js`. Reject any unrelated backend, deployment, storage-key, or internal API renaming.

- [ ] **Step 2: Re-run completion verification from clean HEAD**

Run from `frontend`:

```bash
bun test
bun run build
```

Run from the repository root:

```bash
git diff --check HEAD^ HEAD
git status --short
```

Expected: tests and build pass, the committed diff has no whitespace errors, and the worktree is clean.

- [ ] **Step 3: Prepare the pull request contract**

Use this PR title:

```text
refactor(frontend): remove legacy pronunciation runtime
```

The PR body must summarize the deleted runtime and dependency, identify the four retained MVP surfaces, report the exact test/build/lint results, and include this closing keyword on its own line:

```text
Closes #29
```

Do not merge until the user explicitly approves the shared-branch merge step.
