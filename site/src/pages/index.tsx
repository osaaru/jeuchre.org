import { graphql, useStaticQuery } from "gatsby"
import React from "react"
import styled from "styled-components"

import { Layout } from "../components/layout"

const Tagline = styled.h2`
  font-weight: 400;
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
      <p>More to come. Soon. Stay tuned...</p>
    </Layout>
  )
}

export default App
