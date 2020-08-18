import React from "react"
import styled from "styled-components"

import { Layout } from "../components/layout"

const Header2 = styled.h2`
  font-family: "Times New Roman", Times, serif;
  font-weight: 700;
  margin-bottom: 1em;
  text-align: center;
`

const Header3 = styled.h3`
  margin-bottom: 1em;
  font-weight: 500;
  text-align: center;
`

const Table = styled.header`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1em;
`

const TableHeader = styled.th`
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

const App = () => {
  return (
    <Layout>
      <Header2>For people who know the rules of Euchre...</Header2>
      <Header3>The big picture concept of Jeuchre is to lose tricks, not win them like in Euchre.</Header3>
      <Table>
        <tr>
        <TableHeader>Euchre</TableHeader>
        <TableHeader>Jeuchre</TableHeader>
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
      <Header2>Scoring</Header2>
      <Table>
        <tr>
        <TableHeader>Result of hand</TableHeader>
        <TableHeader>Points taken by trump maker</TableHeader>
        <TableHeader>Points taken by non-trump maker</TableHeader>
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
