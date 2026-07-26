import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Library from '@/pages/Library';
import {
  enrollDeck,
  getContentDeckCards,
  getContentDecks,
} from '@/services/openspeakApi';
import { useLearningStore } from '@/stores/learningStore';

const clerk = vi.hoisted(() => ({
  getToken: vi.fn().mockResolvedValue('fresh-token'),
}));

vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ getToken: clerk.getToken }),
}));

vi.mock('@/services/openspeakApi', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    enrollDeck: vi.fn(),
    getContentDeckCards: vi.fn(),
    getContentDecks: vi.fn(),
  };
});

const DECK = {
  id: '22222222-2222-4222-8222-222222222222',
  slug: 'articles-a-an-the',
  name: 'Articles: a, an, and the',
  description: 'Choose English articles naturally.',
  type: 'grammar',
  level: 'beginner',
  cardCount: 20,
  isLearning: false,
};

const CARD = {
  id: '33333333-3333-4333-8333-333333333333',
  contentKey: 'articles-001',
  type: 'grammar',
  level: 'beginner',
  front: 'She is ___ honest person.',
  answer: 'an',
  explanation: 'Use an before a vowel sound.',
  example: null,
  options: ['a', 'an', 'the'],
};

const TODAY = {
  queue: [],
  totalDue: 20,
  countsByType: { grammar: 20 },
  countsByDeck: { [DECK.id]: 20 },
  caughtUp: false,
  serverTimestamp: '2026-07-27T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  useLearningStore.getState().resetLearning();
  getContentDecks.mockResolvedValue({
    data: [DECK],
    total: 1,
    limit: 100,
    offset: 0,
    hasNext: false,
    hasPrev: false,
  });
  getContentDeckCards.mockResolvedValue({
    data: [CARD],
    total: 1,
    limit: 50,
    offset: 0,
    hasNext: false,
    hasPrev: false,
  });
  enrollDeck.mockResolvedValue({
    deckId: DECK.id,
    isLearning: true,
    enrolledCardCount: 20,
    today: TODAY,
  });
});

describe('Library enrollment propagation', () => {
  it('keeps a learned deck marked Learning when returning to its detail', async () => {
    const user = userEvent.setup();
    render(<Library />);

    await user.click(await screen.findByText(DECK.name));
    await user.click(screen.getByRole('button', { name: /learn deck/i }));
    expect(
      await screen.findByRole('button', { name: /^learning$/i }),
    ).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /back to library/i }));
    await user.click(screen.getByText(DECK.name));

    expect(
      screen.getByRole('button', { name: /^learning$/i }),
    ).toBeDisabled();
    expect(enrollDeck).toHaveBeenCalledOnce();
  });
});
