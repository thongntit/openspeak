import { jwtVerify, SignJWT } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? (() => { throw new Error('JWT_SECRET is not set'); })(),
);

const COOKIE_NAME = 'token';

/** Verify JWT from the request cookie. Returns the payload or null. */
export async function verifyToken(request: Request): Promise<{
  payload: JwtPayload;
} | null> {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [k, ...v] = c.trim().split('=');
      return [k, v.join('=')];
    }),
  );

  const token = cookies[COOKIE_NAME];
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return { payload: payload as JwtPayload };
  } catch {
    return null;
  }
}

/** Convenience: verify token and throw a 401 Response if missing or invalid. */
export async function requireAuth(request: Request): Promise<{ payload: JwtPayload }> {
  const result = await verifyToken(request);
  if (!result) {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return result;
}

/** Sign a new JWT. sessionKey = jti used as the quota store key. */
export async function signToken(sessionKey: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setJti(sessionKey)
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET);
}

export interface JwtPayload {
  jti: string; // session key — used as quota store key
  exp: number; // unix seconds
}
