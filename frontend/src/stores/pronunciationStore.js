import { create } from 'zustand';

export const usePronunciationStore = create((set) => ({
  isRecording: false,
  isProcessing: false,
  result: null,
  error: null,
  
  setRecording: (isRecording) => set({ isRecording }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  setResult: (result) => set({ result, error: null }),
  setError: (error) => set({ error, result: null }),
  clearResult: () => set({ result: null, error: null }),
}));
