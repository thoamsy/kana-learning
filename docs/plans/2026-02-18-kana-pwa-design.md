# Kana Trainer Design (PWA + Expo-ready)

## Scope
- Learning target: hiragana/katakana baseline with voiced/semi-voiced sounds.
- Product goal: memorize kana through repeatable practice without pure rote memorization.
- Content scope for MVP: 120 high-frequency emoji-associated words.
- Platform goal: launch as PWA now, keep migration path to Expo easy later.

## Stack
- Web app: Next.js (App Router) + shadcn/ui + Tailwind.
- PWA: `next-pwa` with offline-first cache for app shell and lesson assets.
- Shared logic: TypeScript packages in workspace.
- Deploy: Vercel.

## Why IndexedDB and not localStorage
- `localStorage` is synchronous and can block rendering during frequent writes.
- It is string-only and poor for structured queries like "due cards by review time".
- IndexedDB supports object stores, indexes, and transactions; better for SRS data.

## IndexedDB API choice
- Use `Dexie` as the Web adapter over IndexedDB.
- Reason: much better DX than raw IndexedDB, robust schema/versioning, ergonomic indexed queries, transaction support.
- `idb` is also good but lower-level; for SRS query patterns Dexie reduces accidental complexity.

## Expo migration strategy
- Keep business logic in `packages/learning-core` (no DOM or browser globals).
- Keep vocabulary/kana dataset in `packages/content`.
- Define storage contract in `packages/storage`:
  - `StoragePort` interface for reads/writes.
  - `DexieStorage` implementation for web now.
  - Future `ExpoSqliteStorage` implementation for Expo.
- Result: migration mostly rewrites UI and storage adapter only.

## Core modules
- `packages/learning-core`
  - SRS scheduler
  - quiz generation (kana -> reading, reading -> kana)
  - scoring/streak/daily mission logic
- `packages/content`
  - kana metadata
  - emoji word cards
  - mapping and tags (script type, confusion sets)
- `packages/storage`
  - card progress persistence
  - review history
  - due card lookup

## MVP screens
- Home: daily progress, start review, start new cards.
- Study: emoji word card + bidirectional kana quiz.
- Review: due queue from SRS.
- Sprint: 30-second quick challenge.
- Collection: unlocked emoji words and weak kana highlights.

## Success metrics
- 7-day retention and completion rate of daily missions.
- Error reduction on katakana and voiced/semi-voiced pairs.
- Daily active learners and review consistency.
