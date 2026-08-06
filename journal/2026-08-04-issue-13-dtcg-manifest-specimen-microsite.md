# 2026-08-04 — Issue #13: DTCG manifest, specimen microsite, visual regression (PR)

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
