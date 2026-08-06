# STATE.md — project ledger

The handoff ledger for jeuchre.org. Any agent (or human) starting work reads, in order:
[PLAN.md](PLAN.md) (decisions/phases) → [AGENTS.md](AGENTS.md) (how to work) → this file
(where things stand right now). **Every PR must update this file**: refresh the Snapshot and
append a Journal entry. The Snapshot is rewritten in place; the Journal is append-only.

## Snapshot

- **Phase:** 1 (site relaunch) — in progress
- **Work queue:** the [board](https://github.com/orgs/osaaru/projects/1) is canonical; five
  states (Backlog/Ready/In progress/Needs review/Done) driven by the PR lifecycle.
- **In flight:** #32 (board flow) — this PR.
- **Blocked/waiting on owner:** GitHub App + built-in workflow toggles (#33), Renovate (#22),
  social preview (#21), Cloudflare account (#8/#10).

## Journal

### 2026-07-20 — Phase 0 executed; scaffold PR opened

- Interviewed owner; wrote PLAN.md (25-decision record). Key stack: Cloudflare free tier,
  Astro 7, React game island, proto+moon+pnpm, Biome/Vitest/Playwright, TS strict.
- Branch surgery done exactly as PLAN Phase 0 describes. Repo made public after verifying
  history contains no secrets (AWS account ID + hosted-zone ID exposed knowingly; low risk).
- Scaffolded monorepo; `moon check --all` green locally (11 tasks incl. Playwright smoke).
- Gotchas discovered (already encoded in configs, recorded here for context):
  - pnpm 11 replaced `onlyBuiltDependencies` with an `allowBuilds` map in
    `pnpm-workspace.yaml`; unapproved build scripts now FAIL install (esbuild approved).
    Beware: pnpm may itself inject a placeholder `allowBuilds` block, causing duplicate keys.
  - moon v2 `toolchains` in `moon.yml` is a struct (`node: {}`), not a list; task commands
    use `pnpm exec <bin>` because moon does not put package-local `node_modules/.bin` on PATH.
  - TypeScript pinned `~6.0.3`: `astro check` is Volar-based and TS 7's native compiler has
    no stable programmatic API until 7.1 (~Oct 2026). Revisit when Renovate offers TS 7.1.
  - `astro preview` must not be a moon task — long-running server; Playwright's `webServer`
    starts it itself.
- CI first run failed: setup-toolchain needs `auto-install: true` to run `proto install`
  on the runner; fixed in the same PR.
- Added this ledger (STATE.md) + AGENTS.md handoff contract + PLAN decision #26.
- CI flake root-caused: pnpm's `verifyDepsBeforeRun` default auto-runs `pnpm install` inside
  `pnpm exec`, so parallel moon tasks raced concurrent installs (ENOENT on `.bin` linking,
  exit 254). Fix: explicit `pnpm install --frozen-lockfile` step in CI before `moon ci`, and
  `verifyDepsBeforeRun: warn` in pnpm-workspace.yaml. Run `pnpm install` after every pull.
- VS Code renamed `typescript.tsdk` → `js/ts.tsdk.path`; we set BOTH because the Astro
  extension's Volar server still reads the old key (withastro/astro#16155) — drop the old
  one when that closes. moon v2 caches to `cache/` at workspace root (not `.moon/cache/`);
  both gitignored.
- Added `.vscode/` extensions (Astro, Biome, moon console, Vitest, Playwright) + settings:
  `typescript.tsdk` points at the workspace TS so VS Code uses pinned 6.x, Biome formats on
  save (Astro files formatted by the Astro extension).
- Added committed `.mcp.json` (PLAN decision #27): Astro docs + Cloudflare docs (remote,
  no auth), `moon mcp` (task graph), Playwright MCP (browser driving). Verified current as of
  2026-07-20. Cloudflare OAuth servers (unified `mcp.cloudflare.com`, bindings, observability)
  deliberately deferred to Phase 1 deploy/DNS work. GitHub MCP skipped: `gh` CLI covers it.
- The old site remains live on AWS (CloudFront/S3 via CDK) and untouched; DNS cutover and
  AWS decommission are Phase 1 exit steps.

### 2026-08-03 — Phase 0 closed out; Phase 1 opened

- PR #1 squash-merged by owner. CI check made *required* in the `main-protection` ruleset
  (rules now: deletion, non_fast_forward, pull_request/squash, required_status_checks: CI).
- Seeded the Project board with the nine Phase 1 issues (#2–#10), written agent-ready with
  acceptance criteria and PLAN.md references. Board items start with no Status — owner drags
  to Backlog/Ready as part of grooming (lightweight kanban, decision #16).
- License question revisited (MIT vs AGPL-3.0) with owner; decision #14 (MIT) reaffirmed —
  the CC BY-SA share-alike on the rules is the moat for the game itself.

### 2026-08-03 — Issue #2: design system and visual identity (PR)

- Design tokens (`apps/site/src/styles/tokens.css`): the 2020 palette systematized into roles
  (paper/ink/red/felt/gold) with dark mode via `prefers-color-scheme`; fluid type scale
  (system serif display stack nodding to the old Times New Roman; system sans body); spacing,
  radii, `--measure` content width. Global stylesheet + `Base.astro` layout (header/nav/footer,
  skip link, canonical/OG meta). Home page rebuilt on the layout with the scoreboard photo via
  `astro:assets` (responsive widths). Verified in browser: light, dark, mobile.
- Assets recovered from `archive/gatsby-2020`: scoreboard photo, the custom J favicon.
  Social preview `og-default.png` (1280×640 playing-card motif) generated from the tokens via
  a Playwright screenshot; owner must upload it in repo Settings → Social preview (API can't).
- Gotchas: Astro `<Image>` requires `sharp` as an explicit dependency (added to site).
  Nav links to /rules, /blog, /foundation intentionally 404 until issues #3–#5 land.
- `.claude/launch.json` added so agents can preview via the in-app browser (`moon run site:dev`).

### 2026-08-04 — Issue #13: DTCG manifest, specimen microsite, visual regression (PR)

- `apps/site/tokens/tokens.json` + `tokens.dark.json` (W3C DTCG 2025.10) are now the design
  source of truth; `src/styles/tokens.css`/`tokens-dark.css` are GENERATED (gitignored) by
  Style Dictionary v4 via `moon run site:tokens`; site tasks depend on it in the moon graph.
- `/design` specimen microsite (index/colors/typography/spacing/components) — routes injected
  by an inline Astro integration only in dev or `DESIGN=1` builds; specimens render FROM the
  JSON manifest so they cannot drift. Prod builds contain no trace.
- VRT: Playwright `toHaveScreenshot` over the five specimen pages; `site:e2e` now builds with
  `DESIGN=1` into `dist-design/` and runs in CI (browser install step added). Baselines are
  per-platform; linux baselines come from the manual "Update VRT baselines" workflow
  (workflow_dispatch on a branch — commits regenerated snapshots back to it).
- Claude Design handoff documented in AGENTS.md: DesignSync/`/design-sync` uses specimens as
  the incremental sync bundle. First actual sync deferred until a design project exists.
- CI now runs INSIDE `mcr.microsoft.com/playwright:v1.61.1-noble` (keep the tag in lockstep
  with `@playwright/test`): VRT demands a pinned rendering environment — bare ubuntu-latest
  fonts differ from the container's (3% pixel drift). Container adoption needed two shims,
  now in both workflows: `apt-get install xz-utils` (proto's installer) and
  `git config --global --add safe.directory "$GITHUB_WORKSPACE"` (moon's affected-detection).
- Gotchas: `workflow_dispatch` workflows can't run until they exist on the DEFAULT branch —
  first-time linux baselines were bootstrapped locally instead via the official Playwright
  docker image (isolated /work copy, fresh linux pnpm install, `--update-snapshots`, copy
  `*-linux.png` back). Future regenerations use the workflow once it's on main.
- Gotchas: Astro dev toolbar rendered into VRT screenshots — disabled in config. Multi-line
  JSX-ish text nodes in .astro collapse the whitespace before inline links (hit twice now:
  home page, footer) — keep text+link on one line or use &nbsp;. PLAN decision #28.

### 2026-08-05 — PLAN.md slimmed; STATE.md purpose sharpened; worktree protocol accepted

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

### 2026-08-05 — Work tracking moves to GitHub issues; karma-development adoption analysis

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
- Analyzed ~/Documents/karma/karma-development (27 skills + guidance corpus + hooks) and
  ranked adoptions. Filed: #15 (drift gate — ACCEPTED, Ready), #16–#19 (proposals: git guard,
  AGENTS hardening, guidance docs, distillation loop), #20 (Tier-2 triggers + Tier-3 skip
  record), #21–#22 (owner tasks: social preview upload, Renovate install).
- Owner walkthrough of the ranked list is in progress; item 1 (drift gate) accepted after
  challenge ("why isn't this inherent in agent stewardship?" — answer journaled in #15:
  probabilistic compliance vs deterministic invariants; AGENTS.md shipped a wrong moon
  command as live proof). Items 2–5 pending — decide via their `proposal` issues.

### 2026-08-06 — Chain merged; board flow instituted (#32)

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
