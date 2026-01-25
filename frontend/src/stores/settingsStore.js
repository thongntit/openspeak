import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSettingsStore = create(
  persist(
    (set) => ({
      azureApiKey: '',
      azureRegion: '',
      
      setAzureApiKey: (key) => set({ azureApiKey: key }),
      setAzureRegion: (region) => set({ azureRegion: region }),
      
      clearSettings: () => set({ azureApiKey: '', azureRegion: '' }),
      
      hasSettings: () => {
        const state = useSettingsStore.getState();
        return !!state.azureApiKey && !!state.azureRegion;
      },
    }),
    {
      name: 'pronounce-settings',
    }
  )
);
