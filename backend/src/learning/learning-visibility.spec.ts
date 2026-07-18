import { LEARNING_VISIBILITY_CONDITION } from './learning-visibility';

describe('LEARNING_VISIBILITY_CONDITION', () => {
  it('requires active enrollment and card plus a published deck', () => {
    expect(LEARNING_VISIBILITY_CONDITION).toBe(
      'enrollment.is_active = true AND card.is_active = true AND deck.is_published = true',
    );
  });
});
