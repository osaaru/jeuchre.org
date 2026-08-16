# 2026-08-16 — Rules content model: single-sourced rules rendered two ways (#3)

- `apps/site/src/data/rules.ts` is now the single source for the rules: the Euchre-diff rows,
  the scoring outcomes, the card ranking, and the full-rules sections. `/rules` and
  `/full_rules` are views over it — both URLs preserved from the 2020 site, including the
  `#scoring` anchor the Play section links to.
- The scoring table is one component (`ScoringTable.astro`) over one dataset, rendered by both
  pages, so "identical on both pages" is structural rather than maintained. `tests/rules.spec.ts`
  asserts it by comparing the rendered text of both tables.
- **The card ranking is derived, not typed out.** `apps/site/src/data/rules.ts` builds the
  example cards from the engine's deck and `sameColorSuit(EXAMPLE_TRUMP)`, so the suit that
  loses its jack to the left bower comes out right by construction. `packages/engine` gained
  `sameColorSuit` (+ 3 named tests) because that is a rule of the game, not a site concern —
  the site owns only the presentation (`src/lib/cards.ts` maps a card to its Unicode glyph and
  an accessible name).
- The site now depends on `@jeuchre/engine` (`workspace:*`, `dependsOn: ["engine"]` in
  `moon.yml`). Engine exports source, so nothing compiles first. **Zero-JS still holds** —
  the derivation runs at build time; both built pages contain 0 `<script>` tags and the build
  emits no JS chunk.

## Content changes, for the rules steward to confirm

Faithful port except for one thing, called out rather than buried: the old `Card Ranks`
section carried a two-bullet list above its table that (a) duplicated table rows 3 and 4 and
(b) contradicted the table — it said non-trump suits rank "A,K,Q,10,9", omitting the jack,
while the table said "A,K,Q,J,10,9" and its own card glyphs showed the off-color suits keeping
their jacks. Single-sourcing means it cannot be kept both ways: the list is gone and the table
is the one statement. Row 4's wording now names the exception explicitly ("except the suit that
lost its jack to the left bower"), which is what the 2020 glyphs already showed. Filed as #42
for the owner.

## Gotchas

- **`biome check` warnings on `.astro` are noise, and deleting the "unused" imports would break
  the build.** Biome does not see template usage, so every component/prop import in an `.astro`
  file reports `noUnusedImports` / `noUnusedVariables`. Clean `main` already emits 21 of them
  and passes — warnings do not fail the task. Only errors do; here they were three
  `assist/source/organizeImports` (import ordering), fixed with `biome check --write`. Read the
  `Found N errors` line, not the diagnostic count.
- **`.claude/launch.json` hardcodes port 4321, which `AGENTS.md` reserves for the operator.**
  Starting the preview from that config inside a bench worktree would collide with the
  operator's own dev server. Verification here ran on the worktree's registered lane instead
  (dev 4400 / preview 4401 / e2e 4402), driving Playwright with a throwaway config outside the
  repo. The launch config has no way to pick up a worktree's lane — worth fixing when someone
  touches the harness wiring.
- **A new specimen means two baselines, not one — and the second one costs an extra CI round.**
  Adding the playing-card specimen to `/design/components` changes the VRT target: the darwin
  baseline regenerates locally (`DESIGN=1 pnpm exec playwright test design.spec.ts
  --update-snapshots`), the linux one only via Actions → "Update VRT baselines" on the PR
  branch. So the first CI run after such a change is *expected* to fail on
  `design-components-linux.png` and nothing else — that is the workflow's whole purpose, not a
  regression. Two things follow. Run the baseline workflow **before** or alongside the first
  push, not after reading a red CI. And the workflow commits as `github-actions[bot]`, whose
  push does not trigger workflows — the runs at that commit sit at `action_required` until
  someone re-runs them (`gh run rerun <id>`), so a PR can look stalled when it is only waiting
  to be poked.
- Card glyphs sit at `--text-2xl` (the largest type token). The 2020 site used 80pt; matching
  that would mean inventing a token, which the design system routes through `tokens.json` plus
  a specimen in its own PR.
