# Pronounce Redesign — Implementation Plan

Source of truth: `OpenSpeak.zip` → `design_handoff_pronounce/` (Claude design handoff).
Target: rebuild the OpenSpeak frontend to match the "Pronounce" mobile PWA design system, keeping the existing data layer (Azure Speech SDK, Clerk auth, NestJS backend, Zustand stores).

---

## Current state vs. target

| | Current | Target |
|---|---|---|
| Pages | Home, Practice, Settings (3) | Home, Practice, Progress, Profile (4) + persistent bottom tab bar |
| UI library | Tailwind v3 + lucide-react, hand-rolled classes in `index.css` | Tailwind + shadcn-flavored CSS variables, custom primitives |
| Theming | `class`-based dark mode, two ad-hoc colors | Full HSL token system (`--bg-app`, `--bg-card`, `--text-1/2`, `--primary`, success/warn/danger) for light + dark |
| Practice state | `idle / recording / processing / result` (no UI for `assessing` distinct from `result`) | Explicit `idle → recording → assessing → result` machine with waveform, timer, spinner, animated score ring, phoneme breakdown chips |
| Phoneme breakdown | Not rendered (Azure already returns it via `Phoneme` granularity at `azureSpeech.js:36`) | Color-banded chips (≥80 / 60–79 / <60), legend, "tap to hear" affordance |
| Streak / progress | Not implemented | Streak strip on Home, full Progress page (weekly bars, phoneme heatmap, recent sessions) |
| Profile | None — only `Settings.jsx` | User card + 3-stat grid + Preferences/Account lists, with Clerk wired for actions |
| Fonts | Lexend (declared in tailwind config but never loaded) | Inter (UI) + JetBrains Mono (IPA, scores, timer) |
| Icons | lucide-react | Custom SVG set (matches lucide style — keep lucide, swap names) |

Current frontend is ~700 LOC. Redesign is essentially a UI-layer rewrite. Data layer (`azureSpeech.js`, `wordService.js`, stores, Clerk) stays.

---

## Phase 0 — Foundations (~0.5 day)

Make tokens, fonts, and the routing shell match the spec **before** touching screens.

