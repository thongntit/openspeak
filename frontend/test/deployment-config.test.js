import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync(
  new URL('../../.github/workflows/ci-backend.yml', import.meta.url),
  'utf8',
);
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
  assert.match(workflow, /COOLIFY_DEV_WEBHOOK_URL/);
  assert.match(workflow, /COOLIFY_PROD_WEBHOOK_URL/);
  assert.match(workflow, /github\.ref == 'refs\/heads\/dev'/);
  assert.match(workflow, /github\.ref == 'refs\/heads\/main'/);
  assert.doesNotMatch(workflow, /secrets\.COOLIFY_WEBHOOK_URL/);
});

test('backend CI validates pull requests without blocking push deployments', () => {
  assert.match(workflow, /POSTGRES_DB: openspeak_test/);
  assert.match(
    workflow,
    /backend:[\s\S]*if: github\.event_name == 'pull_request'/,
  );
  assert.match(
    workflow,
    /name: Run migrations on ephemeral CI database\s+run: npm run migration:run/,
  );
  assert.doesNotMatch(workflow, /run: npm run migration:run:prod/);
  assert.doesNotMatch(workflow, /run: npm run build$/m);

  const publishJob = workflow.match(
    /publish-backend-image:[\s\S]*?(?=\n  deploy-dev:)/,
  )?.[0];
  assert.ok(publishJob);
  assert.doesNotMatch(publishJob, /needs: \[backend\]/);
  assert.match(publishJob, /docker\/build-push-action@v5/);
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
