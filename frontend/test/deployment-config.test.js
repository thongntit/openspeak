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
