const DEFAULT_BASE = 'http://localhost:3000/api';

function apiBase() {
  const env = import.meta.env.VITE_OPENSPEAK_API_URL;
  return (env && env.replace(/\/$/, '')) || DEFAULT_BASE;
}

export class ApiError extends Error {
  constructor(status, body, path) {
    super(body?.message || `Request failed: ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
    this.path = path;
  }
}

async function request(path, { params, signal } = {}) {
  const url = new URL(`${apiBase()}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === '') continue;
      url.searchParams.set(k, String(v));
    }
  }

  let res;
  try {
    res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError(0, { message: `Network error: ${err.message}` }, path);
  }

  let body = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { message: text };
    }
  }
  if (!res.ok) {
    throw new ApiError(res.status, body, path);
  }
  return body;
}

export function getWords(params = {}, opts = {}) {
  return request('/words', { params, ...opts });
}

export function getWordById(id, opts = {}) {
  return request(`/words/${encodeURIComponent(id)}`, opts);
}

export function getCollections(params = {}, opts = {}) {
  return request('/collections', { params, ...opts });
}

export function getCollectionById(id, opts = {}) {
  return request(`/collections/${encodeURIComponent(id)}`, opts);
}

export function getCollectionWords(id, params = {}, opts = {}) {
  return request(`/collections/${encodeURIComponent(id)}/words`, {
    params,
    ...opts,
  });
}

export function getHealth(opts = {}) {
  return request('/health', opts);
}
