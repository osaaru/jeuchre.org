import { motion } from "framer-motion"
import { graphql, useStaticQuery } from "gatsby"
import Img from "gatsby-image"
import React from "react"
import styled from "styled-components"

const Wrapper = styled.div``

const GithubIcon: React.FC = () => {
  const data = useStaticQuery(graphql`
    query {
      icon: file(relativePath: { eq: "github-icon.png" }) {
        childImageSharp {
          fixed(height: 30, width: 30) {
            ...GatsbyImageSharpFixed_withWebp
          }
        }
      }
    }
  `)

  const imageData = data.icon.childImageSharp.fixed
  return (
    <Wrapper>
      <motion.a
        // eslint-disable-next-line @typescript-eslint/tslint/config
        css={`
          cursor: pointer;
        `}
        href="https://github.com/osaaru/jeuchre.org"
        rel="noopener noreferrer"
        target="_blank"
        whileHover={{ opacity: 0.5 }}
      >
        <Img alt="GitHub Icon" fixed={imageData} />
      </motion.a>
    </Wrapper>
  )
}

export { GithubIcon }
