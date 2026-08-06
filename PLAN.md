# jeuchre.org Rebuild Plan

Drafted 2026-07-20 from an interview with Julian (owner) plus live research into current
tooling/hosting baselines. This document is the source of truth for the rebuild until it is
superseded by issues on the project board.

## Vision

jeuchre.org becomes the central hub for the game of Jeuchre (the anti-Euchre): first a fast,
well-designed content site that teaches the game; then a browser card game to learn by playing
against bots; eventually a home for jeuchre communities (multiplayer tables, newsletter, social).

## Decision record

Decisions made 2026-07-20. Each was grounded in verified-current facts (versions/pricing as of
July 2026), noted where load-bearing.

| # | Decision | Choice | Key rationale |
|---|----------|--------|---------------|
| 1 | Game scope | Bots-first, humans later | V2 game is 100% client-side (zero backend cost); engine designed so multiplayer reuses it unchanged |
| 2 | Development model | Solo owner + AI agents | Repo optimized for agents; automation is the reviewer |
| 3 | Budget | $0/month | Constrains hosting to true free tiers with commercial use allowed |
| 4 | Language | TypeScript everywhere, strict | Carried over by preference; best agent support |
| 5 | Hosting | Cloudflare (Workers Static Assets) | Only platform where the whole roadmap is $0: unlimited static requests, Durable Objects + D1 + KV on the free plan, commercial use permitted. (Vercel Hobby bans commercial use; Netlify free tier gutted Apr 2026; GitHub Pages static-only; Fly.io no free tier) |
| 6 | DNS | Move from Route 53 to Cloudflare | Unlocks CF-native TLS/CDN/apex handling; drops the hosted-zone fee. Registration may move to Cloudflare Registrar (at-cost) |
| 7 | Site framework | Astro 7 | Content pages ship zero JS; game mounts as one hydrated island; typed Markdown/MDX content collections; Rust compiler on Vite 8; AI-agent-aware dev server. Gatsby is confirmed dead (maintenance mode) |
| 8 | Game UI | React island | Deepest ecosystem + agent training density; only the game page pays the React bundle cost |
| 9 | Release sequencing | V1 = site relaunch, V2 = bots game | Two small launches instead of one big one; gets off the dead stack fast |
| 10 | Workflow | PR-always + CI gates | Every change lands via PR: typecheck/lint/test/build + Cloudflare preview URL; merge to main deploys prod. Agents open PRs; owner approves by merging |
| 11 | Learning mode | Play vs bots + inline coach hints | Legal-move highlighting, "why" explanations, glossary popovers. Coach and bots share the same evaluation logic |
| 12 | Design | Modernize, keep the soul | Professional design system, but keep the humor and artifacts: origin story, whiteboard scoreboard photo, irreverent tone |
| 13 | Repo | Rewrite in this repo | Continuous identity/history; old implementation preserved on an archive branch |
| 14 | License | Public; MIT (code) + CC BY-SA 4.0 (rules/content) | Code maximally reusable; the rules spread with attribution + share-alike |
| 15 | Toolchain | proto + moon + pnpm + Biome + Vitest + Playwright | proto pins the toolchain; moon (v2.x) runs/caches tasks (owner preference; replaces any need for Turborepo); Biome replaces ESLint+Prettier |
| 16 | Planning | Lightweight kanban | One GitHub Project board with a prioritized column; no milestone ceremony. Issues written agent-ready |
| 17 | Bots | Solid heuristics on a sim-ready core | Rule-based bidding/play heuristics ship first (competitive at euchre-family games); engine state is pure + cheaply cloneable so ISMCTS bots can be added later without rework |
| 18 | Analytics | Cloudflare Web Analytics | Free, cookie-less, no consent banner, one script tag |
| 19 | Futures | All "someday", none first-class | Multiplayer, newsletter, community features, and French i18n are recorded below but not sequenced |
| 20 | Merge strategy | Squash-only | One commit per PR on `main`; agent WIP commits vanish; whole changes revert cleanly |
| 21 | Dependency updates | Renovate, grouped monthly + security-immediate | moon v2.4 has first-class Renovate support; CI gates verify update PRs |
| 22 | GitHub Discussions | Deferred | Enable post-relaunch when there's traffic; one-click reversible |
| 23 | Contribution stance | Issues open; PRs welcome but managed | Anyone can file issues; small PRs accepted; roadmap stays owner-driven ("open an issue before building anything big") |
| 24 | Org identity | "Jeuchre Foundation" branding | The site presents the (informal, unincorporated) Jeuchre Foundation as steward of the game and its content; honest about its nature; structure the community can grow into |
| 25 | Rules canon | Owner-as-steward, variants welcome | Canonical rules change only by Julian's decision, with a public changelog; community variants encouraged under CC BY-SA |
| 26 | Agent handoff ledger | STATE.md, updated in every PR | Long multi-agent project: a Snapshot (current state/next actions) + append-only Journal (changes, rationale, gotchas) lets any new agent resume from `main` alone; enforced via AGENTS.md convention |
| 27 | MCP servers | Committed `.mcp.json`: Astro docs, Cloudflare docs, `moon mcp`, Playwright | Version-controlled agent tool access; each user approves on first run. GitHub MCP skipped (redundant with `gh` CLI); Cloudflare OAuth servers (unified API/bindings/observability) added when Phase 1 deploy/DNS work starts; Context7 stays user-scope (API key) |
| 28 | Design manifest | DTCG `tokens.json` + dev-only specimen microsite + VRT | W3C DTCG 2025.10 is the stable interop format; `tokens.css` generated via Style Dictionary v4; `/design` routes exist only in dev (`DESIGN=1` for tests); Playwright screenshot baselines gate CI; specimens double as the Claude Design (DesignSync) sync bundle |
| 29 | Work tracking | GitHub issues + ONE permanent Project board ("jeuchre.org development") | A decision or work item that exists only in conversation doesn't exist: agents capture it as an issue the moment it's made. Board = execution state; `proposal` label = awaiting owner acceptance; `owner-task` = human-only. STATE.md carries narrative + journal, never the work queue |

