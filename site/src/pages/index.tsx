import { graphql, useStaticQuery } from "gatsby"
import React from "react"
import styled from "styled-components"

import { Layout } from "../components/layout"

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

const App = () => {
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
    <Layout>
      <Title>{title.toUpperCase()}</Title>
      <Tagline>{description}</Tagline>
      <br />
      <p>More to come. Stay tuned...</p>
    </Layout>
  )
}

export default App
