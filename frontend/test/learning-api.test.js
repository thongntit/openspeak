import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  getToday,
  submitReview,
} from '@/services/openspeakApi';

const TODAY = {
  queue: [],
  totalDue: 0,
  countsByType: {},
  countsByDeck: {},
  caughtUp: true,
  serverTimestamp: '2026-07-18T00:00:00.000Z',
};

afterEach(() => vi.unstubAllGlobals());

describe('learning API', () => {
  it('GETs Today with a bearer token', async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(TODAY), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetch);

    await getToday({ token: 'clerk-token' });

    const [url, init] = fetch.mock.calls[0];
    expect(new URL(url).pathname).toBe('/api/today');
    expect(init).toMatchObject({
      method: 'GET',
      headers: expect.objectContaining({
        Authorization: 'Bearer clerk-token',
      }),
    });
  });

  it('POSTs the exact review JSON with a bearer token', async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ today: TODAY }), { status: 201 }),
    );
    vi.stubGlobal('fetch', fetch);
    const payload = {
      cardId: 'be7d7592-2e3d-4a41-8cf5-20f1ea90f4fd',
      rating: 'good',
      clientRequestId: 'a9ba9e4d-f965-48f6-8a66-1d6279e038d0',
      clientReviewedAt: '2026-07-18T00:00:00.000Z',
    };

    await submitReview(payload, { token: 'clerk-token' });

    const [, init] = fetch.mock.calls[0];
    expect(init).toMatchObject({
      method: 'POST',
      body: JSON.stringify(payload),
      headers: expect.objectContaining({
        Authorization: 'Bearer clerk-token',
        'Content-Type': 'application/json',
      }),
    });
  });

  it.each([401, 404, 500])('preserves status %s in ApiError', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'failure' }), { status }),
    ));

    await expect(getToday({ token: 'bad' })).rejects.toSatisfy(
      (error) => error instanceof ApiError && error.status === status,
    );
  });

  it('converts a fetch failure into a status-zero ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    await expect(getToday({ token: 'token' })).rejects.toMatchObject({
      name: 'ApiError',
      status: 0,
      path: '/today',
    });
  });
});
