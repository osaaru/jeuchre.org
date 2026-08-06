import { defineConfig } from "@playwright/test";

// E2E_PORT lets parallel worktrees run e2e without colliding (see worktree registry).
const port = Number(process.env.E2E_PORT ?? 4321);

export default defineConfig({
  testDir: "./tests",
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.001 } },
  use: { baseURL: `http://localhost:${port}` },
  webServer: {
    command: `pnpm exec astro preview --port ${port}`,
    port,
    reuseExistingServer: !process.env.CI,
    env: { DESIGN: process.env.DESIGN ?? "" },
  },
});
