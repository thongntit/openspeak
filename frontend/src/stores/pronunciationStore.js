import { create } from 'zustand';

// Practice screen state machine: idle → recording → assessing → result.
// `error` is orthogonal and can co-exist with any state.
export const usePronunciationStore = create((set) => ({
  state: 'idle',
  result: null,
  error: null,

  setState: (next) => set({ state: next }),
  setResult: (result) => set({ result, error: null, state: 'result' }),
  setError: (error) => set({ error }),
  reset: () => set({ state: 'idle', result: null, error: null }),
}));
