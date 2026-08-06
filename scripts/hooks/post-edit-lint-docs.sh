#!/usr/bin/env bash
# PostToolUse hook: after Edit/Write to a guidance file, run the drift gate and
# feed failures back into the agent's turn (exit 2). The gate itself
# (scripts/lint-docs.sh) is the single source of truth — this hook only decides
# when to run it.
set -uo pipefail

file_path=$(python3 -c "import json,sys; print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))" 2>/dev/null)
[ -n "$file_path" ] || exit 0

root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
rel="${file_path#"$root"/}"

case "$rel" in
  PLAN.md|AGENTS.md|STATE.md|CLAUDE.md|README.md|CONTRIBUTING.md|journal/*|docs/*|scripts/lint-docs.sh) ;;
  *) exit 0 ;;
esac

if ! out=$("$root/scripts/lint-docs.sh" 2>&1); then
  echo "$out" >&2
  exit 2
fi
exit 0
