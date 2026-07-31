# English Tenses in Use Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand Gramio's existing present-tense deck into a 48-card intermediate course that teaches learners to use all twelve English tense-aspect forms.

**Architecture:** Retain the existing deck slug and its first twenty stable card keys, then append 28 original cards to the same versioned JSON bundle. Bump only the starter content version and assert the resulting source bundle through the existing TypeScript loader tests; retain attribution and editorial evidence in the content review document. The importer, UI, scheduler, schema, and release execution stay unchanged.

**Tech Stack:** Versioned JSON learning-content assets, TypeScript, Joi validation, Jest, NestJS build tooling, Markdown.

## Global Constraints

- Keep exactly six starter decks; update the bundle from 120 to 148 cards.
- Retain the deck slug `present-simple-vs-continuous`, sort order `40`, type `grammar`, and level `intermediate`.
- Preserve the current `present-tense-001` through `present-tense-020` cards without changing their content keys, sort orders, prompts, answers, explanations, examples, or options.
- Append exactly 28 new cards in sort order 21 through 48. Every multiple-choice card must have two to four unique choices and contain its complete exact answer; the four guided-recall cards have no `options` field.
- Cover present, past, and future simple, continuous, perfect, and perfect continuous forms. Contexts must be intermediate, practical, original, and have one defensible answer.
- Use Excelsior OWL's *Verb Tense* CC BY 4.0 activity only as an attributed editorial reference. Do not copy exercise wording or use material restricted by non-commercial, no-derivatives, or unclear reuse terms.
- Do not change frontend code, endpoints, database schema, migrations, FSRS, Library enrolment, Today, Review, authentication, or run a database import/deployment.
- A live release remains a separately authorised action: it requires the existing database-preparation command, aggregate database proof of six published decks and 148 active cards, and the protected promotion/runbook process.

---

## File Structure

- Modify `backend/src/database/content/starter/manifest.json`: declare starter content version `2026.07.2`; the deck file list remains unchanged.
- Modify `backend/src/database/content/starter/present-simple-vs-continuous.json`: retain the original 20 cards, rename the deck, update its description, and append 28 original intermediate grammar cards.
- Modify `backend/src/database/content/learning-content.loader.spec.ts`: make the curated-bundle test assert the new source version, deck name, 48-card structure, stable key sequence, options/recall contract, and 148-card total.
- Modify `docs/content/starter-content-review.md`: update the editorial totals and convert the tense-deck review into the authoritative 48-card review with a CC BY attribution record.

## Task 1: Lock the Curated Bundle Contract Before Editing Content

**Files:**
- Modify: `backend/src/database/content/learning-content.loader.spec.ts:320-335`
- Modify: `backend/src/database/content/starter/manifest.json:1-13`
- Modify: `backend/src/database/content/starter/present-simple-vs-continuous.json:1-280`
- Test: `backend/src/database/content/learning-content.loader.spec.ts`

**Interfaces:**
- Consumes: `loadLearningContent(): LearningContentBundle` from `backend/src/database/content/learning-content.loader.ts`.
- Produces: a verified `starter@2026.07.2` source bundle with the existing six deck slugs, a renamed tense deck, and 148 cards.

