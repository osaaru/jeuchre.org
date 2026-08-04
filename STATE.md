# STATE.md — project ledger

The handoff ledger for jeuchre.org. Any agent (or human) starting work reads, in order:
[PLAN.md](PLAN.md) (decisions/phases) → [AGENTS.md](AGENTS.md) (how to work) → this file
(where things stand right now). **Every PR must update this file**: refresh the Snapshot and
append a Journal entry. The Snapshot is rewritten in place; the Journal is append-only.

## Snapshot

- **Phase:** 1 (site relaunch) — starting
- **Done:** Phase 0 complete. Repo public with `main` default; scaffold merged (PR #1);
  `main-protection` ruleset now REQUIRES the `CI` check + PRs + squash-only; Project board
  seeded with Phase 1 issues #2–#10; committed `.mcp.json` + `.vscode/`; ledger system live
- **In flight:** nothing
- **Next actions:**
  1. Owner: install the Renovate GitHub App on the repo
  2. Start issue #2 (design system) and #3 (rules content model) — they unblock most of Phase 1
  3. Issue #8 (Cloudflare deploy wiring) can proceed in parallel once owner provides the
     Cloudflare account + API token; #10 (DNS cutover) is the Phase 1 exit
- **Blocked/waiting:** Cloudflare account + API token (owner) — blocks #8/#10 only

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
