"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { wordCards } from "@kana/content";
import { getUnlockedCards } from "../../src/lib/trainer";

export default function CollectionPage() {
  const [cards, setCards] = useState<Awaited<ReturnType<typeof getUnlockedCards>>>([]);

  useEffect(() => {
    void getUnlockedCards().then(setCards);
  }, []);

  const totalWords = wordCards.length;
  const unlockedCount = cards.length;
  const lockedCount = Math.max(totalWords - unlockedCount, 0);

  return (
    <section className="panel">
      <h2>Collection</h2>
      <p>
        Unlocked: <strong data-testid="collection-unlocked-count">{unlockedCount}</strong> / {totalWords}
      </p>
      <p className="muted">
        How to unlock: answer words in <strong>Study</strong> or <strong>Review</strong>. Once a word is saved to
        your progress, it appears here.
      </p>
      <p className="muted">Remaining locked: {lockedCount}</p>

      {unlockedCount === 0 ? (
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

      <ul className="collection-grid" aria-label="Unlocked emoji words">
        {cards.slice(0, 24).map((card) => (
          <li key={card.id} className="collection-item">
            <span className="emoji">{card.emoji}</span>
            <span>{card.kana}</span>
            <span className="muted">{card.romaji}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
