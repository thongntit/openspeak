import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { handlePronounce } from './pronounce.ts';
import type { AppDeps } from '../types/deps.ts';
import { InMemoryQuotaStore } from '../services/storage/memory.ts';
import { QuotaService } from '../services/quota.ts';
import { signToken } from '../middleware/auth.ts';
import { AzureError } from '../services/azure.ts';

const TEST_SECRET = 'test-secret-for-unit-tests-only-32chars!!';
const originalSecret = process.env.JWT_SECRET;
const originalRegion = process.env.AZURE_REGION;
const originalKey = process.env.AZURE_SPEECH_KEY;

let deps: AppDeps;

const makeDeps = (quotaLimit = 15) => ({
  quotaStore: new InMemoryQuotaStore(),
  quotaService: new QuotaService(new InMemoryQuotaStore(), quotaLimit),
  // Default: succeeds with a dummy result. Tests override this in beforeEach or inline.
  azureService: {
    assessPronunciation: async () => ({ score: 0 }),
  },
});

beforeAll(() => {
  process.env.JWT_SECRET = TEST_SECRET;
  process.env.AZURE_REGION = 'eastus';
  process.env.AZURE_SPEECH_KEY = 'test-key';
});
afterAll(() => {
  process.env.JWT_SECRET = originalSecret;
  process.env.AZURE_REGION = originalRegion;
  process.env.AZURE_SPEECH_KEY = originalKey;
});
beforeEach(() => {
  deps = makeDeps(15);
});

async function makeAuthReq(sessionKey: string, formData: FormData): Promise<Response> {
  const token = await signToken(sessionKey);
  return handlePronounce(
    new Request('http://localhost/api/pronounce', {
      method: 'POST',
      headers: { Cookie: `token=${token}` },
      body: formData,
    }),
    deps,
  ) as Promise<Response>;
}

function makeForm(audio?: Blob, word?: string): FormData {
  const fd = new FormData();
  if (audio) fd.append('audio', audio, 'test.webm');
  if (word) fd.append('word', word);
  return fd;
}

describe('POST /api/pronounce', () => {
  test('returns 401 without cookie', async () => {
    const res = await handlePronounce(
      new Request('http://localhost/api/pronounce', { method: 'POST' }),
      deps,
    );
    expect(res!.status).toBe(401);
    expect(await res!.json()).toEqual({ error: 'Unauthorized' });
  });

  test('returns 400 when audio is missing', async () => {
    const res = await makeAuthReq('session-1', makeForm(undefined, 'hello'));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'audio is required' });
  });

  test('returns 400 when word is missing', async () => {
    const res = await makeAuthReq('session-1', makeForm(new Blob(['audio']), undefined));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'word is required' });
  });

  test('returns 400 when word is empty string', async () => {
    const res = await makeAuthReq('session-1', makeForm(new Blob(['audio']), '   '));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'word is required' });
  });

  test('returns 429 when quota exceeded', async () => {
    const limitedDeps = makeDeps(2);

    // Exhaust quota
    const token = await signToken('session-over');
    const headers = { Cookie: `token=${token}` };

    const doReq = (sessionKey: string) =>
      handlePronounce(
        new Request('http://localhost/api/pronounce', {
          method: 'POST',
          headers,
          body: makeForm(new Blob(['audio']), 'hello'),
        }),
        limitedDeps,
      ) as Promise<Response>;

    await doReq('session-over'); // 1
    await doReq('session-over'); // 2 — quota now exhausted

    const res = await doReq('session-over'); // 3 — over limit
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toBe('Daily quota exceeded');
    expect(body.limit).toBe(2);
    expect(body.used).toBe(2);
    expect(body.resetAt).toBeGreaterThan(Date.now());
  });

  test('does not consume quota when blocked', async () => {
    const limitedDeps = makeDeps(1);
    const token = await signToken('session-verify');
    const headers = { Cookie: `token=${token}` };

    const doReq = () =>
      handlePronounce(
        new Request('http://localhost/api/pronounce', {
          method: 'POST',
          headers,
          body: makeForm(new Blob(['audio']), 'hello'),
        }),
        limitedDeps,
      ) as Promise<Response>;

    await doReq(); // 1 — blocked
    const res = await doReq(); // still blocked
    expect(res.status).toBe(429);

    // usage should still be 1, not 2
    const usageRes = await limitedDeps.quotaService.get('session-verify');
    expect(usageRes.used).toBe(1);
  });

  test('returns 502 when Azure call fails', async () => {
    deps.azureService = {
      assessPronunciation: async () => {
        throw new AzureError('Azure error: 401');
      },
    };
    const res = await makeAuthReq(
      'session-azure-fail',
      makeForm(new Blob(['audio']), 'hello'),
    );
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: 'Azure error: 401' });
  });

  test('returns Azure result on success', async () => {
    const mockResult = { score: 85, feedback: { pronunciationScore: 85 } };
    deps.azureService = {
      assessPronunciation: async () => mockResult,
    };
    const res = await makeAuthReq(
      'session-success',
      makeForm(new Blob(['audio']), 'hello'),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(mockResult);
  });

  test('increments quota after successful Azure call', async () => {
    deps.azureService = { assessPronunciation: async () => ({ score: 50 }) };
    await makeAuthReq('session-count', makeForm(new Blob(['audio']), 'hello'));
    const usage = await deps.quotaService.get('session-count');
    expect(usage.used).toBe(1);
  });

  test('returns null for wrong method', async () => {
    const token = await signToken('session-wrong');
    const res = await handlePronounce(
      new Request('http://localhost/api/pronounce', {
        method: 'GET',
        headers: { Cookie: `token=${token}` },
      }),
      deps,
    );
    expect(res).toBeNull();
  });

  test('returns null for wrong path', async () => {
    const token = await signToken('session-wrong');
    const res = await handlePronounce(
      new Request('http://localhost/api/not-pronounce', {
        method: 'POST',
        headers: { Cookie: `token=${token}` },
      }),
      deps,
    );
    expect(res).toBeNull();
  });
});
