# E2E Cases and Locator Contract

## Locator Strategy
- Prefer accessible locators first: `find role ... --name ...`.
- Use `data-testid` only for dynamic values or ambiguous targets.
- Do not use CSS class names as test selectors.

## Required Stable Locators
- `data-testid="daily-progress-value"`: shows completed count text.
- `data-testid="streak-value"`: shows current streak.
- `data-testid="study-question"`: active prompt text.
- `data-testid="study-option-1"` / `study-option-2`: deterministic option targets for e2e.
- `data-testid="study-step"`: current step (e.g. `3/12`).
- `data-testid="study-progress-bar"`: progress bar width reflects step.
- `data-testid="review-due-count"`: due cards number on review page.
- `data-testid="review-option-1"`: deterministic review submit target.
- `data-testid="collection-unlocked-count"`: unlocked card count.

## Case E2E-001 Home Loads
1. Open `/`.
2. Assert button `Start Study` exists.
3. Assert button `Review Due` exists.
4. Assert `daily-progress-value` exists.

## Case E2E-002 Bidirectional Study Flow
1. Open `/`.
2. Click `Start Study`.
3. Assert `study-question` exists.
4. Select an option and click `Next`.
5. Assert top toast appears with `Correct` or `Incorrect`.
6. For a correct answer, verify auto-advance within 800ms.
7. Verify question mode can switch across rounds:
   - kana -> reading
   - reading -> kana

## Case E2E-003 Progress Persistence
1. Complete one study answer.
2. Navigate back to `/`.
3. Record `daily-progress-value`.
4. Reload page.
5. Assert progress value remains the same.

## Case E2E-004 Review Queue
1. Seed due state via `/__test/reset?seed=due`.
2. Open `/review`.
3. Assert `review-due-count` > 0.
4. Complete one review item.
5. Assert due count decreases.

## Case E2E-005 Collection Unlock
1. Reset clean state.
2. Answer one study card correctly.
3. Open `/collection`.
4. Assert `collection-unlocked-count` increased.

## Case E2E-006 Katakana Focus
1. Open `/study?script=katakana`.
2. Assert prompt contains katakana content.
3. Submit wrong answer.
4. Assert toast auto-hides within ~1.5s and step does not advance automatically.
5. Open `/review`.
6. Assert failed katakana item appears as due.