1. **Tokens.** Replace `frontend/src/index.css:1-28` with the full HSL variable system from `styles.css:5-49` (light + `.dark`). Keep both the HSL set (`--background`, `--card`, etc.) and the hex aliases (`--bg-app`, `--text-1`, `--primary-hex`) — design uses both.
2. **Tailwind config.** Extend `tailwind.config.js` to map utilities to those tokens: `bg-app`, `bg-card`, `border-soft`, `text-1`, `text-2`, `primary`, `success`, `warning`, `danger`, plus `radius` (16px). Remove unused `Lexend` family. Add `font-mono` → JetBrains Mono.
3. **Fonts.** Add `@fontsource/inter` and `@fontsource/jetbrains-mono` (preferred over the prototype's Google Fonts `@import` — works offline, PWA-friendly).
4. **Routing.** Update `App.jsx` routes to `/` (Home), `/practice`, `/practice/:wordId`, `/progress`, `/profile`. Drop `/settings` (Profile absorbs it). All 4 wrap in a new `<AppShell>` rendering the persistent `<TabBar>` at bottom.
5. **Component primitives.** Create `src/components/ui/` with the four reusable primitives the design needs:
   - `Button` (variants: `primary` / `outline` / `ghost` / `icon`)
   - `Card`
   - `Badge` (variants: `beg` / `int` / `adv`)
   - `PhonemeChip` (variants: `good` / `mid` / `bad` / `idle`)

   Build with `class-variance-authority` + `tailwind-merge` — shadcn-style architecture without pulling in the full shadcn CLI.
6. **Score utilities.** Port `bandClass` + `bandLabel` from `data.jsx:24-37` into `src/lib/score.js`. Used by `PhonemeChip`, `ScoreRing`, `ScoreBar`.

## Phase 1 — Shell & Home (~1 day)

1. **`AppShell` + `TabBar`** — fixed bottom, 64px tall, 4 tabs (Home/Practice/Progress/Profile) with active dot. Use `NavLink` for active state.
2. **`Home` rewrite** (`pages/Home.jsx`):
   - App header: logo glyph + theme toggle + bell.
   - Streak strip (gradient card, flame icon, 7-segment day strip). Streak data is server-derived; for Phase 1 hardcode placeholder, real wiring in Phase 5.
   - Quick-start button (full-width primary, 64px).
   - "Try these words" card — 3 word rows with speaker icon, IPA, level badge, chevron. Wire to existing `getWordsByDifficulty`. **Map level codes** in `wordService.js` so it returns `'beg' | 'int' | 'adv'` (current code uses long names at `Home.jsx:8`).
   - 2×2 Modes grid — Shadowing, Minimal pairs, AI Coach (with "New" badge), My words. **Decision needed:** dead-end "Coming soon" cards or hide unbuilt modes. Default to "Coming soon" if not decided.
3. Drop the "Setup Required" card — Azure creds now come from backend (per Clerk merge), so the frontend setup wizard is obsolete.

## Phase 2 — Practice screen state machine (~1.5 days)

Highest-risk part: the prototype's 1.1s `setTimeout(assessing → result)` becomes the real Azure round-trip.

1. **Refactor `pronunciationStore`** to expose one of `'idle' | 'recording' | 'assessing' | 'result'` instead of separate `isRecording / isProcessing / result` booleans. `assessing` starts when user taps stop, ends when Azure returns.
2. **Word block** — level badge, 56px word, JetBrains-Mono IPA, "Hear it" + "Save" outline buttons. **"Hear it" decision:** Phase 2 uses browser `SpeechSynthesis` (no backend dependency); replace with Azure TTS later.
3. **Score slot (132px)** — 4 distinct contents per state:
   - `idle`: dashed circle with em-dash + "SCORE" label.
   - `recording`: 28-bar waveform (sine + jitter @ rAF) + red mono timer (`.toFixed(1) + 's'`).
   - `assessing`: 36px spinner.
   - `result`: animated `<ScoreRing>` (SVG, `stroke-dashoffset` 1s cubic-bezier).
4. **Phoneme breakdown card.** Azure already returns phoneme data (`azureSpeech.js:36` sets `Phoneme` granularity; `parseAccuracyScore` at `Practice.jsx:8-15` already digs into `NBest[0].PronunciationAssessment`). Extend the parser to also return `NBest[0].Words[*].Phonemes[*]` → `{ p: phoneme, s: AccuracyScore }`. Render `PhonemeChip` flex-wrapped, color-banded, with legend.
5. **Footer controls.** 56px Retry left · 88px primary mic center (red + pulse-ring + stop-square when recording) · 56px Next right. Wire Next to `loadRandomWord`.
6. **Header.** Back · "Word 8 / 30" progress · help icon. Progress text is a session counter — needs backend support. For Phase 2, hide it if data isn't available (don't ship fake numbers).
7. **Toast** (from `Pronounce.html:55-64`): post-result toast — `'🎯 Great pronunciation!'` / `'Good try — keep going'` / `'Try again, focus on the highlighted sounds'`. Auto-dismiss at 2.4s.

## Phase 3 — Profile (~0.5 day)

1. New `pages/Profile.jsx`. Header, user card (Clerk `useUser` → name, email, initials), 3 stat cells, Preferences list, Account list, version footer.
2. **Clerk integration.** Recommendation: **inline actions, not embedded `<UserProfile>`**. Styled rows are the spec; Clerk's `<UserProfile>` is a big modal that breaks the design. Use Clerk for actions only:
   - "Edit" button → `clerk.openUserProfile()`
   - "Password & security" row → `clerk.openUserProfile({ initialState: 'security' })`
   - "Sign out" row → `clerk.signOut()`
3. Stats (Words / Avg / Streak) need backend endpoints — placeholder until Phase 5.
4. Theme toggle: reuse existing `useThemeStore`.

## Phase 4 — Progress (~0.5 day)

Designed but stub-data. Build the UI to match the spec; back it with placeholder data + a clear `// TODO: backend endpoint` so the page works end-to-end.

1. Weekly card (eyebrow / 84% avg / +6 delta / 7 weekday bars).
2. Phoneme heatmap (6-col grid, color-banded chips reusing `PhonemeChip`).
3. Recent sessions list (score chip + word + timestamp + chevron).

When backend ships `GET /me/progress` (out of scope here), wire it. Until then the screen is visually complete with mock data.

## Phase 5 — Backend wiring & polish (~0.5–1 day, **partially blocked**)

These need backend endpoints that don't exist yet. Either spec them now or land Phase 1–4 with mocks and finish later.

- `GET /me/streak` → `{ days: number, today: number, target: number, last7: bool[] }`
- `GET /me/progress?range=week` → weekly bars + phoneme heatmap + recent sessions
- `POST /pronunciation/assess` — currently runs direct from browser via Azure SDK. **Decision needed:** keep direct (current) or proxy through backend (cleaner but new work).
- `POST /me/saved-words` — for the Save button on Practice.
- TTS for "Hear it" — Azure TTS proxied, or browser `SpeechSynthesis` fallback.

