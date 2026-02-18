# Kana Trainer E2E-First Design

## Goal
Build the product from user journeys first, then make implementation details serve those journeys. The app is accepted only when real browser flows pass end-to-end, including persistence and repeat practice loops.

## E2E-First Principles
- Define acceptance by learner outcomes, not component completion.
- Keep critical paths small: learn -> answer -> feedback -> persist -> review due cards.
- Test from UI through storage adapter (Dexie) in one pass.
- Freeze deterministic fixtures so e2e results are stable.

## Primary User Journeys (MVP)
1. First session
- Open app, choose daily target, start first study set.
- Complete 10 bidirectional prompts (kana -> reading, reading -> kana).
- See progress update and streak start.

2. Return session
- Reopen app later.
- Due cards appear from SRS.
- Complete review and verify next due schedule changed.

3. Katakana weak-spot loop
- Enter weak-spot drill.
- Complete focused katakana set.
- Wrong answers are queued with higher priority.

4. Emoji vocabulary reinforcement
- Study card shows kana, meaning, and emoji cue.
- Correct answers unlock item in collection.
- Collection persists after reload.

## Test Layers
- Unit: SRS math and queue strategy in `packages/learning-core`.
- Contract: storage behaviors against `StoragePort`.
- E2E smoke: `agent-browser` scripts on deployed Vercel preview/prod.
- E2E regression: key journeys run on each release candidate.

## Test Data Strategy
- Seed a fixed 120-word dataset with stable IDs.
- Expose a test-only reset hook in web app (`/__test/reset`) to clear learner state safely.
- Use deterministic "now" in test mode for due-card assertions.

## E2E Cases (minimum release gate)
1. Home loads with daily mission.
2. Start study from home.
3. Submit correct and incorrect answers.
4. Progress/streak updates after answer.
5. Review queue appears after due-time shift.
6. Collection shows unlocked emoji word after success.
7. Data survives browser reload.

## Agent-Browser Execution Model
- Use `agent-browser` for black-box checks against local and Vercel URLs.
- Keep scripts stateless by resetting app data before each run.
- Capture screenshot on failure point for debugging.

## CI Strategy
- Trigger e2e on preview deployment URL.
- Run desktop smoke always; mobile smoke nightly (iOS simulator optional).
- Block production promote if smoke fails.

## Expo-Ready Constraint
- E2E assertions target behavior, not DOM internals.
- Shared behavior specs can be reused in Expo e2e later with another driver.
