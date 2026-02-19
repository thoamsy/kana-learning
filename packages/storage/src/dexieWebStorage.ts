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

  private async reconnect(): Promise<void> {
    this.db.close();
    await this.db.open();
  }

  private async runWithReconnect<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch {
      await this.reconnect();
      return operation();
    }
  }

  async getCardProgress(cardId: string): Promise<ReviewCardProgress | null> {
    return this.runWithReconnect(async () => (await this.db.cardProgress.get(cardId)) ?? null);
  }

  async upsertCardProgress(progress: ReviewCardProgress): Promise<void> {
    await this.runWithReconnect(async () => {
      await this.db.cardProgress.put(progress);
    });
  }

  async listDueCardProgress(nowIso: string, limit: number): Promise<ReviewCardProgress[]> {
    return this.runWithReconnect(async () =>
      this.db.cardProgress.where("dueAt").belowOrEqual(nowIso).limit(limit).toArray()
    );
  }

  async listAllCardProgress(): Promise<ReviewCardProgress[]> {
    return this.runWithReconnect(async () => this.db.cardProgress.toArray());
  }

  async clearAll(): Promise<void> {
    await this.runWithReconnect(async () => {
      await this.db.transaction("rw", this.db.cardProgress, this.db.reviewLogs, async () => {
        await this.db.cardProgress.clear();
        await this.db.reviewLogs.clear();
      });
    });
  }

  async appendReviewLog(log: ReviewLog): Promise<void> {
    await this.runWithReconnect(async () => {
      await this.db.reviewLogs.add(log);
    });
  }

  async listRecentReviewLogs(limit: number): Promise<ReviewLog[]> {
    return this.runWithReconnect(async () => this.db.reviewLogs.orderBy("reviewedAt").reverse().limit(limit).toArray());
  }
}
