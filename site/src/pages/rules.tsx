import React from "react"
import styled from "styled-components"

import Scoring from "../components/Scoring"
import Table from "../components/Table"
import TableCell from "../components/TableCell"
import TableHeaderCell from "../components/TableHeaderCell"
import { Layout } from "../components/layout"
import { Link } from "../components/link"

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
      <Header2>For people who know the rules of Euchre...</Header2>
      <RulesToggle><RulesLink to="/full_rules">I don't know how to play Euchre. Show me the full rules.</RulesLink></RulesToggle>
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
    </Layout>
  )
}

export default App
