# 2026-08-06 — Chain merged; board flow instituted (#32)

- The #12→#14→#23→#30 chain squash-merged (painfully — see #31 evidence comment: STATE.md
  collisions made every retarget DIRTY; required checks re-verified each sync). Issues
  #2/#13/#25/#26 closed. "Linked issue" is now a REQUIRED check alongside CI. The gate
  caught GitHub silently failing to register #30's closing reference after retarget —
  fixed by re-editing the body (any edit re-parses).
- Cadence lesson adopted: keep the PR queue at depth one — merge on green before starting
  the next unit; ask rather than stack.
- Board reformed (owner): added "Needs review" state; all 25+ cards swept to true states
  (closed → Done; Phase 1 issues #3–#10 → Ready). New flow: kickoff = draft PR; board-sync
  workflow moves cards on PR events (dormant until the org GitHub App exists — #33; GitHub
  App chosen over PAT for no-expiry, bot identity, and future automation headroom).
  Built-in "closed → Done" + auto-add toggles are owner UI steps (#33).