- [ ] **Step 1: Replace the source-specific assertions with the expected expanded-bundle contract**

  In the `loads the curated starter production bundle` test, retain the six-slug assertion and replace the version/card-count assertions with this contract. Leave `createValidContent()` and its `2026.07.1` fixture unchanged: it is a deliberately independent validation fixture, not the published source bundle.

  ```ts
  const expectedNewTenseKeys = [
    'present-perfect-001',
    'present-perfect-002',
    'present-perfect-continuous-001',
    'present-perfect-continuous-002',
    'past-simple-001',
    'past-continuous-001',
    'past-perfect-001',
    'past-perfect-continuous-001',
    'future-simple-001',
    'future-continuous-001',
    'future-perfect-001',
    'future-perfect-continuous-001',
    'tense-contrast-001',
    'tense-contrast-002',
    'tense-contrast-003',
    'tense-contrast-004',
    'tense-contrast-005',
    'tense-contrast-006',
    'tense-contrast-007',
    'tense-contrast-008',
    'tense-correction-001',
    'tense-correction-002',
    'tense-correction-003',
    'tense-correction-004',
    'tense-recall-001',
    'tense-recall-002',
    'tense-recall-003',
    'tense-recall-004',
  ];
  const expectedRetainedTenseKeys = Array.from(
    { length: 20 },
    (_, index) => `present-tense-${String(index + 1).padStart(3, '0')}`,
  );

  expect(bundle.databaseContentVersion).toBe('starter@2026.07.2');
  const tenseDeck = bundle.decks.find(
    (deck) => deck.slug === 'present-simple-vs-continuous',
  );
  expect(tenseDeck).toMatchObject({
    name: 'English Tenses in Use',
    type: 'grammar',
    level: 'intermediate',
    sortOrder: 40,
    isPublished: true,
  });
  expect(tenseDeck?.cards).toHaveLength(48);
  expect(tenseDeck?.cards.map((card) => card.contentKey)).toEqual([
    ...expectedRetainedTenseKeys,
    ...expectedNewTenseKeys,
  ]);
  expect(tenseDeck?.cards.map((card) => card.sortOrder)).toEqual(
    Array.from({ length: 48 }, (_, index) => index + 1),
  );
  expect(
    tenseDeck?.cards
      .filter((card) => card.options === undefined)
      .map((card) => card.contentKey),
  ).toEqual([
    'tense-recall-001',
    'tense-recall-002',
    'tense-recall-003',
    'tense-recall-004',
  ]);
  expect(bundle.decks.flatMap((deck) => deck.cards)).toHaveLength(148);
  ```

- [ ] **Step 2: Run the focused test to establish the expected failure**

  Run: `npm test -- --runInBand src/database/content/learning-content.loader.spec.ts`

  Expected: FAIL because the source still loads `starter@2026.07.1`, the deck has its old name, and it contains only 20 cards / 120 total cards.

- [ ] **Step 3: Bump the manifest without altering the six-file topology**

  In `backend/src/database/content/starter/manifest.json`, change only:

  ```json
  "contentVersion": "2026.07.2"
  ```

  Keep `schemaVersion`, `namespace`, and all six entries of `deckFiles` byte-for-byte unchanged.