## Phase 6 — Cleanup

- Delete `pages/Settings.jsx` (absorbed into Profile).
- Delete `components/ThemeToggle.jsx` if Profile fully owns it; otherwise keep + reuse.
- Drop unused Tailwind classes from old `index.css` after migration.
- PWA: update `manifest.json` theme colors to match new tokens. Splash screen color in `App.jsx:34` already references `#101922`/`#f6f7f8` — matches design, no change needed.

---

## Total estimate

**~4–5 dev-days** for high-fidelity port matching the handoff. Assumes:
- JS stays JS (no TS migration)
- Mock data on Progress/streak until backend is ready

### Optional adders
- **TS migration:** +1 day. Codebase is small; shadcn-style primitives benefit from typed variants.
- **Real shadcn CLI install** (`npx shadcn@latest init`): +0.5 day, but adds Radix as a dep. Handoff is "shadcn-flavored" not "uses shadcn" — recommend skipping the CLI and just adopting the architecture (CVA + tokens + primitives in `components/ui/`). Lighter, fewer deps, same DX.
- **Backend endpoints** for streak/progress/saved-words: +1–2 days backend work, separate PR.

---

## Design contract (from handoff)

### Phoneme data shape
`{ p: string, s: number 0–99 }` per word. Matches Azure `Phoneme` granularity output at `NBest[0].Words[*].Phonemes[*]`.

### Level codes
`'beg' | 'int' | 'adv'` (handoff uses short codes; current `Home.jsx:8` uses long names — map at service layer).

### Score bands (`lib/score.js`)
- `bandClass`: ≥80 → `good`, 60–79 → `mid`, <60 → `bad`, null → `idle`
- `bandLabel`: ≥90 Excellent, ≥80 Great, ≥70 Good, ≥60 Almost, <60 Try again

### Icons
Keep `lucide-react`. Mapping: Home, Mic, BarChart3, User, Sun, Moon, Settings, ArrowRight, ArrowLeft, RotateCcw, Volume2, Headphones, Layers, Flame, Check, X, Bell, Lock, HelpCircle, ChevronRight, LogOut, Sparkles, Star, TrendingUp, Bookmark.

Exception: filled mic for the recording button — use `Mic` with `fill="currentColor"`.

### Motion
- Score ring: `stroke-dashoffset 1s cubic-bezier(.2,.8,.2,1)`
- Bar fill: `width 1s cubic-bezier(.2,.8,.2,1)`
- Screen enter: 240ms fade + 6px translate-y
- Tab swap: instant
- Mic pulse while recording: 1.2s ease-in-out infinite

---

## Open decisions before Phase 0 starts

1. **Scope.** All 4 screens this round, or just Home + Practice with stubs behind the other tabs?
2. **Mock vs. real data on Progress/Streak.** Ship UI with mocks now, wire later — or block on backend?
3. **TS migration in same PR.** Yes / no.
4. **Clerk in Profile.** Inline actions (recommended) or embed `<UserProfile>`?
5. **"Modes" grid on Home.** "Coming soon" cards, hide until built, or scope them in?
6. **"Hear it" TTS.** Browser `SpeechSynthesis` for v1, Azure TTS later — OK?
7. **Pronunciation assessment.** Keep direct-from-browser Azure SDK call, or proxy through backend?

---

## Files referenced

### Handoff (`OpenSpeak.zip`)
- `design_handoff_pronounce/README.md` — spec narrative, tokens, state, backend touchpoints, open questions
- `design/styles.css` — token system, components, animations
- `design/screens.jsx` — Home, Practice, Profile, Progress reference implementations
- `design/data.jsx` — `WORDS`, `LEVEL_LABEL/CLASS`, `bandClass`, `bandLabel`
- `design/icons.jsx` — 26 line icons (replaceable by lucide)
- `design/Pronounce.html` — app shell wiring (tab state, toast, defaults)
- `design/ios-frame.jsx`, `design/tweaks-panel.jsx` — **prototype-only, do not port**

### Codebase
- `frontend/package.json:12-34` — current deps
- `frontend/src/index.css:1-28` — current tokens (to replace)
- `frontend/tailwind.config.js` — current theme (to extend)
- `frontend/src/App.jsx:38-46` — current routing (to update)
- `frontend/src/pages/Home.jsx`, `Practice.jsx`, `Settings.jsx` — to rewrite/delete
- `frontend/src/services/azureSpeech.js:36` — Azure granularity (already `Phoneme`)
- `frontend/src/stores/{pronunciation,settings,theme}Store.js` — Zustand stores (refactor pronunciation)
