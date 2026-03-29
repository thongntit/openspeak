import { describe, test, expect, beforeEach } from 'bun:test';
import { InMemoryQuotaStore } from './memory.ts';

describe('InMemoryQuotaStore', () => {
  let store: InMemoryQuotaStore;

  beforeEach(() => {
    store = new InMemoryQuotaStore();
  });

  test('get returns null for unknown key', async () => {
    const result = await store.get('nonexistent');
    expect(result).toBeNull();
  });

  test('set then get returns the entry', async () => {
    const entry = { count: 5, resetAt: Date.now() + 86_400_000 };
    await store.set('session-1', entry);
    const result = await store.get('session-1');
    expect(result).toEqual(entry);
  });

  test('overwrites existing entry', async () => {
    await store.set('session-1', { count: 1, resetAt: Date.now() + 86_400_000 });
    await store.set('session-1', { count: 99, resetAt: Date.now() + 86_400_000 });
    const result = await store.get('session-1');
    expect(result!.count).toBe(99);
  });

  test('get auto-resets when resetAt has passed', async () => {
    const pastResetAt = Date.now() - 1000; // 1 second in the past
    await store.set('session-1', { count: 10, resetAt: pastResetAt });

    const result = await store.get('session-1');

    expect(result!.count).toBe(0);
    expect(result!.resetAt).toBeGreaterThan(Date.now());
  });

  test('get does not reset when resetAt is in the future', async () => {
    const futureResetAt = Date.now() + 86_400_000;
    await store.set('session-1', { count: 7, resetAt: futureResetAt });

    const result = await store.get('session-1');

    expect(result!.count).toBe(7);
    expect(result!.resetAt).toBe(futureResetAt);
  });
});
