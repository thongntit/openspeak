# Word Collections & Vocabulary Study — Design Spec

**Date:** 2026-04-24  
**Branch:** feat/clerk-integrate (new branch from latest dev)

---

## Overview

Add a vocabulary study feature to OpenSpeak. Users import words from English class (word, IPA, word type, Vietnamese meaning) and practice them with a multiple-choice quiz — similar to Memrise/Duolingo. Collections are stored on the backend, tied to the user's Clerk account, with sharing between users planned for a future phase.

---

## Data Model (Backend)

### New entity: `user_collections`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | varchar | Clerk user ID, extracted server-side from JWT |
| name | varchar(200) | |
| description | text, nullable | |
| created_at | timestamp | |
| updated_at | timestamp | |

### New entity: `user_words`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| collection_id | uuid (FK → user_collections) | cascade delete |
| word | varchar(100) | |
| ipa | varchar(200), nullable | |
| word_type | varchar(20), nullable | noun / verb / adjective / adverb / other |
| vietnamese_meaning | text, nullable | |
| created_at | timestamp | |

These are entirely separate from the existing `words` and `collections` tables (the 3,000-word pronunciation database). No overlap.

---

## API Endpoints

All endpoints require a valid Clerk JWT (`Authorization: Bearer <token>`). The `user_id` is always extracted server-side — never trusted from the client.

```
POST   /user-collections                    create a collection
GET    /user-collections                    list my collections (with word count)
GET    /user-collections/:id               get one collection
DELETE /user-collections/:id               delete collection (cascades words)

POST   /user-collections/:id/words          add a word
GET    /user-collections/:id/words          list words in collection
DELETE /user-collections/:id/words/:wordId  remove a word
```

---

## Frontend Routes & Screens

### Screen 1: Home (`/`)

Refactored to a **2-column feature grid** as the main entry point:

```
┌──────────────┐  ┌──────────────┐
│ 🎤           │  │ 📚           │
│ Pronunciation│  │ Learn Words  │
│ Practice     │  │              │
└──────────────┘  └──────────────┘
```

- Pronunciation card → navigates to existing `/practice`
- Learn Words card → navigates to `/learn`
- Existing "Try These Words" featured words section remains below the grid

### Screen 2: Collections List (`/learn`)

```
← Learn Words                    [+ New]

┌──────────────┐  ┌──────────────┐
│ 📚           │  │ 📚           │
│ Week 3 Vocab │  │ Week 2 Vocab │
│  12 words    │  │   8 words    │
└──────────────┘  └──────────────┘

┌──────────────┐
│ + New        │
│ Collection   │
└──────────────┘
```

- 2-column card grid
- Tap card → opens `/learn/:id`
- "+ New" button (top right + grid card) → opens an inline modal with a name field and optional description; submits to create the collection then navigates to its detail page

### Screen 3: Collection Detail (`/learn/:id`)

```
← Week 3 Vocab

[+ Add Word]

abundant   /əˈbʌn.dənt/
adj  •  phong phú                [×]

scarce     /skɛrs/
adj  •  khan hiếm                [×]

─────────────────────────────────────
[▶  Study Collection]           ← sticky bottom bar
```

- Word list: word, IPA, type badge, Vietnamese meaning, delete button
- "+ Add Word" inline form: fields for word, IPA, word type (dropdown), Vietnamese meaning
- Sticky bottom Study button — thumb-friendly on mobile

### Screen 4: Study/Quiz (`/learn/:id/study`)

One question card at a time, 4 multiple-choice answers:

```
Week 3 Vocab    4 / 10
━━━━━━░░░░░░░░░░░░░░░  progress bar

        "abundant"

  What is the meaning?

  ┌──────────┐  ┌──────────┐
  │ phong phú│  │ khan hiếm│
  └──────────┘  └──────────┘
  ┌──────────┐  ┌──────────┐
  │  tươi tốt│  │  đầy đủ  │
  └──────────┘  └──────────┘
```

- 3 distractors pulled randomly from other words in the same collection
- Correct → green highlight, auto-advance after 1 second
- Wrong → red highlight, show correct answer, tap to continue
- End screen: score summary + Retry / Back to Collection buttons
- Settings icon (top right) opens study config panel

### Study Config (localStorage, per-device)

```js
{
  questionTypes: ['ipa', 'word_type', 'meaning'],  // all enabled by default
  questionsPerSession: 10,                          // default 10
  shuffleWords: true                                // default true
}
```

Config UI: toggles for each question type, number input for session length, shuffle toggle.

---

## New Frontend Files

```
src/pages/Learn.jsx                   # Collections list (/learn)
src/pages/CollectionDetail.jsx        # Collection detail (/learn/:id)
src/pages/Study.jsx                   # Quiz screen (/learn/:id/study)
src/services/userCollectionsApi.js    # API calls for user-collections endpoints
src/stores/studyConfigStore.js        # Zustand store for study config (persisted to localStorage)
```

**Modified files:**
- `src/pages/Home.jsx` — replace Quick Start card with 2-col feature grid
- `src/App.jsx` — add routes for /learn, /learn/:id, /learn/:id/study (all PrivateRoute)

---

## Out of Scope (future)

- Bulk file import (CSV/Excel)
- Sharing collections between users
- Spaced repetition algorithm (SRS)
- Progress tracking per word

---

## Constraints

- Mobile-first, all screens optimized for phone
- All user-collection endpoints protected by Clerk JWT
- Distractors for quiz require minimum 4 words in a collection (show warning if fewer)
- `word_type` and `vietnamese_meaning` are optional — for each word shown in the quiz, question types with no data on that specific word are skipped (e.g. if a word has no IPA, the IPA question type is not generated for that word)
- The existing Azure settings warning on Home is removed — Clerk auth replaces it
