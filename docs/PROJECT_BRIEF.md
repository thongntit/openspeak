# OpenSpeak — Project Brief

## What Is It?

**OpenSpeak** (marketed as **Pronounce**) is a mobile-first Progressive Web App that helps users improve their English pronunciation. Users speak a word into their phone, and the app gives them an AI-powered accuracy score and phoneme-level feedback using Microsoft Azure Speech Services.

The target platform is phone browsers (iOS Safari, Android Chrome), with PWA install support so it feels like a native app.

---

## Tech Stack (for context)

- **Frontend:** React 19 PWA, Tailwind CSS, mobile-first
- **Backend:** NestJS API, PostgreSQL (3,000 words with IPA pronunciation data)
- **Auth:** Clerk (sign in / sign up / profile)
- **Speech AI:** Azure Cognitive Services (pronunciation assessment)
- **Color system:** Light + dark mode; primary blue `#137fec`, neutral backgrounds

---

## Current Screens

### 1. Home (`/`)

**Purpose:** Landing screen after login. Entry point to practice.

**What's on screen:**
- App name "Pronounce" in the top-left header
- Dark mode toggle + settings icon (top-right)
- Warning banner (if Azure keys not configured — *will be removed post-auth migration*)
- **Quick Start card** — large "Start Pronunciation Practice" button
- **Try These Words card** — 3 featured words (one per difficulty: Beginner / Intermediate / Advanced), each tappable to jump into practice with that word

**Current state:** Functional but visually plain. Card-based layout, white cards on light gray background (`#f6f7f8`). No bottom navigation bar yet.

---

### 2. Practice (`/practice`)

**Purpose:** Core experience. User sees a word, taps record, speaks, and gets scored.

**What's on screen:**
- Top bar: back arrow + "Practice" title
- **Word card** — large bold word (42px) with IPA pronunciation below in gray
- **Accuracy Score card** — shows `--% ` before attempt; color-coded after:
  - Green (`#078838`) → ≥ 80%
  - Yellow → 60–79%
  - Red → < 60%
- **Controls row:**
  - Retry button (left) — resets current result
  - Mic button (center, large blue circle with pulse animation) — tap to start/stop recording
  - Next button (right, arrow) — loads a new random word
- Error banner (dismissible red bar) when recording fails

**Current state:** Functional core loop works. Minimal visual polish. No waveform animation during recording, no phoneme breakdown display (data exists in API response, just not rendered), no audio playback of correct pronunciation.

---

### 3. Settings (`/settings`)

**Purpose:** User account management.

**What's on screen:**
- Clerk's built-in `<UserProfile>` component — handles profile editing, password, connected accounts, sign-out
- Currently also has Azure API key input fields (to be removed once backend handles this)

**Current state:** Functional but unstyled — Clerk's default UI embedded as-is. Needs design integration.

---

### 4. Auth (Clerk-managed)

Sign-in and sign-up are handled by Clerk's hosted UI (modal or redirect). The app uses `<PrivateRoute>` guards on `/practice` and `/settings` — unauthenticated users are redirected to sign in.

---

## What's Planned

### Phase 1 — Complete Auth + Secure Backend (In Progress)

The Azure Speech API key is currently stored on the frontend. The immediate goal is to move pronunciation assessment to a backend endpoint so the key is never exposed and usage is gated behind login.

- `POST /pronunciation/assess` — backend receives audio, calls Azure, returns score
- Remove Azure key fields from Settings page entirely
- All assessed practice requires login

**Design impact:** Settings page becomes purely a Clerk profile page (no API keys). Home page warning banner goes away.

---

### Phase 2 — Practice Features

#### Shadowing Mode
Listen to a native TTS playback of the word, then record yourself saying it. See a side-by-side score comparison (theirs vs. yours).

**New UI needs:**
- Audio playback button on Practice screen (speaker icon, plays Azure TTS)
- "Shadowing" mode toggle or separate tab
- Before/after score comparison layout

#### Phoneme Breakdown
Show which specific sounds you got wrong (e.g., the /θ/ in "think"). The data already comes from Azure — it just isn't displayed yet.

**New UI needs:**
- Phoneme chips row below the accuracy score
- Each chip shows the phoneme and color-coded accuracy (green/yellow/red)
- Tap to learn more about that sound (stretch goal)

#### Minimal Pairs Training
Practice words that differ by one sound (ship vs. sheep, think vs. sink). Helps isolate problem phonemes.

**New UI needs:**
- Pair display — two words side by side
- Focus indicator on the target sound
- Score for each attempt, track which pair trips you up

---

### Phase 3 — AI Coach

A conversational mode where the user has a back-and-forth spoken exchange with an AI. The AI responds naturally and gives pronunciation feedback in context.

**New UI needs:**
- Chat-like interface (transcript on screen)
- Push-to-talk or hands-free toggle
- Inline pronunciation corrections with scores

---

### Phase 4 — Progress & Engagement

Track history so users can see improvement over time.

**New UI needs:**
- Progress / history screen (new route `/progress`)
- Charts or streaks for daily practice
- Phoneme-level heatmap (which sounds need work)
- Before/after audio comparison playback

---

## Navigation Structure (Current vs. Target)

**Current:** No persistent navigation. Back arrow only on Practice. Settings reachable via icon on Home.

**Target (planned):** Bottom tab bar with 4 tabs:
1. **Home** — featured words, quick start
2. **Practice** — pronunciation exercise
3. **Progress** — history & stats *(Phase 4)*
4. **Profile** — Clerk user profile / settings

---

## Design Notes

- **Mobile-first** — max content width ~430px, all interactions thumb-friendly
- **PWA** — feels like a native app; no visible browser chrome when installed
- **Color palette:**
  - Primary blue: `#137fec`
  - Background light: `#f6f7f8`
  - Background dark: `#101922`
  - Card bg light: `white`
  - Card bg dark: `#1c2630`
  - Border: `#dbe0e6`
  - Secondary text: `#617589`
  - Success green: `#078838`
- **Typography:** Bold headers, lighter secondary text; word display at 42px
- **Dark mode:** Full support throughout
- **Animations:** Mic button has a pulse glow ring while recording is active

---

## What We Need Designed

Priority order:

1. **Practice screen** — polished version of the current flow with:
   - Waveform or audio visualizer while recording
   - Phoneme breakdown row after assessment
   - Audio playback button for hearing correct pronunciation
   - Better score presentation

2. **Home screen** — cleaner layout, possible bottom nav bar stub

3. **Settings / Profile screen** — designed shell around the Clerk profile component

4. **Shadowing Mode** — new layout for listen-then-repeat flow (Phase 2)

5. **Progress screen** — history, streaks, phoneme heatmap (Phase 4)
