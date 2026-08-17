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

# The registry is keyed by canonical worktree path, so resolve the name first.
wt_path=".claude/worktrees/$name"
[ -d "$wt_path" ] && wt_path=$(cd "$wt_path" && pwd -P)
entry=$(python3 scripts/lane-registry.py entry "$wt_path" 2>/dev/null) || {
  echo "No registry entry for '$name' — continuing with worktree/branch cleanup only."
  entry=""
}
branch=""
lane=""
block_lo=""
block_hi=""
if [ -n "$entry" ]; then
  # Read the block from the registry rather than deriving it. The lane is an
  # ordinal (1, 2, ...), NOT a port number — treating it as one silently looks
  # for processes on ports 1..10 and reports success.
  branch=$(printf '%s' "$entry" | python3 -c "import json,sys; print(json.load(sys.stdin).get('branch',''))")
  lane=$(printf '%s' "$entry" | python3 -c "import json,sys; print(json.load(sys.stdin).get('lane',''))")
  block_lo=$(printf '%s' "$entry" | python3 -c "import json,sys; print(json.load(sys.stdin)['block'][0])")
  block_hi=$(printf '%s' "$entry" | python3 -c "import json,sys; print(json.load(sys.stdin)['block'][1])")
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

# Kill processes across the lane's whole port block
if [ -n "$block_lo" ]; then
  for port in $(seq "$block_lo" "$block_hi"); do
    pids=$(lsof -ti tcp:"$port" 2>/dev/null || true)
    [ -n "$pids" ] && { echo "$pids" | xargs kill 2>/dev/null || true; echo "killed pid(s) on :$port"; }
  done
fi

# Remove worktree, registry entry, local branch
if [ -d "$wt_path" ]; then
  if [ "$force" = "--force" ]; then git worktree remove --force "$wt_path"; else git worktree remove "$wt_path"; fi
fi
if [ -n "$entry" ]; then
  if [ "$force" = "--force" ]; then
    python3 scripts/lane-registry.py release "$wt_path" --force > /dev/null
  else
    # No --force: if listeners survived the kill above, the registry refuses and
    # says so. Releasing anyway would hand an occupied lane to the next claimer.
    python3 scripts/lane-registry.py release "$wt_path" > /dev/null
  fi
fi
[ -n "$branch" ] && git branch -D "$branch" 2>/dev/null || true
git worktree prune

# Report OBSERVED end state
echo "--- teardown of '$name': observed end state ---"
[ -d "$wt_path" ] && echo "worktree dir: STILL PRESENT" || echo "worktree dir: gone"
git show-ref --verify --quiet "refs/heads/$branch" 2>/dev/null && echo "local branch: STILL PRESENT" || echo "local branch: gone"
# `claimed` answers in three states: 0 claimed · 1 not claimed · 2 unknown. Unknown must
# not be reported as "gone" — that is the answer that makes a live lease look deletable.
claimed_rc=0
python3 scripts/lane-registry.py claimed "$wt_path" > /dev/null 2>&1 || claimed_rc=$?
case $claimed_rc in
  0) echo "registry entry: STILL PRESENT" ;;
  1) echo "registry entry: gone" ;;
  *) echo "registry entry: unknown (run scripts/lane-registry.py claimed \"$wt_path\" to see why)" ;;
esac
if [ -n "$block_lo" ]; then
  busy=""
  for port in $(seq "$block_lo" "$block_hi"); do
    lsof -ti tcp:"$port" > /dev/null 2>&1 && busy="$busy $port"
  done
  [ -n "$busy" ] && echo "ports still busy:$busy" || echo "ports: free (block $block_lo-$block_hi)"
fi
