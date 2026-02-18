#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "--" ]]; then
  shift
fi

BASE_URL="${1:-http://localhost:3000}"
SESSION="${SESSION:-kana-e2e-regression-$$}"

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

assert_true_file() {
  local file="$1"
  if ! rg -q '^"?true"?$' "${file}"; then
    echo "Expected true in ${file}, got:" >&2
    cat "${file}" >&2
    exit 1
  fi
}

echo "[E2E] Start regression on ${BASE_URL} (session=${SESSION})"

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
ab click "[data-correct='true']"
ab click "button:has-text('Next')"
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
ab click "[data-correct='true']"
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
ab click "[data-correct='true']"
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
wrong_index="$(ab eval '(() => { const options = Array.from(document.querySelectorAll("[data-testid^=\"study-option-\"]")); return String(options.findIndex((el) => el.getAttribute("data-correct") === "false") + 1); })()' | tr -dc '0-9')"
ab click "[data-testid='study-option-${wrong_index}']"
ab click "button:has-text('Next')"
ab wait 1600
ab get text "[data-testid='study-step']" > /tmp/kana-katakana-step-after.txt
cmp -s /tmp/kana-katakana-step-before.txt /tmp/kana-katakana-step-after.txt
ab open "${BASE_URL}/review"
ab wait --load networkidle
kat_due="$(ab get text "[data-testid='review-due-count']" | tr -dc '0-9')"
assert_gt_zero "${kat_due}"

# CASE E2E-007 Correct option must be shuffled and not fixed at slot 1.
ab open "${BASE_URL}/__test/reset"
ab wait --load networkidle
ab open "${BASE_URL}/study"
ab wait --load networkidle
rm -f /tmp/kana-correct-indices.txt
for _ in $(seq 1 6); do
  ab eval '(() => { const options = Array.from(document.querySelectorAll("[data-testid^=\"study-option-\"]")); return String(options.findIndex((el) => el.getAttribute("data-correct") === "true") + 1); })()' >> /tmp/kana-correct-indices.txt
  ab click "[data-correct='true']"
  ab click "button:has-text('Next')"
  ab wait 900
done
if ! rg -qv "^1$" /tmp/kana-correct-indices.txt; then
  echo "Correct option index never changed from slot 1." >&2
  cat /tmp/kana-correct-indices.txt >&2
  exit 1
fi

# CASE E2E-008 Session completes at 12/12 and does not loop to question 1.
ab open "${BASE_URL}/__test/reset"
ab wait --load networkidle
ab open "${BASE_URL}/study"
ab wait --load networkidle
for _ in $(seq 1 12); do
  ab click "[data-correct='true']"
  ab click "button:has-text('Next')"
  ab wait 900
done
ab get text "[data-testid='study-step']" > /tmp/kana-study-step-final.txt
rg -q "12/12" /tmp/kana-study-step-final.txt
ab get text "[data-testid='study-complete-title']" > /tmp/kana-study-complete-title.txt
rg -q "all 12 done" /tmp/kana-study-complete-title.txt
ab eval 'document.querySelector("[data-testid=\"study-question\"]") === null' > /tmp/kana-study-no-loop.txt
assert_true_file /tmp/kana-study-no-loop.txt

# CASE E2E-009 Mobile viewport shows the whole study interaction above the fold.
ab set viewport 390 844
ab open "${BASE_URL}/__test/reset"
ab wait --load networkidle
ab open "${BASE_URL}/study"
ab wait --load networkidle
ab eval '(() => {
  const selectors = [
    "[data-testid=\"study-question\"]",
    "[data-testid=\"study-option-1\"]",
    "[data-testid=\"study-option-2\"]",
    "[data-testid=\"study-option-3\"]",
    "[data-testid=\"study-option-4\"]",
    "button.study-next-button"
  ];
  const bottoms = selectors
    .map((selector) => document.querySelector(selector))
    .filter(Boolean)
    .map((node) => node.getBoundingClientRect().bottom);
  const maxBottom = Math.max(...bottoms);
  return String(maxBottom <= window.innerHeight + 8);
})()' > /tmp/kana-study-mobile-fit.txt
assert_true_file /tmp/kana-study-mobile-fit.txt

echo "[E2E] All regression cases passed."
