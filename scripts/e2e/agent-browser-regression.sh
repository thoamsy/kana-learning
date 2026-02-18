#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "--" ]]; then
  shift
fi

BASE_URL="${1:-http://localhost:3000}"
SESSION="${SESSION:-kana-e2e-regression}"

ab() {
  agent-browser --session "${SESSION}" "$@"
}

assert_gt_zero() {
  local value="$1"
  if [[ -z "${value}" || "${value}" -le 0 ]]; then
    echo "Expected > 0 but got: ${value}" >&2
    exit 1
  fi
}

echo "[E2E] Start regression on ${BASE_URL}"

# CASE E2E-001 Home loads and expected CTAs exist.
ab open "${BASE_URL}/__test/reset"
ab wait --load networkidle
ab get text "[data-testid='reset-status']" > /tmp/kana-reset.txt
rg -q "ok:clean" /tmp/kana-reset.txt

ab open "${BASE_URL}"
ab wait --load networkidle
ab snapshot -i > /tmp/kana-home.snapshot.txt
rg -q "Start Study" /tmp/kana-home.snapshot.txt
rg -q "Review Due" /tmp/kana-home.snapshot.txt
ab get text "[data-testid='daily-progress-value']" > /tmp/kana-progress-initial.txt

# CASE E2E-002 Bidirectional study flow.
ab find role link click --name "Start Study"
ab wait --load networkidle
ab get text "[data-testid='study-question']" > /tmp/kana-study-question-1.txt
ab get text "[data-testid='question-mode']" > /tmp/kana-mode-1.txt
ab click "[data-testid='study-option-1']"
ab click "button:has-text('Next')"
ab get text body > /tmp/kana-study-body-after-next.txt
rg -q "Correct|Incorrect" /tmp/kana-study-body-after-next.txt
ab wait 900
ab get text "[data-testid='question-mode']" > /tmp/kana-mode-2.txt
if cmp -s /tmp/kana-mode-1.txt /tmp/kana-mode-2.txt; then
  echo "Question mode did not switch" >&2
  exit 1
fi

# CASE E2E-003 Progress persistence after reload.
ab open "${BASE_URL}"
ab wait --load networkidle
ab get text "[data-testid='daily-progress-value']" > /tmp/kana-progress-before-reload.txt
ab reload
ab wait --load networkidle
ab get text "[data-testid='daily-progress-value']" > /tmp/kana-progress-after-reload.txt
cmp -s /tmp/kana-progress-before-reload.txt /tmp/kana-progress-after-reload.txt

# CASE E2E-004 Review queue decreases.
ab open "${BASE_URL}/__test/reset?seed=due"
ab wait --load networkidle
ab get text "[data-testid='reset-status']" > /tmp/kana-reset-due.txt
rg -q "ok:due" /tmp/kana-reset-due.txt

ab open "${BASE_URL}/review"
ab wait --load networkidle
before_due="$(ab get text "[data-testid='review-due-count']" | tr -dc '0-9')"
assert_gt_zero "${before_due}"
ab click "[data-testid='review-option-1']"
ab click "button:has-text('Submit Review')"
after_due="$(ab get text "[data-testid='review-due-count']" | tr -dc '0-9')"
if [[ "${after_due}" -ge "${before_due}" ]]; then
  echo "Due count did not decrease: before=${before_due} after=${after_due}" >&2
  exit 1
fi

# CASE E2E-005 Collection unlock after correct answer.
ab open "${BASE_URL}/__test/reset"
ab wait --load networkidle
ab open "${BASE_URL}/study"
ab wait --load networkidle
ab click "[data-testid='study-option-1']"
ab click "button:has-text('Next')"
ab wait 900
ab open "${BASE_URL}/collection"
ab wait --load networkidle
unlocked="$(ab get text "[data-testid='collection-unlocked-count']" | tr -dc '0-9')"
assert_gt_zero "${unlocked}"

# CASE E2E-006 Katakana focus creates immediate due on wrong answer.
ab open "${BASE_URL}/__test/reset"
ab wait --load networkidle
ab open "${BASE_URL}/study?script=katakana"
ab wait --load networkidle
ab get text "[data-testid='study-question']" > /tmp/kana-katakana-question.txt
ab get text "[data-testid='study-step']" > /tmp/kana-katakana-step-before.txt
# Katakana unicode block check
if ! rg -q "[ァ-ヺ]" /tmp/kana-katakana-question.txt; then
  echo "Question is not katakana" >&2
  exit 1
fi
ab click "[data-testid='study-option-2']"
ab click "button:has-text('Next')"
ab wait 1600
ab get text "[data-testid='study-step']" > /tmp/kana-katakana-step-after.txt
cmp -s /tmp/kana-katakana-step-before.txt /tmp/kana-katakana-step-after.txt
ab open "${BASE_URL}/review"
ab wait --load networkidle
kat_due="$(ab get text "[data-testid='review-due-count']" | tr -dc '0-9')"
assert_gt_zero "${kat_due}"

echo "[E2E] All regression cases passed."
