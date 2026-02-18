"use client";

import { useEffect, useState } from "react";
import { resetProgress } from "../../src/lib/trainer";

export default function ResetPage() {
  const [status, setStatus] = useState("running");

  useEffect(() => {
    const seed = new URLSearchParams(window.location.search).get("seed") === "due" ? "due" : "clean";
    void resetProgress(seed)
      .then(() => setStatus(`ok:${seed}`))
      .catch(() => setStatus("error"));
  }, []);

  return (
    <section className="panel">
      <h2>Test Reset</h2>
      <p data-testid="reset-status">{status}</p>
    </section>
  );
}