- [ ] **Step 4: Rename the deck and append the exact 28-card catalog**

  In `present-simple-vs-continuous.json`, change the top-level metadata to:

  ```json
  "name": "English Tenses in Use",
  "description": "Use all twelve English tense-aspect forms in practical present, past, and future situations."
  ```

  Leave card 1 through card 20 unchanged. Append these original cards after
  `present-tense-020`; every appended record has `"type": "grammar"` and
  `"level": "intermediate"`.

  | Order / content key | Exact prompt and answer | Required explanation and options |
  | --- | --- | --- |
  | 21 `present-perfect-001` | `Mai bought the café in 2022 and still owns it. Complete: Mai ___ the café since 2022.` → `Mai has owned the café since 2022.` | Explain that present perfect links a state begun in the past to now; options: exact answer, `Mai owned the café since 2022.`, `Mai has been owning the café since 2022.`; example: `We have known our neighbors for years.` |
  | 22 `present-perfect-002` | `Ask about an experience at any time before now: ___ sushi?` → `Have you ever tried sushi?` | Explain `ever` asks about life experience up to now; options: exact answer, `Have you ever try sushi?`, `Did you try sushi tomorrow?`; example: `Have you ever visited Da Nang?` |
  | 23 `present-perfect-continuous-001` | `Nam has paint on his hands because the activity started an hour ago and is still continuing. Complete: Nam ___ the kitchen for an hour.` → `Nam has been painting the kitchen for an hour.` | Explain present perfect continuous focuses on an activity's duration from past to now; options: exact answer, `Nam painted the kitchen for an hour.`, `Nam has painted the kitchen for an hour.`; example: `I have been waiting for the bus since eight.` |
  | 24 `present-perfect-continuous-002` | `Use the present perfect continuous to explain your tiredness: I ___ since dawn.` → `I have been working since dawn.` | Explain the form `have been` plus verb-ing shows ongoing recent activity; options: exact answer, `I worked since dawn.`, `I have worked since dawn.`; example: `She has been studying all afternoon.` |
  | 25 `past-simple-001` | `The flight landed once at 9:00 last night. Complete: The flight ___ at 9:00 last night.` → `The flight landed at 9:00 last night.` | Explain simple past describes a finished action at a specific past time; options: exact answer, `The flight has landed at 9:00 last night.`, `The flight was landing at 9:00 last night.`; example: `Our guests arrived after dinner.` |
  | 26 `past-continuous-001` | `At 9:00 last night, the action was in progress. Complete: I ___ for tomorrow's meeting at 9:00 last night.` → `I was preparing for tomorrow's meeting at 9:00 last night.` | Explain past continuous describes an action in progress at a past time; options: exact answer, `I prepared for tomorrow's meeting at 9:00 last night.`, `I had prepared for tomorrow's meeting at 9:00 last night.`; example: `They were driving home when it began to rain.` |
  | 27 `past-perfect-001` | `Use the past perfect to show that the server restart happened before the update began: The server ___ before the update began.` → `The server had restarted before the update began.` | Explain past perfect marks the earlier of two stated past actions; options: exact answer, `The server restarted before the update began.`, `The server was restarting before the update began.`; example: `The meeting had ended before I arrived.` |
  | 28 `past-perfect-continuous-001` | `Use past perfect continuous for the duration before the meeting: The team ___ the proposal for an hour before the meeting began.` → `The team had been discussing the proposal for an hour before the meeting began.` | Explain past perfect continuous shows duration leading up to a past point; options: exact answer, `The team was discussing the proposal for an hour before the meeting began.`, `The team had discussed the proposal for an hour before the meeting began.`; example: `She had been driving for two hours when she stopped.` |
  | 29 `future-simple-001` | `Make a prediction based on your opinion: I think the new feature ___ popular.` → `I think the new feature will be popular.` | Explain `will` expresses a prediction; options: exact answer, `I think the new feature is being popular.`, `I think the new feature will being popular.`; example: `I think the weather will improve tomorrow.` |
  | 30 `future-continuous-001` | `At 3:00 tomorrow, the appointment will be in progress. Complete: At 3:00 tomorrow, I ___ with the client.` → `At 3:00 tomorrow, I will be meeting with the client.` | Explain future continuous describes an action in progress at a specified future time; options: exact answer, `At 3:00 tomorrow, I will meet with the client.`, `At 3:00 tomorrow, I will have met with the client.`; example: `This time next week, we will be travelling.` |
  | 31 `future-perfect-001` | `Use the future perfect for a task completed before Friday: By Friday, Elena ___ the report.` → `By Friday, Elena will have finished the report.` | Explain future perfect shows completion before a future deadline; options: exact answer, `By Friday, Elena will finish the report.`, `By Friday, Elena will have been finishing the report.`; example: `By noon, I will have sent the invoices.` |
  | 32 `future-perfect-continuous-001` | `Use future perfect continuous for Sam's ongoing employment: By July, Sam ___ here for five years.` → `By July, Sam will have been working here for five years.` | Explain future perfect continuous shows a duration continuing up to a future time; options: exact answer, `By July, Sam will work here for five years.`, `By July, Sam will have worked here for five years.`; example: `In December, they will have been living there for a decade.` |
  | 33 `tense-contrast-001` | `Choose the pair that reports a completed action yesterday and an unfinished result now: I ___ the invoice yesterday, but I ___ the receipt yet.` → `I sent the invoice yesterday, but I have not received the receipt yet.` | Explain the dated action takes simple past while `yet` connects the missing receipt to now; options: exact answer, `I have sent the invoice yesterday, but I did not receive the receipt yet.`, `I was sending the invoice yesterday, but I have not received the receipt yet.`; example: `We booked the room last week, but we have not received confirmation yet.` |
  | 34 `tense-contrast-002` | `Emphasize the ongoing activity, not its finished result: Leo ___ the proposal since 8:00 a.m., so he needs a break.` → `Leo has been writing the proposal since 8:00 a.m., so he needs a break.` | Explain present perfect continuous emphasizes activity and duration; options: exact answer, `Leo has written the proposal since 8:00 a.m., so he needs a break.`, `Leo wrote the proposal since 8:00 a.m., so he needs a break.`; example: `They have been testing the app all morning.` |
  | 35 `tense-contrast-003` | `One action interrupted another. Complete: While I ___ to the office, a cyclist ___ a bag.` → `While I was walking to the office, a cyclist dropped a bag.` | Explain past continuous supplies the background action and simple past supplies the completed interrupting event; options: exact answer, `While I walked to the office, a cyclist was dropping a bag.`, `While I had walked to the office, a cyclist dropped a bag.`; example: `While we were eating, the lights went out.` |
  | 36 `tense-contrast-004` | `Use past perfect to make the sequence explicit: First the server restarted; then the update began. Complete: The server ___ before the update began.` → `The server had restarted before the update began.` | Explain the past perfect makes the earlier action explicit; options: exact answer, `The server was restarting before the update began.`, `The server has restarted before the update began.`; example: `I had saved the file before the laptop shut down.` |
  | 37 `tense-contrast-005` | `Emphasize the length of the activity before the past event: The team ___ for an hour when the manager arrived.` → `The team had been discussing the plan for an hour when the manager arrived.` | Explain past perfect continuous focuses on duration before a past event; options: exact answer, `The team discussed the plan for an hour when the manager arrived.`, `The team was discussing the plan for an hour when the manager arrived.`; example: `We had been waiting for thirty minutes when the bus came.` |
  | 38 `tense-contrast-006` | `At this exact time tomorrow, the flight will be in progress. Complete: This time tomorrow, we ___ to Singapore.` → `This time tomorrow, we will be flying to Singapore.` | Explain future continuous describes an in-progress action at a future time; options: exact answer, `This time tomorrow, we will fly to Singapore.`, `This time tomorrow, we will have flown to Singapore.`; example: `At noon, I will be presenting the budget.` |
  | 39 `tense-contrast-007` | `The tickets are already booked. Use present continuous for the fixed arrangement: We ___ at the Riverside Hotel on Friday.` → `We are staying at the Riverside Hotel on Friday.` | Explain present continuous can express an arranged personal future plan; options: exact answer, `We will be staying at the Riverside Hotel on Friday.`, `We have stayed at the Riverside Hotel on Friday.`; example: `I am meeting the designer tomorrow morning.` |
  | 40 `tense-contrast-008` | `Use future perfect continuous to focus on duration up to a deadline: By next December, Priya ___ for this company for ten years.` → `By next December, Priya will have been working for this company for ten years.` | Explain future perfect continuous emphasizes duration, unlike future perfect's completed result; options: exact answer, `By next December, Priya will have worked for this company for ten years.`, `By next December, Priya will be working for this company for ten years.`; example: `By 2030, I will have been teaching for fifteen years.` |
  | 41 `tense-correction-001` | `Correct the tense error: “I have met her at the workshop yesterday.”` → `I met her at the workshop yesterday.` | Explain a finished event with `yesterday` requires simple past; options: exact answer, `I have met her at the workshop yesterday.`, `I was meeting her at the workshop yesterday.`; example: `We signed the contract last Monday.` |
  | 42 `tense-correction-002` | `Correct the tense error. The action was in progress at 8:00 last night: “At 8:00 last night, I prepared dinner.”` → `At 8:00 last night, I was preparing dinner.` | Explain an action in progress at a specific past time uses past continuous; options: exact answer, `At 8:00 last night, I prepared dinner.`, `At 8:00 last night, I had prepared dinner.`; example: `At noon, they were discussing the schedule.` |
  | 43 `tense-correction-003` | `Correct the tense error: “By the deadline on Friday, we will finish the report.”` → `By the deadline on Friday, we will have finished the report.` | Explain future perfect marks completion before a deadline; options: exact answer, `By the deadline on Friday, we will finish the report.`, `By the deadline on Friday, we will have been finishing the report.`; example: `By tomorrow, I will have completed the form.` |
  | 44 `tense-correction-004` | `Correct the tense error using future perfect continuous: “By June, Sam will work here for five years.”` → `By June, Sam will have been working here for five years.` | Explain future perfect continuous shows the duration up to June; options: exact answer, `By June, Sam will work here for five years.`, `By June, Sam will have worked here for five years.`; example: `By August, we will have been renting this office for a year.` |
  | 45 `tense-recall-001` | `Use present perfect to complete the unfinished-result sentence: I ___ (not / receive) a reply yet.` → `I have not received a reply yet.` | Explain `yet` with an unfinished result calls for present perfect; omit `options`; example: `She has not called me yet.` |
  | 46 `tense-recall-002` | `Use past perfect to complete: The taxi ___ (leave) before we reached the hotel.` → `The taxi had left before we reached the hotel.` | Explain past perfect marks the earlier past action; omit `options`; example: `The store had closed before we arrived.` |
  | 47 `tense-recall-003` | `Use future continuous to complete: At 10:00 on Tuesday, I ___ (present) the budget.` → `At 10:00 on Tuesday, I will be presenting the budget.` | Explain future continuous describes an action in progress at a future time; omit `options`; example: `At six, they will be having dinner.` |
  | 48 `tense-recall-004` | `Use future simple to make an offer: I ___ (carry) your bag.` → `I will carry your bag.` | Explain future simple with `will` can make an immediate offer; omit `options`; example: `I will call a taxi for you.` |

  Format every multiple-choice item exactly like existing cards: a full-sentence
  `front`, `answer`, `explanation`, `example`, `options`, and `sortOrder`.
  Do not add an empty `options` array to cards 45 through 48.

