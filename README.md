# OpenSpeak - English Pronunciation Coach

Mobile-first PWA for English pronunciation assessment with Azure Speech Services.

## Quick Start

```bash
# Frontend
cd frontend && bun install && bun run dev

# Backend (when ready)
cd backend && bun install && bun src/index.ts
```

See [BACKEND-MIGRATION.md](./BACKEND-MIGRATION.md) for the current development plan.

## Tech Stack

### Frontend
- React 19 + Vite + Tailwind CSS (mobile-first)
- Zustand for state management
- React Router v7
- vite-plugin-pwa (service worker)
- **Currently:** Azure Speech SDK calls Azure directly (API key in localStorage)
- **Migration:** Backend will proxy to Azure, API key in env

### Backend (in progress)
- Bun.serve (no framework)
- TypeScript with dependency injection
- JWT in httpOnly cookie (24h expiry)
- Azure Speech REST API proxy
- Daily quota enforcement (15/day)

## Project Structure

```
openspeak/
├── frontend/              # React PWA
│   ├── src/
│   │   ├── components/   # Splash, ThemeToggle, ReloadPrompt, AppLoader
│   │   ├── pages/        # Home, Practice, Settings
│   │   ├── stores/       # Zustand stores
│   │   └── services/     # API services
├── backend/              # Bun backend (in progress)
│   ├── src/
│   │   ├── routes/       # auth, words, pronounce, usage
│   │   ├── services/     # azure, quota, storage
│   │   └── middleware/   # auth
│   ├── Dockerfile
│   └── docker-compose.yml
├── database/             # 3,000 words with IPA
├── docs/                 # Documentation
└── CLAUDE.md            # Claude Code guidance
```

## Architecture

```
Current (client-side):
Browser → Azure Speech SDK (API key in localStorage) ⚠️

Target (frontend + backend):
Browser → Backend (Bun) → Azure Speech REST API
          (API key in env, JWT in httpOnly cookie)
```

## Development

### Frontend
```bash
cd frontend
bun run dev              # Start dev server (http://localhost:5173)
bun run build            # Build for production
bun run preview          # Preview production build
bun run lint             # Run ESLint
```

### Backend (not yet wired)
```bash
cd backend
bun src/index.ts         # Start backend (port 3001)
```

### Local Word Database
```bash
bun run serve-db         # Start local database server
```

## Word Database

3,000 most common English words with IPA pronunciation data (~449 KB JSON).

## Documentation

| File | Purpose |
|------|---------|
| `BACKEND-MIGRATION.md` | Full migration plan (current focus) |
| `CLAUDE.md` | Claude Code guidance |
| `docs/spec.md` | MVP specification |
| `docs/TECHNICAL_NOTES.md` | Azure API research |

## License

MIT
