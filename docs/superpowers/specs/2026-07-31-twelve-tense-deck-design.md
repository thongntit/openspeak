# English Tenses in Use Deck Design

## Goal

Replace Gramio's narrow present-tense deck with one intermediate grammar deck
that lets learners recognise, choose, and produce all twelve standard English
tense-aspect forms efficiently in everyday and workplace contexts.

## Confirmed Product Behavior

- The existing `present-simple-vs-continuous` deck is expanded in place and
  renamed **English Tenses in Use**. Its slug remains unchanged so existing
  learner enrolments and card progress stay attached to the same deck.
- The deck remains `grammar` and `intermediate`, with 48 active cards in a
  deterministic order.
- The first 20 cards retain their stable `present-tense-001` through
  `present-tense-020` keys and their current focused present-tense learning
  targets. Twenty-eight new cards use new stable keys.
- Learners work through a full-tense course in the current review experience;
  no new UI, answer evaluator, scheduler, or database schema is required.

## Content Structure

The deck is ordered to make each tense recognisable before requiring learners
to distinguish it from nearby alternatives.

| Cards | Purpose | Coverage |
| --- | --- | --- |
| 1-20 | Retained foundation: existing present-simple versus present-continuous decisions | Habits, facts, states, timetables, arrangements, current actions, temporary situations, and trends |
| 21-32 | Extend the foundation with form/use decisions for the remaining tense forms | Present perfect and present perfect continuous; past and future simple, continuous, perfect, and perfect continuous |
| 33-40 | Contrast: select the tense that matches the time relationship | Present perfect vs. past simple; duration vs. result; completed past vs. background action; future plans vs. predictions; earlier/later past and future actions |
| 41-44 | Error correction: repair one realistic tense error and explain the reason | Mixed tense forms, prioritising commonly confused pairs |
| 45-48 | Guided free recall: complete short work and daily-life scenarios with the named tense | Mixed mastery across present, past, and future |

Every card has a single defensible answer, a concise explanation, and a
different original example. Multiple-choice cards use two to four plausible,
unique choices including the exact answer. Guided free-recall cards omit
options and give an unambiguous sentence frame.

The twelve tense-aspect forms covered are:

1. present simple;
2. present continuous;
3. present perfect;
4. present perfect continuous;
5. past simple;
6. past continuous;
7. past perfect;
8. past perfect continuous;
9. future simple;
10. future continuous;
11. future perfect; and
12. future perfect continuous.

## Source and Attribution

The editorial reference and question source is Excelsior OWL's *Verb Tense*
activity, licensed under Creative Commons Attribution 4.0. Gramio will adapt
its learning objectives and exercise patterns, but will write its own prompts,
answers, explanations, examples, and distractors for the app.

Add a content-attribution section to `docs/content/starter-content-review.md`
that records the source title, URL, CC BY 4.0 license, author/publisher, and
that the Gramio cards are adapted and rewritten. The app's schema has no
per-card attribution field, so this repository documentation is the canonical
attribution record.

Do not copy from sources carrying non-commercial, no-derivatives, or unclear
reuse terms. In particular, EcampusOntario's *Verb Tenses for English for
Academic Purposes* may inform a private editorial check but is not a source for
Gramio's published text because it is CC BY-NC-SA.

## Bundle and Import Design

Only the existing starter bundle changes:

1. Update `backend/src/database/content/starter/present-simple-vs-continuous.json`
   with its new name, description, and 48 cards.
2. Bump `manifest.json` from `2026.07.1` to `2026.07.2`.
3. Update source assertions and the editorial review from 120 to 148 active
   cards while retaining six published decks.

The existing loader, validation rules, and transactional importer are the
source of truth. Its normal import upserts the stable deck and card keys in one
transaction, preserves user review data for retained cards, activates the new
cards, and records the new starter content version. No migration is needed.

This is a content update, not a frontend feature. Library enrolment, Today,
Review, authentication, and FSRS scheduling remain unchanged.

## Validation and Release Boundary

Before a change is ready for review, validation must prove:

- the bundle loads with six decks and 148 cards;
- every deck and card passes the schema and cross-document checks;
- prompts, examples, card keys, and sort orders are unique where the loader
  requires uniqueness;
- every options array contains the exact answer and has no duplicate choices;
- each card has one correct answer and the 48-card sequence covers all twelve
  tenses at the stated intermediate level; and
- the backend test suite and production build pass.

The content change is not a live release by itself. A future authorised release
must run the existing idempotent database-preparation command in development,
verify six published decks and 148 active cards, then follow the protected
promotion and production runbook. Authenticated mobile acceptance remains a
separate user-visible release gate.

## Out of Scope

- a new content type, data model, or database migration;
- a free-text grammar evaluator or AI feedback;
- changes to Review scoring, scheduling, Library enrolment, or deck UI;
- beginner-only conjugation drills without usage context; and
- copying question wording from sources that lack compatible reuse terms.

## Acceptance Criteria

1. The existing deck appears as **English Tenses in Use** and has 48 active
   intermediate grammar cards after import.
2. A learner can encounter and distinguish every one of the twelve defined
   English tense-aspect forms in the deck.
3. Existing progress for the original 20 stable card keys is preserved by the
   importer; new cards are added without duplicate records.
4. Source attribution for the adapted CC BY material is present in the
   editorial review.
5. Source validation, targeted content tests, backend tests, and the backend
   production build pass before any release is considered.
