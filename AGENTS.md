# AGENTS.md — working in this repo

This repo builds jeuchre.org: the site, rules, and browser game for Jeuchre, the anti-Euchre
card game. **Start every session by reading, in order: [PLAN.md](PLAN.md)** (decision record,
architecture, phases), **this file** (how to work), **[STATE.md](STATE.md)** (the ledger —
where things stand right now). Do not contradict a recorded decision without the owner asking
for it.

## The ledger (handoff contract)

This project is developed by multiple AI agents over a long period. STATE.md is the handoff
mechanism, and it only works if it never drifts:

- **Every PR must update STATE.md**: refresh the Snapshot (phase, done, in-flight, next
  actions) and append a dated Journal entry (what changed, why, gotchas discovered).
- The Journal is append-only. Record surprises there (tool behavior changes, workarounds,
  broken assumptions) — the next agent should never have to rediscover them.
- Assume your session can end at any moment: keep STATE.md accurate enough that a brand-new
  agent could resume from `main` alone, with no access to your conversation.

## Work tracking (the queue lives on GitHub, not in your context)

- A decision or work item that exists only in conversation **doesn't exist**. The moment one
  arises — an accepted proposal, a discovered task, a deferred idea, an owner-only action —
  capture it: `gh issue create`, self-contained (context, acceptance criteria, links).
- There is exactly ONE board, ever: "jeuchre.org development" (osaaru org, project 1) — the
  single permanent queue for all work (site, game, community). Never create another project.
  Columns are execution state: Backlog (unscoped/proposals), Ready (accepted + groomed),
  In progress, Done. Labels: `proposal` = awaiting owner decision;
  `owner-task` = only Julian can do it. Start sessions by checking In progress/Ready.
  The board holds ISSUES only — never add PRs (auto-add filter is `is:issue is:open`).
- Every PR is titled `Closes #N - <issue title>` and the FIRST line of its body is
  `Closes #N` (NOT "Implements" — titles aren't parsed for links and squash commits reuse
  the body, so the link must live in the body; the title makes it visible at a glance). Branch names carry the issue
  number (`feat/13-design-manifest`). The "Linked issue" check hard-gates this: first-line
  reference, issue open, and — once the PR targets main — the Development link actually
  registered. Issueless PRs: first line `No-Issue: <reason>`.
- Board flow, left to right: Backlog → Ready → In progress → Needs review → Done.
  **Kickoff = draft PR:** implementation on an issue STARTS by opening a draft PR (branch
  `type/<issue#>-<slug>`, first-line `Closes #N`, ledger stub). Board states then follow the
  PR automatically (board-sync workflow): draft open → In progress; ready-for-review (green,
  self-reviewed) → Needs review; owner merge → issue closes → Done. Backlog→Ready is grooming
  (owner accepts + criteria exist). Manual `gh project item-edit` is the correction fallback.
- STATE.md never enumerates the work queue — it points at the board; its job is narrative
  context and the journal.

## Worktrees (agent isolation)

- Implementation work on an issue happens in a dedicated git worktree:
  `git worktree add .claude/worktrees/<issue#>-<slug> -b <type>/<issue#>-<slug>` — NEVER
  directly in the operator's checkout, and never touching servers/processes the operator
  has running. The operator's dev server owns port 4321; agents use a free port ≥ 4400.
- One worktree per issue/PR. After its PR merges: `git worktree remove` the directory and
  delete the local branch (remote branch/PR history are preserved by GitHub). Do not create
  a worktree just because the checkout is dirty — classify the dirty files first.
- Fresh worktrees need `pnpm install --frozen-lockfile` and `moon run site:tokens`; a
  SessionStart hook (`scripts/hooks/session-start-worktree-preflight.sh`) surfaces this
  automatically when a session opens inside a worktree, and claims the worktree's port lane.
- **Registry:** every worktree registers in `.claude/worktrees/.registry.json` (via
  `scripts/worktree-registry.mjs claim`) — location, branch, issue, and a port lane
  (4400, 4410, …; dev = lane, preview = lane+1, e2e = lane+2; operator owns 4321). Dev
  servers: `moon run site:dev -- --port <lane>`; e2e: `E2E_PORT=<lane+2> moon run site:e2e`.
- **Teardown (end of session):** after the PR merges, run
  `scripts/worktree-teardown.sh <name>` from the MAIN checkout (or invoke the
  `end-session` skill) — kills the lane's processes, releases the registry entry, removes
  the worktree and local branch. Report the observed end state it prints.

## MCP servers

`.mcp.json` (committed) provides: `astro-docs` and `cloudflare-docs` (remote documentation
lookup — prefer these over memory for Astro/Cloudflare APIs), `moon` (project/task graph),
`playwright` (browser driving). Approve them on first run. Use `gh` CLI for GitHub work.

## Commands

Toolchain is pinned by proto (`.prototools`) and tasks run through moon:

```sh
proto install         # install pinned node/pnpm/moon (first time)
pnpm install          # install workspace dependencies
moon check --all      # run build/test/lint/typecheck for all projects
moon ci               # what CI runs (affected-only)
moon run site:dev     # Astro dev server
moon run engine:test  # rules-engine unit tests
```

Never invoke `npm`/`npx`/`yarn`; this is a pnpm workspace with a pnpm `catalog:` for shared
dependency versions (edit `pnpm-workspace.yaml` to bump a shared version).

## Architecture rules

- `packages/engine` is **pure TypeScript**: no DOM, no React, no platform APIs, no
  dependencies. It must run identically in a browser and a future Cloudflare Durable Object.
  Game state is immutable and cheaply cloneable; randomness only via an injected seedable RNG.
- `packages/bots` depends only on `engine`. Bot decisions return `{ move, because }` —
  the coach UI reuses `because` verbatim.
- `packages/ui-game` (React) is the only place game rendering lives.
- `apps/site` (Astro 7) ships zero JS for content pages; the game mounts as one island.
- Rules prose is single-sourced: scoring/rules data renders into both the diff-view and
  full-rules pages — never duplicate rule text.

## Design system

- `apps/site/tokens/tokens.json` (+ `tokens.dark.json`) is the single source of truth for all
  design decisions, in W3C DTCG format. `src/styles/tokens.css` is GENERATED (`moon run
  site:tokens`) — never edit it, never hardcode a color/size/font in components, never invent
  an ad-hoc token. New tokens land via tokens.json + a specimen, in a PR.
- The `/design` microsite (dev-only; `DESIGN=1` builds it for tests) renders specimens for
  every token group and styled component. A new component isn't done until it has a specimen.
- Specimen pages are visual-regression targets (`tests/design.spec.ts`). If a PR intentionally
  changes rendering, regenerate baselines via the "Update VRT baselines" workflow (Actions)
  on the PR branch; unexplained VRT failures are design drift — fix the code, not the baseline.
- Handoff to claude.ai/design uses the DesignSync tool / `/design-sync` skill: specimens are
  the sync bundle. Pull remote edits, diff into tokens.json/components — never wholesale
  replace either side.

## Conventions

- Every rule of jeuchre encoded in the engine gets a named test. Rule ambiguities are not
  guessed at: open an issue for the owner (the rules steward) and encode the answer as a test.
- PRs: small, issue-linked, squash-merged; PR title becomes the commit message.
- Lint/format is Biome (`biome.json` at root). TypeScript strict; no `any` without a comment.
- TypeScript is pinned to 6.x until Volar-based tooling supports TS 7 (see PLAN.md).
- Licensing: code MIT, content CC BY-SA 4.0 (see LICENSE and LICENSE-content.md).