## Architecture

```
                    ┌─────────────────────────────────────────┐
                    │           Cloudflare (free plan)         │
  GitHub ──PR──►    │  Workers Static Assets  ◄── Astro build  │
  Actions CI        │  (site + game, all static)               │
  preview per PR    │                                          │
  main ──► prod     │  [future] Durable Objects game rooms     │
                    │  [future] D1/KV for community features   │
                    └─────────────────────────────────────────┘
```

- The site is fully static output from Astro. The game is a React island hydrated only on the
  game page; all V2 game logic runs in the browser.
- The rules engine is a framework-free TypeScript package. In V2 the browser calls it directly;
  in a future multiplayer phase a Durable Object (via PartyServer) calls the same package as the
  server-authoritative referee. This boundary is the single most important architectural line in
  the project — nothing UI- or platform-specific may leak into the engine.

## Repository layout (monorepo)

```
.
├── .moon/                  # moon workspace config; toolchain via proto
├── .prototools             # pinned node/pnpm (+ anything else) versions
├── AGENTS.md               # agent instructions (cross-tool standard)
├── CLAUDE.md               # one-line shim: @AGENTS.md
├── PLAN.md                 # this file
├── STATE.md                # handoff ledger: snapshot + journal, updated every PR
├── LICENSE                 # MIT (code)
├── LICENSE-content.md      # CC BY-SA 4.0 (rules text, images, blog)
├── CONTRIBUTING.md         # issues open; small PRs welcome; issue-before-big-work
├── CODE_OF_CONDUCT.md      # Contributor Covenant
├── apps/
│   └── site/               # Astro 7 site (pages, content collections, game island mount)
├── packages/
│   ├── engine/             # pure TS jeuchre rules engine (no deps on DOM/React)
│   ├── bots/               # heuristic bidding/play policies + coach explanations
│   └── ui-game/            # React components for table/cards/play (imports engine + bots)
└── .github/
    └── workflows/ci.yml    # moonrepo/setup-toolchain → moon ci (affected-only)
```

Rationale: `engine`, `bots`, and `ui-game` are separate publishable-shaped packages so the
future multiplayer server can depend on `engine` (+ optionally `bots` for seat-filling) without
dragging React in. moon's affected-task graph keeps CI fast as packages accumulate.

## Toolchain and conventions

- **proto** (`.prototools`) pins node + pnpm; contributors and CI run `proto use`. CI uses the
  official `moonrepo/setup-toolchain` action (installs and caches proto + moon).
