import { InMemoryQuotaStore } from './services/storage/memory.ts';
import type { AppDeps } from './types/deps.ts';

// --- Composition root ---
// Swap InMemoryQuotaStore → SqliteQuotaStore here when ready
const deps: AppDeps = {
  quotaStore: new InMemoryQuotaStore(),
};

// TODO: wire routes, pass deps
Bun.serve({
  port: Number(process.env.PORT ?? 3001),
  async fetch(req: Request): Promise<Response> {
    return new Response('Not implemented', { status: 501 });
  },
});

console.log(`Backend running on port ${process.env.PORT ?? 3001}`);
