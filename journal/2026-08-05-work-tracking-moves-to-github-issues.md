# 2026-08-05 — Work tracking moves to GitHub issues; workflow adoption analysis

- PR↔issue lore hardened (owner): PR titles are `Closes #N - <issue title>` (display-only —
  GitHub does not parse titles for links; the gate cross-checks title against body);
  closing reference is the FIRST line of every PR body;
  PR template added; "Linked issue" check moved to its own workflow (pr-linkage.yml) with the
  `edited` trigger so base-retargeting re-runs it, and it verifies the Development link via
  API once base == main. GitHub limitation: Development links only activate against the
  default branch — stacked PRs link late by design.
- PR↔issue linkage: "Implements #N" does NOT create a GitHub closing link — only
  closes/fixes/resolves keywords do, and (squash: PR_BODY) they must be in the PR BODY.
  Closing refs only activate against the default branch, so stacked PRs link late (harmless:
  the squash commit still closes on merge). CI "Linked issue" job now enforces body linkage;
  make it a required check after the current PR chain merges (see #25).
- PLAN decision #29: issues + ONE permanent Project board — "jeuchre.org development"
  (renamed from "jeuchre.org rebuild"; owner: a single board to choose from, ever) — are the
  canonical work/decision queue. Board stays private until owner comfort (#24); repo Projects
  tab re-enabled (Phase 0 had disabled it, which hides linked org projects — PLAN's Phase 0
  checklist line is stale on this point). Rule:
  anything that exists only in conversation doesn't exist — file an issue at the moment it
  arises. New labels `proposal` and `owner-task`. STATE.md no longer enumerates next actions.
- Analyzed a mature multi-agent workflow (27 skills + guidance corpus + hooks) and
  ranked adoptions. Filed: #15 (drift gate — ACCEPTED, Ready), #16–#19 (proposals: git guard,
  AGENTS hardening, guidance docs, distillation loop), #20 (Tier-2 triggers + Tier-3 skip
  record), #21–#22 (owner tasks: social preview upload, Renovate install).
- Owner walkthrough of the ranked list is in progress; item 1 (drift gate) accepted after
  challenge ("why isn't this inherent in agent stewardship?" — answer journaled in #15:
  probabilistic compliance vs deterministic invariants; AGENTS.md shipped a wrong moon
  command as live proof). Items 2–5 pending — decide via their `proposal` issues.
