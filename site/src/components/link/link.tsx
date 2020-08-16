import { Link as GatsbyLink } from "gatsby"
import styled from "styled-components"

const Link = styled(GatsbyLink)`
  text-decoration: none;
  :hover {
    text-decoration: underline;
  }
`

export { Link }
