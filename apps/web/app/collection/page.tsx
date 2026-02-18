"use client";

import { useEffect, useState } from "react";
import { getUnlockedCards } from "../../src/lib/trainer";

export default function CollectionPage() {
  const [cards, setCards] = useState<Awaited<ReturnType<typeof getUnlockedCards>>>([]);

  useEffect(() => {
    void getUnlockedCards().then(setCards);
  }, []);

  return (
    <section className="panel">
      <h2>Collection</h2>
      <p>
        Unlocked: <strong data-testid="collection-unlocked-count">{cards.length}</strong>
      </p>

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
