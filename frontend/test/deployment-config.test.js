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
const frontendWorkflowPath = new URL(
  '../../.github/workflows/ci-frontend.yml',
  import.meta.url,
);
const readWorkflow = (path) =>
  existsSync(path) ? readFileSync(path, 'utf8') : '';
const prWorkflow = readWorkflow(prWorkflowPath);
const deployWorkflow = readWorkflow(deployWorkflowPath);
const frontendWorkflow = readWorkflow(frontendWorkflowPath);
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
    /name: Run migrations on ephemeral CI database\s+run: npm run migration:run/,
  );
  assert.doesNotMatch(prWorkflow, /run: npm run migration:run:prod/);
  assert.doesNotMatch(prWorkflow, /run: npm run build$/m);
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

test('backend deploy workflow publishes latest only from main', () => {
  assert.match(
    deployWorkflow,
    /type=raw,value=latest,enable=\$\{\{ github\.ref == 'refs\/heads\/main' \}\}/,
  );
  assert.doesNotMatch(deployWorkflow, /enable=\{\{is_default_branch\}\}/);
});

test('frontend PR workflow runs deployment config regression tests', () => {
  assert.match(
    frontendWorkflow,
    /run: node --test test\/deployment-config\.test\.js/,
  );
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
