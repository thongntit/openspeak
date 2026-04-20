import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  getWords,
  getCollections,
  getCollectionWords,
  ApiError,
} from '../services/openspeakApi';

function formatError(err) {
  if (err instanceof ApiError) {
    return err.body?.message || err.message || `HTTP ${err.status}`;
  }
  return err?.message || 'Unknown error';
}

export const useWordsStore = create(
  persist(
    (set, get) => ({
      words: [],
      wordsTotal: 0,
      wordsLoading: false,
      wordsError: null,

      collections: [],
      collectionsLoading: false,
      collectionsError: null,

      collectionWords: {},

      fetchWords: async (params = {}) => {
        set({ wordsLoading: true, wordsError: null });
        try {
          const res = await getWords(params);
          set({
            words: res.data,
            wordsTotal: res.total,
            wordsLoading: false,
          });
          return res;
        } catch (err) {
          set({ wordsError: formatError(err), wordsLoading: false });
          const cached = get().words;
          if (cached.length > 0) return { data: cached, total: cached.length };
          throw err;
        }
      },

      fetchCollections: async (params = {}) => {
        set({ collectionsLoading: true, collectionsError: null });
        try {
          const res = await getCollections(params);
          set({ collections: res.data, collectionsLoading: false });
          return res;
        } catch (err) {
          set({
            collectionsError: formatError(err),
            collectionsLoading: false,
          });
          const cached = get().collections;
          if (cached.length > 0) return { data: cached, total: cached.length };
          throw err;
        }
      },

      fetchCollectionWords: async (collectionId, params = {}) => {
        try {
          const res = await getCollectionWords(collectionId, params);
          set((state) => ({
            collectionWords: {
              ...state.collectionWords,
              [collectionId]: res.data,
            },
          }));
          return res;
        } catch (err) {
          const cached = get().collectionWords[collectionId];
          if (cached) return { data: cached, total: cached.length };
          throw err;
        }
      },

      clearCache: () =>
        set({
          words: [],
          wordsTotal: 0,
          collections: [],
          collectionWords: {},
          wordsError: null,
          collectionsError: null,
        }),
    }),
    {
      name: 'openspeak-words-cache',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        words: state.words,
        wordsTotal: state.wordsTotal,
        collections: state.collections,
        collectionWords: state.collectionWords,
      }),
    },
  ),
);
