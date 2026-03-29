import type { IQuotaStore } from '../types/storage.ts';

export interface QuotaResult {
  allowed: boolean;
  used: number;
  limit: number;
  resetAt: number;
}

export class QuotaService {
  constructor(
    private readonly store: IQuotaStore,
    private readonly limit: number,
  ) {}

  /** Returns usage without incrementing. */
  async get(sessionKey: string): Promise<{ used: number; limit: number; resetAt: number }> {
    const entry = await this.store.get(sessionKey);
    return {
      used: entry?.count ?? 0,
      limit: this.limit,
      resetAt: entry?.resetAt ?? Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth(),
        new Date().getUTCDate() + 1,
      ),
    };
  }

  /**
   * Check if a request is allowed and atomically increment the counter.
   * If the current count < limit, increments and returns allowed=true.
   * If count >= limit, returns allowed=false without incrementing.
   */
  async checkAndIncrement(sessionKey: string): Promise<QuotaResult> {
    const entry = await this.store.get(sessionKey);

    // No entry yet — this is the first request of the day
    if (!entry) {
      const resetAt = this.getNextMidnightUTC();
      await this.store.set(sessionKey, { count: 1, resetAt });
      return { allowed: true, used: 1, limit: this.limit, resetAt };
    }

    if (entry.count >= this.limit) {
      return { allowed: false, used: entry.count, limit: this.limit, resetAt: entry.resetAt };
    }

    entry.count++;
    await this.store.set(sessionKey, entry);
    return { allowed: true, used: entry.count, limit: this.limit, resetAt: entry.resetAt };
  }

  private getNextMidnightUTC(): number {
    const now = Date.now();
    const midnight = Date.UTC(
      new Date(now).getUTCFullYear(),
      new Date(now).getUTCMonth(),
      new Date(now).getUTCDate(),
    );
    return midnight + 86_400_000;
  }
}
