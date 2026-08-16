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
  for (const row of await rows.all()) {
    await expect(row.locator("td")).toHaveCount(2);
  }

  // Which column a rule lands in *is* the page's meaning, so assert by column:
  // row-contains assertions stay true when the two are swapped.
  const first = rows.first().locator("td");
  await expect(first.first()).toHaveText("First black jack deals");
  await expect(first.nth(1)).toHaveText("First red nine deals");

  const goingAlone = rows.nth(5).locator("td");
  await expect(goingAlone.first()).toContainText("can decide to go alone");
  await expect(goingAlone.nth(1)).toContainText("doesn't exist in Jeuchre");
});

test("the scoring table is identical on both pages", async ({ page }) => {
  await page.goto("/rules");
  const fromDiffView = await scoringTable(page).innerText();

  await page.goto("/full_rules");
  const fromFullRules = await scoringTable(page).innerText();

  expect(fromFullRules).toBe(fromDiffView);
});

// Identity between the pages says nothing about whether the shared value is right:
// swapping the two point columns inverts every outcome on both pages at once, and
// the identity assertion above confirms the inversion. So pin the columns too.
test("the scoring table credits the right side of the table", async ({ page }) => {
  await page.goto("/rules");
  // Exact match on the outcome name, or "Euchre." also selects "Boom Euchre.".
  const row = (name: string) =>
    scoringTable(page)
      .locator("tbody tr")
      .filter({ has: page.getByText(name, { exact: true }) });

  // A euchre costs the makers: the defenders take the point, not the makers.
  await expect(row("Euchre.").locator("td").nth(1)).toHaveText("0");
  await expect(row("Euchre.").locator("td").nth(2)).toHaveText("1");

  await expect(row("Boom Euchre.").locator("td").nth(2)).toHaveText("2");
  await expect(row("Jeuchre.").locator("td").nth(1)).toHaveText("2");
  await expect(row("Jeujeu.").locator("td").nth(1)).toHaveText("4");

  // The only non-numeric outcome, and it belongs to the maker's column.
  await expect(row("Jeujeu Supreme.").locator("td").nth(1)).toHaveText("Automatic loss of game");
  await expect(row("Jeujeu Supreme.").locator("td").nth(2)).toHaveText("0");
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

// The glyph is what a sighted reader actually reads, and it is produced by a different
// map than the accessible name — so every name-keyed assertion elsewhere in this file
// would survive a wrong glyph. Written out from the Unicode chart (U+1F0A0 spades,
// U+1F0B0 hearts, U+1F0C0 diamonds, U+1F0D0 clubs) rather than imported from the code
// under test, so it is an independent statement of what should render.
const EXPECTED_GLYPHS: Record<string, string> = {
  "ace of spades": "\u{1F0A1}",
  "king of spades": "\u{1F0AE}",
  "queen of spades": "\u{1F0AD}",
  "jack of spades": "\u{1F0AB}",
  "ten of spades": "\u{1F0AA}",
  "nine of spades": "\u{1F0A9}",
  "ace of hearts": "\u{1F0B1}",
  "king of hearts": "\u{1F0BE}",
  "queen of hearts": "\u{1F0BD}",
  "jack of hearts": "\u{1F0BB}",
  "ten of hearts": "\u{1F0BA}",
  "nine of hearts": "\u{1F0B9}",
  "ace of diamonds": "\u{1F0C1}",
  "king of diamonds": "\u{1F0CE}",
  "queen of diamonds": "\u{1F0CD}",
  "jack of diamonds": "\u{1F0CB}",
  "ten of diamonds": "\u{1F0CA}",
  "nine of diamonds": "\u{1F0C9}",
  "ace of clubs": "\u{1F0D1}",
  "king of clubs": "\u{1F0DE}",
  "queen of clubs": "\u{1F0DD}",
  "jack of clubs": "\u{1F0DB}",
  "ten of clubs": "\u{1F0DA}",
  "nine of clubs": "\u{1F0D9}",
};

test("every card in the ranking shows the glyph its label claims", async ({ page }) => {
  await page.goto("/full_rules");
  const cards = page.locator("table").filter({ hasText: "right bower" }).getByRole("img");

  const seen = new Map<string, string>();
  for (const card of await cards.all()) {
    const name = await card.getAttribute("aria-label");
    expect(name).not.toBeNull();
    seen.set(name as string, (await card.innerText()).trim());
  }

  // The ranking works through the whole deck, so all 24 appear exactly once.
  expect(seen.size).toBe(24);
  expect(await cards.count()).toBe(24);
  expect(Object.fromEntries(seen)).toEqual(EXPECTED_GLYPHS);
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
