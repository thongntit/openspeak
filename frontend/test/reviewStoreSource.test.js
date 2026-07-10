import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const STORE_PATH = new URL('../src/stores/reviewStore.js', import.meta.url);

test('persists only versioned review progress and reconciles on hydration', async () => {
  const source = await readFile(STORE_PATH, 'utf8');

  assert.match(source, /persist\s*\(/);
  assert.match(source, /name:\s*['"]gramio-review-progress['"]/);
  assert.match(source, /version:\s*1/);
  assert.match(source, /partialize:\s*\(state\)/);
  assert.match(source, /reviewByCardId:\s*state\.reviewByCardId/);
  assert.match(source, /merge:\s*\(persistedState, currentState\)/);
  assert.match(source, /reconcileReviewState\(/);
});
