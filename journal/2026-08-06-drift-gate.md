# 2026-08-06 — Docs drift gate with in-turn hook enforcement (#15)

- `scripts/lint-docs.sh`: (1) repo-path tokens in guidance docs (PLAN/AGENTS/STATE/CLAUDE/
  README/CONTRIBUTING/journal/docs) must exist — allowlist for generated/runtime paths;
  (2) always-loaded budget: AGENTS.md + CLAUDE.md <= 150 lines (at adoption: 126);
  (3) journal filename format. Aggregates failures; success prints budget usage.
- PostToolUse hook (`scripts/hooks/post-edit-lint-docs.sh`): guidance-file edits re-run the
  gate; exit 2 feeds failures back into the editing agent's turn. The gate script is the
  single source of truth; hook and CI only decide when to run it.
- moon: new root project `repo` (workspace `sources: repo: "."`) with `repo:lint-docs`,
  narrow inputs, in `moon ci` via affected detection.
- All checks negative-tested (dead path, budget overflow, bad filename, hook exit 2).
  Index-coverage check deliberately deferred until a routed docs/ corpus exists.
- Origin: adapted from karma-development's lint-docs (analysis 2026-08-05); adoption
  accepted after the owner's challenge — deterministic invariants vs probabilistic agent
  stewardship (AGENTS.md had already shipped a wrong moon command as live proof).
