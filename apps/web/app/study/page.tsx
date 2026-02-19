"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { goeyToast } from "goey-toast";
import { buildQuestion, getStudyCards, submitAnswer, type QuestionMode } from "../../src/lib/trainer";

export default function StudyPage() {
  const [script, setScript] = useState<"hiragana" | "katakana" | undefined>(undefined);
  const [round, setRound] = useState(0);
  const sessionSeedRef = useRef(`session-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const cards = useMemo(
    () => getStudyCards(script, 12, `${sessionSeedRef.current}:${script ?? "all"}:${round}`),
    [script, round]
  );
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const isMountedRef = useRef(true);
  const totalQuestions = cards.length;

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("script");
    if (raw === "hiragana" || raw === "katakana") {
      setScript(raw);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    setIndex(0);
    setSelected("");
    setIsTransitioning(false);
  }, [cards]);

  const isComplete = totalQuestions > 0 && index >= totalQuestions;
  const card = isComplete ? undefined : cards[index];
  const mode: QuestionMode = index % 2 === 0 ? "kana-to-reading" : "reading-to-kana";
  const question = card ? buildQuestion(card, mode, `${card.id}:${mode}:${index}`) : undefined;
  const currentStep = totalQuestions === 0 ? 0 : isComplete ? totalQuestions : index + 1;
  const progressPercent = totalQuestions === 0 ? 0 : Math.round((currentStep / totalQuestions) * 100);
  const isBusy = isSubmitting || isTransitioning || isComplete;

  function waitForVoices(timeoutMs = 350): Promise<void> {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return Promise.resolve();
    }

    const synth = window.speechSynthesis;
    if (synth.getVoices().length > 0) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) {
          return;
        }
        done = true;
        synth.removeEventListener("voiceschanged", finish);
        window.clearTimeout(timeoutId);
        resolve();
      };
      const timeoutId = window.setTimeout(finish, timeoutMs);
      synth.addEventListener("voiceschanged", finish);
    });
  }

  async function speakJapanese(text: string): Promise<void> {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window) ||
      typeof SpeechSynthesisUtterance === "undefined"
    ) {
      return;
    }

    if (typeof navigator !== "undefined" && navigator.webdriver) {
      return;
    }

    try {
      const synth = window.speechSynthesis;
      await waitForVoices();
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ja-JP";
      utterance.rate = 0.92;
      const voices = synth.getVoices();
      const japaneseVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith("ja"));
      if (japaneseVoice) {
        utterance.voice = japaneseVoice;
      }

      await new Promise<void>((resolve) => {
        let settled = false;
        const fallbackMs = Math.min(Math.max(text.length * 240, 1000), 2800);
        const finish = () => {
          if (settled) {
            return;
          }
          settled = true;
          window.clearTimeout(timeoutId);
          resolve();
        };
        const timeoutId = window.setTimeout(finish, fallbackMs);
        utterance.onend = finish;
        utterance.onerror = finish;
        synth.speak(utterance);
      });
    } catch {
      // Ignore speech API failures and keep the study flow responsive.
    }
  }

  async function handleNext(): Promise<void> {
    if (!card || !question || !selected || isBusy) {
      return;
    }

    setIsSubmitting(true);
    const isCorrect = selected === question.correctAnswer;
    const speechTask = isCorrect ? speakJapanese(card.kana) : Promise.resolve();
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
      setIsTransitioning(true);
      goeyToast.success("Correct", { duration: 1400 });
      await speechTask;
      if (!isMountedRef.current) {
        return;
      }
      setIndex((prev) => Math.min(prev + 1, totalQuestions));
      setSelected("");
      setIsTransitioning(false);
      return;
    }

    goeyToast.error("Incorrect", {
      description: "Try another option.",
      duration: 1500,
    });
    setSelected("");
  }

  function restartRound(): void {
    setRound((prev) => prev + 1);
  }

  return (
    <section className="study-screen">
      <div className="study-topbar">
        <div>
          <p className="study-label">Study Session</p>
          <p>
            Mode: <strong data-testid="question-mode">{isComplete ? "done" : mode}</strong>
          </p>
        </div>
        <div className="study-topbar-right">
          <Link href="/" className="study-exit-link" data-testid="study-exit-link">
            Exit
          </Link>
          <p className="study-step" data-testid="study-step">
            {currentStep}/{totalQuestions}
          </p>
        </div>
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

      {!card || !question ? (
        <article className="study-card study-complete-card" data-testid="study-complete">
          <p className="study-label">Session complete</p>
          <h2 data-testid="study-complete-title">Great job, all {totalQuestions} done.</h2>
          <p className="subtitle">Start another round to keep your recall sharp.</p>
          <button
            type="button"
            data-testid="study-restart-button"
            className="study-next-button"
            onClick={restartRound}
          >
            Practice Another 12
          </button>
        </article>
      ) : (
        <>
          <article className="study-card">
            <p className="study-hint">
              {card.emoji} {card.meaning}
            </p>
            <p data-testid="study-question" className="question-text">
              {question.prompt}
            </p>
          </article>

          <div className="options-grid" role="group" aria-label="Answer options">
            {question.options.map((option, optionIndex) => {
              const isCorrectOption = option === question.correctAnswer;
              return (
                <button
                  key={option}
                  type="button"
                  data-testid={`study-option-${optionIndex + 1}`}
                  data-correct={isCorrectOption ? "true" : "false"}
                  className={selected === option ? "option selected" : "option"}
                  onClick={() => setSelected(option)}
                  disabled={isBusy}
                >
                  {option}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="study-next-button"
            onClick={() => void handleNext()}
            disabled={!selected || isBusy}
          >
            Next
          </button>
        </>
      )}
    </section>
  );
}
