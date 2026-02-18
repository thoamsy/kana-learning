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
  const source = shuffleSeed ? seededShuffle(pool, shuffleSeed) : pool;
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

  const distractors = allValues.filter((value) => value !== correctAnswer).slice(0, 3);
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
  const progress: ReviewCardProgress = {
    cardId,
    script: cardById.get(cardId)?.script ?? "hiragana",
    ease: next.ease,
    intervalDays: next.intervalDays,
    dueAt,
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
      lastReviewedAt: nowIso,
      lapses: 0,
      reps: 1,
      updatedAt: nowIso,
    });
  }
}
