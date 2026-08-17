# 2026-08-17 — Re-vendor the lane registry, wire conformance into CI (#47)

**PR:** #48 · **Issue:** #47 · **Branch:** `chore/47-lane-registry-revendor`

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
- `scripts/worktree-teardown.sh`: the `entry` JSON parse (`branch`, `lane`, `block`) is
  compatible unchanged — but the re-check found a real delta in the **exit contract**:
  `claimed` became three-state, and the end-state line folded exit 2 (unknown) into
  "gone". Edited: a three-way report, `set -e`-safe (`rc=0; cmd || rc=$?`).
- Root moon task `lane-schema-check` (review round one's consider, taken): parses the
  repo's actual `lane-schema.json` through the implementation's own loading path
  (`list --json` with the real schema), so a malformed edit fails in CI instead of
  surfacing as a dead claim at the next session open. Honest limit: it catches broken
  JSON and missing required keys; a misspelled *optional* key is silently defaulted by
  design and no check here sees it.

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
  path is a dead lease). Verified against a copy of the store first, then observed live.
- The conformance harness runs the implementation from throwaway fixture repos, so a
  relative `--cmd` path (the README's own example shape) resolves inside the fixture and
  every clause goes UNVERIFIED — which the harness rightly counts as not-a-pass. The moon
  task passes `$workspaceRoot` so the path is absolute.
- Schema loading is primary-wins: until this PR's `lane-schema.json` lands on trunk,
  worktrees keep allocating against the primary's marker-less copy, so `.lane.local`
  markers only start being written after merge (claim self-heals them at each session
  open). Not a defect — the documented adoption gap.
