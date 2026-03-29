import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { handleAuth } from './auth.ts';
import type { AppDeps } from '../types/deps.ts';
import { InMemoryQuotaStore } from '../services/storage/memory.ts';
import { QuotaService } from '../services/quota.ts';
import { assessPronunciation } from '../services/azure.ts';

const TEST_SECRET = 'test-secret-for-unit-tests-only-32chars!!';
const originalSecret = process.env.JWT_SECRET;
const originalPassword = process.env.AUTH_PASSWORD;
const originalNodeEnv = process.env.NODE_ENV;

const deps: AppDeps = {
  quotaStore: new InMemoryQuotaStore(),
  quotaService: new QuotaService(new InMemoryQuotaStore(), 15),
  azureService: { assessPronunciation },
};

beforeAll(() => {
  process.env.JWT_SECRET = TEST_SECRET;
  process.env.AUTH_PASSWORD = 'correct-horse-battery-staple';
  process.env.NODE_ENV = 'test';
});
afterAll(() => {
  process.env.JWT_SECRET = originalSecret;
  process.env.AUTH_PASSWORD = originalPassword;
  process.env.NODE_ENV = originalNodeEnv;
});
beforeEach(() => {
  // reset quota between each test
  deps.quotaStore = new InMemoryQuotaStore();
  deps.quotaService = new QuotaService(deps.quotaStore, 15);
});

function req(method: string, path: string, body?: unknown, extra: RequestInit = {}): Request {
  return new Request(`http://localhost${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...extra.headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...extra,
  });
}

function parseJson(res: Response) {
  return res.json() as Promise<unknown>;
}
function parseSetCookie(res: Response): string {
  return res.headers.get('Set-Cookie') ?? '';
}

// ─── POST /api/auth/token ─────────────────────────────────────────────────────

describe('POST /api/auth/token', () => {
  test('returns 400 when password is missing', async () => {
    const res = await handleAuth(req('POST', '/api/auth/token', {}), deps);
    expect(res!.status).toBe(400);
    expect(await parseJson(res!)).toEqual({ error: 'Password required' });
  });

  test('returns 400 when password is empty string', async () => {
    const res = await handleAuth(req('POST', '/api/auth/token', { password: '' }), deps);
    expect(res!.status).toBe(400);
  });

  test('returns 401 when password is wrong', async () => {
    const res = await handleAuth(
      req('POST', '/api/auth/token', { password: 'wrong-password' }),
      deps,
    );
    expect(res!.status).toBe(401);
    expect(await parseJson(res!)).toEqual({ error: 'Invalid credentials' });
  });

  test('returns 200 + cookie on correct password', async () => {
    const res = await handleAuth(
      req('POST', '/api/auth/token', { password: 'correct-horse-battery-staple' }),
      deps,
    );
    expect(res!.status).toBe(200);
    const body = await parseJson(res!);
    expect(body).toEqual({ ok: true, expiresIn: 86400 });
    const cookie = parseSetCookie(res!);
    expect(cookie).toContain('token=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).not.toContain('Secure'); // NODE_ENV=test
  });

  test('returns 200 + Secure cookie in production', async () => {
    process.env.NODE_ENV = 'production';
    const res = await handleAuth(
      req('POST', '/api/auth/token', { password: 'correct-horse-battery-staple' }),
      deps,
    );
    process.env.NODE_ENV = 'test';
    expect(res!.status).toBe(200);
    expect(parseSetCookie(res!)).toContain('Secure');
  });

  test('cookie does not contain duplicate token= entries', async () => {
    const res = await handleAuth(
      req('POST', '/api/auth/token', { password: 'correct-horse-battery-staple' }),
      deps,
    );
    const cookie = parseSetCookie(res!);
    // Count occurrences of "token=" in the cookie string
    const matches = cookie.match(/token=/g) ?? [];
    expect(matches.length).toBe(1);
  });

  test('returns 400 for invalid JSON body', async () => {
    const badReq = new Request('http://localhost/api/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    });
    const res = await handleAuth(badReq, deps);
    expect(res!.status).toBe(400);
  });
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────

describe('POST /api/auth/logout', () => {
  test('returns 200 and clears cookie', async () => {
    const res = await handleAuth(req('POST', '/api/auth/logout'), deps);
    expect(res!.status).toBe(200);
    const body = await parseJson(res!);
    expect(body).toEqual({ ok: true });
    const cookie = parseSetCookie(res!);
    expect(cookie).toContain('token=');
    expect(cookie).toContain('Max-Age=0');
  });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

describe('GET /api/auth/me', () => {
  test('returns 401 without cookie', async () => {
    const res = await handleAuth(req('GET', '/api/auth/me'), deps);
    expect(res!.status).toBe(401);
  });

  test('returns 200 with valid cookie', async () => {
    // First login to get a token
    const loginRes = await handleAuth(
      req('POST', '/api/auth/token', { password: 'correct-horse-battery-staple' }),
      deps,
    );
    const cookie = parseSetCookie(loginRes!);

    const res = await handleAuth(
      new Request('http://localhost/api/auth/me', {
        headers: { Cookie: cookie },
      }),
      deps,
    );
    expect(res!.status).toBe(200);
    expect(await parseJson(res!)).toEqual({ ok: true });
  });

  test('returns 401 with expired/invalid cookie', async () => {
    const res = await handleAuth(
      new Request('http://localhost/api/auth/me', {
        headers: { Cookie: 'token=bad.token.here' },
      }),
      deps,
    );
    expect(res!.status).toBe(401);
  });
});

// ─── Non-matching paths ───────────────────────────────────────────────────────

describe('non-matching routes', () => {
  test('returns null for unknown auth path', async () => {
    const res = await handleAuth(req('GET', '/api/auth/nonexistent'), deps);
    expect(res).toBeNull();
  });

  test('returns null for wrong method on /api/auth/token', async () => {
    const res = await handleAuth(req('GET', '/api/auth/token'), deps);
    expect(res).toBeNull();
  });
});
