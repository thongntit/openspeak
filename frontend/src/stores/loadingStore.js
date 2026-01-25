import { create } from 'zustand';

export const useLoadingStore = create((set) => ({
  isLoading: true,
  progress: 0,
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setProgress: (value) => set({ progress: value }),
  
  incrementProgress: () => set((state) => ({ 
    progress: Math.min(state.progress + 10, 100) 
  })),
  
  completeLoading: () => set({ 
    isLoading: false, 
    progress: 100 
  }),
}));
