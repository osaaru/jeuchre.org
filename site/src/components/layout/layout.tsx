import React from "react"
import styled, { ThemeProvider } from "styled-components"
import "typeface-diplomata-sc"

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
