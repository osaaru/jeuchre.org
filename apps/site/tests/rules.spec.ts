import { expect, type Page, test } from "@playwright/test";

// The scoring table is located by its own header text rather than a test hook,
// so these assertions fail if the published wording drifts.
const scoringTable = (page: Page) =>
  page.locator("table").filter({ hasText: "Points taken by trump maker" });

test("both rules URLs are preserved from the old site", async ({ page }) => {
  await page.goto("/rules");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("know the rules of Euchre");

  await page.goto("/full_rules");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("don't know how to play");
});

test("the two rules views link to each other", async ({ page }) => {
  await page.goto("/rules");
  await page.getByRole("link", { name: /show me the full rules/i }).click();
  await expect(page).toHaveURL(/\/full_rules$/);

  await page.getByRole("link", { name: /just show me the differences/i }).click();
  await expect(page).toHaveURL(/\/rules$/);
});

test("the diff view pairs every Euchre rule with its Jeuchre answer", async ({ page }) => {
  await page.goto("/rules");
  const rows = page.locator("table").first().locator("tbody tr");
  await expect(rows).toHaveCount(7);
  await expect(rows.first()).toContainText("First red nine deals");
  for (const row of await rows.all()) {
    await expect(row.locator("td")).toHaveCount(2);
  }
});

test("the scoring table is identical on both pages", async ({ page }) => {
  await page.goto("/rules");
  const fromDiffView = await scoringTable(page).innerText();

  await page.goto("/full_rules");
  const fromFullRules = await scoringTable(page).innerText();

  expect(fromFullRules).toBe(fromDiffView);
  expect(fromDiffView).toContain("Jeujeu Supreme");
  expect(fromDiffView).toContain("Automatic loss of game");
});

test("the full rules teach the game end to end", async ({ page }) => {
  await page.goto("/full_rules");
  for (const heading of ["Setup", "Objective", "Card Ranks", "Draw", "Deal", "Play"]) {
    await expect(page.getByRole("heading", { level: 2, name: heading })).toBeVisible();
  }
  // The Play section points back at the scoring table on the same page.
  await page.getByRole("link", { name: "Scoring", exact: true }).click();
  await expect(page).toHaveURL(/#scoring$/);
});

test("the card ranking moves the left bower out of its own suit", async ({ page }) => {
  await page.goto("/full_rules");
  const ranking = page.locator("table").filter({ hasText: "right bower" });

  // Spades is the worked example, so the left bower is the jack of clubs...
  await expect(ranking.getByRole("img", { name: "jack of clubs" })).toBeVisible();
  // ...and it must not also appear among the plain clubs below it.
  await expect(ranking.getByRole("img", { name: "jack of clubs" })).toHaveCount(1);
  // The off-color suits keep theirs.
  await expect(ranking.getByRole("img", { name: "jack of hearts" })).toBeVisible();
  await expect(ranking.getByRole("img", { name: "jack of diamonds" })).toBeVisible();
  // The jack of spades is the right bower and is likewise not repeated.
  await expect(ranking.getByRole("img", { name: "jack of spades" })).toHaveCount(1);
});