- [ ] **Step 5: Re-run the focused loader test and inspect the source bundle**

  Run: `npm test -- --runInBand src/database/content/learning-content.loader.spec.ts`

  Expected: PASS, including `starter@2026.07.2`, `English Tenses in Use`, the
  retained first 20 keys, 28 appended keys, four guided-recall cards, and 148
  total cards.

  Then run this read-only catalog check from `backend`:

  ```bash
  node -e "const d=require('./src/database/content/starter/present-simple-vs-continuous.json'); const c=d.cards; const fronts=new Set(c.map(x=>x.front.normalize('NFKC').trim().replace(/\\s+/g,' ').toLowerCase())); const examples=new Set(c.map(x=>x.example.normalize('NFKC').trim().replace(/\\s+/g,' ').toLowerCase())); if (d.name !== 'English Tenses in Use' || c.length !== 48 || fronts.size !== 48 || examples.size !== 48 || c.some(x => x.options && (!x.options.includes(x.answer) || new Set(x.options).size !== x.options.length)) || c.filter(x => !x.options).length !== 4) process.exit(1);"
  ```

  Expected: exit status `0` with no output.

- [ ] **Step 6: Commit the tested content contract and assets**

  ```bash
  git add backend/src/database/content/learning-content.loader.spec.ts \
    backend/src/database/content/starter/manifest.json \
    backend/src/database/content/starter/present-simple-vs-continuous.json
  git commit -m "feat: expand intermediate tense deck"
  ```

