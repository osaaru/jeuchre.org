# 2026-08-03 — Issue #2: design system and visual identity (PR)

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
