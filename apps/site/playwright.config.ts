import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.001 } },
  use: { baseURL: "http://localhost:4321" },
  webServer: {
    command: "pnpm exec astro preview --port 4321",
    port: 4321,
    reuseExistingServer: !process.env.CI,
    env: { DESIGN: process.env.DESIGN ?? "" },
  },
});
