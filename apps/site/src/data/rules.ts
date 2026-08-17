import { type Card, RANKS, SUITS, type Suit, sameColorSuit } from "@jeuchre/engine";

/**
 * The single source of truth for the rules of jeuchre.
 *
 * Two pages render this: `/rules` shows the diff for people who already know
 * Euchre, `/full_rules` teaches the game from scratch. Anything that appears on
 * both — the scoring table, the card ranking — is one value here, rendered
 * twice, so the two pages cannot drift apart.
 *
 * Rules canon changes only by the owner's decision (PLAN.md decision 25). Fix
 * wording here, never in a page.
 */

/** A run of text, optionally carrying one link. */
export type Inline = string | { readonly text: string; readonly href: string };

/** A sentence or bullet: plain text, or segments when part of it links out. */
export type Phrase = string | readonly Inline[];

export interface Block {
  readonly kind: "paragraph" | "list";
  readonly items: readonly Phrase[];
}

export interface Section {
  readonly id: string;
  readonly heading: string;
  readonly blocks: readonly Block[];
  /** A table rendered after this section's prose, from the data below. */
  readonly table?: "card-ranking" | "scoring";
}

// --- The Euchre diff -------------------------------------------------------

export interface DiffRow {
  readonly euchre: string;
  readonly jeuchre: string;
}

export const DIFF_HEADLINE = "The goal is to lose tricks, not win them like in Euchre.";

export const DIFF_HEADINGS = { euchre: "Euchre", jeuchre: "Jeuchre" } as const;

export const DIFF_ROWS: readonly DiffRow[] = [
  {
    euchre: "First black jack deals",
    jeuchre: "First red nine deals",
  },
  {
    euchre: "Dealer turns up an initial trump candidate",
    jeuchre:
      "Dealer turns up an initial non-trump candidate. In the first round of bidding you cannot make the suit of what was turned up.",
  },
  {
    euchre: "You need a natural trump to make trump",
    jeuchre: "You still need a natural trump to make trump. Ok well not everything is opposites.",
  },
  {
    euchre:
      "If the card the dealer turned up is passed on, it is turned down and trump can be made as long is it is not the same suit as the card that was turned down",
    jeuchre:
      "If the card the dealer turned up is passed on, it is turned down and trump can only be made the suit of the card turned down.",
  },
  {
    euchre: "The first team to 10 points wins.",
    jeuchre: "Both teams start with 10 points. The first team to lose all their points loses.",
  },
  {
    euchre: "Anybody who makes trump can decide to go alone without their partner.",
    jeuchre:
      "This doesn't exist in Jeuchre because going alone makes it easier to lose tricks, not harder.",
  },
  {
    euchre: "All other Euchre rules...",
    jeuchre: "All other Euchre rules...",
  },
];

// --- Scoring ---------------------------------------------------------------

/**
 * Points are taken *off* a team's score — both teams start at 10 and the first
 * to reach 0 loses. Jeujeu Supreme is not a number: it ends the game outright.
 */
export type Points = number | "auto-loss";

export interface ScoringOutcome {
  readonly name: string;
  readonly condition: string;
  readonly maker: Points;
  readonly nonMaker: Points;
}

/** Both pages title the scoring table; the words are one string, like the table. */
export const SCORING_HEADING = "Scoring Hands";

export const SCORING_HEADINGS = {
  outcome: "Result of hand",
  maker: "Points taken by trump maker",
  nonMaker: "Points taken by non-trump maker",
} as const;

export const SCORING_OUTCOMES: readonly ScoringOutcome[] = [
  {
    name: "Euchre",
    condition: "Team that made trump takes 1 or 2 tricks.",
    maker: 0,
    nonMaker: 1,
  },
  {
    name: "Boom Euchre",
    condition: "Team that made trump takes 0 tricks.",
    maker: 0,
    nonMaker: 2,
  },
  {
    name: "Jeuchre",
    condition: "Team that made trump takes 3 or 4 tricks.",
    maker: 2,
    nonMaker: 0,
  },
  {
    name: "Jeujeu",
    condition: "Team that made trump takes all 5 tricks.",
    maker: 4,
    nonMaker: 0,
  },
  {
    name: "Jeujeu Supreme",
    condition: "Individual player that made trump takes ALL 5 tricks.",
    maker: "auto-loss",
    nonMaker: 0,
  },
];

export function formatPoints(points: Points): string {
  return points === "auto-loss" ? "Automatic loss of game" : String(points);
}

// --- Card ranking ----------------------------------------------------------

/**
 * The ranking table is worked through one example suit rather than stated
 * abstractly, exactly as the 2020 site did.
 */
export const EXAMPLE_TRUMP: Suit = "spades";

export interface RankingRow {
  readonly rule: string;
  /** Rows of example cards; each inner array renders on its own line. */
  readonly examples: readonly (readonly Card[])[];
}

const HIGH_TO_LOW = [...RANKS].reverse();
const leftBowerSuit = sameColorSuit(EXAMPLE_TRUMP);

/** Every card of `suit` from A down to 9, minus the jack once it has left for trump. */
function plainCardsOf(suit: Suit): readonly Card[] {
  const keepsItsJack = suit !== EXAMPLE_TRUMP && suit !== leftBowerSuit;
  return HIGH_TO_LOW.filter((rank) => rank !== "J" || keepsItsJack).map((rank) => ({ suit, rank }));
}

