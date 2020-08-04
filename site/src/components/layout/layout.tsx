import { graphql, useStaticQuery } from "gatsby"
import React from "react"
import { Helmet } from "react-helmet"
import styled, { ThemeProvider } from "styled-components"
import { GlobalStyles, theme } from "../../styles"

// Components
import { CSSDebugger } from "../css-debugger"
import { Footer } from "../footer"
import { Link } from "../link"

const Container = styled.div`
  margin: 0 auto;
  max-width: 1080px;
  padding: 2rem;
`

const Title = styled.h1`
  font-family: "Diplomata SC", cursive;
  font-size: ${(props) => (props.theme.screens.sm ? "1.8rem" : "2.8rem")};
  margin: 20px 0px;
  color: ${({ theme }) => theme.colors.marigold};
`

const Tagline = styled.h2`
  font-size: 1.1rem;
  font-weight: 400;
  color: ${(props) => props.theme.colors.text};
`

const Layout: React.FC = ({ children }) => {
  const data = useStaticQuery(graphql`
    query SiteTitleQuery {
      site {
        siteMetadata {
          title
          description
        }
      }
    }
  `)

  const { description, title } = data.site.siteMetadata

  return (
    <ThemeProvider theme={theme()}>
      <Container>
        <Helmet>
          <Link href="https://fonts.googleapis.com/css2?family=Diplomata+SC&display=swap" rel="stylesheet" />
        </Helmet>
        <GlobalStyles />
        <CSSDebugger />
        <Title>{title.toUpperCase()}</Title>
        <Tagline>{description}</Tagline>
        <br />
        <p>More to come soon...wtf?</p>
        <main>{children}</main>
        <Footer />
      </Container>
    </ThemeProvider>
  )
}

export { Layout }
