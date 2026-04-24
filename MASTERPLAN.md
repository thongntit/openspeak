# OpenSpeak Master Plan

## Vision

A mobile-first Progressive Web App for English pronunciation improvement through AI-powered speaking practice, backed by a managed backend service.

---

## Current Architecture

```
┌─────────────────────────────────┐
│   Frontend (React PWA)          │
│   Vite + Tailwind + Zustand     │
│   React Router DOM 7            │
└────────────┬────────────────────┘
             │ HTTPS
             ▼
┌─────────────────────────────────┐
│   Backend (NestJS)              │
│   openspeak-api.thongnt.dev     │
│   Deployed via Coolify          │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│   PostgreSQL                    │
│   3,000 words + IPA data        │
└─────────────────────────────────┘
```

### Infrastructure
- **Backend URL:** `openspeak-api.thongnt.dev`
- **Deployment:** Coolify (Docker, auto-deploy on merge to `dev`/`main`)
- **CI/CD:** GitHub Actions — separate backend/frontend workflows, deploy only on push (not on PR)
- **Container Registry:** ghcr.io

---

## Tech Stack

### Frontend
- React 19, Vite, Tailwind CSS, Zustand, React Router DOM 7
- PWA (vite-plugin-pwa)
- Microsoft Azure Speech SDK (client-side, to be moved to backend)

### Backend
- NestJS 11, TypeORM, PostgreSQL
- `@nestjs/config` with Joi validation

---

## Key Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Auth provider | **Clerk** | Drop-in React SDK, handles sessions/JWTs, no DB tables needed |
| Backend framework | **NestJS** | Structured, TypeScript-native, good module system |
| Deployment | **Coolify** | Self-hosted PaaS, Docker-based, webhook deploys |
| Word database | **PostgreSQL** | 3,000 words with IPA, seeded via migrations |
| Azure Speech | Moving to backend | API keys must not be user-supplied; protect as paid service |

---

## Feature Status

### Done
- ✅ Word database (3,000 words, IPA, difficulty levels)
- ✅ REST API — `/words`, `/collections`, `/health`
- ✅ Practice page — record pronunciation, get accuracy score (client-side Azure)
- ✅ Home page — featured words by difficulty
- ✅ Dark mode, PWA install, offline indicator
- ✅ CI/CD — GitHub Actions + Coolify auto-deploy

### In Progress
- 🔄 Authentication (Clerk)

### Planned
- ⬜ Move Azure Speech assessment to backend (protect as paid feature)
- ⬜ User practice history & progress tracking
- ⬜ Shadowing mode (listen to native TTS, repeat, compare)
- ⬜ Minimal pairs training (ship/sheep, think/sink, etc.)
- ⬜ AI Coach (conversational practice with feedback)
- ⬜ Intonation & rhythm training
- ⬜ Scenario-based practice (interviews, ordering, small talk)

---

## Phase 1: Auth + Protected Services (Current)

### Goal
Gate pronunciation assessment behind login so Azure costs are controlled.

### Tasks
1. Integrate Clerk on frontend — `ClerkProvider`, `<SignIn>`, protected routes
2. Integrate Clerk on backend — verify JWT on protected endpoints
3. Move Azure Speech assessment to a backend endpoint (`POST /pronunciation/assess`)
4. Remove Azure API key from frontend entirely

### Environment Variables Needed
- Frontend: `VITE_CLERK_PUBLISHABLE_KEY`
- Backend: `CLERK_SECRET_KEY`, `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`

---

## Phase 2: Practice Features

### Shadowing Mode
- Play native Azure TTS pronunciation of a word/phrase
- User repeats and records
- Side-by-side score comparison

### Minimal Pairs
- Focus on confusing sound pairs (i/ee, th/s, l/r, etc.)
- Visual phonetic notation
- Track which sounds the user struggles with

---

## Phase 3: AI Coach

- Conversational practice with an LLM
- AI responds naturally, corrects gently
- Context-aware to the user's weak phonemes
- Costs covered by backend (protected behind auth/subscription)

---

## Phase 4: Progress & Engagement

- Practice history per user
- Phoneme-level accuracy tracking over time
- Daily streaks and goals
- Before/after playback comparisons

---

## Principles

1. **Backend-managed APIs** — No user-supplied API keys; all third-party services managed server-side
2. **Auth-gated paid features** — Clerk protects any feature that incurs API cost
3. **Mobile-first** — All UI optimized for phone use
4. **PWA** — Installable, works offline where possible

---

*Last Updated: April 2026*
