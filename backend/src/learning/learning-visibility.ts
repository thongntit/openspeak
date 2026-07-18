/**
 * Shared visibility rule for learning cards. Keep Today and review submission
 * aligned: a card is available only through an active enrollment, active card,
 * and published deck.
 */
export const LEARNING_VISIBILITY_CONDITION =
  'enrollment.is_active = true AND card.is_active = true AND deck.is_published = true';
