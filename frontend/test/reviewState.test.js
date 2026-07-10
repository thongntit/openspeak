import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createInitialReviewState,
  getDueCardIds,
  rateCard,
  reconcileReviewState,
  summarizeDue,
} from '../src/lib/reviewState.js';

const NOW = new Date('2026-07-11T00:00:00.000Z');
const CARDS = [
  { id: 'c1', deckId: 'd1', type: 'vocab', stage: 'review' },
  { id: 'c2', deckId: 'd2', type: 'grammar', stage: 'learning' },
  { id: 'c3', deckId: 'd2', type: 'grammar', stage: 'review' },
];
const DECKS = [
  { id: 'd1', type: 'vocab' },
  { id: 'd2', type: 'grammar' },
];

test('creates due review state for every starter card', () => {
  assert.deepEqual(createInitialReviewState(CARDS, NOW), {
    c1: { stage: 'review', dueAt: NOW.toISOString(), lastRating: null },
    c2: { stage: 'learning', dueAt: NOW.toISOString(), lastRating: null },
    c3: { stage: 'review', dueAt: NOW.toISOString(), lastRating: null },
  });
});

test('returns due card ids in stable content order', () => {
  const state = createInitialReviewState(CARDS, NOW);
  state.c2.dueAt = '2026-07-11T00:01:00.000Z';

  assert.deepEqual(getDueCardIds(state, CARDS, NOW), ['c1', 'c3']);
});

test('applies the interval and stage for every review rating', () => {
  const initial = createInitialReviewState(CARDS, NOW);
  const cases = [
    ['again', 'learning', '2026-07-11T00:00:00.000Z'],
    ['hard', 'learning', '2026-07-11T00:06:00.000Z'],
    ['good', 'review', '2026-07-12T00:00:00.000Z'],
    ['easy', 'review', '2026-07-15T00:00:00.000Z'],
  ];

  for (const [rating, stage, dueAt] of cases) {
    const next = rateCard(initial, 'c1', rating, NOW);
    assert.deepEqual(next.c1, { stage, dueAt, lastRating: rating });
    assert.notEqual(next, initial);
    assert.deepEqual(initial.c1, {
      stage: 'review',
      dueAt: NOW.toISOString(),
      lastRating: null,
    });
  }
});

test('summarizes due and learning cards by type and deck', () => {
  const state = createInitialReviewState(CARDS, NOW);
  state.c3.dueAt = '2026-07-12T00:00:00.000Z';

  assert.deepEqual(summarizeDue(state, CARDS, DECKS, NOW), {
    total: 2,
    learning: 1,
    byType: { vocab: 1, grammar: 1, tip: 0 },
    byDeck: { d1: 1, d2: 1 },
  });
});

test('reconciles saved data with current content and drops stale ids', () => {
  const saved = {
    c1: {
      stage: 'review',
      dueAt: '2026-07-12T00:00:00.000Z',
      lastRating: 'good',
    },
    removed: {
      stage: 'review',
      dueAt: '2026-07-12T00:00:00.000Z',
      lastRating: 'good',
    },
  };

  assert.deepEqual(reconcileReviewState(saved, CARDS, NOW), {
    c1: saved.c1,
    c2: { stage: 'learning', dueAt: NOW.toISOString(), lastRating: null },
    c3: { stage: 'review', dueAt: NOW.toISOString(), lastRating: null },
  });
});

test('replaces malformed saved card state with starter state', () => {
  const saved = {
    c1: { stage: 'broken', dueAt: 'not-a-date', lastRating: 'unknown' },
  };

  assert.deepEqual(reconcileReviewState(saved, [CARDS[0]], NOW), {
    c1: { stage: 'review', dueAt: NOW.toISOString(), lastRating: null },
  });
});

test('returns an empty queue when every card is scheduled later', () => {
  const state = createInitialReviewState(CARDS, NOW);
  for (const value of Object.values(state)) {
    value.dueAt = '2026-07-12T00:00:00.000Z';
  }

  assert.deepEqual(getDueCardIds(state, CARDS, NOW), []);
});
