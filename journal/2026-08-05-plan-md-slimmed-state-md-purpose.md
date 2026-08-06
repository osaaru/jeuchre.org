# 2026-08-05 — PLAN.md slimmed; STATE.md purpose sharpened; worktree protocol accepted

- PLAN.md reshaped (#26): Phases + Open-items sections replaced by a ~25-line Roadmap that
  points at the board; former open items now live as issues (#21 social preview, #28 registrar,
  #29 jeuchre org) or inside issue bodies (card art → #3-adjacent, PDF approach → #7). PLAN is
  now strictly: Vision, Decisions, Architecture, Repo layout, Toolchain, CI/CD, Roadmap, Risks.
- Division of record (owner-confirmed): board = what/when (durable touchstone for direction,
  activity, history of work). PLAN = why/how-shaped (standing decisions). STATE = narrative
  continuity: the cold-start Snapshot (thin, points at board) + this append-only Journal of
  cross-cutting discoveries that belong to no single issue. Journal feeds distillation (#19).
- Worktree isolation protocol ACCEPTED (#27, Ready): agent work in `.claude/worktrees/
  <issue#>-<slug>` worktrees, never the operator's checkout; implement after the PR chain
  merges.
