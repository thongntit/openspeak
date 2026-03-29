import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { handleUsage } from './usage.ts';
import type { AppDeps } from '../types/deps.ts';
import { InMemoryQuotaStore } from '../services/storage/memory.ts';
import { QuotaService } from '../services/quota.ts';
import { assessPronunciation } from '../services/azure.ts';
import { signToken } from '../middleware/auth.ts';

const TEST_SECRET = 'test-secret-for-unit-tests-only-32chars!!';
const originalSecret = process.env.JWT_SECRET;

const makeDeps = (limit = 15): AppDeps => ({
  quotaStore: new InMemoryQuotaStore(),
  quotaService: new QuotaService(new InMemoryQuotaStore(), limit),
  azureService: { assessPronunciation },
});

let deps: AppDeps;

beforeAll(() => {
  process.env.JWT_SECRET = TEST_SECRET;
});
afterAll(() => {
  process.env.JWT_SECRET = originalSecret;
});
beforeEach(() => {
  deps = makeDeps(15);
});

async function makeAuthReq(path: string, sessionKey: string): Promise<Response> {
  const token = await signToken(sessionKey);
  return handleUsage(
    new Request(`http://localhost${path}`, {
      headers: { Cookie: `token=${token}` },
    }),
    deps,
  ) as Promise<Response>;
}

describe('GET /api/usage', () => {
  test('returns 401 without cookie', async () => {
    const res = await handleUsage(
      new Request('http://localhost/api/usage'),
      deps,
    ) as Response;
    expect(res.status).toBe(401);
  });

  test('returns 200 with valid cookie', async () => {
    const res = await makeAuthReq('/api/usage', 'session-1');
    expect(res.status).toBe(200);
  });

  test('returns correct { used, limit, resetAt } structure', async () => {
    const res = await makeAuthReq('/api/usage', 'session-1');
    const body = await res.json();
    expect(body).toHaveProperty('used');
    expect(body).toHaveProperty('limit', 15);
    expect(body).toHaveProperty('resetAt');
    expect(body.used).toBe(0);
  });

  test('used increments after pronounces', async () => {
    // simulate pronounces via quota service
    await deps.quotaService.checkAndIncrement('session-2');
    await deps.quotaService.checkAndIncrement('session-2');
    const res = await makeAuthReq('/api/usage', 'session-2');
    const body = await res.json();
    expect(body.used).toBe(2);
  });

  test('different sessions have independent usage', async () => {
    await deps.quotaService.checkAndIncrement('session-a');
    const resA = await makeAuthReq('/api/usage', 'session-a');
    const resB = await makeAuthReq('/api/usage', 'session-b');
    expect((await resA.json()).used).toBe(1);
    expect((await resB.json()).used).toBe(0);
  });

  test('returns null for wrong method', async () => {
    const res = await handleUsage(
      new Request('http://localhost/api/usage', { method: 'POST' }),
      deps,
    );
    expect(res).toBeNull();
  });

  test('returns null for wrong path', async () => {
    const res = await handleUsage(
      new Request('http://localhost/api/not-usage', { method: 'GET' }),
      deps,
    );
    expect(res).toBeNull();
  });
});