## Task 2: Record Editorial Review and License Attribution

**Files:**
- Modify: `docs/content/starter-content-review.md:1-131`
- Test: `docs/content/starter-content-review.md` via consistency checks in Task 3

**Interfaces:**
- Consumes: the imported JSON bundle from Task 1 and its verified `starter@2026.07.2` / six-deck / 148-card summary.
- Produces: the canonical human-readable editorial and attribution record for published starter content.

- [ ] **Step 1: Update the document-wide bundle facts**

  Change the review header to `Bundle: starter@2026.07.2`, set the review date
  to `2026-07-31`, and set the scope to `six published decks: five 20-card
  decks and one 48-card deck, 148 cards total`. In the review-method paragraph,
  change the all-card count, prompt count, and example count from 120 to 148.
  Retain the existing seven-JSON-file assertion because the manifest and six
  deck files are unchanged.

- [ ] **Step 2: Replace only the tense-deck review section**

  Rename `## Present Simple vs. Present Continuous` to `## English Tenses in
  Use`; retain the stable slug; set `Cards read: 48 of 48`; and state that
  `present-tense-001` through `present-tense-020` were retained while cards 21
  through 48 add the remaining tense forms, contrasts, corrections, and guided
  recall.

  Replace its completed gates with these explicit assertions:

  ```markdown
  - [x] Coverage: all twelve English tense-aspect forms appear in practical
        present, past, and future contexts.
  - [x] Unique answer support: time markers, stated meaning, and guided tense
        requests select one complete answer.
  - [x] Explanation consistency: every explanation states the same time
        relationship represented by its answer.
  - [x] Natural examples: every example is an original, ordinary sentence and
        no normalized example is duplicated elsewhere in the bundle.
  - [x] Level consistency: the deck requires intermediate learners to choose
        among nearby forms rather than merely recite a conjugation.
  - [x] Duplicate scan: all 48 normalized prompts are unique within the deck;
        all 148 normalized prompts and examples are unique across the bundle.
  - [x] Option/answer consistency: all 44 multiple-choice cards have two or
        three unique choices containing the exact complete answer; the four
        guided-recall cards intentionally omit options.
  - [x] Card count: exactly 48 cards, `present-tense-001` through
        `present-tense-020` followed by the 28 keys asserted in the loader test.
  ```

