import { describe, expect, it } from "vitest";

import { DECK, isRedNine } from "./cards.js";

describe("jeuchre deck", () => {
  it("has 24 unique cards", () => {
    expect(DECK).toHaveLength(24);
    expect(new Set(DECK.map((c) => `${c.rank}${c.suit}`)).size).toBe(24);
  });

  it("contains exactly two red nines (the dealer draw cards)", () => {
    expect(
      DECK.filter(isRedNine)
        .map((c) => c.suit)
        .sort(),
    ).toEqual(["diamonds", "hearts"]);
  });
});
