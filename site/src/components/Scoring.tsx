import React from "react"
import styled from "styled-components"

import Table from "./Table"
import TableCell from "./TableCell"
import TableHeaderCell from "./TableHeaderCell"

const Header3 = styled.h3`
  text-transform: uppercase;
`

const Scoring: React.FC = () => {
  return (
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
}

export default Scoring