- [ ] **Step 3: Add the required attribution immediately after the tense-deck gates**

  Add this Markdown subsection, with the source URL kept clickable:

  ```markdown
  ### Source attribution

  *Verb Tense*, Excelsior Online Writing Lab (OWL), Excelsior University,
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/),
  <https://owl.excelsior.edu/writing-refresher/grammar-refresher/verb-tense/>.
  Gramio adapted the learning objectives and exercise patterns and rewrote all
  published prompts, answers, explanations, examples, and distractors.
  ```

- [ ] **Step 4: Review the documentation diff and commit it**

  Run: `git diff --check && git diff -- docs/content/starter-content-review.md`

  Expected: no whitespace errors; only the updated bundle facts, the expanded
  tense-deck review, and its CC BY attribution change.

  ```bash
  git add docs/content/starter-content-review.md
  git commit -m "docs: review all-tenses starter deck"
  ```

## Task 3: Run the Release-Independent Verification Gate

**Files:**
- Verify: `backend/src/database/content/starter/manifest.json`
- Verify: `backend/src/database/content/starter/present-simple-vs-continuous.json`
- Verify: `backend/src/database/content/learning-content.loader.spec.ts`
- Verify: `docs/content/starter-content-review.md`

**Interfaces:**
- Consumes: the committed content assets, contract test, and editorial record from Tasks 1 and 2.
- Produces: local evidence that the authoring change is structurally sound and buildable, without claiming database, deployment, or authenticated browser proof.

- [ ] **Step 1: Run the targeted source-loader regression test**

  Run: `npm test -- --runInBand src/database/content/learning-content.loader.spec.ts`

  Expected: PASS with one Jest suite and no validation failures.

- [ ] **Step 2: Run the complete backend unit suite**

  Run: `npm test -- --runInBand`

  Expected: PASS. The synthetic seeder and database-preparation fixtures may
  retain `2026.07.1` because they validate fixture behavior, not the checked-in
  starter asset.

- [ ] **Step 3: Build the production backend image assets**

  Run: `npm run build`

  Expected: exit status `0`; the compiled output includes the updated starter
  JSON assets through the existing Nest asset configuration.

- [ ] **Step 4: Confirm the final change set and verification boundary**

  Run: `git status --short --branch && git log --oneline -2`

  Expected: no uncommitted files related to this feature and two focused commits
  after the design/plan commits. Report the local test/build evidence as source
  readiness only. Do not run `db:prepare`, Coolify commands, or production
  promotion without fresh user authorisation.
