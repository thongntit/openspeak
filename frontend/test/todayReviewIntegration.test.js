import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const TODAY_PATH = new URL('../src/pages/Today.jsx', import.meta.url);
const REVIEW_PATH = new URL('../src/pages/Review.jsx', import.meta.url);

test('Today derives the review queue from persisted card progress', async () => {
  const source = await readFile(TODAY_PATH, 'utf8');

  assert.match(source, /useReviewStore/);
  assert.match(source, /selectDueCardIds/);
  assert.match(source, /selectDueSummary/);
  assert.doesNotMatch(source, /\btotalDue\b/);
  assert.doesNotMatch(source, /\btotalNew\b/);
  assert.doesNotMatch(source, /\bdueByType\b/);
  assert.match(source, /navigate\(['"]\/review['"],\s*{\s*state:\s*{\s*queueIds/);
  assert.match(source, /All caught up/);
});

test('Review persists each rating and returns to Today deterministically', async () => {
  const source = await readFile(REVIEW_PATH, 'utf8');

  assert.match(source, /useReviewStore/);
  assert.match(source, /state\?\.queueIds/);
  assert.match(source, /rateCard\(card\.id,\s*id\)/);
  assert.match(source, /navigate\(['"]\/['"]\)/);
  assert.doesNotMatch(source, /navigate\(-1\)/);
});

test('Review keeps long card content scrollable above reachable rating controls', async () => {
  const source = await readFile(REVIEW_PATH, 'utf8');

  assert.match(source, /h-full overflow-y-auto rounded-\[22px\]/);
  assert.doesNotMatch(source, /min-h-full rounded-\[22px\]/);
});
