import type { AppDeps } from '../types/deps.ts';
import { requireAuth } from '../middleware/auth.ts';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
    status,
  });
}

export async function handleUsage(req: Request, deps: AppDeps): Promise<Response | null> {
  if (new URL(req.url).pathname !== '/api/usage' || req.method !== 'GET') return null;

  try {
    const { payload } = await requireAuth(req);
    const quota = deps.quotaService.get(payload.jti);
    const { used, limit, resetAt } = await quota;
    return json({ used, limit, resetAt });
  } catch (res) {
    return res as Response;
  }
}
