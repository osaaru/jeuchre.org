import { graphql, useStaticQuery } from "gatsby"
import React from "react"
import styled from "styled-components"

import { useTheme } from "../../styles"
import { Navigation } from "../navigation"

const StyledHeader = styled.header`
  background-color: ${(props) => props.theme.colors.spanishGreen};
`

const HeaderContainer = styled.div`
  max-width: container;
`

const Title = styled.h1`
  font-family: "Diplomata SC", cursive;
  font-size: ${(props) => (props.theme.screens.sm ? "1.8rem" : "2.8rem")};
  color: ${({ theme }) => theme.colors.marigold};
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
        <Title>{title.toUpperCase()}</Title>
        <Navigation />
      </HeaderContainer>
    </StyledHeader>
  )
}

export { Header }
