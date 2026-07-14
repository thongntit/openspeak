import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

const combinedWorkflowPath = new URL(
  '../../.github/workflows/ci-backend.yml',
  import.meta.url,
);
const prWorkflowPath = new URL(
  '../../.github/workflows/ci-backend-pr.yml',
  import.meta.url,
);
const deployWorkflowPath = new URL(
  '../../.github/workflows/deploy-backend.yml',
  import.meta.url,
);
const readWorkflow = (path) =>
  existsSync(path) ? readFileSync(path, 'utf8') : '';
const prWorkflow = readWorkflow(prWorkflowPath);
const deployWorkflow = readWorkflow(deployWorkflowPath);
const apiService = readFileSync(
  new URL('../src/services/openspeakApi.js', import.meta.url),
  'utf8',
);
const backendPackage = JSON.parse(
  readFileSync(new URL('../../backend/package.json', import.meta.url), 'utf8'),
);
const dataSource = readFileSync(
  new URL('../../backend/src/data-source.ts', import.meta.url),
  'utf8',
);
const migrationFiles = readdirSync(
  new URL('../../backend/src/database/migrations/', import.meta.url),
);

test('backend workflow has isolated branch deployment hooks', () => {
  assert.match(deployWorkflow, /COOLIFY_DEV_WEBHOOK_URL/);
  assert.match(deployWorkflow, /COOLIFY_PROD_WEBHOOK_URL/);
  assert.match(deployWorkflow, /github\.ref == 'refs\/heads\/dev'/);
  assert.match(deployWorkflow, /github\.ref == 'refs\/heads\/main'/);
  assert.doesNotMatch(deployWorkflow, /secrets\.COOLIFY_WEBHOOK_URL/);
});

test('backend PR workflow contains validation only', () => {
  assert.equal(existsSync(combinedWorkflowPath), false);
  assert.equal(existsSync(prWorkflowPath), true);
  assert.match(prWorkflow, /pull_request:/);
  assert.doesNotMatch(prWorkflow, /\n {2}push:/);
  assert.match(prWorkflow, /POSTGRES_DB: openspeak_test/);
  assert.match(
    prWorkflow,
    /name: Build production backend\s+run: npm run build/,
  );
  assert.match(
    prWorkflow,
    /name: Rehearse production migrations on ephemeral CI database\s+run: npm run migration:run:prod/,
  );
  assert.match(
    prWorkflow,
    /name: Verify learning content integration\s+run: npm run test:e2e -- --runInBand learning-content-seed\.e2e-spec\.ts/,
  );

  const unitTestsIndex = prWorkflow.indexOf('name: Unit tests');
  const buildIndex = prWorkflow.indexOf('name: Build production backend');
  const migrationIndex = prWorkflow.indexOf(
    'name: Rehearse production migrations on ephemeral CI database',
  );
  const seedIndex = prWorkflow.indexOf(
    'name: Rehearse learning content seed twice',
  );
  const integrationIndex = prWorkflow.indexOf(
    'name: Verify learning content integration',
  );
  const generalE2eIndex = prWorkflow.indexOf('name: E2E tests');
  assert.ok(unitTestsIndex >= 0);
  assert.ok(unitTestsIndex < buildIndex);
  assert.ok(buildIndex < migrationIndex);
  assert.ok(migrationIndex < seedIndex);
  assert.ok(seedIndex < integrationIndex);
  assert.ok(integrationIndex < generalE2eIndex);

  const seedRehearsal = prWorkflow.match(
    /name: Rehearse learning content seed twice\s+run: \|([\s\S]*?)(?=\n {6}- name:)/,
  )?.[1];
  assert.ok(seedRehearsal);
  assert.equal(
    seedRehearsal.match(/npm run seed:learning:prod/g)?.length,
    2,
  );
  assert.doesNotMatch(prWorkflow, /run: npm run migration:run$/m);
  assert.doesNotMatch(prWorkflow, /docker\/build-push-action/);
  assert.doesNotMatch(prWorkflow, /COOLIFY_/);
});

test('backend deploy workflow builds and deploys pushes only', () => {
  assert.equal(existsSync(deployWorkflowPath), true);
  assert.match(deployWorkflow, /push:/);
  assert.doesNotMatch(deployWorkflow, /pull_request:/);

  const publishJob = deployWorkflow.match(
    /publish-backend-image:[\s\S]*?(?=\n {2}deploy-dev:)/,
  )?.[0];
  assert.ok(publishJob);
  assert.match(publishJob, /docker\/build-push-action@v5/);
  assert.doesNotMatch(deployWorkflow, /POSTGRES_DB:/);
  assert.doesNotMatch(deployWorkflow, /npm run (lint|test|migration)/);
});

test('TypeORM migration directory contains migration files only', () => {
  assert.deepEqual(
    migrationFiles.filter((file) => file.endsWith('.spec.ts')),
    [],
  );
});

test('frontend API default points to production Gramio backend', () => {
  assert.match(apiService, /https:\/\/gramio-api\.thongnt\.dev\/api/);
  assert.doesNotMatch(apiService, /openspeak-api\.thongnt\.dev/);
});

test('production image exposes compiled migration and seed commands', () => {
  assert.equal(
    backendPackage.scripts['migration:run:prod'],
    'typeorm migration:run -d dist/data-source.js',
  );
  assert.equal(
    backendPackage.scripts['seed:prod'],
    'node dist/database/seeds/seed.js',
  );
  assert.match(dataSource, /__dirname/);
  assert.doesNotMatch(dataSource, /entities: \['src\//);
  assert.doesNotMatch(dataSource, /migrations: \['src\//);
});
