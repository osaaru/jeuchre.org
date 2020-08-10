import { graphql, useStaticQuery } from "gatsby"
import React from "react"
import styled from "styled-components"

import { Layout } from "../components/layout"

const Tagline = styled.h2`
  font-size: 1.1rem;
  font-weight: 400;
  color: ${(props) => props.theme.colors.text};
`

const App = () => {
  const data = useStaticQuery(graphql`
    query SiteTaglineQuery {
      site {
        siteMetadata {
          description
        }
      }
    }
  `)

  const { description } = data.site.siteMetadata

  return (
    <Layout>
      <Tagline>{description}</Tagline>
      <br />
      <p>More to come. Stay tuned...</p>
    </Layout>
  )
}

export default App
