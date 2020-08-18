import React, { useCallback, useState } from "react"
import styled from "styled-components"

import { Layout } from "../components/layout"

const Header2 = styled.h2`
  font-family: "Times New Roman", Times, serif;
  font-weight: 700;
  text-align: center;
`

const Header3 = styled.h3`
  margin-bottom: 1em;
  font-weight: 500;
  text-align: center;
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

const App = () => {
  const [fullRules,setFullRules] = useState(false)
  const toggleFullRules = useCallback(() => {
    setFullRules(!fullRules)
  }, [fullRules, setFullRules])
  return (
    <Layout>
      {fullRules ? <>
        <Header2>For people who don't know how to play Euchre and want the full rules...</Header2>
        <RulesToggle><ToggleLink onClick={toggleFullRules}>I know how to play Euchre and want to see the simple differences</ToggleLink></RulesToggle>
        <ul>
          <li>The game requires 4 players organized into 2 teams. The partners of each team are seated opposite one another.</li>
          <li>The game is played with a deck of 24 cards consisting of the cards from ranks 9,10,J,Q,K,A.</li>
          <li>The game is typically scored by each team using a pair of 5s to represent the maximum of 10 points that each team holds. Each team begins by turning both 5s up to indicate that they have 10 points to start.</li>
          <li>To start the game, the first dealer is determined by any player who shuffles the deck and begins dealing out cards, face up, to each player clockwise starting with the player to their left. The first player to receive a red 9 will be the first dealer.</li>
          <li>The current dealer shuffles the deck and deals 5 cards to each player clockwise starting with the player to their left.</li>
          <li>After dealing the dealer will have 4 remaining cards referred to as the "kitty". The first card is turned up for all the other players to see and placed on top of the kitty.</li>
          <li>Starting with the player to the dealer's left and proceeding clockwise, each player has the opportunity to call which suit will be "trump". Trump is a suit where any card of that suit outranks cards of any other suit. Each player has the opportunity to make any suit EXCEPT the suit of the card turned up by the dealer trump. They either call a suit, or pass to the next player to their left.</li>
          <li>If the dealer passes on making trump, starting with the player to the dealer's left and proceeding clockwise, each player has the opportunity to "order the dealer up". "Ordering Up" means the dealer must add that card to their hand and discard any card of their choosing. The suit of the card they picked up is now trump.</li>
          <li>If the dealer passes again, the hand is redealt by the person to the left of the dealer.</li>
          <li>The rest is still under construction...</li>
        </ul>
      </>
      : <>
      <Header2>For people who know the rules of Euchre...</Header2>
      <RulesToggle><ToggleLink onClick={toggleFullRules}>I don't know how to play Euchre. Show me the full rules.</ToggleLink></RulesToggle>
      <Header3>The big picture concept of Jeuchre is to lose tricks, not win them like in Euchre.</Header3>
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
      </>
}
      <Header2>Scoring</Header2>
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
    </Layout>
  )
}

export default App
