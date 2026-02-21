"use client";

import { wordCards, type EmojiWordCard } from "@kana/content";
import {
  addDaysIso,
  INITIAL_EASE,
  INITIAL_INTERVAL_DAYS,
  scheduleNext,
  type ReviewRating,
} from "@kana/learning-core";
import { DexieWebStorage, type ReviewCardProgress } from "@kana/storage";

export type QuestionMode = "kana-to-reading" | "reading-to-kana";
export interface CollectionEntry {
  id: string;
  script: "hiragana" | "katakana";
  kana: string;
  romaji: string;
  meaning: string;
  emoji: string;
  unlocked: boolean;
  reps: number;
  firstUnlockedAt?: string;
}

export interface CollectionSnapshot {
  total: number;
  unlockedTotal: number;
  hiragana: CollectionEntry[];
  katakana: CollectionEntry[];
}

const storage = new DexieWebStorage();
const cardById = new Map(wordCards.map((card) => [card.id, card]));

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededShuffle<T>(items: T[], seed: string): T[] {
  const list = [...items];
  let state = hashSeed(seed) || 1;

  for (let index = list.length - 1; index > 0; index -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const swapIndex = state % (index + 1);
    [list[index], list[swapIndex]] = [list[swapIndex], list[index]];
  }

  return list;
}

function getCardSignature(card: Pick<EmojiWordCard, "script" | "kana" | "romaji">): string {
  return `${card.script}:${card.kana}:${card.romaji}`;
}

function dedupeCardsByWord(cards: EmojiWordCard[]): EmojiWordCard[] {
  const seen = new Set<string>();
  const unique: EmojiWordCard[] = [];

  for (const card of cards) {
    const signature = getCardSignature(card);
    if (seen.has(signature)) {
      continue;
    }
    seen.add(signature);
    unique.push(card);
  }

  return unique;
}

function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

function daysBetweenKeys(startKey: string, endKey: string): number {
  const start = new Date(`${startKey}T00:00:00.000Z`).getTime();
  const end = new Date(`${endKey}T00:00:00.000Z`).getTime();
  return Math.round((start - end) / (24 * 60 * 60 * 1000));
}

export function getStudyCards(
  script?: "hiragana" | "katakana",
  limit = 20,
  shuffleSeed?: string
): EmojiWordCard[] {
  const pool = script ? wordCards.filter((card) => card.script === script) : wordCards;
  const uniquePool = dedupeCardsByWord(pool);
  const source = shuffleSeed ? seededShuffle(uniquePool, shuffleSeed) : uniquePool;
  return source.slice(0, limit);
}

export function buildQuestion(card: EmojiWordCard, mode: QuestionMode, shuffleSeed?: string): {
  prompt: string;
  correctAnswer: string;
  options: string[];
} {
  const correctAnswer = mode === "kana-to-reading" ? card.romaji : card.kana;
  const allValues = Array.from(
    new Set(
      wordCards
        .filter((item) => (mode === "kana-to-reading" ? true : item.script === card.script))
        .map((item) => (mode === "kana-to-reading" ? item.romaji : item.kana))
    )
  );

  const distractors = seededShuffle(
    allValues.filter((value) => value !== correctAnswer),
    `${shuffleSeed ?? `${card.id}:${mode}`}:distractors`
  ).slice(0, 3);
  const options = seededShuffle([correctAnswer, ...distractors], shuffleSeed ?? `${card.id}:${mode}`);
  const prompt = mode === "kana-to-reading" ? card.kana : card.romaji;

  return { prompt, correctAnswer, options };
}

export async function submitAnswer(cardId: string, isCorrect: boolean): Promise<void> {
  const nowIso = new Date().toISOString();
  const rating: ReviewRating = isCorrect ? 3 : 0;
  const existing = await storage.getCardProgress(cardId);

  const currentEase = existing?.ease ?? INITIAL_EASE;
  const currentIntervalDays = existing?.intervalDays ?? INITIAL_INTERVAL_DAYS;
  const next = scheduleNext({ ease: currentEase, intervalDays: currentIntervalDays, rating });

  const dueAt = isCorrect ? addDaysIso(nowIso, next.intervalDays) : nowIso;
  const firstUnlockedAt = existing?.firstUnlockedAt ?? existing?.lastReviewedAt ?? nowIso;
  const progress: ReviewCardProgress = {
    cardId,
    script: cardById.get(cardId)?.script ?? "hiragana",
    ease: next.ease,
    intervalDays: next.intervalDays,
    dueAt,
    firstUnlockedAt,
    lastReviewedAt: nowIso,
    lapses: (existing?.lapses ?? 0) + (isCorrect ? 0 : 1),
    reps: (existing?.reps ?? 0) + 1,
    updatedAt: nowIso,
  };

  await storage.upsertCardProgress(progress);
  await storage.appendReviewLog({ cardId, rating, reviewedAt: nowIso });
}

export async function getDueCards(limit = 50): Promise<EmojiWordCard[]> {
  const due = await storage.listDueCardProgress(new Date().toISOString(), limit);
  return due.map((item) => cardById.get(item.cardId)).filter((item): item is EmojiWordCard => Boolean(item));
}

