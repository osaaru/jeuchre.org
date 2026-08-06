# 2026-08-06 — Worktree isolation protocol (#27)

- AGENTS.md Worktrees section: agent work happens in `.claude/worktrees/<issue#>-<slug>`
  worktrees (gitignored), one per issue, teardown after merge; operator's checkout and
  port 4321 are off-limits; agents use ports ≥ 4400.
- Board-sync automation verified live (App secret fixed: key was initially saved as a
  plaintext VARIABLE — exposed, rotated, re-stored as a secret). Board holds issues only;
  PRs are kept off via the auto-add filter `is:issue is:open`.
- SessionStart preflight hook (.claude/settings.json + scripts/hooks/) surfaces missing
  node_modules / generated tokens when a session opens inside a worktree. Advisory only.
- This PR was itself built in `.claude/worktrees/27-worktree-protocol` — first use of the
  protocol, and the first live run of the #33 board-sync automation (draft PR → In progress).
