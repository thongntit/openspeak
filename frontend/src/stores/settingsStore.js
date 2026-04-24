import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSettingsStore = create(
  persist(
    (_set) => ({}),
    { name: 'openspeak-settings' }
  )
);
