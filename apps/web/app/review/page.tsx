"use client";

import { useEffect, useMemo, useState } from "react";
import { buildQuestion, getDueCards, submitAnswer } from "../../src/lib/trainer";

export default function ReviewPage() {
  const [dueCards, setDueCards] = useState<Awaited<ReturnType<typeof getDueCards>>>([]);
  const [selected, setSelected] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<"idle" | "correct" | "incorrect">("idle");

  useEffect(() => {
    void getDueCards().then(setDueCards);
  }, []);

  const card = dueCards[0];
  const question = useMemo(() => {
    if (!card) {
      return null;
    }
    return buildQuestion(card, "kana-to-reading");
  }, [card]);

  async function handleSubmit(): Promise<void> {
    if (!card || !question || !selected || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const isCorrect = selected === question.correctAnswer;
      setFeedback(isCorrect ? "correct" : "incorrect");
      await submitAnswer(card.id, isCorrect);
      setSelected("");
      setDueCards(await getDueCards());
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="panel">
      <h2>Review</h2>
      <p>
        Due count: <strong data-testid="review-due-count">{dueCards.length}</strong>
      </p>

      {!card || !question ? (
        <p>No due cards right now.</p>
      ) : (
        <>
          <p>
            {card.emoji} {card.meaning}
          </p>
          <p className="question-text">{question.prompt}</p>

          <div className="options-grid" role="group" aria-label="Review answer options">
            {question.options.map((option, optionIndex) => (
              <button
                key={option}
                type="button"
                data-testid={`review-option-${optionIndex + 1}`}
                className={selected === option ? "option selected" : "option"}
                onClick={() => setSelected(option)}
                disabled={isSubmitting}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="cta-row">
            <button
              type="button"
              className="button-primary"
              onClick={() => void handleSubmit()}
              disabled={!selected || isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
          <p data-testid="answer-feedback" className="feedback-text" aria-live="polite">
            {feedback === "correct"
              ? "Correct. Nice recall."
              : feedback === "incorrect"
                ? "Incorrect. Try the next review."
                : " "}
          </p>
        </>
      )}
    </section>
  );
}
