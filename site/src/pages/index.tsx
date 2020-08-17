import { graphql, useStaticQuery } from "gatsby"
import React from "react"
import styled from "styled-components"

import { Layout } from "../components/layout"
import { Link } from "../components/link"

const Tagline = styled.h2`
  font-family: "Times New Roman", Times, serif;
  font-weight: 700;
  margin-bottom: 1em;
  text-align: center;
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
      <p>
        Julian's boredom with Euchre had been building for years. A result of the rote conventions of Euchre that
        everyone follows, reducing them to automatons. Too many hands spent like a dummy, a passenger, laying cards, but
        not really playing.
      </p>
      <p>
        When the Coronavirus pandemic hit in 2020, he decided to do something about it. A complete reversal of the rules
        of Euchre. The starting point being that the goal is to lose tricks rather than win tricks. What emerged was
        something unexpected, better...
      </p>
      <p>
        Julian and his sons Odin, Noah and Kobe began experimenting with different rule variations to figure out what
        worked and what didn't. Once they found something they liked, they started trialling the rules with other Euchre
        and non-Euchre players alike. The results were astonishing. It was fun! Jeuchre was born.
      </p>
      <p>
        Euchre players might find Jeuchre a novelty at first. One that challenges the subconscious reflexes developed
        from playing Euchre. But you'll soon find that it's just a little more unpredictable which results in a more fun
        game. Check out the <Link to="/rules">Rules</Link> and give it a try.
      </p>
    </Layout>
  )
}

export default App
