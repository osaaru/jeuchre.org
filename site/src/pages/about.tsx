import { RouteComponentProps } from "@reach/router"
import { motion } from "framer-motion"
import React from "react"
import styled from "styled-components"

import { Layout } from "../components/layout"
import { Link } from "../components/link"
import { SEO } from "../components/seo"

/***************************************************************
  Below are some examples of using styled-components with the
  theme and framer-motion.
/***************************************************************

/*
  1. A basic styled component using the theme.
*/
const StyledComponent1 = styled.p`
  color: ${(props) => props.theme.colors.text};
  font-size: 1.2rem;
`

/*
  2. A styled component that changes color based on the screen size
  using the theme.
*/
const StyledComponent2 = styled.p`
  color: ${({ theme }) => (theme.screens.sm ? theme.colors.marigold : theme.colors.text)};
  font-size: 1.2rem;
`

/*
  3. A styled component that extends a framer-motion component.
  (animation props applied in the component instance)
*/

const OrangeBlock = styled(motion.div)`
  background: ${(props) => props.theme.colors.cambridgeBlue};
  height: 100px;
  width: 100px;
  border-radius: 10px;
  margin: 10px;
`

/*
  4. A styled component that extends a framer-motion component.
  (animation props applied in the styled-component definition
  via the attrs method)
*/
const BlueBlock = styled(motion.div).attrs(() => ({
  initial: { opacity: 0, scale: 0 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 2 },
  whileHover: { scale: 0.8 },
}))`
  background: ${(props) => props.theme.colors.blue};
  height: 100px;
  width: 100px;
  border-radius: 10px;
  margin: 10px;
`

const BlocksWrapper = styled.section`
  display: flex;
  align-items: center;
  margin-top: 20px;
`

const AboutPage: React.FC<RouteComponentProps> = ({ location = {} }) => {
  const path = location.pathname
  return (
    <Layout>
      {/* <SEO
        description="Examples using the gatsby-starter-template-deluxe."
        title="About gatsby-starter-template-deluxe"
      />
      <h3>
        Hi, you are on the <code>{path}</code> page!
      </h3>

      <StyledComponent1>I am a basic styled component.</StyledComponent1>
      <StyledComponent2>My font color should change on a small device.</StyledComponent2>

      <BlocksWrapper>
        <OrangeBlock animate={{ rotate: 360 }} transition={{ duration: 2 }} whileHover={{ rotate: 1.1 }} />
        <BlueBlock />
      </BlocksWrapper> */}
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
        For Euchre players you might find Jeuchre a novelty at first. One that challenges the subconscious reflexes
        developed from playing Euchre. But you'll soon find that it's just a little more unpredictable which results in
        a more fun game. Check out the <Link to="/rules">Rules</Link> and give it a try.
      </p>
    </Layout>
  )
}

export default AboutPage
