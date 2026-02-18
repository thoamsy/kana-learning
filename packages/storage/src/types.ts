export type ScriptType = "hiragana" | "katakana";

export interface ReviewCardProgress {
  cardId: string;
  script: ScriptType;
  ease: number;
  intervalDays: number;
  dueAt: string;
  lastReviewedAt: string;
  lapses: number;
  reps: number;
  updatedAt: string;
}

export interface ReviewLog {
  id?: number;
  cardId: string;
  rating: 0 | 1 | 2 | 3;
  reviewedAt: string;
}

export interface StoragePort {
  getCardProgress(cardId: string): Promise<ReviewCardProgress | null>;
  upsertCardProgress(progress: ReviewCardProgress): Promise<void>;
  listDueCardProgress(nowIso: string, limit: number): Promise<ReviewCardProgress[]>;
  listAllCardProgress(): Promise<ReviewCardProgress[]>;
  clearAll(): Promise<void>;
  appendReviewLog(log: ReviewLog): Promise<void>;
  listRecentReviewLogs(limit: number): Promise<ReviewLog[]>;
}
