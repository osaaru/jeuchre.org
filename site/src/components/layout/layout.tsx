import React from "react"
import { Helmet } from "react-helmet"
import styled, { ThemeProvider } from "styled-components"

import { GlobalStyles, theme } from "../../styles"
import { CSSDebugger } from "../css-debugger"
import { Footer } from "../footer"
import { Header } from "../header"
import { SEO } from "../seo"

const Container = styled.div`
  display: flex;
  flex: 1;
  margin: 0 auto;
  max-width: 1080px;
  padding: 1rem;
`

const Layout: React.FC = ({ children }) => {
  return (
    <ThemeProvider theme={theme()}>
      <SEO />
      <Helmet>
        <link href="https://fonts.googleapis.com/css2?family=Diplomata+SC&display=swap" rel="stylesheet" />
      </Helmet>
      <GlobalStyles />
      <Header />
      <Container>
        <CSSDebugger />
        <main>{children}</main>
      </Container>
      <Footer />
    </ThemeProvider>
  )
}

export { Layout }
