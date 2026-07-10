const VALID_STAGES = new Set(['new', 'learning', 'review', 'mastered']);
const RATING_SCHEDULE = {
  again: { delayMs: 0, stage: 'learning' },
  hard: { delayMs: 6 * 60 * 1000, stage: 'learning' },
  good: { delayMs: 24 * 60 * 60 * 1000, stage: 'review' },
  easy: { delayMs: 4 * 24 * 60 * 60 * 1000, stage: 'review' },
};
const VALID_RATINGS = new Set(Object.keys(RATING_SCHEDULE));

function toDate(value) {
  return value instanceof Date ? value : new Date(value);
}

function starterCardState(card, now) {
  return {
    stage: VALID_STAGES.has(card.stage) ? card.stage : 'new',
    dueAt: toDate(now).toISOString(),
    lastRating: null,
  };
}

function isValidSavedCardState(value) {
  if (!value || typeof value !== 'object') return false;
  if (!VALID_STAGES.has(value.stage)) return false;
  if (Number.isNaN(new Date(value.dueAt).getTime())) return false;
  return value.lastRating === null || VALID_RATINGS.has(value.lastRating);
}

export function createInitialReviewState(cards, now = new Date()) {
  return Object.fromEntries(
    cards.map((card) => [card.id, starterCardState(card, now)]),
  );
}

export function reconcileReviewState(saved, cards, now = new Date()) {
  const savedState = saved && typeof saved === 'object' ? saved : {};

  return Object.fromEntries(
    cards.map((card) => {
      const persisted = savedState[card.id];
      return [
        card.id,
        isValidSavedCardState(persisted)
          ? { ...persisted }
          : starterCardState(card, now),
      ];
    }),
  );
}

export function getDueCardIds(reviewState, cards, now = new Date()) {
  const nowMs = toDate(now).getTime();
  return cards
    .filter((card) => {
      const dueAt = reviewState[card.id]?.dueAt;
      return dueAt && new Date(dueAt).getTime() <= nowMs;
    })
    .map((card) => card.id);
}

export function rateCard(reviewState, cardId, rating, now = new Date()) {
  const schedule = RATING_SCHEDULE[rating];
  if (!schedule || !reviewState[cardId]) return reviewState;

  const dueAt = new Date(toDate(now).getTime() + schedule.delayMs).toISOString();
  return {
    ...reviewState,
    [cardId]: {
      stage: schedule.stage,
      dueAt,
      lastRating: rating,
    },
  };
}

export function summarizeDue(reviewState, cards, decks, now = new Date()) {
  const dueIds = new Set(getDueCardIds(reviewState, cards, now));
  const byType = { vocab: 0, grammar: 0, tip: 0 };
  const byDeck = {};

  for (const card of cards) {
    if (!dueIds.has(card.id)) continue;
    byType[card.type] = (byType[card.type] ?? 0) + 1;
    byDeck[card.deckId] = (byDeck[card.deckId] ?? 0) + 1;
  }

  const deckIds = new Set(decks.map((deck) => deck.id));
  const filteredByDeck = Object.fromEntries(
    Object.entries(byDeck).filter(([deckId]) => deckIds.has(deckId)),
  );

  return {
    total: dueIds.size,
    learning: cards.filter(
      (card) => reviewState[card.id]?.stage === 'learning',
    ).length,
    byType,
    byDeck: filteredByDeck,
  };
}
