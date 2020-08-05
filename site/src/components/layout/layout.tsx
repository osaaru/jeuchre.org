import React from "react"
import { Helmet } from "react-helmet"
import styled, { ThemeProvider } from "styled-components"

import { GlobalStyles, theme } from "../../styles"
import { CSSDebugger } from "../css-debugger"
import { Footer } from "../footer"
import { SEO } from "../seo"

const Container = styled.div`
  margin: 0 auto;
  max-width: 1080px;
  padding: 2rem;
`

const Layout: React.FC = ({ children }) => {
  return (
    <ThemeProvider theme={theme()}>
      <Helmet>
        <link href="https://fonts.googleapis.com/css2?family=Diplomata+SC&display=swap" rel="stylesheet" />
      </Helmet>
      <SEO />
      <GlobalStyles />
      <Container>
        <CSSDebugger />
        <main>{children}</main>
        <Footer />
      </Container>
    </ThemeProvider>
  )
}

export { Layout }