export async function getUnlockedCards(): Promise<EmojiWordCard[]> {
  const allProgress = await storage.listAllCardProgress();
  const unlocked = allProgress.filter((item) => item.reps > 0);
  return unlocked
    .map((item) => cardById.get(item.cardId))
    .filter((item): item is EmojiWordCard => Boolean(item));
}

function compareCollectionEntries(left: CollectionEntry, right: CollectionEntry): number {
  if (left.unlocked !== right.unlocked) {
    return left.unlocked ? -1 : 1;
  }

  if (left.unlocked && right.unlocked) {
    const leftTime = left.firstUnlockedAt ? new Date(left.firstUnlockedAt).getTime() : 0;
    const rightTime = right.firstUnlockedAt ? new Date(right.firstUnlockedAt).getTime() : 0;
    if (leftTime !== rightTime) {
      return rightTime - leftTime;
    }
  }

  const kanaCompare = left.kana.localeCompare(right.kana, "ja");
  if (kanaCompare !== 0) {
    return kanaCompare;
  }
  return left.romaji.localeCompare(right.romaji, "en");
}

export async function getCollectionSnapshot(): Promise<CollectionSnapshot> {
  const uniqueCards = dedupeCardsByWord(wordCards);
  const cardIdsBySignature = new Map<string, string[]>();
  const representativeBySignature = new Map<string, EmojiWordCard>();

  for (const card of wordCards) {
    const signature = getCardSignature(card);
    const ids = cardIdsBySignature.get(signature);
    if (ids) {
      ids.push(card.id);
    } else {
      cardIdsBySignature.set(signature, [card.id]);
    }
    if (!representativeBySignature.has(signature)) {
      representativeBySignature.set(signature, card);
    }
  }

  const allProgress = await storage.listAllCardProgress();
  const progressByCardId = new Map(allProgress.map((progress) => [progress.cardId, progress]));

  const entries: CollectionEntry[] = uniqueCards.map((card) => {
    const signature = getCardSignature(card);
    const relatedProgress = (cardIdsBySignature.get(signature) ?? [])
      .map((id) => progressByCardId.get(id))
      .filter((item): item is ReviewCardProgress => item !== undefined)
      .filter((item) => item.reps > 0);

    const firstUnlockedAt = relatedProgress.reduce<string | undefined>((earliest, progress) => {
      const candidate = progress.firstUnlockedAt ?? progress.lastReviewedAt ?? progress.updatedAt;
      if (!earliest) {
        return candidate;
      }
      return new Date(candidate).getTime() < new Date(earliest).getTime() ? candidate : earliest;
    }, undefined);

    const representative = representativeBySignature.get(signature) ?? card;
    return {
      id: representative.id,
      script: representative.script,
      kana: representative.kana,
      romaji: representative.romaji,
      meaning: representative.meaning,
      emoji: representative.emoji,
      unlocked: relatedProgress.length > 0,
      reps: relatedProgress.reduce((sum, progress) => sum + progress.reps, 0),
      firstUnlockedAt,
    };
  });

  const hiragana = entries.filter((entry) => entry.script === "hiragana").sort(compareCollectionEntries);
  const katakana = entries.filter((entry) => entry.script === "katakana").sort(compareCollectionEntries);
  const unlockedTotal = entries.filter((entry) => entry.unlocked).length;

  return {
    total: entries.length,
    unlockedTotal,
    hiragana,
    katakana,
  };
}

export async function getStats(): Promise<{ dailyProgress: number; streak: number; dueCount: number }> {
  const recentLogs = await storage.listRecentReviewLogs(1000);
  const todayKey = toDateKey(new Date().toISOString());

  const dailyProgress = recentLogs.filter((log) => toDateKey(log.reviewedAt) === todayKey).length;
  const uniqueDays = Array.from(new Set(recentLogs.map((log) => toDateKey(log.reviewedAt)))).sort().reverse();

  let streak = 0;
  for (let index = 0; index < uniqueDays.length; index += 1) {
    const delta = daysBetweenKeys(todayKey, uniqueDays[index]);
    if (delta === index) {
      streak += 1;
    } else {
      break;
    }
  }

  const dueCount = (await storage.listDueCardProgress(new Date().toISOString(), 500)).length;
  return { dailyProgress, streak, dueCount };
}

export async function resetProgress(seed: "clean" | "due" = "clean"): Promise<void> {
  await storage.clearAll();

  if (seed !== "due") {
    return;
  }

  const nowIso = new Date().toISOString();
  const dueIso = addDaysIso(nowIso, -1);

  for (const card of wordCards.slice(0, 3)) {
    await storage.upsertCardProgress({
      cardId: card.id,
      script: card.script,
      ease: INITIAL_EASE,
      intervalDays: 1,
      dueAt: dueIso,
      firstUnlockedAt: nowIso,
      lastReviewedAt: nowIso,
      lapses: 0,
      reps: 1,
      updatedAt: nowIso,
    });
  }
}
