import { describe, test, expect, beforeEach } from 'bun:test';
import { QuotaService } from './quota.ts';
import { InMemoryQuotaStore } from './storage/memory.ts';

describe('QuotaService', () => {
  let store: InMemoryQuotaStore;
  let quotaService: QuotaService;

  beforeEach(() => {
    store = new InMemoryQuotaStore();
    quotaService = new QuotaService(store, 15);
  });

  describe('get()', () => {
    test('returns zero usage for unknown session', async () => {
      const result = await quotaService.get('new-session');
      expect(result.used).toBe(0);
      expect(result.limit).toBe(15);
      expect(result.resetAt).toBeGreaterThan(Date.now());
    });

    test('returns current count after some requests', async () => {
      await quotaService.checkAndIncrement('session-1');
      await quotaService.checkAndIncrement('session-1');
      const result = await quotaService.get('session-1');
      expect(result.used).toBe(2);
    });
  });

  describe('checkAndIncrement()', () => {
    test('first request is allowed', async () => {
      const result = await quotaService.checkAndIncrement('session-1');
      expect(result.allowed).toBe(true);
      expect(result.used).toBe(1);
      expect(result.limit).toBe(15);
    });

    test('second request is still allowed', async () => {
      await quotaService.checkAndIncrement('session-1');
      const result = await quotaService.checkAndIncrement('session-1');
      expect(result.allowed).toBe(true);
      expect(result.used).toBe(2);
    });

    test('respects configured limit — last allowed request', async () => {
      const service = new QuotaService(store, 3);
      await service.checkAndIncrement('session-1'); // 1
      await service.checkAndIncrement('session-1'); // 2
      const result = await service.checkAndIncrement('session-1'); // 3
      expect(result.allowed).toBe(true);
      expect(result.used).toBe(3);
    });

    test('blocks when limit is reached', async () => {
      const service = new QuotaService(store, 2);
      await service.checkAndIncrement('session-1'); // 1
      await service.checkAndIncrement('session-1'); // 2
      const result = await service.checkAndIncrement('session-1'); // 3 — over limit
      expect(result.allowed).toBe(false);
      expect(result.used).toBe(2);
    });

    test('does not increment when blocked', async () => {
      const service = new QuotaService(store, 1);
      await service.checkAndIncrement('session-1'); // count = 1
      await service.checkAndIncrement('session-1'); // blocked, count still 1
      const result = await service.get('session-1');
      expect(result.used).toBe(1);
    });

    test('each session has independent quota', async () => {
      await quotaService.checkAndIncrement('session-a'); // 1
      await quotaService.checkAndIncrement('session-a'); // 2
      const result = await quotaService.get('session-b');
      expect(result.used).toBe(0);
    });

    test('resetAt is set to next midnight UTC', async () => {
      const result = await quotaService.checkAndIncrement('session-1');
      const msInDay = 86_400_000;
      // resetAt should be at or before tomorrow midnight
      const tomorrowMidnight = Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth(),
        new Date().getUTCDate() + 1,
      );
      expect(result.resetAt).toBe(tomorrowMidnight);
    });
  });
});
