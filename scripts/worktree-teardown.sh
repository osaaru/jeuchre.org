#!/usr/bin/env bash
# Atomic teardown of an agent worktree: kill its processes, release its registry
# entry, remove the worktree, delete its local branch. Remote branch and PR
# history are never touched. See AGENTS.md "Worktrees" and the end-session skill.
#
#   scripts/worktree-teardown.sh <worktree-name> [--force]
#
# MUST be run from the MAIN checkout (removing the worktree you are standing in
# kills your own shell). --force skips the merged-PR and clean-tree gates.
set -euo pipefail

name="${1:-}"
force="${2:-}"
[ -n "$name" ] || { echo "usage: $0 <worktree-name> [--force]" >&2; exit 1; }

case "$PWD" in
  */.claude/worktrees/*) echo "ERROR: run from the MAIN checkout, not a worktree." >&2; exit 1 ;;
esac

entry=$(node scripts/worktree-registry.mjs entry "$name" 2>/dev/null) || {
  echo "No registry entry for '$name' — continuing with worktree/branch cleanup only."
  entry=""
}
wt_path=".claude/worktrees/$name"
branch=""
lane=""
if [ -n "$entry" ]; then
  wt_path=$(node -e "console.log(JSON.parse(process.argv[1]).path)" "$entry")
  branch=$(node -e "console.log(JSON.parse(process.argv[1]).branch)" "$entry")
  lane=$(node -e "console.log(JSON.parse(process.argv[1]).lane)" "$entry")
fi
[ -z "$branch" ] && [ -d "$wt_path" ] && branch=$(git -C "$wt_path" branch --show-current)

# Gate 1: clean tree
if [ -d "$wt_path" ] && [ "$force" != "--force" ]; then
  if [ -n "$(git -C "$wt_path" status --porcelain)" ]; then
    echo "ERROR: uncommitted changes in $wt_path — commit/push or use --force." >&2
    exit 1
  fi
fi

# Gate 2: PR merged (or --force for abandoned work)
if [ -n "$branch" ] && [ "$force" != "--force" ]; then
  state=$(gh pr view "$branch" --json state --jq .state 2>/dev/null || echo "NONE")
  if [ "$state" != "MERGED" ]; then
    echo "ERROR: PR for '$branch' is '$state' (not MERGED) — merge it or use --force." >&2
    exit 1
  fi
fi

# Kill processes on the lane's ports
if [ -n "$lane" ]; then
  for offset in 0 1 2 3 4 5 6 7 8 9; do
    port=$((lane + offset))
    pids=$(lsof -ti tcp:"$port" 2>/dev/null || true)
    [ -n "$pids" ] && { echo "$pids" | xargs kill 2>/dev/null || true; echo "killed pid(s) on :$port"; }
  done
fi

# Remove worktree, registry entry, local branch
if [ -d "$wt_path" ]; then
  if [ "$force" = "--force" ]; then git worktree remove --force "$wt_path"; else git worktree remove "$wt_path"; fi
fi
[ -n "$entry" ] && node scripts/worktree-registry.mjs release "$name" > /dev/null
[ -n "$branch" ] && git branch -D "$branch" 2>/dev/null || true
git worktree prune

# Report OBSERVED end state
echo "--- teardown of '$name': observed end state ---"
[ -d "$wt_path" ] && echo "worktree dir: STILL PRESENT" || echo "worktree dir: gone"
git show-ref --verify --quiet "refs/heads/$branch" 2>/dev/null && echo "local branch: STILL PRESENT" || echo "local branch: gone"
node scripts/worktree-registry.mjs entry "$name" > /dev/null 2>&1 && echo "registry entry: STILL PRESENT" || echo "registry entry: gone"
if [ -n "$lane" ]; then
  busy=""
  for offset in 0 1 2; do
    lsof -ti tcp:$((lane + offset)) > /dev/null 2>&1 && busy="$busy $((lane + offset))"
  done
  [ -n "$busy" ] && echo "ports still busy:$busy" || echo "ports: free"
fi
