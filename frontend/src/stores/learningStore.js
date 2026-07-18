import { create } from 'zustand';
import {
  ApiError,
  getToday,
  submitReview,
} from '@/services/openspeakApi';

const INITIAL_STATE = {
  today: null,
  loadStatus: 'idle',
  loadError: null,
  reviewStatus: 'idle',
  reviewError: null,
  pendingReview: null,
};

function toStatusError(error) {
  return {
    status: error?.status ?? 0,
    message: error?.message || 'Request failed',
  };
}

function isRetryable(error) {
  return !error?.status || error.status >= 500;
}

async function requireToken(getToken) {
  const token = await getToken();
  if (!token) {
    throw new ApiError(
      401,
      { message: 'Authentication required' },
      '/auth',
    );
  }
  return token;
}

export const useLearningStore = create((set, get) => ({
  ...INITIAL_STATE,

  loadToday: async (getToken, { signal } = {}) => {
    set({ loadStatus: 'loading', loadError: null });
    try {
      const token = await requireToken(getToken);
      const opts = signal ? { token, signal } : { token };
      const today = await getToday(opts);
      set({ today, loadStatus: 'ready', loadError: null });
      return today;
    } catch (error) {
      if (error?.name === 'AbortError') {
        set((state) => ({
          loadStatus: state.today ? 'ready' : 'idle',
          loadError: null,
        }));
        return null;
      }
      const loadError = toStatusError(error);
      set({
        today: error?.status === 401 ? null : get().today,
        loadStatus: 'error',
        loadError,
      });
      return null;
    }
  },

  replaceToday: (today) => set({
    today,
    loadStatus: 'ready',
    loadError: null,
  }),

  beginReview: (cardId, rating) => {
    const existing = get().pendingReview;
    if (
      existing?.cardId === cardId
      && existing?.rating === rating
    ) {
      return existing;
    }
    if (get().reviewStatus === 'submitting') return existing;

    const pendingReview = {
      cardId,
      rating,
      clientRequestId: crypto.randomUUID(),
      clientReviewedAt: new Date().toISOString(),
    };
    set({
      pendingReview,
      reviewStatus: 'idle',
      reviewError: null,
    });
    return pendingReview;
  },

  submitPendingReview: async (getToken) => {
    const { pendingReview, today } = get();
    if (!pendingReview) return null;

    if (today?.queue?.[0]?.card?.id !== pendingReview.cardId) {
      const reviewError = {
        status: 409,
        message: 'The review session changed. Refresh before rating again.',
      };
      set({
        pendingReview: null,
        reviewStatus: 'error',
        reviewError,
      });
      return null;
    }

    set({ reviewStatus: 'submitting', reviewError: null });
    try {
      const token = await requireToken(getToken);
      const response = await submitReview(pendingReview, { token });
      set({
        today: response.today,
        loadStatus: 'ready',
        loadError: null,
        pendingReview: null,
        reviewStatus: 'idle',
        reviewError: null,
      });
      return response;
    } catch (error) {
      const reviewError = toStatusError(error);
      if (error?.status === 401) {
        set({
          ...INITIAL_STATE,
          loadStatus: 'error',
          loadError: reviewError,
          reviewStatus: 'error',
          reviewError,
        });
      } else if (isRetryable(error)) {
        set({
          reviewStatus: 'retryable-error',
          reviewError,
          pendingReview,
        });
      } else {
        set({
          reviewStatus: 'error',
          reviewError,
          pendingReview: null,
        });
      }
      return null;
    }
  },

  retryPendingReview: (getToken) => get().submitPendingReview(getToken),

  clearReviewError: () => set({ reviewError: null }),

  resetLearning: () => set({ ...INITIAL_STATE }),
}));
