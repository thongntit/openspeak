import type { IQuotaStore, QuotaEntry } from '../../types/storage.ts';

export class InMemoryQuotaStore implements IQuotaStore {
  private store = new Map<string, QuotaEntry>();

  async get(key: string): Promise<QuotaEntry | null> {
    return this.store.get(key) ?? null;
  }

  async set(key: string, entry: QuotaEntry): Promise<void> {
    this.store.set(key, entry);
  }
}
