import { InMemoryQuotaStore } from './services/storage/memory.ts';
import { QuotaService } from './services/quota.ts';
import { assessPronunciation } from './services/azure.ts';
import type { AppDeps } from './types/deps.ts';
import { handleAuth } from './routes/auth.ts';
import { handleUsage } from './routes/usage.ts';
import { handleWords } from './routes/words.ts';
import { handlePronounce } from './routes/pronounce.ts';

// ─── Env validation ──────────────────────────────────────────────────────────
const required = ['AUTH_PASSWORD', 'JWT_SECRET', 'AZURE_SPEECH_KEY', 'AZURE_REGION'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`FATAL: ${key} is not set`);
    process.exit(1);
  }
}

// ─── Composition root ─────────────────────────────────────────────────────────
// Swap InMemoryQuotaStore → SqliteQuotaStore here when ready
const quotaStore = new InMemoryQuotaStore();
const dailyLimit = Number(process.env.DAILY_LIMIT ?? 15);

const deps: AppDeps = {
  quotaStore,
  quotaService: new QuotaService(quotaStore, dailyLimit),
  azureService: { assessPronunciation },
};

const FRONTEND_DIST = process.env.FRONTEND_DIST ?? '../frontend/dist';
const PORT = Number(process.env.PORT ?? 3001);

// ─── Server ──────────────────────────────────────────────────────────────────
Bun.serve({
  port: PORT,
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // API routes
    if (pathname.startsWith('/api/')) {
      if (pathname.startsWith('/api/auth/')) {
        return (await handleAuth(req, deps)) ?? notFound();
      }
      if (pathname === '/api/usage') {
        return (await handleUsage(req, deps)) ?? notFound();
      }
      if (pathname === '/api/words') {
        return (await handleWords(req, deps)) ?? notFound();
      }
      if (pathname === '/api/pronounce') {
        return (await handlePronounce(req, deps)) ?? notFound();
      }
      return notFound();
    }

    // Static files (frontend)
    const file = Bun.file(`${FRONTEND_DIST}${pathname === '/' ? '/index.html' : pathname}`);
    if (await file.exists()) {
      const mimeType = mimeTypeFor(url.pathname);
      return new Response(file, {
        headers: mimeType ? { 'Content-Type': mimeType } : {},
      });
    }

    // SPA fallback
    const index = Bun.file(`${FRONTEND_DIST}/index.html`);
    if (await index.exists()) {
      return new Response(index, { headers: { 'Content-Type': 'text/html' } });
    }

    return notFound();
  },
});

function notFound(): Response {
  return new Response('Not Found', { status: 404 });
}

function mimeTypeFor(pathname: string): string | null {
  if (pathname.endsWith('.js')) return 'application/javascript';
  if (pathname.endsWith('.css')) return 'text/css';
  if (pathname.endsWith('.svg')) return 'image/svg+xml';
  if (pathname.endsWith('.png')) return 'image/png';
  if (pathname.endsWith('.webmanifest')) return 'application/manifest+json';
  return null;
}

console.log(`Backend running on port ${PORT}`);
