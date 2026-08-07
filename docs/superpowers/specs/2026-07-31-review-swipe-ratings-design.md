# Review Swipe Ratings Design

## Goal

Let learners complete revealed multiple-choice review cards with a quick
horizontal swipe, while preserving the existing rating buttons for precise
control, keyboard use, and desktop use.

## Scope

- Change only the frontend Review experience.
- Reuse the existing review submission and retry path. There are no backend,
  API, scheduler, database, or content changes.
- Keep the four existing rating buttons after a card is revealed.

## Rating Rules

Swipe is available only for a multiple-choice card after the learner has
selected an option and its answer is revealed. Revealing an answer directly
with **Show Answer** does not enable swipe because no correct/wrong outcome is
available to map; the normal rating buttons remain available.

| Answer result | Swipe left | Swipe right |
| --- | --- | --- |
| Correct selected option | Easy | Hard |
| Wrong selected option | Good | Hard |

Guided-recall cards have no machine-verifiable answer. Their swipe gesture is
disabled even after the answer is shown. The UI tells the learner to answer
the prompt before using the existing rating buttons.

## Interaction

- Before an option is selected and revealed, a swipe does nothing.
- A pointer interaction on the revealed review card locks to a horizontal drag
  only after horizontal movement clearly exceeds vertical movement. Vertical
  scrolling remains native through `touch-action: pan-y`.
- During a valid horizontal drag, translate the card with the pointer and show
  the pending rating direction: Easy or Good on the left, Hard on the right.
- Releasing at or beyond a deliberate horizontal threshold submits that rating.
  Releasing below the threshold resets the card without recording a review.
- The first accepted swipe starts the existing single-flight submission and
  disables further swipes, rating buttons, and exit until it resolves.
- If the submission fails, restore the card and use the existing retry or
  refresh error UI. A swipe cannot bypass that state.

## Component and State Design

`Review.jsx` remains the owner of card UI state. A focused gesture helper or
hook may own pointer start coordinates, direction lock, drag offset, and the
release decision, but it must report a selected rating back to the existing
`submitRating(rating)` function.

The existing Zustand learning store continues to own `pendingReview`,
single-flight state, request IDs, server response replacement, and retry
behavior. The gesture does not add persisted state or create a second submit
path.

## Accessibility and Fallbacks

- Rating buttons remain visible and unchanged after reveal.
- They remain the keyboard, mouse, desktop, guided-recall, and fine-control
  fallback.
- Swipe feedback is supplementary; the submitted rating is always represented
  by the normal request and resulting next-card state.
- No gesture is active while the review UI is loading, submitting, or showing
  a review error.

## Verification

Frontend tests must prove:

1. Correct-answer swipes submit Easy on the left and Hard on the right.
2. Wrong-answer swipes submit Good on the left and Hard on the right.
3. Swipe is blocked before an option is selected and revealed (including a
   direct **Show Answer** reveal), for guided recall, while submitting, and
   while a review error is visible.
4. Short or vertical drags do not submit.
5. One qualifying swipe creates one request and advances to the server-returned
   next card.
6. Existing rating buttons continue to submit their current ratings.

Run the focused Review test, frontend lint, and production build. Perform a
375px browser check to confirm the card can still scroll vertically and the
bottom buttons remain reachable.

## Out of Scope

- Free-text answer grading or an extra self-assessment step for guided recall.
- Replacing the four rating buttons.
- Any changes to review rating values, FSRS scheduling, API request shape, or
  database schema.
