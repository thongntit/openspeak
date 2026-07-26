import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');

test('root entry does not block routes behind a health loader', () => {
  assert.doesNotMatch(source, /AppLoader/);
});
