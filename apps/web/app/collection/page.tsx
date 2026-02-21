"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCollectionSnapshot, type CollectionEntry, type CollectionSnapshot } from "../../src/lib/trainer";

const emptySnapshot: CollectionSnapshot = {
  total: 0,
  unlockedTotal: 0,
  hiragana: [],
  katakana: [],
};

function formatUnlockDate(iso?: string): string | null {
  if (!iso) {
    return null;
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

function CollectionSection({
  title,
  script,
  entries,
}: {
  title: string;
  script: "hiragana" | "katakana";
  entries: CollectionEntry[];
}) {
  const unlockedCount = entries.filter((entry) => entry.unlocked).length;
  const progressPercent = entries.length === 0 ? 0 : Math.round((unlockedCount / entries.length) * 100);

  return (
    <article className="collection-section" data-testid={`collection-section-${script}`}>
      <div className="collection-section-header">
        <h3>{title}</h3>
        <p>
          <strong data-testid={`collection-${script}-unlocked`}>{unlockedCount}</strong> / {entries.length}
        </p>
      </div>
      <div className="collection-progress-track" aria-hidden="true">
        <div className="collection-progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      <ul className="collection-grid" data-testid={`collection-${script}-list`} aria-label={`${title} words`}>
        {entries.map((entry) => {
          const unlockedAt = formatUnlockDate(entry.firstUnlockedAt);
          return (
            <li
              key={entry.id}
              className={entry.unlocked ? "collection-item is-unlocked" : "collection-item is-locked"}
              data-testid={`collection-card-${entry.id}`}
              data-script={entry.script}
              data-kana={entry.kana}
              data-unlocked={entry.unlocked ? "true" : "false"}
            >
              <div className="collection-item-top">
                <span className="emoji">{entry.emoji}</span>
                <span className={entry.unlocked ? "collection-status unlocked" : "collection-status locked"}>
                  {entry.unlocked ? "Unlocked" : "Locked"}
                </span>
              </div>
              <p className="collection-kana">{entry.kana}</p>
              <p className="collection-romaji">{entry.romaji}</p>
              <p className="collection-meaning">{entry.meaning}</p>
              <p className="collection-meta">{entry.unlocked ? `Unlocked ${unlockedAt ?? "recently"}` : "Not learned yet"}</p>
            </li>
          );
        })}
      </ul>
    </article>
  );
}

export default function CollectionPage() {
  const [snapshot, setSnapshot] = useState<CollectionSnapshot>(emptySnapshot);

  useEffect(() => {
    void getCollectionSnapshot().then(setSnapshot);
  }, []);

  const lockedCount = Math.max(snapshot.total - snapshot.unlockedTotal, 0);

  return (
    <section className="panel">
      <h2>Collection Dictionary</h2>
      <p>
        Unlocked: <strong data-testid="collection-unlocked-count">{snapshot.unlockedTotal}</strong> / {snapshot.total}
      </p>
      <p className="muted">
        Grouped by script. Inside each group, unlocked words are shown first and sorted by most recently unlocked.
      </p>
      <p className="muted">Remaining locked: {lockedCount}</p>

      {snapshot.unlockedTotal === 0 ? (
        <div className="collection-empty" data-testid="collection-empty-state">
          <p>No unlocked words yet.</p>
          <div className="cta-row">
            <Link href="/study" className="button-primary">
              Start Study
            </Link>
            <Link href="/review" className="button-secondary">
              Review Due
            </Link>
          </div>
        </div>
      ) : null}

      <div className="collection-sections">
        <CollectionSection title="Hiragana" script="hiragana" entries={snapshot.hiragana} />
        <CollectionSection title="Katakana" script="katakana" entries={snapshot.katakana} />
      </div>
    </section>
  );
}
