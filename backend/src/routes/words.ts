import type { AppDeps } from '../types/deps.ts';
import { requireAuth } from '../middleware/auth.ts';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
    status,
  });
}

export async function handleWords(req: Request, _deps: AppDeps): Promise<Response | null> {
  if (new URL(req.url).pathname !== '/api/words' || req.method !== 'GET') return null;

  try {
    await requireAuth(req);
  } catch (res) {
    return res as Response;
  }

  const wordsPath = process.env.WORDS_PATH ?? './words.json';
  const file = Bun.file(wordsPath);

  if (!(await file.exists())) {
    return json({ error: 'Word database unavailable' }, 500);
  }

  return new Response(file, {
    headers: { 'Content-Type': 'application/json' },
  });
}