/** The ranks a row names, spelled from the row's own cards rather than beside them. */
function rankRun(cards: readonly Card[]): string {
  return cards.map((card) => card.rank).join(", ");
}

export const RANKING_ROWS: readonly RankingRow[] = [
  {
    rule: 'Jack of the trump suit (the "right bower")',
    examples: [[{ suit: EXAMPLE_TRUMP, rank: "J" }]],
  },
  {
    rule: 'Jack of the suit with the same color as trump (the "left bower")',
    examples: [[{ suit: leftBowerSuit, rank: "J" }]],
  },
  {
    rule: `The remaining trump cards — ${rankRun(plainCardsOf(EXAMPLE_TRUMP))}`,
    examples: [plainCardsOf(EXAMPLE_TRUMP)],
  },
  {
    rule: `The cards of the other suits, ranked ${HIGH_TO_LOW.join(", ")} — except the suit that lost its jack to the left bower`,
    examples: SUITS.filter((suit) => suit !== EXAMPLE_TRUMP).map(plainCardsOf),
  },
];

export const RANKING_HEADINGS = {
  rank: "Rank",
  rule: "Rule",
  example: `Eg. if ${EXAMPLE_TRUMP} is trump`,
} as const;

// --- The full rules --------------------------------------------------------

export const FULL_RULES_PREAMBLE =
  "These Jeuchre rules are based on a common variant of North American Euchre, but could easily be adapted for your favorite variant.";

/**
 * Ordered as the page renders them. The card-ranking table renders inside the
 * `card-ranks` section and the scoring table inside `scoring`; both come from
 * the values above rather than from this prose.
 */
export const FULL_RULES_SECTIONS: readonly Section[] = [
  {
    id: "setup",
    heading: "Setup",
    blocks: [
      {
        kind: "list",
        items: [
          "The game requires 4 players organized into 2 teams. The partners of each team are seated opposite one another.",
          "A deck of 24 cards is used, consisting of the cards from ranks 9, 10, J, Q, K, A.",
          "Each team keeps their score visible for the other team to see. Both teams start with 10 points. Typically a pair of 5s is used to represent the points where one card is used to obscure the pips on the other card. The visible pips represent the score.",
        ],
      },
    ],
  },
  {
    id: "objective",
    heading: "Objective",
    blocks: [
      {
        kind: "paragraph",
        items: [
          "The objective is to not be the team to lose all 10 of their points. This is done by avoiding taking tricks.",
        ],
      },
    ],
  },
  {
    id: "card-ranks",
    heading: "Card Ranks",
    blocks: [],
    table: "card-ranking",
  },
  {
    id: "scoring",
    heading: SCORING_HEADING,
    blocks: [],
    table: "scoring",
  },
  {
    id: "draw",
    heading: "Draw",
    blocks: [
      {
        kind: "paragraph",
        items: [
          "A draw is used to determine the first dealer. Any player shuffles the deck and begins dealing out cards, face up, to each player clockwise starting with the player to their left. The first player to receive a red 9 will be the first dealer.",
        ],
      },
    ],
  },
  {
    id: "deal",
    heading: "Deal",
    blocks: [
      {
        kind: "list",
        items: [
          "The current dealer shuffles the deck and deals 5 cards to each player clockwise starting with the player to their left.",
          'After dealing the dealer will have 4 remaining cards referred to as the "kitty". The first card is turned up for all the other players to see and placed on top of the kitty.',
          'Starting with the player to the dealer\'s left and proceeding clockwise, each player has the opportunity to call which suit will be "trump". Trump is a suit where any card of that suit outranks cards of any other suit. Each player has the opportunity to make any suit EXCEPT the suit of the card turned up by the dealer trump. They either call a suit, or pass to the next player to their left.',
          'If the dealer passes on making trump, starting with the player to the dealer\'s left and proceeding clockwise, each player has the opportunity to "order the dealer up". "Ordering Up" means the dealer must add that card to their hand and discard any card of their choosing. The suit of the card they picked up is now trump.',
          "If the dealer passes again, the hand is redealt by the person to the left of the dealer.",
        ],
      },
    ],
  },
  {
    id: "play",
    heading: "Play",
    blocks: [
      {
        kind: "list",
        items: [
          'After the deal, the player to the left of the dealer makes the opening lead by playing a card. Each of the other 3 players then play a card in turn clockwise. The 4 played cards are referred to as a "trick".',
          'Each player must play a card in the same suit as the card that was led if they are able to. Otherwise they can play any card of any other suit. If it is determined that someone did not follow suit when they were able to, they are said to have "reneged" and are subject to the harshest punishment as determined by the rest of the players.',
          "Once all cards have been played, the trick is won by the player who played the highest ranking card. The trick is then collected by that player in order to track how many tricks they have taken.",
          "The winner of a trick then leads the first card of the next trick. This continues until all cards have been played.",
          [
            "When all the cards have been played, the tricks are counted and the hand is scored according to the ",
            { text: "Scoring", href: "#scoring" },
            " section above.",
          ],
          "The person to the left of the dealer deals the next hand. This continues until one team reaches 0 points and loses the game.",
        ],
      },
    ],
  },
];
