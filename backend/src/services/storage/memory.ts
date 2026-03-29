import type { IQuotaStore, QuotaEntry } from '../../types/storage.ts';

/** Returns the Unix ms timestamp of the next midnight UTC. */
function nextMidnightUTC(): number {
  const now = Date.now();
  // Clear to midnight UTC, then add 1 day
  const midnight = Date.UTC(
    new Date(now).getUTCFullYear(),
    new Date(now).getUTCMonth(),
    new Date(now).getUTCDate(),
  );
  return midnight + 86_400_000; // +1 day in ms
}

export class InMemoryQuotaStore implements IQuotaStore {
  private store = new Map<string, QuotaEntry>();

  async get(key: string): Promise<QuotaEntry | null> {
    const entry = this.store.get(key) ?? null;
    if (!entry) return null;

    // Auto-reset if past resetAt
    if (Date.now() >= entry.resetAt) {
      const fresh: QuotaEntry = { count: 0, resetAt: nextMidnightUTC() };
      this.store.set(key, fresh);
      return fresh;
    }

    return entry;
  }

  async set(key: string, entry: QuotaEntry): Promise<void> {
    this.store.set(key, entry);
  }
}
