"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStats } from "../src/lib/trainer";

interface HomeStats {
  dailyProgress: number;
  streak: number;
  dueCount: number;
}

const initialStats: HomeStats = {
  dailyProgress: 0,
  streak: 0,
  dueCount: 0,
};

export default function HomePage() {
  const [stats, setStats] = useState<HomeStats>(initialStats);

  useEffect(() => {
    void getStats().then(setStats);
  }, []);

  return (
    <section className="panel">
      <h2>Daily Mission</h2>
      <p>New cards 20 · Review cards 40</p>

      <div className="stats-grid">
        <article className="stat-card">
          <h3>Daily Progress</h3>
          <p data-testid="daily-progress-value" className="stat-value">
            {stats.dailyProgress}
          </p>
        </article>

        <article className="stat-card">
          <h3>Streak</h3>
          <p data-testid="streak-value" className="stat-value">
            {stats.streak}
          </p>
        </article>

        <article className="stat-card">
          <h3>Due</h3>
          <p className="stat-value">{stats.dueCount}</p>
        </article>
      </div>

      <div className="cta-row">
        <Link href="/study" className="button-primary">
          Start Study
        </Link>
        <Link href="/review" className="button-secondary">
          Review Due
        </Link>
        <Link href="/collection" className="button-secondary">
          Collection
        </Link>
      </div>
    </section>
  );
}
