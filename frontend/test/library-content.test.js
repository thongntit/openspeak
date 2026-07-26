import assert from 'node:assert/strict';
import test from 'node:test';

import {
  filterLibraryDecks,
  loadAllContentDecks,
} from '../src/lib/libraryContent.js';

test('loadAllContentDecks follows every page', async () => {
  const offsets = [];
  const decks = await loadAllContentDecks(async ({ limit, offset }) => {
    offsets.push(offset);
    return {
      data: [{ id: `deck-${offset}` }],
      total: 101,
      limit,
      offset,
      hasNext: offset === 0,
      hasPrev: offset > 0,
    };
  });

  assert.deepEqual(offsets, [0, 100]);
  assert.deepEqual(decks.map((deck) => deck.id), ['deck-0', 'deck-100']);
});

test('loadAllContentDecks rejects a non-advancing next page', async () => {
  await assert.rejects(
    loadAllContentDecks(async () => ({
      data: [],
      total: 1,
      limit: 100,
      offset: 0,
      hasNext: true,
      hasPrev: false,
    })),
    /Content deck pagination did not advance/,
  );
});

test('loadAllContentDecks rejects a zero page limit that cannot advance', async () => {
  let requests = 0;

  await assert.rejects(
    loadAllContentDecks(async () => {
      requests += 1;
      if (requests > 1) {
        throw new Error('A non-advancing page must not be fetched twice');
      }

      return {
        data: [{ id: 'deck-0' }],
        total: 1,
        limit: 0,
        offset: 0,
        hasNext: true,
        hasPrev: false,
      };
    }),
    /Content deck pagination did not advance/,
  );
});

test('filterLibraryDecks supports all content types', () => {
  const decks = [
    { id: 'v', type: 'vocab' },
    { id: 'g', type: 'grammar' },
    { id: 't', type: 'tip' },
  ];

  assert.equal(filterLibraryDecks(decks, 'all').length, 3);
  assert.deepEqual(filterLibraryDecks(decks, 'grammar'), [decks[1]]);
});
