import type { IQuotaStore } from './storage.ts';
import type { QuotaService } from '../services/quota.ts';
import type { assessPronunciation } from '../services/azure.ts';

// Passed from index.ts (composition root) into every route handler
export interface AppDeps {
  quotaStore: IQuotaStore;
  quotaService: QuotaService;
  azureService: { assessPronunciation: typeof assessPronunciation };
}
