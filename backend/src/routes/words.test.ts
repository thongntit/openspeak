import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { handleWords } from './words.ts';
import type { AppDeps } from '../types/deps.ts';
import { InMemoryQuotaStore } from '../services/storage/memory.ts';
import { QuotaService } from '../services/quota.ts';
import { assessPronunciation } from '../services/azure.ts';
import { signToken } from '../middleware/auth.ts';

const TEST_SECRET = 'test-secret-for-unit-tests-only-32chars!!';
const originalSecret = process.env.JWT_SECRET;
const originalWordsPath = process.env.WORDS_PATH;

let deps: AppDeps;

beforeAll(() => {
  process.env.JWT_SECRET = TEST_SECRET;
});
afterAll(() => {
  process.env.JWT_SECRET = originalSecret;
  process.env.WORDS_PATH = originalWordsPath;
});
beforeEach(() => {
  deps = {
    quotaStore: new InMemoryQuotaStore(),
    quotaService: new QuotaService(new InMemoryQuotaStore(), 15),
    azureService: { assessPronunciation },
  };
  process.env.WORDS_PATH = originalWordsPath; // reset
});

async function makeAuthReq(path: string, sessionKey = 'session-1'): Promise<Response> {
  const token = await signToken(sessionKey);
  return handleWords(
    new Request(`http://localhost${path}`, {
      headers: { Cookie: `token=${token}` },
    }),
    deps,
  ) as Promise<Response>;
}

describe('GET /api/words', () => {
  test('returns 401 without cookie', async () => {
    const res = await handleWords(
      new Request('http://localhost/api/words'),
      deps,
    ) as Response;
    expect(res.status).toBe(401);
  });

  test('returns 200 with valid cookie', async () => {
    process.env.WORDS_PATH = './words.json';
    const res = await makeAuthReq('/api/words');
    expect(res.status).toBe(200);
  });

  test('returns 500 when words.json does not exist', async () => {
    process.env.WORDS_PATH = './nonexistent-words.json';
    const res = await makeAuthReq('/api/words');
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Word database unavailable' });
  });

  test('serves the words.json file as JSON', async () => {
    process.env.WORDS_PATH = './words.json';
    const res = await makeAuthReq('/api/words');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('words');
    expect(body).toHaveProperty('version');
  });

  test('returns null for wrong method', async () => {
    const res = await handleWords(
      new Request('http://localhost/api/words', { method: 'POST' }),
      deps,
    );
    expect(res).toBeNull();
  });

  test('returns null for wrong path', async () => {
    const res = await handleWords(
      new Request('http://localhost/api/not-words', { method: 'GET' }),
      deps,
    );
    expect(res).toBeNull();
  });
});
