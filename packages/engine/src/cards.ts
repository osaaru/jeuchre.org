export const SUITS = ["clubs", "diamonds", "hearts", "spades"] as const;
export type Suit = (typeof SUITS)[number];

export const RANKS = ["9", "10", "J", "Q", "K", "A"] as const;
export type Rank = (typeof RANKS)[number];

export interface Card {
  readonly suit: Suit;
  readonly rank: Rank;
}

/** The 24-card jeuchre deck: ranks 9–A in each suit. */
export const DECK: readonly Card[] = SUITS.flatMap((suit) => RANKS.map((rank) => ({ suit, rank })));

export function isRedSuit(suit: Suit): boolean {
  return suit === "diamonds" || suit === "hearts";
}

/** In jeuchre, the first player dealt a red nine becomes the first dealer. */
export function isRedNine(card: Card): boolean {
  return card.rank === "9" && isRedSuit(card.suit);
}
