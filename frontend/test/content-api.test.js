import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';

import {
  ApiError,
  getContentDeckCards,
  getContentDecks,
} from '../src/services/openspeakApi.js';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('getContentDecks sends pagination and bearer token', async () => {
  let captured;
  globalThis.fetch = async (url, init) => {
    captured = { url: String(url), init };
    return new Response(JSON.stringify({
      data: [], total: 0, limit: 100, offset: 0,
      hasNext: false, hasPrev: false,
    }), { status: 200 });
  };

  await getContentDecks(
    { limit: 100, offset: 0 },
    { token: 'clerk-token' },
  );

  const url = new URL(captured.url);
  assert.equal(url.pathname, '/api/content/decks');
  assert.equal(url.searchParams.get('limit'), '100');
  assert.equal(url.searchParams.get('offset'), '0');
  assert.equal(captured.init.headers.Authorization, 'Bearer clerk-token');
});

test('getContentDeckCards encodes the slug', async () => {
  let capturedUrl;
  globalThis.fetch = async (url) => {
    capturedUrl = String(url);
    return new Response(JSON.stringify({
      data: [], total: 0, limit: 50, offset: 0,
      hasNext: false, hasPrev: false,
    }), { status: 200 });
  };

  await getContentDeckCards(
    'tips / tricks',
    { limit: 50, offset: 0 },
    { token: 'clerk-token' },
  );

  assert.equal(
    new URL(capturedUrl).pathname,
    '/api/content/decks/tips%20%2F%20tricks/cards',
  );
});

test('content requests preserve API errors', async () => {
  globalThis.fetch = async () => new Response(
    JSON.stringify({ message: 'Authentication required' }),
    { status: 401 },
  );

  await assert.rejects(
    getContentDecks({}, { token: 'expired' }),
    (error) => error instanceof ApiError && error.status === 401,
  );
});
