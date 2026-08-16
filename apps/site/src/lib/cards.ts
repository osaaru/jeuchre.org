import { type Card, isRedSuit, type Rank, type Suit } from "@jeuchre/engine";

/**
 * Presentation for engine cards. The engine says what a card *is*; how it is
 * drawn is the site's business, so the Unicode mapping lives here.
 */

// U+1F0A0 (spades), U+1F0B0 (hearts), U+1F0C0 (diamonds), U+1F0D0 (clubs); the
// rank offset skips 0x0C, which is the knight of the 56-card tarot-style deck.
const SUIT_BASE: Record<Suit, number> = {
  spades: 0x1f0a0,
  hearts: 0x1f0b0,
  diamonds: 0x1f0c0,
  clubs: 0x1f0d0,
};

const RANK_OFFSET: Record<Rank, number> = {
  A: 0x1,
  "9": 0x9,
  "10": 0xa,
  J: 0xb,
  Q: 0xd,
  K: 0xe,
};

const RANK_NAME: Record<Rank, string> = {
  A: "ace",
  K: "king",
  Q: "queen",
  J: "jack",
  "10": "ten",
  "9": "nine",
};

export function cardGlyph(card: Card): string {
  return String.fromCodePoint(SUIT_BASE[card.suit] + RANK_OFFSET[card.rank]);
}

/** Accessible name — the glyphs themselves are announced inconsistently. */
export function cardName(card: Card): string {
  return `${RANK_NAME[card.rank]} of ${card.suit}`;
}

export { isRedSuit };
