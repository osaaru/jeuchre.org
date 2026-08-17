# 2026-08-17 — Re-vendor the lane registry, wire conformance into CI (#47)

**PR:** #TBD · **Issue:** #47 · **Branch:** `chore/47-lane-registry-revendor`

## What changed

- `scripts/lane-registry.py` and `scripts/lane-registry-conformance.py` re-vendored
  byte-identical from the upstream reference (this repo's copies were a generation behind:
  379→600 and 285→377 lines). The new implementation brings the SQLite store option,
  occupancy-checked allocation (`require_occupancy_check`), derived values, an env
  emitter, `--schema`/`LANE_SCHEMA`, marker files, and the three-state `claimed` verb
  (0 claimed · 1 not claimed · 2 unknown) whose moved-worktree reconciliation this repo's
  old copy lacked entirely.
- `lane-schema.json`: stays on the JSON store (no data migration); gains
  `"marker": ".lane.local"` (gitignored via the existing `*.local` pattern) so a moved
  worktree answers claimed/unknown rather than "not claimed" — the answer that gets a live
  worktree deleted; `require_occupancy_check` stated explicitly at its default (true).
- `scripts/hooks/session-start-worktree-preflight.sh`: the new `claim` puts export lines
  on stdout and the human summary on stderr. Decision (issue item 3): the hook now
  surfaces the **stderr summary** as session context and discards stdout — a SessionStart
  hook cannot export variables into the session, so the export lines are noise there.
- Root `moon.yml`: new `lane-registry-conformance` task; CI reaches it via `moon ci`.
  The CI container needs `lsof` (conformance's fixtures allocate with the occupancy check
  at its default), added to the existing apt-get line in `ci.yml`.
- `scripts/worktree-teardown.sh`: re-checked against the new `entry` JSON — it reads
  `branch`, `lane`, `block`, all still present in the new output shape. No change needed.

## Honest limits

- Conformance in CI verifies the **contract**, not freshness: a stale copy passes. The
  provenance check ("is this copy the one upstream ships") lives outside this repo and is
  not changed here (issue item 4 states this limit; the PR does not over-claim).
- #44 (tooling defaulting to the operator's port 4321) touches the same area and is
  deliberately not absorbed.

## Gotchas for the next reader

- The live store `.claude/worktrees/.registry.json` still carried a stale name-keyed
  entry from the retired `worktree-registry.mjs` alongside the path-keyed lease. The new
  implementation's prune-on-claim drops it (keys are treated as paths; a non-existent
  path is a dead lease). Verified against a copy of the store, not assumed.
