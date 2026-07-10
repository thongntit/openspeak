import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { CARDS, DECKS } from '@/data/srsData';
import {
  createInitialReviewState,
  getDueCardIds,
  rateCard as rateReviewCard,
  reconcileReviewState,
  summarizeDue,
} from '@/lib/reviewState';

export const useReviewStore = create(
  persist(
    (set) => ({
      reviewByCardId: createInitialReviewState(CARDS),
      rateCard: (cardId, rating, now = new Date()) =>
        set((state) => ({
          reviewByCardId: rateReviewCard(
            state.reviewByCardId,
            cardId,
            rating,
            now,
          ),
        })),
      resetProgress: (now = new Date()) =>
        set({ reviewByCardId: createInitialReviewState(CARDS, now) }),
    }),
    {
      name: 'gramio-review-progress',
      version: 1,
      partialize: (state) => ({
        reviewByCardId: state.reviewByCardId,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        reviewByCardId: reconcileReviewState(
          persistedState?.reviewByCardId,
          CARDS,
        ),
      }),
    },
  ),
);

export const selectDueCardIds = (state, now = new Date()) =>
  getDueCardIds(state.reviewByCardId, CARDS, now);

export const selectDueSummary = (state, now = new Date()) =>
  summarizeDue(state.reviewByCardId, CARDS, DECKS, now);
