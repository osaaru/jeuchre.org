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

## The lesson from review: assert the content, not the structure

The first version of `tests/rules.spec.ts` pinned **structure** — row counts, cell counts, "this
row contains that phrase", and that the two scoring tables match. Review showed three of the four
claims these pages make about the game could be inverted with the whole suite green: swap the
Euchre and Jeuchre columns, swap the maker and non-maker point columns, or swap two rank offsets
in the glyph map. Seven rows teaching the opposite of the game, and CI stays green.

The sharpest case is worth carrying to every future page here. `the scoring table is identical on
both pages` **passes under an inverted points table, and passes _because_ the table is shared** —
one component over one dataset, so the inversion appears identically on both pages and the
identity assertion faithfully confirms it. *Identity and correctness are orthogonal claims.*
Single-sourcing guarantees the two pages cannot drift; it guarantees nothing about the shared
value being right, and it is easy to write the first test and believe you have the second. They
are two tests now, deliberately.

So: a rules page's tests assert what the page *says*, by column and by value. Where a value is
produced by code the test could import, state it independently instead — the 24 expected card
glyphs are written into the spec from the Unicode chart rather than imported from `cards.ts`,
because a test that imports the thing under test agrees with it by construction. And when a test
loops over rendered elements, assert the count too: a locator that matches nothing loops over
nothing and passes.

## Gotchas

- **`biome check` warnings on `.astro` are noise, and deleting the "unused" imports would break
  the build.** Biome does not see template usage, so every component/prop import in an `.astro`
  file reports `noUnusedImports` / `noUnusedVariables`. Clean `main` already emits 21 of them
  and passes — warnings do not fail the task. Only errors do; here they were three
  `assist/source/organizeImports` (import ordering), fixed with `biome check --write`. Read the
  `Found N errors` line, not the diagnostic count.
- **Two committed files default to port 4321, which `AGENTS.md` reserves for the operator — and
  one of them fails silently.** Tracked as #44; here is what the next agent needs before that
  lands. `.claude/launch.json` pins 4321, so the preview flow started from it inside a worktree
  collides with the operator's own dev server; it has no way to pick up the worktree's lane.
  Worse, `apps/site/playwright.config.ts` *defaults* to 4321 with `reuseExistingServer` outside
  CI — so `moon check --all`, which passes no `E2E_PORT`, goes there, and if anything is already
  serving 4321 Playwright reuses it and **reports a pass measured against someone else's build**.
  A green suite that never tested your code is the failure this repo's verification story depends
  on not having. Both of us hit it in one afternoon on this PR — the reviewer on his first run,
  then me, *after* reading his finding. Knowing about it is not protection; pass `E2E_PORT=<lane
  + 2>` explicitly on every run until the default changes.
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
