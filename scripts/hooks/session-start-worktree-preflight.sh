#!/usr/bin/env bash
# SessionStart hook: when a session opens inside an agent worktree
# (.claude/worktrees/*), surface missing-setup facts as session context.
# Advisory only — never mutates anything. See AGENTS.md "Worktrees".
set -euo pipefail

case "$PWD" in
  */.claude/worktrees/*) ;;
  *) exit 0 ;;
esac

notes=()
[ -d node_modules ] || notes+=("node_modules missing — run: pnpm install --frozen-lockfile")
[ -f apps/site/src/styles/tokens.css ] || notes+=("generated tokens missing — run: moon run site:tokens")

if [ ${#notes[@]} -gt 0 ]; then
  echo "Worktree preflight (${PWD##*/}):"
  printf ' - %s\n' "${notes[@]}"
fi

# Claim (or re-read) this worktree's resource lane so parallel sessions never collide.
if [ -f scripts/lane-registry.py ] && command -v python3 > /dev/null; then
  python3 scripts/lane-registry.py claim 2>/dev/null || true
  echo "Teardown after merge: run scripts/worktree-teardown.sh ${PWD##*/} from the MAIN checkout (see /end-session)."
fi
