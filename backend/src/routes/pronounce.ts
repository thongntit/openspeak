import type { AppDeps } from '../types/deps.ts';
import { requireAuth } from '../middleware/auth.ts';
import { AzureError } from '../services/azure.ts';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
    status,
  });
}

export async function handlePronounce(req: Request, deps: AppDeps): Promise<Response | null> {
  if (new URL(req.url).pathname !== '/api/pronounce' || req.method !== 'POST') return null;

  // Auth check first
  let authPayload: Awaited<ReturnType<typeof requireAuth>>['payload'];
  try {
    ({ payload: authPayload } = await requireAuth(req));
  } catch (res) {
    return res as Response;
  }

  // Parse multipart form — if parsing fails, treat as missing audio
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return json({ error: 'audio is required' }, 400);
  }

  const audio = form.get('audio');
  const word = form.get('word');

  if (!audio || !(audio instanceof File)) {
    return json({ error: 'audio is required' }, 400);
  }
  if (!word || typeof word !== 'string' || !word.trim()) {
    return json({ error: 'word is required' }, 400);
  }

  // Quota check
  const quotaResult = await deps.quotaService.checkAndIncrement(authPayload.jti);
  if (!quotaResult.allowed) {
    return json(
      {
        error: 'Daily quota exceeded',
        used: quotaResult.used,
        limit: quotaResult.limit,
        resetAt: quotaResult.resetAt,
      },
      429,
    );
  }

  // Call Azure
  const region = process.env.AZURE_REGION ?? 'eastus';
  const key = process.env.AZURE_SPEECH_KEY ?? '';
  const audioBuffer = await audio.arrayBuffer();

  try {
    const result = await deps.azureService.assessPronunciation(
      audioBuffer,
      word.trim(),
      region,
      key,
    );
    return json(result);
  } catch (err) {
    if (err instanceof AzureError) {
      return json({ error: err.message }, 502);
    }
    throw err;
  }
}
