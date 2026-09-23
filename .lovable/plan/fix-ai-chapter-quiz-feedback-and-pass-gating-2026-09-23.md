# Fix AI chapter quiz feedback and pass gating

## Changes
- Update the shared AI chapter quiz to distinguish correct and incorrect answer feedback.
- For incorrect answers, show a clear Arabic correction, restate the correct option, and retain the existing explanation.
- Keep correct-answer praise unchanged.
- Extend the automatic feedback pause by a few seconds.
- Apply the chapter passing threshold before recording completion or unlocking navigation.
- Add a failed-result state that requires retaking the quiz and does not expose a next-chapter action.

## Verification
- Check correct-answer and wrong-answer feedback states.
- Check passing and failing summaries, including chapter navigation locks.
- Confirm the app builds cleanly.

## Technical details
- Implement once in the shared `QuizTab` and its parent state flow so every AI chapter receives the behavior.
- Derive pass/fail from the final score snapshot, and only persist completion for passing results.
