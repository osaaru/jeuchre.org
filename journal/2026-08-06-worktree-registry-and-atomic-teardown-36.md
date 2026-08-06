# 2026-08-06 — Worktree registry and atomic teardown (#36)

- `scripts/worktree-registry.mjs`: shared JSON registry in the main checkout
  (`.claude/worktrees/.registry.json`, lock-protected) — worktree path/branch/issue + port
  lane (4400 step 10; dev/preview/e2e = lane/+1/+2; operator owns 4321). SessionStart hook
  auto-claims the lane. `playwright.config.ts` honors `E2E_PORT` so parallel e2e runs don't
  collide.
- `scripts/worktree-teardown.sh <name>` (+ `end-session` project skill): atomic cleanup —
  kill lane processes, release registry, remove worktree, delete local branch — gated on
  clean tree + MERGED PR (`--force` for abandoned work), run from the MAIN checkout only
  (karma lesson: removing the worktree you occupy kills your own shell). Prints observed
  end state.
- Board-flow automation fully verified this session: In progress (draft) → Needs review
  (ready) → Done (merge) with zero manual card moves on #27.