- **moon v2** defines tasks per project (`build`, `dev`, `lint`, `format`, `typecheck`, `test`,
  `e2e`) with caching and affected-detection. Agents run `moon check` / `moon ci` — one entry
  point, no package-script archaeology. moon v2.2+ ships AI agent skills (e.g. `debug-task`).
- **Biome** for lint + format (single binary, `biome migrate` config). **TypeScript strict.**
- **Vitest** for unit tests. The engine gets the deepest coverage: every rule in the rules pages
  becomes a named test (first-red-nine deal, no-trump-candidate suit lockout round 1,
  turned-down-suit-only round 2, no going alone, all five scoring outcomes incl. Jeujeu Supreme
  auto-loss), plus property tests (e.g. every deal is playable; points conserved per hand).
- **Playwright** for E2E smoke: site pages render, print stylesheet works, a full bot game is
  playable start-to-finish.
- **AGENTS.md** carries repo instructions (the 2026 cross-tool standard); `CLAUDE.md` is a
  one-line `@AGENTS.md` import shim. It documents: moon task entry points, the engine purity
  rule, content licensing split, and PR conventions.

## CI/CD and environments

- **CI (GitHub Actions):** on every PR — `setup-toolchain` → `moon ci` (affected typecheck,
  lint, unit tests, build) → deploy preview to Cloudflare (unique preview URL posted on the PR)
  → Playwright smoke against the preview.
- **Prod:** merge to `main` → same pipeline → deploy to www.jeuchre.org. Branch protection on
  `main`: PRs required, CI green required. The legacy `master`/`prod` branch split is retired;
  `main` is the only long-lived branch.
- **Rollback:** Cloudflare keeps prior deployments; redeploy previous version from dashboard or
  `wrangler`.
- No persistent staging environment — per-PR previews cover it at this scale.

## Roadmap

Execution lives on the ONE board — "jeuchre.org development" (osaaru org, project 1); this
section is sequencing narrative only. Phase 0 (repo reset, GitHub setup, monorepo scaffold,
CI gates, ledger, MCP config) is complete — its record is the STATE.md journal.

- **V1 — site relaunch** (in progress; issues #2–#10): design system + DTCG manifest/specimens
  (done), single-sourced rules pages, home/origin story, Foundation & governance page, blog,
  printable rules, Cloudflare deploy + preview wiring, SEO/redirect preservation, then DNS
  cutover and AWS decommission as the exit. Deliberately not in V1: newsletter, poll, GA.
- **V2 — the game**: `engine` (immutable cloneable state, phase machine, full rule set with
  countdown scoring and Jeujeu Supreme auto-loss, `playerView(state, seat)` secret filtering,
  seedable RNG), `bots` (heuristic tiers returning `{ move, because }` — the coach reuses the
  reasoning), `ui-game` (DOM/CSS card table, legal-move highlighting, coach overlay, glossary).
  References: UMich EECS 280 euchre spec; pgwhalen/euchre_sim's pluggable-Player pattern.
  boardgame.io is dead — concepts borrowed, not code.
- **Someday (recorded, unsequenced):** realtime multiplayer via Durable Objects + PartyServer
  (server-authoritative rooms running `engine`, hibernation keeps idle rooms ~free); newsletter
  (e.g. Buttondown free tier; D1/KV if self-managed); community (Discord link first; later
  accounts, leaderboards, the Supreme Hall of Shame); French i18n via Astro routing; possible
  Foundation formalization. Old-repo TODOs deliberately retired: poll widget, password-gated
  staging, Storybook, lerna/yarn.

## Risks and mitigations

- **Cloudflare free-tier changes** (the Netlify lesson): everything is standard
  Astro-static + plain TS, so the blast radius of a forced move is a redeploy, not a rewrite.
  The engine's platform-independence is the hedge.
- **Solo + agents, no human reviewer:** mitigated by PR-always, required CI, deep engine test
  suite, and Playwright smoke on previews. The engine's named-rule tests are the contract.
- **Rules ambiguity** (prose → code): any rule question found while implementing the engine is
  raised as an issue and answered by Julian (the rules authority), then encoded as a test —
  the test suite becomes the canonical rules spec.
- **Astro 7 recency:** major-version churn risk is low for this shape (static content + one
  island uses only stable core APIs).
