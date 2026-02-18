import Dexie, { type Table } from "dexie";
import type { ReviewCardProgress, ReviewLog, StoragePort } from "./types";

class KanaDexieDb extends Dexie {
  cardProgress!: Table<ReviewCardProgress, string>;
  reviewLogs!: Table<ReviewLog, number>;

  constructor() {
    super("kana_trainer_db");
    this.version(1).stores({
      cardProgress: "cardId, dueAt, updatedAt, script",
      reviewLogs: "++id, cardId, reviewedAt",
    });
  }
}

export class DexieWebStorage implements StoragePort {
  private readonly db = new KanaDexieDb();

  async getCardProgress(cardId: string): Promise<ReviewCardProgress | null> {
    return (await this.db.cardProgress.get(cardId)) ?? null;
  }

  async upsertCardProgress(progress: ReviewCardProgress): Promise<void> {
    await this.db.cardProgress.put(progress);
  }

  async listDueCardProgress(nowIso: string, limit: number): Promise<ReviewCardProgress[]> {
    return this.db.cardProgress.where("dueAt").belowOrEqual(nowIso).limit(limit).toArray();
  }

  async listAllCardProgress(): Promise<ReviewCardProgress[]> {
    return this.db.cardProgress.toArray();
  }

  async clearAll(): Promise<void> {
    await this.db.transaction("rw", this.db.cardProgress, this.db.reviewLogs, async () => {
      await this.db.cardProgress.clear();
      await this.db.reviewLogs.clear();
    });
  }

  async appendReviewLog(log: ReviewLog): Promise<void> {
    await this.db.reviewLogs.add(log);
  }

  async listRecentReviewLogs(limit: number): Promise<ReviewLog[]> {
    return this.db.reviewLogs.orderBy("reviewedAt").reverse().limit(limit).toArray();
  }
}
