# AGENTS.md — working in this repo

This repo builds jeuchre.org: the site, rules, and browser game for Jeuchre, the anti-Euchre
card game. **Read [PLAN.md](PLAN.md) first** — it holds the decision record, architecture,
and phases. Do not contradict a recorded decision without the owner asking for it.

## Commands

Toolchain is pinned by proto (`.prototools`) and tasks run through moon:

```sh
proto install         # install pinned node/pnpm/moon (first time)
pnpm install          # install workspace dependencies
moon check --all      # run build/test/lint/typecheck for all projects
moon ci               # what CI runs (affected-only)
moon site:dev         # Astro dev server
moon engine:test      # rules-engine unit tests
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

## Conventions

- Every rule of jeuchre encoded in the engine gets a named test. Rule ambiguities are not
  guessed at: open an issue for the owner (the rules steward) and encode the answer as a test.
- PRs: small, issue-linked, squash-merged; PR title becomes the commit message.
- Lint/format is Biome (`biome.json` at root). TypeScript strict; no `any` without a comment.
- TypeScript is pinned to 6.x until Volar-based tooling supports TS 7 (see PLAN.md).
- Licensing: code MIT, content CC BY-SA 4.0 (see LICENSE and LICENSE-content.md).
