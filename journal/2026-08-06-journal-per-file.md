# 2026-08-06 — Ledger de-serialized: one journal file per PR (#31)

- STATE.md's monolithic Journal split into `journal/YYYY-MM-DD-<slug>.md` (one file per PR,
  migrated verbatim). Separate files cannot conflict, so concurrent PRs from the same base
  merge cleanly — the acceptance test of #31, motivated by the painful #12→#14→#23→#30
  chain where every retarget went DIRTY on shared STATE.md lines.
- Snapshot contract softened: refreshed when wrong (merge/kickoff time), not per-PR.
- Gotcha for the future drift gate (#15): its path checks should cover `journal/**` and
  verify journal filename format.
