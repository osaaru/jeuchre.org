#!/usr/bin/env bash
# Docs drift gate (#15): deterministic checks over the guidance corpus.
# The ledger system only works if it never drifts — see journal/2026-08-06-*.
# This script is the single source of truth; CI (moon repo:lint-docs) and the
# PostToolUse hook only decide WHEN to run it.
set -uo pipefail

cd "$(git rev-parse --show-toplevel)"

GUIDANCE_DOCS=(PLAN.md AGENTS.md STATE.md CLAUDE.md README.md CONTRIBUTING.md)
while IFS= read -r f; do GUIDANCE_DOCS+=("$f"); done < <(ls journal/*.md 2>/dev/null)
[ -d docs ] && while IFS= read -r f; do GUIDANCE_DOCS+=("$f"); done < <(find docs -name '*.md' 2>/dev/null)

# Paths that are legitimately absent from a fresh checkout (generated/runtime).
RUNTIME_ALLOW='^(apps/site/src/styles/tokens(-dark)?\.css|apps/site/dist|dist-design|\.claude/worktrees|\.moon/cache|node_modules|cache)'

FAILURES=0
fail() { echo "FAIL: $1" >&2; FAILURES=$((FAILURES + 1)); }

# --- Check 1: every repo-path-shaped token in guidance docs must exist -------
PREFIXES='apps/|packages/|scripts/|journal/|\.github/|\.claude/|\.moon/|tokens/|src/'
for doc in "${GUIDANCE_DOCS[@]}"; do
  [ -f "$doc" ] || continue
  while IFS= read -r token; do
    path="${token%%:*}"                      # strip :line suffix
    path="${path%\`}"; path="${path#\`}"     # strip backticks
    path="${path%.}"; path="${path%,}"; path="${path%)}"
    # skip placeholders and globs
    case "$path" in
      *'<'*|*'*'*|*'$'*|*'{'*|*YYYY*|*'#'*) continue ;;
    esac
    echo "$path" | grep -qE "$RUNTIME_ALLOW" && continue
    echo "apps/site/$path" | grep -qE "$RUNTIME_ALLOW" && continue
    # tokens/ and src/ prefixes are meaningful only inside apps/packages context; try both
    if [ ! -e "$path" ] && [ ! -e "apps/site/$path" ]; then
      fail "$doc references missing path: $path"
    fi
  done < <(grep -ohE "(^|[[:space:]\`(])(${PREFIXES})[A-Za-z0-9_./:*<>{}\$#-]+" "$doc" \
            | sed -E 's/^[[:space:]`(]+//' | sort -u)
done

# --- Check 2: always-loaded budget ------------------------------------------
BUDGET=150
lines=$(cat AGENTS.md CLAUDE.md 2>/dev/null | wc -l | tr -d ' ')
if [ "$lines" -gt "$BUDGET" ]; then
  fail "always-loaded layer (AGENTS.md + CLAUDE.md) is ${lines}/${BUDGET} lines — growth here taxes every conversation of every agent; delete or move content to pay for additions"
fi

# --- Check 3: journal filename format ---------------------------------------
for f in journal/*.md; do
  [ -e "$f" ] || continue
  base=$(basename "$f")
  echo "$base" | grep -qE '^[0-9]{4}-[0-9]{2}-[0-9]{2}-[a-z0-9-]+\.md$' \
    || fail "journal entry '$base' does not match YYYY-MM-DD-<slug>.md"
done

if [ "$FAILURES" -gt 0 ]; then
  echo "lint-docs: $FAILURES failure(s)" >&2
  exit 1
fi
echo "lint-docs: ok (always-loaded layer at ${lines}/${BUDGET} lines)"
