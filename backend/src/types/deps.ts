import type { IQuotaStore } from './storage.ts';

// Passed from index.ts (composition root) into every route handler
export interface AppDeps {
  quotaStore: IQuotaStore;
}
