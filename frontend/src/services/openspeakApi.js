const DEFAULT_BASE = 'https://openspeak-api.thongnt.dev/api';

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

async function request(path, { params, signal, token } = {}) {
  const url = new URL(`${apiBase()}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === '') continue;
      url.searchParams.set(k, String(v));
    }
  }

  const headers = { Accept: 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(url, { signal, headers });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError(0, { message: `Network error: ${err.message}` }, path);
  }

  let body = null;
  const text = await res.text();
  if (text) {
    try { body = JSON.parse(text); }
    catch { body = { message: text }; }
  }
  if (!res.ok) throw new ApiError(res.status, body, path);
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

export function getSpeechToken(opts = {}) {
  return request('/speech/token', opts);
}

export function getHealth(opts = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeout ?? 5000);
  return request('/health', { ...opts, signal: opts.signal ?? controller.signal }).finally(
    () => clearTimeout(timer),
  );
}
