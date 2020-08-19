import React, { useCallback, useState } from "react"
import styled from "styled-components"

import { Layout } from "../components/layout"

const Card = styled.div`
  display: inline;
  font-size: 80pt;
`

const RedCard = styled.div`
  color: ${({theme}) => theme.colors.red1};
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

const Table = styled.header`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1em;
`

const TableHeaderCell = styled.th`
  background-color: ${({ theme }) => theme.colors.green3};
  border-color: ${({ theme }) => theme.colors.text};
  border: solid;
  border-width: 1px;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
`

const TableCell = styled.td`
  border-color: ${({ theme }) => theme.colors.text};
  border: solid;
  border-width: 1px;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
`

const ToggleLink = styled.a`
  color: ${({ theme }) => theme.colors.red2};
  cursor: pointer;
  :hover {
    text-decoration: underline;
  }
`

const Scoring = () => (
  <>
  <Header3>SCORING HANDS</Header3>
  <Table>
    <tr>
    <TableHeaderCell>Result of hand</TableHeaderCell>
    <TableHeaderCell>Points taken by trump maker</TableHeaderCell>
    <TableHeaderCell>Points taken by non-trump maker</TableHeaderCell>
    </tr>
    <tr>
      <TableCell>Euchre. Team that made trump takes 1 or 2 tricks.</TableCell>
      <TableCell>0</TableCell>
      <TableCell>1</TableCell>
    </tr>
    <tr>
      <TableCell>Boom Euchre. Team that made trump takes 0 tricks.</TableCell>
      <TableCell>0</TableCell>
      <TableCell>2</TableCell>
    </tr>
    <tr>
      <TableCell>Jeuchre. Team that made trump takes 3 or 4 tricks.</TableCell>
      <TableCell>2</TableCell>
      <TableCell>0</TableCell>
    </tr>
    <tr>
      <TableCell>Jeujeu. Team that made trump takes all 5 tricks.</TableCell>
      <TableCell>4</TableCell>
      <TableCell>0</TableCell>
    </tr>
    <tr>
      <TableCell>Jeujeu Supreme. Individual player that made trump takes ALL 5 tricks.</TableCell>
      <TableCell>Automatic loss of game</TableCell>
      <TableCell>0</TableCell>
    </tr>
</Table>
</>
)

const App = () => {
  const [fullRules,setFullRules] = useState(false)
  const toggleFullRules = useCallback(() => {
    setFullRules(!fullRules)
  }, [fullRules, setFullRules])
  return (
    <Layout>
      {fullRules ? <>
        <Header2>For people who don't know how to play Euchre here are the full rules...</Header2>
        <RulesToggle><ToggleLink onClick={toggleFullRules}>I know how to play Euchre. Just show me the different rules.</ToggleLink></RulesToggle>
        <Header3>Setup</Header3>
        <ul>
          <li>The game requires 4 players organized into 2 teams. The partners of each team are seated opposite one another.</li>
          <li>A deck of 24 cards is used, consisting of the cards from ranks 9,10,J,Q,K,A.</li>
          <li>Each team keeps their score visible for the other team to see. Both teams start with 10 points. Typically a pair of 5s is used to represent the points where one card is used to obscure the pips on the other card. The visible pips represent the score.</li>
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
      <TableCell><Card>&#x1F0AB;</Card></TableCell>
    </tr>
    <tr>
    <TableCell>2</TableCell>
    <TableCell>Jack of the suit with the same color as trump ( the "left bower" )</TableCell>
      <TableCell><Card>&#x1F0DB;</Card></TableCell>
    </tr>
    <tr>
    <TableCell>3</TableCell>
    <TableCell>The remaining trump cards - A,K,Q,10,9</TableCell>
      <TableCell><Card>&#x1F0A1;&#x1F0AE;&#x1F0AD;&#x1F0AA;&#x1F0A9;</Card></TableCell>
    </tr>
    <tr>
    <TableCell>4</TableCell>
    <TableCell>The cards from the non-trump suits are ranked A,K,Q,J,10,9</TableCell>
      <TableCell>
        <RedCard>&#x1F0B1;</RedCard><RedCard>&#x1F0C1;</RedCard><Card>&#x1F0D1;</Card><br/>
        <RedCard>&#x1F0BE;</RedCard><RedCard>&#x1F0CE;</RedCard><Card>&#x1F0DE;</Card><br/>
        <RedCard>&#x1F0BD;</RedCard><RedCard>&#x1F0CD;</RedCard><Card>&#x1F0DD;</Card><br/>
        <RedCard>&#x1F0BB;</RedCard><RedCard>&#x1F0CB;</RedCard><Card>&#x1F0DA;</Card><br/>
        <RedCard>&#x1F0BA;</RedCard><RedCard>&#x1F0CA;</RedCard><Card>&#x1F0D9;</Card><br/>
        <RedCard>&#x1F0B9;</RedCard><RedCard>&#x1F0C9;</RedCard><br/>
      </TableCell>
    </tr>
</Table>
          <Scoring />
          <Header3>Draw</Header3>
          <p>A draw is used to determine the first dealer. Any player shuffles the deck and begins dealing out cards, face up, to each player clockwise starting with the player to their left. The first player to receive a red 9 will be the first dealer.</p>
          <Header3>Deal</Header3>
          <ul>
          <li>The current dealer shuffles the deck and deals 5 cards to each player clockwise starting with the player to their left.</li>
          <li>After dealing the dealer will have 4 remaining cards referred to as the "kitty". The first card is turned up for all the other players to see and placed on top of the kitty.</li>
          <li>Starting with the player to the dealer's left and proceeding clockwise, each player has the opportunity to call which suit will be "trump". Trump is a suit where any card of that suit outranks cards of any other suit. Each player has the opportunity to make any suit EXCEPT the suit of the card turned up by the dealer trump. They either call a suit, or pass to the next player to their left.</li>
          <li>If the dealer passes on making trump, starting with the player to the dealer's left and proceeding clockwise, each player has the opportunity to "order the dealer up". "Ordering Up" means the dealer must add that card to their hand and discard any card of their choosing. The suit of the card they picked up is now trump.</li>
          <li>If the dealer passes again, the hand is redealt by the person to the left of the dealer.</li>
        </ul>
        <Header3>Still under construction...More to come</Header3>
      </>
      : <>
      <Header2>For people who know the rules of Euchre...</Header2>
      <RulesToggle><ToggleLink onClick={toggleFullRules}>I don't know how to play Euchre. Show me the full rules.</ToggleLink></RulesToggle>
      <Header3>The goal is to lose tricks, not win them like in Euchre.</Header3>
      <Table>
        <tr>
        <TableHeaderCell>Euchre</TableHeaderCell>
        <TableHeaderCell>Jeuchre</TableHeaderCell>
        </tr>
        <tr>
          <TableCell>First black jack deals</TableCell>
          <TableCell>First red nine deals</TableCell>
        </tr>
        <tr>
          <TableCell>Dealer turns up an initial trump candidate</TableCell>
          <TableCell>Dealer turns up an initial non-trump candidate. In the first round of bidding you cannot make the suit of what was turned up.</TableCell>
        </tr>
        <tr>
          <TableCell>You need a natural trump to make trump</TableCell>
          <TableCell>You still need a natural trump to make trump. Ok well not everything is opposites.</TableCell>
        </tr>
        <tr>
          <TableCell>If the card the dealer turned up is passed on, it is turned down and trump can be made as long is it is not the same suit as the card that was turned down</TableCell>
          <TableCell>If the card the dealer turned up is passed on, it is turned down and trump can only be made the suit of the card turned down.</TableCell>
        </tr>
        <tr>
          <TableCell>The first team to 10 points wins.</TableCell>
          <TableCell>Both teams start with 10 points. The first team to lose all their points loses.</TableCell>
        </tr>
        <tr>
          <TableCell>Anybody who makes trump can decide to go alone without their partner.</TableCell>
          <TableCell>This doesn't exist in Jeuchre because going alone makes it easier to lose tricks, not harder.</TableCell>
        </tr>
        <tr>
          <TableCell>All other Euchre rules...</TableCell>
          <TableCell>All other Euchre rules...</TableCell>
        </tr>
      </Table>
      <Scoring/>
      </>
}
    </Layout>
  )
}

export default App
