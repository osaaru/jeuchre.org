import { describe, expect, it } from "vitest";

import { DECK, isRedNine, isRedSuit, SUITS, sameColorSuit } from "./cards.js";

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

describe("suit color", () => {
  it("pairs each suit with the other suit of its color", () => {
    expect(sameColorSuit("spades")).toBe("clubs");
    expect(sameColorSuit("clubs")).toBe("spades");
    expect(sameColorSuit("hearts")).toBe("diamonds");
    expect(sameColorSuit("diamonds")).toBe("hearts");
  });

  it("always returns a different suit of the same color", () => {
    for (const suit of SUITS) {
      const paired = sameColorSuit(suit);
      expect(paired).not.toBe(suit);
      expect(isRedSuit(paired)).toBe(isRedSuit(suit));
    }
  });

  it("is its own inverse", () => {
    for (const suit of SUITS) {
      expect(sameColorSuit(sameColorSuit(suit))).toBe(suit);
    }
  });
});
