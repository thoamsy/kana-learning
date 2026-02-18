"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { goeyToast } from "goey-toast";
import { buildQuestion, getStudyCards, submitAnswer, type QuestionMode } from "../../src/lib/trainer";

export default function StudyPage() {
  const [script, setScript] = useState<"hiragana" | "katakana" | undefined>(undefined);
  const cards = useMemo(() => getStudyCards(script, 12), [script]);
  const totalQuestions = cards.length;

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const autoNextTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("script");
    if (raw === "hiragana" || raw === "katakana") {
      setScript(raw);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (autoNextTimerRef.current !== null) {
        window.clearTimeout(autoNextTimerRef.current);
      }
    };
  }, []);

  const currentIndex = index % cards.length;
  const card = cards[currentIndex];
  const mode: QuestionMode = index % 2 === 0 ? "kana-to-reading" : "reading-to-kana";
  const question = buildQuestion(card, mode);
  const currentStep = currentIndex + 1;
  const progressPercent = Math.round((currentStep / totalQuestions) * 100);
  const isBusy = isSubmitting || isTransitioning;

  function triggerVibration(pattern: number | number[]): void {
    if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
      return;
    }
    navigator.vibrate(pattern);
  }

  async function handleNext(): Promise<void> {
    if (!selected || isBusy) {
      return;
    }

    setIsSubmitting(true);
    const isCorrect = selected === question.correctAnswer;
    try {
      await submitAnswer(card.id, isCorrect);
    } catch {
      goeyToast.error("Save failed", {
        description: "Please retry.",
        duration: 1800,
      });
      return;
    } finally {
      setIsSubmitting(false);
    }

    if (isCorrect) {
      triggerVibration([24, 30, 24]);
      goeyToast.success("Correct", { duration: 800 });
      setIsTransitioning(true);
      autoNextTimerRef.current = window.setTimeout(() => {
        setIndex((prev) => prev + 1);
        setSelected("");
        setIsTransitioning(false);
        autoNextTimerRef.current = null;
      }, 800);
      return;
    }

    triggerVibration([160, 70, 70]);
    goeyToast.error("Incorrect", {
      description: "Try another option.",
      duration: 1500,
    });
    setSelected("");
  }

  return (
    <section className="study-screen">
      <div className="study-topbar">
        <div>
          <p className="study-label">Study Session</p>
          <p>
            Mode: <strong data-testid="question-mode">{mode}</strong>
          </p>
        </div>
        <p className="study-step" data-testid="study-step">
          {currentStep}/{totalQuestions}
        </p>
      </div>

      <div
        className="progress-track"
        role="progressbar"
        aria-label="Study progress"
        aria-valuemin={1}
        aria-valuemax={totalQuestions}
        aria-valuenow={currentStep}
      >
        <div className="progress-bar" data-testid="study-progress-bar" style={{ width: `${progressPercent}%` }} />
      </div>

      <article className="study-card">
        <p className="study-hint">
          {card.emoji} {card.meaning}
        </p>
        <p data-testid="study-question" className="question-text">
          {question.prompt}
        </p>
      </article>

      <div className="options-grid" role="group" aria-label="Answer options">
        {question.options.map((option, optionIndex) => (
          <button
            key={option}
            type="button"
            data-testid={`study-option-${optionIndex + 1}`}
            className={selected === option ? "option selected" : "option"}
            onClick={() => setSelected(option)}
            disabled={isBusy}
          >
            {option}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="study-next-button"
        onClick={() => void handleNext()}
        disabled={!selected || isBusy}
      >
        Next
      </button>
    </section>
  );
}
