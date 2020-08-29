import React from "react"
import styled from "styled-components"

import Scoring from "../components/Scoring"
import Table from "../components/Table"
import TableCell from "../components/TableCell"
import TableHeaderCell from "../components/TableHeaderCell"
import { Layout } from "../components/layout"
import { Link } from "../components/link"

const Card = styled.div`
  display: inline;
  font-size: 80pt;
`

const RedCard = styled.div`
  color: ${({ theme }) => theme.colors.red1};
  display: inline;
  font-size: 80pt;
`

const Header2 = styled.h2`
  font-family: "Times New Roman", Times, serif;
  font-weight: 700;
  text-align: center;
`

const Header3 = styled.h3`
  text-transform: uppercase;
`

const RulesToggle = styled.p`
  text-align: center;
  margin-bottom: 1em;
  font-size: ${({ theme }) => theme.fontSizes.small}pt;
`

const RulesLink = styled(Link)`
  color: ${({ theme }) => theme.colors.red2};
  cursor: pointer;
  :hover {
    text-decoration: underline;
  }
`
const App = () => {
  return (
    <Layout>
      <Header2>For people who don't know how to play Euchre here are the full rules...</Header2>
      <RulesToggle>
        <RulesLink to="/rules">I know how to play Euchre. Just show me the differences.</RulesLink>
      </RulesToggle>
      <p>
        These Jeuchre rules are based on a common variant of North American Euchre, but could easily be adapted for your
        favorite variant.
      </p>
      <Header3>Setup</Header3>
      <ul>
        <li>
          The game requires 4 players organized into 2 teams. The partners of each team are seated opposite one another.
        </li>
        <li>A deck of 24 cards is used, consisting of the cards from ranks 9,10,J,Q,K,A.</li>
        <li>
          Each team keeps their score visible for the other team to see. Both teams start with 10 points. Typically a
          pair of 5s is used to represent the points where one card is used to obscure the pips on the other card. The
          visible pips represent the score.
        </li>
      </ul>
      <Header3>Objective</Header3>
      <p>The objective is to not be the team to lose all 10 of their points. This is done by avoiding taking tricks.</p>
      <Header3>Card Ranks</Header3>
      <ul>
        <li>The next ranked cards are the remaining trump cards ranked A,K,Q,10,9.</li>
        <li>The remained cards from the non-trump suits are ranked A,K,Q,10,9.</li>
      </ul>
      <Table>
        <tr>
          <TableHeaderCell>Rank</TableHeaderCell>
          <TableHeaderCell>Rule</TableHeaderCell>
          <TableHeaderCell>Eg.if spades is trump</TableHeaderCell>
        </tr>
        <tr>
          <TableCell>1</TableCell>
          <TableCell>Jack of the trump suit (the "right bower")</TableCell>
          <TableCell>
            <Card>&#x1F0AB;</Card>
          </TableCell>
        </tr>
        <tr>
          <TableCell>2</TableCell>
          <TableCell>Jack of the suit with the same color as trump ( the "left bower" )</TableCell>
          <TableCell>
            <Card>&#x1F0DB;</Card>
          </TableCell>
        </tr>
        <tr>
          <TableCell>3</TableCell>
          <TableCell>The remaining trump cards - A,K,Q,10,9</TableCell>
          <TableCell>
            <Card>&#x1F0A1;&#x1F0AE;&#x1F0AD;&#x1F0AA;&#x1F0A9;</Card>
          </TableCell>
        </tr>
        <tr>
          <TableCell>4</TableCell>
          <TableCell>The cards from the non-trump suits are ranked A,K,Q,J,10,9</TableCell>
          <TableCell>
            <RedCard>&#x1F0B1;</RedCard>
            <RedCard>&#x1F0C1;</RedCard>
            <Card>&#x1F0D1;</Card>
            <br />
            <RedCard>&#x1F0BE;</RedCard>
            <RedCard>&#x1F0CE;</RedCard>
            <Card>&#x1F0DE;</Card>
            <br />
            <RedCard>&#x1F0BD;</RedCard>
            <RedCard>&#x1F0CD;</RedCard>
            <Card>&#x1F0DD;</Card>
            <br />
            <RedCard>&#x1F0BB;</RedCard>
            <RedCard>&#x1F0CB;</RedCard>
            <Card>&#x1F0DA;</Card>
            <br />
            <RedCard>&#x1F0BA;</RedCard>
            <RedCard>&#x1F0CA;</RedCard>
            <Card>&#x1F0D9;</Card>
            <br />
            <RedCard>&#x1F0B9;</RedCard>
            <RedCard>&#x1F0C9;</RedCard>
            <br />
          </TableCell>
        </tr>
      </Table>
      <div id="scoring">
        <Scoring id="scoring" />
      </div>
      <Header3>Draw</Header3>
      <p>
        A draw is used to determine the first dealer. Any player shuffles the deck and begins dealing out cards, face
        up, to each player clockwise starting with the player to their left. The first player to receive a red 9 will be
        the first dealer.
      </p>
      <Header3>Deal</Header3>
      <ul>
        <li>
          The current dealer shuffles the deck and deals 5 cards to each player clockwise starting with the player to
          their left.
        </li>
        <li>
          After dealing the dealer will have 4 remaining cards referred to as the "kitty". The first card is turned up
          for all the other players to see and placed on top of the kitty.
        </li>
        <li>
          Starting with the player to the dealer's left and proceeding clockwise, each player has the opportunity to
          call which suit will be "trump". Trump is a suit where any card of that suit outranks cards of any other suit.
          Each player has the opportunity to make any suit EXCEPT the suit of the card turned up by the dealer trump.
          They either call a suit, or pass to the next player to their left.
        </li>
        <li>
          If the dealer passes on making trump, starting with the player to the dealer's left and proceeding clockwise,
          each player has the opportunity to "order the dealer up". "Ordering Up" means the dealer must add that card to
          their hand and discard any card of their choosing. The suit of the card they picked up is now trump.
        </li>
        <li>If the dealer passes again, the hand is redealt by the person to the left of the dealer.</li>
      </ul>
      <Header3>Play</Header3>
      <ul>
        <li>
          After the deal, the player to the left of the dealer makes the opening lead by playing a card. Each of the
          other 3 players then play a card in turn clockwise. The 4 played cards are referred to as a "trick".
        </li>
        <li>
          Each player must play a card in the same suit as the card that was led if they are able to. Otherwise they can
          play any card of any other suit. If it is determined that someone did not follow suit when they were able to,
          they are said to have "reneged" and are subject to the harshest punishment as determined by the rest of the
          players.
        </li>
        <li>
          Once all cards have been played, the trick is won by the player who played the highest ranking card. The trick
          is then collected by that player in order to track how many tricks they have taken.
        </li>
        <li>
          The winner of a trick then leads the first card of the next trick. This continues until all cards have been
          played.
        </li>
        <li>
          When all the cards have been played, the tricks are counted and the hand is scored according to the &nbsp;
          <Link to="#scoring">Scoring</Link> &nbsp;section above.
        </li>
        <li>
          The person to the left of the dealer deals the next hand. This continues until one team reaches 0 points and
          loses the game.
        </li>
      </ul>
    </Layout>
  )
}

export default App
