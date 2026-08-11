#!/bin/bash
set -e

echo "Phase 8 Benchmark Demo"
echo "====================="
echo ""
echo "This demo runs a single scenario (payments/wrong-amount) through multiple agent adapters"
echo "and produces a benchmark report comparing their behavior."
echo ""

SCENARIO="payments/wrong-amount"
REPORT_DIR=".chaosline/benchmark-demo-$(date +%s)"
TRIALS=2

echo "Scenario: $SCENARIO"
echo "Report dir: $REPORT_DIR"
echo "Trials per agent: $TRIALS"
echo ""

# Mock model for zero-cost testing
MOCK_MODEL_URL="${MOCK_MODEL_URL:-}"
if [ -z "$MOCK_MODEL_URL" ]; then
  echo "Note: Using real API (ANTHROPIC_BASE_URL not set)"
  echo "To use mock model for zero cost, set: export CHAOSLINE_MODEL_UPSTREAM=http://127.0.0.1:XXXX"
  echo ""
fi

echo "Running benchmark: raw-sdk agent"
npx chaosline benchmark \
  --scenario "$SCENARIO" \
  --agent raw-sdk node examples/agent-raw-sdk/agent.ts \
  --report-dir "$REPORT_DIR" \
  --trials "$TRIALS" \
  --pass-rate 0.5

echo ""
echo "Benchmark complete!"
echo ""
echo "Results:"
echo "--------"
cat "$REPORT_DIR/benchmark-report.md" 2>/dev/null || echo "(markdown report not found)"
echo ""
echo "JSON report: $REPORT_DIR/benchmark-report.json"
