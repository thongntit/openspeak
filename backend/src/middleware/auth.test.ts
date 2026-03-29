import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { verifyToken, signToken, requireAuth } from './auth.ts';

const TEST_SECRET = 'test-secret-for-unit-tests-only-32chars!!';
const originalSecret = process.env.JWT_SECRET;

// Swap JWT_SECRET for tests so we control the signing key
beforeAll(() => {
  process.env.JWT_SECRET = TEST_SECRET;
});
afterAll(() => {
  process.env.JWT_SECRET = originalSecret;
});

describe('signToken / verifyToken', () => {
  test('signs and verifies a valid token', async () => {
    const sessionKey = 'my-session-key';
    const token = await signToken(sessionKey);
    const result = await verifyToken(
      new Request('http://localhost', {
        headers: { Cookie: `token=${token}` },
      }),
    );
    expect(result).not.toBeNull();
    expect(result!.payload.jti).toBe(sessionKey);
  });

  test('returns null when no cookie', async () => {
    const result = await verifyToken(new Request('http://localhost'));
    expect(result).toBeNull();
  });

  test('returns null for invalid token', async () => {
    const result = await verifyToken(
      new Request('http://localhost', {
        headers: { Cookie: 'token=not.a.valid.token' },
      }),
    );
    expect(result).toBeNull();
  });

  test('returns null for tampered token', async () => {
    const token = await signToken('session');
    const tampered = token.slice(0, -5) + 'XXXXX';
    const result = await verifyToken(
      new Request('http://localhost', {
        headers: { Cookie: `token=${tampered}` },
      }),
    );
    expect(result).toBeNull();
  });

  test('different sessions get different jti claims', async () => {
    const token1 = await signToken('session-a');
    const token2 = await signToken('session-b');
    expect(token1).not.toBe(token2);

    const result1 = await verifyToken(
      new Request('http://localhost', { headers: { Cookie: `token=${token1}` } }),
    );
    const result2 = await verifyToken(
      new Request('http://localhost', { headers: { Cookie: `token=${token2}` } }),
    );
    expect(result1!.payload.jti).toBe('session-a');
    expect(result2!.payload.jti).toBe('session-b');
  });
});

describe('requireAuth', () => {
  test('returns payload on valid token', async () => {
    const token = await signToken('session-123');
    const result = await requireAuth(
      new Request('http://localhost', { headers: { Cookie: `token=${token}` } }),
    );
    expect(result.payload.jti).toBe('session-123');
  });

  test('throws 401 Response on missing cookie', async () => {
    try {
      await requireAuth(new Request('http://localhost'));
      expect.unreachable('should have thrown');
    } catch (res: unknown) {
      const response = res as Response;
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: 'Unauthorized' });
    }
  });

  test('throws 401 Response on invalid token', async () => {
    try {
      await requireAuth(
        new Request('http://localhost', { headers: { Cookie: 'token=bad.token.here' } }),
      );
      expect.unreachable('should have thrown');
    } catch (res: unknown) {
      const response = res as Response;
      expect(response.status).toBe(401);
    }
  });
});
