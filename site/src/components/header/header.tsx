import { graphql, useStaticQuery } from "gatsby"
import React from "react"
import styled from "styled-components"

import { useTheme } from "../../styles"
import { Link } from "../link"
import { Navigation } from "../navigation"

const StyledHeader = styled.header`
  background-color: ${(props) => props.theme.colors.green1};
`

const HeaderContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  margin: 0 auto;
  max-width: 1080px;
  padding: 1rem;
`

const Title = styled.h1`
  font-family: "Diplomata SC", cursive;
  font-size: ${(props) => (props.theme.screens.sm ? "1.8rem" : "2.8rem")};
  color: ${({ theme }) => theme.colors.accent};
  padding: 1rem;
`

const Header: React.FC = () => {
  const data = useStaticQuery(graphql`
    query SiteTitleQuery {
      site {
        siteMetadata {
          title
        }
      }
    }
  `)
  const { title } = data.site.siteMetadata

  return (
    <StyledHeader>
      <HeaderContainer>
        <Link
          css={`
            :hover {
              text-decoration: none;
            }
          `}
          to="/"
        >
          <Title>{title.toUpperCase()}</Title>
        </Link>
        <Navigation />
      </HeaderContainer>
    </StyledHeader>
  )
}

export { Header }
