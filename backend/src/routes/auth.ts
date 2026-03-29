import type { AppDeps } from '../types/deps.ts';
import { requireAuth, signToken } from '../middleware/auth.ts';

const COOKIE_NAME = 'token';

function json(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    status: init?.status ?? 200,
  });
}

function cookieOptions(maxAge = 86400): string {
  const parts = [
    `Max-Age=${maxAge}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  return parts.join('; ');
}

function setCookie(value: string, maxAge = 86400): string {
  return `${COOKIE_NAME}=${value}; ${cookieOptions(maxAge)}`;
}

/** Handles all /api/auth/* routes. Returns null if the URL doesn't match. */
export async function handleAuth(req: Request, _deps: AppDeps): Promise<Response | null> {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // POST /api/auth/token — login
  if (pathname === '/api/auth/token' && req.method === 'POST') {
    let body: { password?: string };
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!body.password) {
      return json({ error: 'Password required' }, { status: 400 });
    }

    if (body.password !== process.env.AUTH_PASSWORD) {
      return json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Generate a stable session key (random, used as jti/quota key)
    const sessionKey = crypto.randomUUID();
    const token = await signToken(sessionKey);

    return json(
      { ok: true, expiresIn: 86400 },
      {
        headers: {
          'Set-Cookie': setCookie(token),
        },
      },
    );
  }

  // POST /api/auth/logout — logout
  if (pathname === '/api/auth/logout' && req.method === 'POST') {
    return json(
      { ok: true },
      {
        headers: {
          'Set-Cookie': `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`,
        },
      },
    );
  }

  // GET /api/auth/me — session check
  if (pathname === '/api/auth/me' && req.method === 'GET') {
    try {
      await requireAuth(req);
      return json({ ok: true });
    } catch (res) {
      return res as Response;
    }
  }

  return null; // not matched
}
