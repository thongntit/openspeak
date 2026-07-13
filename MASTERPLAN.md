# Gramio Master Plan

## Vision

A mobile-first Progressive Web App for English grammar and vocabulary practice, backed by a managed backend service.

---

## Current Architecture

```
┌─────────────────────────────────────┐
│   Frontend (React PWA)              │
│   Vite + Tailwind + Zustand         │
│   React Router DOM 7                │
└────────────┬────────────────────────┘
             │ HTTPS
             ▼
┌─────────────────────────────────────┐
│   Backend (NestJS)                  │
│   openspeak-api.thongnt.dev         │
│   Deployed via Coolify              │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   PostgreSQL                        │
│   3,000 words + IPA data            │
└─────────────────────────────────────┘
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

---

## Feature Status

### Done
- ✅ Word database (3,000 words, IPA, difficulty levels)
- ✅ REST API — `/words`, `/collections`, `/health`
- ✅ Home page — featured words by difficulty
- ✅ Dark mode, PWA install, offline indicator
- ✅ CI/CD — GitHub Actions + Coolify auto-deploy

### In Progress
- 🔄 Authentication (Clerk)

### Planned
- ⬜ Grammar exercises (fill-in-the-blank, sentence correction, etc.)
- ⬜ Vocabulary practice (flashcards, quizzes, spaced repetition)
- ⬜ User practice history & progress tracking
- ⬜ AI-powered grammar explanations
- ⬜ Context-based vocabulary learning

---

## Phase 1: Auth + Core Features (Current)

### Goal
Set up authentication and build core grammar/vocabulary practice features.

### Tasks
1. Integrate Clerk on frontend — `ClerkProvider`, `<SignIn>`, protected routes
2. Integrate Clerk on backend — verify JWT on protected endpoints
3. Build grammar exercise system
4. Build vocabulary practice features

### Environment Variables Needed
- Frontend: `VITE_CLERK_PUBLISHABLE_KEY`
- Backend: `CLERK_SECRET_KEY`

---

## Phase 2: Grammar Practice Features

### Grammar Exercises
- Fill-in-the-blank exercises
- Sentence correction (identify and fix errors)
- Multiple choice grammar questions
- Tense practice (past, present, future)
- Article usage (a, an, the)

### Grammar Tracking
- Track which grammar topics user struggles with
- Personalized practice recommendations

---

## Phase 3: Vocabulary Practice Features

### Vocabulary Building
- Flashcard system with spaced repetition
- Context sentences for each word
- Word family exploration (noun, verb, adjective forms)
- Synonym and antonym practice

### Vocabulary Tracking
- Words learned over time
- Review schedule based on retention

---

## Phase 4: Progress & Engagement

- Practice history per user
- Grammar and vocabulary accuracy tracking over time
- Daily streaks and goals
- Achievement badges

---

## Principles

1. **Backend-managed APIs** — No user-supplied API keys; all third-party services managed server-side
2. **Auth-gated paid features** — Clerk protects any feature that incurs API cost
3. **Mobile-first** — All UI optimized for phone use
4. **PWA** — Installable, works offline where possible

---

*Last Updated: May 2026*
