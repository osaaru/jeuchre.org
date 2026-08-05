import { expect, test } from "@playwright/test";

// Visual regression over the specimen microsite: any rendering change to the
// design system fails CI until baselines are intentionally regenerated
// (Actions → "Update VRT baselines").
for (const page of ["", "colors", "typography", "spacing", "components"]) {
  test(`design specimen: /design/${page}`, async ({ page: p }) => {
    await p.goto(`/design/${page}`);
    await expect(p).toHaveScreenshot(`design-${page || "index"}.png`, { fullPage: true });
  });
}
