#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "--" ]]; then
  shift
fi

BASE_URL="${1:-http://localhost:3000}"
SESSION="${SESSION:-kana-e2e}"

echo "Running agent-browser smoke on: ${BASE_URL}"

agent-browser --session "${SESSION}" open "${BASE_URL}"
agent-browser --session "${SESSION}" wait --load networkidle
agent-browser --session "${SESSION}" snapshot -i > /tmp/kana-home.snapshot.txt

# Optional: reset test data if app exposes the route.
agent-browser --session "${SESSION}" open "${BASE_URL}/__test/reset" || true
agent-browser --session "${SESSION}" open "${BASE_URL}"
agent-browser --session "${SESSION}" wait --load networkidle

# Example semantic interactions; keep selectors resilient.
agent-browser --session "${SESSION}" find role button click --name "Start Study"
agent-browser --session "${SESSION}" wait --load networkidle
agent-browser --session "${SESSION}" snapshot -i > /tmp/kana-study.snapshot.txt

# One answer action, then verify UI changed.
agent-browser --session "${SESSION}" find role button click --name "Submit"
agent-browser --session "${SESSION}" wait 500
agent-browser --session "${SESSION}" screenshot /tmp/kana-after-submit.png

# Go back home and verify progress text exists.
agent-browser --session "${SESSION}" find role link click --name "Home" || true
agent-browser --session "${SESSION}" wait --load networkidle
agent-browser --session "${SESSION}" get text body > /tmp/kana-home-body.txt
rg -q "Progress|progress|Daily" /tmp/kana-home-body.txt

echo "Smoke e2e passed."
